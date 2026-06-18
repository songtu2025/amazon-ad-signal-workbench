import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from app.services.aba_store import load_aba_rows_from_latest_snapshot  # noqa: E402
from app.services.promotion_strategy_profiles import load_promotion_strategy_profiles  # noqa: E402
from app.services.signal_detection import detect_data_quality_signals, detect_signals  # noqa: E402
from app.services.signal_scan_summary import build_signal_scan_summary  # noqa: E402
from app.services.snapshot_inspection import inspect_api_snapshot  # noqa: E402
from app.services.snapshot_readiness import load_snapshot_readiness  # noqa: E402
from app.services.snapshot_store import load_signal_rows_from_latest_snapshot, load_snapshot_status  # noqa: E402


def build_signal_scan_payload(*, selected_market_id: int | None = None) -> dict:
    signal_rows = load_signal_rows_from_latest_snapshot()
    aba_rows = load_aba_rows_from_latest_snapshot()
    snapshot_status = load_snapshot_status()
    snapshot_readiness = load_snapshot_readiness(selected_market_id=selected_market_id)
    inspection = inspect_api_snapshot()

    promotion_strategies = load_promotion_strategy_profiles()
    signals = detect_signals(signal_rows, aba_rows=aba_rows, promotion_strategies=promotion_strategies)
    signals.extend(
        detect_data_quality_signals(
            snapshot_status,
            snapshot_readiness,
            signal_row_count=len(signal_rows),
        )
    )
    signals = sorted(signals, key=lambda item: item.severity, reverse=True)

    return {
        "ready_for_signals": bool(inspection.get("ready_for_signals")),
        "inspection": inspection,
        "signal_row_count": len(signal_rows),
        "aba_row_count": len(aba_rows),
        "signal_count": len(signals),
        "summary": build_signal_scan_summary(
            signal_rows=signal_rows,
            aba_rows=aba_rows,
            signals=signals,
            inspection=inspection,
            promotion_strategies=promotion_strategies,
        ),
        "signals": [signal.model_dump(mode="json") for signal in signals],
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="只读扫描最新真实快照并生成 AI 信号")
    parser.add_argument("--market-id", type=int, default=None)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    print(json.dumps(build_signal_scan_payload(selected_market_id=args.market_id), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
