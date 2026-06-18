from typing import Any

from pydantic import BaseModel, Field


class MarketOption(BaseModel):
    market_id: int
    shop_name: str
    marketplace_code: str
    country: str | None = None
    source: str
    has_snapshot: bool = False
    snapshot_id: str | None = None


class SnapshotStatus(BaseModel):
    has_snapshot: bool
    snapshot_id: str | None = None
    source: str | None = None
    market_id: int | None = None
    shop_name: str | None = None
    marketplace_code: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    created_at: str | None = None
    status: str
    row_counts: dict[str, int] = Field(default_factory=dict)
    api_list: list[str] = Field(default_factory=list)
    error_message: str | None = None


class NormalizedTableInspection(BaseModel):
    name: str
    exists: bool
    manifest_row_count: int | None = None
    actual_row_count: int
    matches_manifest: bool
    path: str | None = None


class SnapshotInspectionResult(BaseModel):
    status: str
    has_snapshot: bool
    ready_for_signals: bool
    snapshot_id: str | None = None
    source: str | None = None
    market_id: int | None = None
    shop_name: str | None = None
    marketplace_code: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    created_at: str | None = None
    snapshot_status: str | None = None
    signal_row_count: int = 0
    row_counts: dict[str, int] = Field(default_factory=dict)
    api_list: list[str] = Field(default_factory=list)
    normalized_tables: list[NormalizedTableInspection] = Field(default_factory=list)
    issues: list[str] = Field(default_factory=list)


class SnapshotReadiness(BaseModel):
    ready: bool
    can_request_api: bool
    missing: list[str] = Field(default_factory=list)
    next_action: str | None = None
    market_id: int | None = None
    base_url_configured: bool = True
    auth_mode: str = "missing"
    has_snapshot: bool = False
    snapshot_status: str = "missing"
    snapshot_id: str | None = None
    shop_name: str | None = None
    marketplace_code: str | None = None
    reason: str


class SnapshotCreateRequest(BaseModel):
    market_id: int | None = None
    days: int = Field(default=7)
    count: int = Field(default=10, ge=1, le=50)
    max_pages: int = Field(default=1, ge=1, le=3)
    sales_max_pages: int | None = Field(default=None, ge=1, le=5)
    force: bool = False


class SnapshotProbeResult(BaseModel):
    status: str
    can_request_api: bool = True
    missing: list[str] = Field(default_factory=list)
    next_action: str | None = None
    api_name: str = "market_names"
    market_id: int | None = None
    row_count: int = 0
    market: dict[str, Any] | None = None
    message: str


class SnapshotCreateResult(BaseModel):
    status: str
    can_request_api: bool = True
    missing: list[str] = Field(default_factory=list)
    next_action: str | None = None
    snapshot_dir: str | None = None
    snapshot_id: str | None = None
    market_id: int | None = None
    shop_name: str | None = None
    marketplace_code: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    row_counts: dict[str, int] = Field(default_factory=dict)
    inspection: SnapshotInspectionResult | None = None
    message: str


class SnapshotPipelineResult(BaseModel):
    pipeline_status: str
    create: SnapshotCreateResult
    inspection: SnapshotInspectionResult
    signal_scan: dict[str, Any]
