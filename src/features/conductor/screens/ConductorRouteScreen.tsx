import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { COLORS } from "@/shared/theme/colors";
import { conductorApi, TodayRoute } from "../api/conductorApi";
import { ROUTES } from "@/constants/route";

const MOCK_ROUTE: TodayRoute = {
  conductorName: "Conductor",
  busLabel: "Bus 07",
  routeName: "Shivaji Nagar – Line 3",
  pickupLabel: "MORNING PICKUP · 7:30 AM",
  expectedTotal: 38,
  boardedTotal: 0,
  stops: [
    { name: "Datta Chowk", eta: "7:40 AM", expected: 9, boarded: 0 },
    { name: "Sane Guruji Path", eta: "7:45 AM", expected: 7, boarded: 0 },
    { name: "Vasant Vihar Gate", eta: "7:48 AM", expected: 11, boarded: 0 },
    { name: "Ambedkar Udyan", eta: "7:53 AM", expected: 6, boarded: 0 },
  ],
};

export const ConductorRouteScreen: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [route, setRoute] = useState<TodayRoute>(MOCK_ROUTE);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    conductorApi
      .getTodayRoute()
      .then(setRoute)
      .catch(() => setRoute(MOCK_ROUTE)) // no backend endpoint yet — fall back to mock
      .finally(() => setLoading(false));
  }, []);

  const handleStartTrip = async () => {
    setStarting(true);
    try {
      await conductorApi.startTrip();
    } catch {
      // no backend endpoint yet — proceed with the scan flow regardless
    } finally {
      setStarting(false);
      router.push(ROUTES.CONDUCTOR.SCAN);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{route.conductorName.slice(0, 2).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{route.conductorName}</Text>
          <Text style={styles.meta}>Conductor · {route.busLabel}</Text>
        </View>
        <View style={styles.onDutyBadge}>
          <Text style={styles.onDutyText}>ON DUTY</Text>
        </View>
      </View>

      <View style={styles.tripCard}>
        <Text style={styles.tripLabel}>{route.pickupLabel}</Text>
        <Text style={styles.tripRoute}>{route.routeName}</Text>
        <View style={styles.statsRow}>
          <View>
            <Text style={styles.statValue}>{route.stops.length}</Text>
            <Text style={styles.statLabel}>STOPS</Text>
          </View>
          <View>
            <Text style={styles.statValue}>{route.expectedTotal}</Text>
            <Text style={styles.statLabel}>EXPECTED</Text>
          </View>
          <View>
            <Text style={[styles.statValue, { color: "#6EE7B7" }]}>{route.boardedTotal}</Text>
            <Text style={styles.statLabel}>BOARDED</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.startBtn} onPress={handleStartTrip} disabled={starting}>
          {starting ? <ActivityIndicator color={COLORS.primaryDark} /> : <Text style={styles.startBtnText}>START TRIP</Text>}
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionLabel}>STOPS · EXPECTED BOARDING</Text>
      <View style={styles.stopsList}>
        {route.stops.map((s, idx) => (
          <View key={s.name} style={styles.stopRow}>
            <View style={styles.stopDotCol}>
              <View style={styles.stopDot} />
              {idx < route.stops.length - 1 && <View style={styles.stopLine} />}
            </View>
            <View style={styles.stopCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.stopName}>{s.name}</Text>
                <Text style={styles.stopEta}>{s.eta}</Text>
              </View>
              <Text style={styles.stopCount}>{s.expected}</Text>
              <Text style={styles.stopCountLabel}>KIDS</Text>
            </View>
          </View>
        ))}
        <View style={styles.stopRow}>
          <View style={styles.stopDotCol}>
            <View style={styles.stopDotFinal} />
          </View>
          <View style={styles.schoolCard}>
            <Text style={styles.schoolName}>School</Text>
            <Text style={styles.schoolMeta}>Arrive · drop all</Text>
          </View>
        </View>
      </View>

      <View style={styles.gpsNote}>
        <View style={styles.gpsDot} />
        <Text style={styles.gpsNoteText}>GPS live · parents see this bus in real time once the trip starts</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingTop: 56, paddingHorizontal: 20 },
  center: { flex: 1, backgroundColor: COLORS.background, alignItems: "center", justifyContent: "center" },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 46, height: 46, borderRadius: 14, backgroundColor: COLORS.secondary, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  name: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  meta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 1 },
  onDutyBadge: { backgroundColor: "#ECFDF5", borderWidth: 1.5, borderColor: "#A7F3D0", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 7 },
  onDutyText: { color: "#047857", fontWeight: "800", fontSize: 11.5 },
  tripCard: { marginTop: 16, backgroundColor: COLORS.primaryDark, borderRadius: 22, padding: 20 },
  tripLabel: { color: "#C4B5FD", fontSize: 11.5, fontWeight: "800", letterSpacing: 0.6 },
  tripRoute: { color: "#fff", fontWeight: "700", fontSize: 21, marginTop: 6 },
  statsRow: { flexDirection: "row", gap: 22, marginTop: 14 },
  statValue: { color: "#fff", fontWeight: "800", fontSize: 22 },
  statLabel: { color: "rgba(255,255,255,0.6)", fontSize: 10.5, fontWeight: "700" },
  startBtn: { marginTop: 16, height: 52, borderRadius: 14, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  startBtnText: { color: COLORS.primaryDark, fontWeight: "800", fontSize: 15, letterSpacing: 0.4 },
  sectionLabel: { marginTop: 20, marginBottom: 8, fontSize: 11.5, fontWeight: "800", color: COLORS.textMuted, letterSpacing: 0.6 },
  stopsList: { gap: 0 },
  stopRow: { flexDirection: "row", gap: 14 },
  stopDotCol: { alignItems: "center", paddingTop: 4 },
  stopDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: COLORS.primary },
  stopDotFinal: { width: 16, height: 16, borderRadius: 8, borderWidth: 4, borderColor: COLORS.success, backgroundColor: "#fff" },
  stopLine: { width: 3, flex: 1, backgroundColor: "#DDD6FE", minHeight: 20 },
  stopCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 18, padding: 14, marginBottom: 10, flexDirection: "row", alignItems: "center", gap: 8 },
  stopName: { fontSize: 15, fontWeight: "700", color: COLORS.text },
  stopEta: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  stopCount: { fontSize: 20, fontWeight: "800", color: COLORS.primaryDark },
  stopCountLabel: { fontSize: 10, fontWeight: "700", color: COLORS.textMuted, marginLeft: 4 },
  schoolCard: { flex: 1, backgroundColor: "#ECFDF5", borderWidth: 1, borderColor: "#A7F3D0", borderRadius: 18, padding: 14, marginBottom: 10 },
  schoolName: { fontSize: 15, fontWeight: "700", color: "#047857" },
  schoolMeta: { fontSize: 12, color: "#059669", marginTop: 2 },
  gpsNote: { marginTop: 4, marginBottom: 24, backgroundColor: COLORS.surface, borderRadius: 14, padding: 13, flexDirection: "row", alignItems: "center", gap: 10 },
  gpsDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#22D3EE" },
  gpsNoteText: { flex: 1, fontSize: 11.5, color: COLORS.textSecondary },
});

export default ConductorRouteScreen;
