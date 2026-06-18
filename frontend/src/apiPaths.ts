export function marketScopedPath(path: string, marketId?: number | null) {
  if (marketId === null || marketId === undefined) return path;
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}market_id=${encodeURIComponent(String(marketId))}`;
}

export function signalTriagePath(marketId?: number | null, top = 5, productScopeId?: string | null) {
  const scope = productScopeId && productScopeId !== "all" ? `&product_scope_id=${encodeURIComponent(productScopeId)}` : "";
  return marketScopedPath(`/api/signal-triage?top=${encodeURIComponent(String(top))}${scope}`, marketId);
}

export interface ManualActionPreflightPathOptions {
  marketId?: number | null;
  top?: number;
  productScopeId?: string | null;
  expectedObjectId?: string | null;
  expectedObjectType?: string | null;
  actionType?: string | null;
  expectWritten?: boolean;
}

export function manualActionPreflightPath(options: ManualActionPreflightPathOptions = {}) {
  const query = new URLSearchParams();
  query.set("top", String(options.top ?? 5));
  if (options.productScopeId && options.productScopeId !== "all") query.set("product_scope_id", options.productScopeId);
  if (options.expectedObjectId) query.set("expected_object_id", options.expectedObjectId);
  if (options.expectedObjectType) query.set("expected_object_type", options.expectedObjectType);
  if (options.actionType) query.set("action_type", options.actionType);
  if (options.expectWritten !== undefined) query.set("expect_written", String(options.expectWritten));
  return marketScopedPath(`/api/manual-action/preflight?${query.toString()}`, options.marketId);
}

export function signalManualActionsPath(signalId: string, marketId?: number | null) {
  return marketScopedPath(`/api/signals/${encodeURIComponent(signalId)}/manual-actions`, marketId);
}

export function signalReviewTodosPath(signalId: string, marketId?: number | null) {
  return marketScopedPath(`/api/signals/${encodeURIComponent(signalId)}/review-todos`, marketId);
}

export function reviewTodosPath(marketId?: number | null) {
  return marketScopedPath("/api/review-todos", marketId);
}

export interface SignalReviewRecordLookup {
  objectType?: string | null;
  objectId?: string | null;
}

export function signalReviewRecordsPath(signalId: string, marketId?: number | null, lookup?: SignalReviewRecordLookup | null) {
  const objectType = String(lookup?.objectType ?? "").trim();
  const objectId = String(lookup?.objectId ?? "").trim();
  const stableObjectQuery =
    objectType && objectId ? `?object_type=${encodeURIComponent(objectType)}&object_id=${encodeURIComponent(objectId)}` : "";
  return marketScopedPath(`/api/signals/${encodeURIComponent(signalId)}/review-records${stableObjectQuery}`, marketId);
}

export function signalReviewEffectPath(signalId: string, reviewWindow: string, marketId?: number | null) {
  return marketScopedPath(
    `/api/signals/${encodeURIComponent(signalId)}/review-effect?review_window=${encodeURIComponent(reviewWindow)}`,
    marketId,
  );
}
