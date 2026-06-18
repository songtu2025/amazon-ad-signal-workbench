from __future__ import annotations

import argparse
import asyncio
import json
import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SCRIPT_ROOT = Path(__file__).resolve().parent
BACKEND_ROOT = PROJECT_ROOT / "backend"
sys.path.insert(0, str(SCRIPT_ROOT))
sys.path.insert(0, str(BACKEND_ROOT))

from app.models.snapshots import SnapshotCreateRequest  # noqa: E402
from app.services.snapshot_inspection import inspect_api_snapshot  # noqa: E402
from app.services.snapshot_request import (  # noqa: E402
    SNAPSHOT_CONFIG_NEXT_ACTION,
    SnapshotRequestFailed,
    SnapshotRequestNotReady,
    build_snapshot_failure_result,
    request_api_snapshot,
)
from run_signal_scan import build_signal_scan_payload  # noqa: E402


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run Gerpgo API snapshot, inspection, and AI signal scan")
    parser.add_argument("--market-id", type=int, default=None)
    parser.add_argument("--days", type=int, choices=[7, 14, 30], default=7)
    parser.add_argument("--count", type=int, default=10)
    parser.add_argument("--max-pages", type=int, default=1)
    parser.add_argument("--sales-max-pages", type=int, default=None)
    parser.add_argument("--force", action="store_true")
    return parser.parse_args()


async def build_snapshot_pipeline_payload(
    *,
    market_id: int | None = None,
    days: int = 7,
    count: int = 10,
    max_pages: int = 1,
    sales_max_pages: int | None = None,
    force: bool = False,
) -> dict:
    request = SnapshotCreateRequest(
        market_id=market_id,
        days=days,
        count=count,
        max_pages=max_pages,
        sales_max_pages=sales_max_pages,
        force=force,
    )
    try:
        create_payload = (await request_api_snapshot(request)).model_dump(mode="json")
        pipeline_status = "completed"
    except SnapshotRequestNotReady as error:
        create_payload = {
            "status": "not_ready",
            "can_request_api": False,
            "missing": error.missing,
            "next_action": SNAPSHOT_CONFIG_NEXT_ACTION,
            "market_id": error.market_id,
            "message": str(error),
        }
        pipeline_status = "not_ready"
    except SnapshotRequestFailed as error:
        create_payload = build_snapshot_failure_result(error).model_dump(mode="json")
        pipeline_status = "failed"
    except RuntimeError as error:
        create_payload = build_snapshot_failure_result(SnapshotRequestFailed(market_id, error)).model_dump(mode="json")
        pipeline_status = "failed"

    inspection = inspect_api_snapshot()
    signal_scan = build_signal_scan_payload(selected_market_id=market_id)
    return {
        "pipeline_status": pipeline_status,
        "create": create_payload,
        "inspection": inspection,
        "signal_scan": signal_scan,
    }


async def main() -> None:
    args = parse_args()
    payload = await build_snapshot_pipeline_payload(
        market_id=args.market_id,
        days=args.days,
        count=args.count,
        max_pages=args.max_pages,
        sales_max_pages=args.sales_max_pages,
        force=args.force,
    )
    print(json.dumps(payload, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except Exception as exc:
        print(json.dumps({"pipeline_status": "failed", "error_message": str(exc)}, ensure_ascii=False, indent=2))
        raise SystemExit(1)
