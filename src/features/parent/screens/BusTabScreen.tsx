import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ScreenWrapper } from "@/shared/ui/ScreenWrapper";
import { COLORS } from "@/shared/theme/colors";
import { ChildSwitcher } from "../components/ChildSwitcher";
import { ROUTES } from "@/constants/route";

export const BusTabScreen: React.FC = () => {
  const router = useRouter();

  return (
    <ScreenWrapper title="Bus" showHeader showBack={false} scrollable right={<ChildSwitcher />} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.liveCard} onPress={() => router.push(ROUTES.PARENT.BUS_TRACKING)} activeOpacity={0.85}>
        <View style={styles.liveRow}>
          <View style={styles.liveDot} />
          <Text style={styles.liveLabel}>LIVE · ROUTE SHIVAJI NAGAR – LINE 3</Text>
        </View>
        <Text style={styles.liveTitle}>Bus is 2 stops away</Text>
        <Text style={styles.liveSubtitle}>ETA at your stop · 7 min</Text>
        <View style={styles.trackBtn}>
          <Text style={styles.trackBtnText}>Open live map →</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.linkCard} onPress={() => router.push(ROUTES.PARENT.BUS_ALERTS)}>
        <View style={{ flex: 1 }}>
          <Text style={styles.linkTitle}>Bus alerts</Text>
          <Text style={styles.linkSubtitle}>Boarding, arrival & delay notifications</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 30, gap: 14 },
  liveCard: { backgroundColor: "#0F172A", borderRadius: 22, padding: 20 },
  liveRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#22D3EE" },
  liveLabel: { fontSize: 11, fontWeight: "700", color: "#A5F3FC" },
  liveTitle: { color: "#fff", fontWeight: "700", fontSize: 19, marginTop: 12 },
  liveSubtitle: { color: "rgba(255,255,255,0.65)", fontSize: 13, marginTop: 3 },
  trackBtn: { marginTop: 14, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 12, paddingVertical: 11, alignItems: "center" },
  trackBtnText: { color: "#fff", fontWeight: "600", fontSize: 13.5 },
  linkCard: { backgroundColor: COLORS.surface, borderRadius: 18, padding: 16, flexDirection: "row", alignItems: "center", gap: 12, shadowColor: "#1C0A4A", shadowOpacity: 0.05, shadowRadius: 12 },
  linkTitle: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  linkSubtitle: { fontSize: 11.5, color: COLORS.textMuted, marginTop: 2 },
  chevron: { fontSize: 20, color: COLORS.textMuted },
});

export default BusTabScreen;
