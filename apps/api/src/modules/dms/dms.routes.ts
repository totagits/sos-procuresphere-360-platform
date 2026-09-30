import { createHash, randomUUID } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { basename, resolve } from "node:path";
import { Router } from "express";
import multer from "multer";
import type { DocumentRecord } from "@sos-procuresphere/shared";
import { buildAuditPack } from "../../lib/audit-pack";
import { appendAuditEvent } from "../../lib/audit";
import { getActor } from "../../lib/http";
import { ensurePermission } from "../../lib/policy";
import { getState, setState } from "../../lib/state";

const uploadDirectory = resolve(process.cwd(), "storage", "uploads");
if (!existsSync(uploadDirectory)) {
  mkdirSync(uploadDirectory, { recursive: true });
}

const upload = multer({ dest: uploadDirectory });

export const dmsRouter = Router();

dmsRouter.get("/documents", (_request, response) => {
  const state = getState();
  response.json({
    documents: state.documents,
    retentionPolicies: state.retentionPolicies,
    archiveLog: state.archiveLog
  });
});

dmsRouter.get("/search", (request, response) => {
  const query = String(request.query.q ?? "").toLowerCase();
  const state = getState();

  const results = state.documents.filter((document) => {
    const metadata = document.metadata.map((entry) => `${entry.key}:${entry.value}`).join(" ").toLowerCase();
    return (
      document.title.toLowerCase().includes(query) ||
      document.docType.toLowerCase().includes(query) ||
      document.ocrText.toLowerCase().includes(query) ||
      metadata.includes(query) ||
      document.relatedEntities.some((entity) => entity.id.toLowerCase().includes(query))
    );
  });

  response.json({ query, count: results.length, results });
});

dmsRouter.post("/documents/upload", upload.single("file"), (request, response) => {
  const actor = getActor(request);
  ensurePermission(getState(), actor.id, "documents:upload");

  const fileName = request.file ? basename(request.file.path) : `manual-${Date.now()}.txt`;
  const originalName = request.file?.originalname ?? String(request.body?.title ?? "document.txt");
  const retentionPolicyId = String(request.body?.retentionPolicyId ?? "ret-1");
  const relatedEntityId = String(request.body?.relatedEntityId ?? "");
  const relatedEntityType = String(request.body?.relatedEntityType ?? "requisition") as DocumentRecord["relatedEntities"][number]["type"];
  const ocrText = String(
    request.body?.ocrText ??
      `${originalName} uploaded to SOS ProcureSphere 360 with metadata for ${relatedEntityType} ${relatedEntityId}.`
  );

  const document: DocumentRecord = {
    id: `doc-${Date.now()}`,
    title: String(request.body?.title ?? originalName),
    docType: String(request.body?.docType ?? "Supporting Document"),
    supplierId: request.body?.supplierId ? String(request.body?.supplierId) : undefined,
    metadata: [
      { key: "reference", value: relatedEntityId },
      { key: "project", value: String(request.body?.projectCode ?? "UNASSIGNED") },
      { key: "amount", value: String(request.body?.amount ?? "") }
    ].filter((entry) => entry.value),
    relatedEntities: relatedEntityId ? [{ type: relatedEntityType, id: relatedEntityId }] : [],
    uploadedBy: actor.id,
    uploadedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ocrText,
    currentVersionId: `docver-${Date.now()}`,
    versions: [
      {
        id: `docver-${Date.now()}`,
        label: "v1",
        fileName: originalName,
        uploadedBy: actor.id,
        uploadedAt: new Date().toISOString(),
        hash: createHash("sha256").update(`${originalName}-${ocrText}`).digest("hex")
      }
    ],
    permissions: [
      { roleId: "role-procurement", level: "edit" },
      { roleId: "role-finance", level: "view" },
      { roleId: "role-auditor", level: "download" }
    ],
    retentionPolicyId,
    archived: false,
    archiveDueAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString(),
    filePath: request.file?.path
  };

  const state = setState((draft) => {
    draft.documents.unshift(document);
    appendAuditEvent(draft, {
      actorId: actor.id,
      actorName: actor.name,
      action: "DOCUMENT_UPLOADED",
      entityType: "Document",
      entityId: document.id,
      detail: `${document.title} uploaded and indexed.`
    });
    return draft;
  });

  response.status(201).json(state.documents[0]);
});

dmsRouter.post("/documents/:id/archive", (request, response) => {
  const actor = getActor(request);
  ensurePermission(getState(), actor.id, "documents:upload");

  const documentId = request.params.id;
  const reason = String(request.body?.reason ?? "Retention policy archival");

  const state = setState((draft) => {
    const document = draft.documents.find((entry) => entry.id === documentId);
    if (!document) {
      throw new Error("Document not found.");
    }

    document.archived = true;
    draft.archiveLog.unshift({
      id: randomUUID(),
      documentId,
      action: "archived",
      actedBy: actor.id,
      actedAt: new Date().toISOString(),
      reason
    });

    appendAuditEvent(draft, {
      actorId: actor.id,
      actorName: actor.name,
      action: "DOCUMENT_ARCHIVED",
      entityType: "Document",
      entityId: document.id,
      detail: reason
    });

    return draft;
  });

  response.json({
    document: state.documents.find((entry) => entry.id === documentId),
    archiveLog: state.archiveLog[0]
  });
});

dmsRouter.get("/audit-pack/:referenceId", (request, response) => {
  const buffer = buildAuditPack(getState(), request.params.referenceId);
  response.setHeader("Content-Type", "application/zip");
  response.setHeader("Content-Disposition", `attachment; filename="${request.params.referenceId}-audit-pack.zip"`);
  response.send(buffer);
});
