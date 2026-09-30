import { randomUUID } from "node:crypto";
import type { PaymentRequest } from "@sos-procuresphere/shared";

export interface BankingAdapter {
  initiatePayment(payment: PaymentRequest): {
    adapter: string;
    bankReference: string;
    status: "queued" | "initiated";
  };
}

export class MockBankingAdapter implements BankingAdapter {
  initiatePayment(payment: PaymentRequest) {
    const status: "queued" | "initiated" = payment.amount > 0 ? "initiated" : "queued";

    return {
      adapter: "mock-bank",
      bankReference: `MBK-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${randomUUID().slice(0, 6).toUpperCase()}`,
      status
    };
  }
}

export const bankAdapter = new MockBankingAdapter();
