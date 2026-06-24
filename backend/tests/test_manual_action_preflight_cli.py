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
            "actionability_status": {
                "status": "ready_for_manual_confirmation",
                "can_write_manual_action": True,
                "message": "已有可进入人工确认的广告对象级候选。",
                "next_step": "由运营人工确认后写入留痕，并生成 7/14 天复盘待办。",
                "manual_gate_title": "可进入人工确认",
                "boundary": "只允许人工记录观察、标记已处理、加入复盘或忽略本次；不会自动执行广告动作。",
            },
            "signal_status": {"candidate_count": 3},
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
                        "block_id": "diagnosis_path",
                        "label": "排查路径",
                        "value": "Parent 经营盘子 -> 广告 ASIN -> 广告组 -> 投放词 / 搜索词 / 广告位",
                        "detail": "先用 Parent ASIN 看整体销售，再只下钻有广告证据的广告 ASIN。",
                        "source": "business_rule",
                    },
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
            "product_scope_drilldown": {
                "ad_group_diagnosis": [
                    {
                        "ad_group_name": "RBK004-Auto",
                        "ad_group_advertised_asin_count": 2,
                        "ad_group_advertised_asins": ["B016EXMW02", "B07BS9754Q"],
                        "search_term_count": 18,
                        "effective_search_term_count": 3,
                        "zero_order_search_term_count": 3,
                        "placement_count": 0,
                        "campaign_placement_count": 4,
                        "placement_context_level": "campaign",
                        "search_term_diagnosis": {
                            "term_boundary": "搜索词只说明同广告组上下文，不能自动归因到单个 ASIN。",
                            "next_review_focus": "先比较有效词和无订单花费词，再人工核对同组 ASIN 承接。",
                        },
                    }
                ]
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
    assert payload["evidence_snapshot_preview"]["item_count"] == 17
    assert [item["label"] for item in payload["evidence_snapshot_preview"]["items"][:7]] == [
        "排查路径",
        "AI 准入",
        "综合判断",
        "广告组问题定位",
        "广告组合流判断",
        "投放词结构",
        "搜索词市场背景",
    ]
    synthesis_item = next(item for item in payload["evidence_snapshot_preview"]["items"] if item["label"] == "广告组合流判断")
    assert "Parent 经营盘子" in payload["evidence_snapshot_preview"]["items"][0]["value"]
    assert "ready_for_manual_confirmation" in payload["evidence_snapshot_preview"]["items"][1]["value"]
    assert "候选 3 个" in payload["evidence_snapshot_preview"]["items"][1]["value"]
    assert "不会自动执行广告动作" in payload["evidence_snapshot_preview"]["items"][1]["detail"]
    assert "同广告组广告 ASIN 2 个" in synthesis_item["value"]
    assert "搜索词 18 条" in synthesis_item["value"]
    assert "广告组级广告位 0 条 / 同广告活动广告位 4 条" in synthesis_item["value"]
    assert "不能自动归因到单个广告 ASIN" in synthesis_item["detail"]
    assert "不能自动加词" in synthesis_item["detail"]
    assert "缺少广告组级广告位证据" in synthesis_item["detail"]
    assert "有效 beach essentials" in payload["evidence_snapshot_preview"]["items"][5]["value"]
    assert "无订单 beach trip essentials" in payload["evidence_snapshot_preview"]["items"][6]["value"]
    snapshot_by_label = {item["label"]: item for item in payload["evidence_snapshot_preview"]["items"]}
    assert "广告商品覆盖" in snapshot_by_label
    assert "证据缺口" in snapshot_by_label
    assert "需要补证" in snapshot_by_label
    assert "动作边界" in snapshot_by_label
    assert "补齐广告组级广告位证据" in snapshot_by_label["需要补证"]["value"]
    assert "不得自动调价" in snapshot_by_label["动作边界"]["detail"]
    assert payload["evidence_snapshot_preview"]["items"][-1]["label"] == "主要花费来源"
    assert payload["evidence_snapshot_preview"]["will_save_on_authorized_write"] is True
    assert payload["blockers"] == []
    assert "明确人工授权" in payload["next_action"]
    assert "不执行广告动作" in payload["forbidden_effects"]
    assert "不保存 review_records" in payload["forbidden_effects"]


def test_manual_action_preflight_snapshots_diagnosis_contract_gaps(monkeypatch) -> None:
    module = load_manual_action_preflight_script()
    signal_id = "sig-search-term-opportunity:1:beach-essentials"

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
            "diagnosis_contract": {
                "sections": [
                    {
                        "section_id": "search_term_opportunity",
                        "title": "搜索词机会",
                        "current_judgement": "beach essentials 有广告订单和 ABA 热度，可以进入人工扩量复核。",
                        "proves": "能证明该搜索词在当前广告组上下文中有真实广告转化。",
                        "does_not_prove": "不能证明应该自动加词、自动调价或归因到单个广告 ASIN。",
                        "evidence_gap": "缺少投放词是否已稳定维护、广告商品是否适合扩量的人工证据。",
                        "required_evidence": "需要人工核对广告商品、投放词、广告组策略和 7/14 天复盘指标。",
                        "next_manual_step": "人工核对投放词和同组 ASIN 后，记录观察或加入 7/14 天复盘。",
                    },
                    {
                        "section_id": "placement_gap",
                        "title": "广告位缺口",
                        "current_judgement": "当前缺少广告组级广告位证据，不能判断广告位影响。",
                        "proves": "能证明广告位证据粒度不足。",
                        "does_not_prove": "不能证明搜索词表现由广告位造成。",
                        "evidence_gap": "缺少同周期广告位数据，不能判断广告位是否造成转化差。",
                        "required_evidence": "需要同周期 ad_placement_daily_metrics。",
                        "next_manual_step": "补齐广告位证据前，只记录观察，不输出广告位调整建议。",
                    },
                ],
            },
            "recommended_candidate": {
                "signal_id": signal_id,
                "shop_id": "market:1",
                "shop_name": "rivbos",
                "object_type": "search_term",
                "stable_object_id": "search_term:1:beach essentials",
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
            "recommended_evidence_drilldown": {
                "search_term_rows": [
                    {
                        "campaign_name": "RBK004-扩展",
                        "ad_group_name": "RBK004-扩展-beach essentials",
                        "targeting_text": "beach essentials broad",
                        "clicks": 18,
                        "spend": 25.5,
                        "orders": 1,
                        "sales": 35,
                    },
                    {
                        "campaign_name": "RBK004-beach essentials-精准",
                        "ad_group_name": "RBK004-beach essentials-精准",
                        "targeting_text": "beach essentials exact",
                        "clicks": 42,
                        "spend": 48.25,
                        "orders": 3,
                        "sales": 126,
                    },
                ],
                "business_evidence_blocks": [
                    {
                        "block_id": "search_term_market_context",
                        "label": "搜索词市场背景",
                        "value": "beach essentials 有订单且命中 ABA Top1000。",
                        "detail": "搜索词只作为同广告组上下文，不能自动归因到单个 ASIN。",
                        "source": "ad_search_term_daily_metrics + ABA导出",
                    }
                ],
            },
        },
    )
    monkeypatch.setattr(module, "load_manual_actions", lambda market_id=None: [])
    monkeypatch.setattr(module, "build_review_todos", lambda market_id=None: [])
    monkeypatch.setattr(module, "load_review_records", lambda market_id=None: [])

    payload = module.build_manual_action_preflight_payload(
        selected_market_id=1,
        product_scope_id="parent_asin:B00K4W4AAA",
        expected_object_id="search_term:1:beach essentials",
        expected_object_type="search_term",
        expected_action_type="add_to_review",
    )

    items = payload["evidence_snapshot_preview"]["items"]
    labels = [item["label"] for item in items]
    target_item = next(item for item in items if item["label"] == "搜索词")
    judgement_item = next(item for item in items if item["label"] == "人工确认判断依据")
    proves_item = next(item for item in items if item["label"] == "能证明的事实")
    counter_item = next(item for item in items if item["label"] == "不能证明的边界")
    next_step_item = next(item for item in items if item["label"] == "人工下一步")
    gap_item = next(item for item in items if item["label"] == "诊断证据缺口")
    required_item = next(item for item in items if item["label"] == "需要补证")
    ad_context_item = next(item for item in items if item["label"] == "逐投放上下文")
    targeting_item = next(item for item in items if item["label"] == "投放词证据")
    aba_item = next(item for item in items if item["label"] == "ABA 背景")
    review_gap_item = next(item for item in items if item["label"] == "证据缺口")
    action_boundary_item = next(item for item in items if item["label"] == "动作边界")
    assert labels[0] == "搜索词"
    assert "beach essentials" in target_item["value"]
    assert "search_term:1:beach essentials" in target_item["value"]
    assert "人工确认和 7/14 天复盘对象是这个具体 SearchTerm" in target_item["detail"]
    assert "不自动加词" in target_item["detail"]
    assert labels.index("广告组合流判断") < labels.index("投放词证据")
    assert labels.index("投放词证据") < labels.index("搜索词边界")
    assert labels.index("搜索词边界") < labels.index("广告位边界")
    assert labels.index("广告位边界") < labels.index("ABA 背景")
    assert labels.index("ABA 背景") < labels.index("人工确认判断依据")
    assert labels.index("搜索词市场背景") < labels.index("人工确认判断依据")
    assert "可以进入人工扩量复核" in judgement_item["value"]
    assert "真实广告转化" in proves_item["value"]
    assert "不能证明应该自动加词" in counter_item["value"]
    assert "加入 7/14 天复盘" in next_step_item["value"]
    assert "投放词是否已稳定维护" in gap_item["value"]
    assert "缺少同周期广告位数据" in gap_item["value"]
    assert "广告组策略" in required_item["value"]
    assert "ad_placement_daily_metrics" in required_item["value"]
    assert "优先复核广告组" in ad_context_item["value"]
    assert "RBK004-beach essentials-精准" in ad_context_item["value"]
    assert "对照复核广告组" in ad_context_item["value"]
    assert ad_context_item["value"].index("优先复核广告组") < ad_context_item["value"].index("对照复核广告组")
    assert "不能自动归因到单个广告 ASIN" in ad_context_item["detail"]
    assert judgement_item["source"] == "diagnosis_contract"
    assert counter_item["source"] == "diagnosis_contract"
    assert gap_item["source"] == "diagnosis_contract"
    assert required_item["source"] == "diagnosis_contract"
    assert "投放词证据" in targeting_item["value"]
    assert "ABA Top1000" in aba_item["value"]
    assert "投放词是否已稳定维护" in review_gap_item["value"]
    assert "不得自动加词" in action_boundary_item["detail"]


def test_manual_action_preflight_snapshots_placement_review_chain(monkeypatch) -> None:
    module = load_manual_action_preflight_script()
    signal_id = "sig-placement-gap:1:top-of-search"

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
            "actionability_status": {
                "status": "ready_for_manual_confirmation",
                "can_write_manual_action": True,
                "manual_gate_title": "可进入人工确认",
                "boundary": "只允许人工记录观察、标记已处理、加入复盘或忽略本次；不会自动执行广告动作。",
            },
            "diagnosis_contract": {
                "signal_id": signal_id,
                "object_type": "placement",
                "object_id": "Top of Search",
                "object_label": "Top of Search",
                "sections": [
                    {
                        "section_id": "placement_gap",
                        "title": "广告位表现",
                        "current_judgement": "Top of Search 花费高但订单承接弱，只能进入人工广告位复核。",
                        "proves": "能证明当前广告位层级存在花费和订单承接差异。",
                        "does_not_prove": "不能证明应该自动调整广告位加价或归因到单个 ASIN。",
                        "evidence_gap": "缺少同广告活动 / 广告组搜索词和广告商品承接证据。",
                        "required_evidence": "补齐同广告活动广告位对比、搜索词上下文和广告商品承接证据。",
                        "next_manual_step": "人工核对广告位、搜索词和广告商品后再加入复盘。",
                    }
                ],
            },
            "recommended_candidate": {
                "signal_id": signal_id,
                "shop_id": "market:1",
                "shop_name": "rivbos",
                "object_type": "placement",
                "stable_object_id": "Top of Search",
                "object_label": "Top of Search",
                "manual_action_preview": {
                    "will_write": False,
                    "signal_id": signal_id,
                    "action_type": "add_to_review",
                    "object_type": "placement",
                    "object_id": "Top of Search",
                    "object_label": "Top of Search",
                    "shop_id": "market:1",
                    "shop_name": "rivbos",
                    "market_id": 1,
                    "review_windows": ["7d", "14d"],
                },
            },
            "recommended_evidence_drilldown": {
                "business_evidence_blocks": [
                    {
                        "block_id": "diagnosis_path",
                        "label": "排查路径",
                        "value": "Parent 经营盘子 -> 广告活动 -> 广告位 -> 人工复盘",
                        "detail": "广告位只作为人工观察和复盘对象，不自动执行广告动作。",
                        "source": "business_rule",
                    }
                ],
            },
        },
    )
    monkeypatch.setattr(module, "load_manual_actions", lambda market_id=None: [])
    monkeypatch.setattr(module, "build_review_todos", lambda market_id=None: [])
    monkeypatch.setattr(module, "load_review_records", lambda market_id=None: [])

    payload = module.build_manual_action_preflight_payload(
        selected_market_id=1,
        product_scope_id="parent_asin:B00K4W4AAA",
        expected_object_id="Top of Search",
        expected_object_type="placement",
        expected_action_type="add_to_review",
    )

    snapshot_by_label = {item["label"]: item for item in payload["evidence_snapshot_preview"]["items"]}
    assert "广告位表现" in snapshot_by_label
    assert "证据缺口" in snapshot_by_label
    assert "需要补证" in snapshot_by_label
    assert "动作边界" in snapshot_by_label
    assert "Top of Search 花费高" in snapshot_by_label["广告位表现"]["value"]
    assert "层级存在花费和订单承接差异" in snapshot_by_label["广告位表现"]["detail"]
    assert "搜索词和广告商品承接证据" in snapshot_by_label["证据缺口"]["value"]
    assert "同广告活动广告位对比" in snapshot_by_label["需要补证"]["value"]
    assert "不得自动调整广告位加价" in snapshot_by_label["动作边界"]["detail"]
    assert payload["target"]["object_type"] == "placement"
    assert payload["target"]["object_id"] == "Top of Search"
    assert payload["evidence_snapshot_preview"]["will_save_on_authorized_write"] is True


def test_manual_action_preflight_snapshots_next_unhandled_diagnosis_contract(monkeypatch) -> None:
    module = load_manual_action_preflight_script()
    recommended_signal_id = "sig-opportunity-search-term-1-beach-essentials"
    next_signal_id = "sig-opportunity-gerpgo_market_1_20260616_120443:507942344"

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
            "diagnosis_contract": {
                "signal_id": next_signal_id,
                "object_type": "search_term",
                "object_id": "boys sunglasses",
                "object_label": "boys sunglasses",
                "sections": [
                    {
                        "section_id": "search_term_opportunity",
                        "title": "搜索词机会",
                        "current_judgement": "boys sunglasses 产生 3 单，花费 8.38，ACOS 21.8%，可进入人工扩量复核。",
                        "proves": "能证明 boys sunglasses 在当前投放上下文中有广告表现。",
                        "does_not_prove": "不能证明应该自动加词、自动调价或自动归因到单个广告 ASIN。",
                        "evidence_gap": "缺少 ABA Top1000 精确匹配，只能看店内广告表现。",
                        "required_evidence": "需要人工核对投放词、广告组结构和广告 ASIN 承接。",
                        "next_manual_step": "核对 sunglasses for kids、同组 ASIN 和主推策略后，再选择加入复盘或忽略本次。",
                    }
                ],
            },
            "recommended_candidate": {
                "signal_id": recommended_signal_id,
                "shop_id": "market:1",
                "shop_name": "rivbos",
                "object_type": "search_term",
                "stable_object_id": "search_term:1:beach essentials",
                "object_label": "beach essentials",
                "manual_action_preview": {
                    "will_write": False,
                    "signal_id": recommended_signal_id,
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
            "next_unhandled_candidate": {
                "signal_id": next_signal_id,
                "shop_id": "market:1",
                "shop_name": "rivbos",
                "object_type": "search_term",
                "object_id": "gerpgo_market_1_20260616_120443:507942344",
                "object_label": "boys sunglasses",
                "manual_action_preview": {
                    "will_write": False,
                    "signal_id": next_signal_id,
                    "action_type": "add_to_review",
                    "object_type": "search_term",
                    "object_id": "gerpgo_market_1_20260616_120443:507942344",
                    "object_label": "boys sunglasses",
                    "shop_id": "market:1",
                    "shop_name": "rivbos",
                    "market_id": 1,
                    "review_windows": ["7d", "14d"],
                },
            },
            "next_unhandled_evidence_drilldown": {
                "business_evidence_blocks": [
                    {
                        "block_id": "diagnosis_path",
                        "label": "排查路径",
                        "value": "搜索词 -> 广告活动 / 广告组 -> 投放词结构 -> 广告 ASIN 人工复核",
                        "detail": "搜索词先定位投放上下文，不自动执行广告动作。",
                        "source": "business_rule",
                    }
                ],
            },
        },
    )
    monkeypatch.setattr(
        module,
        "load_manual_actions",
        lambda market_id=None: [
            SimpleNamespace(
                object_type="search_term",
                object_id="search_term:1:beach essentials",
                signal_id=recommended_signal_id,
                action_type="add_to_review",
                market_id=market_id,
                shop_id="market:1",
            )
        ],
    )
    monkeypatch.setattr(
        module,
        "build_review_todos",
        lambda market_id=None: [
            SimpleNamespace(
                object_type="search_term",
                object_id="search_term:1:beach essentials",
                object_label="beach essentials",
                signal_id=recommended_signal_id,
                action_type="add_to_review",
                market_id=market_id,
                shop_id="market:1",
                review_window=window,
                evidence_snapshot=[{"label": "排查路径", "value": "beach essentials 已进入复盘等待"}],
            )
            for window in ("7d", "14d")
        ],
    )
    monkeypatch.setattr(module, "load_review_records", lambda market_id=None: [])

    payload = module.build_manual_action_preflight_payload(
        selected_market_id=1,
        product_scope_id="parent_asin:B00K4W4AAA",
        expected_object_id="gerpgo_market_1_20260616_120443:507942344",
        expected_object_type="search_term",
        expected_action_type="add_to_review",
    )

    assert payload["status"] == "ready_for_explicit_manual_write"
    assert payload["target"]["signal_id"] == next_signal_id
    assert payload["target"]["object_id"] == "search_term:1:boys sunglasses"
    assert payload["target"]["source_object_id"] == "gerpgo_market_1_20260616_120443:507942344"
    assert payload["target"]["object_label"] == "boys sunglasses"
    assert payload["current_counts"]["target_manual_action_count"] == 0
    assert payload["current_counts"]["target_review_todo_count"] == 0
    assert payload["expected_after_write"]["target_review_todo_count"] == 2
    assert payload["post_write_checks"]["target_review_todo_count"] == 0
    assert payload["post_write_checks"]["target_review_windows"] == []

    items = payload["evidence_snapshot_preview"]["items"]
    contract_items = [item for item in items if item["source"] == "diagnosis_contract"]
    contract_text = "\n".join(item["value"] for item in contract_items)
    snapshot_text = "\n".join(item["value"] for item in items)
    assert contract_items[0]["label"] == "广告组合流判断"
    assert "boys sunglasses" in contract_items[0]["value"]
    assert [item["label"] for item in contract_items[1:5]] == [
        "人工确认判断依据",
        "能证明的事实",
        "不能证明的边界",
        "人工下一步",
    ]
    assert "boys sunglasses" in contract_text
    assert "花费 8.38" in contract_text
    assert "不能证明应该自动加词" in contract_text
    assert "beach essentials" not in contract_text
    assert "beach essentials 已进入复盘等待" not in snapshot_text
    assert payload["blockers"] == []


def test_manual_action_preflight_uses_target_diagnosis_contract_when_global_points_to_next(
    monkeypatch,
) -> None:
    module = load_manual_action_preflight_script()
    recommended_signal_id = "sig-opportunity-search-term-1-beach-essentials"
    next_signal_id = "sig-opportunity-gerpgo_market_1_20260616_120443:507942344"

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
            "diagnosis_contract": {
                "signal_id": next_signal_id,
                "object_type": "search_term",
                "object_id": "boys sunglasses",
                "object_label": "boys sunglasses",
                "sections": [
                    {
                        "section_id": "search_term_opportunity",
                        "title": "搜索词机会",
                        "current_judgement": "boys sunglasses 可进入人工扩量复核。",
                        "proves": "能证明 boys sunglasses 在当前投放上下文中有广告表现。",
                        "does_not_prove": "不能证明应该自动加词。",
                        "next_manual_step": "人工复核 boys sunglasses 后再加入复盘。",
                    }
                ],
            },
            "recommended_diagnosis_contract": {
                "signal_id": recommended_signal_id,
                "object_type": "search_term",
                "object_id": "beach essentials",
                "object_label": "beach essentials",
                "sections": [
                    {
                        "section_id": "search_term_opportunity",
                        "title": "搜索词机会",
                        "current_judgement": "beach essentials 在 2 个投放上下文中转化稳定，可进入人工扩量复核。",
                        "proves": "能证明 beach essentials 有广告订单和 ABA 语义背景。",
                        "does_not_prove": "不能证明应该自动加词、自动调价或归因到单个广告 ASIN。",
                        "next_manual_step": "人工核对 beach essentials 的投放词和广告组后加入复盘。",
                    }
                ],
            },
            "next_unhandled_diagnosis_contract": {
                "signal_id": next_signal_id,
                "object_type": "search_term",
                "object_id": "boys sunglasses",
                "object_label": "boys sunglasses",
                "sections": [
                    {
                        "section_id": "search_term_opportunity",
                        "title": "搜索词机会",
                        "current_judgement": "boys sunglasses 可进入人工扩量复核。",
                        "proves": "能证明 boys sunglasses 在当前投放上下文中有广告表现。",
                        "does_not_prove": "不能证明应该自动加词。",
                        "next_manual_step": "人工复核 boys sunglasses 后再加入复盘。",
                    }
                ],
            },
            "recommended_candidate": {
                "signal_id": recommended_signal_id,
                "shop_id": "market:1",
                "shop_name": "rivbos",
                "object_type": "search_term",
                "stable_object_id": "search_term:1:beach essentials",
                "object_label": "beach essentials",
                "manual_action_preview": {
                    "will_write": False,
                    "signal_id": recommended_signal_id,
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
            "next_unhandled_candidate": {
                "signal_id": next_signal_id,
                "shop_id": "market:1",
                "shop_name": "rivbos",
                "object_type": "search_term",
                "object_id": "gerpgo_market_1_20260616_120443:507942344",
                "object_label": "boys sunglasses",
                "manual_action_preview": {
                    "will_write": False,
                    "signal_id": next_signal_id,
                    "action_type": "add_to_review",
                    "object_type": "search_term",
                    "object_id": "gerpgo_market_1_20260616_120443:507942344",
                    "object_label": "boys sunglasses",
                    "shop_id": "market:1",
                    "shop_name": "rivbos",
                    "market_id": 1,
                    "review_windows": ["7d", "14d"],
                },
            },
            "recommended_evidence_drilldown": {
                "business_evidence_blocks": [
                    {
                        "block_id": "diagnosis_path",
                        "label": "排查路径",
                        "value": "beach essentials -> 广告活动 / 广告组 -> 人工复核",
                        "detail": "搜索词只定位上下文，不自动执行广告动作。",
                        "source": "business_rule",
                    }
                ],
            },
            "next_unhandled_evidence_drilldown": {
                "business_evidence_blocks": [
                    {
                        "block_id": "diagnosis_path",
                        "label": "排查路径",
                        "value": "boys sunglasses -> 广告活动 / 广告组 -> 人工复核",
                        "detail": "搜索词只定位上下文，不自动执行广告动作。",
                        "source": "business_rule",
                    }
                ],
            },
        },
    )
    monkeypatch.setattr(module, "load_manual_actions", lambda market_id=None: [])
    monkeypatch.setattr(module, "build_review_todos", lambda market_id=None: [])
    monkeypatch.setattr(module, "load_review_records", lambda market_id=None: [])

    payload = module.build_manual_action_preflight_payload(
        selected_market_id=1,
        product_scope_id="parent_asin:B00K4W4AAA",
        expected_object_id="search_term:1:beach essentials",
        expected_object_type="search_term",
        expected_action_type="add_to_review",
    )

    contract_text = "\n".join(
        item["value"]
        for item in payload["evidence_snapshot_preview"]["items"]
        if item["source"] == "diagnosis_contract"
    )
    snapshot_labels = {item["label"] for item in payload["evidence_snapshot_preview"]["items"]}
    snapshot_text = "\n".join(item["value"] for item in payload["evidence_snapshot_preview"]["items"])
    assert payload["target"]["signal_id"] == recommended_signal_id
    assert "beach essentials" in contract_text
    assert "boys sunglasses" not in contract_text
    assert "beach essentials -> 广告活动" in snapshot_text
    assert "boys sunglasses -> 广告活动" not in snapshot_text
    assert "需要补证" in snapshot_labels
    assert "投放词维护状态" in snapshot_text
    assert payload["blockers"] == []


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
    assert payload["post_write_checks"]["target_review_windows"] == ["7d", "14d"]
    assert payload["blockers"] == []
    assert "写入后验收通过" in payload["next_action"]


def test_manual_action_preflight_post_write_locks_expected_object_when_queue_moves(monkeypatch) -> None:
    module = load_manual_action_preflight_script()
    written_signal_id = "sig-opportunity-search-term-1-beach-essentials"
    next_signal_id = "sig-opportunity-gerpgo_market_1_20260616_120443:507942344"

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
                "manual_action_count": 18,
                "review_record_count": 0,
                "manual_action_identity_issue_count": 0,
            },
            "next_unhandled_candidate": {
                "signal_id": next_signal_id,
                "shop_id": "market:1",
                "shop_name": "rivbos",
                "object_type": "search_term",
                "stable_object_id": "gerpgo_market_1_20260616_120443:507942344",
                "object_label": "boys sunglasses",
                "manual_action_preview": {
                    "will_write": False,
                    "signal_id": next_signal_id,
                    "action_type": "add_to_review",
                    "object_type": "search_term",
                    "object_id": "gerpgo_market_1_20260616_120443:507942344",
                    "object_label": "boys sunglasses",
                    "shop_id": "market:1",
                    "shop_name": "rivbos",
                    "market_id": 1,
                    "review_windows": ["7d", "14d"],
                },
            },
        },
    )
    target_action = SimpleNamespace(
        object_type="search_term",
        object_id="search_term:1:beach essentials",
        object_label="beach essentials",
        signal_id=written_signal_id,
        action_type="add_to_review",
        market_id=1,
        shop_id="market:1",
        evidence_snapshot=[{"label": "排查路径", "value": "已保存"}],
    )
    target_todos = [
        SimpleNamespace(
            object_type="search_term",
            object_id="search_term:1:beach essentials",
            object_label="beach essentials",
            signal_id=written_signal_id,
            action_type="add_to_review",
            market_id=1,
            shop_id="market:1",
            review_window=window,
            evidence_snapshot=[{"label": "排查路径", "value": "已保存"}],
        )
        for window in ("7d", "14d")
    ]
    monkeypatch.setattr(module, "load_manual_actions", lambda market_id=None: [target_action])
    monkeypatch.setattr(module, "build_review_todos", lambda market_id=None: target_todos)
    monkeypatch.setattr(module, "load_review_records", lambda market_id=None: [])

    payload = module.build_manual_action_preflight_payload(
        selected_market_id=1,
        product_scope_id="parent_asin:B00K4W4AAA",
        expected_object_id="search_term:1:beach essentials",
        expected_object_type="search_term",
        expected_action_type="add_to_review",
        expect_written=True,
    )

    assert payload["status"] == "post_write_verified"
    assert payload["target"]["signal_id"] == written_signal_id
    assert payload["target"]["object_id"] == "search_term:1:beach essentials"
    assert payload["target"]["object_label"] == "beach essentials"
    assert payload["current_counts"]["target_manual_action_count"] == 1
    assert payload["current_counts"]["target_review_todo_count"] == 2
    assert payload["post_write_checks"]["target_review_windows"] == ["7d", "14d"]
    assert payload["evidence_snapshot_preview"]["status"] == "saved"
    assert payload["evidence_snapshot_preview"]["item_count"] == 1
    assert payload["evidence_snapshot_preview"]["items"][0]["value"] == "已保存"
    assert "不重新生成当前候选证据" in payload["evidence_snapshot_preview"]["boundary"]
    assert payload["blockers"] == []


def test_manual_action_preflight_allows_rewrite_after_voided_legacy_boundary_gap(monkeypatch) -> None:
    module = load_manual_action_preflight_script()
    signal_id = "sig-opportunity-search-term-1-beach-essentials"

    monkeypatch.setattr(
        module,
        "build_signal_triage_payload",
        lambda selected_market_id=None, top=5, product_scope_id=None: {
            "status": "ready_for_manual_confirmation",
            "snapshot": {"snapshot_id": "gerpgo_market_1_20260616_120443"},
            "review_status": {
                "manual_action_count": 18,
                "review_record_count": 0,
                "manual_action_identity_issue_count": 0,
            },
            "recommended_candidate": {
                "signal_id": signal_id,
                "shop_id": "market:1",
                "shop_name": "rivbos",
                "object_type": "search_term",
                "stable_object_id": "search_term:1:beach essentials",
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
            "recommended_evidence_drilldown": {
                "business_evidence_blocks": [{"label": "排查路径", "value": "Parent -> 搜索词", "source": "test"}],
            },
            "actionability_status": {
                "status": "ready_for_manual_confirmation",
                "manual_gate_title": "AI 信号准入",
                "can_write_manual_action": True,
            },
        },
    )
    legacy_action = SimpleNamespace(
        signal_id=signal_id,
        action_type="add_to_review",
        shop_id="market:1",
        market_id=1,
        object_type="search_term",
        object_id="search_term:1:beach essentials",
        object_label="beach essentials",
        evidence_snapshot=[
            {"label": "排查路径", "value": "旧证据"},
            {"label": "AI 准入", "value": "旧准入"},
        ],
    )
    monkeypatch.setattr(module, "load_manual_actions", lambda market_id=None: [legacy_action])
    monkeypatch.setattr(module, "build_review_todos", lambda market_id=None: [])
    monkeypatch.setattr(module, "load_review_records", lambda market_id=None: [])

    payload = module.build_manual_action_preflight_payload(
        selected_market_id=1,
        product_scope_id="parent_asin:B00K4W4AAA",
        expected_object_id="search_term:1:beach essentials",
        expected_object_type="search_term",
        expected_action_type="add_to_review",
    )

    assert payload["status"] == "ready_for_explicit_manual_write"
    assert payload["current_counts"]["target_manual_action_count"] == 1
    assert payload["current_counts"]["target_review_todo_count"] == 0
    assert payload["expected_after_write"]["target_manual_action_count"] == 2
    assert payload["expected_after_write"]["target_review_todo_count"] == 2
    assert payload["blockers"] == []


def test_manual_action_preflight_allows_rewrite_when_complete_labels_belong_to_other_object(monkeypatch) -> None:
    module = load_manual_action_preflight_script()
    from app.services.manual_action_preflight import SEARCH_TERM_REQUIRED_REVIEW_EVIDENCE_LABELS

    signal_id = "sig-opportunity-search-term-1-beach-essentials"
    required_labels = list(SEARCH_TERM_REQUIRED_REVIEW_EVIDENCE_LABELS)

    monkeypatch.setattr(
        module,
        "build_signal_triage_payload",
        lambda selected_market_id=None, top=5, product_scope_id=None: {
            "status": "ready_for_manual_confirmation",
            "review_status": {
                "manual_action_count": 19,
                "review_record_count": 0,
                "manual_action_identity_issue_count": 0,
            },
            "recommended_candidate": {
                "signal_id": signal_id,
                "shop_id": "market:1",
                "shop_name": "rivbos",
                "object_type": "search_term",
                "stable_object_id": "search_term:1:beach essentials",
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
    mismatched_action = SimpleNamespace(
        signal_id=signal_id,
        action_type="add_to_review",
        shop_id="market:1",
        market_id=1,
        object_type="search_term",
        object_id="search_term:1:beach essentials",
        object_label="beach essentials",
        evidence_snapshot=[
            {"label": label, "value": "boys sunglasses / sunglasses for kids"}
            for label in required_labels
        ],
    )
    monkeypatch.setattr(module, "load_manual_actions", lambda market_id=None: [mismatched_action])
    monkeypatch.setattr(module, "build_review_todos", lambda market_id=None: [])
    monkeypatch.setattr(module, "load_review_records", lambda market_id=None: [])

    payload = module.build_manual_action_preflight_payload(
        selected_market_id=1,
        product_scope_id="parent_asin:B00K4W4AAA",
        expected_object_id="search_term:1:beach essentials",
        expected_object_type="search_term",
        expected_action_type="add_to_review",
    )

    assert payload["status"] == "ready_for_explicit_manual_write"
    assert payload["current_counts"]["target_manual_action_count"] == 1
    assert payload["current_counts"]["target_review_todo_count"] == 0
    assert payload["blockers"] == []


def test_manual_action_preflight_post_write_accepts_new_complete_action_after_legacy_gap(monkeypatch) -> None:
    module = load_manual_action_preflight_script()
    from app.services.manual_action_preflight import SEARCH_TERM_REQUIRED_REVIEW_EVIDENCE_LABELS

    signal_id = "sig-opportunity-search-term-1-beach-essentials"
    complete_evidence = [
        {"label": label, "value": f"beach essentials {label} 已保存"}
        for label in SEARCH_TERM_REQUIRED_REVIEW_EVIDENCE_LABELS
    ]

    monkeypatch.setattr(
        module,
        "build_signal_triage_payload",
        lambda selected_market_id=None, top=5, product_scope_id=None: {
            "status": "ready_for_manual_confirmation",
            "review_status": {
                "manual_action_count": 19,
                "review_record_count": 0,
                "manual_action_identity_issue_count": 0,
            },
            "recommended_candidate": {
                "signal_id": signal_id,
                "shop_id": "market:1",
                "shop_name": "rivbos",
                "object_type": "search_term",
                "stable_object_id": "search_term:1:beach essentials",
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
    legacy_action = SimpleNamespace(
        signal_id=signal_id,
        action_type="add_to_review",
        shop_id="market:1",
        market_id=1,
        object_type="search_term",
        object_id="search_term:1:beach essentials",
        object_label="beach essentials",
        evidence_snapshot=[
            {"label": "排查路径", "value": "旧证据"},
            {"label": "AI 准入", "value": "旧准入"},
        ],
    )
    complete_action = SimpleNamespace(
        signal_id=signal_id,
        action_type="add_to_review",
        shop_id="market:1",
        market_id=1,
        object_type="search_term",
        object_id="search_term:1:beach essentials",
        object_label="beach essentials",
        evidence_snapshot=complete_evidence,
    )
    monkeypatch.setattr(module, "load_manual_actions", lambda market_id=None: [legacy_action, complete_action])
    monkeypatch.setattr(
        module,
        "build_review_todos",
        lambda market_id=None: [
            SimpleNamespace(
                signal_id=signal_id,
                action_type="add_to_review",
                shop_id="market:1",
                market_id=1,
                object_type="search_term",
                object_id="search_term:1:beach essentials",
                object_label="beach essentials",
                review_window=window,
                evidence_snapshot=complete_evidence,
            )
            for window in ("7d", "14d")
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

    assert payload["status"] == "post_write_verified"
    assert payload["current_counts"]["target_manual_action_count"] == 2
    assert payload["current_counts"]["target_review_todo_count"] == 2
    assert payload["evidence_snapshot_preview"]["item_count"] == len(SEARCH_TERM_REQUIRED_REVIEW_EVIDENCE_LABELS)
    saved_labels = {item["label"] for item in payload["evidence_snapshot_preview"]["items"]}
    assert set(SEARCH_TERM_REQUIRED_REVIEW_EVIDENCE_LABELS).issubset(saved_labels)
    assert payload["blockers"] == []


def test_manual_action_preflight_post_write_review_todos_keep_search_term_ad_evidence_chain(monkeypatch) -> None:
    module = load_manual_action_preflight_script()
    from app.services.manual_action_preflight import SEARCH_TERM_REQUIRED_REVIEW_EVIDENCE_LABELS

    signal_id = "sig-opportunity-search-term-1-beach-essentials"
    complete_evidence = [
        {"label": "排查路径", "value": "Parent ASIN -> 广告组 -> 投放商品 -> 投放词 -> 搜索词", "source": "business_rule"},
        {"label": "AI 准入", "value": "ready_for_manual_confirmation / 允许人工留痕", "source": "actionability_status"},
        {"label": "搜索词", "value": "beach essentials / 对象ID search_term:1:beach essentials", "source": "manual_action_target"},
        {"label": "搜索词表现分组", "value": "Parent ASIN B00K4W4AAA 下的广告用户搜索词表现聚合", "source": "ad_search_term_daily_metrics"},
        {"label": "Parent ASIN入口", "value": "B00K4W4AAA 只作为经营诊断入口，不是人工动作对象", "source": "diagnosis_contract"},
        {"label": "广告 ASIN承接", "value": "当前 Parent 范围有 3 个 ASIN 具备广告证据", "source": "advertised_products"},
        {"label": "广告组合流判断", "value": "已串联广告组、投放商品、投放词、搜索词和广告位边界", "source": "diagnosis_contract"},
        {"label": "同组投放商品表现", "value": "同广告组 B016EXMVZS / B07BS9754Q / B016EXMW02 已回看", "source": "ad_product_daily_metrics"},
        {"label": "逐投放上下文", "value": "RBK004-beach essentials-精准 / 投放词 beach essentials", "source": "ad_search_term_daily_metrics"},
        {"label": "投放词证据", "value": "投放词 beach essentials 具备搜索词承接证据", "source": "ad_search_term_daily_metrics"},
        {"label": "搜索词边界", "value": "beach essentials 只能说明同广告组搜索词上下文", "source": "business_rule"},
        {"label": "广告位边界", "value": "广告组级广告位 0 条；同广告活动广告位 6 条", "source": "ad_placement_daily_metrics"},
        {"label": "ABA 背景", "value": "ABA 排名 208 / 只作站点级市场背景", "source": "ABA导出"},
        {"label": "证据缺口", "value": "缺少搜索词直连广告位和广告组级广告位", "source": "diagnosis_contract"},
        {"label": "需要补证", "value": "需要同周期 ad_placement_daily_metrics 和主推策略确认", "source": "diagnosis_contract"},
        {"label": "动作边界", "value": "只允许记录观察、标记已处理、加入复盘或忽略本次", "source": "business_rule"},
    ]
    saved_action_data = {
        "signal_id": signal_id,
        "action_type": "add_to_review",
        "shop_id": "market:1",
        "market_id": 1,
        "object_type": "search_term",
        "object_id": "search_term:1:beach essentials",
        "object_label": "beach essentials",
        "evidence_snapshot": complete_evidence,
    }

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
                "stable_object_id": "search_term:1:beach essentials",
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
    monkeypatch.setattr(module, "load_manual_actions", lambda market_id=None: [SimpleNamespace(**saved_action_data)])
    monkeypatch.setattr(
        module,
        "build_review_todos",
        lambda market_id=None: [
            SimpleNamespace(**saved_action_data, review_window=review_window)
            for review_window in ("7d", "14d")
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

    labels = [item["label"] for item in payload["evidence_snapshot_preview"]["items"]]
    assert payload["status"] == "post_write_verified"
    assert payload["evidence_snapshot_preview"]["status"] == "saved"
    assert payload["evidence_snapshot_preview"]["item_count"] == len(complete_evidence)
    assert set(SEARCH_TERM_REQUIRED_REVIEW_EVIDENCE_LABELS).issubset(labels)
    assert payload["post_write_checks"]["target_review_todo_count"] == 2
    assert {
        item["review_window"]: item["evidence_snapshot_count"]
        for item in payload["post_write_checks"]["target_review_todo_evidence_snapshot_counts"]
    } == {"7d": len(complete_evidence), "14d": len(complete_evidence)}
    for label in ("同组投放商品表现", "逐投放上下文", "投放词证据", "搜索词边界", "广告位边界"):
        assert label in labels
    assert labels.index("同组投放商品表现") < labels.index("逐投放上下文")
    assert labels.index("逐投放上下文") < labels.index("投放词证据")
    assert labels.index("投放词证据") < labels.index("搜索词边界")
    assert labels.index("搜索词边界") < labels.index("广告位边界")
    assert "不重新生成当前候选证据" in payload["evidence_snapshot_preview"]["boundary"]
    assert payload["blockers"] == []


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
