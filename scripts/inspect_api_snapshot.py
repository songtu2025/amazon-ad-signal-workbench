from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
BACKEND_ROOT = PROJECT_ROOT / "backend"
sys.path.insert(0, str(BACKEND_ROOT))

from app.services.snapshot_inspection import inspect_api_snapshot  # noqa: E402
from app.services.snapshot_store import DEFAULT_SNAPSHOT_ROOT  # noqa: E402


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="只读验收最新积加 API 快照")
    parser.add_argument("--snapshot-root", type=Path, default=DEFAULT_SNAPSHOT_ROOT)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    result = inspect_api_snapshot(args.snapshot_root)
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
