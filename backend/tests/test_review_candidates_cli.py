import importlib.util
import json
import sys
from pathlib import Path
from types import SimpleNamespace


def load_review_candidates_script():
    project_root = Path(__file__).resolve().parents[2]
    script_path = project_root / "scripts" / "inspect_review_candidates.py"
    spec = importlib.util.spec_from_file_location("inspect_review_candidates_script", script_path)
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules["inspect_review_candidates_script"] = module
    spec.loader.exec_module(module)
    return module


def make_signal(
    signal_id: str,
    *,
    object_type: str,
    signal_category: str = "search_term_opportunity",
    action_type: str | None = None,
    market_id: int | None = 1,
    shop_id: str | None = "market:1",
    shop_name: str | None = "rivbos",
    requires_manual_confirmation: bool = True,
    object_label: str | None = None,
    object_asin: str | None = None,
    priority: str = "P1",
    severity: int = 3,
) -> SimpleNamespace:
    return SimpleNamespace(
        id=signal_id,
        signal_type="opportunity",
        signal_category=signal_category,
        priority=priority,
        confidence="medium",
        market_id=market_id,
        marketplace="US",
        shop_id=shop_id,
        shop_name=shop_name,
        object_type=object_type,
        severity=severity,
        summary=f"{signal_id} summary",
        evidence_count=4,
        freshness_status="api_snapshot",
        suggested_action=SimpleNamespace(
            action_type=action_type
            or {
                "advertised_product_efficiency": "review_advertised_product_efficiency",
                "product_ad_coverage": "review_sales_product_ad_coverage",
                "search_term_performance_split": "review_search_term_split",
                "ad_group_structure": "review_multi_product_ad_group",
                "placement_efficiency": "review_placement_bid",
            }.get(signal_category, "promote_search_term"),
            title="人工复核",
            description="人工确认后记录处理结果",
            requires_manual_confirmation=requires_manual_confirmation,
        ),
        evidence=SimpleNamespace(
            primary_object=SimpleNamespace(
                object_id=f"{signal_id}-object",
                label=object_label or f"{signal_id} label",
                asin=object_asin,
            )
        ),
        data_sources=[SimpleNamespace(source_type="积加API", source_name="积加API快照", source_table="snapshot")],
    )


def test_review_candidates_keep_only_reviewable_ad_objects(monkeypatch) -> None:
    module = load_review_candidates_script()

    monkeypatch.setattr(module, "load_signal_rows_from_latest_snapshot", lambda: [{"row_id": "row-1"}])
    monkeypatch.setattr(
        module,
        "build_current_signals",
        lambda signal_rows, selected_market_id=None: [
            make_signal("sig-search-term", object_type="search_term"),
            make_signal("sig-cross", object_type="cross"),
            make_signal("sig-data-quality", object_type="advertised_product", signal_category="data_quality"),
            make_signal("sig-no-manual", object_type="placement", requires_manual_confirmation=False),
            make_signal("sig-other-market", object_type="ad_group", market_id=2),
        ],
    )
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

    payload = module.build_review_candidates_payload(selected_market_id=1)

    assert payload["status"] == "has_candidates"
    assert payload["candidate_count"] == 1
    assert payload["excluded_count"] == 4
    assert payload["candidates"][0]["signal_id"] == "sig-search-term"
    assert payload["candidates"][0]["object_type"] == "search_term"
    assert payload["candidates"][0]["object_id"] == "sig-search-term-object"
    assert payload["excluded_summary"]["cross_object"] == 1
    assert payload["excluded_summary"]["data_quality"] == 1
    assert payload["excluded_summary"]["no_manual_confirmation"] == 1
    assert payload["excluded_summary"]["market_mismatch"] == 1
    assert "人工处理动作" in payload["next_action"]


def test_review_candidates_recommends_parent_asin_ad_product_without_strategy_note(monkeypatch) -> None:
    module = load_review_candidates_script()

    monkeypatch.setattr(module, "load_signal_rows_from_latest_snapshot", lambda: [{"row_id": "row-1"}])
    monkeypatch.setattr(
        module,
        "build_current_signals",
        lambda signal_rows, selected_market_id=None: [
            make_signal("sig-placement", object_type="placement", object_label="Detail Page on-Amazon", priority="P0", severity=4),
            make_signal(
                "sig-main-push",
                object_type="advertised_product",
                signal_category="advertised_product_efficiency",
                object_label="B016EXMVZS",
                priority="P1",
                severity=3,
            ),
            make_signal(
                "sig-ad-product-candidate",
                object_type="advertised_product",
                signal_category="advertised_product_efficiency",
                object_label="B016EXMW02",
                priority="P1",
                severity=3,
            ),
        ],
    )
    monkeypatch.setattr(
        module,
        "build_product_scope_summary",
        lambda: SimpleNamespace(
            options=[
                SimpleNamespace(
                    scope_id="parent_asin:B00K4W4AAA",
                    scope_type="parent_asin",
                    parent_asin="B00K4W4AAA",
                    child_asins=["B016EXMVZS", "B016EXMW02"],
                    strategy_notes=[],
                ),
                SimpleNamespace(
                    scope_id="ad_asin:B016EXMVZS",
                    scope_type="advertised_asin",
                    asin="B016EXMVZS",
                    parent_asin="B00K4W4AAA",
                    strategy_notes=["B016EXMVZS 已标记为主推款"],
                ),
                SimpleNamespace(
                    scope_id="ad_asin:B016EXMW02",
                    scope_type="advertised_asin",
                    asin="B016EXMW02",
                    parent_asin="B00K4W4AAA",
                    strategy_notes=[],
                ),
            ],
        ),
        raising=False,
    )
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

    payload = module.build_review_candidates_payload(selected_market_id=1)

    assert payload["recommended_candidate"]["signal_id"] == "sig-ad-product-candidate"
    assert payload["recommended_candidate"]["object_label"] == "B016EXMW02"
    assert "Parent ASIN B00K4W4AAA" in payload["recommendation_reason"]
    assert "无主推款策略备注" in payload["recommendation_reason"]


def test_review_candidates_previews_manual_action_without_writing_runtime_records(monkeypatch) -> None:
    module = load_review_candidates_script()

    monkeypatch.setattr(module, "load_signal_rows_from_latest_snapshot", lambda: [{"row_id": "row-1"}])
    monkeypatch.setattr(
        module,
        "build_current_signals",
        lambda signal_rows, selected_market_id=None: [
            make_signal(
                "sig-ad-product-candidate",
                object_type="advertised_product",
                signal_category="advertised_product_efficiency",
                object_label="B016EXMW02",
                object_asin="B016EXMW02",
                priority="P1",
                severity=3,
            ),
        ],
    )
    monkeypatch.setattr(
        module,
        "build_product_scope_summary",
        lambda: SimpleNamespace(
            options=[
                SimpleNamespace(
                    scope_id="parent_asin:B00K4W4AAA",
                    scope_type="parent_asin",
                    parent_asin="B00K4W4AAA",
                    child_asins=["B016EXMW02"],
                    strategy_notes=[],
                ),
                SimpleNamespace(
                    scope_id="ad_asin:B016EXMW02",
                    scope_type="advertised_asin",
                    asin="B016EXMW02",
                    parent_asin="B00K4W4AAA",
                    strategy_notes=[],
                ),
            ],
        ),
        raising=False,
    )
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

    payload = module.build_review_candidates_payload(selected_market_id=1)

    preview = payload["manual_action_preview"]
    candidate = payload["recommended_candidate"]
    assert candidate["shop_id"] == "market:1"
    assert candidate["shop_name"] == "rivbos"
    assert preview["will_write"] is False
    assert preview["signal_id"] == "sig-ad-product-candidate"
    assert preview["action_type"] == "add_to_review"
    assert preview["object_type"] == "advertised_product"
    assert preview["object_id"] == "B016EXMW02"
    assert preview["object_label"] == "B016EXMW02"
    assert preview["shop_id"] == "market:1"
    assert preview["shop_name"] == "rivbos"
    assert preview["review_windows"] == ["7d", "14d"]


def test_review_candidates_reports_empty_state(monkeypatch) -> None:
    module = load_review_candidates_script()

    monkeypatch.setattr(module, "load_signal_rows_from_latest_snapshot", lambda: [])
    monkeypatch.setattr(module, "build_current_signals", lambda signal_rows, selected_market_id=None: [])
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

    payload = module.build_review_candidates_payload()

    assert payload["status"] == "empty"
    assert payload["candidate_count"] == 0
    assert "先确认真实快照" in payload["next_action"]


def test_review_candidates_cli_main_accepts_market_id(monkeypatch, capsys) -> None:
    module = load_review_candidates_script()
    captured: dict[str, object] = {}

    def fake_payload(*, selected_market_id=None):
        captured["selected_market_id"] = selected_market_id
        return {"status": "empty", "candidate_count": 0}

    monkeypatch.setattr(module, "build_review_candidates_payload", fake_payload)
    monkeypatch.setattr(sys, "argv", ["inspect_review_candidates.py", "--market-id", "2"])

    module.main()

    assert captured["selected_market_id"] == 2
    assert json.loads(capsys.readouterr().out)["status"] == "empty"
