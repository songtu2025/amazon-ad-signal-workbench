from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import uvicorn

PROJECT_ROOT = Path(__file__).resolve().parents[1]
BACKEND_ROOT = PROJECT_ROOT / "backend"
sys.path.insert(0, str(BACKEND_ROOT))

from app.api import routes  # noqa: E402
from app.main import app  # noqa: E402
from app.models.product_scope import ProductScopeCoverage, ProductScopeOption, ProductScopeSummary  # noqa: E402
from app.models.snapshots import MarketOption, SnapshotReadiness, SnapshotStatus  # noqa: E402
from app.models.signals import (  # noqa: E402
    AdObjectRef,
    AiSignal,
    ConfidenceLevel,
    DataSourceRef,
    EvidencePackage,
    FreshnessStatus,
    MetricSnapshot,
    ObjectType,
    SignalPriority,
    SignalType,
    SuggestedAction,
)
from app.services import signal_triage  # noqa: E402


FIXTURE_SIGNAL_ID = "sig-ready-rule-feedback"
FIXTURE_ASIN = "B00READYASIN"
FIXTURE_MARKET_ID = 1


def _fixture_signal() -> AiSignal:
    return AiSignal(
        id=FIXTURE_SIGNAL_ID,
        signal_type=SignalType.OPPORTUNITY,
        signal_category="advertised_product_opportunity",
        priority=SignalPriority.P1,
        confidence=ConfidenceLevel.MEDIUM,
        shop_id="shop-rivbos",
        shop_name="rivbos",
        market_id=FIXTURE_MARKET_ID,
        marketplace="US",
        object_type=ObjectType.ADVERTISED_PRODUCT,
        severity=4,
        summary=f"{FIXTURE_ASIN} 已到期复盘样本",
        why="用于隔离验证 ready 复盘保存后规则反馈读回，不代表真实业务结论。",
        evidence=EvidencePackage(
            period_days=7,
            primary_object=AdObjectRef(
                object_type=ObjectType.ADVERTISED_PRODUCT,
                object_id=f"fixture:ad-product:{FIXTURE_ASIN}",
                label=FIXTURE_ASIN,
                asin=FIXTURE_ASIN,
            ),
            metrics=MetricSnapshot(cost=100, orders=1, sales=50),
        ),
        evidence_count=1,
        data_sources=[
            DataSourceRef(
                source_type="sample",
                source_name="隔离复盘样本",
                snapshot_id="fixture-ready-review",
                market_id=FIXTURE_MARKET_ID,
                source_table="ad_product_daily_metrics",
            )
        ],
        freshness_status=FreshnessStatus.SAMPLE_DATA,
        detected_at="2026-06-16T10:00:00+08:00",
        uncertainty="隔离浏览器验收样本，不作为真实运营结论。",
        suggested_action=SuggestedAction(
            action_type="manual_review",
            title="人工保存复盘记录",
            description="已到期 ready 效果只能由人工保存为复盘记录。",
        ),
        risk="只进入规则反馈解释层，不自动执行广告动作。",
    )


def _fixture_signal_rows() -> list[dict[str, object]]:
    return [
        {
            "market_id": FIXTURE_MARKET_ID,
            "object_type": "advertised_product",
            "source_table": "ad_product_daily_metrics",
            "asin": FIXTURE_ASIN,
            "start_date": "2026-06-01",
            "end_date": "2026-06-07",
            "cost": 100,
            "orders": 1,
            "sales": 50,
        },
        {
            "market_id": FIXTURE_MARKET_ID,
            "object_type": "advertised_product",
            "source_table": "ad_product_daily_metrics",
            "asin": FIXTURE_ASIN,
            "start_date": "2026-06-09",
            "end_date": "2026-06-15",
            "cost": 70,
            "orders": 6,
            "sales": 240,
        },
    ]


def _seed_ready_review_action(action_root: Path) -> None:
    payload = {
        "id": "manual-action-ready-review-fixture",
        "signal_id": FIXTURE_SIGNAL_ID,
        "action_type": "handled",
        "action_note": "隔离样本：已人工处理",
        "operator_name": "本地运营",
        "acted_at": "2026-06-08T00:00:00+00:00",
        "manual_status": "adopted",
        "snapshot_id": "fixture-before-review",
        "shop_id": "shop-rivbos",
        "market_id": FIXTURE_MARKET_ID,
        "object_type": "advertised_product",
        "object_id": FIXTURE_ASIN,
        "object_label": FIXTURE_ASIN,
    }
    path = action_root / "manual_actions.jsonl"
    path.write_text(json.dumps(payload, ensure_ascii=False) + "\n", encoding="utf-8")


def _install_ready_review_fixture(action_root: Path) -> None:
    fixture_signal = _fixture_signal()
    fixture_rows = _fixture_signal_rows()
    _seed_ready_review_action(action_root)

    routes._current_signals = lambda selected_market_id=None: [fixture_signal] if selected_market_id in (None, FIXTURE_MARKET_ID) else []
    routes.load_signal_rows_from_success_snapshots = lambda: fixture_rows
    signal_triage._current_signals = lambda signal_rows, selected_market_id=None: (
        [fixture_signal] if selected_market_id in (None, FIXTURE_MARKET_ID) else []
    )
    signal_triage.load_signal_rows_from_latest_snapshot = lambda: fixture_rows
    signal_triage.load_signal_rows_from_success_snapshots = lambda: fixture_rows
    signal_triage.load_snapshot_status = lambda: SnapshotStatus(
        has_snapshot=True,
        snapshot_id="fixture-ready-review",
        status="success",
        market_id=FIXTURE_MARKET_ID,
        shop_name="rivbos",
        marketplace_code="US",
        start_date="2026-06-01",
        end_date="2026-06-15",
    )
    product_scope = ProductScopeSummary(
        has_snapshot=True,
        snapshot_id="fixture-ready-review",
        market_id=FIXTURE_MARKET_ID,
        shop_name="rivbos",
        marketplace_code="US",
        options=[
            ProductScopeOption(
                scope_id="all",
                scope_type="all",
                label="全量排查（隔离复盘样本）",
                source="fixture",
                spend=70,
                orders=6,
                sales=240,
            )
        ],
        coverage=ProductScopeCoverage(
            sales_asin_count=0,
            advertised_asin_count=1,
            parent_asin_count=0,
            matched_asin_count=0,
            boundary="隔离 ready 复盘样本；只用于浏览器验收，不代表真实业务数据。",
        ),
    )
    routes.build_product_scope_summary = lambda: product_scope
    signal_triage.build_product_scope_summary = lambda: product_scope
    routes.load_market_options = lambda: [
        MarketOption(
            market_id=FIXTURE_MARKET_ID,
            shop_name="rivbos",
            marketplace_code="US",
            source="fixture",
        )
    ]
    routes.load_snapshot_status = lambda: SnapshotStatus(
        has_snapshot=True,
        snapshot_id="fixture-ready-review",
        status="success",
        market_id=FIXTURE_MARKET_ID,
        shop_name="rivbos",
        marketplace_code="US",
        start_date="2026-06-01",
        end_date="2026-06-15",
    )
    routes.load_snapshot_readiness = lambda selected_market_id=None: SnapshotReadiness(
        ready=True,
        can_request_api=False,
        missing=[],
        market_id=FIXTURE_MARKET_ID,
        auth_mode="fixture",
        has_snapshot=True,
        snapshot_status="success",
        snapshot_id="fixture-ready-review",
        reason="隔离 ready 复盘样本，不请求积加 API。",
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="启动使用临时人工动作运行态目录的本地 API 服务")
    parser.add_argument("--action-root", required=True, type=Path)
    parser.add_argument("--review-root", required=True, type=Path)
    parser.add_argument(
        "--ready-review-fixture",
        action="store_true",
        help="安装隔离 ready 复盘样本，用于浏览器验证保存复盘记录后的规则反馈状态。",
    )
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", default=8031, type=int)
    args = parser.parse_args()

    routes.MANUAL_ACTION_ROOT = args.action_root
    routes.REVIEW_RECORD_ROOT = args.review_root
    args.action_root.mkdir(parents=True, exist_ok=True)
    args.review_root.mkdir(parents=True, exist_ok=True)
    if args.ready_review_fixture:
        _install_ready_review_fixture(args.action_root)

    uvicorn.run(app, host=args.host, port=args.port)


if __name__ == "__main__":
    main()
