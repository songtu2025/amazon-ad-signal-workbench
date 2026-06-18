from __future__ import annotations

import argparse
import json
import sys
from datetime import date
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SCRIPT_ROOT = Path(__file__).resolve().parent
BACKEND_ROOT = PROJECT_ROOT / "backend"
sys.path.insert(0, str(SCRIPT_ROOT))
sys.path.insert(0, str(BACKEND_ROOT))

from app.services.snapshot_inspection import inspect_api_snapshot  # noqa: E402
from app.services.snapshot_readiness import load_snapshot_readiness  # noqa: E402
from inspect_analysis_depth import build_analysis_depth_payload  # noqa: E402


SUPPORTED_REQUEST_DAYS = [7, 14, 30]
COUNT_MAX = 50
MAX_PAGES_MAX = 3


def build_snapshot_expansion_plan_payload(
    *,
    selected_market_id: int | None = None,
    target_days: list[int] | None = None,
    count: int = COUNT_MAX,
    max_pages: int = MAX_PAGES_MAX,
    force: bool = False,
) -> dict[str, Any]:
    targets = target_days or [14, 30]
    inspection = inspect_api_snapshot()
    readiness = _as_dict(load_snapshot_readiness(selected_market_id=selected_market_id))
    analysis_depth = build_analysis_depth_payload(selected_market_id=selected_market_id)
    can_request_api = bool(readiness.get("can_request_api") or readiness.get("ready"))

    current_snapshot = _current_snapshot(inspection)
    target_windows = [
        _target_window(
            days=int(days),
            selected_market_id=selected_market_id or _int(readiness.get("market_id")) or _int(inspection.get("market_id")),
            can_request_api=can_request_api,
            count=_bounded_int(count, default=COUNT_MAX, maximum=COUNT_MAX),
            max_pages=_bounded_int(max_pages, default=MAX_PAGES_MAX, maximum=MAX_PAGES_MAX),
            force=force,
        )
        for days in targets
    ]
    blocking_gaps = _blocking_gaps(
        current_snapshot=current_snapshot,
        target_windows=target_windows,
        can_request_api=can_request_api,
        missing=[str(item) for item in readiness.get("missing") or []],
    )
    coverage_gaps = _coverage_gaps(inspection=inspection, analysis_depth=analysis_depth, blocking_gaps=blocking_gaps)
    status = _status(can_request_api=can_request_api, target_windows=target_windows)

    return {
        "status": status,
        "selected_market_id": selected_market_id,
        "will_write": False,
        "will_request_api": False,
        "safety_note": "本脚本只读预检，不请求积加 API，不写入快照，不保存人工动作或复盘记录。",
        "config": {
            "can_request_api": can_request_api,
            "missing": [str(item) for item in readiness.get("missing") or []],
            "next_action": readiness.get("next_action"),
            "market_id": readiness.get("market_id"),
            "auth_mode": readiness.get("auth_mode"),
        },
        "current_snapshot": current_snapshot,
        "analysis_depth": {
            "status": analysis_depth.get("status"),
            "depth_score": analysis_depth.get("depth_score"),
        },
        "cli_capabilities": {
            "supported_request_days": SUPPORTED_REQUEST_DAYS,
            "count_max": COUNT_MAX,
            "max_pages_max": MAX_PAGES_MAX,
            "supports_force": True,
            "supports_check_config": True,
            "supports_probe_api": True,
        },
        "target_windows": target_windows,
        "blocking_gaps": blocking_gaps,
        "coverage_gaps": coverage_gaps,
        "next_action": _next_action(status=status, readiness=readiness, target_windows=target_windows),
    }


def _target_window(
    *,
    days: int,
    selected_market_id: int | None,
    can_request_api: bool,
    count: int,
    max_pages: int,
    force: bool,
) -> dict[str, Any]:
    supported = days in SUPPORTED_REQUEST_DAYS
    proposed_command = None
    if supported and can_request_api and selected_market_id is not None:
        command = [
            "python",
            "scripts\\run_snapshot_pipeline.py",
            "--market-id",
            str(selected_market_id),
            "--days",
            str(days),
            "--count",
            str(count),
            "--max-pages",
            str(max_pages),
        ]
        if force:
            command.append("--force")
        proposed_command = " ".join(command)

    return {
        "days": days,
        "mode": "direct_snapshot" if supported else "cumulative_snapshot_goal",
        "supported_by_current_cli": supported,
        "proposed_command": proposed_command,
        "command_will_request_api_if_executed": bool(proposed_command),
        "note": _target_note(days=days, supported=supported, can_request_api=can_request_api),
    }


def _target_note(*, days: int, supported: bool, can_request_api: bool) -> str:
    if not supported:
        supported_days = " / ".join(str(item) for item in SUPPORTED_REQUEST_DAYS)
        return f"{days} 天不是当前快照 CLI 能力；当前只支持 {supported_days} 天，请另立任务扩展模型。"
    if not can_request_api:
        return "配置未就绪，不能生成可执行拉取命令。"
    return "现有 CLI 支持该窗口；必须由人工确认后手动执行。"


def _current_snapshot(inspection: dict[str, Any]) -> dict[str, Any]:
    start_date = _string(inspection.get("start_date"))
    end_date = _string(inspection.get("end_date"))
    row_counts = _dict(inspection.get("row_counts"))
    return {
        "status": inspection.get("status"),
        "has_snapshot": bool(inspection.get("has_snapshot")),
        "ready_for_signals": bool(inspection.get("ready_for_signals")),
        "snapshot_id": inspection.get("snapshot_id"),
        "market_id": inspection.get("market_id"),
        "shop_name": inspection.get("shop_name"),
        "marketplace_code": inspection.get("marketplace_code"),
        "start_date": start_date,
        "end_date": end_date,
        "window_days": _window_days(start_date, end_date),
        "signal_row_count": _int(inspection.get("signal_row_count")) or 0,
        "row_counts": row_counts,
        "issues": [str(item) for item in inspection.get("issues") or []],
    }


def _blocking_gaps(
    *,
    current_snapshot: dict[str, Any],
    target_windows: list[dict[str, Any]],
    can_request_api: bool,
    missing: list[str],
) -> list[str]:
    gaps: list[str] = []
    if not can_request_api:
        gaps.append("积加 API 配置未就绪：" + ", ".join(missing or ["UNKNOWN"]))

    window_days = _int(current_snapshot.get("window_days")) or 0
    for target in target_windows:
        days = _int(target.get("days")) or 0
        if not target.get("supported_by_current_cli"):
            gaps.append(f"现有快照 CLI 不支持直接拉取 {days} 天")
            continue
        if window_days and window_days < days:
            gaps.append(f"当前最新快照窗口不足 {days} 天")

    if (_int(current_snapshot.get("signal_row_count")) or 0) < 100:
        gaps.append("当前真实 API 可分析行数偏少")
    advertised_count = _int(_dict(current_snapshot.get("row_counts")).get("advertised_products")) or 0
    if advertised_count < 5:
        gaps.append("广告商品覆盖偏少")
    return _unique(gaps)


def _coverage_gaps(
    *,
    inspection: dict[str, Any],
    analysis_depth: dict[str, Any],
    blocking_gaps: list[str],
) -> list[str]:
    gaps = list(blocking_gaps)
    gaps.extend(str(item) for item in analysis_depth.get("coverage_gaps") or [])
    if not inspection.get("has_snapshot"):
        gaps.append("没有可用 API 快照")
    return _unique(gaps)


def _status(*, can_request_api: bool, target_windows: list[dict[str, Any]]) -> str:
    if not can_request_api:
        return "not_ready"
    if any(target.get("proposed_command") for target in target_windows):
        return "ready_to_expand"
    return "blocked"


def _next_action(*, status: str, readiness: dict[str, Any], target_windows: list[dict[str, Any]]) -> str:
    if status == "not_ready":
        return str(readiness.get("next_action") or "先补齐新项目 .env 或进程环境变量中的积加 API 配置。")
    direct_targets = [target for target in target_windows if target.get("proposed_command")]
    if direct_targets:
        first_days = direct_targets[0]["days"]
        return f"人工确认后先执行 {first_days} 天快照命令；完成后再运行 inspect_analysis_depth.py 复查深度分析覆盖。"
    return "当前没有可执行快照扩展命令；先处理 CLI 能力或配置缺口。"


def _window_days(start_date: str | None, end_date: str | None) -> int | None:
    if not start_date or not end_date:
        return None
    try:
        start = date.fromisoformat(start_date)
        end = date.fromisoformat(end_date)
    except ValueError:
        return None
    return (end - start).days + 1


def _as_dict(value: Any) -> dict[str, Any]:
    if isinstance(value, dict):
        return value
    if hasattr(value, "model_dump"):
        return value.model_dump(mode="json")
    return {}


def _dict(value: Any) -> dict[str, Any]:
    return value if isinstance(value, dict) else {}


def _int(value: Any) -> int | None:
    if value in (None, ""):
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _bounded_int(value: int, *, default: int, maximum: int) -> int:
    parsed = _int(value)
    if parsed is None or parsed < 1:
        return default
    return min(parsed, maximum)


def _string(value: Any) -> str | None:
    if value in (None, ""):
        return None
    return str(value)


def _unique(values: list[str]) -> list[str]:
    result: list[str] = []
    seen: set[str] = set()
    for value in values:
        if value not in seen:
            seen.add(value)
            result.append(value)
    return result


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="只读规划真实 API 快照覆盖扩展，不请求积加 API")
    parser.add_argument("--market-id", type=int, default=None)
    parser.add_argument("--target-days", type=int, nargs="+", default=[14, 30])
    parser.add_argument("--count", type=int, default=COUNT_MAX)
    parser.add_argument("--max-pages", type=int, default=MAX_PAGES_MAX)
    parser.add_argument("--force", action="store_true")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    print(
        json.dumps(
            build_snapshot_expansion_plan_payload(
                selected_market_id=args.market_id,
                target_days=args.target_days,
                count=args.count,
                max_pages=args.max_pages,
                force=args.force,
            ),
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
