import json
from pathlib import Path

from app.services.aba_store import load_aba_rows_from_latest_snapshot
from app.services.signal_detection import detect_signals
from app.services.snapshot_store import load_signal_rows_from_latest_snapshot


def write_json(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")


def test_real_snapshot_placement_rows_generate_explainable_signal(tmp_path: Path) -> None:
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
            "api_list": ["sp_placements"],
            "row_counts": {"ad_placement_daily_metrics": 1},
            "status": "success",
        },
    )
    write_json(
        snapshot_dir / "normalized" / "ad_placement_daily_metrics.json",
        [
            {
                "id": "placement-row-1",
                "campaign_id": "C-1",
                "campaign_name": "SP 测试活动",
                "placement": "Top of Search",
                "impressions": 2400,
                "clicks": 80,
                "spend": 70.0,
                "orders": 1,
                "sales": 40.0,
            }
        ],
    )

    rows = load_signal_rows_from_latest_snapshot(tmp_path)
    signals = detect_signals(rows)

    placement_signal = next(signal for signal in signals if signal.signal_category == "placement_efficiency")

    assert placement_signal.summary == "搜索结果顶部广告位 ACOS 明显偏高"
    assert placement_signal.shop_name == "rivbos"
    assert placement_signal.marketplace == "US"
    assert placement_signal.freshness_status == "api_snapshot"
    assert placement_signal.data_sources[0].source_type == "积加API"
    assert placement_signal.data_sources[0].snapshot_id == "latest-snapshot"
    assert placement_signal.data_sources[0].api_name == "sp_placements"
    assert placement_signal.data_sources[0].source_table == "ad_placement_daily_metrics"
    assert placement_signal.data_sources[0].source_record_id == "placement-row-1"
    assert placement_signal.evidence.facts[0].source_type == "积加API"
    assert "单一数据源" in placement_signal.uncertainty


def test_api_search_term_and_aba_snapshot_generate_market_opportunity_signal(tmp_path: Path) -> None:
    api_root = tmp_path / "api_snapshots"
    api_snapshot_dir = api_root / "gerpgo_market_1_20260516_010000"
    write_json(
        api_snapshot_dir / "manifest.json",
        {
            "snapshot_id": "api-search-snapshot",
            "source": "gerpgo",
            "market_id": 1,
            "shop_id": "shop-rivbos",
            "shop_name": "rivbos",
            "marketplace_code": "US",
            "start_date": "2026-05-10",
            "end_date": "2026-05-16",
            "created_at": "2026-05-16T01:00:00",
            "api_list": ["sp_search_targeting_terms"],
            "row_counts": {"ad_search_term_daily_metrics": 1},
            "status": "success",
        },
    )
    write_json(
        api_snapshot_dir / "normalized" / "ad_search_term_daily_metrics.json",
        [
            {
                "id": "search-row-1",
                "source_report_type": "targeting",
                "campaign_name": "RBK004 Auto",
                "ad_group_name": "RBK004 mixed group",
                "asin": "B0TESTASIN",
                "msku": "RBK004",
                "product_name": "RBK004 儿童太阳镜",
                "search_term": "Kids   Sunglasses",
                "normalized_query": "kids sunglasses",
                "intent_label": "儿童太阳镜",
                "placement": "Rest of Search",
                "impressions": 1600,
                "clicks": 65,
                "cost": 45,
                "orders": 0,
                "sales": 0,
            }
        ],
    )

    aba_root = tmp_path / "aba_snapshots"
    aba_snapshot_dir = aba_root / "aba_US_20260510_20260516_fixture"
    write_json(
        aba_snapshot_dir / "manifest.json",
        {
            "snapshot_id": "aba-search-snapshot",
            "source": "erp_export",
            "source_type": "ABA导出",
            "source_file": "aba.xlsx",
            "source_sheet": "关键词搜索热度",
            "marketplace_id": 1,
            "marketplace_code": "US",
            "start_date": "2026-05-10",
            "end_date": "2026-05-16",
            "imported_at": "2026-05-16T02:00:00",
            "row_count": 1,
            "top_rank_limit": 1000,
            "top_rank_index_count": 1,
            "status": "success",
        },
    )
    write_json(
        aba_snapshot_dir / "normalized" / "aba_search_term_top1000.json",
        [
            {
                "marketplace_id": 1,
                "marketplace_code": "US",
                "start_date": "2026-05-10",
                "end_date": "2026-05-16",
                "search_term": "Kids Sunglasses",
                "normalized_query": "kids sunglasses",
                "search_frequency_rank": 500,
                "rank_change_type": "上升",
                "rank_change_value": 20,
                "source_type": "ABA导出",
                "source_table": "aba_search_term_snapshots",
                "source_file": "aba.xlsx",
                "source_sheet": "关键词搜索热度",
                "source_row_number": 20,
                "source_record_id": "aba:US:2026-05-10:2026-05-16:kids sunglasses",
            }
        ],
    )

    api_rows = load_signal_rows_from_latest_snapshot(api_root)
    aba_rows = load_aba_rows_from_latest_snapshot(aba_root)
    signals = detect_signals(api_rows, aba_rows=aba_rows)

    signal = next(item for item in signals if item.signal_category == "aba_market_opportunity")
    assert signal.signal_type == "opportunity"
    assert signal.priority == "P1"
    assert signal.confidence == "medium"
    assert signal.object_type == "search_term"
    assert signal.shop_id == "shop-rivbos"
    assert signal.market_id == 1
    assert "kids sunglasses" in signal.summary.lower()
    assert "ABA 排名 500" in signal.summary
    assert signal.suggested_action.requires_manual_confirmation is True
    assert "立即" not in signal.suggested_action.description
    assert "自动" not in signal.suggested_action.description
    assert {source.source_type for source in signal.data_sources} == {"积加API", "ABA导出"}
    aba_source = next(source for source in signal.data_sources if source.source_type == "ABA导出")
    assert aba_source.source_table == "aba_search_term_snapshots"
    assert aba_source.source_record_id == "aba:US:2026-05-10:2026-05-16:kids sunglasses"
    assert aba_source.source_file == "aba.xlsx"
    assert any(fact.source_type == "ABA导出" and fact.metric_name == "ABA排名" for fact in signal.evidence.facts)
