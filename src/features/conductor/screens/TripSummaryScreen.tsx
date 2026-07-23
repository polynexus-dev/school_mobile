import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { COLORS } from "@/shared/theme/colors";
import { conductorApi, RosterStudent, BoardingScan } from "../api/conductorApi";
import { ROUTES } from "@/constants/route";

const initialsOf = (name: string) =>
  name.split(" ").filter(Boolean).map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";

export const TripSummaryScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ tripId?: string; routeId?: string }>();
  const tripId = Number(params.tripId);
  const routeId = Number(params.routeId);

  const [loading, setLoading] = useState(true);
  const [ending, setEnding] = useState(false);
  const [roster, setRoster] = useState<RosterStudent[]>([]);
  const [scans, setScans] = useState<BoardingScan[]>([]);

  useEffect(() => {
    if (!tripId || !routeId) {
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        const [rosterRes, scansRes] = await Promise.all([
          conductorApi.getRoster(routeId),
          conductorApi.getBoardingScans(tripId),
        ]);
        setRoster(rosterRes);
        setScans(scansRes);
      } catch (err) {
        console.error("Failed to load trip summary:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tripId, routeId]);

  const boardedIds = new Set(scans.map((s) => s.student));
  const boarded = scans.length;
  const expected = roster.length;
  const missingStudents = roster.filter((r) => !boardedIds.has(r.id));

  const handleEndTrip = async () => {
    try {
      await conductorApi.endTrip(tripId);
    } catch (err) {
      console.error("Failed to end trip:", err);
    }
    Alert.alert("Trip ended", "This trip has been closed out.", [
      { text: "OK", onPress: () => router.replace(ROUTES.CONDUCTOR.ROUTE) },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.container, { alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Trip summary</Text>
        <Text style={styles.subtitle}>Ended {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text>
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
          <Text style={[styles.statValue, { color: "#B91C1C" }]}>{missingStudents.length}</Text>
          <Text style={[styles.statLabel, { color: "#DC2626" }]}>MISSING</Text>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${expected ? Math.round((boarded / expected) * 100) : 0}%` }]} />
      </View>

      <Text style={styles.sectionLabel}>MISSING · DID NOT BOARD</Text>
      <ScrollView contentContainerStyle={styles.list}>
        {missingStudents.map((m) => {
          const name = m.full_name || m.name || `Student #${m.id}`;
          return (
            <View key={m.id} style={styles.missingCard}>
              <View style={[styles.avatar, { backgroundColor: "#D97706" }]}>
                <Text style={styles.avatarText}>{initialsOf(name)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{name}</Text>
                <Text style={styles.meta}>{m.class_section_name || ""}</Text>
              </View>
            </View>
          );
        })}
        {missingStudents.length === 0 && (
          <View style={styles.noteBox}>
            <Text style={styles.noteText}>Everyone on the roster has boarded.</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.endBtn} onPress={handleEndTrip}>
          <Text style={styles.endBtnText}>END TRIP ✓</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.eveningLink}
        onPress={() => router.push({ pathname: ROUTES.CONDUCTOR.EVENING_DROP, params: { tripId: String(tripId), routeId: String(routeId) } })}
      >
        <Text style={styles.eveningLinkText}>Go to evening drop-off →</Text>
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
  noteBox: { backgroundColor: "#F5F3FF", borderRadius: 16, padding: 14 },
  noteText: { fontSize: 12, color: "#5B21B6", lineHeight: 18 },
  footer: { flexDirection: "row", gap: 12, paddingHorizontal: 20, paddingBottom: 12, paddingTop: 6 },
  endBtn: { flex: 1, height: 54, borderRadius: 16, backgroundColor: COLORS.success, alignItems: "center", justifyContent: "center" },
  endBtnText: { color: "#04241A", fontWeight: "800", fontSize: 14.5 },
  eveningLink: { alignItems: "center", paddingBottom: 20 },
  eveningLinkText: { color: COLORS.textMuted, fontSize: 12, fontWeight: "600" },
});

export default TripSummaryScreen;
