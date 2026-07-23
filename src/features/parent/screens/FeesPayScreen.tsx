import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { COLORS } from "@/shared/theme/colors";
import { ROUTES } from "@/constants/route";
import { feesApi, CheckoutOrder } from "../api/feesApi";

/**
 * Real order-creation flow: on mount this hits the actual backend
 * (POST /api/fees/invoices/{id}/checkout/) and gets back a real Razorpay
 * order_id/amount/key_id. The one thing NOT wired is launching Razorpay's
 * checkout UI itself — there's no react-native-razorpay (or WebView-based
 * Razorpay Checkout) integration in this build yet, which needs a native
 * rebuild this pass didn't include.
 *
 * TODO(payment-sdk): replace handlePay's Alert with a real checkout call,
 * e.g.:
 *   RazorpayCheckout.open({ key: order.key_id, order_id: order.order_id,
 *     amount: order.total_amount, currency: order.currency, ... })
 *     .then((data) => feesApi.verifyCheckout({
 *       razorpay_order_id: data.razorpay_order_id,
 *       razorpay_payment_id: data.razorpay_payment_id,
 *       razorpay_signature: data.razorpay_signature,
 *     }))
 * `order` below already has everything that call needs.
 */
export const FeesPayScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ invoiceId?: string }>();
  const invoiceId = Number(params.invoiceId);

  const [order, setOrder] = useState<CheckoutOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!invoiceId) {
      setLoading(false);
      setError("No invoice selected.");
      return;
    }
    feesApi
      .createCheckoutOrder(invoiceId)
      .then(setOrder)
      .catch((err) => {
        console.error("Failed to create checkout order:", err);
        setError(err?.message || "Could not start payment. Please try again.");
      })
      .finally(() => setLoading(false));
  }, [invoiceId]);

  const handlePay = () => {
    if (!order) return;
    setProcessing(true);
    // TODO(payment-sdk): see file header — this is the seam to swap in a
    // real Razorpay checkout call once the native SDK is added.
    Alert.alert(
      "Payment provider not connected",
      "Online checkout isn't wired to a payment SDK in this build yet. The order was created successfully on the school's system — ask the office to confirm payment status, or complete this from a build with the Razorpay SDK installed.",
      [{ text: "OK", onPress: () => setProcessing(false) }]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.backdrop} />
      <View style={styles.sheet}>
        <View style={styles.handle} />

        {error || !order ? (
          <View style={styles.errorBlock}>
            <Text style={styles.errorText}>{error || "Something went wrong."}</Text>
            <TouchableOpacity style={styles.payBtn} onPress={() => router.back()}>
              <Text style={styles.payBtnText}>Go back</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.summaryRow}>
              <View style={styles.schoolTag}>
                <Text style={styles.schoolTagText}>₹</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.schoolName}>Fee payment</Text>
                <Text style={styles.invoiceDesc}>
                  {order.convenience_fee_amount !== "0.00" ? `+ ₹${order.convenience_fee_amount} convenience fee` : "No convenience fee"}
                </Text>
              </View>
              <Text style={styles.amount}>₹{Number(order.total_amount).toLocaleString("en-IN")}</Text>
            </View>

            <Text style={styles.note}>
              Order created (#{order.order_id}). Complete payment via the school's configured gateway ({order.gateway}).
            </Text>

            <TouchableOpacity style={styles.payBtn} onPress={handlePay} disabled={processing}>
              {processing ? <ActivityIndicator color="#fff" /> : <Text style={styles.payBtnText}>Pay ₹{Number(order.total_amount).toLocaleString("en-IN")}</Text>}
            </TouchableOpacity>
            <Text style={styles.secureNote}>🔒 Secured by Razorpay · 256-bit encryption</Text>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#3E3562" },
  center: { alignItems: "center", justifyContent: "center" },
  backdrop: { flex: 1 },
  sheet: { backgroundColor: COLORS.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, paddingBottom: 30 },
  handle: { width: 44, height: 5, borderRadius: 3, backgroundColor: COLORS.border, alignSelf: "center", marginBottom: 16 },
  summaryRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  schoolTag: { width: 44, height: 44, borderRadius: 14, backgroundColor: "#F5F3FF", alignItems: "center", justifyContent: "center" },
  schoolTagText: { color: COLORS.primary, fontWeight: "700", fontSize: 18 },
  schoolName: { fontSize: 14.5, fontWeight: "600", color: COLORS.text },
  invoiceDesc: { fontSize: 12, color: COLORS.textMuted },
  amount: { fontSize: 18, fontWeight: "700", color: COLORS.text },
  note: { fontSize: 12, color: COLORS.textSecondary, marginTop: 16, lineHeight: 18 },
  payBtn: { marginTop: 18, height: 56, borderRadius: 16, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
  payBtnText: { color: "#fff", fontWeight: "700", fontSize: 15.5 },
  secureNote: { textAlign: "center", fontSize: 11.5, color: COLORS.textMuted, marginTop: 12 },
  errorBlock: { alignItems: "center", gap: 14 },
  errorText: { color: COLORS.error, fontSize: 14, textAlign: "center", fontWeight: "600" },
});

export default FeesPayScreen;
