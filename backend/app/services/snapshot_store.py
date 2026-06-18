import json
from pathlib import Path
from typing import Any

from app.models.snapshots import SnapshotStatus


PROJECT_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_SNAPSHOT_ROOT = PROJECT_ROOT / "data" / "api_snapshots"


def load_snapshot_status(snapshot_root: Path = DEFAULT_SNAPSHOT_ROOT) -> SnapshotStatus:
    snapshot_dir, manifest = _latest_snapshot(snapshot_root, require_success=True)
    if snapshot_dir is None or manifest is None:
        snapshot_dir, manifest = _latest_snapshot(snapshot_root)
    if snapshot_dir is None or manifest is None:
        return SnapshotStatus(has_snapshot=False, status="missing")
    return SnapshotStatus(
        has_snapshot=True,
        snapshot_id=_string(manifest.get("snapshot_id")),
        source=_string(manifest.get("source")),
        market_id=_integer(manifest.get("market_id")),
        shop_name=_string(manifest.get("shop_name")),
        marketplace_code=_string(manifest.get("marketplace_code")),
        start_date=_string(manifest.get("start_date")),
        end_date=_string(manifest.get("end_date")),
        created_at=_string(manifest.get("created_at")),
        status=_string(manifest.get("status")) or "unknown",
        row_counts=_integer_dict(manifest.get("row_counts")),
        api_list=[str(item) for item in manifest.get("api_list") or []],
        error_message=_string(manifest.get("error_message")),
    )


def load_signal_rows_from_latest_snapshot(snapshot_root: Path = DEFAULT_SNAPSHOT_ROOT) -> list[dict[str, Any]]:
    snapshot_dir, manifest = _latest_snapshot(snapshot_root, require_success=True)
    if snapshot_dir is None or manifest is None:
        return []

    return _load_signal_rows_from_snapshot(snapshot_dir, manifest)


def load_signal_rows_from_success_snapshots(snapshot_root: Path = DEFAULT_SNAPSHOT_ROOT) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for snapshot_dir, manifest in _success_snapshots(snapshot_root):
        rows.extend(_load_signal_rows_from_snapshot(snapshot_dir, manifest))
    return rows


def _load_signal_rows_from_snapshot(snapshot_dir: Path, manifest: dict[str, Any]) -> list[dict[str, Any]]:
    snapshot_id = _string(manifest.get("snapshot_id")) or snapshot_dir.name
    manifest_market_id = _integer(manifest.get("market_id"))
    manifest_shop_id = _string(manifest.get("shop_id")) or (f"market:{manifest_market_id}" if manifest_market_id is not None else None)
    manifest_shop_name = _string(manifest.get("shop_name"))
    manifest_marketplace = _string(manifest.get("marketplace_code"))
    manifest_start_date = _string(manifest.get("start_date"))
    manifest_end_date = _string(manifest.get("end_date"))
    rows: list[dict[str, Any]] = []
    sales_records = _load_records(snapshot_dir / "normalized" / "sales_product_daily_metrics.json")
    for index, record in enumerate(sales_records, start=1):
        source_record_id = _string(record.get("id")) or _string(record.get("source_record_id")) or f"sales-{index}"
        market_id = _integer(record.get("market_id")) or _integer(record.get("marketplace_id")) or manifest_market_id
        product_name = _string(record.get("product_name")) or _string(record.get("asin")) or _string(record.get("msku")) or "销售商品"
        rows.append(
            {
                **record,
                "row_id": f"{snapshot_id}:sales:{source_record_id}",
                "object_type": "sales_product",
                "product_name": product_name,
                "search_term": "",
                "intent_label": "销售商品表现",
                "placement": None,
                "impressions": _integer(record.get("impressions")) or _integer(record.get("ad_impressions")) or 0,
                "clicks": _integer(record.get("clicks")) or _integer(record.get("ad_clicks")) or 0,
                "cost": 0,
                "orders": _integer(record.get("orders")) or _integer(record.get("sales_orders")) or 0,
                "sales": _number(record.get("sales")) if record.get("sales") is not None else (_number(record.get("sales_amount")) or 0),
                "source_type": "api_snapshot",
                "snapshot_id": snapshot_id,
                "shop_id": _string(record.get("shop_id")) or manifest_shop_id or "unknown",
                "shop_name": _string(record.get("shop_name")) or manifest_shop_name,
                "market_id": market_id,
                "marketplace": _string(record.get("marketplace")) or _string(record.get("marketplace_code")) or manifest_marketplace,
                "country": _string(record.get("country")) or _string(record.get("marketplace")) or manifest_marketplace,
                "start_date": _string(record.get("start_date")) or manifest_start_date,
                "end_date": _string(record.get("end_date")) or manifest_end_date,
                "api_name": _string(record.get("api_name")) or "sales_performance",
                "source_table": "sales_product_daily_metrics",
                "source_record_id": source_record_id,
            }
        )
    ad_product_records = _load_records(snapshot_dir / "normalized" / "advertised_products.json")
    for index, record in enumerate(ad_product_records, start=1):
        source_record_id = _string(record.get("id")) or _string(record.get("source_record_id")) or f"ad-product-{index}"
        market_id = _integer(record.get("market_id")) or _integer(record.get("marketplace_id")) or manifest_market_id
        product_name = (
            _string(record.get("product_name"))
            or _string(record.get("ad_product_name"))
            or _string(record.get("asin"))
            or _string(record.get("msku"))
            or "广告商品"
        )
        rows.append(
            {
                **record,
                "row_id": f"{snapshot_id}:ad-product:{source_record_id}",
                "object_type": "advertised_product",
                "product_name": product_name,
                "search_term": "",
                "intent_label": "广告商品表现",
                "placement": None,
                "impressions": _integer(record.get("impressions")) or 0,
                "clicks": _integer(record.get("clicks")) or 0,
                "cost": _number(record.get("cost")) if record.get("cost") is not None else (_number(record.get("spend")) or 0),
                "orders": _integer(record.get("orders")) or _integer(record.get("ads_orders")) or 0,
                "sales": _number(record.get("sales")) if record.get("sales") is not None else (_number(record.get("ads_sales")) or 0),
                "source_type": "api_snapshot",
                "snapshot_id": snapshot_id,
                "shop_id": _string(record.get("shop_id")) or manifest_shop_id or "unknown",
                "shop_name": _string(record.get("shop_name")) or manifest_shop_name,
                "market_id": market_id,
                "marketplace": _string(record.get("marketplace")) or _string(record.get("marketplace_code")) or manifest_marketplace,
                "country": _string(record.get("country")) or _string(record.get("marketplace")) or manifest_marketplace,
                "start_date": _string(record.get("start_date")) or manifest_start_date,
                "end_date": _string(record.get("end_date")) or manifest_end_date,
                "api_name": _string(record.get("api_name")) or "sp_advertised_products",
                "source_table": "advertised_products",
                "source_record_id": source_record_id,
            }
        )
    records = _load_records(snapshot_dir / "normalized" / "ad_search_term_daily_metrics.json")
    for index, record in enumerate(records, start=1):
        source_record_id = _string(record.get("id")) or _string(record.get("source_record_id")) or f"row-{index}"
        search_term = _string(record.get("search_term")) or _string(record.get("normalized_query")) or ""
        market_id = _integer(record.get("market_id")) or _integer(record.get("marketplace_id")) or manifest_market_id
        product_name = (
            _string(record.get("product_name"))
            or _string(record.get("ad_product_name"))
            or _string(record.get("asin"))
            or _string(record.get("msku"))
            or search_term
        )
        rows.append(
            {
                **record,
                "row_id": f"{snapshot_id}:{source_record_id}",
                "product_name": product_name,
                "search_term": search_term,
                "intent_label": _string(record.get("intent_label")) or _string(record.get("semantic_group")) or "未分组搜索词",
                "placement": _string(record.get("placement")),
                "impressions": _integer(record.get("impressions")) or 0,
                "clicks": _integer(record.get("clicks")) or 0,
                "cost": _number(record.get("cost")) if record.get("cost") is not None else (_number(record.get("spend")) or 0),
                "orders": _integer(record.get("orders")) or _integer(record.get("ads_orders")) or 0,
                "sales": _number(record.get("sales")) if record.get("sales") is not None else (_number(record.get("ads_sales")) or 0),
                "source_type": "api_snapshot",
                "snapshot_id": snapshot_id,
                "shop_id": _string(record.get("shop_id")) or manifest_shop_id or "unknown",
                "shop_name": _string(record.get("shop_name")) or manifest_shop_name,
                "market_id": market_id,
                "marketplace": _string(record.get("marketplace")) or _string(record.get("marketplace_code")) or manifest_marketplace,
                "country": _string(record.get("country")) or _string(record.get("marketplace")) or manifest_marketplace,
                "start_date": _string(record.get("start_date")) or manifest_start_date,
                "end_date": _string(record.get("end_date")) or manifest_end_date,
                "api_name": _string(record.get("api_name")) or _api_name(record.get("source_report_type")),
                "source_table": "ad_search_term_daily_metrics",
                "source_record_id": source_record_id,
            }
        )
    placement_records = _load_records(snapshot_dir / "normalized" / "ad_placement_daily_metrics.json")
    for index, record in enumerate(placement_records, start=1):
        source_record_id = _string(record.get("id")) or _string(record.get("source_record_id")) or f"placement-{index}"
        placement = _string(record.get("placement")) or "未知广告位"
        market_id = _integer(record.get("market_id")) or _integer(record.get("marketplace_id")) or manifest_market_id
        rows.append(
            {
                **record,
                "row_id": f"{snapshot_id}:placement:{source_record_id}",
                "product_name": _string(record.get("campaign_name")) or placement,
                "search_term": "",
                "intent_label": "广告位表现",
                "placement": placement,
                "impressions": _integer(record.get("impressions")) or 0,
                "clicks": _integer(record.get("clicks")) or 0,
                "cost": _number(record.get("cost")) if record.get("cost") is not None else (_number(record.get("spend")) or 0),
                "orders": _integer(record.get("orders")) or _integer(record.get("ads_orders")) or 0,
                "sales": _number(record.get("sales")) if record.get("sales") is not None else (_number(record.get("ads_sales")) or 0),
                "source_type": "api_snapshot",
                "snapshot_id": snapshot_id,
                "shop_id": _string(record.get("shop_id")) or manifest_shop_id or "unknown",
                "shop_name": _string(record.get("shop_name")) or manifest_shop_name,
                "market_id": market_id,
                "marketplace": _string(record.get("marketplace")) or _string(record.get("marketplace_code")) or manifest_marketplace,
                "country": _string(record.get("country")) or _string(record.get("marketplace")) or manifest_marketplace,
                "start_date": _string(record.get("start_date")) or manifest_start_date,
                "end_date": _string(record.get("end_date")) or manifest_end_date,
                "api_name": _string(record.get("api_name")) or "sp_placements",
                "source_table": "ad_placement_daily_metrics",
                "source_record_id": source_record_id,
            }
        )
    return rows


def _api_name(source_report_type: Any) -> str:
    if source_report_type == "targeting":
        return "sp_search_targeting_terms"
    if source_report_type == "keyword":
        return "sp_search_keyword_terms"
    return "sp_search_terms"


def _success_snapshots(snapshot_root: Path) -> list[tuple[Path, dict[str, Any]]]:
    candidates: list[tuple[str, str, Path, dict[str, Any]]] = []
    for snapshot_dir in snapshot_root.glob("*"):
        if not snapshot_dir.is_dir():
            continue
        manifest_path = snapshot_dir / "manifest.json"
        if not manifest_path.exists():
            continue
        manifest = _load_dict(manifest_path)
        if manifest.get("status") != "success":
            continue
        candidates.append((_string(manifest.get("created_at")) or "", snapshot_dir.name, snapshot_dir, manifest))
    return [(snapshot_dir, manifest) for _, _, snapshot_dir, manifest in sorted(candidates, key=lambda item: (item[0], item[1]))]


def _latest_snapshot(snapshot_root: Path, *, require_success: bool = False) -> tuple[Path | None, dict[str, Any] | None]:
    candidates: list[tuple[str, str, Path, dict[str, Any]]] = []
    for snapshot_dir in snapshot_root.glob("*"):
        if not snapshot_dir.is_dir():
            continue
        manifest_path = snapshot_dir / "manifest.json"
        if not manifest_path.exists():
            continue
        manifest = _load_dict(manifest_path)
        if require_success and manifest.get("status") != "success":
            continue
        candidates.append((_string(manifest.get("created_at")) or "", snapshot_dir.name, snapshot_dir, manifest))
    if not candidates:
        return None, None
    _, _, snapshot_dir, manifest = sorted(candidates, key=lambda item: (item[0], item[1]), reverse=True)[0]
    return snapshot_dir, manifest


def _load_dict(path: Path) -> dict[str, Any]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    return payload if isinstance(payload, dict) else {}


def _load_records(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    payload = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(payload, list):
        return [item for item in payload if isinstance(item, dict)]
    if isinstance(payload, dict):
        rows = payload.get("rows") or payload.get("data") or []
        return [item for item in rows if isinstance(item, dict)]
    return []


def _string(value: Any) -> str | None:
    if value in (None, ""):
        return None
    return str(value)


def _integer(value: Any) -> int | None:
    if value in (None, ""):
        return None
    return int(value)


def _number(value: Any) -> float | None:
    if value in (None, ""):
        return None
    return float(value)


def _integer_dict(value: Any) -> dict[str, int]:
    if not isinstance(value, dict):
        return {}
    return {str(key): int(item) for key, item in value.items() if item not in (None, "")}
