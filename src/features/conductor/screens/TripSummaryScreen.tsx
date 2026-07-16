import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { COLORS } from "@/shared/theme/colors";
import { conductorApi } from "../api/conductorApi";
import { ROUTES } from "@/constants/route";

const MISSING = [
  { id: 1, name: "Vivaan Patil", initials: "VP", color: "#D97706", classSection: "Class 7-A · Stop: Sane Guruji Path" },
  { id: 2, name: "Sara Sheikh", initials: "SS", color: "#059669", classSection: "Class 5-A · Stop: Ambedkar Udyan" },
];

export const TripSummaryScreen: React.FC = () => {
  const router = useRouter();
  const boarded = 36;
  const expected = 38;
  const missing = expected - boarded;

  const handleEndTrip = async () => {
    try {
      await conductorApi.endTrip();
    } catch {
      // no backend endpoint yet — proceed regardless
    }
    Alert.alert("Trip ended", "Morning pickup trip has been closed out.", [
      { text: "OK", onPress: () => router.replace(ROUTES.CONDUCTOR.ROUTE) },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Trip summary</Text>
        <Text style={styles.subtitle}>Morning pickup · Shivaji Nagar – Line 3 · ended {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statTile, styles.statTileGood]}>
          <Text style={[styles.statValue, { color: "#047857" }]}>{boarded}</Text>
          <Text style={[styles.statLabel, { color: "#059669" }]}>BOARDED</Text>
        </View>
        <View style={styles.statTile}>
          <Text style={styles.statValue}>{expected}</Text>
          <Text style={styles.statLabel}>EXPECTED</Text>
        </View>
        <View style={[styles.statTile, styles.statTileBad]}>
          <Text style={[styles.statValue, { color: "#B91C1C" }]}>{missing}</Text>
          <Text style={[styles.statLabel, { color: "#DC2626" }]}>MISSING</Text>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.round((boarded / expected) * 100)}%` }]} />
      </View>

      <Text style={styles.sectionLabel}>MISSING · DID NOT BOARD</Text>
      <ScrollView contentContainerStyle={styles.list}>
        {MISSING.map((m) => (
          <View key={m.id} style={styles.missingCard}>
            <View style={[styles.avatar, { backgroundColor: m.color }]}>
              <Text style={styles.avatarText}>{m.initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{m.name}</Text>
              <Text style={styles.meta}>{m.classSection}</Text>
            </View>
            <TouchableOpacity style={styles.callBtn} onPress={() => Alert.alert("Calling parent", `Dialing ${m.name}'s guardian…`)}>
              <Text style={styles.callBtnText}>Call parent</Text>
            </TouchableOpacity>
          </View>
        ))}
        <View style={styles.noteBox}>
          <Text style={styles.noteText}>
            Missing students are auto-flagged to the school office and their parents receive a "did not board"
            notification.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.manifestBtn} onPress={() => Alert.alert("Manifest", "Full boarding manifest view is pending backend wiring.")}>
          <Text style={styles.manifestBtnText}>View manifest</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.endBtn} onPress={handleEndTrip}>
          <Text style={styles.endBtnText}>END TRIP ✓</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.eveningLink} onPress={() => router.push(ROUTES.CONDUCTOR.EVENING_DROP)}>
        <Text style={styles.eveningLinkText}>Preview evening drop flow →</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingTop: 56 },
  header: { paddingHorizontal: 20 },
  title: { fontSize: 21, fontWeight: "700", color: COLORS.text },
  subtitle: { fontSize: 12.5, color: COLORS.textSecondary, marginTop: 3 },
  statsRow: { flexDirection: "row", gap: 12, paddingHorizontal: 18, marginTop: 18 },
  statTile: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 20, padding: 16, alignItems: "center" },
  statTileGood: { backgroundColor: "#ECFDF5", borderWidth: 1.5, borderColor: "#A7F3D0" },
  statTileBad: { backgroundColor: "#FEF2F2", borderWidth: 1.5, borderColor: "#FECACA" },
  statValue: { fontSize: 32, fontWeight: "800", color: COLORS.text },
  statLabel: { fontSize: 10.5, fontWeight: "800", color: COLORS.textMuted, letterSpacing: 0.5, marginTop: 2 },
  progressTrack: { marginHorizontal: 18, marginTop: 16, height: 10, borderRadius: 5, backgroundColor: COLORS.surfaceDark, overflow: "hidden" },
  progressFill: { height: 10, backgroundColor: COLORS.success },
  sectionLabel: { marginHorizontal: 20, marginTop: 20, marginBottom: 8, fontSize: 11.5, fontWeight: "800", color: "#B91C1C", letterSpacing: 0.6 },
  list: { paddingHorizontal: 18, gap: 11, paddingBottom: 10 },
  missingCard: { backgroundColor: COLORS.surface, borderRadius: 20, padding: 15, flexDirection: "row", alignItems: "center", gap: 13 },
  avatar: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  name: { fontSize: 15, fontWeight: "700", color: COLORS.text },
  meta: { fontSize: 11.5, color: COLORS.textSecondary, marginTop: 2 },
  callBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 9 },
  callBtnText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  noteBox: { backgroundColor: "#F5F3FF", borderRadius: 16, padding: 14 },
  noteText: { fontSize: 12, color: "#5B21B6", lineHeight: 18 },
  footer: { flexDirection: "row", gap: 12, paddingHorizontal: 20, paddingBottom: 30, paddingTop: 6 },
  manifestBtn: { flex: 1, height: 54, borderRadius: 16, borderWidth: 2, borderColor: COLORS.border, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.surface },
  manifestBtnText: { color: "#4B5563", fontWeight: "700", fontSize: 13.5 },
  endBtn: { flex: 1.3, height: 54, borderRadius: 16, backgroundColor: COLORS.success, alignItems: "center", justifyContent: "center" },
  endBtnText: { color: "#04241A", fontWeight: "800", fontSize: 14.5 },
  eveningLink: { alignItems: "center", paddingBottom: 20 },
  eveningLinkText: { color: COLORS.textMuted, fontSize: 12, fontWeight: "600" },
});

export default TripSummaryScreen;
