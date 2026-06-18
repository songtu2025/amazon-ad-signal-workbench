import json
from pathlib import Path

from app.services.gerpgo_snapshot import GerpgoConfig
from app.services.market_options import load_market_options, save_probe_market_option


def write_json(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")


def test_market_options_use_latest_success_snapshot_labels_and_config_ids(tmp_path: Path) -> None:
    write_json(
        tmp_path / "gerpgo_market_1_20260614_010000" / "manifest.json",
        {
            "snapshot_id": "snapshot-1",
            "market_id": 1,
            "shop_name": "rivbos",
            "marketplace_code": "US",
            "created_at": "2026-06-14T01:00:00",
            "status": "success",
        },
    )
    write_json(
        tmp_path / "gerpgo_market_1_20260614_020000" / "manifest.json",
        {
            "snapshot_id": "failed-1",
            "market_id": 1,
            "shop_name": "failed shop",
            "marketplace_code": "CA",
            "created_at": "2026-06-14T02:00:00",
            "status": "failed",
        },
    )

    options = load_market_options(
        snapshot_root=tmp_path,
        config=GerpgoConfig(market_ids=[1, 2]),
        cache_path=tmp_path / "runtime" / "market_options.json",
    )

    assert [option.market_id for option in options] == [1, 2]
    assert options[0].shop_name == "rivbos"
    assert options[0].marketplace_code == "US"
    assert options[0].source == "snapshot"
    assert options[0].has_snapshot is True
    assert options[0].snapshot_id == "snapshot-1"
    assert options[1].shop_name == "market-2"
    assert options[1].source == "config"
    assert options[1].has_snapshot is False


def test_market_options_return_project_sample_when_no_snapshot_or_config(tmp_path: Path) -> None:
    options = load_market_options(
        snapshot_root=tmp_path,
        config=GerpgoConfig(),
        cache_path=tmp_path / "runtime" / "market_options.json",
    )

    assert len(options) == 1
    assert options[0].market_id == 1
    assert options[0].shop_name == "market-1"
    assert options[0].marketplace_code == "待探测"
    assert options[0].source == "project_sample"
    assert options[0].has_snapshot is False


def test_market_options_read_safe_probe_cache_before_config_option(tmp_path: Path) -> None:
    cache_path = tmp_path / "runtime" / "market_options.json"
    save_probe_market_option(
        market_id=1,
        market={"market_id": 1, "market_name": "rivbos US", "country": "US", "accessToken": "secret-token"},
        cache_path=cache_path,
    )

    options = load_market_options(
        snapshot_root=tmp_path / "api_snapshots",
        config=GerpgoConfig(market_ids=[1]),
        cache_path=cache_path,
    )

    assert len(options) == 1
    assert options[0].market_id == 1
    assert options[0].shop_name == "rivbos US"
    assert options[0].marketplace_code == "US"
    assert options[0].source == "probe_cache"
    assert options[0].has_snapshot is False
    assert "secret-token" not in cache_path.read_text(encoding="utf-8")


def test_market_options_ignore_unconfirmed_probe_cache(tmp_path: Path) -> None:
    cache_path = tmp_path / "runtime" / "market_options.json"
    write_json(
        cache_path,
        {
            "options": [
                {
                    "market_id": 1,
                    "shop_name": "market-1",
                    "marketplace_code": "待探测",
                    "country": None,
                    "source": "probe_cache",
                    "has_snapshot": False,
                    "snapshot_id": None,
                }
            ]
        },
    )

    options = load_market_options(
        snapshot_root=tmp_path / "api_snapshots",
        config=GerpgoConfig(market_ids=[1]),
        cache_path=cache_path,
    )

    assert len(options) == 1
    assert options[0].market_id == 1
    assert options[0].shop_name == "market-1"
    assert options[0].marketplace_code == "待探测"
    assert options[0].source == "config"
