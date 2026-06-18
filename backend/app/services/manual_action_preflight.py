from pathlib import Path
from typing import Any

from app.services.manual_actions import build_review_todos, load_manual_actions, load_review_records
from app.services.signal_triage import build_signal_triage_payload


MANUAL_ACTION_TYPES = {"observe", "handled", "add_to_review", "ignore"}
REVIEWABLE_ACTION_TYPES = {"observe", "handled", "add_to_review"}
ACTIONABLE_EVIDENCE_BLOCK_ORDER = (
    "diagnosis_judgement",
    "ad_group_problem_location",
    "targeting_context",
    "search_term_market_context",
    "manual_action_path",
    "review_metrics",
    "placement_context_gap",
    "downstream_context_gap",
    "context_boundary",
    "diagnosis_path",
)


def build_manual_action_preflight_payload(
    *,
    selected_market_id: int | None = None,
    product_scope_id: str | None = None,
    expected_object_id: str | None = None,
    expected_object_type: str | None = None,
    expected_action_type: str | None = None,
    top: int = 5,
    expect_written: bool = False,
    action_root: Path | None = None,
    review_root: Path | None = None,
) -> dict[str, Any]:
    triage = build_signal_triage_payload(
        selected_market_id=selected_market_id,
        top=top,
        product_scope_id=product_scope_id,
        **_triage_root_kwargs(action_root, review_root),
    )
    target = _target_from_triage(triage)
    requested_action_type = _manual_action_type(expected_action_type)
    if target and expected_action_type is not None:
        target = {**target, "action_type": requested_action_type or str(expected_action_type or "").strip()}

    manual_actions = load_manual_actions(market_id=selected_market_id, **_action_root_kwargs(action_root))
    review_todos = build_review_todos(market_id=selected_market_id, **_action_root_kwargs(action_root))
    review_records = load_review_records(market_id=selected_market_id, **_review_root_kwargs(review_root))
    review_status = _dict(triage.get("review_status"))

    target_manual_actions = [record for record in manual_actions if _matches_target(record, target)]
    target_review_todos = [todo for todo in review_todos if _matches_target(todo, target)]
    target_review_records = [record for record in review_records if _matches_target(record, target)]
    review_windows = _list(target.get("review_windows"))
    target_review_windows = sorted(
        {str(getattr(todo, "review_window", "") or "") for todo in target_review_todos if getattr(todo, "review_window", None)}
    )
    target_manual_action_evidence_snapshot_counts = [
        _target_evidence_snapshot_count(record) for record in target_manual_actions
    ]
    target_review_todo_evidence_snapshot_counts = [
        _target_evidence_snapshot_count(todo, include_review_window=True) for todo in target_review_todos
    ]
    evidence_snapshot_preview = _evidence_snapshot_preview(triage, target)
    if expect_written:
        blockers = _post_write_blockers(
            target=target,
            expected_object_id=expected_object_id,
            expected_object_type=expected_object_type,
            review_status=review_status,
            target_manual_actions=target_manual_actions,
            target_review_todos=target_review_todos,
            target_review_records=target_review_records,
            target_review_windows=target_review_windows,
            target_manual_action_evidence_snapshot_counts=target_manual_action_evidence_snapshot_counts,
            target_review_todo_evidence_snapshot_counts=target_review_todo_evidence_snapshot_counts,
        )
    else:
        blockers = _blockers(
            target=target,
            expected_object_id=expected_object_id,
            expected_object_type=expected_object_type,
            manual_actions=manual_actions,
            review_status=review_status,
        )
    ready = not blockers and bool(target)
    status = "post_write_verified" if expect_written and ready else "ready_for_explicit_manual_write" if ready else "blocked"
    review_todo_delta = len(review_windows) if ready and not expect_written and _needs_review_todos(target) else 0

    return {
        "status": status,
        "mode": "post_write" if expect_written else "pre_write",
        "will_write": False,
        "requires_explicit_authorization": not expect_written,
        "selected_market_id": selected_market_id,
        "selected_product_scope_id": product_scope_id,
        "snapshot": _dict(triage.get("snapshot")),
        "target": target,
        "current_counts": {
            "manual_action_count": len(manual_actions),
            "target_manual_action_count": len(target_manual_actions),
            "target_review_todo_count": len(target_review_todos),
            "review_record_count": len(review_records),
            "target_review_record_count": len(target_review_records),
        },
        "expected_after_write": {
            "manual_action_count": len(manual_actions) + (1 if ready and not expect_written else 0),
            "target_manual_action_count": len(target_manual_actions) + (1 if ready and not expect_written else 0),
            "target_review_todo_count": len(target_review_todos) + review_todo_delta,
            "review_record_count": len(review_records),
            "target_review_record_count": len(target_review_records),
        },
        "post_write_checks": {
            "target_manual_action_count": len(target_manual_actions),
            "target_manual_action_identities": [_target_identity(record) for record in target_manual_actions],
            "target_manual_action_evidence_snapshot_counts": target_manual_action_evidence_snapshot_counts,
            "target_review_todo_count": len(target_review_todos),
            "target_review_todo_identities": [
                _target_identity(todo, include_review_window=True) for todo in target_review_todos
            ],
            "target_review_todo_evidence_snapshot_counts": target_review_todo_evidence_snapshot_counts,
            "target_review_windows": target_review_windows,
            "target_review_record_count": len(target_review_records),
            "target_review_record_identities": [
                _target_identity(record, include_review_window=True) for record in target_review_records
            ],
        },
        "evidence_snapshot_preview": evidence_snapshot_preview,
        "blockers": blockers,
        "forbidden_effects": [
            "不请求积加 API",
            "不保存 review_records",
            "不执行广告动作",
            "不把快照行 ID 当复盘对象 ID",
        ],
        "next_action": _next_action(ready, target, blockers, expect_written=expect_written),
    }


def _target_from_triage(triage: dict[str, Any]) -> dict[str, Any]:
    candidate = _dict_or_none(triage.get("next_unhandled_candidate")) or _dict_or_none(triage.get("recommended_candidate")) or {}
    preview = _dict_or_none(candidate.get("manual_action_preview")) or _dict_or_none(triage.get("manual_action_preview")) or {}
    object_id = str(preview.get("object_id") or candidate.get("stable_object_id") or candidate.get("object_id") or "").strip()
    object_type = str(preview.get("object_type") or candidate.get("object_type") or "").strip()
    if not object_id or not object_type:
        return {}
    return {
        "signal_id": preview.get("signal_id") or candidate.get("signal_id"),
        "action_type": preview.get("action_type") or "add_to_review",
        "object_type": object_type,
        "object_id": object_id,
        "object_label": preview.get("object_label") or candidate.get("object_label"),
        "shop_id": preview.get("shop_id") or candidate.get("shop_id"),
        "shop_name": preview.get("shop_name") or candidate.get("shop_name"),
        "market_id": _int(preview.get("market_id")) or _int(candidate.get("market_id")),
        "review_windows": _list(preview.get("review_windows")),
    }


def _evidence_snapshot_preview(triage: dict[str, Any], target: dict[str, Any]) -> dict[str, Any]:
    drilldown = _evidence_drilldown_for_target(triage, target)
    blocks = _ordered_evidence_snapshot_blocks(_dict_list(drilldown.get("business_evidence_blocks")))
    items = [_evidence_snapshot_item(block) for block in blocks]
    items = [item for item in items if item["label"] and item["value"]]
    sources = sorted({item["source"] for item in items if item["source"]})
    return {
        "status": "ready" if items else "missing",
        "will_write": False,
        "will_save_on_authorized_write": bool(items),
        "item_count": len(items),
        "sources": sources,
        "items": items,
        "boundary": "只读预检；证据快照只有在人工明确点击后才会随 manual_action 保存，不执行广告动作。",
    }


def _ordered_evidence_snapshot_blocks(blocks: list[dict[str, Any]]) -> list[dict[str, Any]]:
    order = {block_id: index for index, block_id in enumerate(ACTIONABLE_EVIDENCE_BLOCK_ORDER)}
    if not any(str(block.get("block_id") or "").strip() in order for block in blocks):
        return blocks
    indexed_blocks = list(enumerate(blocks))
    return [
        block
        for _, block in sorted(
            indexed_blocks,
            key=lambda item: (order.get(str(item[1].get("block_id") or "").strip(), len(order)), item[0]),
        )
    ]


def _evidence_drilldown_for_target(triage: dict[str, Any], target: dict[str, Any]) -> dict[str, Any]:
    next_candidate = _dict_or_none(triage.get("next_unhandled_candidate"))
    if _candidate_matches_target(next_candidate, target):
        return _dict(triage.get("next_unhandled_evidence_drilldown"))
    recommended_candidate = _dict_or_none(triage.get("recommended_candidate"))
    if _candidate_matches_target(recommended_candidate, target):
        return _dict(triage.get("recommended_evidence_drilldown"))
    return _dict(triage.get("next_unhandled_evidence_drilldown")) or _dict(triage.get("recommended_evidence_drilldown"))


def _candidate_matches_target(candidate: dict[str, Any] | None, target: dict[str, Any]) -> bool:
    if not candidate or not target:
        return False
    preview = _dict_or_none(candidate.get("manual_action_preview")) or {}
    object_id = str(preview.get("object_id") or candidate.get("stable_object_id") or candidate.get("object_id") or "").strip()
    object_type = str(preview.get("object_type") or candidate.get("object_type") or "").strip()
    signal_id = str(preview.get("signal_id") or candidate.get("signal_id") or "").strip()
    return (
        object_id == str(target.get("object_id") or "").strip()
        and object_type == str(target.get("object_type") or "").strip()
        and (not signal_id or signal_id == str(target.get("signal_id") or "").strip())
    )


def _evidence_snapshot_item(block: dict[str, Any]) -> dict[str, str | None]:
    return {
        "label": str(block.get("label") or "").strip(),
        "value": str(block.get("value") or "").strip(),
        "detail": _optional_text(block.get("detail")),
        "source": _optional_text(block.get("source")),
    }


def _blockers(
    *,
    target: dict[str, Any],
    expected_object_id: str | None,
    expected_object_type: str | None,
    manual_actions: list[Any],
    review_status: dict[str, Any],
) -> list[dict[str, str]]:
    blockers: list[dict[str, str]] = []
    if not target:
        return [{"code": "missing_target", "message": "当前分诊 payload 缺少可写入的人工动作预检对象。"}]
    if expected_object_id and target.get("object_id") != expected_object_id:
        blockers.append(
            {
                "code": "object_id_mismatch",
                "message": f"目标对象不匹配：预检为 {target.get('object_id')}，期望为 {expected_object_id}。",
            }
        )
    if expected_object_type and target.get("object_type") != expected_object_type:
        blockers.append(
            {
                "code": "object_type_mismatch",
                "message": f"目标类型不匹配：预检为 {target.get('object_type')}，期望为 {expected_object_type}。",
            }
        )
    if _int(review_status.get("manual_action_identity_issue_count")):
        blockers.append({"code": "identity_issue", "message": "存在人工动作对象身份风险，先修复历史对象 ID。"})
    if not str(target.get("shop_id") or "").strip():
        blockers.append({"code": "missing_shop_context", "message": "目标人工动作缺少 shop_id，不能进入多店铺复盘写入。"})
    action_type = _manual_action_type(target.get("action_type"))
    if not action_type:
        blockers.append({"code": "invalid_action_type", "message": "目标人工动作类型无效，只允许 observe / handled / add_to_review / ignore。"})
    review_windows = {str(window) for window in _list(target.get("review_windows"))}
    if action_type in REVIEWABLE_ACTION_TYPES and not {"7d", "14d"}.issubset(review_windows):
        blockers.append({"code": "missing_review_windows", "message": "目标人工动作缺少完整 7d / 14d 复盘窗口，不能进入真实写入。"})
    if any(_matches_target(record, target) for record in manual_actions):
        blockers.append({"code": "duplicate_manual_action", "message": "目标对象已有人工留痕，不应重复写入。"})
    return blockers


def _post_write_blockers(
    *,
    target: dict[str, Any],
    expected_object_id: str | None,
    expected_object_type: str | None,
    review_status: dict[str, Any],
    target_manual_actions: list[Any],
    target_review_todos: list[Any],
    target_review_records: list[Any],
    target_review_windows: list[str],
    target_manual_action_evidence_snapshot_counts: list[dict[str, Any]],
    target_review_todo_evidence_snapshot_counts: list[dict[str, Any]],
) -> list[dict[str, str]]:
    blockers: list[dict[str, str]] = []
    if not target:
        return [{"code": "missing_target", "message": "当前分诊 payload 缺少可验收的人工动作对象。"}]
    if expected_object_id and target.get("object_id") != expected_object_id:
        blockers.append(
            {
                "code": "object_id_mismatch",
                "message": f"目标对象不匹配：预检为 {target.get('object_id')}，期望为 {expected_object_id}。",
            }
        )
    if expected_object_type and target.get("object_type") != expected_object_type:
        blockers.append(
            {
                "code": "object_type_mismatch",
                "message": f"目标类型不匹配：预检为 {target.get('object_type')}，期望为 {expected_object_type}。",
            }
        )
    if _int(review_status.get("manual_action_identity_issue_count")):
        blockers.append({"code": "identity_issue", "message": "存在人工动作对象身份风险，先修复历史对象 ID。"})
    if not str(target.get("shop_id") or "").strip():
        blockers.append({"code": "missing_shop_context", "message": "目标人工动作缺少 shop_id，不能验收多店铺复盘写入。"})
    action_type = _manual_action_type(target.get("action_type"))
    if not action_type:
        blockers.append({"code": "invalid_action_type", "message": "目标人工动作类型无效，只允许 observe / handled / add_to_review / ignore。"})
    if len(target_manual_actions) != 1:
        code = "missing_written_manual_action" if not target_manual_actions else "duplicate_written_manual_action"
        blockers.append(
            {
                "code": code,
                "message": f"写入后目标对象应有且仅有 1 条人工留痕，当前为 {len(target_manual_actions)} 条。",
            }
        )
    actual_action_types = {
        str(_record_value(record, "action_type") or "")
        for record in target_manual_actions
        if _record_value(record, "action_type") is not None
    }
    if actual_action_types and action_type and actual_action_types != {action_type}:
        blockers.append(
            {
                "code": "action_type_mismatch",
                "message": f"写入后人工动作类型应为 {action_type}，当前为 {sorted(actual_action_types)}。",
            }
        )
    if action_type in REVIEWABLE_ACTION_TYPES and (len(target_review_todos) != 2 or set(target_review_windows) != {"7d", "14d"}):
        blockers.append(
            {
                "code": "post_write_review_todo_mismatch",
                "message": "写入后目标对象必须生成完整 7d / 14d 复盘待办。",
            }
        )
    if action_type in REVIEWABLE_ACTION_TYPES and any(
        _int(item.get("evidence_snapshot_count")) == 0 for item in target_manual_action_evidence_snapshot_counts
    ):
        blockers.append(
            {
                "code": "missing_written_evidence_snapshot",
                "message": "写入后目标人工留痕必须可读回 evidence_snapshot，否则不能进入 7d / 14d 复盘。",
            }
        )
    if action_type in REVIEWABLE_ACTION_TYPES and any(
        _int(item.get("evidence_snapshot_count")) == 0 for item in target_review_todo_evidence_snapshot_counts
    ):
        blockers.append(
            {
                "code": "missing_review_todo_evidence_snapshot",
                "message": "写入后 7d / 14d 复盘待办必须继承 evidence_snapshot，否则复盘无证据可回读。",
            }
        )
    if action_type == "ignore" and target_review_todos:
        blockers.append(
            {
                "code": "post_write_unexpected_review_todo",
                "message": "忽略本次后不应进入当前 7d / 14d 复盘待办。",
            }
        )
    if target_review_records:
        blockers.append(
            {
                "code": "unexpected_review_record",
                "message": "写入后验收阶段不应已有目标复盘记录，必须等待 7d / 14d 窗口完整后再保存复盘结论。",
            }
        )
    return blockers


def _matches_target(record: Any, target: dict[str, Any]) -> bool:
    if not target:
        return False
    target_shop_id = str(target.get("shop_id") or "").strip()
    record_shop_id = str(getattr(record, "shop_id", "") or "").strip()
    if target_shop_id and record_shop_id != target_shop_id:
        return False
    return (
        str(getattr(record, "object_type", "") or "") == str(target.get("object_type") or "")
        and str(getattr(record, "object_id", "") or "") == str(target.get("object_id") or "")
        and (
            target.get("market_id") is None
            or getattr(record, "market_id", None) is None
            or _int(getattr(record, "market_id", None)) == _int(target.get("market_id"))
        )
    )


def _target_identity(record: Any, *, include_review_window: bool = False) -> dict[str, Any]:
    identity = {
        "signal_id": _record_value(record, "signal_id"),
        "shop_id": _record_value(record, "shop_id"),
        "market_id": _int(_record_value(record, "market_id")),
        "object_type": _record_value(record, "object_type"),
        "object_id": _record_value(record, "object_id"),
        "object_label": _record_value(record, "object_label"),
    }
    if include_review_window:
        identity["review_window"] = _record_value(record, "review_window")
    return identity


def _target_evidence_snapshot_count(record: Any, *, include_review_window: bool = False) -> dict[str, Any]:
    item = {
        "signal_id": _record_value(record, "signal_id"),
        "object_type": _record_value(record, "object_type"),
        "object_id": _record_value(record, "object_id"),
        "evidence_snapshot_count": _evidence_snapshot_item_count(record),
    }
    if include_review_window:
        item["review_window"] = _record_value(record, "review_window")
    return item


def _evidence_snapshot_item_count(record: Any) -> int:
    evidence_snapshot = _record_value(record, "evidence_snapshot")
    if not isinstance(evidence_snapshot, list):
        return 0
    return sum(
        1
        for item in evidence_snapshot
        if str(_record_value(item, "label") or "").strip() and str(_record_value(item, "value") or "").strip()
    )


def _record_value(record: Any, field: str) -> Any:
    if isinstance(record, dict):
        return record.get(field)
    return getattr(record, field, None)


def _manual_action_type(value: Any) -> str:
    action_type = str(value or "").strip()
    return action_type if action_type in MANUAL_ACTION_TYPES else ""


def _needs_review_todos(target: dict[str, Any]) -> bool:
    return _manual_action_type(target.get("action_type")) in REVIEWABLE_ACTION_TYPES


def _next_action(ready: bool, target: dict[str, Any], blockers: list[dict[str, str]], *, expect_written: bool = False) -> str:
    if ready:
        action_type = _manual_action_type(target.get("action_type"))
        review_text = (
            "已有 1 条人工留痕且不会进入当前 7d / 14d 复盘待办"
            if action_type == "ignore"
            else "已有 1 条人工留痕和完整 7d / 14d 复盘待办"
        )
        write_text = (
            "写入后只验收 manual_actions，且不生成当前 7d / 14d 复盘待办"
            if action_type == "ignore"
            else "写入后只验收 manual_actions 和 7d / 14d 复盘待办"
        )
        if expect_written:
            if action_type == "ignore":
                return (
                    f"写入后验收通过：{target.get('object_type')} / {target.get('object_id')} {review_text}；"
                    "本次不保存 review_records。"
                )
            return (
                f"写入后验收通过：{target.get('object_type')} / {target.get('object_id')} {review_text}；"
                "等待复盘窗口完整后再保存 review_records。"
            )
        return (
            f"等待明确人工授权后，才可对 {target.get('object_type')} / {target.get('object_id')} "
            f"执行一次人工留痕写入；{write_text}。"
        )
    if blockers:
        return "先处理阻塞项：" + "；".join(blocker["message"] for blocker in blockers)
    return "当前没有可写入目标，先回到分诊队列确认信号和对象口径。"


def _dict(value: Any) -> dict[str, Any]:
    return value if isinstance(value, dict) else {}


def _dict_or_none(value: Any) -> dict[str, Any] | None:
    return value if isinstance(value, dict) else None


def _list(value: Any) -> list[Any]:
    return value if isinstance(value, list) else []


def _dict_list(value: Any) -> list[dict[str, Any]]:
    return [item for item in value if isinstance(item, dict)] if isinstance(value, list) else []


def _optional_text(value: Any) -> str | None:
    text = str(value or "").strip()
    return text or None


def _int(value: Any) -> int | None:
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _action_root_kwargs(action_root: Path | None) -> dict[str, Path]:
    return {"action_root": action_root} if action_root is not None else {}


def _review_root_kwargs(review_root: Path | None) -> dict[str, Path]:
    return {"review_root": review_root} if review_root is not None else {}


def _triage_root_kwargs(action_root: Path | None, review_root: Path | None) -> dict[str, Path]:
    kwargs: dict[str, Path] = {}
    if action_root is not None:
        kwargs["action_root"] = action_root
    if review_root is not None:
        kwargs["review_root"] = review_root
    return kwargs
