from __future__ import annotations

import argparse
import asyncio
import json
import sys
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[1]
BACKEND_ROOT = PROJECT_ROOT / "backend"
sys.path.insert(0, str(BACKEND_ROOT))

from app.services.gerpgo_snapshot import (  # noqa: E402
    check_snapshot_readiness,
    create_gerpgo_snapshot,
    list_gerpgo_rate_limit_rules,
    load_gerpgo_config,
    probe_gerpgo_market_access,
)
from app.services.market_options import save_probe_market_option  # noqa: E402
from app.services.snapshot_guidance import SNAPSHOT_API_FAILURE_NEXT_ACTION  # noqa: E402
from app.services.snapshot_inspection import inspect_api_snapshot  # noqa: E402


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="手动拉取低频积加 API 快照")
    parser.add_argument("--market-id", type=int, default=None)
    parser.add_argument("--days", type=int, choices=[7, 14, 30], default=7)
    parser.add_argument("--count", type=int, default=10)
    parser.add_argument("--max-pages", type=int, default=1)
    parser.add_argument("--sales-max-pages", type=int, default=None)
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--check-config", action="store_true")
    parser.add_argument("--check-rate-limits", action="store_true")
    parser.add_argument("--probe-api", action="store_true")
    parser.add_argument("--probe-config-markets", action="store_true")
    return parser.parse_args()


async def probe_configured_markets(config: Any) -> dict[str, Any]:
    candidate_market_ids = list(getattr(config, "market_ids", None) or [])
    if not candidate_market_ids:
        readiness = check_snapshot_readiness(config, selected_market_id=None)
        return {
            "status": "not_ready",
            "api_name": "market_names",
            "candidate_market_ids": [],
            "results": [],
            "ready_count": 0,
            "not_ready_count": 0,
            "failed_count": 0,
            "readiness": readiness,
            "next_action": readiness.get("next_action"),
            "message": "新项目未配置可探测的 GERPGO_MARKET_IDS",
        }

    results: list[dict[str, Any]] = []
    for candidate_market_id in candidate_market_ids:
        readiness = check_snapshot_readiness(config, selected_market_id=int(candidate_market_id))
        if not readiness["ready"]:
            results.append(
                {
                    "status": "not_ready",
                    "api_name": "market_names",
                    "market_id": int(candidate_market_id),
                    "readiness": readiness,
                    "next_action": readiness.get("next_action"),
                    "message": "该 market_id 配置未就绪",
                }
            )
            continue
        try:
            results.append(await probe_gerpgo_market_access(config, int(candidate_market_id)))
        except Exception:
            results.append(
                {
                    "status": "failed",
                    "api_name": "market_names",
                    "market_id": int(candidate_market_id),
                    "next_action": SNAPSHOT_API_FAILURE_NEXT_ACTION,
                    "message": "积加 API 轻量探测失败",
                }
            )

    ready_count = sum(1 for result in results if result.get("status") == "ready")
    not_ready_count = sum(1 for result in results if result.get("status") == "not_ready")
    failed_count = sum(1 for result in results if result.get("status") == "failed")
    if ready_count == len(results):
        status = "ready"
    elif ready_count:
        status = "partial"
    elif failed_count:
        status = "failed"
    else:
        status = "not_ready"
    return {
        "status": status,
        "api_name": "market_names",
        "candidate_market_ids": candidate_market_ids,
        "results": results,
        "ready_count": ready_count,
        "not_ready_count": not_ready_count,
        "failed_count": failed_count,
        "cache_written": False,
        "message": "已完成配置内 market_id 低频只读探测",
    }


async def main() -> None:
    args = parse_args()
    if getattr(args, "check_rate_limits", False):
        print(
            json.dumps(
                {
                    "status": "ready",
                    "request_policy": "请求积加 API 前必须先查询限流规则",
                    "rules": list_gerpgo_rate_limit_rules(),
                },
                ensure_ascii=False,
                indent=2,
            )
        )
        return

    config = load_gerpgo_config(PROJECT_ROOT)
    readiness = check_snapshot_readiness(config, selected_market_id=args.market_id)
    if getattr(args, "probe_config_markets", False):
        print(json.dumps(await probe_configured_markets(config), ensure_ascii=False, indent=2))
        return
    if args.check_config:
        print(json.dumps({"status": "ready" if readiness["ready"] else "not_ready", "readiness": readiness}, ensure_ascii=False, indent=2))
        return
    if not readiness["ready"]:
        print(json.dumps({"status": "not_ready", "readiness": readiness}, ensure_ascii=False, indent=2))
        return

    market_id = readiness.get("market_id")
    if market_id is None:
        raise SystemExit("请在新项目 .env 中配置 GERPGO_MARKET_IDS，或传入 --market-id")

    if args.probe_api:
        try:
            probe_result = await probe_gerpgo_market_access(config, int(market_id))
            if probe_result.get("status") == "ready":
                save_probe_market_option(market_id=int(market_id), market=probe_result.get("market"))
        except Exception:
            probe_result = {
                "status": "failed",
                "api_name": "market_names",
                "market_id": int(market_id),
                "next_action": SNAPSHOT_API_FAILURE_NEXT_ACTION,
                "message": "积加 API 轻量探测失败",
            }
        print(json.dumps(probe_result, ensure_ascii=False, indent=2))
        return

    result = await create_gerpgo_snapshot(
        config=config,
        market_id=int(market_id),
        days=args.days,
        count=args.count,
        max_pages=args.max_pages,
        sales_max_pages=getattr(args, "sales_max_pages", None),
        force=args.force,
    )
    safe_result = {
        "status": result["status"],
        "snapshot_dir": result["snapshot_dir"],
        "manifest": result["manifest"],
        "inspection": inspect_api_snapshot(),
    }
    print(json.dumps(safe_result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except Exception as exc:
        print(json.dumps({"status": "failed", "error_message": str(exc)}, ensure_ascii=False, indent=2))
        raise SystemExit(1)
