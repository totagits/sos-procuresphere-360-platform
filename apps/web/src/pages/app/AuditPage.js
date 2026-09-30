import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { Panel, SectionHeading, StatusBadge, Table } from "@/components/dashboard/widgets";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
export const AuditPage = () => {
    const { data: events } = useQuery({ queryKey: ["audit-events"], queryFn: api.auditEvents });
    return (_jsx("div", { className: "space-y-6", children: _jsxs(Panel, { children: [_jsx(SectionHeading, { eyebrow: "Audit Trail", title: "Immutable activity logs and export controls", detail: "Every create, update, approval, export, and workflow event is preserved for compliance review." }), _jsx("div", { className: "mb-5 flex justify-end", children: _jsx("a", { href: api.auditExportUrl(), target: "_blank", rel: "noreferrer", className: "inline-flex items-center justify-center rounded-full bg-brand-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700", children: "Export audit CSV" }) }), _jsx(Table, { headers: ["When", "Actor", "Action", "Entity", "Reference", "Detail"], rows: (events ?? []).map((event) => [
                        formatDateTime(event.occurredAt),
                        event.actorName,
                        _jsx(StatusBadge, { value: event.action }, event.id),
                        event.entityType,
                        event.entityId,
                        event.detail
                    ]) })] }) }));
};
