import importlib.util
import json
import sys
from pathlib import Path
from types import SimpleNamespace


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


def test_review_readiness_reports_no_manual_actions(monkeypatch) -> None:
    module = load_review_readiness_script()

    monkeypatch.setattr(module, "load_manual_actions", lambda market_id=None: [])
    monkeypatch.setattr(module, "load_review_records", lambda market_id=None: [])
    monkeypatch.setattr(module, "load_signal_rows_from_success_snapshots", lambda: [])
    monkeypatch.setattr(module, "build_review_todos", lambda market_id=None: [])
    monkeypatch.setattr(
        module,
        "load_snapshot_status",
        lambda: SimpleNamespace(
            model_dump=lambda mode="json": {
                "has_snapshot": False,
                "snapshot_id": None,
                "status": "missing",
                "start_date": None,
                "end_date": None,
            }
        ),
    )

    payload = module.build_review_readiness_payload()

    assert payload["status"] == "not_ready"
    assert payload["manual_action_count"] == 0
    assert payload["ready_count"] == 0
    assert payload["effects"] == []
    assert "先记录人工动作" in payload["next_action"]


def test_review_readiness_reports_ready_effect(monkeypatch) -> None:
    module = load_review_readiness_script()
    todo = SimpleNamespace(signal_id="sig-ready", market_id=1, review_window="7d", is_due=True)
    effect = SimpleNamespace(
        signal_id="sig-ready",
        action_id="manual-action-ready",
        action_type="handled",
        shop_id="shop-rivbos",
        market_id=1,
        review_window="7d",
        status="ready",
        result="improved",
        message="处理后 7 天订单改善，ACOS 下降",
        acted_at="2026-06-08T00:00:00+00:00",
        due_at="2026-06-15T00:00:00+00:00",
        object_type="search_term",
        object_id="kids sunglasses",
        object_label="kids sunglasses",
        before_start_date="2026-06-01",
        before_end_date="2026-06-07",
        after_start_date="2026-06-09",
        after_end_date="2026-06-15",
        model_dump=lambda mode="json": {},
    )

    monkeypatch.setattr(module, "load_manual_actions", lambda market_id=None: [SimpleNamespace(signal_id="sig-ready")])
    monkeypatch.setattr(module, "load_review_records", lambda market_id=None: [])
    monkeypatch.setattr(module, "load_signal_rows_from_success_snapshots", lambda: [{"row_id": "row-1"}])
    monkeypatch.setattr(module, "build_review_todos", lambda market_id=None: [todo])
    monkeypatch.setattr(module, "build_review_effect_result", lambda *args, **kwargs: effect)
    monkeypatch.setattr(
        module,
        "load_snapshot_status",
        lambda: SimpleNamespace(
            model_dump=lambda mode="json": {
                "has_snapshot": True,
                "snapshot_id": "snapshot-ready",
                "status": "success",
                "start_date": "2026-06-01",
                "end_date": "2026-06-15",
            }
        ),
    )

    payload = module.build_review_readiness_payload(selected_market_id=1)

    assert payload["status"] == "ready"
    assert payload["ready_count"] == 1
    assert payload["effects"][0]["signal_id"] == "sig-ready"
    assert payload["effects"][0]["action_id"] == "manual-action-ready"
    assert payload["effects"][0]["action_type"] == "handled"
    assert payload["effects"][0]["shop_id"] == "shop-rivbos"
    assert payload["effects"][0]["status"] == "ready"
    assert payload["effects"][0]["is_due"] is True
    assert payload["effects"][0]["object_label"] == "kids sunglasses"
    assert "可以保存复盘记录" in payload["next_action"]


def test_review_readiness_script_feedback_checks_review_record_trace() -> None:
    module = load_review_readiness_script()
    feedback = module.review_feedback_summary(
        [
            SimpleNamespace(
                id="review-record-worse-7d",
                signal_id="sig-anomaly",
                action_id="manual-action-worse",
                result="worse",
                object_type="advertised_product",
                object_id="B016EXMW02",
                object_label="B016EXMW02",
                review_window="7d",
                before_start_date="2026-06-01",
                before_end_date="2026-06-07",
                after_start_date="2026-06-08",
                after_end_date="2026-06-14",
                evidence_snapshot=[
                    SimpleNamespace(
                        label="排查路径",
                        value="Parent 经营盘子 -> 广告 ASIN -> 广告组 -> 投放词 / 搜索词 / 广告位",
                        detail="保存复盘前必须回看原始广告诊断路径。",
                        source="business_rule",
                    ),
                    SimpleNamespace(
                        label="AI 准入",
                        value="可进入人工确认 / ready_for_manual_confirmation / 候选 1 个 / 允许人工留痕",
                        detail="准入只证明允许人工留痕，不代表系统会自动执行广告动作。",
                        source="actionability_status",
                    ),
                ],
            ),
            SimpleNamespace(
                signal_id="sig-opportunity",
                result="improved",
                object_type="advertised_product",
                object_id="B016EXMVZS",
                object_label="B016EXMVZS",
                review_window="14d",
            ),
        ]
    )

    checklist = {item["check_id"]: item for item in feedback["closure_checklist"]}
    assert checklist["review_record_trace"]["status"] == "partial"
    assert "1 / 2" in checklist["review_record_trace"]["evidence"]
    assert "review_record_id / action_id / 指标窗口" in checklist["review_record_trace"]["evidence"]
    assert checklist["review_record_evidence_snapshot"]["status"] == "partial"
    assert "1 / 2 条样本带保存快照" in checklist["review_record_evidence_snapshot"]["evidence"]
    assert "1 / 2 条可回看 AI 准入" in checklist["review_record_evidence_snapshot"]["evidence"]
    assert feedback["records"][0]["review_record_id"] == "review-record-worse-7d"
    assert feedback["records"][0]["action_id"] == "manual-action-worse"
    assert feedback["records"][0]["evidence_snapshot_count"] == 2
    assert feedback["records"][0]["diagnosis_snapshot"]["label"] == "排查路径"
    assert feedback["records"][0]["ai_admission_snapshot"]["label"] == "AI 准入"
    assert feedback["records"][0]["metric_window"] == {
        "before": "2026-06-01 至 2026-06-07",
        "after": "2026-06-08 至 2026-06-14",
    }


def test_review_readiness_reports_manual_action_identity_issue(monkeypatch) -> None:
    module = load_review_readiness_script()
    manual_action = SimpleNamespace(
        id="manual-action-old-ad-product",
        signal_id="sig-ad-product-old",
        market_id=1,
        object_type="advertised_product",
        object_id="snapshot-1:ad-product:1:173873141224215",
        object_label="B016EXMVZS",
    )
    signal_row = {
        "row_id": "snapshot-1:ad-product:1:173873141224215",
        "object_type": "advertised_product",
        "asin": "B016EXMVZS",
        "msku": "004-Wayfarer Pink",
        "sku": "",
    }

    monkeypatch.setattr(module, "load_manual_actions", lambda market_id=None: [manual_action])
    monkeypatch.setattr(module, "load_review_records", lambda market_id=None: [])
    monkeypatch.setattr(module, "load_signal_rows_from_success_snapshots", lambda: [signal_row])
    monkeypatch.setattr(module, "build_review_todos", lambda market_id=None: [])
    monkeypatch.setattr(
        module,
        "load_snapshot_status",
        lambda: SimpleNamespace(
            model_dump=lambda mode="json": {
                "has_snapshot": True,
                "snapshot_id": "snapshot-1",
                "status": "success",
                "start_date": "2026-06-08",
                "end_date": "2026-06-14",
            }
        ),
    )

    payload = module.build_review_readiness_payload(selected_market_id=1)

    assert payload["manual_action_identity_issue_count"] == 1
    issue = payload["manual_action_identity_issues"][0]
    assert issue["will_write"] is False
    assert issue["action_id"] == "manual-action-old-ad-product"
    assert issue["object_type"] == "advertised_product"
    assert issue["current_object_id"] == "snapshot-1:ad-product:1:173873141224215"
    assert issue["suggested_object_id"] == "B016EXMVZS"
    assert "只读诊断" in issue["note"]
    assert "历史人工动作" in payload["next_action"]


def test_review_readiness_prioritizes_actionable_ad_product_gap(monkeypatch) -> None:
    module = load_review_readiness_script()
    todos = [
        SimpleNamespace(signal_id="sig-data-quality", market_id=1, review_window="7d", is_due=True),
        SimpleNamespace(signal_id="sig-ad-product", market_id=1, review_window="7d", is_due=True),
        SimpleNamespace(signal_id="sig-ad-product", market_id=1, review_window="14d", is_due=True),
    ]

    def fake_effect(signal_id, *, review_window, market_id=None, signal_rows=None):
        if signal_id == "sig-data-quality":
            return SimpleNamespace(
                signal_id=signal_id,
                action_id="manual-action-data-quality",
                market_id=market_id,
                review_window=review_window,
                status="not_ready",
                result="unclear",
                message="复盘效果暂不可计算：数据质量或交叉信号不适用广告指标前后对比，请复查数据是否补齐或更新",
                acted_at="2026-06-14T00:00:00+00:00",
                due_at="2026-06-21T00:00:00+00:00",
                object_type="cross",
                object_id="aba_search_term_snapshot",
                before_start_date=None,
                before_end_date=None,
                after_start_date=None,
                after_end_date=None,
            )
        message = "复盘效果暂不可计算：缺少处理后 7 天快照" if review_window == "7d" else "复盘效果暂不可计算：处理前 14 天窗口不足"
        return SimpleNamespace(
            signal_id=signal_id,
            action_id="manual-action-ad-product",
            market_id=market_id,
            review_window=review_window,
            status="not_ready",
            result="unclear",
            message=message,
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
                "end_date": "2026-06-15",
            }
        ),
    )

    payload = module.build_review_readiness_payload(selected_market_id=1)
    next_action = payload["next_action"]

    assert "缺少处理后 7 天快照" in next_action
    assert next_action.index("缺少处理后 7 天快照") < next_action.index("处理前 14 天窗口不足")
    assert next_action.index("处理前 14 天窗口不足") < next_action.index("数据质量或交叉信号")


def test_review_readiness_cli_reports_wait_summary_when_effects_are_not_due(monkeypatch) -> None:
    module = load_review_readiness_script()
    todos = [
        SimpleNamespace(signal_id="sig-ad-product", market_id=1, review_window="7d", is_due=False),
        SimpleNamespace(signal_id="sig-ad-product", market_id=1, review_window="14d", is_due=False),
    ]

    def fake_effect(signal_id, *, review_window, market_id=None, signal_rows=None):
        return SimpleNamespace(
            signal_id=signal_id,
            action_id="manual-action-ad-product",
            action_type="add_to_review",
            shop_id="market:1",
            market_id=market_id,
            review_window=review_window,
            status="not_ready",
            result="unclear",
            message=f"复盘效果暂不可计算：缺少处理后 {review_window} 快照",
            acted_at="2026-06-15T00:00:00+00:00",
            due_at="2026-06-22T00:00:00+00:00" if review_window == "7d" else "2026-06-29T00:00:00+00:00",
            object_type="advertised_product",
            object_id="B016EXMW02",
            object_label="B016EXMW02",
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
    wait_summary = payload["review_wait_summary"]

    assert wait_summary["status"] == "waiting_review_window"
    assert wait_summary["ready_count"] == 0
    assert wait_summary["not_ready_count"] == 2
    assert wait_summary["earliest_due_date"] == "2026-06-22"
    assert wait_summary["review_windows"] == ["7 天", "14 天"]
    assert wait_summary["next_object_id"] == "B016EXMW02"
    assert "不拉取快照" in wait_summary["forbidden_actions"]
    assert "不保存复盘结论" in wait_summary["forbidden_actions"]


def test_review_readiness_reports_identity_audit_for_readback_keys(monkeypatch) -> None:
    module = load_review_readiness_script()
    evidence_snapshot = [
        SimpleNamespace(label="排查路径", value="Parent ASIN -> 广告 ASIN"),
        SimpleNamespace(label="AI 准入", value="ready_for_manual_confirmation"),
        SimpleNamespace(label="搜索词边界", value="搜索词只说明同广告组上下文"),
        SimpleNamespace(label="广告位边界", value="广告位证据缺口不能自动归因"),
    ]
    todos = [
        SimpleNamespace(signal_id="sig-ad-product", market_id=1, review_window="7d", is_due=False, evidence_snapshot=evidence_snapshot),
        SimpleNamespace(signal_id="sig-ad-product", market_id=1, review_window="14d", is_due=False, evidence_snapshot=evidence_snapshot),
    ]

    def fake_effect(signal_id, *, review_window, market_id=None, signal_rows=None):
        return SimpleNamespace(
            signal_id=signal_id,
            action_id="manual-action-ad-product",
            action_type="add_to_review",
            shop_id="market:1",
            market_id=market_id,
            review_window=review_window,
            status="not_ready",
            result="unclear",
            message=f"复盘效果暂不可计算：{review_window} 复盘窗口尚未到期",
            acted_at="2026-06-15T00:00:00+00:00",
            due_at="2026-06-22T00:00:00+00:00" if review_window == "7d" else "2026-06-29T00:00:00+00:00",
            object_type="advertised_product",
            object_id="B016EXMW02",
            object_label="B016EXMW02",
            before_start_date=None,
            before_end_date=None,
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
    audit = payload["review_identity_audit"]

    assert audit["status"] == "ready_for_readback"
    assert audit["manual_action_count"] == 1
    assert audit["review_record_count"] == 0
    assert audit["effect_count"] == 2
    assert audit["missing_action_id_count"] == 0
    assert audit["missing_object_id_count"] == 0
    assert audit["missing_review_window_count"] == 0
    assert audit["unstable_object_id_count"] == 0
    assert audit["ready_review_count"] == 0
    assert audit["can_save_review_records_now"] is False
    assert audit["earliest_due_date"] == "2026-06-22"
    assert audit["issues"] == []
    assert audit["readback_keys"][0] == {
        "signal_id": "sig-ad-product",
        "action_id": "manual-action-ad-product",
        "object_type": "advertised_product",
        "object_id": "B016EXMW02",
        "object_label": "B016EXMW02",
        "review_window": "7d",
        "status": "not_ready",
        "is_due": False,
        "due_at": "2026-06-22T00:00:00+00:00",
        "evidence_snapshot_count": 4,
        "has_diagnosis_path": True,
        "has_ai_admission": True,
        "has_search_term_boundary": True,
        "has_placement_boundary": True,
        "has_object_reference": None,
    }


def test_review_readiness_script_blocks_legacy_todos_without_evidence_snapshot(monkeypatch) -> None:
    module = load_review_readiness_script()
    todos = [
        SimpleNamespace(signal_id="sig-ad-product", market_id=1, review_window="7d", is_due=False, evidence_snapshot=[]),
        SimpleNamespace(signal_id="sig-ad-product", market_id=1, review_window="14d", is_due=False, evidence_snapshot=[]),
    ]

    def fake_effect(signal_id, *, review_window, market_id=None, signal_rows=None):
        return SimpleNamespace(
            signal_id=signal_id,
            action_id=f"manual-action-{review_window}",
            action_type="add_to_review",
            shop_id="market:1",
            market_id=market_id,
            review_window=review_window,
            status="not_ready",
            result="unclear",
            message=f"复盘效果暂不可计算：{review_window} 复盘窗口尚未到期",
            acted_at="2026-06-15T00:00:00+00:00",
            due_at="2026-06-22T00:00:00+00:00" if review_window == "7d" else "2026-06-29T00:00:00+00:00",
            object_type="advertised_product",
            object_id="B016EXMW02",
            object_label="B016EXMW02",
            before_start_date=None,
            before_end_date=None,
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
    audit = payload["review_identity_audit"]

    assert audit["status"] == "blocked"
    assert audit["missing_evidence_snapshot_count"] == 2
    assert audit["missing_diagnosis_path_count"] == 2
    assert audit["missing_ai_admission_count"] == 2
    assert audit["missing_search_term_boundary_count"] == 2
    assert audit["missing_placement_boundary_count"] == 2
    assert {issue["issue_type"] for issue in audit["issues"]} == {"missing_evidence_snapshot"}
    assert "缺少 evidence_snapshot 2 条" in payload["next_action"]
    assert payload["rule_improvement"]["status"] == "blocked_by_review_evidence_gap"
    assert payload["review_wait_summary"]["status"] == "blocked_by_review_evidence_gap"
    assert "缺少 evidence_snapshot 2 条" in payload["review_wait_summary"]["message"]
    assert "到期后也不能直接保存复盘记录" in payload["review_wait_summary"]["next_step"]
    assert "不静默补写历史 evidence_snapshot" in payload["review_wait_summary"]["forbidden_actions"]
    assert "不拉取快照" not in payload["review_wait_summary"]["forbidden_actions"]


def test_review_audit_issue_reason_reports_ad_group_synthesis_gap() -> None:
    module = load_review_readiness_script()

    reason = module.review_audit_issue_reason(
        [
            {"issue_type": "missing_targeting_evidence"},
            {"issue_type": "missing_ad_group_synthesis"},
            {"issue_type": "missing_ad_group_synthesis"},
            {"issue_type": "missing_aba_context"},
        ]
    )

    assert "缺少投放词证据 1 条" in reason
    assert "缺少广告组合流判断 2 条" in reason
    assert "缺少 ABA 背景 1 条" in reason


def test_review_identity_audit_reports_ad_group_synthesis_gap() -> None:
    module = load_review_readiness_script()

    audit = module.review_identity_audit_summary(
        [SimpleNamespace(signal_id="sig-search-term")],
        [],
        [
            {
                "signal_id": "sig-search-term",
                "action_id": "manual-action-search-term",
                "object_type": "search_term",
                "object_id": "search_term:1:boys sunglasses",
                "object_label": "boys sunglasses",
                "review_window": "7d",
                "status": "not_ready",
                "is_due": False,
                "due_at": "2026-06-29T00:00:00+00:00",
                "evidence_snapshot_count": 8,
                "has_diagnosis_path": True,
                "has_ai_admission": True,
                "has_search_term_boundary": True,
                "has_placement_boundary": True,
                "has_targeting_evidence": True,
                "has_ad_group_synthesis": False,
                "has_ad_group_product_performance": True,
                "has_aba_context": True,
                "has_evidence_gap": True,
                "has_required_evidence": True,
                "has_action_boundary": True,
            }
        ],
        ready_count=0,
        identity_issues=[],
    )

    assert audit["status"] == "blocked"
    assert audit["missing_ad_group_synthesis_count"] == 1
    assert [issue["issue_type"] for issue in audit["issues"]] == ["missing_ad_group_synthesis"]


def test_review_identity_audit_separates_metric_due_date_from_cross_due_date() -> None:
    module = load_review_readiness_script()
    audit = module.review_identity_audit_summary(
        [],
        [],
        [
            {
                "signal_id": "sig-data-quality",
                "action_id": "manual-action-data-quality",
                "object_type": "cross",
                "object_id": "aba_search_term_snapshot",
                "object_label": "ABA 搜索词数据",
                "review_window": "7d",
                "status": "not_ready",
                "is_due": False,
                "due_at": "2026-06-21T00:00:00+00:00",
            },
            {
                "signal_id": "sig-ad-product",
                "action_id": "manual-action-ad-product",
                "object_type": "advertised_product",
                "object_id": "B016EXMVZS",
                "object_label": "B016EXMVZS",
                "review_window": "7d",
                "status": "not_ready",
                "is_due": False,
                "due_at": "2026-06-22T00:00:00+00:00",
            },
        ],
        ready_count=0,
        identity_issues=[],
    )

    assert audit["earliest_due_date"] == "2026-06-21"
    assert audit["earliest_any_due_date"] == "2026-06-21"
    assert audit["earliest_metric_due_date"] == "2026-06-22"
    assert "earliest_any_due_date 包含数据质量和交叉待办" in audit["date_boundary"]
    assert "earliest_metric_due_date 为准" in audit["date_boundary"]


def test_review_wait_summary_ignores_cross_todos_for_metric_window() -> None:
    module = load_review_readiness_script()

    effects = [
        {
            "signal_id": "sig-data-quality-aba-stale",
            "review_window": "7d",
            "status": "not_ready",
            "is_due": False,
            "due_at": "2026-06-21T04:09:35+00:00",
            "object_type": "cross",
            "object_id": "aba_search_term_snapshot",
            "object_label": "ABA 搜索词数据",
            "message": "复盘效果暂不可计算：数据质量或交叉信号不适用广告指标前后对比，请复查数据是否补齐或更新",
        },
        {
            "signal_id": "sig-ad-product",
            "review_window": "7d",
            "status": "not_ready",
            "is_due": False,
            "due_at": "2026-06-22T00:00:00+00:00",
            "object_type": "advertised_product",
            "object_id": "B016EXMW02",
            "object_label": "B016EXMW02",
            "message": "复盘效果暂不可计算：7 天复盘窗口尚未到期，预计 2026-06-22 后复盘",
        },
    ]

    wait_summary = module.review_wait_summary_from_effects(effects, ready_count=0)

    assert wait_summary["status"] == "waiting_review_window"
    assert wait_summary["earliest_due_date"] == "2026-06-22"
    assert wait_summary["next_object_type"] == "advertised_product"
    assert wait_summary["next_object_id"] == "B016EXMW02"
    assert "ABA 搜索词数据" not in wait_summary["message"]


def test_review_wait_summary_explains_data_gap_after_due() -> None:
    module = load_review_readiness_script()

    effects = [
        {
            "signal_id": "sig-ad-product",
            "review_window": "7d",
            "status": "not_ready",
            "is_due": True,
            "due_at": "2026-06-22T00:00:00+00:00",
            "object_type": "advertised_product",
            "object_id": "B016EXMW02",
            "object_label": "B016EXMW02",
            "message": "复盘效果暂不可计算：缺少处理后 7 天快照",
        }
    ]

    wait_summary = module.review_wait_summary_from_effects(effects, ready_count=0)

    assert wait_summary["status"] == "blocked_by_data_gap"
    assert wait_summary["gap_reasons"] == ["复盘效果暂不可计算：缺少处理后 7 天快照"]
    assert "当前没有 ready 复盘效果" in wait_summary["message"]
    assert "先查询积加 API 限流规则" in wait_summary["next_step"]
    assert "不拉取快照" not in wait_summary["forbidden_actions"]
    assert "不保存复盘结论" in wait_summary["forbidden_actions"]


def test_review_readiness_cli_main_compact_outputs_counts_and_effects(monkeypatch, capsys) -> None:
    module = load_review_readiness_script()
    payload = {
        "status": "not_ready",
        "selected_market_id": 1,
        "manual_action_count": 4,
        "review_record_count": 0,
        "signal_row_count": 1505,
        "ready_count": 0,
        "not_ready_count": 6,
        "snapshot": {
            "snapshot_id": "snapshot-latest",
            "status": "success",
            "start_date": "2026-05-17",
            "end_date": "2026-06-15",
        },
        "rule_improvement": {
            "status": "waiting_review_window",
            "title": "waiting",
            "reason": "window not due",
            "next_step": "wait",
        },
        "next_action": "wait until review window is complete",
        "effects": [
            {
                "signal_id": "sig-ad",
                "action_id": "manual-action-ad",
                "action_type": "add_to_review",
                "shop_id": "market:1",
                "market_id": 1,
                "review_window": "7d",
                "status": "not_ready",
                "result": "unclear",
                "message": "7d window is not due",
                "is_due": False,
                "acted_at": "2026-06-15T07:12:46+00:00",
                "due_at": "2026-06-22T07:12:46+00:00",
                "object_type": "advertised_product",
                "object_id": "B016EXMW02",
                "object_label": "B016EXMW02",
            }
        ],
    }

    monkeypatch.setattr(module, "build_review_readiness_payload", lambda selected_market_id=None: payload)
    monkeypatch.setattr(sys, "argv", ["inspect_review_readiness.py", "--market-id", "1", "--compact"])

    module.main()

    compact = json.loads(capsys.readouterr().out)
    assert compact["status"] == "not_ready"
    assert compact["selected_market_id"] == 1
    assert compact["counts"] == {
        "manual_actions": 4,
        "review_records": 0,
        "ready": 0,
        "not_ready": 6,
        "signal_rows": 1505,
    }
    assert compact["snapshot"]["snapshot_id"] == "snapshot-latest"
    assert compact["rule_improvement"]["status"] == "waiting_review_window"
    assert compact["next_action"] == "wait until review window is complete"
    assert compact["effects"][0]["object"] == "advertised_product / B016EXMW02"
    assert compact["effects"][0]["action"] == "add_to_review / manual-action-ad"
    assert compact["effects"][0]["review_window"] == "7d"
    assert compact["effects"][0]["is_due"] is False


def test_review_readiness_cli_main_accepts_market_id(monkeypatch, capsys) -> None:
    module = load_review_readiness_script()
    captured: dict[str, object] = {}

    def fake_payload(*, selected_market_id=None):
        captured["selected_market_id"] = selected_market_id
        return {"status": "not_ready", "ready_count": 0}

    monkeypatch.setattr(module, "build_review_readiness_payload", fake_payload)
    monkeypatch.setattr(sys, "argv", ["inspect_review_readiness.py", "--market-id", "2"])

    module.main()

    assert captured["selected_market_id"] == 2
    assert json.loads(capsys.readouterr().out)["status"] == "not_ready"
