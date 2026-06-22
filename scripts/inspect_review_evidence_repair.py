from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[1]
BACKEND_ROOT = PROJECT_ROOT / "backend"
sys.path.insert(0, str(BACKEND_ROOT))

from app.services.review_evidence_repair import build_review_evidence_repair_payload  # noqa: E402


def compact_review_evidence_repair_payload(payload: dict[str, Any]) -> dict[str, Any]:
    return {
        "status": payload.get("status"),
        "will_write": payload.get("will_write"),
        "selected_market_id": payload.get("selected_market_id"),
        "selected_product_scope_id": payload.get("selected_product_scope_id"),
        "rule_improvement_status": payload.get("rule_improvement_status"),
        "counts": payload.get("counts") or {},
        "items": [
            {
                "action_id": item.get("action_id"),
                "object": f"{item.get('object_type') or 'object'} / {item.get('object_id') or '待补充'}",
                "review_windows": item.get("review_windows") or [],
                "issue_types": item.get("issue_types") or [],
                "current_preflight_status": (item.get("current_preflight") or {}).get("status"),
                "target_matches_legacy": (item.get("current_preflight") or {}).get("target_matches_legacy"),
                "can_rebuild_evidence_preview": item.get("can_rebuild_evidence_preview"),
                "can_recreate_from_current_signal": item.get("can_recreate_from_current_signal"),
                "can_patch_legacy_record": item.get("can_patch_legacy_record"),
                "void_plan": item.get("void_plan") or {},
                "recommended_next_step": item.get("recommended_next_step"),
            }
            for item in payload.get("items", [])
        ],
        "next_action": payload.get("next_action"),
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="只读预检历史人工留痕证据快照缺口能否补录。")
    parser.add_argument("--market-id", type=int, default=None)
    parser.add_argument("--product-scope-id", default=None)
    parser.add_argument("--top", type=int, default=5)
    parser.add_argument("--compact", action="store_true")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    payload = build_review_evidence_repair_payload(
        selected_market_id=args.market_id,
        product_scope_id=args.product_scope_id,
        top=args.top,
    )
    if args.compact:
        payload = compact_review_evidence_repair_payload(payload)
    print(json.dumps(payload, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
