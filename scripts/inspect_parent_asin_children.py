from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
BACKEND_ROOT = PROJECT_ROOT / "backend"
sys.path.insert(0, str(BACKEND_ROOT))

from app.services.parent_asin_children_inspection import inspect_parent_asin_children  # noqa: E402
from app.services.snapshot_store import DEFAULT_SNAPSHOT_ROOT  # noqa: E402


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="只读校验 Parent ASIN 子 ASIN 证据覆盖")
    parser.add_argument("--parent-asin", required=True)
    parser.add_argument("--expected-count", type=int, default=None)
    parser.add_argument("--snapshot-root", type=Path, default=DEFAULT_SNAPSHOT_ROOT)
    parser.add_argument("--snapshot-dir", type=Path, default=None)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    result = inspect_parent_asin_children(
        parent_asin=args.parent_asin,
        snapshot_root=args.snapshot_root,
        snapshot_dir=args.snapshot_dir,
        expected_child_count=args.expected_count,
    )
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
