import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { COLORS } from "@/shared/theme/colors";
import { teacherApi, RosterStudent, AttendanceStatus } from "../api/teacherApi";
import { FaceRollCallCamera } from "../components/FaceRollCallCamera";

function initials(first?: string, last?: string) {
  return `${(first?.[0] ?? "").toUpperCase()}${(last?.[0] ?? "").toUpperCase()}` || "?";
}

function todayStr() {
  // toISOString() converts to UTC, which rolls over to the previous
  // calendar day during early-morning hours in IST (UTC+5:30) — attendance
  // must key off the device's local calendar day, not UTC.
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export const MarkAttendanceScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ classSectionId?: string; className?: string }>();
  const classSectionId = Number(params.classSectionId);
  const className = params.className ?? "Class";

  const [mode, setMode] = useState<"face" | "manual">("manual");
  const [loading, setLoading] = useState(true);
  const [roster, setRoster] = useState<RosterStudent[]>([]);
  const [statuses, setStatuses] = useState<Record<number, AttendanceStatus>>({});
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!classSectionId) return;
    setLoading(true);
    try {
      const [rosterData, existing] = await Promise.all([
        teacherApi.getRoster(classSectionId),
        teacherApi.getAttendanceForDate(classSectionId, todayStr()),
      ]);
      setRoster(rosterData);
      const initialStatuses: Record<number, AttendanceStatus> = {};
      rosterData.forEach((s) => {
        initialStatuses[s.id] = "present";
      });
      existing.forEach((rec) => {
        initialStatuses[rec.student] = rec.status;
      });
      setStatuses(initialStatuses);
    } catch (err: any) {
      Alert.alert("Couldn't load roster", err.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  }, [classSectionId]);

  useEffect(() => {
    load();
  }, [load]);

  const presentCount = useMemo(() => Object.values(statuses).filter((s) => s === "present").length, [statuses]);
  const absentCount = roster.length - presentCount;

  const toggle = (studentId: number) => {
    setStatuses((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === "present" ? "absent" : "present",
    }));
  };

  const markAllPresent = () => {
    const next: Record<number, AttendanceStatus> = {};
    roster.forEach((s) => (next[s.id] = "present"));
    setStatuses(next);
  };

  const doSubmit = useCallback(
    async (finalStatuses: Record<number, AttendanceStatus>) => {
      setSubmitting(true);
      try {
        const records = roster.map((s) => ({
          student: s.id,
          class_section: classSectionId,
          date: todayStr(),
          status: finalStatuses[s.id] ?? "present",
        }));
        await teacherApi.submitAttendance(records);
        Alert.alert("Attendance submitted", `${className} attendance recorded for today.`, [
          { text: "Done", onPress: () => router.back() },
        ]);
      } catch (err: any) {
        Alert.alert("Submission failed", err.message || "Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
    [roster, classSectionId, className, router]
  );

  const handleManualSubmit = () => doSubmit(statuses);

  const handleScan = (imageUri: string) => teacherApi.batchRecognizeAttendance(classSectionId, imageUri, todayStr());

  // Face-matched students are already written server-side by the batch-
  // recognition endpoint itself — this only needs to submit the (usually
  // short) subset the scan couldn't confidently match.
  const handleFinishScan = async (missingStatuses: Record<number, AttendanceStatus>) => {
    const entries = Object.entries(missingStatuses);
    if (entries.length === 0) {
      Alert.alert("Attendance recorded", `${className} attendance recorded for today.`, [{ text: "Done", onPress: () => router.back() }]);
      return;
    }
    setSubmitting(true);
    try {
      const records = entries.map(([studentId, status]) => ({
        student: Number(studentId),
        class_section: classSectionId,
        date: todayStr(),
        status,
      }));
      await teacherApi.submitAttendance(records);
      Alert.alert("Attendance recorded", `${className} attendance recorded for today.`, [{ text: "Done", onPress: () => router.back() }]);
    } catch (err: any) {
      Alert.alert("Submission failed", err.message || "Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (mode === "face") {
    return (
      <FaceRollCallCamera
        roster={roster}
        submitting={submitting}
        onCancel={() => setMode("manual")}
        onScan={handleScan}
        onFinish={handleFinishScan}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{className}</Text>
          <Text style={styles.headerSubtitle}>Today · {todayStr()}</Text>
        </View>
        <View style={styles.segmented}>
          <TouchableOpacity style={styles.segmentOff} onPress={() => setMode("face")}>
            <Text style={styles.segmentOffText}>Face</Text>
          </TouchableOpacity>
          <View style={styles.segmentOn}>
            <Text style={styles.segmentOnText}>Manual</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <>
          <View style={styles.statsRow}>
            <View style={styles.statTile}>
              <Text style={[styles.statNum, { color: "#047857" }]}>{presentCount}</Text>
              <Text style={styles.statLabel}>PRESENT</Text>
            </View>
            <View style={styles.statTile}>
              <Text style={[styles.statNum, { color: "#B91C1C" }]}>{absentCount}</Text>
              <Text style={styles.statLabel}>ABSENT</Text>
            </View>
            <TouchableOpacity style={styles.markAllTile} onPress={markAllPresent}>
              <Text style={styles.markAllText}>Mark all present</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.list}>
            {roster.map((s) => {
              const status = statuses[s.id] ?? "present";
              return (
                <View key={s.id} style={styles.rosterRow}>
                  <View style={styles.rosterAvatar}>
                    <Text style={styles.rosterAvatarText}>{initials(s.first_name, s.last_name)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rosterName}>
                      {s.first_name} {s.last_name}
                    </Text>
                    <Text style={styles.rosterRoll}>Roll {s.roll_no ?? "—"}</Text>
                  </View>
                  <View style={styles.toggleWrap}>
                    <TouchableOpacity
                      style={[styles.toggleBtn, status === "present" && styles.toggleBtnPresentOn]}
                      onPress={() => toggle(s.id)}
                    >
                      <Text style={[styles.toggleText, status === "present" && styles.toggleTextOn]}>P</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.toggleBtn, status === "absent" && styles.toggleBtnAbsentOn]}
                      onPress={() => toggle(s.id)}
                    >
                      <Text style={[styles.toggleText, status === "absent" && styles.toggleTextOn]}>A</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
            {roster.length === 0 && (
              <Text style={styles.emptyText}>No students found for this class-section.</Text>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.submitBtn} onPress={handleManualSubmit} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>
                  Submit · {presentCount}/{roster.length} present
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingTop: 56, paddingHorizontal: 20, paddingBottom: 8 },
  backBtn: {
    width: 36, height: 36, borderRadius: 12, backgroundColor: COLORS.surface, alignItems: "center", justifyContent: "center",
    shadowColor: "#1C0A4A", shadowOpacity: 0.08, shadowRadius: 8,
  },
  backBtnText: { fontSize: 16, color: COLORS.text },
  headerTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  headerSubtitle: { fontSize: 11.5, color: COLORS.textMuted, marginTop: 1 },
  segmented: { flexDirection: "row", backgroundColor: COLORS.surfaceDark, borderRadius: 12, padding: 3 },
  segmentOff: { paddingVertical: 7, paddingHorizontal: 13 },
  segmentOffText: { fontSize: 12, fontWeight: "600", color: COLORS.textSecondary },
  segmentOn: { backgroundColor: COLORS.surface, borderRadius: 9, paddingVertical: 7, paddingHorizontal: 13 },
  segmentOnText: { fontSize: 12, fontWeight: "700", color: COLORS.primaryDark },
  statsRow: { flexDirection: "row", gap: 10, paddingHorizontal: 20, marginTop: 14 },
  statTile: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 16, padding: 12, alignItems: "center" },
  statNum: { fontWeight: "700", fontSize: 19 },
  statLabel: { fontSize: 10.5, fontWeight: "700", color: COLORS.textMuted, marginTop: 2 },
  markAllTile: { flex: 2, backgroundColor: "#F5F3FF", borderWidth: 1.5, borderColor: "#DDD6FE", borderRadius: 16, alignItems: "center", justifyContent: "center" },
  markAllText: { fontSize: 12.5, fontWeight: "700", color: "#5B21B6" },
  list: { padding: 18, paddingBottom: 20, gap: 9 },
  emptyText: { textAlign: "center", color: COLORS.textMuted, marginTop: 30 },
  rosterRow: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 12, flexDirection: "row", alignItems: "center", gap: 12 },
  rosterAvatar: { width: 38, height: 38, borderRadius: 12, backgroundColor: COLORS.secondary, alignItems: "center", justifyContent: "center" },
  rosterAvatarText: { color: COLORS.white, fontWeight: "700", fontSize: 13 },
  rosterName: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  rosterRoll: { fontSize: 11.5, color: COLORS.textMuted, marginTop: 1 },
  toggleWrap: { flexDirection: "row", backgroundColor: COLORS.surfaceDark, borderRadius: 12, padding: 3, gap: 2 },
  toggleBtn: { borderRadius: 9, paddingVertical: 7, paddingHorizontal: 14 },
  toggleBtnPresentOn: { backgroundColor: "#10B981" },
  toggleBtnAbsentOn: { backgroundColor: "#EF4444" },
  toggleText: { fontSize: 12.5, fontWeight: "700", color: COLORS.textMuted },
  toggleTextOn: { color: "#fff" },
  footer: { padding: 20, paddingBottom: 30, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border },
  submitBtn: { height: 56, borderRadius: 16, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
  submitBtnText: { color: "#fff", fontWeight: "700", fontSize: 15.5 },
});

export default MarkAttendanceScreen;
