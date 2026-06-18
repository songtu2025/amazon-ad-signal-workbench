from datetime import UTC, datetime

from app.models.signals import AdObjectRef, AiSignal, EvidencePackage, MetricSnapshot, SuggestedAction
from app.services.signal_scan_summary import build_signal_scan_summary


def make_signal(signal_id: str, category: str, object_type: str = "advertised_product") -> AiSignal:
    return AiSignal(
        id=signal_id,
        signal_type="opportunity",
        signal_category=category,
        priority="P1",
        confidence="medium",
        shop_id="market:1",
        shop_name="rivbos",
        market_id=1,
        marketplace="US",
        country="US",
        object_type=object_type,
        severity=3,
        summary="测试信号",
        why="测试原因",
        evidence=EvidencePackage(
            period_days=7,
            primary_object=AdObjectRef(object_type=object_type, object_id=signal_id, label="测试对象"),
            metrics=MetricSnapshot(impressions=0, clicks=0, cost=0, orders=0, sales=0),
            comparison=[],
            facts=[],
            source_rows=[],
        ),
        evidence_count=1,
        data_sources=[],
        freshness_status="api_snapshot",
        detected_at=datetime.now(UTC).isoformat(),
        uncertainty="测试不确定性",
        suggested_action=SuggestedAction(
            action_type="observe",
            title="人工观察",
            description="只做人工观察",
            requires_manual_confirmation=True,
        ),
        risk="测试风险",
        tags=[],
    )


def test_signal_scan_summary_explains_scanned_tables_hits_and_boundaries() -> None:
    summary = build_signal_scan_summary(
        signal_rows=[
            {"source_table": "advertised_products", "ad_group_id": "group-1", "asin": "B000TEST01"},
            {"source_table": "ad_search_term_daily_metrics", "ad_group_id": "group-1", "search_term": "kids sunglasses"},
            {"source_table": "ad_placement_daily_metrics", "campaign_id": "campaign-1", "placement": "Detail Page on-Amazon"},
        ],
        aba_rows=[{"normalized_query": "kids sunglasses"}],
        signals=[
            make_signal("sig-ad-product", "advertised_product_opportunity"),
            make_signal("sig-search-term", "search_term_opportunity", object_type="search_term"),
            make_signal("sig-data-quality", "data_quality", object_type="cross"),
        ],
        inspection={
            "ready_for_signals": True,
            "signal_row_count": 3,
            "row_counts": {
                "advertised_products": 1,
                "ad_search_term_daily_metrics": 1,
                "ad_placement_daily_metrics": 1,
            },
        },
        promotion_strategies=[
            {
                "market_id": 1,
                "ad_group_id": "group-1",
                "asin": "B000TEST01",
                "strategy_role": "main_push",
                "strategy_label": "主推款",
            }
        ],
    )

    assert summary["summary_text"] == "本次扫描 3 行真实 API 数据，命中 3 类 AI 信号。"
    assert summary["scanned_tables"][0] == {
        "name": "advertised_products",
        "row_count": 1,
        "role": "广告商品表现",
    }
    assert summary["hit_signal_categories"] == [
        {"signal_category": "advertised_product_opportunity", "label": "广告商品机会", "count": 1},
        {"signal_category": "data_quality", "label": "数据质量", "count": 1},
        {"signal_category": "search_term_opportunity", "label": "搜索词机会", "count": 1},
    ]
    assert "主推款策略" in summary["suppressed_reasons"][0]
    assert "搜索词只说明广告活动 / 广告组 / 投放对象上下文" in summary["attribution_boundaries"][0]
    assert "广告位只说明流量位置上下文" in summary["attribution_boundaries"][1]
    assert "先看 Parent ASIN / ASIN 商品信号" in summary["next_focus"]
