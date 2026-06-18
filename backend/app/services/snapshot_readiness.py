from pathlib import Path

from app.models.snapshots import SnapshotReadiness
from app.services.gerpgo_snapshot import check_snapshot_readiness, load_gerpgo_config
from app.services.snapshot_store import DEFAULT_SNAPSHOT_ROOT, PROJECT_ROOT, load_snapshot_status


def load_snapshot_readiness(
    *,
    project_root: Path = PROJECT_ROOT,
    snapshot_root: Path = DEFAULT_SNAPSHOT_ROOT,
    selected_market_id: int | None = None,
) -> SnapshotReadiness:
    config = load_gerpgo_config(project_root)
    config_status = check_snapshot_readiness(config, selected_market_id=selected_market_id)
    snapshot_status = load_snapshot_status(snapshot_root)
    missing = [str(item) for item in config_status.get("missing") or []]
    can_request_api = bool(config_status.get("ready"))

    return SnapshotReadiness(
        ready=can_request_api,
        can_request_api=can_request_api,
        missing=missing,
        next_action=config_status.get("next_action"),
        market_id=config_status.get("market_id"),
        base_url_configured=bool(config_status.get("base_url_configured")),
        auth_mode=str(config_status.get("auth_mode") or "missing"),
        has_snapshot=snapshot_status.has_snapshot,
        snapshot_status=snapshot_status.status,
        snapshot_id=snapshot_status.snapshot_id,
        shop_name=snapshot_status.shop_name,
        marketplace_code=snapshot_status.marketplace_code,
        reason=_reason(can_request_api=can_request_api, missing=missing, snapshot_status=snapshot_status.status),
    )


def _reason(*, can_request_api: bool, missing: list[str], snapshot_status: str) -> str:
    if snapshot_status == "success":
        return "已有成功快照"
    if missing:
        return "缺少积加 API 配置，不能拉取真实快照"
    if can_request_api:
        return "配置可用，可由人工手动拉取真实快照"
    return "快照状态未知"
