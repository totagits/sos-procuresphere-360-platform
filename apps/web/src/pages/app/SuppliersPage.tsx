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
    mutationFn: () =>
      api.createSupplier({
        ...formState,
        categories: formState.categories.split(",").map((value) => value.trim()).filter(Boolean)
      }),
    onSuccess: () => {
      setFormState({ name: "", contactName: "", email: "", categories: "" });
      void queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    }
  });

  const blacklistSupplier = useMutation({
    mutationFn: (supplierId: string) => api.blacklistSupplier(supplierId, "Suspended in demo due to compliance review."),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["suppliers"] })
  });

  if (!suppliers) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Panel>
        <SectionHeading
          eyebrow="Supplier Lifecycle"
          title="Onboarding, due diligence, and performance visibility"
          detail="Track supplier banking, tax IDs, due-diligence artifacts, preference flags, and suspension decisions with a complete audit trail."
        />
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <Table
              headers={["Supplier", "Categories", "Status", "Preferred", "Performance", "Action"]}
              rows={suppliers.map((supplier) => {
                const latestPerformance = supplier.performance[0];
                const average =
                  latestPerformance
                    ? Math.round((latestPerformance.deliveryScore + latestPerformance.qualityScore + latestPerformance.complianceScore) / 3)
                    : 0;

                return [
                  <div key={supplier.id}>
                    <p className="font-medium">{supplier.name}</p>
                    <p className="text-xs text-slate-500">{supplier.contactName}</p>
                  </div>,
                  supplier.categories.join(", "),
                  <StatusBadge key={`${supplier.id}-status`} value={supplier.status} />,
                  supplier.preferred ? "Yes" : "No",
                  `${average}%`,
                  <ActionButton
                    key={`${supplier.id}-action`}
                    tone="secondary"
                    disabled={supplier.status === "blacklisted"}
                    onClick={() => blacklistSupplier.mutate(supplier.id)}
                  >
                    Blacklist
                  </ActionButton>
                ];
              })}
            />
          </div>

          <div className="space-y-4">
            <Panel className="border-slate-100 bg-slate-50/80">
              <h3 className="font-['Sora'] text-lg font-semibold">Create supplier profile</h3>
              <div className="mt-4 grid gap-3">
                <input
                  value={formState.name}
                  onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                  placeholder="Supplier name"
                />
                <input
                  value={formState.contactName}
                  onChange={(event) => setFormState((current) => ({ ...current, contactName: event.target.value }))}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                  placeholder="Contact name"
                />
                <input
                  value={formState.email}
                  onChange={(event) => setFormState((current) => ({ ...current, email: event.target.value }))}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                  placeholder="Email address"
                />
                <input
                  value={formState.categories}
                  onChange={(event) => setFormState((current) => ({ ...current, categories: event.target.value }))}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                  placeholder="Categories, comma separated"
                />
                <ActionButton onClick={() => createSupplier.mutate()} disabled={!formState.name || createSupplier.isPending}>
                  Add supplier
                </ActionButton>
              </div>
            </Panel>

            <Panel className="border-slate-100 bg-slate-50/80">
              <h3 className="mb-4 font-['Sora'] text-lg font-semibold">Performance snapshot</h3>
              <MetricBars
                items={suppliers.slice(0, 3).map((supplier) => ({
                  label: supplier.name,
                  value: Math.round(
                    ((supplier.performance[0]?.deliveryScore ?? 0) +
                      (supplier.performance[0]?.qualityScore ?? 0) +
                      (supplier.performance[0]?.complianceScore ?? 0)) / 3
                  )
                }))}
              />
            </Panel>
          </div>
        </div>
      </Panel>
    </div>
  );
};
