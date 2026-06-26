import argparse
import json
import sys
from collections import Counter
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS_ROOT = ROOT / "scripts"
sys.path.insert(0, str(SCRIPTS_ROOT))
sys.path.insert(0, str(ROOT / "backend"))

from inspect_review_readiness import build_review_readiness_payload  # noqa: E402
from app.services.manual_actions import REVIEW_WINDOWS, build_review_todos, load_manual_actions, manual_action_object_id_for_values  # noqa: E402
from app.services.signal_triage import (  # noqa: E402
    build_review_candidates_payload,
    _candidate_summary_evidence_drilldown as _service_candidate_summary_evidence_drilldown,
    _actionability_status as _service_actionability_status,
    _manual_action_preflight_checklist,
)
from app.services.snapshot_store import load_signal_rows_from_latest_snapshot  # noqa: E402


PRIORITY_SCORE = {"P0": 3, "P1": 2, "P2": 1}
REVIEWABLE_OBJECT_TYPES = {"search_term", "advertised_product", "sales_product", "placement", "ad_group"}
METRIC_REVIEW_OBJECT_TYPES = {"search_term", "advertised_product", "sales_product", "placement"}
ACTIONABLE_PRODUCT_SCOPE_PREFIXES = ("parent_asin:", "ad_asin:")
PROBLEM_TYPE_BY_CATEGORY = {
    "data_quality": "数据质量缺口",
    "advertised_product_efficiency": "销售承接不足",
    "advertised_product_opportunity": "机会扩量",
    "search_term_opportunity": "机会扩量",
    "aba_market_opportunity": "市场竞争压力",
    "placement_efficiency": "投放结构失衡",
    "search_term_performance_split": "投放结构失衡",
    "ad_group_structure": "投放结构失衡",
    "ad_efficiency": "花费浪费",
    "ad_efficiency_anomaly": "花费浪费",
    "product_sales_fit": "销售承接不足",
    "product_ad_coverage": "销售承接不足",
    "review_effect": "处理后复盘",
}


def build_signal_triage_payload(
    *,
    selected_market_id: int | None = None,
    top: int = 5,
    product_scope_id: str | None = None,
) -> dict[str, Any]:
    top_limit = max(1, top)
    candidate_kwargs: dict[str, Any] = {"selected_market_id": selected_market_id}
    if product_scope_id is not None:
        candidate_kwargs["product_scope_id"] = product_scope_id
    candidates_payload = build_review_candidates_payload(**candidate_kwargs)
    readiness_payload = build_review_readiness_payload(selected_market_id=selected_market_id)
    candidates = _dict_list(candidates_payload.get("candidates"))
    candidate_count = _int(candidates_payload.get("candidate_count")) or len(candidates)
    product_scope_gate = _product_scope_gate(candidates_payload.get("selected_product_scope_id"), candidate_count)
    is_actionable_scope = bool(product_scope_gate.get("is_actionable"))
    display_candidate_count = candidate_count if is_actionable_scope else 0
    manual_preview = _dict_or_none(candidates_payload.get("manual_action_preview")) if is_actionable_scope else None

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
    product_scope_drilldown = _dict_or_none(candidates_payload.get("product_scope_drilldown")) if is_actionable_scope else None
    actionability_status = _service_actionability_status(
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
            "next_action": readiness_payload.get("next_action"),
        },
        "blockers": blockers,
        "next_action": _next_action(
            candidate_count=display_candidate_count,
            manual_preview=action_preview,
            recommended_manual_status=recommended_manual_status,
            next_unhandled_candidate=next_unhandled_candidate,
            blockers=blockers,
            product_scope_gate=product_scope_gate,
        ),
    }


def _status(
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


def _candidate_summary_evidence_drilldown(
    candidate_summary: dict[str, Any] | None,
    candidates: list[dict[str, Any]] | None,
    signal_rows: list[dict[str, Any]] | None = None,
) -> dict[str, Any] | None:
    return _service_candidate_summary_evidence_drilldown(candidate_summary, candidates, signal_rows or [])


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
        return "已有人工处理记录，但当前没有 7/14 天处理前后指标可复核待办。"
    return f"已有人工处理记录，但当前没有 7/14 天处理前后指标可复核待办。复盘阻塞：{'；'.join(details[:3])}。{_snapshot_gap_next_step(effects)}"


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


def _snapshot_gap_next_step(effects: list[dict[str, Any]]) -> str:
    for effect in effects:
        if "缺少处理后" in str(effect.get("message") or ""):
            return "下一步：先查询积加 API 限流规则，再由人工触发低频快照；快照覆盖完整处理后窗口后再保存复盘记录。"
    return ""


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
        str(_get(todo, "review_window") or "")
        for todo in review_todos
        if _get(todo, "review_window")
    ]

    return {
        "will_write": False,
        "signal_id": signal_id or None,
        "object_type": manual_preview.get("object_type"),
        "object_id": manual_preview.get("object_id"),
        "object_label": manual_preview.get("object_label"),
        "shop_id": shop_id or None,
        "shop_name": manual_preview.get("shop_name"),
        "market_id": market_id,
        "has_manual_action": bool(manual_actions),
        "manual_action_count": len(manual_actions),
        "has_review_todo": bool(review_todos),
        "review_todo_count": len(review_todos),
        "ready_review_count": ready_review_count,
        "review_windows": sorted(set(review_windows)),
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
        return "推荐对象已有处理前后指标可复核待办；保存复盘记录前仍需人工确认。"
    if has_review_todo:
        return "推荐对象已人工留痕并生成复盘待办；等待 7 天 / 14 天完整窗口后再人工核对处理前后指标。"
    return "推荐对象已有人工留痕，但暂未生成复盘待办；请确认动作类型是否应进入复盘。"


def _manual_action_preview(candidate: dict[str, Any] | None) -> dict[str, Any] | None:
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
        "preflight_checklist": _manual_action_preflight_checklist(candidate, object_id),
    }


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


def _next_action(
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


def _dict_list(value: Any) -> list[dict[str, Any]]:
    if not isinstance(value, list):
        return []
    return [_dict(item) for item in value if isinstance(item, dict)]


def _dict(value: Any) -> dict[str, Any]:
    return value if isinstance(value, dict) else {}


def _dict_or_none(value: Any) -> dict[str, Any] | None:
    return value if isinstance(value, dict) else None


def _int(value: Any) -> int | None:
    if value is None or value == "":
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _get(value: Any, key: str) -> Any:
    if isinstance(value, dict):
        return value.get(key)
    return getattr(value, key, None)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="只读汇总 AI 信号分诊、人工确认候选和复盘状态")
    parser.add_argument("--market-id", type=int, default=None)
    parser.add_argument("--top", type=int, default=5)
    parser.add_argument("--product-scope-id", default=None)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    print(
        json.dumps(
            build_signal_triage_payload(
                selected_market_id=args.market_id,
                top=args.top,
                product_scope_id=args.product_scope_id,
            ),
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
