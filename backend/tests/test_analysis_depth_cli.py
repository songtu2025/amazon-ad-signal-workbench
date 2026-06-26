import importlib.util
import json
import sys
from pathlib import Path


def load_analysis_depth_script():
    project_root = Path(__file__).resolve().parents[2]
    script_path = project_root / "scripts" / "inspect_analysis_depth.py"
    spec = importlib.util.spec_from_file_location("inspect_analysis_depth_script", script_path)
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules["inspect_analysis_depth_script"] = module
    spec.loader.exec_module(module)
    return module


def test_analysis_depth_reports_framework_gaps(monkeypatch) -> None:
    module = load_analysis_depth_script()
    scan_payload = {
        "ready_for_signals": True,
        "signal_row_count": 42,
        "aba_row_count": 1000,
        "signal_count": 3,
        "inspection": {
            "snapshot_id": "snapshot-1",
            "market_id": 1,
            "shop_name": "rivbos",
            "marketplace_code": "US",
            "start_date": "2026-06-08",
            "end_date": "2026-06-14",
            "row_counts": {
                "advertised_products": 2,
                "ad_search_term_daily_metrics": 20,
                "ad_placement_daily_metrics": 10,
                "sales_product_daily_metrics": 10,
            },
            "api_list": ["sales_performance", "sp_advertised_products"],
        },
        "summary": {
            "attribution_boundaries": [
                "搜索词只说明广告活动 / 广告组 / 投放对象上下文，不能自动归因到单个 ASIN。"
            ]
        },
        "signals": [
            {
                "id": "sig-aba-stale",
                "signal_category": "data_quality",
                "object_type": "cross",
                "confidence": "high",
                "freshness_status": "stale",
                "evidence_count": 5,
                "data_sources": [{"source_type": "ABA导出"}],
                "suggested_action": {"requires_manual_confirmation": True},
                "uncertainty": "ABA 过期，只能作为低置信市场背景。",
            },
            {
                "id": "sig-ad-product",
                "signal_category": "advertised_product_efficiency",
                "object_type": "advertised_product",
                "confidence": "medium",
                "freshness_status": "api_snapshot",
                "evidence_count": 4,
                "data_sources": [{"source_type": "积加API"}],
                "suggested_action": {"requires_manual_confirmation": True},
                "uncertainty": "",
            },
            {
                "id": "sig-placement",
                "signal_category": "placement_efficiency",
                "object_type": "placement",
                "confidence": "medium",
                "freshness_status": "api_snapshot",
                "evidence_count": 3,
                "data_sources": [{"source_type": "积加API"}],
                "suggested_action": {"requires_manual_confirmation": True},
                "uncertainty": "",
            },
            {
                "id": "sig-product-ad-coverage",
                "signal_category": "product_ad_coverage",
                "object_type": "sales_product",
                "confidence": "medium",
                "freshness_status": "api_snapshot",
                "evidence_count": 4,
                "data_sources": [{"source_type": "积加API"}],
                "suggested_action": {"requires_manual_confirmation": True},
                "uncertainty": "销售商品广告覆盖不足，只能提示人工复核承接。",
            },
        ],
    }
    review_payload = {
        "manual_action_count": 3,
        "review_record_count": 0,
        "ready_count": 0,
        "not_ready_count": 4,
        "manual_action_identity_issue_count": 0,
    }

    monkeypatch.setattr(module, "build_signal_scan_payload", lambda selected_market_id=None: scan_payload)
    monkeypatch.setattr(module, "build_review_readiness_payload", lambda selected_market_id=None: review_payload)

    payload = module.build_analysis_depth_payload(selected_market_id=1)

    assert payload["status"] == "needs_depth"
    assert payload["selected_market_id"] == 1
    assert payload["depth_score"] < 70
    assert payload["snapshot"]["signal_row_count"] == 42
    assert payload["framework_layers"][0]["layer"] == "object_layer"
    assert payload["framework_layers"][0]["product_signal_count"] == 2
    assert payload["framework_layers"][0]["gaps"] == []
    assert payload["framework_layers"][1]["problem_type_counts"]["销售承接不足"] == 2
    assert "未分类问题" not in payload["framework_layers"][1]["problem_type_counts"]
    assert any("ABA 数据过期" in gap for gap in payload["framework_layers"][2]["gaps"])
    assert any("暂无处理前后指标可复核待办" in gap for gap in payload["framework_layers"][5]["gaps"])
    assert "优先补数据覆盖和复盘窗口" in payload["next_action"]


def test_analysis_depth_cli_main_accepts_market_id(monkeypatch, capsys) -> None:
    module = load_analysis_depth_script()
    captured: dict[str, object] = {}

    def fake_payload(*, selected_market_id=None):
        captured["selected_market_id"] = selected_market_id
        return {"status": "needs_depth", "depth_score": 40}

    monkeypatch.setattr(module, "build_analysis_depth_payload", fake_payload)
    monkeypatch.setattr(sys, "argv", ["inspect_analysis_depth.py", "--market-id", "2"])

    module.main()

    assert captured["selected_market_id"] == 2
    assert json.loads(capsys.readouterr().out)["status"] == "needs_depth"


def test_analysis_depth_reports_parent_scope_coverage(monkeypatch) -> None:
    module = load_analysis_depth_script()
    scan_payload = {
        "ready_for_signals": True,
        "signal_row_count": 300,
        "aba_row_count": 1000,
        "signal_count": 2,
        "inspection": {
            "snapshot_id": "snapshot-1",
            "market_id": 1,
            "shop_name": "rivbos",
            "marketplace_code": "US",
            "start_date": "2026-05-18",
            "end_date": "2026-06-16",
            "row_counts": {
                "advertised_products": 20,
                "ad_search_term_daily_metrics": 200,
                "sales_product_daily_metrics": 30,
            },
        },
        "summary": {"attribution_boundaries": ["搜索词只说明同广告组上下文，不能自动归因到 ASIN。"]},
        "signals": [
            {
                "signal_category": "advertised_product_opportunity",
                "object_type": "advertised_product",
                "confidence": "medium",
                "freshness_status": "api_snapshot",
                "evidence_count": 4,
                "data_sources": [{"source_type": "积加API"}],
                "suggested_action": {"requires_manual_confirmation": True, "action_type": "review_advertised_product_opportunity"},
                "uncertainty": "搜索词不能自动归因到该 ASIN。",
            }
        ],
    }
    review_payload = {
        "manual_action_count": 1,
        "review_record_count": 0,
        "ready_count": 0,
        "not_ready_count": 2,
        "manual_action_identity_issue_count": 0,
    }
    product_scope_summary = {
        "options": [
            {
                "scope_id": "parent_asin:B00K4W4AAA",
                "scope_type": "parent_asin",
                "parent_asin": "B00K4W4AAA",
                "child_asins": ["B016EXMVZS", "B016EXMW02", "B07BS9754Q"],
            },
            {"scope_id": "sales_asin:B016EXMVZS", "scope_type": "sales_asin", "asin": "B016EXMVZS", "parent_asin": "B00K4W4AAA"},
            {"scope_id": "sales_asin:B016EXMW02", "scope_type": "sales_asin", "asin": "B016EXMW02", "parent_asin": "B00K4W4AAA"},
            {"scope_id": "sales_asin:B07BS9754Q", "scope_type": "sales_asin", "asin": "B07BS9754Q", "parent_asin": "B00K4W4AAA"},
            {"scope_id": "ad_asin:B016EXMW02", "scope_type": "advertised_asin", "asin": "B016EXMW02", "parent_asin": "B00K4W4AAA"},
            {"scope_id": "ad_asin:B07BS9754Q", "scope_type": "advertised_asin", "asin": "B07BS9754Q", "parent_asin": "B00K4W4AAA"},
        ]
    }

    monkeypatch.setattr(module, "build_signal_scan_payload", lambda selected_market_id=None: scan_payload)
    monkeypatch.setattr(module, "build_review_readiness_payload", lambda selected_market_id=None: review_payload)
    monkeypatch.setattr(module, "build_product_scope_summary", lambda: product_scope_summary)

    payload = module.build_analysis_depth_payload(selected_market_id=1, product_scope_id="parent_asin:B00K4W4AAA")

    assert payload["product_scope"]["scope_id"] == "parent_asin:B00K4W4AAA"
    assert payload["product_scope"]["child_asin_count"] == 3
    assert payload["product_scope"]["sales_child_asin_count"] == 3
    assert payload["product_scope"]["advertised_child_asin_count"] == 2
    assert payload["product_scope"]["matched_child_asin_count"] == 2
    assert payload["product_scope"]["sales_only_child_asins"] == ["B016EXMVZS"]
    assert "没有广告商品行的子 ASIN 不进入广告 AI 信号" in payload["product_scope"]["analysis_boundary"]
    object_layer = payload["framework_layers"][0]
    assert object_layer["layer"] == "object_layer"
    assert not any("经营商品入口覆盖不足" in gap for gap in object_layer["gaps"])
    assert object_layer["selected_product_scope_id"] == "parent_asin:B00K4W4AAA"
    problem_layer = payload["framework_layers"][1]
    assert problem_layer["problem_type_counts"] == {}
    assert any("暂无 AI 信号" in gap for gap in problem_layer["gaps"])
    recommendation_layer = payload["framework_layers"][4]
    assert recommendation_layer["manual_required_count"] == 0
    assert "当前商品范围暂无可处理 AI 信号" in payload["next_action"]
    assert "复盘窗口" not in payload["next_action"]


def test_analysis_depth_next_action_prioritizes_review_gap(monkeypatch) -> None:
    module = load_analysis_depth_script()
    scan_payload = {
        "ready_for_signals": True,
        "signal_row_count": 300,
        "aba_row_count": 1000,
        "signal_count": 3,
        "inspection": {
            "snapshot_id": "snapshot-1",
            "market_id": 1,
            "shop_name": "rivbos",
            "marketplace_code": "US",
            "start_date": "2026-05-18",
            "end_date": "2026-06-16",
            "row_counts": {
                "advertised_products": 20,
                "ad_search_term_daily_metrics": 200,
                "sales_product_daily_metrics": 30,
            },
        },
        "summary": {"attribution_boundaries": ["搜索词只说明同广告组上下文，不能自动归因到 ASIN。"]},
        "signals": [
            {
                "signal_category": "product_ad_coverage",
                "object_type": "sales_product",
                "confidence": "medium",
                "freshness_status": "api_snapshot",
                "evidence_count": 4,
                "data_sources": [{"source_type": "积加API"}],
                "suggested_action": {"requires_manual_confirmation": True, "action_type": "review_sales_product_ad_coverage"},
                "uncertainty": "搜索词不能自动归因到该 ASIN。",
            },
            {
                "signal_category": "search_term_opportunity",
                "object_type": "search_term",
                "confidence": "medium",
                "freshness_status": "api_snapshot",
                "evidence_count": 4,
                "data_sources": [{"source_type": "积加API"}, {"source_type": "ABA导出"}],
                "suggested_action": {"requires_manual_confirmation": True, "action_type": "review_long_tail_search_term"},
                "uncertainty": "ABA 只作为市场背景。",
            },
            {
                "signal_category": "placement_efficiency",
                "object_type": "placement",
                "confidence": "medium",
                "freshness_status": "api_snapshot",
                "evidence_count": 4,
                "data_sources": [{"source_type": "积加API"}],
                "suggested_action": {"requires_manual_confirmation": True, "action_type": "review_placement_allocation"},
                "uncertainty": "广告位不是商品。",
            },
        ],
    }
    review_payload = {
        "manual_action_count": 5,
        "review_record_count": 0,
        "ready_count": 0,
        "not_ready_count": 5,
        "manual_action_identity_issue_count": 0,
        "review_wait_summary": {
            "status": "waiting_review_window",
            "earliest_due_date": "2026-06-22",
            "next_object_label": "B016EXMVZS",
            "review_windows": ["7 天", "14 天"],
            "next_step": "等待复盘窗口完整后再复核处理后指标，未到期前不拉取快照、不保存复盘结论。",
            "forbidden_actions": ["不拉取快照", "不保存复盘结论", "不自动改规则", "不自动执行广告动作"],
        },
    }

    monkeypatch.setattr(module, "build_signal_scan_payload", lambda selected_market_id=None: scan_payload)
    monkeypatch.setattr(module, "build_review_readiness_payload", lambda selected_market_id=None: review_payload)

    payload = module.build_analysis_depth_payload(selected_market_id=1)

    assert payload["status"] == "needs_depth"
    assert "复盘窗口" in payload["next_action"]
    assert "2026-06-22" in payload["next_action"]
    assert "B016EXMVZS" in payload["next_action"]
    assert "不保存复盘结论" in payload["next_action"]
    assert "补数据覆盖" not in payload["next_action"]


def test_analysis_depth_cli_main_accepts_product_scope_id(monkeypatch, capsys) -> None:
    module = load_analysis_depth_script()
    captured: dict[str, object] = {}

    def fake_payload(*, selected_market_id=None, product_scope_id=None):
        captured["selected_market_id"] = selected_market_id
        captured["product_scope_id"] = product_scope_id
        return {"status": "ready", "product_scope": {"scope_id": product_scope_id}}

    monkeypatch.setattr(module, "build_analysis_depth_payload", fake_payload)
    monkeypatch.setattr(sys, "argv", ["inspect_analysis_depth.py", "--market-id", "1", "--product-scope-id", "parent_asin:B00K4W4AAA"])

    module.main()

    assert captured["selected_market_id"] == 1
    assert captured["product_scope_id"] == "parent_asin:B00K4W4AAA"
    assert json.loads(capsys.readouterr().out)["product_scope"]["scope_id"] == "parent_asin:B00K4W4AAA"
