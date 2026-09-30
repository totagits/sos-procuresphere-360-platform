import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ActionButton, Panel, SectionHeading, StatusBadge, Table } from "@/components/dashboard/widgets";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
export const DocumentsPage = () => {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("invoice");
    const [uploadState, setUploadState] = useState({
        title: "",
        docType: "Supporting Document",
        relatedEntityType: "requisition",
        relatedEntityId: "pr-001",
        projectCode: "EDU-2026-BCV",
        ocrText: ""
    });
    const [file, setFile] = useState(null);
    const { data: documentsPayload } = useQuery({ queryKey: ["documents"], queryFn: api.documents });
    const { data: searchResults } = useQuery({
        queryKey: ["documents-search", search],
        queryFn: () => api.searchDocuments(search),
        enabled: search.trim().length > 0
    });
    const uploadMutation = useMutation({
        mutationFn: () => {
            const payload = new FormData();
            payload.append("title", uploadState.title);
            payload.append("docType", uploadState.docType);
            payload.append("relatedEntityType", uploadState.relatedEntityType);
            payload.append("relatedEntityId", uploadState.relatedEntityId);
            payload.append("projectCode", uploadState.projectCode);
            payload.append("ocrText", uploadState.ocrText);
            if (file) {
                payload.append("file", file);
            }
            return api.uploadDocument(payload);
        },
        onSuccess: () => {
            setUploadState({
                title: "",
                docType: "Supporting Document",
                relatedEntityType: "requisition",
                relatedEntityId: "pr-001",
                projectCode: "EDU-2026-BCV",
                ocrText: ""
            });
            setFile(null);
            void queryClient.invalidateQueries({ queryKey: ["documents"] });
            void queryClient.invalidateQueries({ queryKey: ["documents-search"] });
        }
    });
    const archiveMutation = useMutation({
        mutationFn: (documentId) => api.archiveDocument(documentId, "Archived from DMS control panel."),
        onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["documents"] })
    });
    const documents = documentsPayload?.documents ?? [];
    const retentionPolicies = documentsPayload?.retentionPolicies ?? [];
    const archiveLog = documentsPayload?.archiveLog ?? [];
    const handleSubmit = (event) => {
        event.preventDefault();
        uploadMutation.mutate();
    };
    return (_jsx("div", { className: "space-y-6", children: _jsxs(Panel, { children: [_jsx(SectionHeading, { eyebrow: "DMS", title: "Linked evidence repository with OCR and retention rules", detail: "Every procurement and finance record can carry its supporting evidence, searchable text, version history, and donor-ready retention controls." }), _jsxs("div", { className: "grid gap-6 xl:grid-cols-[1.15fr_0.85fr]", children: [_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "rounded-[24px] border border-slate-100 bg-slate-50/90 p-4", children: [_jsxs("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-['Sora'] text-lg font-semibold", children: "Search repository" }), _jsx("p", { className: "text-sm text-slate-600", children: "Search by metadata, OCR text, or procurement reference." })] }), _jsx("input", { value: search, onChange: (event) => setSearch(event.target.value), className: "rounded-full border border-slate-200 bg-white px-4 py-2 text-sm", placeholder: "Search documents" })] }), _jsx("div", { className: "mt-4 space-y-3", children: (searchResults?.results ?? documents).map((document) => (_jsx("div", { className: "rounded-[20px] bg-white p-4 ring-1 ring-slate-100", children: _jsxs("div", { className: "flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [_jsx("p", { className: "font-medium text-brand-ink", children: document.title }), _jsx(StatusBadge, { value: document.archived ? "archived" : document.docType })] }), _jsx("p", { className: "mt-2 text-sm text-slate-600", children: document.ocrText }), _jsxs("p", { className: "mt-3 text-xs uppercase tracking-[0.2em] text-slate-500", children: ["Linked to ", document.relatedEntities.map((entity) => `${entity.type}:${entity.id}`).join(", ") || "No references"] })] }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsx("a", { className: "inline-flex items-center justify-center rounded-full border border-sky-200 px-4 py-2 text-sm font-semibold text-sky-700", href: api.auditPackUrl(document.relatedEntities[0]?.id ?? "pr-001"), target: "_blank", rel: "noreferrer", children: "Audit Pack" }), !document.archived ? (_jsx(ActionButton, { tone: "secondary", onClick: () => archiveMutation.mutate(document.id), children: "Archive" })) : null] })] }) }, document.id))) })] }), _jsx(Table, { headers: ["Policy", "Retain", "Archive after", "Legal hold"], rows: retentionPolicies.map((policy) => [
                                        policy.category,
                                        `${policy.retainYears} years`,
                                        `${policy.archiveAfterDays} days`,
                                        policy.legalHoldAllowed ? "Allowed" : "Blocked"
                                    ]) })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs(Panel, { className: "border-slate-100 bg-slate-50/90", children: [_jsx("h3", { className: "font-['Sora'] text-lg font-semibold", children: "Upload and index" }), _jsxs("form", { className: "mt-4 grid gap-3", onSubmit: handleSubmit, children: [_jsx("input", { value: uploadState.title, onChange: (event) => setUploadState((current) => ({ ...current, title: event.target.value })), className: "rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm", placeholder: "Document title" }), _jsx("input", { value: uploadState.docType, onChange: (event) => setUploadState((current) => ({ ...current, docType: event.target.value })), className: "rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm", placeholder: "Document type" }), _jsx("input", { value: uploadState.relatedEntityType, onChange: (event) => setUploadState((current) => ({ ...current, relatedEntityType: event.target.value })), className: "rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm", placeholder: "Entity type" }), _jsx("input", { value: uploadState.relatedEntityId, onChange: (event) => setUploadState((current) => ({ ...current, relatedEntityId: event.target.value })), className: "rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm", placeholder: "Related reference" }), _jsx("textarea", { value: uploadState.ocrText, onChange: (event) => setUploadState((current) => ({ ...current, ocrText: event.target.value })), className: "min-h-[110px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm", placeholder: "OCR text or extracted summary" }), _jsx("input", { type: "file", onChange: (event) => setFile(event.target.files?.[0] ?? null), className: "rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm" }), _jsx(ActionButton, { type: "submit", disabled: !uploadState.title || uploadMutation.isPending, children: "Upload document" })] })] }), _jsxs(Panel, { className: "border-slate-100 bg-slate-50/90", children: [_jsx("h3", { className: "font-['Sora'] text-lg font-semibold", children: "Archive history" }), _jsx("div", { className: "mt-4 space-y-3", children: archiveLog.length === 0 ? (_jsx("p", { className: "text-sm text-slate-500", children: "No archive actions yet." })) : (archiveLog.map((entry) => (_jsxs("div", { className: "rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-100", children: [_jsxs("p", { className: "font-medium text-brand-ink", children: [entry.action.toUpperCase(), " \u2022 ", entry.documentId] }), _jsx("p", { className: "mt-1 text-sm text-slate-600", children: entry.reason }), _jsx("p", { className: "mt-2 text-xs uppercase tracking-[0.2em] text-slate-500", children: formatDateTime(entry.actedAt) })] }, entry.id)))) })] })] })] })] }) }));
};
