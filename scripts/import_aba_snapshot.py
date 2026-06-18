from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
BACKEND_ROOT = PROJECT_ROOT / "backend"
sys.path.insert(0, str(BACKEND_ROOT))

from app.services.aba_import import DEFAULT_ABA_SNAPSHOT_ROOT, import_aba_workbook, write_aba_snapshot  # noqa: E402


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="手动导入 ABA 搜索词导出快照")
    parser.add_argument("--source-file", type=Path, required=True)
    parser.add_argument("--marketplace-code", required=True)
    parser.add_argument("--start-date", required=True)
    parser.add_argument("--end-date", required=True)
    parser.add_argument("--marketplace-id", type=int, default=None)
    parser.add_argument("--source-sheet", default="关键词搜索热度")
    parser.add_argument("--snapshot-root", type=Path, default=DEFAULT_ABA_SNAPSHOT_ROOT)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    result = import_aba_workbook(
        source_file=args.source_file,
        marketplace_id=args.marketplace_id,
        marketplace_code=args.marketplace_code,
        start_date=args.start_date,
        end_date=args.end_date,
        source_sheet=args.source_sheet,
    )
    snapshot_dir = write_aba_snapshot(result, snapshot_root=args.snapshot_root)
    print(
        json.dumps(
            {
                "status": "success",
                "snapshot_dir": str(snapshot_dir),
                "source_file": str(result.source_file),
                "source_sheet": result.source_sheet,
                "marketplace_code": result.marketplace_code,
                "start_date": result.start_date,
                "end_date": result.end_date,
                "row_count": result.row_count,
                "skipped_count": result.skipped_count,
                "duplicate_count": result.duplicate_count,
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(json.dumps({"status": "failed", "error_message": str(exc)}, ensure_ascii=False, indent=2))
        raise SystemExit(1)
