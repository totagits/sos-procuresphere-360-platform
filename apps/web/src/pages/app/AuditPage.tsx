import { useQuery } from "@tanstack/react-query";
import { Panel, SectionHeading, StatusBadge, Table } from "@/components/dashboard/widgets";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/format";

export const AuditPage = () => {
  const { data: events } = useQuery({ queryKey: ["audit-events"], queryFn: api.auditEvents });

  return (
    <div className="space-y-6">
      <Panel>
        <SectionHeading
          eyebrow="Audit Trail"
          title="Immutable activity logs and export controls"
          detail="Every create, update, approval, export, and workflow event is preserved for compliance review."
        />
        <div className="mb-5 flex justify-end">
          <a
            href={api.auditExportUrl()}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-brand-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
          >
            Export audit CSV
          </a>
        </div>
        <Table
          headers={["When", "Actor", "Action", "Entity", "Reference", "Detail"]}
          rows={(events ?? []).map((event) => [
            formatDateTime(event.occurredAt),
            event.actorName,
            <StatusBadge key={event.id} value={event.action} />,
            event.entityType,
            event.entityId,
            event.detail
          ])}
        />
      </Panel>
    </div>
  );
};
