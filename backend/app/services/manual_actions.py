import json
from datetime import UTC, date, datetime, timedelta
from pathlib import Path
from typing import Any
from uuid import uuid4

from app.models.manual_actions import (
    ManualActionEvidenceSnapshot,
    ManualActionRecord,
    ManualActionType,
    ReviewContext,
    ReviewEffectResult,
    ReviewRecord,
    ReviewTodo,
    ReviewWindow,
)
from app.models.signals import AdObjectRef, AiSignal, ObjectType, SignalStatus
from app.services.snapshot_store import PROJECT_ROOT


DEFAULT_MANUAL_ACTION_ROOT = PROJECT_ROOT / "data" / "runtime" / "manual_actions"
DEFAULT_REVIEW_RECORD_ROOT = PROJECT_ROOT / "data" / "runtime" / "review_records"
MANUAL_ACTION_FILE_NAME = "manual_actions.jsonl"
REVIEW_RECORD_FILE_NAME = "review_records.jsonl"
REVIEW_WINDOWS: tuple[tuple[ReviewWindow, int], ...] = (("7d", 7), ("14d", 14))
REVIEWABLE_ACTION_TYPES: set[ManualActionType] = {"observe", "handled", "add_to_review"}


def manual_action_object_id_for_values(
    *,
    object_type: str | None,
    object_id: str | None,
    asin: str | None = None,
    msku: str | None = None,
    sku: str | None = None,
) -> str | None:
    if object_type in {ObjectType.ADVERTISED_PRODUCT.value, ObjectType.SALES_PRODUCT.value}:
        return asin or msku or sku or object_id
    return object_id


def manual_action_object_id(primary_object: AdObjectRef) -> str:
    return (
        manual_action_object_id_for_values(
            object_type=primary_object.object_type.value,
            object_id=primary_object.object_id,
            asin=primary_object.asin,
            msku=primary_object.msku,
            sku=primary_object.sku,
        )
        or primary_object.object_id
    )


def save_manual_action(
    *,
    signal_id: str,
    action_type: ManualActionType,
    action_note: str | None = None,
    operator_name: str = "本地运营",
    snapshot_id: str | None = None,
    shop_id: str | None = None,
    market_id: int | None = None,
    object_type: str | None = None,
    object_id: str | None = None,
    object_label: str | None = None,
    evidence_snapshot: list[ManualActionEvidenceSnapshot] | None = None,
    action_root: Path = DEFAULT_MANUAL_ACTION_ROOT,
) -> ManualActionRecord:
    record = ManualActionRecord(
        id=f"manual-action-{uuid4().hex}",
        signal_id=signal_id,
        action_type=action_type,
        action_note=action_note,
        operator_name=operator_name or "本地运营",
        acted_at=datetime.now(UTC).isoformat(),
        manual_status=manual_status_for_action(action_type),
        snapshot_id=snapshot_id,
        shop_id=shop_id,
        market_id=market_id,
        object_type=object_type,
        object_id=object_id,
        object_label=object_label,
        evidence_snapshot=evidence_snapshot or [],
    )
    action_root.mkdir(parents=True, exist_ok=True)
    with _action_file(action_root).open("a", encoding="utf-8") as file:
        file.write(json.dumps(record.model_dump(mode="json"), ensure_ascii=False) + "\n")
    return record


def load_manual_actions(
    signal_id: str | None = None,
    *,
    market_id: int | None = None,
    action_root: Path = DEFAULT_MANUAL_ACTION_ROOT,
) -> list[ManualActionRecord]:
    path = _action_file(action_root)
    if not path.exists():
        return []
    records: list[ManualActionRecord] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        try:
            record = ManualActionRecord.model_validate(json.loads(line))
        except (json.JSONDecodeError, ValueError):
            continue
        record = _normalize_manual_action_record(record)
        if (signal_id is None or record.signal_id == signal_id) and (market_id is None or record.market_id == market_id):
            records.append(record)
    return records


def _normalize_manual_action_record(record: ManualActionRecord) -> ManualActionRecord:
    operator_name = record.operator_name
    action_note = record.action_note
    update: dict[str, Any] = {}
    if _is_question_mark_text(operator_name):
        update["operator_name"] = "本地运营"
    if action_note is not None and _is_question_mark_text(action_note):
        update["action_note"] = None
    if not update:
        return record
    return record.model_copy(update=update)


def _is_question_mark_text(value: str | None) -> bool:
    text = (value or "").strip()
    return bool(text) and set(text) == {"?"}


def latest_manual_action(
    signal_id: str,
    *,
    market_id: int | None = None,
    action_root: Path = DEFAULT_MANUAL_ACTION_ROOT,
) -> ManualActionRecord | None:
    records = load_manual_actions(signal_id, market_id=market_id, action_root=action_root)
    if not records:
        return None
    return max(records, key=lambda record: record.acted_at)


def apply_latest_manual_actions(signals: list[AiSignal], *, action_root: Path = DEFAULT_MANUAL_ACTION_ROOT) -> list[AiSignal]:
    latest_by_signal: dict[tuple[str, int | None], ManualActionRecord] = {}
    for record in load_manual_actions(action_root=action_root):
        key = (record.signal_id, record.market_id)
        current = latest_by_signal.get(key)
        if current is None or record.acted_at > current.acted_at:
            latest_by_signal[key] = record

    enriched: list[AiSignal] = []
    for signal in signals:
        record = latest_by_signal.get((signal.id, signal.market_id))
        if record is None:
            enriched.append(signal)
            continue
        enriched.append(signal.model_copy(update={"status": record.manual_status, "manual_status": record.manual_status}))
    return enriched


def build_review_todos(
    signal_id: str | None = None,
    *,
    market_id: int | None = None,
    action_root: Path = DEFAULT_MANUAL_ACTION_ROOT,
    now: datetime | None = None,
) -> list[ReviewTodo]:
    current_time = now or datetime.now(UTC)
    if current_time.tzinfo is None:
        current_time = current_time.replace(tzinfo=UTC)

    todo_records = load_manual_actions(signal_id, market_id=market_id, action_root=action_root)
    context_records = load_manual_actions(market_id=market_id, action_root=action_root)

    latest_by_signal: dict[tuple[str, int | None], ManualActionRecord] = {}
    for record in todo_records:
        key = (record.signal_id, record.market_id)
        current = latest_by_signal.get(key)
        if current is None or record.acted_at > current.acted_at:
            latest_by_signal[key] = record

    todos: list[ReviewTodo] = []
    for record in latest_by_signal.values():
        if record.action_type not in REVIEWABLE_ACTION_TYPES:
            continue
        acted_at = _parse_action_time(record.acted_at)
        days_since_action = max(0, int((current_time - acted_at).total_seconds() // 86400))
        for review_window, window_days in REVIEW_WINDOWS:
            due_at = acted_at + timedelta(days=window_days)
            todos.append(
                ReviewTodo(
                    signal_id=record.signal_id,
                    action_id=record.id,
                    action_type=record.action_type,
                    manual_status=record.manual_status,
                    action_note=record.action_note,
                    operator_name=record.operator_name,
                    acted_at=record.acted_at,
                    snapshot_id=record.snapshot_id,
                    shop_id=record.shop_id,
                    market_id=record.market_id,
                    object_type=record.object_type,
                    object_id=record.object_id,
                    object_label=record.object_label,
                    evidence_snapshot=record.evidence_snapshot,
                    review_context=review_context_for_manual_action(record, context_records),
                    review_window=review_window,
                    due_at=due_at.isoformat(),
                    is_due=current_time >= due_at,
                    days_since_action=days_since_action,
                )
            )
    return sorted(todos, key=lambda todo: (todo.due_at, todo.signal_id, todo.review_window))


def review_context_for_manual_action(record: ManualActionRecord, records: list[ManualActionRecord]) -> ReviewContext | None:
    search_intent_label = _evidence_value(record, "语义组")
    search_term = _evidence_value(record, "搜索词")
    if not search_term and record.object_type == ObjectType.SEARCH_TERM.value:
        search_term = record.object_label or record.object_id
    aba_reference_term = _evidence_value(record, "ABA语义参考词")
    aba_reference_rank = _evidence_value(record, "ABA语义参考排名")
    aba_period = _evidence_value(record, "ABA周期")
    aba_match_boundary = _evidence_value(record, "ABA匹配边界")
    manual_action_path = _evidence_value(record, "人工动作路径")
    review_metrics = _evidence_value(record, "复盘指标")

    aba_rank_text = _evidence_value(record, "ABA排名")
    if not aba_reference_rank and aba_rank_text:
        aba_reference_rank = aba_rank_text.split("/")[0].strip()
    if not aba_period and aba_rank_text and "/" in aba_rank_text:
        aba_period = aba_rank_text.split("/", 1)[1].strip()

    if not any(
        [
            search_intent_label,
            search_term,
            aba_reference_term,
            aba_reference_rank,
            aba_period,
            aba_match_boundary,
            manual_action_path,
            review_metrics,
        ]
    ):
        return None

    repeat_search_intent_count = _repeat_context_count(
        records,
        market_id=record.market_id,
        label="语义组",
        value=search_intent_label,
    )
    repeat_aba_reference_count = _repeat_context_count(
        records,
        market_id=record.market_id,
        label="ABA语义参考词",
        value=aba_reference_term,
    )
    repeat_summary = _review_context_repeat_summary(
        search_intent_label=search_intent_label,
        repeat_search_intent_count=repeat_search_intent_count,
        aba_reference_term=aba_reference_term,
        repeat_aba_reference_count=repeat_aba_reference_count,
    )
    return ReviewContext(
        search_intent_label=search_intent_label,
        search_term=search_term,
        aba_reference_term=aba_reference_term,
        aba_reference_rank=aba_reference_rank,
        aba_period=aba_period,
        aba_match_boundary=aba_match_boundary,
        manual_action_path=manual_action_path,
        review_metrics=review_metrics,
        repeat_search_intent_count=repeat_search_intent_count,
        repeat_aba_reference_count=repeat_aba_reference_count,
        repeat_summary=repeat_summary,
        can_auto_change_rules=False,
        can_auto_execute_ads=False,
    )


def _evidence_value(record: ManualActionRecord, label: str) -> str | None:
    for item in record.evidence_snapshot:
        if item.label == label and item.value.strip():
            return item.value.strip()
    return None


def _repeat_context_count(
    records: list[ManualActionRecord],
    *,
    market_id: int | None,
    label: str,
    value: str | None,
) -> int:
    if not value:
        return 0
    normalized_value = _normalized(value)
    count = 0
    for record in records:
        if record.market_id != market_id:
            continue
        if _normalized(_evidence_value(record, label)) == normalized_value:
            count += 1
    return count


def _review_context_repeat_summary(
    *,
    search_intent_label: str | None,
    repeat_search_intent_count: int,
    aba_reference_term: str | None,
    repeat_aba_reference_count: int,
) -> str | None:
    parts: list[str] = []
    if search_intent_label and repeat_search_intent_count >= 2:
        parts.append(f"同一语义组已有 {repeat_search_intent_count} 次人工留痕，复盘时应判断规则是否需要调整。")
    if aba_reference_term and repeat_aba_reference_count >= 2:
        parts.append(f"同一 ABA 参考词已有 {repeat_aba_reference_count} 次人工留痕，复盘时应合并查看市场热词承接。")
    return " ".join(parts) or None


def build_review_effect_result(
    signal_id: str,
    *,
    review_window: ReviewWindow = "7d",
    market_id: int | None = None,
    action_root: Path = DEFAULT_MANUAL_ACTION_ROOT,
    signal_rows: list[dict[str, Any]] | None = None,
    now: datetime | None = None,
) -> ReviewEffectResult:
    records = load_manual_actions(signal_id, market_id=market_id, action_root=action_root)
    if not records:
        return ReviewEffectResult(
            signal_id=signal_id,
            review_window=review_window,
            status="not_ready",
            message="复盘效果暂不可计算：缺少人工处理记录",
        )

    record = max(records, key=lambda item: item.acted_at)
    current_time = now or datetime.now(UTC)
    if current_time.tzinfo is None:
        current_time = current_time.replace(tzinfo=UTC)
    acted_at = _parse_action_time(record.acted_at)
    window_days = dict(REVIEW_WINDOWS)[review_window]
    due_at = acted_at + timedelta(days=window_days)
    base = {
        "signal_id": signal_id,
        "action_id": record.id,
        "action_type": record.action_type,
        "acted_at": record.acted_at,
        "due_at": due_at.isoformat(),
        "snapshot_id": record.snapshot_id,
        "shop_id": record.shop_id,
        "market_id": record.market_id,
        "object_type": record.object_type,
        "object_id": record.object_id,
        "object_label": record.object_label,
        "review_window": review_window,
    }
    if record.object_type == "cross":
        return ReviewEffectResult(
            **base,
            status="not_ready",
            result="unclear",
            message="复盘效果暂不可计算：数据质量或交叉信号不适用广告指标前后对比，请复查数据是否补齐或更新",
        )
    if current_time < due_at:
        return ReviewEffectResult(
            **base,
            status="not_ready",
            result="unclear",
            message=f"复盘效果暂不可计算：{window_days} 天复盘窗口尚未到期，预计 {due_at.date().isoformat()} 后复盘",
        )

    before_window_start = acted_at.date() - timedelta(days=window_days)
    before_window_end = acted_at.date() - timedelta(days=1)
    after_window_start = acted_at.date() + timedelta(days=1)
    after_window_end = due_at.date()
    matched_rows = [row for row in signal_rows or [] if _row_matches_action(row, record)]
    before_rows = [row for row in matched_rows if _row_inside_window(row, before_window_start, before_window_end)]
    after_rows = [row for row in matched_rows if _row_inside_window(row, after_window_start, after_window_end)]
    before_metrics = _metric_summary(before_rows)
    after_metrics = _metric_summary(after_rows)
    before_start = _min_row_start_date(before_rows)
    before_end = _max_row_end_date(before_rows)
    after_start = _min_row_start_date(after_rows)
    after_end = _max_row_end_date(after_rows)
    base = {
        **base,
        "before_start_date": before_start.isoformat() if before_start else None,
        "before_end_date": before_end.isoformat() if before_end else None,
        "after_start_date": after_start.isoformat() if after_start else None,
        "after_end_date": after_end.isoformat() if after_end else None,
        "before_metrics": before_metrics,
        "after_metrics": after_metrics,
    }
    if not before_rows or before_start is None or before_end is None:
        return ReviewEffectResult(
            **base,
            status="not_ready",
            result="unclear",
            message=f"复盘效果暂不可计算：缺少处理前 {window_days} 天快照",
        )
    if before_start > before_window_start or before_end < before_window_end:
        return ReviewEffectResult(
            **base,
            status="not_ready",
            result="unclear",
            message=f"复盘效果暂不可计算：处理前 {window_days} 天窗口不足",
        )
    if not after_rows or after_start is None or after_end is None:
        return ReviewEffectResult(
            **base,
            status="not_ready",
            result="unclear",
            message=f"复盘效果暂不可计算：缺少处理后 {window_days} 天快照",
        )
    if after_start > after_window_start or after_end < after_window_end:
        return ReviewEffectResult(
            **base,
            status="not_ready",
            result="unclear",
            message=f"复盘效果暂不可计算：处理后 {window_days} 天窗口不足",
        )

    result = _classify_review_effect(before_metrics, after_metrics)
    return ReviewEffectResult(
        **base,
        status="ready",
        result=result,
        message=_review_effect_message(result, window_days, before_metrics, after_metrics),
    )


def save_review_record(
    effect: ReviewEffectResult,
    *,
    review_note: str | None = None,
    reviewer_name: str = "本地运营",
    expected_action_id: str | None = None,
    expected_object_type: str | None = None,
    expected_object_id: str | None = None,
    expected_review_window: ReviewWindow | None = None,
    expected_can_auto_change_rules: bool = False,
    expected_can_auto_execute_ads: bool = False,
    review_root: Path = DEFAULT_REVIEW_RECORD_ROOT,
) -> ReviewRecord:
    if effect.status != "ready":
        raise ValueError("review_effect_not_ready")
    if expected_can_auto_change_rules or expected_can_auto_execute_ads:
        raise ValueError("review_record_forbidden_effect")
    if not all([expected_action_id, expected_object_type, expected_object_id, expected_review_window]):
        raise ValueError("review_record_preflight_required")
    if not _review_record_expectation_matches(
        effect,
        expected_action_id=expected_action_id,
        expected_object_type=expected_object_type,
        expected_object_id=expected_object_id,
        expected_review_window=expected_review_window,
    ):
        raise ValueError("review_record_preflight_mismatch")
    record = ReviewRecord(
        id=f"review-record-{uuid4().hex}",
        signal_id=effect.signal_id,
        action_id=effect.action_id,
        action_type=effect.action_type,
        acted_at=effect.acted_at,
        snapshot_id=effect.snapshot_id,
        shop_id=effect.shop_id,
        market_id=effect.market_id,
        object_type=effect.object_type,
        object_id=effect.object_id,
        object_label=effect.object_label,
        review_window=effect.review_window,
        before_start_date=effect.before_start_date,
        before_end_date=effect.before_end_date,
        after_start_date=effect.after_start_date,
        after_end_date=effect.after_end_date,
        before_metrics=effect.before_metrics,
        after_metrics=effect.after_metrics,
        result=effect.result,
        review_note=review_note,
        reviewer_name=reviewer_name or "本地运营",
        reviewed_at=datetime.now(UTC).isoformat(),
    )
    review_root.mkdir(parents=True, exist_ok=True)
    with _review_file(review_root).open("a", encoding="utf-8") as file:
        file.write(json.dumps(record.model_dump(mode="json"), ensure_ascii=False) + "\n")
    return record


def _review_record_expectation_matches(
    effect: ReviewEffectResult,
    *,
    expected_action_id: str | None,
    expected_object_type: str | None,
    expected_object_id: str | None,
    expected_review_window: ReviewWindow | None,
) -> bool:
    if expected_action_id and _normalized(effect.action_id) != _normalized(expected_action_id):
        return False
    if expected_object_type and _normalized(effect.object_type) != _normalized(expected_object_type):
        return False
    if expected_object_id and _normalized(effect.object_id) != _normalized(expected_object_id):
        return False
    if expected_review_window and effect.review_window != expected_review_window:
        return False
    return True


def load_review_records(
    signal_id: str | None = None,
    *,
    market_id: int | None = None,
    object_type: str | None = None,
    object_id: str | None = None,
    review_root: Path = DEFAULT_REVIEW_RECORD_ROOT,
) -> list[ReviewRecord]:
    path = _review_file(review_root)
    if not path.exists():
        return []
    records: list[ReviewRecord] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        try:
            record = ReviewRecord.model_validate(json.loads(line))
        except (json.JSONDecodeError, ValueError):
            continue
        if _review_record_matches(
            record,
            signal_id=signal_id,
            market_id=market_id,
            object_type=object_type,
            object_id=object_id,
        ):
            records.append(record)
    return records


def latest_review_record(
    signal_id: str,
    *,
    market_id: int | None = None,
    object_type: str | None = None,
    object_id: str | None = None,
    review_root: Path = DEFAULT_REVIEW_RECORD_ROOT,
) -> ReviewRecord | None:
    records = load_review_records(
        signal_id,
        market_id=market_id,
        object_type=object_type,
        object_id=object_id,
        review_root=review_root,
    )
    if not records:
        return None
    return max(records, key=lambda record: record.reviewed_at)


def apply_latest_review_records(signals: list[AiSignal], *, review_root: Path = DEFAULT_REVIEW_RECORD_ROOT) -> list[AiSignal]:
    latest_by_signal: dict[tuple[str, int | None], ReviewRecord] = {}
    latest_by_object: dict[tuple[int | None, str, str], ReviewRecord] = {}
    for record in load_review_records(review_root=review_root):
        key = (record.signal_id, record.market_id)
        current = latest_by_signal.get(key)
        if current is None or record.reviewed_at > current.reviewed_at:
            latest_by_signal[key] = record
        object_key = _review_record_object_key(record)
        if object_key is None:
            continue
        object_current = latest_by_object.get(object_key)
        if object_current is None or record.reviewed_at > object_current.reviewed_at:
            latest_by_object[object_key] = record

    enriched: list[AiSignal] = []
    for signal in signals:
        record = latest_by_signal.get((signal.id, signal.market_id))
        if record is None:
            record = latest_by_object.get(_signal_review_object_key(signal))
        if record is None:
            enriched.append(signal)
            continue
        enriched.append(signal.model_copy(update={"review_result": record.result}))
    return enriched


def _review_record_matches(
    record: ReviewRecord,
    *,
    signal_id: str | None,
    market_id: int | None,
    object_type: str | None,
    object_id: str | None,
) -> bool:
    if market_id is not None and record.market_id != market_id:
        return False
    if signal_id is not None and record.signal_id == signal_id:
        return True
    if object_type is None or object_id is None:
        return signal_id is None
    return _review_record_object_key(record) == _review_object_key(market_id, object_type, object_id)


def _review_record_object_key(record: ReviewRecord) -> tuple[int | None, str, str] | None:
    if not record.object_type or not record.object_id:
        return None
    return _review_object_key(record.market_id, record.object_type, record.object_id)


def _signal_review_object_key(signal: AiSignal) -> tuple[int | None, str, str] | None:
    primary_object = signal.evidence.primary_object
    object_id = manual_action_object_id(primary_object)
    if not object_id:
        return None
    return _review_object_key(signal.market_id, primary_object.object_type.value, object_id)


def _review_object_key(market_id: int | None, object_type: str, object_id: str) -> tuple[int | None, str, str]:
    return (market_id, _normalized(object_type), _normalized(object_id))


def manual_status_for_action(action_type: ManualActionType) -> SignalStatus:
    if action_type == "observe":
        return SignalStatus.OBSERVING
    if action_type == "handled":
        return SignalStatus.ADOPTED
    if action_type == "ignore":
        return SignalStatus.IGNORED
    return SignalStatus.PENDING


def _action_file(action_root: Path) -> Path:
    return action_root / MANUAL_ACTION_FILE_NAME


def _review_file(review_root: Path) -> Path:
    return review_root / REVIEW_RECORD_FILE_NAME


def _parse_action_time(value: str) -> datetime:
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=UTC)
    return parsed


def _row_matches_action(row: dict[str, Any], record: ManualActionRecord) -> bool:
    if not record.object_type or not record.object_id:
        return False
    row_market_id = _integer(row.get("market_id") or row.get("marketplace_id"))
    if record.market_id is not None and row_market_id is not None and record.market_id != row_market_id:
        return False
    if not _row_source_matches_object_type(row, record.object_type):
        return False

    target = _normalized(record.object_id)
    if record.object_type == "search_term":
        return target in {_normalized(row.get("search_term")), _normalized(row.get("normalized_query"))}
    if record.object_type == "ad_group":
        return target in {_normalized(row.get("ad_group_id")), _normalized(row.get("row_id")), _normalized(row.get("source_record_id"))}
    if record.object_type == "placement":
        return target in {_normalized(row.get("placement")), _normalized(row.get("row_id")), _normalized(row.get("source_record_id"))}
    return target in {
        _normalized(row.get("row_id")),
        _normalized(row.get("source_record_id")),
        _normalized(row.get("asin")),
        _normalized(row.get("sku")),
        _normalized(row.get("msku")),
    }


def _row_source_matches_object_type(row: dict[str, Any], object_type: str) -> bool:
    row_object_type = _normalized(row.get("object_type"))
    source_table = _normalized(row.get("source_table"))
    if object_type == ObjectType.ADVERTISED_PRODUCT.value:
        return _row_source_allowed(
            row_object_type,
            source_table,
            object_types={"advertised_product"},
            source_tables={"advertised_products", "ad_product_daily_metrics"},
        )
    if object_type == ObjectType.SALES_PRODUCT.value:
        return _row_source_allowed(
            row_object_type,
            source_table,
            object_types={"sales_product"},
            source_tables={"sales_product_daily_metrics"},
        )
    if object_type == "search_term":
        return _row_source_allowed(
            row_object_type,
            source_table,
            object_types={"search_term"},
            source_tables={"ad_search_term_daily_metrics"},
        )
    if object_type == "placement":
        return _row_source_allowed(
            row_object_type,
            source_table,
            object_types={"placement"},
            source_tables={"ad_placement_daily_metrics"},
        )
    return True


def _row_source_allowed(
    row_object_type: str,
    source_table: str,
    *,
    object_types: set[str],
    source_tables: set[str],
) -> bool:
    if row_object_type and row_object_type not in object_types:
        return False
    if source_table and source_table not in source_tables:
        return False
    return True


def _row_inside_window(row: dict[str, Any], window_start: date, window_end: date) -> bool:
    row_start = _row_start_date(row)
    row_end = _row_end_date(row)
    return row_start is not None and row_end is not None and row_start >= window_start and row_end <= window_end


def _metric_summary(rows: list[dict[str, Any]]) -> dict[str, int | float | None]:
    if not rows:
        return {}
    impressions = sum(_integer(row.get("impressions")) or 0 for row in rows)
    clicks = sum(_integer(row.get("clicks")) or 0 for row in rows)
    cost = round(sum(_number(row.get("cost")) or _number(row.get("spend")) or 0 for row in rows), 2)
    orders = sum(_integer(row.get("orders")) or _integer(row.get("ads_orders")) or 0 for row in rows)
    sales = round(sum(_number(row.get("sales")) or _number(row.get("ads_sales")) or 0 for row in rows), 2)
    return {
        "impressions": impressions,
        "clicks": clicks,
        "cost": cost,
        "orders": orders,
        "sales": sales,
        "acos": round(cost / sales, 4) if sales > 0 else None,
        "cvr": round(orders / clicks, 4) if clicks > 0 else None,
        "cpc": round(cost / clicks, 4) if clicks > 0 else None,
    }


def _classify_review_effect(before_metrics: dict[str, int | float | None], after_metrics: dict[str, int | float | None]) -> str:
    before_orders = _number(before_metrics.get("orders")) or 0
    after_orders = _number(after_metrics.get("orders")) or 0
    before_acos = _number(before_metrics.get("acos"))
    after_acos = _number(after_metrics.get("acos"))
    before_cost = _number(before_metrics.get("cost")) or 0
    after_cost = _number(after_metrics.get("cost")) or 0
    if after_orders > before_orders and (before_acos is None or after_acos is None or after_acos <= before_acos):
        return "improved"
    if after_cost < before_cost and after_orders >= before_orders:
        return "improved"
    if after_cost > before_cost and after_orders <= before_orders:
        return "worse"
    return "no_change"


def _review_effect_message(
    result: str,
    window_days: int,
    before_metrics: dict[str, int | float | None],
    after_metrics: dict[str, int | float | None],
) -> str:
    if result == "improved":
        before_acos = _number(before_metrics.get("acos"))
        after_acos = _number(after_metrics.get("acos"))
        if before_acos is not None and after_acos is not None and after_acos < before_acos:
            return f"处理后 {window_days} 天订单改善，ACOS 下降"
        return f"处理后 {window_days} 天指标改善"
    if result == "worse":
        return f"处理后 {window_days} 天效果变差，需要人工复核"
    return f"处理后 {window_days} 天效果暂无明显变化"


def _row_start_date(row: dict[str, Any]) -> date | None:
    return _parse_row_date(row.get("start_date"))


def _row_end_date(row: dict[str, Any]) -> date | None:
    return _parse_row_date(row.get("end_date"))


def _parse_row_date(value: Any) -> date | None:
    if value in (None, ""):
        return None
    return date.fromisoformat(str(value)[:10])


def _min_row_start(rows: list[dict[str, Any]]) -> str | None:
    value = _min_row_start_date(rows)
    return value.isoformat() if value else None


def _max_row_end(rows: list[dict[str, Any]]) -> str | None:
    value = _max_row_end_date(rows)
    return value.isoformat() if value else None


def _max_row_end_date(rows: list[dict[str, Any]]) -> date | None:
    values = [value for value in (_row_end_date(row) for row in rows) if value is not None]
    return max(values) if values else None


def _min_row_start_date(rows: list[dict[str, Any]]) -> date | None:
    values = [value for value in (_row_start_date(row) for row in rows) if value is not None]
    return min(values) if values else None


def _normalized(value: Any) -> str:
    if value in (None, ""):
        return ""
    return str(value).strip().lower()


def _integer(value: Any) -> int | None:
    if value in (None, ""):
        return None
    return int(value)


def _number(value: Any) -> float | None:
    if value in (None, ""):
        return None
    return float(value)
