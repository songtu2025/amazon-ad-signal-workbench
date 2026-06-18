import json
from pathlib import Path
from typing import Any

from app.models.snapshots import MarketOption
from app.services.gerpgo_snapshot import GerpgoConfig, load_gerpgo_config
from app.services.snapshot_store import DEFAULT_SNAPSHOT_ROOT, PROJECT_ROOT

PROJECT_SAMPLE_MARKET_ID = 1
DEFAULT_MARKET_OPTIONS_CACHE = PROJECT_ROOT / "data" / "runtime" / "market_options.json"


def load_market_options(
    *,
    snapshot_root: Path = DEFAULT_SNAPSHOT_ROOT,
    project_root: Path = PROJECT_ROOT,
    config: GerpgoConfig | None = None,
    cache_path: Path = DEFAULT_MARKET_OPTIONS_CACHE,
) -> list[MarketOption]:
    gerpgo_config = config if config is not None else load_gerpgo_config(project_root)
    options_by_market: dict[int, tuple[str, MarketOption]] = {}

    for manifest_path in snapshot_root.glob("*/manifest.json"):
        manifest = _load_manifest(manifest_path)
        if manifest.get("status") != "success":
            continue
        market_id = _integer(manifest.get("market_id"))
        if market_id is None:
            continue
        option = MarketOption(
            market_id=market_id,
            shop_name=_string(manifest.get("shop_name")) or f"market-{market_id}",
            marketplace_code=_string(manifest.get("marketplace_code")) or "未知站点",
            country=_string(manifest.get("country")) or _string(manifest.get("marketplace_code")),
            source="snapshot",
            has_snapshot=True,
            snapshot_id=_string(manifest.get("snapshot_id")),
        )
        created_at = _string(manifest.get("created_at")) or ""
        current = options_by_market.get(market_id)
        if current is None or created_at > current[0]:
            options_by_market[market_id] = (created_at, option)

    for option in _load_probe_cache_options(cache_path):
        if option.market_id in options_by_market:
            continue
        options_by_market[option.market_id] = ("", option)

    for market_id in gerpgo_config.market_ids or []:
        if market_id in options_by_market:
            continue
        options_by_market[market_id] = (
            "",
            MarketOption(
                market_id=market_id,
                shop_name=f"market-{market_id}",
                marketplace_code="待探测",
                country=None,
                source="config",
                has_snapshot=False,
                snapshot_id=None,
            ),
        )

    if not options_by_market:
        options_by_market[PROJECT_SAMPLE_MARKET_ID] = (
            "",
            MarketOption(
                market_id=PROJECT_SAMPLE_MARKET_ID,
                shop_name=f"market-{PROJECT_SAMPLE_MARKET_ID}",
                marketplace_code="待探测",
                country=None,
                source="project_sample",
                has_snapshot=False,
                snapshot_id=None,
            ),
        )

    return [item[1] for item in sorted(options_by_market.values(), key=lambda item: item[1].market_id)]


def save_probe_market_option(
    *,
    market_id: int,
    market: dict[str, Any] | None,
    cache_path: Path = DEFAULT_MARKET_OPTIONS_CACHE,
) -> MarketOption:
    market_payload = market if isinstance(market, dict) else {}
    resolved_market_id = _integer(market_payload.get("market_id") or market_payload.get("marketId")) or market_id
    marketplace_code = (
        _string(market_payload.get("country"))
        or _string(market_payload.get("countryCode"))
        or _string(market_payload.get("marketplaceCode"))
        or "待探测"
    )
    option = MarketOption(
        market_id=resolved_market_id,
        shop_name=(
            _string(market_payload.get("market_name"))
            or _string(market_payload.get("marketName"))
            or _string(market_payload.get("name"))
            or f"market-{resolved_market_id}"
        ),
        marketplace_code=marketplace_code,
        country=marketplace_code if marketplace_code != "待探测" else None,
        source="probe_cache",
        has_snapshot=False,
        snapshot_id=None,
    )

    options_by_market = {cached.market_id: cached for cached in _load_probe_cache_options(cache_path)}
    options_by_market[option.market_id] = option
    cache_path.parent.mkdir(parents=True, exist_ok=True)
    cache_path.write_text(
        json.dumps(
            {"options": [item.model_dump(mode="json") for item in sorted(options_by_market.values(), key=lambda item: item.market_id)]},
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    return option


def _load_probe_cache_options(cache_path: Path) -> list[MarketOption]:
    try:
        payload = json.loads(cache_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return []
    rows = payload.get("options") if isinstance(payload, dict) else []
    options: list[MarketOption] = []
    for row in rows if isinstance(rows, list) else []:
        if not isinstance(row, dict):
            continue
        market_id = _integer(row.get("market_id"))
        if market_id is None:
            continue
        shop_name = _string(row.get("shop_name")) or f"market-{market_id}"
        marketplace_code = _string(row.get("marketplace_code")) or "待探测"
        if shop_name == f"market-{market_id}" and marketplace_code == "待探测":
            continue
        options.append(
            MarketOption(
                market_id=market_id,
                shop_name=shop_name,
                marketplace_code=marketplace_code,
                country=_string(row.get("country")),
                source="probe_cache",
                has_snapshot=False,
                snapshot_id=None,
            )
        )
    return options


def _load_manifest(path: Path) -> dict[str, Any]:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}
    return payload if isinstance(payload, dict) else {}


def _string(value: Any) -> str | None:
    if value in (None, ""):
        return None
    return str(value)


def _integer(value: Any) -> int | None:
    if value in (None, ""):
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None
