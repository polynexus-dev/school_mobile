import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { COLORS } from "@/shared/theme/colors";
import { useAuthStore } from "@store/authStore";
import { parentApi, AttendanceEntry, AttendanceStatus } from "../api/parentApi";
import { ChildSwitcher } from "../components/ChildSwitcher";

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

const STATUS_COLORS: Record<AttendanceStatus, { bg: string; fg: string }> = {
  present: { bg: "#D1FAE5", fg: "#065F46" },
  absent: { bg: "#FEE2E2", fg: "#991B1B" },
  leave: { bg: "#FEF3C7", fg: "#92400E" },
};

function isoDate(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export const AttendanceCalendarScreen: React.FC = () => {
  const router = useRouter();
  const students = useAuthStore((state) => state.students);
  const activeStudentId = useAuthStore((state) => state.activeStudentId);
  const activeStudent = students.find((s) => s.id === activeStudentId) ?? students[0];

  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<AttendanceEntry[]>([]);
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const viewedMonth = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [monthOffset]);

  const load = useCallback(async () => {
    if (!activeStudent) return;
    setLoading(true);
    try {
      const monthKey = `${viewedMonth.getFullYear()}-${String(viewedMonth.getMonth() + 1).padStart(2, "0")}`;
      const data = await parentApi.getAttendance(activeStudent.id, monthKey);
      setEntries(data);
    } catch (err) {
      console.error("Failed to load attendance:", err);
    } finally {
      setLoading(false);
    }
  }, [activeStudent?.id, viewedMonth]);

  useEffect(() => {
    load();
  }, [load]);

  const byDate = useMemo(() => {
    const map: Record<string, AttendanceEntry> = {};
    entries.forEach((e) => (map[e.date] = e));
    return map;
  }, [entries]);

  const counts = useMemo(() => {
    const present = entries.filter((e) => e.status === "present").length;
    const absent = entries.filter((e) => e.status === "absent").length;
    const leave = entries.filter((e) => e.status === "leave").length;
    const total = present + absent + leave;
    const pct = total > 0 ? Math.round((present / total) * 100) : 0;
    return { present, absent, leave, pct };
  }, [entries]);

  const year = viewedMonth.getFullYear();
  const month = viewedMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // Monday-start

  const cells: { day: number | null; date: string | null; status?: AttendanceStatus }[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push({ day: null, date: null });
  for (let d = 1; d <= daysInMonth; d++) {
    const date = isoDate(year, month, d);
    cells.push({ day: d, date, status: byDate[date]?.status });
  }

  const selectedEntry = selectedDate ? byDate[selectedDate] : undefined;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backArrow}>
          <Text style={styles.backArrowText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Attendance</Text>
        <ChildSwitcher />
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : !activeStudent ? (
        <Text style={styles.emptyText}>No linked child selected.</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.summaryCard}>
            <View style={styles.donut}>
              <Text style={styles.donutPct}>{counts.pct}%</Text>
              <Text style={styles.donutLabel}>THIS MONTH</Text>
            </View>
            <View style={{ flex: 1, gap: 8 }}>
              <View style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.success }]} />
                <Text style={styles.legendText}>Present</Text>
                <Text style={styles.legendValue}>{counts.present} days</Text>
              </View>
              <View style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.error }]} />
                <Text style={styles.legendText}>Absent</Text>
                <Text style={styles.legendValue}>{counts.absent} days</Text>
              </View>
              <View style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.warning }]} />
                <Text style={styles.legendText}>Leave</Text>
                <Text style={styles.legendValue}>{counts.leave} days</Text>
              </View>
            </View>
          </View>

          <View style={styles.calendarCard}>
            <View style={styles.monthRow}>
              <TouchableOpacity style={styles.monthNav} onPress={() => setMonthOffset((m) => m - 1)}>
                <Text style={styles.monthNavText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.monthTitle}>
                {viewedMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
              </Text>
              <TouchableOpacity style={styles.monthNav} onPress={() => setMonthOffset((m) => m + 1)}>
                <Text style={styles.monthNavText}>›</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dayLabelRow}>
              {DAY_LABELS.map((l, i) => (
                <Text key={i} style={styles.dayLabel}>{l}</Text>
              ))}
            </View>

            <View style={styles.grid}>
              {cells.map((c, i) => {
                const colors = c.status ? STATUS_COLORS[c.status] : null;
                const isSelected = c.date && c.date === selectedDate;
                return (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.cell,
                      colors && { backgroundColor: colors.bg },
                      isSelected && styles.cellSelected,
                    ]}
                    disabled={!c.date}
                    onPress={() => c.date && setSelectedDate(c.date)}
                  >
                    <Text style={[styles.cellText, colors && { color: colors.fg }]}>{c.day ?? ""}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {selectedDate && (
            <View style={styles.detailCard}>
              <View style={styles.detailHeader}>
                <Text style={styles.detailDate}>
                  {new Date(selectedDate).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "long" })}
                </Text>
                {selectedEntry ? (
                  <View style={[styles.statusPill, { backgroundColor: STATUS_COLORS[selectedEntry.status].bg }]}>
                    <Text style={[styles.statusPillText, { color: STATUS_COLORS[selectedEntry.status].fg }]}>
                      {selectedEntry.status.toUpperCase()}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.statusPillMuted}>
                    <Text style={styles.statusPillMutedText}>NO RECORD</Text>
                  </View>
                )}
              </View>
              {selectedEntry?.note ? (
                <Text style={styles.detailNote}>{selectedEntry.note}</Text>
              ) : (
                <Text style={styles.detailNote}>
                  {selectedEntry ? "No additional notes for this day." : "No attendance record found for this day."}
                </Text>
              )}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingTop: 56, paddingHorizontal: 20, paddingBottom: 8 },
  backArrow: { padding: 4 },
  backArrowText: { fontSize: 18, color: COLORS.text },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "700", color: COLORS.text },
  emptyText: { textAlign: "center", color: COLORS.textMuted, marginTop: 40 },
  content: { padding: 18, paddingBottom: 40, gap: 14 },
  summaryCard: { backgroundColor: COLORS.surface, borderRadius: 22, padding: 18, flexDirection: "row", alignItems: "center", gap: 18, shadowColor: "#1C0A4A", shadowOpacity: 0.06, shadowRadius: 16 },
  donut: {
    width: 88, height: 88, borderRadius: 44, borderWidth: 9, borderColor: COLORS.success,
    alignItems: "center", justifyContent: "center", backgroundColor: "#F0FDF4",
  },
  donutPct: { fontWeight: "700", fontSize: 17, color: "#065F46" },
  donutLabel: { fontSize: 8.5, color: COLORS.textMuted, fontWeight: "700", marginTop: 1 },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  legendDot: { width: 9, height: 9, borderRadius: 3 },
  legendText: { flex: 1, fontSize: 13, color: COLORS.textSecondary },
  legendValue: { fontSize: 13, fontWeight: "700", color: COLORS.text },
  calendarCard: { backgroundColor: COLORS.surface, borderRadius: 22, padding: 18, shadowColor: "#1C0A4A", shadowOpacity: 0.06, shadowRadius: 16 },
  monthRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  monthNav: { width: 30, height: 30, borderRadius: 10, backgroundColor: "#F5F3FF", alignItems: "center", justifyContent: "center" },
  monthNavText: { color: COLORS.primary, fontWeight: "700", fontSize: 16 },
  monthTitle: { fontSize: 15, fontWeight: "700", color: COLORS.text },
  dayLabelRow: { flexDirection: "row", marginBottom: 8 },
  dayLabel: { flex: 1, textAlign: "center", fontSize: 10.5, fontWeight: "700", color: COLORS.textMuted },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: "center", justifyContent: "center", borderRadius: 10, marginBottom: 4 },
  cellSelected: { borderWidth: 2, borderColor: COLORS.primary },
  cellText: { fontSize: 12.5, fontWeight: "600", color: COLORS.text },
  detailCard: { backgroundColor: COLORS.surface, borderRadius: 20, padding: 18, borderWidth: 1.5, borderColor: COLORS.primary },
  detailHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  detailDate: { fontSize: 13.5, fontWeight: "700", color: COLORS.text },
  statusPill: { borderRadius: 8, paddingHorizontal: 9, paddingVertical: 3 },
  statusPillText: { fontSize: 11, fontWeight: "700" },
  statusPillMuted: { borderRadius: 8, paddingHorizontal: 9, paddingVertical: 3, backgroundColor: COLORS.surfaceDark },
  statusPillMutedText: { fontSize: 11, fontWeight: "700", color: COLORS.textMuted },
  detailNote: { fontSize: 12.5, color: COLORS.textSecondary, marginTop: 8, lineHeight: 19 },
});

export default AttendanceCalendarScreen;
