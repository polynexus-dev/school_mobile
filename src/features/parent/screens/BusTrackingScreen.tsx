import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { COLORS } from "@/shared/theme/colors";
import { BusMap, BusMapStop } from "@/features/bus/components/BusMap";
import { useAuthStore } from "@store/authStore";
import { buildUrl } from "@services/api/buildUrl";

/**
 * Live bus map — SCAFFOLD. There is no bus-GPS endpoint in this pass's REST
 * contract yet (see backend plan's BusLocation/BusTrail models), so the stop
 * list below is mock data and the WebSocket connection is best-effort: it
 * will simply never receive a message until a `ws/bus-tracking/` consumer
 * exists on the backend, at which point this screen just starts rendering
 * live positions with no further changes needed (same pattern as
 * campusflow-mobile's StudentBusScreen).
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
  const [liveLocation, setLiveLocation] = useState<{ lat: number; lng: number } | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    try {
      const httpUrl = buildUrl(`ws/bus-tracking/?token=${token}&schema=${schoolSchema}`);
      const wsUrl = httpUrl.replace(/^http/, "ws");
      const ws = new WebSocket(wsUrl);
      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === "bus_location_update") {
            setLiveLocation({ lat: data.lat, lng: data.lng });
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
  }, [token, schoolSchema]);

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
