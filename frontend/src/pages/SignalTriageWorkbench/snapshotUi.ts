export interface SnapshotStatusForUi {
  has_snapshot: boolean;
  shop_name: string | null;
  marketplace_code: string | null;
  start_date: string | null;
  end_date: string | null;
}

export interface SnapshotReadinessForUi {
  can_request_api: boolean;
  missing: string[];
  next_action?: string | null;
}

export interface SnapshotCreateResultForUi {
  status: string;
  missing: string[];
  next_action?: string | null;
  inspection?: SnapshotInspectionForUi | null;
  message: string;
}

export interface SnapshotProbeResultForUi {
  status: string;
  can_request_api: boolean;
  missing: string[];
  next_action?: string | null;
  api_name: string;
  market_id: number | null;
  row_count: number;
  market: Record<string, unknown> | null;
  message: string;
}

export interface SnapshotInspectionForUi {
  status: string;
  ready_for_signals: boolean;
  signal_row_count: number;
  issues: string[];
}

export interface SnapshotSignalScanForUi {
  ready_for_signals: boolean;
  signal_row_count: number;
  aba_row_count: number;
  signal_count: number;
  summary?: SignalScanSummaryForUi | null;
}

export interface SignalScanSummaryForUi {
  summary_text: string;
  scanned_tables: { name: string; row_count: number; role: string }[];
  hit_signal_categories: { signal_category: string; label: string; count: number }[];
  suppressed_reasons: string[];
  attribution_boundaries: string[];
  next_focus: string;
}

export interface SnapshotPipelineResultForUi {
  pipeline_status: string;
  create: SnapshotCreateResultForUi;
  inspection: SnapshotInspectionForUi;
  signal_scan: SnapshotSignalScanForUi;
}

export interface MarketOptionForUi {
  market_id: number;
  shop_name: string;
  marketplace_code: string;
  source: string;
  has_snapshot: boolean;
  snapshot_id?: string | null;
}

export interface SnapshotReviewStatusForUi {
  manual_action_count?: number | null;
  ready_count?: number | null;
  review_wait_summary?: {
    status?: string | null;
    earliest_due_date?: string | null;
    next_review_window?: string | null;
    next_step?: string | null;
    forbidden_actions?: string[] | null;
  } | null;
}

function missingText(missing: string[]) {
  return missing.filter(Boolean).join("、");
}

function cleanList(items: (string | null | undefined)[]) {
  return items.map((item) => item?.trim()).filter((item): item is string => Boolean(item));
}

function reviewWindowText(window: string | null | undefined) {
  const value = window?.trim();
  if (!value) return "";
  const labels: Record<string, string> = { "7d": "7 天", "14d": "14 天" };
  return labels[value] ?? value;
}

export function marketOptionLabel(option: MarketOptionForUi) {
  return `${option.shop_name} / ${option.marketplace_code} / market_id ${option.market_id}`;
}

export function shouldPauseSnapshotPullForReview(reviewStatus: SnapshotReviewStatusForUi | null | undefined) {
  const waitSummary = reviewStatus?.review_wait_summary;
  return (
    (reviewStatus?.manual_action_count ?? 0) > 0 &&
    (reviewStatus?.ready_count ?? 0) === 0 &&
    waitSummary?.status === "waiting_review_window"
  );
}

export function snapshotActionBoundaryText(reviewStatus: SnapshotReviewStatusForUi | null | undefined) {
  if (!shouldPauseSnapshotPullForReview(reviewStatus)) {
    return "快照拉取只用于人工低频补齐真实 API 数据，不会执行广告动作。";
  }
  const waitSummary = reviewStatus?.review_wait_summary;
  const earliestDueDate = waitSummary?.earliest_due_date?.trim() || "复盘窗口到期";
  const nextReviewWindow = reviewWindowText(waitSummary?.next_review_window);
  const forbiddenActions = cleanList(waitSummary?.forbidden_actions ?? []);
  const forbiddenText = forbiddenActions.length ? forbiddenActions.join("、") : "不拉取快照、不保存复盘结论";
  const reviewTargetText = nextReviewWindow ? ` ${nextReviewWindow}广告指标复盘效果` : "广告指标复盘效果";
  return `复盘窗口未到期：现在只刷新本地信号和查看人工留痕，${earliestDueDate} 后再只读检查${reviewTargetText}；未到期前${forbiddenText}。`;
}

export function snapshotCreateButtonText(isCreating: boolean, reviewStatus: SnapshotReviewStatusForUi | null | undefined) {
  if (isCreating) return "拉取中";
  if (shouldPauseSnapshotPullForReview(reviewStatus)) return "等待复盘到期";
  return "拉取快照";
}

export function snapshotFreshnessText(status: SnapshotStatusForUi | null, readiness: SnapshotReadinessForUi | null) {
  if (!status) return "读取快照状态";
  if (!status.has_snapshot && readiness?.missing.length) {
    const nextAction = readiness.next_action ? ` / 下一步：${readiness.next_action}` : "";
    return `无真实快照：缺少 ${missingText(readiness.missing)}${nextAction}`;
  }
  if (!status.has_snapshot && readiness?.can_request_api) return "无真实快照：可手动拉取";
  if (!status.has_snapshot) return "无真实快照";

  const range = status.start_date && status.end_date ? `${status.start_date} 至 ${status.end_date}` : "周期未知";
  return `API快照：${status.shop_name ?? "未知店铺"} / ${status.marketplace_code ?? "未知站点"} / ${range}`;
}

export function snapshotCreateMessage(result: SnapshotCreateResultForUi) {
  const missing = missingText(result.missing);
  const baseMessage = result.status === "not_ready" && missing ? `${result.message}：${missing}` : result.message;
  const nextAction = result.next_action ? ` / 下一步：${result.next_action}` : "";
  if (result.inspection) return `${baseMessage}${nextAction} / ${snapshotInspectionText(result.inspection)}`;
  return `${baseMessage}${nextAction}`;
}

export function snapshotPipelineMessage(result: SnapshotPipelineResultForUi) {
  const createText = snapshotCreateMessage({ ...result.create, inspection: null });
  return `${createText} / ${snapshotInspectionText(result.inspection)} / 信号扫描：${result.signal_scan.signal_count} 条`;
}

export function signalScanSummaryText(summary: SignalScanSummaryForUi | null) {
  if (!summary) return "信号扫描摘要：读取中";
  return `信号扫描摘要：${summary.summary_text}`;
}

export function snapshotProbeMessage(result: SnapshotProbeResultForUi) {
  const missing = missingText(result.missing);
  const nextAction = result.next_action ? ` / 下一步：${result.next_action}` : "";
  if (result.status === "not_ready") return `API探测未就绪：${missing}${nextAction}`;
  if (result.status === "failed") return `${result.message}${nextAction}`;
  const marketName = typeof result.market?.market_name === "string" ? result.market.market_name : "未知店铺";
  const country = typeof result.market?.country === "string" ? result.market.country : "未知站点";
  return `API探测：${result.api_name} 已通过，${marketName} / ${country} / ${result.row_count} 行`;
}

export function snapshotInspectionText(inspection: SnapshotInspectionForUi | null) {
  if (!inspection) return "快照验收：读取中";
  if (inspection.status === "missing") return "快照验收：未发现本地真实快照";
  if (inspection.ready_for_signals && inspection.issues.length > 0) {
    return `快照验收：有风险但可进入信号规则，${inspection.signal_row_count} 行可分析，问题 ${inspection.issues[0]}`;
  }
  if (inspection.ready_for_signals) return `快照验收：可进入信号规则，${inspection.signal_row_count} 行可分析`;
  if (inspection.status === "empty") return "快照验收：无可分析行";
  return `快照验收：${inspection.status}`;
}
