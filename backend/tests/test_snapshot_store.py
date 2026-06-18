import json
from pathlib import Path

from app.services import snapshot_store
from app.services.snapshot_store import load_signal_rows_from_latest_snapshot, load_snapshot_status


def write_json(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")


def test_snapshot_status_reports_missing_snapshot(tmp_path: Path) -> None:
    status = load_snapshot_status(tmp_path)

    assert status.has_snapshot is False
    assert status.status == "missing"
    assert status.row_counts == {}


def test_snapshot_status_reads_latest_manifest(tmp_path: Path) -> None:
    old_dir = tmp_path / "gerpgo_market_1_20260613_010000"
    latest_dir = tmp_path / "gerpgo_market_1_20260614_010000"
    write_json(
        old_dir / "manifest.json",
        {
            "snapshot_id": "old-snapshot",
            "source": "gerpgo",
            "market_id": 1,
            "shop_name": "rivbos",
            "marketplace_code": "US",
            "start_date": "2026-06-01",
            "end_date": "2026-06-07",
            "created_at": "2026-06-13T01:00:00",
            "api_list": ["old"],
            "row_counts": {"ad_search_term_daily_metrics": 1},
            "status": "success",
        },
    )
    write_json(
        latest_dir / "manifest.json",
        {
            "snapshot_id": "latest-snapshot",
            "source": "gerpgo",
            "market_id": 1,
            "shop_name": "rivbos",
            "marketplace_code": "US",
            "start_date": "2026-06-08",
            "end_date": "2026-06-14",
            "created_at": "2026-06-14T01:00:00",
            "api_list": ["sp_search_targeting_terms"],
            "row_counts": {"ad_search_term_daily_metrics": 2},
            "status": "success",
        },
    )

    status = load_snapshot_status(tmp_path)

    assert status.has_snapshot is True
    assert status.snapshot_id == "latest-snapshot"
    assert status.shop_name == "rivbos"
    assert status.marketplace_code == "US"
    assert status.row_counts["ad_search_term_daily_metrics"] == 2


def test_snapshot_status_prefers_latest_success_when_newer_attempt_failed(tmp_path: Path) -> None:
    success_dir = tmp_path / "gerpgo_market_1_20260614_010000"
    failed_dir = tmp_path / "gerpgo_market_1_20260614_020000"
    write_json(
        success_dir / "manifest.json",
        {
            "snapshot_id": "success-snapshot",
            "source": "gerpgo",
            "market_id": 1,
            "shop_name": "rivbos",
            "marketplace_code": "US",
            "start_date": "2026-06-08",
            "end_date": "2026-06-14",
            "created_at": "2026-06-14T01:00:00",
            "api_list": ["sp_search_targeting_terms"],
            "row_counts": {"ad_search_term_daily_metrics": 1},
            "status": "success",
        },
    )
    write_json(
        success_dir / "normalized" / "ad_search_term_daily_metrics.json",
        [
            {
                "id": "search-row-1",
                "search_term": "kids sunglasses",
                "impressions": 1200,
                "clicks": 52,
                "spend": 38.6,
                "orders": 0,
                "sales": 0,
            }
        ],
    )
    write_json(
        failed_dir / "manifest.json",
        {
            "snapshot_id": "failed-snapshot",
            "source": "gerpgo",
            "market_id": 1,
            "shop_name": "rivbos",
            "marketplace_code": "US",
            "start_date": "2026-06-08",
            "end_date": "2026-06-14",
            "created_at": "2026-06-14T02:00:00",
            "api_list": ["sp_search_targeting_terms"],
            "row_counts": {},
            "status": "failed",
            "error_message": "请求失败",
        },
    )

    status = load_snapshot_status(tmp_path)
    rows = load_signal_rows_from_latest_snapshot(tmp_path)

    assert status.has_snapshot is True
    assert status.status == "success"
    assert status.snapshot_id == "success-snapshot"
    assert rows[0]["snapshot_id"] == "success-snapshot"


def test_signal_rows_load_from_normalized_search_terms(tmp_path: Path) -> None:
    snapshot_dir = tmp_path / "gerpgo_market_1_20260614_010000"
    write_json(
        snapshot_dir / "manifest.json",
        {
            "snapshot_id": "latest-snapshot",
            "source": "gerpgo",
            "market_id": 1,
            "shop_name": "rivbos",
            "marketplace_code": "US",
            "start_date": "2026-06-08",
            "end_date": "2026-06-14",
            "created_at": "2026-06-14T01:00:00",
            "api_list": ["sp_search_targeting_terms"],
            "row_counts": {"ad_search_term_daily_metrics": 1},
            "status": "success",
        },
    )
    write_json(
        snapshot_dir / "normalized" / "ad_search_term_daily_metrics.json",
        [
            {
                "id": "search-row-1",
                "campaign_id": "C-1",
                "campaign_name": "SP 测试活动",
                "ad_group_id": "G-1",
                "ad_group_name": "多商品广告组",
                "asin": "B000TEST01",
                "sku": "SKU-1",
                "msku": "MSKU-1",
                "search_term": "kids sunglasses",
                "normalized_query": "kids sunglasses",
                "intent_label": "儿童太阳镜核心词",
                "impressions": 1200,
                "clicks": 52,
                "spend": 38.6,
                "orders": 0,
                "sales": 0,
            }
        ],
    )

    rows = load_signal_rows_from_latest_snapshot(tmp_path)

    assert len(rows) == 1
    assert rows[0]["row_id"] == "latest-snapshot:search-row-1"
    assert rows[0]["product_name"] == "B000TEST01"
    assert rows[0]["search_term"] == "kids sunglasses"
    assert rows[0]["cost"] == 38.6
    assert rows[0]["source_type"] == "api_snapshot"
    assert rows[0]["snapshot_id"] == "latest-snapshot"
    assert rows[0]["shop_id"] == "market:1"
    assert rows[0]["shop_name"] == "rivbos"
    assert rows[0]["market_id"] == 1
    assert rows[0]["marketplace"] == "US"
    assert rows[0]["country"] == "US"
    assert rows[0]["start_date"] == "2026-06-08"
    assert rows[0]["end_date"] == "2026-06-14"
    assert rows[0]["source_table"] == "ad_search_term_daily_metrics"
    assert rows[0]["source_record_id"] == "search-row-1"


def test_signal_rows_load_from_all_success_snapshots_for_review(tmp_path: Path) -> None:
    before_dir = tmp_path / "gerpgo_market_1_20260607_010000"
    after_dir = tmp_path / "gerpgo_market_1_20260615_010000"
    write_json(
        before_dir / "manifest.json",
        {
            "snapshot_id": "snapshot-before",
            "source": "gerpgo",
            "market_id": 1,
            "shop_name": "rivbos",
            "marketplace_code": "US",
            "start_date": "2026-06-01",
            "end_date": "2026-06-07",
            "created_at": "2026-06-07T01:00:00",
            "api_list": ["sp_search_targeting_terms"],
            "row_counts": {"ad_search_term_daily_metrics": 1},
            "status": "success",
        },
    )
    write_json(
        before_dir / "normalized" / "ad_search_term_daily_metrics.json",
        [{"id": "before-row", "search_term": "kids sunglasses", "spend": 80, "orders": 1, "sales": 50}],
    )
    write_json(
        after_dir / "manifest.json",
        {
            "snapshot_id": "snapshot-after",
            "source": "gerpgo",
            "market_id": 1,
            "shop_name": "rivbos",
            "marketplace_code": "US",
            "start_date": "2026-06-09",
            "end_date": "2026-06-15",
            "created_at": "2026-06-15T01:00:00",
            "api_list": ["sp_search_targeting_terms"],
            "row_counts": {"ad_search_term_daily_metrics": 1},
            "status": "success",
        },
    )
    write_json(
        after_dir / "normalized" / "ad_search_term_daily_metrics.json",
        [{"id": "after-row", "search_term": "kids sunglasses", "spend": 60, "orders": 5, "sales": 200}],
    )

    load_all_success_rows = getattr(snapshot_store, "load_signal_rows_from_success_snapshots", None)
    assert load_all_success_rows is not None
    rows = load_all_success_rows(tmp_path)

    assert [row["snapshot_id"] for row in rows] == ["snapshot-before", "snapshot-after"]
    assert [row["cost"] for row in rows] == [80, 60]


def test_signal_rows_load_from_sales_and_advertised_product_metrics(tmp_path: Path) -> None:
    snapshot_dir = tmp_path / "gerpgo_market_1_20260614_010000"
    write_json(
        snapshot_dir / "manifest.json",
        {
            "snapshot_id": "latest-snapshot",
            "source": "gerpgo",
            "market_id": 1,
            "shop_name": "rivbos",
            "marketplace_code": "US",
            "start_date": "2026-06-08",
            "end_date": "2026-06-14",
            "created_at": "2026-06-14T01:00:00",
            "api_list": ["sales_performance", "sp_advertised_products"],
            "row_counts": {"sales_product_daily_metrics": 1, "advertised_products": 1},
            "status": "success",
        },
    )
    write_json(
        snapshot_dir / "normalized" / "sales_product_daily_metrics.json",
        [
            {
                "id": "sales-row-1",
                "market_id": 1,
                "asin": "B000TEST01",
                "sku": "SKU-1",
                "msku": "MSKU-1",
                "product_name": "测试销售商品",
                "orders": 12,
                "sales": 239.4,
                "ad_orders": 1,
                "ad_spend": 8.6,
            }
        ],
    )
    write_json(
        snapshot_dir / "normalized" / "advertised_products.json",
        [
            {
                "id": "ad-row-1",
                "market_id": 1,
                "campaign_id": "C-1",
                "campaign_name": "SP 测试活动",
                "ad_group_id": "G-1",
                "ad_group_name": "多商品广告组",
                "ad_id": "AD-1",
                "asin": "B000TEST01",
                "msku": "MSKU-1",
                "impressions": 200,
                "clicks": 12,
                "spend": 8.6,
                "orders": 1,
                "sales": 19.95,
            }
        ],
    )

    rows = load_signal_rows_from_latest_snapshot(tmp_path)

    assert [row["source_table"] for row in rows] == ["sales_product_daily_metrics", "advertised_products"]
    assert rows[0]["row_id"] == "latest-snapshot:sales:sales-row-1"
    assert rows[0]["object_type"] == "sales_product"
    assert rows[0]["product_name"] == "测试销售商品"
    assert rows[0]["orders"] == 12
    assert rows[0]["sales"] == 239.4
    assert rows[0]["ad_spend"] == 8.6
    assert rows[0]["cost"] == 0
    assert rows[1]["row_id"] == "latest-snapshot:ad-product:ad-row-1"
    assert rows[1]["object_type"] == "advertised_product"
    assert rows[1]["orders"] == 1
    assert rows[1]["cost"] == 8.6


def test_sales_product_signal_rows_do_not_treat_raw_ad_spend_as_cost(tmp_path: Path) -> None:
    snapshot_dir = tmp_path / "gerpgo_market_1_20260616_010000"
    write_json(
        snapshot_dir / "manifest.json",
        {
            "snapshot_id": "latest-snapshot",
            "source": "gerpgo",
            "market_id": 1,
            "shop_name": "rivbos",
            "marketplace_code": "US",
            "start_date": "2026-05-18",
            "end_date": "2026-06-16",
            "created_at": "2026-06-16T01:00:00",
            "api_list": ["sales_performance"],
            "row_counts": {"sales_product_daily_metrics": 1},
            "status": "success",
        },
    )
    write_json(
        snapshot_dir / "normalized" / "sales_product_daily_metrics.json",
        [
            {
                "id": "sales-row-1",
                "market_id": 1,
                "asin": "B000TEST01",
                "sku": "SKU-1",
                "msku": "MSKU-1",
                "product_name": "测试销售商品",
                "orders": 12,
                "sales": 239.4,
                "ad_orders": 1,
                "ad_spend": -8.6,
            }
        ],
    )

    rows = load_signal_rows_from_latest_snapshot(tmp_path)

    assert rows[0]["source_table"] == "sales_product_daily_metrics"
    assert rows[0]["ad_spend"] == -8.6
    assert rows[0]["cost"] == 0
