import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { ScreenWrapper } from "@/shared/ui/ScreenWrapper";
import { COLORS } from "@/shared/theme/colors";

/**
 * Geofence alert history — SCAFFOLD, mock data. No bus-GPS/boarding-event
 * endpoint in this pass's contract yet; swap MOCK_ALERTS for a real feed
 * once /api/bus/... ships.
 */
interface Alert {
  id: number;
  icon: string;
  color: string;
  title: string;
  subtitle: string;
  when: string;
  group: string;
}

const MOCK_ALERTS: Alert[] = [
  { id: 1, icon: "✓", color: "#10B981", title: "Aarav boarded at 7:42 AM", subtitle: "Scanned at Datta Chowk · Conductor: R. Pawar", when: "now", group: "TODAY · MORNING TRIP" },
  { id: 2, icon: "●", color: "#6D28D9", title: "Bus arriving at your stop in 5 min", subtitle: "Vasant Vihar Gate · ETA 7:48 AM", when: "7:43", group: "TODAY · MORNING TRIP" },
  { id: 3, icon: "▮", color: "#0891B2", title: "Trip started · Bus 07 left depot", subtitle: "First pickup: Datta Chowk 7:40 AM", when: "7:28", group: "TODAY · MORNING TRIP" },
  { id: 4, icon: "✓", color: "#10B981", title: "Aarav dropped at Vasant Vihar Gate", subtitle: "3:52 PM · Trip completed", when: "Mon", group: "YESTERDAY · AFTERNOON TRIP" },
];

export const BusAlertsScreen: React.FC = () => {
  let lastGroup = "";

  return (
    <ScreenWrapper title="Bus alerts" showHeader showBack scrollable contentContainerStyle={styles.content}>
      <Text style={styles.subtitle}>Geofence notifications for the selected child's route.</Text>

      {MOCK_ALERTS.map((a) => {
        const showGroup = a.group !== lastGroup;
        lastGroup = a.group;
        return (
          <React.Fragment key={a.id}>
            {showGroup && <Text style={styles.groupLabel}>{a.group}</Text>}
            <View style={[styles.card, { borderLeftColor: a.color }]}>
              <View style={[styles.iconCircle, { backgroundColor: `${a.color}22` }]}>
                <Text style={[styles.iconText, { color: a.color }]}>{a.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{a.title}</Text>
                <Text style={styles.subtitleText}>{a.subtitle}</Text>
              </View>
              <Text style={styles.when}>{a.when}</Text>
            </View>
          </React.Fragment>
        );
      })}

      <TouchableOpacity style={styles.settingsCard}>
        <View style={styles.settingsIcon}>
          <Text style={{ fontSize: 16 }}>📍</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.settingsTitle}>Alert radius: 500 m before your stop</Text>
          <Text style={styles.settingsSubtitle}>Change in notification settings</Text>
        </View>
      </TouchableOpacity>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 30, gap: 10 },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 4 },
  groupLabel: { fontSize: 11, fontWeight: "700", color: COLORS.textMuted, letterSpacing: 0.5, marginTop: 6, marginBottom: 2 },
  card: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 14, flexDirection: "row", gap: 12, borderLeftWidth: 4, shadowColor: "#1C0A4A", shadowOpacity: 0.05, shadowRadius: 10 },
  iconCircle: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  iconText: { fontSize: 15, fontWeight: "700" },
  title: { fontSize: 13.5, fontWeight: "600", color: COLORS.text },
  subtitleText: { fontSize: 11.5, color: COLORS.textSecondary, marginTop: 2 },
  when: { fontSize: 10.5, color: COLORS.textMuted },
  settingsCard: { marginTop: 10, backgroundColor: "#F5F3FF", borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  settingsIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  settingsTitle: { fontSize: 12.5, fontWeight: "600", color: "#3B0764" },
  settingsSubtitle: { fontSize: 11, color: "#7C3AED", marginTop: 1 },
});

export default BusAlertsScreen;
