import { randomUUID } from "node:crypto";
import { Router } from "express";
import { appendAuditEvent } from "../../lib/audit";
import { getActor } from "../../lib/http";
import { ensurePermission } from "../../lib/policy";
import { getState, setState } from "../../lib/state";

export const suppliersRouter = Router();

suppliersRouter.get("/", (_request, response) => {
  response.json(getState().suppliers);
});

suppliersRouter.post("/", (request, response) => {
  const actor = getActor(request);
  ensurePermission(getState(), actor.id, "supplier:manage");

  const supplier = {
    id: randomUUID(),
    name: String(request.body?.name ?? "New Supplier"),
    contactName: String(request.body?.contactName ?? "Primary Contact"),
    email: String(request.body?.email ?? "contact@example.org"),
    phone: String(request.body?.phone ?? ""),
    bankingDetails: String(request.body?.bankingDetails ?? ""),
    taxId: String(request.body?.taxId ?? ""),
    categories: Array.isArray(request.body?.categories) ? request.body.categories : [],
    preferred: Boolean(request.body?.preferred),
    status: "active" as const,
    dueDiligenceChecklist: Array.isArray(request.body?.dueDiligenceChecklist)
      ? request.body.dueDiligenceChecklist
      : ["Business registration", "Tax clearance", "Bank letter"],
    documents: [],
    performance: []
  };

  const state = setState((draft) => {
    draft.suppliers.unshift(supplier);
    appendAuditEvent(draft, {
      actorId: actor.id,
      actorName: actor.name,
      action: "SUPPLIER_ONBOARDED",
      entityType: "Supplier",
      entityId: supplier.id,
      detail: `Created supplier profile for ${supplier.name}.`
    });
    return draft;
  });

  response.status(201).json(state.suppliers[0]);
});

suppliersRouter.post("/:id/blacklist", (request, response) => {
  const actor = getActor(request);
  ensurePermission(getState(), actor.id, "supplier:manage");

  const supplierId = request.params.id;
  const reason = String(request.body?.reason ?? "Compliance concern");

  const state = setState((draft) => {
    const supplier = draft.suppliers.find((entry) => entry.id === supplierId);
    if (!supplier) {
      throw new Error("Supplier not found.");
    }

    supplier.status = "blacklisted";
    supplier.blacklist = {
      id: randomUUID(),
      supplierId,
      reason,
      fromDate: new Date().toISOString(),
      approvedBy: actor.id
    };

    appendAuditEvent(draft, {
      actorId: actor.id,
      actorName: actor.name,
      action: "SUPPLIER_BLACKLISTED",
      entityType: "Supplier",
      entityId: supplierId,
      detail: reason
    });

    return draft;
  });

  response.json(state.suppliers.find((entry) => entry.id === supplierId));
});
