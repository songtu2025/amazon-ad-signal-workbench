import json
from pathlib import Path

from app.services.snapshot_readiness import load_snapshot_readiness


GERPGO_ENV_KEYS = [
    "GERPGO_BASE_URL",
    "GERPGO_APP_ID",
    "GERPGO_APP_KEY",
    "GERPGO_ACCESS_TOKEN",
    "GERPGO_MARKET_IDS",
]


def write_json(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")


def test_snapshot_readiness_reports_missing_config_without_secret_values(tmp_path: Path, monkeypatch) -> None:
    for key in GERPGO_ENV_KEYS:
        monkeypatch.delenv(key, raising=False)

    readiness = load_snapshot_readiness(project_root=tmp_path, snapshot_root=tmp_path / "snapshots")

    assert readiness.ready is False
    assert readiness.can_request_api is False
    assert readiness.has_snapshot is False
    assert readiness.snapshot_status == "missing"
    assert readiness.market_id is None
    assert readiness.missing == [
        "GERPGO_MARKET_IDS",
        "GERPGO_APP_ID_AND_GERPGO_APP_KEY_OR_GERPGO_ACCESS_TOKEN",
    ]
    assert readiness.next_action == "在新项目 .env 中配置 GERPGO_ACCESS_TOKEN，或配置 GERPGO_APP_ID 与 GERPGO_APP_KEY 后重新手动拉取快照"
    assert "secret" not in readiness.model_dump_json().lower()


def test_snapshot_readiness_combines_config_and_latest_snapshot(tmp_path: Path, monkeypatch) -> None:
    for key in GERPGO_ENV_KEYS:
        monkeypatch.delenv(key, raising=False)
    monkeypatch.setenv("GERPGO_MARKET_IDS", "1")
    monkeypatch.setenv("GERPGO_ACCESS_TOKEN", "secret-token")
    snapshot_root = tmp_path / "snapshots"
    write_json(
        snapshot_root / "gerpgo_market_1_20260614_010000" / "manifest.json",
        {
            "snapshot_id": "latest-snapshot",
            "source": "gerpgo",
            "market_id": 1,
            "shop_name": "rivbos",
            "marketplace_code": "US",
            "start_date": "2026-06-08",
            "end_date": "2026-06-14",
            "created_at": "2026-06-14T01:00:00",
            "api_list": ["sp_search_targeting_terms"],
            "row_counts": {"ad_search_term_daily_metrics": 2},
            "status": "success",
        },
    )

    readiness = load_snapshot_readiness(project_root=tmp_path, snapshot_root=snapshot_root)

    assert readiness.ready is True
    assert readiness.can_request_api is True
    assert readiness.has_snapshot is True
    assert readiness.snapshot_status == "success"
    assert readiness.snapshot_id == "latest-snapshot"
    assert readiness.market_id == 1
    assert readiness.auth_mode == "access_token"
    assert readiness.missing == []
    assert "secret-token" not in readiness.model_dump_json()
