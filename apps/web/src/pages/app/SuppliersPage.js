import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ActionButton, MetricBars, Panel, SectionHeading, StatusBadge, Table } from "@/components/dashboard/widgets";
import { api } from "@/lib/api";
export const SuppliersPage = () => {
    const queryClient = useQueryClient();
    const { data: suppliers } = useQuery({ queryKey: ["suppliers"], queryFn: api.suppliers });
    const [formState, setFormState] = useState({
        name: "",
        contactName: "",
        email: "",
        categories: ""
    });
    const createSupplier = useMutation({
        mutationFn: () => api.createSupplier({
            ...formState,
            categories: formState.categories.split(",").map((value) => value.trim()).filter(Boolean)
        }),
        onSuccess: () => {
            setFormState({ name: "", contactName: "", email: "", categories: "" });
            void queryClient.invalidateQueries({ queryKey: ["suppliers"] });
        }
    });
    const blacklistSupplier = useMutation({
        mutationFn: (supplierId) => api.blacklistSupplier(supplierId, "Suspended in demo due to compliance review."),
        onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["suppliers"] })
    });
    if (!suppliers) {
        return null;
    }
    return (_jsx("div", { className: "space-y-6", children: _jsxs(Panel, { children: [_jsx(SectionHeading, { eyebrow: "Supplier Lifecycle", title: "Onboarding, due diligence, and performance visibility", detail: "Track supplier banking, tax IDs, due-diligence artifacts, preference flags, and suspension decisions with a complete audit trail." }), _jsxs("div", { className: "grid gap-4 lg:grid-cols-[1.1fr_0.9fr]", children: [_jsx("div", { children: _jsx(Table, { headers: ["Supplier", "Categories", "Status", "Preferred", "Performance", "Action"], rows: suppliers.map((supplier) => {
                                    const latestPerformance = supplier.performance[0];
                                    const average = latestPerformance
                                        ? Math.round((latestPerformance.deliveryScore + latestPerformance.qualityScore + latestPerformance.complianceScore) / 3)
                                        : 0;
                                    return [
                                        _jsxs("div", { children: [_jsx("p", { className: "font-medium", children: supplier.name }), _jsx("p", { className: "text-xs text-slate-500", children: supplier.contactName })] }, supplier.id),
                                        supplier.categories.join(", "),
                                        _jsx(StatusBadge, { value: supplier.status }, `${supplier.id}-status`),
                                        supplier.preferred ? "Yes" : "No",
                                        `${average}%`,
                                        _jsx(ActionButton, { tone: "secondary", disabled: supplier.status === "blacklisted", onClick: () => blacklistSupplier.mutate(supplier.id), children: "Blacklist" }, `${supplier.id}-action`)
                                    ];
                                }) }) }), _jsxs("div", { className: "space-y-4", children: [_jsxs(Panel, { className: "border-slate-100 bg-slate-50/80", children: [_jsx("h3", { className: "font-['Sora'] text-lg font-semibold", children: "Create supplier profile" }), _jsxs("div", { className: "mt-4 grid gap-3", children: [_jsx("input", { value: formState.name, onChange: (event) => setFormState((current) => ({ ...current, name: event.target.value })), className: "rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm", placeholder: "Supplier name" }), _jsx("input", { value: formState.contactName, onChange: (event) => setFormState((current) => ({ ...current, contactName: event.target.value })), className: "rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm", placeholder: "Contact name" }), _jsx("input", { value: formState.email, onChange: (event) => setFormState((current) => ({ ...current, email: event.target.value })), className: "rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm", placeholder: "Email address" }), _jsx("input", { value: formState.categories, onChange: (event) => setFormState((current) => ({ ...current, categories: event.target.value })), className: "rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm", placeholder: "Categories, comma separated" }), _jsx(ActionButton, { onClick: () => createSupplier.mutate(), disabled: !formState.name || createSupplier.isPending, children: "Add supplier" })] })] }), _jsxs(Panel, { className: "border-slate-100 bg-slate-50/80", children: [_jsx("h3", { className: "mb-4 font-['Sora'] text-lg font-semibold", children: "Performance snapshot" }), _jsx(MetricBars, { items: suppliers.slice(0, 3).map((supplier) => ({
                                                label: supplier.name,
                                                value: Math.round(((supplier.performance[0]?.deliveryScore ?? 0) +
                                                    (supplier.performance[0]?.qualityScore ?? 0) +
                                                    (supplier.performance[0]?.complianceScore ?? 0)) / 3)
                                            })) })] })] })] })] }) }));
};
