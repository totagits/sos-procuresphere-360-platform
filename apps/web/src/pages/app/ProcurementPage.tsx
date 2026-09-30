import { useState } from "react";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import { ActionButton, Panel, SectionHeading, StatusBadge, Table } from "@/components/dashboard/widgets";
import { api } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/format";

export const ProcurementPage = () => {
  const queryClient = useQueryClient();
  const [quickPr, setQuickPr] = useState({
    title: "",
    amount: "1500",
    projectCode: "EDU-2026-BCV",
    budgetLine: "6100-Furniture"
  });

  const [requisitionsResult, rfxResult, poResult, invoicesResult, receiptsResult] = useQueries({
    queries: [
      { queryKey: ["requisitions"], queryFn: api.requisitions },
      { queryKey: ["rfx"], queryFn: api.rfx },
      { queryKey: ["purchaseOrders"], queryFn: api.purchaseOrders },
      { queryKey: ["invoices"], queryFn: api.invoices },
      { queryKey: ["receipts"], queryFn: api.receipts }
    ]
  });

  const approveRequisition = useMutation({
    mutationFn: (requisitionId: string) => api.approveRequisition(requisitionId, "approved", "Approved from dashboard queue."),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["requisitions"] })
  });

  const createPo = useMutation({
    mutationFn: ({ requisitionId, supplierId }: { requisitionId: string; supplierId: string }) =>
      api.createPoFromRequisition(requisitionId, supplierId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["purchaseOrders"] });
      void queryClient.invalidateQueries({ queryKey: ["requisitions"] });
    }
  });

  const createRequisition = useMutation({
    mutationFn: () =>
      api.createRequisition({
        ...quickPr,
        amount: Number(quickPr.amount),
        donorCode: "DONOR-NEW-01",
        justification: "Rapid demo requisition",
        lineItems: [
          {
            id: `li-${Date.now()}`,
            description: quickPr.title || "Demo line item",
            quantity: 1,
            unit: "lot",
            unitPrice: Number(quickPr.amount),
            category: "Supplies"
          }
        ]
      }),
    onSuccess: () => {
      setQuickPr((current) => ({ ...current, title: "" }));
      void queryClient.invalidateQueries({ queryKey: ["requisitions"] });
    }
  });

  const awardRfx = useMutation({
    mutationFn: ({ rfxId, bidId }: { rfxId: string; bidId: string }) => api.awardRfx(rfxId, bidId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["rfx"] })
  });

  const matchInvoice = useMutation({
    mutationFn: (invoiceId: string) => api.matchInvoice(invoiceId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["invoices"] })
  });

  const requisitions = requisitionsResult.data ?? [];
  const rfxs = rfxResult.data ?? [];
  const purchaseOrders = poResult.data ?? [];
  const invoices = invoicesResult.data ?? [];
  const receipts = receiptsResult.data ?? [];

  return (
    <div className="space-y-6">
      <Panel>
        <SectionHeading
          eyebrow="Requisitioning"
          title="PR intake, donor coding, approvals, and PO creation"
          detail="This view covers the core procure-to-pay path from request through budget control, approval routing, and order issuance."
        />
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Table
            headers={["Reference", "Request", "Amount", "Budget Check", "Status", "Actions"]}
            rows={requisitions.map((requisition) => {
              const poExists = purchaseOrders.some((order) => order.sourceRequisitionId === requisition.id);
              return [
                requisition.id.toUpperCase(),
                <div key={requisition.id}>
                  <p className="font-medium">{requisition.title}</p>
                  <p className="text-xs text-slate-500">{requisition.projectCode} • {requisition.budgetLine}</p>
                </div>,
                formatCurrency(requisition.amount, requisition.currency),
                <StatusBadge key={`${requisition.id}-budget`} value={requisition.budgetCheck.status} />,
                <StatusBadge key={`${requisition.id}-status`} value={requisition.status} />,
                <div key={`${requisition.id}-actions`} className="flex flex-wrap gap-2">
                  {requisition.status === "pending_approval" ? (
                    <ActionButton tone="secondary" onClick={() => approveRequisition.mutate(requisition.id)}>
                      Approve
                    </ActionButton>
                  ) : null}
                  {requisition.status === "approved" && !poExists ? (
                    <ActionButton onClick={() => createPo.mutate({ requisitionId: requisition.id, supplierId: "sup-libstar" })}>
                      Create PO
                    </ActionButton>
                  ) : null}
                </div>
              ];
            })}
          />

          <Panel className="border-slate-100 bg-slate-50/80">
            <h3 className="font-['Sora'] text-lg font-semibold">Quick requisition</h3>
            <p className="mt-2 text-sm text-slate-600">Create a demo PR with automatic threshold approvals and budget validation.</p>
            <div className="mt-4 grid gap-3">
              <input
                value={quickPr.title}
                onChange={(event) => setQuickPr((current) => ({ ...current, title: event.target.value }))}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                placeholder="Request title"
              />
              <input
                value={quickPr.amount}
                onChange={(event) => setQuickPr((current) => ({ ...current, amount: event.target.value }))}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                placeholder="Amount"
              />
              <input
                value={quickPr.projectCode}
                onChange={(event) => setQuickPr((current) => ({ ...current, projectCode: event.target.value }))}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                placeholder="Project code"
              />
              <input
                value={quickPr.budgetLine}
                onChange={(event) => setQuickPr((current) => ({ ...current, budgetLine: event.target.value }))}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                placeholder="Budget line"
              />
              <ActionButton onClick={() => createRequisition.mutate()} disabled={!quickPr.title || createRequisition.isPending}>
                Submit PR
              </ActionButton>
            </div>
          </Panel>
        </div>
      </Panel>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Panel>
          <SectionHeading
            eyebrow="E-Sourcing"
            title="RFQ, bids, evaluation, and award"
            detail="Time-locked submissions, committee scoring, and award decisions are visible at line-item level."
          />
          <div className="space-y-4">
            {rfxs.map((rfx) => (
              <div key={rfx.id} className="rounded-[24px] border border-slate-100 bg-slate-50/90 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="font-['Sora'] text-lg font-semibold">{rfx.id.toUpperCase()} • {rfx.title}</p>
                      <StatusBadge value={rfx.status} />
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{rfx.description}</p>
                    <p className="mt-3 text-xs uppercase tracking-[0.24em] text-slate-500">Closing {formatDateTime(rfx.closingAt)}</p>
                    <ul className="mt-4 space-y-2 text-sm text-slate-700">
                      {rfx.bids.map((bid) => (
                        <li key={bid.id} className="rounded-2xl bg-white px-4 py-3">
                          <span className="font-medium">{bid.supplierName}</span> • {formatCurrency(bid.totalAmount)} • {bid.leadTimeDays} days • {bid.warrantyMonths} month warranty
                          {!rfx.award ? (
                            <button
                              type="button"
                              onClick={() => awardRfx.mutate({ rfxId: rfx.id, bidId: bid.id })}
                              className="ml-3 text-sm font-semibold text-sky-700"
                            >
                              Award bid
                            </button>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {rfx.award ? (
                    <div className="min-w-[230px] rounded-[22px] bg-brand-ink p-4 text-white">
                      <p className="text-xs uppercase tracking-[0.24em] text-cyan-100">Awarded Supplier</p>
                      <p className="mt-3 font-['Sora'] text-xl font-semibold">{rfx.award.supplierName}</p>
                      <p className="mt-2 text-sm text-sky-100">{rfx.award.recommendation}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <SectionHeading
            eyebrow="Fulfilment"
            title="Receiving, invoices, and matching"
            detail="Segregation of duties remains intact through receiving, invoice capture, and exception-ready matching."
          />
          <div className="space-y-5">
            <div>
              <h3 className="mb-3 font-['Sora'] text-lg font-semibold">Purchase orders and receipts</h3>
              <Table
                headers={["PO", "Supplier", "Status", "Issued", "Receipt status"]}
                rows={purchaseOrders.map((po) => {
                  const receipt = receipts.find((entry) => entry.poId === po.id);
                  return [
                    po.id.toUpperCase(),
                    po.supplierName,
                    <StatusBadge key={`${po.id}-status`} value={po.status} />,
                    formatDateTime(po.issuedAt),
                    receipt ? `${receipt.id.toUpperCase()} • ${receipt.status}` : "Awaiting receipt"
                  ];
                })}
              />
            </div>

            <div>
              <h3 className="mb-3 font-['Sora'] text-lg font-semibold">Invoices and match results</h3>
              <Table
                headers={["Invoice", "Supplier", "Amount", "Status", "Matching"]}
                rows={invoices.map((invoice) => [
                  invoice.invoiceNumber,
                  invoice.supplierName,
                  formatCurrency(invoice.amount, invoice.currency),
                  <StatusBadge key={`${invoice.id}-status`} value={invoice.status} />,
                  invoice.matchResult ? (
                    <StatusBadge key={`${invoice.id}-match`} value={invoice.matchResult.status} />
                  ) : (
                    <ActionButton tone="secondary" onClick={() => matchInvoice.mutate(invoice.id)}>
                      Run 3-way match
                    </ActionButton>
                  )
                ])}
              />
            </div>
          </div>
        </Panel>
      </section>
    </div>
  );
};
