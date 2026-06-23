import json
import importlib.util
import sys
from pathlib import Path
from types import SimpleNamespace


def load_manual_action_apply_script():
    project_root = Path(__file__).resolve().parents[2]
    script_path = project_root / "scripts" / "apply_manual_action_once.py"
    spec = importlib.util.spec_from_file_location("apply_manual_action_once_script", script_path)
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules["apply_manual_action_once_script"] = module
    spec.loader.exec_module(module)
    return module


def load_review_todo_void_script():
    project_root = Path(__file__).resolve().parents[2]
    script_path = project_root / "scripts" / "apply_review_todo_void_once.py"
    spec = importlib.util.spec_from_file_location("apply_review_todo_void_once_for_apply_test", script_path)
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules["apply_review_todo_void_once_for_apply_test"] = module
    spec.loader.exec_module(module)
    return module


def ready_preflight_payload() -> dict:
    return {
        "status": "ready_for_explicit_manual_write",
        "mode": "pre_write",
        "snapshot": {"snapshot_id": "gerpgo_market_1_20260615_162042"},
        "target": {
            "signal_id": "sig-sales-product-ad-weak-gerpgo_market_1_20260615_162042:sales:1:826-Dark Blue:2026-05-17:2026-06-15",
            "action_type": "add_to_review",
            "object_type": "sales_product",
            "object_id": "B06VW5SQ97",
            "object_label": "RBK004-RBK004-2 深蓝",
            "shop_id": "market:1",
            "shop_name": "rivbos",
            "market_id": 1,
            "review_windows": ["7d", "14d"],
        },
        "evidence_snapshot_preview": {
            "status": "ready",
            "will_write": False,
            "will_save_on_authorized_write": True,
            "item_count": 2,
            "sources": ["advertised_products", "business_rule"],
            "items": [
                {
                    "label": "广告聚合指标",
                    "value": "花费 $12.34 / 订单 0",
                    "detail": "用于人工复核，不自动执行广告动作。",
                    "source": "advertised_products",
                },
                {
                    "label": "上下文边界",
                    "value": "搜索词只说明同广告组上下文",
                    "detail": "不能自动归因到该 ASIN。",
                    "source": "business_rule",
                },
            ],
        },
        "blockers": [],
    }


def test_manual_action_apply_defaults_to_dry_run(monkeypatch) -> None:
    module = load_manual_action_apply_script()
    monkeypatch.setattr(module, "build_manual_action_preflight_payload", lambda **kwargs: ready_preflight_payload())
    monkeypatch.setattr(module, "save_manual_action", lambda **kwargs: (_ for _ in ()).throw(AssertionError("should not write")))

    payload = module.build_manual_action_apply_payload(
        selected_market_id=1,
        product_scope_id="parent_asin:B00K4W4AAA",
        expected_object_id="B06VW5SQ97",
        expected_object_type="sales_product",
    )

    assert payload["status"] == "dry_run_ready"
    assert payload["will_write"] is False
    assert payload["requires_explicit_authorization"] is True
    assert payload["required_authorization_code"] == "WRITE_ONCE:sales_product:B06VW5SQ97"
    assert payload["target"]["object_id"] == "B06VW5SQ97"
    assert "不会写入" in payload["next_action"]


def test_manual_action_apply_blocks_execute_without_authorization(monkeypatch) -> None:
    module = load_manual_action_apply_script()
    monkeypatch.setattr(module, "build_manual_action_preflight_payload", lambda **kwargs: ready_preflight_payload())
    monkeypatch.setattr(module, "save_manual_action", lambda **kwargs: (_ for _ in ()).throw(AssertionError("should not write")))

    payload = module.build_manual_action_apply_payload(
        selected_market_id=1,
        product_scope_id="parent_asin:B00K4W4AAA",
        expected_object_id="B06VW5SQ97",
        expected_object_type="sales_product",
        execute=True,
    )

    assert payload["status"] == "blocked"
    assert payload["will_write"] is False
    assert payload["blockers"][0]["code"] == "missing_or_invalid_authorization_code"
    assert "WRITE_ONCE:sales_product:B06VW5SQ97" in payload["blockers"][0]["message"]


def test_manual_action_apply_writes_once_then_verifies_post_write(monkeypatch) -> None:
    module = load_manual_action_apply_script()
    preflight_calls = []

    def fake_preflight(**kwargs):
        preflight_calls.append(kwargs)
        if kwargs.get("expect_written"):
            return {
                "status": "post_write_verified",
                "mode": "post_write",
                "target": ready_preflight_payload()["target"],
                "current_counts": {
                    "manual_action_count": 5,
                    "target_manual_action_count": 1,
                    "target_review_todo_count": 2,
                    "review_record_count": 0,
                    "target_review_record_count": 0,
                },
                "post_write_checks": {
                    "target_manual_action_evidence_snapshot_counts": [
                        {
                            "signal_id": ready_preflight_payload()["target"]["signal_id"],
                            "object_type": "sales_product",
                            "object_id": "B06VW5SQ97",
                            "evidence_snapshot_count": 2,
                        }
                    ],
                    "target_review_todo_evidence_snapshot_counts": [
                        {
                            "signal_id": ready_preflight_payload()["target"]["signal_id"],
                            "object_type": "sales_product",
                            "object_id": "B06VW5SQ97",
                            "review_window": "7d",
                            "evidence_snapshot_count": 2,
                        },
                        {
                            "signal_id": ready_preflight_payload()["target"]["signal_id"],
                            "object_type": "sales_product",
                            "object_id": "B06VW5SQ97",
                            "review_window": "14d",
                            "evidence_snapshot_count": 2,
                        },
                    ],
                },
                "blockers": [],
            }
        return ready_preflight_payload()

    saved_calls = []

    def fake_save_manual_action(**kwargs):
        saved_calls.append(kwargs)
        return SimpleNamespace(
            model_dump=lambda mode=None: {
                "id": "manual-action-1",
                "signal_id": kwargs["signal_id"],
                "action_type": kwargs["action_type"],
                "object_type": kwargs["object_type"],
                "object_id": kwargs["object_id"],
            }
        )

    monkeypatch.setattr(module, "build_manual_action_preflight_payload", fake_preflight)
    monkeypatch.setattr(module, "save_manual_action", fake_save_manual_action)

    payload = module.build_manual_action_apply_payload(
        selected_market_id=1,
        product_scope_id="parent_asin:B00K4W4AAA",
        expected_object_id="B06VW5SQ97",
        expected_object_type="sales_product",
        execute=True,
        authorization_code="WRITE_ONCE:sales_product:B06VW5SQ97",
        operator_name="本地运营",
        action_note="加入 B06VW5SQ97 复盘",
    )

    assert payload["status"] == "written_and_verified"
    assert payload["will_write"] is True
    assert payload["written_record"]["id"] == "manual-action-1"
    assert payload["post_write_validation"]["status"] == "post_write_verified"
    assert saved_calls == [
        {
            "signal_id": ready_preflight_payload()["target"]["signal_id"],
            "action_type": "add_to_review",
            "action_note": "加入 B06VW5SQ97 复盘",
            "operator_name": "本地运营",
            "snapshot_id": "gerpgo_market_1_20260615_162042",
            "shop_id": "market:1",
            "market_id": 1,
            "object_type": "sales_product",
            "object_id": "B06VW5SQ97",
            "object_label": "RBK004-RBK004-2 深蓝",
            "evidence_snapshot": ready_preflight_payload()["evidence_snapshot_preview"]["items"],
        }
    ]
    assert saved_calls[0]["evidence_snapshot"] == ready_preflight_payload()["evidence_snapshot_preview"]["items"]
    assert preflight_calls[0]["expect_written"] is False
    assert preflight_calls[1]["expect_written"] is True
    assert payload["smoke_assertions"] == {
        "status": "passed",
        "target": {
            "object_type": "sales_product",
            "object_id": "B06VW5SQ97",
            "action_type": "add_to_review",
        },
        "manual_action_written": True,
        "target_manual_action_count": 1,
        "target_review_todo_count": 2,
        "target_review_record_count": 0,
        "written_evidence_snapshot_count": 2,
        "post_write_manual_action_evidence_snapshot_count": 2,
        "post_write_max_manual_action_evidence_snapshot_count": 2,
        "post_write_review_todo_evidence_snapshot_counts": {"7d": 2, "14d": 2},
        "post_write_review_todos_with_evidence_snapshot": 2,
        "review_todos_expected_to_inherit_evidence_snapshot": True,
        "review_records_not_saved": True,
        "ad_actions_not_executed": True,
    }


def test_manual_action_apply_can_write_observe_with_post_write_review_todos(monkeypatch) -> None:
    module = load_manual_action_apply_script()
    preflight_calls = []

    def fake_preflight(**kwargs):
        preflight_calls.append(kwargs)
        payload = ready_preflight_payload()
        payload["target"] = {**payload["target"], "action_type": kwargs.get("expected_action_type") or "add_to_review"}
        if kwargs.get("expect_written"):
            return {
                "status": "post_write_verified",
                "mode": "post_write",
                "target": payload["target"],
                "current_counts": {
                    "manual_action_count": 1,
                    "target_manual_action_count": 1,
                    "target_review_todo_count": 2,
                    "review_record_count": 0,
                    "target_review_record_count": 0,
                },
                "blockers": [],
            }
        return payload

    saved_calls = []

    def fake_save_manual_action(**kwargs):
        saved_calls.append(kwargs)
        return SimpleNamespace(model_dump=lambda mode=None: {"id": "manual-action-1", **kwargs})

    monkeypatch.setattr(module, "build_manual_action_preflight_payload", fake_preflight)
    monkeypatch.setattr(module, "save_manual_action", fake_save_manual_action)

    payload = module.build_manual_action_apply_payload(
        selected_market_id=1,
        product_scope_id="parent_asin:B00K4W4AAA",
        expected_object_id="B06VW5SQ97",
        expected_object_type="sales_product",
        action_type="observe",
        execute=True,
        authorization_code="WRITE_ONCE:sales_product:B06VW5SQ97",
    )

    assert payload["status"] == "written_and_verified"
    assert payload["target"]["action_type"] == "observe"
    assert saved_calls[0]["action_type"] == "observe"
    assert preflight_calls[0]["expected_action_type"] == "observe"
    assert preflight_calls[1]["expected_action_type"] == "observe"


def test_manual_action_apply_ignore_next_action_does_not_wait_for_review_window(monkeypatch) -> None:
    module = load_manual_action_apply_script()

    def fake_preflight(**kwargs):
        payload = ready_preflight_payload()
        payload["target"] = {**payload["target"], "action_type": kwargs.get("expected_action_type") or "add_to_review"}
        if kwargs.get("expect_written"):
            return {
                "status": "post_write_verified",
                "mode": "post_write",
                "target": payload["target"],
                "current_counts": {
                    "manual_action_count": 1,
                    "target_manual_action_count": 1,
                    "target_review_todo_count": 0,
                    "review_record_count": 0,
                    "target_review_record_count": 0,
                },
                "blockers": [],
                "next_action": "写入后验收通过：sales_product / B06VW5SQ97 已有 1 条人工留痕且不会进入当前 7d / 14d 复盘待办；本次不保存 review_records。",
            }
        return payload

    def fake_save_manual_action(**kwargs):
        return SimpleNamespace(model_dump=lambda mode=None: {"id": "manual-action-ignore", **kwargs})

    monkeypatch.setattr(module, "build_manual_action_preflight_payload", fake_preflight)
    monkeypatch.setattr(module, "save_manual_action", fake_save_manual_action)

    payload = module.build_manual_action_apply_payload(
        selected_market_id=1,
        product_scope_id="parent_asin:B00K4W4AAA",
        expected_object_id="B06VW5SQ97",
        expected_object_type="sales_product",
        action_type="ignore",
        execute=True,
        authorization_code="WRITE_ONCE:sales_product:B06VW5SQ97",
    )

    assert payload["status"] == "written_and_verified"
    assert "不会进入当前 7d / 14d 复盘待办" in payload["next_action"]
    assert "等待 7d / 14d" not in payload["next_action"]


def test_manual_action_apply_uses_custom_runtime_roots(monkeypatch, tmp_path) -> None:
    module = load_manual_action_apply_script()
    action_root = tmp_path / "manual-actions"
    review_root = tmp_path / "review-records"
    preflight_calls = []

    def fake_preflight(**kwargs):
        preflight_calls.append(kwargs)
        if kwargs.get("expect_written"):
            return {
                "status": "post_write_verified",
                "mode": "post_write",
                "target": ready_preflight_payload()["target"],
                "current_counts": {
                    "manual_action_count": 1,
                    "target_manual_action_count": 1,
                    "target_review_todo_count": 2,
                    "review_record_count": 0,
                    "target_review_record_count": 0,
                },
                "blockers": [],
            }
        return ready_preflight_payload()

    saved_calls = []

    def fake_save_manual_action(**kwargs):
        saved_calls.append(kwargs)
        return SimpleNamespace(
            model_dump=lambda mode=None: {
                "id": "manual-action-1",
                "signal_id": kwargs["signal_id"],
                "action_root": str(kwargs["action_root"]),
            }
        )

    monkeypatch.setattr(module, "build_manual_action_preflight_payload", fake_preflight)
    monkeypatch.setattr(module, "save_manual_action", fake_save_manual_action)

    payload = module.build_manual_action_apply_payload(
        selected_market_id=1,
        product_scope_id="parent_asin:B00K4W4AAA",
        expected_object_id="B06VW5SQ97",
        expected_object_type="sales_product",
        execute=True,
        authorization_code="WRITE_ONCE:sales_product:B06VW5SQ97",
        action_root=action_root,
        review_root=review_root,
    )

    assert payload["status"] == "written_and_verified"
    assert preflight_calls[0]["action_root"] == action_root
    assert preflight_calls[0]["review_root"] == review_root
    assert preflight_calls[1]["action_root"] == action_root
    assert preflight_calls[1]["review_root"] == review_root
    assert saved_calls[0]["action_root"] == action_root


def test_manual_action_apply_smoke_reads_actual_review_todos_from_isolated_root(monkeypatch, tmp_path) -> None:
    module = load_manual_action_apply_script()
    action_root = tmp_path / "manual-actions"
    review_root = tmp_path / "review-records"
    stale_source_object_id = "gerpgo_market_1_20260616_120443:507942344"
    search_term_preflight = ready_preflight_payload()
    search_term_preflight["target"] = {
        **search_term_preflight["target"],
        "signal_id": "sig-opportunity-search-term-1-boys-sunglasses",
        "object_type": "search_term",
        "object_id": "search_term:1:boys sunglasses",
        "source_object_id": stale_source_object_id,
        "object_label": "boys sunglasses",
    }
    search_term_preflight["evidence_snapshot_preview"]["items"] = [
        {"label": "排查路径", "value": "搜索词 -> 广告活动 / 广告组", "source": "diagnosis_path"},
        {"label": "AI 准入", "value": "ready_for_manual_confirmation", "source": "actionability_status"},
        {"label": "搜索词边界", "value": "boys sunglasses 不能自动归因到单个 ASIN", "source": "business_rule"},
        {"label": "广告位边界", "value": "广告位证据只作背景", "source": "business_rule"},
    ]
    search_term_preflight["evidence_snapshot_preview"]["item_count"] = 4

    def fake_preflight(**kwargs):
        if kwargs.get("expect_written"):
            return {
                "status": "post_write_verified",
                "mode": "post_write",
                "target": search_term_preflight["target"],
                "current_counts": {
                    "manual_action_count": 1,
                    "target_manual_action_count": 1,
                    "target_review_todo_count": 2,
                    "review_record_count": 0,
                    "target_review_record_count": 0,
                },
                "post_write_checks": {
                    "target_manual_action_evidence_snapshot_counts": [
                        {
                            "signal_id": search_term_preflight["target"]["signal_id"],
                            "object_type": "search_term",
                            "object_id": "search_term:1:boys sunglasses",
                            "evidence_snapshot_count": 4,
                        }
                    ],
                    "target_review_todo_evidence_snapshot_counts": [
                        {
                            "signal_id": search_term_preflight["target"]["signal_id"],
                            "object_type": "search_term",
                            "object_id": "search_term:1:boys sunglasses",
                            "review_window": "7d",
                            "evidence_snapshot_count": 4,
                        },
                        {
                            "signal_id": search_term_preflight["target"]["signal_id"],
                            "object_type": "search_term",
                            "object_id": "search_term:1:boys sunglasses",
                            "review_window": "14d",
                            "evidence_snapshot_count": 4,
                        },
                    ],
                    "target_review_record_count": 0,
                },
                "blockers": [],
            }
        return search_term_preflight

    monkeypatch.setattr(module, "build_manual_action_preflight_payload", fake_preflight)

    payload = module.build_manual_action_apply_payload(
        selected_market_id=1,
        product_scope_id="parent_asin:B00K4W4AAA",
        expected_object_id="search_term:1:boys sunglasses",
        expected_object_type="search_term",
        action_type="add_to_review",
        execute=True,
        authorization_code="WRITE_ONCE:search_term:search_term:1:boys sunglasses",
        action_root=action_root,
        review_root=review_root,
    )

    assert payload["status"] == "written_and_verified"
    assert payload["written_record"]["object_id"] == "search_term:1:boys sunglasses"
    smoke = payload["smoke_assertions"]
    assert smoke["actual_review_todo_count"] == 2
    assert smoke["actual_review_todo_object_ids"] == ["search_term:1:boys sunglasses"]
    assert smoke["actual_review_todo_evidence_snapshot_counts"] == {"7d": 4, "14d": 4}
    assert smoke["actual_review_todos_match_manual_action_object"] is True
    assert smoke["actual_review_todos_match_manual_action_id"] is True
    assert smoke["actual_review_todos_inherit_evidence_snapshot"] is True
    assert smoke["source_object_id_not_used_as_review_object"] is True
    assert stale_source_object_id not in json.dumps(payload["written_record"], ensure_ascii=False)


def test_manual_action_apply_blocks_reviewable_write_without_evidence_snapshot(monkeypatch) -> None:
    module = load_manual_action_apply_script()
    payload_without_evidence = ready_preflight_payload()
    payload_without_evidence["evidence_snapshot_preview"] = {
        "status": "missing",
        "will_save_on_authorized_write": False,
        "item_count": 0,
        "items": [],
    }

    monkeypatch.setattr(module, "build_manual_action_preflight_payload", lambda **kwargs: payload_without_evidence)
    monkeypatch.setattr(module, "save_manual_action", lambda **kwargs: (_ for _ in ()).throw(AssertionError("should not write")))

    payload = module.build_manual_action_apply_payload(
        selected_market_id=1,
        product_scope_id="parent_asin:B00K4W4AAA",
        expected_object_id="B06VW5SQ97",
        expected_object_type="sales_product",
        execute=True,
        authorization_code="WRITE_ONCE:sales_product:B06VW5SQ97",
    )

    assert payload["status"] == "blocked"
    assert payload["will_write"] is False
    assert payload["blockers"][0]["code"] == "missing_evidence_snapshot"


def test_manual_action_apply_rewrites_after_voided_legacy_todo_with_isolated_roots(tmp_path: Path) -> None:
    apply_module = load_manual_action_apply_script()
    void_module = load_review_todo_void_script()
    action_root = tmp_path / "manual_actions"
    review_root = tmp_path / "review_records"
    action_root.mkdir(parents=True)
    legacy_payload = {
        "id": "manual-action-legacy-gap",
        "signal_id": "sig-opportunity-search-term-1-beach-essentials",
        "action_type": "add_to_review",
        "operator_name": "本地运营",
        "acted_at": "2026-06-01T00:00:00+00:00",
        "manual_status": "pending",
        "shop_id": "market:1",
        "market_id": 1,
        "object_type": "search_term",
        "object_id": "search_term:1:beach essentials",
        "object_label": "beach essentials",
        "evidence_snapshot": [
            {"label": "排查路径", "value": "Parent -> 广告 ASIN -> 广告组 -> beach essentials"},
            {"label": "AI 准入", "value": "ready_for_manual_confirmation"},
            {"label": "搜索词边界", "value": "beach essentials 不能自动归因到单个广告 ASIN"},
            {"label": "广告位边界", "value": "beach essentials 缺少广告位归因证据"},
        ],
    }
    (action_root / "manual_actions.jsonl").write_text(
        json.dumps(legacy_payload, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    pre_before = apply_module.build_manual_action_apply_payload(
        selected_market_id=1,
        product_scope_id="parent_asin:B00K4W4AAA",
        expected_object_id="search_term:1:beach essentials",
        expected_object_type="search_term",
        action_type="add_to_review",
        action_root=action_root,
        review_root=review_root,
    )

    assert pre_before["status"] == "blocked"
    assert pre_before["blockers"][0]["code"] == "duplicate_manual_action"
    assert pre_before["preflight"]["current_counts"]["target_review_todo_count"] == 2

    void_payload = void_module.build_review_todo_void_payload(
        selected_market_id=1,
        action_id="manual-action-legacy-gap",
        expected_object_type="search_term",
        expected_object_id="search_term:1:beach essentials",
        execute=True,
        authorization_code="VOID_TODO:manual-action-legacy-gap:all",
        action_root=action_root,
    )

    assert void_payload["status"] == "written_and_verified"
    assert void_payload["will_write"] is True
    assert void_payload["post_write_todo_count"] == 0
    assert (action_root / "review_todo_decisions.jsonl").exists()

    pre_after = apply_module.build_manual_action_apply_payload(
        selected_market_id=1,
        product_scope_id="parent_asin:B00K4W4AAA",
        expected_object_id="search_term:1:beach essentials",
        expected_object_type="search_term",
        action_type="add_to_review",
        action_root=action_root,
        review_root=review_root,
    )

    assert pre_after["status"] == "dry_run_ready", json.dumps(
        {
            "status": pre_after.get("status"),
            "blockers": pre_after.get("blockers"),
            "current_counts": pre_after.get("preflight", {}).get("current_counts"),
            "expected_after_write": pre_after.get("preflight", {}).get("expected_after_write"),
        },
        ensure_ascii=False,
    )
    assert pre_after["blockers"] == []
    assert pre_after["preflight"]["current_counts"]["target_manual_action_count"] == 1
    assert pre_after["preflight"]["current_counts"]["target_review_todo_count"] == 0
    assert pre_after["preflight"]["expected_after_write"]["target_manual_action_count"] == 2
    assert pre_after["preflight"]["expected_after_write"]["target_review_todo_count"] == 2

    written = apply_module.build_manual_action_apply_payload(
        selected_market_id=1,
        product_scope_id="parent_asin:B00K4W4AAA",
        expected_object_id="search_term:1:beach essentials",
        expected_object_type="search_term",
        action_type="add_to_review",
        execute=True,
        authorization_code="WRITE_ONCE:search_term:search_term:1:beach essentials",
        action_root=action_root,
        review_root=review_root,
    )

    assert written["status"] == "written_and_verified"
    assert written["will_write"] is True
    assert written["written_record"]["object_id"] == "search_term:1:beach essentials"
    assert len(written["written_record"]["evidence_snapshot"]) == 29
    snapshot_by_label = {item["label"]: item for item in written["written_record"]["evidence_snapshot"]}
    assert "beach essentials" in snapshot_by_label["搜索词"]["value"]
    assert "search_term:1:beach essentials" in snapshot_by_label["搜索词"]["value"]
    assert "人工确认和 7/14 天复盘对象是这个具体 SearchTerm" in snapshot_by_label["搜索词"]["detail"]
    assert snapshot_by_label["语义组"]["value"] == "规则语义：海滩出行用品"
    assert "不能替代顶部诊断入口" in snapshot_by_label["语义组"]["detail"]
    assert "当前商品范围" in snapshot_by_label["Parent ASIN入口"]["value"]
    assert "广告 ASIN" in snapshot_by_label["广告 ASIN承接"]["value"]
    assert "RBK004-beach essentials-精准" in snapshot_by_label["逐投放上下文"]["value"]
    assert "不能自动归因到单个广告 ASIN" in snapshot_by_label["逐投放上下文"]["detail"]
    assert "Top of Search on-Amazon" in snapshot_by_label["广告位活动级背景"]["value"]
    assert "不能替代广告组级广告位归因" in snapshot_by_label["广告位活动级背景"]["detail"]
    smoke = written["smoke_assertions"]
    assert smoke["target_manual_action_count"] == 2
    assert smoke["target_review_todo_count"] == 2
    assert smoke["target_review_record_count"] == 0
    assert smoke["written_evidence_snapshot_count"] == 29
    assert smoke["post_write_max_manual_action_evidence_snapshot_count"] == 29
    assert smoke["post_write_review_todo_evidence_snapshot_counts"] == {"7d": 29, "14d": 29}
    assert smoke["review_records_not_saved"] is True
    assert smoke["ad_actions_not_executed"] is True
