import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { ScreenWrapper } from "@/shared/ui/ScreenWrapper";
import { COLORS } from "@/shared/theme/colors";
import { authApi } from "@/features/auth";
import { ChildSwitcher } from "../components/ChildSwitcher";

type ConsentType = "bus_gps" | "face_recognition" | "photo_sharing";

interface ConsentToggleState {
  bus_gps: boolean;
  face_recognition: boolean;
  photo_sharing: boolean;
}

const HISTORY = [
  { label: "Bus GPS tracking granted", when: "04 Jun 2024, 6:12 PM", color: COLORS.success },
  { label: "Photo sharing withdrawn", when: "18 Mar 2026, 9:02 AM", color: COLORS.textMuted },
];

export const PrivacyConsentScreen: React.FC = () => {
  const [toggles, setToggles] = useState<ConsentToggleState>({ bus_gps: true, face_recognition: false, photo_sharing: false });
  const [busyKey, setBusyKey] = useState<ConsentType | null>(null);

  const handleToggle = async (key: ConsentType) => {
    const nextValue = !toggles[key];
    setBusyKey(key);
    try {
      if (nextValue) {
        await authApi.grantConsent();
      } else {
        await authApi.withdrawConsent(key);
      }
      setToggles((prev) => ({ ...prev, [key]: nextValue }));
    } catch (err: any) {
      Alert.alert("Couldn't update consent", err.message || "Please try again.");
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <ScreenWrapper title="Privacy & consent" showHeader showBack scrollable right={<ChildSwitcher />} contentContainerStyle={styles.content}>
      <View style={styles.bannerCard}>
        <Text style={styles.bannerLabel}>YOUR DATA, YOUR CHOICE</Text>
        <Text style={styles.bannerText}>
          Consents are recorded under the DPDP Act 2023. Withdrawing an optional consent takes effect immediately.
        </Text>
      </View>

      <View style={styles.card}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>App notifications & academic records</Text>
          <Text style={styles.subtitle}>Needed for the app to work.</Text>
        </View>
        <View style={styles.requiredBadge}>
          <Text style={styles.requiredBadgeText}>REQUIRED</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Bus GPS tracking & boarding alerts</Text>
          <Text style={styles.subtitle}>Live bus location, boarded / alighted notifications.</Text>
        </View>
        {busyKey === "bus_gps" ? (
          <ActivityIndicator color={COLORS.primary} />
        ) : (
          <Switch value={toggles.bus_gps} onPress={() => handleToggle("bus_gps")} />
        )}
      </View>

      <View style={[styles.card, styles.cardHighlighted, { flexDirection: "column", alignItems: "stretch" }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Face recognition for attendance</Text>
            <Text style={styles.subtitle}>Lets the class teacher mark this child present via camera roll-call.</Text>
          </View>
          {busyKey === "face_recognition" ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <Switch value={toggles.face_recognition} onPress={() => handleToggle("face_recognition")} />
          )}
        </View>
        <View style={styles.explainerBox}>
          <Text style={styles.explainerText}>
            Face data is encrypted, stored only by the school, and deleted within 24h if you switch this off. Until
            granted, attendance is marked by manual roll-call.
          </Text>
        </View>
        {!toggles.face_recognition && (
          <TouchableOpacity style={styles.grantBtn} onPress={() => handleToggle("face_recognition")}>
            <Text style={styles.grantBtnText}>Grant face consent</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.card}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Photos in school announcements</Text>
          <Text style={styles.subtitle}>Event photos that include your child may be shared with other parents.</Text>
        </View>
        {busyKey === "photo_sharing" ? (
          <ActivityIndicator color={COLORS.primary} />
        ) : (
          <Switch value={toggles.photo_sharing} onPress={() => handleToggle("photo_sharing")} />
        )}
      </View>

      <Text style={styles.historyLabel}>CONSENT HISTORY</Text>
      {HISTORY.map((h) => (
        <View key={h.label} style={styles.historyRow}>
          <View style={[styles.historyDot, { backgroundColor: h.color }]} />
          <Text style={styles.historyText}>
            {h.label} · {h.when}
          </Text>
        </View>
      ))}

      <Text style={styles.footNote}>
        Request a copy of your data or full deletion from{"\n"}
        <Text style={styles.bold}>Settings → Data rights</Text>
      </Text>
    </ScreenWrapper>
  );
};

const Switch: React.FC<{ value: boolean; onPress: () => void }> = ({ value, onPress }) => (
  <TouchableOpacity style={[styles.toggleTrack, value && styles.toggleTrackOn]} onPress={onPress}>
    <View style={[styles.toggleThumb, value && styles.toggleThumbOn]} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 30, gap: 10 },
  bannerCard: { backgroundColor: COLORS.primaryDark, borderRadius: 18, padding: 14 },
  bannerLabel: { color: "#C4B5FD", fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
  bannerText: { color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 5, lineHeight: 17 },
  card: { backgroundColor: COLORS.surface, borderRadius: 18, padding: 15, flexDirection: "row", alignItems: "center", gap: 14, borderWidth: 1, borderColor: COLORS.border },
  cardHighlighted: { borderWidth: 1.5, borderColor: COLORS.primary },
  title: { fontSize: 13.5, fontWeight: "700", color: COLORS.text },
  subtitle: { fontSize: 11.5, color: COLORS.textSecondary, marginTop: 3, lineHeight: 16 },
  requiredBadge: { backgroundColor: "#F5F3FF", borderRadius: 9, paddingHorizontal: 9, paddingVertical: 5 },
  requiredBadgeText: { fontSize: 10, fontWeight: "800", color: COLORS.primary },
  explainerBox: { marginTop: 10, backgroundColor: "#F5F3FF", borderRadius: 12, padding: 11 },
  explainerText: { fontSize: 11.5, color: "#4C1D95", lineHeight: 17 },
  grantBtn: { marginTop: 10, height: 44, borderRadius: 13, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
  grantBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  toggleTrack: { width: 46, height: 27, borderRadius: 15, backgroundColor: COLORS.border },
  toggleTrackOn: { backgroundColor: COLORS.success },
  toggleThumb: { width: 21, height: 21, borderRadius: 11, backgroundColor: "#fff", margin: 3 },
  toggleThumbOn: { alignSelf: "flex-end" },
  historyLabel: { fontSize: 11, fontWeight: "800", color: COLORS.textMuted, letterSpacing: 0.5, marginTop: 8 },
  historyRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  historyDot: { width: 7, height: 7, borderRadius: 4 },
  historyText: { fontSize: 12, color: COLORS.textSecondary },
  footNote: { fontSize: 11.5, color: COLORS.textMuted, textAlign: "center", lineHeight: 17, marginTop: 8 },
  bold: { color: COLORS.primary, fontWeight: "700" },
});

export default PrivacyConsentScreen;
