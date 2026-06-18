declare function require(name: string): any;
declare const process: { cwd(): string };

const { readFileSync } = require("fs");
const { join } = require("path");

function assertIncludes(actual: string, expected: string) {
  if (!actual.includes(expected)) {
    throw new Error(`期望 SignalTriageWorkbench.tsx 包含 ${expected}`);
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const workbenchSource = readFileSync(
  join(process.cwd(), "src", "pages", "SignalTriageWorkbench", "SignalTriageWorkbench.tsx"),
  "utf8",
);
const signalUiSource = readFileSync(join(process.cwd(), "src", "pages", "SignalTriageWorkbench", "signalUi.ts"), "utf8");

assertIncludes(workbenchSource, "buildProductScopeEvidenceMatrix");
assertIncludes(workbenchSource, "productScopeAdGroupDiagnosisRows");
assertIncludes(workbenchSource, "buildNoActionableManualGate");
assertIncludes(workbenchSource, "buildProductScopeCandidateGapExplanation");
assertIncludes(workbenchSource, "ProductScopeEvidenceMatrix");
assertIncludes(workbenchSource, "ProductScopeAdGroupDiagnosisRow");
assertIncludes(workbenchSource, "NoActionableManualGate");
assertIncludes(workbenchSource, "const productScopeEvidenceMatrix = useMemo");
assertIncludes(workbenchSource, "const productScopeEvidenceRouteGuide = useMemo");
assertIncludes(workbenchSource, "const productScopeAdGroupDiagnosis = useMemo");
assertIncludes(workbenchSource, "const noActionableManualGate = useMemo");
assertIncludes(workbenchSource, "const productScopeCandidateGapExplanation = useMemo");
assertIncludes(workbenchSource, "matrix={productScopeEvidenceMatrix}");
assertIncludes(workbenchSource, "ProductScopeAdGroupDiagnosisPanel rows={productScopeAdGroupDiagnosis}");
assertIncludes(workbenchSource, "function ProductScopeEvidenceMatrixPanel");
assertIncludes(workbenchSource, "function ProductScopeAdGroupDiagnosisPanel");
assertIncludes(workbenchSource, "function ProductScopeEvidenceRouteGuidePanel");
assertIncludes(workbenchSource, "function ProductScopeCandidateGapExplanationPanel");
assertIncludes(workbenchSource, "function NoActionableManualGatePanel");
assertIncludes(workbenchSource, "effective-${index}-${term.label}");
assertIncludes(workbenchSource, "zero-${index}-${term.label}");
assertIncludes(workbenchSource, 'aria-label="对象证据矩阵"');
assertIncludes(workbenchSource, 'aria-label="广告证据链导览"');
assertIncludes(workbenchSource, "guide.summary");
assertIncludes(signalUiSource, "先看经营入口，再看广告 ASIN、广告组、搜索词/广告位和人工确认门禁");

const diagnosisPanelIndex = workbenchSource.indexOf('<section className="diagnosisPanel">');
const routeGuideRenderIndex = workbenchSource.indexOf(
  "{productScopeEvidenceRouteGuide && <ProductScopeEvidenceRouteGuidePanel guide={productScopeEvidenceRouteGuide} />}",
);
const adGroupDiagnosisRenderIndex = workbenchSource.indexOf(
  "{productScopeAdGroupDiagnosis.length > 0 && <ProductScopeAdGroupDiagnosisPanel rows={productScopeAdGroupDiagnosis} />}",
);
const selectedSignalBranchIndex = workbenchSource.indexOf("{selectedSignal ? (");
assert(diagnosisPanelIndex >= 0, "诊断区必须存在");
assert(routeGuideRenderIndex > diagnosisPanelIndex, "广告证据链导览必须渲染在诊断区内");
assert(routeGuideRenderIndex < selectedSignalBranchIndex, "广告证据链导览不能被单条信号选中状态挡住");
assert(adGroupDiagnosisRenderIndex > diagnosisPanelIndex, "广告组问题定位必须渲染在诊断区内");
assert(adGroupDiagnosisRenderIndex < selectedSignalBranchIndex, "广告组问题定位不能被单条信号选中状态挡住");

assertIncludes(workbenchSource, 'aria-label="Parent ASIN 经营诊断路径"');
assertIncludes(workbenchSource, "productScopePathPreview");
assertIncludes(workbenchSource, "buildProductScopeFirstScreenSummary");
assertIncludes(workbenchSource, "productScopeBusinessPreview");
assertIncludes(workbenchSource, "useRef");
assertIncludes(workbenchSource, "workbenchGridRef");
assertIncludes(workbenchSource, "isEvidenceDrilldownFocused");
assertIncludes(workbenchSource, "setIsEvidenceDrilldownFocused");
assertIncludes(workbenchSource, "handleOpenProductScopeEvidenceDrilldown");
assertIncludes(workbenchSource, "productScopeBusinessPreviewActions");
assertIncludes(workbenchSource, "workbenchGrid focusedFromFirstScreen");
assertIncludes(workbenchSource, 'aria-label="广告证据下钻状态"');
assertIncludes(workbenchSource, "已进入广告诊断工作台");
assertIncludes(workbenchSource, "按广告组、搜索词和广告位证据继续排查");
assertIncludes(workbenchSource, 'aria-label="首屏证据下钻入口"');
assertIncludes(workbenchSource, 'aria-label="广告诊断工作台"');
assertIncludes(workbenchSource, "查看广告组、搜索词和广告位证据");
assertIncludes(workbenchSource, 'aria-label="Parent ASIN 首屏经营摘要"');
assertIncludes(workbenchSource, 'aria-label="首屏广告 ASIN 对比"');
assertIncludes(workbenchSource, 'aria-label="首屏诊断路径"');
assertIncludes(workbenchSource, 'aria-label="MVP 落地门禁"');
assertIncludes(workbenchSource, 'aria-label="诊断 MVP 状态判定"');
assertIncludes(workbenchSource, "productScopeFirstScreenSummary.mvpStatus");
assertIncludes(workbenchSource, 'aria-label="广告 ASIN 范围同步提示"');
assertIncludes(workbenchSource, "productScopeSelectionSummary.scopeSyncNotice");
assertIncludes(workbenchSource, 'aria-label="广告 ASIN 候选缺口解释"');
assertIncludes(workbenchSource, "productScopeCandidateGapExplanation");
assertIncludes(workbenchSource, "productScopeBusinessPreviewPath");
assertIncludes(workbenchSource, "productScopeFirstScreenSummary.pathSteps");
assertIncludes(workbenchSource, "productScopeFirstScreenSummary.landingGates");
assertIncludes(workbenchSource, 'scope_id: "loading_product_scope"');
assertIncludes(workbenchSource, "正在读取经营商品入口");
assertIncludes(workbenchSource, "disabled={productScope === null || loading}");
assertIncludes(workbenchSource, 'aria-label="广告组问题定位"');
assertIncludes(workbenchSource, 'aria-label="广告组人工复核判断"');
assertIncludes(workbenchSource, 'aria-label="搜索词问题定位"');
assertIncludes(workbenchSource, 'aria-label="人工候选与广告组关系"');
assertIncludes(workbenchSource, "buildManualReviewClosureLedger");
assertIncludes(workbenchSource, "buildReviewReadinessGateSummary");
assertIncludes(workbenchSource, "selectedManualReviewClosureLedger");
assertIncludes(workbenchSource, "reviewReadinessGateSummary");
assertIncludes(workbenchSource, 'aria-label="全局复盘可验证性"');
assertIncludes(workbenchSource, "reviewReadinessGateSummary");
assertIncludes(workbenchSource, 'aria-label="复盘读回身份门禁"');
assertIncludes(workbenchSource, "reviewReadinessGateSummary.identityAudit");
assertIncludes(workbenchSource, 'aria-label="复盘下一步路径"');
assertIncludes(workbenchSource, "reviewReadinessNextSteps");
assertIncludes(workbenchSource, "snapshotActionBoundaryText");
assertIncludes(workbenchSource, "shouldPauseSnapshotPullForReview");
assertIncludes(workbenchSource, "snapshotActionBoundary");
assertIncludes(workbenchSource, 'aria-label="快照复盘门禁"');
assertIncludes(workbenchSource, 'aria-label="人工确认复盘闭环三层"');
assertIncludes(workbenchSource, "manualReviewClosureLedger");
assertIncludes(workbenchSource, '有效搜索词');
assertIncludes(workbenchSource, '无订单花费词');
assertIncludes(workbenchSource, 'aria-label="无候选人工动作门禁"');
