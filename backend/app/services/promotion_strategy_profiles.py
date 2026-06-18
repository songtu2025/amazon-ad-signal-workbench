from __future__ import annotations

import json
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_PROMOTION_STRATEGY_PROFILE_PATH = PROJECT_ROOT / "data" / "runtime" / "promotion_strategy_profiles.json"
PROFILE_FIELDS = (
    "market_id",
    "shop_id",
    "ad_group_id",
    "asin",
    "strategy_role",
    "strategy_label",
    "start_date",
    "end_date",
    "source_type",
    "note",
    "updated_at",
)


def load_promotion_strategy_profiles(path: Path = DEFAULT_PROMOTION_STRATEGY_PROFILE_PATH) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    payload = json.loads(path.read_text(encoding="utf-8"))
    records = payload.get("profiles", []) if isinstance(payload, dict) else payload
    if not isinstance(records, list):
        return []
    return [_normalize_profile(record) for record in records if isinstance(record, dict)]


def _normalize_profile(record: dict[str, Any]) -> dict[str, Any]:
    profile = {field: record.get(field) for field in PROFILE_FIELDS if record.get(field) not in (None, "")}
    if "market_id" in profile:
        profile["market_id"] = int(profile["market_id"])
    return profile
