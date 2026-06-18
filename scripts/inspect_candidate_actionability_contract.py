from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[1]
BACKEND_ROOT = PROJECT_ROOT / "backend"
sys.path.insert(0, str(BACKEND_ROOT))

from app.services.signal_triage import (  # noqa: E402
    _manual_action_preview,
    build_review_candidates_payload,
)


REQUIRED_REVIEW_WINDOWS = {"7d", "14d"}
BOUNDARY_BLOCK_IDS = {
    "context_boundary",
    "search_term_boundary",
    "decision_boundary",
    "manual_action_boundary",
    "action_boundary",
    "business_boundary",
}


def build_candidate_actionability_contract_payload(
    *, selected_market_id: int | None = None, product_scope_id: str | None = None
) -> dict[str, Any]:
    candidates_payload = build_review_candidates_payload(
        selected_market_id=selected_market_id,
        product_scope_id=product_scope_id,
    )
    candidates = _dict_list(candidates_payload.get("candidates"))
    contracts = [_candidate_contract(candidate) for candidate in candidates]
    ready_count = sum(1 for contract in contracts if contract["can_enter_manual_action"])
    blocked_count = len(contracts) - ready_count

    if not candidates:
        status = "empty"
    elif blocked_count:
        status = "needs_contract_fix"
    else:
        status = "ready"

    return {
        "status": status,
        "selected_market_id": selected_market_id,
        "selected_product_scope_id": product_scope_id,
        "candidate_count": len(candidates),
        "ready_contract_count": ready_count,
        "blocked_contract_count": blocked_count,
        "contracts": contracts,
        "next_action": _next_action(status, ready_count=ready_count, blocked_count=blocked_count),
    }


def _candidate_contract(candidate: dict[str, Any]) -> dict[str, Any]:
    manual_preview = _dict_or_none(candidate.get("manual_action_preview")) or _manual_action_preview(candidate)
    drilldown = _dict(candidate.get("evidence_drilldown"))
    business_blocks = _dict_list(drilldown.get("business_evidence_blocks"))
    source_types = _source_types(candidate)
    review_windows = _review_windows(manual_preview)
    stable_object_id = _stable_object_id(candidate, manual_preview)
    block_ids = {str(block.get("block_id") or "").strip() for block in business_blocks}
    block_labels = {str(block.get("label") or "").strip() for block in business_blocks}

    has_manual_action_path = "manual_action_path" in block_ids or "人工动作路径" in block_labels
    has_review_metrics = "review_metrics" in block_ids or "复盘指标" in block_labels
    has_attribution_boundary = _has_attribution_boundary(drilldown, business_blocks)

    gaps: list[str] = []
    if not manual_preview:
        gaps.append("missing_manual_action_preview")
    if not stable_object_id:
        gaps.append("missing_stable_object_id")
    if not source_types:
        gaps.append("missing_evidence_source")
    if not REQUIRED_REVIEW_WINDOWS.issubset(set(review_windows)):
        gaps.append("missing_review_windows")
    if not has_manual_action_path:
        gaps.append("missing_manual_action_path")
    if not has_review_metrics:
        gaps.append("missing_review_metrics")
    if not has_attribution_boundary:
        gaps.append("missing_attribution_boundary")

    return {
        "signal_id": candidate.get("signal_id"),
        "signal_category": candidate.get("signal_category"),
        "object_type": candidate.get("object_type"),
        "object_id": stable_object_id,
        "object_label": candidate.get("object_label"),
        "action_type": manual_preview.get("action_type") if manual_preview else None,
        "source_types": source_types,
        "evidence_source_count": len(source_types),
        "review_windows": review_windows,
        "has_manual_action_path": has_manual_action_path,
        "has_review_metrics": has_review_metrics,
        "has_attribution_boundary": has_attribution_boundary,
        "can_enter_manual_action": not gaps,
        "gaps": gaps,
    }


def _source_types(candidate: dict[str, Any]) -> list[str]:
    source_types: list[str] = []
    for source in _dict_list(candidate.get("data_sources")):
        source_type = (
            str(source.get("source_type") or source.get("source_name") or source.get("source_table") or "").strip()
        )
        if source_type and source_type not in source_types:
            source_types.append(source_type)
    return source_types


def _review_windows(manual_preview: dict[str, Any] | None) -> list[str]:
    if not manual_preview:
        return []
    return [str(window).strip() for window in manual_preview.get("review_windows") or [] if str(window).strip()]


def _stable_object_id(candidate: dict[str, Any], manual_preview: dict[str, Any] | None) -> str | None:
    values = [
        manual_preview.get("object_id") if manual_preview else None,
        candidate.get("asin"),
        candidate.get("msku"),
        candidate.get("sku"),
        candidate.get("object_id"),
    ]
    for value in values:
        text = str(value or "").strip()
        if text:
            return text
    return None


def _has_attribution_boundary(drilldown: dict[str, Any], business_blocks: list[dict[str, Any]]) -> bool:
    if str(drilldown.get("boundary") or "").strip():
        return True
    for block in business_blocks:
        block_id = str(block.get("block_id") or "").strip()
        label = str(block.get("label") or "").strip()
        value = str(block.get("value") or "").strip()
        detail = str(block.get("detail") or "").strip()
        text = f"{label} {value} {detail}"
        if block_id in BOUNDARY_BLOCK_IDS:
            return True
        if "边界" in text or "不能自动归因" in text or "不自动执行" in text:
            return True
    return False


def _next_action(status: str, *, ready_count: int, blocked_count: int) -> str:
    if status == "empty":
        return "当前没有可审计的人工处理候选；先补齐广告对象级信号候选。"
    if status == "ready":
        return f"{ready_count} 条候选满足落地合同，可进入人工确认和 7/14 天复盘。"
    return f"{blocked_count} 条候选缺少落地合同字段；先补对象、证据来源、人工动作路径、复盘指标或归因边界。"


def _dict(value: Any) -> dict[str, Any]:
    return value if isinstance(value, dict) else {}


def _dict_or_none(value: Any) -> dict[str, Any] | None:
    return value if isinstance(value, dict) else None


def _dict_list(value: Any) -> list[dict[str, Any]]:
    if not isinstance(value, list):
        return []
    return [item for item in value if isinstance(item, dict)]


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="只读审计 AI 信号候选是否满足人工处理落地合同。")
    parser.add_argument("--market-id", type=int, default=None)
    parser.add_argument("--product-scope-id", default=None)
    args = parser.parse_args(argv)

    payload = build_candidate_actionability_contract_payload(
        selected_market_id=args.market_id,
        product_scope_id=args.product_scope_id,
    )
    print(json.dumps(payload, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
