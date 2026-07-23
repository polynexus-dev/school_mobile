import httpClient from "@services/api/httpClient";

/**
 * Real fee endpoints (school_app/views/fees.py):
 *   GET  /api/fees/invoices/?student={id}         — paginated, scoped to the guardian's own verified children
 *   POST /api/fees/invoices/{id}/checkout/         — creates a Razorpay order for the remaining balance
 *   POST /api/fees/checkout/verify/                — {razorpay_order_id, razorpay_payment_id, razorpay_signature}
 *
 * NOTE: this wires the REST side fully, but does not trigger a native
 * checkout UI — the app has no react-native-razorpay (or WebView-based
 * Razorpay Checkout) integration yet, and adding the native SDK requires an
 * EAS/local prebuild this pass didn't include. `createCheckoutOrder`'s
 * result (order_id, amount, key_id) is exactly what that SDK call would
 * need; `verifyCheckout` is exactly what its success callback should POST.
 * See FeesPayScreen.tsx for the single stubbed seam.
 */

export interface FeeInvoice {
  id: number;
  student: number;
  fee_structure: number | null;
  invoice_number: string;
  due_date: string;
  total_amount: string;
  discount_amount: string;
  paid_amount: string;
  remaining_balance: string;
  status: "unpaid" | "partially_paid" | "paid";
  created_at: string;
}

export interface CheckoutOrder {
  gateway: string;
  order_id: string;
  amount: string;
  convenience_fee_amount: string;
  total_amount: string;
  currency: string;
  key_id: string | null;
  transaction_id: number;
}

export interface FeePayment {
  id: number;
  invoice: number;
  amount_paid: string;
  payment_method: string;
  transaction_reference: string | null;
  receipt_number: string;
  payment_date: string;
  remarks: string | null;
}

async function fetchAllPages<T>(url: string, params: Record<string, any> = {}): Promise<T[]> {
  let all: T[] = [];
  let page = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const res = await httpClient.get(url, { params: { ...params, page } });
    const data = res.data;
    if (Array.isArray(data)) return data;
    all = all.concat(data?.results ?? []);
    if (!data?.next) break;
    page += 1;
  }
  return all;
}

export const feesApi = {
  getInvoices: async (studentId: number): Promise<FeeInvoice[]> =>
    fetchAllPages<FeeInvoice>("/api/fees/invoices/", { student: studentId }),

  createCheckoutOrder: async (invoiceId: number): Promise<CheckoutOrder> => {
    const res = await httpClient.post(`/api/fees/invoices/${invoiceId}/checkout/`);
    return res.data;
  },

  verifyCheckout: async (params: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }): Promise<FeePayment> => {
    const res = await httpClient.post("/api/fees/checkout/verify/", params);
    return res.data;
  },
};
