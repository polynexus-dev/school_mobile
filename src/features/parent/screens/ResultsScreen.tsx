import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { ScreenWrapper } from "@/shared/ui/ScreenWrapper";
import { COLORS } from "@/shared/theme/colors";
import { ChildSwitcher } from "../components/ChildSwitcher";

/**
 * Results & exams — SCAFFOLD, mock data. No MarksEntry/ReportCard endpoint
 * in this pass's contract yet (see backend plan). Layout matches the design
 * closely so real data is a drop-in swap later.
 */
const UPCOMING = [
  { date: "JUL 21", subject: "Mathematics", meta: "9:00 AM · Chapters 4–6 · 40 marks" },
  { date: "JUL 23", subject: "Science", meta: "9:00 AM · Chapters 3–5 · 40 marks" },
  { date: "JUL 25", subject: "English", meta: "9:00 AM · Prose + grammar · 40 marks" },
];

const SUBJECTS = [
  { name: "Maths", score: 92, max: 100 },
  { name: "Science", score: 89, max: 100 },
  { name: "English", score: 86, max: 100 },
  { name: "Hindi", score: 84, max: 100 },
  { name: "Social Sci.", score: 91, max: 100 },
];

export const ResultsScreen: React.FC = () => {
  const overall = Math.round(SUBJECTS.reduce((s, x) => s + x.score, 0) / SUBJECTS.length);

  return (
    <ScreenWrapper title="Results & Exams" showHeader showBack scrollable right={<ChildSwitcher />} contentContainerStyle={styles.content}>
      <Text style={styles.label}>UPCOMING · UNIT TEST 2</Text>
      <View style={styles.examCard}>
        {UPCOMING.map((e, idx) => (
          <View key={e.subject} style={[styles.examRow, idx < UPCOMING.length - 1 && styles.examRowBorder]}>
            <View style={styles.dateTag}>
              <Text style={styles.dateTagMonth}>{e.date.split(" ")[0]}</Text>
              <Text style={styles.dateTagDay}>{e.date.split(" ")[1]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.subjectName}>{e.subject}</Text>
              <Text style={styles.examMeta}>{e.meta}</Text>
            </View>
          </View>
        ))}
      </View>

      <Text style={styles.label}>REPORT CARD · TERM 1 (PUBLISHED)</Text>
      <View style={styles.reportCard}>
        <View style={styles.reportHeader}>
          <View>
            <Text style={styles.reportTitle}>Term 1 · 2026–27</Text>
            <Text style={styles.reportMeta}>Rank 4 of 32 · Published 30 Jun</Text>
          </View>
          <View style={styles.overallBadge}>
            <Text style={styles.overallValue}>{overall}%</Text>
            <Text style={styles.overallLabel}>OVERALL</Text>
          </View>
        </View>

        {SUBJECTS.map((s) => (
          <View key={s.name} style={styles.subjectRow}>
            <Text style={styles.subjectLabel}>{s.name}</Text>
            <View style={styles.subjectBarTrack}>
              <View style={[styles.subjectBarFill, { width: `${(s.score / s.max) * 100}%` }]} />
            </View>
            <Text style={styles.subjectScore}>
              {s.score}/{s.max}
            </Text>
          </View>
        ))}

        <View style={styles.remarkBox}>
          <Text style={styles.remarkText}>
            <Text style={styles.bold}>Teacher's remark:</Text> Consistent and attentive. Needs more practice with
            essay writing.
          </Text>
        </View>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 30, gap: 10 },
  label: { fontSize: 11.5, fontWeight: "700", color: COLORS.textMuted, letterSpacing: 0.5, marginTop: 6 },
  examCard: { backgroundColor: COLORS.surface, borderRadius: 18, paddingHorizontal: 16 },
  examRow: { flexDirection: "row", alignItems: "center", gap: 13, paddingVertical: 13 },
  examRowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  dateTag: { width: 44, borderRadius: 12, backgroundColor: "#F5F3FF", alignItems: "center", paddingVertical: 6 },
  dateTagMonth: { fontSize: 9.5, fontWeight: "700", color: "#5B21B6" },
  dateTagDay: { fontSize: 15, fontWeight: "700", color: "#5B21B6" },
  subjectName: { fontSize: 13.5, fontWeight: "600", color: COLORS.text },
  examMeta: { fontSize: 11.5, color: COLORS.textMuted, marginTop: 1 },
  reportCard: { backgroundColor: COLORS.surface, borderRadius: 18, padding: 18 },
  reportHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  reportTitle: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  reportMeta: { fontSize: 11.5, color: COLORS.textMuted, marginTop: 2 },
  overallBadge: { backgroundColor: "#F5F3FF", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 8, alignItems: "center" },
  overallValue: { fontSize: 17, fontWeight: "700", color: "#5B21B6" },
  overallLabel: { fontSize: 9, fontWeight: "700", color: "#7C3AED" },
  subjectRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 9 },
  subjectLabel: { width: 74, fontSize: 12.5, color: COLORS.textSecondary },
  subjectBarTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: "#F1EFF8" },
  subjectBarFill: { height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  subjectScore: { width: 50, textAlign: "right", fontWeight: "700", fontSize: 12.5, color: COLORS.text },
  remarkBox: { marginTop: 8, backgroundColor: "#F5F3FF", borderRadius: 12, padding: 12 },
  remarkText: { fontSize: 12, color: "#5B21B6", lineHeight: 18 },
  bold: { fontWeight: "700" },
});

export default ResultsScreen;
