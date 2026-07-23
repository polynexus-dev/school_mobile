import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { COLORS } from "@/shared/theme/colors";
import { ScreenWrapper } from "@/shared/ui/ScreenWrapper";
import { teacherApi, ClassSection } from "../api/teacherApi";
import { ROUTES } from "@/constants/route";
import { useAuthStore } from "@store/authStore";

/**
 * Attendance tab — same class-section roster as the Today dashboard, but
 * framed purely around "take attendance" so a teacher jumping straight to
 * this tab doesn't have to scroll past the full timetable card first.
 */
export const AttendanceTabScreen: React.FC = () => {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [sections, setSections] = useState<ClassSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"mine" | "all">("mine");

  const load = useCallback(async () => {
    try {
      const isHm = user?.teacher_profile?.is_hm;
      const data = await teacherApi.getMyClassSections({
        mine: isHm ? activeTab === "mine" : true,
      });
      setSections(data);
    } catch (err) {
      console.error("Failed to load class sections:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, activeTab]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ScreenWrapper
      title="Attendance"
      showHeader
      scrollable
      contentContainerStyle={styles.content}
    >
      <Text style={styles.subtitle}>Select a class to take or review today's attendance.</Text>

      {user?.teacher_profile?.is_hm && (
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === "mine" && styles.tabActiveButton]}
            onPress={() => setActiveTab("mine")}
          >
            <Text style={[styles.tabText, activeTab === "mine" && styles.tabActiveText]}>
              My Classes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === "all" && styles.tabActiveButton]}
            onPress={() => setActiveTab("all")}
          >
            <Text style={[styles.tabText, activeTab === "all" && styles.tabActiveText]}>
              All Classes
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {loading && <ActivityIndicator color={COLORS.primary} style={{ marginTop: 24 }} />}

      {!loading &&
        sections.map((s) => (
          <TouchableOpacity
            key={s.id}
            style={styles.card}
            activeOpacity={0.85}
            onPress={() =>
              router.push({
                pathname: ROUTES.TEACHER.MARK_ATTENDANCE,
                params: { classSectionId: String(s.id), className: s.name },
              })
            }
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.className}>
                {s.subject_name ? `${s.subject_name} · ` : ""}Class {s.name}
              </Text>
              <Text style={styles.classMeta}>{s.student_count ?? "—"} students</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        ))}

      {!loading && sections.length === 0 && (
        <Text style={styles.emptyText}>No class-sections assigned yet.</Text>
      )}

      <TouchableOpacity style={styles.correctionsLink} onPress={() => router.push(ROUTES.TEACHER.CORRECTIONS)}>
        <Text style={styles.correctionsLinkText}>Review correction requests →</Text>
      </TouchableOpacity>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 30, gap: 11 },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 6 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "#1C0A4A",
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  className: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  classMeta: { fontSize: 11.5, color: COLORS.textMuted, marginTop: 2 },
  chevron: { fontSize: 20, color: COLORS.textMuted },
  emptyText: { textAlign: "center", color: COLORS.textMuted, marginTop: 30 },
  correctionsLink: { marginTop: 12, alignItems: "center", paddingVertical: 10 },
  correctionsLinkText: { color: COLORS.primary, fontWeight: "700", fontSize: 13 },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(28,10,74,0.06)",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  tabActiveButton: {
    backgroundColor: COLORS.surface,
    shadowColor: "#1C0A4A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textMuted,
  },
  tabActiveText: {
    color: COLORS.primary,
  },
});

export default AttendanceTabScreen;
