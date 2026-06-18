import json
from datetime import date, timedelta
from pathlib import Path
from typing import Any

from app.models.snapshots import SnapshotCreateRequest, SnapshotCreateResult
from app.services.gerpgo_snapshot import check_snapshot_readiness, create_gerpgo_snapshot, find_existing_success_snapshot, load_gerpgo_config
from app.services.snapshot_guidance import SNAPSHOT_API_FAILURE_NEXT_ACTION, SNAPSHOT_CONFIG_NEXT_ACTION
from app.services.snapshot_store import DEFAULT_SNAPSHOT_ROOT, PROJECT_ROOT


DEFAULT_FAILURE_MESSAGE = "积加 API 请求失败，已保留当前本地快照状态"
UNSAFE_FAILURE_MARKERS = (
    "access_token",
    "accesstoken",
    "app_key",
    "appkey",
    "app_id",
    "appid",
    "authorization",
    "bearer",
    "password",
    "secret",
    "token",
)


class SnapshotRequestNotReady(Exception):
    def __init__(self, missing: list[str], market_id: int | None) -> None:
        super().__init__("缺少积加 API 配置，不能拉取真实快照")
        self.missing = missing
        self.market_id = market_id


class SnapshotRequestFailed(Exception):
    def __init__(self, market_id: int | None, message: object | None = None) -> None:
        super().__init__(_safe_failure_message(message))
        self.market_id = market_id


async def request_api_snapshot(
    request: SnapshotCreateRequest,
    *,
    project_root: Path = PROJECT_ROOT,
    snapshot_root: Path = DEFAULT_SNAPSHOT_ROOT,
) -> SnapshotCreateResult:
    config = load_gerpgo_config(project_root)
    readiness = check_snapshot_readiness(config, selected_market_id=request.market_id)
    missing = [str(item) for item in readiness.get("missing") or []]
    market_id = _integer(readiness.get("market_id"))
    existing_result = _existing_snapshot_result(request, market_id, snapshot_root)
    if existing_result is not None:
        return existing_result
    if missing or market_id is None:
        if market_id is None and "GERPGO_MARKET_IDS" not in missing:
            missing.append("GERPGO_MARKET_IDS")
        raise SnapshotRequestNotReady(missing, market_id)

    try:
        result = await create_gerpgo_snapshot(
            config=config,
            market_id=market_id,
            days=request.days,
            count=request.count,
            max_pages=request.max_pages,
            sales_max_pages=request.sales_max_pages,
            force=request.force,
            snapshot_root=snapshot_root,
        )
    except ValueError:
        raise
    except Exception as error:
        raise SnapshotRequestFailed(market_id, error) from error
    return _to_result(result)


def _existing_snapshot_result(request: SnapshotCreateRequest, market_id: int | None, snapshot_root: Path) -> SnapshotCreateResult | None:
    if request.force or market_id is None or request.days not in (7, 14, 30):
        return None
    if request.sales_max_pages is not None and request.sales_max_pages > request.max_pages:
        return None
    end = date.today()
    start = end - timedelta(days=request.days - 1)
    existing = find_existing_success_snapshot(
        snapshot_root,
        market_id=market_id,
        start_date=start.isoformat(),
        end_date=end.isoformat(),
    )
    if existing is None:
        return None
    manifest = json.loads((existing / "manifest.json").read_text(encoding="utf-8"))
    return _to_result({"status": "reused", "snapshot_dir": str(existing), "manifest": manifest})


def build_snapshot_failure_result(error: SnapshotRequestFailed) -> SnapshotCreateResult:
    return SnapshotCreateResult(
        status="failed",
        can_request_api=True,
        next_action=SNAPSHOT_API_FAILURE_NEXT_ACTION,
        market_id=error.market_id,
        message=str(error),
    )


def _to_result(result: dict[str, Any]) -> SnapshotCreateResult:
    manifest = result.get("manifest") if isinstance(result.get("manifest"), dict) else {}
    status = str(result.get("status") or manifest.get("status") or "unknown")
    return SnapshotCreateResult(
        status=status,
        snapshot_dir=_string(result.get("snapshot_dir")),
        snapshot_id=_string(manifest.get("snapshot_id")),
        market_id=_integer(manifest.get("market_id")),
        shop_name=_string(manifest.get("shop_name")),
        marketplace_code=_string(manifest.get("marketplace_code")),
        start_date=_string(manifest.get("start_date")),
        end_date=_string(manifest.get("end_date")),
        row_counts=_integer_dict(manifest.get("row_counts")),
        message="已复用本地快照" if status == "reused" else "已创建真实 API 快照",
    )


def _string(value: Any) -> str | None:
    if value in (None, ""):
        return None
    return str(value)


def _safe_failure_message(message: object | None) -> str:
    text = str(message or "").strip()
    if not text:
        return DEFAULT_FAILURE_MESSAGE
    lowered = text.lower()
    if any(marker in lowered for marker in UNSAFE_FAILURE_MARKERS):
        return DEFAULT_FAILURE_MESSAGE
    return text


def _integer(value: Any) -> int | None:
    if value in (None, ""):
        return None
    return int(value)


def _integer_dict(value: Any) -> dict[str, int]:
    if not isinstance(value, dict):
        return {}
    return {str(key): int(item) for key, item in value.items() if item not in (None, "")}
