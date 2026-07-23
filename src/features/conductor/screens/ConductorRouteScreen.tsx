import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { COLORS } from "@/shared/theme/colors";
import { useAuthStore } from "@store/authStore";
import { conductorApi, RouteStop, BusRouteInfo, BusTrip } from "../api/conductorApi";
import { ROUTES } from "@/constants/route";

export const ConductorRouteScreen: React.FC = () => {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const routeId = user?.conductor_profile?.bus_route_id ?? null;

  const [loading, setLoading] = useState(true);
  const [route, setRoute] = useState<BusRouteInfo | null>(null);
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [expectedTotal, setExpectedTotal] = useState(0);
  const [activeTrip, setActiveTrip] = useState<BusTrip | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!routeId) {
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        const [routeInfo, routeStops, roster, trip] = await Promise.all([
          conductorApi.getRoute(routeId),
          conductorApi.getStops(routeId),
          conductorApi.getRoster(routeId),
          conductorApi.getActiveTrip(routeId),
        ]);
        setRoute(routeInfo);
        setStops(routeStops);
        setExpectedTotal(roster.length);
        setActiveTrip(trip);
      } catch (err) {
        console.error("Failed to load conductor route:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [routeId]);

  const goToScan = (trip: BusTrip) => {
    router.push({
      pathname: ROUTES.CONDUCTOR.SCAN,
      params: { tripId: String(trip.id), routeId: String(routeId) },
    });
  };

  const handleStartTrip = async () => {
    if (!routeId) return;
    setStarting(true);
    try {
      const hour = new Date().getHours();
      const tripType = hour < 14 ? "morning" : "evening";
      const trip = await conductorApi.startTrip(routeId, tripType);
      goToScan(trip);
    } catch (err) {
      console.error("Failed to start trip:", err);
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!routeId) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.name}>No route assigned</Text>
        <Text style={styles.meta}>Ask a School Admin to assign you to a bus route.</Text>
      </View>
    );
  }

  const conductorName = user?.first_name || user?.username || "Conductor";

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{conductorName.slice(0, 2).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{conductorName}</Text>
          <Text style={styles.meta}>Conductor · {route?.vehicle_number || "Bus"}</Text>
        </View>
        <View style={styles.onDutyBadge}>
          <Text style={styles.onDutyText}>ON DUTY</Text>
        </View>
      </View>

      <View style={styles.tripCard}>
        <Text style={styles.tripLabel}>{activeTrip ? "TRIP IN PROGRESS" : "READY TO START"}</Text>
        <Text style={styles.tripRoute}>{route?.name || "Route"}</Text>
        <View style={styles.statsRow}>
          <View>
            <Text style={styles.statValue}>{stops.length}</Text>
            <Text style={styles.statLabel}>STOPS</Text>
          </View>
          <View>
            <Text style={styles.statValue}>{expectedTotal}</Text>
            <Text style={styles.statLabel}>EXPECTED</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.startBtn} onPress={() => (activeTrip ? goToScan(activeTrip) : handleStartTrip())} disabled={starting}>
          {starting ? <ActivityIndicator color={COLORS.primaryDark} /> : <Text style={styles.startBtnText}>{activeTrip ? "RESUME TRIP" : "START TRIP"}</Text>}
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionLabel}>STOPS · EXPECTED BOARDING</Text>
      <View style={styles.stopsList}>
        {stops.map((s, idx) => (
          <View key={s.id} style={styles.stopRow}>
            <View style={styles.stopDotCol}>
              <View style={styles.stopDot} />
              {idx < stops.length - 1 && <View style={styles.stopLine} />}
            </View>
            <View style={styles.stopCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.stopName}>{s.name}</Text>
                {!!s.expected_time && <Text style={styles.stopEta}>{s.expected_time}</Text>}
              </View>
              <Text style={styles.stopCount}>{s.expected_count}</Text>
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
