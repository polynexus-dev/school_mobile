import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { ScreenWrapper } from "@/shared/ui/ScreenWrapper";
import { COLORS } from "@/shared/theme/colors";

/**
 * Correction-request approvals — SCAFFOLD ONLY.
 * TODO(follow-up): the REST contract given for this pass has no
 * /api/attendance-corrections/ endpoint yet (see backend plan's
 * AttendanceCorrectionRequest model). This screen lays out the design's
 * approve/reject/system-check UX against mock data so the real wiring is a
 * drop-in swap once that endpoint ships.
 */
interface CorrectionRequest {
  id: number;
  studentName: string;
  initials: string;
  color: string;
  classSection: string;
  when: string;
  date: string;
  period: string;
  note: string;
  systemCheck?: string;
  status: "pending" | "approved" | "rejected";
}

const MOCK: CorrectionRequest[] = [
  {
    id: 1,
    studentName: "Mira Kulkarni",
    initials: "MK",
    color: "#0891B2",
    classSection: "7-A · Roll 19",
    when: "10 min ago",
    date: "Mon, 13 Jul",
    period: "Period 1",
    note: "She was present — reached late at 8:25 due to bus breakdown.",
    systemCheck: "System check: gate camera logged entry at 8:24 AM",
    status: "pending",
  },
  {
    id: 2,
    studentName: "Vivaan Patil",
    initials: "VP",
    color: "#D97706",
    classSection: "7-A · Roll 27",
    when: "1h ago",
    date: "Fri, 10 Jul",
    period: "Period 1",
    note: "Attended till lunch, left early for a dental appointment.",
    status: "pending",
  },
];

export const CorrectionsScreen: React.FC = () => {
  const [requests, setRequests] = useState<CorrectionRequest[]>(MOCK);

  const resolve = (id: number, status: "approved" | "rejected") => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <ScreenWrapper
      title="Correction requests"
      showHeader
      showBack
      scrollable
      right={
        <View style={styles.pendingBadge}>
          <Text style={styles.pendingBadgeText}>{pendingCount} pending</Text>
        </View>
      }
      contentContainerStyle={styles.content}
    >
      {requests.map((r) => (
        <View key={r.id} style={[styles.card, r.status !== "pending" && styles.cardResolved]}>
          <View style={styles.cardHeader}>
            <View style={[styles.avatar, { backgroundColor: r.color }]}>
              <Text style={styles.avatarText}>{r.initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{r.studentName}</Text>
              <Text style={styles.meta}>{r.classSection}</Text>
            </View>
            <Text style={styles.when}>{r.when}</Text>
          </View>

          <View style={styles.noteBox}>
            <Text style={styles.noteText}>
              Marked <Text style={styles.bold}>Absent</Text> on <Text style={styles.bold}>{r.date} ({r.period})</Text>.
              Parent says: <Text style={styles.italic}>"{r.note}"</Text>
            </Text>
          </View>

          {r.systemCheck && (
            <View style={styles.systemCheck}>
              <View style={styles.systemDot} />
              <Text style={styles.systemCheckText}>{r.systemCheck}</Text>
            </View>
          )}

          {r.status === "pending" ? (
            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.rejectBtn} onPress={() => resolve(r.id, "rejected")}>
                <Text style={styles.rejectBtnText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.approveBtn} onPress={() => resolve(r.id, "approved")}>
                <Text style={styles.approveBtnText}>Approve → Present</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={[styles.resolvedText, r.status === "approved" ? styles.approvedText : styles.rejectedText]}>
              {r.status === "approved" ? "✓ Approved" : "✕ Rejected"}
            </Text>
          )}
        </View>
      ))}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 30, gap: 12 },
  pendingBadge: { backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FECACA", borderRadius: 999, paddingHorizontal: 11, paddingVertical: 4 },
  pendingBadgeText: { color: "#B91C1C", fontSize: 12, fontWeight: "700" },
  card: { backgroundColor: COLORS.surface, borderRadius: 20, padding: 18, shadowColor: "#1C0A4A", shadowOpacity: 0.06, shadowRadius: 14 },
  cardResolved: { opacity: 0.7 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  name: { fontSize: 14.5, fontWeight: "600", color: COLORS.text },
  meta: { fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
  when: { fontSize: 11, color: COLORS.textMuted },
  noteBox: { marginTop: 12, backgroundColor: COLORS.background, borderRadius: 14, padding: 13 },
  noteText: { fontSize: 12.5, color: "#4B5563", lineHeight: 19 },
  bold: { fontWeight: "700", color: "#B91C1C" },
  italic: { fontStyle: "italic" },
  systemCheck: { marginTop: 9, flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: "#ECFEFF", borderRadius: 10, padding: 10 },
  systemDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#06B6D4" },
  systemCheckText: { fontSize: 11.5, color: "#0E7490", flex: 1 },
  actionsRow: { marginTop: 13, flexDirection: "row", gap: 10 },
  rejectBtn: { flex: 1, height: 44, borderRadius: 13, borderWidth: 1.5, borderColor: COLORS.border, alignItems: "center", justifyContent: "center" },
  rejectBtnText: { color: COLORS.textSecondary, fontWeight: "600", fontSize: 13.5 },
  approveBtn: { flex: 1, height: 44, borderRadius: 13, backgroundColor: "#10B981", alignItems: "center", justifyContent: "center" },
  approveBtnText: { color: "#fff", fontWeight: "700", fontSize: 13.5 },
  resolvedText: { marginTop: 12, fontSize: 13, fontWeight: "700" },
  approvedText: { color: COLORS.success },
  rejectedText: { color: COLORS.error },
});

export default CorrectionsScreen;
