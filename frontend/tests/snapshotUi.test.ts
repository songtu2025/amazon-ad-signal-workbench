import {
  SnapshotCreateResultForUi,
  SnapshotInspectionForUi,
  SnapshotPipelineResultForUi,
  SnapshotProbeResultForUi,
  SnapshotReadinessForUi,
  SnapshotStatusForUi,
  MarketOptionForUi,
  marketOptionLabel,
  snapshotCreateMessage,
  snapshotFreshnessText,
  snapshotInspectionText,
  snapshotPipelineMessage,
  snapshotProbeMessage,
  shouldPauseSnapshotPullForReview,
  snapshotActionBoundaryText,
} from "../src/pages/SignalTriageWorkbench/snapshotUi";
import {
  marketScopedPath,
  manualActionPreflightPath,
  reviewTodosPath,
  signalTriagePath,
  signalManualActionsPath,
  signalReviewEffectPath,
  signalReviewRecordsPath,
  signalReviewTodosPath,
} from "../src/apiPaths";

function assertEqual(actual: string, expected: string) {
  if (actual !== expected) {
    throw new Error(`期望 ${expected}，实际 ${actual}`);
  }
}

function assertIncludes(actual: string, expected: string) {
  if (!actual.includes(expected)) {
    throw new Error(`期望 ${actual} 包含 ${expected}`);
  }
}

function assertBoolean(actual: boolean, expected: boolean) {
  if (actual !== expected) {
    throw new Error(`期望 ${expected}，实际 ${actual}`);
  }
}

const missingReadiness: SnapshotReadinessForUi = {
  can_request_api: false,
  missing: ["GERPGO_APP_ID_AND_GERPGO_APP_KEY_OR_GERPGO_ACCESS_TOKEN"],
  next_action: "在新项目 .env 中配置 GERPGO_ACCESS_TOKEN，或配置 GERPGO_APP_ID 与 GERPGO_APP_KEY 后重新手动拉取快照",
};

const missingStatus: SnapshotStatusForUi = {
  has_snapshot: false,
  shop_name: null,
  marketplace_code: null,
  start_date: null,
  end_date: null,
};

const notReadyCreateResult: SnapshotCreateResultForUi = {
  status: "not_ready",
  missing: ["GERPGO_APP_ID_AND_GERPGO_APP_KEY_OR_GERPGO_ACCESS_TOKEN"],
  message: "缺少积加 API 配置，不能拉取真实快照",
  next_action: "在新项目 .env 中配置 GERPGO_ACCESS_TOKEN，或配置 GERPGO_APP_ID 与 GERPGO_APP_KEY 后重新手动拉取快照",
};

const missingInspection: SnapshotInspectionForUi = {
  status: "missing",
  ready_for_signals: false,
  signal_row_count: 0,
  issues: ["NO_API_SNAPSHOT"],
};

const readyInspection: SnapshotInspectionForUi = {
  status: "ready",
  ready_for_signals: true,
  signal_row_count: 8,
  issues: [],
};

const partialInspection: SnapshotInspectionForUi = {
  status: "partial",
  ready_for_signals: true,
  signal_row_count: 3,
  issues: ["ROW_COUNT_MISMATCH:ad_search_term_daily_metrics"],
};

const reusedCreateResult: SnapshotCreateResultForUi = {
  status: "reused",
  missing: [],
  message: "已复用本地快照",
  inspection: readyInspection,
};

const notReadyPipelineResult: SnapshotPipelineResultForUi = {
  pipeline_status: "not_ready",
  create: notReadyCreateResult,
  inspection: missingInspection,
  signal_scan: {
    ready_for_signals: false,
    signal_row_count: 0,
    aba_row_count: 1000,
    signal_count: 1,
  },
};

const readyProbeResult: SnapshotProbeResultForUi = {
  status: "ready",
  can_request_api: true,
  missing: [],
  api_name: "market_names",
  market_id: 1,
  row_count: 1,
  market: { market_id: 1, market_name: "rivbos US", country: "US" },
  message: "积加 API 轻量探测通过",
};

const notReadyProbeResult: SnapshotProbeResultForUi = {
  status: "not_ready",
  can_request_api: false,
  missing: ["GERPGO_APP_ID_AND_GERPGO_APP_KEY_OR_GERPGO_ACCESS_TOKEN"],
  next_action: "在新项目 .env 中配置 GERPGO_ACCESS_TOKEN，或配置 GERPGO_APP_ID 与 GERPGO_APP_KEY 后重新手动拉取快照",
  api_name: "market_names",
  market_id: 1,
  row_count: 0,
  market: null,
  message: "缺少积加 API 配置，不能探测真实接口",
};

const snapshotMarketOption: MarketOptionForUi = {
  market_id: 1,
  shop_name: "rivbos",
  marketplace_code: "US",
  source: "snapshot",
  has_snapshot: true,
  snapshot_id: "snapshot-1",
};

const sampleMarketOption: MarketOptionForUi = {
  market_id: 1,
  shop_name: "market-1",
  marketplace_code: "待探测",
  source: "project_sample",
  has_snapshot: false,
  snapshot_id: null,
};

const waitingReviewStatus = {
  manual_action_count: 17,
  ready_count: 0,
  review_wait_summary: {
    status: "waiting_review_window",
    earliest_due_date: "2026-06-22",
    next_review_window: "7d",
    next_step: "等待复盘窗口完整后再复核处理后指标，未到期前不拉取快照、不保存复盘结论。",
    forbidden_actions: ["不拉取快照", "不保存复盘结论", "不自动改规则", "不自动执行广告动作"],
  },
};

assertEqual(
  snapshotFreshnessText(missingStatus, missingReadiness),
  "无真实快照：缺少 GERPGO_APP_ID_AND_GERPGO_APP_KEY_OR_GERPGO_ACCESS_TOKEN / 下一步：在新项目 .env 中配置 GERPGO_ACCESS_TOKEN，或配置 GERPGO_APP_ID 与 GERPGO_APP_KEY 后重新手动拉取快照",
);

assertEqual(
  snapshotCreateMessage(notReadyCreateResult),
  "缺少积加 API 配置，不能拉取真实快照：GERPGO_APP_ID_AND_GERPGO_APP_KEY_OR_GERPGO_ACCESS_TOKEN / 下一步：在新项目 .env 中配置 GERPGO_ACCESS_TOKEN，或配置 GERPGO_APP_ID 与 GERPGO_APP_KEY 后重新手动拉取快照",
);

assertEqual(
  snapshotCreateMessage(reusedCreateResult),
  "已复用本地快照 / 快照验收：可进入信号规则，8 行可分析",
);

assertEqual(snapshotInspectionText(missingInspection), "快照验收：未发现本地真实快照");

assertEqual(snapshotInspectionText(readyInspection), "快照验收：可进入信号规则，8 行可分析");

assertEqual(
  snapshotInspectionText(partialInspection),
  "快照验收：有风险但可进入信号规则，3 行可分析，问题 ROW_COUNT_MISMATCH:ad_search_term_daily_metrics",
);

assertEqual(
  snapshotPipelineMessage(notReadyPipelineResult),
  "缺少积加 API 配置，不能拉取真实快照：GERPGO_APP_ID_AND_GERPGO_APP_KEY_OR_GERPGO_ACCESS_TOKEN / 下一步：在新项目 .env 中配置 GERPGO_ACCESS_TOKEN，或配置 GERPGO_APP_ID 与 GERPGO_APP_KEY 后重新手动拉取快照 / 快照验收：未发现本地真实快照 / 信号扫描：1 条",
);

assertEqual(snapshotProbeMessage(readyProbeResult), "API探测：market_names 已通过，rivbos US / US / 1 行");

assertEqual(
  snapshotProbeMessage(notReadyProbeResult),
  "API探测未就绪：GERPGO_APP_ID_AND_GERPGO_APP_KEY_OR_GERPGO_ACCESS_TOKEN / 下一步：在新项目 .env 中配置 GERPGO_ACCESS_TOKEN，或配置 GERPGO_APP_ID 与 GERPGO_APP_KEY 后重新手动拉取快照",
);

assertEqual(marketScopedPath("/api/signals", 1), "/api/signals?market_id=1");

assertEqual(marketScopedPath("/api/signals?status=pending", 1), "/api/signals?status=pending&market_id=1");

assertEqual(marketScopedPath("/api/signals", null), "/api/signals");

assertEqual(signalTriagePath(1, 5, "parent_asin:B00K4W4AAA"), "/api/signal-triage?top=5&product_scope_id=parent_asin%3AB00K4W4AAA&market_id=1");

assertEqual(signalTriagePath(1, 5, "all"), "/api/signal-triage?top=5&market_id=1");

assertEqual(
  manualActionPreflightPath({
    marketId: 1,
    top: 3,
    productScopeId: "parent_asin:B00K4W4AAA",
    expectedObjectId: "B06VW5SQ97",
    expectedObjectType: "sales_product",
    actionType: "add_to_review",
    expectWritten: false,
  }),
  "/api/manual-action/preflight?top=3&product_scope_id=parent_asin%3AB00K4W4AAA&expected_object_id=B06VW5SQ97&expected_object_type=sales_product&action_type=add_to_review&expect_written=false&market_id=1",
);

assertEqual(signalManualActionsPath("sig shared", 2), "/api/signals/sig%20shared/manual-actions?market_id=2");

assertEqual(signalReviewTodosPath("sig shared", 2), "/api/signals/sig%20shared/review-todos?market_id=2");

assertEqual(reviewTodosPath(2), "/api/review-todos?market_id=2");

assertEqual(signalReviewRecordsPath("sig shared", 2), "/api/signals/sig%20shared/review-records?market_id=2");

assertEqual(
  signalReviewRecordsPath("sig shared", 2, { objectType: "advertised_product", objectId: "B016EXMW02" }),
  "/api/signals/sig%20shared/review-records?object_type=advertised_product&object_id=B016EXMW02&market_id=2",
);

assertEqual(signalReviewEffectPath("sig shared", "7d", 2), "/api/signals/sig%20shared/review-effect?review_window=7d&market_id=2");

assertEqual(marketOptionLabel(snapshotMarketOption), "rivbos / US / market_id 1");

assertEqual(marketOptionLabel(sampleMarketOption), "market-1 / 待探测 / market_id 1");

assertBoolean(shouldPauseSnapshotPullForReview(waitingReviewStatus), true);

assertIncludes(snapshotActionBoundaryText(waitingReviewStatus), "复盘窗口未到期");
assertIncludes(snapshotActionBoundaryText(waitingReviewStatus), "2026-06-22 后再只读检查 7 天广告指标复盘效果");
assertIncludes(snapshotActionBoundaryText(waitingReviewStatus), "未到期前不拉取快照、不保存复盘结论");

assertBoolean(shouldPauseSnapshotPullForReview({ manual_action_count: 0, ready_count: 0 }), false);
assertEqual(snapshotActionBoundaryText({ manual_action_count: 0, ready_count: 0 }), "快照拉取只用于人工低频补齐真实 API 数据，不会执行广告动作。");
