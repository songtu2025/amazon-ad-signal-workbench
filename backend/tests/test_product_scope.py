import json
from pathlib import Path

from app.services.product_scope import build_product_scope_summary


def write_json(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")


def test_product_scope_summary_separates_asin_scope_from_unattributed_rows(tmp_path: Path) -> None:
    snapshot_dir = tmp_path / "gerpgo_market_1_20260614_010000"
    write_json(
        snapshot_dir / "manifest.json",
        {
            "snapshot_id": "scope-snapshot",
            "source": "gerpgo",
            "market_id": 1,
            "shop_name": "rivbos",
            "marketplace_code": "US",
            "start_date": "2026-06-08",
            "end_date": "2026-06-14",
            "created_at": "2026-06-14T01:00:00",
            "status": "success",
        },
    )
    write_json(
        snapshot_dir / "normalized" / "sales_product_daily_metrics.json",
        [
            {"id": "sales-1", "asin": "B0SALES", "parent_asin": "B0PARENT", "product_name": "销售商品", "orders": 3, "sales": 39.9},
        ],
    )
    write_json(
        snapshot_dir / "normalized" / "advertised_products.json",
        [
            {"id": "ad-1", "asin": "B0SALES", "parent_asin": "B0PARENT", "msku": "SKU-1", "spend": 12.5, "orders": 1, "sales": 9.99},
            {"id": "ad-2", "asin": "B0ADONLY", "msku": "SKU-2", "spend": 8.0, "orders": 0, "sales": 0},
        ],
    )
    write_json(
        snapshot_dir / "normalized" / "ad_search_term_daily_metrics.json",
        [
            {"id": "term-1", "search_term": "kids sunglasses", "spend": 5, "orders": 1},
        ],
    )
    write_json(
        snapshot_dir / "normalized" / "ad_placement_daily_metrics.json",
        [
            {"id": "placement-1", "placement": "Other on-Amazon", "spend": 10, "orders": 2},
        ],
    )

    summary = build_product_scope_summary(snapshot_root=tmp_path, parent_asin_snapshot_root=tmp_path / "empty_parent_snapshots")

    assert summary.coverage.sales_asin_count == 1
    assert summary.coverage.advertised_asin_count == 2
    assert summary.coverage.parent_asin_count == 1
    assert summary.coverage.matched_asin_count == 1
    assert summary.coverage.search_term_unattributed_count == 1
    assert summary.coverage.placement_unattributed_count == 1
    assert "搜索词和广告位不能强行归属到 ASIN" in summary.coverage.boundary
    assert [option.scope_id for option in summary.options] == [
        "all",
        "unattributed",
        "parent_asin:B0PARENT",
        "ad_asin:B0SALES",
        "ad_asin:B0ADONLY",
        "sales_asin:B0SALES",
    ]
    parent_option = next(option for option in summary.options if option.scope_id == "parent_asin:B0PARENT")
    assert parent_option.scope_type == "parent_asin"
    assert parent_option.parent_asin == "B0PARENT"
    assert parent_option.child_asins == ["B0SALES"]
    assert parent_option.spend == 12.5
    assert parent_option.orders == 3
    assert parent_option.sales == 39.9
    assert parent_option.sales_orders == 3
    assert parent_option.sales_amount == 39.9
    assert parent_option.ad_spend == 12.5
    assert parent_option.ad_orders == 1
    assert parent_option.ad_sales == 9.99
    assert "经营订单/销售额来自 sales_product_daily_metrics" in (parent_option.metric_boundary or "")


def test_product_scope_summary_keeps_sales_children_separate_from_ad_coverage(tmp_path: Path) -> None:
    snapshot_dir = tmp_path / "gerpgo_market_1_20260615_162042"
    child_asins = [
        "B016EXMVZS",
        "B016EXMW02",
        "B016EXMW1G",
        "B016EXMW4S",
        "B016EXMXTC",
        "B06VW5SQ97",
        "B07BS9754Q",
        "B07MH544J8",
        "B07MR6HFPX",
        "B082M5C7TZ",
        "B09BQRQ5DT",
        "B09BQSBXTQ",
    ]
    write_json(
        snapshot_dir / "manifest.json",
        {
            "snapshot_id": "scope-snapshot",
            "source": "gerpgo",
            "market_id": 1,
            "shop_name": "rivbos",
            "marketplace_code": "US",
            "start_date": "2026-05-17",
            "end_date": "2026-06-15",
            "created_at": "2026-06-15T16:20:42",
            "status": "success",
        },
    )
    write_json(
        snapshot_dir / "normalized" / "sales_product_daily_metrics.json",
        [
            {
                "id": f"sales-{asin}",
                "asin": asin,
                "parent_asin": "B00K4W4AAA",
                "orders": 1,
                "sales": 10.0,
            }
            for asin in child_asins
        ],
    )
    write_json(
        snapshot_dir / "normalized" / "advertised_products.json",
        [
            {"id": "ad-1", "asin": "B016EXMVZS", "parent_asin": "B00K4W4AAA", "spend": 305.54, "orders": 116, "sales": 1238.09},
            {"id": "ad-2", "asin": "B016EXMW02", "parent_asin": "B00K4W4AAA", "spend": 263.58, "orders": 92, "sales": 1027.34},
            {"id": "ad-3", "asin": "B07BS9754Q", "spend": 44.51, "orders": 11, "sales": 128.4},
        ],
    )
    write_json(snapshot_dir / "normalized" / "ad_search_term_daily_metrics.json", [])
    write_json(snapshot_dir / "normalized" / "ad_placement_daily_metrics.json", [])

    summary = build_product_scope_summary(snapshot_root=tmp_path, parent_asin_snapshot_root=tmp_path / "empty_parent_snapshots")

    parent_option = next(option for option in summary.options if option.scope_id == "parent_asin:B00K4W4AAA")
    ad_options = [option for option in summary.options if option.scope_type == "advertised_asin" and option.parent_asin == "B00K4W4AAA"]

    assert parent_option.child_asins == sorted(child_asins)
    assert len(parent_option.child_asins) == 12
    assert [option.asin for option in ad_options] == ["B016EXMVZS", "B016EXMW02", "B07BS9754Q"]
    assert len(ad_options) == 3
    assert ad_options[-1].parent_asin == "B00K4W4AAA"
    assert parent_option.orders == 12
    assert parent_option.sales == 120
    assert parent_option.spend == 613.63
    assert parent_option.sales_orders == 12
    assert parent_option.sales_amount == 120
    assert parent_option.ad_spend == 613.63
    assert parent_option.ad_orders == 219
    assert parent_option.ad_sales == 2393.83


def test_product_scope_summary_uses_parent_asin_import_mapping(tmp_path: Path) -> None:
    api_root = tmp_path / "api_snapshots"
    parent_root = tmp_path / "parent_asin_snapshots"
    snapshot_dir = api_root / "gerpgo_market_1_20260614_010000"
    write_json(
        snapshot_dir / "manifest.json",
        {
            "snapshot_id": "scope-snapshot",
            "source": "gerpgo",
            "market_id": 1,
            "shop_name": "rivbos",
            "marketplace_code": "US",
            "start_date": "2026-06-08",
            "end_date": "2026-06-14",
            "created_at": "2026-06-14T01:00:00",
            "status": "success",
        },
    )
    write_json(snapshot_dir / "normalized" / "sales_product_daily_metrics.json", [])
    write_json(
        snapshot_dir / "normalized" / "advertised_products.json",
        [
            {"id": "ad-1", "asin": "B0CHILD1", "msku": "SKU-1", "spend": 18.5, "orders": 1, "sales": 19.99},
        ],
    )
    write_json(snapshot_dir / "normalized" / "ad_search_term_daily_metrics.json", [])
    write_json(snapshot_dir / "normalized" / "ad_placement_daily_metrics.json", [])
    write_json(
        parent_root / "parent_asin_US_20260510_20260511_fakehash" / "manifest.json",
        {
            "snapshot_id": "parent-import",
            "source": "erp_export",
            "source_type": "销售表现",
            "source_table": "parent_asin_sales_performance",
            "source_file": "销售表现-父ASIN.xlsx",
            "source_sheet": "按日导出",
            "marketplace_id": 1,
            "marketplace_code": "US",
            "start_date": "2026-05-10",
            "end_date": "2026-05-11",
            "imported_at": "2026-06-14T02:00:00",
            "row_count": 1,
            "status": "success",
        },
    )
    write_json(
        parent_root / "parent_asin_US_20260510_20260511_fakehash" / "normalized" / "parent_asin_product_map.json",
        [
            {
                "parent_asin": "B0PARENT",
                "asin": "B0CHILD1",
                "sku": "SKU-1",
                "orders": 5,
                "sales": 99.95,
                "ad_spend": 20.75,
                "source_type": "销售表现",
                "source_table": "parent_asin_sales_performance",
            }
        ],
    )

    summary = build_product_scope_summary(
        snapshot_root=api_root,
        parent_asin_snapshot_root=parent_root,
        promotion_strategies=[
            {
                "market_id": 1,
                "ad_group_id": "AG-1",
                "asin": "B0CHILD1",
                "strategy_role": "main_push",
                "strategy_label": "主推款",
                "start_date": "2026-06-01",
                "end_date": "2026-06-30",
            }
        ],
    )

    assert summary.coverage.parent_asin_count == 1
    parent_option = next(option for option in summary.options if option.scope_id == "parent_asin:B0PARENT")
    assert parent_option.child_asins == ["B0CHILD1"]
    assert parent_option.source == "parent_asin_product_map+sales_products+advertised_products"
    assert parent_option.spend == 18.5
    assert parent_option.orders == 5
    assert parent_option.sales == 99.95
    assert parent_option.sales_orders == 5
    assert parent_option.sales_amount == 99.95
    assert parent_option.ad_spend == 18.5
    assert parent_option.ad_orders == 1
    assert parent_option.ad_sales == 19.99
    assert "经营订单/销售额来自 parent_asin_product_map" in (parent_option.metric_boundary or "")
    assert parent_option.strategy_notes == [
        "B0CHILD1 已标记为主推款，广告组 AG-1 在 2026-06-01 至 2026-06-30 的消耗集中不作为异常推送。"
    ]
    ad_option = next(option for option in summary.options if option.scope_id == "ad_asin:B0CHILD1")
    assert ad_option.parent_asin == "B0PARENT"
    assert ad_option.strategy_notes == parent_option.strategy_notes


def test_product_scope_summary_parent_import_mapping_does_not_suppress_sales_metrics(tmp_path: Path) -> None:
    api_root = tmp_path / "api_snapshots"
    parent_root = tmp_path / "parent_asin_snapshots"
    snapshot_dir = api_root / "gerpgo_market_1_20260616_120443"
    write_json(
        snapshot_dir / "manifest.json",
        {
            "snapshot_id": "scope-snapshot",
            "source": "gerpgo",
            "market_id": 1,
            "shop_name": "rivbos",
            "marketplace_code": "US",
            "start_date": "2026-05-18",
            "end_date": "2026-06-16",
            "created_at": "2026-06-16T12:04:43",
            "status": "success",
        },
    )
    write_json(
        snapshot_dir / "normalized" / "sales_product_daily_metrics.json",
        [
            {"id": "sales-1", "asin": "B0CHILD1", "parent_asin": "B0PARENT", "orders": 10, "sales": 100.0},
            {"id": "sales-2", "asin": "B0CHILD1", "parent_asin": "B0PARENT", "orders": 5, "sales": 50.0},
            {"id": "sales-3", "asin": "B0CHILD2", "parent_asin": "B0PARENT", "orders": 7, "sales": 70.0},
        ],
    )
    write_json(
        snapshot_dir / "normalized" / "advertised_products.json",
        [
            {"id": "ad-1", "asin": "B0CHILD1", "spend": 12.5, "orders": 1, "sales": 9.99},
            {"id": "ad-2", "asin": "B0CHILD2", "spend": 8.0, "orders": 2, "sales": 20.0},
        ],
    )
    write_json(snapshot_dir / "normalized" / "ad_search_term_daily_metrics.json", [])
    write_json(snapshot_dir / "normalized" / "ad_placement_daily_metrics.json", [])
    write_json(
        parent_root / "parent_asin_US_20260510_20260511_fakehash" / "manifest.json",
        {
            "snapshot_id": "parent-import",
            "source": "erp_export",
            "source_type": "销售表现",
            "source_table": "parent_asin_sales_performance",
            "source_file": "销售表现-父ASIN.xlsx",
            "source_sheet": "按日导出",
            "marketplace_id": 1,
            "marketplace_code": "US",
            "start_date": "2026-05-10",
            "end_date": "2026-05-11",
            "imported_at": "2026-06-14T02:00:00",
            "row_count": 2,
            "status": "success",
        },
    )
    write_json(
        parent_root / "parent_asin_US_20260510_20260511_fakehash" / "normalized" / "parent_asin_product_map.json",
        [
            {"parent_asin": "B0PARENT", "asin": "B0CHILD1", "orders": 3, "sales": 30.0},
            {"parent_asin": "B0PARENT", "asin": "B0CHILD2", "orders": 4, "sales": 40.0},
        ],
    )

    summary = build_product_scope_summary(snapshot_root=api_root, parent_asin_snapshot_root=parent_root)

    parent_option = next(option for option in summary.options if option.scope_id == "parent_asin:B0PARENT")
    assert parent_option.child_asins == ["B0CHILD1", "B0CHILD2"]
    assert parent_option.sales_orders == 22
    assert parent_option.sales_amount == 220
    assert parent_option.orders == 22
    assert parent_option.sales == 220
    assert parent_option.ad_spend == 20.5
    assert parent_option.ad_orders == 3
    assert parent_option.ad_sales == 29.99
    assert "sales_product_daily_metrics" in (parent_option.metric_boundary or "")
