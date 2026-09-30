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

import { demoState } from "@sos-procuresphere/shared";

const API_ROOT = (import.meta.env.VITE_API_URL as string | undefined) ?? "";
// Demo mode: no backend configured (GitHub Pages / static hosting)
const DEMO_MODE = !import.meta.env.VITE_API_URL;
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

// Helper to resolve roles for a user
const resolveRoles = (user: User) =>
  demoState.roles.filter((r) => user.roleIds.includes(r.id));

const resolvePermissions = (user: User) => {
  const roleCodes = resolveRoles(user).flatMap((r) => r.permissionCodes);
  return demoState.permissions.filter((p) => roleCodes.includes(p.code));
};

// ── Demo-mode shims ─────────────────────────────────────────────────────────
const demoApi = {
  authBootstrap: async (): Promise<AuthBootstrapPayload> => ({
    users: demoState.users.map((u) => ({ ...u, roles: resolveRoles(u) })),
    locations: demoState.locations,
    departments: demoState.departments
  }),
  login: async (email: string): Promise<SessionPayload> => {
    const user = demoState.users.find((u) => u.email === email);
    if (!user) throw new Error("User not found in demo data.");
    return { user, roles: resolveRoles(user), permissions: resolvePermissions(user) };
  },
  signup: async (payload: SignupPayload): Promise<SessionPayload> => {
    const newUser: User = {
      id: `user-${Date.now()}`,
      name: payload.name,
      email: payload.email,
      title: payload.title,
      roleIds: ["role-requester"],
      departmentId: payload.departmentId,
      locationId: payload.locationId,
      totpEnabled: false,
      lastLoginAt: new Date().toISOString()
    };
    return { user: newUser, roles: resolveRoles(newUser), permissions: resolvePermissions(newUser) };
  },
  session: async (userId?: string): Promise<SessionPayload> => {
    const user = demoState.users.find((u) => u.id === userId);
    if (!user) throw new Error("Session not found.");
    return { user, roles: resolveRoles(user), permissions: resolvePermissions(user) };
  },
  users: async () => demoState.users.map((u) => ({ ...u, roles: resolveRoles(u) })),
  resetDemo: async () => ({ message: "Demo reset (client-only)." }),
  dashboard: async (): Promise<DashboardPayload> => ({
    generatedAt: demoState.generatedAt,
    counts: {
      suppliers: demoState.suppliers.length,
      requisitions: demoState.requisitions.length,
      purchaseOrders: demoState.purchaseOrders.length,
      invoices: demoState.invoices.length,
      documents: demoState.documents.length
    },
    metrics: demoState.metrics,
    pendingApprovals: demoState.requisitions
      .filter((r) => r.status === "pending_approval")
      .flatMap((r) =>
        r.approvals
          .filter((a) => a.status === "pending")
          .map((a) => ({
            type: "Requisition",
            reference: r.id,
            title: r.title,
            approverName: a.approverName,
            thresholdRule: a.thresholdRule
          }))
      ),
    notifications: demoState.notifications,
    workflowCoverage: demoState.requisitions.map((r) => ({
      label: r.title,
      status: r.status,
      reference: r.id
    }))
  }),
  suppliers: async () => demoState.suppliers,
  createSupplier: async (payload: Record<string, unknown>) =>
    ({ id: `sup-${Date.now()}`, ...payload, status: "active", preferred: false, documents: [], performance: [], dueDiligenceChecklist: [] } as unknown as Supplier),
  blacklistSupplier: async (id: string, reason: string) => {
    const s = demoState.suppliers.find((x) => x.id === id);
    if (!s) throw new Error("Supplier not found.");
    return { ...s, status: "blacklisted" as const, blacklistReason: reason };
  },
  requisitions: async () => demoState.requisitions,
  createRequisition: async (payload: Record<string, unknown>) =>
    ({ id: `pr-${Date.now()}`, status: "draft", approvals: [], lineItems: [], attachments: [], ...payload } as unknown as Requisition),
  approveRequisition: async (id: string, decision = "approved", note = "") => {
    const r = demoState.requisitions.find((x) => x.id === id);
    if (!r) throw new Error("Requisition not found.");
    return { ...r, status: decision as Requisition["status"] };
  },
  rfx: async () => demoState.rfxs,
  awardRfx: async (id: string, bidId: string) => {
    const r = demoState.rfxs.find((x) => x.id === id);
    if (!r) throw new Error("RFx not found.");
    return { ...r, status: "awarded" as const };
  },
  purchaseOrders: async () => demoState.purchaseOrders,
  createPoFromRequisition: async (id: string, supplierId: string) =>
    ({ id: `po-${Date.now()}`, sourceRequisitionId: id, supplierId, status: "draft", approvals: [], amendments: [], lines: [], amount: 0, currency: "USD", projectCode: "", budgetLine: "", createdAt: new Date().toISOString() } as unknown as PurchaseOrder),
  createPoFromAward: async (awardId: string) =>
    ({ id: `po-${Date.now()}`, sourceAwardId: awardId, status: "draft", approvals: [], amendments: [], lines: [], amount: 0, currency: "USD", projectCode: "", budgetLine: "", createdAt: new Date().toISOString() } as unknown as PurchaseOrder),
  receipts: async () => demoState.receipts,
  receivePo: async (_id: string, _payload: Record<string, unknown>) => ({}),
  invoices: async () => demoState.invoices,
  submitInvoice: async (payload: Record<string, unknown>) =>
    ({ id: `inv-${Date.now()}`, status: "submitted", ...payload } as unknown as Invoice),
  matchInvoice: async (id: string) => {
    const inv = demoState.invoices.find((x) => x.id === id);
    if (!inv) throw new Error("Invoice not found.");
    return { ...inv, status: "approved" as const };
  },
  budgets: async () =>
    demoState.budgetLedgers.map((b) => ({ ...b, available: b.planned - b.committed - b.actual })),
  payments: async () => demoState.paymentRequests,
  createPaymentFromInvoice: async (id: string) =>
    ({ id: `pay-${Date.now()}`, invoiceId: id, status: "draft", approvals: [], amount: 0, currency: "USD" } as unknown as PaymentRequest),
  authorizePayment: async (id: string) => {
    const p = demoState.paymentRequests.find((x) => x.id === id);
    if (!p) throw new Error("Payment not found.");
    return { ...p, status: "authorized" as const };
  },
  reconcilePayment: async (id: string, statementRef: string) => {
    const p = demoState.paymentRequests.find((x) => x.id === id);
    if (!p) throw new Error("Payment not found.");
    return { ...p, status: "reconciled" as const };
  },
  notifications: async () => demoState.notifications,
  escalateNotification: async (_id: string) => ({}),
  documents: async (): Promise<DocumentsPayload> => ({
    documents: demoState.documents,
    retentionPolicies: demoState.retentionPolicies,
    archiveLog: demoState.archiveLog
  }),
  searchDocuments: async (query: string) => ({
    query,
    count: demoState.documents.length,
    results: demoState.documents.filter(
      (d) => d.title.toLowerCase().includes(query.toLowerCase()) || d.ocrText?.toLowerCase().includes(query.toLowerCase())
    )
  }),
  uploadDocument: async (payload: FormData) =>
    ({ id: `doc-${Date.now()}`, title: payload.get("title") ?? "Untitled", status: "active" } as unknown as DocumentRecord),
  archiveDocument: async (_id: string, _reason: string) => ({}),
  auditEvents: async () => demoState.auditEvents,
  auditExportUrl: () => "#",
  auditPackUrl: (_ref: string) => "#",
  docsUrl: () => "#"
};

// ── Live API ─────────────────────────────────────────────────────────────────
const liveApi = {
  authBootstrap: () => request<AuthBootstrapPayload>(`${API_ROOT}/auth/bootstrap`),
  login: (email: string) => request<SessionPayload>(`${API_ROOT}/auth/login`, { method: "POST", body: JSON.stringify({ email }) }),
  signup: (payload: SignupPayload) => request<SessionPayload>(`${API_ROOT}/auth/signup`, { method: "POST", body: JSON.stringify(payload) }),
  session: (userId?: string) => request<SessionPayload>(`${API_ROOT}/auth/session`, { userId }),
  users: () => request<Array<User & { roles: Role[] }>>(`${API_ROOT}/auth/users`),
  resetDemo: () => request<{ message: string }>(`${API_ROOT}/auth/reset-demo`, { method: "POST" }),
  dashboard: () => request<DashboardPayload>(`${API_ROOT}/overview/dashboard`),
  suppliers: () => request<Supplier[]>(`${API_ROOT}/suppliers`),
  createSupplier: (payload: Record<string, unknown>) =>
    request<Supplier>(`${API_ROOT}/suppliers`, { method: "POST", body: JSON.stringify(payload) }),
  blacklistSupplier: (id: string, reason: string) =>
    request<Supplier>(`${API_ROOT}/suppliers/${id}/blacklist`, { method: "POST", body: JSON.stringify({ reason }) }),
  requisitions: () => request<Requisition[]>(`${API_ROOT}/procurement/requisitions`),
  createRequisition: (payload: Record<string, unknown>) =>
    request<Requisition>(`${API_ROOT}/procurement/requisitions`, { method: "POST", body: JSON.stringify(payload) }),
  approveRequisition: (id: string, decision = "approved", note = "") =>
    request<Requisition>(`${API_ROOT}/procurement/requisitions/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ decision, note })
    }),
  rfx: () => request<Rfx[]>(`${API_ROOT}/procurement/rfx`),
  awardRfx: (id: string, bidId: string) =>
    request<Rfx>(`${API_ROOT}/procurement/rfx/${id}/award`, { method: "POST", body: JSON.stringify({ bidId }) }),
  purchaseOrders: () => request<PurchaseOrder[]>(`${API_ROOT}/procurement/purchase-orders`),
  createPoFromRequisition: (id: string, supplierId: string) =>
    request<PurchaseOrder>(`${API_ROOT}/procurement/purchase-orders/from-requisition/${id}`, {
      method: "POST",
      body: JSON.stringify({ supplierId })
    }),
  createPoFromAward: (awardId: string) =>
    request<PurchaseOrder>(`${API_ROOT}/procurement/purchase-orders/from-award/${awardId}`, { method: "POST", body: JSON.stringify({}) }),
  receipts: () => request<AppState["receipts"]>(`${API_ROOT}/procurement/receipts`),
  receivePo: (id: string, payload: Record<string, unknown>) =>
    request(`${API_ROOT}/procurement/purchase-orders/${id}/receive`, { method: "POST", body: JSON.stringify(payload) }),
  invoices: () => request<Invoice[]>(`${API_ROOT}/procurement/invoices`),
  submitInvoice: (payload: Record<string, unknown>) =>
    request<Invoice>(`${API_ROOT}/procurement/invoices`, { method: "POST", body: JSON.stringify(payload) }),
  matchInvoice: (id: string, matchType: "2-way" | "3-way" = "3-way") =>
    request<Invoice>(`${API_ROOT}/procurement/invoices/${id}/match`, { method: "POST", body: JSON.stringify({ matchType }) }),
  budgets: () => request<Array<BudgetLedger & { available: number }>>(`${API_ROOT}/finance/budgets`),
  payments: () => request<PaymentRequest[]>(`${API_ROOT}/finance/payments`),
  createPaymentFromInvoice: (id: string) =>
    request<PaymentRequest>(`${API_ROOT}/finance/payments/from-invoice/${id}`, { method: "POST", body: JSON.stringify({}) }),
  authorizePayment: (id: string, note = "") =>
    request<PaymentRequest>(`${API_ROOT}/finance/payments/${id}/authorize`, { method: "POST", body: JSON.stringify({ note }) }),
  reconcilePayment: (id: string, statementRef: string) =>
    request<PaymentRequest>(`${API_ROOT}/finance/payments/${id}/reconcile`, { method: "POST", body: JSON.stringify({ statementRef }) }),
  notifications: () => request<AppState["notifications"]>(`${API_ROOT}/finance/notifications`),
  escalateNotification: (id: string) =>
    request(`${API_ROOT}/finance/notifications/${id}/escalate`, { method: "POST", body: JSON.stringify({}) }),
  documents: () => request<DocumentsPayload>(`${API_ROOT}/dms/documents`),
  searchDocuments: (query: string) =>
    request<{ query: string; count: number; results: DocumentRecord[] }>(`${API_ROOT}/dms/search?q=${encodeURIComponent(query)}`),
  uploadDocument: (payload: FormData) =>
    request<DocumentRecord>(`${API_ROOT}/dms/documents/upload`, { method: "POST", body: payload }),
  archiveDocument: (id: string, reason: string) =>
    request(`${API_ROOT}/dms/documents/${id}/archive`, { method: "POST", body: JSON.stringify({ reason }) }),
  auditEvents: () => request<AuditEvent[]>(`${API_ROOT}/audit/events`),
  auditExportUrl: () => `${API_ROOT}/audit/events/export`,
  auditPackUrl: (referenceId: string) => `${API_ROOT}/dms/audit-pack/${referenceId}`,
  docsUrl: () => API_ROOT.replace(/\/api\/v1\/?$/, "/docs")
};

export const api = DEMO_MODE ? demoApi : liveApi;

