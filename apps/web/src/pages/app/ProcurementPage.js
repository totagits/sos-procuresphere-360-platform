import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import { ActionButton, Panel, SectionHeading, StatusBadge, Table } from "@/components/dashboard/widgets";
import { api } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/format";
export const ProcurementPage = () => {
    const queryClient = useQueryClient();
    const [quickPr, setQuickPr] = useState({
        title: "",
        amount: "1500",
        projectCode: "EDU-2026-BCV",
        budgetLine: "6100-Furniture"
    });
    const [requisitionsResult, rfxResult, poResult, invoicesResult, receiptsResult] = useQueries({
        queries: [
            { queryKey: ["requisitions"], queryFn: api.requisitions },
            { queryKey: ["rfx"], queryFn: api.rfx },
            { queryKey: ["purchaseOrders"], queryFn: api.purchaseOrders },
            { queryKey: ["invoices"], queryFn: api.invoices },
            { queryKey: ["receipts"], queryFn: api.receipts }
        ]
    });
    const approveRequisition = useMutation({
        mutationFn: (requisitionId) => api.approveRequisition(requisitionId, "approved", "Approved from dashboard queue."),
        onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["requisitions"] })
    });
    const createPo = useMutation({
        mutationFn: ({ requisitionId, supplierId }) => api.createPoFromRequisition(requisitionId, supplierId),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ["purchaseOrders"] });
            void queryClient.invalidateQueries({ queryKey: ["requisitions"] });
        }
    });
    const createRequisition = useMutation({
        mutationFn: () => api.createRequisition({
            ...quickPr,
            amount: Number(quickPr.amount),
            donorCode: "DONOR-NEW-01",
            justification: "Rapid demo requisition",
            lineItems: [
                {
                    id: `li-${Date.now()}`,
                    description: quickPr.title || "Demo line item",
                    quantity: 1,
                    unit: "lot",
                    unitPrice: Number(quickPr.amount),
                    category: "Supplies"
                }
            ]
        }),
        onSuccess: () => {
            setQuickPr((current) => ({ ...current, title: "" }));
            void queryClient.invalidateQueries({ queryKey: ["requisitions"] });
        }
    });
    const awardRfx = useMutation({
        mutationFn: ({ rfxId, bidId }) => api.awardRfx(rfxId, bidId),
        onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["rfx"] })
    });
    const matchInvoice = useMutation({
        mutationFn: (invoiceId) => api.matchInvoice(invoiceId),
        onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["invoices"] })
    });
    const requisitions = requisitionsResult.data ?? [];
    const rfxs = rfxResult.data ?? [];
    const purchaseOrders = poResult.data ?? [];
    const invoices = invoicesResult.data ?? [];
    const receipts = receiptsResult.data ?? [];
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs(Panel, { children: [_jsx(SectionHeading, { eyebrow: "Requisitioning", title: "PR intake, donor coding, approvals, and PO creation", detail: "This view covers the core procure-to-pay path from request through budget control, approval routing, and order issuance." }), _jsxs("div", { className: "grid gap-6 xl:grid-cols-[1.15fr_0.85fr]", children: [_jsx(Table, { headers: ["Reference", "Request", "Amount", "Budget Check", "Status", "Actions"], rows: requisitions.map((requisition) => {
                                    const poExists = purchaseOrders.some((order) => order.sourceRequisitionId === requisition.id);
                                    return [
                                        requisition.id.toUpperCase(),
                                        _jsxs("div", { children: [_jsx("p", { className: "font-medium", children: requisition.title }), _jsxs("p", { className: "text-xs text-slate-500", children: [requisition.projectCode, " \u2022 ", requisition.budgetLine] })] }, requisition.id),
                                        formatCurrency(requisition.amount, requisition.currency),
                                        _jsx(StatusBadge, { value: requisition.budgetCheck.status }, `${requisition.id}-budget`),
                                        _jsx(StatusBadge, { value: requisition.status }, `${requisition.id}-status`),
                                        _jsxs("div", { className: "flex flex-wrap gap-2", children: [requisition.status === "pending_approval" ? (_jsx(ActionButton, { tone: "secondary", onClick: () => approveRequisition.mutate(requisition.id), children: "Approve" })) : null, requisition.status === "approved" && !poExists ? (_jsx(ActionButton, { onClick: () => createPo.mutate({ requisitionId: requisition.id, supplierId: "sup-libstar" }), children: "Create PO" })) : null] }, `${requisition.id}-actions`)
                                    ];
                                }) }), _jsxs(Panel, { className: "border-slate-100 bg-slate-50/80", children: [_jsx("h3", { className: "font-['Sora'] text-lg font-semibold", children: "Quick requisition" }), _jsx("p", { className: "mt-2 text-sm text-slate-600", children: "Create a demo PR with automatic threshold approvals and budget validation." }), _jsxs("div", { className: "mt-4 grid gap-3", children: [_jsx("input", { value: quickPr.title, onChange: (event) => setQuickPr((current) => ({ ...current, title: event.target.value })), className: "rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm", placeholder: "Request title" }), _jsx("input", { value: quickPr.amount, onChange: (event) => setQuickPr((current) => ({ ...current, amount: event.target.value })), className: "rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm", placeholder: "Amount" }), _jsx("input", { value: quickPr.projectCode, onChange: (event) => setQuickPr((current) => ({ ...current, projectCode: event.target.value })), className: "rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm", placeholder: "Project code" }), _jsx("input", { value: quickPr.budgetLine, onChange: (event) => setQuickPr((current) => ({ ...current, budgetLine: event.target.value })), className: "rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm", placeholder: "Budget line" }), _jsx(ActionButton, { onClick: () => createRequisition.mutate(), disabled: !quickPr.title || createRequisition.isPending, children: "Submit PR" })] })] })] })] }), _jsxs("section", { className: "grid gap-6 xl:grid-cols-[1fr_1fr]", children: [_jsxs(Panel, { children: [_jsx(SectionHeading, { eyebrow: "E-Sourcing", title: "RFQ, bids, evaluation, and award", detail: "Time-locked submissions, committee scoring, and award decisions are visible at line-item level." }), _jsx("div", { className: "space-y-4", children: rfxs.map((rfx) => (_jsx("div", { className: "rounded-[24px] border border-slate-100 bg-slate-50/90 p-4", children: _jsxs("div", { className: "flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [_jsxs("p", { className: "font-['Sora'] text-lg font-semibold", children: [rfx.id.toUpperCase(), " \u2022 ", rfx.title] }), _jsx(StatusBadge, { value: rfx.status })] }), _jsx("p", { className: "mt-2 text-sm text-slate-600", children: rfx.description }), _jsxs("p", { className: "mt-3 text-xs uppercase tracking-[0.24em] text-slate-500", children: ["Closing ", formatDateTime(rfx.closingAt)] }), _jsx("ul", { className: "mt-4 space-y-2 text-sm text-slate-700", children: rfx.bids.map((bid) => (_jsxs("li", { className: "rounded-2xl bg-white px-4 py-3", children: [_jsx("span", { className: "font-medium", children: bid.supplierName }), " \u2022 ", formatCurrency(bid.totalAmount), " \u2022 ", bid.leadTimeDays, " days \u2022 ", bid.warrantyMonths, " month warranty", !rfx.award ? (_jsx("button", { type: "button", onClick: () => awardRfx.mutate({ rfxId: rfx.id, bidId: bid.id }), className: "ml-3 text-sm font-semibold text-sky-700", children: "Award bid" })) : null] }, bid.id))) })] }), rfx.award ? (_jsxs("div", { className: "min-w-[230px] rounded-[22px] bg-brand-ink p-4 text-white", children: [_jsx("p", { className: "text-xs uppercase tracking-[0.24em] text-cyan-100", children: "Awarded Supplier" }), _jsx("p", { className: "mt-3 font-['Sora'] text-xl font-semibold", children: rfx.award.supplierName }), _jsx("p", { className: "mt-2 text-sm text-sky-100", children: rfx.award.recommendation })] })) : null] }) }, rfx.id))) })] }), _jsxs(Panel, { children: [_jsx(SectionHeading, { eyebrow: "Fulfilment", title: "Receiving, invoices, and matching", detail: "Segregation of duties remains intact through receiving, invoice capture, and exception-ready matching." }), _jsxs("div", { className: "space-y-5", children: [_jsxs("div", { children: [_jsx("h3", { className: "mb-3 font-['Sora'] text-lg font-semibold", children: "Purchase orders and receipts" }), _jsx(Table, { headers: ["PO", "Supplier", "Status", "Issued", "Receipt status"], rows: purchaseOrders.map((po) => {
                                                    const receipt = receipts.find((entry) => entry.poId === po.id);
                                                    return [
                                                        po.id.toUpperCase(),
                                                        po.supplierName,
                                                        _jsx(StatusBadge, { value: po.status }, `${po.id}-status`),
                                                        formatDateTime(po.issuedAt),
                                                        receipt ? `${receipt.id.toUpperCase()} • ${receipt.status}` : "Awaiting receipt"
                                                    ];
                                                }) })] }), _jsxs("div", { children: [_jsx("h3", { className: "mb-3 font-['Sora'] text-lg font-semibold", children: "Invoices and match results" }), _jsx(Table, { headers: ["Invoice", "Supplier", "Amount", "Status", "Matching"], rows: invoices.map((invoice) => [
                                                    invoice.invoiceNumber,
                                                    invoice.supplierName,
                                                    formatCurrency(invoice.amount, invoice.currency),
                                                    _jsx(StatusBadge, { value: invoice.status }, `${invoice.id}-status`),
                                                    invoice.matchResult ? (_jsx(StatusBadge, { value: invoice.matchResult.status }, `${invoice.id}-match`)) : (_jsx(ActionButton, { tone: "secondary", onClick: () => matchInvoice.mutate(invoice.id), children: "Run 3-way match" }))
                                                ]) })] })] })] })] })] }));
};
