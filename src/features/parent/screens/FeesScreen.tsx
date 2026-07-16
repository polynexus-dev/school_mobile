import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ScreenWrapper } from "@/shared/ui/ScreenWrapper";
import { COLORS } from "@/shared/theme/colors";
import { ChildSwitcher } from "../components/ChildSwitcher";
import { ROUTES } from "@/constants/route";

/**
 * Fees & payments — SCAFFOLD, mock invoices. No fee/invoice endpoint in this
 * pass's contract yet (see backend plan's StudentFeeInvoice model); wire this
 * list + the hero "Pay now" CTA to the real invoice API once it ships.
 */
const MOCK_INVOICES = [
  { id: "INV-2627-0451", label: "Term 2 Tuition Fee", amount: 12500, status: "due" as const, meta: "Due 20 Jul 2026" },
  { id: "INV-2627-0389", label: "Bus Fee · Q2 (Jul–Sep)", amount: 4200, status: "paid" as const, meta: "Paid 2 Jul 2026" },
  { id: "INV-2627-0104a", label: "Term 1 Tuition Fee", amount: 12500, status: "paid" as const, meta: "Paid 8 Apr 2026" },
  { id: "INV-2627-0104b", label: "Annual Activity Fee", amount: 3000, status: "paid" as const, meta: "Paid 8 Apr 2026" },
];

export const FeesScreen: React.FC = () => {
  const router = useRouter();
  const outstanding = MOCK_INVOICES.filter((i) => i.status === "due").reduce((sum, i) => sum + i.amount, 0);

  return (
    <ScreenWrapper
      title="Fees"
      showHeader
      showBack
      scrollable
      right={<ChildSwitcher />}
      contentContainerStyle={styles.content}
    >
      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>OUTSTANDING · ACADEMIC YEAR 2026–27</Text>
        <Text style={styles.heroAmount}>₹{outstanding.toLocaleString("en-IN")}</Text>
        <View style={styles.heroRow}>
          <Text style={styles.heroSubtitle}>Term 2 tuition · due 20 July</Text>
          <TouchableOpacity style={styles.payBtn} onPress={() => router.push(ROUTES.PARENT.FEES_PAY)}>
            <Text style={styles.payBtnText}>Pay now</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Invoices</Text>

      {MOCK_INVOICES.map((inv) => (
        <View key={inv.id} style={[styles.invoiceCard, inv.status === "due" && styles.invoiceCardDue]}>
          <View style={styles.invoiceTag}>
            <Text style={styles.invoiceTagText}>{inv.label[0]}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.invoiceLabel}>{inv.label}</Text>
            <Text style={styles.invoiceMeta}>
              {inv.id} · {inv.meta}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.invoiceAmount}>₹{inv.amount.toLocaleString("en-IN")}</Text>
            <Text style={[styles.invoiceStatus, inv.status === "due" ? styles.invoiceStatusDue : styles.invoiceStatusPaid]}>
              {inv.status === "due" ? "DUE" : "PAID"}
            </Text>
          </View>
        </View>
      ))}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 30, gap: 11 },
  heroCard: { backgroundColor: COLORS.primaryDark, borderRadius: 22, padding: 20 },
  heroLabel: { color: "rgba(255,255,255,0.65)", fontSize: 11.5, fontWeight: "700", letterSpacing: 0.4 },
  heroAmount: { color: "#fff", fontWeight: "700", fontSize: 32, marginTop: 6 },
  heroRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12 },
  heroSubtitle: { color: "rgba(255,255,255,0.75)", fontSize: 12.5 },
  payBtn: { backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 18, paddingVertical: 9 },
  payBtnText: { color: COLORS.primaryDark, fontWeight: "700", fontSize: 13.5 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: COLORS.text, marginTop: 6 },
  invoiceCard: { backgroundColor: COLORS.surface, borderRadius: 18, padding: 15, flexDirection: "row", alignItems: "center", gap: 13, shadowColor: "#1C0A4A", shadowOpacity: 0.05, shadowRadius: 12 },
  invoiceCardDue: { borderWidth: 1.5, borderColor: "#FDE68A" },
  invoiceTag: { width: 44, height: 44, borderRadius: 14, backgroundColor: "#F5F3FF", alignItems: "center", justifyContent: "center" },
  invoiceTagText: { color: "#5B21B6", fontWeight: "700", fontSize: 16 },
  invoiceLabel: { fontSize: 13.5, fontWeight: "600", color: COLORS.text },
  invoiceMeta: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  invoiceAmount: { fontWeight: "700", fontSize: 14, color: COLORS.text },
  invoiceStatus: { fontSize: 10.5, fontWeight: "700", marginTop: 2 },
  invoiceStatusDue: { color: "#B45309" },
  invoiceStatusPaid: { color: "#047857" },
});

export default FeesScreen;
