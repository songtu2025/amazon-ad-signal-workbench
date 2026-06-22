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
    DEFAULT_MANUAL_ACTION_ROOT,
    build_review_todos,
    save_review_todo_decision,
)
from app.services.review_evidence_repair import BASE_REPAIR_LABELS, SEARCH_TERM_REPAIR_LABELS  # noqa: E402


def build_review_todo_void_payload(
    *,
    selected_market_id: int | None = None,
    action_id: str,
    review_window: str | None = None,
    expected_object_type: str | None = None,
    expected_object_id: str | None = None,
    reason: str | None = None,
    operator_name: str = "本地运营",
    execute: bool = False,
    authorization_code: str | None = None,
    action_root: Path = DEFAULT_MANUAL_ACTION_ROOT,
) -> dict[str, Any]:
    current_todos = [
        todo
        for todo in build_review_todos(market_id=selected_market_id, action_root=action_root)
        if todo.action_id == action_id and (review_window is None or todo.review_window == review_window)
    ]
    target = _target_from_todos(current_todos)
    required_authorization_code = _authorization_code(action_id, review_window)
    base = {
        "mode": "execute" if execute else "dry_run",
        "will_write": False,
        "requires_explicit_authorization": True,
        "required_authorization_code": required_authorization_code,
        "selected_market_id": selected_market_id,
        "target": target,
        "current_todo_count": len(current_todos),
        "forbidden_effects": [
            "不修改 manual_actions.jsonl",
            "不保存 review_records",
            "不执行广告动作",
            "不补写历史 evidence_snapshot",
        ],
    }
    blockers = _blockers(
        todos=current_todos,
        target=target,
        expected_object_type=expected_object_type,
        expected_object_id=expected_object_id,
    )
    if blockers:
        return {
            **base,
            "status": "blocked",
            "blockers": blockers,
            "next_action": "不能作废旧待办：" + "；".join(blocker["message"] for blocker in blockers),
        }
    if not execute:
        return {
            **base,
            "status": "dry_run_ready",
            "blockers": [],
            "next_action": f"dry-run 通过，不会写入；如需真实作废，必须带授权码 {required_authorization_code}。",
        }
    if authorization_code != required_authorization_code:
        return {
            **base,
            "status": "blocked",
            "blockers": [
                {
                    "code": "missing_or_invalid_authorization_code",
                    "message": f"真实作废必须提供授权码 {required_authorization_code}。",
                }
            ],
            "next_action": "缺少明确授权码，不能写入复盘待办作废记录。",
        }

    first_todo = current_todos[0]
    record = save_review_todo_decision(
        action_id=first_todo.action_id,
        signal_id=first_todo.signal_id,
        review_window=review_window,
        reason=reason,
        operator_name=operator_name,
        shop_id=first_todo.shop_id,
        market_id=first_todo.market_id,
        object_type=first_todo.object_type,
        object_id=first_todo.object_id,
        object_label=first_todo.object_label,
        action_root=action_root,
    )
    remaining_todos = [
        todo
        for todo in build_review_todos(market_id=selected_market_id, action_root=action_root)
        if todo.action_id == action_id and (review_window is None or todo.review_window == review_window)
    ]
    verified = not remaining_todos
    return {
        **base,
        "status": "written_and_verified" if verified else "written_but_still_visible",
        "will_write": True,
        "requires_explicit_authorization": False,
        "written_record": record.model_dump(mode="json"),
        "post_write_todo_count": len(remaining_todos),
        "blockers": [] if verified else [{"code": "review_todo_still_visible", "message": "作废记录写入后目标待办仍可见。"}],
        "next_action": "旧复盘待办已作废；不要保存对应 ReviewRecord，后续应重新人工留痕生成新待办。"
        if verified
        else "作废记录已写入，但目标待办仍可见，先检查 action_id / review_window 口径。",
    }


def _target_from_todos(todos: list[Any]) -> dict[str, Any]:
    if not todos:
        return {}
    first = todos[0]
    return {
        "action_id": first.action_id,
        "signal_id": first.signal_id,
        "review_windows": [todo.review_window for todo in todos],
        "shop_id": first.shop_id,
        "market_id": first.market_id,
        "object_type": first.object_type,
        "object_id": first.object_id,
        "object_label": first.object_label,
    }


def _blockers(
    *,
    todos: list[Any],
    target: dict[str, Any],
    expected_object_type: str | None,
    expected_object_id: str | None,
) -> list[dict[str, str]]:
    blockers: list[dict[str, str]] = []
    if not todos:
        return [{"code": "review_todo_not_found", "message": "没有找到匹配 action_id / review_window 的复盘待办。"}]
    if expected_object_type and target.get("object_type") != expected_object_type:
        blockers.append(
            {
                "code": "object_type_mismatch",
                "message": f"目标类型不匹配：待办为 {target.get('object_type')}，期望为 {expected_object_type}。",
            }
        )
    if expected_object_id and target.get("object_id") != expected_object_id:
        blockers.append(
            {
                "code": "object_id_mismatch",
                "message": f"目标对象不匹配：待办为 {target.get('object_id')}，期望为 {expected_object_id}。",
            }
        )
    complete_todo = next((todo for todo in todos if _has_complete_replayable_evidence(todo)), None)
    if complete_todo is not None:
        required_labels = _required_replayable_evidence_labels(complete_todo)
        blockers.append(
            {
                "code": "review_todo_has_required_evidence",
                "message": f"目标待办已经包含{'、'.join(required_labels)}和对象引用，不能按历史缺证据待办作废。",
            }
        )
    return blockers


def _has_complete_replayable_evidence(todo: Any) -> bool:
    required_labels = _required_replayable_evidence_labels(todo)
    return all(_has_evidence_label(todo.evidence_snapshot, label) for label in required_labels) and (
        _has_object_reference(todo.evidence_snapshot, todo) is not False
    )


def _required_replayable_evidence_labels(todo: Any) -> tuple[str, ...]:
    if _text(_get(todo, "object_type")) == "search_term":
        return SEARCH_TERM_REPAIR_LABELS
    return BASE_REPAIR_LABELS


def _has_evidence_label(items: Any, expected_label: str) -> bool:
    if not isinstance(items, list):
        return False
    for item in items:
        if hasattr(item, "model_dump"):
            item = item.model_dump()
        if not isinstance(item, dict):
            continue
        if str(item.get("label") or "").strip() == expected_label and str(item.get("value") or "").strip():
            return True
    return False


def _has_object_reference(items: Any, todo: Any) -> bool | None:
    references = _object_reference_terms(todo)
    if not references:
        return None
    if not isinstance(items, list):
        return False
    snapshot_text = " ".join(
        " ".join(
            _text(_get(item, field))
            for field in ("label", "value", "detail", "source")
            if _text(_get(item, field))
        )
        for item in items
    ).casefold()
    return any(reference.casefold() in snapshot_text for reference in references)


def _object_reference_terms(todo: Any) -> list[str]:
    terms: list[str] = []
    for value in (_get(todo, "object_id"), _get(todo, "object_label")):
        text = _text(value)
        if text:
            terms.append(text)
        if ":" in text:
            tail = text.rsplit(":", 1)[-1].strip()
            if tail:
                terms.append(tail)
    return list(dict.fromkeys(terms))


def _get(item: Any, key: str) -> Any:
    if hasattr(item, "model_dump"):
        item = item.model_dump()
    if isinstance(item, dict):
        return item.get(key)
    return getattr(item, key, None)


def _text(value: Any) -> str:
    return str(value or "").strip()


def _authorization_code(action_id: str, review_window: str | None) -> str:
    return f"VOID_TODO:{action_id}:{review_window or 'all'}"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="显式作废历史缺证据的复盘待办；默认 dry-run，不写运行态数据。")
    parser.add_argument("--market-id", type=int, default=None)
    parser.add_argument("--action-id", required=True)
    parser.add_argument("--review-window", choices=["7d", "14d"], default=None)
    parser.add_argument("--expected-object-type", default=None)
    parser.add_argument("--expected-object-id", default=None)
    parser.add_argument("--reason", default=None)
    parser.add_argument("--operator-name", default="本地运营")
    parser.add_argument("--execute", action="store_true")
    parser.add_argument("--authorization-code", default=None)
    parser.add_argument("--action-root", type=Path, default=DEFAULT_MANUAL_ACTION_ROOT)
    parser.add_argument("--compact", action="store_true")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    payload = build_review_todo_void_payload(
        selected_market_id=args.market_id,
        action_id=args.action_id,
        review_window=args.review_window,
        expected_object_type=args.expected_object_type,
        expected_object_id=args.expected_object_id,
        reason=args.reason,
        operator_name=args.operator_name,
        execute=args.execute,
        authorization_code=args.authorization_code,
        action_root=args.action_root,
    )
    print(json.dumps(payload, ensure_ascii=False, separators=(",", ":") if args.compact else None, indent=None if args.compact else 2))


if __name__ == "__main__":
    main()
