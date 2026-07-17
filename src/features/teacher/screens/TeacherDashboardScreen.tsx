import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { COLORS } from "@/shared/theme/colors";
import { ScreenWrapper } from "@/shared/ui/ScreenWrapper";
import { useAuthStore } from "@store/authStore";
import { teacherApi, ClassSection } from "../api/teacherApi";
import { ROUTES } from "@/constants/route";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function initials(name?: string) {
  if (!name) return "T";
  const parts = name.trim().split(/\s+/);
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "T";
}

export const TeacherDashboardScreen: React.FC = () => {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [sections, setSections] = useState<ClassSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"mine" | "all">("mine");
  const insets = useSafeAreaInsets();

  const fetchSections = useCallback(async () => {
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
    fetchSections();
  }, [fetchSections]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSections();
  };

  const teacherName = `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim() || user?.username || "Teacher";
  const today = new Date();

  return (
    <ScreenWrapper style={styles.root} scrollable disablePadding>
      <View style={[styles.hero, { paddingTop: insets.top + 8 }]}>
        <View style={styles.heroTopRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(teacherName)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.teacherName}>{teacherName}</Text>
            <Text style={styles.teacherMeta}>
              {user?.teacher_profile?.is_hm
                ? `${user.teacher_profile.designation || "Head Master"}${
                    user.teacher_profile.class_section
                      ? ` · Class teacher, ${user.teacher_profile.class_section}`
                      : ""
                  }`
                : user?.teacher_profile?.class_section
                ? `Class teacher, ${user.teacher_profile.class_section}`
                : "Teacher"}
            </Text>
          </View>
        </View>

        <View style={styles.dateCard}>
          <View style={styles.dateCol}>
            <Text style={styles.dateDay}>{today.toLocaleDateString(undefined, { weekday: "short" })}</Text>
            <Text style={styles.dateNum}>
              {today.getDate()} {today.toLocaleDateString(undefined, { month: "short" }).toUpperCase()}
            </Text>
          </View>
          <View style={styles.dateDivider} />
          <Text style={styles.dateHint}>
            {loading ? "Loading your classes…" : `${sections.length} class section${sections.length === 1 ? "" : "s"} assigned to you`}
          </Text>
        </View>
      </View>

      <View style={styles.listSection}>
        <Text style={styles.listLabel}>TODAY'S CLASSES</Text>

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

        {!loading && sections.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No class-sections assigned yet.</Text>
            <Text style={styles.emptySubtext}>Pull down to refresh once the school office assigns your classes.</Text>
          </View>
        )}

        {sections.map((s, idx) => (
          <View key={s.id} style={[styles.classCard, idx === 0 && styles.classCardFirst]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.className}>
                {s.subject_name ? `${s.subject_name} · ` : ""}Class {s.name}
              </Text>
              <Text style={styles.classMeta}>
                {s.room ? `${s.room} · ` : ""}{s.student_count ?? "—"} students
              </Text>
            </View>
            <TouchableOpacity
              style={idx === 0 ? styles.ctaBtn : styles.ctaBtnMuted}
              onPress={() =>
                router.push({
                  pathname: ROUTES.TEACHER.MARK_ATTENDANCE,
                  params: { classSectionId: String(s.id), className: s.name },
                })
              }
            >
              <Text style={idx === 0 ? styles.ctaText : styles.ctaTextMuted}>Take attendance</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  root: { backgroundColor: COLORS.background },
  hero: {
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 28,
  },
  heroTopRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.secondary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
  },
  avatarText: { color: COLORS.white, fontWeight: "700", fontSize: 16 },
  teacherName: { color: COLORS.white, fontWeight: "700", fontSize: 17 },
  teacherMeta: { color: "rgba(255,255,255,0.7)", fontSize: 12.5, marginTop: 2 },
  dateCard: {
    marginTop: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  dateCol: { alignItems: "center" },
  dateDay: { fontWeight: "700", fontSize: 20, color: COLORS.primaryDark },
  dateNum: { fontSize: 11, color: COLORS.textMuted, fontWeight: "600" },
  dateDivider: { width: 1, height: 36, backgroundColor: COLORS.border },
  dateHint: { flex: 1, fontSize: 12.5, color: COLORS.textSecondary },
  listSection: { padding: 18, paddingBottom: 40 },
  listLabel: { fontSize: 11.5, fontWeight: "700", color: COLORS.textMuted, letterSpacing: 0.6, marginBottom: 10 },
  emptyState: { alignItems: "center", paddingVertical: 32 },
  emptyText: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  emptySubtext: { fontSize: 12.5, color: COLORS.textSecondary, marginTop: 4, textAlign: "center" },
  classCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 11,
    shadowColor: "#1C0A4A",
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
  },
  classCardFirst: { borderWidth: 1.5, borderColor: COLORS.primary },
  className: { fontSize: 14.5, fontWeight: "600", color: COLORS.text },
  classMeta: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  ctaBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 9, paddingHorizontal: 13 },
  ctaText: { color: COLORS.white, fontSize: 12.5, fontWeight: "600" },
  ctaBtnMuted: { paddingVertical: 9, paddingHorizontal: 8 },
  ctaTextMuted: { color: COLORS.textMuted, fontSize: 11.5, fontWeight: "600" },
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

export default TeacherDashboardScreen;
