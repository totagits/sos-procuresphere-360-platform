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
    mutationFn: (paymentId: string) => api.authorizePayment(paymentId, "Authorized from finance dashboard."),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["payments"] })
  });

  const reconcilePayment = useMutation({
    mutationFn: (paymentId: string) => api.reconcilePayment(paymentId, `BANK-STATEMENT-${Date.now()}`),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["payments"] })
  });

  const escalateNotification = useMutation({
    mutationFn: (notificationId: string) => api.escalateNotification(notificationId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["notifications"] })
  });

  const budgets = budgetsResult.data ?? [];
  const payments = paymentsResult.data ?? [];
  const notifications = notificationsResult.data ?? [];

  return (
    <div className="space-y-6">
      <Panel>
        <SectionHeading
          eyebrow="Budget Control"
          title="Commitments, actuals, and hard-stop governance"
          detail="Finance teams can enforce donor budgets at PR or PO stage, then actualize cash impact at invoice and payment stage."
        />
        <Table
          headers={["Project", "Budget Line", "Mode", "Planned", "Committed", "Actual", "Available"]}
          rows={budgets.map((budget) => [
            budget.projectCode,
            budget.budgetLine,
            <StatusBadge key={`${budget.id}-mode`} value={budget.mode} />,
            formatCurrency(budget.planned),
            formatCurrency(budget.committed),
            formatCurrency(budget.actual),
            formatCurrency(budget.available)
          ])}
        />
      </Panel>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel>
          <SectionHeading
            eyebrow="Payment Control"
            title="Authorization, bank adapter status, and reconciliation hooks"
            detail="The mock adapter demonstrates payload handoff, reference capture, and reconciliation status tracking for future bank APIs."
          />
          <Table
            headers={["Payment", "Invoice", "Amount", "Status", "Bank Ref", "Action"]}
            rows={payments.map((payment) => [
              payment.id.toUpperCase(),
              payment.invoiceId.toUpperCase(),
              formatCurrency(payment.amount, payment.currency),
              <StatusBadge key={`${payment.id}-status`} value={payment.status} />,
              payment.bankTransferRef?.bankReference ?? "Pending",
              <div key={`${payment.id}-actions`} className="flex flex-wrap gap-2">
                {payment.status === "pending" || payment.status === "authorized" ? (
                  <ActionButton tone="secondary" onClick={() => authorizePayment.mutate(payment.id)}>
                    Authorize
                  </ActionButton>
                ) : null}
                {payment.status === "initiated" ? (
                  <ActionButton onClick={() => reconcilePayment.mutate(payment.id)}>
                    Reconcile
                  </ActionButton>
                ) : null}
              </div>
            ])}
          />
        </Panel>

        <Panel>
          <SectionHeading
            eyebrow="Exception Desk"
            title="Approval reminders and escalations"
            detail="SLA timers and exception prompts can be escalated for finance and leadership review."
          />
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div key={notification.id} className="rounded-[24px] border border-slate-100 bg-slate-50/90 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="font-medium text-brand-ink">{notification.title}</p>
                      <StatusBadge value={notification.severity} />
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{notification.body}</p>
                    <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-500">Due {formatDateTime(notification.dueAt)}</p>
                  </div>
                  <ActionButton tone="secondary" disabled={notification.escalated} onClick={() => escalateNotification.mutate(notification.id)}>
                    {notification.escalated ? "Escalated" : "Escalate"}
                  </ActionButton>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </section>
    </div>
  );
};
