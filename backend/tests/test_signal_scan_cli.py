import importlib.util
import json
import sys

from app.models.snapshots import SnapshotReadiness, SnapshotStatus


def load_signal_scan_script():
    project_root = __import__("pathlib").Path(__file__).resolve().parents[2]
    script_path = project_root / "scripts" / "run_signal_scan.py"
    spec = importlib.util.spec_from_file_location("run_signal_scan_script", script_path)
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules["run_signal_scan_script"] = module
    spec.loader.exec_module(module)
    return module


def test_signal_scan_payload_reports_missing_snapshot_as_data_quality(monkeypatch) -> None:
    module = load_signal_scan_script()

    monkeypatch.setattr(module, "load_signal_rows_from_latest_snapshot", lambda: [])
    monkeypatch.setattr(module, "load_aba_rows_from_latest_snapshot", lambda: [])
    monkeypatch.setattr(module, "load_snapshot_status", lambda: SnapshotStatus(has_snapshot=False, status="missing"))
    monkeypatch.setattr(
        module,
        "load_snapshot_readiness",
        lambda selected_market_id=None: SnapshotReadiness(
            ready=False,
            can_request_api=False,
            missing=["GERPGO_ACCESS_TOKEN"],
            market_id=1,
            auth_mode="missing",
            has_snapshot=False,
            snapshot_status="missing",
            snapshot_id=None,
            reason="缺少积加 API 配置，不能拉取真实快照",
        ),
    )
    monkeypatch.setattr(
        module,
        "inspect_api_snapshot",
        lambda: {
            "status": "missing",
            "has_snapshot": False,
            "ready_for_signals": False,
            "snapshot_id": None,
            "signal_row_count": 0,
            "row_counts": {},
            "normalized_tables": [],
            "issues": ["NO_API_SNAPSHOT"],
        },
    )

    payload = module.build_signal_scan_payload()

    assert payload["inspection"]["status"] == "missing"
    assert payload["ready_for_signals"] is False
    assert payload["signal_row_count"] == 0
    assert payload["signal_count"] == 1
    assert payload["signals"][0]["id"] == "sig-data-quality-api-snapshot-missing"
    assert payload["signals"][0]["signal_category"] == "data_quality"
    assert payload["signals"][0]["suggested_action"]["requires_manual_confirmation"] is True
    assert "GERPGO_ACCESS_TOKEN" in json.dumps(payload["signals"][0], ensure_ascii=False)


def test_signal_scan_payload_uses_selected_market_id_for_readiness(monkeypatch) -> None:
    module = load_signal_scan_script()
    captured: dict[str, object] = {}

    monkeypatch.setattr(module, "load_signal_rows_from_latest_snapshot", lambda: [])
    monkeypatch.setattr(module, "load_aba_rows_from_latest_snapshot", lambda: [])
    monkeypatch.setattr(module, "load_snapshot_status", lambda: SnapshotStatus(has_snapshot=False, status="missing"))

    def fake_load_snapshot_readiness(*, selected_market_id=None):
        captured["selected_market_id"] = selected_market_id
        return SnapshotReadiness(
            ready=False,
            can_request_api=False,
            missing=["GERPGO_APP_ID_AND_GERPGO_APP_KEY_OR_GERPGO_ACCESS_TOKEN"],
            market_id=selected_market_id,
            auth_mode="missing",
            has_snapshot=False,
            snapshot_status="missing",
            snapshot_id=None,
            reason="缺少积加 API 配置，不能拉取真实快照",
        )

    monkeypatch.setattr(module, "load_snapshot_readiness", fake_load_snapshot_readiness)
    monkeypatch.setattr(
        module,
        "inspect_api_snapshot",
        lambda: {
            "status": "missing",
            "has_snapshot": False,
            "ready_for_signals": False,
            "snapshot_id": None,
            "signal_row_count": 0,
            "row_counts": {},
            "normalized_tables": [],
            "issues": ["NO_API_SNAPSHOT"],
        },
    )

    payload = module.build_signal_scan_payload(selected_market_id=1)

    assert captured["selected_market_id"] == 1
    assert payload["signals"][0]["market_id"] == 1
    assert payload["signals"][0]["evidence"]["source_rows"][0]["missing"] == [
        "GERPGO_APP_ID_AND_GERPGO_APP_KEY_OR_GERPGO_ACCESS_TOKEN"
    ]


def test_signal_scan_cli_main_accepts_market_id(monkeypatch, capsys) -> None:
    module = load_signal_scan_script()
    captured: dict[str, object] = {}

    def fake_build_signal_scan_payload(*, selected_market_id=None):
        captured["selected_market_id"] = selected_market_id
        return {
            "ready_for_signals": False,
            "inspection": {"status": "missing"},
            "signal_row_count": 0,
            "aba_row_count": 1000,
            "signal_count": 1,
            "signals": [{"id": "sig-data-quality-api-snapshot-missing", "market_id": selected_market_id}],
        }

    monkeypatch.setattr(module, "build_signal_scan_payload", fake_build_signal_scan_payload)
    monkeypatch.setattr(sys, "argv", ["run_signal_scan.py", "--market-id", "1"])

    module.main()

    payload = json.loads(capsys.readouterr().out)
    assert captured["selected_market_id"] == 1
    assert payload["signals"][0]["market_id"] == 1


def test_signal_scan_payload_uses_snapshot_rows_for_explainable_signals(monkeypatch) -> None:
    module = load_signal_scan_script()

    monkeypatch.setattr(
        module,
        "load_signal_rows_from_latest_snapshot",
        lambda: [
            {
                "row_id": "snapshot-1:row-1",
                "product_name": "RBK004 儿童太阳镜",
                "search_term": "kids sunglasses",
                "intent_label": "儿童太阳镜",
                "placement": "Rest of Search",
                "impressions": 1200,
                "clicks": 52,
                "cost": 48.5,
                "orders": 0,
                "sales": 0,
                "source_type": "api_snapshot",
                "snapshot_id": "snapshot-1",
                "shop_id": "shop-rivbos",
                "shop_name": "rivbos",
                "market_id": 1,
                "marketplace": "US",
                "country": "US",
                "start_date": "2026-06-08",
                "end_date": "2026-06-14",
                "api_name": "sp_search_targeting_terms",
                "source_table": "ad_search_term_daily_metrics",
                "source_record_id": "row-1",
            }
        ],
    )
    monkeypatch.setattr(module, "load_aba_rows_from_latest_snapshot", lambda: [])
    monkeypatch.setattr(
        module,
        "load_snapshot_status",
        lambda: SnapshotStatus(
            has_snapshot=True,
            snapshot_id="snapshot-1",
            source="gerpgo",
            market_id=1,
            shop_name="rivbos",
            marketplace_code="US",
            start_date="2026-06-08",
            end_date="2026-06-14",
            status="success",
            row_counts={"ad_search_term_daily_metrics": 1},
        ),
    )
    monkeypatch.setattr(
        module,
        "load_snapshot_readiness",
        lambda selected_market_id=None: SnapshotReadiness(
            ready=True,
            can_request_api=True,
            missing=[],
            market_id=1,
            auth_mode="access_token",
            has_snapshot=True,
            snapshot_status="success",
            snapshot_id="snapshot-1",
            shop_name="rivbos",
            marketplace_code="US",
            reason="已有成功快照",
        ),
    )
    monkeypatch.setattr(
        module,
        "inspect_api_snapshot",
        lambda: {
            "status": "ready",
            "has_snapshot": True,
            "ready_for_signals": True,
            "snapshot_id": "snapshot-1",
            "signal_row_count": 1,
            "row_counts": {"ad_search_term_daily_metrics": 1},
            "normalized_tables": [],
            "issues": [],
        },
    )

    payload = module.build_signal_scan_payload()

    assert payload["ready_for_signals"] is True
    assert payload["signal_row_count"] == 1
    assert payload["signal_count"] >= 1
    waste_signal = next(signal for signal in payload["signals"] if signal["id"].startswith("sig-waste-"))
    assert waste_signal["shop_name"] == "rivbos"
    assert waste_signal["freshness_status"] == "api_snapshot"
    assert waste_signal["data_sources"][0]["source_type"] == "积加API"
    assert waste_signal["data_sources"][0]["snapshot_id"] == "snapshot-1"
    assert waste_signal["evidence_count"] >= 1
