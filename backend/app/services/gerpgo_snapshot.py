import asyncio
import json
import os
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any

import httpx

from app.services.snapshot_guidance import SNAPSHOT_API_FAILURE_NEXT_ACTION, SNAPSHOT_CONFIG_NEXT_ACTION
from app.services.snapshot_store import DEFAULT_SNAPSHOT_ROOT


ALLOWED_ENV_KEYS = {
    "GERPGO_BASE_URL",
    "GERPGO_APP_ID",
    "GERPGO_APP_KEY",
    "GERPGO_ACCESS_TOKEN",
    "GERPGO_MARKET_IDS",
}

FORBIDDEN_ACTION_KEYS = {
    "execute",
    "auto_execute",
    "execution_url",
    "execution_payload",
    "bid_adjustment",
    "new_bid",
    "pause_ad",
    "enable_ad",
    "negative_keyword",
    "create_keyword",
}

GERPGO_RATE_LIMIT_RULES: dict[str, dict[str, Any]] = {
    "/open/api_token": {
        "path": "/open/api_token",
        "status": "confirmed",
        "limit_text": "每 1 秒 10 次",
        "min_interval_seconds": 0.1,
        "source_name": "积加开放平台公开文档",
        "source_url": "https://open.gerpgo.com/document",
        "note": "公开文档搜索结果可见 token 接口限流规则。",
    },
    "/middle/base/marketNames/query": {
        "path": "/middle/base/marketNames/query",
        "status": "conservative",
        "limit_text": "项目保守规则：每次请求至少间隔 1.25 秒",
        "min_interval_seconds": 1.25,
        "source_name": "真实数据快照方案.md",
        "source_url": "",
        "note": "未查到公开单接口限流规则，按项目低频探测规则执行。",
    },
    "/operation/sts/salesAnalysis/page": {
        "path": "/operation/sts/salesAnalysis/page",
        "status": "conservative",
        "limit_text": "项目保守规则：销售表现分页至少间隔 5.2 秒",
        "min_interval_seconds": 5.2,
        "source_name": "真实数据快照方案.md",
        "source_url": "",
        "note": "未查到公开单接口限流规则，按已触发 90008 后的保守销售表现规则执行。",
    },
    "/operation/ads/adsSpProduct/query": {
        "path": "/operation/ads/adsSpProduct/query",
        "status": "conservative",
        "limit_text": "项目保守规则：每次请求至少间隔 1.25 秒",
        "min_interval_seconds": 1.25,
        "source_name": "真实数据快照方案.md",
        "source_url": "",
        "note": "未查到公开单接口限流规则，按项目低频快照规则执行。",
    },
    "/operation/ads/spSearchTargetingReport/page": {
        "path": "/operation/ads/spSearchTargetingReport/page",
        "status": "conservative",
        "limit_text": "项目保守规则：每次请求至少间隔 1.25 秒",
        "min_interval_seconds": 1.25,
        "source_name": "真实数据快照方案.md",
        "source_url": "",
        "note": "未查到公开单接口限流规则，按项目低频快照规则执行。",
    },
    "/operation/ads/spSearchKeywordsReport/page": {
        "path": "/operation/ads/spSearchKeywordsReport/page",
        "status": "conservative",
        "limit_text": "项目保守规则：每次请求至少间隔 1.25 秒",
        "min_interval_seconds": 1.25,
        "source_name": "真实数据快照方案.md",
        "source_url": "",
        "note": "未查到公开单接口限流规则，按项目低频快照规则执行。",
    },
    "/operation/ads/adsSpPlacement/page": {
        "path": "/operation/ads/adsSpPlacement/page",
        "status": "conservative",
        "limit_text": "项目保守规则：每次请求至少间隔 1.25 秒",
        "min_interval_seconds": 1.25,
        "source_name": "真实数据快照方案.md",
        "source_url": "",
        "note": "未查到公开单接口限流规则，按项目低频快照规则执行。",
    },
}


@dataclass
class GerpgoConfig:
    base_url: str = "https://open.gerpgo.com/api"
    app_id: str = ""
    app_key: str = ""
    access_token: str = ""
    market_ids: list[int] | None = None
    invalid_market_ids: bool = False


class GerpgoSnapshotClient:
    def __init__(self, config: GerpgoConfig) -> None:
        self.base_url = config.base_url.rstrip("/")
        self.app_id = config.app_id
        self.app_key = config.app_key
        self.access_token = config.access_token

    def ensure_configured(self) -> None:
        if self.access_token:
            if _looks_like_placeholder(self.access_token):
                raise ValueError("GERPGO_ACCESS_TOKEN 仍是示例值")
            return
        if not self.app_id or not self.app_key:
            raise ValueError("请在新项目 .env 中配置 GERPGO_APP_ID 和 GERPGO_APP_KEY，或设置 GERPGO_ACCESS_TOKEN")
        if _looks_like_placeholder(self.app_id) or _looks_like_placeholder(self.app_key):
            raise ValueError("GERPGO_APP_ID 或 GERPGO_APP_KEY 仍是示例值")

    async def get_access_token(self) -> str:
        if self.access_token:
            return self.access_token
        self.ensure_configured()
        rule = require_gerpgo_rate_limit_rule("/open/api_token")
        await _sleep_for_gerpgo_rate_limit(rule)
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(f"{self.base_url}/open/api_token", json={"appId": self.app_id, "appKey": self.app_key})
            response.raise_for_status()
            result = response.json()
        _raise_if_api_error(result, "积加 token 接口")
        token = (result.get("data") or {}).get("accessToken")
        if not token:
            raise RuntimeError("积加 accessToken 响应缺少 accessToken")
        self.access_token = str(token)
        return self.access_token

    async def post(self, path: str, payload: dict[str, Any]) -> dict[str, Any]:
        rule = require_gerpgo_rate_limit_rule(path)
        access_token = await self.get_access_token()
        await _sleep_for_gerpgo_rate_limit(rule)
        url = f"{self.base_url}{path}" if self.base_url.endswith("/open") else f"{self.base_url}/open{path}"
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(url, json=payload, headers={"accessToken": access_token})
            if response.status_code >= 400:
                raise RuntimeError(f"积加 HTTP 请求失败 {response.status_code}: {response.text[:500]}")
            result = response.json()
        _raise_if_api_error(result, "积加 API")
        _assert_no_auto_execution(result)
        return result


def query_gerpgo_rate_limit_rule(path: str) -> dict[str, Any]:
    canonical_path = _canonical_gerpgo_path(path)
    rule = GERPGO_RATE_LIMIT_RULES.get(canonical_path)
    if rule is None:
        return {
            "path": canonical_path,
            "status": "missing",
            "limit_text": "",
            "min_interval_seconds": None,
            "source_name": "",
            "source_url": "",
            "note": "未查询到积加 API 限流规则。",
        }
    return dict(rule)


def list_gerpgo_rate_limit_rules() -> dict[str, dict[str, Any]]:
    return {path: dict(GERPGO_RATE_LIMIT_RULES[path]) for path in sorted(GERPGO_RATE_LIMIT_RULES)}


def require_gerpgo_rate_limit_rule(path: str) -> dict[str, Any]:
    rule = query_gerpgo_rate_limit_rule(path)
    if rule["status"] == "missing":
        raise RuntimeError(f"未查询到积加 API 限流规则，已停止请求：{rule['path']}")
    return rule


async def _sleep_for_gerpgo_rate_limit(rule: dict[str, Any]) -> None:
    seconds = _number(rule.get("min_interval_seconds"))
    if seconds and seconds > 0:
        await asyncio.sleep(seconds)


async def create_gerpgo_snapshot(
    *,
    config: GerpgoConfig,
    market_id: int,
    days: int = 7,
    count: int = 10,
    max_pages: int = 1,
    sales_max_pages: int | None = None,
    force: bool = False,
    snapshot_root: Path = DEFAULT_SNAPSHOT_ROOT,
) -> dict[str, Any]:
    if days not in (7, 14, 30):
        raise ValueError("days 只能是 7、14 或 30")
    if count < 1 or count > 50:
        raise ValueError("count 必须在 1 到 50 之间")
    if max_pages < 1 or max_pages > 3:
        raise ValueError("max_pages 必须在 1 到 3 之间")
    resolved_sales_max_pages = sales_max_pages if sales_max_pages is not None else max_pages
    if resolved_sales_max_pages < 1 or resolved_sales_max_pages > 5:
        raise ValueError("sales_max_pages 必须在 1 到 5 之间")

    end = date.today()
    start = end - timedelta(days=days - 1)
    start_text = start.isoformat()
    end_text = end.isoformat()

    existing = find_existing_success_snapshot(snapshot_root, market_id=market_id, start_date=start_text, end_date=end_text)
    if existing and not force:
        manifest = json.loads((existing / "manifest.json").read_text(encoding="utf-8"))
        return {"status": "reused", "snapshot_dir": str(existing), "manifest": manifest}

    client = GerpgoSnapshotClient(config)
    client.ensure_configured()
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    snapshot_id = f"gerpgo_market_{market_id}_{timestamp}"
    created_at = datetime.now().isoformat(timespec="seconds")

    market_names_raw = await client.post("/middle/base/marketNames/query", {"markerIds": [market_id]})
    if _matching_market_row(market_names_raw, market_id) is None:
        raise RuntimeError("积加 API 未返回目标店铺站点，已停止完整快照拉取")

    raw_payloads = {
        "market_names": [market_names_raw],
        "sales_performance": await _fetch_sales_pages(client, market_id, start_text, end_text, count, resolved_sales_max_pages),
        "sp_advertised_products": await _fetch_next_id_pages(
            client, "/operation/ads/adsSpProduct/query", market_id, start_text, end_text, count, max_pages
        ),
        "sp_search_targeting_terms": await _fetch_next_id_pages(
            client, "/operation/ads/spSearchTargetingReport/page", market_id, start_text, end_text, count, max_pages
        ),
        "sp_search_keyword_terms": await _fetch_next_id_pages(
            client, "/operation/ads/spSearchKeywordsReport/page", market_id, start_text, end_text, count, max_pages
        ),
        "sp_placements": await _fetch_next_id_pages(
            client, "/operation/ads/adsSpPlacement/page", market_id, start_text, end_text, count, max_pages
        ),
    }

    payload = build_snapshot_payload(
        snapshot_id=snapshot_id,
        market_id=market_id,
        shop_name=_resolve_shop_name(raw_payloads, market_id) or f"market-{market_id}",
        marketplace_code=_resolve_marketplace_code(raw_payloads) or "",
        start_date=start_text,
        end_date=end_text,
        created_at=created_at,
        raw_payloads=raw_payloads,
    )
    payload["manifest"]["request_options"] = {
        "count": count,
        "max_pages": max_pages,
        "sales_max_pages": resolved_sales_max_pages,
    }
    snapshot_dir = write_snapshot_payload(snapshot_root, payload)
    return {"status": "success", "snapshot_dir": str(snapshot_dir), "manifest": payload["manifest"]}


async def probe_gerpgo_market_access(config: GerpgoConfig, market_id: int) -> dict[str, Any]:
    client = GerpgoSnapshotClient(config)
    client.ensure_configured()
    raw = await client.post("/middle/base/marketNames/query", {"markerIds": [market_id]})
    safe_rows = _safe_market_rows(raw, [market_id])
    matched = _matching_market_row(raw, market_id)
    if matched is None:
        return {
            "status": "not_ready",
            "api_name": "market_names",
            "market_id": market_id,
            "row_count": len(safe_rows),
            "market": None,
            "next_action": SNAPSHOT_API_FAILURE_NEXT_ACTION,
            "message": "积加 API 未返回目标店铺站点",
        }
    return {
        "status": "ready",
        "api_name": "market_names",
        "market_id": market_id,
        "row_count": len(safe_rows),
        "market": matched,
        "message": "积加 API 轻量探测通过",
    }


def _safe_market_rows(raw: dict[str, Any], market_ids: list[int] | None = None) -> list[dict[str, Any]]:
    data = raw.get("data")
    if isinstance(data, str):
        return _market_rows_from_text(data, market_ids or [])
    rows = data if isinstance(data, list) else []
    return [
        {
            "market_id": _integer(row.get("marketId") or row.get("market_id")),
            "market_name": _string(row.get("marketName") or row.get("market_name") or row.get("name")),
            "country": _string(row.get("countryCode") or row.get("marketplaceCode") or row.get("country")),
        }
        for row in rows
        if isinstance(row, dict)
    ]


def _market_rows_from_text(text: str, market_ids: list[int]) -> list[dict[str, Any]]:
    parts = [part.strip() for part in text.split(";") if part.strip()]
    rows: list[dict[str, Any]] = []
    for index, part in enumerate(parts):
        market_name = part
        country = None
        if ":" in part:
            market_name, country = part.split(":", 1)
        rows.append(
            {
                "market_id": market_ids[index] if index < len(market_ids) else None,
                "market_name": market_name.strip() or None,
                "country": country.strip() if country else None,
            }
        )
    return rows


def _matching_market_row(raw: dict[str, Any], market_id: int) -> dict[str, Any] | None:
    return next((row for row in _safe_market_rows(raw, [market_id]) if row["market_id"] == market_id), None)


def build_snapshot_payload(
    *,
    snapshot_id: str,
    market_id: int,
    shop_name: str,
    marketplace_code: str,
    start_date: str,
    end_date: str,
    created_at: str,
    raw_payloads: dict[str, list[dict[str, Any]]],
) -> dict[str, Any]:
    sales_rows = _rows(raw_payloads, "sales_performance")
    normalized = {
        "shops": [{"id": str(market_id), "shop_name": shop_name}],
        "marketplaces": [{"market_id": market_id, "marketplace_code": marketplace_code, "country": marketplace_code}],
        "sales_products": _normalize_sales_products(sales_rows),
        "sales_product_daily_metrics": _normalize_sales_product_daily_metrics(sales_rows, start_date, end_date),
        "advertised_products": _normalize_advertised_products(_rows(raw_payloads, "sp_advertised_products"), start_date, end_date),
        "ad_campaigns": _normalize_campaigns(raw_payloads),
        "ad_groups": _normalize_ad_groups(raw_payloads),
        "ad_search_term_daily_metrics": _normalize_search_terms(raw_payloads, start_date, end_date),
        "ad_placement_daily_metrics": _normalize_placements(_rows(raw_payloads, "sp_placements"), start_date, end_date),
    }
    row_counts = {name: len(rows) for name, rows in normalized.items() if isinstance(rows, list)}
    manifest = {
        "snapshot_id": snapshot_id,
        "source": "gerpgo",
        "market_id": market_id,
        "shop_name": shop_name,
        "marketplace_code": marketplace_code,
        "start_date": start_date,
        "end_date": end_date,
        "created_at": created_at,
        "api_list": list(raw_payloads.keys()),
        "row_counts": row_counts,
        "status": "success",
        "error_message": None,
    }
    return {"manifest": manifest, "raw": raw_payloads, "normalized": normalized}


def write_snapshot_payload(snapshot_root: Path, payload: dict[str, Any]) -> Path:
    snapshot_id = str(payload["manifest"]["snapshot_id"])
    snapshot_dir = snapshot_root / snapshot_id
    raw_dir = snapshot_dir / "raw"
    normalized_dir = snapshot_dir / "normalized"
    raw_dir.mkdir(parents=True, exist_ok=True)
    normalized_dir.mkdir(parents=True, exist_ok=True)

    _write_json(snapshot_dir / "manifest.json", payload["manifest"])
    for name, value in payload["raw"].items():
        _write_json(raw_dir / f"{name}.json", value)
    for name, value in payload["normalized"].items():
        _write_json(normalized_dir / f"{name}.json", value)
    return snapshot_dir


def find_existing_success_snapshot(snapshot_root: Path, *, market_id: int, start_date: str, end_date: str) -> Path | None:
    candidates: list[tuple[str, Path]] = []
    for manifest_path in snapshot_root.glob("*/manifest.json"):
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        if (
            manifest.get("status") == "success"
            and int(manifest.get("market_id") or 0) == market_id
            and manifest.get("start_date") == start_date
            and manifest.get("end_date") == end_date
        ):
            candidates.append((str(manifest.get("created_at") or ""), manifest_path.parent))
    if not candidates:
        return None
    return sorted(candidates, key=lambda item: item[0], reverse=True)[0][1]


def check_snapshot_readiness(config: GerpgoConfig, selected_market_id: int | None = None) -> dict[str, Any]:
    missing: list[str] = []
    market_id = selected_market_id or (config.market_ids or [None])[0]
    if selected_market_id is None and config.invalid_market_ids:
        missing.append("VALID_GERPGO_MARKET_IDS")
    elif market_id is None:
        missing.append("GERPGO_MARKET_IDS")

    auth_mode = "missing"
    if config.access_token:
        if _looks_like_placeholder(config.access_token):
            missing.append("VALID_GERPGO_ACCESS_TOKEN")
        else:
            auth_mode = "access_token"
    elif config.app_id and config.app_key:
        if _looks_like_placeholder(config.app_id) or _looks_like_placeholder(config.app_key):
            missing.append("VALID_GERPGO_APP_ID_AND_GERPGO_APP_KEY")
        else:
            auth_mode = "app_id_app_key"
    else:
        missing.append("GERPGO_APP_ID_AND_GERPGO_APP_KEY_OR_GERPGO_ACCESS_TOKEN")

    return {
        "ready": not missing,
        "missing": missing,
        "next_action": SNAPSHOT_CONFIG_NEXT_ACTION if missing else None,
        "market_id": market_id,
        "base_url_configured": bool(config.base_url),
        "auth_mode": auth_mode,
        "allowed_keys": sorted(ALLOWED_ENV_KEYS),
    }


def load_gerpgo_config(project_root: Path) -> GerpgoConfig:
    values = {} if os.environ.get("GERPGO_SKIP_DOTENV") == "1" else _load_dotenv(project_root / ".env")
    for key in ALLOWED_ENV_KEYS:
        if os.environ.get(key):
            values[key] = os.environ[key]
    market_ids: list[int] = []
    invalid_market_ids = False
    for value in values.get("GERPGO_MARKET_IDS", "").split(","):
        item = value.strip()
        if not item:
            continue
        try:
            market_ids.append(int(item))
        except ValueError:
            invalid_market_ids = True
    return GerpgoConfig(
        base_url=values.get("GERPGO_BASE_URL") or "https://open.gerpgo.com/api",
        app_id=values.get("GERPGO_APP_ID") or "",
        app_key=values.get("GERPGO_APP_KEY") or "",
        access_token=values.get("GERPGO_ACCESS_TOKEN") or "",
        market_ids=market_ids,
        invalid_market_ids=invalid_market_ids,
    )


async def _fetch_next_id_pages(
    client: GerpgoSnapshotClient,
    path: str,
    market_id: int,
    start_date: str,
    end_date: str,
    count: int,
    max_pages: int,
) -> list[dict[str, Any]]:
    pages: list[dict[str, Any]] = []
    next_id = 0
    seen_next_ids: set[int] = set()
    for page_index in range(max_pages):
        raw = await client.post(
            path,
            {"marketId": market_id, "startDataDate": start_date, "endDataDate": end_date, "count": count, "nextId": next_id},
        )
        pages.append(raw)
        rows = raw.get("data") or []
        page_next_id = _next_id(raw.get("extObj"))
        if not rows or page_next_id is None or page_next_id in seen_next_ids:
            break
        seen_next_ids.add(page_next_id)
        next_id = page_next_id
    return pages


async def _fetch_sales_pages(
    client: GerpgoSnapshotClient,
    market_id: int,
    start_date: str,
    end_date: str,
    count: int,
    max_pages: int,
) -> list[dict[str, Any]]:
    pages: list[dict[str, Any]] = []
    for page in range(1, max_pages + 1):
        raw = await client.post(
            "/operation/sts/salesAnalysis/page",
            {
                "groupByType": "seller_sku",
                "showCurrencyType": "USD",
                "beginDate": start_date,
                "endDate": end_date,
                "page": page,
                "pagesize": count,
                "isShowTotal": False,
                "marketId": market_id,
            },
        )
        pages.append(raw)
        if not raw.get("data"):
            break
    return pages


def _normalize_sales_products(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    products: list[dict[str, Any]] = []
    seen: set[tuple[int, str]] = set()
    for row in rows:
        market_id = _integer(row.get("marketId"))
        msku = _string(row.get("msku"))
        if market_id is None or not msku or (market_id, msku) in seen:
            continue
        seen.add((market_id, msku))
        products.append(
            {
                "id": f"{market_id}:{msku}",
                "market_id": market_id,
                "asin": _string(row.get("asin")),
                "parent_asin": _sales_parent_asin(row),
                "msku": msku,
                "sku": _string(row.get("sku")),
                "product_name": _string(row.get("productName")) or msku,
                "brand": _string(row.get("brand") or row.get("amzBrand")),
                "category": _string(row.get("category")),
            }
        )
    return products


def _normalize_sales_product_daily_metrics(rows: list[dict[str, Any]], start_date: str, end_date: str) -> list[dict[str, Any]]:
    metrics: list[dict[str, Any]] = []
    seen: set[tuple[int, str]] = set()
    for row in rows:
        market_id = _integer(row.get("marketId"))
        msku = _string(row.get("msku"))
        if market_id is None or not msku or (market_id, msku) in seen:
            continue
        seen.add((market_id, msku))
        metrics.append(
            {
                "id": f"{market_id}:{msku}:{start_date}:{end_date}",
                "market_id": market_id,
                "asin": _string(row.get("asin")),
                "parent_asin": _sales_parent_asin(row),
                "msku": msku,
                "sku": _string(row.get("sku")),
                "product_name": _string(row.get("productName")) or msku,
                "start_date": start_date,
                "end_date": end_date,
                "sessions": _integer(row.get("sessions")) or 0,
                "page_views": _integer(row.get("pageViews")) or 0,
                "orders": _integer(row.get("orders")) or 0,
                "units": _integer(row.get("unitsOrdered")) or 0,
                "sales": _number(row.get("orderProductSales")) or 0,
                "ad_orders": _integer(row.get("adsOrders")) or 0,
                "ad_spend": _number(row.get("adsSpend")) or 0,
                "ad_sales": _number(row.get("adsSales")) or 0,
            }
        )
    return metrics


def _sales_parent_asin(row: dict[str, Any]) -> str | None:
    return _string(row.get("variationAsin") or row.get("variation_asin") or row.get("parentAsin") or row.get("parent_asin"))


def _canonical_gerpgo_path(path: str) -> str:
    if not path.startswith("/"):
        path = f"/{path}"
    if path == "/api_token":
        return "/open/api_token"
    return path


def _normalize_advertised_products(rows: list[dict[str, Any]], start_date: str, end_date: str) -> list[dict[str, Any]]:
    products: list[dict[str, Any]] = []
    seen: set[tuple[int, str]] = set()
    for row in rows:
        market_id = _integer(row.get("marketId"))
        ad_id = _string(row.get("adId"))
        if market_id is None or not ad_id or (market_id, ad_id) in seen:
            continue
        seen.add((market_id, ad_id))
        products.append(
            {
                "id": f"{market_id}:{ad_id}",
                "market_id": market_id,
                "campaign_id": _string(row.get("campaignId")),
                "campaign_name": _string(row.get("campaignName")),
                "ad_group_id": _string(row.get("groupId")),
                "ad_group_name": _string(row.get("groupName")),
                "ad_id": ad_id,
                "asin": _string(row.get("asin")),
                "msku": _string(row.get("msku")),
                "start_date": start_date,
                "end_date": end_date,
                "impressions": _integer(row.get("impressions")) or 0,
                "clicks": _integer(row.get("clicks")) or 0,
                "spend": _number(row.get("cost")) or 0,
                "orders": _integer(row.get("adsOrders")) or 0,
                "sales": _number(row.get("adsSales")) or 0,
            }
        )
    return products


def _normalize_campaigns(raw_payloads: dict[str, list[dict[str, Any]]]) -> list[dict[str, Any]]:
    campaigns: dict[tuple[int, str], dict[str, Any]] = {}
    for row in _all_ad_rows(raw_payloads):
        market_id = _integer(row.get("marketId"))
        campaign_id = _string(row.get("campaignId"))
        if market_id is None or not campaign_id:
            continue
        campaigns[(market_id, campaign_id)] = {
            "campaign_id": campaign_id,
            "campaign_name": _string(row.get("campaignName")),
            "market_id": market_id,
        }
    return [campaigns[key] for key in sorted(campaigns)]


def _normalize_ad_groups(raw_payloads: dict[str, list[dict[str, Any]]]) -> list[dict[str, Any]]:
    groups: dict[tuple[int, str, str], dict[str, Any]] = {}
    for row in _all_ad_rows(raw_payloads):
        market_id = _integer(row.get("marketId"))
        campaign_id = _string(row.get("campaignId"))
        ad_group_id = _string(row.get("groupId"))
        if market_id is None or not campaign_id or not ad_group_id:
            continue
        groups[(market_id, campaign_id, ad_group_id)] = {
            "campaign_id": campaign_id,
            "ad_group_id": ad_group_id,
            "ad_group_name": _string(row.get("groupName")),
            "market_id": market_id,
        }
    return [groups[key] for key in sorted(groups)]


def _normalize_search_terms(raw_payloads: dict[str, list[dict[str, Any]]], start_date: str, end_date: str) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for source_name, report_type in [
        ("sp_search_targeting_terms", "targeting"),
        ("sp_search_keyword_terms", "keyword"),
    ]:
        for index, row in enumerate(_rows(raw_payloads, source_name), start=1):
            search_term = _string(row.get("searchTerm")) or _string(row.get("query")) or ""
            rows.append(
                {
                    "id": _string(row.get("id")) or f"{report_type}-{index}",
                    "source_report_type": report_type,
                    "market_id": _integer(row.get("marketId")),
                    "campaign_id": _string(row.get("campaignId")),
                    "campaign_name": _string(row.get("campaignName")),
                    "ad_group_id": _string(row.get("groupId")),
                    "ad_group_name": _string(row.get("groupName")),
                    "keyword_id": _string(row.get("keywordId")),
                    "target_id": _string(row.get("targetId")),
                    "keyword_text": _string(row.get("keywordText")) or _string(row.get("targetingText")),
                    "search_term": search_term,
                    "normalized_query": normalize_query(search_term),
                    "start_date": start_date,
                    "end_date": end_date,
                    "impressions": _integer(row.get("impressions")) or 0,
                    "clicks": _integer(row.get("clicks")) or 0,
                    "spend": _number(row.get("cost")) or 0,
                    "orders": _integer(row.get("adsOrders")) or _integer(row.get("orders")) or 0,
                    "sales": _number(row.get("adsSales")) or _number(row.get("sales")) or 0,
                }
            )
    return rows


def _normalize_placements(rows: list[dict[str, Any]], start_date: str, end_date: str) -> list[dict[str, Any]]:
    metrics: list[dict[str, Any]] = []
    for index, row in enumerate(rows, start=1):
        campaign_id = _string(row.get("campaignId"))
        placement = _string(row.get("placement"))
        market_id = _integer(row.get("marketId"))
        if market_id is None or not campaign_id or not placement:
            continue
        metrics.append(
            {
                "id": _string(row.get("id")) or f"placement-{index}",
                "market_id": market_id,
                "campaign_id": campaign_id,
                "campaign_name": _string(row.get("campaignName")),
                "placement": placement,
                "start_date": start_date,
                "end_date": end_date,
                "impressions": _integer(row.get("impressions")) or 0,
                "clicks": _integer(row.get("clicks")) or 0,
                "spend": _number(row.get("cost")) or 0,
                "orders": _integer(row.get("adsOrders")) or _integer(row.get("orders")) or 0,
                "sales": _number(row.get("adsSales")) or _number(row.get("sales")) or 0,
            }
        )
    return metrics


def normalize_query(value: str) -> str:
    return " ".join(value.strip().lower().split())


def _rows(raw_payloads: dict[str, list[dict[str, Any]]], name: str) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for page in raw_payloads.get(name, []):
        data = page.get("data") or []
        if isinstance(data, list):
            rows.extend(item for item in data if isinstance(item, dict))
        elif isinstance(data, dict):
            nested_rows = data.get("rows") or []
            if isinstance(nested_rows, list):
                rows.extend(item for item in nested_rows if isinstance(item, dict))
    return rows


def _all_ad_rows(raw_payloads: dict[str, list[dict[str, Any]]]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for name in ["sp_advertised_products", "sp_search_targeting_terms", "sp_search_keyword_terms", "sp_placements"]:
        rows.extend(_rows(raw_payloads, name))
    return rows


def _resolve_shop_name(raw_payloads: dict[str, list[dict[str, Any]]], market_id: int) -> str | None:
    for page in raw_payloads.get("market_names", []):
        for row in _safe_market_rows(page, [market_id]):
            if row.get("market_id") == market_id:
                return _string(row.get("market_name"))
    for row in _rows(raw_payloads, "market_names"):
        if _integer(row.get("marketId") or row.get("market_id")) == market_id:
            return _string(row.get("marketName") or row.get("market_name") or row.get("name"))
    return None


def _resolve_marketplace_code(raw_payloads: dict[str, list[dict[str, Any]]]) -> str | None:
    for page in raw_payloads.get("market_names", []):
        for row in _safe_market_rows(page):
            code = _string(row.get("country"))
            if code:
                return code
    for row in _rows(raw_payloads, "market_names"):
        code = _string(row.get("countryCode") or row.get("marketplaceCode") or row.get("country"))
        if code:
            return code
    return None


def _load_dotenv(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.exists():
        return values
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        if key in ALLOWED_ENV_KEYS:
            values[key] = value.strip().strip('"').strip("'")
    return values


def _write_json(path: Path, payload: Any) -> None:
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def _looks_like_placeholder(value: str) -> bool:
    return value.strip().lower() in {"your_app_id", "your_app_key", "your_access_token", "appid", "密钥"}


def _raise_if_api_error(result: dict[str, Any], label: str) -> None:
    code = result.get("code")
    if code in (0, 200, None):
        return
    messages = result.get("messages") or []
    message_text = " ".join(str(message) for message in messages) if isinstance(messages, list) else str(messages)
    if code == 90008 or "超过限制" in message_text or "调用次数" in message_text:
        raise RuntimeError("积加 API 已限流，请等待后重试；保持 count/max_pages 较低，并让 page_delay_seconds >= 1.2")
    raise RuntimeError(f"{label} 返回错误 code={code}, messages={messages}")


def _assert_no_auto_execution(value: Any) -> None:
    if isinstance(value, dict):
        for key, child in value.items():
            if str(key).lower() in FORBIDDEN_ACTION_KEYS:
                raise RuntimeError(f"积加响应包含疑似广告执行字段：{key}")
            _assert_no_auto_execution(child)
    elif isinstance(value, list):
        for child in value:
            _assert_no_auto_execution(child)


def _next_id(value: Any) -> int | None:
    if value in (None, "", 0, "0"):
        return None
    return int(value)


def _string(value: Any) -> str | None:
    if value in (None, ""):
        return None
    return str(value)


def _integer(value: Any) -> int | None:
    if value in (None, ""):
        return None
    return int(value)


def _number(value: Any) -> float | None:
    if value in (None, ""):
        return None
    return float(value)
