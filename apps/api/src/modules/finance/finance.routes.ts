import { randomUUID } from "node:crypto";
import { Router } from "express";
import type { PaymentRequest } from "@sos-procuresphere/shared";
import { appendAuditEvent } from "../../lib/audit";
import { bankAdapter } from "../../lib/bank-adapter";
import { getActor } from "../../lib/http";
import { ensurePermission } from "../../lib/policy";
import { getState, setState } from "../../lib/state";

export const financeRouter = Router();

financeRouter.get("/budgets", (_request, response) => {
  response.json(
    getState().budgetLedgers.map((ledger) => ({
      ...ledger,
      available: ledger.planned - ledger.committed - ledger.actual
    }))
  );
});

financeRouter.get("/payments", (_request, response) => {
  response.json(getState().paymentRequests);
});

financeRouter.post("/payments/from-invoice/:id", (request, response) => {
  const actor = getActor(request);
  ensurePermission(getState(), actor.id, "payment:authorize");
  const invoiceId = request.params.id;

  const state = setState((draft) => {
    const invoice = draft.invoices.find((entry) => entry.id === invoiceId);
    if (!invoice) {
      throw new Error("Invoice not found.");
    }

    if (invoice.status !== "approved") {
      throw new Error("Only approved invoices can move to payment.");
    }

    const paymentRequest: PaymentRequest = {
      id: `pay-${String(draft.paymentRequests.length + 1).padStart(3, "0")}`,
      invoiceId,
      amount: invoice.amount,
      currency: invoice.currency,
      status: "pending",
      approvals: [
        {
          id: randomUUID(),
          approverId: "user-finance",
          approverName: "Emmanuel S. Nyenkan",
          status: "pending"
        },
        {
          id: randomUUID(),
          approverId: "user-approver",
          approverName: "Cynthia Boakai",
          status: "pending"
        }
      ]
    };

    draft.paymentRequests.unshift(paymentRequest);
    appendAuditEvent(draft, {
      actorId: actor.id,
      actorName: actor.name,
      action: "PAYMENT_REQUEST_CREATED",
      entityType: "PaymentRequest",
      entityId: paymentRequest.id,
      detail: `Created payment request from ${invoice.invoiceNumber}.`
    });

    return draft;
  });

  response.status(201).json(state.paymentRequests[0]);
});

financeRouter.post("/payments/:id/authorize", (request, response) => {
  const actor = getActor(request);
  ensurePermission(getState(), actor.id, "payment:authorize");
  const paymentId = request.params.id;
  const note = String(request.body?.note ?? "");

  const state = setState((draft) => {
    const payment = draft.paymentRequests.find((entry) => entry.id === paymentId);
    if (!payment) {
      throw new Error("Payment request not found.");
    }

    const approval = payment.approvals.find((entry) => entry.approverId === actor.id);
    if (!approval) {
      throw new Error("No approval lane assigned to current actor.");
    }

    approval.status = "approved";
    approval.actedAt = new Date().toISOString();
    approval.note = note;

    if (payment.approvals.every((entry) => entry.status === "approved")) {
      const bankResult = bankAdapter.initiatePayment(payment);
      payment.bankTransferRef = {
        id: randomUUID(),
        paymentRequestId: payment.id,
        adapter: bankResult.adapter,
        bankReference: bankResult.bankReference,
        status: bankResult.status,
        updatedAt: new Date().toISOString()
      };
      payment.status = bankResult.status === "initiated" ? "initiated" : "authorized";
    } else {
      payment.status = "authorized";
    }

    appendAuditEvent(draft, {
      actorId: actor.id,
      actorName: actor.name,
      action: "PAYMENT_AUTHORIZED",
      entityType: "PaymentRequest",
      entityId: payment.id,
      detail: note || `${actor.name} approved payment.`
    });

    return draft;
  });

  response.json(state.paymentRequests.find((entry) => entry.id === paymentId));
});

financeRouter.post("/payments/:id/reconcile", (request, response) => {
  const actor = getActor(request);
  ensurePermission(getState(), actor.id, "payment:authorize");
  const paymentId = request.params.id;
  const statementRef = String(request.body?.statementRef ?? "MANUAL-STATEMENT-REF");

  const state = setState((draft) => {
    const payment = draft.paymentRequests.find((entry) => entry.id === paymentId);
    if (!payment) {
      throw new Error("Payment request not found.");
    }

    payment.reconciliation = {
      id: randomUUID(),
      paymentRequestId: payment.id,
      matched: true,
      bankStatementRef: statementRef,
      reconciledAt: new Date().toISOString()
    };
    payment.status = "reconciled";

    appendAuditEvent(draft, {
      actorId: actor.id,
      actorName: actor.name,
      action: "PAYMENT_RECONCILED",
      entityType: "PaymentRequest",
      entityId: payment.id,
      detail: `Reconciled against statement ${statementRef}.`
    });

    return draft;
  });

  response.json(state.paymentRequests.find((entry) => entry.id === paymentId));
});

financeRouter.get("/notifications", (_request, response) => {
  response.json(getState().notifications);
});

financeRouter.post("/notifications/:id/escalate", (request, response) => {
  const actor = getActor(request);
  ensurePermission(getState(), actor.id, "payment:authorize");
  const notificationId = request.params.id;

  const state = setState((draft) => {
    const notification = draft.notifications.find((entry) => entry.id === notificationId);
    if (!notification) {
      throw new Error("Notification not found.");
    }

    notification.escalated = true;
    appendAuditEvent(draft, {
      actorId: actor.id,
      actorName: actor.name,
      action: "NOTIFICATION_ESCALATED",
      entityType: "Notification",
      entityId: notification.id,
      detail: notification.title
    });

    return draft;
  });

  response.json(state.notifications.find((entry) => entry.id === notificationId));
});
