from __future__ import annotations

import argparse
import json
import sys
from collections import Counter
from datetime import date
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[1]
BACKEND_ROOT = PROJECT_ROOT / "backend"
SCRIPTS_ROOT = PROJECT_ROOT / "scripts"
sys.path.insert(0, str(BACKEND_ROOT))
sys.path.insert(0, str(SCRIPTS_ROOT))

from inspect_review_readiness import build_review_readiness_payload  # noqa: E402
from app.services.product_scope import build_product_scope_summary  # noqa: E402
from app.services.signal_triage import _filter_signals_by_product_scope, _normalized_product_scope_id  # noqa: E402
from run_signal_scan import build_signal_scan_payload  # noqa: E402


PROBLEM_TYPE_BY_CATEGORY = {
    "data_quality": "数据质量缺口",
    "advertised_product_efficiency": "销售承接不足",
    "advertised_product_opportunity": "机会扩量",
    "search_term_opportunity": "机会扩量",
    "aba_market_opportunity": "市场竞争压力",
    "placement_efficiency": "投放结构失衡",
    "search_term_performance_split": "投放结构失衡",
    "ad_efficiency": "花费浪费",
    "ad_efficiency_anomaly": "花费浪费",
    "product_sales_fit": "销售承接不足",
    "product_ad_coverage": "销售承接不足",
    "review_effect": "处理后复盘",
}

PRODUCT_OBJECT_TYPES = {"parent_asin", "asin", "sales_product", "advertised_product"}
PRIMARY_PRODUCT_OBJECT_TYPES = {"parent_asin", "asin", "sales_product"}


def build_analysis_depth_payload(
    *,
    selected_market_id: int | None = None,
    product_scope_id: str | None = None,
) -> dict[str, Any]:
    scan_payload = build_signal_scan_payload(selected_market_id=selected_market_id)
    review_payload = build_review_readiness_payload(selected_market_id=selected_market_id)
    signals = _dict_list(scan_payload.get("signals"))
    inspection = _dict(scan_payload.get("inspection"))
    product_scope = build_product_scope_summary() if product_scope_id else None
    normalized_scope_id = _normalized_product_scope_id(product_scope_id)
    product_scope_coverage = _product_scope_coverage(product_scope_id, product_scope=product_scope) if product_scope_id else None
    analysis_signals = (
        _filter_signals_by_product_scope(signals, normalized_scope_id, product_scope)
        if normalized_scope_id and product_scope is not None
        else signals
    )

    framework_layers = [
        _object_layer(analysis_signals, product_scope_coverage=product_scope_coverage),
        _problem_layer(analysis_signals),
        _evidence_layer(analysis_signals),
        _judgment_layer(analysis_signals, _list(scan_payload.get("summary", {}).get("attribution_boundaries"))),
        _recommendation_layer(analysis_signals),
        _review_layer(review_payload),
    ]
    coverage_gaps = _coverage_gaps(scan_payload, inspection)
    if product_scope_coverage:
        coverage_gaps = [*coverage_gaps, *product_scope_coverage["gaps"]]
    layer_gap_count = sum(len(layer["gaps"]) for layer in framework_layers)
    has_layer_gaps = layer_gap_count > 0
    depth_score = max(0, 100 - len(coverage_gaps) * 8 - layer_gap_count * 10)

    payload = {
        "status": "ready" if depth_score >= 80 and not coverage_gaps and not has_layer_gaps else "needs_depth",
        "selected_market_id": selected_market_id,
        "depth_score": depth_score,
        "snapshot": {
            "snapshot_id": inspection.get("snapshot_id"),
            "market_id": inspection.get("market_id"),
            "shop_name": inspection.get("shop_name"),
            "marketplace_code": inspection.get("marketplace_code"),
            "start_date": inspection.get("start_date"),
            "end_date": inspection.get("end_date"),
            "signal_row_count": scan_payload.get("signal_row_count", 0),
            "signal_count": scan_payload.get("signal_count", 0),
            "aba_row_count": scan_payload.get("aba_row_count", 0),
            "row_counts": inspection.get("row_counts", {}),
        },
        "framework_layers": framework_layers,
        "coverage_gaps": coverage_gaps,
        "next_action": _next_action(depth_score, coverage_gaps, framework_layers, review_payload),
    }
    if product_scope_coverage:
        payload["product_scope"] = product_scope_coverage
    return payload


def _object_layer(signals: list[dict[str, Any]], product_scope_coverage: dict[str, Any] | None = None) -> dict[str, Any]:
    object_counts = Counter(str(signal.get("object_type") or "unknown") for signal in signals)
    product_signal_count = sum(object_counts.get(item, 0) for item in PRODUCT_OBJECT_TYPES)
    primary_product_count = sum(object_counts.get(item, 0) for item in PRIMARY_PRODUCT_OBJECT_TYPES)
    selected_scope_product_count = _selected_scope_product_count(product_scope_coverage)
    if selected_scope_product_count > 0:
        primary_product_count = max(primary_product_count, 1)
        product_signal_count = max(product_signal_count, selected_scope_product_count)
    gaps: list[str] = []
    if primary_product_count == 0:
        gaps.append("经营商品入口覆盖不足：当前未发现 parent_asin / asin 主对象，仍主要依赖广告商品或广告上下文。")
    if product_signal_count == 0:
        gaps.append("商品对象覆盖不足：当前信号无法落到销售商品或广告商品。")
    result = {
        "layer": "object_layer",
        "name": "对象层",
        "status": "ok" if not gaps else "gap",
        "object_type_counts": dict(object_counts),
        "product_signal_count": product_signal_count,
        "gaps": gaps,
    }
    if product_scope_coverage:
        result.update(
            {
                "selected_product_scope_id": product_scope_coverage.get("scope_id"),
                "selected_scope_type": product_scope_coverage.get("scope_type"),
                "selected_scope_status": product_scope_coverage.get("scope_status"),
                "selected_scope_product_count": selected_scope_product_count,
            }
        )
    return result


def _selected_scope_product_count(product_scope_coverage: dict[str, Any] | None) -> int:
    if not product_scope_coverage or product_scope_coverage.get("scope_status") != "ok":
        return 0
    scope_type = str(product_scope_coverage.get("scope_type") or "")
    if scope_type not in {"parent_asin", "sales_asin", "advertised_asin"}:
        return 0
    sales_count = int(product_scope_coverage.get("sales_child_asin_count") or 0)
    advertised_count = int(product_scope_coverage.get("advertised_child_asin_count") or 0)
    child_count = int(product_scope_coverage.get("child_asin_count") or 0)
    if scope_type == "parent_asin":
        return max(sales_count, advertised_count, child_count)
    return 1 if sales_count > 0 or advertised_count > 0 or child_count > 0 else 0


def _problem_layer(signals: list[dict[str, Any]]) -> dict[str, Any]:
    problem_counts = Counter(_problem_type(signal) for signal in signals)
    gaps: list[str] = []
    if len(problem_counts) < 3 and signals:
        gaps.append("经营问题覆盖不足：当前只覆盖少量问题类型，难以形成完整广告经营诊断。")
    if not signals:
        gaps.append("暂无 AI 信号，无法判断经营问题覆盖。")
    return {
        "layer": "problem_layer",
        "name": "问题层",
        "status": "ok" if not gaps else "gap",
        "problem_type_counts": dict(problem_counts),
        "gaps": gaps,
    }


def _evidence_layer(signals: list[dict[str, Any]]) -> dict[str, Any]:
    source_counts: Counter[str] = Counter()
    evidence_counts: list[int] = []
    stale_count = 0
    for signal in signals:
        evidence_counts.append(int(signal.get("evidence_count") or 0))
        if signal.get("freshness_status") == "stale":
            stale_count += 1
        for source in _dict_list(signal.get("data_sources")):
            source_counts[str(source.get("source_type") or source.get("source_name") or "unknown")] += 1

    gaps: list[str] = []
    if len(source_counts) < 2 and signals:
        gaps.append("证据源单一：当前多数信号只依赖一个来源，难以支撑高置信深度分析。")
    if stale_count:
        gaps.append(f"ABA 数据过期或存在旧数据证据：{stale_count} 条信号需要降置信复核。")
    return {
        "layer": "evidence_layer",
        "name": "证据层",
        "status": "ok" if not gaps else "gap",
        "source_counts": dict(source_counts),
        "average_evidence_count": round(sum(evidence_counts) / len(evidence_counts), 2) if evidence_counts else 0,
        "stale_signal_count": stale_count,
        "gaps": gaps,
    }


def _judgment_layer(signals: list[dict[str, Any]], attribution_boundaries: list[Any]) -> dict[str, Any]:
    confidence_counts = Counter(str(signal.get("confidence") or "unknown") for signal in signals)
    uncertainty_count = sum(1 for signal in signals if str(signal.get("uncertainty") or "").strip())
    gaps: list[str] = []
    if signals and uncertainty_count < len(signals):
        gaps.append("判断边界覆盖不足：部分信号缺少明确反证或不确定性说明。")
    if not attribution_boundaries:
        gaps.append("归因边界缺失：未明确搜索词、广告位或广告组是否能归因到 ASIN。")
    return {
        "layer": "judgment_layer",
        "name": "判断层",
        "status": "ok" if not gaps else "gap",
        "confidence_counts": dict(confidence_counts),
        "uncertainty_count": uncertainty_count,
        "attribution_boundary_count": len(attribution_boundaries),
        "gaps": gaps,
    }


def _recommendation_layer(signals: list[dict[str, Any]]) -> dict[str, Any]:
    manual_required_count = 0
    action_counts: Counter[str] = Counter()
    for signal in signals:
        action = _dict(signal.get("suggested_action"))
        if action.get("requires_manual_confirmation") is True:
            manual_required_count += 1
        action_type = str(action.get("action_type") or "unknown")
        action_counts[action_type] += 1

    gaps: list[str] = []
    if signals and manual_required_count < len(signals):
        gaps.append("建议层边界不足：部分信号没有明确要求人工确认。")
    return {
        "layer": "recommendation_layer",
        "name": "建议层",
        "status": "ok" if not gaps else "gap",
        "manual_required_count": manual_required_count,
        "action_type_counts": dict(action_counts),
        "gaps": gaps,
    }


def _review_layer(review_payload: dict[str, Any]) -> dict[str, Any]:
    ready_count = int(review_payload.get("ready_count") or 0)
    gaps: list[str] = []
    if ready_count == 0:
        gaps.append("暂无 ready 复盘结果：当前不能证明建议有效、无效或恶化。")
    if int(review_payload.get("manual_action_identity_issue_count") or 0):
        gaps.append("存在人工动作对象 ID 风险：需先迁移到稳定业务对象 ID。")
    return {
        "layer": "review_layer",
        "name": "复盘层",
        "status": "ok" if not gaps else "gap",
        "manual_action_count": review_payload.get("manual_action_count", 0),
        "review_record_count": review_payload.get("review_record_count", 0),
        "ready_count": ready_count,
        "not_ready_count": review_payload.get("not_ready_count", 0),
        "manual_action_identity_issue_count": review_payload.get("manual_action_identity_issue_count", 0),
        "gaps": gaps,
    }


def _coverage_gaps(scan_payload: dict[str, Any], inspection: dict[str, Any]) -> list[str]:
    row_counts = _dict(inspection.get("row_counts"))
    gaps: list[str] = []
    if int(scan_payload.get("signal_row_count") or 0) < 100:
        gaps.append("真实 API 可分析行数偏少：当前不足以支撑稳定分层诊断。")
    if int(row_counts.get("advertised_products") or 0) < 5:
        gaps.append("广告商品覆盖偏少：当前广告商品样本不足以支撑商品组深度对比。")
    if _window_days(inspection.get("start_date"), inspection.get("end_date")) < 14:
        gaps.append("时间窗口不足：当前不足 14 天，难以支撑趋势和复盘前置判断。")
    return gaps


def _product_scope_coverage(product_scope_id: str, product_scope: Any | None = None) -> dict[str, Any]:
    product_scope = product_scope or build_product_scope_summary()
    options = _object_list(_get(product_scope, "options"))
    selected = next((option for option in options if _string_value(_get(option, "scope_id")) == product_scope_id), None)
    if selected is None:
        return {
            "scope_id": product_scope_id,
            "scope_status": "gap",
            "gaps": [f"未找到商品范围：{product_scope_id}。"],
            "analysis_boundary": "未找到商品范围前，不能判断该范围的数据覆盖深度。",
        }

    child_asins = sorted({_string_value(asin) for asin in _list(_get(selected, "child_asins")) if _string_value(asin)})
    parent_asin = _string_value(_get(selected, "parent_asin"))
    scope_type = _string_value(_get(selected, "scope_type"))
    sales_asins: set[str] = set()
    advertised_asins: set[str] = set()

    for option in options:
        option_scope_type = _string_value(_get(option, "scope_type"))
        asin = _string_value(_get(option, "asin"))
        option_parent_asin = _string_value(_get(option, "parent_asin"))
        if not asin:
            continue
        if parent_asin and option_parent_asin != parent_asin and asin not in child_asins:
            continue
        if child_asins and asin not in child_asins:
            continue
        if option_scope_type == "sales_asin":
            sales_asins.add(asin)
        if option_scope_type == "advertised_asin":
            advertised_asins.add(asin)

    if not child_asins and scope_type in {"sales_asin", "advertised_asin"}:
        asin = _string_value(_get(selected, "asin"))
        child_asins = [asin] if asin else []
        if scope_type == "sales_asin" and asin:
            sales_asins.add(asin)
        if scope_type == "advertised_asin" and asin:
            advertised_asins.add(asin)

    matched_asins = sales_asins & advertised_asins
    gaps: list[str] = []
    if scope_type == "parent_asin" and not child_asins:
        gaps.append(f"{product_scope_id} 没有可核对的子 ASIN。")
    if not sales_asins:
        gaps.append(f"{product_scope_id} 缺少销售表现 ASIN，不能判断经营商品入口。")
    if not advertised_asins:
        gaps.append(f"{product_scope_id} 缺少广告商品 ASIN，不能生成广告对象级信号。")
    if sales_asins and advertised_asins and not matched_asins:
        gaps.append(f"{product_scope_id} 销售 ASIN 与广告 ASIN 未命中，不能做销售承接判断。")

    unadvertised_child_asins = sorted(set(child_asins) - advertised_asins)
    return {
        "scope_id": product_scope_id,
        "scope_type": scope_type,
        "scope_status": "ok" if not gaps else "gap",
        "parent_asin": parent_asin or None,
        "child_asin_count": len(child_asins),
        "sales_child_asin_count": len(sales_asins),
        "advertised_child_asin_count": len(advertised_asins),
        "matched_child_asin_count": len(matched_asins),
        "sales_only_child_asins": sorted(sales_asins - advertised_asins),
        "advertised_only_child_asins": sorted(advertised_asins - sales_asins),
        "unadvertised_child_asins": unadvertised_child_asins,
        "analysis_boundary": (
            "经营商品入口基于销售表现识别子 ASIN；没有广告商品行的子 ASIN 不进入广告 AI 信号，"
            "只作为销售承接或广告覆盖缺口背景；搜索词和 ABA 不能自动归因到单个 ASIN。"
        ),
        "gaps": gaps,
    }


def _next_action(
    depth_score: int,
    coverage_gaps: list[str],
    layers: list[dict[str, Any]],
    review_payload: dict[str, Any] | None = None,
) -> str:
    object_layer = next((layer for layer in layers if layer["layer"] == "object_layer"), {})
    problem_layer = next((layer for layer in layers if layer["layer"] == "problem_layer"), {})
    if object_layer.get("selected_product_scope_id") and any("暂无 AI 信号" in gap for gap in problem_layer.get("gaps", [])):
        return (
            "当前商品范围暂无可处理 AI 信号；先按 Parent 经营盘子 -> 广告 ASIN -> 广告组 -> "
            "投放词 / 搜索词 / 广告位做只读下钻，确认是整体表现健康、规则阈值过严，还是局部问题未入队。"
        )
    review_layer = next((layer for layer in layers if layer["layer"] == "review_layer"), {})
    if review_layer.get("ready_count", 0) == 0:
        wait_action = _review_wait_next_action(review_payload or {}, coverage_gaps)
        if wait_action:
            return wait_action
        return "优先补数据覆盖和复盘窗口：扩展 14/30 天快照、增加广告商品 / 搜索词覆盖，并等待 ready 复盘结果。"
    if depth_score >= 80 and not coverage_gaps:
        return "当前框架覆盖较完整；下一步可以选择一个 P0 信号做规则深化。"
    return "优先补数据覆盖和证据多样性，再推进更复杂的规则。"


def _review_wait_next_action(review_payload: dict[str, Any], coverage_gaps: list[str]) -> str | None:
    if coverage_gaps:
        return None
    wait_summary = _dict(review_payload.get("review_wait_summary"))
    if wait_summary.get("status") != "waiting_review_window":
        return None

    earliest_date = _string_value(wait_summary.get("earliest_due_date"))
    object_label = _string_value(wait_summary.get("next_object_label") or wait_summary.get("next_object_id"))
    windows = " / ".join(_string_value(item) for item in _list(wait_summary.get("review_windows")) if _string_value(item))
    next_step = _string_value(wait_summary.get("next_step")) or "等待复盘窗口完整后再复核处理后指标。"
    forbidden_actions = [_string_value(item) for item in _list(wait_summary.get("forbidden_actions")) if _string_value(item)]

    summary_parts = [
        windows and f"窗口：{windows}",
        earliest_date and f"最早 {earliest_date}",
        object_label and f"下一对象 {object_label}",
    ]
    summary = "，".join(part for part in summary_parts if part)
    boundary = f"边界：{'、'.join(forbidden_actions)}。" if forbidden_actions else "边界：不保存复盘结论，不自动改规则，不自动执行广告动作。"
    return f"当前数据覆盖已满足基础深度，瓶颈是复盘窗口未到期；{summary}。{next_step}{boundary}"


def _problem_type(signal: dict[str, Any]) -> str:
    category = str(signal.get("signal_category") or "")
    if category in PROBLEM_TYPE_BY_CATEGORY:
        return PROBLEM_TYPE_BY_CATEGORY[category]
    signal_type = str(signal.get("signal_type") or "")
    return PROBLEM_TYPE_BY_CATEGORY.get(signal_type, "未分类问题")


def _window_days(start_date: Any, end_date: Any) -> int:
    try:
        start = date.fromisoformat(str(start_date))
        end = date.fromisoformat(str(end_date))
    except (TypeError, ValueError):
        return 0
    return (end - start).days + 1


def _dict(value: Any) -> dict[str, Any]:
    return value if isinstance(value, dict) else {}


def _get(value: Any, key: str) -> Any:
    if isinstance(value, dict):
        return value.get(key)
    return getattr(value, key, None)


def _string_value(value: Any) -> str:
    return str(value or "").strip()


def _list(value: Any) -> list[Any]:
    return value if isinstance(value, list) else []


def _dict_list(value: Any) -> list[dict[str, Any]]:
    return [item for item in _list(value) if isinstance(item, dict)]


def _object_list(value: Any) -> list[Any]:
    return _list(value)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="只读检查当前数据是否足够支撑深度 Amazon 广告分析框架")
    parser.add_argument("--market-id", type=int, default=None)
    parser.add_argument("--product-scope-id", default=None)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    payload_kwargs: dict[str, Any] = {"selected_market_id": args.market_id}
    if args.product_scope_id:
        payload_kwargs["product_scope_id"] = args.product_scope_id
    print(
        json.dumps(
            build_analysis_depth_payload(**payload_kwargs),
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
