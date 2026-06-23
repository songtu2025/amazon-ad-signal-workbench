from pathlib import Path
from typing import Any

from app.services.manual_actions import (
    build_review_todos,
    load_manual_actions,
    load_review_records,
    manual_action_object_id_for_values,
)
from app.services.signal_triage import build_signal_triage_payload


MANUAL_ACTION_TYPES = {"observe", "handled", "add_to_review", "ignore"}
REVIEWABLE_ACTION_TYPES = {"observe", "handled", "add_to_review"}
REVIEW_WINDOW_ORDER = ("7d", "14d")
REQUIRED_REVIEW_EVIDENCE_LABELS = ("排查路径", "AI 准入", "搜索词边界", "广告位边界")
SEARCH_TERM_REQUIRED_REVIEW_EVIDENCE_LABELS = (
    *REQUIRED_REVIEW_EVIDENCE_LABELS,
    "广告组合流判断",
    "同组投放商品表现",
    "投放词证据",
    "ABA 背景",
    "证据缺口",
    "需要补证",
    "动作边界",
)
ADVERTISED_PRODUCT_REQUIRED_REVIEW_EVIDENCE_LABELS = (
    *REQUIRED_REVIEW_EVIDENCE_LABELS,
    "广告商品覆盖",
    "广告组合流判断",
    "同组投放商品表现",
    "证据缺口",
    "需要补证",
    "动作边界",
)
PLACEMENT_REQUIRED_REVIEW_EVIDENCE_LABELS = (
    *REQUIRED_REVIEW_EVIDENCE_LABELS,
    "广告位表现",
    "证据缺口",
    "需要补证",
    "动作边界",
)
ACTIONABLE_EVIDENCE_BLOCK_ORDER = (
    "diagnosis_path",
    "ai_admission_gate",
    "diagnosis_judgement",
    "ad_group_problem_location",
    "ad_group_evidence_synthesis",
    "ad_group_advertised_product_performance",
    "targeting_context",
    "search_term_market_context",
    "manual_search_term_boundary",
    "manual_placement_boundary",
    "diagnosis_contract_judgement",
    "diagnosis_contract_proves",
    "diagnosis_contract_counter_evidence",
    "diagnosis_contract_next_manual_step",
    "diagnosis_contract_gap",
    "diagnosis_contract_required_evidence",
    "search_term_review_targeting_evidence",
    "search_term_review_aba_context",
    "search_term_review_evidence_gap",
    "search_term_review_action_boundary",
    "advertised_product_review_ad_group_synthesis",
    "advertised_product_review_evidence_gap",
    "advertised_product_review_required_evidence",
    "advertised_product_review_action_boundary",
    "placement_review_performance",
    "placement_review_evidence_gap",
    "placement_review_required_evidence",
    "placement_review_action_boundary",
    "manual_action_path",
    "review_metrics",
    "placement_context_gap",
    "downstream_context_gap",
    "context_boundary",
)


def build_manual_action_preflight_payload(
    *,
    selected_market_id: int | None = None,
    product_scope_id: str | None = None,
    expected_object_id: str | None = None,
    expected_object_type: str | None = None,
    expected_action_type: str | None = None,
    top: int = 5,
    expect_written: bool = False,
    action_root: Path | None = None,
    review_root: Path | None = None,
) -> dict[str, Any]:
    triage = build_signal_triage_payload(
        selected_market_id=selected_market_id,
        top=top,
        product_scope_id=product_scope_id,
        **_triage_root_kwargs(action_root, review_root),
    )
    target = _target_from_triage(triage)
    requested_action_type = _manual_action_type(expected_action_type)
    if not expect_written and (expected_object_id or expected_object_type):
        target = _pre_write_target_for_expected_object(
            triage=triage,
            target=target,
            expected_object_id=expected_object_id,
            expected_object_type=expected_object_type,
            expected_action_type=requested_action_type,
        )
    if target and expected_action_type is not None:
        target = {**target, "action_type": requested_action_type or str(expected_action_type or "").strip()}

    manual_actions = load_manual_actions(market_id=selected_market_id, **_action_root_kwargs(action_root))
    review_todos = build_review_todos(market_id=selected_market_id, **_action_root_kwargs(action_root))
    review_records = load_review_records(market_id=selected_market_id, **_review_root_kwargs(review_root))
    review_status = _dict(triage.get("review_status"))
    if expect_written and (expected_object_id or expected_object_type):
        target = _post_write_target_for_expected_object(
            target=target,
            manual_actions=manual_actions,
            review_todos=review_todos,
            review_records=review_records,
            expected_object_id=expected_object_id,
            expected_object_type=expected_object_type,
            expected_action_type=requested_action_type,
        )

    target_manual_actions = [record for record in manual_actions if _matches_target(record, target)]
    target_review_todos = [todo for todo in review_todos if _matches_target(todo, target)]
    target_review_records = [record for record in review_records if _matches_target(record, target)]
    review_windows = _list(target.get("review_windows"))
    target_review_windows = _ordered_review_windows(
        str(getattr(todo, "review_window", "") or "") for todo in target_review_todos if getattr(todo, "review_window", None)
    )
    target_manual_action_evidence_snapshot_counts = [
        _target_evidence_snapshot_count(record) for record in target_manual_actions
    ]
    target_review_todo_evidence_snapshot_counts = [
        _target_evidence_snapshot_count(todo, include_review_window=True) for todo in target_review_todos
    ]
    saved_preview_actions = (
        _effective_post_write_target_manual_actions(
            target_manual_actions=target_manual_actions,
            action_type=_manual_action_type(target.get("action_type")),
        )
        if expect_written
        else target_manual_actions
    )
    evidence_snapshot_preview = (
        _saved_evidence_snapshot_preview(saved_preview_actions[0])
        if expect_written and saved_preview_actions
        else _evidence_snapshot_preview(triage, target)
    )
    if expect_written:
        blockers = _post_write_blockers(
            target=target,
            expected_object_id=expected_object_id,
            expected_object_type=expected_object_type,
            review_status=review_status,
            target_manual_actions=target_manual_actions,
            target_review_todos=target_review_todos,
            target_review_records=target_review_records,
            target_review_windows=target_review_windows,
            target_manual_action_evidence_snapshot_counts=target_manual_action_evidence_snapshot_counts,
            target_review_todo_evidence_snapshot_counts=target_review_todo_evidence_snapshot_counts,
        )
    else:
        blockers = _blockers(
            target=target,
            expected_object_id=expected_object_id,
            expected_object_type=expected_object_type,
            manual_actions=manual_actions,
            target_review_todos=target_review_todos,
            review_status=review_status,
        )
    ready = not blockers and bool(target)
    status = "post_write_verified" if expect_written and ready else "ready_for_explicit_manual_write" if ready else "blocked"
    review_todo_delta = len(review_windows) if ready and not expect_written and _needs_review_todos(target) else 0

    return {
        "status": status,
        "mode": "post_write" if expect_written else "pre_write",
        "will_write": False,
        "requires_explicit_authorization": not expect_written,
        "selected_market_id": selected_market_id,
        "selected_product_scope_id": product_scope_id,
        "snapshot": _dict(triage.get("snapshot")),
        "target": target,
        "current_counts": {
            "manual_action_count": len(manual_actions),
            "target_manual_action_count": len(target_manual_actions),
            "target_review_todo_count": len(target_review_todos),
            "review_record_count": len(review_records),
            "target_review_record_count": len(target_review_records),
        },
        "expected_after_write": {
            "manual_action_count": len(manual_actions) + (1 if ready and not expect_written else 0),
            "target_manual_action_count": len(target_manual_actions) + (1 if ready and not expect_written else 0),
            "target_review_todo_count": len(target_review_todos) + review_todo_delta,
            "review_record_count": len(review_records),
            "target_review_record_count": len(target_review_records),
        },
        "post_write_checks": {
            "target_manual_action_count": len(target_manual_actions),
            "target_manual_action_identities": [_target_identity(record) for record in target_manual_actions],
            "target_manual_action_evidence_snapshot_counts": target_manual_action_evidence_snapshot_counts,
            "target_review_todo_count": len(target_review_todos),
            "target_review_todo_identities": [
                _target_identity(todo, include_review_window=True) for todo in target_review_todos
            ],
            "target_review_todo_evidence_snapshot_counts": target_review_todo_evidence_snapshot_counts,
            "target_review_windows": target_review_windows,
            "target_review_record_count": len(target_review_records),
            "target_review_record_identities": [
                _target_identity(record, include_review_window=True) for record in target_review_records
            ],
        },
        "evidence_snapshot_preview": evidence_snapshot_preview,
        "blockers": blockers,
        "forbidden_effects": [
            "不请求积加 API",
            "不保存 review_records",
            "不执行广告动作",
            "不把快照行 ID 当复盘对象 ID",
        ],
        "next_action": _next_action(ready, target, blockers, expect_written=expect_written),
    }


def _target_from_triage(triage: dict[str, Any]) -> dict[str, Any]:
    candidate = _dict_or_none(triage.get("next_unhandled_candidate")) or _dict_or_none(triage.get("recommended_candidate")) or {}
    preview = _dict_or_none(candidate.get("manual_action_preview")) or _dict_or_none(triage.get("manual_action_preview")) or {}
    object_type = str(preview.get("object_type") or candidate.get("object_type") or "").strip()
    object_id = _target_object_id(object_type=object_type, preview=preview, candidate=candidate)
    if not object_id or not object_type:
        return {}
    return {
        "signal_id": preview.get("signal_id") or candidate.get("signal_id"),
        "action_type": preview.get("action_type") or "add_to_review",
        "object_type": object_type,
        "object_id": object_id,
        "stable_object_id": candidate.get("stable_object_id"),
        "source_object_id": candidate.get("object_id") or preview.get("source_object_id") or preview.get("object_id"),
        "object_label": preview.get("object_label") or candidate.get("object_label"),
        "shop_id": preview.get("shop_id") or candidate.get("shop_id"),
        "shop_name": preview.get("shop_name") or candidate.get("shop_name"),
        "market_id": _int(preview.get("market_id")) or _int(candidate.get("market_id")),
        "review_windows": _list(preview.get("review_windows")),
    }


def _post_write_target_for_expected_object(
    *,
    target: dict[str, Any],
    manual_actions: list[Any],
    review_todos: list[Any],
    review_records: list[Any],
    expected_object_id: str | None,
    expected_object_type: str | None,
    expected_action_type: str | None,
) -> dict[str, Any]:
    object_id = str(expected_object_id or target.get("object_id") or "").strip()
    object_type = str(expected_object_type or target.get("object_type") or "").strip()
    if not object_id or not object_type:
        return target

    expected_records = [
        record
        for record in [*manual_actions, *review_todos, *review_records]
        if str(_record_value(record, "object_type") or "").strip() == object_type
        and _matches_expected_object_id(
            {
                "object_type": object_type,
                "object_id": _record_value(record, "object_id"),
                "object_label": _record_value(record, "object_label"),
                "market_id": _record_value(record, "market_id"),
            },
            object_id,
        )
    ]
    first_record = expected_records[0] if expected_records else None
    todo_windows = _ordered_review_windows(
        str(_record_value(todo, "review_window") or "")
        for todo in review_todos
        if str(_record_value(todo, "object_type") or "").strip() == object_type
        and _matches_expected_object_id(
            {
                "object_type": object_type,
                "object_id": _record_value(todo, "object_id"),
                "object_label": _record_value(todo, "object_label"),
                "market_id": _record_value(todo, "market_id"),
            },
            object_id,
        )
    )

    current_matches_expected = (
        str(target.get("object_type") or "").strip() == object_type
        and _matches_expected_object_id(target, object_id)
    )
    action_type = (
        expected_action_type
        or _manual_action_type(_record_value(first_record, "action_type") if first_record is not None else None)
        or (_manual_action_type(target.get("action_type")) if current_matches_expected else None)
        or "add_to_review"
    )

    return {
        "signal_id": (
            target.get("signal_id")
            if current_matches_expected
            else _record_value(first_record, "signal_id") if first_record is not None else None
        ),
        "action_type": action_type,
        "object_type": object_type,
        "object_id": object_id,
        "object_label": (
            target.get("object_label")
            if current_matches_expected
            else _record_value(first_record, "object_label") if first_record is not None else None
        ),
        "shop_id": (
            target.get("shop_id")
            if current_matches_expected
            else _record_value(first_record, "shop_id") if first_record is not None else None
        ),
        "shop_name": target.get("shop_name") if current_matches_expected else None,
        "market_id": (
            _int(target.get("market_id"))
            if current_matches_expected
            else _int(_record_value(first_record, "market_id")) if first_record is not None else None
        ),
        "review_windows": todo_windows or (_list(target.get("review_windows")) if current_matches_expected else []),
    }


def _pre_write_target_for_expected_object(
    *,
    triage: dict[str, Any],
    target: dict[str, Any],
    expected_object_id: str | None,
    expected_object_type: str | None,
    expected_action_type: str | None,
) -> dict[str, Any]:
    object_id = str(expected_object_id or "").strip()
    object_type = str(expected_object_type or "").strip()
    if not object_id and not object_type:
        return target

    for candidate in _triage_candidate_sequence(triage):
        candidate_target = _target_from_candidate(candidate, expected_action_type=expected_action_type)
        if not candidate_target:
            continue
        if object_id and not _matches_expected_object_id(candidate_target, object_id):
            continue
        if object_type and candidate_target.get("object_type") != object_type:
            continue
        return candidate_target
    return target


def _matches_expected_object_id(target: dict[str, Any], expected_object_id: str | None) -> bool:
    expected = str(expected_object_id or "").strip()
    if not expected:
        return True
    return expected in _target_object_identity_values(target)


def _target_object_identity_values(target: dict[str, Any]) -> set[str]:
    values = {
        str(value).strip()
        for value in (
            target.get("object_id"),
            target.get("stable_object_id"),
            target.get("source_object_id"),
            target.get("object_label"),
        )
        if str(value or "").strip()
    }
    if str(target.get("object_type") or "").strip() == "search_term":
        label = str(target.get("object_label") or "").strip()
        market_id = _int(target.get("market_id"))
        if label:
            values.add(f"search_term:{market_id}:{label}" if market_id is not None else f"search_term:{label}")
        for value in list(values):
            if value.startswith("search_term:"):
                values.add(value.rsplit(":", 1)[-1])
    return values


def _triage_candidate_sequence(triage: dict[str, Any]) -> list[dict[str, Any]]:
    candidates: list[dict[str, Any]] = []
    for value in (
        triage.get("next_unhandled_candidate"),
        triage.get("recommended_candidate"),
    ):
        candidate = _dict_or_none(value)
        if candidate:
            candidates.append(candidate)
    candidates.extend(_dict_list(triage.get("top_candidates")))
    for layer in _dict_list(triage.get("candidate_layers")):
        candidates.extend(_dict_list(layer.get("top_candidates")))

    unique_candidates: list[dict[str, Any]] = []
    seen: set[tuple[str, str, str]] = set()
    for candidate in candidates:
        candidate_target = _target_from_candidate(candidate, expected_action_type=None)
        key = (
            str(candidate_target.get("signal_id") or candidate.get("signal_id") or ""),
            str(candidate_target.get("object_type") or candidate.get("object_type") or ""),
            str(candidate_target.get("object_id") or candidate.get("object_id") or ""),
        )
        if key in seen:
            continue
        seen.add(key)
        unique_candidates.append(candidate)
    return unique_candidates


def _target_from_candidate(candidate: dict[str, Any], *, expected_action_type: str | None) -> dict[str, Any]:
    preview = _dict_or_none(candidate.get("manual_action_preview")) or {}
    object_type = str(preview.get("object_type") or candidate.get("object_type") or "").strip()
    object_id = _target_object_id(object_type=object_type, preview=preview, candidate=candidate)
    if not object_id or not object_type:
        return {}
    action_type = expected_action_type or preview.get("action_type") or "add_to_review"
    review_windows = _list(preview.get("review_windows"))
    if not review_windows and _manual_action_type(action_type) in REVIEWABLE_ACTION_TYPES:
        review_windows = ["7d", "14d"]
    return {
        "signal_id": preview.get("signal_id") or candidate.get("signal_id"),
        "action_type": action_type,
        "object_type": object_type,
        "object_id": object_id,
        "stable_object_id": candidate.get("stable_object_id"),
        "source_object_id": candidate.get("object_id") or preview.get("source_object_id") or preview.get("object_id"),
        "object_label": preview.get("object_label") or candidate.get("object_label"),
        "shop_id": preview.get("shop_id") or candidate.get("shop_id"),
        "shop_name": preview.get("shop_name") or candidate.get("shop_name"),
        "market_id": _int(preview.get("market_id")) or _int(candidate.get("market_id")),
        "review_windows": review_windows,
    }


def _target_object_id(*, object_type: str, preview: dict[str, Any], candidate: dict[str, Any]) -> str:
    return str(
        manual_action_object_id_for_values(
            object_type=object_type,
            object_id=str(preview.get("object_id") or candidate.get("object_id") or candidate.get("stable_object_id") or ""),
            asin=str(candidate.get("asin") or "") or None,
            msku=str(candidate.get("msku") or "") or None,
            sku=str(candidate.get("sku") or "") or None,
            label=str(preview.get("object_label") or candidate.get("object_label") or "") or None,
            search_term=str(candidate.get("search_term") or "") or None,
            market_id=preview.get("market_id") or candidate.get("market_id"),
        )
        or ""
    ).strip()


def _evidence_snapshot_preview(triage: dict[str, Any], target: dict[str, Any]) -> dict[str, Any]:
    drilldown = _evidence_drilldown_for_target(triage, target)
    blocks = _dict_list(drilldown.get("business_evidence_blocks"))
    blocks.extend(_actionability_snapshot_blocks(triage))
    blocks.extend(_product_scope_boundary_snapshot_blocks(triage, blocks, target))
    blocks.extend(_ad_group_product_performance_snapshot_blocks(triage, target, drilldown))
    blocks.extend(_diagnosis_contract_snapshot_blocks(triage, target))
    blocks.extend(_search_term_review_chain_snapshot_blocks(blocks, triage, target))
    blocks.extend(_advertised_product_review_chain_snapshot_blocks(blocks, triage, target))
    blocks.extend(_placement_review_chain_snapshot_blocks(blocks, triage, target))
    blocks = _ordered_evidence_snapshot_blocks(blocks)
    items = [_evidence_snapshot_item(block) for block in blocks]
    items = [item for item in items if item["label"] and item["value"]]
    sources = sorted({item["source"] for item in items if item["source"]})
    return {
        "status": "ready" if items else "missing",
        "will_write": False,
        "will_save_on_authorized_write": bool(items),
        "item_count": len(items),
        "sources": sources,
        "items": items,
        "boundary": "只读预检；证据快照只有在人工明确点击后才会随 manual_action 保存，不执行广告动作。",
    }


def _saved_evidence_snapshot_preview(record: Any) -> dict[str, Any]:
    items = [
        _evidence_snapshot_item(
            {
                "label": _record_value(item, "label"),
                "value": _record_value(item, "value"),
                "detail": _record_value(item, "detail"),
                "source": _record_value(item, "source"),
            }
        )
        for item in _list(_record_value(record, "evidence_snapshot"))
    ]
    items = [item for item in items if item["label"] and item["value"]]
    sources = sorted({item["source"] for item in items if item["source"]})
    return {
        "status": "saved" if items else "missing",
        "will_write": False,
        "will_save_on_authorized_write": False,
        "item_count": len(items),
        "sources": sources,
        "items": items,
        "boundary": "写入后验收读回 manual_actions 中已保存的 evidence_snapshot；不重新生成当前候选证据，不执行广告动作。",
    }


def _actionability_snapshot_blocks(triage: dict[str, Any]) -> list[dict[str, str]]:
    status = _dict(triage.get("actionability_status"))
    if not status:
        return []
    gate_status = str(status.get("status") or triage.get("status") or "").strip()
    if not gate_status:
        return []
    signal_status = _dict(triage.get("signal_status"))
    candidate_count = _int(signal_status.get("candidate_count")) or 0
    can_write = status.get("can_write_manual_action") is True
    gate_title = str(status.get("manual_gate_title") or "AI 信号准入").strip()
    value = f"{gate_title} / {gate_status} / 候选 {candidate_count} 个 / {'允许人工留痕' if can_write else '不允许写入'}"
    detail_parts = [
        str(status.get("message") or "").strip(),
        str(status.get("boundary") or "").strip(),
        str(status.get("next_step") or "").strip(),
    ]
    detail = "；".join(dict.fromkeys(part for part in detail_parts if part))
    return [
        {
            "block_id": "ai_admission_gate",
            "label": "AI 准入",
            "value": value,
            "detail": detail or "准入只决定是否允许进入人工确认，不代表系统会自动执行广告动作。",
            "source": "actionability_status",
        }
    ]


def _product_scope_boundary_snapshot_blocks(
    triage: dict[str, Any],
    evidence_blocks: list[dict[str, Any]],
    target: dict[str, Any],
) -> list[dict[str, str]]:
    target_search_term_blocks = _target_search_term_boundary_snapshot_blocks(triage, target)
    if target_search_term_blocks:
        return target_search_term_blocks

    scope = _dict(triage.get("product_scope_drilldown"))
    rows = _dict_list(scope.get("ad_group_diagnosis")) or _dict_list(scope.get("ad_group_diagnosis_context"))
    if not rows:
        return []

    row = rows[0]
    targeting_block = _first_snapshot_block(evidence_blocks, "targeting_context")
    group_name = str(row.get("ad_group_name") or row.get("ad_group_id") or "优先广告组").strip()
    search_term_count = _int(row.get("search_term_count")) or 0
    effective_count = _int(row.get("effective_search_term_count")) or 0
    zero_order_count = _int(row.get("zero_order_search_term_count")) or 0
    placement_count = _int(row.get("placement_count")) or 0
    campaign_placement_count = _int(row.get("campaign_placement_count")) or 0
    search_diagnosis = _dict(row.get("search_term_diagnosis"))
    search_boundary = str(search_diagnosis.get("term_boundary") or "").strip()
    search_next_step = str(search_diagnosis.get("next_review_focus") or row.get("next_review_focus") or "").strip()
    blocks: list[dict[str, str]] = []
    synthesis_block = _ad_group_evidence_synthesis_snapshot_block(row, targeting_block)
    if synthesis_block:
        blocks.append(synthesis_block)

    if search_term_count > 0 or search_boundary:
        blocks.append(
            {
                "block_id": "manual_search_term_boundary",
                "label": "搜索词边界",
                "value": (
                    f"{group_name}：搜索词 {search_term_count} 条 / 有效词 {effective_count} 条 / "
                    f"无订单花费词 {zero_order_count} 条。"
                ),
                "detail": "；".join(
                    part
                    for part in [
                        search_boundary
                        or "搜索词只说明同广告组上下文，不能自动归因到单个 ASIN，也不能自动加词、否词或调价。",
                        search_next_step,
                    ]
                    if part
                ),
                "source": "ad_search_term_daily_metrics + business_rule",
            }
        )

    placement_level = str(row.get("placement_context_level") or "").strip()
    if placement_count > 0:
        placement_value = f"{group_name}：广告组级广告位 {placement_count} 条，可用于人工复核流量位置。"
        placement_detail = "广告组级广告位可以辅助比较流量位置表现，但仍不能自动归因到单个搜索词或广告 ASIN，也不能自动调整广告位加价。"
    elif campaign_placement_count > 0 or placement_level == "campaign":
        placement_value = f"{group_name}：广告组级广告位 0 条 / 同广告活动广告位 {campaign_placement_count} 条。"
        placement_detail = "只有广告活动级广告位背景，不能替代广告组级判断，也不能自动归因到单个搜索词或广告 ASIN。"
    else:
        placement_value = f"{group_name}：广告组级广告位 0 条 / 同广告活动广告位 0 条。"
        placement_detail = "当前缺少广告位证据，只能说明证据缺口，不能判断广告位是否造成承接异常或搜索词表现分化。"

    blocks.append(
        {
            "block_id": "manual_placement_boundary",
            "label": "广告位边界",
            "value": placement_value,
            "detail": placement_detail,
            "source": "ad_placement_daily_metrics + business_rule",
        }
    )
    return blocks


def _target_search_term_boundary_snapshot_blocks(
    triage: dict[str, Any],
    target: dict[str, Any],
) -> list[dict[str, str]]:
    if str(target.get("object_type") or "").strip() != "search_term":
        return []
    contract = _diagnosis_contract_for_target(triage, target)
    sections = _dict_list(contract.get("sections"))
    if not sections:
        return []

    section = next(
        (
            item
            for item in sections
            if str(item.get("section_id") or "").strip() == "search_term_opportunity"
        ),
        {},
    )
    object_label = str(target.get("object_label") or target.get("object_id") or "当前搜索词").strip()
    judgement = str(section.get("current_judgement") or "").strip()
    does_not_prove = str(section.get("does_not_prove") or "").strip()
    targeting_metric = _diagnosis_contract_metric(sections, "投放词证据")
    placement_metric = _diagnosis_contract_metric(sections, "广告位证据")

    blocks: list[dict[str, str]] = []
    if judgement:
        blocks.append(
            {
                "block_id": "ad_group_evidence_synthesis",
                "label": "广告组合流判断",
                "value": f"{object_label}：{judgement}",
                "detail": does_not_prove
                or "搜索词只能按投放上下文人工复核，不能自动归因到单个广告 ASIN，也不能自动加词、否词、调价或调整广告位。",
                "source": "diagnosis_contract",
            }
        )
    blocks.append(
        {
            "block_id": "manual_search_term_boundary",
            "label": "搜索词边界",
            "value": f"{object_label}：{targeting_metric.get('value') or '投放词证据待人工核对'}。",
            "detail": "；".join(
                part
                for part in [
                    targeting_metric.get("purpose"),
                    "搜索词只说明同广告组投放上下文，不能自动归因到单个 ASIN，也不能自动加词、否词或调价。",
                ]
                if part
            ),
            "source": "ad_search_term_daily_metrics + business_rule",
        }
    )
    blocks.append(
        {
            "block_id": "manual_placement_boundary",
            "label": "广告位边界",
            "value": f"{object_label}：{placement_metric.get('value') or '广告位证据待人工核对'}。",
            "detail": "；".join(
                part
                for part in [
                    placement_metric.get("purpose"),
                    "广告位证据只能辅助人工复核流量位置，不能自动归因到单个搜索词或广告 ASIN。",
                ]
                if part
            ),
            "source": "ad_placement_daily_metrics + business_rule",
        }
    )
    return blocks


def _ad_group_evidence_synthesis_snapshot_block(
    row: dict[str, Any],
    targeting_block: dict[str, Any],
) -> dict[str, str]:
    group_name = str(row.get("ad_group_name") or row.get("ad_group_id") or "优先广告组").strip()
    asin_count = _int(row.get("ad_group_advertised_asin_count")) or 0
    asins = [str(item or "").strip() for item in _list(row.get("ad_group_advertised_asins")) if str(item or "").strip()]
    search_term_count = _int(row.get("search_term_count")) or 0
    effective_count = _int(row.get("effective_search_term_count")) or 0
    zero_order_count = _int(row.get("zero_order_search_term_count")) or 0
    placement_count = _int(row.get("placement_count")) or 0
    campaign_placement_count = _int(row.get("campaign_placement_count")) or 0
    placement_level = str(row.get("placement_context_level") or "").strip()
    targeting_value = str(targeting_block.get("value") or "").strip()

    if search_term_count > 0 and (effective_count > 0 or zero_order_count > 0):
        judgement = "搜索词分化优先"
    elif search_term_count > 0:
        judgement = "搜索词上下文优先"
    elif placement_count > 0 or campaign_placement_count > 0:
        judgement = "广告位只能辅助复核"
    else:
        judgement = "上下文证据不足"

    asin_text = f"同广告组广告 ASIN {asin_count} 个" if asin_count > 0 else "同广告组广告 ASIN 未识别"
    targeting_text = f"投放词：{targeting_value}" if targeting_value else "投放词证据未进入当前快照"
    placement_text = _ad_group_synthesis_placement_text(placement_count, campaign_placement_count, placement_level)
    value = (
        f"{group_name}：{judgement} / {asin_text} / {targeting_text} / "
        f"搜索词 {search_term_count} 条（有效 {effective_count} / 无订单花费 {zero_order_count}）/ {placement_text}"
    )

    detail_parts = [
        "用于把广告 ASIN 覆盖、投放词结构、搜索词表现和广告位粒度合并成点击前判断。",
        f"能证明：{group_name} 是当前优先复核广告组，搜索词和投放词证据只能按广告组上下文解释。",
        "不能证明：不能自动归因到单个广告 ASIN，不能自动加词、否词、调价或调整广告位。",
    ]
    if asins:
        detail_parts.append(f"广告 ASIN 样例：{'、'.join(asins[:4])}。")
    if placement_count <= 0 and (campaign_placement_count > 0 or placement_level == "campaign"):
        detail_parts.append("证据缺口：当前只有广告活动级广告位背景，缺少广告组级广告位证据。")
    elif placement_count <= 0:
        detail_parts.append("证据缺口：当前缺少广告组级广告位证据。")

    return {
        "block_id": "ad_group_evidence_synthesis",
        "label": "广告组合流判断",
        "value": value,
        "detail": "；".join(detail_parts),
        "source": "advertised_products + ad_search_term_daily_metrics + ad_placement_daily_metrics + business_rule",
    }


def _ad_group_synthesis_placement_text(
    placement_count: int,
    campaign_placement_count: int,
    placement_level: str,
) -> str:
    if placement_count > 0:
        return f"广告组级广告位 {placement_count} 条"
    if campaign_placement_count > 0 or placement_level == "campaign":
        return f"广告组级广告位 0 条 / 同广告活动广告位 {campaign_placement_count} 条"
    return "广告组级广告位 0 条 / 同广告活动广告位 0 条"


def _ad_group_product_performance_snapshot_blocks(
    triage: dict[str, Any],
    target: dict[str, Any],
    drilldown: dict[str, Any],
) -> list[dict[str, str]]:
    object_type = str(target.get("object_type") or "").strip()
    if object_type not in {"search_term", "advertised_product", "ad_group"}:
        return []

    scope = _dict(triage.get("product_scope_drilldown"))
    rows = _dict_list(scope.get("ad_group_diagnosis_context")) or _dict_list(scope.get("ad_group_diagnosis"))
    if not rows:
        return []

    row = _matched_ad_group_product_performance_row(rows, drilldown, target)
    if not row:
        return []

    performance_rows = _dict_list(row.get("advertised_product_performance"))
    if not performance_rows:
        return []

    group_name = str(row.get("ad_group_name") or row.get("ad_group_id") or "当前广告组").strip()
    performance_text = "；".join(
        item
        for item in (_ad_group_product_performance_item_text(product) for product in performance_rows[:3])
        if item
    )
    if not performance_text:
        return []

    total_count = len(performance_rows)
    suffix = f"；另有 {total_count - 3} 个广告 ASIN 未展开" if total_count > 3 else ""
    return [
        {
            "block_id": "ad_group_advertised_product_performance",
            "label": "同组投放商品表现",
            "value": f"{group_name}：{performance_text}{suffix}",
            "detail": "该证据只说明同广告组内广告商品承接差异；搜索词、投放词和广告位仍不能自动归因到单个广告 ASIN，需人工核对主推策略和投放目的。",
            "source": "advertised_products + ad_product_daily_metrics",
        }
    ]


def _matched_ad_group_product_performance_row(
    rows: list[dict[str, Any]],
    drilldown: dict[str, Any],
    target: dict[str, Any],
) -> dict[str, Any]:
    ad_group_ids, ad_group_names = _target_ad_group_identifiers(drilldown)
    object_type = str(target.get("object_type") or "").strip()
    target_label = str(target.get("object_label") or target.get("object_id") or "").strip()

    for row in rows:
        row_id = str(row.get("ad_group_id") or "").strip()
        row_name = str(row.get("ad_group_name") or "").strip()
        if row_id and row_id in ad_group_ids:
            return row
        if row_name and row_name in ad_group_names:
            return row
        if object_type == "advertised_product" and _row_has_advertised_product(row, target_label):
            return row

    if len(rows) == 1 and _dict_list(rows[0].get("advertised_product_performance")):
        return rows[0]
    return {}


def _target_ad_group_identifiers(drilldown: dict[str, Any]) -> tuple[set[str], set[str]]:
    ad_group_ids: set[str] = set()
    ad_group_names: set[str] = set()
    for value in _list(drilldown.get("ad_groups")):
        text = str(value or "").strip()
        if text:
            ad_group_names.add(text)

    for key in ("search_term_rows", "source_rows", "ad_product_rows", "placement_rows"):
        for row in _dict_list(drilldown.get(key)):
            ad_group_id = str(row.get("ad_group_id") or "").strip()
            ad_group_name = str(row.get("ad_group_name") or "").strip()
            if ad_group_id:
                ad_group_ids.add(ad_group_id)
            if ad_group_name:
                ad_group_names.add(ad_group_name)
    return ad_group_ids, ad_group_names


def _row_has_advertised_product(row: dict[str, Any], target_label: str) -> bool:
    if not target_label:
        return False
    target = target_label.lower()
    for product in _dict_list(row.get("advertised_product_performance")):
        values = (
            product.get("asin"),
            product.get("msku"),
            product.get("label"),
        )
        if any(str(value or "").strip().lower() == target for value in values):
            return True
    return any(str(value or "").strip().lower() == target for value in _list(row.get("ad_group_advertised_asins")))


def _ad_group_product_performance_item_text(product: dict[str, Any]) -> str:
    asin = str(product.get("asin") or product.get("label") or "未知 ASIN").strip()
    msku = str(product.get("msku") or "").strip()
    label = f"{asin}（{msku}）" if msku and msku != asin else asin
    parts = [
        f"花费 {_format_amount(product.get('spend'))}",
        f"点击 {_format_integer(product.get('clicks'))}",
        f"订单 {_format_integer(product.get('orders'))}",
        f"销售额 {_format_amount(product.get('sales'))}",
    ]
    acos = _format_percent(product.get("acos"))
    cvr = _format_percent(product.get("cvr"))
    if acos:
        parts.append(f"ACOS {acos}")
    if cvr:
        parts.append(f"CVR {cvr}")
    sample_boundary = str(product.get("sample_boundary") or "").strip()
    if sample_boundary:
        parts.append(sample_boundary)
    return f"{label}：" + " / ".join(parts)


def _diagnosis_contract_snapshot_blocks(triage: dict[str, Any], target: dict[str, Any]) -> list[dict[str, str]]:
    contract = _diagnosis_contract_for_target(triage, target)
    sections = _dict_list(contract.get("sections"))
    judgement = _diagnosis_contract_lines(sections, "current_judgement")
    proves = _diagnosis_contract_lines(sections, "proves")
    counter_evidence = _diagnosis_contract_lines(sections, "does_not_prove")
    next_manual_steps = _diagnosis_contract_lines(sections, "next_manual_step")
    evidence_gaps: list[str] = []
    required_evidence: list[str] = []
    for section in sections:
        title = str(section.get("title") or section.get("section_id") or "").strip()
        gap = str(section.get("evidence_gap") or "").strip()
        required = str(section.get("required_evidence") or "").strip()
        if gap:
            evidence_gaps.append(_diagnosis_contract_line(title, gap))
        if required:
            required_evidence.append(_diagnosis_contract_line(title, required))

    blocks: list[dict[str, str]] = []
    if judgement:
        blocks.append(
            {
                "block_id": "diagnosis_contract_judgement",
                "label": "人工确认判断依据",
                "value": "；".join(judgement),
                "detail": "来自诊断合同 current_judgement；用于人工点击前确认这次留痕回答的业务问题。",
                "source": "diagnosis_contract",
            }
        )
    if proves:
        blocks.append(
            {
                "block_id": "diagnosis_contract_proves",
                "label": "能证明的事实",
                "value": "；".join(proves),
                "detail": "只说明当前证据能支撑哪些判断，不代表系统会自动执行广告动作。",
                "source": "diagnosis_contract",
            }
        )
    if counter_evidence:
        blocks.append(
            {
                "block_id": "diagnosis_contract_counter_evidence",
                "label": "不能证明的边界",
                "value": "；".join(counter_evidence),
                "detail": "反证边界必须随人工留痕保存，避免复盘时把搜索词、ABA 或广告位证据误当自动动作依据。",
                "source": "diagnosis_contract",
            }
        )
    if next_manual_steps:
        blocks.append(
            {
                "block_id": "diagnosis_contract_next_manual_step",
                "label": "人工下一步",
                "value": "；".join(next_manual_steps),
                "detail": "下一步只落到记录观察、标记已处理、加入复盘或忽略本次，不自动调价、加词、否词或暂停广告。",
                "source": "diagnosis_contract",
            }
        )
    if evidence_gaps:
        blocks.append(
            {
                "block_id": "diagnosis_contract_gap",
                "label": "诊断证据缺口",
                "value": "；".join(evidence_gaps),
                "detail": "来自诊断合同；用于人工点击前确认当前缺哪类证据，不代表可以自动执行广告动作。",
                "source": "diagnosis_contract",
            }
        )
    if required_evidence:
        blocks.append(
            {
                "block_id": "diagnosis_contract_required_evidence",
                "label": "需要补证",
                "value": "；".join(required_evidence),
                "detail": "补证路径只用于人工复核和后续复盘，不自动加词、调价、否词或暂停广告。",
                "source": "diagnosis_contract",
            }
        )
    return blocks


def _search_term_review_chain_snapshot_blocks(
    blocks: list[dict[str, Any]],
    triage: dict[str, Any],
    target: dict[str, Any],
) -> list[dict[str, str]]:
    if str(target.get("object_type") or "").strip() != "search_term":
        return []

    contract = _diagnosis_contract_for_target(triage, target)
    sections = _dict_list(contract.get("sections"))
    targeting_block = _first_snapshot_block(blocks, "targeting_context")
    market_block = _first_snapshot_block(blocks, "search_term_market_context")
    gap_block = _first_snapshot_block(blocks, "diagnosis_contract_gap")
    required_block = _first_snapshot_block(blocks, "diagnosis_contract_required_evidence")
    object_label = str(target.get("object_label") or target.get("object_id") or "当前搜索词").strip()
    targeting_metric = _diagnosis_contract_metric(sections, "投放词证据")
    aba_metric = _diagnosis_contract_metric(sections, "ABA市场热度")
    gap_value = "；".join(
        dict.fromkeys(
            value
            for value in (
                str(gap_block.get("value") or "").strip(),
                str(required_block.get("value") or "").strip(),
            )
            if value
        )
    )

    return [
        {
            "block_id": "search_term_review_targeting_evidence",
            "label": "投放词证据",
            "value": str(targeting_metric.get("value") or targeting_block.get("value") or f"{object_label}：当前搜索词样本未带投放词证据。").strip(),
            "detail": str(
                targeting_block.get("detail")
                or targeting_metric.get("purpose")
                or "用于确认用户搜索词是否已有投放词承接；这不是完整关键词库证明，也不能自动加词、否词或调价。"
            ).strip(),
            "source": str(targeting_block.get("source") or "diagnosis_contract + business_rule").strip(),
        },
        {
            "block_id": "search_term_review_aba_context",
            "label": "ABA 背景",
            "value": _aba_review_context_value(aba_metric.get("value") or market_block.get("value"), object_label),
            "detail": str(
                market_block.get("detail")
                or aba_metric.get("purpose")
                or "ABA 只能按站点 + 周期 + 标准化搜索词匹配，不能当作店铺、产品、广告组或广告 ASIN 数据。"
            ).strip(),
            "source": str(market_block.get("source") or "diagnosis_contract + ABA导出").strip(),
        },
        {
            "block_id": "search_term_review_evidence_gap",
            "label": "证据缺口",
            "value": gap_value or "诊断合同未标记额外证据缺口；仍需人工核对投放词、广告商品承接和主推策略。",
            "detail": "保存人工动作时必须同时保留缺口，复盘时不能把当前证据扩展成自动归因或自动广告动作依据。",
            "source": "diagnosis_contract",
        },
        {
            "block_id": "search_term_review_action_boundary",
            "label": "动作边界",
            "value": "只允许记录观察、标记已处理、加入复盘或忽略本次。",
            "detail": "不得自动加词、自动否词、自动调价、自动暂停或开启广告；人工动作只保存留痕和 7/14 天复盘待办。",
            "source": "business_rule",
        },
    ]


def _advertised_product_review_chain_snapshot_blocks(
    blocks: list[dict[str, Any]],
    triage: dict[str, Any],
    target: dict[str, Any],
) -> list[dict[str, str]]:
    if str(target.get("object_type") or "").strip() != "advertised_product":
        return []

    labels = {
        str(block.get("label") or "").strip()
        for block in blocks
        if str(block.get("value") or "").strip()
    }
    contract = _diagnosis_contract_for_target(triage, target)
    sections = _dict_list(contract.get("sections"))
    object_label = str(target.get("object_label") or target.get("object_id") or "当前广告商品").strip()
    gap_block = _first_snapshot_block(blocks, "diagnosis_contract_gap")
    required_block = _first_snapshot_block(blocks, "diagnosis_contract_required_evidence")
    ad_group_section = _diagnosis_contract_section(sections, "ad_group_boundary")

    review_blocks: list[dict[str, str]] = []
    if "广告组合流判断" not in labels:
        judgement = str(ad_group_section.get("current_judgement") or "").strip()
        does_not_prove = str(ad_group_section.get("does_not_prove") or "").strip()
        review_blocks.append(
            {
                "block_id": "advertised_product_review_ad_group_synthesis",
                "label": "广告组合流判断",
                "value": f"{object_label}：{judgement or '需按广告组容器回看投放词、搜索词和广告位上下文。'}",
                "detail": does_not_prove
                or "广告组是投放容器，广告商品复盘必须保留同广告组上下文；不能把搜索词或广告位证据自动归因到单个广告 ASIN。",
                "source": "diagnosis_contract + business_rule",
            }
        )

    if "证据缺口" not in labels:
        gap_value = str(gap_block.get("value") or "").strip()
        required_value = str(required_block.get("value") or "").strip()
        combined_gap = "；".join(value for value in (gap_value, required_value) if value)
        review_blocks.append(
            {
                "block_id": "advertised_product_review_evidence_gap",
                "label": "证据缺口",
                "value": combined_gap or "仍需人工核对广告商品覆盖、广告组容器、搜索词上下文、广告位证据和主推策略。",
                "detail": "广告商品复盘必须保留缺口，避免把广告 ASIN 指标、搜索词或广告位背景包装成单 ASIN 自动归因。",
                "source": "diagnosis_contract",
            }
        )

    if "需要补证" not in labels:
        required_value = str(required_block.get("value") or "").strip()
        review_blocks.append(
            {
                "block_id": "advertised_product_review_required_evidence",
                "label": "需要补证",
                "value": required_value or "补齐广告组级广告位证据、投放词维护状态、广告商品承接和主推策略。",
                "detail": "补证路径只用于人工复核和后续复盘，不能自动调价、暂停、加词或否词。",
                "source": "diagnosis_contract",
            }
        )

    if "动作边界" not in labels:
        review_blocks.append(
            {
                "block_id": "advertised_product_review_action_boundary",
                "label": "动作边界",
                "value": "只允许记录观察、标记已处理、加入复盘或忽略本次。",
                "detail": "不得自动调价、自动暂停、自动加词或自动否词；广告商品动作只保存人工留痕和 7/14 天复盘待办。",
                "source": "business_rule",
            }
        )
    return review_blocks


def _placement_review_chain_snapshot_blocks(
    blocks: list[dict[str, Any]],
    triage: dict[str, Any],
    target: dict[str, Any],
) -> list[dict[str, str]]:
    if str(target.get("object_type") or "").strip() != "placement":
        return []

    labels = {
        str(block.get("label") or "").strip()
        for block in blocks
        if str(block.get("value") or "").strip()
    }
    contract = _diagnosis_contract_for_target(triage, target)
    sections = _dict_list(contract.get("sections"))
    object_label = str(target.get("object_label") or target.get("object_id") or "当前广告位").strip()
    placement_section = _diagnosis_contract_section(sections, "placement_gap")
    gap_block = _first_snapshot_block(blocks, "diagnosis_contract_gap")
    required_block = _first_snapshot_block(blocks, "diagnosis_contract_required_evidence")

    review_blocks: list[dict[str, str]] = []
    if "广告位表现" not in labels:
        judgement = str(placement_section.get("current_judgement") or "").strip()
        proves = str(placement_section.get("proves") or "").strip()
        review_blocks.append(
            {
                "block_id": "placement_review_performance",
                "label": "广告位表现",
                "value": f"{object_label}：{judgement or '需要按广告位粒度人工复核花费、订单、ACOS 和样本量。'}",
                "detail": proves
                or "广告位表现只能说明流量位置层级的表现差异，不能自动归因到单个搜索词、广告组或广告 ASIN。",
                "source": "diagnosis_contract + ad_placement_daily_metrics",
            }
        )

    if "证据缺口" not in labels:
        section_gap = str(placement_section.get("evidence_gap") or "").strip()
        gap_value = str(gap_block.get("value") or "").strip()
        review_blocks.append(
            {
                "block_id": "placement_review_evidence_gap",
                "label": "证据缺口",
                "value": section_gap or gap_value or "仍需人工核对广告位所在广告活动 / 广告组、搜索词和广告商品承接关系。",
                "detail": "广告位复盘必须保留缺口，避免把广告位表现直接包装成自动调价、自动暂停或单 ASIN 归因。",
                "source": "diagnosis_contract",
            }
        )

    if "需要补证" not in labels:
        section_required = str(placement_section.get("required_evidence") or "").strip()
        required_value = str(required_block.get("value") or "").strip()
        review_blocks.append(
            {
                "block_id": "placement_review_required_evidence",
                "label": "需要补证",
                "value": section_required or required_value or "补齐同广告活动 / 广告组广告位对比、搜索词上下文和广告商品承接证据。",
                "detail": "补证路径只用于人工复核和后续复盘，不能自动调整广告位加价、预算、关键词或商品投放。",
                "source": "diagnosis_contract",
            }
        )

    if "动作边界" not in labels:
        review_blocks.append(
            {
                "block_id": "placement_review_action_boundary",
                "label": "动作边界",
                "value": "只允许记录观察、标记已处理、加入复盘或忽略本次。",
                "detail": "不得自动调整广告位加价、自动调价、自动暂停、自动加词或自动否词；广告位动作只保存人工留痕和 7/14 天复盘待办。",
                "source": "business_rule",
            }
        )
    return review_blocks


def _first_snapshot_block(blocks: list[dict[str, Any]], block_id: str) -> dict[str, Any]:
    for block in blocks:
        if str(block.get("block_id") or "").strip() == block_id:
            return block
    return {}


def _diagnosis_contract_section(sections: list[dict[str, Any]], section_id: str) -> dict[str, Any]:
    for section in sections:
        if str(section.get("section_id") or "").strip() == section_id:
            return section
    return {}


def _diagnosis_contract_metric(sections: list[dict[str, Any]], name: str) -> dict[str, str]:
    for section in sections:
        for metric in _dict_list(section.get("metrics")):
            if str(metric.get("name") or "").strip() != name:
                continue
            return {
                "value": str(metric.get("value") or "").strip(),
                "purpose": str(metric.get("purpose") or "").strip(),
            }
    return {}


def _aba_review_context_value(value: Any, object_label: str) -> str:
    text = str(value or "").strip()
    if not text:
        return f"{object_label}：未命中或未导入 ABA 背景。"
    return text if "ABA" in text else f"ABA {text}"


def _diagnosis_contract_for_target(triage: dict[str, Any], target: dict[str, Any]) -> dict[str, Any]:
    identityless_fallback: dict[str, Any] | None = None
    for contract_key in (
        "next_unhandled_diagnosis_contract",
        "recommended_diagnosis_contract",
        "diagnosis_contract",
    ):
        contract = _dict_or_none(triage.get(contract_key))
        if _diagnosis_contract_matches_target(contract, target):
            return contract
        if contract_key == "diagnosis_contract" and contract and not _diagnosis_contract_has_identity(contract):
            identityless_fallback = contract
    return identityless_fallback or {}


def _diagnosis_contract_matches_target(contract: dict[str, Any] | None, target: dict[str, Any]) -> bool:
    if not contract or not target:
        return False
    contract_signal_id = str(contract.get("signal_id") or "").strip()
    target_signal_id = str(target.get("signal_id") or "").strip()
    if contract_signal_id and target_signal_id:
        return contract_signal_id == target_signal_id
    contract_type = str(contract.get("object_type") or "").strip()
    target_type = str(target.get("object_type") or "").strip()
    contract_object_id = str(contract.get("object_id") or "").strip()
    target_object_id = str(target.get("object_id") or "").strip()
    target_label = str(target.get("object_label") or "").strip()
    if not contract_type or not target_type or contract_type != target_type:
        return False
    return contract_object_id in {target_object_id, target_label}


def _diagnosis_contract_has_identity(contract: dict[str, Any]) -> bool:
    return any(
        str(contract.get(field) or "").strip()
        for field in ("signal_id", "object_type", "object_id", "object_label")
    )


DIAGNOSIS_CONTRACT_SECTION_ORDER = {
    "search_term_opportunity": 0,
    "ad_asin_coverage": 1,
    "ad_group_boundary": 2,
    "placement_gap": 3,
    "manual_review": 4,
}


def _diagnosis_contract_lines(sections: list[dict[str, Any]], field: str, *, limit: int = 4) -> list[str]:
    ordered_sections = sorted(
        enumerate(sections),
        key=lambda item: (DIAGNOSIS_CONTRACT_SECTION_ORDER.get(str(item[1].get("section_id") or ""), 99), item[0]),
    )
    lines: list[str] = []
    seen: set[str] = set()
    for _index, section in ordered_sections:
        value = str(section.get(field) or "").strip()
        if not value or value in seen:
            continue
        seen.add(value)
        title = str(section.get("title") or section.get("section_id") or "").strip()
        lines.append(_diagnosis_contract_line(title, value))
        if len(lines) >= limit:
            break
    return lines


def _diagnosis_contract_line(title: str, value: str) -> str:
    return f"{title}：{value}" if title else value


def _ordered_evidence_snapshot_blocks(blocks: list[dict[str, Any]]) -> list[dict[str, Any]]:
    order = {block_id: index for index, block_id in enumerate(ACTIONABLE_EVIDENCE_BLOCK_ORDER)}
    if not any(str(block.get("block_id") or "").strip() in order for block in blocks):
        return blocks
    indexed_blocks = list(enumerate(blocks))
    return [
        block
        for _, block in sorted(
            indexed_blocks,
            key=lambda item: (order.get(str(item[1].get("block_id") or "").strip(), len(order)), item[0]),
        )
    ]


def _evidence_drilldown_for_target(triage: dict[str, Any], target: dict[str, Any]) -> dict[str, Any]:
    next_candidate = _dict_or_none(triage.get("next_unhandled_candidate"))
    if _candidate_matches_target(next_candidate, target):
        return _dict(triage.get("next_unhandled_evidence_drilldown"))
    recommended_candidate = _dict_or_none(triage.get("recommended_candidate"))
    if _candidate_matches_target(recommended_candidate, target):
        return _dict(triage.get("recommended_evidence_drilldown"))
    return _dict(triage.get("next_unhandled_evidence_drilldown")) or _dict(triage.get("recommended_evidence_drilldown"))


def _candidate_matches_target(candidate: dict[str, Any] | None, target: dict[str, Any]) -> bool:
    if not candidate or not target:
        return False
    preview = _dict_or_none(candidate.get("manual_action_preview")) or {}
    object_type = str(preview.get("object_type") or candidate.get("object_type") or "").strip()
    signal_id = str(preview.get("signal_id") or candidate.get("signal_id") or "").strip()
    target_type = str(target.get("object_type") or "").strip()
    if not object_type or object_type != target_type:
        return False
    target_signal_id = str(target.get("signal_id") or "").strip()
    if signal_id and target_signal_id:
        return signal_id == target_signal_id
    candidate_object_ids = {
        str(value or "").strip()
        for value in (
            preview.get("object_id"),
            candidate.get("object_id"),
            candidate.get("stable_object_id"),
            candidate.get("object_label"),
        )
        if str(value or "").strip()
    }
    target_object_ids = {
        str(value or "").strip()
        for value in (target.get("object_id"), target.get("object_label"))
        if str(value or "").strip()
    }
    return bool(candidate_object_ids & target_object_ids)


def _evidence_snapshot_item(block: dict[str, Any]) -> dict[str, str | None]:
    return {
        "label": str(block.get("label") or "").strip(),
        "value": str(block.get("value") or "").strip(),
        "detail": _optional_text(block.get("detail")),
        "source": _optional_text(block.get("source")),
    }


def _blockers(
    *,
    target: dict[str, Any],
    expected_object_id: str | None,
    expected_object_type: str | None,
    manual_actions: list[Any],
    target_review_todos: list[Any],
    review_status: dict[str, Any],
) -> list[dict[str, str]]:
    blockers: list[dict[str, str]] = []
    if not target:
        return [{"code": "missing_target", "message": "当前分诊 payload 缺少可写入的人工动作预检对象。"}]
    if expected_object_id and not _matches_expected_object_id(target, expected_object_id):
        blockers.append(
            {
                "code": "object_id_mismatch",
                "message": f"目标对象不匹配：预检为 {target.get('object_id')}，期望为 {expected_object_id}。",
            }
        )
    if expected_object_type and target.get("object_type") != expected_object_type:
        blockers.append(
            {
                "code": "object_type_mismatch",
                "message": f"目标类型不匹配：预检为 {target.get('object_type')}，期望为 {expected_object_type}。",
            }
        )
    if _int(review_status.get("manual_action_identity_issue_count")):
        blockers.append({"code": "identity_issue", "message": "存在人工动作对象身份风险，先修复历史对象 ID。"})
    if not str(target.get("shop_id") or "").strip():
        blockers.append({"code": "missing_shop_context", "message": "目标人工动作缺少 shop_id，不能进入多店铺复盘写入。"})
    action_type = _manual_action_type(target.get("action_type"))
    if not action_type:
        blockers.append({"code": "invalid_action_type", "message": "目标人工动作类型无效，只允许 observe / handled / add_to_review / ignore。"})
    review_windows = {str(window) for window in _list(target.get("review_windows"))}
    if action_type in REVIEWABLE_ACTION_TYPES and not {"7d", "14d"}.issubset(review_windows):
        blockers.append({"code": "missing_review_windows", "message": "目标人工动作缺少完整 7d / 14d 复盘窗口，不能进入真实写入。"})
    target_manual_actions = [record for record in manual_actions if _matches_target(record, target)]
    if target_manual_actions and not _can_rewrite_after_voided_legacy_evidence(
        target=target,
        target_manual_actions=target_manual_actions,
        target_review_todos=target_review_todos,
    ):
        blockers.append({"code": "duplicate_manual_action", "message": "目标对象已有人工留痕，不应重复写入。"})
    return blockers


def _post_write_blockers(
    *,
    target: dict[str, Any],
    expected_object_id: str | None,
    expected_object_type: str | None,
    review_status: dict[str, Any],
    target_manual_actions: list[Any],
    target_review_todos: list[Any],
    target_review_records: list[Any],
    target_review_windows: list[str],
    target_manual_action_evidence_snapshot_counts: list[dict[str, Any]],
    target_review_todo_evidence_snapshot_counts: list[dict[str, Any]],
) -> list[dict[str, str]]:
    blockers: list[dict[str, str]] = []
    if not target:
        return [{"code": "missing_target", "message": "当前分诊 payload 缺少可验收的人工动作对象。"}]
    if expected_object_id and not _matches_expected_object_id(target, expected_object_id):
        blockers.append(
            {
                "code": "object_id_mismatch",
                "message": f"目标对象不匹配：预检为 {target.get('object_id')}，期望为 {expected_object_id}。",
            }
        )
    if expected_object_type and target.get("object_type") != expected_object_type:
        blockers.append(
            {
                "code": "object_type_mismatch",
                "message": f"目标类型不匹配：预检为 {target.get('object_type')}，期望为 {expected_object_type}。",
            }
        )
    if _int(review_status.get("manual_action_identity_issue_count")):
        blockers.append({"code": "identity_issue", "message": "存在人工动作对象身份风险，先修复历史对象 ID。"})
    if not str(target.get("shop_id") or "").strip():
        blockers.append({"code": "missing_shop_context", "message": "目标人工动作缺少 shop_id，不能验收多店铺复盘写入。"})
    action_type = _manual_action_type(target.get("action_type"))
    if not action_type:
        blockers.append({"code": "invalid_action_type", "message": "目标人工动作类型无效，只允许 observe / handled / add_to_review / ignore。"})
    effective_target_manual_actions = _effective_post_write_target_manual_actions(
        target_manual_actions=target_manual_actions,
        action_type=action_type,
    )
    if len(effective_target_manual_actions) != 1:
        code = "missing_written_manual_action" if not effective_target_manual_actions else "duplicate_written_manual_action"
        blockers.append(
            {
                "code": code,
                "message": f"写入后目标对象应有且仅有 1 条有效人工留痕，当前为 {len(effective_target_manual_actions)} 条。",
            }
        )
    actual_action_types = {
        str(_record_value(record, "action_type") or "")
        for record in effective_target_manual_actions
        if _record_value(record, "action_type") is not None
    }
    if actual_action_types and action_type and actual_action_types != {action_type}:
        blockers.append(
            {
                "code": "action_type_mismatch",
                "message": f"写入后人工动作类型应为 {action_type}，当前为 {sorted(actual_action_types)}。",
            }
        )
    if action_type in REVIEWABLE_ACTION_TYPES and (len(target_review_todos) != 2 or set(target_review_windows) != {"7d", "14d"}):
        blockers.append(
            {
                "code": "post_write_review_todo_mismatch",
                "message": "写入后目标对象必须生成完整 7d / 14d 复盘待办。",
            }
        )
    if action_type in REVIEWABLE_ACTION_TYPES and any(
        _evidence_snapshot_item_count(record) == 0 for record in effective_target_manual_actions
    ):
        blockers.append(
            {
                "code": "missing_written_evidence_snapshot",
                "message": "写入后目标人工留痕必须可读回 evidence_snapshot，否则不能进入 7d / 14d 复盘。",
            }
        )
    if action_type in REVIEWABLE_ACTION_TYPES and any(
        _int(item.get("evidence_snapshot_count")) == 0 for item in target_review_todo_evidence_snapshot_counts
    ):
        blockers.append(
            {
                "code": "missing_review_todo_evidence_snapshot",
                "message": "写入后 7d / 14d 复盘待办必须继承 evidence_snapshot，否则复盘无证据可回读。",
            }
        )
    if action_type == "ignore" and target_review_todos:
        blockers.append(
            {
                "code": "post_write_unexpected_review_todo",
                "message": "忽略本次后不应进入当前 7d / 14d 复盘待办。",
            }
        )
    if target_review_records:
        blockers.append(
            {
                "code": "unexpected_review_record",
                "message": "写入后验收阶段不应已有目标复盘记录，必须等待 7d / 14d 窗口完整后再保存复盘结论。",
            }
        )
    return blockers


def _ordered_review_windows(review_windows: Any) -> list[str]:
    values = {str(window or "").strip() for window in review_windows}
    ordered = [window for window in REVIEW_WINDOW_ORDER if window in values]
    ordered.extend(sorted(window for window in values if window and window not in REVIEW_WINDOW_ORDER))
    return ordered


def _can_rewrite_after_voided_legacy_evidence(
    *,
    target: dict[str, Any],
    target_manual_actions: list[Any],
    target_review_todos: list[Any],
) -> bool:
    action_type = _manual_action_type(target.get("action_type"))
    if action_type not in REVIEWABLE_ACTION_TYPES:
        return False
    if target_review_todos:
        return False
    return all(
        _manual_action_type(_record_value(record, "action_type")) == action_type
        and not _has_required_review_evidence_snapshot(record)
        for record in target_manual_actions
    )


def _effective_post_write_target_manual_actions(*, target_manual_actions: list[Any], action_type: str) -> list[Any]:
    if action_type not in REVIEWABLE_ACTION_TYPES or len(target_manual_actions) <= 1:
        return target_manual_actions
    return [record for record in target_manual_actions if _has_required_review_evidence_snapshot(record)]


def _matches_target(record: Any, target: dict[str, Any]) -> bool:
    if not target:
        return False
    target_shop_id = str(target.get("shop_id") or "").strip()
    record_shop_id = str(getattr(record, "shop_id", "") or "").strip()
    if target_shop_id and record_shop_id != target_shop_id:
        return False
    return (
        str(getattr(record, "object_type", "") or "") == str(target.get("object_type") or "")
        and _matches_expected_object_id(target, str(getattr(record, "object_id", "") or ""))
        and (
            target.get("market_id") is None
            or getattr(record, "market_id", None) is None
            or _int(getattr(record, "market_id", None)) == _int(target.get("market_id"))
        )
    )


def _target_identity(record: Any, *, include_review_window: bool = False) -> dict[str, Any]:
    identity = {
        "signal_id": _record_value(record, "signal_id"),
        "shop_id": _record_value(record, "shop_id"),
        "market_id": _int(_record_value(record, "market_id")),
        "object_type": _record_value(record, "object_type"),
        "object_id": _record_value(record, "object_id"),
        "object_label": _record_value(record, "object_label"),
    }
    if include_review_window:
        identity["review_window"] = _record_value(record, "review_window")
    return identity


def _target_evidence_snapshot_count(record: Any, *, include_review_window: bool = False) -> dict[str, Any]:
    item = {
        "signal_id": _record_value(record, "signal_id"),
        "object_type": _record_value(record, "object_type"),
        "object_id": _record_value(record, "object_id"),
        "evidence_snapshot_count": _evidence_snapshot_item_count(record),
    }
    if include_review_window:
        item["review_window"] = _record_value(record, "review_window")
    return item


def _evidence_snapshot_item_count(record: Any) -> int:
    evidence_snapshot = _record_value(record, "evidence_snapshot")
    if not isinstance(evidence_snapshot, list):
        return 0
    return sum(
        1
        for item in evidence_snapshot
        if str(_record_value(item, "label") or "").strip() and str(_record_value(item, "value") or "").strip()
    )


def _has_required_review_evidence_snapshot(record: Any) -> bool:
    labels = {
        str(_record_value(item, "label") or "").strip()
        for item in _list(_record_value(record, "evidence_snapshot"))
        if str(_record_value(item, "value") or "").strip()
    }
    return all(label in labels for label in _required_review_evidence_labels(record)) and (
        _has_object_reference(_list(_record_value(record, "evidence_snapshot")), record) is not False
    )


def _required_review_evidence_labels(record: Any) -> tuple[str, ...]:
    object_type = str(_record_value(record, "object_type") or "").strip()
    if object_type == "search_term":
        return SEARCH_TERM_REQUIRED_REVIEW_EVIDENCE_LABELS
    if object_type == "advertised_product":
        return ADVERTISED_PRODUCT_REQUIRED_REVIEW_EVIDENCE_LABELS
    if object_type == "placement":
        return PLACEMENT_REQUIRED_REVIEW_EVIDENCE_LABELS
    return REQUIRED_REVIEW_EVIDENCE_LABELS


def _has_object_reference(items: list[Any], record: Any) -> bool | None:
    references = _object_reference_terms(record)
    if not references:
        return None
    snapshot_text = " ".join(
        " ".join(
            str(_record_value(item, field) or "").strip()
            for field in ("label", "value", "detail", "source")
            if str(_record_value(item, field) or "").strip()
        )
        for item in items
    ).casefold()
    return any(reference.casefold() in snapshot_text for reference in references)


def _object_reference_terms(record: Any) -> list[str]:
    terms: list[str] = []
    for value in (_record_value(record, "object_id"), _record_value(record, "object_label")):
        text = str(value or "").strip()
        if text:
            terms.append(text)
        if ":" in text:
            tail = text.rsplit(":", 1)[-1].strip()
            if tail:
                terms.append(tail)
    return list(dict.fromkeys(terms))


def _record_value(record: Any, field: str) -> Any:
    if isinstance(record, dict):
        return record.get(field)
    return getattr(record, field, None)


def _manual_action_type(value: Any) -> str:
    action_type = str(value or "").strip()
    return action_type if action_type in MANUAL_ACTION_TYPES else ""


def _needs_review_todos(target: dict[str, Any]) -> bool:
    return _manual_action_type(target.get("action_type")) in REVIEWABLE_ACTION_TYPES


def _next_action(ready: bool, target: dict[str, Any], blockers: list[dict[str, str]], *, expect_written: bool = False) -> str:
    if ready:
        action_type = _manual_action_type(target.get("action_type"))
        review_text = (
            "已有 1 条人工留痕且不会进入当前 7d / 14d 复盘待办"
            if action_type == "ignore"
            else "已有 1 条人工留痕和完整 7d / 14d 复盘待办"
        )
        write_text = (
            "写入后只验收 manual_actions，且不生成当前 7d / 14d 复盘待办"
            if action_type == "ignore"
            else "写入后只验收 manual_actions 和 7d / 14d 复盘待办"
        )
        if expect_written:
            if action_type == "ignore":
                return (
                    f"写入后验收通过：{target.get('object_type')} / {target.get('object_id')} {review_text}；"
                    "本次不保存 review_records。"
                )
            return (
                f"写入后验收通过：{target.get('object_type')} / {target.get('object_id')} {review_text}；"
                "等待复盘窗口完整后再保存 review_records。"
            )
        return (
            f"等待明确人工授权后，才可对 {target.get('object_type')} / {target.get('object_id')} "
            f"执行一次人工留痕写入；{write_text}。"
        )
    if blockers:
        return "先处理阻塞项：" + "；".join(blocker["message"] for blocker in blockers)
    return "当前没有可写入目标，先回到分诊队列确认信号和对象口径。"


def _dict(value: Any) -> dict[str, Any]:
    return value if isinstance(value, dict) else {}


def _dict_or_none(value: Any) -> dict[str, Any] | None:
    return value if isinstance(value, dict) else None


def _list(value: Any) -> list[Any]:
    return value if isinstance(value, list) else []


def _dict_list(value: Any) -> list[dict[str, Any]]:
    return [item for item in value if isinstance(item, dict)] if isinstance(value, list) else []


def _optional_text(value: Any) -> str | None:
    text = str(value or "").strip()
    return text or None


def _format_amount(value: Any) -> str:
    number = _float(value)
    return "0" if number is None else f"{number:.2f}".rstrip("0").rstrip(".")


def _format_integer(value: Any) -> str:
    number = _int(value)
    return "0" if number is None else str(number)


def _format_percent(value: Any) -> str:
    number = _float(value)
    if number is None:
        return ""
    return f"{number * 100:.1f}%"


def _int(value: Any) -> int | None:
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _float(value: Any) -> float | None:
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _action_root_kwargs(action_root: Path | None) -> dict[str, Path]:
    return {"action_root": action_root} if action_root is not None else {}


def _review_root_kwargs(review_root: Path | None) -> dict[str, Path]:
    return {"review_root": review_root} if review_root is not None else {}


def _triage_root_kwargs(action_root: Path | None, review_root: Path | None) -> dict[str, Path]:
    kwargs: dict[str, Path] = {}
    if action_root is not None:
        kwargs["action_root"] = action_root
    if review_root is not None:
        kwargs["review_root"] = review_root
    return kwargs
