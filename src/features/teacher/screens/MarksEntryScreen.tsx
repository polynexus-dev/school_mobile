import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { COLORS } from "@/shared/theme/colors";

/**
 * UT-style marks entry — SCAFFOLD ONLY. The given REST contract has no
 * MarksEntry/ReportCard endpoint yet (see backend plan). This lays out the
 * draft→publish UX with local state so it can be wired to the real API
 * (and its publish-lock/HM-approval rules) once that ships.
 */
interface MarkRow {
  id: number;
  name: string;
  roll: string;
  initials: string;
  color: string;
  score: string;
  absent?: boolean;
}

const MAX_SCORE = 25;

const INITIAL: MarkRow[] = [
  { id: 1, name: "Aditi Bhosale", roll: "01", initials: "AB", color: "#7C3AED", score: "21" },
  { id: 2, name: "Arjun Nair", roll: "02", initials: "AN", color: "#0891B2", score: "18" },
  { id: 3, name: "Aarav Sharma", roll: "03", initials: "AS", color: "#7C3AED", score: "" },
  { id: 4, name: "Diya Kapoor", roll: "07", initials: "DK", color: "#DB2777", score: "", absent: true },
  { id: 5, name: "Ishaan Joshi", roll: "11", initials: "IJ", color: "#D97706", score: "8" },
  { id: 6, name: "Mira Kulkarni", roll: "19", initials: "MK", color: "#0891B2", score: "24" },
];

export const MarksEntryScreen: React.FC = () => {
  const router = useRouter();
  const [rows, setRows] = useState<MarkRow[]>(INITIAL);
  const [published, setPublished] = useState(false);

  const updateScore = (id: number, value: string) => {
    const clean = value.replace(/[^0-9]/g, "");
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, score: clean } : r)));
  };

  const stats = useMemo(() => {
    const scored = rows.filter((r) => !r.absent && r.score !== "");
    const entered = scored.length;
    const avg = entered > 0 ? scored.reduce((sum, r) => sum + Number(r.score), 0) / entered : 0;
    const below40 = scored.filter((r) => Number(r.score) < MAX_SCORE * 0.4).length;
    return { entered, avg: avg.toFixed(1), below40 };
  }, [rows]);

  const handleSaveDraft = () => {
    Alert.alert("Draft saved", "Marks kept as draft — not yet visible to parents. (Wire-up pending backend Marks API.)");
  };

  const handlePublish = () => {
    Alert.alert(
      "Publish results?",
      "Publishing posts results to parents and locks edits — corrections then need HM approval.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Publish",
          onPress: () => {
            setPublished(true);
            Alert.alert("Published (preview only)", "Real publish-lock workflow is pending the backend Marks API.");
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Enter marks</Text>
          <Text style={styles.headerSubtitle}>UT-2 · Mathematics · Class 7-A · out of {MAX_SCORE}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statTile}>
          <Text style={styles.statLabel}>Entered</Text>
          <Text style={styles.statValue}>
            {stats.entered} <Text style={styles.statValueMuted}>/ {rows.length}</Text>
          </Text>
        </View>
        <View style={styles.statTile}>
          <Text style={styles.statLabel}>Class average</Text>
          <Text style={styles.statValue}>{stats.avg}</Text>
        </View>
        <View style={styles.statTile}>
          <Text style={styles.statLabel}>Below 40%</Text>
          <Text style={[styles.statValue, { color: COLORS.error }]}>{stats.below40}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {rows.map((r) => {
          const scoreNum = Number(r.score);
          const isBelow40 = !r.absent && r.score !== "" && scoreNum < MAX_SCORE * 0.4;
          return (
            <View
              key={r.id}
              style={[styles.row, r.absent && styles.rowAbsent, isBelow40 && styles.rowBelow40]}
            >
              <View style={[styles.avatar, { backgroundColor: r.color }]}>
                <Text style={styles.avatarText}>{r.initials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{r.name}</Text>
                <Text style={[styles.roll, r.absent && { color: "#B45309", fontWeight: "600" }, isBelow40 && { color: COLORS.error, fontWeight: "600" }]}>
                  {r.absent ? "Absent on exam day" : isBelow40 ? `${r.score} / ${MAX_SCORE} · below 40%` : `Roll ${r.roll}`}
                </Text>
              </View>
              {r.absent ? (
                <View style={styles.absentPill}>
                  <Text style={styles.absentPillText}>AB ▾</Text>
                </View>
              ) : (
                <TextInput
                  style={[styles.scoreInput, isBelow40 && styles.scoreInputBelow40]}
                  keyboardType="number-pad"
                  maxLength={3}
                  value={r.score}
                  editable={!published}
                  onChangeText={(v) => updateScore(r.id, v)}
                />
              )}
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerNote}>
          Marks stay in <Text style={styles.bold}>draft</Text> until you publish. Publishing posts results to parents
          and locks edits — corrections then need HM approval.
        </Text>
        <View style={styles.footerRow}>
          <TouchableOpacity style={styles.draftBtn} onPress={handleSaveDraft} disabled={published}>
            <Text style={styles.draftBtnText}>Save draft</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.publishBtn} onPress={handlePublish} disabled={published}>
            <Text style={styles.publishBtnText}>{published ? "Published ✓" : "Publish results →"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingTop: 56, paddingHorizontal: 20, paddingBottom: 8 },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: COLORS.surface, alignItems: "center", justifyContent: "center" },
  backBtnText: { fontSize: 16, color: COLORS.text },
  headerTitle: { fontSize: 17, fontWeight: "700", color: COLORS.text },
  headerSubtitle: { fontSize: 11.5, color: COLORS.textSecondary, marginTop: 2 },
  statsRow: { flexDirection: "row", marginHorizontal: 20, marginTop: 14, backgroundColor: COLORS.surface, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 13, gap: 14 },
  statTile: { flex: 1 },
  statLabel: { fontSize: 11.5, color: COLORS.textSecondary },
  statValue: { fontSize: 16, fontWeight: "700", color: COLORS.text, marginTop: 2 },
  statValueMuted: { fontSize: 11.5, color: COLORS.textMuted, fontWeight: "600" },
  list: { padding: 20, paddingBottom: 16, gap: 9 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: COLORS.surface, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: COLORS.border },
  rowAbsent: { backgroundColor: "#FFFBEB", borderColor: "#FDE68A" },
  rowBelow40: { backgroundColor: "#FEF2F2", borderColor: "#FECACA" },
  avatar: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  name: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  roll: { fontSize: 11.5, color: COLORS.textSecondary, marginTop: 1 },
  scoreInput: {
    width: 60, height: 42, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.background,
    textAlign: "center", fontWeight: "700", fontSize: 16, color: COLORS.text,
  },
  scoreInputBelow40: { borderColor: "#FECACA", backgroundColor: "#FEF2F2", color: COLORS.error },
  absentPill: { borderRadius: 12, borderWidth: 1.5, borderColor: "#FDE68A", backgroundColor: "#fff", paddingHorizontal: 11, paddingVertical: 9 },
  absentPillText: { fontSize: 11, fontWeight: "800", color: "#B45309" },
  footer: { padding: 20, paddingBottom: 30, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border, gap: 10 },
  footerNote: { fontSize: 11.5, color: "#4C1D95", backgroundColor: "#F5F3FF", borderRadius: 12, padding: 11, lineHeight: 16 },
  footerRow: { flexDirection: "row", gap: 12 },
  draftBtn: { flex: 1, height: 50, borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.border, alignItems: "center", justifyContent: "center" },
  draftBtnText: { color: COLORS.textSecondary, fontWeight: "700", fontSize: 13.5 },
  publishBtn: { flex: 1.3, height: 50, borderRadius: 14, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
  publishBtnText: { color: "#fff", fontWeight: "700", fontSize: 13.5 },
  bold: { fontWeight: "700" },
});

export default MarksEntryScreen;
