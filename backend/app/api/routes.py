from fastapi import APIRouter, HTTPException

from app.models.manual_actions import (
    ManualActionRecord,
    ManualActionRequest,
    ReviewEffectResult,
    ReviewRecord,
    ReviewRecordRequest,
    ReviewTodo,
    ReviewWindow,
)
from app.models.product_scope import ProductScopeSummary
from app.models.snapshots import (
    MarketOption,
    SnapshotCreateRequest,
    SnapshotCreateResult,
    SnapshotInspectionResult,
    SnapshotPipelineResult,
    SnapshotProbeResult,
    SnapshotReadiness,
    SnapshotStatus,
)
from app.models.signals import AiSignal, SearchIntentSummary
from app.services.aba_store import load_aba_rows_from_latest_snapshot
from app.services.gerpgo_snapshot import check_snapshot_readiness, load_gerpgo_config, probe_gerpgo_market_access
from app.services.manual_actions import (
    DEFAULT_MANUAL_ACTION_ROOT,
    DEFAULT_REVIEW_RECORD_ROOT,
    apply_latest_manual_actions,
    apply_latest_review_records,
    build_review_todos,
    build_review_effect_result,
    load_manual_actions,
    load_review_records,
    manual_action_object_id,
    REVIEWABLE_ACTION_TYPES,
    save_manual_action,
    save_review_record,
)
from app.services.manual_action_preflight import build_manual_action_preflight_payload
from app.services.market_options import load_market_options, save_probe_market_option
from app.services.promotion_strategy_profiles import load_promotion_strategy_profiles
from app.services.product_scope import build_product_scope_summary
from app.services.signal_detection import detect_data_quality_signals, detect_signals, search_intent_summaries
from app.services.signal_scan_summary import build_signal_scan_summary
from app.services.signal_triage import build_signal_triage_payload
from app.services.snapshot_guidance import SNAPSHOT_API_FAILURE_NEXT_ACTION
from app.services.snapshot_request import (
    SNAPSHOT_CONFIG_NEXT_ACTION,
    SnapshotRequestFailed,
    SnapshotRequestNotReady,
    build_snapshot_failure_result,
    request_api_snapshot,
)
from app.services.snapshot_readiness import load_snapshot_readiness
from app.services.snapshot_inspection import inspect_api_snapshot
from app.services.snapshot_store import (
    PROJECT_ROOT,
    load_signal_rows_from_latest_snapshot,
    load_signal_rows_from_success_snapshots,
    load_snapshot_status,
)

router = APIRouter(prefix="/api")
MANUAL_ACTION_ROOT = DEFAULT_MANUAL_ACTION_ROOT
REVIEW_RECORD_ROOT = DEFAULT_REVIEW_RECORD_ROOT


@router.get("/signals", response_model=list[AiSignal])
def list_signals(market_id: int | None = None) -> list[AiSignal]:
    return _current_signals(selected_market_id=market_id)


def _current_signals(*, selected_market_id: int | None = None) -> list[AiSignal]:
    signal_rows = load_signal_rows_from_latest_snapshot()
    signals = detect_signals(
        signal_rows,
        aba_rows=load_aba_rows_from_latest_snapshot(),
        promotion_strategies=load_promotion_strategy_profiles(),
    )
    signals.extend(
        detect_data_quality_signals(
            load_snapshot_status(),
            _load_snapshot_readiness(selected_market_id=selected_market_id),
            signal_row_count=len(signal_rows),
        )
    )
    signals = apply_latest_manual_actions(signals, action_root=MANUAL_ACTION_ROOT)
    signals = apply_latest_review_records(signals, review_root=REVIEW_RECORD_ROOT)
    return sorted(signals, key=lambda item: item.severity, reverse=True)


@router.get("/signal-scan/summary")
def get_signal_scan_summary(market_id: int | None = None) -> dict:
    signal_rows = load_signal_rows_from_latest_snapshot()
    aba_rows = load_aba_rows_from_latest_snapshot()
    promotion_strategies = load_promotion_strategy_profiles()
    return build_signal_scan_summary(
        signal_rows=signal_rows,
        aba_rows=aba_rows,
        signals=_current_signals(selected_market_id=market_id),
        inspection=inspect_api_snapshot(),
        promotion_strategies=promotion_strategies,
    )


@router.get("/signal-triage")
def get_signal_triage(market_id: int | None = None, top: int = 5, product_scope_id: str | None = None) -> dict:
    triage_kwargs = {
        "selected_market_id": market_id,
        "top": top,
        "product_scope_id": product_scope_id,
    }
    if MANUAL_ACTION_ROOT != DEFAULT_MANUAL_ACTION_ROOT:
        triage_kwargs["action_root"] = MANUAL_ACTION_ROOT
    if REVIEW_RECORD_ROOT != DEFAULT_REVIEW_RECORD_ROOT:
        triage_kwargs["review_root"] = REVIEW_RECORD_ROOT
    return build_signal_triage_payload(**triage_kwargs)


@router.get("/manual-action/preflight")
def get_manual_action_preflight(
    market_id: int | None = None,
    top: int = 5,
    product_scope_id: str | None = None,
    expected_object_id: str | None = None,
    expected_object_type: str | None = None,
    action_type: str | None = None,
    expect_written: bool = False,
) -> dict:
    return build_manual_action_preflight_payload(
        selected_market_id=market_id,
        top=top,
        product_scope_id=product_scope_id,
        expected_object_id=expected_object_id,
        expected_object_type=expected_object_type,
        expected_action_type=action_type,
        expect_written=expect_written,
        action_root=MANUAL_ACTION_ROOT,
        review_root=REVIEW_RECORD_ROOT,
    )


@router.get("/signals/{signal_id}", response_model=AiSignal)
def get_signal(signal_id: str, market_id: int | None = None) -> AiSignal:
    for signal in _current_signals(selected_market_id=market_id):
        if signal.id == signal_id:
            return signal
    raise HTTPException(status_code=404, detail="signal_not_found")


@router.get("/signals/{signal_id}/manual-actions", response_model=list[ManualActionRecord])
def list_signal_manual_actions(signal_id: str, market_id: int | None = None) -> list[ManualActionRecord]:
    return load_manual_actions(signal_id, market_id=market_id, action_root=MANUAL_ACTION_ROOT)


@router.get("/signals/{signal_id}/review-todos", response_model=list[ReviewTodo])
def list_signal_review_todos(signal_id: str, market_id: int | None = None) -> list[ReviewTodo]:
    return build_review_todos(signal_id, market_id=market_id, action_root=MANUAL_ACTION_ROOT)


@router.get("/signals/{signal_id}/review-effect", response_model=ReviewEffectResult)
def get_signal_review_effect(
    signal_id: str,
    review_window: ReviewWindow = "7d",
    market_id: int | None = None,
) -> ReviewEffectResult:
    return build_review_effect_result(
        signal_id,
        review_window=review_window,
        market_id=market_id,
        action_root=MANUAL_ACTION_ROOT,
        signal_rows=load_signal_rows_from_success_snapshots(),
    )


@router.get("/signals/{signal_id}/review-records", response_model=list[ReviewRecord])
def list_signal_review_records(
    signal_id: str,
    market_id: int | None = None,
    object_type: str | None = None,
    object_id: str | None = None,
) -> list[ReviewRecord]:
    return load_review_records(
        signal_id,
        market_id=market_id,
        object_type=object_type,
        object_id=object_id,
        review_root=REVIEW_RECORD_ROOT,
    )


@router.post("/signals/{signal_id}/review-records", response_model=ReviewRecord)
def create_signal_review_record(
    signal_id: str,
    request: ReviewRecordRequest,
    review_window: ReviewWindow = "7d",
    market_id: int | None = None,
) -> ReviewRecord:
    effect = build_review_effect_result(
        signal_id,
        review_window=review_window,
        market_id=market_id,
        action_root=MANUAL_ACTION_ROOT,
        signal_rows=load_signal_rows_from_success_snapshots(),
    )
    try:
        return save_review_record(
            effect,
            review_note=request.review_note,
            reviewer_name=request.reviewer_name,
            expected_action_id=request.expected_action_id,
            expected_object_type=request.expected_object_type,
            expected_object_id=request.expected_object_id,
            expected_review_window=request.expected_review_window,
            expected_can_auto_change_rules=request.expected_can_auto_change_rules,
            expected_can_auto_execute_ads=request.expected_can_auto_execute_ads,
            review_root=REVIEW_RECORD_ROOT,
        )
    except ValueError as error:
        if str(error) == "review_effect_not_ready":
            raise HTTPException(status_code=409, detail="review_effect_not_ready") from error
        if str(error) in {
            "review_record_preflight_required",
            "review_record_preflight_mismatch",
            "review_record_forbidden_effect",
        }:
            raise HTTPException(status_code=409, detail=str(error)) from error
        raise


@router.get("/review-todos", response_model=list[ReviewTodo])
def list_review_todos(market_id: int | None = None) -> list[ReviewTodo]:
    return build_review_todos(market_id=market_id, action_root=MANUAL_ACTION_ROOT)


@router.post("/signals/{signal_id}/manual-actions", response_model=ManualActionRecord)
def create_signal_manual_action(signal_id: str, request: ManualActionRequest, market_id: int | None = None) -> ManualActionRecord:
    signal = _find_signal(signal_id, selected_market_id=market_id)
    source = signal.data_sources[0] if signal.data_sources else None
    primary_object = signal.evidence.primary_object
    object_type = primary_object.object_type.value
    object_id = manual_action_object_id(primary_object)
    if request.expected_can_auto_change_rules or request.expected_can_auto_execute_ads:
        raise HTTPException(status_code=409, detail="manual_action_forbidden_effect")
    if request.action_type in REVIEWABLE_ACTION_TYPES and not request.evidence_snapshot:
        raise HTTPException(status_code=409, detail="manual_action_missing_evidence_snapshot")
    if request.expected_object_type and request.expected_object_type != object_type:
        raise HTTPException(status_code=409, detail="manual_action_preflight_mismatch")
    if request.expected_object_id and request.expected_object_id != object_id:
        raise HTTPException(status_code=409, detail="manual_action_preflight_mismatch")
    if request.action_type in REVIEWABLE_ACTION_TYPES:
        _validate_manual_action_preflight(request, market_id=market_id)
    return save_manual_action(
        signal_id=signal.id,
        action_type=request.action_type,
        action_note=request.action_note,
        operator_name=request.operator_name,
        snapshot_id=source.snapshot_id if source else None,
        shop_id=signal.shop_id,
        market_id=signal.market_id,
        object_type=object_type,
        object_id=object_id,
        object_label=primary_object.label,
        evidence_snapshot=request.evidence_snapshot,
        action_root=MANUAL_ACTION_ROOT,
    )


def _find_signal(signal_id: str, *, selected_market_id: int | None = None) -> AiSignal:
    for signal in _current_signals(selected_market_id=selected_market_id):
        if signal.id == signal_id:
            return signal
    raise HTTPException(status_code=404, detail="signal_not_found")


def _validate_manual_action_preflight(request: ManualActionRequest, *, market_id: int | None) -> None:
    if not request.expected_object_type or not request.expected_object_id:
        raise HTTPException(status_code=409, detail="manual_action_preflight_required")
    preflight = build_manual_action_preflight_payload(
        selected_market_id=market_id,
        top=5,
        product_scope_id=_manual_action_preflight_product_scope_id(request.expected_product_scope_id),
        expected_object_id=request.expected_object_id,
        expected_object_type=request.expected_object_type,
        expected_action_type=request.action_type,
        expect_written=False,
        action_root=MANUAL_ACTION_ROOT,
        review_root=REVIEW_RECORD_ROOT,
    )
    if preflight.get("status") == "blocked" or preflight.get("blockers"):
        raise HTTPException(status_code=409, detail="manual_action_preflight_mismatch")

    target = preflight.get("target") if isinstance(preflight.get("target"), dict) else {}
    if target.get("object_type") != request.expected_object_type or target.get("object_id") != request.expected_object_id:
        raise HTTPException(status_code=409, detail="manual_action_preflight_mismatch")
    if target.get("action_type") and target.get("action_type") != request.action_type:
        raise HTTPException(status_code=409, detail="manual_action_preflight_mismatch")

    preview = preflight.get("evidence_snapshot_preview")
    preview_items = preview.get("items") if isinstance(preview, dict) else []
    if _manual_action_evidence_snapshot_signature(request.evidence_snapshot) != _manual_action_evidence_snapshot_signature(preview_items):
        raise HTTPException(status_code=409, detail="manual_action_evidence_snapshot_mismatch")


def _manual_action_preflight_product_scope_id(product_scope_id: str | None) -> str | None:
    text = str(product_scope_id or "").strip()
    if not text or text == "all":
        return None
    return text


def _manual_action_evidence_snapshot_signature(items: object) -> list[tuple[str, str, str, str]]:
    if not isinstance(items, list):
        return []
    signature: list[tuple[str, str, str, str]] = []
    for item in items:
        if hasattr(item, "model_dump"):
            item = item.model_dump()
        if not isinstance(item, dict):
            continue
        signature.append(
            (
                str(item.get("label") or "").strip(),
                str(item.get("value") or "").strip(),
                str(item.get("detail") or "").strip(),
                str(item.get("source") or "").strip(),
            )
        )
    return signature


@router.get("/search-intents", response_model=list[SearchIntentSummary])
def list_search_intents() -> list[SearchIntentSummary]:
    return search_intent_summaries(
        load_signal_rows_from_latest_snapshot(),
        aba_rows=load_aba_rows_from_latest_snapshot(),
    )


@router.get("/market-options", response_model=list[MarketOption])
def list_market_options() -> list[MarketOption]:
    return load_market_options()


@router.get("/product-scope", response_model=ProductScopeSummary)
def get_product_scope() -> ProductScopeSummary:
    return build_product_scope_summary()


@router.get("/snapshot/status", response_model=SnapshotStatus)
def get_snapshot_status() -> SnapshotStatus:
    return load_snapshot_status()


@router.get("/snapshot/readiness", response_model=SnapshotReadiness)
def get_snapshot_readiness(market_id: int | None = None) -> SnapshotReadiness:
    return _load_snapshot_readiness(selected_market_id=market_id)


def _load_snapshot_readiness(*, selected_market_id: int | None = None) -> SnapshotReadiness:
    if selected_market_id is None:
        return load_snapshot_readiness()
    return load_snapshot_readiness(selected_market_id=selected_market_id)


@router.get("/snapshot/inspection", response_model=SnapshotInspectionResult)
def get_snapshot_inspection() -> SnapshotInspectionResult:
    return SnapshotInspectionResult(**inspect_api_snapshot())


@router.post("/snapshot/create", response_model=SnapshotCreateResult)
async def create_snapshot(request: SnapshotCreateRequest) -> SnapshotCreateResult:
    try:
        result = await request_api_snapshot(request)
        return SnapshotCreateResult(
            **result.model_dump(exclude={"inspection"}),
            inspection=SnapshotInspectionResult(**inspect_api_snapshot()),
        )
    except SnapshotRequestNotReady as error:
        return SnapshotCreateResult(
            status="not_ready",
            can_request_api=False,
            missing=error.missing,
            next_action=SNAPSHOT_CONFIG_NEXT_ACTION,
            market_id=error.market_id,
            message="缺少积加 API 配置，不能拉取真实快照",
        )
    except SnapshotRequestFailed as error:
        return SnapshotCreateResult(
            **build_snapshot_failure_result(error).model_dump(exclude={"inspection"}),
            inspection=SnapshotInspectionResult(**inspect_api_snapshot()),
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except RuntimeError as error:
        return SnapshotCreateResult(
            **build_snapshot_failure_result(SnapshotRequestFailed(request.market_id, error)).model_dump(exclude={"inspection"}),
            inspection=SnapshotInspectionResult(**inspect_api_snapshot()),
        )


@router.post("/snapshot/probe", response_model=SnapshotProbeResult)
async def probe_snapshot_api(request: SnapshotCreateRequest) -> SnapshotProbeResult:
    config = load_gerpgo_config(PROJECT_ROOT)
    readiness = check_snapshot_readiness(config, selected_market_id=request.market_id)
    missing = [str(item) for item in readiness.get("missing") or []]
    market_id = readiness.get("market_id")
    if missing or market_id is None:
        if market_id is None and "GERPGO_MARKET_IDS" not in missing:
            missing.append("GERPGO_MARKET_IDS")
        return SnapshotProbeResult(
            status="not_ready",
            can_request_api=False,
            missing=missing,
            next_action=readiness.get("next_action") or SNAPSHOT_CONFIG_NEXT_ACTION,
            market_id=market_id,
            row_count=0,
            market=None,
            message="缺少积加 API 配置，不能探测真实接口",
        )
    try:
        result = await probe_gerpgo_market_access(config, int(market_id))
        if result.get("status") == "ready":
            save_probe_market_option(market_id=int(market_id), market=result.get("market"))
        return SnapshotProbeResult(can_request_api=True, missing=[], **result)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except RuntimeError:
        return SnapshotProbeResult(
            status="failed",
            can_request_api=True,
            next_action=SNAPSHOT_API_FAILURE_NEXT_ACTION,
            market_id=int(market_id),
            row_count=0,
            market=None,
            message="积加 API 轻量探测失败",
        )


@router.post("/snapshot/pipeline", response_model=SnapshotPipelineResult)
async def run_snapshot_pipeline(request: SnapshotCreateRequest) -> SnapshotPipelineResult:
    try:
        create_result = await request_api_snapshot(request)
        pipeline_status = "completed"
    except SnapshotRequestNotReady as error:
        create_result = SnapshotCreateResult(
            status="not_ready",
            can_request_api=False,
            missing=error.missing,
            next_action=SNAPSHOT_CONFIG_NEXT_ACTION,
            market_id=error.market_id,
            message="缺少积加 API 配置，不能拉取真实快照",
        )
        pipeline_status = "not_ready"
    except SnapshotRequestFailed as error:
        create_result = build_snapshot_failure_result(error)
        pipeline_status = "failed"
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except RuntimeError as error:
        create_result = build_snapshot_failure_result(SnapshotRequestFailed(request.market_id, error))
        pipeline_status = "failed"

    inspection = SnapshotInspectionResult(**inspect_api_snapshot())
    return SnapshotPipelineResult(
        pipeline_status=pipeline_status,
        create=create_result,
        inspection=inspection,
        signal_scan=_build_signal_scan_payload(
            selected_market_id=request.market_id,
            inspection=inspection.model_dump(mode="json"),
        ),
    )


def _build_signal_scan_payload(*, selected_market_id: int | None = None, inspection: dict | None = None) -> dict:
    signal_rows = load_signal_rows_from_latest_snapshot()
    aba_rows = load_aba_rows_from_latest_snapshot()
    promotion_strategies = load_promotion_strategy_profiles()
    signals = _current_signals(selected_market_id=selected_market_id)
    return {
        "ready_for_signals": bool((inspection or {}).get("ready_for_signals")),
        "inspection": inspection or {},
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
