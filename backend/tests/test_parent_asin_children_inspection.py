import json
import subprocess
import sys
from pathlib import Path

from app.services.parent_asin_children_inspection import inspect_parent_asin_children


def write_json(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")


def create_snapshot(snapshot_root: Path) -> Path:
    snapshot_dir = snapshot_root / "gerpgo_market_1_20260615_125325"
    write_json(
        snapshot_dir / "manifest.json",
        {
            "snapshot_id": "gerpgo_market_1_20260615_125325",
            "source": "gerpgo",
            "market_id": 1,
            "shop_name": "rivbos",
            "marketplace_code": "US",
            "start_date": "2026-05-17",
            "end_date": "2026-06-15",
            "created_at": "2026-06-15T12:53:25",
            "status": "success",
            "row_counts": {
                "sales_products": 1,
                "sales_product_daily_metrics": 1,
            },
        },
    )
    write_json(
        snapshot_dir / "normalized" / "sales_products.json",
        [
            {
                "id": "sales-product-1",
                "asin": "B0CHILD01",
                "parent_asin": "B00K4W4AAA",
                "product_name": "销售表现子商品",
            }
        ],
    )
    write_json(
        snapshot_dir / "normalized" / "sales_product_daily_metrics.json",
        [
            {
                "id": "sales-daily-1",
                "asin": "B0CHILD02",
                "parentAsin": "B00K4W4AAA",
                "orders": 3,
                "sales": 39.9,
            }
        ],
    )
    write_json(
        snapshot_dir / "raw" / "sales_performance.json",
        [
            {
                "code": 200,
                "data": {
                    "total": 4,
                    "page": 1,
                    "rows": [
                        {"asin": "B0CHILD03", "variationAsin": "B00K4W4AAA"},
                        {"asin": "B0OTHER01", "variationAsin": "B0OTHERPARENT"},
                    ],
                },
            },
            {
                "code": 200,
                "data": {
                    "total": 4,
                    "page": 2,
                    "rows": [
                        {"asin": "B0CHILD04", "parent_asin": "B00K4W4AAA"},
                        {"asin": "B0CHILD01", "variationAsin": "B00K4W4AAA"},
                    ],
                },
            },
        ],
    )
    return snapshot_dir


def test_inspect_parent_asin_children_reads_normalized_and_raw_sources(tmp_path: Path) -> None:
    create_snapshot(tmp_path)

    result = inspect_parent_asin_children(
        parent_asin="B00K4W4AAA",
        snapshot_root=tmp_path,
        expected_child_count=12,
    )

    assert result["status"] == "partial"
    assert result["parent_asin"] == "B00K4W4AAA"
    assert result["expected_child_count"] == 12
    assert result["child_asin_count"] == 4
    assert result["child_asins"] == ["B0CHILD01", "B0CHILD02", "B0CHILD03", "B0CHILD04"]
    assert result["is_complete"] is False
    assert result["snapshot"]["snapshot_id"] == "gerpgo_market_1_20260615_125325"
    assert result["snapshot"]["start_date"] == "2026-05-17"
    assert result["snapshot"]["end_date"] == "2026-06-15"
    assert result["raw_sales_performance"]["fetched_rows"] == 4
    assert result["raw_sales_performance"]["reported_total"] == 4
    assert result["evidence_sources"] == [
        {"source": "normalized.sales_products", "row_count": 1, "matched_count": 1},
        {"source": "normalized.sales_product_daily_metrics", "row_count": 1, "matched_count": 1},
        {"source": "raw.sales_performance.variationAsin", "row_count": 4, "matched_count": 3},
    ]
    assert "当前快照只能证明已识别 4 个子 ASIN" in result["message"]
    assert "不能证明完整数量为 12" in result["message"]


def test_inspect_parent_asin_children_returns_missing_without_success_snapshot(tmp_path: Path) -> None:
    result = inspect_parent_asin_children(parent_asin="B00K4W4AAA", snapshot_root=tmp_path, expected_child_count=12)

    assert result["status"] == "missing"
    assert result["child_asin_count"] == 0
    assert result["child_asins"] == []
    assert result["is_complete"] is False
    assert result["message"] == "没有可用的成功 API 快照，不能校验 Parent ASIN 子 ASIN。"


def test_inspect_parent_asin_children_cli_outputs_json(tmp_path: Path) -> None:
    create_snapshot(tmp_path)
    project_root = Path(__file__).resolve().parents[2]

    result = subprocess.run(
        [
            sys.executable,
            "scripts/inspect_parent_asin_children.py",
            "--parent-asin",
            "B00K4W4AAA",
            "--expected-count",
            "12",
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
    assert payload["status"] == "partial"
    assert payload["child_asin_count"] == 4
    assert payload["child_asins"] == ["B0CHILD01", "B0CHILD02", "B0CHILD03", "B0CHILD04"]
    assert result.stderr == ""
