import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { ScreenWrapper } from "@/shared/ui/ScreenWrapper";
import { COLORS } from "@/shared/theme/colors";
import { useAuthStore } from "@store/authStore";
import { ChildSwitcher } from "../components/ChildSwitcher";
import { ROUTES } from "@/constants/route";
import { feesApi, FeeInvoice } from "../api/feesApi";

const STATUS_LABEL: Record<FeeInvoice["status"], string> = {
  paid: "PAID",
  partially_paid: "PARTIAL",
  unpaid: "DUE",
};

export const FeesScreen: React.FC = () => {
  const router = useRouter();
  const activeStudentId = useAuthStore((state) => state.activeStudentId);
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<FeeInvoice[]>([]);

  const load = useCallback(async () => {
    if (!activeStudentId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const result = await feesApi.getInvoices(activeStudentId);
      setInvoices(result);
    } catch (err) {
      console.error("Failed to load fee invoices:", err);
    } finally {
      setLoading(false);
    }
  }, [activeStudentId]);

  useEffect(() => {
    load();
  }, [load]);

  const dueInvoices = invoices.filter((i) => i.status !== "paid").sort((a, b) => a.due_date.localeCompare(b.due_date));
  const outstanding = dueInvoices.reduce((sum, i) => sum + Number(i.remaining_balance), 0);
  const nextDue = dueInvoices[0];

  const goToPay = (invoiceId: number) => {
    router.push({ pathname: ROUTES.PARENT.FEES_PAY, params: { invoiceId: String(invoiceId) } });
  };

  return (
    <ScreenWrapper
      title="Fees"
      showHeader
      showBack
      scrollable
      right={<ChildSwitcher />}
      contentContainerStyle={styles.content}
    >
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <>
          <View style={styles.heroCard}>
            <Text style={styles.heroLabel}>OUTSTANDING</Text>
            <Text style={styles.heroAmount}>₹{outstanding.toLocaleString("en-IN")}</Text>
            {nextDue && (
              <View style={styles.heroRow}>
                <Text style={styles.heroSubtitle}>{nextDue.invoice_number} · due {nextDue.due_date}</Text>
                <TouchableOpacity style={styles.payBtn} onPress={() => goToPay(nextDue.id)}>
                  <Text style={styles.payBtnText}>Pay now</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <Text style={styles.sectionTitle}>Invoices</Text>

          {invoices.length === 0 && <Text style={styles.emptyText}>No invoices yet.</Text>}

          {invoices.map((inv) => (
            <TouchableOpacity
              key={inv.id}
              style={[styles.invoiceCard, inv.status !== "paid" && styles.invoiceCardDue]}
              onPress={() => inv.status !== "paid" && goToPay(inv.id)}
              activeOpacity={inv.status !== "paid" ? 0.75 : 1}
            >
              <View style={styles.invoiceTag}>
                <Text style={styles.invoiceTagText}>{inv.invoice_number.slice(4, 6)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.invoiceLabel}>{inv.invoice_number}</Text>
                <Text style={styles.invoiceMeta}>Due {inv.due_date}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.invoiceAmount}>₹{Number(inv.total_amount).toLocaleString("en-IN")}</Text>
                <Text style={[styles.invoiceStatus, inv.status === "unpaid" ? styles.invoiceStatusDue : inv.status === "paid" ? styles.invoiceStatusPaid : styles.invoiceStatusPartial]}>
                  {STATUS_LABEL[inv.status]}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </>
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 30, gap: 11 },
  center: { paddingVertical: 60, alignItems: "center" },
  heroCard: { backgroundColor: COLORS.primaryDark, borderRadius: 22, padding: 20 },
  heroLabel: { color: "rgba(255,255,255,0.65)", fontSize: 11.5, fontWeight: "700", letterSpacing: 0.4 },
  heroAmount: { color: "#fff", fontWeight: "700", fontSize: 32, marginTop: 6 },
  heroRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12 },
  heroSubtitle: { color: "rgba(255,255,255,0.75)", fontSize: 12.5, flex: 1, marginRight: 8 },
  payBtn: { backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 18, paddingVertical: 9 },
  payBtnText: { color: COLORS.primaryDark, fontWeight: "700", fontSize: 13.5 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: COLORS.text, marginTop: 6 },
  emptyText: { color: COLORS.textMuted, fontSize: 13 },
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
  invoiceStatusPartial: { color: "#B45309" },
});

export default FeesScreen;
