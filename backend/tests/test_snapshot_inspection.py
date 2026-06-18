import json
import subprocess
import sys
from pathlib import Path

from app.services.snapshot_inspection import inspect_api_snapshot


def write_json(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")


def test_inspect_api_snapshot_reports_row_count_mismatch(tmp_path: Path) -> None:
    snapshot_dir = tmp_path / "gerpgo_market_1_20260614_010000"
    write_json(
        snapshot_dir / "manifest.json",
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
            "row_counts": {"ad_search_term_daily_metrics": 2, "ad_placement_daily_metrics": 0},
            "status": "success",
        },
    )
    write_json(
        snapshot_dir / "normalized" / "ad_search_term_daily_metrics.json",
        [
            {
                "id": "search-row-1",
                "search_term": "kids sunglasses",
                "impressions": 100,
                "clicks": 5,
                "spend": 3.2,
                "orders": 0,
                "sales": 0,
            }
        ],
    )
    write_json(snapshot_dir / "normalized" / "ad_placement_daily_metrics.json", [])

    result = inspect_api_snapshot(tmp_path)

    assert result["status"] == "partial"
    assert result["snapshot_id"] == "latest-snapshot"
    assert result["ready_for_signals"] is True
    assert result["signal_row_count"] == 1
    assert "ROW_COUNT_MISMATCH:ad_search_term_daily_metrics" in result["issues"]
    search_table = next(item for item in result["normalized_tables"] if item["name"] == "ad_search_term_daily_metrics")
    assert search_table["manifest_row_count"] == 2
    assert search_table["actual_row_count"] == 1
    assert search_table["matches_manifest"] is False


def test_inspect_api_snapshot_cli_reports_missing_snapshot(tmp_path: Path) -> None:
    project_root = Path(__file__).resolve().parents[2]

    result = subprocess.run(
        [
            sys.executable,
            "scripts/inspect_api_snapshot.py",
            "--snapshot-root",
            str(tmp_path),
        ],
        cwd=project_root,
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode == 0
    payload = json.loads(result.stdout)
    assert payload["status"] == "missing"
    assert payload["has_snapshot"] is False
    assert payload["ready_for_signals"] is False
    assert payload["issues"] == ["NO_API_SNAPSHOT"]
    assert result.stderr == ""
