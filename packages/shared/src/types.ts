export type Id = string;

export type Currency = "USD" | "LRD";
export type ApprovalDecision = "pending" | "approved" | "rejected" | "escalated";
export type RfxType = "RFI" | "RFQ" | "RFP";
export type BudgetCheckMode = "soft" | "hard";
export type BudgetCheckStatus = "ok" | "warning" | "blocked";
export type DocumentPermissionLevel = "view" | "edit" | "download";
export type ProcurementStatus =
  | "draft"
  | "submitted"
  | "pending_approval"
  | "approved"
  | "issued"
  | "awarded"
  | "partially_received"
  | "closed"
  | "exception";

export interface Permission {
  id: Id;
  code: string;
  label: string;
  module: "auth" | "suppliers" | "procurement" | "finance" | "dms" | "audit";
}

export interface Role {
  id: Id;
  name: string;
  description: string;
  permissionCodes: string[];
}

export interface Location {
  id: Id;
  name: string;
  code: string;
  region: string;
}

export interface Department {
  id: Id;
  name: string;
  costCenter: string;
}

export interface User {
  id: Id;
  name: string;
  email: string;
  title: string;
  roleIds: Id[];
  departmentId: Id;
  locationId: Id;
  totpEnabled: boolean;
  lastLoginAt: string;
}

export interface SupplierDocument {
  id: Id;
  supplierId: Id;
  type: string;
  fileName: string;
  expiryDate?: string;
  status: "valid" | "expiring" | "expired";
}

export interface SupplierPerformance {
  id: Id;
  supplierId: Id;
  deliveryScore: number;
  qualityScore: number;
  complianceScore: number;
  comment: string;
  evaluatedAt: string;
}

export interface BlacklistRecord {
  id: Id;
  supplierId: Id;
  reason: string;
  fromDate: string;
  toDate?: string;
  approvedBy: Id;
}

export interface Supplier {
  id: Id;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  bankingDetails: string;
  taxId: string;
  categories: string[];
  preferred: boolean;
  status: "active" | "suspended" | "blacklisted";
  dueDiligenceChecklist: string[];
  documents: SupplierDocument[];
  performance: SupplierPerformance[];
  blacklist?: BlacklistRecord;
}

export interface BudgetCheckResult {
  id: Id;
  budgetLine: string;
  projectCode: string;
  planned: number;
  committed: number;
  actual: number;
  available: number;
  mode: BudgetCheckMode;
  status: BudgetCheckStatus;
  message: string;
  checkedAt: string;
}

export interface LineItem {
  id: Id;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  leadTimeDays?: number;
  warrantyMonths?: number;
  category: string;
}

export interface ApprovalStep {
  id: Id;
  approverId: Id;
  approverName: string;
  roleLabel: string;
  thresholdRule: string;
  status: ApprovalDecision;
  actedAt?: string;
  note?: string;
}

export interface Requisition {
  id: Id;
  title: string;
  justification: string;
  requesterId: Id;
  requesterName: string;
  departmentId: Id;
  locationId: Id;
  donorCode: string;
  projectCode: string;
  budgetLine: string;
  amount: number;
  currency: Currency;
  policyRule: string;
  status: ProcurementStatus;
  lineItems: LineItem[];
  attachments: string[];
  approvals: ApprovalStep[];
  budgetCheck: BudgetCheckResult;
  createdAt: string;
  updatedAt: string;
}

export interface RfxItem extends LineItem {
  specification: string;
}

export interface BidDocument {
  id: Id;
  title: string;
  fileName: string;
}

export interface SupplierBid {
  id: Id;
  rfxId: Id;
  supplierId: Id;
  supplierName: string;
  submittedAt: string;
  totalAmount: number;
  currency: Currency;
  leadTimeDays: number;
  warrantyMonths: number;
  complianceStatement: string;
  documents: BidDocument[];
  lineComparisons: Array<{
    itemId: Id;
    unitPrice: number;
    leadTimeDays: number;
    compliant: boolean;
  }>;
}

export interface EvaluationCriterion {
  id: Id;
  label: string;
  weight: number;
}

export interface EvaluationScore {
  bidId: Id;
  totalScore: number;
  criteriaScores: Array<{
    criterionId: Id;
    score: number;
    note: string;
  }>;
  committeeNotes: string;
  recommended: boolean;
}

export interface Award {
  id: Id;
  rfxId: Id;
  bidId: Id;
  supplierId: Id;
  supplierName: string;
  recommendation: string;
  approvedBy: Id;
  approvedAt: string;
}

export interface Rfx {
  id: Id;
  type: RfxType;
  title: string;
  description: string;
  closingAt: string;
  invitedSupplierIds: Id[];
  category: string;
  status: "draft" | "published" | "closed" | "evaluated" | "awarded";
  items: RfxItem[];
  evaluationCriteria: EvaluationCriterion[];
  bids: SupplierBid[];
  evaluation: EvaluationScore[];
  award?: Award;
  featureFlags: {
    reverseAuction: boolean;
  };
}

export interface PurchaseOrder {
  id: Id;
  sourceRequisitionId?: Id;
  sourceAwardId?: Id;
  supplierId: Id;
  supplierName: string;
  amount: number;
  currency: Currency;
  projectCode: string;
  budgetLine: string;
  status: "draft" | "approved" | "issued" | "partially_received" | "closed";
  approvals: ApprovalStep[];
  amendments: POAmendment[];
  lines: LineItem[];
  issuedAt?: string;
  createdAt: string;
}

export interface POAmendment {
  id: Id;
  poId: Id;
  version: number;
  summary: string;
  approvedBy: Id;
  approvedAt: string;
}

export interface ReceivingLine {
  lineItemId: Id;
  receivedQuantity: number;
  acceptedQuantity: number;
}

export interface GoodsReceipt {
  id: Id;
  poId: Id;
  receiverId: Id;
  receiverName: string;
  type: "goods" | "service";
  receivedAt: string;
  status: "partial" | "complete";
  lines: ReceivingLine[];
  note: string;
}

export interface MatchException {
  id: Id;
  type: "price_variance" | "quantity_variance" | "missing_grn";
  severity: "low" | "medium" | "high";
  resolved: boolean;
  resolutionNote?: string;
  resolvedBy?: Id;
}

export interface MatchResult {
  id: Id;
  invoiceId: Id;
  matchType: "2-way" | "3-way";
  status: "matched" | "exception";
  exceptions: MatchException[];
  checkedAt: string;
}

export interface Invoice {
  id: Id;
  poId: Id;
  supplierId: Id;
  supplierName: string;
  invoiceNumber: string;
  amount: number;
  currency: Currency;
  submittedAt: string;
  submittedBy: "supplier_portal" | "internal";
  status: "received" | "matched" | "exception" | "approved";
  lines: LineItem[];
  matchResult?: MatchResult;
}

export interface PaymentApproval {
  id: Id;
  approverId: Id;
  approverName: string;
  status: ApprovalDecision;
  actedAt?: string;
  note?: string;
}

export interface BankTransferReference {
  id: Id;
  paymentRequestId: Id;
  adapter: string;
  bankReference: string;
  status: "queued" | "initiated" | "confirmed";
  updatedAt: string;
}

export interface ReconciliationRecord {
  id: Id;
  paymentRequestId: Id;
  matched: boolean;
  bankStatementRef: string;
  reconciledAt?: string;
}

export interface PaymentRequest {
  id: Id;
  invoiceId: Id;
  amount: number;
  currency: Currency;
  status: "pending" | "authorized" | "initiated" | "reconciled";
  approvals: PaymentApproval[];
  bankTransferRef?: BankTransferReference;
  reconciliation?: ReconciliationRecord;
}

export interface DocumentVersion {
  id: Id;
  label: string;
  fileName: string;
  uploadedBy: Id;
  uploadedAt: string;
  hash: string;
}

export interface MetadataTag {
  key: string;
  value: string;
}

export interface RelatedEntityRef {
  type: "supplier" | "requisition" | "rfx" | "po" | "invoice" | "payment";
  id: Id;
}

export interface DocumentPermission {
  roleId: Id;
  level: DocumentPermissionLevel;
}

export interface RetentionPolicy {
  id: Id;
  category: string;
  retainYears: number;
  archiveAfterDays: number;
  legalHoldAllowed: boolean;
}

export interface ArchiveLog {
  id: Id;
  documentId: Id;
  action: "archived" | "restored";
  actedBy: Id;
  actedAt: string;
  reason: string;
}

export interface DocumentRecord {
  id: Id;
  title: string;
  docType: string;
  supplierId?: Id;
  metadata: MetadataTag[];
  relatedEntities: RelatedEntityRef[];
  uploadedBy: Id;
  uploadedAt: string;
  updatedAt: string;
  ocrText: string;
  currentVersionId: Id;
  versions: DocumentVersion[];
  permissions: DocumentPermission[];
  retentionPolicyId: Id;
  archived: boolean;
  archiveDueAt: string;
  filePath?: string;
}

export interface AuditEvent {
  id: Id;
  actorId: Id;
  actorName: string;
  action: string;
  entityType: string;
  entityId: Id;
  occurredAt: string;
  detail: string;
}

export interface Notification {
  id: Id;
  title: string;
  body: string;
  severity: "info" | "warning" | "critical";
  audienceRoleIds: Id[];
  dueAt: string;
  escalated: boolean;
}

export interface BudgetLedger {
  id: Id;
  projectCode: string;
  budgetLine: string;
  donorCode: string;
  planned: number;
  committed: number;
  actual: number;
  mode: BudgetCheckMode;
}

export interface DashboardMetrics {
  spendBySupplier: Array<{ label: string; value: number }>;
  spendByCategory: Array<{ label: string; value: number }>;
  spendByLocation: Array<{ label: string; value: number }>;
  cycleTimes: Array<{ label: string; value: number }>;
  complianceRates: Array<{ label: string; value: number }>;
  budgetUtilization: Array<{ label: string; value: number }>;
}

export interface AppState {
  name: string;
  generatedAt: string;
  permissions: Permission[];
  roles: Role[];
  locations: Location[];
  departments: Department[];
  users: User[];
  suppliers: Supplier[];
  budgetLedgers: BudgetLedger[];
  requisitions: Requisition[];
  rfxs: Rfx[];
  purchaseOrders: PurchaseOrder[];
  receipts: GoodsReceipt[];
  invoices: Invoice[];
  paymentRequests: PaymentRequest[];
  retentionPolicies: RetentionPolicy[];
  archiveLog: ArchiveLog[];
  documents: DocumentRecord[];
  auditEvents: AuditEvent[];
  notifications: Notification[];
  metrics: DashboardMetrics;
}
