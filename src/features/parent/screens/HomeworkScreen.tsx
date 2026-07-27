import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { ScreenWrapper } from "@/shared/ui/ScreenWrapper";
import { COLORS } from "@/shared/theme/colors";
import { useAuthStore } from "@store/authStore";
import { ChildSwitcher } from "../components/ChildSwitcher";
import { parentApi, HomeworkItem } from "../api/parentApi";

/**
 * Homework — real GET /api/academics/homework/?class_section=, one record
 * per class (not per student). Read-only by design: the model has no
 * submission/completion tracking, so unlike the old mock this doesn't
 * pretend to show a "submitted" status or completion percentage.
 */
export const HomeworkScreen: React.FC = () => {
  const students = useAuthStore((state) => state.students);
  const activeStudentId = useAuthStore((state) => state.activeStudentId);
  const activeStudent = students.find((s) => s.id === activeStudentId) ?? students[0];

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<HomeworkItem[]>([]);

  const load = useCallback(async () => {
    if (!activeStudent?.class_section_id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await parentApi.getHomework(activeStudent.class_section_id);
      setItems(data);
    } catch (err) {
      console.error("Failed to load homework:", err);
    } finally {
      setLoading(false);
    }
  }, [activeStudent?.class_section_id]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ScreenWrapper title="Homework" showHeader showBack scrollable right={<ChildSwitcher />} contentContainerStyle={styles.content}>
      <Text style={styles.subtitle}>Checked in class · no online submission</Text>

      {loading && <ActivityIndicator color={COLORS.primary} style={{ marginTop: 24 }} />}

      {!loading && items.length === 0 && <Text style={styles.emptyText}>No homework posted yet.</Text>}

      {!loading &&
        items.map((item) => (
          <View key={item.id} style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            {!!item.description && <Text style={styles.description}>{item.description}</Text>}
            <Text style={styles.meta}>Due {item.due_date}</Text>
          </View>
        ))}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 30, gap: 11 },
  subtitle: { fontSize: 12.5, color: COLORS.textSecondary, marginBottom: 4 },
  emptyText: { textAlign: "center", color: COLORS.textMuted, marginTop: 30 },
  card: { backgroundColor: COLORS.surface, borderRadius: 18, padding: 16, shadowColor: "#1C0A4A", shadowOpacity: 0.05, shadowRadius: 12 },
  title: { fontSize: 14.5, fontWeight: "600", color: COLORS.text },
  description: { fontSize: 12.5, color: COLORS.textSecondary, marginTop: 6, lineHeight: 18 },
  meta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 8, fontWeight: "600" },
});

export default HomeworkScreen;
