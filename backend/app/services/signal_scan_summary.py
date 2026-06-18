from collections import Counter
from typing import Any

from app.models.signals import AiSignal


TABLE_ROLES = {
    "advertised_products": "广告商品表现",
    "ad_search_term_daily_metrics": "搜索词表现",
    "ad_placement_daily_metrics": "广告位表现",
    "sales_products": "销售商品",
    "sales_product_daily_metrics": "销售表现",
    "ad_campaigns": "广告活动",
    "ad_groups": "广告组容器",
    "shops": "店铺",
    "marketplaces": "站点",
    "aba_search_term_top1000": "ABA 市场机会增强",
}

TABLE_ORDER = [
    "advertised_products",
    "ad_search_term_daily_metrics",
    "ad_placement_daily_metrics",
    "sales_products",
    "sales_product_daily_metrics",
    "ad_campaigns",
    "ad_groups",
    "shops",
    "marketplaces",
]

SIGNAL_CATEGORY_LABELS = {
    "data_quality": "数据质量",
    "placement_efficiency": "广告位机会",
    "advertised_product_opportunity": "广告商品机会",
    "advertised_product_efficiency": "广告商品异常",
    "search_term_performance_split": "搜索词表现分化",
    "search_term_opportunity": "搜索词机会",
    "ad_group_structure": "广告组结构",
    "aba_market_opportunity": "ABA 市场机会",
    "market_opportunity": "市场机会",
}


def build_signal_scan_summary(
    *,
    signal_rows: list[dict[str, Any]],
    aba_rows: list[dict[str, Any]],
    signals: list[AiSignal],
    inspection: dict[str, Any] | None,
    promotion_strategies: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    row_counts = _row_counts(signal_rows, inspection)
    scanned_tables = [
        {"name": table, "row_count": count, "role": TABLE_ROLES.get(table, table)}
        for table, count in sorted(row_counts.items(), key=lambda item: _table_sort_key(item[0]))
        if count > 0
    ]
    if aba_rows:
        scanned_tables.append(
            {
                "name": "aba_search_term_top1000",
                "row_count": len(aba_rows),
                "role": TABLE_ROLES["aba_search_term_top1000"],
            }
        )

    category_counts = Counter(signal.signal_category for signal in signals)
    hit_signal_categories = [
        {
            "signal_category": category,
            "label": SIGNAL_CATEGORY_LABELS.get(category, category),
            "count": count,
        }
        for category, count in sorted(category_counts.items())
    ]

    suppressed_reasons = _suppressed_reasons(promotion_strategies)
    attribution_boundaries = _attribution_boundaries(row_counts, category_counts)
    signal_row_count = int((inspection or {}).get("signal_row_count") or len(signal_rows))

    return {
        "summary_text": f"本次扫描 {signal_row_count} 行真实 API 数据，命中 {len(hit_signal_categories)} 类 AI 信号。",
        "scanned_tables": scanned_tables,
        "hit_signal_categories": hit_signal_categories,
        "suppressed_reasons": suppressed_reasons,
        "attribution_boundaries": attribution_boundaries,
        "next_focus": "先看 Parent ASIN / ASIN 商品信号；需要看范围外问题时再切到全量排查。",
    }


def _table_sort_key(table: str) -> tuple[int, str]:
    if table in TABLE_ORDER:
        return (TABLE_ORDER.index(table), table)
    return (len(TABLE_ORDER), table)


def _row_counts(signal_rows: list[dict[str, Any]], inspection: dict[str, Any] | None) -> dict[str, int]:
    counts = {
        str(table): int(count)
        for table, count in ((inspection or {}).get("row_counts") or {}).items()
        if isinstance(count, int)
    }
    if counts:
        return counts
    return dict(Counter(str(row.get("source_table")) for row in signal_rows if row.get("source_table")))


def _suppressed_reasons(promotion_strategies: list[dict[str, Any]] | None) -> list[str]:
    main_push_count = sum(1 for strategy in promotion_strategies or [] if strategy.get("strategy_role") == "main_push")
    if main_push_count == 0:
        return []
    return [f"已读取 {main_push_count} 条主推款策略；匹配策略的广告组消耗集中不直接推送异常。"]


def _attribution_boundaries(row_counts: dict[str, int], category_counts: Counter[str]) -> list[str]:
    boundaries: list[str] = []
    if row_counts.get("ad_search_term_daily_metrics", 0) > 0:
        boundaries.append("搜索词只说明广告活动 / 广告组 / 投放对象上下文，不能自动归因到单个 ASIN。")
    if row_counts.get("ad_placement_daily_metrics", 0) > 0:
        boundaries.append("广告位只说明流量位置上下文，不能自动归因到单个 ASIN。")
    if category_counts.get("data_quality", 0) > 0:
        boundaries.append("数据质量信号只解释数据链路，不参与商品归因。")
    return boundaries
