import { demoState } from "@sos-procuresphere/shared";
const API_ROOT = import.meta.env.VITE_API_URL ?? "";
// Demo mode: no backend configured (GitHub Pages / static hosting)
const DEMO_MODE = !import.meta.env.VITE_API_URL;
const API_DOCS_URL = API_ROOT.replace(/\/api\/v1\/?$/, "/docs");
const STORAGE_KEY = "sos-procuresphere-user-id";
const buildHeaders = (userId, body) => {
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
async function request(path, init) {
    const response = await fetch(`${API_ROOT}${path}`, {
        ...init,
        headers: buildHeaders(init?.userId, init?.body ?? null)
    });
    if (!response.ok) {
        const error = (await response.json().catch(() => ({ message: "Request failed." })));
        throw new Error(error.message ?? "Request failed.");
    }
    return (await response.json());
}
export const currentUserId = () => window.localStorage.getItem(STORAGE_KEY) ?? undefined;
export const persistUserId = (userId) => {
    window.localStorage.setItem(STORAGE_KEY, userId);
};
export const clearUserId = () => {
    window.localStorage.removeItem(STORAGE_KEY);
};
// Helper to resolve roles for a user
const resolveRoles = (user) => demoState.roles.filter((r) => user.roleIds.includes(r.id));
const resolvePermissions = (user) => {
    const roleCodes = resolveRoles(user).flatMap((r) => r.permissionCodes);
    return demoState.permissions.filter((p) => roleCodes.includes(p.code));
};
// ── Demo-mode shims ─────────────────────────────────────────────────────────
const demoApi = {
    authBootstrap: async () => ({
        users: demoState.users.map((u) => ({ ...u, roles: resolveRoles(u) })),
        locations: demoState.locations,
        departments: demoState.departments
    }),
    login: async (email) => {
        const user = demoState.users.find((u) => u.email === email);
        if (!user)
            throw new Error("User not found in demo data.");
        return { user, roles: resolveRoles(user), permissions: resolvePermissions(user) };
    },
    signup: async (payload) => {
        const newUser = {
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
    session: async (userId) => {
        const user = demoState.users.find((u) => u.id === userId);
        if (!user)
            throw new Error("Session not found.");
        return { user, roles: resolveRoles(user), permissions: resolvePermissions(user) };
    },
    users: async () => demoState.users.map((u) => ({ ...u, roles: resolveRoles(u) })),
    resetDemo: async () => ({ message: "Demo reset (client-only)." }),
    dashboard: async () => ({
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
            .flatMap((r) => r.approvals
            .filter((a) => a.status === "pending")
            .map((a) => ({
            type: "Requisition",
            reference: r.id,
            title: r.title,
            approverName: a.approverName,
            thresholdRule: a.thresholdRule
        }))),
        notifications: demoState.notifications,
        workflowCoverage: demoState.requisitions.map((r) => ({
            label: r.title,
            status: r.status,
            reference: r.id
        }))
    }),
    suppliers: async () => demoState.suppliers,
    createSupplier: async (payload) => ({ id: `sup-${Date.now()}`, ...payload, status: "active", preferred: false, documents: [], performance: [], dueDiligenceChecklist: [] }),
    blacklistSupplier: async (id, reason) => {
        const s = demoState.suppliers.find((x) => x.id === id);
        if (!s)
            throw new Error("Supplier not found.");
        return { ...s, status: "blacklisted", blacklistReason: reason };
    },
    requisitions: async () => demoState.requisitions,
    createRequisition: async (payload) => ({ id: `pr-${Date.now()}`, status: "draft", approvals: [], lineItems: [], attachments: [], ...payload }),
    approveRequisition: async (id, decision = "approved", note = "") => {
        const r = demoState.requisitions.find((x) => x.id === id);
        if (!r)
            throw new Error("Requisition not found.");
        return { ...r, status: decision };
    },
    rfx: async () => demoState.rfxs,
    awardRfx: async (id, bidId) => {
        const r = demoState.rfxs.find((x) => x.id === id);
        if (!r)
            throw new Error("RFx not found.");
        return { ...r, status: "awarded" };
    },
    purchaseOrders: async () => demoState.purchaseOrders,
    createPoFromRequisition: async (id, supplierId) => ({ id: `po-${Date.now()}`, sourceRequisitionId: id, supplierId, status: "draft", approvals: [], amendments: [], lines: [], amount: 0, currency: "USD", projectCode: "", budgetLine: "", createdAt: new Date().toISOString() }),
    createPoFromAward: async (awardId) => ({ id: `po-${Date.now()}`, sourceAwardId: awardId, status: "draft", approvals: [], amendments: [], lines: [], amount: 0, currency: "USD", projectCode: "", budgetLine: "", createdAt: new Date().toISOString() }),
    receipts: async () => demoState.receipts,
    receivePo: async (_id, _payload) => ({}),
    invoices: async () => demoState.invoices,
    submitInvoice: async (payload) => ({ id: `inv-${Date.now()}`, status: "submitted", ...payload }),
    matchInvoice: async (id) => {
        const inv = demoState.invoices.find((x) => x.id === id);
        if (!inv)
            throw new Error("Invoice not found.");
        return { ...inv, status: "approved" };
    },
    budgets: async () => demoState.budgetLedgers.map((b) => ({ ...b, available: b.planned - b.committed - b.actual })),
    payments: async () => demoState.paymentRequests,
    createPaymentFromInvoice: async (id) => ({ id: `pay-${Date.now()}`, invoiceId: id, status: "draft", approvals: [], amount: 0, currency: "USD" }),
    authorizePayment: async (id) => {
        const p = demoState.paymentRequests.find((x) => x.id === id);
        if (!p)
            throw new Error("Payment not found.");
        return { ...p, status: "authorized" };
    },
    reconcilePayment: async (id, statementRef) => {
        const p = demoState.paymentRequests.find((x) => x.id === id);
        if (!p)
            throw new Error("Payment not found.");
        return { ...p, status: "reconciled" };
    },
    notifications: async () => demoState.notifications,
    escalateNotification: async (_id) => ({}),
    documents: async () => ({
        documents: demoState.documents,
        retentionPolicies: demoState.retentionPolicies,
        archiveLog: demoState.archiveLog
    }),
    searchDocuments: async (query) => ({
        query,
        count: demoState.documents.length,
        results: demoState.documents.filter((d) => d.title.toLowerCase().includes(query.toLowerCase()) || d.ocrText?.toLowerCase().includes(query.toLowerCase()))
    }),
    uploadDocument: async (payload) => ({ id: `doc-${Date.now()}`, title: payload.get("title") ?? "Untitled", status: "active" }),
    archiveDocument: async (_id, _reason) => ({}),
    auditEvents: async () => demoState.auditEvents,
    auditExportUrl: () => "#",
    auditPackUrl: (_ref) => "#",
    docsUrl: () => "#"
};
// ── Live API ─────────────────────────────────────────────────────────────────
const liveApi = {
    authBootstrap: () => request(`${API_ROOT}/auth/bootstrap`),
    login: (email) => request(`${API_ROOT}/auth/login`, { method: "POST", body: JSON.stringify({ email }) }),
    signup: (payload) => request(`${API_ROOT}/auth/signup`, { method: "POST", body: JSON.stringify(payload) }),
    session: (userId) => request(`${API_ROOT}/auth/session`, { userId }),
    users: () => request(`${API_ROOT}/auth/users`),
    resetDemo: () => request(`${API_ROOT}/auth/reset-demo`, { method: "POST" }),
    dashboard: () => request(`${API_ROOT}/overview/dashboard`),
    suppliers: () => request(`${API_ROOT}/suppliers`),
    createSupplier: (payload) => request(`${API_ROOT}/suppliers`, { method: "POST", body: JSON.stringify(payload) }),
    blacklistSupplier: (id, reason) => request(`${API_ROOT}/suppliers/${id}/blacklist`, { method: "POST", body: JSON.stringify({ reason }) }),
    requisitions: () => request(`${API_ROOT}/procurement/requisitions`),
    createRequisition: (payload) => request(`${API_ROOT}/procurement/requisitions`, { method: "POST", body: JSON.stringify(payload) }),
    approveRequisition: (id, decision = "approved", note = "") => request(`${API_ROOT}/procurement/requisitions/${id}/approve`, {
        method: "POST",
        body: JSON.stringify({ decision, note })
    }),
    rfx: () => request(`${API_ROOT}/procurement/rfx`),
    awardRfx: (id, bidId) => request(`${API_ROOT}/procurement/rfx/${id}/award`, { method: "POST", body: JSON.stringify({ bidId }) }),
    purchaseOrders: () => request(`${API_ROOT}/procurement/purchase-orders`),
    createPoFromRequisition: (id, supplierId) => request(`${API_ROOT}/procurement/purchase-orders/from-requisition/${id}`, {
        method: "POST",
        body: JSON.stringify({ supplierId })
    }),
    createPoFromAward: (awardId) => request(`${API_ROOT}/procurement/purchase-orders/from-award/${awardId}`, { method: "POST", body: JSON.stringify({}) }),
    receipts: () => request(`${API_ROOT}/procurement/receipts`),
    receivePo: (id, payload) => request(`${API_ROOT}/procurement/purchase-orders/${id}/receive`, { method: "POST", body: JSON.stringify(payload) }),
    invoices: () => request(`${API_ROOT}/procurement/invoices`),
    submitInvoice: (payload) => request(`${API_ROOT}/procurement/invoices`, { method: "POST", body: JSON.stringify(payload) }),
    matchInvoice: (id, matchType = "3-way") => request(`${API_ROOT}/procurement/invoices/${id}/match`, { method: "POST", body: JSON.stringify({ matchType }) }),
    budgets: () => request(`${API_ROOT}/finance/budgets`),
    payments: () => request(`${API_ROOT}/finance/payments`),
    createPaymentFromInvoice: (id) => request(`${API_ROOT}/finance/payments/from-invoice/${id}`, { method: "POST", body: JSON.stringify({}) }),
    authorizePayment: (id, note = "") => request(`${API_ROOT}/finance/payments/${id}/authorize`, { method: "POST", body: JSON.stringify({ note }) }),
    reconcilePayment: (id, statementRef) => request(`${API_ROOT}/finance/payments/${id}/reconcile`, { method: "POST", body: JSON.stringify({ statementRef }) }),
    notifications: () => request(`${API_ROOT}/finance/notifications`),
    escalateNotification: (id) => request(`${API_ROOT}/finance/notifications/${id}/escalate`, { method: "POST", body: JSON.stringify({}) }),
    documents: () => request(`${API_ROOT}/dms/documents`),
    searchDocuments: (query) => request(`${API_ROOT}/dms/search?q=${encodeURIComponent(query)}`),
    uploadDocument: (payload) => request(`${API_ROOT}/dms/documents/upload`, { method: "POST", body: payload }),
    archiveDocument: (id, reason) => request(`${API_ROOT}/dms/documents/${id}/archive`, { method: "POST", body: JSON.stringify({ reason }) }),
    auditEvents: () => request(`${API_ROOT}/audit/events`),
    auditExportUrl: () => `${API_ROOT}/audit/events/export`,
    auditPackUrl: (referenceId) => `${API_ROOT}/dms/audit-pack/${referenceId}`,
    docsUrl: () => API_ROOT.replace(/\/api\/v1\/?$/, "/docs")
};
export const api = DEMO_MODE ? demoApi : liveApi;
