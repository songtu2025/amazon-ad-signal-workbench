from app.models.signals import ConfidenceLevel, ObjectType, SignalType
from app.services.signal_detection import detect_signals, enforce_signal_confidence_support, search_intent_summaries


TEST_ROWS = [
    {
        "row_id": "fixture-waste-ad-product",
        "campaign_name": "测试广告活动",
        "ad_group_name": "测试多商品广告组",
        "asin": "TESTASIN001",
        "sku": "TEST-SKU-A",
        "msku": "TEST-MSKU-A",
        "product_name": "测试广告商品 A",
        "placement": "Rest of Search",
        "search_term": "测试高花费无订单词",
        "intent_label": "测试止损意图",
        "shop_id": "market:1",
        "shop_name": "rivbos",
        "market_id": 1,
        "marketplace": "US",
        "country": "US",
        "source_type": "api_snapshot",
        "snapshot_id": "snapshot-test",
        "source_table": "ad_search_term_daily_metrics",
        "source_record_id": "fixture-waste-ad-product",
        "start_date": "2026-06-08",
        "end_date": "2026-06-14",
        "impressions": 6400,
        "clicks": 86,
        "cost": 42.3,
        "orders": 0,
        "sales": 0,
    },
    {
        "row_id": "fixture-opportunity-search-term",
        "campaign_name": "测试广告活动",
        "ad_group_name": "测试多商品广告组",
        "asin": "TESTASIN002",
        "sku": "TEST-SKU-B",
        "msku": "TEST-MSKU-B",
        "product_name": "测试广告商品 B",
        "placement": "Product Pages",
        "search_term": "测试低 ACOS 出单词",
        "intent_label": "测试转化意图",
        "shop_id": "market:1",
        "shop_name": "rivbos",
        "market_id": 1,
        "marketplace": "US",
        "country": "US",
        "source_type": "api_snapshot",
        "snapshot_id": "snapshot-test",
        "source_table": "ad_search_term_daily_metrics",
        "source_record_id": "fixture-opportunity-search-term",
        "start_date": "2026-06-08",
        "end_date": "2026-06-14",
        "impressions": 3200,
        "clicks": 58,
        "cost": 18.4,
        "orders": 7,
        "sales": 128.7,
    },
]


def test_default_detection_has_no_embedded_sample_data() -> None:
    assert detect_signals() == []
    assert search_intent_summaries() == []


def test_high_confidence_business_signal_with_single_source_is_downgraded() -> None:
    signal = next(item for item in detect_signals(TEST_ROWS) if item.id == "sig-waste-fixture-waste-ad-product")
    unsupported_high_confidence = signal.model_copy(update={"confidence": ConfidenceLevel.HIGH})

    supported_signal = enforce_signal_confidence_support(unsupported_high_confidence)

    assert supported_signal.confidence == "medium"
    assert "证据来源不足" in supported_signal.uncertainty


def test_detects_stale_aba_data_quality_signal() -> None:
    source_rows = [
        {
            "row_id": "fixture-api-search-term",
            "campaign_name": "SP 测试活动",
            "ad_group_name": "多商品广告组",
            "asin": "B000TEST01",
            "sku": "TEST-SKU-A",
            "msku": "TEST-MSKU-A",
            "product_name": "测试广告商品 A",
            "placement": None,
            "search_term": "kids sunglasses",
            "intent_label": "儿童太阳镜",
            "shop_id": "market:1",
            "shop_name": "rivbos",
            "market_id": 1,
            "marketplace": "US",
            "country": "US",
            "source_type": "api_snapshot",
            "snapshot_id": "snapshot-test",
            "source_table": "ad_search_term_daily_metrics",
            "source_record_id": "fixture-api-search-term",
            "start_date": "2026-06-08",
            "end_date": "2026-06-14",
            "impressions": 100,
            "clicks": 10,
            "cost": 8,
            "orders": 1,
            "sales": 20,
        }
    ]
    aba_rows = [
        {
            "source_record_id": "aba-row-10",
            "source_type": "ABA导出",
            "source_table": "aba_search_term_snapshots",
            "source_file": "ABA搜索词报表-Top30万搜索词.xlsx",
            "source_name": "ABA搜索词快照",
            "marketplace_id": 1,
            "marketplace_code": "US",
            "country": "US",
            "start_date": "2026-05-10",
            "end_date": "2026-05-16",
            "search_term": "kids sunglasses",
            "normalized_query": "kids sunglasses",
            "search_frequency_rank": 500,
            "source_row_number": 10,
        }
    ]

    signals = detect_signals(source_rows, aba_rows=aba_rows)

    stale_signal = next(signal for signal in signals if signal.id == "sig-data-quality-aba-stale")
    facts = {fact.label: fact.value for fact in stale_signal.evidence.facts}

    assert stale_signal.signal_type == SignalType.ANOMALY
    assert stale_signal.signal_category == "data_quality"
    assert stale_signal.priority == "P0"
    assert stale_signal.confidence == "high"
    assert stale_signal.object_type == ObjectType.CROSS
    assert stale_signal.freshness_status == "stale"
    assert stale_signal.shop_id == "market:1"
    assert stale_signal.market_id == 1
    assert "ABA" in stale_signal.summary
    assert "过期" in stale_signal.summary
    assert facts["ABA 行数"] == "1"
    assert facts["ABA 周期"] == "2026-05-10 至 2026-05-16"
    assert facts["分析周期结束"] == "2026-06-14"
    assert facts["过期天数"] == "29"
    assert facts["过期阈值"] == "14"
    assert stale_signal.data_sources[0].source_type == "ABA导出"
    assert stale_signal.data_sources[0].source_file == "ABA搜索词报表-Top30万搜索词.xlsx"
    assert stale_signal.suggested_action.requires_manual_confirmation is True
    assert "自动" not in stale_signal.suggested_action.description


def test_does_not_detect_aba_stale_signal_when_period_is_current() -> None:
    source_rows = [
        {
            "row_id": "fixture-api-search-term",
            "campaign_name": "SP 测试活动",
            "ad_group_name": "多商品广告组",
            "product_name": "测试广告商品 A",
            "search_term": "kids sunglasses",
            "intent_label": "儿童太阳镜",
            "shop_id": "market:1",
            "shop_name": "rivbos",
            "market_id": 1,
            "marketplace": "US",
            "country": "US",
            "source_type": "api_snapshot",
            "source_table": "ad_search_term_daily_metrics",
            "start_date": "2026-06-08",
            "end_date": "2026-06-14",
            "impressions": 100,
            "clicks": 10,
            "cost": 8,
            "orders": 1,
            "sales": 20,
        }
    ]
    aba_rows = [
        {
            "source_type": "ABA导出",
            "source_table": "aba_search_term_snapshots",
            "source_file": "ABA搜索词报表-Top30万搜索词.xlsx",
            "source_name": "ABA搜索词快照",
            "marketplace_id": 1,
            "marketplace_code": "US",
            "start_date": "2026-06-02",
            "end_date": "2026-06-08",
            "search_term": "kids sunglasses",
            "normalized_query": "kids sunglasses",
            "search_frequency_rank": 500,
        }
    ]

    signals = detect_signals(source_rows, aba_rows=aba_rows)

    assert [signal for signal in signals if signal.id == "sig-data-quality-aba-stale"] == []


def test_stale_aba_market_opportunity_is_low_confidence() -> None:
    source_rows = [
        {
            "row_id": "fixture-stale-aba-opportunity",
            "campaign_name": "SP 测试活动",
            "ad_group_name": "多商品广告组",
            "asin": "B000TEST01",
            "sku": "TEST-SKU-A",
            "msku": "TEST-MSKU-A",
            "product_name": "测试广告商品 A",
            "placement": None,
            "search_term": "kids sunglasses",
            "normalized_query": "kids sunglasses",
            "intent_label": "儿童太阳镜",
            "shop_id": "market:1",
            "shop_name": "rivbos",
            "market_id": 1,
            "marketplace": "US",
            "country": "US",
            "source_type": "api_snapshot",
            "snapshot_id": "snapshot-test",
            "source_table": "ad_search_term_daily_metrics",
            "source_record_id": "fixture-stale-aba-opportunity",
            "start_date": "2026-06-08",
            "end_date": "2026-06-14",
            "impressions": 1200,
            "clicks": 60,
            "cost": 36,
            "orders": 0,
            "sales": 0,
        }
    ]
    aba_rows = [
        {
            "source_record_id": "aba-row-120",
            "source_type": "ABA导出",
            "source_table": "aba_search_term_snapshots",
            "source_file": "ABA搜索词报表-Top30万搜索词.xlsx",
            "source_name": "ABA搜索词快照",
            "marketplace_id": 1,
            "marketplace_code": "US",
            "country": "US",
            "start_date": "2026-05-10",
            "end_date": "2026-05-16",
            "search_term": "kids sunglasses",
            "normalized_query": "kids sunglasses",
            "search_frequency_rank": 120,
            "rank_change_type": "上升",
            "rank_change_value": 8,
        }
    ]

    signals = detect_signals(source_rows, aba_rows=aba_rows)

    signal = next(signal for signal in signals if signal.id == "sig-aba-hot-term-no-conversion-fixture-stale-aba-opportunity")
    facts = {fact.label: fact.value for fact in signal.evidence.facts}

    assert signal.signal_type == SignalType.OPPORTUNITY
    assert signal.signal_category == "aba_market_opportunity"
    assert signal.confidence == "low"
    assert signal.freshness_status == "stale"
    assert "过期" in signal.uncertainty
    assert facts["ABA排名"] == "120"
    assert facts["广告周期"] == "2026-06-08 至 2026-06-14"
    assert facts["ABA周期"] == "2026-05-10 至 2026-05-16"
    assert facts["ABA过期天数"] == "29"
    assert signal.data_sources[1].source_type == "ABA导出"
    assert signal.suggested_action.requires_manual_confirmation is True
    assert "自动" not in signal.suggested_action.description


def test_detects_search_intent_grouping_data_quality_gap() -> None:
    rows = [
        {
            "row_id": "fixture-ungrouped-search-term-a",
            "campaign_name": "SP 测试活动",
            "ad_group_name": "多商品广告组",
            "product_name": "测试广告商品 A",
            "placement": None,
            "search_term": "mystery gadget query alpha",
            "normalized_query": "mystery gadget query alpha",
            "intent_label": "未分组搜索词",
            "shop_id": "market:1",
            "shop_name": "rivbos",
            "market_id": 1,
            "marketplace": "US",
            "country": "US",
            "source_type": "api_snapshot",
            "snapshot_id": "snapshot-test",
            "source_table": "ad_search_term_daily_metrics",
            "source_record_id": "fixture-ungrouped-search-term-a",
            "start_date": "2026-06-08",
            "end_date": "2026-06-14",
            "impressions": 100,
            "clicks": 3,
            "cost": 2.24,
            "orders": 0,
            "sales": 0,
        },
        {
            "row_id": "fixture-ungrouped-search-term-b",
            "campaign_name": "SP 测试活动",
            "ad_group_name": "多商品广告组",
            "product_name": "测试广告商品 A",
            "placement": None,
            "search_term": "unknown seasonal phrase beta",
            "normalized_query": "unknown seasonal phrase beta",
            "intent_label": "未分组搜索词",
            "shop_id": "market:1",
            "shop_name": "rivbos",
            "market_id": 1,
            "marketplace": "US",
            "country": "US",
            "source_type": "api_snapshot",
            "snapshot_id": "snapshot-test",
            "source_table": "ad_search_term_daily_metrics",
            "source_record_id": "fixture-ungrouped-search-term-b",
            "start_date": "2026-06-08",
            "end_date": "2026-06-14",
            "impressions": 80,
            "clicks": 1,
            "cost": 1.12,
            "orders": 0,
            "sales": 0,
        },
    ]

    signals = detect_signals(rows)

    signal = next(signal for signal in signals if signal.id == "sig-data-quality-search-intent-ungrouped")
    facts = {fact.label: fact.value for fact in signal.evidence.facts}

    assert signal.signal_type == SignalType.ANOMALY
    assert signal.signal_category == "data_quality"
    assert signal.object_type == ObjectType.CROSS
    assert signal.priority == "P1"
    assert signal.confidence == "high"
    assert "语义分组" in signal.summary
    assert facts["搜索词行数"] == "2"
    assert facts["未分组行数"] == "2"
    assert facts["未分组占比"] == "100.00%"
    assert facts["唯一搜索词"] == "2"
    assert signal.suggested_action.requires_manual_confirmation is True
    assert "自动" not in signal.suggested_action.description


def test_does_not_detect_search_intent_grouping_gap_when_terms_have_labels() -> None:
    rows = [
        {
            "row_id": "fixture-grouped-search-term-a",
            "search_term": "1 year old sunglasses",
            "normalized_query": "1 year old sunglasses",
            "intent_label": "幼儿太阳镜",
            "shop_id": "market:1",
            "shop_name": "rivbos",
            "market_id": 1,
            "marketplace": "US",
            "country": "US",
            "source_type": "api_snapshot",
            "snapshot_id": "snapshot-test",
            "source_table": "ad_search_term_daily_metrics",
            "source_record_id": "fixture-grouped-search-term-a",
            "start_date": "2026-06-08",
            "end_date": "2026-06-14",
            "impressions": 100,
            "clicks": 2,
            "cost": 2.24,
            "orders": 0,
            "sales": 0,
        },
        {
            "row_id": "fixture-grouped-search-term-b",
            "search_term": "12 month sunglasses",
            "normalized_query": "12 month sunglasses",
            "intent_label": "婴幼儿太阳镜",
            "shop_id": "market:1",
            "shop_name": "rivbos",
            "market_id": 1,
            "marketplace": "US",
            "country": "US",
            "source_type": "api_snapshot",
            "snapshot_id": "snapshot-test",
            "source_table": "ad_search_term_daily_metrics",
            "source_record_id": "fixture-grouped-search-term-b",
            "start_date": "2026-06-08",
            "end_date": "2026-06-14",
            "impressions": 80,
            "clicks": 1,
            "cost": 1.12,
            "orders": 2,
            "sales": 22.97,
        },
    ]

    signals = detect_signals(rows)

    assert [signal for signal in signals if signal.id == "sig-data-quality-search-intent-ungrouped"] == []


def test_search_intent_summary_infers_basic_groups_for_ungrouped_terms() -> None:
    rows = [
        {
            "row_id": "fixture-baby-sunglasses",
            "search_term": "baby sunglasses 0-6 months",
            "normalized_query": "baby sunglasses 0-6 months",
            "intent_label": "未分组搜索词",
            "source_table": "ad_search_term_daily_metrics",
            "clicks": 10,
            "cost": 8,
            "orders": 2,
            "sales": 40,
        },
        {
            "row_id": "fixture-kids-sun-hat",
            "search_term": "kids sun hat",
            "normalized_query": "kids sun hat",
            "intent_label": "未分组搜索词",
            "source_table": "ad_search_term_daily_metrics",
            "clicks": 6,
            "cost": 3,
            "orders": 1,
            "sales": 15,
        },
        {
            "row_id": "fixture-asin-query",
            "search_term": "B016EXMVZS",
            "normalized_query": "b016exmvzs",
            "intent_label": "未分组搜索词",
            "source_table": "ad_search_term_daily_metrics",
            "clicks": 3,
            "cost": 1.5,
            "orders": 1,
            "sales": 12,
        },
    ]

    summaries = search_intent_summaries(rows)
    labels = {summary.intent_label for summary in summaries}

    assert "规则语义：儿童太阳镜" in labels
    assert "规则语义：儿童防晒帽" in labels
    assert "规则语义：ASIN 查询词" in labels
    sunglasses = next(summary for summary in summaries if summary.intent_label == "规则语义：儿童太阳镜")
    assert sunglasses.metrics.orders == 2
    assert sunglasses.search_terms == ["baby sunglasses 0-6 months"]


def test_search_intent_summary_exposes_review_terms_and_aba_matches() -> None:
    rows = [
        {
            "row_id": "fixture-baby-sunglasses-a",
            "campaign_id": "campaign-baby",
            "campaign_name": "Baby sunglasses campaign",
            "ad_group_id": "group-baby",
            "ad_group_name": "Baby sunglasses exact",
            "keyword_text": "baby sunglasses exact",
            "search_term": "baby sunglasses",
            "normalized_query": "baby sunglasses",
            "intent_label": "未分组搜索词",
            "source_table": "ad_search_term_daily_metrics",
            "market_id": 1,
            "marketplace": "US",
            "clicks": 8,
            "cost": 4,
            "orders": 2,
            "sales": 32,
            "start_date": "2026-06-02",
            "end_date": "2026-06-16",
        },
        {
            "row_id": "fixture-baby-sunglasses-b",
            "campaign_id": "campaign-baby",
            "campaign_name": "Baby sunglasses campaign",
            "ad_group_id": "group-baby",
            "ad_group_name": "Baby sunglasses exact",
            "keyword_text": "baby sunglasses exact",
            "search_term": "baby sunglasses",
            "normalized_query": "baby sunglasses",
            "intent_label": "未分组搜索词",
            "source_table": "ad_search_term_daily_metrics",
            "market_id": 1,
            "marketplace": "US",
            "clicks": 4,
            "cost": 3,
            "orders": 1,
            "sales": 18,
            "start_date": "2026-06-02",
            "end_date": "2026-06-16",
        },
        {
            "row_id": "fixture-kids-sunglasses",
            "search_term": "kids sunglasses",
            "normalized_query": "kids sunglasses",
            "intent_label": "未分组搜索词",
            "source_table": "ad_search_term_daily_metrics",
            "market_id": 1,
            "marketplace": "US",
            "clicks": 6,
            "cost": 2,
            "orders": 1,
            "sales": 20,
            "start_date": "2026-06-02",
            "end_date": "2026-06-16",
        },
    ]
    context_rows = [
        *rows,
        {
            "row_id": "fixture-ad-product-baby-sunglasses",
            "source_table": "advertised_products",
            "market_id": 1,
            "campaign_id": "campaign-baby",
            "ad_group_id": "group-baby",
            "asin": "B000SUN01",
        },
    ]
    aba_rows = [
        {
            "source_record_id": "aba-baby-sunglasses",
            "source_table": "aba_search_term_snapshots",
            "marketplace_id": 1,
            "marketplace_code": "US",
            "country": "US",
            "search_term": "baby sunglasses",
            "normalized_query": "baby sunglasses",
            "search_frequency_rank": 120,
            "start_date": "2026-06-07",
            "end_date": "2026-06-13",
        }
    ]

    summaries = search_intent_summaries(rows, aba_rows=aba_rows, context_rows=context_rows)

    sunglasses = next(summary for summary in summaries if summary.intent_label == "规则语义：儿童太阳镜")

    assert sunglasses.semantic_source == "规则语义"
    assert sunglasses.aba_match_count == 1
    assert len(sunglasses.top_search_terms) == 2
    assert sunglasses.top_search_terms[0].search_term == "baby sunglasses"
    assert sunglasses.top_search_terms[0].orders == 3
    assert sunglasses.top_search_terms[0].cost == 7
    assert sunglasses.top_search_terms[0].acos == 0.14
    assert sunglasses.top_search_terms[0].aba_rank == 120
    assert sunglasses.top_search_terms[0].ad_group_names == ["Baby sunglasses exact"]
    assert sunglasses.top_search_terms[0].targeting_texts == ["baby sunglasses exact"]
    assert sunglasses.top_search_terms[1].search_term == "kids sunglasses"
    assert sunglasses.top_search_terms[1].ad_group_names == []
    assert sunglasses.top_search_terms[1].targeting_texts == []
    assert "关联 1 个广告 ASIN：B000SUN01" in sunglasses.ad_context
    assert "投放词/投放对象 1 个：baby sunglasses exact" in sunglasses.ad_context
    assert "缺广告 ASIN 覆盖上下文" not in sunglasses.evidence_gap
    assert "缺投放词或关键词承接字段" not in sunglasses.evidence_gap


def test_search_intent_summary_ignores_non_search_term_rows() -> None:
    rows = [
        {
            "row_id": "fixture-ad-product-row",
            "search_term": "",
            "intent_label": "广告商品表现",
            "source_table": "advertised_products",
            "clicks": 100,
            "cost": 80,
            "orders": 10,
            "sales": 200,
        },
        {
            "row_id": "fixture-search-term-row",
            "search_term": "baby sunglasses",
            "normalized_query": "baby sunglasses",
            "intent_label": "未分组搜索词",
            "source_table": "ad_search_term_daily_metrics",
            "clicks": 5,
            "cost": 3,
            "orders": 1,
            "sales": 15,
        },
    ]

    summaries = search_intent_summaries(rows)

    assert {summary.intent_label for summary in summaries} == {"规则语义：儿童太阳镜"}


def test_detects_advertised_product_waste_signal() -> None:
    signals = detect_signals(TEST_ROWS)

    waste_signal = next(signal for signal in signals if signal.id == "sig-waste-fixture-waste-ad-product")

    assert waste_signal.signal_type == SignalType.ANOMALY
    assert waste_signal.object_type == ObjectType.ADVERTISED_PRODUCT
    assert waste_signal.signal_category == "ad_efficiency"
    assert waste_signal.priority == "P0"
    assert waste_signal.confidence == "medium"
    assert waste_signal.shop_id == "market:1"
    assert waste_signal.shop_name == "rivbos"
    assert waste_signal.market_id == 1
    assert waste_signal.marketplace == "US"
    assert waste_signal.country == "US"
    assert waste_signal.freshness_status == "api_snapshot"
    assert waste_signal.data_sources[0].source_type == "积加API"
    assert waste_signal.data_sources[0].snapshot_id == "snapshot-test"
    assert waste_signal.data_sources[0].source_table == "ad_search_term_daily_metrics"
    assert waste_signal.data_sources[0].source_record_id == "fixture-waste-ad-product"
    assert waste_signal.evidence_count == len(waste_signal.evidence.facts)
    assert waste_signal.manual_status == waste_signal.status
    assert waste_signal.review_result is None
    assert "单一数据源" in waste_signal.uncertainty
    assert waste_signal.evidence.primary_object.msku == "TEST-MSKU-A"
    assert waste_signal.evidence.facts[0].source_type == "积加API"
    assert waste_signal.suggested_action.requires_manual_confirmation is True


def test_does_not_detect_advertised_product_stable_conversion_opportunity_without_actionability_evidence() -> None:
    rows = [
        {
            "row_id": "fixture-ad-product-stable",
            "campaign_name": "SP 测试活动",
            "ad_group_id": "group-1",
            "ad_group_name": "多商品广告组",
            "ad_id": "ad-1",
            "asin": "B000STABLE1",
            "msku": "MSKU-STABLE",
            "product_name": "稳定转化广告商品",
            "shop_id": "market:1",
            "shop_name": "rivbos",
            "market_id": 1,
            "marketplace": "US",
            "country": "US",
            "source_type": "api_snapshot",
            "snapshot_id": "snapshot-test",
            "source_table": "advertised_products",
            "source_record_id": "fixture-ad-product-stable",
            "start_date": "2026-06-08",
            "end_date": "2026-06-14",
            "impressions": 4200,
            "clicks": 40,
            "cost": 24,
            "orders": 8,
            "sales": 120,
        }
    ]

    signals = detect_signals(rows)

    assert [item for item in signals if item.signal_category == "advertised_product_opportunity"] == []


def test_does_not_group_advertised_product_opportunity_without_independent_business_evidence() -> None:
    rows = [
        {
            "row_id": "fixture-ad-product-stable-a",
            "campaign_name": "SP 测试活动 A",
            "ad_group_id": "group-a",
            "ad_group_name": "多商品广告组 A",
            "ad_id": "ad-a",
            "asin": "B000GROUP1",
            "msku": "MSKU-GROUP-A",
            "product_name": "聚合广告商品",
            "shop_id": "market:1",
            "shop_name": "rivbos",
            "market_id": 1,
            "marketplace": "US",
            "country": "US",
            "source_type": "api_snapshot",
            "snapshot_id": "snapshot-test",
            "source_table": "advertised_products",
            "source_record_id": "fixture-ad-product-stable-a",
            "start_date": "2026-06-08",
            "end_date": "2026-06-14",
            "impressions": 2000,
            "clicks": 12,
            "cost": 8,
            "orders": 1,
            "sales": 40,
        },
        {
            "row_id": "fixture-ad-product-stable-b",
            "campaign_name": "SP 测试活动 B",
            "ad_group_id": "group-b",
            "ad_group_name": "多商品广告组 B",
            "ad_id": "ad-b",
            "asin": "B000GROUP1",
            "msku": "MSKU-GROUP-B",
            "product_name": "聚合广告商品",
            "shop_id": "market:1",
            "shop_name": "rivbos",
            "market_id": 1,
            "marketplace": "US",
            "country": "US",
            "source_type": "api_snapshot",
            "snapshot_id": "snapshot-test",
            "source_table": "advertised_products",
            "source_record_id": "fixture-ad-product-stable-b",
            "start_date": "2026-06-08",
            "end_date": "2026-06-14",
            "impressions": 2500,
            "clicks": 18,
            "cost": 10,
            "orders": 3,
            "sales": 80,
        },
    ]

    signals = [item for item in detect_signals(rows) if item.signal_category == "advertised_product_opportunity"]

    assert signals == []


def test_does_not_create_advertised_product_opportunity_from_same_ad_group_context_only() -> None:
    rows = [
        {
            "row_id": "fixture-ad-product-stable-context",
            "campaign_name": "SP 测试活动",
            "campaign_id": "campaign-context",
            "ad_group_id": "group-context",
            "ad_group_name": "多商品广告组",
            "ad_id": "ad-context",
            "asin": "B000CTX01",
            "msku": "MSKU-CTX",
            "product_name": "稳定转化广告商品",
            "shop_id": "market:1",
            "shop_name": "rivbos",
            "market_id": 1,
            "marketplace": "US",
            "country": "US",
            "source_type": "api_snapshot",
            "snapshot_id": "snapshot-test",
            "source_table": "advertised_products",
            "source_record_id": "fixture-ad-product-stable-context",
            "start_date": "2026-06-08",
            "end_date": "2026-06-14",
            "impressions": 4200,
            "clicks": 40,
            "cost": 24,
            "orders": 8,
            "sales": 120,
        },
        {
            "row_id": "fixture-search-context",
            "campaign_name": "SP 测试活动",
            "campaign_id": "campaign-context",
            "ad_group_id": "group-context",
            "ad_group_name": "多商品广告组",
            "search_term": "baby sunglasses",
            "intent_label": "儿童太阳镜",
            "shop_id": "market:1",
            "shop_name": "rivbos",
            "market_id": 1,
            "marketplace": "US",
            "country": "US",
            "source_type": "api_snapshot",
            "snapshot_id": "snapshot-test",
            "source_table": "ad_search_term_daily_metrics",
            "source_record_id": "fixture-search-context",
            "start_date": "2026-06-08",
            "end_date": "2026-06-14",
            "clicks": 18,
            "cost": 12,
            "orders": 0,
            "sales": 0,
        },
        {
            "row_id": "fixture-placement-context",
            "campaign_name": "SP 测试活动",
            "campaign_id": "campaign-context",
            "ad_group_id": "group-context",
            "ad_group_name": "多商品广告组",
            "placement": "Detail Page on-Amazon",
            "shop_id": "market:1",
            "shop_name": "rivbos",
            "market_id": 1,
            "marketplace": "US",
            "country": "US",
            "source_type": "api_snapshot",
            "snapshot_id": "snapshot-test",
            "source_table": "ad_placement_daily_metrics",
            "source_record_id": "fixture-placement-context",
            "start_date": "2026-06-08",
            "end_date": "2026-06-14",
            "clicks": 10,
            "cost": 8,
            "orders": 1,
            "sales": 24,
        },
    ]

    signals = detect_signals(rows)

    assert [item for item in signals if item.signal_category == "advertised_product_opportunity"] == []


def test_does_not_detect_advertised_product_opportunity_when_acos_is_high() -> None:
    rows = [
        {
            "row_id": "fixture-ad-product-high-acos",
            "asin": "B000HIGHACOS",
            "msku": "MSKU-HIGH",
            "product_name": "高 ACOS 广告商品",
            "shop_id": "market:1",
            "shop_name": "rivbos",
            "market_id": 1,
            "marketplace": "US",
            "country": "US",
            "source_type": "api_snapshot",
            "snapshot_id": "snapshot-test",
            "source_table": "advertised_products",
            "source_record_id": "fixture-ad-product-high-acos",
            "start_date": "2026-06-08",
            "end_date": "2026-06-14",
            "impressions": 4200,
            "clicks": 40,
            "cost": 60,
            "orders": 8,
            "sales": 120,
        }
    ]

    signals = detect_signals(rows)

    assert [item for item in signals if item.signal_category == "advertised_product_opportunity"] == []


def test_detects_advertised_product_low_order_anomaly() -> None:
    rows = [
        {
            "row_id": "fixture-ad-product-low-order",
            "campaign_name": "SP 测试活动",
            "ad_group_id": "group-1",
            "ad_group_name": "多商品广告组",
            "ad_id": "ad-1",
            "asin": "B000LOWORDER",
            "msku": "MSKU-LOW",
            "product_name": "低订单广告商品",
            "shop_id": "market:1",
            "shop_name": "rivbos",
            "market_id": 1,
            "marketplace": "US",
            "country": "US",
            "source_type": "api_snapshot",
            "snapshot_id": "snapshot-test",
            "source_table": "advertised_products",
            "source_record_id": "fixture-ad-product-low-order",
            "start_date": "2026-06-08",
            "end_date": "2026-06-14",
            "impressions": 3600,
            "clicks": 35,
            "cost": 28,
            "orders": 0,
            "sales": 0,
        }
    ]

    signals = detect_signals(rows)

    signal = next(item for item in signals if item.id == "sig-ad-product-efficiency-fixture-ad-product-low-order")
    facts = {fact.label: fact.value for fact in signal.evidence.facts}

    assert signal.signal_type == SignalType.ANOMALY
    assert signal.object_type == ObjectType.ADVERTISED_PRODUCT
    assert signal.signal_category == "advertised_product_efficiency"
    assert signal.priority == "P1"
    assert signal.confidence == "medium"
    assert signal.severity == 4
    assert "B000LOWORDER" in signal.summary
    assert "点击充足但订单弱" in signal.summary
    assert "不能直接归因到某个搜索词或广告位" in signal.why
    assert facts == {
        "广告 ASIN": "B000LOWORDER",
        "触发原因": "点击充足但订单弱",
        "花费": "28.0",
        "点击": "35",
        "订单": "0",
        "ACOS": "无销售额",
        "下钻证据缺口": "缺少同广告组搜索词和广告位上下文，只能先按广告 ASIN 指标判断承接异常。",
    }
    assert signal.suggested_action.requires_manual_confirmation is True
    assert "下钻证据" in signal.uncertainty
    assert "对应搜索词" not in signal.suggested_action.description
    assert "调整投放结构" not in signal.suggested_action.description
    assert "自动" not in signal.suggested_action.description


def test_advertised_product_anomaly_with_search_terms_marks_missing_placement_context() -> None:
    rows = [
        {
            "row_id": "fixture-ad-product-low-order-with-search",
            "campaign_id": "campaign-search-only",
            "campaign_name": "SP 搜索词上下文",
            "ad_group_id": "group-search-only",
            "ad_group_name": "只有搜索词证据的广告组",
            "asin": "B000SEARCHONLY",
            "product_name": "缺广告位证据广告商品",
            "shop_id": "market:1",
            "shop_name": "rivbos",
            "market_id": 1,
            "marketplace": "US",
            "country": "US",
            "source_type": "api_snapshot",
            "snapshot_id": "snapshot-test",
            "source_table": "advertised_products",
            "source_record_id": "fixture-ad-product-low-order-with-search",
            "start_date": "2026-06-08",
            "end_date": "2026-06-14",
            "clicks": 36,
            "cost": 32,
            "orders": 0,
            "sales": 0,
        },
        {
            "row_id": "fixture-search-context-only",
            "campaign_id": "campaign-search-only",
            "campaign_name": "SP 搜索词上下文",
            "ad_group_id": "group-search-only",
            "ad_group_name": "只有搜索词证据的广告组",
            "search_term": "kids sunglasses",
            "shop_id": "market:1",
            "shop_name": "rivbos",
            "market_id": 1,
            "marketplace": "US",
            "country": "US",
            "source_type": "api_snapshot",
            "snapshot_id": "snapshot-test",
            "source_table": "ad_search_term_daily_metrics",
            "source_record_id": "fixture-search-context-only",
            "start_date": "2026-06-08",
            "end_date": "2026-06-14",
            "clicks": 18,
            "cost": 11,
            "orders": 0,
            "sales": 0,
        },
    ]

    signals = detect_signals(rows)

    signal = next(item for item in signals if item.id == "sig-ad-product-efficiency-fixture-ad-product-low-order-with-search")
    facts = {fact.label: fact.value for fact in signal.evidence.facts}

    assert "同广告组搜索词上下文" in facts
    assert facts["广告位证据缺口"] == "缺少同广告组广告位上下文，不能判断广告位是否造成该 ASIN 承接异常。"
    assert "广告位证据缺口" in signal.uncertainty
    assert "广告位上下文" not in signal.suggested_action.description
    assert "检查投放结构" not in signal.suggested_action.description


def test_detects_advertised_product_high_acos_anomaly() -> None:
    rows = [
        {
            "row_id": "fixture-ad-product-high-acos",
            "asin": "B000HIGHACOS",
            "msku": "MSKU-HIGH",
            "product_name": "高 ACOS 广告商品",
            "shop_id": "market:1",
            "shop_name": "rivbos",
            "market_id": 1,
            "marketplace": "US",
            "country": "US",
            "source_type": "api_snapshot",
            "snapshot_id": "snapshot-test",
            "source_table": "advertised_products",
            "source_record_id": "fixture-ad-product-high-acos",
            "start_date": "2026-06-08",
            "end_date": "2026-06-14",
            "impressions": 4200,
            "clicks": 40,
            "cost": 60,
            "orders": 8,
            "sales": 120,
        }
    ]

    signals = detect_signals(rows)

    anomaly = next(item for item in signals if item.id == "sig-ad-product-efficiency-fixture-ad-product-high-acos")
    facts = {fact.label: fact.value for fact in anomaly.evidence.facts}

    assert anomaly.signal_type == SignalType.ANOMALY
    assert anomaly.object_type == ObjectType.ADVERTISED_PRODUCT
    assert anomaly.signal_category == "advertised_product_efficiency"
    assert "ACOS 偏高" in anomaly.summary
    assert facts["触发原因"] == "ACOS 偏高"
    assert facts["ACOS"] == "50.00%"
    assert [item for item in signals if item.signal_category == "advertised_product_opportunity"] == []


def test_detects_search_term_opportunity_signal() -> None:
    signals = detect_signals(TEST_ROWS)

    opportunity = next(signal for signal in signals if signal.id == "sig-opportunity-fixture-opportunity-search-term")
    facts = {fact.label: fact.value for fact in opportunity.evidence.facts}

    assert opportunity.signal_type == SignalType.OPPORTUNITY
    assert opportunity.object_type == ObjectType.SEARCH_TERM
    assert opportunity.evidence.metrics.orders == 7
    assert opportunity.evidence.metrics.acos is not None
    assert opportunity.evidence.metrics.acos <= 0.25
    assert facts["人工动作路径"] == "人工确认后加入精准关键词候选或小流量观察；本系统只记录处理和复盘，不自动新增关键词、不自动调价、不自动否词。"
    assert "7/14 天" in facts["复盘指标"]
    assert "点击、订单、ACOS" in facts["复盘指标"]


def test_asin_like_search_term_opportunity_uses_product_targeting_review_action() -> None:
    rows = [
        {
            "row_id": "fixture-asin-like-search-term-opportunity",
            "campaign_id": "campaign-asin",
            "campaign_name": "SP 商品定向测试",
            "ad_group_id": "group-asin",
            "ad_group_name": "商品定向广告组",
            "keyword_id": None,
            "keyword_text": "substitutes",
            "target_id": "target-asin",
            "target_text": None,
            "product_name": "B016EXMVZS",
            "placement": None,
            "search_term": "B016EXMVZS",
            "normalized_query": "b016exmvzs",
            "intent_label": "未分组搜索词",
            "shop_id": "market:1",
            "shop_name": "rivbos",
            "market_id": 1,
            "marketplace": "US",
            "country": "US",
            "source_type": "api_snapshot",
            "snapshot_id": "snapshot-test",
            "source_table": "ad_search_term_daily_metrics",
            "source_record_id": "fixture-asin-like-search-term-opportunity",
            "start_date": "2026-05-18",
            "end_date": "2026-06-16",
            "impressions": 18,
            "clicks": 1,
            "cost": 0.78,
            "orders": 3,
            "sales": 33.09,
        }
    ]

    signals = detect_signals(rows)

    signal = next(item for item in signals if item.id == "sig-opportunity-fixture-asin-like-search-term-opportunity")
    facts = {fact.label: fact.value for fact in signal.evidence.facts}

    assert signal.signal_category == "search_term_opportunity"
    assert signal.object_type == ObjectType.SEARCH_TERM
    assert signal.suggested_action.action_type == "review_product_targeting_search_term"
    assert "商品定向" in signal.suggested_action.title
    assert "精准关键词" not in signal.suggested_action.title
    assert "精准关键词" not in signal.suggested_action.description
    assert "ASIN 型搜索词" in signal.summary
    assert facts["对象边界"] == "ASIN 型搜索词不能当作普通关键词加词，只能作为商品定向或自动投放上下文的人工复核对象。"
    assert "商品定向" in facts["人工动作路径"]
    assert "7/14 天" in facts["复盘指标"]
    assert "target_id" in facts["复盘指标"]
    assert "自动" not in signal.suggested_action.description


def test_search_term_opportunity_uses_matched_aba_evidence() -> None:
    rows = [
        {
            "row_id": "fixture-opportunity-with-aba",
            "campaign_name": "SP test campaign",
            "ad_group_name": "multi product ad group",
            "asin": "B000TEST02",
            "sku": "TEST-SKU-B",
            "msku": "TEST-MSKU-B",
            "product_name": "Test advertised product B",
            "placement": "Product Pages",
            "search_term": "running sunglasses",
            "normalized_query": "running sunglasses",
            "intent_label": "sport sunglasses",
            "shop_id": "market:1",
            "shop_name": "rivbos",
            "market_id": 1,
            "marketplace": "US",
            "country": "US",
            "source_type": "api_snapshot",
            "snapshot_id": "snapshot-test",
            "source_table": "ad_search_term_daily_metrics",
            "source_record_id": "fixture-opportunity-with-aba",
            "start_date": "2026-06-02",
            "end_date": "2026-06-16",
            "impressions": 3200,
            "clicks": 58,
            "cost": 18.4,
            "orders": 7,
            "sales": 128.7,
        }
    ]
    aba_rows = [
        {
            "source_record_id": "aba-row-running-sunglasses",
            "source_type": "ABA导出",
            "source_table": "aba_search_term_snapshots",
            "source_file": "ABA搜索词报表-000049101-20260616173512.xlsx",
            "source_name": "ABA搜索词快照",
            "marketplace_id": 1,
            "marketplace_code": "US",
            "country": "US",
            "start_date": "2026-06-07",
            "end_date": "2026-06-13",
            "search_term": "Running Sunglasses",
            "normalized_query": "running sunglasses",
            "search_frequency_rank": 120,
            "rank_change_type": "上升",
            "rank_change_value": 8,
            "top1_asin": "B0TOP10001",
            "top1_click_share": 0.18,
        }
    ]

    signals = detect_signals(rows, aba_rows=aba_rows)

    signal = next(item for item in signals if item.id == "sig-opportunity-fixture-opportunity-with-aba")
    facts = {fact.label: fact.value for fact in signal.evidence.facts}

    assert signal.signal_category == "search_term_opportunity"
    assert signal.confidence == "high"
    assert signal.evidence_count == len(signal.evidence.facts)
    assert {source.source_type for source in signal.data_sources} == {"积加API", "ABA导出"}
    assert [row["source_table"] for row in signal.evidence.source_rows] == [
        "ad_search_term_daily_metrics",
        "aba_search_term_snapshots",
    ]
    assert facts["ABA排名"] == "120"
    assert facts["ABA周期"] == "2026-06-07 至 2026-06-13"
    assert signal.suggested_action.requires_manual_confirmation is True
    assert "自动" not in signal.suggested_action.description


def test_search_term_opportunity_groups_same_query_across_ad_contexts() -> None:
    rows = [
        {
            "row_id": "fixture-opportunity-beach-a",
            "campaign_id": "campaign-a",
            "campaign_name": "SP campaign A",
            "ad_group_id": "group-a",
            "ad_group_name": "ad group A",
            "product_name": "beach essentials",
            "placement": None,
            "search_term": "Beach Essentials",
            "normalized_query": "beach essentials",
            "intent_label": "beach demand",
            "shop_id": "market:1",
            "shop_name": "rivbos",
            "market_id": 1,
            "marketplace": "US",
            "country": "US",
            "source_type": "api_snapshot",
            "snapshot_id": "snapshot-test",
            "source_table": "ad_search_term_daily_metrics",
            "source_record_id": "search-row-a",
            "start_date": "2026-06-02",
            "end_date": "2026-06-16",
            "impressions": 1000,
            "clicks": 30,
            "cost": 4.5,
            "orders": 4,
            "sales": 90,
        },
        {
            "row_id": "fixture-opportunity-beach-b",
            "campaign_id": "campaign-b",
            "campaign_name": "SP campaign B",
            "ad_group_id": "group-b",
            "ad_group_name": "ad group B",
            "product_name": "beach essentials",
            "placement": None,
            "search_term": "beach essentials",
            "normalized_query": "beach essentials",
            "intent_label": "beach demand",
            "shop_id": "market:1",
            "shop_name": "rivbos",
            "market_id": 1,
            "marketplace": "US",
            "country": "US",
            "source_type": "api_snapshot",
            "snapshot_id": "snapshot-test",
            "source_table": "ad_search_term_daily_metrics",
            "source_record_id": "search-row-b",
            "start_date": "2026-06-02",
            "end_date": "2026-06-16",
            "impressions": 1200,
            "clicks": 40,
            "cost": 8,
            "orders": 5,
            "sales": 110,
        },
    ]
    aba_rows = [
        {
            "source_record_id": "aba-row-beach-essentials",
            "source_type": "ABA导出",
            "source_table": "aba_search_term_snapshots",
            "source_file": "ABA搜索词报表-000049101-20260616173512.xlsx",
            "source_name": "ABA搜索词快照",
            "marketplace_id": 1,
            "marketplace_code": "US",
            "country": "US",
            "start_date": "2026-06-07",
            "end_date": "2026-06-13",
            "search_term": "beach essentials",
            "normalized_query": "beach essentials",
            "search_frequency_rank": 208,
        }
    ]

    signals = detect_signals(rows, aba_rows=aba_rows)

    opportunities = [
        signal
        for signal in signals
        if signal.signal_category == "search_term_opportunity"
        and (signal.evidence.primary_object.search_term or "").lower() == "beach essentials"
    ]
    assert len(opportunities) == 1
    signal = opportunities[0]
    facts = {fact.label: fact.value for fact in signal.evidence.facts}

    assert signal.signal_type == SignalType.OPPORTUNITY
    assert signal.object_type == ObjectType.SEARCH_TERM
    assert signal.confidence == "high"
    assert signal.evidence.primary_object.object_id == "search_term:1:beach essentials"
    assert facts["投放上下文数"] == "2"
    assert facts["合计订单"] == "9"
    assert facts["合计花费"] == "12.5"
    assert facts["ABA排名"] == "208"
    assert "逐广告活动、广告组和广告商品" in facts["人工动作路径"]
    assert "7/14 天" in facts["复盘指标"]
    assert "分广告组复盘" in facts["复盘指标"]
    assert [row["source_record_id"] for row in signal.evidence.source_rows if row["source_table"] == "ad_search_term_daily_metrics"] == [
        "search-row-a",
        "search-row-b",
    ]
    assert len([row for row in signal.evidence.source_rows if row["source_table"] == "aba_search_term_snapshots"]) == 1
    assert signal.suggested_action.requires_manual_confirmation is True
    assert "自动" not in signal.suggested_action.description


def test_asin_like_grouped_search_term_opportunity_keeps_product_targeting_boundary() -> None:
    rows = [
        {
            "row_id": "fixture-asin-like-group-a",
            "campaign_id": "campaign-a",
            "campaign_name": "SP 商品定向 A",
            "ad_group_id": "group-a",
            "ad_group_name": "商品定向广告组 A",
            "keyword_id": None,
            "keyword_text": "substitutes",
            "target_id": "target-asin-a",
            "target_text": None,
            "product_name": "B016EXMVZS",
            "placement": None,
            "search_term": "B016EXMVZS",
            "normalized_query": "b016exmvzs",
            "intent_label": "未分组搜索词",
            "shop_id": "market:1",
            "shop_name": "rivbos",
            "market_id": 1,
            "marketplace": "US",
            "country": "US",
            "source_type": "api_snapshot",
            "snapshot_id": "snapshot-test",
            "source_table": "ad_search_term_daily_metrics",
            "source_record_id": "asin-like-row-a",
            "start_date": "2026-05-18",
            "end_date": "2026-06-16",
            "impressions": 18,
            "clicks": 1,
            "cost": 0.78,
            "orders": 3,
            "sales": 33.09,
        },
        {
            "row_id": "fixture-asin-like-group-b",
            "campaign_id": "campaign-b",
            "campaign_name": "SP 商品定向 B",
            "ad_group_id": "group-b",
            "ad_group_name": "商品定向广告组 B",
            "keyword_id": None,
            "keyword_text": "substitutes",
            "target_id": "target-asin-b",
            "target_text": None,
            "product_name": "B016EXMVZS",
            "placement": None,
            "search_term": "B016EXMVZS",
            "normalized_query": "b016exmvzs",
            "intent_label": "未分组搜索词",
            "shop_id": "market:1",
            "shop_name": "rivbos",
            "market_id": 1,
            "marketplace": "US",
            "country": "US",
            "source_type": "api_snapshot",
            "snapshot_id": "snapshot-test",
            "source_table": "ad_search_term_daily_metrics",
            "source_record_id": "asin-like-row-b",
            "start_date": "2026-05-18",
            "end_date": "2026-06-16",
            "impressions": 12,
            "clicks": 1,
            "cost": 0.45,
            "orders": 2,
            "sales": 19.51,
        },
    ]

    signals = detect_signals(rows)

    opportunities = [
        signal
        for signal in signals
        if signal.signal_category == "search_term_opportunity"
        and (signal.evidence.primary_object.search_term or "").lower() == "b016exmvzs"
    ]
    assert len(opportunities) == 1
    signal = opportunities[0]
    facts = {fact.label: fact.value for fact in signal.evidence.facts}

    assert signal.suggested_action.action_type == "review_product_targeting_search_term"
    assert "商品定向" in signal.suggested_action.title
    assert "精准关键词" not in signal.suggested_action.description
    assert "ASIN 型搜索词" in signal.summary
    assert facts["对象边界"] == "ASIN 型搜索词不能当作普通关键词加词，只能作为商品定向或自动投放上下文的人工复核对象。"
    assert facts["投放上下文数"] == "2"
    assert "商品定向" in facts["人工动作路径"]
    assert "target_id" in facts["复盘指标"]
    assert "自动" not in signal.suggested_action.description


def test_grouped_search_term_opportunity_exposes_semantic_group() -> None:
    rows = [
        {
            "row_id": "fixture-opportunity-baby-sunglasses-a",
            "campaign_id": "campaign-a",
            "campaign_name": "SP campaign A",
            "ad_group_id": "group-a",
            "ad_group_name": "ad group A",
            "product_name": "baby sunglasses",
            "placement": None,
            "search_term": "Baby Sunglasses",
            "normalized_query": "baby sunglasses",
            "intent_label": "未分组搜索词",
            "shop_id": "market:1",
            "shop_name": "rivbos",
            "market_id": 1,
            "marketplace": "US",
            "country": "US",
            "source_type": "api_snapshot",
            "snapshot_id": "snapshot-test",
            "source_table": "ad_search_term_daily_metrics",
            "source_record_id": "search-row-baby-a",
            "start_date": "2026-06-02",
            "end_date": "2026-06-16",
            "impressions": 1000,
            "clicks": 30,
            "cost": 4.5,
            "orders": 4,
            "sales": 90,
        },
        {
            "row_id": "fixture-opportunity-baby-sunglasses-b",
            "campaign_id": "campaign-b",
            "campaign_name": "SP campaign B",
            "ad_group_id": "group-b",
            "ad_group_name": "ad group B",
            "product_name": "baby sunglasses",
            "placement": None,
            "search_term": "baby sunglasses",
            "normalized_query": "baby sunglasses",
            "intent_label": "未分组搜索词",
            "shop_id": "market:1",
            "shop_name": "rivbos",
            "market_id": 1,
            "marketplace": "US",
            "country": "US",
            "source_type": "api_snapshot",
            "snapshot_id": "snapshot-test",
            "source_table": "ad_search_term_daily_metrics",
            "source_record_id": "search-row-baby-b",
            "start_date": "2026-06-02",
            "end_date": "2026-06-16",
            "impressions": 1200,
            "clicks": 40,
            "cost": 8,
            "orders": 5,
            "sales": 110,
        },
    ]

    signals = detect_signals(rows)

    signal = next(
        item
        for item in signals
        if item.signal_category == "search_term_opportunity"
        and item.evidence.primary_object.object_id == "search_term:1:baby sunglasses"
    )
    facts = {fact.label: fact.value for fact in signal.evidence.facts}

    assert facts["语义组"] == "规则语义：儿童太阳镜"
    assert "儿童太阳镜" in signal.summary
    assert "广告搜索词聚合上下文" in signal.suggested_action.description
    assert "自动" not in signal.suggested_action.description


def test_detects_long_tail_search_term_low_spend_high_conversion_signal() -> None:
    rows = [
        {
            "row_id": "fixture-long-tail-search-term",
            "campaign_name": "SP 测试活动",
            "ad_group_name": "多商品广告组",
            "asin": "B000TEST01",
            "sku": "TEST-SKU-A",
            "msku": "TEST-MSKU-A",
            "product_name": "测试广告商品 A",
            "placement": None,
            "search_term": "12 month sunglasses",
            "intent_label": "婴幼儿太阳镜长尾词",
            "shop_id": "market:1",
            "shop_name": "rivbos",
            "market_id": 1,
            "marketplace": "US",
            "country": "US",
            "source_type": "api_snapshot",
            "snapshot_id": "snapshot-test",
            "source_table": "ad_search_term_daily_metrics",
            "source_record_id": "fixture-long-tail-search-term",
            "start_date": "2026-06-08",
            "end_date": "2026-06-14",
            "impressions": 5,
            "clicks": 3,
            "cost": 1.12,
            "orders": 2,
            "sales": 22.97,
        }
    ]

    signals = detect_signals(rows)

    signal = next(item for item in signals if item.id == "sig-long-tail-opportunity-fixture-long-tail-search-term")
    assert signal.signal_type == SignalType.OPPORTUNITY
    assert signal.object_type == ObjectType.SEARCH_TERM
    assert signal.signal_category == "search_term_opportunity"
    assert signal.priority == "P2"
    assert signal.confidence == "medium"
    assert "12 month sunglasses" in signal.summary
    assert "低花费高转化" in signal.summary
    assert signal.evidence.metrics.orders == 2
    assert signal.evidence.metrics.acos is not None
    assert signal.evidence.metrics.acos <= 0.1
    facts = {fact.label: fact.value for fact in signal.evidence.facts}
    assert facts["搜索词"] == "12 month sunglasses"
    assert facts["花费"] == "1.12"
    assert facts["订单"] == "2"
    assert facts["ACOS"] == "4.88%"
    assert "小流量观察" in facts["人工动作路径"]
    assert "7/14 天" in facts["复盘指标"]
    assert signal.suggested_action.requires_manual_confirmation is True
    assert "自动" not in signal.suggested_action.description


def test_does_not_detect_low_sample_search_term_opportunity_without_market_or_context_support() -> None:
    rows = [
        {
            "row_id": "fixture-low-sample-search-term",
            "campaign_name": "SP 测试活动",
            "ad_group_name": "单一广告组",
            "asin": "B000TEST01",
            "sku": "TEST-SKU-A",
            "msku": "TEST-MSKU-A",
            "product_name": "测试广告商品 A",
            "placement": None,
            "search_term": "boys polarized sunglasses age 6-8",
            "normalized_query": "boys polarized sunglasses age 6-8",
            "intent_label": "未分组搜索词",
            "shop_id": "market:1",
            "shop_name": "rivbos",
            "market_id": 1,
            "marketplace": "US",
            "country": "US",
            "source_type": "api_snapshot",
            "snapshot_id": "snapshot-test",
            "source_table": "ad_search_term_daily_metrics",
            "source_record_id": "fixture-low-sample-search-term",
            "start_date": "2026-06-08",
            "end_date": "2026-06-14",
            "impressions": 5,
            "clicks": 1,
            "cost": 1.24,
            "orders": 3,
            "sales": 30.54,
        }
    ]

    signals = detect_signals(rows)

    assert [signal for signal in signals if signal.signal_category == "search_term_opportunity"] == []


def test_does_not_detect_low_sample_long_tail_without_market_or_context_support() -> None:
    rows = [
        {
            "row_id": "fixture-low-sample-long-tail-search-term",
            "campaign_name": "SP 测试活动",
            "ad_group_name": "单一广告组",
            "asin": "B000TEST01",
            "sku": "TEST-SKU-A",
            "msku": "TEST-MSKU-A",
            "product_name": "测试广告商品 A",
            "placement": None,
            "search_term": "4 year old sunglasses boy",
            "normalized_query": "4 year old sunglasses boy",
            "intent_label": "未分组搜索词",
            "shop_id": "market:1",
            "shop_name": "rivbos",
            "market_id": 1,
            "marketplace": "US",
            "country": "US",
            "source_type": "api_snapshot",
            "snapshot_id": "snapshot-test",
            "source_table": "ad_search_term_daily_metrics",
            "source_record_id": "fixture-low-sample-long-tail-search-term",
            "start_date": "2026-06-08",
            "end_date": "2026-06-14",
            "impressions": 5,
            "clicks": 1,
            "cost": 0.9,
            "orders": 2,
            "sales": 22.97,
        }
    ]

    signals = detect_signals(rows)

    assert [signal for signal in signals if signal.signal_category == "search_term_opportunity"] == []


def test_asin_like_long_tail_search_term_uses_product_targeting_review_action() -> None:
    rows = [
        {
            "row_id": "fixture-asin-like-long-tail-search-term",
            "campaign_name": "SP 商品定向测试",
            "ad_group_name": "商品定向广告组",
            "keyword_id": None,
            "keyword_text": "substitutes",
            "target_id": "target-asin",
            "target_text": None,
            "product_name": "B01FAY0YL0",
            "placement": None,
            "search_term": "B01FAY0YL0",
            "normalized_query": "b01fay0yl0",
            "intent_label": "未分组搜索词",
            "shop_id": "market:1",
            "shop_name": "rivbos",
            "market_id": 1,
            "marketplace": "US",
            "country": "US",
            "source_type": "api_snapshot",
            "snapshot_id": "snapshot-test",
            "source_table": "ad_search_term_daily_metrics",
            "source_record_id": "fixture-asin-like-long-tail-search-term",
            "start_date": "2026-05-18",
            "end_date": "2026-06-16",
            "impressions": 12,
            "clicks": 1,
            "cost": 0.45,
            "orders": 2,
            "sales": 19.51,
        }
    ]

    signals = detect_signals(rows)

    signal = next(item for item in signals if item.id == "sig-long-tail-opportunity-fixture-asin-like-long-tail-search-term")

    assert signal.suggested_action.action_type == "review_product_targeting_search_term"
    assert "商品定向" in signal.suggested_action.title
    assert "精准关键词" not in signal.suggested_action.description
    assert "ASIN 型搜索词" in signal.summary
    assert any(fact.label == "对象边界" for fact in signal.evidence.facts)
    facts = {fact.label: fact.value for fact in signal.evidence.facts}
    assert "商品定向" in facts["人工动作路径"]
    assert "target_id" in facts["复盘指标"]


def test_long_tail_search_term_uses_aba_phrase_context_without_high_confidence() -> None:
    rows = [
        {
            "row_id": "fixture-long-tail-beach-essentials",
            "campaign_name": "RBK004-扩展-beach essentials",
            "ad_group_name": "RBK004-扩展-beach essentials",
            "asin": "B00K4W4AAA",
            "sku": "RBK004",
            "msku": "RBK004",
            "product_name": "beach essentials for toddlers 1-3",
            "placement": None,
            "search_term": "beach essentials for toddlers 1-3",
            "normalized_query": "beach essentials for toddlers 1-3",
            "intent_label": "未分组搜索词",
            "shop_id": "market:1",
            "shop_name": "rivbos",
            "market_id": 1,
            "marketplace": "US",
            "country": "US",
            "source_type": "api_snapshot",
            "snapshot_id": "snapshot-test",
            "source_table": "ad_search_term_daily_metrics",
            "source_record_id": "fixture-long-tail-beach-essentials",
            "start_date": "2026-05-18",
            "end_date": "2026-06-16",
            "impressions": 65,
            "clicks": 3,
            "cost": 1.6,
            "orders": 2,
            "sales": 16.96,
        }
    ]
    aba_rows = [
        {
            "source_record_id": "aba-row-beach-essentials",
            "source_type": "ABA导出",
            "source_table": "aba_search_term_snapshots",
            "source_file": "ABA搜索词报表-000049101-20260616173512.xlsx",
            "source_name": "ABA搜索词快照",
            "marketplace_id": 1,
            "marketplace_code": "US",
            "country": "US",
            "start_date": "2026-06-07",
            "end_date": "2026-06-13",
            "search_term": "beach essentials",
            "normalized_query": "beach essentials",
            "search_frequency_rank": 208,
        }
    ]

    signals = detect_signals(rows, aba_rows=aba_rows)

    signal = next(item for item in signals if item.id == "sig-long-tail-opportunity-fixture-long-tail-beach-essentials")
    facts = {fact.label: fact.value for fact in signal.evidence.facts}

    assert signal.object_type == ObjectType.SEARCH_TERM
    assert signal.signal_category == "search_term_opportunity"
    assert signal.confidence == "medium"
    assert {source.source_type for source in signal.data_sources} == {"积加API", "ABA导出"}
    assert facts["ABA语义参考词"] == "beach essentials"
    assert facts["ABA语义参考排名"] == "208"
    assert "短语包含" in facts["ABA匹配边界"]
    assert "规则语义：海滩出行用品" in {fact.value for fact in signal.evidence.facts}
    assert "短语参考" in signal.uncertainty
    assert "自动" not in signal.suggested_action.description


def test_does_not_detect_low_click_long_tail_with_aba_phrase_context_only() -> None:
    rows = [
        {
            "row_id": "fixture-low-click-long-tail-with-aba-phrase",
            "campaign_name": "RB833-词组-sunglasses for women",
            "ad_group_name": "RB833-词组-sunglasses for women",
            "asin": "B000TEST01",
            "sku": "TEST-SKU-A",
            "msku": "TEST-MSKU-A",
            "product_name": "adult sunglasses womens sporty",
            "placement": None,
            "search_term": "adult sunglasses womens sporty",
            "normalized_query": "adult sunglasses womens sporty",
            "intent_label": "未分组搜索词",
            "shop_id": "market:1",
            "shop_name": "rivbos",
            "market_id": 1,
            "marketplace": "US",
            "country": "US",
            "source_type": "api_snapshot",
            "snapshot_id": "snapshot-test",
            "source_table": "ad_search_term_daily_metrics",
            "source_record_id": "fixture-low-click-long-tail-with-aba-phrase",
            "start_date": "2026-05-18",
            "end_date": "2026-06-16",
            "impressions": 2,
            "clicks": 1,
            "cost": 1.46,
            "orders": 2,
            "sales": 38.21,
        }
    ]
    aba_rows = [
        {
            "source_record_id": "aba-row-sunglasses-womens",
            "source_type": "ABA导出",
            "source_table": "aba_search_term_snapshots",
            "source_file": "ABA搜索词报表-000049101-20260616173512.xlsx",
            "source_name": "ABA搜索词快照",
            "marketplace_id": 1,
            "marketplace_code": "US",
            "country": "US",
            "start_date": "2026-06-07",
            "end_date": "2026-06-13",
            "search_term": "sunglasses womens",
            "normalized_query": "sunglasses womens",
            "search_frequency_rank": 112,
        }
    ]

    signals = detect_signals(rows, aba_rows=aba_rows)

    assert [signal for signal in signals if signal.signal_category == "search_term_opportunity"] == []


def test_does_not_detect_long_tail_search_term_signal_with_single_order() -> None:
    rows = [
        {
            "row_id": "fixture-single-order-search-term",
            "campaign_name": "SP 测试活动",
            "ad_group_name": "多商品广告组",
            "asin": "B000TEST01",
            "sku": "TEST-SKU-A",
            "msku": "TEST-MSKU-A",
            "product_name": "测试广告商品 A",
            "placement": None,
            "search_term": "1 year old sunglasses",
            "intent_label": "婴幼儿太阳镜长尾词",
            "shop_id": "market:1",
            "shop_name": "rivbos",
            "market_id": 1,
            "marketplace": "US",
            "country": "US",
            "source_type": "api_snapshot",
            "snapshot_id": "snapshot-test",
            "source_table": "ad_search_term_daily_metrics",
            "source_record_id": "fixture-single-order-search-term",
            "start_date": "2026-06-08",
            "end_date": "2026-06-14",
            "impressions": 9,
            "clicks": 1,
            "cost": 1.12,
            "orders": 1,
            "sales": 9.99,
        }
    ]

    signals = detect_signals(rows)

    assert [signal for signal in signals if signal.id.startswith("sig-long-tail-opportunity-")] == []


def test_detects_same_search_term_performance_split_signal() -> None:
    base_row = {
        "campaign_name": "RBK004-AUTO",
        "ad_group_name": "RBK004-Auto",
        "asin": "B000TEST01",
        "sku": "TEST-SKU-A",
        "msku": "TEST-MSKU-A",
        "product_name": "测试广告商品 A",
        "placement": None,
        "search_term": "1 year old sunglasses",
        "normalized_query": "1 year old sunglasses",
        "intent_label": "婴幼儿太阳镜长尾词",
        "keyword_text": "*",
        "shop_id": "market:1",
        "shop_name": "rivbos",
        "market_id": 1,
        "marketplace": "US",
        "country": "US",
        "source_type": "api_snapshot",
        "snapshot_id": "snapshot-test",
        "source_table": "ad_search_term_daily_metrics",
        "start_date": "2026-06-08",
        "end_date": "2026-06-14",
        "impressions": 20,
        "clicks": 2,
    }
    rows = [
        {
            **base_row,
            "row_id": "fixture-search-term-no-order",
            "source_record_id": "fixture-search-term-no-order",
            "cost": 2.24,
            "orders": 0,
            "sales": 0,
        },
        {
            **base_row,
            "row_id": "fixture-search-term-order-a",
            "source_record_id": "fixture-search-term-order-a",
            "cost": 1.12,
            "orders": 1,
            "sales": 9.99,
        },
        {
            **base_row,
            "row_id": "fixture-search-term-order-b",
            "source_record_id": "fixture-search-term-order-b",
            "cost": 0.7,
            "orders": 1,
            "sales": 11.99,
        },
    ]

    signals = detect_signals(rows)

    signal = next(
        item
        for item in signals
        if item.id == "sig-search-term-performance-split-fixture-search-term-no-order"
    )
    assert signal.signal_type == SignalType.ANOMALY
    assert signal.object_type == ObjectType.SEARCH_TERM
    assert signal.signal_category == "search_term_performance_split"
    assert signal.priority == "P2"
    assert signal.confidence == "medium"
    assert "1 year old sunglasses" in signal.summary
    assert "表现分化" in signal.summary
    assert signal.evidence.metrics.cost == 4.06
    assert signal.evidence.metrics.orders == 2
    assert signal.evidence_count == 6
    assert {fact.label: fact.value for fact in signal.evidence.facts} == {
        "搜索词": "1 year old sunglasses",
        "投放行数": "3",
        "总花费": "4.06",
        "总订单": "2",
        "无订单花费占比": "55.17%",
        "投放行表现明细": "RBK004-AUTO / RBK004-Auto / 投放对象 *：花费 2.24，订单 0，销售额 0.0，ACOS 无销售额，CVR 0.00%；RBK004-AUTO / RBK004-Auto / 投放对象 *：花费 1.12，订单 1，销售额 9.99，ACOS 11.21%，CVR 50.00%；RBK004-AUTO / RBK004-Auto / 投放对象 *：花费 0.7，订单 1，销售额 11.99，ACOS 5.84%，CVR 50.00%",
    }
    assert signal.suggested_action.requires_manual_confirmation is True
    assert "自动" not in signal.suggested_action.description


def test_does_not_detect_same_search_term_split_without_mixed_outcomes() -> None:
    rows = [
        {
            "row_id": "fixture-search-term-order-only-a",
            "campaign_name": "RBK004-AUTO",
            "ad_group_name": "RBK004-Auto",
            "asin": "B000TEST01",
            "sku": "TEST-SKU-A",
            "msku": "TEST-MSKU-A",
            "product_name": "测试广告商品 A",
            "placement": None,
            "search_term": "1 year old sunglasses",
            "normalized_query": "1 year old sunglasses",
            "intent_label": "婴幼儿太阳镜长尾词",
            "shop_id": "market:1",
            "shop_name": "rivbos",
            "market_id": 1,
            "marketplace": "US",
            "country": "US",
            "source_type": "api_snapshot",
            "snapshot_id": "snapshot-test",
            "source_table": "ad_search_term_daily_metrics",
            "source_record_id": "fixture-search-term-order-only-a",
            "start_date": "2026-06-08",
            "end_date": "2026-06-14",
            "impressions": 10,
            "clicks": 1,
            "cost": 1.12,
            "orders": 1,
            "sales": 9.99,
        },
        {
            "row_id": "fixture-search-term-order-only-b",
            "campaign_name": "RBK004-AUTO",
            "ad_group_name": "RBK004-Auto",
            "asin": "B000TEST01",
            "sku": "TEST-SKU-A",
            "msku": "TEST-MSKU-A",
            "product_name": "测试广告商品 A",
            "placement": None,
            "search_term": "1 year old sunglasses",
            "normalized_query": "1 year old sunglasses",
            "intent_label": "婴幼儿太阳镜长尾词",
            "shop_id": "market:1",
            "shop_name": "rivbos",
            "market_id": 1,
            "marketplace": "US",
            "country": "US",
            "source_type": "api_snapshot",
            "snapshot_id": "snapshot-test",
            "source_table": "ad_search_term_daily_metrics",
            "source_record_id": "fixture-search-term-order-only-b",
            "start_date": "2026-06-08",
            "end_date": "2026-06-14",
            "impressions": 10,
            "clicks": 1,
            "cost": 0.7,
            "orders": 1,
            "sales": 11.99,
        },
    ]

    signals = detect_signals(rows)

    assert [signal for signal in signals if signal.id.startswith("sig-search-term-performance-split-")] == []


def test_detects_sales_product_strong_but_ad_weak_signal() -> None:
    rows = [
        {
            "row_id": "fixture-sales-product-strong",
            "campaign_name": None,
            "ad_group_name": None,
            "asin": "B000TEST01",
            "sku": "SKU-1",
            "msku": "MSKU-1",
            "product_name": "测试销售商品",
            "placement": None,
            "search_term": "",
            "intent_label": "销售商品表现",
            "shop_id": "market:1",
            "shop_name": "rivbos",
            "market_id": 1,
            "marketplace": "US",
            "country": "US",
            "source_type": "api_snapshot",
            "snapshot_id": "snapshot-test",
            "source_table": "sales_product_daily_metrics",
            "source_record_id": "fixture-sales-product-strong",
            "start_date": "2026-06-08",
            "end_date": "2026-06-14",
            "impressions": 0,
            "clicks": 0,
            "cost": 8.6,
            "orders": 12,
            "sales": 239.4,
        },
        {
            "row_id": "fixture-ad-product-weak",
            "campaign_name": "SP 测试活动",
            "ad_group_name": "多商品广告组",
            "asin": "B000TEST01",
            "sku": "SKU-1",
            "msku": "MSKU-1",
            "product_name": "测试广告商品",
            "placement": None,
            "search_term": "",
            "intent_label": "广告商品表现",
            "shop_id": "market:1",
            "shop_name": "rivbos",
            "market_id": 1,
            "marketplace": "US",
            "country": "US",
            "source_type": "api_snapshot",
            "snapshot_id": "snapshot-test",
            "source_table": "advertised_products",
            "source_record_id": "fixture-ad-product-weak",
            "start_date": "2026-06-08",
            "end_date": "2026-06-14",
            "impressions": 200,
            "clicks": 12,
            "cost": 8.6,
            "orders": 1,
            "sales": 19.95,
        },
    ]

    signals = detect_signals(rows)

    signal = next(item for item in signals if item.signal_category == "product_ad_coverage")
    assert signal.signal_type == SignalType.OPPORTUNITY
    assert signal.object_type == ObjectType.SALES_PRODUCT
    assert signal.priority == "P0"
    assert signal.confidence == "high"
    assert signal.severity == 4
    assert "测试销售商品" in signal.summary
    assert "广告弱" in signal.summary
    assert signal.evidence.metrics.cost == 0
    assert signal.evidence.metrics.acos is None
    assert signal.evidence.metrics.orders == 12
    assert signal.evidence.primary_object.label == "测试销售商品"
    assert signal.evidence.primary_object.asin == "B000TEST01"
    assert {source.source_table for source in signal.data_sources} == {"sales_product_daily_metrics", "advertised_products"}
    assert any(fact.label == "销售订单" and fact.value == "12" for fact in signal.evidence.facts)
    assert any(fact.label == "广告订单" and fact.value == "1" for fact in signal.evidence.facts)
    assert signal.suggested_action.requires_manual_confirmation is True
    assert "自动" not in signal.suggested_action.description


def test_blocks_sales_product_ad_coverage_when_sales_ad_metrics_conflict_with_sp_ad_product() -> None:
    rows = [
        {
            "row_id": "fixture-sales-product-ad-metric-conflict",
            "asin": "B000TEST01",
            "sku": "SKU-1",
            "msku": "MSKU-1",
            "product_name": "广告口径冲突商品",
            "placement": None,
            "search_term": "",
            "intent_label": "销售商品表现",
            "shop_id": "market:1",
            "shop_name": "rivbos",
            "market_id": 1,
            "marketplace": "US",
            "country": "US",
            "source_type": "api_snapshot",
            "snapshot_id": "snapshot-test",
            "source_table": "sales_product_daily_metrics",
            "source_record_id": "fixture-sales-product-ad-metric-conflict",
            "start_date": "2026-06-08",
            "end_date": "2026-06-14",
            "impressions": 0,
            "clicks": 0,
            "cost": 0,
            "orders": 19,
            "sales": 209.58,
            "ad_spend": 135.88,
            "ad_orders": 30,
            "ad_sales": 314.78,
        },
        {
            "row_id": "fixture-sp-ad-product-low-orders",
            "campaign_name": "SP 测试活动",
            "ad_group_name": "多商品广告组",
            "asin": "B000TEST01",
            "sku": "SKU-1",
            "msku": "MSKU-1",
            "product_name": "广告口径冲突商品",
            "placement": None,
            "search_term": "",
            "intent_label": "广告商品表现",
            "shop_id": "market:1",
            "shop_name": "rivbos",
            "market_id": 1,
            "marketplace": "US",
            "country": "US",
            "source_type": "api_snapshot",
            "snapshot_id": "snapshot-test",
            "source_table": "advertised_products",
            "source_record_id": "fixture-sp-ad-product-low-orders",
            "start_date": "2026-06-08",
            "end_date": "2026-06-14",
            "impressions": 200,
            "clicks": 4,
            "cost": 4.65,
            "orders": 1,
            "sales": 9.03,
        },
    ]

    signals = detect_signals(rows)

    assert [signal for signal in signals if signal.signal_category == "product_ad_coverage"] == []
    conflict = next(signal for signal in signals if signal.id == "sig-data-quality-product-ad-coverage-metric-conflict")
    assert conflict.signal_type == SignalType.ANOMALY
    assert conflict.object_type == ObjectType.CROSS
    assert conflict.signal_category == "data_quality"
    assert "广告口径冲突" in conflict.summary
    assert {fact.label: fact.value for fact in conflict.evidence.facts} == {
        "冲突商品数": "1",
        "销售表现广告订单": "30",
        "SP 广告商品订单": "1",
        "示例商品": "广告口径冲突商品 / B000TEST01",
    }
    assert conflict.suggested_action.requires_manual_confirmation is True
    assert "自动" not in conflict.suggested_action.description


def test_does_not_detect_sales_product_ad_coverage_without_ad_product_match() -> None:
    rows = [
        {
            "row_id": "fixture-sales-product-strong-no-ad",
            "asin": "B000SALESONLY",
            "sku": "SALES-SKU-ONLY",
            "msku": "SALES-MSKU-ONLY",
            "product_name": "未投放销售商品",
            "placement": None,
            "search_term": "",
            "intent_label": "销售商品表现",
            "shop_id": "market:1",
            "shop_name": "rivbos",
            "market_id": 1,
            "marketplace": "US",
            "country": "US",
            "source_type": "api_snapshot",
            "snapshot_id": "snapshot-test",
            "source_table": "sales_product_daily_metrics",
            "source_record_id": "fixture-sales-product-strong-no-ad",
            "start_date": "2026-06-08",
            "end_date": "2026-06-14",
            "impressions": 0,
            "clicks": 0,
            "cost": 0,
            "orders": 18,
            "sales": 359.1,
        },
        {
            "row_id": "fixture-ad-product-other",
            "asin": "B000ADOTHER",
            "sku": "AD-SKU-OTHER",
            "msku": "AD-MSKU-OTHER",
            "product_name": "其他广告商品",
            "placement": None,
            "search_term": "",
            "intent_label": "广告商品表现",
            "shop_id": "market:1",
            "shop_name": "rivbos",
            "market_id": 1,
            "marketplace": "US",
            "country": "US",
            "source_type": "api_snapshot",
            "snapshot_id": "snapshot-test",
            "source_table": "advertised_products",
            "source_record_id": "fixture-ad-product-other",
            "start_date": "2026-06-08",
            "end_date": "2026-06-14",
            "impressions": 100,
            "clicks": 8,
            "cost": 6.2,
            "orders": 0,
            "sales": 0,
        },
    ]

    signals = detect_signals(rows)

    assert [signal for signal in signals if signal.signal_category == "product_ad_coverage"] == []


def test_does_not_detect_sales_product_signal_without_sales_strength() -> None:
    rows = [
        {
            "row_id": "fixture-sales-product-weak",
            "asin": "B000TEST01",
            "sku": "SKU-1",
            "msku": "MSKU-1",
            "product_name": "测试低销量商品",
            "placement": None,
            "search_term": "",
            "intent_label": "销售商品表现",
            "shop_id": "market:1",
            "shop_name": "rivbos",
            "market_id": 1,
            "marketplace": "US",
            "country": "US",
            "source_type": "api_snapshot",
            "snapshot_id": "snapshot-test",
            "source_table": "sales_product_daily_metrics",
            "source_record_id": "fixture-sales-product-weak",
            "start_date": "2026-06-08",
            "end_date": "2026-06-14",
            "impressions": 0,
            "clicks": 0,
            "cost": 0,
            "orders": 1,
            "sales": 19.95,
        }
    ]

    signals = detect_signals(rows)

    assert [signal for signal in signals if signal.signal_category == "product_ad_coverage"] == []


def test_detects_product_ad_coverage_data_gap_when_sales_signal_cannot_be_evaluated() -> None:
    rows = [
        {
            "row_id": "fixture-sales-product-zero-orders",
            "asin": "B000SALES01",
            "sku": "SALES-SKU-1",
            "msku": "SALES-MSKU-1",
            "product_name": "零订单销售商品",
            "placement": None,
            "search_term": "",
            "intent_label": "销售商品表现",
            "shop_id": "market:1",
            "shop_name": "rivbos",
            "market_id": 1,
            "marketplace": "US",
            "country": "US",
            "source_type": "api_snapshot",
            "snapshot_id": "snapshot-test",
            "source_table": "sales_product_daily_metrics",
            "source_record_id": "fixture-sales-product-zero-orders",
            "start_date": "2026-06-08",
            "end_date": "2026-06-14",
            "impressions": 0,
            "clicks": 0,
            "cost": 0,
            "orders": 0,
            "sales": 0,
        },
        {
            "row_id": "fixture-ad-product-unmatched",
            "asin": "B000ADONLY1",
            "sku": "AD-SKU-1",
            "msku": "AD-MSKU-1",
            "product_name": "未匹配广告商品",
            "placement": None,
            "search_term": "",
            "intent_label": "广告商品表现",
            "shop_id": "market:1",
            "shop_name": "rivbos",
            "market_id": 1,
            "marketplace": "US",
            "country": "US",
            "source_type": "api_snapshot",
            "snapshot_id": "snapshot-test",
            "source_table": "advertised_products",
            "source_record_id": "fixture-ad-product-unmatched",
            "start_date": "2026-06-08",
            "end_date": "2026-06-14",
            "impressions": 10,
            "clicks": 1,
            "cost": 0.3,
            "orders": 0,
            "sales": 0,
        },
    ]

    signals = detect_signals(rows)

    data_gap = next(signal for signal in signals if signal.id == "sig-data-quality-product-ad-coverage-unavailable")
    assert data_gap.signal_type == SignalType.ANOMALY
    assert data_gap.object_type == ObjectType.CROSS
    assert data_gap.signal_category == "data_quality"
    assert data_gap.priority == "P1"
    assert data_gap.confidence == "high"
    assert "产品销售承接信号证据不足" in data_gap.summary
    assert data_gap.evidence.primary_object.label == "产品销售承接证据"
    assert {fact.label: fact.value for fact in data_gap.evidence.facts} == {
        "销售商品指标行": "1",
        "强销售商品": "0",
        "广告商品行": "1",
        "商品关联命中": "0",
    }
    assert {source.source_table for source in data_gap.data_sources} == {
        "sales_product_daily_metrics",
        "advertised_products",
    }
    assert data_gap.suggested_action.requires_manual_confirmation is True
    assert "自动" not in data_gap.suggested_action.description


def test_detects_ad_group_spend_concentration_across_multiple_ad_products() -> None:
    rows = [
        {
            "row_id": "fixture-ad-product-low-spend",
            "campaign_name": "SP 测试活动",
            "ad_group_id": "group-1",
            "ad_group_name": "多商品广告组",
            "ad_id": "ad-1",
            "asin": "B000TEST01",
            "msku": "MSKU-1",
            "product_name": "广告商品 A",
            "placement": None,
            "search_term": "",
            "intent_label": "广告商品表现",
            "shop_id": "market:1",
            "shop_name": "rivbos",
            "market_id": 1,
            "marketplace": "US",
            "country": "US",
            "source_type": "api_snapshot",
            "snapshot_id": "snapshot-test",
            "source_table": "advertised_products",
            "source_record_id": "fixture-ad-product-low-spend",
            "start_date": "2026-06-08",
            "end_date": "2026-06-14",
            "impressions": 1200,
            "clicks": 12,
            "cost": 20,
            "orders": 2,
            "sales": 40,
        },
        {
            "row_id": "fixture-ad-product-high-spend",
            "campaign_name": "SP 测试活动",
            "ad_group_id": "group-1",
            "ad_group_name": "多商品广告组",
            "ad_id": "ad-2",
            "asin": "B000TEST02",
            "msku": "MSKU-2",
            "product_name": "广告商品 B",
            "placement": None,
            "search_term": "",
            "intent_label": "广告商品表现",
            "shop_id": "market:1",
            "shop_name": "rivbos",
            "market_id": 1,
            "marketplace": "US",
            "country": "US",
            "source_type": "api_snapshot",
            "snapshot_id": "snapshot-test",
            "source_table": "advertised_products",
            "source_record_id": "fixture-ad-product-high-spend",
            "start_date": "2026-06-08",
            "end_date": "2026-06-14",
            "impressions": 7600,
            "clicks": 80,
            "cost": 80,
            "orders": 12,
            "sales": 240,
        },
    ]

    signals = detect_signals(rows)

    signal = next(item for item in signals if item.id == "sig-ad-group-spend-concentration-group-1")
    assert signal.signal_type == SignalType.OPPORTUNITY
    assert signal.object_type == ObjectType.AD_GROUP
    assert signal.signal_category == "ad_group_structure"
    assert signal.priority == "P2"
    assert signal.confidence == "medium"
    assert signal.severity == 2
    assert "多商品广告组" in signal.summary
    assert "消耗集中" in signal.summary
    assert "主推款" in signal.summary
    assert "商品级诊断需要拆开看" not in signal.summary
    assert "如果头部 ASIN 是主推款，这种集中可能是正常投放策略" in signal.uncertainty
    assert signal.evidence.primary_object.ad_group_name == "多商品广告组"
    assert {fact.label: fact.value for fact in signal.evidence.facts} == {
        "广告商品数": "2",
        "广告商品清单": "B000TEST02 / MSKU-2 / 花费 80.0 / 订单 12；B000TEST01 / MSKU-1 / 花费 20.0 / 订单 2",
        "商品表现差异": "B000TEST02 花费占 80.00%，订单 12，销售额 240.0，ACOS 33.33%，CVR 15.00%；B000TEST01 花费占 20.00%，订单 2，销售额 40.0，ACOS 50.00%，CVR 16.67%（样本边界：点击样本少，仅适合观察）。部分商品样本不足，当前差异只能作为观察提示，不能当作稳定结论。",
        "策略边界": "当前快照没有主推款标记。若头部 ASIN 是主推款，消耗集中属于正常策略；若不是主推款，再考虑拆分观察。",
        "广告组总花费": "100.0",
        "头部商品花费占比": "80.00%",
        "头部广告商品": "广告商品 B",
    }
    assert {source.source_record_id for source in signal.data_sources} == {
        "fixture-ad-product-low-spend",
        "fixture-ad-product-high-spend",
    }
    assert signal.suggested_action.requires_manual_confirmation is True
    assert "主推款" in signal.suggested_action.title
    assert "自动" not in signal.suggested_action.description


def test_skips_ad_group_spend_concentration_when_top_asin_is_main_push() -> None:
    rows = [
        {
            "row_id": "fixture-ad-product-low-spend",
            "campaign_name": "SP 测试活动",
            "ad_group_id": "group-1",
            "ad_group_name": "多商品广告组",
            "ad_id": "ad-1",
            "asin": "B000TEST01",
            "msku": "MSKU-1",
            "product_name": "广告商品 A",
            "shop_id": "market:1",
            "shop_name": "rivbos",
            "market_id": 1,
            "marketplace": "US",
            "country": "US",
            "source_type": "api_snapshot",
            "snapshot_id": "snapshot-test",
            "source_table": "advertised_products",
            "source_record_id": "fixture-ad-product-low-spend",
            "start_date": "2026-06-08",
            "end_date": "2026-06-14",
            "impressions": 1200,
            "clicks": 12,
            "cost": 20,
            "orders": 2,
            "sales": 40,
        },
        {
            "row_id": "fixture-ad-product-high-spend",
            "campaign_name": "SP 测试活动",
            "ad_group_id": "group-1",
            "ad_group_name": "多商品广告组",
            "ad_id": "ad-2",
            "asin": "B000TEST02",
            "msku": "MSKU-2",
            "product_name": "广告商品 B",
            "shop_id": "market:1",
            "shop_name": "rivbos",
            "market_id": 1,
            "marketplace": "US",
            "country": "US",
            "source_type": "api_snapshot",
            "snapshot_id": "snapshot-test",
            "source_table": "advertised_products",
            "source_record_id": "fixture-ad-product-high-spend",
            "start_date": "2026-06-08",
            "end_date": "2026-06-14",
            "impressions": 7600,
            "clicks": 80,
            "cost": 80,
            "orders": 12,
            "sales": 240,
        },
    ]

    signals = detect_signals(
        rows,
        promotion_strategies=[
            {
                "market_id": 1,
                "ad_group_id": "group-1",
                "asin": "B000TEST02",
                "strategy_role": "main_push",
                "strategy_label": "主推款",
                "start_date": "2026-06-01",
                "end_date": "2026-06-30",
            }
        ],
    )

    assert [item for item in signals if item.id == "sig-ad-group-spend-concentration-group-1"] == []


def test_ad_group_product_difference_marks_low_sample_as_observation_only() -> None:
    rows = [
        {
            "row_id": "fixture-ad-product-small-sample-low-spend",
            "campaign_name": "SP 测试活动",
            "ad_group_id": "group-small-sample",
            "ad_group_name": "低样本多商品广告组",
            "ad_id": "ad-1",
            "asin": "B000TEST01",
            "msku": "MSKU-1",
            "product_name": "广告商品 A",
            "placement": None,
            "search_term": "",
            "intent_label": "广告商品表现",
            "shop_id": "market:1",
            "shop_name": "rivbos",
            "market_id": 1,
            "marketplace": "US",
            "country": "US",
            "source_type": "api_snapshot",
            "snapshot_id": "snapshot-test",
            "source_table": "advertised_products",
            "source_record_id": "fixture-ad-product-small-sample-low-spend",
            "start_date": "2026-06-08",
            "end_date": "2026-06-14",
            "impressions": 500,
            "clicks": 2,
            "cost": 20,
            "orders": 1,
            "sales": 12,
        },
        {
            "row_id": "fixture-ad-product-small-sample-high-spend",
            "campaign_name": "SP 测试活动",
            "ad_group_id": "group-small-sample",
            "ad_group_name": "低样本多商品广告组",
            "ad_id": "ad-2",
            "asin": "B000TEST02",
            "msku": "MSKU-2",
            "product_name": "广告商品 B",
            "placement": None,
            "search_term": "",
            "intent_label": "广告商品表现",
            "shop_id": "market:1",
            "shop_name": "rivbos",
            "market_id": 1,
            "marketplace": "US",
            "country": "US",
            "source_type": "api_snapshot",
            "snapshot_id": "snapshot-test",
            "source_table": "advertised_products",
            "source_record_id": "fixture-ad-product-small-sample-high-spend",
            "start_date": "2026-06-08",
            "end_date": "2026-06-14",
            "impressions": 1200,
            "clicks": 3,
            "cost": 80,
            "orders": 0,
            "sales": 0,
        },
    ]

    signals = detect_signals(rows)

    signal = next(item for item in signals if item.id == "sig-ad-group-spend-concentration-group-small-sample")
    facts = {fact.label: fact.value for fact in signal.evidence.facts}
    difference = facts["商品表现差异"]
    assert "B000TEST02 花费占 80.00%" in difference
    assert "样本边界：点击样本少 / 订单样本少 / 无销售额，仅适合观察" in difference
    assert "部分商品样本不足" in difference
    assert "不能当作稳定结论" in difference


def test_ad_group_structure_explains_search_term_attribution_boundary() -> None:
    rows = [
        {
            "row_id": "fixture-ad-product-a",
            "campaign_name": "SP 测试活动",
            "ad_group_id": "group-attribution",
            "ad_group_name": "归因边界广告组",
            "ad_id": "ad-1",
            "asin": "B000TEST01",
            "msku": "MSKU-1",
            "product_name": "广告商品 A",
            "placement": None,
            "search_term": "",
            "intent_label": "广告商品表现",
            "shop_id": "market:1",
            "shop_name": "rivbos",
            "market_id": 1,
            "marketplace": "US",
            "country": "US",
            "source_type": "api_snapshot",
            "snapshot_id": "snapshot-test",
            "source_table": "advertised_products",
            "source_record_id": "fixture-ad-product-a",
            "start_date": "2026-06-08",
            "end_date": "2026-06-14",
            "impressions": 3600,
            "clicks": 40,
            "cost": 20,
            "orders": 4,
            "sales": 80,
        },
        {
            "row_id": "fixture-ad-product-b",
            "campaign_name": "SP 测试活动",
            "ad_group_id": "group-attribution",
            "ad_group_name": "归因边界广告组",
            "ad_id": "ad-2",
            "asin": "B000TEST02",
            "msku": "MSKU-2",
            "product_name": "广告商品 B",
            "placement": None,
            "search_term": "",
            "intent_label": "广告商品表现",
            "shop_id": "market:1",
            "shop_name": "rivbos",
            "market_id": 1,
            "marketplace": "US",
            "country": "US",
            "source_type": "api_snapshot",
            "snapshot_id": "snapshot-test",
            "source_table": "advertised_products",
            "source_record_id": "fixture-ad-product-b",
            "start_date": "2026-06-08",
            "end_date": "2026-06-14",
            "impressions": 7600,
            "clicks": 80,
            "cost": 80,
            "orders": 12,
            "sales": 240,
        },
        {
            "row_id": "fixture-search-term-row",
            "campaign_name": "SP 测试活动",
            "ad_group_id": "group-attribution",
            "ad_group_name": "归因边界广告组",
            "search_term": "baby sunglasses",
            "normalized_query": "baby sunglasses",
            "intent_label": "未分组搜索词",
            "shop_id": "market:1",
            "shop_name": "rivbos",
            "market_id": 1,
            "marketplace": "US",
            "country": "US",
            "source_type": "api_snapshot",
            "snapshot_id": "snapshot-test",
            "source_table": "ad_search_term_daily_metrics",
            "source_record_id": "fixture-search-term-row",
            "start_date": "2026-06-08",
            "end_date": "2026-06-14",
            "impressions": 500,
            "clicks": 10,
            "cost": 8,
            "orders": 1,
            "sales": 20,
        },
    ]

    signals = detect_signals(rows)

    signal = next(item for item in signals if item.id == "sig-ad-group-spend-concentration-group-attribution")
    facts = {fact.label: fact.value for fact in signal.evidence.facts}
    boundary = facts["归因边界"]
    assert "1 条搜索词表现行" in boundary
    assert "不能自动归属到 B000TEST02 / B000TEST01 中任一广告商品" in boundary
    assert "人工判断" in boundary
    assert facts["策略边界"] == "当前快照没有主推款标记。若头部 ASIN 是主推款，消耗集中属于正常策略；若不是主推款，再考虑拆分观察。"
    assert signal.evidence_count == 8
    assert [row["source_table"] for row in signal.evidence.source_rows] == ["advertised_products", "advertised_products"]
    assert {source.source_record_id for source in signal.data_sources} == {
        "fixture-ad-product-a",
        "fixture-ad-product-b",
        "fixture-search-term-row",
    }


def test_does_not_detect_ad_group_spend_concentration_for_single_ad_product() -> None:
    rows = [
        {
            "row_id": "fixture-single-ad-product",
            "campaign_name": "SP 测试活动",
            "ad_group_id": "group-1",
            "ad_group_name": "单商品广告组",
            "ad_id": "ad-1",
            "asin": "B000TEST01",
            "msku": "MSKU-1",
            "product_name": "广告商品 A",
            "placement": None,
            "search_term": "",
            "intent_label": "广告商品表现",
            "shop_id": "market:1",
            "shop_name": "rivbos",
            "market_id": 1,
            "marketplace": "US",
            "country": "US",
            "source_type": "api_snapshot",
            "snapshot_id": "snapshot-test",
            "source_table": "advertised_products",
            "source_record_id": "fixture-single-ad-product",
            "start_date": "2026-06-08",
            "end_date": "2026-06-14",
            "impressions": 7600,
            "clicks": 80,
            "cost": 100,
            "orders": 12,
            "sales": 240,
        },
    ]

    signals = detect_signals(rows)

    assert [signal for signal in signals if signal.signal_category == "ad_group_structure"] == []


def test_does_not_detect_placement_opportunity_from_single_period_stable_conversion() -> None:
    rows = [
        {
            "row_id": "fixture-placement-opportunity",
            "campaign_name": "RBK004-AUTO",
            "product_name": "RBK004-AUTO",
            "placement": "Detail Page on-Amazon",
            "search_term": "",
            "intent_label": "广告位表现",
            "shop_id": "market:1",
            "shop_name": "rivbos",
            "market_id": 1,
            "marketplace": "US",
            "country": "US",
            "source_type": "api_snapshot",
            "snapshot_id": "snapshot-test",
            "source_table": "ad_placement_daily_metrics",
            "source_record_id": "fixture-placement-opportunity",
            "start_date": "2026-06-08",
            "end_date": "2026-06-14",
            "impressions": 6841,
            "clicks": 16,
            "cost": 11.2,
            "orders": 4,
            "sales": 44.95,
        }
    ]

    signals = detect_signals(rows)

    assert signals == []


def test_search_intent_summary_groups_terms_by_semantics() -> None:
    summaries = search_intent_summaries(TEST_ROWS)

    model_term_summary = next(item for item in summaries if item.intent_label == "测试转化意图")

    assert "测试低 ACOS 出单词" in model_term_summary.search_terms
    assert model_term_summary.metrics.orders == 7
    assert "放量候选" in model_term_summary.insight
