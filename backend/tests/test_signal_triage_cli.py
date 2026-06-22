import importlib.util
import json
import sys
from pathlib import Path
from types import SimpleNamespace


def load_signal_triage_script():
    project_root = Path(__file__).resolve().parents[2]
    script_path = project_root / "scripts" / "inspect_signal_triage.py"
    spec = importlib.util.spec_from_file_location("inspect_signal_triage_script", script_path)
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules["inspect_signal_triage_script"] = module
    spec.loader.exec_module(module)
    return module


def load_review_readiness_script():
    project_root = Path(__file__).resolve().parents[2]
    script_path = project_root / "scripts" / "inspect_review_readiness.py"
    spec = importlib.util.spec_from_file_location("inspect_review_readiness_script", script_path)
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules["inspect_review_readiness_script"] = module
    spec.loader.exec_module(module)
    return module


def make_candidate(
    signal_id: str,
    *,
    object_type: str,
    signal_category: str,
    priority: str,
    severity: int,
    object_label: str,
) -> dict[str, object]:
    return {
        "signal_id": signal_id,
        "signal_type": "opportunity",
        "signal_category": signal_category,
        "priority": priority,
        "confidence": "medium",
        "severity": severity,
        "shop_id": "market:1",
        "shop_name": "rivbos",
        "market_id": 1,
        "marketplace": "US",
        "object_type": object_type,
        "object_id": f"{signal_id}-snapshot-row",
        "object_label": object_label,
        "asin": object_label if object_type == "advertised_product" else "",
        "msku": "",
        "sku": "",
        "summary": f"{object_label} summary",
        "evidence_count": 3,
        "freshness_status": "api_snapshot",
        "suggested_action": {
            "action_type": "review_candidate",
            "title": "人工复核",
            "description": "人工确认后记录处理结果",
            "requires_manual_confirmation": True,
        },
        "data_sources": [{"source_type": "积加API", "source_table": "snapshot"}],
    }


def test_signal_triage_cli_uses_service_candidate_source(monkeypatch) -> None:
    project_root = Path(__file__).resolve().parents[2]
    sys.path.insert(0, str(project_root / "backend"))
    from app.services import signal_triage as service_signal_triage

    recommended = make_candidate(
        "sig-service-search-term",
        object_type="search_term",
        signal_category="search_term_opportunity",
        priority="P0",
        severity=4,
        object_label="beach essentials",
    )

    def fake_service_candidates(selected_market_id=None, product_scope_id=None):
        return {
            "status": "has_candidates",
            "selected_market_id": selected_market_id,
            "selected_product_scope_id": product_scope_id,
            "signal_row_count": 777,
            "signal_count": 1,
            "candidate_count": 1,
            "excluded_count": 0,
            "excluded_summary": {},
            "snapshot": {"has_snapshot": True, "snapshot_id": "snapshot-service", "status": "success"},
            "candidates": [recommended],
            "candidate_layers": [
                {"layer_id": "search_term_context", "label": "搜索词候选", "count": 1, "top_candidates": [recommended]},
            ],
            "recommended_candidate": recommended,
            "recommendation_reason": "服务层候选口径。",
            "manual_action_preview": {
                "will_write": False,
                "signal_id": "sig-service-search-term",
                "action_type": "add_to_review",
                "object_type": "search_term",
                "object_id": "beach essentials",
                "object_label": "beach essentials",
                "market_id": selected_market_id,
                "review_windows": ["7d", "14d"],
            },
        }

    monkeypatch.setattr(service_signal_triage, "build_review_candidates_payload", fake_service_candidates)
    module = load_signal_triage_script()
    monkeypatch.setattr(
        module,
        "build_review_readiness_payload",
        lambda selected_market_id=None: {
            "status": "not_ready",
            "manual_action_count": 0,
            "review_record_count": 0,
            "ready_count": 0,
            "not_ready_count": 0,
            "manual_action_identity_issue_count": 0,
            "next_action": "暂无 ready 复盘。",
        },
    )
    monkeypatch.setattr(module, "load_manual_actions", lambda signal_id=None, market_id=None: [], raising=False)
    monkeypatch.setattr(module, "build_review_todos", lambda signal_id=None, market_id=None: [], raising=False)

    assert module.build_review_candidates_payload is fake_service_candidates

    payload = module.build_signal_triage_payload(selected_market_id=1, product_scope_id="parent_asin:B00K4W4AAA", top=5)

    assert payload["selected_product_scope_id"] == "parent_asin:B00K4W4AAA"
    assert payload["signal_status"]["candidate_count"] == 1
    assert payload["candidate_layers"][0]["layer_id"] == "search_term_context"
    assert payload["recommended_candidate"]["object_label"] == "beach essentials"


def test_review_readiness_cli_summarizes_saved_review_records_as_rule_feedback(monkeypatch) -> None:
    module = load_review_readiness_script()
    review_records = [
        SimpleNamespace(signal_id="sig-opportunity", result="improved", object_type="advertised_product", object_id="B016EXMVZS", object_label="B016EXMVZS", review_window="7d", review_note="处理有效"),
        SimpleNamespace(signal_id="sig-ad-product", result="no_change", object_type="advertised_product", object_id="B016EXMW02", object_label="B016EXMW02", review_window="14d", review_note="无明显变化"),
        SimpleNamespace(signal_id="sig-search-term", result="worse", object_type="search_term", object_id="12 month sunglasses", object_label="12 month sunglasses", review_window="7d", review_note="建议没有改善"),
    ]

    monkeypatch.setattr(module, "load_manual_actions", lambda market_id=None: [SimpleNamespace(signal_id="sig-ad-product")])
    monkeypatch.setattr(module, "load_review_records", lambda market_id=None: review_records)
    monkeypatch.setattr(module, "load_signal_rows_from_success_snapshots", lambda: [])
    monkeypatch.setattr(module, "build_review_todos", lambda market_id=None: [])
    monkeypatch.setattr(
        module,
        "load_snapshot_status",
        lambda: SimpleNamespace(
            model_dump=lambda mode="json": {
                "has_snapshot": True,
                "snapshot_id": "snapshot-with-review-records",
                "status": "success",
                "start_date": "2026-06-01",
                "end_date": "2026-06-15",
            }
        ),
    )

    payload = module.build_review_readiness_payload(selected_market_id=1)

    assert payload["review_feedback"]["total"] == 3
    assert payload["review_feedback"]["by_result"] == {"improved": 1, "no_change": 1, "worse": 1}
    assert payload["review_feedback"]["by_signal_type"] == {"unknown": 3}
    assert payload["review_feedback"]["sample_sort"]["order"] == ["worse", "no_change", "unclear", "improved"]
    assert "worse 优先" in payload["review_feedback"]["sample_sort"]["reason"]
    assert payload["review_feedback"]["action_boundaries"]["worse"]["allowed_reviews"] == ["复核阈值", "复核证据来源", "复核建议动作"]
    assert "自动改规则" in payload["review_feedback"]["action_boundaries"]["worse"]["forbidden_actions"]
    assert payload["review_feedback"]["records"][0]["result"] == "worse"
    assert payload["review_feedback"]["records"][0]["object_label"] == "12 month sunglasses"
    assert "排序依据：worse 优先" in payload["review_feedback"]["records"][0]["sort_reason"]
    assert payload["review_feedback"]["records"][0]["action_boundary"]["allowed_reviews"] == ["复核阈值", "复核证据来源", "复核建议动作"]
    assert "不自动执行广告动作" in payload["review_feedback"]["records"][0]["action_boundary"]["boundary"]
    assert payload["review_feedback"]["records"][0]["evidence_drilldown"] is None
    assert payload["review_feedback"]["records"][0]["evidence_groups"] == []
    checklist = {item["check_id"]: item for item in payload["review_feedback"]["closure_checklist"]}
    assert checklist["result_distribution"]["status"] == "ready"
    assert "worse 1" in checklist["result_distribution"]["evidence"]
    assert checklist["sample_priority"]["status"] == "ready"
    assert checklist["evidence_trace"]["status"] == "blocked"
    assert "0 / 3" in checklist["evidence_trace"]["evidence"]
    assert checklist["action_boundary"]["status"] == "ready"
    assert "不自动改规则" in checklist["action_boundary"]["evidence"]
    assert "不自动执行广告动作" in checklist["action_boundary"]["evidence"]
    assert "只进入解释层" in payload["review_feedback"]["rule_feedback"]
    assert "不自动调整广告动作或规则" in payload["next_action"]
    assert payload["rule_improvement"]["status"] == "saved_feedback"
    assert payload["rule_improvement"]["can_auto_change_rules"] is False
    assert payload["rule_improvement"]["can_auto_execute_ads"] is False
    assert "只进入解释层" in payload["rule_improvement"]["reason"]


def test_review_readiness_cli_waits_when_review_effects_are_not_due(monkeypatch) -> None:
    module = load_review_readiness_script()
    todos = [
        SimpleNamespace(signal_id="sig-ad-product", action_id="manual-action-fixed", market_id=1, review_window="7d", is_due=False),
        SimpleNamespace(signal_id="sig-ad-product", action_id="manual-action-fixed", market_id=1, review_window="14d", is_due=False),
    ]

    def fake_effect(signal_id, *, review_window, market_id=None, signal_rows=None):
        return SimpleNamespace(
            signal_id=signal_id,
            market_id=market_id,
            review_window=review_window,
            status="not_ready",
            result="unclear",
            message="复盘效果暂不可计算：缺少处理后 7 天快照",
            action_id="manual-action-fixed",
            acted_at="2026-06-15T00:00:00+00:00",
            due_at="2026-06-22T00:00:00+00:00" if review_window == "7d" else "2026-06-29T00:00:00+00:00",
            object_type="advertised_product",
            object_id="B016EXMW02",
            before_start_date="2026-06-08",
            before_end_date="2026-06-14",
            after_start_date=None,
            after_end_date=None,
        )

    monkeypatch.setattr(module, "load_manual_actions", lambda market_id=None: [SimpleNamespace(signal_id="sig-ad-product")])
    monkeypatch.setattr(module, "load_review_records", lambda market_id=None: [])
    monkeypatch.setattr(module, "load_signal_rows_from_success_snapshots", lambda: [{"row_id": "row-1"}])
    monkeypatch.setattr(module, "build_review_todos", lambda market_id=None: todos)
    monkeypatch.setattr(module, "build_review_effect_result", fake_effect)
    monkeypatch.setattr(
        module,
        "load_snapshot_status",
        lambda: SimpleNamespace(
            model_dump=lambda mode="json": {
                "has_snapshot": True,
                "snapshot_id": "snapshot-not-ready",
                "status": "success",
                "start_date": "2026-06-08",
                "end_date": "2026-06-15",
            }
        ),
    )

    payload = module.build_review_readiness_payload(selected_market_id=1)

    assert "复盘窗口尚未到期" in payload["next_action"]
    assert "2026-06-22" in payload["next_action"]
    assert "优先处理数据缺口" not in payload["next_action"]
    assert "缺少处理后" not in payload["next_action"]


def test_review_readiness_cli_points_due_snapshot_gap_to_rate_limit_check(monkeypatch) -> None:
    module = load_review_readiness_script()
    todos = [
        SimpleNamespace(signal_id="sig-ad-product", action_id="manual-action-fixed", market_id=1, review_window="7d", is_due=True),
        SimpleNamespace(signal_id="sig-ad-product", action_id="manual-action-fixed", market_id=1, review_window="14d", is_due=True),
    ]

    def fake_effect(signal_id, *, review_window, market_id=None, signal_rows=None):
        message = "复盘效果暂不可计算：缺少处理后 7 天快照" if review_window == "7d" else "复盘效果暂不可计算：处理前 14 天窗口不足"
        return SimpleNamespace(
            signal_id=signal_id,
            market_id=market_id,
            review_window=review_window,
            status="not_ready",
            result="unclear",
            message=message,
            action_id="manual-action-fixed",
            acted_at="2026-06-15T00:00:00+00:00",
            due_at="2026-06-22T00:00:00+00:00",
            object_type="advertised_product",
            object_id="B016EXMW02",
            before_start_date="2026-06-08",
            before_end_date="2026-06-14",
            after_start_date=None,
            after_end_date=None,
        )

    monkeypatch.setattr(module, "load_manual_actions", lambda market_id=None: [SimpleNamespace(signal_id="sig-ad-product")])
    monkeypatch.setattr(module, "load_review_records", lambda market_id=None: [])
    monkeypatch.setattr(module, "load_signal_rows_from_success_snapshots", lambda: [{"row_id": "row-1"}])
    monkeypatch.setattr(module, "build_review_todos", lambda market_id=None: todos)
    monkeypatch.setattr(module, "build_review_effect_result", fake_effect)
    monkeypatch.setattr(
        module,
        "load_snapshot_status",
        lambda: SimpleNamespace(
            model_dump=lambda mode="json": {
                "has_snapshot": True,
                "snapshot_id": "snapshot-not-ready",
                "status": "success",
                "start_date": "2026-06-08",
                "end_date": "2026-06-22",
            }
        ),
    )

    payload = module.build_review_readiness_payload(selected_market_id=1)

    assert "缺少处理后 7 天快照" in payload["next_action"]
    assert "先查询积加 API 限流规则" in payload["next_action"]
    assert "人工触发低频快照" in payload["next_action"]


def test_signal_triage_summarizes_candidates_and_review_blockers(monkeypatch) -> None:
    module = load_signal_triage_script()
    recommended = make_candidate(
        "sig-ad-product",
        object_type="advertised_product",
        signal_category="advertised_product_opportunity",
        priority="P1",
        severity=3,
        object_label="B016EXMW02",
    )
    candidates_payload = {
        "status": "has_candidates",
        "selected_market_id": 1,
        "selected_product_scope_id": "parent_asin:B00K4W4AAA",
        "signal_row_count": 702,
        "signal_count": 137,
        "candidate_count": 3,
        "excluded_count": 2,
        "excluded_summary": {"cross_object": 2},
        "snapshot": {
            "has_snapshot": True,
            "snapshot_id": "snapshot-30d",
            "status": "success",
            "start_date": "2026-05-17",
            "end_date": "2026-06-15",
        },
        "candidates": [
            recommended,
            make_candidate(
                "sig-search-term",
                object_type="search_term",
                signal_category="search_term_opportunity",
                priority="P0",
                severity=4,
                object_label="kids sunglasses",
            ),
            make_candidate(
                "sig-placement",
                object_type="placement",
                signal_category="placement_efficiency",
                priority="P2",
                severity=2,
                object_label="Top of Search",
            ),
        ],
        "recommended_candidate": recommended,
        "recommendation_reason": "推荐 B016EXMW02：属于 Parent ASIN B00K4W4AAA。",
        "manual_action_preview": {
            "will_write": False,
            "signal_id": "sig-ad-product",
            "action_type": "add_to_review",
            "object_type": "advertised_product",
            "object_id": "B016EXMW02",
            "object_label": "B016EXMW02",
            "market_id": 1,
            "review_windows": ["7d", "14d"],
        },
        "next_action": "从候选中选择一个广告对象，由人工确认后记录人工处理动作；不要自动执行广告动作。",
    }
    readiness_payload = {
        "status": "not_ready",
        "selected_market_id": 1,
        "manual_action_count": 3,
        "review_record_count": 0,
        "signal_row_count": 744,
        "ready_count": 0,
        "not_ready_count": 4,
        "manual_action_identity_issue_count": 0,
        "effects": [],
        "next_action": "当前没有 ready 复盘结果。",
    }

    monkeypatch.setattr(module, "build_review_candidates_payload", lambda selected_market_id=None: candidates_payload)
    monkeypatch.setattr(module, "build_review_readiness_payload", lambda selected_market_id=None: readiness_payload)
    monkeypatch.setattr(module, "load_manual_actions", lambda signal_id=None, market_id=None: [], raising=False)
    monkeypatch.setattr(module, "build_review_todos", lambda signal_id=None, market_id=None: [], raising=False)

    payload = module.build_signal_triage_payload(selected_market_id=1, top=2)

    assert payload["status"] == "ready_for_manual_confirmation"
    assert payload["selected_market_id"] == 1
    assert payload["signal_status"]["signal_count"] == 137
    assert payload["signal_status"]["candidate_count"] == 3
    assert payload["candidate_mix"]["by_object_type"] == {
        "advertised_product": 1,
        "placement": 1,
        "search_term": 1,
    }
    assert payload["candidate_mix"]["by_priority"] == {"P0": 1, "P1": 1, "P2": 1}
    assert payload["recommended_candidate"]["object_label"] == "B016EXMW02"
    assert payload["manual_action_preview"]["will_write"] is False
    assert payload["manual_action_preview"]["object_id"] == "B016EXMW02"
    assert payload["review_status"]["ready_count"] == 0
    assert payload["recommended_manual_status"]["object_id"] == "B016EXMW02"
    assert payload["recommended_manual_status"]["has_manual_action"] is False
    assert payload["recommended_manual_status"]["review_todo_count"] == 0
    assert "加入复盘" in payload["recommended_manual_status"]["next_action"]
    assert [item["signal_id"] for item in payload["top_candidates"]] == ["sig-search-term", "sig-ad-product"]
    assert any(blocker["code"] == "candidate_count_exceeds_top_limit" for blocker in payload["blockers"])
    assert any(blocker["code"] == "no_ready_review_effect" for blocker in payload["blockers"])
    assert "B016EXMW02" in payload["next_action"]
    assert "不要自动执行广告动作" in payload["next_action"]


def test_signal_triage_cli_requires_product_scope_before_actionable_recommendation(monkeypatch) -> None:
    module = load_signal_triage_script()
    recommended = make_candidate(
        "sig-ad-product",
        object_type="advertised_product",
        signal_category="advertised_product_opportunity",
        priority="P1",
        severity=3,
        object_label="B016EXMW02",
    )
    candidates_payload = {
        "status": "has_candidates",
        "selected_market_id": 1,
        "selected_product_scope_id": None,
        "signal_row_count": 702,
        "signal_count": 137,
        "candidate_count": 1,
        "excluded_count": 0,
        "excluded_summary": {},
        "snapshot": {"snapshot_id": "snapshot-30d", "status": "success"},
        "candidates": [recommended],
        "candidate_layers": [
            {"layer_id": "advertised_asin_opportunity", "label": "广告 ASIN 待处理", "count": 1, "top_candidates": [recommended]},
        ],
        "recommended_candidate": recommended,
        "recommendation_reason": "推荐 B016EXMW02：属于 Parent ASIN B00K4W4AAA。",
        "manual_action_preview": {
            "will_write": False,
            "signal_id": "sig-ad-product",
            "action_type": "add_to_review",
            "object_type": "advertised_product",
            "object_id": "B016EXMW02",
            "object_label": "B016EXMW02",
            "market_id": 1,
            "review_windows": ["7d", "14d"],
        },
    }
    readiness_payload = {
        "status": "not_ready",
        "manual_action_count": 0,
        "review_record_count": 0,
        "ready_count": 0,
        "not_ready_count": 0,
        "manual_action_identity_issue_count": 0,
        "effects": [],
    }

    monkeypatch.setattr(module, "build_review_candidates_payload", lambda selected_market_id=None, product_scope_id=None: candidates_payload)
    monkeypatch.setattr(module, "build_review_readiness_payload", lambda selected_market_id=None: readiness_payload)

    payload = module.build_signal_triage_payload(selected_market_id=1, product_scope_id="all", top=5)

    assert payload["status"] == "requires_product_scope"
    assert payload["actionability_status"]["status"] == "requires_product_scope"
    assert payload["actionability_status"]["can_write_manual_action"] is False
    assert payload["product_scope_gate"]["is_actionable"] is False
    assert payload["product_scope_gate"]["candidate_pool_count"] == 1
    assert payload["signal_status"]["candidate_count"] == 0
    assert payload["candidate_layers"] == []
    assert payload["recommended_candidate"] is None
    assert payload["recommended_evidence_drilldown"] is None
    assert payload["manual_action_preview"] is None
    assert payload["next_unhandled_candidate"] is None
    assert payload["top_candidates"] == []
    assert any(blocker["code"] == "product_scope_required" for blocker in payload["blockers"])
    assert "Parent ASIN / ASIN" in payload["next_action"]


def test_signal_triage_cli_treats_sales_asin_as_sales_context_not_actionable_ad_scope(monkeypatch) -> None:
    module = load_signal_triage_script()
    recommended = make_candidate(
        "sig-sales-product",
        object_type="sales_product",
        signal_category="product_ad_coverage",
        priority="P0",
        severity=4,
        object_label="B016EXMW1G",
    )
    candidates_payload = {
        "status": "has_candidates",
        "selected_market_id": 1,
        "selected_product_scope_id": "sales_asin:B016EXMW1G",
        "signal_row_count": 702,
        "signal_count": 1,
        "candidate_count": 1,
        "excluded_count": 0,
        "excluded_summary": {},
        "snapshot": {"snapshot_id": "snapshot-30d", "status": "success"},
        "candidates": [recommended],
        "candidate_layers": [
            {"layer_id": "sales_strong_ad_weak", "label": "销售强广告弱", "count": 1, "top_candidates": [recommended]},
        ],
        "recommended_candidate": recommended,
        "recommendation_reason": "推荐 B016EXMW1G：这是销售覆盖缺口候选。",
        "manual_action_preview": {
            "will_write": False,
            "signal_id": "sig-sales-product",
            "action_type": "add_to_review",
            "object_type": "sales_product",
            "object_id": "B016EXMW1G",
            "object_label": "B016EXMW1G",
            "market_id": 1,
            "review_windows": ["7d", "14d"],
        },
    }
    readiness_payload = {
        "status": "not_ready",
        "manual_action_count": 0,
        "review_record_count": 0,
        "ready_count": 0,
        "not_ready_count": 0,
        "manual_action_identity_issue_count": 0,
        "effects": [],
    }

    monkeypatch.setattr(module, "build_review_candidates_payload", lambda selected_market_id=None, product_scope_id=None: candidates_payload)
    monkeypatch.setattr(module, "build_review_readiness_payload", lambda selected_market_id=None: readiness_payload)

    payload = module.build_signal_triage_payload(selected_market_id=1, product_scope_id="sales_asin:B016EXMW1G", top=5)

    assert payload["status"] == "requires_product_scope"
    assert payload["product_scope_gate"]["is_actionable"] is False
    assert "销售背景" in payload["product_scope_gate"]["message"]
    assert payload["actionability_status"]["can_write_manual_action"] is False
    assert payload["signal_status"]["candidate_count"] == 0
    assert payload["recommended_candidate"] is None
    assert payload["manual_action_preview"] is None


def test_signal_triage_cli_empty_parent_scope_is_diagnosis_only(monkeypatch) -> None:
    module = load_signal_triage_script()
    candidates_payload = {
        "status": "empty",
        "selected_market_id": 1,
        "selected_product_scope_id": "parent_asin:B00K4W4AAA",
        "signal_row_count": 777,
        "signal_count": 0,
        "candidate_count": 0,
        "excluded_count": 0,
        "excluded_summary": {},
        "snapshot": {"snapshot_id": "snapshot-30d", "status": "success"},
        "candidates": [],
        "candidate_layers": [],
        "recommended_candidate": None,
        "recommendation_reason": "no candidate",
        "manual_action_preview": None,
        "product_scope_drilldown": {
            "scope_id": "parent_asin:B00K4W4AAA",
            "scope_type": "parent_asin",
            "status": "ready",
            "advertised_asin_count": 3,
            "items": [],
            "summary": "ad drilldown ready",
            "boundary": "diagnosis only",
        },
    }
    readiness_payload = {
        "status": "not_ready",
        "manual_action_count": 0,
        "review_record_count": 0,
        "ready_count": 0,
        "not_ready_count": 0,
        "manual_action_identity_issue_count": 0,
        "effects": [],
    }

    monkeypatch.setattr(module, "build_review_candidates_payload", lambda selected_market_id=None, product_scope_id=None: candidates_payload)
    monkeypatch.setattr(module, "build_review_readiness_payload", lambda selected_market_id=None: readiness_payload)

    payload = module.build_signal_triage_payload(selected_market_id=1, product_scope_id="parent_asin:B00K4W4AAA", top=5)

    assert payload["status"] == "no_actionable_candidate"
    assert payload["actionability_status"]["status"] == "no_actionable_candidate"
    assert payload["actionability_status"]["can_write_manual_action"] is False
    assert payload["actionability_status"]["diagnosis_mode"] == "product_scope_drilldown"
    assert payload["manual_action_preview"] is None
    assert payload["product_scope_drilldown"]["status"] == "ready"
    assert any(blocker["code"] == "no_review_candidate" for blocker in payload["blockers"])


def test_signal_triage_cli_candidate_summary_exposes_deep_analysis_fields() -> None:
    module = load_signal_triage_script()
    candidate = make_candidate(
        "sig-ad-product",
        object_type="advertised_product",
        signal_category="advertised_product_opportunity",
        priority="P1",
        severity=3,
        object_label="B016EXMW02",
    )

    summary = module._candidate_summary(candidate)

    assert summary["problem_type"] == "机会扩量"
    assert summary["evidence_strength"] == "中"
    assert summary["review_path"] == "待人工动作"
    assert "广告 ASIN" in summary["attribution_boundary"]
    assert "不能自动归因" in summary["attribution_boundary"]


def test_signal_triage_reports_recommended_manual_status_after_action(monkeypatch) -> None:
    module = load_signal_triage_script()
    recommended = make_candidate(
        "sig-ad-product",
        object_type="advertised_product",
        signal_category="advertised_product_opportunity",
        priority="P1",
        severity=3,
        object_label="B016EXMW02",
    )
    monkeypatch.setattr(
        module,
        "build_review_candidates_payload",
        lambda selected_market_id=None: {
            "status": "has_candidates",
            "selected_market_id": 1,
            "selected_product_scope_id": "parent_asin:B00K4W4AAA",
            "signal_row_count": 702,
            "signal_count": 137,
            "candidate_count": 1,
            "excluded_count": 0,
            "excluded_summary": {},
            "snapshot": {"snapshot_id": "snapshot-30d", "status": "success"},
            "candidates": [recommended],
            "recommended_candidate": recommended,
            "recommendation_reason": "推荐 B016EXMW02：属于 Parent ASIN B00K4W4AAA。",
            "manual_action_preview": {
                "will_write": False,
                "signal_id": "sig-ad-product",
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
    )
    monkeypatch.setattr(
        module,
        "build_review_readiness_payload",
        lambda selected_market_id=None: {
            "status": "not_ready",
            "manual_action_count": 4,
            "review_record_count": 0,
            "ready_count": 0,
            "not_ready_count": 6,
            "manual_action_identity_issue_count": 0,
            "effects": [
                {
                    "signal_id": "sig-data-quality",
                    "review_window": "7d",
                    "status": "not_ready",
                    "object_type": "cross",
                    "message": "数据质量信号不适用广告指标前后对比",
                },
                {
                    "signal_id": "sig-ad-product",
                    "review_window": "7d",
                    "status": "not_ready",
                    "object_type": "advertised_product",
                    "message": "缺少处理后 7 天快照",
                },
                {
                    "signal_id": "sig-ad-product",
                    "review_window": "14d",
                    "status": "not_ready",
                    "object_type": "advertised_product",
                    "message": "处理前 14 天窗口不足",
                },
            ],
            "next_action": "当前没有 ready 复盘结果。",
        },
    )
    monkeypatch.setattr(module, "load_manual_actions", lambda signal_id=None, market_id=None: [SimpleNamespace(id="action-1", shop_id="market:1")], raising=False)
    monkeypatch.setattr(
        module,
        "build_review_todos",
        lambda signal_id=None, market_id=None: [
            SimpleNamespace(signal_id="sig-ad-product", shop_id="market:1", review_window="7d"),
            SimpleNamespace(signal_id="sig-ad-product", shop_id="market:1", review_window="14d"),
        ],
        raising=False,
    )

    payload = module.build_signal_triage_payload(selected_market_id=1, top=5)

    status = payload["recommended_manual_status"]
    assert status["has_manual_action"] is True
    assert status["manual_action_count"] == 1
    assert status["has_review_todo"] is True
    assert status["review_todo_count"] == 2
    assert status["ready_review_count"] == 0
    assert "等待 7 天 / 14 天" in status["next_action"]
    assert "等待 7 天 / 14 天" in payload["next_action"]
    assert "优先让运营人工确认" not in payload["next_action"]
    no_ready_blocker = next(blocker for blocker in payload["blockers"] if blocker["code"] == "no_ready_review_effect")
    assert "复盘阻塞：7d：缺少处理后 7 天快照；14d：处理前 14 天窗口不足" in no_ready_blocker["message"]
    assert "7d：缺少处理后 7 天快照" in no_ready_blocker["message"]
    assert "14d：处理前 14 天窗口不足" in no_ready_blocker["message"]
    assert "先查询积加 API 限流规则" in no_ready_blocker["message"]
    assert "人工触发低频快照" in no_ready_blocker["message"]


def test_signal_triage_cli_waits_instead_of_showing_data_gap_when_review_effects_are_not_due(monkeypatch) -> None:
    module = load_signal_triage_script()
    recommended = make_candidate(
        "sig-ad-product",
        object_type="advertised_product",
        signal_category="advertised_product_opportunity",
        priority="P1",
        severity=3,
        object_label="B016EXMW02",
    )
    monkeypatch.setattr(
        module,
        "build_review_candidates_payload",
        lambda selected_market_id=None: {
            "status": "has_candidates",
            "selected_market_id": 1,
            "selected_product_scope_id": "parent_asin:B00K4W4AAA",
            "signal_row_count": 702,
            "signal_count": 137,
            "candidate_count": 1,
            "excluded_count": 0,
            "excluded_summary": {},
            "snapshot": {"snapshot_id": "snapshot-30d", "status": "success"},
            "candidates": [recommended],
            "recommended_candidate": recommended,
            "recommendation_reason": "推荐 B016EXMW02：属于 Parent ASIN B00K4W4AAA。",
            "manual_action_preview": {
                "will_write": False,
                "signal_id": "sig-ad-product",
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
    )
    monkeypatch.setattr(
        module,
        "build_review_readiness_payload",
        lambda selected_market_id=None: {
            "status": "not_ready",
            "manual_action_count": 1,
            "review_record_count": 0,
            "ready_count": 0,
            "not_ready_count": 2,
            "manual_action_identity_issue_count": 0,
            "effects": [
                {
                    "signal_id": "sig-ad-product",
                    "review_window": "7d",
                    "status": "not_ready",
                    "object_type": "advertised_product",
                    "message": "复盘效果暂不可计算：缺少处理后 7 天快照",
                    "is_due": False,
                    "due_at": "2026-06-22T00:00:00+00:00",
                },
                {
                    "signal_id": "sig-ad-product",
                    "review_window": "14d",
                    "status": "not_ready",
                    "object_type": "advertised_product",
                    "message": "复盘效果暂不可计算：缺少处理后 14 天快照",
                    "is_due": False,
                    "due_at": "2026-06-29T00:00:00+00:00",
                },
            ],
            "next_action": "复盘窗口尚未到期。",
        },
    )
    monkeypatch.setattr(module, "load_manual_actions", lambda signal_id=None, market_id=None: [SimpleNamespace(id="action-1")], raising=False)
    monkeypatch.setattr(
        module,
        "build_review_todos",
        lambda signal_id=None, market_id=None: [
            SimpleNamespace(signal_id="sig-ad-product", review_window="7d"),
            SimpleNamespace(signal_id="sig-ad-product", review_window="14d"),
        ],
        raising=False,
    )

    payload = module.build_signal_triage_payload(selected_market_id=1, top=5)

    no_ready_blocker = next(blocker for blocker in payload["blockers"] if blocker["code"] == "no_ready_review_effect")
    assert "复盘窗口尚未到期" in no_ready_blocker["message"]
    assert "2026-06-22" in no_ready_blocker["message"]
    assert "复盘阻塞" not in no_ready_blocker["message"]
    assert "缺少处理后" not in no_ready_blocker["message"]


def test_signal_triage_cli_review_wait_ignores_cross_todos_for_metric_window() -> None:
    module = load_signal_triage_script()
    readiness_payload = {
        "manual_action_count": 1,
        "review_record_count": 0,
        "ready_count": 0,
        "manual_action_identity_issue_count": 0,
        "effects": [
            {
                "signal_id": "sig-aba-stale",
                "review_window": "7d",
                "status": "not_ready",
                "object_type": "cross",
                "object_id": "aba:US:2026-05-10:2026-05-16",
                "object_label": "ABA 搜索词数据",
                "message": "ABA 搜索词数据过期，不适合作为广告处理后指标复盘。",
                "is_due": False,
                "due_at": "2026-06-21T00:00:00+00:00",
            },
            {
                "signal_id": "sig-ad-product",
                "review_window": "7d",
                "status": "not_ready",
                "object_type": "advertised_product",
                "object_id": "B016EXMW02",
                "object_label": "B016EXMW02",
                "message": "复盘窗口尚未到期。",
                "is_due": False,
                "due_at": "2026-06-22T00:00:00+00:00",
            },
        ],
    }

    blockers = module._blockers(
        candidate_count=1,
        top_limit=5,
        manual_preview={"signal_id": "sig-ad-product"},
        readiness_payload=readiness_payload,
    )

    no_ready_blocker = next(blocker for blocker in blockers if blocker["code"] == "no_ready_review_effect")
    assert "2026-06-22" in no_ready_blocker["message"]
    assert "2026-06-21" not in no_ready_blocker["message"]
    assert "ABA 搜索词数据" not in no_ready_blocker["message"]


def test_signal_triage_cli_matches_recommended_manual_status_by_stable_object(monkeypatch) -> None:
    module = load_signal_triage_script()
    current_signal_id = "sig-ad-product-current"
    previous_signal_id = "sig-ad-product-previous"
    recommended = make_candidate(
        current_signal_id,
        object_type="advertised_product",
        signal_category="advertised_product_opportunity",
        priority="P1",
        severity=3,
        object_label="B016EXMW02",
    )
    monkeypatch.setattr(
        module,
        "build_review_candidates_payload",
        lambda selected_market_id=None: {
            "status": "has_candidates",
            "selected_market_id": 1,
            "selected_product_scope_id": "parent_asin:B00K4W4AAA",
            "signal_row_count": 702,
            "signal_count": 137,
            "candidate_count": 1,
            "excluded_count": 0,
            "excluded_summary": {},
            "snapshot": {"snapshot_id": "snapshot-current", "status": "success"},
            "candidates": [recommended],
            "recommended_candidate": recommended,
            "recommendation_reason": "推荐 B016EXMW02：属于 Parent ASIN B00K4W4AAA。",
            "manual_action_preview": {
                "will_write": False,
                "signal_id": current_signal_id,
                "action_type": "add_to_review",
                "object_type": "advertised_product",
                "object_id": "B016EXMW02",
                "object_label": "B016EXMW02",
                "market_id": 1,
                "review_windows": ["7d", "14d"],
            },
        },
    )
    monkeypatch.setattr(
        module,
        "build_review_readiness_payload",
        lambda selected_market_id=None: {
            "status": "not_ready",
            "manual_action_count": 1,
            "review_record_count": 1,
            "ready_count": 0,
            "not_ready_count": 2,
            "manual_action_identity_issue_count": 0,
            "review_feedback": {
                "total": 1,
                "by_result": {"worse": 1},
                "summary": "已保存 1 条复盘记录：worse 1。",
                "rule_feedback": "复盘反馈只进入解释层，不自动调整广告动作或规则。",
            },
            "rule_improvement": {
                "status": "saved_feedback",
                "can_auto_change_rules": False,
                "can_auto_execute_ads": False,
            },
            "effects": [
                {
                    "signal_id": previous_signal_id,
                    "shop_id": "market:1",
                    "market_id": 1,
                    "object_type": "advertised_product",
                    "object_id": "B016EXMW02",
                    "review_window": "7d",
                    "status": "not_ready",
                    "message": "缺少处理后 7 天快照",
                }
            ],
            "next_action": "当前没有 ready 复盘结果。",
        },
    )

    def fake_manual_actions(signal_id=None, market_id=None):
        if signal_id == current_signal_id:
            return []
        return [
            SimpleNamespace(
                signal_id=previous_signal_id,
                shop_id="market:1",
                market_id=1,
                object_type="advertised_product",
                object_id="B016EXMW02",
            )
        ]

    def fake_review_todos(signal_id=None, market_id=None):
        if signal_id == current_signal_id:
            return []
        return [
            SimpleNamespace(
                signal_id=previous_signal_id,
                shop_id="market:1",
                market_id=1,
                object_type="advertised_product",
                object_id="B016EXMW02",
                review_window="7d",
            ),
            SimpleNamespace(
                signal_id=previous_signal_id,
                shop_id="market:1",
                market_id=1,
                object_type="advertised_product",
                object_id="B016EXMW02",
                review_window="14d",
            ),
        ]

    monkeypatch.setattr(module, "load_manual_actions", fake_manual_actions, raising=False)
    monkeypatch.setattr(module, "build_review_todos", fake_review_todos, raising=False)

    payload = module.build_signal_triage_payload(selected_market_id=1, top=5)

    status = payload["recommended_manual_status"]
    assert status["signal_id"] == current_signal_id
    assert status["object_id"] == "B016EXMW02"
    assert status["has_manual_action"] is True
    assert status["manual_action_count"] == 1
    assert status["has_review_todo"] is True
    assert status["review_todo_count"] == 2
    assert status["review_windows"] == ["14d", "7d"]
    assert payload["review_status"]["review_feedback"]["by_result"] == {"worse": 1}
    assert "不自动" in payload["review_status"]["review_feedback"]["rule_feedback"]
    assert payload["review_status"]["rule_improvement"]["status"] == "saved_feedback"
    assert payload["review_status"]["rule_improvement"]["can_auto_change_rules"] is False
    assert "等待 7 天 / 14 天" in status["next_action"]
    assert "等待 7 天 / 14 天" in payload["next_action"]
    assert "优先让运营人工确认" not in payload["next_action"]


def test_signal_triage_cli_does_not_match_recommended_manual_status_from_wrong_shop(monkeypatch) -> None:
    module = load_signal_triage_script()
    current_signal_id = "sig-ad-product-current-shop"
    previous_signal_id = "sig-ad-product-other-shop"
    recommended = make_candidate(
        current_signal_id,
        object_type="advertised_product",
        signal_category="advertised_product_opportunity",
        priority="P1",
        severity=3,
        object_label="B016EXMW02",
    )
    monkeypatch.setattr(
        module,
        "build_review_candidates_payload",
        lambda selected_market_id=None: {
            "status": "has_candidates",
            "selected_market_id": 1,
            "selected_product_scope_id": "parent_asin:B00K4W4AAA",
            "signal_row_count": 702,
            "signal_count": 137,
            "candidate_count": 1,
            "excluded_count": 0,
            "excluded_summary": {},
            "snapshot": {"snapshot_id": "snapshot-current", "status": "success"},
            "candidates": [recommended],
            "recommended_candidate": recommended,
            "recommendation_reason": "推荐 B016EXMW02：属于 Parent ASIN B00K4W4AAA。",
            "manual_action_preview": {
                "will_write": False,
                "signal_id": current_signal_id,
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
    )
    monkeypatch.setattr(
        module,
        "build_review_readiness_payload",
        lambda selected_market_id=None: {
            "status": "not_ready",
            "manual_action_count": 1,
            "review_record_count": 0,
            "ready_count": 1,
            "not_ready_count": 0,
            "manual_action_identity_issue_count": 0,
            "effects": [
                {
                    "signal_id": previous_signal_id,
                    "shop_id": "market:2",
                    "market_id": 1,
                    "object_type": "advertised_product",
                    "object_id": "B016EXMW02",
                    "review_window": "7d",
                    "status": "ready",
                }
            ],
            "next_action": "当前有 ready 复盘结果。",
        },
    )

    def fake_manual_actions(signal_id=None, market_id=None):
        if signal_id == current_signal_id:
            return []
        return [
            SimpleNamespace(
                signal_id=previous_signal_id,
                shop_id="market:2",
                market_id=1,
                object_type="advertised_product",
                object_id="B016EXMW02",
            )
        ]

    def fake_review_todos(signal_id=None, market_id=None):
        if signal_id == current_signal_id:
            return []
        return [
            SimpleNamespace(
                signal_id=previous_signal_id,
                shop_id="market:2",
                market_id=1,
                object_type="advertised_product",
                object_id="B016EXMW02",
                review_window="7d",
            )
        ]

    monkeypatch.setattr(module, "load_manual_actions", fake_manual_actions, raising=False)
    monkeypatch.setattr(module, "build_review_todos", fake_review_todos, raising=False)

    payload = module.build_signal_triage_payload(selected_market_id=1, top=5)

    status = payload["recommended_manual_status"]
    assert status["shop_id"] == "market:1"
    assert status["has_manual_action"] is False
    assert status["manual_action_count"] == 0
    assert status["has_review_todo"] is False
    assert status["review_todo_count"] == 0
    assert status["ready_review_count"] == 0
    assert "加入复盘" in status["next_action"]
    assert "优先让运营人工确认" in payload["next_action"]


def test_signal_triage_cli_points_to_next_unhandled_candidate_when_recommended_is_waiting(monkeypatch) -> None:
    module = load_signal_triage_script()
    handled = make_candidate(
        "sig-handled",
        object_type="advertised_product",
        signal_category="advertised_product_opportunity",
        priority="P1",
        severity=3,
        object_label="B016EXMW02",
    )
    unhandled = make_candidate(
        "sig-unhandled",
        object_type="sales_product",
        signal_category="advertised_product_opportunity",
        priority="P1",
        severity=3,
        object_label="RBK004-RBK004-2 深蓝",
    )
    unhandled["asin"] = "B06VW5SQ97"
    unhandled["evidence_drilldown"] = {
        "object_label": "RBK004-RBK004-2 深蓝",
        "object_type": "sales_product",
        "direct_ad_product_row_count": 0,
        "search_term_context_count": 0,
        "placement_context_count": 0,
        "campaigns": [],
        "ad_groups": [],
        "metric_summary": {"basis": "sales_product_daily_metrics", "row_count": 1, "orders": 251, "sales": 2433.04},
        "sales_product_summary": {"basis": "sales_product_daily_metrics", "orders": 251, "ad_orders": 18},
        "ad_product_rows": [],
        "boundary": "销售商品强不等于可自动加投；广告承接必须结合广告 ASIN、库存、价格和策略人工复核。",
        "summary": "销售商品证据：订单 251；广告订单 18；该对象应先人工复核广告承接，不自动执行广告动作。",
    }
    monkeypatch.setattr(
        module,
        "build_review_candidates_payload",
        lambda selected_market_id=None: {
            "status": "has_candidates",
            "selected_market_id": 1,
            "selected_product_scope_id": "parent_asin:B00K4W4AAA",
            "signal_row_count": 702,
            "signal_count": 137,
            "candidate_count": 2,
            "excluded_count": 0,
            "excluded_summary": {},
            "snapshot": {"snapshot_id": "snapshot-current", "status": "success"},
            "candidates": [handled, unhandled],
            "recommended_candidate": handled,
            "recommendation_reason": "推荐 B016EXMW02：属于 Parent ASIN B00K4W4AAA。",
            "manual_action_preview": {
                "will_write": False,
                "signal_id": "sig-handled",
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
    )
    monkeypatch.setattr(
        module,
        "build_review_readiness_payload",
        lambda selected_market_id=None: {
            "status": "not_ready",
            "manual_action_count": 1,
            "review_record_count": 0,
            "ready_count": 0,
            "not_ready_count": 2,
            "manual_action_identity_issue_count": 0,
            "review_feedback": {"total": 0, "by_result": {}, "summary": "暂无已保存复盘记录。"},
            "effects": [
                {
                        "signal_id": "sig-old-handled",
                        "shop_id": "market:1",
                        "market_id": 1,
                        "object_type": "advertised_product",
                    "object_id": "B016EXMW02",
                    "review_window": "7d",
                    "status": "not_ready",
                    "message": "复盘窗口尚未到期",
                }
            ],
            "next_action": "复盘窗口尚未到期。",
        },
    )

    def fake_manual_actions(signal_id=None, market_id=None):
        if signal_id == "sig-unhandled":
            return []
        return [
            SimpleNamespace(
                signal_id="sig-old-handled",
                shop_id="market:1",
                market_id=1,
                object_type="advertised_product",
                object_id="B016EXMW02",
            )
        ]

    monkeypatch.setattr(module, "load_manual_actions", fake_manual_actions, raising=False)
    monkeypatch.setattr(
        module,
        "build_review_todos",
        lambda signal_id=None, market_id=None: [
            SimpleNamespace(signal_id="sig-old-handled", shop_id="market:1", market_id=1, object_type="advertised_product", object_id="B016EXMW02", review_window="7d")
        ],
        raising=False,
    )
    monkeypatch.setattr(
        module,
        "load_signal_rows_from_latest_snapshot",
        lambda: [
            {
                "source_table": "sales_product_daily_metrics",
                "parent_asin": "B00K4W4AAA",
                "asin": "B016EXMVZS",
                "product_name": "粉",
                "orders": 6689,
                "sales": 67673.70,
                "ad_orders": 3805,
                "ad_sales": 39175.55,
            },
            {
                "source_table": "sales_product_daily_metrics",
                "parent_asin": "B00K4W4AAA",
                "asin": "B09BQRQ5DT",
                "product_name": "浅粉",
                "orders": 500,
                "sales": 4995.00,
                "ad_orders": 4,
                "ad_sales": 39.96,
            },
            {
                "source_table": "sales_product_daily_metrics",
                "parent_asin": "B00K4W4AAA",
                "asin": "B09BQRQ5DT",
                "product_name": "浅粉",
                "orders": 1,
                "sales": 9.99,
                "ad_orders": 0,
                "ad_sales": 0.28,
            },
            {
                "source_table": "sales_product_daily_metrics",
                "parent_asin": "B00K4W4AAA",
                "asin": "B06VW5SQ97",
                "product_name": "RBK004-RBK004-2 深蓝",
                "orders": 251,
                "sales": 2433.04,
                "ad_orders": 18,
                "ad_sales": 170.76,
            },
            {
                "source_table": "advertised_products",
                "asin": "B016EXMVZS",
                "campaign_name": "RBK004-AUTO",
                "ad_group_name": "RBK004-Auto",
                "cost": 30.00,
                "clicks": 40,
                "orders": 6,
                "sales": 60.00,
            },
            {
                "source_table": "advertised_products",
                "asin": "B09BQRQ5DT",
                "campaign_name": "RBK004-MANUAL",
                "ad_group_name": "RBK004-Exact",
                "cost": 10.00,
                "clicks": 12,
                "orders": 1,
                "sales": 9.99,
            },
        ],
        raising=False,
    )

    payload = module.build_signal_triage_payload(selected_market_id=1, top=5)

    assert payload["recommended_manual_status"]["has_manual_action"] is True
    assert payload["manual_action_preview"]["object_id"] == "B06VW5SQ97"
    preview_checks = {
        item["check_id"]: item
        for item in payload["manual_action_preview"]["preflight_checklist"]
    }
    assert preview_checks["target_identity"]["label"] == "确认复盘对象"
    assert "sales_product / B06VW5SQ97" in preview_checks["target_identity"]["evidence"]
    assert preview_checks["ad_product_coverage"]["label"] == "核对广告 ASIN 覆盖"
    assert payload["next_unhandled_candidate"]["object_label"] == "RBK004-RBK004-2 深蓝"
    assert payload["next_unhandled_candidate"]["stable_object_id"] == "B06VW5SQ97"
    assert payload["next_unhandled_candidate"]["manual_action_preview"]["object_id"] == "B06VW5SQ97"
    assert payload["next_unhandled_evidence_drilldown"]["object_label"] == "RBK004-RBK004-2 深蓝"
    assert payload["next_unhandled_evidence_drilldown"]["sibling_comparison"]["sibling_asin_count"] == 3
    assert payload["next_unhandled_evidence_drilldown"]["sibling_comparison"]["target_order_rank"] == 3
    assert payload["next_unhandled_evidence_drilldown"]["ad_product_coverage"]["target_direct_ad_product_row_count"] == 0
    assert payload["next_unhandled_evidence_drilldown"]["ad_product_coverage"]["parent_advertised_asin_count"] == 2
    assert "订单 251" in payload["next_unhandled_evidence_drilldown"]["summary"]
    assert "不自动执行广告动作" in payload["next_unhandled_evidence_drilldown"]["summary"]
    assert "RBK004-RBK004-2 深蓝" in payload["next_action"]
    assert "下一个未留痕候选" in payload["next_action"]
    assert "不要自动执行广告动作" in payload["next_action"]


def test_signal_triage_cli_main_accepts_market_id_top_and_product_scope(monkeypatch, capsys) -> None:
    module = load_signal_triage_script()
    captured: dict[str, object] = {}

    def fake_payload(*, selected_market_id=None, top=5, product_scope_id=None):
        captured["selected_market_id"] = selected_market_id
        captured["top"] = top
        captured["product_scope_id"] = product_scope_id
        return {"status": "empty", "top_candidates": []}

    monkeypatch.setattr(module, "build_signal_triage_payload", fake_payload)
    monkeypatch.setattr(
        sys,
        "argv",
        ["inspect_signal_triage.py", "--market-id", "2", "--top", "3", "--product-scope-id", "parent_asin:B00K4W4AAA"],
    )

    module.main()

    assert captured["selected_market_id"] == 2
    assert captured["top"] == 3
    assert captured["product_scope_id"] == "parent_asin:B00K4W4AAA"
    assert json.loads(capsys.readouterr().out)["status"] == "empty"
