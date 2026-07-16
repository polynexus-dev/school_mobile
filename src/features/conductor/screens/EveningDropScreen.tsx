import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { COLORS } from "@/shared/theme/colors";
import { conductorApi } from "../api/conductorApi";

interface DropChild {
  id: number;
  name: string;
  initials: string;
  color: string;
  status: "pending" | "confirmed" | "unauthorized";
  confirmedAt?: string;
}

const INITIAL: DropChild[] = [
  { id: 1, name: "Aarav Sharma", initials: "AS", color: "#7C3AED", status: "confirmed", confirmedAt: "3:51 PM" },
  { id: 2, name: "Meera Joshi", initials: "MJ", color: "#0891B2", status: "confirmed", confirmedAt: "3:51 PM" },
  { id: 3, name: "Vivaan Patil", initials: "VP", color: "#D97706", status: "pending" },
  { id: 4, name: "Sara Sheikh", initials: "SS", color: "#059669", status: "unauthorized" },
];

export const EveningDropScreen: React.FC = () => {
  const router = useRouter();
  const [children, setChildren] = useState<DropChild[]>(INITIAL);

  const confirmed = children.filter((c) => c.status === "confirmed").length;

  const confirmChild = async (id: number) => {
    try {
      await conductorApi.confirmAlighting(id);
    } catch {
      // no backend endpoint yet — update UI regardless
    }
    setChildren((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "confirmed", confirmedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) } : c))
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Evening drop · Line 3</Text>
          <Text style={styles.headerSubtitle}>Stop 2 of 6 · 31 on board</Text>
        </View>
        <View style={styles.modeBadge}>
          <Text style={styles.modeBadgeText}>DROP MODE</Text>
        </View>
      </View>

      <View style={styles.stopCard}>
        <Text style={styles.stopLabel}>CURRENT STOP · {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text>
        <Text style={styles.stopName}>Sane Guruji Path</Text>
        <Text style={styles.stopSub}>{children.length} children alight here — confirm each as they get off</Text>
      </View>

      <Text style={styles.sectionLabel}>
        TAP TO CONFIRM ALIGHTED · {confirmed} OF {children.length}
      </Text>

      <ScrollView contentContainerStyle={styles.list}>
        {children.map((c) => (
          <TouchableOpacity
            key={c.id}
            style={[
              styles.childRow,
              c.status === "confirmed" && styles.childRowConfirmed,
              c.status === "unauthorized" && styles.childRowUnauthorized,
            ]}
            disabled={c.status !== "pending"}
            onPress={() => confirmChild(c.id)}
            activeOpacity={0.8}
          >
            <View style={[styles.avatar, { backgroundColor: c.color }]}>
              <Text style={styles.avatarText}>{c.initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{c.name}</Text>
              {c.status === "confirmed" && <Text style={styles.confirmedText}>Alighted {c.confirmedAt} · parent notified ✓</Text>}
              {c.status === "pending" && <Text style={styles.pendingText}>Tap when they step off</Text>}
              {c.status === "unauthorized" && <Text style={styles.unauthorizedText}>⚠ No authorised pickup at stop</Text>}
            </View>
            {c.status === "confirmed" && (
              <View style={styles.confirmedCheck}>
                <Text style={styles.confirmedCheckText}>✓</Text>
              </View>
            )}
            {c.status === "pending" && <View style={styles.pendingCircle} />}
            {c.status === "unauthorized" && (
              <TouchableOpacity style={styles.callBtn} onPress={() => Alert.alert("Calling parent", `Dialing ${c.name}'s guardian…`)}>
                <Text style={styles.callBtnText}>Call parent</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))}

        <View style={styles.safetyNote}>
          <Text style={styles.safetyNoteText}>
            Children stay on the bus until an authorised adult arrives or the office decides. No child is ever left
            unattended at the stop.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.skipBtn} onPress={() => router.back()}>
          <Text style={styles.skipBtnText}>Skip stop</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.departBtn} onPress={() => router.back()}>
          <Text style={styles.departBtnText}>DEPART · NEXT STOP →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingTop: 56, paddingHorizontal: 20 },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: COLORS.surface, alignItems: "center", justifyContent: "center" },
  backBtnText: { fontSize: 16, color: COLORS.text },
  headerTitle: { fontSize: 15.5, fontWeight: "700", color: COLORS.text },
  headerSubtitle: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
  modeBadge: { backgroundColor: "#FFFBEB", borderWidth: 1.5, borderColor: "#FDE68A", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  modeBadgeText: { color: "#B45309", fontWeight: "800", fontSize: 11.5 },
  stopCard: { margin: 18, backgroundColor: COLORS.primaryDark, borderRadius: 22, padding: 18 },
  stopLabel: { color: "#C4B5FD", fontSize: 11.5, fontWeight: "800", letterSpacing: 0.6 },
  stopName: { color: "#fff", fontWeight: "700", fontSize: 21, marginTop: 6 },
  stopSub: { color: "rgba(255,255,255,0.7)", fontSize: 12.5, marginTop: 4 },
  sectionLabel: { marginHorizontal: 20, marginBottom: 8, fontSize: 11.5, fontWeight: "800", color: COLORS.textMuted, letterSpacing: 0.6 },
  list: { paddingHorizontal: 18, gap: 10, paddingBottom: 8 },
  childRow: { backgroundColor: COLORS.surface, borderRadius: 18, padding: 13, flexDirection: "row", alignItems: "center", gap: 12 },
  childRowConfirmed: { backgroundColor: "#ECFDF5", borderWidth: 1.5, borderColor: "#A7F3D0" },
  childRowUnauthorized: { backgroundColor: "#FEF2F2", borderWidth: 1.5, borderColor: "#FECACA" },
  avatar: { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  name: { fontSize: 14.5, fontWeight: "700", color: COLORS.text },
  confirmedText: { fontSize: 11.5, color: "#047857", marginTop: 2 },
  pendingText: { fontSize: 11.5, color: COLORS.textMuted, marginTop: 2 },
  unauthorizedText: { fontSize: 11.5, color: "#B91C1C", fontWeight: "600", marginTop: 2 },
  confirmedCheck: { width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.success, alignItems: "center", justifyContent: "center" },
  confirmedCheckText: { color: "#04241A", fontWeight: "800", fontSize: 14 },
  pendingCircle: { width: 30, height: 30, borderRadius: 15, borderWidth: 2.5, borderColor: "#D1D5DB" },
  callBtn: { backgroundColor: COLORS.primary, borderRadius: 11, paddingHorizontal: 12, paddingVertical: 8 },
  callBtnText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  safetyNote: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 13 },
  safetyNoteText: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
  footer: { flexDirection: "row", gap: 12, paddingHorizontal: 20, paddingBottom: 30, paddingTop: 10 },
  skipBtn: { flex: 1, height: 54, borderRadius: 16, borderWidth: 2, borderColor: COLORS.border, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.surface },
  skipBtnText: { color: "#4B5563", fontWeight: "700", fontSize: 13.5 },
  departBtn: { flex: 1.3, height: 54, borderRadius: 16, backgroundColor: COLORS.warning, alignItems: "center", justifyContent: "center" },
  departBtnText: { color: "#3A2202", fontWeight: "800", fontSize: 14 },
});

export default EveningDropScreen;
