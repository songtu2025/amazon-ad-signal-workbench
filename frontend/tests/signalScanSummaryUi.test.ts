import {
  SignalScanSummaryForUi,
  signalScanSummaryText,
} from "../src/pages/SignalTriageWorkbench/snapshotUi";

function assertEqual(actual: string, expected: string) {
  if (actual !== expected) {
    throw new Error(`期望 ${expected}，实际 ${actual}`);
  }
}

function assertIncludes(actual: string, expected: string) {
  if (!actual.includes(expected)) {
    throw new Error(`期望包含 ${expected}，实际 ${actual}`);
  }
}

const readySummary: SignalScanSummaryForUi = {
  summary_text: "本次扫描 42 行真实 API 数据，命中 5 类 AI 信号。",
  scanned_tables: [
    { name: "advertised_products", row_count: 2, role: "广告商品表现" },
    { name: "ad_search_term_daily_metrics", row_count: 20, role: "搜索词表现" },
  ],
  hit_signal_categories: [
    { signal_category: "advertised_product_opportunity", label: "广告商品机会", count: 2 },
    { signal_category: "data_quality", label: "数据质量", count: 3 },
  ],
  suppressed_reasons: ["已读取主推款策略，匹配策略的广告组消耗集中不直接推送异常。"],
  attribution_boundaries: ["搜索词只说明广告活动 / 广告组 / 投放对象上下文，不能自动归因到单个 ASIN。"],
  next_focus: "先看 Parent ASIN / ASIN 商品信号；需要看范围外问题时再切到全量排查。",
};

assertEqual(signalScanSummaryText(null), "信号扫描摘要：读取中");
assertEqual(signalScanSummaryText(readySummary), "信号扫描摘要：本次扫描 42 行真实 API 数据，命中 5 类 AI 信号。");

const fullText = [
  readySummary.summary_text,
  ...readySummary.scanned_tables.map((item) => `${item.role} ${item.row_count} 行`),
  ...readySummary.hit_signal_categories.map((item) => `${item.label} ${item.count} 条`),
  ...readySummary.suppressed_reasons,
  ...readySummary.attribution_boundaries,
  readySummary.next_focus,
].join(" / ");

assertIncludes(fullText, "广告商品表现 2 行");
assertIncludes(fullText, "数据质量 3 条");
assertIncludes(fullText, "主推款策略");
assertIncludes(fullText, "不能自动归因到单个 ASIN");
