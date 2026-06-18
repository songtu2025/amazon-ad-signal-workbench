import json
import subprocess
import sys
from pathlib import Path

from openpyxl import Workbook

from app.services.aba_import import import_aba_workbook, write_aba_snapshot


PROJECT_ROOT = Path(__file__).resolve().parents[2]


ABA_HEADERS = [
    "国家",
    "关键词",
    "数据开始日期",
    "数据结束日期",
    "搜索量排名",
    "搜索查询量",
    "排名变化",
    "变化名次",
    "前三ASIN点击份额（%）",
    "前三ASIN转化份额（%）",
    "#1 ASIN",
    "#1 ASIN标题",
    "#1 ASIN点击份额（%）",
    "#1 ASIN转化份额（%）",
    "#2 ASIN",
    "#2 ASIN标题",
    "#2 ASIN点击份额（%）",
    "#2 ASIN转化份额（%）",
    "#3 ASIN",
    "#3 ASIN标题",
    "#3 ASIN点击份额（%）",
    "#3 ASIN转化份额（%）",
]


def create_aba_workbook(path: Path) -> None:
    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "关键词搜索热度"
    sheet.append(ABA_HEADERS)
    sheet.append(
        [
            "US",
            " Kids   Sunglasses ",
            "2026-05-10",
            "2026-05-16",
            120,
            None,
            "上升",
            8,
            0.42,
            0.18,
            "B0TOP1",
            "Top 1 product",
            0.24,
            0.11,
            "B0TOP2",
            "Top 2 product",
            0.12,
            0.05,
            "B0TOP3",
            "Top 3 product",
            0.06,
            0.02,
        ]
    )
    sheet.append(
        [
            "US",
            "  Polarized    Kids  ",
            "2026-05-10",
            "2026-05-16",
            70,
            None,
            "新上榜",
            None,
            0.2,
            0.08,
            "B0RAW",
            "Raw text product",
            0.1,
            0.03,
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            None,
        ]
    )
    sheet.append(
        [
            "US",
            "kids sunglasses",
            "2026-05-10",
            "2026-05-16",
            80,
            None,
            "上升",
            10,
            0.5,
            0.2,
            "B0BETTER",
            "Better ranked product",
            0.3,
            0.12,
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            None,
        ]
    )
    sheet.append(["US", None, "2026-05-10", "2026-05-16", 90])
    sheet.append(["US", "missing rank", "2026-05-10", "2026-05-16", None])
    workbook.save(path)


def test_import_aba_workbook_normalizes_and_deduplicates_rows(tmp_path) -> None:
    source_file = tmp_path / "aba.xlsx"
    create_aba_workbook(source_file)

    result = import_aba_workbook(
        source_file=source_file,
        marketplace_id=1,
        marketplace_code="US",
        start_date="2026-05-10",
        end_date="2026-05-16",
    )

    assert result.row_count == 2
    assert result.skipped_count == 2
    assert result.duplicate_count == 1
    assert len(result.file_hash) == 64

    record = next(item for item in result.records if item["normalized_query"] == "kids sunglasses")
    assert record["marketplace_id"] == 1
    assert record["marketplace_code"] == "US"
    assert "shop_id" not in record
    assert record["search_term"] == "kids sunglasses"
    assert record["normalized_query"] == "kids sunglasses"
    assert record["search_frequency_rank"] == 80
    assert record["rank_change_type"] == "上升"
    assert record["rank_change_value"] == 10
    assert record["top1_asin"] == "B0BETTER"
    assert record["top1_click_share"] == 0.3
    assert record["source_type"] == "ABA导出"
    assert record["source_table"] == "aba_search_term_snapshots"
    assert record["source_sheet"] == "关键词搜索热度"
    assert record["source_row_number"] == 4
    assert "search_query_volume" not in record

    raw_record = next(item for item in result.records if item["normalized_query"] == "polarized kids")
    assert raw_record["search_term"] == "Polarized    Kids"
    assert raw_record["normalized_query"] == "polarized kids"


def test_write_aba_snapshot_preserves_manifest_and_normalized_rows(tmp_path) -> None:
    source_file = tmp_path / "aba.xlsx"
    create_aba_workbook(source_file)
    result = import_aba_workbook(
        source_file=source_file,
        marketplace_id=1,
        marketplace_code="US",
        start_date="2026-05-10",
        end_date="2026-05-16",
    )

    snapshot_dir = write_aba_snapshot(result, snapshot_root=tmp_path / "aba_snapshots")

    manifest = json.loads((snapshot_dir / "manifest.json").read_text(encoding="utf-8"))
    records = json.loads(
        (snapshot_dir / "normalized" / "aba_search_term_snapshots.json").read_text(encoding="utf-8")
    )
    top_records = json.loads(
        (snapshot_dir / "normalized" / "aba_search_term_top1000.json").read_text(encoding="utf-8")
    )
    assert manifest["source"] == "erp_export"
    assert manifest["source_type"] == "ABA导出"
    assert manifest["marketplace_code"] == "US"
    assert manifest["row_count"] == 2
    assert manifest["top_rank_limit"] == 1000
    assert manifest["top_rank_index_count"] == 2
    assert manifest["skipped_count"] == 2
    assert manifest["duplicate_count"] == 1
    assert manifest["status"] == "success"
    source_record_ids = {item["source_record_id"] for item in records}
    assert "aba:US:2026-05-10:2026-05-16:kids sunglasses" in source_record_ids
    assert "aba:US:2026-05-10:2026-05-16:polarized kids" in source_record_ids
    assert [item["normalized_query"] for item in top_records] == ["polarized kids", "kids sunglasses"]


def test_import_aba_snapshot_script_writes_snapshot(tmp_path) -> None:
    source_file = tmp_path / "aba.xlsx"
    create_aba_workbook(source_file)

    result = subprocess.run(
        [
            sys.executable,
            str(PROJECT_ROOT / "scripts" / "import_aba_snapshot.py"),
            "--source-file",
            str(source_file),
            "--marketplace-id",
            "1",
            "--marketplace-code",
            "US",
            "--start-date",
            "2026-05-10",
            "--end-date",
            "2026-05-16",
            "--snapshot-root",
            str(tmp_path / "aba_snapshots"),
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
    assert Path(payload["snapshot_dir"]).exists()
