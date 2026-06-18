from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[1]
BACKEND_ROOT = PROJECT_ROOT / "backend"
sys.path.insert(0, str(BACKEND_ROOT))

from app.services.manual_actions import (  # noqa: E402
    build_review_effect_result,
    build_review_todos,
    load_manual_actions,
    load_review_records,
)
from app.services.snapshot_store import load_signal_rows_from_success_snapshots, load_snapshot_status  # noqa: E402


REVIEW_WAIT_FORBIDDEN_ACTIONS = ["不拉取快照", "不保存复盘结论", "不自动改规则", "不自动执行广告动作"]
METRIC_REVIEW_OBJECT_TYPES = {"search_term", "advertised_product", "sales_product", "placement"}


def build_review_readiness_payload(*, selected_market_id: int | None = None) -> dict[str, Any]:
    manual_actions = load_manual_actions(market_id=selected_market_id)
    review_records = load_review_records(market_id=selected_market_id)
    signal_rows = load_signal_rows_from_success_snapshots()
    snapshot_status = load_snapshot_status().model_dump(mode="json")
    todos = build_review_todos(market_id=selected_market_id)
    identity_issues = manual_action_identity_issues(manual_actions, signal_rows)
    review_feedback = review_feedback_summary(review_records)

    effects = []
    seen: set[tuple[str, int | None, str]] = set()
    for todo in todos:
        key = (todo.signal_id, todo.market_id, todo.review_window)
        if key in seen:
            continue
        seen.add(key)
        effect = build_review_effect_result(
            todo.signal_id,
            review_window=todo.review_window,
            market_id=todo.market_id,
            signal_rows=signal_rows,
        )
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
    rule_improvement = rule_improvement_readiness(manual_actions, effects, ready_count, identity_issues, review_feedback)
    review_wait_summary = review_wait_summary_from_effects(effects, ready_count)
    review_identity_audit = review_identity_audit_summary(manual_actions, review_records, effects, ready_count, identity_issues)
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
        "review_identity_audit": review_identity_audit,
        "effects": effects,
        "next_action": _next_action(manual_actions, effects, ready_count, identity_issues, review_feedback),
    }


def manual_action_identity_issues(manual_actions: list[Any], signal_rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    row_by_id = _signal_row_index(signal_rows)
    issues: list[dict[str, Any]] = []
    for record in manual_actions:
        object_type = str(getattr(record, "object_type", "") or "")
        object_id = str(getattr(record, "object_id", "") or "")
        if object_type not in {"advertised_product", "sales_product"}:
            continue
        if not _looks_like_snapshot_row_id(object_id):
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


def review_identity_audit_summary(
    manual_actions: list[Any],
    review_records: list[Any],
    effects: list[dict[str, Any]],
    ready_count: int,
    identity_issues: list[dict[str, Any]],
) -> dict[str, Any]:
    readback_keys = [review_readback_key(effect) for effect in effects]
    missing_action_id_count = sum(1 for item in readback_keys if not item["action_id"])
    missing_object_id_count = sum(1 for item in readback_keys if not item["object_id"])
    missing_review_window_count = sum(1 for item in readback_keys if not item["review_window"])
    unstable_object_id_count = len(identity_issues)
    issues = review_identity_audit_issues(readback_keys, identity_issues)
    return {
        "status": "blocked" if issues else "ready_for_readback",
        "manual_action_count": len(manual_actions),
        "review_record_count": len(review_records),
        "effect_count": len(effects),
        "missing_action_id_count": missing_action_id_count,
        "missing_object_id_count": missing_object_id_count,
        "missing_review_window_count": missing_review_window_count,
        "unstable_object_id_count": unstable_object_id_count,
        "ready_review_count": ready_count,
        "can_save_review_records_now": ready_count > 0 and not issues,
        "earliest_due_date": earliest_review_due_date(readback_keys),
        "earliest_metric_due_date": earliest_metric_review_due_date(readback_keys),
        "issues": issues,
        "readback_keys": readback_keys,
    }


def review_readback_key(effect: dict[str, Any]) -> dict[str, Any]:
    return {
        "signal_id": str(effect.get("signal_id") or "").strip(),
        "action_id": str(effect.get("action_id") or "").strip(),
        "object_type": str(effect.get("object_type") or "").strip(),
        "object_id": str(effect.get("object_id") or "").strip(),
        "object_label": str(effect.get("object_label") or "").strip(),
        "review_window": str(effect.get("review_window") or "").strip(),
        "status": str(effect.get("status") or "").strip(),
        "is_due": effect.get("is_due"),
        "due_at": str(effect.get("due_at") or "").strip(),
    }


def review_identity_audit_issues(
    readback_keys: list[dict[str, Any]],
    identity_issues: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    issues: list[dict[str, Any]] = []
    for item in readback_keys:
        for field in ("action_id", "object_id", "review_window"):
            if item.get(field):
                continue
            issues.append(
                {
                    "issue_type": f"missing_{field}",
                    "signal_id": item.get("signal_id"),
                    "action_id": item.get("action_id"),
                    "object_type": item.get("object_type"),
                    "object_id": item.get("object_id"),
                    "review_window": item.get("review_window"),
                    "note": "复盘读回缺少稳定键，不能保存 review_records。",
                }
            )
    for issue in identity_issues:
        issues.append(
            {
                "issue_type": "unstable_object_id",
                "signal_id": issue.get("signal_id"),
                "action_id": issue.get("action_id"),
                "object_type": issue.get("object_type"),
                "object_id": issue.get("current_object_id"),
                "review_window": None,
                "note": "人工动作对象仍像快照行 ID，必须人工确认稳定 ASIN / MSKU / SKU 后再复盘。",
            }
        )
    return issues


def earliest_review_due_date(readback_keys: list[dict[str, Any]]) -> str | None:
    due_dates = sorted(
        date
        for date in (_date_part(str(item.get("due_at") or "")) for item in readback_keys)
        if date
    )
    return due_dates[0] if due_dates else None


def earliest_metric_review_due_date(readback_keys: list[dict[str, Any]]) -> str | None:
    return earliest_review_due_date(
        [
            item
            for item in readback_keys
            if str(item.get("object_type") or "") in METRIC_REVIEW_OBJECT_TYPES
        ]
    )


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


def review_feedback_summary(review_records: list[Any]) -> dict[str, Any]:
    counts: dict[str, int] = {}
    signal_type_counts: dict[str, int] = {}
    for record in review_records:
        result = str(getattr(record, "result", "") or "").strip() or "unclear"
        if result not in REVIEW_RESULT_ORDER:
            result = "unclear"
        counts[result] = counts.get(result, 0) + 1
        signal_type_counts["unknown"] = signal_type_counts.get("unknown", 0) + 1

    by_result = {result: counts[result] for result in REVIEW_RESULT_ORDER if counts.get(result)}
    by_signal_type = {signal_type: signal_type_counts[signal_type] for signal_type in REVIEW_SIGNAL_TYPE_ORDER if signal_type_counts.get(signal_type)}
    total = sum(by_result.values())
    records = review_feedback_record_items(review_records)
    if total == 0:
        return {
            "total": 0,
            "by_result": {},
            "by_signal_type": {},
            "sample_sort": review_sample_sort_summary(),
            "action_boundaries": review_action_boundaries(),
            "closure_checklist": review_closure_checklist({}, []),
            "records": [],
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
        "sample_sort": review_sample_sort_summary(),
        "action_boundaries": review_action_boundaries(),
        "closure_checklist": review_closure_checklist(by_result, records),
        "records": records,
        "summary": f"已保存 {total} 条复盘记录：{result_text}；信号类型：{signal_type_text}。",
        "rule_feedback": f"{feedback_text}；该反馈只进入解释层，不自动调整广告动作或规则。",
    }


def review_sample_sort_summary() -> dict[str, Any]:
    return {"order": list(REVIEW_SAMPLE_SORT_ORDER), "reason": REVIEW_SAMPLE_SORT_REASON}


def review_action_boundaries() -> dict[str, dict[str, Any]]:
    return {result: review_action_boundary(result) for result in REVIEW_SAMPLE_SORT_ORDER}


def review_action_boundary(result: str) -> dict[str, Any]:
    boundary = REVIEW_ACTION_BOUNDARIES.get(result, REVIEW_ACTION_BOUNDARIES["unclear"])
    return {
        "result": result if result in REVIEW_ACTION_BOUNDARIES else "unclear",
        "allowed_reviews": list(boundary["allowed_reviews"]),
        "forbidden_actions": list(REVIEW_FORBIDDEN_ACTIONS),
        "boundary": str(boundary["boundary"]),
    }


def review_closure_checklist(by_result: dict[str, int], records: list[dict[str, Any]]) -> list[dict[str, str]]:
    result_text = " / ".join(f"{result} {count}" for result, count in by_result.items())
    evidence_count = sum(1 for record in records if record.get("evidence_groups"))
    record_count = len(records)
    evidence_status = "ready" if record_count > 0 and evidence_count == record_count else "partial" if evidence_count > 0 else "blocked"
    trace_count = sum(1 for record in records if review_record_trace_complete(record))
    trace_status = "ready" if record_count > 0 and trace_count == record_count else "partial" if trace_count > 0 else "blocked"
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


def review_record_trace_complete(record: dict[str, Any]) -> bool:
    metric_window = record.get("metric_window")
    return bool(
        str(record.get("review_record_id") or "").strip()
        and str(record.get("action_id") or "").strip()
        and isinstance(metric_window, dict)
        and str(metric_window.get("before") or "").strip()
        and str(metric_window.get("after") or "").strip()
    )


def review_feedback_record_items(review_records: list[Any], limit: int = 5) -> list[dict[str, Any]]:
    priority_order = {result: index for index, result in enumerate(REVIEW_SAMPLE_SORT_ORDER)}

    def item_sort_key(record: Any) -> tuple[int, str, str]:
        result = str(getattr(record, "result", "") or "").strip()
        reviewed_at = str(getattr(record, "reviewed_at", "") or "")
        signal_id = str(getattr(record, "signal_id", "") or "")
        return (priority_order.get(result, 99), reviewed_at, signal_id)

    items: list[dict[str, Any]] = []
    for record in sorted(review_records, key=item_sort_key)[:limit]:
        result = str(getattr(record, "result", "") or "").strip() or "unclear"
        if result not in REVIEW_RESULT_ORDER:
            result = "unclear"
        object_id = str(getattr(record, "object_id", "") or "").strip()
        object_label = str(getattr(record, "object_label", "") or "").strip() or object_id or "对象待补充"
        items.append(
            {
                "review_record_id": str(getattr(record, "id", "") or "").strip(),
                "signal_id": str(getattr(record, "signal_id", "") or "").strip(),
                "action_id": str(getattr(record, "action_id", "") or "").strip(),
                "signal_type": "unknown",
                "result": result,
                "object_type": str(getattr(record, "object_type", "") or "").strip() or "object",
                "object_id": object_id,
                "object_label": object_label,
                "review_window": str(getattr(record, "review_window", "") or "").strip(),
                "metric_window": review_feedback_metric_window(record),
                "review_note": str(getattr(record, "review_note", "") or "").strip(),
                "sort_reason": REVIEW_SAMPLE_RECORD_REASON.get(result, REVIEW_SAMPLE_RECORD_REASON["unclear"]),
                "action_boundary": review_action_boundary(result),
                "evidence_drilldown": None,
                "evidence_groups": [],
            }
        )
    return items


def review_feedback_metric_window(record: Any) -> dict[str, str] | None:
    before_start = str(getattr(record, "before_start_date", "") or "").strip()
    before_end = str(getattr(record, "before_end_date", "") or "").strip()
    after_start = str(getattr(record, "after_start_date", "") or "").strip()
    after_end = str(getattr(record, "after_end_date", "") or "").strip()
    if not (before_start and before_end and after_start and after_end):
        return None
    return {"before": f"{before_start} 至 {before_end}", "after": f"{after_start} 至 {after_end}"}


def _next_action(
    manual_actions: list[Any],
    effects: list[dict[str, Any]],
    ready_count: int,
    identity_issues: list[dict[str, Any]] | None = None,
    review_feedback: dict[str, Any] | None = None,
) -> str:
    if identity_issues:
        return "先处理历史人工动作对象 ID 风险：存在广告商品 / 销售商品记录仍使用快照行 ID；只读确认后再人工迁移为稳定 ASIN / MSKU / SKU。"
    if int((review_feedback or {}).get("total") or 0) > 0:
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


def rule_improvement_readiness(
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
    if int((review_feedback or {}).get("total") or 0) > 0:
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


def review_wait_summary_from_effects(effects: list[dict[str, Any]], ready_count: int) -> dict[str, Any]:
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


def compact_review_readiness_payload(payload: dict[str, Any]) -> dict[str, Any]:
    return {
        "status": payload.get("status"),
        "selected_market_id": payload.get("selected_market_id"),
        "counts": {
            "manual_actions": payload.get("manual_action_count", 0),
            "review_records": payload.get("review_record_count", 0),
            "ready": payload.get("ready_count", 0),
            "not_ready": payload.get("not_ready_count", 0),
            "signal_rows": payload.get("signal_row_count", 0),
        },
        "snapshot": payload.get("snapshot") or {},
        "rule_improvement": payload.get("rule_improvement") or {},
        "review_wait_summary": payload.get("review_wait_summary") or {},
        "review_identity_audit": payload.get("review_identity_audit") or {},
        "next_action": payload.get("next_action"),
        "effects": [compact_review_effect(effect) for effect in payload.get("effects", [])],
    }


def compact_review_effect(effect: dict[str, Any]) -> dict[str, Any]:
    object_type = _compact_text(effect.get("object_type"), "对象")
    object_id = _compact_text(effect.get("object_id") or effect.get("object_label"), "待补充")
    action_type = _compact_text(effect.get("action_type"), "待补充")
    action_id = _compact_text(effect.get("action_id"), "待补充")
    return {
        "signal_id": effect.get("signal_id"),
        "action": f"{action_type} / {action_id}",
        "shop_id": effect.get("shop_id"),
        "market_id": effect.get("market_id"),
        "object": f"{object_type} / {object_id}",
        "review_window": effect.get("review_window"),
        "status": effect.get("status"),
        "result": effect.get("result"),
        "is_due": effect.get("is_due"),
        "due_at": effect.get("due_at"),
        "message": effect.get("message"),
    }


def _compact_text(value: Any, fallback: str) -> str:
    text = str(value or "").strip()
    return text or fallback


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="只读检查当前人工动作和快照是否具备 ready 复盘效果")
    parser.add_argument("--market-id", type=int, default=None)
    parser.add_argument("--compact", action="store_true", help="只输出目标复盘所需的精简 JSON")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    payload = build_review_readiness_payload(selected_market_id=args.market_id)
    if args.compact:
        payload = compact_review_readiness_payload(payload)
    print(json.dumps(payload, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
