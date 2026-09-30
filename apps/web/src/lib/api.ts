import type {
  AppState,
  AuditEvent,
  BudgetLedger,
  Department,
  DocumentRecord,
  Invoice,
  Location,
  PaymentRequest,
  Permission,
  PurchaseOrder,
  Requisition,
  Rfx,
  Role,
  Supplier,
  User
} from "@sos-procuresphere/shared";

const API_ROOT = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:4000/api/v1";
const API_DOCS_URL = API_ROOT.replace(/\/api\/v1\/?$/, "/docs");
const STORAGE_KEY = "sos-procuresphere-user-id";

export interface SessionPayload {
  user: User;
  permissions: Permission[];
  roles: Role[];
}

export interface AuthBootstrapPayload {
  users: Array<User & { roles: Role[] }>;
  locations: Location[];
  departments: Department[];
}

export interface SignupPayload {
  name: string;
  email: string;
  title: string;
  locationId: string;
  departmentId: string;
}

export interface DashboardPayload {
  generatedAt: string;
  counts: Record<string, number>;
  metrics: AppState["metrics"];
  pendingApprovals: Array<{
    type: string;
    reference: string;
    title: string;
    approverName: string;
    thresholdRule: string;
  }>;
  notifications: AppState["notifications"];
  workflowCoverage: Array<{
    label: string;
    status: string;
    reference: string;
  }>;
}

export interface DocumentsPayload {
  documents: DocumentRecord[];
  retentionPolicies: AppState["retentionPolicies"];
  archiveLog: AppState["archiveLog"];
}

const buildHeaders = (userId?: string, body?: BodyInit | null) => {
  const headers = new Headers();
  if (!(body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const activeUserId = userId ?? currentUserId();
  if (activeUserId) {
    headers.set("x-user-id", activeUserId);
  }

  return headers;
};

async function request<T>(path: string, init?: RequestInit & { userId?: string }): Promise<T> {
  const response = await fetch(`${API_ROOT}${path}`, {
    ...init,
    headers: buildHeaders(init?.userId, init?.body ?? null)
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => ({ message: "Request failed." }))) as { message?: string };
    throw new Error(error.message ?? "Request failed.");
  }

  return (await response.json()) as T;
}

export const currentUserId = () => window.localStorage.getItem(STORAGE_KEY) ?? undefined;

export const persistUserId = (userId: string) => {
  window.localStorage.setItem(STORAGE_KEY, userId);
};

export const clearUserId = () => {
  window.localStorage.removeItem(STORAGE_KEY);
};

export const api = {
  authBootstrap: () => request<AuthBootstrapPayload>("/auth/bootstrap"),
  login: (email: string) => request<SessionPayload>("/auth/login", { method: "POST", body: JSON.stringify({ email }) }),
  signup: (payload: SignupPayload) => request<SessionPayload>("/auth/signup", { method: "POST", body: JSON.stringify(payload) }),
  session: (userId?: string) => request<SessionPayload>("/auth/session", { userId }),
  users: () =>
    request<Array<User & { roles: Role[] }>>("/auth/users"),
  resetDemo: () => request<{ message: string }>("/auth/reset-demo", { method: "POST" }),
  dashboard: () => request<DashboardPayload>("/overview/dashboard"),
  suppliers: () => request<Supplier[]>("/suppliers"),
  createSupplier: (payload: Record<string, unknown>) =>
    request<Supplier>("/suppliers", { method: "POST", body: JSON.stringify(payload) }),
  blacklistSupplier: (id: string, reason: string) =>
    request<Supplier>(`/suppliers/${id}/blacklist`, { method: "POST", body: JSON.stringify({ reason }) }),
  requisitions: () => request<Requisition[]>("/procurement/requisitions"),
  createRequisition: (payload: Record<string, unknown>) =>
    request<Requisition>("/procurement/requisitions", { method: "POST", body: JSON.stringify(payload) }),
  approveRequisition: (id: string, decision = "approved", note = "") =>
    request<Requisition>(`/procurement/requisitions/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ decision, note })
    }),
  rfx: () => request<Rfx[]>("/procurement/rfx"),
  awardRfx: (id: string, bidId: string) =>
    request<Rfx>(`/procurement/rfx/${id}/award`, { method: "POST", body: JSON.stringify({ bidId }) }),
  purchaseOrders: () => request<PurchaseOrder[]>("/procurement/purchase-orders"),
  createPoFromRequisition: (id: string, supplierId: string) =>
    request<PurchaseOrder>(`/procurement/purchase-orders/from-requisition/${id}`, {
      method: "POST",
      body: JSON.stringify({ supplierId })
    }),
  createPoFromAward: (awardId: string) =>
    request<PurchaseOrder>(`/procurement/purchase-orders/from-award/${awardId}`, { method: "POST", body: JSON.stringify({}) }),
  receipts: () => request<AppState["receipts"]>("/procurement/receipts"),
  receivePo: (id: string, payload: Record<string, unknown>) =>
    request(`/procurement/purchase-orders/${id}/receive`, { method: "POST", body: JSON.stringify(payload) }),
  invoices: () => request<Invoice[]>("/procurement/invoices"),
  submitInvoice: (payload: Record<string, unknown>) =>
    request<Invoice>("/procurement/invoices", { method: "POST", body: JSON.stringify(payload) }),
  matchInvoice: (id: string, matchType: "2-way" | "3-way" = "3-way") =>
    request<Invoice>(`/procurement/invoices/${id}/match`, { method: "POST", body: JSON.stringify({ matchType }) }),
  budgets: () => request<Array<BudgetLedger & { available: number }>>("/finance/budgets"),
  payments: () => request<PaymentRequest[]>("/finance/payments"),
  createPaymentFromInvoice: (id: string) =>
    request<PaymentRequest>(`/finance/payments/from-invoice/${id}`, { method: "POST", body: JSON.stringify({}) }),
  authorizePayment: (id: string, note = "") =>
    request<PaymentRequest>(`/finance/payments/${id}/authorize`, { method: "POST", body: JSON.stringify({ note }) }),
  reconcilePayment: (id: string, statementRef: string) =>
    request<PaymentRequest>(`/finance/payments/${id}/reconcile`, { method: "POST", body: JSON.stringify({ statementRef }) }),
  notifications: () => request<AppState["notifications"]>("/finance/notifications"),
  escalateNotification: (id: string) =>
    request(`/finance/notifications/${id}/escalate`, { method: "POST", body: JSON.stringify({}) }),
  documents: () => request<DocumentsPayload>("/dms/documents"),
  searchDocuments: (query: string) =>
    request<{ query: string; count: number; results: DocumentRecord[] }>(`/dms/search?q=${encodeURIComponent(query)}`),
  uploadDocument: (payload: FormData) =>
    request<DocumentRecord>("/dms/documents/upload", { method: "POST", body: payload }),
  archiveDocument: (id: string, reason: string) =>
    request(`/dms/documents/${id}/archive`, { method: "POST", body: JSON.stringify({ reason }) }),
  auditEvents: () => request<AuditEvent[]>("/audit/events"),
  auditExportUrl: () => `${API_ROOT}/audit/events/export`,
  auditPackUrl: (referenceId: string) => `${API_ROOT}/dms/audit-pack/${referenceId}`,
  docsUrl: () => API_DOCS_URL
};
