import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { COLORS } from "@/shared/theme/colors";
import { BusMap, BusMapStop } from "@/features/bus/components/BusMap";
import { useAuthStore } from "@store/authStore";
import { buildUrl } from "@services/api/buildUrl";

/**
 * Live bus map. Stop list is still mock data (no per-route stop endpoint
 * wired up here yet) but the WebSocket now actually subscribes: the
 * consumer (school_app/consumers/bus_tracking.py) only starts pushing
 * `bus_location_update` events to this connection once it receives a
 * `{action: "track_route", route_id}` message — connecting alone puts you
 * in no group at all.
 */
const MOCK_STOPS: BusMapStop[] = [
  { name: "Datta Chowk", lat: 18.5304, lng: 73.8467 },
  { name: "Sane Guruji Path", lat: 18.5256, lng: 73.8520 },
  { name: "Vasant Vihar Gate", lat: 18.5204, lng: 73.8567 },
];

export const BusTrackingScreen: React.FC = () => {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const schoolSchema = useAuthStore((state) => state.schoolSchema);
  const students = useAuthStore((state) => state.students);
  const activeStudentId = useAuthStore((state) => state.activeStudentId);
  const routeId = students.find((s) => s.id === activeStudentId)?.bus_route ?? null;

  const [liveLocation, setLiveLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!routeId) {
      setTrackingError("This child isn't assigned to a bus route yet.");
      return;
    }
    try {
      const httpUrl = buildUrl(`ws/bus-tracking/`);
      const wsUrl = httpUrl.replace(/^http/, "ws");
      // React Native's WebSocket (unlike a browser's) accepts a headers
      // option, so the bearer token doesn't have to ride in the URL where
      // it would land in server/proxy access logs. The TS DOM lib's
      // WebSocket type doesn't declare this RN-only 3-arg overload.
      // @ts-expect-error RN WebSocket supports a third {headers} options arg not in the TS lib types
      const ws = new WebSocket(wsUrl, undefined, {
        headers: {
          Authorization: `Bearer ${token}`,
          ...(schoolSchema ? { "X-Tenant": schoolSchema } : {}),
        },
      });
      ws.onopen = () => {
        ws.send(JSON.stringify({ action: "track_route", route_id: routeId }));
      };
      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === "bus_location_update") {
            setLiveLocation({ lat: data.lat, lng: data.lng });
          } else if (data.type === "track_route_denied") {
            setTrackingError(data.message || "You aren't authorized to track this bus route.");
          } else if (data.type === "track_route_ack") {
            setTrackingError(null);
          }
        } catch (err) {
          console.error("[WS Parent] Parse error:", err);
        }
      };
      ws.onerror = (e) => console.error("[WS Parent] error:", e);
      socketRef.current = ws;
    } catch (err) {
      console.error("[WS Parent] setup error:", err);
    }
    return () => socketRef.current?.close();
  }, [token, schoolSchema, routeId]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={styles.liveChip}>
          <View style={styles.liveDot} />
          <Text style={styles.liveChipText}>Bus 07 · Line 3</Text>
        </View>
      </View>

      {trackingError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{trackingError}</Text>
        </View>
      )}

      <BusMap stops={MOCK_STOPS} busLocation={liveLocation ?? MOCK_STOPS[1]} height={340} />

      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <View style={styles.etaRow}>
          <Text style={styles.etaTitle}>2 stops away</Text>
          <Text style={styles.etaSub}>
            ETA <Text style={styles.etaValue}>7 min</Text>
          </Text>
        </View>

        <View style={styles.timeline}>
          {MOCK_STOPS.map((s, idx) => {
            const isCurrent = idx === 0;
            const isLast = idx === MOCK_STOPS.length - 1;
            return (
              <View key={s.name} style={styles.timelineRow}>
                <View style={styles.timelineDotCol}>
                  <View style={[styles.timelineDot, isCurrent && styles.timelineDotActive, isLast && styles.timelineDotFinal]} />
                  {!isLast && <View style={styles.timelineLine} />}
                </View>
                <View style={{ flex: 1, paddingBottom: isLast ? 0 : 14 }}>
                  <Text style={[styles.stopName, isLast && styles.stopNameFinal]}>
                    {s.name} {isCurrent ? "· BUS HERE" : isLast ? "· your stop" : ""}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EAF0EA" },
  header: { position: "absolute", top: 56, left: 16, right: 16, zIndex: 5, flexDirection: "row", alignItems: "center", gap: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  backBtnText: { fontSize: 17, color: COLORS.text },
  liveChip: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#fff", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 9 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#22D3EE" },
  liveChipText: { fontSize: 12.5, fontWeight: "700", color: COLORS.text },
  errorBanner: { position: "absolute", top: 110, left: 16, right: 16, zIndex: 5, backgroundColor: "#FEF2F2", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 },
  errorBannerText: { fontSize: 12.5, fontWeight: "600", color: COLORS.error },
  sheet: { flex: 1, backgroundColor: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -24, padding: 20 },
  sheetHandle: { width: 44, height: 5, borderRadius: 3, backgroundColor: COLORS.border, alignSelf: "center", marginBottom: 14 },
  etaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  etaTitle: { fontSize: 17, fontWeight: "700", color: COLORS.text },
  etaSub: { fontSize: 13, color: COLORS.textSecondary },
  etaValue: { color: "#047857", fontWeight: "700" },
  timeline: { marginTop: 16 },
  timelineRow: { flexDirection: "row", gap: 14 },
  timelineDotCol: { alignItems: "center" },
  timelineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.primary, marginTop: 3 },
  timelineDotActive: { backgroundColor: COLORS.primary },
  timelineDotFinal: { backgroundColor: "#fff", borderWidth: 3.5, borderColor: COLORS.success },
  timelineLine: { width: 2.5, flex: 1, backgroundColor: COLORS.primary, minHeight: 20 },
  stopName: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  stopNameFinal: { color: "#065F46", fontWeight: "700" },
});

export default BusTrackingScreen;
