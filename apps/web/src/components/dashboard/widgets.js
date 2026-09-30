import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { formatCurrency, titleCase } from "@/lib/format";
export const Panel = ({ children, className = "" }) => (_jsx("section", { className: `rounded-[28px] border border-white/10 bg-white/80 p-5 shadow-[0_24px_60px_rgba(8,22,38,0.08)] backdrop-blur ${className}`, children: children }));
export const SectionHeading = ({ eyebrow, title, detail }) => (_jsxs("div", { className: "mb-5 flex flex-col gap-2", children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.3em] text-sky-700", children: eyebrow }), _jsx("div", { className: "flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between", children: _jsxs("div", { children: [_jsx("h2", { className: "font-['Sora'] text-2xl font-semibold text-brand-ink", children: title }), _jsx("p", { className: "max-w-3xl text-sm text-slate-600", children: detail })] }) })] }));
export const StatCard = ({ label, value, hint }) => (_jsxs("div", { className: "rounded-[26px] border border-sky-100 bg-sky-50/80 p-4", children: [_jsx("p", { className: "text-sm text-slate-500", children: label }), _jsx("p", { className: "mt-3 font-['Sora'] text-3xl font-semibold text-brand-ink", children: value }), _jsx("p", { className: "mt-2 text-sm text-slate-600", children: hint })] }));
export const StatusBadge = ({ value }) => {
    const normalized = value.toLowerCase();
    const styles = normalized.includes("approved") || normalized.includes("ready") || normalized.includes("matched") || normalized.includes("reconciled")
        ? "bg-emerald-100 text-emerald-700"
        : normalized.includes("pending") || normalized.includes("warning") || normalized.includes("partial")
            ? "bg-amber-100 text-amber-700"
            : normalized.includes("exception") || normalized.includes("rejected") || normalized.includes("blacklisted")
                ? "bg-rose-100 text-rose-700"
                : "bg-slate-100 text-slate-700";
    return (_jsx("span", { className: `inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles}`, children: titleCase(value) }));
};
export const MetricBars = ({ items, money = false }) => {
    const max = Math.max(...items.map((item) => item.value), 1);
    return (_jsx("div", { className: "space-y-4", children: items.map((item) => (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between gap-4 text-sm", children: [_jsx("span", { className: "font-medium text-slate-700", children: item.label }), _jsx("span", { className: "text-slate-500", children: money ? formatCurrency(item.value) : item.value })] }), _jsx("div", { className: "h-2 overflow-hidden rounded-full bg-slate-100", children: _jsx("div", { className: "h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400", style: { width: `${(item.value / max) * 100}%` } }) })] }, item.label))) }));
};
export const Table = ({ headers, rows }) => (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full border-separate border-spacing-y-2 text-left text-sm", children: [_jsx("thead", { children: _jsx("tr", { className: "text-slate-500", children: headers.map((header) => (_jsx("th", { className: "px-3 py-2 font-medium", children: header }, header))) }) }), _jsx("tbody", { children: rows.map((row, index) => (_jsx("tr", { className: "rounded-2xl bg-slate-50/90", children: row.map((cell, cellIndex) => (_jsx("td", { className: "px-3 py-3 align-top text-slate-700 first:rounded-l-2xl last:rounded-r-2xl", children: cell }, `${index}-${cellIndex}`))) }, index))) })] }) }));
export const ActionButton = ({ children, onClick, tone = "primary", disabled = false, type = "button" }) => {
    const style = tone === "secondary"
        ? "bg-white text-brand-ink ring-1 ring-sky-200 hover:bg-sky-50"
        : tone === "ghost"
            ? "bg-transparent text-sky-700 hover:bg-sky-50"
            : "bg-brand-ink text-white hover:bg-sky-700";
    return (_jsx("button", { type: type, onClick: onClick, disabled: disabled, className: `inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${style}`, children: children }));
};
