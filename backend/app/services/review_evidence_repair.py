from pathlib import Path
from typing import Any

from app.services.manual_action_preflight import build_manual_action_preflight_payload
from app.services.manual_actions import (
    DEFAULT_MANUAL_ACTION_ROOT,
    DEFAULT_REVIEW_RECORD_ROOT,
    build_review_todos,
    load_manual_actions,
)
from app.services.signal_triage import build_review_readiness_payload


REPAIR_ISSUE_TYPES = {
    "missing_evidence_snapshot",
    "missing_diagnosis_path",
    "missing_ai_admission",
    "missing_search_term_boundary",
    "missing_placement_boundary",
    "missing_ad_product_coverage",
    "missing_placement_performance",
    "missing_targeting_evidence",
    "missing_ad_group_synthesis",
    "missing_ad_group_product_performance",
    "missing_aba_context",
    "missing_evidence_gap",
    "missing_required_evidence",
    "missing_action_boundary",
    "evidence_snapshot_object_mismatch",
}
BASE_REPAIR_LABELS = ("排查路径", "AI 准入", "搜索词边界", "广告位边界")
SEARCH_TERM_REPAIR_LABELS = (
    *BASE_REPAIR_LABELS,
    "投放词证据",
    "广告组合流判断",
    "同组投放商品表现",
    "ABA 背景",
    "证据缺口",
    "需要补证",
    "动作边界",
)
ADVERTISED_PRODUCT_REPAIR_LABELS = (
    *BASE_REPAIR_LABELS,
    "广告商品覆盖",
    "广告组合流判断",
    "同组投放商品表现",
    "证据缺口",
    "需要补证",
    "动作边界",
)
PLACEMENT_REPAIR_LABELS = (
    *BASE_REPAIR_LABELS,
    "广告位表现",
    "证据缺口",
    "需要补证",
    "动作边界",
)


def build_review_evidence_repair_payload(
    *,
    selected_market_id: int | None = None,
    product_scope_id: str | None = None,
    top: int = 5,
    action_root: Path = DEFAULT_MANUAL_ACTION_ROOT,
    review_root: Path = DEFAULT_REVIEW_RECORD_ROOT,
) -> dict[str, Any]:
    readiness = build_review_readiness_payload(
        selected_market_id=selected_market_id,
        action_root=action_root,
        review_root=review_root,
    )
    issues = [
        issue
        for issue in _dict_list(_dict(readiness.get("review_identity_audit")).get("issues"))
        if str(issue.get("issue_type") or "").strip() in REPAIR_ISSUE_TYPES
    ]
    manual_actions = load_manual_actions(market_id=selected_market_id, action_root=action_root)
    review_todos = build_review_todos(market_id=selected_market_id, action_root=action_root)
    groups = _legacy_gap_groups(issues, manual_actions, review_todos)
    repair_items = [
        _repair_item(
            group,
            selected_market_id=selected_market_id,
            product_scope_id=product_scope_id,
            top=top,
            action_root=action_root,
            review_root=review_root,
        )
        for group in groups
    ]
    preview_rebuildable_count = sum(1 for item in repair_items if item["can_rebuild_evidence_preview"])
    recreatable_count = sum(1 for item in repair_items if item["can_recreate_from_current_signal"])
    status = "ready_no_legacy_gap" if not repair_items else "blocked_by_legacy_evidence_gap"
    return {
        "status": status,
        "will_write": False,
        "requires_explicit_authorization": bool(repair_items),
        "selected_market_id": selected_market_id,
        "selected_product_scope_id": product_scope_id,
        "readiness_status": readiness.get("status"),
        "rule_improvement_status": _dict(readiness.get("rule_improvement")).get("status"),
        "counts": {
            "manual_actions": len(manual_actions),
            "review_todos": len(review_todos),
            "repair_issue_count": len(issues),
            "legacy_action_gap_count": len(repair_items),
            "preview_rebuildable_count": preview_rebuildable_count,
            "recreatable_count": recreatable_count,
        },
        "items": repair_items,
        "forbidden_effects": [
            "不修改 manual_actions.jsonl",
            "不保存 review_records",
            "不执行广告动作",
            "不把当前页面证据伪装成历史点击证据",
        ],
        "next_action": _payload_next_action(
            repair_items,
            preview_rebuildable_count,
            recreatable_count,
            readiness=readiness,
        ),
    }


def _legacy_gap_groups(
    issues: list[dict[str, Any]],
    manual_actions: list[Any],
    review_todos: list[Any],
) -> list[dict[str, Any]]:
    action_by_id = {str(_value(action, "id") or "").strip(): action for action in manual_actions}
    todos_by_key: dict[tuple[str, str, str, str], list[Any]] = {}
    for todo in review_todos:
        key = _gap_key(
            action_id=_value(todo, "action_id"),
            signal_id=_value(todo, "signal_id"),
            object_type=_value(todo, "object_type"),
            object_id=_value(todo, "object_id"),
        )
        todos_by_key.setdefault(key, []).append(todo)

    grouped: dict[tuple[str, str, str, str], dict[str, Any]] = {}
    for issue in issues:
        key = _gap_key(
            action_id=issue.get("action_id"),
            signal_id=issue.get("signal_id"),
            object_type=issue.get("object_type"),
            object_id=issue.get("object_id"),
        )
        group = grouped.setdefault(
            key,
            {
                "action_id": key[0],
                "signal_id": key[1],
                "object_type": key[2],
                "object_id": key[3],
                "issue_types": set(),
                "issue_notes": [],
            },
        )
        issue_type = str(issue.get("issue_type") or "").strip()
        if issue_type:
            group["issue_types"].add(issue_type)
        note = str(issue.get("note") or "").strip()
        if note and note not in group["issue_notes"]:
            group["issue_notes"].append(note)

    groups: list[dict[str, Any]] = []
    for key, group in grouped.items():
        action = action_by_id.get(group["action_id"])
        todos = todos_by_key.get(key, [])
        if not action and todos:
            action = action_by_id.get(str(_value(todos[0], "action_id") or "").strip())
        first_todo = todos[0] if todos else None
        group["issue_types"] = sorted(group["issue_types"])
        group["review_windows"] = _ordered_review_windows(_value(todo, "review_window") for todo in todos)
        group["action_type"] = _text(_value(action, "action_type")) or _text(_value(first_todo, "action_type"))
        group["shop_id"] = _text(_value(action, "shop_id")) or _text(_value(first_todo, "shop_id"))
        group["market_id"] = _int(_value(action, "market_id")) or _int(_value(first_todo, "market_id"))
        group["object_label"] = _text(_value(action, "object_label")) or _text(_value(first_todo, "object_label"))
        group["acted_at"] = _text(_value(action, "acted_at")) or _text(_value(first_todo, "acted_at"))
        group["todo_count"] = len(todos)
        groups.append(group)
    return sorted(groups, key=lambda item: (item.get("acted_at") or "", item.get("action_id") or ""))


def _repair_item(
    group: dict[str, Any],
    *,
    selected_market_id: int | None,
    product_scope_id: str | None,
    top: int,
    action_root: Path,
    review_root: Path,
) -> dict[str, Any]:
    preflight = build_manual_action_preflight_payload(
        selected_market_id=selected_market_id,
        product_scope_id=product_scope_id,
        expected_object_id=group.get("object_id"),
        expected_object_type=group.get("object_type"),
        expected_action_type=group.get("action_type") or "add_to_review",
        top=top,
        expect_written=False,
        action_root=action_root,
        review_root=review_root,
    )
    target = _dict(preflight.get("target"))
    preview = _dict(preflight.get("evidence_snapshot_preview"))
    preview_items = _dict_list(preview.get("items"))
    target_matches = _target_matches_group(target, group)
    required_labels = _required_repair_labels(group)
    missing_preview_labels = [
        label
        for label in required_labels
        if not _preview_has_label(preview_items, label)
    ]
    has_object_reference = _preview_has_object_reference(preview_items, group)
    can_rebuild_evidence_preview = (
        target_matches
        and not missing_preview_labels
        and has_object_reference is not False
        and bool(preview_items)
    )
    can_recreate_from_current_signal = (
        can_rebuild_evidence_preview
        and preflight.get("status") == "ready_for_explicit_manual_write"
        and not _dict_list(preflight.get("blockers"))
    )
    return {
        "action_id": group.get("action_id"),
        "signal_id": group.get("signal_id"),
        "action_type": group.get("action_type"),
        "shop_id": group.get("shop_id"),
        "market_id": group.get("market_id"),
        "object_type": group.get("object_type"),
        "object_id": group.get("object_id"),
        "object_label": group.get("object_label"),
        "review_windows": group.get("review_windows") or [],
        "issue_types": group.get("issue_types") or [],
        "todo_count": group.get("todo_count") or 0,
        "current_preflight": {
            "status": preflight.get("status"),
            "target_matches_legacy": target_matches,
            "target": _compact_target(target),
            "blockers": _dict_list(preflight.get("blockers")),
            "evidence_snapshot_status": preview.get("status"),
            "evidence_snapshot_item_count": _int(preview.get("item_count")) or len(preview_items),
            "has_diagnosis_path": _preview_has_label(preview_items, "排查路径"),
            "has_ai_admission": _preview_has_label(preview_items, "AI 准入"),
            "has_search_term_boundary": _preview_has_label(preview_items, "搜索词边界"),
            "has_placement_boundary": _preview_has_label(preview_items, "广告位边界"),
            "has_parent_asin_scope": _preview_has_label(preview_items, "Parent ASIN入口"),
            "has_ad_asin_coverage": _preview_has_label(preview_items, "广告 ASIN承接"),
            "has_ad_product_coverage": _preview_has_label(preview_items, "广告商品覆盖"),
            "has_placement_performance": _preview_has_label(preview_items, "广告位表现"),
            "has_targeting_evidence": _preview_has_label(preview_items, "投放词证据"),
            "has_ad_group_synthesis": _preview_has_label(preview_items, "广告组合流判断"),
            "has_ad_group_product_performance": _preview_has_label(preview_items, "同组投放商品表现"),
            "has_aba_context": _preview_has_label(preview_items, "ABA 背景"),
            "has_evidence_gap": _preview_has_label(preview_items, "证据缺口"),
            "has_required_evidence": _preview_has_label(preview_items, "需要补证"),
            "has_action_boundary": _preview_has_label(preview_items, "动作边界"),
            "has_object_reference": has_object_reference,
            "missing_required_labels": missing_preview_labels,
        },
        "can_rebuild_evidence_preview": can_rebuild_evidence_preview,
        "can_recreate_from_current_signal": can_recreate_from_current_signal,
        "can_patch_legacy_record": False,
        "patch_policy": "历史记录缺少点击当时保存的 evidence_snapshot；当前重建证据只能作为人工核对参考，不能静默写回旧记录；MVP 不提供补写历史 evidence_snapshot 的执行入口。",
        "void_plan": _void_plan(group),
        "recommended_next_step": _item_next_step(
            target_matches=target_matches,
            can_rebuild_evidence_preview=can_rebuild_evidence_preview,
            can_recreate_from_current_signal=can_recreate_from_current_signal,
            missing_required_labels=missing_preview_labels,
            blockers=_dict_list(preflight.get("blockers")),
        ),
        "will_write": False,
    }


def _void_plan(group: dict[str, Any]) -> dict[str, Any]:
    action_id = _text(group.get("action_id"))
    object_type = _text(group.get("object_type"))
    object_id = _text(group.get("object_id"))
    market_id = _int(group.get("market_id"))
    authorization_code = _authorization_code(action_id, None)
    return {
        "status": "dry_run_available" if action_id else "missing_action_id",
        "action_id": action_id,
        "review_window": None,
        "review_windows": group.get("review_windows") or [],
        "expected_object_type": object_type,
        "expected_object_id": object_id,
        "required_authorization_code": authorization_code if action_id else None,
        "dry_run_command": _void_command(
            market_id=market_id,
            action_id=action_id,
            object_type=object_type,
            object_id=object_id,
            authorization_code=None,
            execute=False,
        ),
        "execute_command": _void_command(
            market_id=market_id,
            action_id=action_id,
            object_type=object_type,
            object_id=object_id,
            authorization_code=authorization_code,
            execute=True,
        ),
        "boundary": "先 dry-run 核对对象和窗口；execute 必须显式带授权码。该动作只写 review_todo_decisions，不修改 manual_actions，不保存 ReviewRecord，不执行广告动作。",
    }


def _authorization_code(action_id: str, review_window: str | None) -> str:
    return f"VOID_TODO:{action_id}:{review_window or 'all'}"


def _void_command(
    *,
    market_id: int | None,
    action_id: str,
    object_type: str,
    object_id: str,
    authorization_code: str | None,
    execute: bool,
) -> str | None:
    if not action_id:
        return None
    parts = ["python", "scripts\\apply_review_todo_void_once.py"]
    if market_id is not None:
        parts.extend(["--market-id", str(market_id)])
    parts.extend(["--action-id", action_id])
    if object_type:
        parts.extend(["--expected-object-type", object_type])
    if object_id:
        parts.extend(["--expected-object-id", object_id])
    if execute:
        parts.append("--execute")
    if authorization_code:
        parts.extend(["--authorization-code", authorization_code])
    parts.append("--compact")
    return " ".join(_cli_arg(part) for part in parts)


def _cli_arg(value: str) -> str:
    if not value:
        return '""'
    if any(char.isspace() for char in value) or any(char in value for char in ['"', "'", ":"]):
        return '"' + value.replace('"', '\\"') + '"'
    return value


def _target_matches_group(target: dict[str, Any], group: dict[str, Any]) -> bool:
    if not target:
        return False
    if _text(target.get("object_type")) != _text(group.get("object_type")):
        return False
    if _text(target.get("object_id")) != _text(group.get("object_id")):
        return False
    target_shop_id = _text(target.get("shop_id"))
    group_shop_id = _text(group.get("shop_id"))
    if target_shop_id and group_shop_id and target_shop_id != group_shop_id:
        return False
    target_market_id = _int(target.get("market_id"))
    group_market_id = _int(group.get("market_id"))
    return not (target_market_id is not None and group_market_id is not None and target_market_id != group_market_id)


def _required_repair_labels(group: dict[str, Any]) -> tuple[str, ...]:
    object_type = _text(group.get("object_type"))
    if object_type == "search_term":
        return SEARCH_TERM_REPAIR_LABELS
    if object_type == "advertised_product":
        return ADVERTISED_PRODUCT_REPAIR_LABELS
    if object_type == "placement":
        return PLACEMENT_REPAIR_LABELS
    return BASE_REPAIR_LABELS


def _compact_target(target: dict[str, Any]) -> dict[str, Any]:
    return {
        "signal_id": target.get("signal_id"),
        "action_type": target.get("action_type"),
        "shop_id": target.get("shop_id"),
        "market_id": target.get("market_id"),
        "object_type": target.get("object_type"),
        "object_id": target.get("object_id"),
        "object_label": target.get("object_label"),
    }


def _item_next_step(
    *,
    target_matches: bool,
    can_rebuild_evidence_preview: bool,
    can_recreate_from_current_signal: bool,
    missing_required_labels: list[str],
    blockers: list[dict[str, Any]],
) -> str:
    if can_recreate_from_current_signal:
        return "当前同一对象仍可通过人工确认重新留痕；新留痕会生成新的 ReviewTodo，旧记录仍不得静默修补。"
    if can_rebuild_evidence_preview:
        blocker_text = "；".join(
            str(blocker.get("message") or "").strip().rstrip("。；; ")
            for blocker in blockers
            if blocker.get("message")
        )
        return (
            "当前能重建同一对象的证据预览，但真实写入仍被门禁挡住。"
            + (f"阻塞项：{blocker_text}。" if blocker_text else "")
            + "当前可落地路径是先 dry-run 作废旧待办，再重新人工留痕生成新的 ReviewTodo；不能补写历史 evidence_snapshot。"
        )
    if target_matches:
        missing_text = "、".join(missing_required_labels) or "完整证据快照"
        return f"当前预检目标匹配历史对象，但当前证据预览仍缺：{missing_text}，不能作为补写历史证据；需要重新形成完整诊断证据后重新人工留痕，或先 dry-run 作废旧待办。"
    return "当前预检目标不是这个历史待办对象，不能用当前信号证据修补历史；建议先 dry-run 作废旧待办，后续重新人工留痕。"


def _payload_next_action(
    repair_items: list[dict[str, Any]],
    preview_rebuildable_count: int,
    recreatable_count: int,
    *,
    readiness: dict[str, Any],
) -> str:
    if not repair_items:
        rule_status = _text(_dict(readiness.get("rule_improvement")).get("status"))
        ready_count = _int(readiness.get("ready_count")) or 0
        if rule_status == "waiting_review_window" or ready_count <= 0:
            return "当前没有历史证据快照缺口；继续等待复盘窗口，未到期前不保存 ReviewRecord。"
        return "当前没有历史证据快照缺口；仅当复盘对象已 ready 且人工核对通过后，才可保存 ReviewRecord。"
    if recreatable_count:
        return f"发现 {len(repair_items)} 个历史动作缺证据，其中 {recreatable_count} 个可重新人工留痕；仍不得静默补旧记录或保存 ReviewRecord。"
    if preview_rebuildable_count:
        return f"发现 {len(repair_items)} 个历史动作缺证据，其中 {preview_rebuildable_count} 个只能重建当前证据预览；预览不能写回历史 evidence_snapshot，当前可落地路径是先 dry-run 作废旧待办，再重新人工留痕。"
    return f"发现 {len(repair_items)} 个历史动作缺证据，当前信号不能直接重建同对象证据；先 dry-run 作废旧待办，后续重新人工留痕。"


def _gap_key(*, action_id: Any, signal_id: Any, object_type: Any, object_id: Any) -> tuple[str, str, str, str]:
    return (_text(action_id), _text(signal_id), _text(object_type), _text(object_id))


def _ordered_review_windows(values: Any) -> list[str]:
    raw = {_text(value) for value in values}
    ordered = [value for value in ("7d", "14d") if value in raw]
    ordered.extend(sorted(value for value in raw if value and value not in {"7d", "14d"}))
    return ordered


def _preview_has_label(items: list[dict[str, Any]], label: str) -> bool:
    return any(_text(item.get("label")) == label and bool(_text(item.get("value"))) for item in items)


def _preview_has_object_reference(items: list[dict[str, Any]], group: dict[str, Any]) -> bool | None:
    references = _object_reference_terms(group)
    if not references:
        return None
    snapshot_text = " ".join(
        " ".join(
            _text(item.get(field))
            for field in ("label", "value", "detail", "source")
            if _text(item.get(field))
        )
        for item in items
    ).casefold()
    return any(reference.casefold() in snapshot_text for reference in references)


def _object_reference_terms(group: dict[str, Any]) -> list[str]:
    terms: list[str] = []
    for value in (group.get("object_id"), group.get("object_label")):
        text = _text(value)
        if text:
            terms.append(text)
        if ":" in text:
            tail = text.rsplit(":", 1)[-1].strip()
            if tail:
                terms.append(tail)
    return list(dict.fromkeys(terms))


def _value(item: Any, key: str) -> Any:
    if item is None:
        return None
    if isinstance(item, dict):
        return item.get(key)
    return getattr(item, key, None)


def _dict(value: Any) -> dict[str, Any]:
    return value if isinstance(value, dict) else {}


def _dict_list(value: Any) -> list[dict[str, Any]]:
    return [item for item in value if isinstance(item, dict)] if isinstance(value, list) else []


def _text(value: Any) -> str:
    return str(value or "").strip()


def _int(value: Any) -> int | None:
    try:
        return int(value)
    except (TypeError, ValueError):
        return None
