import httpClient from "@services/api/httpClient";

/**
 * Real fee endpoints (school_app/views/fees.py):
 *   GET  /api/fees/invoices/?student={id}         — paginated, scoped to the guardian's own verified children
 *   POST /api/fees/invoices/{id}/checkout/         — creates an order with whichever gateway the school has active
 *                                                     (optionally {gateway: "razorpay"} to pick among several)
 *   POST /api/fees/checkout/verify/                — {gateway_order_id, gateway_payment_id, ...signature fields}
 *
 * The school now configures its own gateway(s) — Razorpay, PayU, Cashfree,
 * Paytm, Instamojo, PhonePe, or Stripe — via Settings > Payment Gateways on
 * the web app (see school_app/payment_gateway_registry.py), and
 * `createCheckoutOrder`'s `checkout_mode` tells the client how to complete
 * checkout for whichever one is active: "modal_sdk" (Razorpay/Cashfree/
 * Stripe — needs `public_key`/`payment_session_id`/`client_secret`),
 * "redirect" (Instamojo/PhonePe — needs `redirect_url`), or "form_post"
 * (PayU/Paytm — needs `form_action_url` + `form_fields`).
 *
 * NOTE: this wires the REST side fully, but does not trigger a native
 * checkout UI yet — the app has no gateway SDK (or WebView-based checkout)
 * integration, and adding one requires an EAS/local prebuild this pass
 * didn't include. `createCheckoutOrder`'s result is exactly what that SDK
 * call would need; `verifyCheckout` is exactly what its success callback
 * should POST. See FeesPayScreen.tsx for the single stubbed seam.
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
  checkout_mode: "modal_sdk" | "redirect" | "form_post";
  order_id: string;
  amount: string;
  convenience_fee_amount: string;
  total_amount: string;
  currency: string;
  transaction_id: number;
  // Only the field(s) matching `checkout_mode` will actually be present.
  public_key: string | null;
  client_secret: string | null;
  payment_session_id: string | null;
  redirect_url: string | null;
  form_action_url: string | null;
  form_fields: Record<string, string> | null;
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

  createCheckoutOrder: async (invoiceId: number, gateway?: string): Promise<CheckoutOrder> => {
    const res = await httpClient.post(`/api/fees/invoices/${invoiceId}/checkout/`, gateway ? { gateway } : {});
    return res.data;
  },

  verifyCheckout: async (params: {
    gateway_order_id: string;
    gateway_payment_id?: string;
    [key: string]: string | undefined; // gateway-specific signature fields, e.g. razorpay_signature
  }): Promise<FeePayment> => {
    const res = await httpClient.post("/api/fees/checkout/verify/", params);
    return res.data;
  },
};
