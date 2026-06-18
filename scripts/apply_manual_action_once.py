from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[1]
BACKEND_ROOT = PROJECT_ROOT / "backend"
SCRIPTS_ROOT = PROJECT_ROOT / "scripts"
sys.path.insert(0, str(BACKEND_ROOT))
sys.path.insert(0, str(SCRIPTS_ROOT))

from app.services.manual_actions import save_manual_action  # noqa: E402
from inspect_manual_action_preflight import build_manual_action_preflight_payload  # noqa: E402


REVIEWABLE_ACTION_TYPES = {"observe", "handled", "add_to_review"}


def build_manual_action_apply_payload(
    *,
    selected_market_id: int | None = None,
    product_scope_id: str | None = None,
    expected_object_id: str | None = None,
    expected_object_type: str | None = None,
    action_type: str | None = None,
    top: int = 5,
    execute: bool = False,
    authorization_code: str | None = None,
    operator_name: str = "本地运营",
    action_note: str | None = None,
    action_root: Path | None = None,
    review_root: Path | None = None,
) -> dict[str, Any]:
    preflight = build_manual_action_preflight_payload(
        selected_market_id=selected_market_id,
        product_scope_id=product_scope_id,
        expected_object_id=expected_object_id,
        expected_object_type=expected_object_type,
        expected_action_type=action_type,
        top=top,
        expect_written=False,
        action_root=action_root,
        review_root=review_root,
    )
    target = _dict(preflight.get("target"))
    required_authorization_code = _authorization_code(target)
    base = {
        "mode": "execute" if execute else "dry_run",
        "will_write": False,
        "requires_explicit_authorization": True,
        "required_authorization_code": required_authorization_code,
        "selected_market_id": selected_market_id,
        "selected_product_scope_id": product_scope_id,
        "target": target,
        "preflight": preflight,
        "forbidden_effects": [
            "不请求积加 API",
            "不保存 review_records",
            "不执行广告动作",
            "不绕过 preflight 和 post-write 验收",
        ],
    }
    if preflight.get("status") != "ready_for_explicit_manual_write":
        return {
            **base,
            "status": "blocked",
            "blockers": _list(preflight.get("blockers")),
            "next_action": "preflight 未通过，不能写入人工留痕。",
        }
    if not execute:
        return {
            **base,
            "status": "dry_run_ready",
            "blockers": [],
            "next_action": f"dry-run 通过，不会写入；如需真实写一次，必须带授权码 {required_authorization_code}。",
        }
    if authorization_code != required_authorization_code:
        return {
            **base,
            "status": "blocked",
            "blockers": [
                {
                    "code": "missing_or_invalid_authorization_code",
                    "message": f"真实写入必须提供授权码 {required_authorization_code}。",
                }
            ],
            "next_action": "缺少明确授权码，不能写入人工留痕。",
        }

    action_to_write = str(target.get("action_type") or action_type or "add_to_review")
    evidence_snapshot = _evidence_snapshot_items(preflight)
    if action_to_write in REVIEWABLE_ACTION_TYPES and not evidence_snapshot:
        return {
            **base,
            "status": "blocked",
            "blockers": [
                {
                    "code": "missing_evidence_snapshot",
                    "message": "preflight 缺少可保存的 evidence_snapshot，复盘类人工动作不能写入。",
                }
            ],
            "next_action": "先让 preflight 返回同一目标的证据快照，再由人工明确授权写入。",
        }

    record = save_manual_action(
        signal_id=str(target.get("signal_id") or ""),
        action_type=action_to_write,
        action_note=action_note,
        operator_name=operator_name,
        snapshot_id=_dict(preflight.get("snapshot")).get("snapshot_id"),
        shop_id=target.get("shop_id"),
        market_id=_int(target.get("market_id")) or selected_market_id,
        object_type=str(target.get("object_type") or ""),
        object_id=str(target.get("object_id") or ""),
        object_label=target.get("object_label"),
        evidence_snapshot=evidence_snapshot,
        **_action_root_kwargs(action_root),
    )
    post_write = build_manual_action_preflight_payload(
        selected_market_id=selected_market_id,
        product_scope_id=product_scope_id,
        expected_object_id=expected_object_id,
        expected_object_type=expected_object_type,
        expected_action_type=action_type,
        top=top,
        expect_written=True,
        action_root=action_root,
        review_root=review_root,
    )
    verified = post_write.get("status") == "post_write_verified"
    post_write_next_action = str(post_write.get("next_action") or "").strip()
    record_dict = _record_to_dict(record)
    return {
        **base,
        "status": "written_and_verified" if verified else "written_but_post_write_blocked",
        "will_write": True,
        "requires_explicit_authorization": False,
        "written_record": record_dict,
        "post_write_validation": post_write,
        "smoke_assertions": _build_smoke_assertions(
            target=target,
            action_type=action_to_write,
            evidence_snapshot=evidence_snapshot,
            post_write=post_write,
            forbidden_effects=base["forbidden_effects"],
            verified=verified,
        ),
        "blockers": [] if verified else _list(post_write.get("blockers")),
        "next_action": (
            post_write_next_action or "人工留痕已写入且 post-write 验收通过。"
            if verified
            else "人工留痕已写入，但 post-write 验收未通过；先处理阻塞项。"
        ),
    }


def _authorization_code(target: dict[str, Any]) -> str | None:
    object_type = str(target.get("object_type") or "").strip()
    object_id = str(target.get("object_id") or "").strip()
    if not object_type or not object_id:
        return None
    return f"WRITE_ONCE:{object_type}:{object_id}"


def _record_to_dict(record: Any) -> dict[str, Any]:
    if hasattr(record, "model_dump"):
        return record.model_dump(mode="json")
    if hasattr(record, "__dict__"):
        return dict(record.__dict__)
    return {}


def _build_smoke_assertions(
    *,
    target: dict[str, Any],
    action_type: str,
    evidence_snapshot: list[dict[str, str | None]],
    post_write: dict[str, Any],
    forbidden_effects: list[str],
    verified: bool,
) -> dict[str, Any]:
    counts = _dict(post_write.get("current_counts"))
    target_review_todo_count = _int(counts.get("target_review_todo_count")) or 0
    target_review_record_count = _int(counts.get("target_review_record_count")) or 0
    written_evidence_snapshot_count = len(evidence_snapshot)
    checks = _dict(post_write.get("post_write_checks"))
    manual_action_evidence_snapshot_count = _sum_evidence_snapshot_counts(
        _list(checks.get("target_manual_action_evidence_snapshot_counts"))
    )
    review_todo_evidence_snapshot_counts = _evidence_snapshot_counts_by_review_window(
        _list(checks.get("target_review_todo_evidence_snapshot_counts"))
    )
    return {
        "status": "passed" if verified else "blocked",
        "target": {
            "object_type": str(target.get("object_type") or ""),
            "object_id": str(target.get("object_id") or ""),
            "action_type": action_type,
        },
        "manual_action_written": True,
        "target_manual_action_count": _int(counts.get("target_manual_action_count")) or 0,
        "target_review_todo_count": target_review_todo_count,
        "target_review_record_count": target_review_record_count,
        "written_evidence_snapshot_count": written_evidence_snapshot_count,
        "post_write_manual_action_evidence_snapshot_count": manual_action_evidence_snapshot_count,
        "post_write_review_todo_evidence_snapshot_counts": review_todo_evidence_snapshot_counts,
        "post_write_review_todos_with_evidence_snapshot": sum(
            1 for count in review_todo_evidence_snapshot_counts.values() if count > 0
        ),
        "review_todos_expected_to_inherit_evidence_snapshot": target_review_todo_count > 0 and written_evidence_snapshot_count > 0,
        "review_records_not_saved": target_review_record_count == 0 and "不保存 review_records" in forbidden_effects,
        "ad_actions_not_executed": "不执行广告动作" in forbidden_effects,
    }


def _sum_evidence_snapshot_counts(items: list[Any]) -> int:
    return sum(_int(_dict(item).get("evidence_snapshot_count")) or 0 for item in items)


def _evidence_snapshot_counts_by_review_window(items: list[Any]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for item in items:
        row = _dict(item)
        review_window = str(row.get("review_window") or "").strip()
        if not review_window:
            continue
        counts[review_window] = _int(row.get("evidence_snapshot_count")) or 0
    return counts


def _dict(value: Any) -> dict[str, Any]:
    return value if isinstance(value, dict) else {}


def _list(value: Any) -> list[Any]:
    return value if isinstance(value, list) else []


def _evidence_snapshot_items(preflight: dict[str, Any]) -> list[dict[str, str | None]]:
    preview = _dict(preflight.get("evidence_snapshot_preview"))
    raw_items = preview.get("items")
    if not isinstance(raw_items, list):
        return []
    items: list[dict[str, str | None]] = []
    for raw_item in raw_items:
        if not isinstance(raw_item, dict):
            continue
        label = str(raw_item.get("label") or "").strip()
        value = str(raw_item.get("value") or "").strip()
        if not label or not value:
            continue
        items.append(
            {
                "label": label,
                "value": value,
                "detail": _optional_text(raw_item.get("detail")),
                "source": _optional_text(raw_item.get("source")),
            }
        )
    return items


def _optional_text(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def _int(value: Any) -> int | None:
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _action_root_kwargs(action_root: Path | None) -> dict[str, Path]:
    return {"action_root": action_root} if action_root is not None else {}


def main() -> None:
    parser = argparse.ArgumentParser(description="在明确授权后写入一次人工留痕，并立即做 post-write 只读验收。默认 dry-run。")
    parser.add_argument("--market-id", type=int, default=None)
    parser.add_argument("--product-scope-id", default=None)
    parser.add_argument("--expected-object-id", default=None)
    parser.add_argument("--expected-object-type", default=None)
    parser.add_argument("--action-type", choices=["add_to_review", "handled", "ignore", "observe"], default=None)
    parser.add_argument("--top", type=int, default=5)
    parser.add_argument("--execute", action="store_true", help="执行真实人工留痕写入；缺少授权码时仍会 blocked。")
    parser.add_argument("--authorization-code", default=None)
    parser.add_argument("--operator-name", default="本地运营")
    parser.add_argument("--action-note", default=None)
    parser.add_argument("--action-root", type=Path, default=None, help="临时 manual_actions 目录；用于隔离演练，不污染默认运行数据。")
    parser.add_argument("--review-root", type=Path, default=None, help="临时 review_records 目录；用于隔离验收，不读取默认复盘记录。")
    parser.add_argument("--compact", action="store_true")
    args = parser.parse_args()

    payload = build_manual_action_apply_payload(
        selected_market_id=args.market_id,
        product_scope_id=args.product_scope_id,
        expected_object_id=args.expected_object_id,
        expected_object_type=args.expected_object_type,
        action_type=args.action_type,
        top=args.top,
        execute=args.execute,
        authorization_code=args.authorization_code,
        operator_name=args.operator_name,
        action_note=args.action_note,
        action_root=args.action_root,
        review_root=args.review_root,
    )
    print(json.dumps(payload, ensure_ascii=False, separators=(",", ":") if args.compact else None, indent=None if args.compact else 2))


if __name__ == "__main__":
    main()
