const API_ROOT = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";
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
export const api = {
    authBootstrap: () => request("/auth/bootstrap"),
    login: (email) => request("/auth/login", { method: "POST", body: JSON.stringify({ email }) }),
    signup: (payload) => request("/auth/signup", { method: "POST", body: JSON.stringify(payload) }),
    session: (userId) => request("/auth/session", { userId }),
    users: () => request("/auth/users"),
    resetDemo: () => request("/auth/reset-demo", { method: "POST" }),
    dashboard: () => request("/overview/dashboard"),
    suppliers: () => request("/suppliers"),
    createSupplier: (payload) => request("/suppliers", { method: "POST", body: JSON.stringify(payload) }),
    blacklistSupplier: (id, reason) => request(`/suppliers/${id}/blacklist`, { method: "POST", body: JSON.stringify({ reason }) }),
    requisitions: () => request("/procurement/requisitions"),
    createRequisition: (payload) => request("/procurement/requisitions", { method: "POST", body: JSON.stringify(payload) }),
    approveRequisition: (id, decision = "approved", note = "") => request(`/procurement/requisitions/${id}/approve`, {
        method: "POST",
        body: JSON.stringify({ decision, note })
    }),
    rfx: () => request("/procurement/rfx"),
    awardRfx: (id, bidId) => request(`/procurement/rfx/${id}/award`, { method: "POST", body: JSON.stringify({ bidId }) }),
    purchaseOrders: () => request("/procurement/purchase-orders"),
    createPoFromRequisition: (id, supplierId) => request(`/procurement/purchase-orders/from-requisition/${id}`, {
        method: "POST",
        body: JSON.stringify({ supplierId })
    }),
    createPoFromAward: (awardId) => request(`/procurement/purchase-orders/from-award/${awardId}`, { method: "POST", body: JSON.stringify({}) }),
    receipts: () => request("/procurement/receipts"),
    receivePo: (id, payload) => request(`/procurement/purchase-orders/${id}/receive`, { method: "POST", body: JSON.stringify(payload) }),
    invoices: () => request("/procurement/invoices"),
    submitInvoice: (payload) => request("/procurement/invoices", { method: "POST", body: JSON.stringify(payload) }),
    matchInvoice: (id, matchType = "3-way") => request(`/procurement/invoices/${id}/match`, { method: "POST", body: JSON.stringify({ matchType }) }),
    budgets: () => request("/finance/budgets"),
    payments: () => request("/finance/payments"),
    createPaymentFromInvoice: (id) => request(`/finance/payments/from-invoice/${id}`, { method: "POST", body: JSON.stringify({}) }),
    authorizePayment: (id, note = "") => request(`/finance/payments/${id}/authorize`, { method: "POST", body: JSON.stringify({ note }) }),
    reconcilePayment: (id, statementRef) => request(`/finance/payments/${id}/reconcile`, { method: "POST", body: JSON.stringify({ statementRef }) }),
    notifications: () => request("/finance/notifications"),
    escalateNotification: (id) => request(`/finance/notifications/${id}/escalate`, { method: "POST", body: JSON.stringify({}) }),
    documents: () => request("/dms/documents"),
    searchDocuments: (query) => request(`/dms/search?q=${encodeURIComponent(query)}`),
    uploadDocument: (payload) => request("/dms/documents/upload", { method: "POST", body: payload }),
    archiveDocument: (id, reason) => request(`/dms/documents/${id}/archive`, { method: "POST", body: JSON.stringify({ reason }) }),
    auditEvents: () => request("/audit/events"),
    auditExportUrl: () => `${API_ROOT}/audit/events/export`,
    auditPackUrl: (referenceId) => `${API_ROOT}/dms/audit-pack/${referenceId}`,
    docsUrl: () => API_DOCS_URL
};
