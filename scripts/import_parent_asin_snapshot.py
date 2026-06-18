from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
BACKEND_ROOT = PROJECT_ROOT / "backend"
sys.path.insert(0, str(BACKEND_ROOT))

from app.services.parent_asin_import import (  # noqa: E402
    DEFAULT_PARENT_ASIN_SNAPSHOT_ROOT,
    DEFAULT_SOURCE_SHEET,
    import_parent_asin_workbook,
    write_parent_asin_snapshot,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="手动导入销售表现-父ASIN 导出快照")
    parser.add_argument("--source-file", type=Path, required=True)
    parser.add_argument("--marketplace-code", required=True)
    parser.add_argument("--marketplace-id", type=int, default=None)
    parser.add_argument("--source-sheet", default=DEFAULT_SOURCE_SHEET)
    parser.add_argument("--snapshot-root", type=Path, default=DEFAULT_PARENT_ASIN_SNAPSHOT_ROOT)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    result = import_parent_asin_workbook(
        source_file=args.source_file,
        marketplace_id=args.marketplace_id,
        marketplace_code=args.marketplace_code,
        source_sheet=args.source_sheet,
    )
    snapshot_dir = write_parent_asin_snapshot(result, snapshot_root=args.snapshot_root)
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
