import importlib.util
import sys
from pathlib import Path
from types import SimpleNamespace


def load_manual_action_preflight_script():
    project_root = Path(__file__).resolve().parents[2]
    script_path = project_root / "scripts" / "inspect_manual_action_preflight.py"
    spec = importlib.util.spec_from_file_location("inspect_manual_action_preflight_script", script_path)
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules["inspect_manual_action_preflight_script"] = module
    spec.loader.exec_module(module)
    return module


def test_manual_action_preflight_reports_b06_write_expectation(monkeypatch) -> None:
    module = load_manual_action_preflight_script()
    signal_id = "sig-sales-product-ad-weak-snapshot:sales:1:826-Dark Blue:2026-05-17:2026-06-15"

    monkeypatch.setattr(
        module,
        "build_signal_triage_payload",
        lambda selected_market_id=None, top=5, product_scope_id=None: {
            "status": "ready_for_manual_confirmation",
            "snapshot": {
                "snapshot_id": "gerpgo_market_1_20260615_162042",
                "start_date": "2026-05-17",
                "end_date": "2026-06-15",
            },
            "review_status": {
                "manual_action_count": 4,
                "review_record_count": 0,
                "manual_action_identity_issue_count": 0,
            },
            "next_unhandled_candidate": {
                "signal_id": signal_id,
                "shop_id": "market:1",
                "shop_name": "rivbos",
                "object_type": "sales_product",
                "object_id": "snapshot-row-id",
                "stable_object_id": "B06VW5SQ97",
                "object_label": "RBK004-RBK004-2 深蓝",
                "manual_action_preview": {
                    "will_write": False,
                    "signal_id": signal_id,
                    "action_type": "add_to_review",
                    "object_type": "sales_product",
                    "object_id": "B06VW5SQ97",
                    "object_label": "RBK004-RBK004-2 深蓝",
                    "shop_id": "market:1",
                    "shop_name": "rivbos",
                    "market_id": 1,
                    "review_windows": ["7d", "14d"],
                },
            },
        },
    )
    monkeypatch.setattr(
        module,
        "load_manual_actions",
        lambda market_id=None: [
            SimpleNamespace(object_type="advertised_product", object_id="B016EXMW02", signal_id="sig-1", market_id=market_id)
            for _ in range(4)
        ],
    )
    monkeypatch.setattr(module, "build_review_todos", lambda market_id=None: [])
    monkeypatch.setattr(module, "load_review_records", lambda market_id=None: [])

    payload = module.build_manual_action_preflight_payload(
        selected_market_id=1,
        product_scope_id="parent_asin:B00K4W4AAA",
        expected_object_id="B06VW5SQ97",
    )

    assert payload["status"] == "ready_for_explicit_manual_write"
    assert payload["will_write"] is False
    assert payload["target"]["object_type"] == "sales_product"
    assert payload["target"]["object_id"] == "B06VW5SQ97"
    assert payload["target"]["shop_id"] == "market:1"
    assert payload["current_counts"]["manual_action_count"] == 4
    assert payload["current_counts"]["target_manual_action_count"] == 0
    assert payload["current_counts"]["target_review_todo_count"] == 0
    assert payload["expected_after_write"]["manual_action_count"] == 5
    assert payload["expected_after_write"]["target_manual_action_count"] == 1
    assert payload["expected_after_write"]["target_review_todo_count"] == 2
    assert payload["expected_after_write"]["review_record_count"] == 0
    assert "明确人工授权" in payload["next_action"]


def test_manual_action_preflight_targets_next_unhandled_advertised_product(monkeypatch) -> None:
    module = load_manual_action_preflight_script()
    recommended_signal_id = "sig-ad-asin-stable-conversion-ad-asin:1:B016EXMW02"
    next_signal_id = "sig-ad-asin-stable-conversion-ad-asin:1:B07BS9754Q"

    monkeypatch.setattr(
        module,
        "build_signal_triage_payload",
        lambda selected_market_id=None, top=5, product_scope_id=None: {
            "status": "ready_for_manual_confirmation",
            "snapshot": {
                "snapshot_id": "gerpgo_market_1_20260616_120443",
                "start_date": "2026-05-18",
                "end_date": "2026-06-16",
            },
            "review_status": {
                "manual_action_count": 17,
                "review_record_count": 0,
                "manual_action_identity_issue_count": 0,
            },
            "recommended_candidate": {
                "signal_id": recommended_signal_id,
                "object_type": "advertised_product",
                "stable_object_id": "B016EXMW02",
                "object_label": "B016EXMW02",
                "manual_action_preview": {
                    "will_write": False,
                    "signal_id": recommended_signal_id,
                    "action_type": "add_to_review",
                    "object_type": "advertised_product",
                    "object_id": "B016EXMW02",
                    "object_label": "B016EXMW02",
                    "shop_id": "market:1",
                    "shop_name": "rivbos",
                    "market_id": 1,
                    "review_windows": ["7d", "14d"],
                },
            },
            "next_unhandled_candidate": {
                "signal_id": next_signal_id,
                "shop_id": "market:1",
                "shop_name": "rivbos",
                "object_type": "advertised_product",
                "stable_object_id": "B07BS9754Q",
                "object_label": "B07BS9754Q",
                "manual_action_preview": {
                    "will_write": False,
                    "signal_id": next_signal_id,
                    "action_type": "add_to_review",
                    "object_type": "advertised_product",
                    "object_id": "B07BS9754Q",
                    "object_label": "B07BS9754Q",
                    "shop_id": "market:1",
                    "shop_name": "rivbos",
                    "market_id": 1,
                    "review_windows": ["7d", "14d"],
                },
            },
            "next_unhandled_evidence_drilldown": {
                "business_evidence_blocks": [
                    {
                        "block_id": "ad_product_coverage",
                        "label": "广告商品覆盖",
                        "value": "覆盖 raw 投放行 2/2 / 证据行 2 条",
                        "detail": "覆盖率 100.0%，仅用于人工复核。",
                        "source": "advertised_products",
                    },
                    {
                        "block_id": "ad_metric_summary",
                        "label": "广告聚合指标",
                        "value": "花费 79.28 / 订单 32 / 销售额 309.57",
                        "detail": "点击 85，ACOS 25.6%，CVR 37.6%。",
                        "source": "advertised_products",
                    },
                    {
                        "block_id": "top_spend_source",
                        "label": "主要花费来源",
                        "value": "RBK004-AUTO / 花费占比 69.1%",
                        "detail": "用于定位优先下钻的广告活动；不代表该广告活动可以被自动调价。",
                        "source": "advertised_products",
                    },
                    {
                        "block_id": "diagnosis_judgement",
                        "label": "综合判断",
                        "value": "先查投放词 / 搜索词分化",
                        "detail": "不得自动加词、否词、调价或暂停广告。",
                        "source": "business_rule",
                    },
                    {
                        "block_id": "ad_group_problem_location",
                        "label": "广告组问题定位",
                        "value": "RBK004-Auto / 花费 79.28 / 订单 32",
                        "detail": "同广告组搜索词 18 条 / 广告位 0 条；先看词层分化。",
                        "source": "advertised_products + ad_search_term_daily_metrics",
                    },
                    {
                        "block_id": "targeting_context",
                        "label": "投放词结构",
                        "value": "优先广告组投放词 2 个：有效 beach essentials / 无订单 beach trip essentials",
                        "detail": "投放词来自搜索词表现行，不能自动加词、否词或调价。",
                        "source": "ad_search_term_daily_metrics",
                    },
                    {
                        "block_id": "search_term_market_context",
                        "label": "搜索词市场背景",
                        "value": "优先广告组搜索词 2 条：有效 beach essentials / 无订单 beach trip essentials / ABA Top1000 匹配 1 条",
                        "detail": "搜索词只作为同广告组上下文，ABA 只作为市场背景。",
                        "source": "ad_search_term_daily_metrics + ABA导出",
                    },
                    {
                        "block_id": "placement_context_gap",
                        "label": "广告位证据缺口",
                        "value": "缺少同广告组广告位上下文",
                        "detail": "当前不能判断广告位是否造成该 ASIN 承接异常。",
                        "source": "business_rule",
                    },
                    {
                        "block_id": "context_boundary",
                        "label": "上下文边界",
                        "value": "搜索词 18 条 / 广告位 0 条",
                        "detail": "搜索词和广告位只说明同广告组上下文，不能自动归因到该广告 ASIN。",
                        "source": "business_rule",
                    },
                ],
            },
        },
    )
    monkeypatch.setattr(
        module,
        "load_manual_actions",
        lambda market_id=None: [
            SimpleNamespace(
                object_type="advertised_product",
                object_id="B016EXMW02",
                signal_id=f"{recommended_signal_id}:{index}",
                market_id=market_id,
                shop_id="market:1",
            )
            for index in range(17)
        ],
    )
    monkeypatch.setattr(module, "build_review_todos", lambda market_id=None: [])
    monkeypatch.setattr(module, "load_review_records", lambda market_id=None: [])

    payload = module.build_manual_action_preflight_payload(
        selected_market_id=1,
        product_scope_id="parent_asin:B00K4W4AAA",
        expected_object_id="B07BS9754Q",
        expected_object_type="advertised_product",
        expected_action_type="add_to_review",
    )

    assert payload["status"] == "ready_for_explicit_manual_write"
    assert payload["mode"] == "pre_write"
    assert payload["will_write"] is False
    assert payload["requires_explicit_authorization"] is True
    assert payload["target"]["signal_id"] == next_signal_id
    assert payload["target"]["object_type"] == "advertised_product"
    assert payload["target"]["object_id"] == "B07BS9754Q"
    assert payload["target"]["shop_id"] == "market:1"
    assert payload["target"]["review_windows"] == ["7d", "14d"]
    assert payload["current_counts"]["manual_action_count"] == 17
    assert payload["current_counts"]["target_manual_action_count"] == 0
    assert payload["current_counts"]["target_review_todo_count"] == 0
    assert payload["expected_after_write"]["manual_action_count"] == 18
    assert payload["expected_after_write"]["target_manual_action_count"] == 1
    assert payload["expected_after_write"]["target_review_todo_count"] == 2
    assert payload["expected_after_write"]["review_record_count"] == 0
    assert payload["expected_after_write"]["target_review_record_count"] == 0
    assert payload["evidence_snapshot_preview"]["status"] == "ready"
    assert payload["evidence_snapshot_preview"]["item_count"] == 9
    assert [item["label"] for item in payload["evidence_snapshot_preview"]["items"][:6]] == [
        "综合判断",
        "广告组问题定位",
        "投放词结构",
        "搜索词市场背景",
        "广告位证据缺口",
        "上下文边界",
    ]
    assert "有效 beach essentials" in payload["evidence_snapshot_preview"]["items"][2]["value"]
    assert "无订单 beach trip essentials" in payload["evidence_snapshot_preview"]["items"][3]["value"]
    assert payload["evidence_snapshot_preview"]["items"][-1]["label"] == "主要花费来源"
    assert payload["evidence_snapshot_preview"]["will_save_on_authorized_write"] is True
    assert payload["blockers"] == []
    assert "明确人工授权" in payload["next_action"]
    assert "不执行广告动作" in payload["forbidden_effects"]
    assert "不保存 review_records" in payload["forbidden_effects"]


def test_manual_action_preflight_uses_custom_runtime_roots(monkeypatch, tmp_path) -> None:
    module = load_manual_action_preflight_script()
    action_root = tmp_path / "manual-actions"
    review_root = tmp_path / "review-records"
    signal_id = "sig-sales-product-ad-weak-snapshot:sales:1:826-Dark Blue:2026-05-17:2026-06-15"

    monkeypatch.setattr(
        module,
        "build_signal_triage_payload",
        lambda selected_market_id=None, top=5, product_scope_id=None: {
            "status": "ready_for_manual_confirmation",
            "review_status": {
                "manual_action_count": 0,
                "review_record_count": 0,
                "manual_action_identity_issue_count": 0,
            },
            "next_unhandled_candidate": {
                "signal_id": signal_id,
                "shop_id": "market:1",
                "shop_name": "rivbos",
                "object_type": "sales_product",
                "stable_object_id": "B06VW5SQ97",
                "manual_action_preview": {
                    "will_write": False,
                    "signal_id": signal_id,
                    "action_type": "add_to_review",
                    "object_type": "sales_product",
                    "object_id": "B06VW5SQ97",
                    "object_label": "RBK004-RBK004-2 深蓝",
                    "shop_id": "market:1",
                    "shop_name": "rivbos",
                    "market_id": 1,
                    "review_windows": ["7d", "14d"],
                },
            },
        },
    )
    captured: dict[str, Path] = {}

    def fake_load_manual_actions(market_id=None, action_root=None):
        captured["manual_action_root"] = action_root
        return []

    def fake_build_review_todos(market_id=None, action_root=None):
        captured["todo_action_root"] = action_root
        return []

    def fake_load_review_records(market_id=None, review_root=None):
        captured["review_root"] = review_root
        return []

    monkeypatch.setattr(module, "load_manual_actions", fake_load_manual_actions)
    monkeypatch.setattr(module, "build_review_todos", fake_build_review_todos)
    monkeypatch.setattr(module, "load_review_records", fake_load_review_records)

    payload = module.build_manual_action_preflight_payload(
        selected_market_id=1,
        product_scope_id="parent_asin:B00K4W4AAA",
        expected_object_id="B06VW5SQ97",
        expected_object_type="sales_product",
        action_root=action_root,
        review_root=review_root,
    )

    assert payload["status"] == "ready_for_explicit_manual_write"
    assert captured["manual_action_root"] == action_root
    assert captured["todo_action_root"] == action_root
    assert captured["review_root"] == review_root


def test_manual_action_preflight_blocks_missing_review_windows(monkeypatch) -> None:
    module = load_manual_action_preflight_script()
    signal_id = "sig-sales-product-ad-weak-snapshot:sales:1:826-Dark Blue:2026-05-17:2026-06-15"

    monkeypatch.setattr(
        module,
        "build_signal_triage_payload",
        lambda selected_market_id=None, top=5, product_scope_id=None: {
            "status": "ready_for_manual_confirmation",
            "snapshot": {
                "snapshot_id": "gerpgo_market_1_20260615_162042",
                "start_date": "2026-05-17",
                "end_date": "2026-06-15",
            },
            "review_status": {
                "manual_action_count": 4,
                "review_record_count": 0,
                "manual_action_identity_issue_count": 0,
            },
            "next_unhandled_candidate": {
                "signal_id": signal_id,
                "shop_id": "market:1",
                "shop_name": "rivbos",
                "object_type": "sales_product",
                "stable_object_id": "B06VW5SQ97",
                "object_label": "RBK004-RBK004-2 深蓝",
                "manual_action_preview": {
                    "will_write": False,
                    "signal_id": signal_id,
                    "action_type": "add_to_review",
                    "object_type": "sales_product",
                    "object_id": "B06VW5SQ97",
                    "object_label": "RBK004-RBK004-2 深蓝",
                    "shop_id": "market:1",
                    "shop_name": "rivbos",
                    "market_id": 1,
                    "review_windows": ["7d"],
                },
            },
        },
    )
    monkeypatch.setattr(module, "load_manual_actions", lambda market_id=None: [])
    monkeypatch.setattr(module, "build_review_todos", lambda market_id=None: [])
    monkeypatch.setattr(module, "load_review_records", lambda market_id=None: [])

    payload = module.build_manual_action_preflight_payload(
        selected_market_id=1,
        product_scope_id="parent_asin:B00K4W4AAA",
        expected_object_id="B06VW5SQ97",
        expected_object_type="sales_product",
    )

    assert payload["status"] == "blocked"
    assert payload["expected_after_write"]["manual_action_count"] == 0
    assert payload["expected_after_write"]["target_review_todo_count"] == 0
    assert payload["blockers"][0]["code"] == "missing_review_windows"
    assert "7d / 14d" in payload["blockers"][0]["message"]


def test_manual_action_preflight_verifies_post_write_review_todos(monkeypatch) -> None:
    module = load_manual_action_preflight_script()
    signal_id = "sig-sales-product-ad-weak-snapshot:sales:1:826-Dark Blue:2026-05-17:2026-06-15"

    monkeypatch.setattr(
        module,
        "build_signal_triage_payload",
        lambda selected_market_id=None, top=5, product_scope_id=None: {
            "status": "ready_for_manual_confirmation",
            "snapshot": {
                "snapshot_id": "gerpgo_market_1_20260615_162042",
                "start_date": "2026-05-17",
                "end_date": "2026-06-15",
            },
            "review_status": {
                "manual_action_count": 5,
                "review_record_count": 0,
                "manual_action_identity_issue_count": 0,
            },
            "next_unhandled_candidate": {
                "signal_id": signal_id,
                "shop_id": "market:1",
                "shop_name": "rivbos",
                "object_type": "sales_product",
                "stable_object_id": "B06VW5SQ97",
                "object_label": "RBK004-RBK004-2 深蓝",
                "manual_action_preview": {
                    "will_write": False,
                    "signal_id": signal_id,
                    "action_type": "add_to_review",
                    "object_type": "sales_product",
                    "object_id": "B06VW5SQ97",
                    "object_label": "RBK004-RBK004-2 深蓝",
                    "shop_id": "market:1",
                    "shop_name": "rivbos",
                    "market_id": 1,
                    "review_windows": ["7d", "14d"],
                },
            },
        },
    )
    other_actions = [
        SimpleNamespace(object_type="advertised_product", object_id="B016EXMW02", signal_id=f"sig-{index}", market_id=1)
        for index in range(4)
    ]
    target_action = SimpleNamespace(
        object_type="sales_product",
        object_id="B06VW5SQ97",
        signal_id=signal_id,
        market_id=1,
        shop_id="market:1",
        evidence_snapshot=[{"label": "evidence", "value": "saved"}],
    )
    monkeypatch.setattr(module, "load_manual_actions", lambda market_id=None: [*other_actions, target_action])
    monkeypatch.setattr(
        module,
        "build_review_todos",
        lambda market_id=None: [
            SimpleNamespace(
                object_type="sales_product",
                object_id="B06VW5SQ97",
                signal_id=signal_id,
                market_id=1,
                shop_id="market:1",
                review_window="7d",
                evidence_snapshot=[{"label": "evidence", "value": "saved"}],
            ),
            SimpleNamespace(
                object_type="sales_product",
                object_id="B06VW5SQ97",
                signal_id=signal_id,
                market_id=1,
                shop_id="market:1",
                review_window="14d",
                evidence_snapshot=[{"label": "evidence", "value": "saved"}],
            ),
        ],
    )
    monkeypatch.setattr(module, "load_review_records", lambda market_id=None: [])

    payload = module.build_manual_action_preflight_payload(
        selected_market_id=1,
        product_scope_id="parent_asin:B00K4W4AAA",
        expected_object_id="B06VW5SQ97",
        expected_object_type="sales_product",
        expect_written=True,
    )

    assert payload["status"] == "post_write_verified"
    assert payload["mode"] == "post_write"
    assert payload["will_write"] is False
    assert payload["requires_explicit_authorization"] is False
    assert payload["current_counts"]["manual_action_count"] == 5
    assert payload["current_counts"]["target_manual_action_count"] == 1
    assert payload["current_counts"]["target_review_todo_count"] == 2
    assert payload["current_counts"]["target_review_record_count"] == 0
    assert payload["post_write_checks"]["target_manual_action_evidence_snapshot_counts"][0]["evidence_snapshot_count"] == 1
    assert {
        item["review_window"]: item["evidence_snapshot_count"]
        for item in payload["post_write_checks"]["target_review_todo_evidence_snapshot_counts"]
    } == {"7d": 1, "14d": 1}
    assert payload["post_write_checks"]["target_review_windows"] == ["14d", "7d"]
    assert payload["blockers"] == []
    assert "写入后验收通过" in payload["next_action"]


def test_manual_action_preflight_reports_post_write_target_identities(monkeypatch, tmp_path) -> None:
    module = load_manual_action_preflight_script()
    from app.services.manual_actions import save_manual_action

    action_root = tmp_path / "manual-actions"
    review_root = tmp_path / "review-records"
    signal_id = "sig-sales-product-ad-weak-snapshot:sales:1:826-Dark Blue:2026-05-17:2026-06-15"

    monkeypatch.setattr(
        module,
        "build_signal_triage_payload",
        lambda selected_market_id=None, top=5, product_scope_id=None: {
            "status": "ready_for_manual_confirmation",
            "snapshot": {
                "snapshot_id": "gerpgo_market_1_20260615_162042",
                "start_date": "2026-05-17",
                "end_date": "2026-06-15",
            },
            "review_status": {
                "manual_action_count": 1,
                "review_record_count": 0,
                "manual_action_identity_issue_count": 0,
            },
            "next_unhandled_candidate": {
                "signal_id": signal_id,
                "shop_id": "market:1",
                "shop_name": "rivbos",
                "object_type": "sales_product",
                "stable_object_id": "B06VW5SQ97",
                "object_label": "RBK004-RBK004-2 深蓝",
                "manual_action_preview": {
                    "will_write": False,
                    "signal_id": signal_id,
                    "action_type": "add_to_review",
                    "object_type": "sales_product",
                    "object_id": "B06VW5SQ97",
                    "object_label": "RBK004-RBK004-2 深蓝",
                    "shop_id": "market:1",
                    "shop_name": "rivbos",
                    "market_id": 1,
                    "review_windows": ["7d", "14d"],
                },
            },
        },
    )
    save_manual_action(
        signal_id=signal_id,
        action_type="add_to_review",
        action_note="隔离写入身份读回测试",
        operator_name="本地运营",
        snapshot_id="gerpgo_market_1_20260615_162042",
        shop_id="market:1",
        market_id=1,
        object_type="sales_product",
        object_id="B06VW5SQ97",
        object_label="RBK004-RBK004-2 深蓝",
        evidence_snapshot=[{"label": "evidence", "value": "saved"}],
        action_root=action_root,
    )

    payload = module.build_manual_action_preflight_payload(
        selected_market_id=1,
        product_scope_id="parent_asin:B00K4W4AAA",
        expected_object_id="B06VW5SQ97",
        expected_object_type="sales_product",
        expect_written=True,
        action_root=action_root,
        review_root=review_root,
    )

    assert payload["status"] == "post_write_verified"
    assert payload["post_write_checks"]["target_manual_action_identities"] == [
        {
            "signal_id": signal_id,
            "shop_id": "market:1",
            "market_id": 1,
            "object_type": "sales_product",
            "object_id": "B06VW5SQ97",
            "object_label": "RBK004-RBK004-2 深蓝",
        }
    ]
    assert payload["post_write_checks"]["target_manual_action_evidence_snapshot_counts"] == [
        {
            "signal_id": signal_id,
            "object_type": "sales_product",
            "object_id": "B06VW5SQ97",
            "evidence_snapshot_count": 1,
        }
    ]
    todo_identities = payload["post_write_checks"]["target_review_todo_identities"]
    assert len(todo_identities) == 2
    assert {identity["review_window"] for identity in todo_identities} == {"7d", "14d"}
    for identity in todo_identities:
        assert {
            "signal_id": identity["signal_id"],
            "shop_id": identity["shop_id"],
            "market_id": identity["market_id"],
            "object_type": identity["object_type"],
            "object_id": identity["object_id"],
            "object_label": identity["object_label"],
        } == {
            "signal_id": signal_id,
            "shop_id": "market:1",
            "market_id": 1,
            "object_type": "sales_product",
            "object_id": "B06VW5SQ97",
            "object_label": "RBK004-RBK004-2 深蓝",
        }
    assert {
        item["review_window"]: item["evidence_snapshot_count"]
        for item in payload["post_write_checks"]["target_review_todo_evidence_snapshot_counts"]
    } == {"7d": 1, "14d": 1}


def test_manual_action_preflight_blocks_reviewable_post_write_without_evidence_snapshot(monkeypatch) -> None:
    module = load_manual_action_preflight_script()
    signal_id = "sig-search-term-opportunity:1:beach-essentials"

    monkeypatch.setattr(
        module,
        "build_signal_triage_payload",
        lambda selected_market_id=None, top=5, product_scope_id=None: {
            "status": "ready_for_manual_confirmation",
            "review_status": {
                "manual_action_count": 1,
                "review_record_count": 0,
                "manual_action_identity_issue_count": 0,
            },
            "recommended_candidate": {
                "signal_id": signal_id,
                "shop_id": "market:1",
                "shop_name": "rivbos",
                "object_type": "search_term",
                "stable_object_id": "beach essentials",
                "object_label": "beach essentials",
                "manual_action_preview": {
                    "will_write": False,
                    "signal_id": signal_id,
                    "action_type": "add_to_review",
                    "object_type": "search_term",
                    "object_id": "search_term:1:beach essentials",
                    "object_label": "beach essentials",
                    "shop_id": "market:1",
                    "shop_name": "rivbos",
                    "market_id": 1,
                    "review_windows": ["7d", "14d"],
                },
            },
        },
    )
    monkeypatch.setattr(
        module,
        "load_manual_actions",
        lambda market_id=None: [
            SimpleNamespace(
                signal_id=signal_id,
                action_type="add_to_review",
                shop_id="market:1",
                market_id=1,
                object_type="search_term",
                object_id="search_term:1:beach essentials",
                object_label="beach essentials",
                evidence_snapshot=[],
            )
        ],
    )
    monkeypatch.setattr(
        module,
        "build_review_todos",
        lambda market_id=None: [
            SimpleNamespace(
                signal_id=signal_id,
                shop_id="market:1",
                market_id=1,
                object_type="search_term",
                object_id="search_term:1:beach essentials",
                object_label="beach essentials",
                review_window="7d",
                evidence_snapshot=[],
            ),
            SimpleNamespace(
                signal_id=signal_id,
                shop_id="market:1",
                market_id=1,
                object_type="search_term",
                object_id="search_term:1:beach essentials",
                object_label="beach essentials",
                review_window="14d",
                evidence_snapshot=[],
            ),
        ],
    )
    monkeypatch.setattr(module, "load_review_records", lambda market_id=None: [])

    payload = module.build_manual_action_preflight_payload(
        selected_market_id=1,
        product_scope_id="parent_asin:B00K4W4AAA",
        expected_object_id="search_term:1:beach essentials",
        expected_object_type="search_term",
        expected_action_type="add_to_review",
        expect_written=True,
    )

    assert payload["status"] == "blocked"
    blocker_codes = {blocker["code"] for blocker in payload["blockers"]}
    assert "missing_written_evidence_snapshot" in blocker_codes
    assert "missing_review_todo_evidence_snapshot" in blocker_codes
    assert payload["post_write_checks"]["target_manual_action_evidence_snapshot_counts"] == [
        {
            "signal_id": signal_id,
            "object_type": "search_term",
            "object_id": "search_term:1:beach essentials",
            "evidence_snapshot_count": 0,
        }
    ]
    todo_counts = payload["post_write_checks"]["target_review_todo_evidence_snapshot_counts"]
    assert {item["review_window"]: item["evidence_snapshot_count"] for item in todo_counts} == {"7d": 0, "14d": 0}


def test_manual_action_preflight_verifies_ignore_post_write_without_review_todos(monkeypatch, tmp_path) -> None:
    module = load_manual_action_preflight_script()
    from app.services.manual_actions import save_manual_action

    action_root = tmp_path / "manual-actions"
    review_root = tmp_path / "review-records"
    signal_id = "sig-sales-product-ad-weak-snapshot:sales:1:826-Dark Blue:2026-05-17:2026-06-15"

    monkeypatch.setattr(
        module,
        "build_signal_triage_payload",
        lambda selected_market_id=None, top=5, product_scope_id=None: {
            "status": "ready_for_manual_confirmation",
            "snapshot": {
                "snapshot_id": "gerpgo_market_1_20260615_162042",
                "start_date": "2026-05-17",
                "end_date": "2026-06-15",
            },
            "review_status": {
                "manual_action_count": 1,
                "review_record_count": 0,
                "manual_action_identity_issue_count": 0,
            },
            "next_unhandled_candidate": {
                "signal_id": signal_id,
                "shop_id": "market:1",
                "shop_name": "rivbos",
                "object_type": "sales_product",
                "stable_object_id": "B06VW5SQ97",
                "object_label": "RBK004-RBK004-2 深蓝",
                "manual_action_preview": {
                    "will_write": False,
                    "signal_id": signal_id,
                    "action_type": "add_to_review",
                    "object_type": "sales_product",
                    "object_id": "B06VW5SQ97",
                    "object_label": "RBK004-RBK004-2 深蓝",
                    "shop_id": "market:1",
                    "shop_name": "rivbos",
                    "market_id": 1,
                    "review_windows": ["7d", "14d"],
                },
            },
        },
    )
    save_manual_action(
        signal_id=signal_id,
        action_type="ignore",
        action_note="忽略本次，不进入当前复盘待办",
        operator_name="本地运营",
        snapshot_id="gerpgo_market_1_20260615_162042",
        shop_id="market:1",
        market_id=1,
        object_type="sales_product",
        object_id="B06VW5SQ97",
        object_label="RBK004-RBK004-2 深蓝",
        action_root=action_root,
    )

    payload = module.build_manual_action_preflight_payload(
        selected_market_id=1,
        product_scope_id="parent_asin:B00K4W4AAA",
        expected_object_id="B06VW5SQ97",
        expected_object_type="sales_product",
        expected_action_type="ignore",
        expect_written=True,
        action_root=action_root,
        review_root=review_root,
    )

    assert payload["status"] == "post_write_verified"
    assert payload["target"]["action_type"] == "ignore"
    assert payload["current_counts"]["target_manual_action_count"] == 1
    assert payload["current_counts"]["target_review_todo_count"] == 0
    assert payload["post_write_checks"]["target_review_windows"] == []
    assert payload["blockers"] == []
    assert "不会进入当前 7d / 14d 复盘待办" in payload["next_action"]
    assert "等待复盘窗口完整" not in payload["next_action"]


def test_manual_action_preflight_blocks_post_write_missing_todos(monkeypatch) -> None:
    module = load_manual_action_preflight_script()
    signal_id = "sig-sales-product-ad-weak-snapshot:sales:1:826-Dark Blue:2026-05-17:2026-06-15"

    monkeypatch.setattr(
        module,
        "build_signal_triage_payload",
        lambda selected_market_id=None, top=5, product_scope_id=None: {
            "status": "ready_for_manual_confirmation",
            "review_status": {
                "manual_action_count": 5,
                "review_record_count": 0,
                "manual_action_identity_issue_count": 0,
            },
            "next_unhandled_candidate": {
                "signal_id": signal_id,
                "shop_id": "market:1",
                "shop_name": "rivbos",
                "object_type": "sales_product",
                "stable_object_id": "B06VW5SQ97",
                "manual_action_preview": {
                    "will_write": False,
                    "signal_id": signal_id,
                    "action_type": "add_to_review",
                    "object_type": "sales_product",
                    "object_id": "B06VW5SQ97",
                    "object_label": "RBK004-RBK004-2 深蓝",
                    "shop_id": "market:1",
                    "shop_name": "rivbos",
                    "market_id": 1,
                    "review_windows": ["7d", "14d"],
                },
            },
        },
    )
    monkeypatch.setattr(
        module,
        "load_manual_actions",
        lambda market_id=None: [
            SimpleNamespace(
                object_type="sales_product",
                object_id="B06VW5SQ97",
                signal_id=signal_id,
                market_id=1,
                shop_id="market:1",
            )
        ],
    )
    monkeypatch.setattr(
        module,
        "build_review_todos",
        lambda market_id=None: [
            SimpleNamespace(
                object_type="sales_product",
                object_id="B06VW5SQ97",
                signal_id=signal_id,
                market_id=1,
                shop_id="market:1",
                review_window="7d",
            )
        ],
    )
    monkeypatch.setattr(module, "load_review_records", lambda market_id=None: [])

    payload = module.build_manual_action_preflight_payload(
        selected_market_id=1,
        product_scope_id="parent_asin:B00K4W4AAA",
        expected_object_id="B06VW5SQ97",
        expected_object_type="sales_product",
        expect_written=True,
    )

    assert payload["status"] == "blocked"
    assert payload["post_write_checks"]["target_review_windows"] == ["7d"]
    assert payload["blockers"][0]["code"] == "post_write_review_todo_mismatch"
    assert "7d / 14d" in payload["blockers"][0]["message"]


def test_manual_action_preflight_post_write_does_not_match_wrong_shop_context(monkeypatch) -> None:
    module = load_manual_action_preflight_script()
    signal_id = "sig-sales-product-ad-weak-snapshot:sales:1:826-Dark Blue:2026-05-17:2026-06-15"

    monkeypatch.setattr(
        module,
        "build_signal_triage_payload",
        lambda selected_market_id=None, top=5, product_scope_id=None: {
            "status": "ready_for_manual_confirmation",
            "review_status": {
                "manual_action_count": 1,
                "review_record_count": 0,
                "manual_action_identity_issue_count": 0,
            },
            "next_unhandled_candidate": {
                "signal_id": signal_id,
                "shop_id": "market:1",
                "shop_name": "rivbos",
                "object_type": "sales_product",
                "stable_object_id": "B06VW5SQ97",
                "manual_action_preview": {
                    "will_write": False,
                    "signal_id": signal_id,
                    "action_type": "add_to_review",
                    "object_type": "sales_product",
                    "object_id": "B06VW5SQ97",
                    "object_label": "RBK004-RBK004-2 深蓝",
                    "shop_id": "market:1",
                    "shop_name": "rivbos",
                    "market_id": 1,
                    "review_windows": ["7d", "14d"],
                },
            },
        },
    )
    monkeypatch.setattr(
        module,
        "load_manual_actions",
        lambda market_id=None: [
            SimpleNamespace(
                object_type="sales_product",
                object_id="B06VW5SQ97",
                signal_id=signal_id,
                market_id=1,
                shop_id="market:2",
            )
        ],
    )
    monkeypatch.setattr(
        module,
        "build_review_todos",
        lambda market_id=None: [
            SimpleNamespace(
                object_type="sales_product",
                object_id="B06VW5SQ97",
                signal_id=signal_id,
                market_id=1,
                shop_id="market:2",
                review_window="7d",
            ),
            SimpleNamespace(
                object_type="sales_product",
                object_id="B06VW5SQ97",
                signal_id=signal_id,
                market_id=1,
                shop_id="market:2",
                review_window="14d",
            ),
        ],
    )
    monkeypatch.setattr(module, "load_review_records", lambda market_id=None: [])

    payload = module.build_manual_action_preflight_payload(
        selected_market_id=1,
        product_scope_id="parent_asin:B00K4W4AAA",
        expected_object_id="B06VW5SQ97",
        expected_object_type="sales_product",
        expect_written=True,
    )

    blocker_codes = {blocker["code"] for blocker in payload["blockers"]}
    assert payload["status"] == "blocked"
    assert payload["current_counts"]["target_manual_action_count"] == 0
    assert payload["current_counts"]["target_review_todo_count"] == 0
    assert payload["post_write_checks"]["target_review_windows"] == []
    assert {"missing_written_manual_action", "post_write_review_todo_mismatch"}.issubset(blocker_codes)


def test_manual_action_preflight_post_write_does_not_match_missing_shop_context(monkeypatch) -> None:
    module = load_manual_action_preflight_script()
    signal_id = "sig-sales-product-ad-weak-snapshot:sales:1:826-Dark Blue:2026-05-17:2026-06-15"

    monkeypatch.setattr(
        module,
        "build_signal_triage_payload",
        lambda selected_market_id=None, top=5, product_scope_id=None: {
            "status": "ready_for_manual_confirmation",
            "review_status": {
                "manual_action_count": 1,
                "review_record_count": 0,
                "manual_action_identity_issue_count": 0,
            },
            "next_unhandled_candidate": {
                "signal_id": signal_id,
                "shop_id": "market:1",
                "shop_name": "rivbos",
                "object_type": "sales_product",
                "stable_object_id": "B06VW5SQ97",
                "manual_action_preview": {
                    "will_write": False,
                    "signal_id": signal_id,
                    "action_type": "add_to_review",
                    "object_type": "sales_product",
                    "object_id": "B06VW5SQ97",
                    "object_label": "RBK004-RBK004-2 深蓝",
                    "shop_id": "market:1",
                    "shop_name": "rivbos",
                    "market_id": 1,
                    "review_windows": ["7d", "14d"],
                },
            },
        },
    )
    monkeypatch.setattr(
        module,
        "load_manual_actions",
        lambda market_id=None: [
            SimpleNamespace(
                object_type="sales_product",
                object_id="B06VW5SQ97",
                signal_id=signal_id,
                market_id=1,
            )
        ],
    )
    monkeypatch.setattr(
        module,
        "build_review_todos",
        lambda market_id=None: [
            SimpleNamespace(
                object_type="sales_product",
                object_id="B06VW5SQ97",
                signal_id=signal_id,
                market_id=1,
                review_window="7d",
            ),
            SimpleNamespace(
                object_type="sales_product",
                object_id="B06VW5SQ97",
                signal_id=signal_id,
                market_id=1,
                review_window="14d",
            ),
        ],
    )
    monkeypatch.setattr(module, "load_review_records", lambda market_id=None: [])

    payload = module.build_manual_action_preflight_payload(
        selected_market_id=1,
        product_scope_id="parent_asin:B00K4W4AAA",
        expected_object_id="B06VW5SQ97",
        expected_object_type="sales_product",
        expect_written=True,
    )

    blocker_codes = {blocker["code"] for blocker in payload["blockers"]}
    assert payload["status"] == "blocked"
    assert payload["current_counts"]["target_manual_action_count"] == 0
    assert payload["current_counts"]["target_review_todo_count"] == 0
    assert payload["post_write_checks"]["target_review_windows"] == []
    assert {"missing_written_manual_action", "post_write_review_todo_mismatch"}.issubset(blocker_codes)


def test_manual_action_preflight_blocks_missing_shop_context(monkeypatch) -> None:
    module = load_manual_action_preflight_script()
    signal_id = "sig-sales-product-ad-weak-snapshot:sales:1:826-Dark Blue:2026-05-17:2026-06-15"

    monkeypatch.setattr(
        module,
        "build_signal_triage_payload",
        lambda selected_market_id=None, top=5, product_scope_id=None: {
            "status": "ready_for_manual_confirmation",
            "review_status": {
                "manual_action_count": 4,
                "review_record_count": 0,
                "manual_action_identity_issue_count": 0,
            },
            "next_unhandled_candidate": {
                "signal_id": signal_id,
                "object_type": "sales_product",
                "stable_object_id": "B06VW5SQ97",
                "manual_action_preview": {
                    "will_write": False,
                    "signal_id": signal_id,
                    "action_type": "add_to_review",
                    "object_type": "sales_product",
                    "object_id": "B06VW5SQ97",
                    "object_label": "RBK004-RBK004-2 深蓝",
                    "market_id": 1,
                    "review_windows": ["7d", "14d"],
                },
            },
        },
    )
    monkeypatch.setattr(module, "load_manual_actions", lambda market_id=None: [])
    monkeypatch.setattr(module, "build_review_todos", lambda market_id=None: [])
    monkeypatch.setattr(module, "load_review_records", lambda market_id=None: [])

    payload = module.build_manual_action_preflight_payload(
        selected_market_id=1,
        product_scope_id="parent_asin:B00K4W4AAA",
        expected_object_id="B06VW5SQ97",
        expected_object_type="sales_product",
    )

    assert payload["status"] == "blocked"
    assert any(blocker["code"] == "missing_shop_context" for blocker in payload["blockers"])
