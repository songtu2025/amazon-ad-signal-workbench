from pathlib import Path
from typing import Any

from app.models.product_scope import ProductScopeCoverage, ProductScopeOption, ProductScopeSummary
from app.services.parent_asin_import import DEFAULT_PARENT_ASIN_SNAPSHOT_ROOT
from app.services.parent_asin_store import load_parent_asin_rows_from_latest_snapshot
from app.services.promotion_strategy_profiles import load_promotion_strategy_profiles
from app.services.snapshot_store import DEFAULT_SNAPSHOT_ROOT, _integer, _latest_snapshot, _load_dict, _load_records, _number, _string


def build_product_scope_summary(
    snapshot_root: Path = DEFAULT_SNAPSHOT_ROOT,
    parent_asin_snapshot_root: Path = DEFAULT_PARENT_ASIN_SNAPSHOT_ROOT,
    promotion_strategies: list[dict[str, Any]] | None = None,
    selected_market_id: int | None = None,
) -> ProductScopeSummary:
    snapshot_dir, manifest = _latest_product_scope_snapshot(snapshot_root, selected_market_id=selected_market_id)
    if snapshot_dir is None or manifest is None:
        boundary = (
            f"market_id={selected_market_id} 暂无成功快照，不能建立该站点商品视角。"
            if selected_market_id is not None
            else "暂无成功快照，不能建立商品视角。"
        )
        return ProductScopeSummary(
            has_snapshot=False,
            options=[_all_option(), _unattributed_option()],
            coverage=ProductScopeCoverage(boundary=boundary),
        )

    sales_rows = _load_records(snapshot_dir / "normalized" / "sales_product_daily_metrics.json")
    ad_rows = _load_records(snapshot_dir / "normalized" / "advertised_products.json")
    search_rows = _load_records(snapshot_dir / "normalized" / "ad_search_term_daily_metrics.json")
    placement_rows = _load_records(snapshot_dir / "normalized" / "ad_placement_daily_metrics.json")
    parent_asin_rows = _filter_rows_by_market(
        load_parent_asin_rows_from_latest_snapshot(parent_asin_snapshot_root),
        selected_market_id=selected_market_id,
    )
    strategy_rows = _filter_rows_by_market(
        promotion_strategies if promotion_strategies is not None else load_promotion_strategy_profiles(),
        selected_market_id=selected_market_id,
    )

    sales_asins = {_string(row.get("asin")) for row in sales_rows if _string(row.get("asin"))}
    ad_asins = {_string(row.get("asin")) for row in ad_rows if _string(row.get("asin"))}
    parent_asins = {_parent_asin(row) for row in [*sales_rows, *ad_rows, *parent_asin_rows] if _parent_asin(row)}
    matched_asins = sales_asins & ad_asins

    options = [_all_option(), _unattributed_option()]
    parent_lookup_rows = [*parent_asin_rows, *sales_rows]
    options.extend(_parent_asin_options(sales_rows, ad_rows, parent_asin_rows, parent_lookup_rows, strategy_rows))
    options.extend(_advertised_asin_options(_rows_with_parent_asin(ad_rows, parent_lookup_rows), strategy_rows))
    options.extend(_sales_asin_options(_rows_with_parent_asin(sales_rows, parent_asin_rows)))

    return ProductScopeSummary(
        has_snapshot=True,
        snapshot_id=_string(manifest.get("snapshot_id")) or snapshot_dir.name,
        market_id=_integer(manifest.get("market_id")),
        shop_name=_string(manifest.get("shop_name")),
        marketplace_code=_string(manifest.get("marketplace_code")),
        options=options,
        coverage=ProductScopeCoverage(
            sales_asin_count=len(sales_asins),
            advertised_asin_count=len(ad_asins),
            parent_asin_count=len(parent_asins),
            matched_asin_count=len(matched_asins),
            search_term_unattributed_count=sum(1 for row in search_rows if not _string(row.get("asin"))),
            placement_unattributed_count=sum(1 for row in placement_rows if not _string(row.get("asin"))),
            boundary=_coverage_boundary(parent_asins=parent_asins, matched_asins=matched_asins),
        ),
    )


def _latest_product_scope_snapshot(
    snapshot_root: Path,
    *,
    selected_market_id: int | None = None,
) -> tuple[Path | None, dict[str, Any] | None]:
    if selected_market_id is None:
        return _latest_snapshot(snapshot_root, require_success=True)

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
        if _integer(manifest.get("market_id")) != selected_market_id:
            continue
        candidates.append((_string(manifest.get("created_at")) or "", snapshot_dir.name, snapshot_dir, manifest))
    if not candidates:
        return None, None
    _, _, snapshot_dir, manifest = sorted(candidates, key=lambda item: (item[0], item[1]), reverse=True)[0]
    return snapshot_dir, manifest


def _filter_rows_by_market(rows: list[dict[str, Any]], *, selected_market_id: int | None) -> list[dict[str, Any]]:
    if selected_market_id is None:
        return rows
    return [row for row in rows if _row_market_id(row) == selected_market_id]


def _row_market_id(row: dict[str, Any]) -> int | None:
    return _integer(row.get("market_id")) or _integer(row.get("marketplace_id"))


def _all_option() -> ProductScopeOption:
    return ProductScopeOption(scope_id="all", scope_type="all", label="全量排查（商品 + 未归因 + 数据质量）", source="system")


def _unattributed_option() -> ProductScopeOption:
    return ProductScopeOption(scope_id="unattributed", scope_type="unattributed", label="未归因广告数据", source="system")


def _parent_asin_options(
    sales_rows: list[dict[str, Any]],
    ad_rows: list[dict[str, Any]],
    parent_asin_rows: list[dict[str, Any]],
    parent_lookup_rows: list[dict[str, Any]],
    promotion_strategies: list[dict[str, Any]],
) -> list[ProductScopeOption]:
    grouped: dict[str, dict[str, Any]] = {}

    for row in parent_asin_rows:
        parent_asin = _parent_asin(row)
        asin = _string(row.get("asin"))
        if not parent_asin or not asin:
            continue
        current = grouped.setdefault(parent_asin, _empty_parent_scope_metrics())
        current["child_asins"].add(asin)
        current["parent_import_child_asins"].add(asin)
        if "orders" in row or "sales" in row or "sales_amount" in row:
            current["parent_import_orders"] += _integer(row.get("orders")) or 0
            current["parent_import_sales"] += _number(row.get("sales")) or _number(row.get("sales_amount")) or 0
            current["has_parent_import_sales_metrics"] = True

    for row in sales_rows:
        parent_asin = _parent_asin(row)
        asin = _string(row.get("asin"))
        if not parent_asin or not asin:
            continue
        current = grouped.setdefault(parent_asin, _empty_parent_scope_metrics())
        current["child_asins"].add(asin)
        current["sales_child_asins"].add(asin)
        current["sales_orders"] += _integer(row.get("orders")) or 0
        current["sales_amount"] += _number(row.get("sales")) or _number(row.get("sales_amount")) or 0
        current["has_sales_metrics"] = True

    for row in _rows_with_parent_asin(ad_rows, parent_lookup_rows):
        parent_asin = _parent_asin(row)
        asin = _string(row.get("asin"))
        if not parent_asin or not asin:
            continue
        current = grouped.setdefault(parent_asin, _empty_parent_scope_metrics())
        current["child_asins"].add(asin)
        current["advertised_child_asins"].add(asin)
        current["ad_spend"] += _number(row.get("spend")) or _number(row.get("cost")) or 0
        current["ad_orders"] += _integer(row.get("orders")) or 0
        current["ad_sales"] += _number(row.get("sales")) or 0

    options: list[ProductScopeOption] = []
    for parent_asin, values in sorted(grouped.items(), key=lambda item: (-item[1]["ad_spend"], -item[1]["sales_orders"], item[0])):
        sales_orders, sales_amount, sales_basis = _parent_scope_sales_metrics(values)
        ad_spend = round(values["ad_spend"], 2)
        ad_orders = values["ad_orders"]
        ad_sales = round(values["ad_sales"], 2)
        options.append(
            ProductScopeOption(
                scope_id=f"parent_asin:{parent_asin}",
                scope_type="parent_asin",
                label=f"Parent ASIN {parent_asin}",
                parent_asin=parent_asin,
                child_asins=sorted(values["child_asins"]),
                source="parent_asin_product_map+sales_products+advertised_products",
                spend=ad_spend,
                orders=sales_orders if sales_basis else ad_orders,
                sales=round(sales_amount, 2) if sales_basis else ad_sales,
                sales_orders=sales_orders,
                sales_amount=round(sales_amount, 2),
                ad_spend=ad_spend,
                ad_orders=ad_orders,
                ad_sales=ad_sales,
                metric_boundary=_parent_scope_metric_boundary(sales_basis),
                strategy_notes=_strategy_notes_for_asins(values["child_asins"], promotion_strategies),
            )
        )
    return options


def _empty_parent_scope_metrics() -> dict[str, Any]:
    return {
        "child_asins": set(),
        "sales_child_asins": set(),
        "advertised_child_asins": set(),
        "parent_import_child_asins": set(),
        "sales_orders": 0,
        "sales_amount": 0.0,
        "parent_import_orders": 0,
        "parent_import_sales": 0.0,
        "ad_spend": 0.0,
        "ad_orders": 0,
        "ad_sales": 0.0,
        "has_sales_metrics": False,
        "has_parent_import_sales_metrics": False,
    }


def _parent_scope_sales_metrics(values: dict[str, Any]) -> tuple[int, float, str]:
    if values["has_sales_metrics"]:
        return values["sales_orders"], values["sales_amount"], "sales_product_daily_metrics"
    if values["has_parent_import_sales_metrics"]:
        return values["parent_import_orders"], values["parent_import_sales"], "parent_asin_product_map"
    return 0, 0.0, ""


def _parent_scope_metric_boundary(sales_basis: str) -> str:
    if sales_basis:
        return f"经营订单/销售额来自 {sales_basis}；广告花费/广告订单/广告销售来自 advertised_products。"
    return "当前 Parent ASIN 缺少销售表现口径；广告花费/广告订单/广告销售来自 advertised_products，不能替代整体经营盘子。"


def _advertised_asin_options(rows: list[dict[str, Any]], promotion_strategies: list[dict[str, Any]]) -> list[ProductScopeOption]:
    grouped: dict[str, dict[str, Any]] = {}
    for row in rows:
        asin = _string(row.get("asin"))
        if not asin:
            continue
        current = grouped.setdefault(
            asin,
            {
                "label": _string(row.get("product_name")) or _string(row.get("ad_product_name")) or asin,
                "parent_asin": _parent_asin(row),
                "spend": 0.0,
                "orders": 0,
                "sales": 0.0,
            },
        )
        current["spend"] += _number(row.get("spend")) or _number(row.get("cost")) or 0
        current["orders"] += _integer(row.get("orders")) or 0
        current["sales"] += _number(row.get("sales")) or 0

    return [
        ProductScopeOption(
            scope_id=f"ad_asin:{asin}",
            scope_type="advertised_asin",
            label=f"广告 ASIN {asin}",
            asin=asin,
            parent_asin=values["parent_asin"],
            source="advertised_products",
            spend=round(values["spend"], 2),
            orders=values["orders"],
            sales=round(values["sales"], 2),
            ad_spend=round(values["spend"], 2),
            ad_orders=values["orders"],
            ad_sales=round(values["sales"], 2),
            metric_boundary="广告 ASIN 指标来自 advertised_products；销售表现需要另看 sales_product_daily_metrics。",
            strategy_notes=_strategy_notes_for_asins({asin}, promotion_strategies),
        )
        for asin, values in sorted(grouped.items(), key=lambda item: (-item[1]["spend"], item[0]))
    ]


def _sales_asin_options(rows: list[dict[str, Any]]) -> list[ProductScopeOption]:
    grouped: dict[str, dict[str, Any]] = {}
    for row in rows:
        asin = _string(row.get("asin"))
        if not asin:
            continue
        current = grouped.setdefault(
            asin,
            {
                "label": _string(row.get("product_name")) or asin,
                "parent_asin": _parent_asin(row),
                "orders": 0,
                "sales": 0.0,
            },
        )
        current["orders"] += _integer(row.get("orders")) or 0
        current["sales"] += _number(row.get("sales")) or _number(row.get("sales_amount")) or 0

    return [
        ProductScopeOption(
            scope_id=f"sales_asin:{asin}",
            scope_type="sales_asin",
            label=f"销售 ASIN {asin}",
            asin=asin,
            parent_asin=values["parent_asin"],
            source="sales_product_daily_metrics",
            orders=values["orders"],
            sales=round(values["sales"], 2),
            sales_orders=values["orders"],
            sales_amount=round(values["sales"], 2),
            metric_boundary="销售 ASIN 指标来自 sales_product_daily_metrics；广告表现需要另看 advertised_products。",
        )
        for asin, values in sorted(grouped.items(), key=lambda item: (-item[1]["orders"], item[0]))
    ]


def _parent_asin(row: dict[str, Any]) -> str | None:
    return (
        _string(row.get("parent_asin"))
        or _string(row.get("parentAsin"))
        or _string(row.get("variation_asin"))
        or _string(row.get("variationAsin"))
    )


def _rows_with_parent_asin(rows: list[dict[str, Any]], parent_asin_rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    parent_by_asin = {
        asin: parent_asin
        for row in parent_asin_rows
        if (asin := _string(row.get("asin"))) and (parent_asin := _parent_asin(row))
    }
    if not parent_by_asin:
        return rows
    enriched_rows: list[dict[str, Any]] = []
    for row in rows:
        asin = _string(row.get("asin"))
        parent_asin = _parent_asin(row) or (parent_by_asin.get(asin) if asin else None)
        if parent_asin and _parent_asin(row) is None:
            enriched_rows.append({**row, "parent_asin": parent_asin})
        else:
            enriched_rows.append(row)
    return enriched_rows


def _strategy_notes_for_asins(asins: set[str], promotion_strategies: list[dict[str, Any]]) -> list[str]:
    notes: list[str] = []
    normalized_asins = {asin for asin in asins if asin}
    for strategy in promotion_strategies:
        asin = _string(strategy.get("asin"))
        if not asin or asin not in normalized_asins:
            continue
        if _string(strategy.get("strategy_role")) != "main_push":
            continue
        strategy_label = _string(strategy.get("strategy_label")) or "主推款"
        ad_group_id = _string(strategy.get("ad_group_id")) or "未知广告组"
        start_date = _string(strategy.get("start_date"))
        end_date = _string(strategy.get("end_date"))
        period = f"{start_date} 至 {end_date}" if start_date and end_date else "生效周期未完整标记"
        notes.append(f"{asin} 已标记为{strategy_label}，广告组 {ad_group_id} 在 {period} 的消耗集中不作为异常推送。")
    return notes


def _coverage_boundary(*, parent_asins: set[str], matched_asins: set[str]) -> str:
    parts = ["搜索词和广告位不能强行归属到 ASIN，只能放在未归因广告数据下分析。"]
    if not parent_asins:
        parts.append("当前快照未提供 parent_asin，暂时只能按 ASIN 建立商品视角。")
    if not matched_asins:
        parts.append("当前销售 ASIN 与广告 ASIN 未命中，不能做销售商品到广告商品的高置信承接判断。")
    return "".join(parts)
