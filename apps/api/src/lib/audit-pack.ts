import AdmZip from "adm-zip";
import type { AppState } from "@sos-procuresphere/shared";

export const buildAuditPack = (state: AppState, referenceId: string) => {
  const requisition = state.requisitions.find((entry) => entry.id === referenceId);
  const po = state.purchaseOrders.find((entry) => entry.id === referenceId || entry.sourceRequisitionId === referenceId);
  const invoice = state.invoices.find((entry) => entry.id === referenceId || entry.poId === po?.id);
  const payment = state.paymentRequests.find((entry) => entry.invoiceId === invoice?.id);
  const rfx = state.rfxs.find((entry) => entry.id === referenceId || entry.award?.id === po?.sourceAwardId);

  const relatedIds = new Set<string>([
    referenceId,
    requisition?.id,
    po?.id,
    invoice?.id,
    payment?.id,
    rfx?.id
  ].filter(Boolean) as string[]);

  const documents = state.documents.filter((document) => document.relatedEntities.some((entity) => relatedIds.has(entity.id)));
  const auditEvents = state.auditEvents.filter((event) => relatedIds.has(event.entityId));

  const zip = new AdmZip();
  zip.addFile(
    "README.txt",
    Buffer.from(
      [
        "SOS ProcureSphere 360 Audit Pack",
        `Reference: ${referenceId}`,
        "",
        "Contents:",
        "- case-summary.json",
        "- documents.json",
        "- audit-events.json",
        "",
        "This bundle is structured for donor and internal audit review."
      ].join("\n"),
      "utf8"
    )
  );
  zip.addFile(
    "case-summary.json",
    Buffer.from(JSON.stringify({ requisition, rfx, po, invoice, payment }, null, 2), "utf8")
  );
  zip.addFile("documents.json", Buffer.from(JSON.stringify(documents, null, 2), "utf8"));
  zip.addFile("audit-events.json", Buffer.from(JSON.stringify(auditEvents, null, 2), "utf8"));

  return zip.toBuffer();
};
