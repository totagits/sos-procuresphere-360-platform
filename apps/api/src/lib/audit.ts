import { randomUUID } from "node:crypto";
import type { AppState, AuditEvent } from "@sos-procuresphere/shared";

export const appendAuditEvent = (
  state: AppState,
  payload: Omit<AuditEvent, "id" | "occurredAt">
): void => {
  state.auditEvents.unshift({
    id: randomUUID(),
    occurredAt: new Date().toISOString(),
    ...payload
  });
};
