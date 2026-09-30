import { Router } from "express";
import { getState } from "../../lib/state";

export const overviewRouter = Router();

overviewRouter.get("/dashboard", (_request, response) => {
  const state = getState();

  const pendingApprovals = state.requisitions
    .flatMap((requisition) =>
      requisition.approvals
        .filter((approval) => approval.status === "pending")
        .map((approval) => ({
          type: "Requisition Approval",
          reference: requisition.id,
          title: requisition.title,
          approverName: approval.approverName,
          thresholdRule: approval.thresholdRule
        }))
    )
    .concat(
      state.paymentRequests.flatMap((payment) =>
        payment.approvals
          .filter((approval) => approval.status === "pending")
          .map((approval) => ({
            type: "Payment Approval",
            reference: payment.id,
            title: `Payment for ${payment.invoiceId}`,
            approverName: approval.approverName,
            thresholdRule: "Dual control"
          }))
      )
    );

  const workflowCoverage = [
    { label: "PR -> Approvals -> PO", status: "ready", reference: "PR-001 / PO-001" },
    { label: "RFQ -> Evaluation -> Award -> PO", status: "ready", reference: "RFX-001 / PO-002" },
    { label: "PO -> GRN -> Invoice -> 3-way match -> Payment", status: "ready", reference: "PO-001 / INV-001 / PAY-001" },
    { label: "DMS OCR, search, and audit pack", status: "ready", reference: "DOC-1 / DOC-2 / DOC-3" }
  ];

  response.json({
    generatedAt: state.generatedAt,
    counts: {
      suppliers: state.suppliers.length,
      requisitions: state.requisitions.length,
      rfxs: state.rfxs.length,
      purchaseOrders: state.purchaseOrders.length,
      receipts: state.receipts.length,
      invoices: state.invoices.length,
      documents: state.documents.length,
      auditEvents: state.auditEvents.length,
      notifications: state.notifications.length
    },
    metrics: state.metrics,
    pendingApprovals,
    notifications: state.notifications,
    workflowCoverage
  });
});
