from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[1]
BACKEND_ROOT = PROJECT_ROOT / "backend"
sys.path.insert(0, str(BACKEND_ROOT))

from app.services import manual_action_preflight as preflight_service  # noqa: E402
from app.services.manual_actions import build_review_todos, load_manual_actions, load_review_records  # noqa: E402
from app.services.signal_triage import build_signal_triage_payload  # noqa: E402


MANUAL_ACTION_TYPES = preflight_service.MANUAL_ACTION_TYPES


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
    """CLI wrapper around the backend service, with patchable dependencies for tests."""
    originals = {
        "build_signal_triage_payload": preflight_service.build_signal_triage_payload,
        "load_manual_actions": preflight_service.load_manual_actions,
        "build_review_todos": preflight_service.build_review_todos,
        "load_review_records": preflight_service.load_review_records,
    }
    preflight_service.build_signal_triage_payload = _build_signal_triage_payload_for_service
    preflight_service.load_manual_actions = load_manual_actions
    preflight_service.build_review_todos = build_review_todos
    preflight_service.load_review_records = load_review_records
    try:
        return preflight_service.build_manual_action_preflight_payload(
            selected_market_id=selected_market_id,
            product_scope_id=product_scope_id,
            expected_object_id=expected_object_id,
            expected_object_type=expected_object_type,
            expected_action_type=expected_action_type,
            top=top,
            expect_written=expect_written,
            action_root=action_root,
            review_root=review_root,
        )
    finally:
        preflight_service.build_signal_triage_payload = originals["build_signal_triage_payload"]
        preflight_service.load_manual_actions = originals["load_manual_actions"]
        preflight_service.build_review_todos = originals["build_review_todos"]
        preflight_service.load_review_records = originals["load_review_records"]


def _build_signal_triage_payload_for_service(
    *,
    selected_market_id: int | None = None,
    top: int = 5,
    product_scope_id: str | None = None,
    action_root: Path | None = None,
    review_root: Path | None = None,
) -> dict[str, Any]:
    triage_kwargs: dict[str, Any] = {
        "selected_market_id": selected_market_id,
        "top": top,
        "product_scope_id": product_scope_id,
    }
    if action_root is not None:
        triage_kwargs["action_root"] = action_root
    if review_root is not None:
        triage_kwargs["review_root"] = review_root
    try:
        return build_signal_triage_payload(**triage_kwargs)
    except TypeError as error:
        if "unexpected keyword argument" not in str(error):
            raise
        return build_signal_triage_payload(
            selected_market_id=selected_market_id,
            top=top,
            product_scope_id=product_scope_id,
        )


def main() -> None:
    parser = argparse.ArgumentParser(description="只读检查人工留痕写入前后的验收口径。")
    parser.add_argument("--market-id", type=int, default=None)
    parser.add_argument("--product-scope-id", default=None)
    parser.add_argument("--expected-object-id", default=None)
    parser.add_argument("--expected-object-type", default=None)
    parser.add_argument("--action-type", choices=sorted(MANUAL_ACTION_TYPES), default=None)
    parser.add_argument("--top", type=int, default=5)
    parser.add_argument("--expect-written", action="store_true", help="只读验收目标人工留痕是否已经写入，并检查 7d / 14d 复盘待办。")
    parser.add_argument("--action-root", type=Path, default=None, help="临时 manual_actions 目录；用于隔离演练，不污染默认运行数据。")
    parser.add_argument("--review-root", type=Path, default=None, help="临时 review_records 目录；用于隔离验收，不读取默认复盘记录。")
    parser.add_argument("--compact", action="store_true")
    args = parser.parse_args()

    payload = build_manual_action_preflight_payload(
        selected_market_id=args.market_id,
        product_scope_id=args.product_scope_id,
        expected_object_id=args.expected_object_id,
        expected_object_type=args.expected_object_type,
        expected_action_type=args.action_type,
        top=args.top,
        expect_written=args.expect_written,
        action_root=args.action_root,
        review_root=args.review_root,
    )
    print(json.dumps(payload, ensure_ascii=False, separators=(",", ":") if args.compact else None, indent=None if args.compact else 2))


if __name__ == "__main__":
    main()
