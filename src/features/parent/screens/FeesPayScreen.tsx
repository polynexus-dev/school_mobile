import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { COLORS } from "@/shared/theme/colors";
import { ROUTES } from "@/constants/route";

type Method = "upi" | "card" | "netbanking";

/**
 * Payment method bottom sheet — SCAFFOLD. Razorpay checkout isn't wired yet
 * (see backend plan's payment_gateways.py / PaymentGatewayTransaction model);
 * "Pay" below simulates a short processing delay then jumps to the receipt
 * screen so the rest of the flow can be reviewed end-to-end visually.
 */
export const FeesPayScreen: React.FC = () => {
  const router = useRouter();
  const [method, setMethod] = useState<Method>("upi");
  const [processing, setProcessing] = useState(false);

  const handlePay = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      router.replace(ROUTES.PARENT.FEES_RECEIPT);
    }, 900);
  };

  return (
    <View style={styles.container}>
      <View style={styles.backdrop} />
      <View style={styles.sheet}>
        <View style={styles.handle} />

        <View style={styles.summaryRow}>
          <View style={styles.schoolTag}>
            <Text style={styles.schoolTagText}>GP</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.schoolName}>Your School</Text>
            <Text style={styles.invoiceDesc}>Term 2 Tuition · Selected child</Text>
          </View>
          <Text style={styles.amount}>₹12,500</Text>
        </View>

        <Text style={styles.sectionLabel}>RECOMMENDED</Text>
        <TouchableOpacity
          style={[styles.methodCard, method === "upi" && styles.methodCardOn]}
          onPress={() => setMethod("upi")}
        >
          <View style={styles.methodIcon}>
            <Text style={styles.methodIconText}>UPI</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.methodTitle}>UPI</Text>
            <Text style={styles.methodSubtitle}>Pay instantly · no convenience fee</Text>
          </View>
          <View style={[styles.radio, method === "upi" && styles.radioOn]} />
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>OTHER METHODS</Text>
        <TouchableOpacity
          style={[styles.methodCardPlain, method === "card" && styles.methodCardOn]}
          onPress={() => setMethod("card")}
        >
          <View style={styles.methodIconPlain}>
            <Text>💳</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.methodTitle}>Card</Text>
            <Text style={styles.methodSubtitle}>+ 1% convenience fee</Text>
          </View>
          <View style={[styles.radio, method === "card" && styles.radioOn]} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.methodCardPlain, method === "netbanking" && styles.methodCardOn]}
          onPress={() => setMethod("netbanking")}
        >
          <View style={styles.methodIconPlain}>
            <Text>🏦</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.methodTitle}>Netbanking</Text>
            <Text style={styles.methodSubtitle}>All major banks</Text>
          </View>
          <View style={[styles.radio, method === "netbanking" && styles.radioOn]} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.payBtn} onPress={handlePay} disabled={processing}>
          {processing ? <ActivityIndicator color="#fff" /> : <Text style={styles.payBtnText}>Pay ₹12,500</Text>}
        </TouchableOpacity>
        <Text style={styles.secureNote}>🔒 Secured by Razorpay · 256-bit encryption</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#3E3562" },
  backdrop: { flex: 1 },
  sheet: { backgroundColor: COLORS.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, paddingBottom: 30 },
  handle: { width: 44, height: 5, borderRadius: 3, backgroundColor: COLORS.border, alignSelf: "center", marginBottom: 16 },
  summaryRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  schoolTag: { width: 44, height: 44, borderRadius: 14, backgroundColor: "#F5F3FF", alignItems: "center", justifyContent: "center" },
  schoolTagText: { color: COLORS.primary, fontWeight: "700" },
  schoolName: { fontSize: 14.5, fontWeight: "600", color: COLORS.text },
  invoiceDesc: { fontSize: 12, color: COLORS.textMuted },
  amount: { fontSize: 18, fontWeight: "700", color: COLORS.text },
  sectionLabel: { fontSize: 11, fontWeight: "700", color: COLORS.textMuted, letterSpacing: 0.5, marginTop: 16, marginBottom: 8 },
  methodCard: { borderWidth: 1.5, borderColor: COLORS.primary, backgroundColor: "#F5F3FF", borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 13 },
  methodCardPlain: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, padding: 13, flexDirection: "row", alignItems: "center", gap: 13, marginBottom: 10 },
  methodCardOn: { borderColor: COLORS.primary },
  methodIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: COLORS.border },
  methodIconText: { fontWeight: "800", fontSize: 10.5, color: "#5B21B6" },
  methodIconPlain: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.surfaceDark, alignItems: "center", justifyContent: "center" },
  methodTitle: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  methodSubtitle: { fontSize: 11.5, color: COLORS.textMuted, marginTop: 1 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: "#D1D5DB", backgroundColor: "#fff" },
  radioOn: { borderWidth: 6.5, borderColor: COLORS.primary },
  payBtn: { marginTop: 18, height: 56, borderRadius: 16, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
  payBtnText: { color: "#fff", fontWeight: "700", fontSize: 15.5 },
  secureNote: { textAlign: "center", fontSize: 11.5, color: COLORS.textMuted, marginTop: 12 },
});

export default FeesPayScreen;
