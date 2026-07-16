import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { COLORS } from "@/shared/theme/colors";
import { ROUTES } from "@/constants/route";

export const FeesReceiptScreen: React.FC = () => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.successBlock}>
        <View style={styles.successCircle}>
          <Text style={styles.successCheck}>✓</Text>
        </View>
        <Text style={styles.successTitle}>Payment successful</Text>
        <Text style={styles.successSubtitle}>₹12,500 paid via UPI</Text>
      </View>

      <View style={styles.receiptCard}>
        <View style={styles.receiptHeader}>
          <Text style={styles.receiptTitle}>Fee Receipt</Text>
          <Text style={styles.receiptNumber}>RCP-2627-1094</Text>
        </View>
        <View style={styles.receiptRows}>
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Invoice</Text>
            <Text style={styles.receiptValue}>INV-2627-0451 · Term 2 Tuition</Text>
          </View>
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Method</Text>
            <Text style={styles.receiptValue}>UPI</Text>
          </View>
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Transaction ID</Text>
            <Text style={styles.receiptValue}>pay_QxT48hzR2mKe1A</Text>
          </View>
        </View>
        <View style={styles.receiptTotalRow}>
          <Text style={styles.receiptLabel}>Amount paid</Text>
          <Text style={styles.receiptTotal}>₹12,500</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.downloadBtn}>
          <Text style={styles.downloadBtnText}>Download PDF</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.doneBtn} onPress={() => router.replace(ROUTES.PARENT.FEES)}>
          <Text style={styles.doneBtnText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingTop: 60 },
  successBlock: { alignItems: "center", paddingHorizontal: 24 },
  successCircle: { width: 76, height: 76, borderRadius: 38, backgroundColor: "#ECFDF5", borderWidth: 3, borderColor: COLORS.success, alignItems: "center", justifyContent: "center" },
  successCheck: { fontSize: 32, color: "#059669", fontWeight: "700" },
  successTitle: { fontSize: 20, fontWeight: "700", color: COLORS.text, marginTop: 16 },
  successSubtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  receiptCard: { margin: 22, backgroundColor: COLORS.surface, borderRadius: 22, padding: 22, shadowColor: "#1C0A4A", shadowOpacity: 0.07, shadowRadius: 18 },
  receiptHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingBottom: 14, borderBottomWidth: 1.5, borderBottomColor: COLORS.border, borderStyle: "dashed" },
  receiptTitle: { fontSize: 15, fontWeight: "700", color: COLORS.text },
  receiptNumber: { fontSize: 11.5, color: COLORS.textMuted, marginTop: 2 },
  receiptRows: { gap: 10, paddingVertical: 16 },
  receiptRow: { flexDirection: "row", justifyContent: "space-between" },
  receiptLabel: { fontSize: 13, color: COLORS.textSecondary },
  receiptValue: { fontSize: 13, fontWeight: "700", color: COLORS.text },
  receiptTotalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1.5, borderTopColor: COLORS.border, borderStyle: "dashed", paddingTop: 14 },
  receiptTotal: { fontSize: 20, fontWeight: "700", color: "#047857" },
  footer: { flexDirection: "row", gap: 12, paddingHorizontal: 22 },
  downloadBtn: { flex: 1, height: 52, borderRadius: 16, borderWidth: 1.5, borderColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
  downloadBtnText: { color: COLORS.primary, fontWeight: "600", fontSize: 14.5 },
  doneBtn: { flex: 1, height: 52, borderRadius: 16, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
  doneBtnText: { color: "#fff", fontWeight: "600", fontSize: 14.5 },
});

export default FeesReceiptScreen;
