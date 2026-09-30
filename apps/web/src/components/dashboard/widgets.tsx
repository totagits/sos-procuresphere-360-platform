import type { PropsWithChildren, ReactNode } from "react";
import { formatCurrency, titleCase } from "@/lib/format";

export const Panel = ({ children, className = "" }: PropsWithChildren<{ className?: string }>) => (
  <section className={`rounded-[28px] border border-white/10 bg-white/80 p-5 shadow-[0_24px_60px_rgba(8,22,38,0.08)] backdrop-blur ${className}`}>
    {children}
  </section>
);

export const SectionHeading = ({ eyebrow, title, detail }: { eyebrow: string; title: string; detail: string }) => (
  <div className="mb-5 flex flex-col gap-2">
    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">{eyebrow}</p>
    <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h2 className="font-['Sora'] text-2xl font-semibold text-brand-ink">{title}</h2>
        <p className="max-w-3xl text-sm text-slate-600">{detail}</p>
      </div>
    </div>
  </div>
);

export const StatCard = ({
  label,
  value,
  hint
}: {
  label: string;
  value: string | number;
  hint: string;
}) => (
  <div className="rounded-[26px] border border-sky-100 bg-sky-50/80 p-4">
    <p className="text-sm text-slate-500">{label}</p>
    <p className="mt-3 font-['Sora'] text-3xl font-semibold text-brand-ink">{value}</p>
    <p className="mt-2 text-sm text-slate-600">{hint}</p>
  </div>
);

export const StatusBadge = ({ value }: { value: string }) => {
  const normalized = value.toLowerCase();
  const styles =
    normalized.includes("approved") || normalized.includes("ready") || normalized.includes("matched") || normalized.includes("reconciled")
      ? "bg-emerald-100 text-emerald-700"
      : normalized.includes("pending") || normalized.includes("warning") || normalized.includes("partial")
        ? "bg-amber-100 text-amber-700"
        : normalized.includes("exception") || normalized.includes("rejected") || normalized.includes("blacklisted")
          ? "bg-rose-100 text-rose-700"
          : "bg-slate-100 text-slate-700";

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles}`}>
      {titleCase(value)}
    </span>
  );
};

export const MetricBars = ({ items, money = false }: { items: Array<{ label: string; value: number }>; money?: boolean }) => {
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.label} className="space-y-2">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="font-medium text-slate-700">{item.label}</span>
            <span className="text-slate-500">{money ? formatCurrency(item.value) : item.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export const Table = ({
  headers,
  rows
}: {
  headers: string[];
  rows: Array<Array<ReactNode>>;
}) => (
  <div className="overflow-x-auto">
    <table className="min-w-full border-separate border-spacing-y-2 text-left text-sm">
      <thead>
        <tr className="text-slate-500">
          {headers.map((header) => (
            <th key={header} className="px-3 py-2 font-medium">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={index} className="rounded-2xl bg-slate-50/90">
            {row.map((cell, cellIndex) => (
              <td key={`${index}-${cellIndex}`} className="px-3 py-3 align-top text-slate-700 first:rounded-l-2xl last:rounded-r-2xl">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const ActionButton = ({
  children,
  onClick,
  tone = "primary",
  disabled = false,
  type = "button"
}: PropsWithChildren<{
  onClick?: () => void;
  tone?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
  type?: "button" | "submit";
}>) => {
  const style =
    tone === "secondary"
      ? "bg-white text-brand-ink ring-1 ring-sky-200 hover:bg-sky-50"
      : tone === "ghost"
        ? "bg-transparent text-sky-700 hover:bg-sky-50"
        : "bg-brand-ink text-white hover:bg-sky-700";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${style}`}
    >
      {children}
    </button>
  );
};
