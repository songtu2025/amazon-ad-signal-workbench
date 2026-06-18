import json
from pathlib import Path
from typing import Any

from app.services.snapshot_store import DEFAULT_SNAPSHOT_ROOT, _latest_snapshot, _load_records, _string


PARENT_ASIN_FIELDS = ("parent_asin", "parentAsin", "variation_asin", "variationAsin")


def inspect_parent_asin_children(
    parent_asin: str,
    snapshot_root: Path = DEFAULT_SNAPSHOT_ROOT,
    snapshot_dir: Path | None = None,
    expected_child_count: int | None = None,
) -> dict[str, Any]:
    target_parent_asin = parent_asin.strip()
    resolved_snapshot_dir, manifest = _resolve_snapshot(snapshot_root=snapshot_root, snapshot_dir=snapshot_dir)
    if resolved_snapshot_dir is None or manifest is None:
        return _missing_result(target_parent_asin, expected_child_count)

    normalized_sales_products = _load_records(resolved_snapshot_dir / "normalized" / "sales_products.json")
    normalized_sales_daily = _load_records(resolved_snapshot_dir / "normalized" / "sales_product_daily_metrics.json")
    raw_sales = _load_raw_sales_performance(resolved_snapshot_dir / "raw" / "sales_performance.json")

    child_asins: set[str] = set()
    evidence_sources: list[dict[str, Any]] = []

    for source_name, rows in [
        ("normalized.sales_products", normalized_sales_products),
        ("normalized.sales_product_daily_metrics", normalized_sales_daily),
    ]:
        matched = _matched_child_asins(rows, target_parent_asin)
        child_asins.update(matched)
        evidence_sources.append({"source": source_name, "row_count": len(rows), "matched_count": len(matched)})

    raw_matched = _matched_child_asins(raw_sales["rows"], target_parent_asin)
    child_asins.update(raw_matched)
    evidence_sources.append(
        {
            "source": "raw.sales_performance.variationAsin",
            "row_count": raw_sales["fetched_rows"],
            "matched_count": len(raw_matched),
        }
    )

    sorted_child_asins = sorted(child_asins)
    child_count = len(sorted_child_asins)
    raw_complete = _raw_is_complete(raw_sales)
    is_complete = _is_complete(child_count=child_count, expected_child_count=expected_child_count, raw_complete=raw_complete)

    return {
        "status": _status(child_count=child_count, expected_child_count=expected_child_count, raw_complete=raw_complete),
        "parent_asin": target_parent_asin,
        "expected_child_count": expected_child_count,
        "child_asin_count": child_count,
        "child_asins": sorted_child_asins,
        "is_complete": is_complete,
        "snapshot": _snapshot_summary(resolved_snapshot_dir, manifest),
        "raw_sales_performance": {
            "fetched_rows": raw_sales["fetched_rows"],
            "reported_total": raw_sales["reported_total"],
            "is_complete": raw_complete,
        },
        "evidence_sources": evidence_sources,
        "message": _message(
            child_count=child_count,
            expected_child_count=expected_child_count,
            raw_sales=raw_sales,
            raw_complete=raw_complete,
        ),
    }


def _resolve_snapshot(snapshot_root: Path, snapshot_dir: Path | None) -> tuple[Path | None, dict[str, Any] | None]:
    if snapshot_dir is not None:
        manifest_path = snapshot_dir / "manifest.json"
        if not manifest_path.exists():
            return None, None
        manifest = _load_dict(manifest_path)
        if manifest.get("status") != "success":
            return None, None
        return snapshot_dir, manifest
    return _latest_snapshot(snapshot_root, require_success=True)


def _missing_result(parent_asin: str, expected_child_count: int | None) -> dict[str, Any]:
    return {
        "status": "missing",
        "parent_asin": parent_asin,
        "expected_child_count": expected_child_count,
        "child_asin_count": 0,
        "child_asins": [],
        "is_complete": False if expected_child_count is not None else None,
        "snapshot": None,
        "raw_sales_performance": {"fetched_rows": 0, "reported_total": None, "is_complete": False},
        "evidence_sources": [],
        "message": "没有可用的成功 API 快照，不能校验 Parent ASIN 子 ASIN。",
    }


def _load_raw_sales_performance(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {"rows": [], "fetched_rows": 0, "reported_total": None}
    payload = json.loads(path.read_text(encoding="utf-8"))
    pages = payload if isinstance(payload, list) else [payload]
    rows: list[dict[str, Any]] = []
    reported_totals: list[int] = []
    for page in pages:
        if not isinstance(page, dict):
            continue
        data = page.get("data")
        page_rows = _rows_from_payload(data)
        rows.extend(page_rows)
        if isinstance(data, dict) and data.get("total") not in (None, ""):
            reported_totals.append(int(data["total"]))
    reported_total = max(reported_totals) if reported_totals else None
    return {"rows": rows, "fetched_rows": len(rows), "reported_total": reported_total}


def _rows_from_payload(payload: Any) -> list[dict[str, Any]]:
    if isinstance(payload, list):
        return [item for item in payload if isinstance(item, dict)]
    if isinstance(payload, dict):
        rows = payload.get("rows") or payload.get("data") or []
        return [item for item in rows if isinstance(item, dict)]
    return []


def _matched_child_asins(rows: list[dict[str, Any]], parent_asin: str) -> list[str]:
    matched: list[str] = []
    for row in rows:
        if _parent_asin(row) != parent_asin:
            continue
        asin = _string(row.get("asin"))
        if asin:
            matched.append(asin)
    return sorted(set(matched))


def _parent_asin(row: dict[str, Any]) -> str | None:
    for field in PARENT_ASIN_FIELDS:
        value = _string(row.get(field))
        if value:
            return value
    return None


def _raw_is_complete(raw_sales: dict[str, Any]) -> bool | None:
    reported_total = raw_sales["reported_total"]
    if reported_total is None:
        return None
    return raw_sales["fetched_rows"] >= reported_total


def _is_complete(child_count: int, expected_child_count: int | None, raw_complete: bool | None) -> bool | None:
    if expected_child_count is None:
        return None if child_count > 0 else False
    return child_count >= expected_child_count and raw_complete is not False


def _status(child_count: int, expected_child_count: int | None, raw_complete: bool | None) -> str:
    if child_count == 0:
        return "empty"
    if expected_child_count is not None and child_count >= expected_child_count and raw_complete is not False:
        return "complete"
    return "partial"


def _message(
    *,
    child_count: int,
    expected_child_count: int | None,
    raw_sales: dict[str, Any],
    raw_complete: bool | None,
) -> str:
    if child_count == 0:
        return "当前快照未识别到该 Parent ASIN 的子 ASIN，不能证明其没有子商品。"
    parts = [f"当前快照只能证明已识别 {child_count} 个子 ASIN"]
    if expected_child_count is not None and child_count < expected_child_count:
        parts.append(f"不能证明完整数量为 {expected_child_count}")
    elif expected_child_count is not None:
        parts.append(f"已达到预期数量 {expected_child_count}")
    if raw_complete is False:
        parts.append(f"销售表现 raw 仅拉取 {raw_sales['fetched_rows']}/{raw_sales['reported_total']} 行")
    return "，".join(parts) + "。"


def _snapshot_summary(snapshot_dir: Path, manifest: dict[str, Any]) -> dict[str, Any]:
    return {
        "snapshot_id": _string(manifest.get("snapshot_id")) or snapshot_dir.name,
        "path": str(snapshot_dir),
        "market_id": manifest.get("market_id"),
        "shop_name": _string(manifest.get("shop_name")),
        "marketplace_code": _string(manifest.get("marketplace_code")),
        "start_date": _string(manifest.get("start_date")),
        "end_date": _string(manifest.get("end_date")),
        "created_at": _string(manifest.get("created_at")),
    }


def _load_dict(path: Path) -> dict[str, Any]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    return payload if isinstance(payload, dict) else {}
