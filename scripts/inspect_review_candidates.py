from __future__ import annotations

import argparse
import json
import sys
from collections import Counter
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[1]
BACKEND_ROOT = PROJECT_ROOT / "backend"
sys.path.insert(0, str(BACKEND_ROOT))

from app.services.aba_store import load_aba_rows_from_latest_snapshot  # noqa: E402
from app.services.manual_actions import REVIEW_WINDOWS, manual_action_object_id_for_values  # noqa: E402
from app.services.product_scope import build_product_scope_summary  # noqa: E402
from app.services.promotion_strategy_profiles import load_promotion_strategy_profiles  # noqa: E402
from app.services.signal_detection import detect_data_quality_signals, detect_signals  # noqa: E402
from app.services.signal_triage import (  # noqa: E402
    _candidate_layers as backend_candidate_layers,
    _candidate_evidence_drilldown as backend_candidate_evidence_drilldown,
    _filter_signals_by_product_scope,
    _manual_triage_exclusion_reason as backend_manual_triage_exclusion_reason,
    _normalized_product_scope_id,
    _product_scope_drilldown as backend_product_scope_drilldown,
    _recommended_evidence_drilldown as backend_recommended_evidence_drilldown,
    _recommendation_reason as backend_recommendation_reason,
    _recommendation_score as backend_recommendation_score,
)
from app.services.snapshot_readiness import load_snapshot_readiness  # noqa: E402
from app.services.snapshot_store import load_signal_rows_from_latest_snapshot, load_snapshot_status  # noqa: E402


REVIEWABLE_OBJECT_TYPES = {"search_term", "advertised_product", "sales_product", "placement", "ad_group"}


def build_review_candidates_payload(*, selected_market_id: int | None = None, product_scope_id: str | None = None) -> dict[str, Any]:
    signal_rows = load_signal_rows_from_latest_snapshot()
    signals = build_current_signals(signal_rows, selected_market_id=selected_market_id)
    product_scope = build_product_scope_summary()
    normalized_scope_id = _normalized_product_scope_id(product_scope_id)
    scoped_signals = _filter_signals_by_product_scope(signals, normalized_scope_id, product_scope)
    snapshot_status = load_snapshot_status().model_dump(mode="json")

    candidates: list[dict[str, Any]] = []
    excluded_reasons: Counter[str] = Counter()
    for signal in scoped_signals:
        reason = exclusion_reason(signal, selected_market_id=selected_market_id)
        if reason:
            excluded_reasons[reason] += 1
            continue
        candidates.append(candidate_payload(signal))

    candidate_layers = backend_candidate_layers(candidates, product_scope)
    recommendation = build_candidate_recommendation(candidates, product_scope, candidate_layers)
    return {
        "status": "has_candidates" if candidates else "empty",
        "selected_market_id": selected_market_id,
        "selected_product_scope_id": normalized_scope_id,
        "signal_row_count": len(signal_rows),
        "signal_count": len(scoped_signals),
        "candidate_count": len(candidates),
        "excluded_count": sum(excluded_reasons.values()),
        "excluded_summary": dict(sorted(excluded_reasons.items())),
        "snapshot": {
            "has_snapshot": snapshot_status.get("has_snapshot"),
            "snapshot_id": snapshot_status.get("snapshot_id"),
            "status": snapshot_status.get("status"),
            "start_date": snapshot_status.get("start_date"),
            "end_date": snapshot_status.get("end_date"),
        },
        "candidates": candidates,
        "candidate_layers": candidate_layers,
        "recommended_candidate": recommendation["candidate"],
        "recommended_evidence_drilldown": backend_recommended_evidence_drilldown(recommendation["candidate"], candidates, signal_rows),
        "product_scope_drilldown": backend_product_scope_drilldown(normalized_scope_id, product_scope, signal_rows),
        "recommendation_reason": recommendation["reason"],
        "manual_action_preview": manual_action_preview(recommendation["candidate"]),
        "next_action": next_action(
            has_snapshot=bool(snapshot_status.get("has_snapshot")),
            signal_row_count=len(signal_rows),
            candidate_count=len(candidates),
        ),
    }


def build_candidate_recommendation(
    candidates: list[dict[str, Any]],
    product_scope: Any | None = None,
    candidate_layers: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    if not candidates:
        return {"candidate": None, "reason": "当前没有可推荐的广告对象级人工处理候选。"}

    product_scope = product_scope or build_product_scope_summary()
    ranked = sorted(
        candidates,
        key=lambda candidate: backend_recommendation_score(candidate, product_scope),
        reverse=True,
    )
    candidate = ranked[0]
    return {
        "candidate": candidate,
        "reason": backend_recommendation_reason(candidate, product_scope, candidate_layers),
    }


def manual_action_preview(candidate: dict[str, Any] | None) -> dict[str, Any] | None:
    if not candidate:
        return None
    object_id = manual_action_object_id_for_values(
        object_type=str(candidate.get("object_type") or ""),
        object_id=str(candidate.get("object_id") or ""),
        asin=str(candidate.get("asin") or "") or None,
        msku=str(candidate.get("msku") or "") or None,
        sku=str(candidate.get("sku") or "") or None,
        label=str(candidate.get("object_label") or "") or None,
        search_term=str(candidate.get("search_term") or "") or None,
        market_id=candidate.get("market_id"),
    )
    return {
        "will_write": False,
        "signal_id": candidate.get("signal_id"),
        "action_type": "add_to_review",
        "object_type": candidate.get("object_type"),
        "object_id": object_id,
        "object_label": candidate.get("object_label"),
        "shop_id": candidate.get("shop_id"),
        "shop_name": candidate.get("shop_name"),
        "market_id": candidate.get("market_id"),
        "review_windows": [window for window, _days in REVIEW_WINDOWS],
        "note": "只读预检，不写 manual_actions.jsonl；必须由人工按钮触发后才会生成真实留痕。",
    }


def recommendation_score(candidate: dict[str, Any], product_scope: Any) -> tuple[int, int, int, int]:
    object_type = str(candidate.get("object_type") or "")
    product_context = product_context_for_candidate(candidate, product_scope)
    object_score = {
        "advertised_product": 80,
        "sales_product": 70,
        "search_term": 50,
        "placement": 40,
        "ad_group": 30,
    }.get(object_type, 0)
    if product_context.get("parent_asin"):
        object_score += 30
    strategy_score = 0 if product_context.get("strategy_notes") else 10
    priority_score = {"P0": 3, "P1": 2, "P2": 1}.get(str(candidate.get("priority") or ""), 0)
    return (object_score, strategy_score, int(candidate.get("severity") or 0), priority_score)


def recommendation_reason(candidate: dict[str, Any], product_scope: Any) -> str:
    product_context = product_context_for_candidate(candidate, product_scope)
    object_label = str(candidate.get("object_label") or candidate.get("object_id") or "候选对象")
    parent_asin = product_context.get("parent_asin")
    strategy_notes = product_context.get("strategy_notes") or []
    if parent_asin:
        strategy_text = "无主推款策略备注" if not strategy_notes else "存在主推款策略备注，需人工复核策略边界"
        return f"推荐 {object_label}：属于 Parent ASIN {parent_asin}，{strategy_text}，更贴近 Parent ASIN / ASIN 经营商品入口。"
    if candidate.get("object_type") == "advertised_product":
        return f"推荐 {object_label}：这是广告 ASIN 候选，比广告位或全局对象更接近经营商品入口。"
    return f"推荐 {object_label}：当前没有可匹配 Parent ASIN 的广告 ASIN 候选，先按优先级和严重度选择该对象。"


def product_context_for_candidate(candidate: dict[str, Any], product_scope: Any) -> dict[str, Any]:
    object_label = str(candidate.get("object_label") or "")
    if not object_label:
        return {}
    options = list(_get(product_scope, "options") or [])
    ad_option = next(
        (
            option
            for option in options
            if str(_get(option, "scope_type") or "") in {"advertised_asin", "sales_asin"}
            and str(_get(option, "asin") or "") == object_label
        ),
        None,
    )
    parent_asin = _value(_get(ad_option, "parent_asin")) if ad_option else None
    strategy_notes = list(_get(ad_option, "strategy_notes") or []) if ad_option else []
    if not parent_asin:
        parent_option = next(
            (
                option
                for option in options
                if str(_get(option, "scope_type") or "") == "parent_asin"
                and object_label in list(_get(option, "child_asins") or [])
            ),
            None,
        )
        parent_asin = _value(_get(parent_option, "parent_asin")) if parent_option else None
    return {
        "parent_asin": parent_asin,
        "strategy_notes": strategy_notes,
    }


def build_current_signals(signal_rows: list[dict[str, Any]], *, selected_market_id: int | None = None) -> list[Any]:
    aba_rows = load_aba_rows_from_latest_snapshot()
    snapshot_status = load_snapshot_status()
    snapshot_readiness = load_snapshot_readiness(selected_market_id=selected_market_id)
    promotion_strategies = load_promotion_strategy_profiles()

    signals = detect_signals(signal_rows, aba_rows=aba_rows, promotion_strategies=promotion_strategies)
    signals.extend(
        detect_data_quality_signals(
            snapshot_status,
            snapshot_readiness,
            signal_row_count=len(signal_rows),
        )
    )
    return sorted(signals, key=lambda item: int(_value(_get(item, "severity")) or 0), reverse=True)


def exclusion_reason(signal: Any, *, selected_market_id: int | None = None) -> str | None:
    signal_market_id = _integer(_value(_get(signal, "market_id")))
    object_type = _string(_get(signal, "object_type"))
    signal_category = _string(_get(signal, "signal_category"))

    if selected_market_id is not None and signal_market_id != selected_market_id:
        return "market_mismatch"
    if object_type == "cross":
        return "cross_object"
    if signal_category == "data_quality":
        return "data_quality"
    if object_type not in REVIEWABLE_OBJECT_TYPES:
        return "unsupported_object"
    if not requires_manual_confirmation(signal):
        return "no_manual_confirmation"
    return backend_manual_triage_exclusion_reason(signal)


def candidate_payload(signal: Any) -> dict[str, Any]:
    suggested_action = _get(signal, "suggested_action") or {}
    primary_object = _get(_get(signal, "evidence") or {}, "primary_object") or {}

    return {
        "signal_id": _string(_get(signal, "id")),
        "signal_type": _string(_get(signal, "signal_type")),
        "signal_category": _string(_get(signal, "signal_category")),
        "priority": _string(_get(signal, "priority")),
        "confidence": _string(_get(signal, "confidence")),
        "severity": _integer(_value(_get(signal, "severity"))) or 0,
        "shop_id": _string(_get(signal, "shop_id")),
        "shop_name": _value(_get(signal, "shop_name")),
        "market_id": _integer(_value(_get(signal, "market_id"))),
        "marketplace": _value(_get(signal, "marketplace")),
        "object_type": _string(_get(signal, "object_type")),
        "object_id": _string(_get(primary_object, "object_id")),
        "object_label": _string(_get(primary_object, "label")),
        "asin": _string(_get(primary_object, "asin")),
        "msku": _string(_get(primary_object, "msku")),
        "sku": _string(_get(primary_object, "sku")),
        "summary": _value(_get(signal, "summary")),
        "evidence_count": _integer(_value(_get(signal, "evidence_count"))) or 0,
        "freshness_status": _string(_get(signal, "freshness_status")),
        "evidence_drilldown": backend_candidate_evidence_drilldown(signal),
        "suggested_action": {
            "action_type": _string(_get(suggested_action, "action_type")),
            "title": _value(_get(suggested_action, "title")),
            "description": _value(_get(suggested_action, "description")),
            "requires_manual_confirmation": requires_manual_confirmation(signal),
        },
        "data_sources": [_source_payload(source) for source in (_get(signal, "data_sources") or [])][:5],
    }


def requires_manual_confirmation(signal: Any) -> bool:
    suggested_action = _get(signal, "suggested_action") or {}
    value = _get(suggested_action, "requires_manual_confirmation")
    return True if value is None else bool(value)


def next_action(*, has_snapshot: bool, signal_row_count: int, candidate_count: int) -> str:
    if not has_snapshot or signal_row_count == 0:
        return "先确认真实快照是否成功，并确保快照中有可进入信号规则的广告明细。"
    if candidate_count:
        return "从候选中选择一个广告对象，由人工确认后记录人工处理动作；不要自动执行广告动作。"
    return "当前没有广告对象级人工处理候选；先复核数据范围、信号规则和对象边界。"


def _source_payload(source: Any) -> dict[str, Any]:
    return {
        "source_type": _value(_get(source, "source_type")),
        "source_name": _value(_get(source, "source_name")),
        "source_table": _value(_get(source, "source_table")),
        "snapshot_id": _value(_get(source, "snapshot_id")),
        "market_id": _integer(_value(_get(source, "market_id"))),
    }


def _get(value: Any, key: str) -> Any:
    if isinstance(value, dict):
        return value.get(key)
    return getattr(value, key, None)


def _value(value: Any) -> Any:
    return getattr(value, "value", value)


def _string(value: Any) -> str:
    raw_value = _value(value)
    return "" if raw_value is None else str(raw_value)


def _integer(value: Any) -> int | None:
    if value is None or value == "":
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="只读检查当前 AI 信号中可进入人工处理和后续复盘的广告对象候选")
    parser.add_argument("--market-id", type=int, default=None)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    print(json.dumps(build_review_candidates_payload(selected_market_id=args.market_id), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
