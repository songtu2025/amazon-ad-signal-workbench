import json
import subprocess
import sys
from pathlib import Path

from openpyxl import Workbook

from app.services.parent_asin_import import import_parent_asin_workbook, write_parent_asin_snapshot
from app.services.parent_asin_store import load_parent_asin_rows_from_latest_snapshot


PROJECT_ROOT = Path(__file__).resolve().parents[2]


PARENT_ASIN_HEADERS = [
    "日期",
    "父ASIN",
    "变体数量",
    "售价",
    "ASIN",
    "MSKU",
    "店铺/站点",
    "亚马逊Brand",
    "国家",
    "区域",
    "产品名称",
    "SKU",
    "父产品名称",
    "SPU",
    "订单量",
    "销售额",
    "广告订单量",
    "广告花费",
    "广告销售额",
    "自然订单量",
    "Sessions-Total",
    "CVR",
]


def create_parent_asin_workbook(path: Path) -> None:
    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "按日导出"
    sheet.append(PARENT_ASIN_HEADERS)
    sheet.append(
        [
            "2026-05-10",
            "B0PARENT",
            2,
            19.99,
            "B0CHILD1",
            "MSKU-1",
            "RIVBOS-US",
            "RIVBOS",
            "US",
            "NA",
            "儿童太阳镜 粉",
            "SKU-1",
            "RIVBOS儿童眼镜",
            "KWF-1-SK",
            2,
            39.98,
            1,
            -8.5,
            19.99,
            1,
            100,
            0.02,
        ]
    )
    sheet.append(
        [
            "2026-05-11",
            "B0PARENT",
            2,
            19.99,
            "B0CHILD1",
            "MSKU-1",
            "RIVBOS-US",
            "RIVBOS",
            "US",
            "NA",
            "儿童太阳镜 粉",
            "SKU-1",
            "RIVBOS儿童眼镜",
            "KWF-1-SK",
            3,
            59.97,
            2,
            -12.25,
            39.98,
            1,
            120,
            0.025,
        ]
    )
    sheet.append(["2026-05-10", "B0PARENT", 2, 19.99, "B0CHILD2", "MSKU-2", "RIVBOS-US", "RIVBOS", "US", "NA", "儿童太阳镜 黑", "SKU-2"])
    sheet.append(["2026-05-10", None, 2, 19.99, "B0NO_PARENT"])
    sheet.append(["2026-05-10", "B0PARENT", 2, 19.99, None])
    workbook.save(path)


def test_import_parent_asin_workbook_aggregates_child_asin_rows(tmp_path: Path) -> None:
    source_file = tmp_path / "销售表现-父ASIN.xlsx"
    create_parent_asin_workbook(source_file)

    result = import_parent_asin_workbook(source_file=source_file, marketplace_id=1, marketplace_code="US")

    assert result.row_count == 2
    assert result.skipped_count == 2
    assert result.duplicate_count == 1
    assert result.start_date == "2026-05-10"
    assert result.end_date == "2026-05-11"
    assert len(result.file_hash) == 64

    record = next(item for item in result.records if item["asin"] == "B0CHILD1")
    assert record["parent_asin"] == "B0PARENT"
    assert record["sku"] == "SKU-1"
    assert record["msku"] == "MSKU-1"
    assert record["product_name"] == "儿童太阳镜 粉"
    assert record["parent_product_name"] == "RIVBOS儿童眼镜"
    assert record["orders"] == 5
    assert record["sales"] == 99.95
    assert record["ad_spend"] == 20.75
    assert record["ad_sales"] == 59.97
    assert record["ad_orders"] == 3
    assert record["organic_orders"] == 2
    assert record["source_type"] == "销售表现"
    assert record["source_table"] == "parent_asin_sales_performance"
    assert record["source_sheet"] == "按日导出"
    assert record["source_record_id"] == "parent-asin:US:B0PARENT:B0CHILD1"


def test_write_parent_asin_snapshot_and_store_loads_latest_rows(tmp_path: Path) -> None:
    source_file = tmp_path / "销售表现-父ASIN.xlsx"
    create_parent_asin_workbook(source_file)
    result = import_parent_asin_workbook(source_file=source_file, marketplace_id=1, marketplace_code="US")

    snapshot_dir = write_parent_asin_snapshot(result, snapshot_root=tmp_path / "parent_asin_snapshots")

    manifest = json.loads((snapshot_dir / "manifest.json").read_text(encoding="utf-8"))
    records = json.loads((snapshot_dir / "normalized" / "parent_asin_product_map.json").read_text(encoding="utf-8"))
    loaded_rows = load_parent_asin_rows_from_latest_snapshot(tmp_path / "parent_asin_snapshots")

    assert manifest["source"] == "erp_export"
    assert manifest["source_type"] == "销售表现"
    assert manifest["source_table"] == "parent_asin_sales_performance"
    assert manifest["row_count"] == 2
    assert manifest["status"] == "success"
    assert {item["asin"] for item in records} == {"B0CHILD1", "B0CHILD2"}
    assert {item["asin"] for item in loaded_rows} == {"B0CHILD1", "B0CHILD2"}
    assert all(item["source_name"] == "销售表现-父ASIN" for item in loaded_rows)


def test_import_parent_asin_snapshot_script_writes_snapshot(tmp_path: Path) -> None:
    source_file = tmp_path / "销售表现-父ASIN.xlsx"
    create_parent_asin_workbook(source_file)

    result = subprocess.run(
        [
            sys.executable,
            str(PROJECT_ROOT / "scripts" / "import_parent_asin_snapshot.py"),
            "--source-file",
            str(source_file),
            "--marketplace-id",
            "1",
            "--marketplace-code",
            "US",
            "--snapshot-root",
            str(tmp_path / "parent_asin_snapshots"),
        ],
        cwd=PROJECT_ROOT,
        capture_output=True,
        text=True,
    )

    assert result.returncode == 0, result.stderr
    payload = json.loads(result.stdout)
    assert payload["status"] == "success"
    assert payload["row_count"] == 2
    assert payload["skipped_count"] == 2
    assert payload["duplicate_count"] == 1
    assert payload["start_date"] == "2026-05-10"
    assert payload["end_date"] == "2026-05-11"
    assert Path(payload["snapshot_dir"]).exists()
