import { Router } from "express";
import { getState } from "../../lib/state";

const buildCsv = (rows: Array<Record<string, string>>) => {
  if (rows.length === 0) {
    return "";
  }

  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => JSON.stringify(row[header] ?? "")).join(","))
  ];
  return lines.join("\n");
};

export const auditRouter = Router();

auditRouter.get("/events", (request, response) => {
  const state = getState();
  const entityId = typeof request.query.entityId === "string" ? request.query.entityId : undefined;
  const entityType = typeof request.query.entityType === "string" ? request.query.entityType : undefined;

  const events = state.auditEvents.filter((event) => {
    const matchesId = entityId ? event.entityId === entityId : true;
    const matchesType = entityType ? event.entityType === entityType : true;
    return matchesId && matchesType;
  });

  response.json(events);
});

auditRouter.get("/events/export", (_request, response) => {
  const rows = getState().auditEvents.map((event) => ({
    occurredAt: event.occurredAt,
    actorName: event.actorName,
    action: event.action,
    entityType: event.entityType,
    entityId: event.entityId,
    detail: event.detail
  }));

  response.setHeader("Content-Type", "text/csv");
  response.setHeader("Content-Disposition", "attachment; filename=\"audit-events.csv\"");
  response.send(buildCsv(rows));
});
