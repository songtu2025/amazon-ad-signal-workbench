import importlib.util
import json
import sys
from pathlib import Path
from types import SimpleNamespace

from app.services import review_evidence_repair


def make_missing_readiness(issue_count: int = 2) -> dict[str, object]:
    issues = [
        {
            "issue_type": "missing_evidence_snapshot",
            "signal_id": "sig-search-term",
            "action_id": "manual-action-beach",
            "object_type": "search_term",
            "object_id": "search_term:1:beach essentials",
            "review_window": window,
            "note": "历史复盘待办缺少人工点击时保存的 evidence_snapshot。",
        }
        for window in ("7d", "14d")[:issue_count]
    ]
    return {
        "status": "not_ready",
        "rule_improvement": {"status": "blocked_by_review_evidence_gap"},
        "review_identity_audit": {"issues": issues},
    }


def make_legacy_action() -> SimpleNamespace:
    return SimpleNamespace(
        id="manual-action-beach",
        signal_id="sig-search-term",
        action_type="add_to_review",
        shop_id="market:1",
        market_id=1,
        object_type="search_term",
        object_id="search_term:1:beach essentials",
        object_label="beach essentials",
        acted_at="2026-06-15T00:00:00+00:00",
        evidence_snapshot=[],
    )


def make_review_todos() -> list[SimpleNamespace]:
    action = make_legacy_action()
    base = {
        **action.__dict__,
        "action_id": action.id,
    }
    return [
        SimpleNamespace(**base, review_window="7d"),
        SimpleNamespace(**base, review_window="14d"),
    ]


def test_review_evidence_repair_reports_no_gap(monkeypatch) -> None:
    monkeypatch.setattr(
        review_evidence_repair,
        "build_review_readiness_payload",
        lambda **kwargs: {
            "status": "not_ready",
            "rule_improvement": {"status": "waiting_review_window"},
            "review_identity_audit": {"issues": []},
        },
    )
    monkeypatch.setattr(review_evidence_repair, "load_manual_actions", lambda **kwargs: [])
    monkeypatch.setattr(review_evidence_repair, "build_review_todos", lambda **kwargs: [])

    payload = review_evidence_repair.build_review_evidence_repair_payload(selected_market_id=1)

    assert payload["status"] == "ready_no_legacy_gap"
    assert payload["will_write"] is False
    assert payload["counts"]["legacy_action_gap_count"] == 0
    assert payload["items"] == []
    assert "没有历史证据快照缺口" in payload["next_action"]
    assert "继续等待复盘窗口" in payload["next_action"]
    assert "未到期前不保存 ReviewRecord" in payload["next_action"]
    assert "保存 ready" not in payload["next_action"]


def test_review_evidence_repair_rebuilds_preview_without_patching_legacy(monkeypatch) -> None:
    monkeypatch.setattr(review_evidence_repair, "build_review_readiness_payload", lambda **kwargs: make_missing_readiness())
    monkeypatch.setattr(review_evidence_repair, "load_manual_actions", lambda **kwargs: [make_legacy_action()])
    monkeypatch.setattr(review_evidence_repair, "build_review_todos", lambda **kwargs: make_review_todos())
    monkeypatch.setattr(
        review_evidence_repair,
        "build_manual_action_preflight_payload",
        lambda **kwargs: {
            "status": "ready_for_explicit_manual_write",
            "target": {
                "signal_id": "sig-search-term",
                "action_type": "add_to_review",
                "shop_id": "market:1",
                "market_id": 1,
                "object_type": "search_term",
                "object_id": "search_term:1:beach essentials",
                "object_label": "beach essentials",
            },
            "evidence_snapshot_preview": {
                "status": "ready",
                "item_count": 9,
                "items": [
                    {"label": "排查路径", "value": "搜索词 -> 广告活动 / 广告组", "source": "business_rule"},
                    {"label": "AI 准入", "value": "ready_for_manual_confirmation", "source": "actionability_status"},
                    {"label": "搜索词边界", "value": "beach essentials 只说明同广告组上下文", "source": "search_term_metrics"},
                    {"label": "广告位边界", "value": "广告位证据缺口不能自动归因", "source": "placement_metrics"},
                    {"label": "投放词证据", "value": "beach essentials 由投放词承接", "source": "targeting_metrics"},
                    {"label": "广告组合流判断", "value": "同广告组多广告 ASIN 不能把搜索词自动归因到单个 ASIN", "source": "ad_group_metrics"},
                    {"label": "ABA 背景", "value": "ABA Top1000 匹配 beach essentials", "source": "aba_search_term"},
                    {"label": "证据缺口", "value": "不能证明应自动加词", "source": "business_rule"},
                    {"label": "动作边界", "value": "只允许人工留痕和复盘", "source": "business_rule"},
                ],
            },
            "blockers": [],
        },
    )

    payload = review_evidence_repair.build_review_evidence_repair_payload(
        selected_market_id=1,
        product_scope_id="parent_asin:B00K4W4AAA",
    )

    assert payload["status"] == "blocked_by_legacy_evidence_gap"
    assert payload["counts"]["repair_issue_count"] == 2
    assert payload["counts"]["legacy_action_gap_count"] == 1
    assert payload["counts"]["preview_rebuildable_count"] == 1
    assert payload["counts"]["recreatable_count"] == 1
    item = payload["items"][0]
    assert item["review_windows"] == ["7d", "14d"]
    assert item["can_rebuild_evidence_preview"] is True
    assert item["can_recreate_from_current_signal"] is True
    assert item["can_patch_legacy_record"] is False
    assert item["void_plan"]["status"] == "dry_run_available"
    assert item["void_plan"]["required_authorization_code"] == "VOID_TODO:manual-action-beach:all"
    assert "apply_review_todo_void_once.py" in item["void_plan"]["dry_run_command"]
    assert "--execute" in item["void_plan"]["execute_command"]
    assert "VOID_TODO:manual-action-beach:all" in item["void_plan"]["execute_command"]
    assert "不修改 manual_actions" in item["void_plan"]["boundary"]
    assert item["current_preflight"]["has_diagnosis_path"] is True
    assert item["current_preflight"]["has_ai_admission"] is True
    assert item["current_preflight"]["has_search_term_boundary"] is True
    assert item["current_preflight"]["has_placement_boundary"] is True
    assert item["current_preflight"]["has_targeting_evidence"] is True
    assert item["current_preflight"]["has_ad_group_synthesis"] is True
    assert item["current_preflight"]["has_aba_context"] is True
    assert item["current_preflight"]["has_evidence_gap"] is True
    assert item["current_preflight"]["has_action_boundary"] is True
    assert "不得静默修补" in item["recommended_next_step"]
    assert "不把当前页面证据伪装成历史点击证据" in payload["forbidden_effects"]


def test_review_evidence_repair_handles_object_mismatch_gap(monkeypatch) -> None:
    readiness = make_missing_readiness(1)
    readiness["review_identity_audit"]["issues"] = [
        {
            "issue_type": "evidence_snapshot_object_mismatch",
            "signal_id": "sig-search-term",
            "action_id": "manual-action-beach",
            "object_type": "search_term",
            "object_id": "search_term:1:beach essentials",
            "review_window": "7d",
            "note": "证据快照未能回看目标对象。",
        }
    ]
    monkeypatch.setattr(review_evidence_repair, "build_review_readiness_payload", lambda **kwargs: readiness)
    monkeypatch.setattr(review_evidence_repair, "load_manual_actions", lambda **kwargs: [make_legacy_action()])
    monkeypatch.setattr(review_evidence_repair, "build_review_todos", lambda **kwargs: make_review_todos())
    monkeypatch.setattr(
        review_evidence_repair,
        "build_manual_action_preflight_payload",
        lambda **kwargs: {
            "status": "blocked",
            "target": {
                "signal_id": "sig-search-term",
                "action_type": "add_to_review",
                "shop_id": "market:1",
                "market_id": 1,
                "object_type": "search_term",
                "object_id": "search_term:1:beach essentials",
                "object_label": "beach essentials",
            },
            "evidence_snapshot_preview": {
                "status": "ready",
                "item_count": 10,
                "items": [
                    {"label": "排查路径", "value": "搜索词 -> 广告活动 / 广告组"},
                    {"label": "AI 准入", "value": "ready_for_manual_confirmation"},
                    {"label": "搜索词边界", "value": "beach essentials 只说明同广告组上下文"},
                    {"label": "广告位边界", "value": "beach essentials 缺广告组级广告位证据"},
                    {"label": "投放词证据", "value": "beach essentials 由投放词承接"},
                    {"label": "广告组合流判断", "value": "同广告组多广告 ASIN 不能把搜索词自动归因到单个 ASIN"},
                    {"label": "ABA 背景", "value": "ABA Top1000 匹配 beach essentials"},
                    {"label": "证据缺口", "value": "不能证明应自动加词"},
                    {"label": "动作边界", "value": "只允许人工留痕和复盘"},
                    {"label": "搜索词表现", "value": "beach essentials 花费 34.11 / 订单 21"},
                ],
            },
            "blockers": [{"code": "duplicate_manual_action", "message": "目标对象已有人工留痕。"}],
        },
    )

    payload = review_evidence_repair.build_review_evidence_repair_payload(selected_market_id=1)
    item = payload["items"][0]

    assert payload["status"] == "blocked_by_legacy_evidence_gap"
    assert payload["counts"]["repair_issue_count"] == 1
    assert payload["counts"]["legacy_action_gap_count"] == 1
    assert payload["counts"]["preview_rebuildable_count"] == 1
    assert payload["counts"]["recreatable_count"] == 0
    assert item["issue_types"] == ["evidence_snapshot_object_mismatch"]
    assert item["current_preflight"]["has_object_reference"] is True
    assert item["can_rebuild_evidence_preview"] is True
    assert item["can_patch_legacy_record"] is False
    assert "先 dry-run 作废旧待办" in item["recommended_next_step"]
    assert "不能补写历史 evidence_snapshot" in item["recommended_next_step"]


def test_review_evidence_repair_blocks_preview_without_search_term_or_placement_boundary(monkeypatch) -> None:
    readiness = make_missing_readiness()
    readiness["review_identity_audit"]["issues"] = [
        {
            "issue_type": "missing_search_term_boundary",
            "signal_id": "sig-search-term",
            "action_id": "manual-action-beach",
            "object_type": "search_term",
            "object_id": "search_term:1:beach essentials",
            "review_window": "7d",
            "note": "缺少搜索词边界。",
        },
        {
            "issue_type": "missing_placement_boundary",
            "signal_id": "sig-search-term",
            "action_id": "manual-action-beach",
            "object_type": "search_term",
            "object_id": "search_term:1:beach essentials",
            "review_window": "14d",
            "note": "缺少广告位边界。",
        },
    ]
    monkeypatch.setattr(review_evidence_repair, "build_review_readiness_payload", lambda **kwargs: readiness)
    monkeypatch.setattr(review_evidence_repair, "load_manual_actions", lambda **kwargs: [make_legacy_action()])
    monkeypatch.setattr(review_evidence_repair, "build_review_todos", lambda **kwargs: make_review_todos())
    monkeypatch.setattr(
        review_evidence_repair,
        "build_manual_action_preflight_payload",
        lambda **kwargs: {
            "status": "ready_for_explicit_manual_write",
            "target": {
                "signal_id": "sig-search-term",
                "action_type": "add_to_review",
                "shop_id": "market:1",
                "market_id": 1,
                "object_type": "search_term",
                "object_id": "search_term:1:beach essentials",
                "object_label": "beach essentials",
            },
            "evidence_snapshot_preview": {
                "status": "ready",
                "item_count": 2,
                "items": [
                    {"label": "排查路径", "value": "搜索词 -> 广告活动 / 广告组", "source": "business_rule"},
                    {"label": "AI 准入", "value": "ready_for_manual_confirmation", "source": "actionability_status"},
                ],
            },
            "blockers": [],
        },
    )

    payload = review_evidence_repair.build_review_evidence_repair_payload(selected_market_id=1)
    item = payload["items"][0]

    assert payload["counts"]["repair_issue_count"] == 2
    assert item["issue_types"] == ["missing_placement_boundary", "missing_search_term_boundary"]
    assert item["current_preflight"]["missing_required_labels"] == [
        "搜索词边界",
        "广告位边界",
        "投放词证据",
        "广告组合流判断",
        "ABA 背景",
        "证据缺口",
        "动作边界",
    ]
    assert item["can_rebuild_evidence_preview"] is False
    assert item["can_recreate_from_current_signal"] is False
    assert "搜索词边界、广告位边界、投放词证据、广告组合流判断、ABA 背景、证据缺口、动作边界" in item["recommended_next_step"]


def test_review_evidence_repair_treats_search_term_review_chain_gaps_as_repair_items(monkeypatch) -> None:
    readiness = make_missing_readiness(1)
    readiness["review_identity_audit"]["issues"] = [
        {
            "issue_type": issue_type,
            "signal_id": "sig-search-term",
            "action_id": "manual-action-beach",
            "object_type": "search_term",
            "object_id": "search_term:1:beach essentials",
            "review_window": "7d",
            "note": "搜索词复核链缺少证据。",
        }
        for issue_type in (
            "missing_targeting_evidence",
            "missing_ad_group_synthesis",
            "missing_aba_context",
            "missing_evidence_gap",
            "missing_action_boundary",
        )
    ]
    monkeypatch.setattr(review_evidence_repair, "build_review_readiness_payload", lambda **kwargs: readiness)
    monkeypatch.setattr(review_evidence_repair, "load_manual_actions", lambda **kwargs: [make_legacy_action()])
    monkeypatch.setattr(review_evidence_repair, "build_review_todos", lambda **kwargs: make_review_todos())
    monkeypatch.setattr(
        review_evidence_repair,
        "build_manual_action_preflight_payload",
        lambda **kwargs: {
            "status": "ready_for_explicit_manual_write",
            "target": {
                "signal_id": "sig-search-term",
                "action_type": "add_to_review",
                "shop_id": "market:1",
                "market_id": 1,
                "object_type": "search_term",
                "object_id": "search_term:1:beach essentials",
                "object_label": "beach essentials",
            },
            "evidence_snapshot_preview": {
                "status": "ready",
                "item_count": 4,
                "items": [
                    {"label": "排查路径", "value": "搜索词 -> 广告活动 / 广告组"},
                    {"label": "AI 准入", "value": "ready_for_manual_confirmation"},
                    {"label": "搜索词边界", "value": "beach essentials 只说明同广告组上下文"},
                    {"label": "广告位边界", "value": "beach essentials 缺广告组级广告位证据"},
                ],
            },
            "blockers": [],
        },
    )

    payload = review_evidence_repair.build_review_evidence_repair_payload(selected_market_id=1)
    item = payload["items"][0]

    assert payload["status"] == "blocked_by_legacy_evidence_gap"
    assert payload["counts"]["repair_issue_count"] == 5
    assert payload["counts"]["legacy_action_gap_count"] == 1
    assert item["issue_types"] == [
        "missing_aba_context",
        "missing_action_boundary",
        "missing_ad_group_synthesis",
        "missing_evidence_gap",
        "missing_targeting_evidence",
    ]
    assert item["current_preflight"]["has_targeting_evidence"] is False
    assert item["current_preflight"]["has_ad_group_synthesis"] is False
    assert item["current_preflight"]["has_aba_context"] is False
    assert item["current_preflight"]["has_evidence_gap"] is False
    assert item["current_preflight"]["has_action_boundary"] is False
    assert item["current_preflight"]["missing_required_labels"] == ["投放词证据", "广告组合流判断", "ABA 背景", "证据缺口", "动作边界"]
    assert item["can_rebuild_evidence_preview"] is False
    assert "投放词证据、广告组合流判断、ABA 背景、证据缺口、动作边界" in item["recommended_next_step"]


def test_review_evidence_repair_blocks_current_signal_mismatch(monkeypatch) -> None:
    monkeypatch.setattr(review_evidence_repair, "build_review_readiness_payload", lambda **kwargs: make_missing_readiness(1))
    monkeypatch.setattr(review_evidence_repair, "load_manual_actions", lambda **kwargs: [make_legacy_action()])
    monkeypatch.setattr(review_evidence_repair, "build_review_todos", lambda **kwargs: make_review_todos())
    monkeypatch.setattr(
        review_evidence_repair,
        "build_manual_action_preflight_payload",
        lambda **kwargs: {
            "status": "blocked",
            "target": {
                "signal_id": "sig-other",
                "action_type": "add_to_review",
                "shop_id": "market:1",
                "market_id": 1,
                "object_type": "advertised_product",
                "object_id": "B016EXMW02",
                "object_label": "B016EXMW02",
            },
            "evidence_snapshot_preview": {
                "status": "ready",
                "item_count": 2,
                "items": [
                    {"label": "排查路径", "value": "Parent -> 广告 ASIN"},
                    {"label": "AI 准入", "value": "ready_for_manual_confirmation"},
                ],
            },
            "blockers": [{"code": "object_id_mismatch", "message": "目标对象不匹配。"}],
        },
    )

    payload = review_evidence_repair.build_review_evidence_repair_payload(selected_market_id=1)
    item = payload["items"][0]

    assert payload["counts"]["preview_rebuildable_count"] == 0
    assert payload["counts"]["recreatable_count"] == 0
    assert item["current_preflight"]["target_matches_legacy"] is False
    assert item["can_rebuild_evidence_preview"] is False
    assert item["can_recreate_from_current_signal"] is False
    assert item["can_patch_legacy_record"] is False
    assert "不能用当前信号证据修补历史" in item["recommended_next_step"]


def load_review_evidence_repair_script():
    project_root = Path(__file__).resolve().parents[2]
    script_path = project_root / "scripts" / "inspect_review_evidence_repair.py"
    spec = importlib.util.spec_from_file_location("inspect_review_evidence_repair_script", script_path)
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules["inspect_review_evidence_repair_script"] = module
    spec.loader.exec_module(module)
    return module


def test_review_evidence_repair_cli_compact_outputs_repair_boundary(monkeypatch, capsys) -> None:
    module = load_review_evidence_repair_script()
    monkeypatch.setattr(
        module,
        "build_review_evidence_repair_payload",
        lambda **kwargs: {
            "status": "blocked_by_legacy_evidence_gap",
            "will_write": False,
            "selected_market_id": kwargs.get("selected_market_id"),
            "selected_product_scope_id": kwargs.get("product_scope_id"),
            "rule_improvement_status": "blocked_by_review_evidence_gap",
            "counts": {"legacy_action_gap_count": 1, "recreatable_count": 0},
            "items": [
                {
                    "action_id": "manual-action-beach",
                    "object_type": "search_term",
                    "object_id": "search_term:1:beach essentials",
                    "review_windows": ["7d", "14d"],
                    "issue_types": ["missing_evidence_snapshot"],
                    "current_preflight": {"status": "blocked", "target_matches_legacy": False},
                    "can_rebuild_evidence_preview": False,
                    "can_recreate_from_current_signal": False,
                    "can_patch_legacy_record": False,
                    "void_plan": {
                        "status": "dry_run_available",
                        "required_authorization_code": "VOID_TODO:manual-action-beach:all",
                        "dry_run_command": "python scripts\\apply_review_todo_void_once.py --market-id 1 --action-id manual-action-beach --compact",
                        "execute_command": "python scripts\\apply_review_todo_void_once.py --market-id 1 --action-id manual-action-beach --execute --authorization-code VOID_TODO:manual-action-beach:all --compact",
                    },
                    "recommended_next_step": "不能用当前信号证据修补历史。",
                }
            ],
            "next_action": "先 dry-run 作废旧待办，后续重新人工留痕。",
        },
    )
    monkeypatch.setattr(
        sys,
        "argv",
        [
            "inspect_review_evidence_repair.py",
            "--market-id",
            "1",
            "--product-scope-id",
            "parent_asin:B00K4W4AAA",
            "--compact",
        ],
    )

    module.main()

    compact = json.loads(capsys.readouterr().out)
    assert compact["status"] == "blocked_by_legacy_evidence_gap"
    assert compact["will_write"] is False
    assert compact["items"][0]["object"] == "search_term / search_term:1:beach essentials"
    assert compact["items"][0]["target_matches_legacy"] is False
    assert compact["items"][0]["can_patch_legacy_record"] is False
    assert compact["items"][0]["void_plan"]["required_authorization_code"] == "VOID_TODO:manual-action-beach:all"
    assert "作废旧待办" in compact["next_action"]
