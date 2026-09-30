import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import { ActionButton, Panel, SectionHeading, StatusBadge, Table } from "@/components/dashboard/widgets";
import { api } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/format";
export const FinancePage = () => {
    const queryClient = useQueryClient();
    const [budgetsResult, paymentsResult, notificationsResult] = useQueries({
        queries: [
            { queryKey: ["budgets"], queryFn: api.budgets },
            { queryKey: ["payments"], queryFn: api.payments },
            { queryKey: ["notifications"], queryFn: api.notifications }
        ]
    });
    const authorizePayment = useMutation({
        mutationFn: (paymentId) => api.authorizePayment(paymentId, "Authorized from finance dashboard."),
        onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["payments"] })
    });
    const reconcilePayment = useMutation({
        mutationFn: (paymentId) => api.reconcilePayment(paymentId, `BANK-STATEMENT-${Date.now()}`),
        onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["payments"] })
    });
    const escalateNotification = useMutation({
        mutationFn: (notificationId) => api.escalateNotification(notificationId),
        onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["notifications"] })
    });
    const budgets = budgetsResult.data ?? [];
    const payments = paymentsResult.data ?? [];
    const notifications = notificationsResult.data ?? [];
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs(Panel, { children: [_jsx(SectionHeading, { eyebrow: "Budget Control", title: "Commitments, actuals, and hard-stop governance", detail: "Finance teams can enforce donor budgets at PR or PO stage, then actualize cash impact at invoice and payment stage." }), _jsx(Table, { headers: ["Project", "Budget Line", "Mode", "Planned", "Committed", "Actual", "Available"], rows: budgets.map((budget) => [
                            budget.projectCode,
                            budget.budgetLine,
                            _jsx(StatusBadge, { value: budget.mode }, `${budget.id}-mode`),
                            formatCurrency(budget.planned),
                            formatCurrency(budget.committed),
                            formatCurrency(budget.actual),
                            formatCurrency(budget.available)
                        ]) })] }), _jsxs("section", { className: "grid gap-6 xl:grid-cols-[1.1fr_0.9fr]", children: [_jsxs(Panel, { children: [_jsx(SectionHeading, { eyebrow: "Payment Control", title: "Authorization, bank adapter status, and reconciliation hooks", detail: "The mock adapter demonstrates payload handoff, reference capture, and reconciliation status tracking for future bank APIs." }), _jsx(Table, { headers: ["Payment", "Invoice", "Amount", "Status", "Bank Ref", "Action"], rows: payments.map((payment) => [
                                    payment.id.toUpperCase(),
                                    payment.invoiceId.toUpperCase(),
                                    formatCurrency(payment.amount, payment.currency),
                                    _jsx(StatusBadge, { value: payment.status }, `${payment.id}-status`),
                                    payment.bankTransferRef?.bankReference ?? "Pending",
                                    _jsxs("div", { className: "flex flex-wrap gap-2", children: [payment.status === "pending" || payment.status === "authorized" ? (_jsx(ActionButton, { tone: "secondary", onClick: () => authorizePayment.mutate(payment.id), children: "Authorize" })) : null, payment.status === "initiated" ? (_jsx(ActionButton, { onClick: () => reconcilePayment.mutate(payment.id), children: "Reconcile" })) : null] }, `${payment.id}-actions`)
                                ]) })] }), _jsxs(Panel, { children: [_jsx(SectionHeading, { eyebrow: "Exception Desk", title: "Approval reminders and escalations", detail: "SLA timers and exception prompts can be escalated for finance and leadership review." }), _jsx("div", { className: "space-y-4", children: notifications.map((notification) => (_jsx("div", { className: "rounded-[24px] border border-slate-100 bg-slate-50/90 p-4", children: _jsxs("div", { className: "flex items-start justify-between gap-4", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [_jsx("p", { className: "font-medium text-brand-ink", children: notification.title }), _jsx(StatusBadge, { value: notification.severity })] }), _jsx("p", { className: "mt-2 text-sm text-slate-600", children: notification.body }), _jsxs("p", { className: "mt-3 text-xs uppercase tracking-[0.2em] text-slate-500", children: ["Due ", formatDateTime(notification.dueAt)] })] }), _jsx(ActionButton, { tone: "secondary", disabled: notification.escalated, onClick: () => escalateNotification.mutate(notification.id), children: notification.escalated ? "Escalated" : "Escalate" })] }) }, notification.id))) })] })] })] }));
};
