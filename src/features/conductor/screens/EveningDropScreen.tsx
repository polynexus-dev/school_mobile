import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { COLORS } from "@/shared/theme/colors";
import { conductorApi, RosterStudent, BoardingScan, AlightingConfirmation } from "../api/conductorApi";

interface DropChild {
  id: number;
  name: string;
  classSection: string;
  status: "pending" | "confirmed";
  confirmedAt?: string;
}

const initialsOf = (name: string) =>
  name.split(" ").filter(Boolean).map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";

export const EveningDropScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ tripId?: string; routeId?: string }>();
  const tripId = Number(params.tripId);
  const routeId = Number(params.routeId);

  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<DropChild[]>([]);
  const [activeChildId, setActiveChildId] = useState<number | null>(null);
  const [receiverName, setReceiverName] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!tripId || !routeId) {
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        const [roster, scans, confirmations] = await Promise.all([
          conductorApi.getRoster(routeId),
          conductorApi.getBoardingScans(tripId),
          conductorApi.getAlightingConfirmations(tripId),
        ]);
        const boardedIds = new Set(scans.map((s: BoardingScan) => s.student));
        const confirmedMap = new Map(confirmations.map((c: AlightingConfirmation) => [c.student, c]));
        const boardedRoster: RosterStudent[] = roster.filter((r) => boardedIds.has(r.id));
        setChildren(
          boardedRoster.map((r) => {
            const confirmation = confirmedMap.get(r.id);
            return {
              id: r.id,
              name: r.full_name || r.name || `Student #${r.id}`,
              classSection: r.class_section_name || "",
              status: confirmation ? "confirmed" : "pending",
              confirmedAt: confirmation ? new Date(confirmation.confirmed_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : undefined,
            };
          })
        );
      } catch (err) {
        console.error("Failed to load evening drop roster:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tripId, routeId]);

  const confirmed = children.filter((c) => c.status === "confirmed").length;

  const startConfirm = (id: number) => {
    setActiveChildId(id);
    setReceiverName("");
    setError("");
  };

  const submitConfirm = async () => {
    if (!activeChildId) return;
    if (!receiverName.trim()) {
      setError("Enter who received this child.");
      return;
    }
    setConfirming(true);
    setError("");
    const result = await conductorApi.confirmAlighting(activeChildId, tripId, receiverName.trim());
    setConfirming(false);
    if ("confirmation" in result) {
      setChildren((prev) =>
        prev.map((c) =>
          c.id === activeChildId
            ? { ...c, status: "confirmed", confirmedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }
            : c
        )
      );
      setActiveChildId(null);
    } else {
      setError(result.error.error);
    }
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
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Evening drop-off</Text>
          <Text style={styles.headerSubtitle}>{confirmed} of {children.length} confirmed alighted</Text>
        </View>
        <View style={styles.modeBadge}>
          <Text style={styles.modeBadgeText}>DROP MODE</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {children.map((c) => (
          <View key={c.id}>
            <TouchableOpacity
              style={[styles.childRow, c.status === "confirmed" && styles.childRowConfirmed]}
              disabled={c.status !== "pending"}
              onPress={() => startConfirm(c.id)}
              activeOpacity={0.8}
            >
              <View style={[styles.avatar, { backgroundColor: c.status === "confirmed" ? "#059669" : "#7C3AED" }]}>
                <Text style={styles.avatarText}>{initialsOf(c.name)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{c.name}</Text>
                {c.status === "confirmed" ? (
                  <Text style={styles.confirmedText}>Alighted {c.confirmedAt} · parent notified ✓</Text>
                ) : (
                  <Text style={styles.pendingText}>Tap to confirm receiving adult</Text>
                )}
              </View>
              {c.status === "confirmed" && (
                <View style={styles.confirmedCheck}>
                  <Text style={styles.confirmedCheckText}>✓</Text>
                </View>
              )}
              {c.status === "pending" && <View style={styles.pendingCircle} />}
            </TouchableOpacity>

            {activeChildId === c.id && (
              <View style={styles.confirmBox}>
                <Text style={styles.confirmLabel}>Received by (name) — required, this child stays on the bus otherwise</Text>
                <TextInput
                  value={receiverName}
                  onChangeText={setReceiverName}
                  placeholder="e.g. Mother, Priya Sharma"
                  style={styles.confirmInput}
                  autoFocus
                />
                {!!error && <Text style={styles.confirmError}>{error}</Text>}
                <View style={styles.confirmActions}>
                  <TouchableOpacity style={styles.confirmCancelBtn} onPress={() => setActiveChildId(null)}>
                    <Text style={styles.confirmCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.confirmSubmitBtn} onPress={submitConfirm} disabled={confirming}>
                    {confirming ? <ActivityIndicator color="#04241A" /> : <Text style={styles.confirmSubmitText}>Confirm alighted</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        ))}

        {children.length === 0 && (
          <View style={styles.noteBox}>
            <Text style={styles.noteText}>No boarded students to drop off yet.</Text>
          </View>
        )}

        <View style={styles.safetyNote}>
          <Text style={styles.safetyNoteText}>
            Children stay on the bus until an authorized adult is confirmed. No child is ever left unattended.
          </Text>
        </View>
      </ScrollView>
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
  list: { paddingHorizontal: 18, gap: 10, paddingTop: 18, paddingBottom: 30 },
  childRow: { backgroundColor: COLORS.surface, borderRadius: 18, padding: 13, flexDirection: "row", alignItems: "center", gap: 12 },
  childRowConfirmed: { backgroundColor: "#ECFDF5", borderWidth: 1.5, borderColor: "#A7F3D0" },
  avatar: { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  name: { fontSize: 14.5, fontWeight: "700", color: COLORS.text },
  confirmedText: { fontSize: 11.5, color: "#047857", marginTop: 2 },
  pendingText: { fontSize: 11.5, color: COLORS.textMuted, marginTop: 2 },
  confirmedCheck: { width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.success, alignItems: "center", justifyContent: "center" },
  confirmedCheckText: { color: "#04241A", fontWeight: "800", fontSize: 14 },
  pendingCircle: { width: 30, height: 30, borderRadius: 15, borderWidth: 2.5, borderColor: "#D1D5DB" },
  confirmBox: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 14, marginTop: -4, marginBottom: 4, borderWidth: 1.5, borderColor: COLORS.primary },
  confirmLabel: { fontSize: 11.5, color: COLORS.textSecondary, marginBottom: 8, lineHeight: 16 },
  confirmInput: { height: 44, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border, paddingHorizontal: 12, fontSize: 14, color: COLORS.text, backgroundColor: "#fff" },
  confirmError: { color: "#B91C1C", fontSize: 11.5, marginTop: 6, fontWeight: "600" },
  confirmActions: { flexDirection: "row", gap: 10, marginTop: 10 },
  confirmCancelBtn: { flex: 1, height: 44, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border, alignItems: "center", justifyContent: "center" },
  confirmCancelText: { color: "#4B5563", fontWeight: "700", fontSize: 13 },
  confirmSubmitBtn: { flex: 1.3, height: 44, borderRadius: 12, backgroundColor: COLORS.success, alignItems: "center", justifyContent: "center" },
  confirmSubmitText: { color: "#04241A", fontWeight: "800", fontSize: 13 },
  noteBox: { backgroundColor: "#F5F3FF", borderRadius: 16, padding: 14 },
  noteText: { fontSize: 12, color: "#5B21B6", lineHeight: 18 },
  safetyNote: { backgroundColor: COLORS.surface, borderRadius: 14, padding: 13, marginTop: 4 },
  safetyNoteText: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
});

export default EveningDropScreen;
