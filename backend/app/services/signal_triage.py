from __future__ import annotations

from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

from app.services.aba_store import load_aba_rows_from_latest_snapshot
from app.services.manual_actions import (
    DEFAULT_MANUAL_ACTION_ROOT,
    DEFAULT_REVIEW_RECORD_ROOT,
    REVIEW_WINDOWS,
    build_review_effect_result,
    build_review_todos,
    load_manual_actions,
    load_review_records,
    manual_action_object_id_for_values,
)
from app.services.product_scope import build_product_scope_summary
from app.services.promotion_strategy_profiles import load_promotion_strategy_profiles
from app.services.signal_detection import (
    AD_PRODUCT_ANOMALY_HIGH_ACOS,
    AD_PRODUCT_ANOMALY_MAX_WEAK_ORDERS,
    AD_PRODUCT_ANOMALY_MIN_CLICKS,
    AD_PRODUCT_MAX_STABLE_ACOS,
    AD_PRODUCT_MIN_STABLE_CLICKS,
    AD_PRODUCT_MIN_STABLE_ORDERS,
    detect_data_quality_signals,
    detect_signals,
)
from app.services.snapshot_readiness import load_snapshot_readiness
from app.services.snapshot_store import (
    load_signal_rows_from_latest_snapshot,
    load_signal_rows_from_success_snapshots,
    load_snapshot_status,
)


REVIEWABLE_OBJECT_TYPES = {"search_term", "advertised_product", "sales_product", "placement", "ad_group"}
METRIC_REVIEW_OBJECT_TYPES = {"search_term", "advertised_product", "sales_product", "placement"}
PRIORITY_SCORE = {"P0": 3, "P1": 2, "P2": 1}
REVIEW_WAIT_FORBIDDEN_ACTIONS = ["不拉取快照", "不保存复盘结论", "不自动改规则", "不自动执行广告动作"]
ACTIONABLE_PRODUCT_SCOPE_PREFIXES = ("parent_asin:", "ad_asin:")
MANUAL_TRIAGE_MIN_EVIDENCE_COUNT = 3
MANUAL_TRIAGE_BLOCKED_SIGNAL_CATEGORIES = {
    "advertised_product_opportunity",
}
MANUAL_TRIAGE_ALLOWED_SIGNAL_CATEGORIES = {
    "aba_market_opportunity",
    "ad_efficiency",
    "ad_efficiency_anomaly",
    "ad_group_structure",
    "advertised_product_efficiency",
    "placement_efficiency",
    "product_ad_coverage",
    "product_sales_fit",
    "search_term_opportunity",
    "search_term_performance_split",
}
MANUAL_TRIAGE_ALLOWED_ACTION_TYPES = {
    "promote_search_term",
    "review_aba_hot_search_term",
    "review_advertised_product_efficiency",
    "review_bid_or_search_term",
    "review_long_tail_search_term",
    "review_multi_product_ad_group",
    "review_placement_bid",
    "review_product_targeting_search_term",
    "review_sales_product_ad_coverage",
    "review_search_term_split",
}
PROBLEM_TYPE_BY_CATEGORY = {
    "data_quality": "数据质量缺口",
    "advertised_product_opportunity": "机会扩量",
    "search_term_opportunity": "机会扩量",
    "aba_market_opportunity": "市场竞争压力",
    "placement_efficiency": "投放结构失衡",
    "search_term_performance_split": "投放结构失衡",
    "ad_group_structure": "投放结构失衡",
    "ad_efficiency": "花费浪费",
    "ad_efficiency_anomaly": "花费浪费",
    "advertised_product_efficiency": "花费浪费",
    "product_sales_fit": "销售承接不足",
    "product_ad_coverage": "销售承接不足",
    "review_effect": "处理后复盘",
}
CANDIDATE_LAYER_DEFINITIONS = [
    {
        "layer_id": "sales_strong_ad_weak",
        "label": "销售强广告弱",
        "reason": "销售商品表现强，但广告承接弱，先作为覆盖缺口进入人工复核。",
    },
    {
        "layer_id": "search_term_context",
        "label": "搜索词候选",
        "reason": "搜索词候选只说明同广告组或同广告活动上下文，进入人工确认前必须复核投放词、广告商品和归因边界。",
    },
    {
        "layer_id": "advertised_asin_opportunity",
        "label": "广告 ASIN 待处理",
        "reason": "广告 ASIN 已有直接投放证据，必须先通过准入闸门，再作为人工留痕和 7/14 天复盘对象。",
    },
    {
        "layer_id": "strategy_boundary",
        "label": "策略主推边界",
        "reason": "候选命中主推款或策略备注，先复核策略边界，不直接当作异常处理。",
    },
    {
        "layer_id": "ad_group_structure_boundary",
        "label": "广告组结构边界",
        "reason": "广告组是投放容器，不是商品；只能作为结构复核和归因边界对象。",
    },
]
ACTIONABILITY_FORBIDDEN_ACTIONS = ["自动调价", "自动暂停广告", "自动否词", "自动新增关键词"]
NO_ACTIONABLE_ALLOWED_PATHS = [
    "查看对象证据矩阵，确认 Parent ASIN、广告 ASIN、广告组和搜索词/广告位关系",
    "继续下钻广告 ASIN / 广告组 / 搜索词 / 广告位",
    "补数据或等待下一次快照候选",
    "记录观察需等候选准入后再由人工点击留痕",
]


def build_signal_triage_payload(
    *,
    selected_market_id: int | None = None,
    top: int = 5,
    product_scope_id: str | None = None,
    action_root: Path = DEFAULT_MANUAL_ACTION_ROOT,
    review_root: Path = DEFAULT_REVIEW_RECORD_ROOT,
) -> dict[str, Any]:
    top_limit = max(1, top)
    candidate_kwargs: dict[str, Any] = {"selected_market_id": selected_market_id}
    if product_scope_id is not None:
        candidate_kwargs["product_scope_id"] = product_scope_id
    candidates_payload = build_review_candidates_payload(**candidate_kwargs)
    readiness_kwargs: dict[str, Any] = {"selected_market_id": selected_market_id}
    if action_root != DEFAULT_MANUAL_ACTION_ROOT:
        readiness_kwargs["action_root"] = action_root
    if review_root != DEFAULT_REVIEW_RECORD_ROOT:
        readiness_kwargs["review_root"] = review_root
    readiness_payload = build_review_readiness_payload(**readiness_kwargs)
    candidates = _dict_list(candidates_payload.get("candidates"))
    candidate_count = _int(candidates_payload.get("candidate_count")) or len(candidates)
    product_scope_gate = _product_scope_gate(candidates_payload.get("selected_product_scope_id"), candidate_count)
    is_actionable_scope = bool(product_scope_gate.get("is_actionable"))
    display_candidate_count = candidate_count if is_actionable_scope else 0
    manual_preview = _dict_or_none(candidates_payload.get("manual_action_preview")) if is_actionable_scope else None
    product_scope_drilldown = _dict_or_none(candidates_payload.get("product_scope_drilldown")) if is_actionable_scope else None
    blockers = _blockers(
        candidate_count=display_candidate_count,
        top_limit=top_limit,
        manual_preview=manual_preview,
        readiness_payload=readiness_payload,
    )
    if not is_actionable_scope:
        blockers.insert(0, {"code": "product_scope_required", "message": str(product_scope_gate["message"])})
    recommended_manual_status = _recommended_manual_status(manual_preview, readiness_payload, selected_market_id)
    next_unhandled_candidate = _next_unhandled_candidate(candidates, recommended_manual_status, selected_market_id) if is_actionable_scope else None
    signal_rows_for_next_unhandled = load_signal_rows_from_latest_snapshot() if next_unhandled_candidate else []
    next_unhandled_evidence_drilldown = _candidate_summary_evidence_drilldown(
        next_unhandled_candidate,
        candidates,
        signal_rows_for_next_unhandled,
    )
    action_preview = _next_action_manual_preview(manual_preview, recommended_manual_status, next_unhandled_candidate)
    actionability_status = _actionability_status(
        product_scope_gate=product_scope_gate,
        candidate_count=display_candidate_count,
        manual_preview=action_preview,
        product_scope_drilldown=product_scope_drilldown,
    )

    return {
        "status": actionability_status["status"],
        "selected_market_id": selected_market_id,
        "selected_product_scope_id": candidates_payload.get("selected_product_scope_id"),
        "product_scope_gate": product_scope_gate,
        "actionability_status": actionability_status,
        "snapshot": _dict(candidates_payload.get("snapshot")),
        "signal_status": {
            "signal_row_count": _int(candidates_payload.get("signal_row_count")) or 0,
            "signal_count": _int(candidates_payload.get("signal_count")) or 0,
            "candidate_count": display_candidate_count,
            "excluded_count": _int(candidates_payload.get("excluded_count")) or 0,
            "excluded_summary": _dict(candidates_payload.get("excluded_summary")),
        },
        "candidate_mix": _candidate_mix(candidates if is_actionable_scope else []),
        "candidate_layers": _dict_list(candidates_payload.get("candidate_layers")) if is_actionable_scope else [],
        "recommended_candidate": _candidate_summary(_dict_or_none(candidates_payload.get("recommended_candidate"))) if is_actionable_scope else None,
        "recommended_evidence_drilldown": _dict_or_none(candidates_payload.get("recommended_evidence_drilldown")) if is_actionable_scope else None,
        "product_scope_drilldown": product_scope_drilldown,
        "recommendation_reason": candidates_payload.get("recommendation_reason") if is_actionable_scope else product_scope_gate["message"],
        "manual_action_preview": action_preview,
        "recommended_manual_status": recommended_manual_status,
        "next_unhandled_candidate": next_unhandled_candidate,
        "next_unhandled_evidence_drilldown": next_unhandled_evidence_drilldown,
        "top_candidates": [_candidate_summary(candidate) for candidate in _rank_candidates(candidates)[:top_limit]] if is_actionable_scope else [],
        "review_status": {
            "status": readiness_payload.get("status"),
            "manual_action_count": _int(readiness_payload.get("manual_action_count")) or 0,
            "review_record_count": _int(readiness_payload.get("review_record_count")) or 0,
            "ready_count": _int(readiness_payload.get("ready_count")) or 0,
            "not_ready_count": _int(readiness_payload.get("not_ready_count")) or 0,
            "manual_action_identity_issue_count": _int(readiness_payload.get("manual_action_identity_issue_count")) or 0,
            "review_feedback": _dict(readiness_payload.get("review_feedback")),
            "rule_improvement": _dict(readiness_payload.get("rule_improvement")),
            "review_wait_summary": _dict(readiness_payload.get("review_wait_summary")),
            "next_action": readiness_payload.get("next_action"),
        },
        "blockers": blockers,
        "next_action": _triage_next_action(
            candidate_count=display_candidate_count,
            manual_preview=action_preview,
            recommended_manual_status=recommended_manual_status,
            next_unhandled_candidate=next_unhandled_candidate,
            blockers=blockers,
            product_scope_gate=product_scope_gate,
        ),
    }


def build_review_candidates_payload(
    *,
    selected_market_id: int | None = None,
    product_scope_id: str | None = None,
) -> dict[str, Any]:
    signal_rows = load_signal_rows_from_latest_snapshot()
    signals = _current_signals(signal_rows, selected_market_id=selected_market_id)
    product_scope = build_product_scope_summary()
    normalized_scope_id = _normalized_product_scope_id(product_scope_id)
    scoped_signals = _filter_signals_by_product_scope(signals, normalized_scope_id, product_scope, signal_rows=signal_rows)
    snapshot_status = load_snapshot_status().model_dump(mode="json")

    candidates: list[dict[str, Any]] = []
    excluded_reasons: Counter[str] = Counter()
    for signal in scoped_signals:
        reason = _exclusion_reason(signal, selected_market_id=selected_market_id)
        if reason:
            excluded_reasons[reason] += 1
            continue
        candidates.append(_candidate_payload(signal))

    recommendation = _candidate_recommendation(candidates, product_scope)
    product_scope_drilldown = _product_scope_drilldown(normalized_scope_id, product_scope, signal_rows)
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
        "candidate_layers": _candidate_layers(candidates, product_scope),
        "recommended_candidate": recommendation["candidate"],
        "recommended_evidence_drilldown": _recommended_evidence_drilldown(recommendation["candidate"], candidates, signal_rows),
        "product_scope_drilldown": product_scope_drilldown,
        "recommendation_reason": recommendation["reason"],
        "manual_action_preview": _manual_action_preview(recommendation["candidate"]),
        "next_action": _candidate_next_action(
            has_snapshot=bool(snapshot_status.get("has_snapshot")),
            signal_row_count=len(signal_rows),
            candidate_count=len(candidates),
        ),
    }


def build_review_readiness_payload(
    *,
    selected_market_id: int | None = None,
    action_root: Path = DEFAULT_MANUAL_ACTION_ROOT,
    review_root: Path = DEFAULT_REVIEW_RECORD_ROOT,
) -> dict[str, Any]:
    manual_actions = (
        load_manual_actions(market_id=selected_market_id)
        if action_root == DEFAULT_MANUAL_ACTION_ROOT
        else load_manual_actions(market_id=selected_market_id, action_root=action_root)
    )
    review_records = (
        load_review_records(market_id=selected_market_id)
        if review_root == DEFAULT_REVIEW_RECORD_ROOT
        else load_review_records(market_id=selected_market_id, review_root=review_root)
    )
    signal_rows = load_signal_rows_from_success_snapshots()
    snapshot_status = load_snapshot_status().model_dump(mode="json")
    todos = (
        build_review_todos(market_id=selected_market_id)
        if action_root == DEFAULT_MANUAL_ACTION_ROOT
        else build_review_todos(market_id=selected_market_id, action_root=action_root)
    )
    identity_issues = _manual_action_identity_issues(manual_actions, signal_rows)
    review_feedback = _review_feedback_summary(
        review_records,
        manual_actions=manual_actions,
        signals=_current_signals(signal_rows, selected_market_id=selected_market_id) if review_records and signal_rows else [],
    )

    effects = []
    seen: set[tuple[str, int | None, str]] = set()
    for todo in todos:
        key = (todo.signal_id, todo.market_id, todo.review_window)
        if key in seen:
            continue
        seen.add(key)
        effect_kwargs = {
            "review_window": todo.review_window,
            "market_id": todo.market_id,
            "signal_rows": signal_rows,
        }
        if action_root != DEFAULT_MANUAL_ACTION_ROOT:
            effect_kwargs["action_root"] = action_root
        effect = build_review_effect_result(todo.signal_id, **effect_kwargs)
        effects.append(
            {
                "signal_id": effect.signal_id,
                "action_id": getattr(effect, "action_id", None),
                "action_type": getattr(effect, "action_type", None),
                "shop_id": getattr(effect, "shop_id", None),
                "market_id": effect.market_id,
                "review_window": effect.review_window,
                "status": effect.status,
                "result": effect.result,
                "message": effect.message,
                "is_due": todo.is_due,
                "acted_at": effect.acted_at,
                "due_at": effect.due_at,
                "object_type": effect.object_type,
                "object_id": effect.object_id,
                "object_label": getattr(effect, "object_label", None),
                "before_start_date": effect.before_start_date,
                "before_end_date": effect.before_end_date,
                "after_start_date": effect.after_start_date,
                "after_end_date": effect.after_end_date,
            }
        )

    ready_count = sum(1 for effect in effects if effect["status"] == "ready")
    not_ready_count = len(effects) - ready_count
    rule_improvement = _rule_improvement_readiness(manual_actions, effects, ready_count, identity_issues, review_feedback)
    review_wait_summary = _review_wait_summary(effects, ready_count)
    return {
        "status": "ready" if ready_count else "not_ready",
        "selected_market_id": selected_market_id,
        "manual_action_count": len(manual_actions),
        "review_record_count": len(review_records),
        "signal_row_count": len(signal_rows),
        "snapshot": {
            "has_snapshot": snapshot_status.get("has_snapshot"),
            "snapshot_id": snapshot_status.get("snapshot_id"),
            "status": snapshot_status.get("status"),
            "start_date": snapshot_status.get("start_date"),
            "end_date": snapshot_status.get("end_date"),
        },
        "ready_count": ready_count,
        "not_ready_count": not_ready_count,
        "manual_action_identity_issue_count": len(identity_issues),
        "manual_action_identity_issues": identity_issues,
        "review_feedback": review_feedback,
        "rule_improvement": rule_improvement,
        "review_wait_summary": review_wait_summary,
        "effects": effects,
        "next_action": _review_next_action(manual_actions, effects, ready_count, identity_issues, review_feedback),
    }


def _current_signals(signal_rows: list[dict[str, Any]], *, selected_market_id: int | None = None) -> list[Any]:
    signals = detect_signals(
        signal_rows,
        aba_rows=load_aba_rows_from_latest_snapshot(),
        promotion_strategies=load_promotion_strategy_profiles(),
    )
    signals.extend(
        detect_data_quality_signals(
            load_snapshot_status(),
            load_snapshot_readiness(selected_market_id=selected_market_id),
            signal_row_count=len(signal_rows),
        )
    )
    return sorted(signals, key=lambda item: int(_value(_get(item, "severity")) or 0), reverse=True)


def _exclusion_reason(signal: Any, *, selected_market_id: int | None = None) -> str | None:
    signal_market_id = _int(_value(_get(signal, "market_id")))
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
    if not _requires_manual_confirmation(signal):
        return "no_manual_confirmation"
    return _manual_triage_exclusion_reason(signal)


def _manual_triage_exclusion_reason(signal: Any) -> str | None:
    signal_category = _string(_get(signal, "signal_category"))
    signal_type = _string(_get(signal, "signal_type"))
    suggested_action = _get(signal, "suggested_action") or {}
    action_type = _string(_get(suggested_action, "action_type"))
    evidence_count = _int(_value(_get(signal, "evidence_count"))) or 0

    if signal_category in MANUAL_TRIAGE_BLOCKED_SIGNAL_CATEGORIES:
        return "not_actionable_signal"
    if signal_category not in MANUAL_TRIAGE_ALLOWED_SIGNAL_CATEGORIES:
        return "unsupported_signal_category"
    if PROBLEM_TYPE_BY_CATEGORY.get(signal_category) or PROBLEM_TYPE_BY_CATEGORY.get(signal_type):
        problem_type = PROBLEM_TYPE_BY_CATEGORY.get(signal_category) or PROBLEM_TYPE_BY_CATEGORY.get(signal_type)
    else:
        problem_type = "未分类问题"
    if problem_type == "未分类问题":
        return "missing_problem_type"
    if action_type not in MANUAL_TRIAGE_ALLOWED_ACTION_TYPES:
        return "unsupported_manual_action"
    if evidence_count < MANUAL_TRIAGE_MIN_EVIDENCE_COUNT:
        return "insufficient_evidence"
    if not _has_traceable_data_source(signal):
        return "missing_data_source"
    return None


def _has_traceable_data_source(signal: Any) -> bool:
    for source in _get(signal, "data_sources") or []:
        source_type = _string(_get(source, "source_type")).strip()
        source_name = _string(_get(source, "source_name")).strip()
        source_table = _string(_get(source, "source_table")).strip()
        if source_type and source_type not in {"unknown", "未知来源"}:
            return True
        if source_name or source_table:
            return True
    return False


def _candidate_payload(signal: Any) -> dict[str, Any]:
    suggested_action = _get(signal, "suggested_action") or {}
    primary_object = _get(_get(signal, "evidence") or {}, "primary_object") or {}
    evidence_drilldown = _ensure_actionability_evidence_blocks(_candidate_evidence_drilldown(signal), signal)
    payload = {
        "signal_id": _string(_get(signal, "id")),
        "signal_type": _string(_get(signal, "signal_type")),
        "signal_category": _string(_get(signal, "signal_category")),
        "priority": _string(_get(signal, "priority")),
        "confidence": _string(_get(signal, "confidence")),
        "severity": _int(_value(_get(signal, "severity"))) or 0,
        "shop_id": _string(_get(signal, "shop_id")),
        "shop_name": _value(_get(signal, "shop_name")),
        "market_id": _int(_value(_get(signal, "market_id"))),
        "marketplace": _value(_get(signal, "marketplace")),
        "object_type": _string(_get(signal, "object_type")),
        "object_id": _string(_get(primary_object, "object_id")),
        "object_label": _string(_get(primary_object, "label")),
        "asin": _string(_get(primary_object, "asin")),
        "msku": _string(_get(primary_object, "msku")),
        "sku": _string(_get(primary_object, "sku")),
        "summary": _value(_get(signal, "summary")),
        "uncertainty": _value(_get(signal, "uncertainty")),
        "evidence_count": _int(_value(_get(signal, "evidence_count"))) or 0,
        "freshness_status": _string(_get(signal, "freshness_status")),
        "evidence_drilldown": evidence_drilldown,
        "suggested_action": {
            "action_type": _string(_get(suggested_action, "action_type")),
            "title": _value(_get(suggested_action, "title")),
            "description": _value(_get(suggested_action, "description")),
            "requires_manual_confirmation": _requires_manual_confirmation(signal),
        },
        "data_sources": [_source_payload(source) for source in (_get(signal, "data_sources") or [])][:5],
    }
    payload.update(_candidate_analysis_fields(payload))
    return payload


def _candidate_recommendation(candidates: list[dict[str, Any]], product_scope: Any | None = None) -> dict[str, Any]:
    if not candidates:
        return {"candidate": None, "reason": "当前没有可推荐的广告对象级人工处理候选。"}
    product_scope = product_scope or build_product_scope_summary()
    layers = _candidate_layers(candidates, product_scope)
    candidate = sorted(candidates, key=lambda item: _recommendation_score(item, product_scope), reverse=True)[0]
    return {"candidate": candidate, "reason": _recommendation_reason(candidate, product_scope, layers)}


def _recommended_evidence_drilldown(
    candidate: dict[str, Any] | None,
    candidates: list[dict[str, Any]] | None = None,
    signal_rows: list[dict[str, Any]] | None = None,
) -> dict[str, Any] | None:
    if not candidate:
        return None
    stable_object_id = _stable_object_id(candidate)
    if _string(candidate.get("object_type")) == "search_term":
        drilldown = candidate.get("evidence_drilldown")
        return drilldown if isinstance(drilldown, dict) else None
    if not stable_object_id or not candidates:
        drilldown = candidate.get("evidence_drilldown")
        return drilldown if isinstance(drilldown, dict) else None

    same_object_candidates = [
        item
        for item in candidates
        if _stable_object_id(item) == stable_object_id
    ]
    return _merge_recommended_evidence_drilldown(candidate, same_object_candidates, signal_rows or [])


def _candidate_summary_evidence_drilldown(
    candidate_summary: dict[str, Any] | None,
    candidates: list[dict[str, Any]] | None,
    signal_rows: list[dict[str, Any]] | None = None,
) -> dict[str, Any] | None:
    if not candidate_summary or not candidates:
        return None
    signal_id = _string(candidate_summary.get("signal_id"))
    stable_object_id = _string(candidate_summary.get("stable_object_id")) or _stable_object_id(candidate_summary)
    matched_candidates: list[dict[str, Any]] = []
    for candidate in candidates:
        if signal_id:
            if _string(candidate.get("signal_id")) != signal_id:
                continue
        elif stable_object_id and _stable_object_id(candidate) != stable_object_id:
            continue
        matched_candidates.append(candidate)
    if not matched_candidates:
        return None
    first_candidate = matched_candidates[0]
    drilldown = first_candidate.get("evidence_drilldown")
    if not isinstance(drilldown, dict):
        return None
    if _string(first_candidate.get("object_type")) == "sales_product":
        return _sales_product_sibling_enriched_drilldown(candidate_summary, drilldown, signal_rows or [])
    if _string(first_candidate.get("object_type")) == "search_term":
        return drilldown
    return _merge_recommended_evidence_drilldown(first_candidate, matched_candidates, signal_rows or [])


def _merge_recommended_evidence_drilldown(
    candidate: dict[str, Any],
    candidates: list[dict[str, Any]],
    signal_rows: list[dict[str, Any]] | None = None,
) -> dict[str, Any] | None:
    drilldowns = [item.get("evidence_drilldown") for item in candidates if isinstance(item.get("evidence_drilldown"), dict)]
    if not drilldowns:
        return None

    boundary = (
        next((_string(drilldown.get("boundary")) for drilldown in drilldowns if _string(drilldown.get("boundary"))), "")
        or "搜索词和广告位只说明同广告组上下文，不能自动归因到该广告 ASIN。"
    )
    campaign_labels = _unique_values_from_drilldowns(drilldowns, "campaigns")
    ad_group_labels = _unique_values_from_drilldowns(drilldowns, "ad_groups")
    search_term_count = sum(_int(drilldown.get("search_term_context_count")) or 0 for drilldown in drilldowns)
    placement_count = sum(_int(drilldown.get("placement_context_count")) or 0 for drilldown in drilldowns)
    ad_product_rows = _unique_ad_product_drilldown_rows(drilldowns)
    direct_count = len(ad_product_rows)
    sales_product_drilldown = next((drilldown for drilldown in drilldowns if _dict(drilldown.get("sales_product_summary"))), None)
    if _string(candidate.get("object_type")) == "sales_product" and sales_product_drilldown and not ad_product_rows:
        return _sales_product_sibling_enriched_drilldown(candidate, sales_product_drilldown, signal_rows or [])
    metric_summary = _ad_product_metric_summary(ad_product_rows)
    top_spend_campaign = _top_spend_group(ad_product_rows, "campaign_name", metric_summary["spend"])
    top_spend_ad_group = _top_spend_group(ad_product_rows, "ad_group_name", metric_summary["spend"])
    all_asin_ad_coverage = _all_asin_ad_coverage(candidate, signal_rows or [], ad_product_rows)
    targeting_context = _ad_product_targeting_context(signal_rows or [], ad_product_rows, top_spend_ad_group)
    search_term_aba_context = _ad_product_search_term_aba_context(signal_rows or [], ad_product_rows, top_spend_ad_group)
    ad_group_diagnosis = _ad_group_diagnosis(signal_rows or [], ad_product_rows, top_spend_ad_group, boundary)
    diagnosis_judgement = _ad_product_diagnosis_judgement(
        metric_summary=metric_summary,
        ad_group_diagnosis=ad_group_diagnosis,
        targeting_context=targeting_context,
        search_term_aba_context=search_term_aba_context,
    )
    search_context_count = _int(_dict(search_term_aba_context).get("context_search_term_count"))
    priority_ad_group_search_term_count = _int(
        _dict(_dict(ad_group_diagnosis).get("top_ad_group")).get("search_term_count"),
    )
    if search_context_count is not None:
        full_search_term_count = search_context_count
    elif priority_ad_group_search_term_count is not None:
        full_search_term_count = priority_ad_group_search_term_count
    else:
        full_search_term_count = search_term_count
    metric_text = _metric_summary_text(metric_summary)
    top_campaign_text = _top_spend_text("广告活动", top_spend_campaign)
    coverage_text = _all_asin_ad_coverage_text(all_asin_ad_coverage)
    search_term_aba_text = _search_term_aba_context_text(search_term_aba_context)
    ad_group_diagnosis_text = _ad_group_diagnosis_text(ad_group_diagnosis)
    placement_context_text = _placement_context_boundary_text(placement_count, ad_group_diagnosis)
    business_evidence_blocks = _ad_product_business_evidence_blocks(
        direct_count=direct_count,
        search_term_count=full_search_term_count,
        placement_count=placement_count,
        metric_summary=metric_summary,
        all_asin_ad_coverage=all_asin_ad_coverage,
        top_spend_campaign=top_spend_campaign,
        ad_group_diagnosis=ad_group_diagnosis,
        targeting_context=targeting_context,
        search_term_aba_context=search_term_aba_context,
        diagnosis_judgement=diagnosis_judgement,
        boundary=boundary,
    )
    summary = (
        f"ASIN 级证据：合并 {len(drilldowns)} 条同 ASIN 候选，"
        f"广告商品投放行 {direct_count} 条，覆盖广告活动 {len(campaign_labels)} 个 / 广告组 {len(ad_group_labels)} 个；"
        f"同广告组搜索词上下文 {full_search_term_count} 条、{placement_context_text}；"
        f"{metric_text}{coverage_text}{top_campaign_text}{ad_group_diagnosis_text}{search_term_aba_text}{boundary}"
    )
    return {
        "object_label": _string(candidate.get("object_label")) or _string(candidate.get("asin")) or "推荐对象",
        "object_type": _string(candidate.get("object_type")),
        "direct_ad_product_row_count": direct_count,
        "search_term_context_count": full_search_term_count,
        "placement_context_count": placement_count,
        "campaigns": campaign_labels,
        "ad_groups": ad_group_labels,
        "metric_summary": metric_summary,
        "top_spend_campaign": top_spend_campaign,
        "top_spend_ad_group": top_spend_ad_group,
        "ad_group_diagnosis": ad_group_diagnosis,
        "all_asin_ad_coverage": all_asin_ad_coverage,
        "targeting_context": targeting_context,
        "search_term_aba_context": search_term_aba_context,
        "diagnosis_judgement": diagnosis_judgement,
        "business_evidence_blocks": business_evidence_blocks,
        "ad_product_rows": ad_product_rows[:6],
        "boundary": boundary,
        "summary": summary,
    }


def _unique_values_from_drilldowns(drilldowns: list[dict[str, Any]], key: str) -> list[str]:
    values: list[str] = []
    seen: set[str] = set()
    for drilldown in drilldowns:
        for value in drilldown.get(key) or []:
            label = _string(value)
            if label and label not in seen:
                seen.add(label)
                values.append(label)
    return values


def _unique_ad_product_drilldown_rows(drilldowns: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    seen: set[tuple[Any, ...]] = set()
    for drilldown in drilldowns:
        for row in drilldown.get("ad_product_rows") or []:
            if not isinstance(row, dict):
                continue
            row_key = _ad_product_row_key(row)
            if row_key in seen:
                continue
            seen.add(row_key)
            rows.append(row)
    return rows


def _ad_product_metric_summary(rows: list[dict[str, Any]], *, basis: str = "recommended_evidence_rows") -> dict[str, Any]:
    spend = round(sum(_number(row.get("spend")) or 0 for row in rows), 2)
    clicks = sum(_int(row.get("clicks")) or 0 for row in rows)
    orders = sum(_int(row.get("orders")) or 0 for row in rows)
    sales = round(sum(_number(row.get("sales")) or 0 for row in rows), 2)
    return {
        "basis": basis,
        "row_count": len(rows),
        "spend": spend,
        "clicks": clicks,
        "orders": orders,
        "sales": sales,
        "acos": round(spend / sales, 4) if sales > 0 else None,
        "cvr": round(orders / clicks, 4) if clicks > 0 else None,
    }


def _all_asin_ad_coverage(
    candidate: dict[str, Any],
    signal_rows: list[dict[str, Any]],
    recommended_rows: list[dict[str, Any]],
) -> dict[str, Any] | None:
    asin = _string(candidate.get("asin")) or _string(candidate.get("object_label")) or _stable_object_id(candidate)
    if not asin:
        return None
    raw_rows = [
        _ad_product_row_summary(row)
        for row in signal_rows
        if _string(row.get("source_table")) == "advertised_products" and _string(row.get("asin")) == asin
    ]
    raw_rows = _unique_ad_product_rows(raw_rows)
    if not raw_rows:
        return None

    recommended_keys = {_ad_product_row_key(row) for row in recommended_rows}
    covered_count = sum(1 for row in raw_rows if _ad_product_row_key(row) in recommended_keys)
    missing_rows = [_missing_ad_product_row_summary(row) for row in raw_rows if _ad_product_row_key(row) not in recommended_keys]
    raw_count = len(raw_rows)
    return {
        "basis": "raw_advertised_products",
        "raw_ad_product_row_count": raw_count,
        "recommended_ad_product_row_count": len(recommended_rows),
        "covered_raw_ad_product_row_count": covered_count,
        "missing_ad_product_row_count": len(missing_rows),
        "missing_ad_product_rows": missing_rows[:6],
        "missing_reason_summary": _count_missing_ad_product_reasons(missing_rows),
        "coverage_ratio": round(covered_count / raw_count, 4) if raw_count else None,
        "metric_summary": _ad_product_metric_summary(raw_rows, basis="raw_advertised_products"),
    }


def _ad_product_search_term_aba_context(
    signal_rows: list[dict[str, Any]],
    ad_product_rows: list[dict[str, Any]],
    focus_ad_group: dict[str, Any] | None = None,
) -> dict[str, Any] | None:
    context_keys = _ad_product_context_keys(ad_product_rows)
    if not context_keys:
        return None

    focus_label = _string(_dict(focus_ad_group).get("label"))
    basis = "same_ad_group_search_terms"
    context_ad_group_label = None
    if focus_label:
        focused_keys = {key for key in context_keys if key[1] == focus_label}
        if focused_keys:
            context_keys = focused_keys
            basis = "priority_ad_group_search_terms"
            context_ad_group_label = focus_label

    term_metrics: dict[str, dict[str, Any]] = {}
    for row in signal_rows:
        if _string(row.get("source_table")) != "ad_search_term_daily_metrics":
            continue
        key = (
            _string(row.get("campaign_name") or row.get("campaign_id")),
            _string(row.get("ad_group_name") or row.get("ad_group_id") or row.get("group_id")),
        )
        if key not in context_keys:
            continue
        normalized_query = _string(row.get("normalized_query")) or _string(row.get("search_term"))
        if not normalized_query:
            continue
        item = term_metrics.setdefault(
            normalized_query,
            {
                "normalized_query": normalized_query,
                "spend": 0.0,
                "clicks": 0,
                "orders": 0,
                "sales": 0.0,
            },
        )
        item["spend"] = round(item["spend"] + (_number(row.get("spend")) or 0), 2)
        item["clicks"] += _int(row.get("clicks")) or 0
        item["orders"] += _int(row.get("orders")) or 0
        item["sales"] = round(item["sales"] + (_number(row.get("sales")) or 0), 2)

    if not term_metrics:
        return None

    aba_by_query: dict[str, dict[str, Any]] = {}
    for row in load_aba_rows_from_latest_snapshot():
        normalized_query = _string(row.get("normalized_query")) or _string(row.get("search_term"))
        if normalized_query and normalized_query not in aba_by_query:
            aba_by_query[normalized_query] = row

    top_terms = sorted(
        term_metrics.values(),
        key=lambda item: (item["spend"], item["orders"], item["sales"]),
        reverse=True,
    )
    aba_match_count = 0
    aba_periods: list[str] = []
    for item in top_terms:
        aba_row = aba_by_query.get(_string(item.get("normalized_query")))
        if not aba_row:
            continue
        aba_match_count += 1
        item["aba_rank"] = _int(aba_row.get("search_frequency_rank"))
        item["aba_period"] = _period_text(aba_row.get("start_date"), aba_row.get("end_date"))
        if item["aba_period"] and item["aba_period"] not in aba_periods:
            aba_periods.append(item["aba_period"])

    high_spend_terms = top_terms[:3]
    effective_terms = sorted(
        [item for item in top_terms if (_int(item.get("orders")) or 0) > 0],
        key=lambda item: (_int(item.get("orders")) or 0, _number(item.get("sales")) or 0, _number(item.get("spend")) or 0),
        reverse=True,
    )[:3]
    zero_order_spend_terms = sorted(
        [item for item in top_terms if (_number(item.get("spend")) or 0) > 0 and (_int(item.get("orders")) or 0) == 0],
        key=lambda item: (_number(item.get("spend")) or 0, _int(item.get("clicks")) or 0),
        reverse=True,
    )[:3]
    aba_matched_terms = sorted(
        [item for item in top_terms if _int(item.get("aba_rank"))],
        key=lambda item: _int(item.get("aba_rank")) or 999999999,
    )[:3]

    return {
        "basis": basis,
        "context_ad_group_label": context_ad_group_label,
        "context_search_term_count": len(top_terms),
        "aba_top1000_match_count": aba_match_count,
        "aba_period": aba_periods[0] if aba_periods else None,
        "top_terms": top_terms[:6],
        "high_spend_terms": high_spend_terms,
        "effective_terms": effective_terms,
        "zero_order_spend_terms": zero_order_spend_terms,
        "aba_matched_terms": aba_matched_terms,
        "diagnosis_summary": (
            f"高花费词 {len(high_spend_terms)} 个 / 有效词 {len(effective_terms)} 个 / "
            f"无订单消耗词 {len(zero_order_spend_terms)} 个 / ABA匹配词 {len(aba_matched_terms)} 个"
        ),
        "next_review_focus": _search_term_next_review_focus(
            effective_terms=effective_terms,
            zero_order_spend_terms=zero_order_spend_terms,
            aba_matched_terms=aba_matched_terms,
        ),
        "boundary": "搜索词只说明同广告组上下文；ABA 是站点级市场背景，不能自动归因到该广告 ASIN。",
    }


def _ad_product_targeting_context(
    signal_rows: list[dict[str, Any]],
    ad_product_rows: list[dict[str, Any]],
    focus_ad_group: dict[str, Any] | None = None,
) -> dict[str, Any] | None:
    context_keys = _ad_product_context_keys(ad_product_rows)
    if not context_keys:
        return None

    focus_label = _string(_dict(focus_ad_group).get("label"))
    basis = "same_ad_group_targetings"
    context_ad_group_label = None
    if focus_label:
        focused_keys = {key for key in context_keys if key[1] == focus_label}
        if focused_keys:
            context_keys = focused_keys
            basis = "priority_ad_group_targetings"
            context_ad_group_label = focus_label

    targeting_metrics: dict[tuple[str, str], dict[str, Any]] = {}
    report_row_count = 0
    for row in signal_rows:
        if _string(row.get("source_table")) != "ad_search_term_daily_metrics":
            continue
        key = (
            _string(row.get("campaign_name") or row.get("campaign_id")),
            _string(row.get("ad_group_name") or row.get("ad_group_id") or row.get("group_id")),
        )
        if key not in context_keys:
            continue
        targeting_text = _string(row.get("keyword_text") or row.get("targeting_text") or row.get("target_text"))
        keyword_id = _string(row.get("keyword_id"))
        target_id = _string(row.get("target_id"))
        if not targeting_text:
            targeting_text = keyword_id or target_id
        if not targeting_text:
            continue
        report_row_count += 1
        source_report_type = _string(row.get("source_report_type")) or ("keyword" if keyword_id else "targeting" if target_id else "unknown")
        item_key = (source_report_type, targeting_text)
        item = targeting_metrics.setdefault(
            item_key,
            {
                "targeting_text": targeting_text,
                "source_report_type": source_report_type,
                "source_label": _targeting_source_label(source_report_type),
                "keyword_ids": set(),
                "target_ids": set(),
                "search_terms": set(),
                "spend": 0.0,
                "clicks": 0,
                "orders": 0,
                "sales": 0.0,
            },
        )
        if keyword_id:
            item["keyword_ids"].add(keyword_id)
        if target_id:
            item["target_ids"].add(target_id)
        normalized_query = _string(row.get("normalized_query")) or _string(row.get("search_term"))
        if normalized_query:
            item["search_terms"].add(normalized_query)
        item["spend"] = round(item["spend"] + (_number(row.get("spend")) or 0), 2)
        item["clicks"] += _int(row.get("clicks")) or 0
        item["orders"] += _int(row.get("orders")) or 0
        item["sales"] = round(item["sales"] + (_number(row.get("sales")) or 0), 2)

    if not targeting_metrics:
        return None

    targetings: list[dict[str, Any]] = []
    for item in targeting_metrics.values():
        search_terms = sorted(term for term in item.pop("search_terms") if term)
        keyword_ids = sorted(item.pop("keyword_ids"))
        target_ids = sorted(item.pop("target_ids"))
        item["search_term_count"] = len(search_terms)
        item["sample_search_terms"] = search_terms[:4]
        item["keyword_id_count"] = len(keyword_ids)
        item["target_id_count"] = len(target_ids)
        item["keyword_id"] = keyword_ids[0] if keyword_ids else None
        item["target_id"] = target_ids[0] if target_ids else None
        targetings.append(item)

    targetings.sort(
        key=lambda item: (
            _number(item.get("spend")) or 0,
            _int(item.get("orders")) or 0,
            _number(item.get("sales")) or 0,
        ),
        reverse=True,
    )
    effective_targetings = sorted(
        [item for item in targetings if (_int(item.get("orders")) or 0) > 0],
        key=lambda item: (_int(item.get("orders")) or 0, _number(item.get("sales")) or 0, _number(item.get("spend")) or 0),
        reverse=True,
    )[:3]
    zero_order_spend_targetings = sorted(
        [item for item in targetings if (_number(item.get("spend")) or 0) > 0 and (_int(item.get("orders")) or 0) == 0],
        key=lambda item: (_number(item.get("spend")) or 0, _int(item.get("clicks")) or 0),
        reverse=True,
    )[:3]
    return {
        "basis": basis,
        "context_ad_group_label": context_ad_group_label,
        "targeting_count": len(targetings),
        "report_row_count": report_row_count,
        "keyword_targeting_count": sum(1 for item in targetings if _string(item.get("source_report_type")) == "keyword"),
        "auto_targeting_count": sum(1 for item in targetings if _string(item.get("source_report_type")) == "targeting"),
        "top_targetings": targetings[:6],
        "effective_targetings": effective_targetings,
        "zero_order_spend_targetings": zero_order_spend_targetings,
        "diagnosis_summary": (
            f"投放词 {len(targetings)} 个 / 有效投放词 {len(effective_targetings)} 个 / "
            f"无订单消耗投放词 {len(zero_order_spend_targetings)} 个"
        ),
        "next_review_focus": _targeting_next_review_focus(
            effective_targetings=effective_targetings,
            zero_order_spend_targetings=zero_order_spend_targetings,
        ),
        "boundary": "投放词来自搜索词表现行中的 keyword_text / target_id，不代表完整关键词库；只能用于人工复核同广告组结构。",
    }


def _ad_product_context_keys(ad_product_rows: list[dict[str, Any]]) -> set[tuple[str, str]]:
    return {
        (_string(row.get("campaign_name")), _string(row.get("ad_group_name")))
        for row in ad_product_rows
        if _string(row.get("campaign_name")) and _string(row.get("ad_group_name"))
    }


def _targeting_source_label(source_report_type: str) -> str:
    if source_report_type == "keyword":
        return "关键词"
    if source_report_type == "targeting":
        return "商品/自动定向"
    return "投放词"


def _targeting_next_review_focus(
    *,
    effective_targetings: list[dict[str, Any]],
    zero_order_spend_targetings: list[dict[str, Any]],
) -> str:
    if zero_order_spend_targetings:
        return "先人工复核无订单消耗投放词，判断匹配方式、词意图或商品承接是否需要调整。"
    if effective_targetings:
        return "先把有效投放词作为正向样本，再对比其带来的搜索词是否稳定。"
    return "当前只有投放词曝光或点击证据，先观察搜索词承接后再判断。"


def _search_term_next_review_focus(
    *,
    effective_terms: list[dict[str, Any]],
    zero_order_spend_terms: list[dict[str, Any]],
    aba_matched_terms: list[dict[str, Any]],
) -> str:
    if zero_order_spend_terms and effective_terms:
        return "先人工复核无订单消耗词，再对照有效词，判断同广告组内词意图是否分化。"
    if zero_order_spend_terms:
        return "先人工复核无订单消耗词，判断是否需要调整投放词、匹配方式或搜索词处理。"
    if effective_terms and aba_matched_terms:
        return "先核对有效词与 ABA 匹配词，判断是否存在可人工观察的扩量机会。"
    if effective_terms:
        return "先把有效词作为正向承接样本，再回看广告组内投放词和搜索词结构。"
    return "当前搜索词只能提供上下文，先补足订单或 ABA 证据后再判断。"


def _ad_group_diagnosis(
    signal_rows: list[dict[str, Any]],
    ad_product_rows: list[dict[str, Any]],
    top_spend_ad_group: dict[str, Any] | None,
    boundary: str,
) -> dict[str, Any] | None:
    if not ad_product_rows:
        return None

    groups: dict[tuple[str, str], dict[str, Any]] = {}
    for row in ad_product_rows:
        key = _ad_group_context_key(row)
        if not key:
            continue
        group = groups.setdefault(
            key,
            {
                "campaign_name": key[0],
                "ad_group_name": key[1],
                "ad_product_row_count": 0,
                "spend": 0.0,
                "clicks": 0,
                "orders": 0,
                "sales": 0.0,
                "search_term_count": 0,
                "placement_count": 0,
            },
        )
        group["ad_product_row_count"] += 1
        group["spend"] = round(group["spend"] + (_number(row.get("spend")) or 0), 2)
        group["clicks"] += _int(row.get("clicks")) or 0
        group["orders"] += _int(row.get("orders")) or 0
        group["sales"] = round(group["sales"] + (_number(row.get("sales")) or 0), 2)

    if not groups:
        return None

    search_terms_by_group: dict[tuple[str, str], set[str]] = defaultdict(set)
    placements_by_group: dict[tuple[str, str], set[str]] = defaultdict(set)
    placements_by_campaign: dict[str, dict[str, dict[str, Any]]] = defaultdict(dict)
    known_campaigns = {key[0] for key in groups}
    for row in signal_rows:
        source_table = _string(row.get("source_table"))
        if source_table == "ad_placement_daily_metrics":
            campaign = _campaign_context_key(row)
            if campaign in known_campaigns:
                placement = _string(row.get("placement")) or _string(row.get("placement_name")) or "未知广告位"
                campaign_placement = placements_by_campaign[campaign].setdefault(
                    placement,
                    {
                        "placement": placement,
                        "spend": 0.0,
                        "clicks": 0,
                        "orders": 0,
                        "sales": 0.0,
                    },
                )
                campaign_placement["spend"] = round(
                    campaign_placement["spend"] + (_number(row.get("spend")) or 0),
                    2,
                )
                campaign_placement["clicks"] += _int(row.get("clicks")) or 0
                campaign_placement["orders"] += _int(row.get("orders")) or 0
                campaign_placement["sales"] = round(
                    campaign_placement["sales"] + (_number(row.get("sales")) or 0),
                    2,
                )
        key = _ad_group_context_key(row)
        if key not in groups:
            continue
        if source_table == "ad_search_term_daily_metrics":
            term = _string(row.get("normalized_query")) or _string(row.get("search_term"))
            if term:
                search_terms_by_group[key].add(term)
        elif source_table == "ad_placement_daily_metrics":
            placement = _string(row.get("placement")) or _string(row.get("placement_name")) or "未知广告位"
            placements_by_group[key].add(placement)

    top_label = _string(_dict(top_spend_ad_group).get("label"))
    rows: list[dict[str, Any]] = []
    for key, group in groups.items():
        search_term_count = len(search_terms_by_group.get(key, set()))
        placement_count = len(placements_by_group.get(key, set()))
        campaign_placements = sorted(
            placements_by_campaign.get(key[0], {}).values(),
            key=lambda item: (
                _number(item.get("spend")) or 0,
                _int(item.get("orders")) or 0,
                _number(item.get("sales")) or 0,
            ),
            reverse=True,
        )
        campaign_placement_count = len(campaign_placements)
        placement_context_count = placement_count or campaign_placement_count
        sales = _number(group.get("sales")) or 0
        clicks = _int(group.get("clicks")) or 0
        orders = _int(group.get("orders")) or 0
        spend = _number(group.get("spend")) or 0
        row = {
            **group,
            "search_term_count": search_term_count,
            "placement_count": placement_count,
            "campaign_placement_count": campaign_placement_count,
            "campaign_placements": campaign_placements[:3],
            "placement_context_level": "ad_group" if placement_count > 0 else ("campaign" if campaign_placement_count > 0 else "missing"),
            "acos": round(spend / sales, 4) if sales > 0 else None,
            "cvr": round(orders / clicks, 4) if clicks > 0 else None,
            "is_top_spend_ad_group": bool(top_label and _string(group.get("ad_group_name")) == top_label),
            "diagnosis_focus": _ad_group_diagnosis_focus(
                spend=spend,
                clicks=clicks,
                orders=orders,
                sales=sales,
                search_term_count=search_term_count,
                placement_count=placement_context_count,
                has_campaign_only_placement=placement_count <= 0 and campaign_placement_count > 0,
            ),
        }
        rows.append(row)

    rows.sort(
        key=lambda row: (
            1 if row["is_top_spend_ad_group"] else 0,
            _number(row.get("spend")) or 0,
            _int(row.get("orders")) or 0,
            _number(row.get("sales")) or 0,
        ),
        reverse=True,
    )
    top_row = rows[0]
    return {
        "basis": "advertised_products + same_ad_group_context",
        "summary": (
            f"优先下钻广告组 {top_row['ad_group_name']}：广告花费 {_format_amount(top_row.get('spend'))}，"
            f"广告订单 {_int(top_row.get('orders')) or 0}，同广告组搜索词 {top_row['search_term_count']} 条，"
            f"{_ad_group_placement_context_text(top_row)}；{top_row['diagnosis_focus']}"
        ),
        "top_ad_group": top_row,
        "rows": rows[:5],
        "boundary": f"广告组是投放容器；这里只定位广告组问题来源，不自动执行广告动作。{boundary}",
    }


def _ad_group_context_key(row: dict[str, Any]) -> tuple[str, str] | None:
    campaign = _string(row.get("campaign_name") or row.get("campaign_id"))
    ad_group = _string(row.get("ad_group_name") or row.get("ad_group_id") or row.get("group_id"))
    if not campaign or not ad_group:
        return None
    return campaign, ad_group


def _campaign_context_key(row: dict[str, Any]) -> str:
    return _string(row.get("campaign_name") or row.get("campaign_id"))


def _ad_group_diagnosis_focus(
    *,
    spend: float,
    clicks: int,
    orders: int,
    sales: float,
    search_term_count: int,
    placement_count: int,
    has_campaign_only_placement: bool = False,
) -> str:
    if spend > 0 and orders <= 0:
        return "先查广告商品承接和同广告组搜索词消耗。"
    if clicks > 0 and orders <= 0:
        return "有点击但无订单，优先核对搜索词相关性、Listing 承接和广告位流量。"
    if search_term_count > 0 and placement_count > 0:
        if has_campaign_only_placement:
            return "同时核对同广告组搜索词与同广告活动广告位；广告位当前不能直接归因到该广告组。"
        return "同时核对搜索词与广告位，判断问题来自词流量还是流量位置。"
    if search_term_count > 0:
        return "优先核对同广告组搜索词，判断是否存在词意图分化。"
    if placement_count > 0:
        if has_campaign_only_placement:
            return "优先核对同广告活动广告位，判断流量位置是否影响转化；当前不能直接归因到该广告组。"
        return "优先核对广告位，判断流量位置是否影响转化。"
    if sales > 0:
        return "先看广告商品承接，再按广告组内投放结构复核。"
    return "当前只有广告商品行，先补搜索词或广告位上下文后再判断原因。"


def _ad_group_placement_context_text(top_ad_group: dict[str, Any]) -> str:
    placement_count = _int(top_ad_group.get("placement_count")) or 0
    campaign_placement_count = _int(top_ad_group.get("campaign_placement_count")) or 0
    if placement_count > 0:
        return f"同广告组广告位 {placement_count} 条"
    if campaign_placement_count > 0:
        return f"广告组级广告位 0 条，同广告活动广告位 {campaign_placement_count} 条"
    return "广告位 0 条"


def _placement_context_boundary_text(placement_count: int, diagnosis: dict[str, Any] | None) -> str:
    campaign_placement_count = _int(_dict(_dict(diagnosis).get("top_ad_group")).get("campaign_placement_count")) or 0
    if placement_count <= 0 and campaign_placement_count > 0:
        return f"广告组级广告位 0 条 / 同广告活动广告位 {campaign_placement_count} 条"
    return f"广告位 {placement_count} 条"


def _ad_group_diagnosis_text(diagnosis: dict[str, Any] | None) -> str:
    if not diagnosis:
        return ""
    summary = _string(diagnosis.get("summary"))
    return f"{summary}；" if summary else ""


def _search_term_aba_context_text(context: dict[str, Any] | None) -> str:
    if not context:
        return ""
    match_count = _int(context.get("aba_top1000_match_count")) or 0
    count = _int(context.get("context_search_term_count")) or 0
    if count <= 0:
        return ""
    scope_label = "优先广告组搜索词" if _string(context.get("basis")) == "priority_ad_group_search_terms" else "同广告组搜索词"
    return f"{scope_label} {count} 条，ABA Top1000 精确匹配 {match_count} 条；"


def _search_term_market_context_block(context: dict[str, Any] | None) -> dict[str, Any] | None:
    if not context:
        return None
    count = _int(context.get("context_search_term_count")) or 0
    if count <= 0:
        return None
    match_count = _int(context.get("aba_top1000_match_count")) or 0
    scope_label = "优先广告组搜索词" if _string(context.get("basis")) == "priority_ad_group_search_terms" else "同广告组搜索词"
    focus_text = _evidence_focus_pair_text(
        _dict_list(context.get("effective_terms")),
        _dict_list(context.get("zero_order_spend_terms")),
        label_key="normalized_query",
    )
    high_spend_terms = _search_term_market_context_top_terms(_dict_list(context.get("high_spend_terms")))
    effective_terms = _search_term_market_context_top_terms(_dict_list(context.get("effective_terms")))
    zero_order_terms = _search_term_market_context_top_terms(_dict_list(context.get("zero_order_spend_terms")))
    aba_matched_terms = _search_term_market_context_top_terms(_dict_list(context.get("aba_matched_terms")))
    period = _string(context.get("aba_period")).strip()
    period_text = f"；ABA 周期 {period}" if period else ""
    next_review_focus = _string(context.get("next_review_focus")) or "继续人工复核同广告组搜索词。"
    return {
        "block_id": "search_term_market_context",
        "label": "搜索词市场背景",
        "value": (
            f"{scope_label} {count} 条：{focus_text} / ABA Top1000 匹配 {match_count} 条"
            if focus_text
            else f"{scope_label} {count} 条 / ABA Top1000 匹配 {match_count} 条"
        ),
        "detail": (
            f"高花费词：{high_spend_terms}；有效词：{effective_terms}；"
            f"无订单消耗词：{zero_order_terms}；ABA匹配词：{aba_matched_terms}{period_text}。"
            f"{next_review_focus}搜索词只作为同广告组上下文，ABA 只作为市场背景，不能自动归因到该广告 ASIN。"
        ),
        "source": "ad_search_term_daily_metrics + ABA导出",
    }


def _ad_product_diagnosis_judgement(
    *,
    metric_summary: dict[str, Any],
    ad_group_diagnosis: dict[str, Any] | None,
    targeting_context: dict[str, Any] | None,
    search_term_aba_context: dict[str, Any] | None,
) -> dict[str, Any] | None:
    top_ad_group = _dict(_dict(ad_group_diagnosis).get("top_ad_group"))
    if not top_ad_group:
        return None

    ad_group_name = _string(top_ad_group.get("ad_group_name")) or "优先广告组"
    spend = _number(top_ad_group.get("spend")) or 0
    clicks = _int(top_ad_group.get("clicks")) or 0
    orders = _int(top_ad_group.get("orders")) or 0
    sales = _number(top_ad_group.get("sales")) or 0
    search_term_count = _int(top_ad_group.get("search_term_count")) or 0
    placement_count = _int(top_ad_group.get("placement_count")) or 0
    campaign_placement_count = _int(top_ad_group.get("campaign_placement_count")) or 0
    zero_order_terms = _dict_list(_dict(search_term_aba_context).get("zero_order_spend_terms"))
    effective_terms = _dict_list(_dict(search_term_aba_context).get("effective_terms"))
    zero_order_targetings = _dict_list(_dict(targeting_context).get("zero_order_spend_targetings"))
    effective_targetings = _dict_list(_dict(targeting_context).get("effective_targetings"))

    if spend > 0 and orders <= 0:
        problem_layer = "ad_product_acceptance"
        problem_type = "商品承接复核"
        summary = f"{ad_group_name} 有花费但无订单，先查广告商品承接和投放对象。"
        reason = f"优先广告组花费 {_format_amount(spend)}、点击 {clicks}、订单 0，当前不能只从搜索词或广告位解释。"
        next_review_focus = "先人工复核 Listing、价格、库存、广告商品是否匹配当前流量，再看搜索词和广告位。"
        confidence = "medium" if clicks >= 10 else "low"
    elif zero_order_terms or zero_order_targetings:
        problem_layer = "search_term"
        problem_type = "词层分化复核"
        summary = f"{ad_group_name} 同时存在有效词和无订单消耗词，先查投放词 / 搜索词分化。"
        reason = (
            f"优先广告组搜索词 {search_term_count} 条，"
            f"有效词 {len(effective_terms)} 个，无订单消耗词 {len(zero_order_terms)} 个；"
            f"有效投放词 {len(effective_targetings)} 个，无订单消耗投放词 {len(zero_order_targetings)} 个。"
        )
        next_review_focus = "先对照有效词和无订单消耗词，人工判断是否存在词意图分化、匹配方式过宽或商品承接不一致。"
        confidence = "medium"
    elif effective_terms or effective_targetings:
        problem_layer = "search_term"
        problem_type = "有效词放量观察"
        summary = f"{ad_group_name} 已有有效投放词或搜索词，先作为正向样本观察。"
        reason = (
            f"优先广告组订单 {orders}、销售额 {_format_amount(sales)}，"
            f"有效词 {len(effective_terms)} 个，有效投放词 {len(effective_targetings)} 个。"
        )
        next_review_focus = "人工复核这些有效词是否稳定、是否与商品语义一致，再决定是否进入复盘观察。"
        confidence = "medium"
    elif search_term_count <= 0 and campaign_placement_count > 0:
        problem_layer = "data_gap"
        problem_type = "搜索词数据缺口"
        summary = f"{ad_group_name} 缺少同广告组搜索词，先补齐词层证据，再判断广告位影响。"
        reason = f"优先广告组搜索词 0 条、投放词证据缺失；同广告活动广告位 {campaign_placement_count} 条只能辅助复核流量位置。"
        next_review_focus = "先确认搜索词 / 投放词数据是否漏拉或该广告组确实无搜索词，再用同广告活动广告位做辅助判断。"
        confidence = "low"
    elif search_term_count <= 0 and placement_count <= 0 and campaign_placement_count <= 0:
        problem_layer = "data_gap"
        problem_type = "上下文数据缺口"
        summary = f"{ad_group_name} 缺少搜索词和广告位上下文，暂不下经营结论。"
        reason = "当前只有广告商品聚合指标，缺少词层和流量位置证据，无法判断问题来源。"
        next_review_focus = "先补齐搜索词、投放词或广告位数据，再进入人工处理。"
        confidence = "low"
    else:
        problem_layer = "placement_context"
        problem_type = "流量位置辅助复核"
        summary = f"{ad_group_name} 先用广告位结构辅助复核，不能直接归因到广告组。"
        reason = f"同广告组广告位 {placement_count} 条，同广告活动广告位 {campaign_placement_count} 条。"
        next_review_focus = "人工查看 Top of Search、Other、Detail Page 的花费和订单结构，再结合商品承接判断。"
        confidence = "low" if placement_count <= 0 else "medium"

    return {
        "problem_layer": problem_layer,
        "problem_type": problem_type,
        "confidence": confidence,
        "summary": summary,
        "reason": reason,
        "next_review_focus": next_review_focus,
        "boundary": "这是人工排查优先级判断，不是广告操作指令；不得自动加词、否词、调价或暂停广告。",
        "evidence_basis": {
            "ad_group_name": ad_group_name,
            "spend": round(spend, 2),
            "clicks": clicks,
            "orders": orders,
            "search_term_count": search_term_count,
            "placement_count": placement_count,
            "campaign_placement_count": campaign_placement_count,
            "total_spend": round(_number(metric_summary.get("spend")) or 0, 2),
            "total_orders": _int(metric_summary.get("orders")) or 0,
        },
    }


def _diagnosis_judgement_block(judgement: dict[str, Any] | None) -> dict[str, Any] | None:
    if not judgement:
        return None
    summary = _string(judgement.get("summary"))
    if not summary:
        return None
    return {
        "block_id": "diagnosis_judgement",
        "label": "综合判断",
        "value": summary,
        "detail": (
            f"原因：{_string(judgement.get('reason'))}"
            f"下一步：{_string(judgement.get('next_review_focus'))}"
            f"边界：{_string(judgement.get('boundary'))}"
        ),
        "source": "business_rule + advertised_products + ad_search_term_daily_metrics + ad_placement_daily_metrics",
    }


def _search_term_market_context_top_terms(rows: list[dict[str, Any]]) -> str:
    parts: list[str] = []
    for row in rows[:3]:
        query = _string(row.get("normalized_query"))
        if not query:
            continue
        aba_rank = _int(row.get("aba_rank"))
        spend = _number(row.get("spend")) or 0
        orders = _int(row.get("orders")) or 0
        label = f"{query}（花费 {_format_amount(spend)}，订单 {orders}"
        if aba_rank:
            label += f"，ABA排名 {aba_rank}"
        label += "）"
        parts.append(label)
    return "、".join(parts) if parts else "暂无"


def _evidence_focus_pair_text(
    effective_items: list[dict[str, Any]],
    zero_order_items: list[dict[str, Any]],
    *,
    label_key: str,
) -> str:
    parts: list[str] = []
    effective_label = _string(_dict(effective_items[0] if effective_items else {}).get(label_key))
    zero_order_label = _string(_dict(zero_order_items[0] if zero_order_items else {}).get(label_key))
    if effective_label:
        parts.append(f"有效 {effective_label}")
    if zero_order_label:
        parts.append(f"无订单 {zero_order_label}")
    return " / ".join(parts)


def _unique_ad_product_rows(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    unique_rows: list[dict[str, Any]] = []
    seen: set[tuple[Any, ...]] = set()
    for row in rows:
        row_key = _ad_product_row_key(row)
        if row_key in seen:
            continue
        seen.add(row_key)
        unique_rows.append(row)
    return unique_rows


def _ad_product_row_key(row: dict[str, Any]) -> tuple[Any, ...]:
    return tuple(row.get(key) for key in ("campaign_name", "ad_group_name", "asin", "spend", "clicks", "orders", "sales"))


def _missing_ad_product_row_summary(row: dict[str, Any]) -> dict[str, Any]:
    row_summary = dict(row)
    spend = _number(row_summary.get("spend")) or 0
    clicks = _int(row_summary.get("clicks")) or 0
    orders = _int(row_summary.get("orders")) or 0
    sales = _number(row_summary.get("sales")) or 0
    row_summary["spend"] = spend
    row_summary["clicks"] = clicks
    row_summary["orders"] = orders
    row_summary["sales"] = sales
    row_summary["acos"] = _number(row_summary.get("acos"))
    row_summary["cvr"] = _number(row_summary.get("cvr"))
    if row_summary["acos"] is None and sales > 0:
        row_summary["acos"] = round(spend / sales, 4)
    if row_summary["cvr"] is None and clicks > 0:
        row_summary["cvr"] = round(orders / clicks, 4)
    row_summary["coverage_reason"] = _missing_ad_product_row_reason(row_summary)
    return row_summary


def _missing_ad_product_row_reason(row: dict[str, Any]) -> str:
    spend = _number(row.get("spend")) or 0
    clicks = _int(row.get("clicks")) or 0
    orders = _int(row.get("orders")) or 0
    sales = _number(row.get("sales")) or 0
    if spend <= 0 and clicks == 0 and orders == 0 and sales <= 0:
        return "零花费背景行"
    return "未触发推荐证据的背景投放行"


def _count_missing_ad_product_reasons(rows: list[dict[str, Any]]) -> dict[str, int]:
    counter = Counter(_string(row.get("coverage_reason")) or "未分类背景行" for row in rows)
    return dict(counter)


def _top_spend_group(rows: list[dict[str, Any]], label_key: str, total_spend: float | None) -> dict[str, Any] | None:
    groups: dict[str, dict[str, Any]] = {}
    for row in rows:
        label = _string(row.get(label_key))
        if not label:
            continue
        group = groups.setdefault(label, {"label": label, "spend": 0.0, "clicks": 0, "orders": 0, "sales": 0.0})
        group["spend"] = round(group["spend"] + (_number(row.get("spend")) or 0), 2)
        group["clicks"] += _int(row.get("clicks")) or 0
        group["orders"] += _int(row.get("orders")) or 0
        group["sales"] = round(group["sales"] + (_number(row.get("sales")) or 0), 2)
    if not groups:
        return None
    top_group = max(groups.values(), key=lambda group: (group["spend"], group["orders"], group["sales"]))
    top_group["spend_share"] = round(top_group["spend"] / total_spend, 4) if total_spend and total_spend > 0 else None
    return top_group


def _metric_summary_text(metric_summary: dict[str, Any]) -> str:
    acos = _format_ratio(metric_summary.get("acos"), empty_text="ACOS 无销售额")
    cvr = _format_ratio(metric_summary.get("cvr"), empty_text="CVR 无点击")
    return (
        f"证据行合计花费 {_format_amount(metric_summary.get('spend'))}，"
        f"订单 {metric_summary.get('orders') or 0}，"
        f"销售额 {_format_amount(metric_summary.get('sales'))}，"
        f"ACOS {acos}，CVR {cvr}；"
    )


def _all_asin_ad_coverage_text(coverage: dict[str, Any] | None) -> str:
    if not coverage:
        return ""
    raw_count = _int(coverage.get("raw_ad_product_row_count")) or 0
    recommended_count = _int(coverage.get("recommended_ad_product_row_count")) or 0
    missing_count = _int(coverage.get("missing_ad_product_row_count")) or 0
    ratio = _format_ratio(coverage.get("coverage_ratio"), empty_text="覆盖率未知")
    reason_text = _missing_reason_summary_text(coverage.get("missing_reason_summary"))
    row_text = _missing_ad_product_rows_text(coverage.get("missing_ad_product_rows"))
    return f"raw 全量广告商品行 {raw_count} 条，推荐证据覆盖 {recommended_count} 条，未进入推荐证据 {missing_count} 条，覆盖率 {ratio}；{reason_text}{row_text}"


def _missing_reason_summary_text(reason_summary: Any) -> str:
    if not isinstance(reason_summary, dict) or not reason_summary:
        return ""
    parts = [f"{reason} {_int(count) or 0} 条" for reason, count in reason_summary.items() if _int(count)]
    return f"未覆盖原因：{'，'.join(parts)}；" if parts else ""


def _missing_ad_product_rows_text(rows: Any) -> str:
    if not isinstance(rows, list) or not rows:
        return ""
    parts: list[str] = []
    for row in rows[:3]:
        if not isinstance(row, dict):
            continue
        campaign = _string(row.get("campaign_name")) or "未知广告活动"
        ad_group = _string(row.get("ad_group_name")) or "未知广告组"
        parts.append(f"{campaign} / {ad_group} 花费 {_format_amount(row.get('spend'))} 订单 {_int(row.get('orders')) or 0}")
    return f"未覆盖投放行：{'；'.join(parts)}；" if parts else ""


def _top_spend_text(label: str, top_group: dict[str, Any] | None) -> str:
    if not top_group:
        return ""
    spend_share = _format_ratio(top_group.get("spend_share"), empty_text="占比未知")
    return f"主要花费{label} {top_group.get('label')}，花费占比 {spend_share}；"


def _ad_product_business_evidence_blocks(
    *,
    direct_count: int,
    search_term_count: int,
    placement_count: int,
    metric_summary: dict[str, Any],
    all_asin_ad_coverage: dict[str, Any] | None,
    top_spend_campaign: dict[str, Any] | None,
    boundary: str,
    ad_group_diagnosis: dict[str, Any] | None = None,
    targeting_context: dict[str, Any] | None = None,
    search_term_aba_context: dict[str, Any] | None = None,
    diagnosis_judgement: dict[str, Any] | None = None,
) -> list[dict[str, Any]]:
    raw_count = _int(_dict(all_asin_ad_coverage).get("raw_ad_product_row_count")) or direct_count
    covered_count = _int(_dict(all_asin_ad_coverage).get("covered_raw_ad_product_row_count")) or direct_count
    missing_count = _int(_dict(all_asin_ad_coverage).get("missing_ad_product_row_count")) or 0
    coverage_ratio_value = _number(_dict(all_asin_ad_coverage).get("coverage_ratio"))
    if coverage_ratio_value is None and raw_count > 0:
        coverage_ratio_value = covered_count / raw_count
    coverage_ratio = _format_ratio(coverage_ratio_value, empty_text="覆盖率未知")
    top_spend_label = _string(_dict(top_spend_campaign).get("label")) or "未知广告活动"
    top_spend_share = _format_ratio(_dict(top_spend_campaign).get("spend_share"), empty_text="占比未知")
    placement_context_text = _placement_context_boundary_text(placement_count, ad_group_diagnosis)
    blocks = [
        {
            "block_id": "diagnosis_path",
            "label": "排查路径",
            "value": "Parent 经营盘子 -> 广告 ASIN -> 广告组 -> 投放词 / 搜索词 / 广告位",
            "detail": "先用 Parent ASIN 看整体销售，再只下钻有广告证据的广告 ASIN；广告组用于定位投放结构，投放词、搜索词和广告位用于人工复核问题来源。",
            "source": "business_rule",
        },
        {
            "block_id": "ad_product_coverage",
            "label": "广告商品覆盖",
            "value": f"覆盖 raw 投放行 {covered_count}/{raw_count} / 证据行 {direct_count} 条",
            "detail": f"未覆盖 raw 投放行 {missing_count} 条，覆盖率 {coverage_ratio}；背景行只作覆盖核对，不重复生成待处理对象。",
            "source": "advertised_products",
        },
        {
            "block_id": "ad_metric_summary",
            "label": "广告聚合指标",
            "value": (
                f"花费 {_format_amount(metric_summary.get('spend'))} / 订单 {_int(metric_summary.get('orders')) or 0} / "
                f"销售额 {_format_amount(metric_summary.get('sales'))}"
            ),
            "detail": (
                f"点击 {_int(metric_summary.get('clicks')) or 0}，ACOS {_format_ratio(metric_summary.get('acos'), empty_text='无销售额')}，"
                f"CVR {_format_ratio(metric_summary.get('cvr'), empty_text='无点击')}。"
            ),
            "source": "advertised_products",
        },
        {
            "block_id": "top_spend_source",
            "label": "主要花费来源",
            "value": f"{top_spend_label} / 花费占比 {top_spend_share}",
            "detail": "用于定位优先下钻的广告活动；不代表该广告活动可以被自动调价或自动扩量。",
            "source": "advertised_products",
        },
    ]
    judgement_block = _diagnosis_judgement_block(diagnosis_judgement)
    if judgement_block:
        blocks.append(judgement_block)
    ad_group_block = _ad_group_diagnosis_block(ad_group_diagnosis)
    if ad_group_block:
        blocks.append(ad_group_block)
    targeting_block = _targeting_context_block(targeting_context)
    if targeting_block:
        blocks.append(targeting_block)
    search_term_block = _search_term_market_context_block(search_term_aba_context)
    if search_term_block:
        blocks.append(search_term_block)
    if search_term_count == 0 and placement_count == 0:
        blocks.append(
            {
                "block_id": "downstream_context_gap",
                "label": "下钻证据缺口",
                "value": "缺少同广告组搜索词和广告位上下文",
                "detail": "当前只能按广告 ASIN 直接指标判断承接异常，不能解释为具体搜索词、广告位或投放结构问题；处理前应先补齐或人工核对下游证据。",
                "source": "business_rule",
            }
        )
    elif search_term_count > 0 and placement_count == 0:
        blocks.append(
            {
                "block_id": "placement_context_gap",
                "label": "广告位证据缺口",
                "value": "缺少同广告组广告位上下文",
                "detail": "当前只能用同广告组搜索词做下钻复核，不能判断广告位是否造成该 ASIN 承接异常；处理前应补齐或人工核对广告位证据。",
                "source": "business_rule",
            }
        )
    blocks.append(
        {
            "block_id": "context_boundary",
            "label": "上下文边界",
            "value": f"搜索词 {search_term_count} 条 / {placement_context_text}",
            "detail": boundary,
            "source": "business_rule",
        },
    )
    return blocks


def _targeting_context_block(context: dict[str, Any] | None) -> dict[str, Any] | None:
    if not context:
        return None
    targeting_count = _int(context.get("targeting_count")) or 0
    if targeting_count <= 0:
        return None
    report_row_count = _int(context.get("report_row_count")) or 0
    scope_label = "优先广告组投放词" if _string(context.get("basis")) == "priority_ad_group_targetings" else "同广告组投放词"
    focus_text = _evidence_focus_pair_text(
        _dict_list(context.get("effective_targetings")),
        _dict_list(context.get("zero_order_spend_targetings")),
        label_key="targeting_text",
    )
    top_targetings = _targeting_context_top_items(_dict_list(context.get("top_targetings")))
    effective_targetings = _targeting_context_top_items(_dict_list(context.get("effective_targetings")))
    zero_order_targetings = _targeting_context_top_items(_dict_list(context.get("zero_order_spend_targetings")))
    next_review_focus = _string(context.get("next_review_focus")) or "继续人工复核同广告组投放词。"
    return {
        "block_id": "targeting_context",
        "label": "投放词结构",
        "value": (
            f"{scope_label} {targeting_count} 个：{focus_text}"
            if focus_text
            else f"{scope_label} {targeting_count} 个 / 搜索词表现行 {report_row_count} 条"
        ),
        "detail": (
            f"高花费投放词：{top_targetings}；有效投放词：{effective_targetings}；"
            f"无订单消耗投放词：{zero_order_targetings}。"
            f"{next_review_focus}投放词来自搜索词表现行，不代表完整关键词库，不能自动加词、否词或调价。"
        ),
        "source": "ad_search_term_daily_metrics",
    }


def _targeting_context_top_items(items: list[dict[str, Any]]) -> str:
    if not items:
        return "暂无"
    parts: list[str] = []
    for item in items[:3]:
        label = _string(item.get("targeting_text")) or "未知投放词"
        source_label = _string(item.get("source_label")) or "投放词"
        spend = _format_amount(item.get("spend"))
        orders = _int(item.get("orders")) or 0
        search_term_count = _int(item.get("search_term_count")) or 0
        parts.append(f"{label}（{source_label}，花费 {spend}，订单 {orders}，搜索词 {search_term_count}）")
    return "；".join(parts)


def _ad_group_diagnosis_block(diagnosis: dict[str, Any] | None) -> dict[str, Any] | None:
    if not diagnosis:
        return None
    top_ad_group = _dict(diagnosis.get("top_ad_group"))
    label = _string(top_ad_group.get("ad_group_name"))
    if not label:
        return None
    search_term_count = _int(top_ad_group.get("search_term_count")) or 0
    placement_text = _ad_group_placement_context_text(top_ad_group)
    focus = _string(top_ad_group.get("diagnosis_focus")) or "继续按广告商品、搜索词和广告位拆开复核。"
    return {
        "block_id": "ad_group_problem_location",
        "label": "广告组问题定位",
        "value": (
            f"{label} / 花费 {_format_amount(top_ad_group.get('spend'))} / "
            f"订单 {_int(top_ad_group.get('orders')) or 0}"
        ),
        "detail": f"同广告组搜索词 {search_term_count} 条 / {placement_text}；{focus}",
        "source": "advertised_products + ad_search_term_daily_metrics + ad_placement_daily_metrics",
    }


def _format_amount(value: Any) -> str:
    return f"{(_number(value) or 0):.2f}"


def _format_ratio(value: Any, *, empty_text: str) -> str:
    ratio = _number(value)
    return empty_text if ratio is None else f"{ratio * 100:.1f}%"


def _search_term_row_summary(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "campaign_name": _string(row.get("campaign_name") or row.get("campaign_id")),
        "ad_group_name": _string(row.get("ad_group_name") or row.get("ad_group_id") or row.get("group_id")),
        "search_term": _string(row.get("search_term") or row.get("normalized_query")),
        "targeting_text": _string(row.get("keyword_text") or row.get("target_value") or row.get("target_id") or row.get("keyword_id")),
        "spend": _number(row.get("spend") if row.get("spend") is not None else row.get("cost")),
        "clicks": _int(row.get("clicks")) or 0,
        "orders": _int(row.get("orders")) or 0,
        "sales": _number(row.get("sales")),
        "acos": _number(row.get("acos")),
        "cvr": _number(row.get("cvr")),
    }


def _unique_search_term_targeting_labels(rows: list[dict[str, Any]]) -> list[str]:
    labels: list[str] = []
    seen: set[str] = set()
    for row in rows:
        label = _string(row.get("targeting_text"))
        if not label or label in seen:
            continue
        seen.add(label)
        labels.append(label)
    return labels


def _search_term_business_evidence_blocks(
    *,
    search_term_count: int,
    placement_count: int,
    campaigns: list[str],
    ad_groups: list[str],
    metric_summary: dict[str, Any],
    targeting_labels: list[str],
    boundary: str,
) -> list[dict[str, Any]]:
    targeting_preview = "；".join(targeting_labels[:3]) if targeting_labels else "暂无可识别投放词"
    blocks = [
        {
            "block_id": "diagnosis_path",
            "label": "排查路径",
            "value": "搜索词 -> 广告活动 / 广告组 -> 投放词结构 -> 广告 ASIN 人工复核",
            "detail": "搜索词先用于定位投放上下文，再回到广告组和广告 ASIN 判断承接；不能跳过人工确认直接加词、否词或调价。",
            "source": "business_rule",
        },
        {
            "block_id": "search_term_metric_summary",
            "label": "搜索词表现",
            "value": (
                f"花费 {_format_amount(metric_summary.get('spend'))} / 订单 {_int(metric_summary.get('orders')) or 0} / "
                f"销售额 {_format_amount(metric_summary.get('sales'))}"
            ),
            "detail": (
                f"点击 {_int(metric_summary.get('clicks')) or 0}，ACOS {_format_ratio(metric_summary.get('acos'), empty_text='无销售额')}，"
                f"CVR {_format_ratio(metric_summary.get('cvr'), empty_text='无点击')}；指标来自搜索词表现行。"
            ),
            "source": "ad_search_term_daily_metrics",
        },
        {
            "block_id": "search_term_context",
            "label": "投放上下文",
            "value": f"广告活动 {len(campaigns)} 个 / 广告组 {len(ad_groups)} 个 / 搜索词表现行 {search_term_count} 条",
            "detail": "用于人工定位该搜索词出现在哪些广告活动和广告组；不是单个广告 ASIN 的直接归因。",
            "source": "ad_search_term_daily_metrics",
        },
        {
            "block_id": "targeting_context",
            "label": "投放词结构",
            "value": f"{len(targeting_labels)} 个投放词 / 搜索词表现行 {search_term_count} 条",
            "detail": f"投放词：{targeting_preview}。这些字段来自搜索词表现行，不代表完整关键词库，不能自动加词、否词或调价。",
            "source": "ad_search_term_daily_metrics",
        },
    ]
    if placement_count == 0:
        blocks.append(
            {
                "block_id": "placement_context_gap",
                "label": "广告位证据缺口",
                "value": "缺少可直接配套的广告位上下文",
                "detail": "当前搜索词候选只能说明搜索词和投放上下文，不能判断广告位是否造成表现差异。",
                "source": "business_rule",
            }
        )
    blocks.append(
        {
            "block_id": "search_term_boundary",
            "label": "对象边界",
            "value": "搜索词是投放证据，不是广告商品本身",
            "detail": boundary,
            "source": "business_rule",
        }
    )
    return blocks


def _signal_actionability_evidence_blocks(signal: Any) -> list[dict[str, Any]]:
    evidence = _get(signal, "evidence") or {}
    facts = _get(evidence, "facts") or []
    if not isinstance(facts, list):
        facts = []

    blocks: list[dict[str, Any]] = []
    for expected_label, block_id in (("人工动作路径", "manual_action_path"), ("复盘指标", "review_metrics")):
        for fact in facts:
            label = _string(_get(fact, "label") or _get(fact, "metric_name")).strip()
            if label != expected_label:
                continue
            value = _string(_get(fact, "value") or _get(fact, "metric_value")).strip()
            if not value:
                continue
            detail = _string(_get(fact, "explanation") or _get(fact, "note") or _get(fact, "time_range")).strip()
            source = _string(_get(fact, "source_type") or _get(fact, "source_name") or "business_rule").strip()
            blocks.append(
                {
                    "block_id": block_id,
                    "label": expected_label,
                    "value": value,
                    "detail": detail or None,
                    "source": source or "business_rule",
                }
            )
            break
    return blocks


def _ensure_actionability_evidence_blocks(drilldown: dict[str, Any] | None, signal: Any) -> dict[str, Any] | None:
    if not isinstance(drilldown, dict):
        return drilldown
    blocks = [dict(block) for block in _dict_list(drilldown.get("business_evidence_blocks"))]
    existing_ids = {_string(block.get("block_id")).strip() for block in blocks}
    for block in [*_signal_actionability_evidence_blocks(signal), *_default_actionability_evidence_blocks(signal)]:
        block_id = _string(block.get("block_id")).strip()
        if not block_id or block_id in existing_ids:
            continue
        blocks.append(block)
        existing_ids.add(block_id)
    enriched = dict(drilldown)
    enriched["business_evidence_blocks"] = blocks
    return enriched


def _default_actionability_evidence_blocks(signal: Any) -> list[dict[str, Any]]:
    if not _requires_manual_confirmation(signal):
        return []
    return [
        {
            "block_id": "manual_action_path",
            "label": "人工动作路径",
            "value": "记录观察 / 标记已处理 / 加入复盘 / 忽略本次",
            "detail": "只允许人工确认后留痕；不自动调价、不自动暂停、不自动否词、不自动新增关键词。",
            "source": "business_rule",
        },
        {
            "block_id": "review_metrics",
            "label": "复盘指标",
            "value": "7/14 天复盘花费、订单、销售额、ACOS、CVR 和对象表现",
            "detail": "复盘只用于判断人工处理后的效果，不反向自动改广告规则或自动执行广告动作。",
            "source": "business_rule",
        },
    ]


def _search_term_evidence_drilldown(
    signal: Any,
    primary_object: Any,
    search_term_rows: list[dict[str, Any]],
    placement_rows: list[dict[str, Any]],
) -> dict[str, Any]:
    row_summaries = [_search_term_row_summary(row) for row in search_term_rows]
    metric_summary = _ad_product_metric_summary(row_summaries, basis="search_term_daily_metrics")
    campaign_labels = _unique_row_labels(search_term_rows, "campaign_name", "campaign_id")
    ad_group_labels = _unique_row_labels(search_term_rows, "ad_group_name", "ad_group_id", "group_id")
    targeting_labels = _unique_search_term_targeting_labels(row_summaries)
    object_label = (
        _string(_get(primary_object, "label"))
        or _string(_get(primary_object, "search_term"))
        or _string(row_summaries[0].get("search_term") if row_summaries else None)
        or "搜索词"
    )
    boundary = "搜索词只能说明广告活动和广告组下的用户搜索表现，不能自动归因到单个广告 ASIN；处理前必须人工核对广告商品、投放词和策略边界。"
    business_evidence_blocks = _search_term_business_evidence_blocks(
        search_term_count=len(search_term_rows),
        placement_count=len(placement_rows),
        campaigns=campaign_labels,
        ad_groups=ad_group_labels,
        metric_summary=metric_summary,
        targeting_labels=targeting_labels,
        boundary=boundary,
    )
    business_evidence_blocks.extend(_signal_actionability_evidence_blocks(signal))
    summary = (
        f"搜索词表现行 {len(search_term_rows)} 条，覆盖广告活动 {len(campaign_labels)} 个 / 广告组 {len(ad_group_labels)} 个；"
        f"花费 {_format_amount(metric_summary.get('spend'))}，订单 {_int(metric_summary.get('orders')) or 0}；{boundary}"
    )
    return {
        "object_label": object_label,
        "object_type": _string(_get(signal, "object_type")),
        "direct_ad_product_row_count": 0,
        "search_term_context_count": len(search_term_rows),
        "placement_context_count": len(placement_rows),
        "campaigns": campaign_labels,
        "ad_groups": ad_group_labels,
        "metric_summary": metric_summary,
        "top_spend_campaign": _top_spend_group(row_summaries, "campaign_name", metric_summary["spend"]),
        "business_evidence_blocks": business_evidence_blocks,
        "search_term_rows": row_summaries[:6],
        "ad_product_rows": [],
        "boundary": boundary,
        "summary": summary,
    }


def _candidate_evidence_drilldown(signal: Any) -> dict[str, Any] | None:
    evidence = _get(signal, "evidence") or {}
    primary_object = _get(evidence, "primary_object") or {}
    source_rows = [row for row in (_get(evidence, "source_rows") or []) if isinstance(row, dict)]
    if not source_rows:
        return None

    ad_product_rows = [row for row in source_rows if _string(row.get("source_table")) == "advertised_products"]
    search_term_rows = [row for row in source_rows if _string(row.get("source_table")) == "ad_search_term_daily_metrics"]
    placement_rows = [row for row in source_rows if _string(row.get("source_table")) == "ad_placement_daily_metrics"]
    sales_product_rows = [row for row in source_rows if _string(row.get("source_table")) == "sales_product_daily_metrics"]
    if sales_product_rows and not ad_product_rows and not search_term_rows and not placement_rows:
        return _sales_product_evidence_drilldown(signal, primary_object, sales_product_rows)
    if search_term_rows and not ad_product_rows:
        return _search_term_evidence_drilldown(signal, primary_object, search_term_rows, placement_rows)
    if not ad_product_rows and not search_term_rows and not placement_rows:
        return None

    campaign_labels = _unique_row_labels(ad_product_rows, "campaign_name", "campaign_id")
    ad_group_labels = _unique_row_labels(ad_product_rows, "ad_group_name", "ad_group_id", "group_id")
    object_label = _string(_get(primary_object, "label")) or _string(_get(primary_object, "asin")) or "推荐对象"
    boundary = "搜索词和广告位只说明同广告组上下文，不能自动归因到该广告 ASIN。"
    ad_product_row_summaries = [_ad_product_row_summary(row) for row in ad_product_rows]
    metric_summary = _ad_product_metric_summary(ad_product_row_summaries)
    top_spend_campaign = _top_spend_group(ad_product_row_summaries, "campaign_name", metric_summary["spend"])
    business_evidence_blocks = _ad_product_business_evidence_blocks(
        direct_count=len(ad_product_rows),
        search_term_count=len(search_term_rows),
        placement_count=len(placement_rows),
        metric_summary=metric_summary,
        all_asin_ad_coverage=None,
        top_spend_campaign=top_spend_campaign,
        boundary=boundary,
    )
    summary = (
        f"广告商品投放行 {len(ad_product_rows)} 条，覆盖广告活动 {len(campaign_labels)} 个 / 广告组 {len(ad_group_labels)} 个；"
        f"同广告组搜索词上下文 {len(search_term_rows)} 条、广告位上下文 {len(placement_rows)} 条；{boundary}"
    )
    return {
        "object_label": object_label,
        "object_type": _string(_get(signal, "object_type")),
        "direct_ad_product_row_count": len(ad_product_rows),
        "search_term_context_count": len(search_term_rows),
        "placement_context_count": len(placement_rows),
        "campaigns": campaign_labels,
        "ad_groups": ad_group_labels,
        "metric_summary": metric_summary,
        "top_spend_campaign": top_spend_campaign,
        "business_evidence_blocks": business_evidence_blocks,
        "ad_product_rows": ad_product_row_summaries[:6],
        "boundary": boundary,
        "summary": summary,
    }


def _sales_product_evidence_drilldown(
    signal: Any,
    primary_object: Any,
    rows: list[dict[str, Any]],
) -> dict[str, Any]:
    summary = _sales_product_metric_summary(rows)
    object_label = (
        _string(_get(primary_object, "label"))
        or _string(_get(primary_object, "asin"))
        or _string(_get(signal, "object_id"))
        or "销售商品"
    )
    period = _period_text(summary.get("start_date"), summary.get("end_date"))
    ad_order_share = _format_ratio(summary.get("ad_order_share"), empty_text="未知")
    ad_sales_share = _format_ratio(summary.get("ad_sales_share"), empty_text="未知")
    boundary = "销售商品强不等于可自动加投；广告承接必须结合广告 ASIN、库存、价格和策略人工复核。"
    business_evidence_blocks = _sales_product_business_evidence_blocks(summary, boundary="销售商品强不等于可自动加投")
    text = (
        f"销售商品证据：{period}订单 {summary['orders']}，销售额 {_format_amount(summary['sales'])}；"
        f"广告订单 {summary['ad_orders']}，广告订单占比 {ad_order_share}；"
        f"广告销售额 {_format_amount(summary['ad_sales'])}，广告销售占比 {ad_sales_share}；"
        f"广告花费按原始快照展示为 {_format_amount(summary['ad_spend'])}，不单独作为异常结论；"
        "该对象应先人工复核广告承接，不自动执行广告动作。"
    )
    return {
        "object_label": object_label,
        "object_type": _string(_get(signal, "object_type")),
        "direct_ad_product_row_count": 0,
        "search_term_context_count": 0,
        "placement_context_count": 0,
        "campaigns": [],
        "ad_groups": [],
        "metric_summary": {
            "basis": "sales_product_daily_metrics",
            "row_count": summary["row_count"],
            "spend": summary["ad_spend"],
            "clicks": None,
            "orders": summary["orders"],
            "sales": summary["sales"],
            "acos": None,
            "cvr": None,
        },
        "sales_product_summary": summary,
        "business_evidence_blocks": business_evidence_blocks,
        "ad_product_rows": [],
        "boundary": boundary,
        "summary": text,
    }


def _sales_product_metric_summary(rows: list[dict[str, Any]]) -> dict[str, Any]:
    sessions = sum(_int(row.get("sessions")) or 0 for row in rows)
    page_views = sum(_int(row.get("page_views")) or 0 for row in rows)
    orders = sum(_int(row.get("orders")) or 0 for row in rows)
    units = sum(_int(row.get("units")) or 0 for row in rows)
    sales = round(sum(_number(row.get("sales")) or 0 for row in rows), 2)
    ad_orders = sum(_int(row.get("ad_orders")) or 0 for row in rows)
    ad_sales = round(sum(_number(row.get("ad_sales")) or 0 for row in rows), 2)
    ad_spend = round(sum(_number(row.get("ad_spend") if row.get("ad_spend") is not None else row.get("cost")) or 0 for row in rows), 2)
    organic_orders = max(orders - ad_orders, 0)
    organic_sales = round(max(sales - ad_sales, 0), 2)
    start_dates = sorted({_string(row.get("start_date")) for row in rows if _string(row.get("start_date"))})
    end_dates = sorted({_string(row.get("end_date")) for row in rows if _string(row.get("end_date"))})
    return {
        "basis": "sales_product_daily_metrics",
        "row_count": len(rows),
        "start_date": start_dates[0] if start_dates else None,
        "end_date": end_dates[-1] if end_dates else None,
        "sessions": sessions,
        "page_views": page_views,
        "orders": orders,
        "units": units,
        "sales": sales,
        "ad_orders": ad_orders,
        "ad_spend": ad_spend,
        "ad_sales": ad_sales,
        "organic_orders": organic_orders,
        "organic_sales": organic_sales,
        "order_rate": round(orders / sessions, 4) if sessions > 0 else None,
        "ad_order_share": round(ad_orders / orders, 4) if orders > 0 else None,
        "ad_sales_share": round(ad_sales / sales, 4) if sales > 0 else None,
    }


def _sales_product_business_evidence_blocks(summary: dict[str, Any], *, boundary: str) -> list[dict[str, Any]]:
    order_rate = _format_ratio(summary.get("order_rate"), empty_text="未知")
    ad_order_share = _format_ratio(summary.get("ad_order_share"), empty_text="未知")
    ad_sales_share = _format_ratio(summary.get("ad_sales_share"), empty_text="未知")
    organic_orders = _int(summary.get("organic_orders")) or 0
    organic_sales = _format_amount(summary.get("organic_sales"))
    return [
        {
            "block_id": "sales_performance",
            "label": "销售表现",
            "value": f"订单 {summary.get('orders') or 0} / 销售额 {_format_amount(summary.get('sales'))}",
            "detail": f"Sessions {summary.get('sessions') or 0}，转化率 {order_rate}，非广告订单 {organic_orders}，非广告销售额 {organic_sales}。",
            "source": "sales_product_daily_metrics",
        },
        {
            "block_id": "ad_coverage",
            "label": "广告承接",
            "value": f"广告订单占比 {ad_order_share} / 广告销售占比 {ad_sales_share}",
            "detail": f"广告订单 {summary.get('ad_orders') or 0}，广告销售额 {_format_amount(summary.get('ad_sales'))}；广告花费 {_format_amount(summary.get('ad_spend'))} 只按原始快照展示，不单独作为异常结论。",
            "source": "sales_product_daily_metrics",
        },
        {
            "block_id": "decision_boundary",
            "label": "判断边界",
            "value": boundary,
            "detail": "广告承接还需要结合广告 ASIN 覆盖、库存、价格和投放策略人工复核。",
            "source": "business_rule",
        },
        {
            "block_id": "manual_next_step",
            "label": "人工下一步",
            "value": "人工复核广告承接，并加入 7d / 14d 复盘",
            "detail": "系统只做证据整理和建议，不自动加投、不自动调价、不自动暂停广告。",
            "source": "manual_review_rule",
        },
    ]


def _sales_product_sibling_enriched_drilldown(
    candidate_summary: dict[str, Any],
    drilldown: dict[str, Any],
    signal_rows: list[dict[str, Any]],
) -> dict[str, Any]:
    if not _is_sales_product_drilldown(candidate_summary, drilldown):
        return drilldown

    comparison = _sales_product_sibling_comparison(candidate_summary, signal_rows)
    ad_product_coverage = _sales_product_ad_product_coverage(candidate_summary, drilldown, signal_rows)
    if not comparison and not ad_product_coverage:
        return drilldown

    enriched = dict(drilldown)
    blocks = [dict(block) for block in _dict_list(enriched.get("business_evidence_blocks"))]
    if ad_product_coverage and not any(block.get("block_id") == "ad_product_coverage" for block in blocks):
        blocks.insert(_business_block_insert_index(blocks, "ad_coverage"), _sales_product_ad_product_coverage_block(ad_product_coverage))
    if comparison and not any(block.get("block_id") == "parent_sibling_position" for block in blocks):
        blocks.insert(_business_block_insert_index(blocks, "ad_product_coverage"), _sales_product_sibling_evidence_block(comparison))
    enriched["business_evidence_blocks"] = blocks
    if ad_product_coverage:
        enriched["ad_product_coverage"] = ad_product_coverage
    if comparison:
        enriched["sibling_comparison"] = comparison
    return enriched


def _is_sales_product_drilldown(candidate_summary: dict[str, Any], drilldown: dict[str, Any]) -> bool:
    return (
        _string(candidate_summary.get("object_type")) == "sales_product"
        or _string(drilldown.get("object_type")) == "sales_product"
        or _string(_dict(drilldown.get("metric_summary")).get("basis")) == "sales_product_daily_metrics"
        or _string(_dict(drilldown.get("sales_product_summary")).get("basis")) == "sales_product_daily_metrics"
    )


def _sales_product_sibling_comparison(
    candidate_summary: dict[str, Any],
    signal_rows: list[dict[str, Any]],
) -> dict[str, Any] | None:
    target_asin = _string(candidate_summary.get("stable_object_id")) or _string(candidate_summary.get("asin"))
    if not target_asin:
        return None

    sales_rows = [
        row
        for row in signal_rows
        if isinstance(row, dict) and _string(row.get("source_table")) == "sales_product_daily_metrics"
    ]
    target_rows = [row for row in sales_rows if _string(row.get("asin")) == target_asin]
    parent_asin = next((_string(row.get("parent_asin")) for row in target_rows if _string(row.get("parent_asin"))), "")
    if not parent_asin:
        return None

    sibling_groups: dict[str, list[dict[str, Any]]] = {}
    for row in sales_rows:
        if _string(row.get("parent_asin")) != parent_asin:
            continue
        asin = _string(row.get("asin"))
        if not asin:
            continue
        sibling_groups.setdefault(asin, []).append(row)
    if target_asin not in sibling_groups or len(sibling_groups) < 2:
        return None

    siblings = [_sales_product_sibling_summary(asin, rows) for asin, rows in sibling_groups.items()]
    siblings_by_orders = sorted(siblings, key=lambda item: (-(_int(item.get("orders")) or 0), -(_number(item.get("sales")) or 0), _string(item.get("asin"))))
    siblings_by_sales = sorted(siblings, key=lambda item: (-(_number(item.get("sales")) or 0), -(_int(item.get("orders")) or 0), _string(item.get("asin"))))
    siblings_by_ad_order_share = sorted(
        siblings,
        key=lambda item: (-(_number(item.get("ad_order_share")) or -1), -(_int(item.get("orders")) or 0), _string(item.get("asin"))),
    )
    parent_summary = _sales_product_metric_summary([row for rows in sibling_groups.values() for row in rows])
    target_summary = next(item for item in siblings if item["asin"] == target_asin)
    order_rank = _rank_in_summaries(siblings_by_orders, target_asin)
    sales_rank = _rank_in_summaries(siblings_by_sales, target_asin)
    ad_order_share_rank = _rank_in_summaries(siblings_by_ad_order_share, target_asin)
    sibling_count = len(siblings)
    interpretation = _sales_product_sibling_interpretation(
        order_rank=order_rank,
        sibling_count=sibling_count,
        target_ad_order_share=target_summary.get("ad_order_share"),
        parent_ad_order_share=parent_summary.get("ad_order_share"),
    )

    return {
        "basis": "parent_asin_sales_product_daily_metrics",
        "parent_asin": parent_asin,
        "sibling_asin_count": sibling_count,
        "target_asin": target_asin,
        "target_label": target_summary.get("label"),
        "target_order_rank": order_rank,
        "target_sales_rank": sales_rank,
        "target_ad_order_share_rank": ad_order_share_rank,
        "target_orders": target_summary.get("orders"),
        "target_sales": target_summary.get("sales"),
        "target_ad_orders": target_summary.get("ad_orders"),
        "target_ad_sales": target_summary.get("ad_sales"),
        "target_ad_order_share": target_summary.get("ad_order_share"),
        "target_ad_sales_share": target_summary.get("ad_sales_share"),
        "parent_orders": parent_summary.get("orders"),
        "parent_sales": parent_summary.get("sales"),
        "parent_ad_orders": parent_summary.get("ad_orders"),
        "parent_ad_sales": parent_summary.get("ad_sales"),
        "parent_ad_order_share": parent_summary.get("ad_order_share"),
        "parent_ad_sales_share": parent_summary.get("ad_sales_share"),
        "top_siblings": siblings_by_orders[:3],
        "bottom_siblings": siblings_by_orders[-3:],
        "interpretation": interpretation,
    }


def _sales_product_ad_product_coverage(
    candidate_summary: dict[str, Any],
    drilldown: dict[str, Any],
    signal_rows: list[dict[str, Any]],
) -> dict[str, Any] | None:
    target_asin = _string(candidate_summary.get("stable_object_id")) or _string(candidate_summary.get("asin"))
    if not target_asin:
        return None

    sales_rows = [
        row
        for row in signal_rows
        if isinstance(row, dict) and _string(row.get("source_table")) == "sales_product_daily_metrics"
    ]
    target_rows = [row for row in sales_rows if _string(row.get("asin")) == target_asin]
    parent_asin = next((_string(row.get("parent_asin")) for row in target_rows if _string(row.get("parent_asin"))), "")
    if not parent_asin:
        return None

    sibling_asins = {
        _string(row.get("asin"))
        for row in sales_rows
        if _string(row.get("parent_asin")) == parent_asin and _string(row.get("asin"))
    }
    if target_asin not in sibling_asins:
        return None

    parent_ad_rows = _unique_ad_product_rows(
        [
            _ad_product_row_summary(row)
            for row in signal_rows
            if isinstance(row, dict)
            and _string(row.get("source_table")) == "advertised_products"
            and _string(row.get("asin")) in sibling_asins
        ]
    )
    target_ad_rows = [row for row in parent_ad_rows if _string(row.get("asin")) == target_asin]
    advertised_asins = sorted({_string(row.get("asin")) for row in parent_ad_rows if _string(row.get("asin"))})
    top_advertised_siblings = _sales_product_top_advertised_siblings(parent_ad_rows)
    sales_summary = _dict(drilldown.get("sales_product_summary"))
    target_sales_ad_orders = _int(sales_summary.get("ad_orders")) or 0
    target_sales_ad_sales = _number(sales_summary.get("ad_sales")) or 0
    sibling_count = len(sibling_asins)

    return {
        "basis": "parent_asin_advertised_products",
        "parent_asin": parent_asin,
        "target_asin": target_asin,
        "sibling_asin_count": sibling_count,
        "target_direct_ad_product_row_count": len(target_ad_rows),
        "target_has_direct_ad_product_rows": bool(target_ad_rows),
        "parent_ad_product_row_count": len(parent_ad_rows),
        "parent_advertised_asin_count": len(advertised_asins),
        "parent_advertised_asins": advertised_asins,
        "coverage_ratio": round(len(advertised_asins) / sibling_count, 4) if sibling_count else None,
        "target_sales_ad_orders": target_sales_ad_orders,
        "target_sales_ad_sales": round(target_sales_ad_sales, 2),
        "top_advertised_siblings": top_advertised_siblings,
        "interpretation": _sales_product_ad_product_coverage_interpretation(
            target_direct_row_count=len(target_ad_rows),
            target_sales_ad_orders=target_sales_ad_orders,
        ),
    }


def _sales_product_top_advertised_siblings(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    grouped: dict[str, list[dict[str, Any]]] = {}
    for row in rows:
        asin = _string(row.get("asin"))
        if not asin:
            continue
        grouped.setdefault(asin, []).append(row)
    summaries: list[dict[str, Any]] = []
    for asin, asin_rows in grouped.items():
        metric_summary = _ad_product_metric_summary(asin_rows, basis="raw_advertised_products")
        summaries.append(
            {
                "asin": asin,
                "row_count": len(asin_rows),
                "spend": metric_summary.get("spend"),
                "clicks": metric_summary.get("clicks"),
                "orders": metric_summary.get("orders"),
                "sales": metric_summary.get("sales"),
                "campaign_count": len({_string(row.get("campaign_name")) for row in asin_rows if _string(row.get("campaign_name"))}),
                "ad_group_count": len({_string(row.get("ad_group_name")) for row in asin_rows if _string(row.get("ad_group_name"))}),
            }
        )
    return sorted(summaries, key=lambda item: (-(_number(item.get("spend")) or 0), -(_int(item.get("orders")) or 0), _string(item.get("asin"))))[:3]


def _sales_product_ad_product_coverage_interpretation(*, target_direct_row_count: int, target_sales_ad_orders: int) -> str:
    if target_direct_row_count <= 0 and target_sales_ad_orders > 0:
        return "销售表现仍有广告订单，但广告商品快照未覆盖目标 ASIN；需要人工核对广告 ASIN 覆盖、非 SP 来源或数据缺口。"
    if target_direct_row_count <= 0:
        return "广告商品快照未覆盖目标 ASIN；需要人工核对是否未投放、未同步或对象映射缺口。"
    return "advertised_products 已覆盖目标 ASIN；继续结合广告活动、广告组和策略边界人工复核。"


def _sales_product_ad_product_coverage_block(coverage: dict[str, Any]) -> dict[str, Any]:
    target_rows = _int(coverage.get("target_direct_ad_product_row_count")) or 0
    advertised_asin_count = _int(coverage.get("parent_advertised_asin_count")) or 0
    sibling_count = _int(coverage.get("sibling_asin_count")) or 0
    top_siblings = _dict_list(coverage.get("top_advertised_siblings"))
    top_text = "；".join(
        f"{item.get('asin')} 花费 {_format_amount(item.get('spend'))} 订单 {item.get('orders') or 0}"
        for item in top_siblings
        if item.get("asin")
    )
    top_suffix = f"；同父体广告商品参照：{top_text}" if top_text else ""
    return {
        "block_id": "ad_product_coverage",
        "label": "广告商品覆盖",
        "value": f"目标广告商品行 {target_rows} / 同父体已投 ASIN {advertised_asin_count}/{sibling_count}",
        "detail": (
            f"销售表现仍有广告订单 {coverage.get('target_sales_ad_orders') or 0}，"
            f"但广告商品快照未覆盖目标 ASIN；先人工核对广告 ASIN 覆盖、非 SP 来源或数据缺口。"
            f"{top_suffix}"
        ),
        "source": "advertised_products",
    }


def _business_block_insert_index(blocks: list[dict[str, Any]], after_block_id: str) -> int:
    for index, block in enumerate(blocks):
        if block.get("block_id") == after_block_id:
            return index + 1
    return len(blocks)


def _sales_product_sibling_summary(asin: str, rows: list[dict[str, Any]]) -> dict[str, Any]:
    summary = _sales_product_metric_summary(rows)
    label = next((_sales_product_row_label(row) for row in rows if _sales_product_row_label(row)), asin)
    return {
        "asin": asin,
        "label": label,
        "orders": summary.get("orders"),
        "sales": summary.get("sales"),
        "ad_orders": summary.get("ad_orders"),
        "ad_sales": summary.get("ad_sales"),
        "ad_order_share": summary.get("ad_order_share"),
        "ad_sales_share": summary.get("ad_sales_share"),
    }


def _sales_product_row_label(row: dict[str, Any]) -> str:
    for key in ("product_name", "product_title", "msku", "sku", "asin"):
        value = _string(row.get(key))
        if value:
            return value
    return ""


def _rank_in_summaries(summaries: list[dict[str, Any]], asin: str) -> int | None:
    for index, item in enumerate(summaries, start=1):
        if item.get("asin") == asin:
            return index
    return None


def _sales_product_sibling_interpretation(
    *,
    order_rank: int | None,
    sibling_count: int,
    target_ad_order_share: Any,
    parent_ad_order_share: Any,
) -> str:
    if order_rank and sibling_count and order_rank >= max(sibling_count - 2, 1):
        return (
            f"目标处于同父体销售尾部，广告订单占比 {_format_ratio(target_ad_order_share, empty_text='未知')}，"
            f"父体整体 {_format_ratio(parent_ad_order_share, empty_text='未知')}。更像低量长尾的局部复核机会，不是父体整体结构问题。"
        )
    return (
        f"目标不是同父体销售尾部，广告订单占比 {_format_ratio(target_ad_order_share, empty_text='未知')}，"
        f"父体整体 {_format_ratio(parent_ad_order_share, empty_text='未知')}。需要结合广告 ASIN 覆盖和策略边界复核。"
    )


def _sales_product_sibling_evidence_block(comparison: dict[str, Any]) -> dict[str, Any]:
    sibling_count = _int(comparison.get("sibling_asin_count")) or 0
    order_rank = _int(comparison.get("target_order_rank")) or 0
    top_siblings = _dict_list(comparison.get("top_siblings"))
    top_text = "；".join(
        f"{item.get('label') or item.get('asin')} 订单 {item.get('orders') or 0}"
        for item in top_siblings
        if item.get("asin")
    )
    detail = (
        f"目标订单 {comparison.get('target_orders') or 0}，父体总订单 {comparison.get('parent_orders') or 0}；"
        f"广告订单占比 {_format_ratio(comparison.get('target_ad_order_share'), empty_text='未知')}，"
        f"父体整体 {_format_ratio(comparison.get('parent_ad_order_share'), empty_text='未知')}。"
        f"头部/对比 ASIN：{top_text}。{comparison.get('interpretation') or ''}"
    )
    return {
        "block_id": "parent_sibling_position",
        "label": "同父体位置",
        "value": f"{sibling_count} 个子 ASIN 中订单排名 {order_rank}/{sibling_count}",
        "detail": detail,
        "source": "sales_product_daily_metrics",
    }


def _period_text(start_date: Any, end_date: Any) -> str:
    start = _string(start_date)
    end = _string(end_date)
    if start and end:
        return f"{start} 至 {end} "
    return ""


def _unique_row_labels(rows: list[dict[str, Any]], *fields: str) -> list[str]:
    labels: list[str] = []
    seen: set[str] = set()
    for row in rows:
        label = ""
        for field in fields:
            label = _string(row.get(field)) or ""
            if label:
                break
        if label and label not in seen:
            seen.add(label)
            labels.append(label)
    return labels


def _ad_product_row_summary(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "campaign_name": _string(row.get("campaign_name") or row.get("campaign_id")),
        "ad_group_name": _string(row.get("ad_group_name") or row.get("ad_group_id") or row.get("group_id")),
        "asin": _string(row.get("asin")),
        "spend": _number(row.get("spend") if row.get("spend") is not None else row.get("cost")),
        "clicks": _int(row.get("clicks")) or 0,
        "orders": _int(row.get("orders")) or 0,
        "sales": _number(row.get("sales")),
        "acos": _number(row.get("acos")),
        "cvr": _number(row.get("cvr")),
    }


def _normalized_product_scope_id(product_scope_id: str | None) -> str | None:
    scope_id = str(product_scope_id or "").strip()
    if not scope_id or scope_id == "all":
        return None
    return scope_id


def _is_actionable_product_scope_id(product_scope_id: Any) -> bool:
    scope_id = str(product_scope_id or "").strip()
    return scope_id.startswith(ACTIONABLE_PRODUCT_SCOPE_PREFIXES)


def _product_scope_gate(product_scope_id: Any, candidate_pool_count: int) -> dict[str, Any]:
    scope_id = str(product_scope_id or "").strip()
    if _is_actionable_product_scope_id(scope_id):
        return {
            "status": "ready",
            "is_actionable": True,
            "selected_product_scope_id": scope_id,
            "candidate_pool_count": candidate_pool_count,
            "message": "已锁定 Parent ASIN / ASIN 经营对象，可进入广告证据下钻和人工确认。",
        }
    if scope_id == "unattributed":
        message = (
            f"当前是未归因广告数据入口，候选池 {candidate_pool_count} 个只用于补对象关系；"
            "先把广告数据归到 Parent ASIN / ASIN 后，再生成可处理建议。"
        )
    elif scope_id.startswith("sales_asin:"):
        message = (
            f"当前是销售背景 ASIN，候选池 {candidate_pool_count} 个只用于解释经营盘子；"
            "广告 AI 信号必须从 Parent ASIN 或已有广告数据的广告 ASIN 进入。"
        )
    else:
        message = (
            f"当前是全量排查入口，候选池 {candidate_pool_count} 个只用于口径校准；"
            "先选择 Parent ASIN / ASIN 经营对象，再下钻广告组、投放词、搜索词和广告位证据。"
        )
    return {
        "status": "requires_product_scope",
        "is_actionable": False,
        "selected_product_scope_id": scope_id or None,
        "candidate_pool_count": candidate_pool_count,
        "message": message,
    }


def _filter_signals_by_product_scope(
    signals: list[Any],
    product_scope_id: str | None,
    product_scope: Any,
    *,
    signal_rows: list[dict[str, Any]] | None = None,
) -> list[Any]:
    if not product_scope_id:
        return signals
    parent_scope_ids_by_ad_context = _parent_scope_ids_by_ad_context(product_scope, signal_rows or [])
    scoped_signals: list[Any] = []
    for signal in signals:
        if _string(_get(signal, "signal_category")) == "data_quality":
            continue
        scope_ids = _signal_product_scope_ids(signal, product_scope, parent_scope_ids_by_ad_context=parent_scope_ids_by_ad_context)
        if product_scope_id == "unattributed":
            if not scope_ids:
                scoped_signals.append(signal)
            continue
        if product_scope_id in scope_ids:
            scoped_signals.append(signal)
    return scoped_signals


def _parent_scope_ids_by_ad_context(product_scope: Any, signal_rows: list[dict[str, Any]]) -> dict[tuple[str, str], set[str]]:
    parent_scopes = [
        option
        for option in (_get(product_scope, "options") or [])
        if _string(_get(option, "scope_type")) == "parent_asin" and _string(_get(option, "scope_id"))
    ]
    if not parent_scopes:
        return {}

    parent_scope_by_child_asin: dict[str, set[str]] = {}
    for option in parent_scopes:
        scope_id = _string(_get(option, "scope_id"))
        for asin in (_get(option, "child_asins") or []):
            child_asin = _string(asin)
            if child_asin:
                parent_scope_by_child_asin.setdefault(child_asin, set()).add(scope_id)

    context_map: dict[tuple[str, str], set[str]] = {}
    for row in signal_rows:
        if _string(row.get("source_table")) != "advertised_products":
            continue
        asin = _string(row.get("asin"))
        if not asin or asin not in parent_scope_by_child_asin:
            continue
        context_key = _scope_context_key(row)
        if not context_key:
            continue
        context_map.setdefault(context_key, set()).update(parent_scope_by_child_asin[asin])
    return context_map


def _signal_product_scope_ids(
    signal: Any,
    product_scope: Any,
    *,
    parent_scope_ids_by_ad_context: dict[tuple[str, str], set[str]] | None = None,
) -> set[str]:
    scope_ids: set[str] = set()
    asins: set[str] = set()
    parent_scope_ids_by_ad_context = parent_scope_ids_by_ad_context or {}
    evidence = _get(signal, "evidence") or {}
    primary_object = _get(evidence, "primary_object") or {}
    primary_asin = _string(_get(primary_object, "asin"))
    primary_parent_asin = _string(_get(primary_object, "parent_asin"))
    object_type = _string(_get(signal, "object_type"))

    if primary_asin:
        asins.add(primary_asin)
        if object_type == "sales_product":
            scope_ids.add(f"sales_asin:{primary_asin}")
        if object_type == "advertised_product":
            scope_ids.add(f"ad_asin:{primary_asin}")
    if primary_parent_asin:
        scope_ids.add(f"parent_asin:{primary_parent_asin}")

    for row in _get(evidence, "source_rows") or []:
        asin = _string(_get(row, "asin"))
        parent_asin = _source_parent_asin(row)
        if parent_asin:
            scope_ids.add(f"parent_asin:{parent_asin}")
        context_key = _scope_context_key(row)
        if context_key and context_key in parent_scope_ids_by_ad_context:
            scope_ids.update(parent_scope_ids_by_ad_context[context_key])
        if not asin:
            continue
        asins.add(asin)
        source_table = _string(_get(row, "source_table"))
        if source_table == "sales_product_daily_metrics":
            scope_ids.add(f"sales_asin:{asin}")
        if source_table == "advertised_products":
            scope_ids.add(f"ad_asin:{asin}")

    for option in _get(product_scope, "options") or []:
        if _string(_get(option, "scope_type")) != "parent_asin":
            continue
        child_asins = {str(asin) for asin in (_get(option, "child_asins") or []) if asin}
        if asins & child_asins:
            scope_id = _string(_get(option, "scope_id"))
            if scope_id:
                scope_ids.add(scope_id)

    return scope_ids


def _product_scope_drilldown(product_scope_id: str | None, product_scope: Any, signal_rows: list[dict[str, Any]]) -> dict[str, Any] | None:
    if not product_scope_id or not _is_actionable_product_scope_id(product_scope_id):
        return None
    option = next((_get(option, "scope_id") and option for option in (_get(product_scope, "options") or []) if _string(_get(option, "scope_id")) == product_scope_id), None)
    if option is None:
        return None
    scope_type = _string(_get(option, "scope_type"))
    asins = _product_scope_asins(option)
    if not asins:
        return None
    ad_rows = [
        row
        for row in signal_rows
        if _string(row.get("source_table")) == "advertised_products" and _string(row.get("asin")) in asins
    ]
    items = [_product_scope_ad_asin_drilldown(asin, rows, signal_rows) for asin, rows in _group_ad_rows_by_asin(ad_rows).items()]
    items = sorted(items, key=lambda item: (_number(item.get("spend")) or 0, _int(item.get("orders")) or 0), reverse=True)
    ad_group_diagnosis = _product_scope_ad_group_diagnosis(ad_rows, signal_rows)
    summary = (
        f"当前商品范围广告 ASIN {len(items)} 个，广告花费 {_format_amount(sum(_number(item.get('spend')) or 0 for item in items))}，"
        f"广告订单 {sum(_int(item.get('orders')) or 0 for item in items)}；"
        "先看广告 ASIN，再下钻广告组、投放词、搜索词和广告位。"
        if items
        else "当前商品范围没有广告 ASIN 投放行，不能生成广告对象级处理建议。"
    )
    return {
        "scope_id": product_scope_id,
        "scope_type": scope_type,
        "status": "ready" if items else "empty",
        "advertised_asin_count": len(items),
        "items": items[:6],
        "ad_group_diagnosis": ad_group_diagnosis[:6],
        "candidate_gap_analysis": _product_scope_candidate_gap_analysis(items[:6], ad_group_diagnosis[:6]),
        "summary": summary,
        "boundary": "广告 ASIN 指标来自 advertised_products；搜索词和广告位只说明同广告组上下文，不能自动归因到单个 ASIN，也不能自动执行广告动作。",
    }


def _product_scope_asins(option: Any) -> set[str]:
    child_asins = {_string(asin) for asin in (_get(option, "child_asins") or []) if _string(asin)}
    asin = _string(_get(option, "asin"))
    if asin:
        child_asins.add(asin)
    return child_asins


def _group_ad_rows_by_asin(ad_rows: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    grouped: dict[str, list[dict[str, Any]]] = {}
    for row in ad_rows:
        asin = _string(row.get("asin"))
        if asin:
            grouped.setdefault(asin, []).append(row)
    return grouped


def _product_scope_ad_asin_drilldown(asin: str, ad_rows: list[dict[str, Any]], signal_rows: list[dict[str, Any]]) -> dict[str, Any]:
    row_summaries = [_ad_product_row_summary(row) for row in ad_rows]
    metrics = _ad_product_metric_summary(row_summaries, basis="product_scope_ad_asin")
    top_group = _top_ad_group_for_scope(ad_rows, signal_rows)
    return {
        "asin": asin,
        "spend": metrics["spend"],
        "clicks": metrics["clicks"],
        "orders": metrics["orders"],
        "sales": metrics["sales"],
        "acos": metrics["acos"],
        "cvr": metrics["cvr"],
        "ad_product_row_count": len(ad_rows),
        "top_ad_group": top_group,
        "next_review_focus": _product_scope_next_review_focus(top_group),
    }


def _product_scope_candidate_gap_analysis(items: list[dict[str, Any]], ad_group_diagnosis: list[dict[str, Any]]) -> dict[str, Any] | None:
    if not items:
        return None

    checks = [_product_scope_candidate_gap_check(item, ad_group_diagnosis) for item in items]
    return {
        "status": "diagnostic_only",
        "summary": "广告 ASIN 层没有命中可人工确认候选；搜索词候选按广告组上下文另行准入，不自动归因到单个 ASIN。",
        "checks": checks,
        "boundary": "candidate_count=0，不写人工动作；候选缺口只解释为什么不能进入人工确认。",
    }


def _product_scope_candidate_gap_check(item: dict[str, Any], ad_group_diagnosis: list[dict[str, Any]]) -> dict[str, Any]:
    asin = _string(item.get("asin")) or "未知 ASIN"
    spend = _number(item.get("spend")) or 0
    clicks = _int(item.get("clicks")) or 0
    orders = _int(item.get("orders")) or 0
    acos = _number(item.get("acos"))
    stable_opportunity = (
        clicks >= AD_PRODUCT_MIN_STABLE_CLICKS
        and orders >= AD_PRODUCT_MIN_STABLE_ORDERS
        and acos is not None
        and acos <= AD_PRODUCT_MAX_STABLE_ACOS
    )
    top_group = _dict(item.get("top_ad_group"))
    group_name = _string(top_group.get("ad_group_name") or top_group.get("ad_group_id"))
    group_diagnosis = next(
        (
            diagnosis
            for diagnosis in ad_group_diagnosis
            if group_name and _string(diagnosis.get("ad_group_name") or diagnosis.get("ad_group_id")) == group_name
        ),
        None,
    )
    diagnosis_label = _string(_dict(group_diagnosis).get("diagnosis_label")) or "诊断"
    next_focus = _string(_dict(group_diagnosis).get("next_review_focus")) or _string(item.get("next_review_focus")) or "继续下钻广告组、搜索词和广告位。"
    return {
        "object_type": "advertised_product",
        "object_id": asin,
        "object_label": asin,
        "result": "诊断不准入",
        "anomaly_check": _product_scope_anomaly_gap_text(clicks=clicks, orders=orders, acos=acos),
        "opportunity_check": _product_scope_opportunity_gap_text(
            clicks=clicks,
            orders=orders,
            acos=acos,
            stable_opportunity=stable_opportunity,
        ),
        "diagnosis_context": f"{group_name or '当前广告组'} 为{diagnosis_label}；广告 ASIN 花费 {_format_amount(spend)}，未进入人工动作候选。",
        "next_review_focus": next_focus,
    }


def _product_scope_anomaly_gap_text(*, clicks: int, orders: int, acos: float | None) -> str:
    if clicks < AD_PRODUCT_ANOMALY_MIN_CLICKS:
        return f"未触发广告 ASIN 异常：点击 {clicks} 低于异常判断阈值 {AD_PRODUCT_ANOMALY_MIN_CLICKS}。"
    if orders > AD_PRODUCT_ANOMALY_MAX_WEAK_ORDERS and (acos is None or acos < AD_PRODUCT_ANOMALY_HIGH_ACOS):
        return (
            f"未触发广告 ASIN 异常：订单 {orders} 高于弱订单阈值 {AD_PRODUCT_ANOMALY_MAX_WEAK_ORDERS}，"
            f"ACOS {_format_ratio(acos, empty_text='缺失')} 低于高 ACOS 阈值 {_format_ratio(AD_PRODUCT_ANOMALY_HIGH_ACOS, empty_text='缺失')}。"
        )
    return "广告 ASIN 异常规则未准入：当前指标未同时满足弱订单或高 ACOS 的可处理条件。"


def _product_scope_opportunity_gap_text(*, clicks: int, orders: int, acos: float | None, stable_opportunity: bool) -> str:
    if stable_opportunity:
        return "达到稳定转化广告指标，但稳定转化机会规则暂缓：缺库存、利润、价格、主推策略等独立证据，不能只凭单周期广告转化给扩量建议。"
    return (
        "未触发稳定转化机会："
        f"点击 {clicks} / 订单 {orders} / ACOS {_format_ratio(acos, empty_text='缺失')} "
        f"未同时满足点击 {AD_PRODUCT_MIN_STABLE_CLICKS}+、订单 {AD_PRODUCT_MIN_STABLE_ORDERS}+、"
        f"ACOS <= {_format_ratio(AD_PRODUCT_MAX_STABLE_ACOS, empty_text='缺失')}。"
    )


def _product_scope_ad_group_diagnosis(ad_rows: list[dict[str, Any]], signal_rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    grouped: dict[tuple[str, str], dict[str, Any]] = {}
    for row in ad_rows:
        key = _scope_context_key(row)
        if not key:
            continue
        item = grouped.setdefault(
            key,
            {
                "campaign_id": _string(row.get("campaign_id")),
                "campaign_name": _string(row.get("campaign_name")),
                "ad_group_id": _string(row.get("ad_group_id") or row.get("group_id")),
                "ad_group_name": _string(row.get("ad_group_name") or row.get("ad_group_id") or row.get("group_id")),
                "spend": 0.0,
                "clicks": 0,
                "orders": 0,
                "sales": 0.0,
                "ad_product_row_count": 0,
                "current_scope_advertised_asins": set(),
            },
        )
        item["spend"] = round(item["spend"] + (_number(row.get("spend") if row.get("spend") is not None else row.get("cost")) or 0), 2)
        item["clicks"] += _int(row.get("clicks")) or 0
        item["orders"] += _int(row.get("orders")) or 0
        item["sales"] = round(item["sales"] + (_number(row.get("sales")) or 0), 2)
        item["ad_product_row_count"] += 1
        asin = _string(row.get("asin"))
        if asin:
            item["current_scope_advertised_asins"].add(asin)

    diagnosed = [_ad_group_diagnosis_item(item, signal_rows) for item in grouped.values()]
    return sorted(diagnosed, key=lambda item: (_number(item.get("spend")) or 0, _int(item.get("orders")) or 0), reverse=True)


def _ad_group_diagnosis_item(item: dict[str, Any], signal_rows: list[dict[str, Any]]) -> dict[str, Any]:
    context_key = _scope_context_key(item)
    campaign_key = _scope_campaign_key(item)
    search_rows = [
        row
        for row in signal_rows
        if _string(row.get("source_table")) == "ad_search_term_daily_metrics" and _scope_context_key(row) == context_key
    ]
    placement_rows = [
        row
        for row in signal_rows
        if _string(row.get("source_table")) == "ad_placement_daily_metrics" and _scope_context_key(row) == context_key
    ]
    campaign_placement_rows = [
        row
        for row in signal_rows
        if _string(row.get("source_table")) == "ad_placement_daily_metrics" and _scope_campaign_key(row) == campaign_key
    ]
    same_group_ad_rows = [
        row
        for row in signal_rows
        if _string(row.get("source_table")) == "advertised_products" and _scope_context_key(row) == context_key
    ]
    effective_search_terms = _scope_search_term_summaries([row for row in search_rows if (_int(row.get("orders")) or 0) > 0], order_key="orders")
    zero_order_search_terms = _scope_search_term_summaries(
        [row for row in search_rows if (_int(row.get("orders")) or 0) == 0 and (_number(row.get("spend")) or 0) > 0],
        order_key="spend",
    )
    same_group_asins = _scope_ad_group_asins(same_group_ad_rows)
    diagnosis = _ad_group_diagnosis_status(
        item=item,
        search_rows=search_rows,
        placement_rows=placement_rows,
        campaign_placement_rows=campaign_placement_rows,
        zero_order_search_terms=zero_order_search_terms,
    )
    spend = _number(item.get("spend")) or 0
    clicks = _int(item.get("clicks")) or 0
    orders = _int(item.get("orders")) or 0
    sales = _number(item.get("sales")) or 0
    return {
        "campaign_id": item["campaign_id"],
        "campaign_name": item["campaign_name"],
        "ad_group_id": item["ad_group_id"],
        "ad_group_name": item["ad_group_name"],
        "spend": round(spend, 2),
        "clicks": clicks,
        "orders": orders,
        "sales": round(sales, 2),
        "acos": round(spend / sales, 4) if sales > 0 else None,
        "cvr": round(orders / clicks, 4) if clicks > 0 else None,
        "ad_product_row_count": _int(item.get("ad_product_row_count")) or 0,
        "current_scope_advertised_asin_count": len(item.get("current_scope_advertised_asins") or []),
        "ad_group_advertised_asin_count": len(same_group_asins),
        "ad_group_advertised_asins": same_group_asins,
        "search_term_count": len(search_rows),
        "effective_search_term_count": len(effective_search_terms),
        "zero_order_search_term_count": len(zero_order_search_terms),
        "placement_count": len(placement_rows),
        "campaign_placement_count": len(campaign_placement_rows),
        "placement_context_level": "ad_group" if placement_rows else ("campaign" if campaign_placement_rows else "missing"),
        "diagnosis_status": diagnosis["status"],
        "diagnosis_label": diagnosis["label"],
        "problem_type": diagnosis["problem_type"],
        "reason": diagnosis["reason"],
        "evidence": diagnosis["evidence"],
        "next_review_focus": diagnosis["next_review_focus"],
        "attribution_boundary": _scope_ad_group_attribution_boundary(len(same_group_asins)),
        "forbidden_actions": ["自动调价", "自动暂停广告", "自动否词", "自动新增关键词"],
        "search_term_diagnosis": _ad_group_search_term_diagnosis(
            effective_search_terms=effective_search_terms,
            zero_order_search_terms=zero_order_search_terms,
            next_review_focus=diagnosis["next_review_focus"],
        ),
    }


def _ad_group_diagnosis_status(
    *,
    item: dict[str, Any],
    search_rows: list[dict[str, Any]],
    placement_rows: list[dict[str, Any]],
    campaign_placement_rows: list[dict[str, Any]],
    zero_order_search_terms: list[dict[str, Any]],
) -> dict[str, str]:
    spend = _number(item.get("spend")) or 0
    clicks = _int(item.get("clicks")) or 0
    orders = _int(item.get("orders")) or 0
    ad_group_name = _string(item.get("ad_group_name")) or "当前广告组"
    if spend > 0 and orders == 0:
        return {
            "status": "suspected_waste",
            "label": "疑似浪费",
            "problem_type": "花费浪费",
            "reason": f"{ad_group_name} 有花费 {_format_amount(spend)} 但订单为 0，先复核投放词、搜索词和 Listing 承接。",
            "evidence": f"花费 {_format_amount(spend)} / 点击 {clicks} / 订单 {orders}",
            "next_review_focus": "先看无订单花费词和广告位上下文；满足候选准入前不写人工动作。",
        }
    if clicks >= 50 and orders <= 1:
        return {
            "status": "suspected_conversion_gap",
            "label": "疑似承接不足",
            "problem_type": "销售承接不足",
            "reason": f"{ad_group_name} 点击 {clicks} 但订单 {orders}，优先复核商品承接和搜索词相关性。",
            "evidence": f"点击 {clicks} / 订单 {orders} / 花费 {_format_amount(spend)}",
            "next_review_focus": "先核对广告 ASIN、Listing 承接和搜索词意图，不直接调整广告动作。",
        }
    if not search_rows and not placement_rows and not campaign_placement_rows:
        return {
            "status": "data_gap",
            "label": "数据不足",
            "problem_type": "数据质量缺口",
            "reason": f"{ad_group_name} 缺少搜索词和广告位上下文，只能看广告商品指标。",
            "evidence": f"广告商品行 {_int(item.get('ad_product_row_count')) or 0} / 搜索词 0 / 广告位 0",
            "next_review_focus": "先补齐搜索词或广告位证据，再判断广告组问题。",
        }
    if zero_order_search_terms:
        return {
            "status": "observe",
            "label": "观察",
            "problem_type": "投放结构失衡",
            "reason": f"{ad_group_name} 整体有订单，但存在 {len(zero_order_search_terms)} 个无订单花费词样本，适合继续下钻观察。",
            "evidence": f"订单 {orders} / 无订单花费词 {len(zero_order_search_terms)} / 搜索词 {len(search_rows)}",
            "next_review_focus": "优先比较有效搜索词和无订单花费词；没有候选准入前只做诊断。",
        }
    return {
        "status": "healthy",
        "label": "健康",
        "problem_type": "暂无明显异常",
        "reason": f"{ad_group_name} 当前广告商品、搜索词或广告位上下文未显示明显异常。",
        "evidence": f"花费 {_format_amount(spend)} / 点击 {clicks} / 订单 {orders}",
        "next_review_focus": "保持观察；若业务认为仍有问题，补充策略资料或调整规则阈值。",
    }


def _top_ad_group_for_scope(ad_rows: list[dict[str, Any]], signal_rows: list[dict[str, Any]]) -> dict[str, Any] | None:
    grouped: dict[tuple[str, str], dict[str, Any]] = {}
    for row in ad_rows:
        key = _scope_context_key(row)
        if not key:
            continue
        item = grouped.setdefault(
            key,
            {
                "campaign_id": _string(row.get("campaign_id")),
                "campaign_name": _string(row.get("campaign_name")),
                "ad_group_id": _string(row.get("ad_group_id") or row.get("group_id")),
                "ad_group_name": _string(row.get("ad_group_name") or row.get("ad_group_id") or row.get("group_id")),
                "spend": 0.0,
                "clicks": 0,
                "orders": 0,
                "sales": 0.0,
                "ad_product_row_count": 0,
            },
        )
        item["spend"] = round(item["spend"] + (_number(row.get("spend") if row.get("spend") is not None else row.get("cost")) or 0), 2)
        item["clicks"] += _int(row.get("clicks")) or 0
        item["orders"] += _int(row.get("orders")) or 0
        item["sales"] = round(item["sales"] + (_number(row.get("sales")) or 0), 2)
        item["ad_product_row_count"] += 1
    if not grouped:
        return None
    top_group = sorted(grouped.values(), key=lambda item: (item["spend"], item["orders"], item["sales"]), reverse=True)[0]
    context_key = _scope_context_key(top_group)
    campaign_key = _scope_campaign_key(top_group)
    search_rows = [
        row
        for row in signal_rows
        if _string(row.get("source_table")) == "ad_search_term_daily_metrics" and _scope_context_key(row) == context_key
    ]
    placement_rows = [
        row
        for row in signal_rows
        if _string(row.get("source_table")) == "ad_placement_daily_metrics" and _scope_context_key(row) == context_key
    ]
    campaign_placement_rows = [
        row
        for row in signal_rows
        if _string(row.get("source_table")) == "ad_placement_daily_metrics" and _scope_campaign_key(row) == campaign_key
    ]
    same_group_ad_rows = [
        row
        for row in signal_rows
        if _string(row.get("source_table")) == "advertised_products" and _scope_context_key(row) == context_key
    ]
    same_group_asins = _scope_ad_group_asins(same_group_ad_rows)
    top_group["search_term_count"] = len(search_rows)
    top_group["placement_count"] = len(placement_rows)
    top_group["campaign_placement_count"] = len(campaign_placement_rows)
    top_group["ad_group_advertised_asin_count"] = len(same_group_asins)
    top_group["ad_group_advertised_asins"] = same_group_asins
    top_group["ad_group_attribution_boundary"] = _scope_ad_group_attribution_boundary(len(same_group_asins))
    top_group["effective_search_terms"] = _scope_search_term_summaries([row for row in search_rows if (_int(row.get("orders")) or 0) > 0], order_key="orders")
    top_group["zero_order_search_terms"] = _scope_search_term_summaries([row for row in search_rows if (_int(row.get("orders")) or 0) == 0 and (_number(row.get("spend")) or 0) > 0], order_key="spend")
    top_group["placement_context_level"] = "ad_group" if placement_rows else ("campaign" if campaign_placement_rows else "missing")
    return top_group


def _scope_context_key(row: Any) -> tuple[str, str] | None:
    campaign_key = _scope_campaign_key(row)
    ad_group_key = _string(_get(row, "ad_group_id") or _get(row, "group_id")) or _string(_get(row, "ad_group_name"))
    if not campaign_key or not ad_group_key:
        return None
    return (campaign_key, ad_group_key)


def _scope_campaign_key(row: Any) -> str:
    return _string(_get(row, "campaign_id")) or _string(_get(row, "campaign_name"))


def _scope_ad_group_asins(rows: list[dict[str, Any]]) -> list[str]:
    asin_spend: dict[str, float] = {}
    for row in rows:
        asin = _string(row.get("asin"))
        if not asin:
            continue
        asin_spend[asin] = round(asin_spend.get(asin, 0.0) + (_number(row.get("spend") if row.get("spend") is not None else row.get("cost")) or 0), 2)
    return sorted(asin_spend, key=lambda asin: (asin_spend[asin], asin), reverse=True)[:8]


def _scope_ad_group_attribution_boundary(advertised_asin_count: int) -> str:
    if advertised_asin_count > 1:
        return f"同广告组投放 {advertised_asin_count} 个广告 ASIN；搜索词和广告位只能说明广告组上下文，不能自动归因到单个 ASIN。"
    if advertised_asin_count == 1:
        return "同广告组当前只识别到 1 个广告 ASIN；搜索词和广告位仍按广告组上下文解释，不能绕过人工确认。"
    return "同广告组投放商品结构缺失；只能先核对广告组和广告商品数据。"


def _scope_search_term_summaries(rows: list[dict[str, Any]], *, order_key: str) -> list[dict[str, Any]]:
    sorted_rows = sorted(rows, key=lambda row: (_number(row.get(order_key)) or 0, _number(row.get("spend")) or 0), reverse=True)
    return [
        {
            "search_term": _string(row.get("search_term")) or _string(row.get("normalized_query")) or "未知搜索词",
            "targeting_text": _string(row.get("targeting_text")),
            "term_type": _search_term_type(_string(row.get("search_term")) or _string(row.get("normalized_query"))),
            "spend": _number(row.get("spend")) or 0,
            "clicks": _int(row.get("clicks")) or 0,
            "orders": _int(row.get("orders")) or 0,
            "sales": _number(row.get("sales")) or 0,
        }
        for row in sorted_rows[:3]
    ]


def _search_term_type(search_term: str) -> str:
    compact = search_term.strip().lower()
    if len(compact) == 10 and compact.startswith("b") and compact.isalnum():
        return "asin_like"
    return "regular"


def _ad_group_search_term_diagnosis(
    *,
    effective_search_terms: list[dict[str, Any]],
    zero_order_search_terms: list[dict[str, Any]],
    next_review_focus: str,
) -> dict[str, Any]:
    return {
        "term_summary": f"有效搜索词 {len(effective_search_terms)} 条 / 无订单花费词 {len(zero_order_search_terms)} 条",
        "effective_terms": effective_search_terms,
        "zero_order_terms": zero_order_search_terms,
        "term_boundary": (
            "搜索词只说明同广告组上下文，不能自动归因到单个 ASIN；"
            "ASIN 型搜索词只能作为商品定向或自动投放上下文复核，不包装成关键词加词建议。"
        ),
        "next_review_focus": next_review_focus,
        "forbidden_actions": ["自动调价", "自动暂停广告", "自动否词", "自动新增关键词"],
    }


def _product_scope_next_review_focus(top_group: dict[str, Any] | None) -> str:
    if not top_group:
        return "先确认当前广告 ASIN 是否有广告组投放行。"
    ad_group_name = _string(top_group.get("ad_group_name")) or "优先广告组"
    if _int(top_group.get("search_term_count")):
        return f"优先复核 {ad_group_name} 的投放词和搜索词分化。"
    if _int(top_group.get("campaign_placement_count")):
        return f"优先复核 {ad_group_name}，并注意广告位只有同广告活动上下文，不能直接归因到广告组。"
    return f"优先复核 {ad_group_name}，当前缺少搜索词和广告位下游上下文。"


def _source_parent_asin(row: Any) -> str:
    return (
        _string(_get(row, "parent_asin"))
        or _string(_get(row, "parentAsin"))
        or _string(_get(row, "variation_asin"))
        or _string(_get(row, "variationAsin"))
    )


def _recommendation_score(candidate: dict[str, Any], product_scope: Any) -> tuple[int, int, int, int]:
    object_type = str(candidate.get("object_type") or "")
    product_context = _product_context_for_candidate(candidate, product_scope)
    object_score = {
        "advertised_product": 80,
        "sales_product": 70,
        "search_term": 50,
        "placement": 40,
        "ad_group": 30,
    }.get(object_type, 0)
    if object_type == "sales_product" and str(candidate.get("signal_category") or "") == "product_ad_coverage":
        object_score += 15
    if product_context.get("parent_asin"):
        object_score += 30
    strategy_score = 0 if product_context.get("strategy_notes") else 10
    priority_score = PRIORITY_SCORE.get(str(candidate.get("priority") or ""), 0)
    return (object_score, strategy_score, _int(candidate.get("severity")) or 0, priority_score)


def _recommendation_reason(candidate: dict[str, Any], product_scope: Any, layers: list[dict[str, Any]] | None = None) -> str:
    product_context = _product_context_for_candidate(candidate, product_scope)
    object_label = str(candidate.get("object_label") or candidate.get("object_id") or "候选对象")
    parent_asin = product_context.get("parent_asin")
    strategy_notes = product_context.get("strategy_notes") or []
    if parent_asin:
        strategy_text = "无主推款策略备注" if not strategy_notes else "存在主推款策略备注，需人工复核策略边界"
        base = f"推荐 {object_label}：属于 Parent ASIN {parent_asin}，{strategy_text}，更贴近 Parent ASIN / ASIN 经营商品入口。"
        return _append_layer_reason(base, layers)
    if candidate.get("object_type") == "search_term":
        return _append_layer_reason(
            f"推荐 {object_label}：这是搜索词候选；进入 Parent 商品范围时只表示同广告组上下文，不能自动归因到单个 ASIN，处理前必须人工复核投放词、搜索词和广告商品关系。",
            layers,
        )
    if candidate.get("object_type") == "advertised_product":
        return _append_layer_reason(f"推荐 {object_label}：这是广告 ASIN 候选，比广告位或全局对象更接近经营商品入口。", layers)
    return _append_layer_reason(f"推荐 {object_label}：当前没有可匹配 Parent ASIN 的广告 ASIN 候选，先按优先级和严重度选择该对象。", layers)


def _candidate_layers(candidates: list[dict[str, Any]], product_scope: Any) -> list[dict[str, Any]]:
    grouped: dict[str, list[dict[str, Any]]] = {str(definition["layer_id"]): [] for definition in CANDIDATE_LAYER_DEFINITIONS}
    for candidate in candidates:
        grouped[_candidate_layer_id(candidate, product_scope)].append(candidate)

    layers: list[dict[str, Any]] = []
    for definition in CANDIDATE_LAYER_DEFINITIONS:
        layer_id = str(definition["layer_id"])
        layer_candidates = grouped[layer_id]
        ranked = sorted(layer_candidates, key=lambda item: _recommendation_score(item, product_scope), reverse=True)
        layers.append(
            {
                "layer_id": layer_id,
                "label": definition["label"],
                "reason": definition["reason"],
                "count": len(layer_candidates),
                "top_candidates": [_candidate_summary(candidate) for candidate in ranked[:3]],
            }
        )
    return layers


def _candidate_layer_id(candidate: dict[str, Any], product_scope: Any) -> str:
    product_context = _product_context_for_candidate(candidate, product_scope)
    if candidate.get("object_type") == "ad_group":
        return "ad_group_structure_boundary"
    if product_context.get("strategy_notes"):
        return "strategy_boundary"
    if candidate.get("object_type") == "sales_product" or candidate.get("signal_category") == "product_ad_coverage":
        return "sales_strong_ad_weak"
    if candidate.get("object_type") == "search_term":
        return "search_term_context"
    return "advertised_asin_opportunity"


def _append_layer_reason(base: str, layers: list[dict[str, Any]] | None) -> str:
    if not layers:
        return base
    counts = {str(layer.get("layer_id")): _int(layer.get("count")) or 0 for layer in layers}
    return (
        f"{base} 本轮候选分层：销售强广告弱 {counts.get('sales_strong_ad_weak', 0)} 个，"
        f"搜索词候选 {counts.get('search_term_context', 0)} 个，"
        f"广告 ASIN 待处理 {counts.get('advertised_asin_opportunity', 0)} 个，"
        f"策略主推边界 {counts.get('strategy_boundary', 0)} 个，"
        f"广告组结构边界 {counts.get('ad_group_structure_boundary', 0)} 个；"
        "搜索词候选先复核投放词、广告商品和归因边界，广告 ASIN 候选再进入商品级处理；销售强广告弱先复核广告承接，策略主推边界先复核人工策略，广告组只作为结构和归因边界复核。"
    )


def _product_context_for_candidate(candidate: dict[str, Any], product_scope: Any) -> dict[str, Any]:
    candidate_ids = {
        str(value).strip().casefold()
        for value in (
            candidate.get("asin"),
            candidate.get("stable_object_id"),
            candidate.get("object_label"),
            candidate.get("object_id"),
        )
        if str(value or "").strip()
    }
    if not candidate_ids:
        return {}
    options = list(_get(product_scope, "options") or [])
    ad_option = next(
        (
            option
            for option in options
            if str(_get(option, "scope_type") or "") in {"advertised_asin", "sales_asin"}
            and str(_get(option, "asin") or "").strip().casefold() in candidate_ids
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
                and candidate_ids
                & {
                    str(child_asin).strip().casefold()
                    for child_asin in list(_get(option, "child_asins") or [])
                    if str(child_asin or "").strip()
                }
            ),
            None,
        )
        parent_asin = _value(_get(parent_option, "parent_asin")) if parent_option else None
    return {"parent_asin": parent_asin, "strategy_notes": strategy_notes}


def _manual_action_preview(candidate: dict[str, Any] | None) -> dict[str, Any] | None:
    if not candidate:
        return None
    object_id = manual_action_object_id_for_values(
        object_type=str(candidate.get("object_type") or ""),
        object_id=str(candidate.get("object_id") or ""),
        asin=str(candidate.get("asin") or "") or None,
        msku=str(candidate.get("msku") or "") or None,
        sku=str(candidate.get("sku") or "") or None,
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
        "preflight_checklist": _manual_action_preflight_checklist(candidate, object_id),
        "note": "只读预检，不写 manual_actions.jsonl；必须由人工按钮触发后才会生成真实留痕。",
    }


def _manual_action_preflight_checklist(candidate: dict[str, Any], object_id: str | None) -> list[dict[str, Any]]:
    object_type = _string(candidate.get("object_type")) or "unknown"
    object_label = _string(candidate.get("object_label")) or _string(object_id) or "当前对象"
    checks = [
        {
            "check_id": "target_identity",
            "label": "确认复盘对象",
            "evidence": f"{object_type} / {object_id or object_label}",
            "required": True,
        }
    ]
    if object_type == "sales_product":
        checks.append(
            {
                "check_id": "ad_product_coverage",
                "label": "核对广告 ASIN 覆盖",
                "evidence": "销售表现广告订单不能直接等同于广告商品投放行；点击前先核对 advertised_products、非 SP 来源或数据缺口。",
                "required": True,
            }
        )
        checks.append(
            {
                "check_id": "business_boundary",
                "label": "核对库存 / 价格 / 策略边界",
                "evidence": "销售商品强不等于可自动加投；必须人工确认库存、价格、利润和主推策略。",
                "required": True,
            }
        )
    else:
        checks.append(
            {
                "check_id": "business_boundary",
                "label": "核对证据边界",
                "evidence": "只按当前证据定位人工处理对象；广告组、搜索词和广告位上下文不能自动归因到商品。",
                "required": True,
            }
        )
    checks.append(
        {
            "check_id": "manual_action_boundary",
            "label": "确认人工动作边界",
            "evidence": "只允许记录观察、标记已处理、加入复盘或忽略本次；不自动调价、暂停、否词或加词。",
            "required": True,
        }
    )
    return checks


def _requires_manual_confirmation(signal: Any) -> bool:
    suggested_action = _get(signal, "suggested_action") or {}
    value = _get(suggested_action, "requires_manual_confirmation")
    return True if value is None else bool(value)


def _candidate_mix(candidates: list[dict[str, Any]]) -> dict[str, dict[str, int]]:
    return {
        "by_object_type": _count_by(candidates, "object_type"),
        "by_priority": _count_by(candidates, "priority"),
        "by_signal_category": _count_by(candidates, "signal_category"),
        "by_confidence": _count_by(candidates, "confidence"),
        "by_freshness_status": _count_by(candidates, "freshness_status"),
    }


def _count_by(items: list[dict[str, Any]], key: str) -> dict[str, int]:
    counter = Counter(str(item.get(key) or "unknown") for item in items)
    return dict(sorted(counter.items()))


def _rank_candidates(candidates: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return sorted(
        candidates,
        key=lambda candidate: (
            PRIORITY_SCORE.get(str(candidate.get("priority") or ""), 0),
            _int(candidate.get("severity")) or 0,
            _int(candidate.get("evidence_count")) or 0,
        ),
        reverse=True,
    )


def _candidate_summary(candidate: dict[str, Any] | None) -> dict[str, Any] | None:
    if not candidate:
        return None
    summary = {
        "signal_id": candidate.get("signal_id"),
        "signal_type": candidate.get("signal_type"),
        "signal_category": candidate.get("signal_category"),
        "priority": candidate.get("priority"),
        "confidence": candidate.get("confidence"),
        "severity": _int(candidate.get("severity")) or 0,
        "shop_id": candidate.get("shop_id"),
        "shop_name": candidate.get("shop_name"),
        "market_id": candidate.get("market_id"),
        "marketplace": candidate.get("marketplace"),
        "object_type": candidate.get("object_type"),
        "object_id": candidate.get("object_id"),
        "stable_object_id": _stable_object_id(candidate),
        "object_label": candidate.get("object_label"),
        "summary": candidate.get("summary"),
        "uncertainty": candidate.get("uncertainty"),
        "evidence_count": _int(candidate.get("evidence_count")) or 0,
        "freshness_status": candidate.get("freshness_status"),
    }
    summary.update(_candidate_analysis_fields(candidate))
    return summary


def _candidate_analysis_fields(candidate: dict[str, Any]) -> dict[str, str]:
    return {
        "problem_type": _candidate_problem_type(candidate),
        "evidence_strength": _candidate_evidence_strength(candidate),
        "attribution_boundary": _candidate_attribution_boundary(candidate),
        "review_path": _candidate_review_path(candidate),
    }


def _candidate_problem_type(candidate: dict[str, Any]) -> str:
    category = str(candidate.get("signal_category") or "")
    if category in PROBLEM_TYPE_BY_CATEGORY:
        return PROBLEM_TYPE_BY_CATEGORY[category]
    signal_type = str(candidate.get("signal_type") or "")
    return PROBLEM_TYPE_BY_CATEGORY.get(signal_type, "未分类问题")


def _candidate_evidence_strength(candidate: dict[str, Any]) -> str:
    confidence = str(candidate.get("confidence") or "").lower()
    if confidence == "high":
        return "高"
    if confidence == "medium":
        return "中"
    if confidence == "low":
        return "低"
    return "中" if (_int(candidate.get("evidence_count")) or 0) >= 3 else "低"


def _candidate_attribution_boundary(candidate: dict[str, Any]) -> str:
    drilldown = candidate.get("evidence_drilldown")
    if isinstance(drilldown, dict):
        boundary = str(drilldown.get("boundary") or "").strip()
        if boundary:
            return boundary

    object_type = str(candidate.get("object_type") or "")
    if object_type == "advertised_product":
        return "分析对象落到广告 ASIN；搜索词、广告位和广告组只作上下文证据，不能自动归因到该 ASIN。"
    if object_type == "sales_product":
        return "分析对象落到销售商品；广告承接必须通过广告 ASIN 覆盖和销售表现共同验证。"
    if object_type == "search_term":
        return "搜索词只说明查询或投放表现，不能直接替代商品级结论。"
    if object_type == "placement":
        return "广告位只说明流量位置表现，不能直接归因到单个商品。"
    if object_type == "ad_group":
        return "广告组是投放容器，不是商品；只能作为结构复核对象，不能直接归因到单个商品。"
    return "归因边界待人工复核；不能把上下文证据直接当作业务对象结论。"


def _candidate_review_path(candidate: dict[str, Any]) -> str:
    suggested_action = candidate.get("suggested_action")
    requires_manual_confirmation = True
    if isinstance(suggested_action, dict) and suggested_action.get("requires_manual_confirmation") is not None:
        requires_manual_confirmation = bool(suggested_action.get("requires_manual_confirmation"))
    if str(candidate.get("signal_category") or "") in {"data_quality", "review_effect"}:
        return "不适用" if not requires_manual_confirmation else "待人工动作"
    if str(candidate.get("object_type") or "") in REVIEWABLE_OBJECT_TYPES and requires_manual_confirmation:
        return "待人工动作"
    return "不适用"


def _stable_object_id(candidate: dict[str, Any]) -> str | None:
    for key in ("asin", "msku", "sku", "object_label", "object_id"):
        value = candidate.get(key)
        if value:
            return str(value)
    return None


def _no_ready_review_message(readiness_payload: dict[str, Any]) -> str:
    details: list[str] = []
    seen: set[str] = set()
    effects = _dict_list(readiness_payload.get("effects"))
    wait_message = _not_due_review_wait_message(effects)
    if wait_message:
        return wait_message
    effects = _actionable_review_effects(effects)
    reviewable_object_types = {"advertised_product", "sales_product", "search_term", "placement"}
    window_order = {"7d": 0, "14d": 1}
    for effect in sorted(
        effects,
        key=lambda item: (
            0 if str(item.get("object_type") or "") in reviewable_object_types else 1,
            window_order.get(str(item.get("review_window") or ""), 99),
            str(item.get("message") or ""),
        ),
    ):
        if effect.get("status") == "ready":
            continue
        window = str(effect.get("review_window") or "").strip()
        message = str(effect.get("message") or "").strip()
        if not window or not message:
            continue
        detail = f"{window}：{message}"
        if detail in seen:
            continue
        seen.add(detail)
        details.append(detail)
    if not details:
        return "已有人工处理记录，但当前没有 ready 的 7/14 天复盘结果。"
    return f"已有人工处理记录，但当前没有 ready 的 7/14 天复盘结果。复盘阻塞：{'；'.join(details[:3])}。{_snapshot_gap_next_step(effects)}"


def _not_due_review_wait_message(effects: list[dict[str, Any]]) -> str | None:
    not_ready_effects = _metric_review_effects(effects)
    if not not_ready_effects or _actionable_review_effects(not_ready_effects):
        return None
    sorted_effects = sorted(not_ready_effects, key=_review_wait_priority)
    first_due_date = _date_part(str(sorted_effects[0].get("due_at") or ""))
    windows = _review_window_labels(sorted_effects)
    window_text = " / ".join(windows) if windows else "7 天 / 14 天"
    if first_due_date:
        return f"已有人工处理记录，但 {window_text}复盘窗口尚未到期；最早到 {first_due_date} 后再复核处理后指标，未到期前不拉取快照、不保存复盘结论。"
    return f"已有人工处理记录，但 {window_text}复盘窗口尚未到期；等待窗口完整后再复核处理后指标，未到期前不拉取快照、不保存复盘结论。"


def _review_wait_summary(effects: list[dict[str, Any]], ready_count: int) -> dict[str, Any]:
    not_ready_effects = [effect for effect in effects if effect.get("status") != "ready"]
    metric_not_ready_effects = _metric_review_effects(effects)
    wait_message = _not_due_review_wait_message(effects) if ready_count == 0 else None
    if not wait_message:
        return {
            "status": "ready" if ready_count else "waiting_review_todo" if not effects else "blocked_by_data_gap",
            "ready_count": ready_count,
            "not_ready_count": len(not_ready_effects),
            "earliest_due_at": None,
            "earliest_due_date": None,
            "review_windows": _review_window_labels(not_ready_effects),
            "next_object_type": None,
            "next_object_id": None,
            "next_object_label": None,
            "message": None,
            "next_step": None,
            "forbidden_actions": list(REVIEW_WAIT_FORBIDDEN_ACTIONS),
        }

    sorted_effects = sorted(metric_not_ready_effects, key=_review_wait_priority)
    first_effect = sorted_effects[0] if sorted_effects else {}
    earliest_due_at = str(first_effect.get("due_at") or "").strip() or None
    return {
        "status": "waiting_review_window",
        "ready_count": ready_count,
        "not_ready_count": len(not_ready_effects),
        "earliest_due_at": earliest_due_at,
        "earliest_due_date": _date_part(earliest_due_at or ""),
        "review_windows": _review_window_labels(sorted_effects),
        "next_object_type": first_effect.get("object_type"),
        "next_object_id": first_effect.get("object_id"),
        "next_object_label": first_effect.get("object_label") or first_effect.get("object_id"),
        "message": wait_message,
        "next_step": "等待复盘窗口完整后再复核处理后指标，未到期前不拉取快照、不保存复盘结论。",
        "forbidden_actions": list(REVIEW_WAIT_FORBIDDEN_ACTIONS),
    }


def _actionable_review_effects(effects: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [effect for effect in effects if effect.get("status") != "ready" and effect.get("is_due") is not False]


def _metric_review_effects(effects: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [
        effect
        for effect in effects
        if effect.get("status") != "ready" and str(effect.get("object_type") or "") in METRIC_REVIEW_OBJECT_TYPES
    ]


def _review_wait_priority(effect: dict[str, Any]) -> tuple[str, int, str]:
    due_at = str(effect.get("due_at") or "9999-12-31")
    window = str(effect.get("review_window") or "")
    window_order = {"7d": 0, "14d": 1}
    return (due_at, window_order.get(window, 99), window)


def _review_window_labels(effects: list[dict[str, Any]]) -> list[str]:
    labels: list[str] = []
    seen: set[str] = set()
    for effect in sorted(effects, key=_review_wait_priority):
        window = str(effect.get("review_window") or "")
        label = {"7d": "7 天", "14d": "14 天"}.get(window, window)
        if not label or label in seen:
            continue
        seen.add(label)
        labels.append(label)
    return labels


def _date_part(value: str) -> str:
    return value.split("T", 1)[0].strip()


def _blockers(
    *,
    candidate_count: int,
    top_limit: int,
    manual_preview: dict[str, Any] | None,
    readiness_payload: dict[str, Any],
) -> list[dict[str, str]]:
    blockers: list[dict[str, str]] = []
    if candidate_count == 0:
        blockers.append({"code": "no_review_candidate", "message": "当前没有可进入人工确认的广告对象级候选。"})
    if candidate_count > top_limit:
        blockers.append(
            {
                "code": "candidate_count_exceeds_top_limit",
                "message": f"候选数 {candidate_count} 大于本次展示上限 {top_limit}，需要先按优先级和严重度分诊。",
            }
        )
    if candidate_count and not manual_preview:
        blockers.append({"code": "missing_manual_action_preview", "message": "候选存在，但缺少只读人工动作预览。"})
    if (_int(readiness_payload.get("manual_action_identity_issue_count")) or 0) > 0:
        blockers.append({"code": "manual_action_identity_issue", "message": "存在人工动作对象身份不稳定问题，需先修复复盘口径。"})
    if (_int(readiness_payload.get("manual_action_count")) or 0) == 0:
        blockers.append({"code": "no_manual_action_recorded", "message": "暂无人工处理记录，无法进入 7/14 天复盘。"})
    elif (_int(readiness_payload.get("ready_count")) or 0) == 0 and (_int(readiness_payload.get("review_record_count")) or 0) == 0:
        blockers.append({"code": "no_ready_review_effect", "message": _no_ready_review_message(readiness_payload)})
    return blockers


def _manual_action_identity_issues(manual_actions: list[Any], signal_rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    row_by_id = _signal_row_index(signal_rows)
    issues: list[dict[str, Any]] = []
    for record in manual_actions:
        object_type = str(getattr(record, "object_type", "") or "")
        object_id = str(getattr(record, "object_id", "") or "")
        if object_type not in {"advertised_product", "sales_product"} or not _looks_like_snapshot_row_id(object_id):
            continue
        matched_row = row_by_id.get(object_id, {})
        suggested_object_id = _stable_product_object_id(matched_row) or _object_label_as_stable_id(record)
        issues.append(
            {
                "will_write": False,
                "action_id": getattr(record, "id", None),
                "signal_id": getattr(record, "signal_id", None),
                "market_id": getattr(record, "market_id", None),
                "object_type": object_type,
                "current_object_id": object_id,
                "object_label": getattr(record, "object_label", None),
                "suggested_object_id": suggested_object_id,
                "suggestion_source": "signal_row" if _stable_product_object_id(matched_row) else "object_label",
                "note": "只读诊断，不修改 manual_actions.jsonl；迁移历史人工动作必须人工确认。",
            }
        )
    return issues


def _recommended_manual_status(
    manual_preview: dict[str, Any] | None,
    readiness_payload: dict[str, Any],
    selected_market_id: int | None,
) -> dict[str, Any] | None:
    if not manual_preview:
        return None

    signal_id = str(manual_preview.get("signal_id") or "")
    shop_id = str(manual_preview.get("shop_id") or "").strip()
    market_id = _int(manual_preview.get("market_id")) or selected_market_id
    object_type = str(manual_preview.get("object_type") or "")
    object_id = str(manual_preview.get("object_id") or "")
    manual_actions = [record for record in load_manual_actions(signal_id or None, market_id=market_id) if _matches_shop(record, shop_id)]
    review_todos = [todo for todo in build_review_todos(signal_id or None, market_id=market_id) if _matches_shop(todo, shop_id)]
    if object_type and object_id:
        object_manual_actions = [
            record
            for record in load_manual_actions(market_id=market_id)
            if _matches_recommended_object(record, object_type=object_type, object_id=object_id, market_id=market_id, shop_id=shop_id)
        ]
        object_review_todos = [
            todo
            for todo in build_review_todos(market_id=market_id)
            if _matches_recommended_object(todo, object_type=object_type, object_id=object_id, market_id=market_id, shop_id=shop_id)
        ]
        if object_manual_actions:
            manual_actions = object_manual_actions
        if object_review_todos:
            review_todos = object_review_todos
    signal_effects = [
        effect
        for effect in _dict_list(readiness_payload.get("effects"))
        if ((not signal_id or str(effect.get("signal_id") or "") == signal_id) and _matches_shop(effect, shop_id))
        or (
            object_type
            and object_id
            and _matches_recommended_object(effect, object_type=object_type, object_id=object_id, market_id=market_id, shop_id=shop_id)
        )
    ]
    ready_review_count = sum(1 for effect in signal_effects if effect.get("status") == "ready")
    review_windows = [
        window
        for window in (_value(_get(todo, "review_window")) for todo in review_todos)
        if window
    ]

    return {
        "will_write": False,
        "signal_id": signal_id or None,
        "object_type": object_type or None,
        "object_id": object_id or None,
        "object_label": manual_preview.get("object_label"),
        "shop_id": shop_id or None,
        "shop_name": manual_preview.get("shop_name"),
        "market_id": market_id,
        "has_manual_action": bool(manual_actions),
        "manual_action_count": len(manual_actions),
        "has_review_todo": bool(review_todos),
        "review_todo_count": len(review_todos),
        "ready_review_count": ready_review_count,
        "review_windows": sorted({str(window) for window in review_windows}),
        "next_action": _recommended_manual_next_action(
            has_manual_action=bool(manual_actions),
            has_review_todo=bool(review_todos),
            ready_review_count=ready_review_count,
        ),
    }


def _matches_recommended_object(item: Any, *, object_type: str, object_id: str, market_id: int | None, shop_id: str | None = None) -> bool:
    item_market_id = _int(_get(item, "market_id"))
    if market_id is not None and item_market_id != market_id:
        return False
    if not _matches_shop(item, shop_id):
        return False
    return str(_get(item, "object_type") or "") == object_type and str(_get(item, "object_id") or "") == object_id


def _matches_shop(item: Any, shop_id: str | None) -> bool:
    target_shop_id = str(shop_id or "").strip()
    if not target_shop_id:
        return True
    return str(_get(item, "shop_id") or "").strip() == target_shop_id


def _recommended_manual_next_action(
    *,
    has_manual_action: bool,
    has_review_todo: bool,
    ready_review_count: int,
) -> str:
    if not has_manual_action:
        return "推荐对象尚未人工留痕；请在右侧点击加入复盘或记录观察，真实写入只能由人工按钮触发，不要自动执行广告动作。"
    if ready_review_count > 0:
        return "推荐对象已有 ready 复盘效果；保存复盘记录前仍需人工确认。"
    if has_review_todo:
        return "推荐对象已人工留痕并生成复盘待办；等待 7 天 / 14 天完整窗口后再判断效果。"
    return "推荐对象已有人工留痕，但暂未生成复盘待办；请确认动作类型是否应进入复盘。"


def _next_unhandled_candidate(
    candidates: list[dict[str, Any]],
    recommended_manual_status: dict[str, Any] | None,
    selected_market_id: int | None,
) -> dict[str, Any] | None:
    if not (recommended_manual_status and recommended_manual_status.get("has_manual_action")):
        return None

    market_id = _int(recommended_manual_status.get("market_id")) or selected_market_id
    shop_id = str(recommended_manual_status.get("shop_id") or "").strip()
    all_manual_actions = [record for record in load_manual_actions(market_id=market_id) if _matches_shop(record, shop_id)]
    for candidate in _rank_candidates(candidates):
        preview = _manual_action_preview(candidate)
        if not preview:
            continue
        signal_id = str(preview.get("signal_id") or "")
        candidate_market_id = _int(preview.get("market_id")) or market_id
        candidate_shop_id = str(preview.get("shop_id") or shop_id).strip()
        object_type = str(preview.get("object_type") or "")
        object_id = str(preview.get("object_id") or "")
        direct_actions = [
            record
            for record in load_manual_actions(signal_id or None, market_id=candidate_market_id)
            if _matches_shop(record, candidate_shop_id)
        ]
        object_actions = [
            record
            for record in all_manual_actions
            if object_type
            and object_id
            and _matches_recommended_object(
                record,
                object_type=object_type,
                object_id=object_id,
                market_id=candidate_market_id,
                shop_id=candidate_shop_id,
            )
        ]
        if direct_actions or object_actions:
            continue
        return {
            **_candidate_summary(candidate),
            "manual_action_preview": preview,
        }
    return None


def _signal_row_index(signal_rows: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    row_by_id: dict[str, dict[str, Any]] = {}
    for row in signal_rows:
        for key in ("row_id", "source_record_id", "id"):
            value = str(row.get(key) or "")
            if value:
                row_by_id[value] = row
    return row_by_id


def _looks_like_snapshot_row_id(object_id: str) -> bool:
    return ":ad-product:" in object_id or ":sales:" in object_id or object_id.startswith("snapshot-")


def _stable_product_object_id(row: dict[str, Any]) -> str | None:
    for key in ("asin", "msku", "sku"):
        value = str(row.get(key) or "").strip()
        if value:
            return value
    return None


def _object_label_as_stable_id(record: Any) -> str | None:
    label = str(getattr(record, "object_label", "") or "").strip()
    return label or None


def _candidate_next_action(*, has_snapshot: bool, signal_row_count: int, candidate_count: int) -> str:
    if not has_snapshot or signal_row_count == 0:
        return "先确认真实快照是否成功，并确保快照中有可进入信号规则的广告明细。"
    if candidate_count:
        return "从候选中选择一个广告对象，由人工确认后记录人工处理动作；不要自动执行广告动作。"
    return "当前没有广告对象级人工处理候选；先复核数据范围、信号规则和对象边界。"


REVIEW_RESULT_ORDER = ("improved", "no_change", "worse", "unclear")
REVIEW_SAMPLE_SORT_ORDER = ("worse", "no_change", "unclear", "improved")
REVIEW_SIGNAL_TYPE_ORDER = ("opportunity", "anomaly", "unknown")
REVIEW_RESULT_FEEDBACK = {
    "improved": "处理有效，同类信号可保留当前解释口径",
    "no_change": "处理后无明显变化，下次同类信号应复核证据来源或建议动作",
    "worse": "处理后效果变差，下次同类信号应复核阈值、证据来源和建议动作",
    "unclear": "复盘证据不足，不调整规则，先补复盘样本和指标",
}
REVIEW_SAMPLE_SORT_REASON = (
    "样本按业务风险排序：worse 优先，因为处理后效果变差；"
    "no_change 其次，因为建议可能无效；"
    "unclear 排在 improved 前，因为证据不足需要先补样本；"
    "improved 只作为保留口径参考。"
)
REVIEW_SAMPLE_RECORD_REASON = {
    "worse": "排序依据：worse 优先，因为处理后效果变差，先复核阈值、证据来源和建议动作。",
    "no_change": "排序依据：no_change 排在 unclear 前，因为建议可能无效，先复核证据来源或建议动作。",
    "unclear": "排序依据：unclear 排在 improved 前，因为证据不足，先补复盘样本和指标。",
    "improved": "排序依据：improved 放在最后，因为处理有效时主要作为保留口径参考。",
}
REVIEW_FORBIDDEN_ACTIONS = ("自动改规则", "自动调价", "自动暂停广告", "自动否词", "自动新增关键词")
REVIEW_ACTION_BOUNDARIES = {
    "worse": {
        "allowed_reviews": ("复核阈值", "复核证据来源", "复核建议动作"),
        "boundary": "worse 只能触发人工复核阈值、证据来源和建议动作；不自动改规则，不自动执行广告动作。",
    },
    "no_change": {
        "allowed_reviews": ("复核证据来源", "复核建议动作", "复核目标对象"),
        "boundary": "no_change 只能触发人工复核证据来源、建议动作和目标对象；不自动改规则，不自动执行广告动作。",
    },
    "unclear": {
        "allowed_reviews": ("补复盘样本", "补指标口径", "复核数据完整性"),
        "boundary": "unclear 只能触发补复盘样本、补指标口径和复核数据完整性；不自动改规则，不自动执行广告动作。",
    },
    "improved": {
        "allowed_reviews": ("保留当前解释口径", "沉淀正向样本"),
        "boundary": "improved 只能作为保留当前解释口径和沉淀正向样本参考；不自动改规则，不自动执行广告动作。",
    },
}


def _review_feedback_summary(
    review_records: list[Any],
    signals: list[Any] | None = None,
    manual_actions: list[Any] | None = None,
) -> dict[str, Any]:
    counts: dict[str, int] = {}
    signal_type_counts: dict[str, int] = {}
    signal_items = signals or []
    signal_type_by_id = _signal_type_by_id(signal_items)
    signal_by_id = _signal_by_id(signal_items)
    manual_action_by_id = _manual_action_by_id(manual_actions or [])
    for record in review_records:
        result = str(_value(getattr(record, "result", "")) or "").strip() or "unclear"
        if result not in REVIEW_RESULT_ORDER:
            result = "unclear"
        counts[result] = counts.get(result, 0) + 1
        signal_id = str(_value(getattr(record, "signal_id", "")) or "").strip()
        signal_type = signal_type_by_id.get(signal_id, "unknown")
        if signal_type not in REVIEW_SIGNAL_TYPE_ORDER:
            signal_type = "unknown"
        signal_type_counts[signal_type] = signal_type_counts.get(signal_type, 0) + 1

    by_result = {result: counts[result] for result in REVIEW_RESULT_ORDER if counts.get(result)}
    by_signal_type = {signal_type: signal_type_counts[signal_type] for signal_type in REVIEW_SIGNAL_TYPE_ORDER if signal_type_counts.get(signal_type)}
    total = sum(by_result.values())
    records = _review_feedback_record_items(review_records, signal_type_by_id, signal_by_id)
    candidate_groups = _review_feedback_candidate_groups(review_records, manual_action_by_id)
    manual_action_context_coverage = _manual_action_context_coverage(manual_actions or [])
    if total == 0:
        return {
            "total": 0,
            "by_result": {},
            "by_signal_type": {},
            "sample_sort": _review_sample_sort_summary(),
            "action_boundaries": _review_action_boundaries(),
            "closure_checklist": _review_closure_checklist({}, [], manual_action_context_coverage),
            "records": [],
            "candidate_groups": [],
            "manual_action_context_coverage": manual_action_context_coverage,
            "summary": "暂无已保存复盘记录。",
            "rule_feedback": "暂无复盘结果：保留当前信号解释口径，不调整规则。",
        }

    result_text = " / ".join(f"{result} {count}" for result, count in by_result.items())
    signal_type_text = " / ".join(f"{signal_type} {count}" for signal_type, count in by_signal_type.items())
    feedback_text = "；".join(REVIEW_RESULT_FEEDBACK[result] for result in by_result)
    return {
        "total": total,
        "by_result": by_result,
        "by_signal_type": by_signal_type,
        "sample_sort": _review_sample_sort_summary(),
        "action_boundaries": _review_action_boundaries(),
        "closure_checklist": _review_closure_checklist(by_result, records, manual_action_context_coverage),
        "records": records,
        "candidate_groups": candidate_groups,
        "manual_action_context_coverage": manual_action_context_coverage,
        "summary": f"已保存 {total} 条复盘记录：{result_text}；信号类型：{signal_type_text}。",
        "rule_feedback": f"{feedback_text}；该反馈只进入解释层，不自动调整广告动作或规则。",
    }


def _manual_action_by_id(manual_actions: list[Any]) -> dict[str, Any]:
    mapping: dict[str, Any] = {}
    for action in manual_actions:
        action_id = str(_value(_get(action, "id")) or "").strip()
        if action_id:
            mapping[action_id] = action
    return mapping


def _manual_action_context_coverage(manual_actions: list[Any]) -> dict[str, int]:
    total = 0
    with_evidence_snapshot = 0
    with_search_intent = 0
    with_aba_reference = 0
    for action in manual_actions:
        action_type = str(_value(_get(action, "action_type")) or "").strip()
        if action_type not in {"observe", "handled", "add_to_review"}:
            continue
        total += 1
        evidence_snapshot = _get(action, "evidence_snapshot")
        has_evidence = isinstance(evidence_snapshot, list) and any(
            str(_value(_get(item, "label")) or "").strip() and str(_value(_get(item, "value")) or "").strip()
            for item in evidence_snapshot
        )
        if has_evidence:
            with_evidence_snapshot += 1
        if _manual_action_evidence_value(action, "语义组"):
            with_search_intent += 1
        if _manual_action_evidence_value(action, "ABA语义参考词"):
            with_aba_reference += 1
    return {
        "total": total,
        "with_evidence_snapshot": with_evidence_snapshot,
        "with_search_intent": with_search_intent,
        "with_aba_reference": with_aba_reference,
    }


def _review_feedback_candidate_groups(
    review_records: list[Any],
    manual_action_by_id: dict[str, Any],
    limit: int = 5,
) -> list[dict[str, Any]]:
    groups: dict[str, dict[str, Any]] = {}
    for record in review_records:
        action_id = str(_value(getattr(record, "action_id", "")) or "").strip()
        action = manual_action_by_id.get(action_id)
        if action is None:
            continue
        search_intent_label = _manual_action_evidence_value(action, "语义组")
        aba_reference_term = _manual_action_evidence_value(action, "ABA语义参考词")
        if search_intent_label:
            group_type = "search_intent"
            group_label = search_intent_label
        elif aba_reference_term:
            group_type = "aba_reference_term"
            group_label = aba_reference_term
        else:
            continue

        group_id = f"{group_type}:{_normalized_text(group_label)}"
        group = groups.setdefault(
            group_id,
            {
                "group_id": group_id,
                "group_type": group_type,
                "group_label": group_label,
                "aba_reference_term": aba_reference_term,
                "aba_period": _manual_action_evidence_value(action, "ABA周期"),
                "aba_match_boundary": _manual_action_evidence_value(action, "ABA匹配边界"),
                "total": 0,
                "by_result": {},
                "sample_review_record_ids": [],
                "sample_action_ids": [],
            },
        )
        group["total"] += 1
        result = str(_value(getattr(record, "result", "")) or "").strip() or "unclear"
        if result not in REVIEW_RESULT_ORDER:
            result = "unclear"
        group["by_result"][result] = group["by_result"].get(result, 0) + 1
        _append_unique(group["sample_review_record_ids"], str(_value(getattr(record, "id", "")) or "").strip())
        _append_unique(group["sample_action_ids"], action_id)

    candidates: list[dict[str, Any]] = []
    for group in groups.values():
        by_result = _ordered_result_counts(group["by_result"])
        priority_result = _review_feedback_priority_result(by_result)
        group["by_result"] = by_result
        group["priority_result"] = priority_result
        group["recommendation"] = _review_feedback_group_recommendation(group, priority_result)
        group["boundary"] = "候选只进入解释层和人工复核，不自动改规则，不自动执行广告动作。"
        candidates.append(group)

    priority_order = {result: index for index, result in enumerate(REVIEW_SAMPLE_SORT_ORDER)}
    return sorted(
        candidates,
        key=lambda group: (
            priority_order.get(str(group.get("priority_result") or "unclear"), 99),
            -(_int(group.get("total")) or 0),
            str(group.get("group_label") or ""),
        ),
    )[:limit]


def _manual_action_evidence_value(action: Any, label: str) -> str | None:
    evidence_snapshot = _get(action, "evidence_snapshot")
    if not isinstance(evidence_snapshot, list):
        return None
    for item in evidence_snapshot:
        if str(_value(_get(item, "label")) or "").strip() != label:
            continue
        value = str(_value(_get(item, "value")) or "").strip()
        if value:
            return value
    return None


def _ordered_result_counts(counts: dict[str, int]) -> dict[str, int]:
    return {result: counts[result] for result in REVIEW_RESULT_ORDER if counts.get(result)}


def _review_feedback_priority_result(by_result: dict[str, int]) -> str:
    for result in REVIEW_SAMPLE_SORT_ORDER:
        if by_result.get(result):
            return result
    return "unclear"


def _review_feedback_group_recommendation(group: dict[str, Any], priority_result: str) -> str:
    count = _int(_dict(group.get("by_result")).get(priority_result)) or 0
    target = "该语义组" if group.get("group_type") == "search_intent" else "该 ABA 参考词"
    if priority_result == "worse":
        return f"worse {count}：优先复核{target}的阈值、证据来源和建议动作。"
    if priority_result == "no_change":
        return f"no_change {count}：优先复核{target}的证据来源、建议动作和目标对象。"
    if priority_result == "unclear":
        return f"unclear {count}：先补齐{target}的复盘样本和指标口径。"
    return f"improved {count}：{target}可作为保留当前解释口径的正向样本。"


def _append_unique(items: list[str], value: str) -> None:
    if value and value not in items:
        items.append(value)


def _normalized_text(value: Any) -> str:
    return str(_value(value) or "").strip().lower()


def _review_sample_sort_summary() -> dict[str, Any]:
    return {"order": list(REVIEW_SAMPLE_SORT_ORDER), "reason": REVIEW_SAMPLE_SORT_REASON}


def _review_action_boundaries() -> dict[str, dict[str, Any]]:
    return {result: _review_action_boundary(result) for result in REVIEW_SAMPLE_SORT_ORDER}


def _review_action_boundary(result: str) -> dict[str, Any]:
    boundary = REVIEW_ACTION_BOUNDARIES.get(result, REVIEW_ACTION_BOUNDARIES["unclear"])
    return {
        "result": result if result in REVIEW_ACTION_BOUNDARIES else "unclear",
        "allowed_reviews": list(boundary["allowed_reviews"]),
        "forbidden_actions": list(REVIEW_FORBIDDEN_ACTIONS),
        "boundary": str(boundary["boundary"]),
    }


def _review_closure_checklist(
    by_result: dict[str, int],
    records: list[dict[str, Any]],
    manual_action_context_coverage: dict[str, int] | None = None,
) -> list[dict[str, str]]:
    result_text = " / ".join(f"{result} {count}" for result, count in by_result.items())
    evidence_count = sum(1 for record in records if record.get("evidence_groups"))
    record_count = len(records)
    evidence_status = "ready" if record_count > 0 and evidence_count == record_count else "partial" if evidence_count > 0 else "blocked"
    trace_count = sum(1 for record in records if _review_record_trace_complete(record))
    trace_status = "ready" if record_count > 0 and trace_count == record_count else "partial" if trace_count > 0 else "blocked"
    context_coverage = manual_action_context_coverage or {
        "total": 0,
        "with_evidence_snapshot": 0,
        "with_search_intent": 0,
        "with_aba_reference": 0,
    }
    context_total = _int(context_coverage.get("total")) or 0
    context_evidence = _int(context_coverage.get("with_evidence_snapshot")) or 0
    context_intent = _int(context_coverage.get("with_search_intent")) or 0
    context_aba = _int(context_coverage.get("with_aba_reference")) or 0
    context_status = "ready" if context_total > 0 and context_evidence == context_total else "partial" if context_evidence > 0 else "blocked"
    return [
        {
            "check_id": "result_distribution",
            "label": "复盘结果分布",
            "status": "ready" if by_result else "blocked",
            "evidence": f"复盘结果：{result_text or '暂无'}",
        },
        {
            "check_id": "sample_priority",
            "label": "样本优先级",
            "status": "ready",
            "evidence": f"排序：{' -> '.join(REVIEW_SAMPLE_SORT_ORDER)}；{REVIEW_SAMPLE_SORT_REASON}",
        },
        {
            "check_id": "manual_action_context",
            "label": "复盘输入证据",
            "status": context_status,
            "evidence": f"人工动作 {context_total} 条，证据快照 {context_evidence} 条，语义组 {context_intent} 条，ABA参考 {context_aba} 条",
        },
        {
            "check_id": "evidence_trace",
            "label": "证据追溯",
            "status": evidence_status,
            "evidence": f"{evidence_count} / {record_count} 条样本带证据分组",
        },
        {
            "check_id": "review_record_trace",
            "label": "复盘记录来源",
            "status": trace_status,
            "evidence": f"{trace_count} / {record_count} 条样本带 review_record_id / action_id / 指标窗口",
        },
        {
            "check_id": "action_boundary",
            "label": "动作边界",
            "status": "ready",
            "evidence": "只允许人工复核；不自动改规则，不自动执行广告动作",
        },
    ]


def _review_record_trace_complete(record: dict[str, Any]) -> bool:
    metric_window = _dict(record.get("metric_window"))
    return bool(
        str(record.get("review_record_id") or "").strip()
        and str(record.get("action_id") or "").strip()
        and str(metric_window.get("before") or "").strip()
        and str(metric_window.get("after") or "").strip()
    )


def _signal_by_id(signals: list[Any]) -> dict[str, Any]:
    mapping: dict[str, Any] = {}
    for signal in signals:
        signal_id = str(_value(_get(signal, "id")) or "").strip()
        if signal_id:
            mapping[signal_id] = signal
    return mapping


def _signal_type_by_id(signals: list[Any]) -> dict[str, str]:
    mapping: dict[str, str] = {}
    for signal in signals:
        signal_id = str(_value(_get(signal, "id")) or "").strip()
        signal_type = str(_value(_get(signal, "signal_type")) or "").strip()
        if signal_id and signal_type:
            mapping[signal_id] = signal_type
    return mapping


def _review_feedback_record_items(
    review_records: list[Any],
    signal_type_by_id: dict[str, str],
    signal_by_id: dict[str, Any] | None = None,
    limit: int = 5,
) -> list[dict[str, Any]]:
    priority_order = {result: index for index, result in enumerate(REVIEW_SAMPLE_SORT_ORDER)}
    signal_by_id = signal_by_id or {}

    def item_sort_key(record: Any) -> tuple[int, str, str]:
        result = str(_value(getattr(record, "result", "")) or "").strip()
        reviewed_at = str(_value(getattr(record, "reviewed_at", "")) or "")
        signal_id = str(_value(getattr(record, "signal_id", "")) or "")
        return (priority_order.get(result, 99), reviewed_at, signal_id)

    items: list[dict[str, Any]] = []
    for record in sorted(review_records, key=item_sort_key)[:limit]:
        signal_id = str(_value(getattr(record, "signal_id", "")) or "").strip()
        result = str(_value(getattr(record, "result", "")) or "").strip() or "unclear"
        if result not in REVIEW_RESULT_ORDER:
            result = "unclear"
        signal_type = signal_type_by_id.get(signal_id, "unknown")
        if signal_type not in REVIEW_SIGNAL_TYPE_ORDER:
            signal_type = "unknown"
        object_id = str(_value(getattr(record, "object_id", "")) or "").strip()
        object_label = str(_value(getattr(record, "object_label", "")) or "").strip() or object_id or "对象待补充"
        evidence_drilldown = _candidate_evidence_drilldown(signal_by_id.get(signal_id))
        items.append(
            {
                "review_record_id": str(_value(getattr(record, "id", "")) or "").strip(),
                "signal_id": signal_id,
                "action_id": str(_value(getattr(record, "action_id", "")) or "").strip(),
                "signal_type": signal_type,
                "result": result,
                "object_type": str(_value(getattr(record, "object_type", "")) or "").strip() or "object",
                "object_id": object_id,
                "object_label": object_label,
                "review_window": str(_value(getattr(record, "review_window", "")) or "").strip(),
                "metric_window": _review_feedback_metric_window(record),
                "metric_snapshot": {
                    "before": _dict(getattr(record, "before_metrics", {})),
                    "after": _dict(getattr(record, "after_metrics", {})),
                },
                "review_note": str(_value(getattr(record, "review_note", "")) or "").strip(),
                "sort_reason": REVIEW_SAMPLE_RECORD_REASON.get(result, REVIEW_SAMPLE_RECORD_REASON["unclear"]),
                "action_boundary": _review_action_boundary(result),
                "evidence_drilldown": evidence_drilldown,
                "evidence_groups": _review_feedback_evidence_groups(evidence_drilldown),
            }
        )
    return items


def _review_feedback_metric_window(record: Any) -> dict[str, str] | None:
    before_start = str(_value(getattr(record, "before_start_date", "")) or "").strip()
    before_end = str(_value(getattr(record, "before_end_date", "")) or "").strip()
    after_start = str(_value(getattr(record, "after_start_date", "")) or "").strip()
    after_end = str(_value(getattr(record, "after_end_date", "")) or "").strip()
    if not (before_start and before_end and after_start and after_end):
        return None
    return {"before": f"{before_start} 至 {before_end}", "after": f"{after_start} 至 {after_end}"}


def _review_feedback_evidence_groups(drilldown: dict[str, Any] | None) -> list[dict[str, str]]:
    if not isinstance(drilldown, dict):
        return []
    groups: list[dict[str, str]] = []
    direct_count = _int(drilldown.get("direct_ad_product_row_count"))
    metric_summary = _dict(drilldown.get("metric_summary"))
    if _string(metric_summary.get("basis")) == "search_term_daily_metrics":
        row_count = _int(metric_summary.get("row_count")) or 0
        groups.append({"group_id": "search_term_metrics", "label": "搜索词指标", "value": f"搜索词表现行 {row_count} 条"})
    elif direct_count is not None:
        groups.append({"group_id": "product_metrics", "label": "商品指标", "value": f"广告商品投放行 {direct_count} 条"})
    elif metric_summary:
        row_count = _int(metric_summary.get("row_count")) or 0
        groups.append({"group_id": "product_metrics", "label": "商品指标", "value": f"证据行 {row_count} 条"})

    search_count = _int(drilldown.get("search_term_context_count"))
    if search_count is not None:
        groups.append({"group_id": "search_term_context", "label": "搜索词上下文", "value": f"{search_count} 条"})

    placement_count = _int(drilldown.get("placement_context_count"))
    if placement_count is not None:
        groups.append({"group_id": "placement_context", "label": "广告位上下文", "value": f"{placement_count} 条"})

    boundary = _string(drilldown.get("boundary")).strip()
    if boundary:
        groups.append({"group_id": "boundary", "label": "边界提示", "value": boundary})
    return groups


def _review_next_action(
    manual_actions: list[Any],
    effects: list[dict[str, Any]],
    ready_count: int,
    identity_issues: list[dict[str, Any]] | None = None,
    review_feedback: dict[str, Any] | None = None,
) -> str:
    if identity_issues:
        return "先处理历史人工动作对象 ID 风险：存在广告商品 / 销售商品记录仍使用快照行 ID；只读确认后再人工迁移为稳定 ASIN / MSKU / SKU。"
    if (_int((review_feedback or {}).get("total")) or 0) > 0:
        return "已有保存复盘记录；先用 improved / no_change / worse / unclear 结果校准同类信号解释，不自动调整广告动作或规则。"
    if not manual_actions:
        return "先记录人工动作，再等待 7 天 / 14 天完整复盘窗口。"
    if ready_count:
        return "存在 ready 复盘效果，可以保存复盘记录；保存前仍需人工确认。"
    if not effects:
        return "当前没有可复盘待办；先确认最新人工动作是否属于观察、已处理或加入复盘。"
    wait_message = _not_due_review_wait_message(effects)
    if wait_message:
        return wait_message
    actionable_effects = _actionable_review_effects(effects)
    messages = _prioritized_review_messages(actionable_effects)
    return "当前没有 ready 复盘效果；优先处理数据缺口：" + "；".join(messages[:3]) + _snapshot_gap_next_step(actionable_effects)


def _rule_improvement_readiness(
    manual_actions: list[Any],
    effects: list[dict[str, Any]],
    ready_count: int,
    identity_issues: list[dict[str, Any]] | None = None,
    review_feedback: dict[str, Any] | None = None,
) -> dict[str, Any]:
    base = {"can_auto_change_rules": False, "can_auto_execute_ads": False}
    if identity_issues:
        return {
            **base,
            "status": "blocked_by_identity_issue",
            "title": "规则改进对象口径未通过",
            "reason": "存在人工动作对象 ID 风险，不能把快照行 ID 当作长期复盘对象。",
            "next_step": "先只读确认并人工迁移为稳定 ASIN / MSKU / SKU，再进入复盘或规则反馈。",
        }
    if (_int((review_feedback or {}).get("total")) or 0) > 0:
        return {
            **base,
            "status": "saved_feedback",
            "title": "规则反馈已沉淀",
            "reason": str((review_feedback or {}).get("rule_feedback") or ""),
            "next_step": "继续用已保存复盘结果校准同类信号解释；广告动作和规则调整仍必须人工确认。",
        }
    if not manual_actions:
        return {
            **base,
            "status": "not_started",
            "title": "规则改进暂未开始",
            "reason": "还没有人工处理记录，不能进入 7 天 / 14 天复盘和规则反馈。",
            "next_step": "先完成人工确认并生成复盘待办。",
        }
    if ready_count:
        return {
            **base,
            "status": "ready_for_manual_review_record",
            "title": "规则改进待人工复盘",
            "reason": "已存在 ready 复盘效果，但需要人工保存复盘记录后才能沉淀为规则反馈。",
            "next_step": "先保存复盘记录，再进入规则反馈解释层；不自动调整广告动作或规则。",
        }
    if not effects:
        return {
            **base,
            "status": "waiting_review_todo",
            "title": "规则改进等待复盘待办",
            "reason": "当前没有可复盘待办，不能输出处理有效或无效结论。",
            "next_step": "先确认最新人工动作是否属于观察、已处理或加入复盘。",
        }
    wait_message = _not_due_review_wait_message(effects)
    if wait_message:
        return {
            **base,
            "status": "waiting_review_window",
            "title": "规则改进暂未满足条件",
            "reason": wait_message,
            "next_step": "等待复盘窗口完整后再复核处理后指标，未到期前不拉取快照、不保存复盘结论。",
        }
    actionable_effects = _actionable_review_effects(effects)
    messages = _prioritized_review_messages(actionable_effects)
    return {
        **base,
        "status": "blocked_by_data_gap",
        "title": "规则改进缺少复盘证据",
        "reason": "当前没有 ready 复盘效果；" + "；".join(messages[:3]),
        "next_step": "先补齐复盘所需数据。" + _snapshot_gap_next_step(actionable_effects),
    }


def _prioritized_review_messages(effects: list[dict[str, Any]]) -> list[str]:
    messages: list[str] = []
    seen: set[str] = set()
    for effect in sorted(effects, key=_review_effect_gap_priority):
        message = str(effect.get("message") or "").strip()
        if not message or message in seen:
            continue
        seen.add(message)
        messages.append(message)
    return messages


def _snapshot_gap_next_step(effects: list[dict[str, Any]]) -> str:
    for effect in effects:
        if "缺少处理后" in str(effect.get("message") or ""):
            return "下一步：先查询积加 API 限流规则，再由人工触发低频快照；快照覆盖完整处理后窗口后再保存复盘记录。"
    return ""


def _review_effect_gap_priority(effect: dict[str, Any]) -> tuple[int, int, int, str]:
    message = str(effect.get("message") or "")
    object_type = str(effect.get("object_type") or "")
    review_window = str(effect.get("review_window") or "")
    object_priority = 1 if object_type in {"cross", "data_quality"} else 0
    if "缺少处理后" in message:
        gap_priority = 0
    elif "处理前" in message or "窗口不足" in message:
        gap_priority = 1
    elif object_priority:
        gap_priority = 2
    else:
        gap_priority = 3
    window_priority = {"7d": 0, "14d": 1}.get(review_window, 2)
    return (object_priority, gap_priority, window_priority, message)


def _triage_status(
    *,
    candidate_count: int,
    manual_preview: dict[str, Any] | None,
    product_scope_gate: dict[str, Any] | None = None,
) -> str:
    if product_scope_gate and product_scope_gate.get("is_actionable") is False:
        return "requires_product_scope"
    if candidate_count and manual_preview:
        return "ready_for_manual_confirmation"
    if candidate_count:
        return "needs_manual_preview"
    return "no_actionable_candidate"


def _actionability_status(
    *,
    product_scope_gate: dict[str, Any] | None,
    candidate_count: int,
    manual_preview: dict[str, Any] | None,
    product_scope_drilldown: dict[str, Any] | None,
) -> dict[str, Any]:
    if product_scope_gate and product_scope_gate.get("is_actionable") is False:
        message = str(product_scope_gate.get("message") or "先选择 Parent ASIN / ASIN 经营对象后再进入人工处理。")
        return {
            "status": "requires_product_scope",
            "can_write_manual_action": False,
            "diagnosis_mode": "scope_selection",
            "message": message,
            "next_step": message,
            "manual_gate_title": "先选择经营对象",
            "boundary": "未进入 Parent ASIN / 广告 ASIN 经营对象前，不能写人工动作。",
            "allowed_paths": ["选择 Parent ASIN / 广告 ASIN 经营入口", "查看全量排查只读诊断", "探测或拉取快照后再选择经营对象"],
            "forbidden_actions": ACTIONABILITY_FORBIDDEN_ACTIONS,
        }
    if candidate_count == 0:
        has_drilldown = bool(product_scope_drilldown and product_scope_drilldown.get("status") == "ready")
        no_candidate_explanation = _no_actionable_candidate_explanation(product_scope_drilldown)
        message = (
            no_candidate_explanation["message"]
            if has_drilldown
            else "当前经营对象没有可进入人工确认的广告对象级候选；不能写人工动作。"
        )
        return {
            "status": "no_actionable_candidate",
            "can_write_manual_action": False,
            "diagnosis_mode": "product_scope_drilldown" if has_drilldown else "empty_scope",
            "message": message,
            "next_step": no_candidate_explanation["next_step"]
            if has_drilldown
            else "先按广告 ASIN、广告组、投放词、搜索词和广告位复核数据关系；不要写入人工动作。",
            "empty_reason_code": no_candidate_explanation["reason_code"] if has_drilldown else "empty_scope",
            "manual_gate_title": "暂不进入人工动作",
            "boundary": f"candidate_count={candidate_count}，不能写人工动作；右侧不生成广告调整建议，也不自动执行广告动作。",
            "allowed_paths": NO_ACTIONABLE_ALLOWED_PATHS,
            "forbidden_actions": ACTIONABILITY_FORBIDDEN_ACTIONS,
        }
    if manual_preview:
        return {
            "status": "ready_for_manual_confirmation",
            "can_write_manual_action": True,
            "diagnosis_mode": "manual_action",
            "message": "已有可进入人工确认的广告对象级候选。",
            "next_step": "由运营人工确认后写入留痕，并生成 7/14 天复盘待办。",
            "manual_gate_title": "可进入人工确认",
            "boundary": "只允许人工记录观察、标记已处理、加入复盘或忽略本次；不会自动执行广告动作。",
            "allowed_paths": ["记录观察", "标记已处理", "加入复盘", "忽略本次"],
            "forbidden_actions": ACTIONABILITY_FORBIDDEN_ACTIONS,
        }
    return {
        "status": "needs_manual_preview",
        "can_write_manual_action": False,
        "diagnosis_mode": "candidate_without_preview",
        "message": "候选存在，但缺少只读人工动作预览；不能写人工动作。",
        "next_step": "先补齐候选的复盘对象和人工动作预检。",
        "manual_gate_title": "等待补齐预检",
        "boundary": f"当前有 {candidate_count} 个候选，但缺少人工动作只读预检，不能写人工动作。",
        "allowed_paths": ["补齐候选复盘对象", "补齐人工动作预检", "继续只读核对证据链"],
        "forbidden_actions": ACTIONABILITY_FORBIDDEN_ACTIONS,
    }


def _no_actionable_candidate_explanation(product_scope_drilldown: dict[str, Any] | None) -> dict[str, str]:
    items = product_scope_drilldown.get("items") if isinstance(product_scope_drilldown, dict) else []
    if not isinstance(items, list) or not items:
        return {
            "reason_code": "no_advertised_asin_rows",
            "message": "当前经营对象没有广告 ASIN 投放行，不能生成可进入人工确认的广告对象级候选；不能写人工动作。",
            "next_step": "先补齐广告 ASIN 投放数据，再复核广告组、投放词、搜索词和广告位关系；不要写入人工动作。",
        }

    advertised_asin_count = _int(product_scope_drilldown.get("advertised_asin_count")) or len(items)
    spend = sum(_number(item.get("spend")) or 0 for item in items if isinstance(item, dict))
    orders = sum(_int(item.get("orders")) or 0 for item in items if isinstance(item, dict))
    search_term_count = sum(
        _int((item.get("top_ad_group") or {}).get("search_term_count")) or 0
        for item in items
        if isinstance(item, dict) and isinstance(item.get("top_ad_group"), dict)
    )
    zero_order_term_count = sum(
        len((item.get("top_ad_group") or {}).get("zero_order_search_terms") or [])
        for item in items
        if isinstance(item, dict) and isinstance(item.get("top_ad_group"), dict)
    )

    context_parts = [
        f"广告 ASIN {advertised_asin_count} 个",
        f"广告花费 {_format_amount(spend)}",
        f"广告订单 {orders}",
    ]
    if search_term_count:
        context_parts.append(f"搜索词上下文 {search_term_count} 条")
    if zero_order_term_count:
        context_parts.append(f"无订单花费词样本 {zero_order_term_count} 条")

    return {
        "reason_code": "rules_not_triggered_with_ad_data",
        "message": (
            f"当前经营对象已有{('，').join(context_parts)}；"
            "现有信号规则没有命中可进入人工确认的广告对象级候选，只能作为诊断视图，不能写人工动作。"
        ),
        "next_step": (
            "先下钻广告 ASIN、广告组、有效搜索词和无订单花费词；"
            "如运营认为仍有问题，应补充规则阈值、策略资料或数据口径，而不是直接写广告调整建议。"
        ),
    }


def _next_action_manual_preview(
    manual_preview: dict[str, Any] | None,
    recommended_manual_status: dict[str, Any] | None,
    next_unhandled_candidate: dict[str, Any] | None,
) -> dict[str, Any] | None:
    if recommended_manual_status and recommended_manual_status.get("has_manual_action") and next_unhandled_candidate:
        next_preview = _dict_or_none(next_unhandled_candidate.get("manual_action_preview"))
        if next_preview:
            return next_preview
    return manual_preview


def _triage_next_action(
    *,
    candidate_count: int,
    manual_preview: dict[str, Any] | None,
    recommended_manual_status: dict[str, Any] | None,
    next_unhandled_candidate: dict[str, Any] | None,
    blockers: list[dict[str, str]],
    product_scope_gate: dict[str, Any] | None = None,
) -> str:
    if product_scope_gate and product_scope_gate.get("is_actionable") is False:
        return str(product_scope_gate.get("message") or "先选择 Parent ASIN / ASIN 经营对象，再进入广告证据下钻。")
    if candidate_count == 0:
        return "先复核真实快照、信号规则和对象边界，当前不要写入人工动作。"
    if recommended_manual_status and recommended_manual_status.get("has_manual_action"):
        if next_unhandled_candidate:
            label = next_unhandled_candidate.get("object_label") or next_unhandled_candidate.get("object_id") or "下一个候选"
            preview = _dict(next_unhandled_candidate.get("manual_action_preview"))
            action_type = preview.get("action_type") or "manual_action"
            return f"推荐对象已人工留痕并等待复盘；可继续人工确认下一个未留痕候选 {label} 的 {action_type}；真实写入只能由人工按钮触发，不要自动执行广告动作。"
        return str(recommended_manual_status.get("next_action") or "推荐对象已有人工留痕；先查看复盘待办和复盘窗口。")
    if manual_preview:
        label = manual_preview.get("object_label") or manual_preview.get("object_id") or "推荐对象"
        action_type = manual_preview.get("action_type") or "manual_action"
        return f"优先让运营人工确认 {label} 的 {action_type}；真实写入只能由人工按钮触发，不要自动执行广告动作。"
    if any(blocker["code"] == "manual_action_identity_issue" for blocker in blockers):
        return "先修复人工动作对象身份问题，再进入新一轮人工确认。"
    return "先补齐候选的人工动作预览，再允许运营确认；不要自动执行广告动作。"


def _source_payload(source: Any) -> dict[str, Any]:
    return {
        "source_type": _value(_get(source, "source_type")),
        "source_name": _value(_get(source, "source_name")),
        "source_table": _value(_get(source, "source_table")),
        "snapshot_id": _value(_get(source, "snapshot_id")),
        "market_id": _int(_value(_get(source, "market_id"))),
    }


def _dict_list(value: Any) -> list[dict[str, Any]]:
    if not isinstance(value, list):
        return []
    return [_dict(item) for item in value if isinstance(item, dict)]


def _dict(value: Any) -> dict[str, Any]:
    return value if isinstance(value, dict) else {}


def _dict_or_none(value: Any) -> dict[str, Any] | None:
    return value if isinstance(value, dict) else None


def _get(value: Any, key: str) -> Any:
    if isinstance(value, dict):
        return value.get(key)
    return getattr(value, key, None)


def _value(value: Any) -> Any:
    return getattr(value, "value", value)


def _string(value: Any) -> str:
    raw_value = _value(value)
    return "" if raw_value is None else str(raw_value)


def _int(value: Any) -> int | None:
    if value is None or value == "":
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _number(value: Any) -> float | None:
    if value is None or value == "":
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None
