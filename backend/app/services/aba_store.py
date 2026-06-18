import json
from pathlib import Path
from typing import Any

from app.services.aba_import import DEFAULT_ABA_SNAPSHOT_ROOT, SOURCE_TABLE, SOURCE_TYPE, TOP_RANK_INDEX_FILE


def load_aba_rows_from_latest_snapshot(snapshot_root: Path = DEFAULT_ABA_SNAPSHOT_ROOT) -> list[dict[str, Any]]:
    snapshot_dir, manifest = _latest_aba_snapshot(Path(snapshot_root))
    if snapshot_dir is None or manifest is None:
        return []

    index_path = snapshot_dir / "normalized" / TOP_RANK_INDEX_FILE
    if not index_path.exists():
        return []

    snapshot_id = _string(manifest.get("snapshot_id")) or snapshot_dir.name
    records = _load_records(index_path)
    rows: list[dict[str, Any]] = []
    for record in records:
        rows.append(
            {
                **record,
                "snapshot_id": snapshot_id,
                "source_type": SOURCE_TYPE,
                "source_name": "ABA搜索词快照",
                "source_table": _string(record.get("source_table")) or SOURCE_TABLE,
                "source_file": _string(record.get("source_file")) or _string(manifest.get("source_file")),
                "source_sheet": _string(record.get("source_sheet")) or _string(manifest.get("source_sheet")),
                "marketplace_id": _integer(record.get("marketplace_id")) or _integer(manifest.get("marketplace_id")),
                "marketplace_code": _string(record.get("marketplace_code")) or _string(manifest.get("marketplace_code")),
                "start_date": _string(record.get("start_date")) or _string(manifest.get("start_date")),
                "end_date": _string(record.get("end_date")) or _string(manifest.get("end_date")),
            }
        )
    return rows


def _latest_aba_snapshot(snapshot_root: Path) -> tuple[Path | None, dict[str, Any] | None]:
    candidates: list[tuple[str, str, Path, dict[str, Any]]] = []
    if not snapshot_root.exists():
        return None, None
    for snapshot_dir in snapshot_root.glob("*"):
        if not snapshot_dir.is_dir():
            continue
        manifest_path = snapshot_dir / "manifest.json"
        if not manifest_path.exists():
            continue
        manifest = _load_dict(manifest_path)
        if manifest.get("status") != "success":
            continue
        sort_key = _string(manifest.get("imported_at")) or _string(manifest.get("created_at")) or ""
        candidates.append((sort_key, snapshot_dir.name, snapshot_dir, manifest))
    if not candidates:
        return None, None
    _, _, snapshot_dir, manifest = sorted(candidates, key=lambda item: (item[0], item[1]), reverse=True)[0]
    return snapshot_dir, manifest


def _load_records(path: Path) -> list[dict[str, Any]]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(payload, list):
        return []
    return [item for item in payload if isinstance(item, dict)]


def _load_dict(path: Path) -> dict[str, Any]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    return payload if isinstance(payload, dict) else {}


def _string(value: Any) -> str | None:
    if value in (None, ""):
        return None
    return str(value)


def _integer(value: Any) -> int | None:
    if value in (None, ""):
        return None
    return int(value)
