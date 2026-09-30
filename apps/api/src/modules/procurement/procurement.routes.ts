import { randomUUID } from "node:crypto";
import { Router } from "express";
import type { ApprovalDecision, ApprovalStep, GoodsReceipt, Invoice, MatchException, PurchaseOrder, Requisition } from "@sos-procuresphere/shared";
import { appendAuditEvent } from "../../lib/audit";
import { getActor } from "../../lib/http";
import { canApprove, canReceive, computeBudgetCheck, ensurePermission, nextPendingApproval } from "../../lib/policy";
import { getState, setState } from "../../lib/state";

const buildDefaultApprovals = (amount: number): ApprovalStep[] => {
  const approvals: ApprovalStep[] = [
    {
      id: randomUUID(),
      approverId: "user-approver",
      approverName: "Cynthia Boakai",
      roleLabel: "National Director",
      thresholdRule: amount > 10000 ? "Threshold approval above USD 10,000" : "Standard approval",
      status: "pending"
    }
  ];

  if (amount > 5000) {
    approvals.push({
      id: randomUUID(),
      approverId: "user-finance",
      approverName: "Emmanuel S. Nyenkan",
      roleLabel: "Finance Controller",
      thresholdRule: "Budget validation",
      status: "pending"
    });
  }

  return approvals;
};

const sumInvoiceLines = (invoice: Invoice): number =>
  invoice.lines.reduce((total, line) => total + line.quantity * line.unitPrice, 0);

export const procurementRouter = Router();

procurementRouter.get("/requisitions", (_request, response) => {
  response.json(getState().requisitions);
});

procurementRouter.post("/requisitions", (request, response) => {
  const actor = getActor(request);
  const state = getState();
  ensurePermission(state, actor.id, "pr:create");

  const amount = Number(request.body?.amount ?? 0);
  const projectCode = String(request.body?.projectCode ?? "");
  const budgetLine = String(request.body?.budgetLine ?? "");
  const budgetCheck = computeBudgetCheck(state, projectCode, budgetLine, amount);

  if (budgetCheck.status === "blocked") {
    response.status(400).json({ message: budgetCheck.message, budgetCheck });
    return;
  }

  const requisition: Requisition = {
    id: `pr-${String(state.requisitions.length + 1).padStart(3, "0")}`,
    title: String(request.body?.title ?? "New requisition"),
    justification: String(request.body?.justification ?? ""),
    requesterId: actor.id,
    requesterName: actor.name,
    departmentId: actor.departmentId,
    locationId: actor.locationId,
    donorCode: String(request.body?.donorCode ?? "UNASSIGNED"),
    projectCode,
    budgetLine,
    amount,
    currency: "USD",
    policyRule: amount > 10000 ? "3 quotes mandatory" : "1 quote with approval",
    status: "pending_approval",
    lineItems: Array.isArray(request.body?.lineItems) ? request.body.lineItems : [],
    attachments: Array.isArray(request.body?.attachments) ? request.body.attachments : [],
    approvals: buildDefaultApprovals(amount),
    budgetCheck,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const nextState = setState((draft) => {
    draft.requisitions.unshift(requisition);
    appendAuditEvent(draft, {
      actorId: actor.id,
      actorName: actor.name,
      action: "PR_CREATED",
      entityType: "Requisition",
      entityId: requisition.id,
      detail: `Created ${requisition.title}.`
    });
    return draft;
  });

  response.status(201).json(nextState.requisitions[0]);
});

procurementRouter.post("/requisitions/:id/approve", (request, response) => {
  const actor = getActor(request);
  const decision = String(request.body?.decision ?? "approved") as ApprovalDecision;
  const note = String(request.body?.note ?? "");
  ensurePermission(getState(), actor.id, "pr:approve");

  const requisitionId = request.params.id;

  const state = setState((draft) => {
    const requisition = draft.requisitions.find((entry) => entry.id === requisitionId);
    if (!requisition) {
      throw new Error("Requisition not found.");
    }

    if (!canApprove(actor.id, requisition.requesterId)) {
      throw new Error("Segregation of duties prevented self-approval.");
    }

    const approval = requisition.approvals.find(
      (entry) => entry.approverId === actor.id && entry.status === "pending"
    ) ?? nextPendingApproval(requisition.approvals);

    if (!approval) {
      throw new Error("No pending approval available.");
    }

    approval.status = decision;
    approval.actedAt = new Date().toISOString();
    approval.note = note;
    requisition.updatedAt = new Date().toISOString();

    if (decision === "rejected") {
      requisition.status = "exception";
    } else if (requisition.approvals.every((entry) => entry.status === "approved")) {
      requisition.status = "approved";
    }

    appendAuditEvent(draft, {
      actorId: actor.id,
      actorName: actor.name,
      action: "PR_APPROVAL_RECORDED",
      entityType: "Requisition",
      entityId: requisition.id,
      detail: `${decision.toUpperCase()} by ${actor.name}. ${note}`.trim()
    });

    return draft;
  });

  response.json(state.requisitions.find((entry) => entry.id === requisitionId));
});

procurementRouter.get("/rfx", (_request, response) => {
  response.json(getState().rfxs);
});

procurementRouter.post("/rfx/:id/award", (request, response) => {
  const actor = getActor(request);
  ensurePermission(getState(), actor.id, "rfx:manage");

  const rfxId = request.params.id;
  const bidId = String(request.body?.bidId ?? "");
  const recommendation = String(request.body?.recommendation ?? "Awarded after committee review.");

  const state = setState((draft) => {
    const rfx = draft.rfxs.find((entry) => entry.id === rfxId);
    if (!rfx) {
      throw new Error("RFx not found.");
    }

    const bid = rfx.bids.find((entry) => entry.id === bidId);
    if (!bid) {
      throw new Error("Bid not found.");
    }

    rfx.status = "awarded";
    rfx.award = {
      id: `award-${Date.now()}`,
      rfxId,
      bidId,
      supplierId: bid.supplierId,
      supplierName: bid.supplierName,
      recommendation,
      approvedBy: actor.id,
      approvedAt: new Date().toISOString()
    };

    appendAuditEvent(draft, {
      actorId: actor.id,
      actorName: actor.name,
      action: "RFX_AWARDED",
      entityType: "RFx",
      entityId: rfx.id,
      detail: `Awarded to ${bid.supplierName}.`
    });

    return draft;
  });

  response.json(state.rfxs.find((entry) => entry.id === rfxId));
});

procurementRouter.get("/purchase-orders", (_request, response) => {
  response.json(getState().purchaseOrders);
});

procurementRouter.post("/purchase-orders/from-requisition/:id", (request, response) => {
  const actor = getActor(request);
  ensurePermission(getState(), actor.id, "po:manage");

  const requisitionId = request.params.id;
  const supplierId = String(request.body?.supplierId ?? "");

  const state = setState((draft) => {
    const requisition = draft.requisitions.find((entry) => entry.id === requisitionId);
    const supplier = draft.suppliers.find((entry) => entry.id === supplierId);

    if (!requisition || !supplier) {
      throw new Error("Requisition or supplier not found.");
    }

    if (requisition.status !== "approved") {
      throw new Error("Only approved requisitions can generate a PO.");
    }

    const purchaseOrder: PurchaseOrder = {
      id: `po-${String(draft.purchaseOrders.length + 1).padStart(3, "0")}`,
      sourceRequisitionId: requisition.id,
      supplierId: supplier.id,
      supplierName: supplier.name,
      amount: requisition.amount,
      currency: requisition.currency,
      projectCode: requisition.projectCode,
      budgetLine: requisition.budgetLine,
      status: "issued",
      approvals: [],
      amendments: [],
      lines: requisition.lineItems,
      issuedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    draft.purchaseOrders.unshift(purchaseOrder);
    appendAuditEvent(draft, {
      actorId: actor.id,
      actorName: actor.name,
      action: "PO_CREATED",
      entityType: "PurchaseOrder",
      entityId: purchaseOrder.id,
      detail: `Generated from ${requisition.id} for ${supplier.name}.`
    });

    return draft;
  });

  response.status(201).json(state.purchaseOrders[0]);
});

procurementRouter.post("/purchase-orders/from-award/:id", (request, response) => {
  const actor = getActor(request);
  ensurePermission(getState(), actor.id, "po:manage");

  const awardId = request.params.id;

  const state = setState((draft) => {
    const rfx = draft.rfxs.find((entry) => entry.award?.id === awardId);
    if (!rfx?.award) {
      throw new Error("Award not found.");
    }

    const bid = rfx.bids.find((entry) => entry.id === rfx.award?.bidId);
    if (!bid) {
      throw new Error("Linked bid not found.");
    }

    const purchaseOrder: PurchaseOrder = {
      id: `po-${String(draft.purchaseOrders.length + 1).padStart(3, "0")}`,
      sourceAwardId: awardId,
      supplierId: bid.supplierId,
      supplierName: bid.supplierName,
      amount: bid.totalAmount,
      currency: bid.currency,
      projectCode: "HLT-2026-MRO",
      budgetLine: "7200-ColdChain",
      status: "issued",
      approvals: [],
      amendments: [],
      lines: rfx.items.map((item) => ({
        ...item,
        unitPrice: bid.lineComparisons.find((line) => line.itemId === item.id)?.unitPrice ?? 0
      })),
      issuedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    draft.purchaseOrders.unshift(purchaseOrder);
    appendAuditEvent(draft, {
      actorId: actor.id,
      actorName: actor.name,
      action: "PO_CREATED",
      entityType: "PurchaseOrder",
      entityId: purchaseOrder.id,
      detail: `Generated from award ${awardId}.`
    });

    return draft;
  });

  response.status(201).json(state.purchaseOrders[0]);
});

procurementRouter.get("/receipts", (_request, response) => {
  response.json(getState().receipts);
});

procurementRouter.post("/purchase-orders/:id/receive", (request, response) => {
  const actor = getActor(request);
  ensurePermission(getState(), actor.id, "receipt:create");
  const poId = request.params.id;

  const state = setState((draft) => {
    const purchaseOrder = draft.purchaseOrders.find((entry) => entry.id === poId);
    if (!purchaseOrder) {
      throw new Error("Purchase order not found.");
    }

    if (!canReceive(actor.id, purchaseOrder, draft.receipts)) {
      throw new Error("Segregation of duties prevented this receiving action.");
    }

    const lines = Array.isArray(request.body?.lines) ? request.body.lines : [];
    const receipt: GoodsReceipt = {
      id: `grn-${String(draft.receipts.length + 1).padStart(3, "0")}`,
      poId,
      receiverId: actor.id,
      receiverName: actor.name,
      type: request.body?.type === "service" ? "service" : "goods",
      receivedAt: new Date().toISOString(),
      status: lines.some((line: { receivedQuantity: number; acceptedQuantity: number }) => line.receivedQuantity < line.acceptedQuantity)
        ? "partial"
        : "complete",
      lines,
      note: String(request.body?.note ?? "")
    };

    draft.receipts.unshift(receipt);
    purchaseOrder.status = receipt.status === "complete" ? "closed" : "partially_received";

    appendAuditEvent(draft, {
      actorId: actor.id,
      actorName: actor.name,
      action: "GRN_CREATED",
      entityType: "GoodsReceipt",
      entityId: receipt.id,
      detail: `Receiving captured against ${poId}.`
    });

    return draft;
  });

  response.status(201).json(state.receipts[0]);
});

procurementRouter.get("/invoices", (_request, response) => {
  response.json(getState().invoices);
});

procurementRouter.post("/invoices", (request, response) => {
  const actor = getActor(request);
  const state = getState();
  const userPermissions = state.roles.filter((role) => actor.roleIds.includes(role.id)).flatMap((role) => role.permissionCodes);

  if (!userPermissions.includes("invoice:submit") && !userPermissions.includes("documents:upload")) {
    response.status(403).json({ message: "Invoice submission permission missing." });
    return;
  }

  const invoice: Invoice = {
    id: `inv-${String(state.invoices.length + 1).padStart(3, "0")}`,
    poId: String(request.body?.poId ?? ""),
    supplierId: String(request.body?.supplierId ?? ""),
    supplierName: String(request.body?.supplierName ?? "Supplier"),
    invoiceNumber: String(request.body?.invoiceNumber ?? `INV-${Date.now()}`),
    amount: Number(request.body?.amount ?? 0),
    currency: "USD",
    submittedAt: new Date().toISOString(),
    submittedBy: userPermissions.includes("invoice:submit") ? "supplier_portal" : "internal",
    status: "received",
    lines: Array.isArray(request.body?.lines) ? request.body.lines : []
  };

  const nextState = setState((draft) => {
    draft.invoices.unshift(invoice);
    appendAuditEvent(draft, {
      actorId: actor.id,
      actorName: actor.name,
      action: "INVOICE_SUBMITTED",
      entityType: "Invoice",
      entityId: invoice.id,
      detail: `Submitted ${invoice.invoiceNumber} for ${invoice.poId}.`
    });
    return draft;
  });

  response.status(201).json(nextState.invoices[0]);
});

procurementRouter.post("/invoices/:id/match", (request, response) => {
  const actor = getActor(request);
  ensurePermission(getState(), actor.id, "invoice:match");
  const invoiceId = request.params.id;
  const matchType = request.body?.matchType === "2-way" ? "2-way" : "3-way";

  const state = setState((draft) => {
    const invoice = draft.invoices.find((entry) => entry.id === invoiceId);
    if (!invoice) {
      throw new Error("Invoice not found.");
    }

    const purchaseOrder = draft.purchaseOrders.find((entry) => entry.id === invoice.poId);
    if (!purchaseOrder) {
      throw new Error("Linked purchase order not found.");
    }

    const receipt = draft.receipts.find((entry) => entry.poId === purchaseOrder.id);
    const exceptions: MatchException[] = [];

    if (sumInvoiceLines(invoice) > purchaseOrder.amount) {
      exceptions.push({
        id: randomUUID(),
        type: "price_variance",
        severity: "high",
        resolved: false
      });
    }

    if (matchType === "3-way" && !receipt) {
      exceptions.push({
        id: randomUUID(),
        type: "missing_grn",
        severity: "high",
        resolved: false
      });
    }

    if (matchType === "3-way" && receipt) {
      const receivedQuantities = new Map(receipt.lines.map((line) => [line.lineItemId, line.acceptedQuantity]));
      for (const line of invoice.lines) {
        const acceptedQuantity = receivedQuantities.get(line.id) ?? receivedQuantities.get(line.description) ?? 0;
        if (line.quantity > acceptedQuantity) {
          exceptions.push({
            id: randomUUID(),
            type: "quantity_variance",
            severity: "medium",
            resolved: false
          });
          break;
        }
      }
    }

    invoice.matchResult = {
      id: randomUUID(),
      invoiceId: invoice.id,
      matchType,
      status: exceptions.length === 0 ? "matched" : "exception",
      exceptions,
      checkedAt: new Date().toISOString()
    };
    invoice.status = exceptions.length === 0 ? "approved" : "exception";

    appendAuditEvent(draft, {
      actorId: actor.id,
      actorName: actor.name,
      action: "INVOICE_MATCH_COMPLETED",
      entityType: "Invoice",
      entityId: invoice.id,
      detail: exceptions.length === 0 ? "Matching completed with no exceptions." : "Matching completed with exceptions."
    });

    return draft;
  });

  response.json(state.invoices.find((entry) => entry.id === invoiceId));
});
