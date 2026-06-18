import json
from pathlib import Path
from typing import Any

from app.services.snapshot_store import DEFAULT_SNAPSHOT_ROOT, load_signal_rows_from_latest_snapshot, load_snapshot_status


SIGNAL_INPUT_TABLES = ["ad_search_term_daily_metrics", "ad_placement_daily_metrics"]


def inspect_api_snapshot(snapshot_root: Path = DEFAULT_SNAPSHOT_ROOT) -> dict[str, Any]:
    snapshot_status = load_snapshot_status(snapshot_root)
    if not snapshot_status.has_snapshot:
        return {
            "status": "missing",
            "has_snapshot": False,
            "ready_for_signals": False,
            "snapshot_id": None,
            "signal_row_count": 0,
            "row_counts": {},
            "normalized_tables": [],
            "issues": ["NO_API_SNAPSHOT"],
        }

    snapshot_dir = _find_snapshot_dir(snapshot_root, snapshot_status.snapshot_id)
    issues: list[str] = []
    normalized_tables: list[dict[str, Any]] = []
    table_names = sorted(set(snapshot_status.row_counts) | set(SIGNAL_INPUT_TABLES))

    if snapshot_dir is None:
        issues.append("SNAPSHOT_DIR_NOT_FOUND")
    else:
        for table_name in table_names:
            table_path = snapshot_dir / "normalized" / f"{table_name}.json"
            manifest_row_count = snapshot_status.row_counts.get(table_name)
            exists = table_path.exists()
            actual_row_count = len(_load_records(table_path)) if exists else 0
            matches_manifest = manifest_row_count == actual_row_count if manifest_row_count is not None else False
            if manifest_row_count is None:
                issues.append(f"ROW_COUNT_MISSING:{table_name}")
            elif exists and not matches_manifest:
                issues.append(f"ROW_COUNT_MISMATCH:{table_name}")
            elif not exists and manifest_row_count > 0:
                issues.append(f"NORMALIZED_FILE_MISSING:{table_name}")
            normalized_tables.append(
                {
                    "name": table_name,
                    "exists": exists,
                    "manifest_row_count": manifest_row_count,
                    "actual_row_count": actual_row_count,
                    "matches_manifest": matches_manifest,
                    "path": str(table_path),
                }
            )

    signal_row_count = len(load_signal_rows_from_latest_snapshot(snapshot_root))
    ready_for_signals = snapshot_status.status == "success" and signal_row_count > 0
    return {
        "status": _inspection_status(snapshot_status.status, ready_for_signals=ready_for_signals, issues=issues),
        "has_snapshot": True,
        "ready_for_signals": ready_for_signals,
        "snapshot_id": snapshot_status.snapshot_id,
        "source": snapshot_status.source,
        "market_id": snapshot_status.market_id,
        "shop_name": snapshot_status.shop_name,
        "marketplace_code": snapshot_status.marketplace_code,
        "start_date": snapshot_status.start_date,
        "end_date": snapshot_status.end_date,
        "created_at": snapshot_status.created_at,
        "snapshot_status": snapshot_status.status,
        "signal_row_count": signal_row_count,
        "row_counts": snapshot_status.row_counts,
        "api_list": snapshot_status.api_list,
        "normalized_tables": normalized_tables,
        "issues": issues,
    }


def _inspection_status(snapshot_status: str, *, ready_for_signals: bool, issues: list[str]) -> str:
    if snapshot_status != "success":
        return snapshot_status
    if issues:
        return "partial"
    if not ready_for_signals:
        return "empty"
    return "ready"


def _find_snapshot_dir(snapshot_root: Path, snapshot_id: str | None) -> Path | None:
    candidates: list[tuple[str, str, Path]] = []
    for manifest_path in snapshot_root.glob("*/manifest.json"):
        manifest = _load_dict(manifest_path)
        if snapshot_id and manifest.get("snapshot_id") != snapshot_id:
            continue
        candidates.append((str(manifest.get("created_at") or ""), manifest_path.parent.name, manifest_path.parent))
    if not candidates:
        return None
    _, _, snapshot_dir = sorted(candidates, key=lambda item: (item[0], item[1]), reverse=True)[0]
    return snapshot_dir


def _load_dict(path: Path) -> dict[str, Any]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    return payload if isinstance(payload, dict) else {}


def _load_records(path: Path) -> list[dict[str, Any]]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(payload, list):
        return [item for item in payload if isinstance(item, dict)]
    if isinstance(payload, dict):
        rows = payload.get("rows") or payload.get("data") or []
        return [item for item in rows if isinstance(item, dict)]
    return []
