from pydantic import BaseModel, Field


class ProductScopeOption(BaseModel):
    scope_id: str
    scope_type: str
    label: str
    asin: str | None = None
    parent_asin: str | None = None
    child_asins: list[str] = Field(default_factory=list)
    source: str
    spend: float = 0
    orders: int = 0
    sales: float = 0
    sales_orders: int = 0
    sales_amount: float = 0
    ad_spend: float = 0
    ad_orders: int = 0
    ad_sales: float = 0
    metric_boundary: str | None = None
    strategy_notes: list[str] = Field(default_factory=list)


class ProductScopeCoverage(BaseModel):
    sales_asin_count: int = 0
    advertised_asin_count: int = 0
    parent_asin_count: int = 0
    matched_asin_count: int = 0
    search_term_unattributed_count: int = 0
    placement_unattributed_count: int = 0
    boundary: str


class ProductScopeSummary(BaseModel):
    has_snapshot: bool
    snapshot_id: str | None = None
    market_id: int | None = None
    shop_name: str | None = None
    marketplace_code: str | None = None
    options: list[ProductScopeOption] = Field(default_factory=list)
    coverage: ProductScopeCoverage
