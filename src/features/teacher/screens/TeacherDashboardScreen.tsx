import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { COLORS } from "@/shared/theme/colors";
import { ScreenWrapper } from "@/shared/ui/ScreenWrapper";
import { useAuthStore } from "@store/authStore";
import { teacherApi, ClassSection, SubstituteAssignment } from "../api/teacherApi";
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
  const [substitutes, setSubstitutes] = useState<SubstituteAssignment[]>([]);
  const [medicalAlerts, setMedicalAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"mine" | "all">("mine");
  const insets = useSafeAreaInsets();

  const fetchSections = useCallback(async () => {
    if (!user) return;
    try {
      const isHm = user?.teacher_profile?.is_hm;
      const todayStr = new Date().toISOString().split("T")[0];
      const [sectionsData, subData, medData] = await Promise.all([
        teacherApi.getMyClassSections({ mine: isHm ? activeTab === "mine" : true }),
        teacherApi.getSubstituteAssignments(todayStr),
        teacherApi.getMedicalAlerts(),
      ]);
      setSections(sectionsData);
      setSubstitutes(subData);
      setMedicalAlerts(medData?.alerts ?? []);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
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

        <TouchableOpacity
          style={styles.staffPunchBanner}
          onPress={() => router.push(ROUTES.TEACHER.STAFF_ATTENDANCE)}
          activeOpacity={0.85}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.staffPunchTitle}>🎯 Staff AI Facial Attendance</Text>
            <Text style={styles.staffPunchSubtitle}>Biometric Punch In/Out · Geofenced</Text>
          </View>
          <View style={styles.staffPunchBtn}>
            <Text style={styles.staffPunchBtnText}>Punch In ›</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.listSection}>
        {medicalAlerts.length > 0 && (
          <View style={styles.medContainer}>
            <Text style={styles.medHeaderTitle}>⚠️ HIGH-RISK MEDICAL ALERTS ({medicalAlerts.length})</Text>
            {medicalAlerts.map((al) => (
              <View key={al.id} style={styles.medCard}>
                <View style={styles.medBadgeRow}>
                  <Text style={styles.medStudentName}>{al.student_name} ({al.class_section_name})</Text>
                  <Text style={styles.medBadgeText}>HIGH RISK</Text>
                </View>
                {al.allergies ? <Text style={styles.medText}>Allergies: {al.allergies}</Text> : null}
                {al.chronic_conditions ? <Text style={styles.medText}>Conditions: {al.chronic_conditions}</Text> : null}
              </View>
            ))}
          </View>
        )}

        {substitutes.length > 0 && (
          <View style={styles.subContainer}>
            <Text style={styles.subHeaderTitle}>🤖 SUBSTITUTE CLASSES TODAY ({substitutes.length})</Text>
            {substitutes.map((sub) => (
              <View key={sub.id} style={styles.subCard}>
                <View style={styles.subBadgeRow}>
                  <Text style={styles.subBadgeText}>Period {sub.period_number}</Text>
                  <Text style={styles.subTimeText}>{sub.start_time?.slice(0, 5)} - {sub.end_time?.slice(0, 5)}</Text>
                </View>
                <Text style={styles.subTitleText}>
                  {sub.class_section_name} — <Text style={styles.subSubjectText}>{sub.subject_name}</Text>
                </Text>
                {sub.absent_teacher_name && (
                  <Text style={styles.subMetaText}>Subbing for: {sub.absent_teacher_name}</Text>
                )}
              </View>
            ))}
          </View>
        )}

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
  staffPunchBanner: {
    marginTop: 12,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
  },
  staffPunchTitle: { color: COLORS.white, fontWeight: "700", fontSize: 13.5 },
  staffPunchSubtitle: { color: "rgba(255, 255, 255, 0.8)", fontSize: 11, marginTop: 2 },
  staffPunchBtn: { backgroundColor: COLORS.white, borderRadius: 10, paddingVertical: 6, paddingHorizontal: 12 },
  staffPunchBtnText: { color: COLORS.primaryDark, fontWeight: "700", fontSize: 11.5 },
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
  subContainer: { marginBottom: 20 },
  subHeaderTitle: { fontSize: 11.5, fontWeight: "700", color: "#6D28D9", letterSpacing: 0.6, marginBottom: 10 },
  subCard: {
    backgroundColor: "#F5F3FF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#DDD6FE",
  },
  subBadgeRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  subBadgeText: { backgroundColor: "#7C3AED", color: COLORS.white, fontWeight: "700", fontSize: 11, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  subTimeText: { fontSize: 11.5, fontWeight: "600", color: "#6D28D9" },
  subTitleText: { fontSize: 14, fontWeight: "700", color: "#4C1D95" },
  subSubjectText: { fontWeight: "700", color: "#6D28D9" },
  subMetaText: { fontSize: 12, color: "#6B7280", marginTop: 4, fontStyle: "italic" },
  medContainer: { marginBottom: 20 },
  medHeaderTitle: { fontSize: 11.5, fontWeight: "700", color: "#DC2626", letterSpacing: 0.6, marginBottom: 10 },
  medCard: {
    backgroundColor: "#FEF2F2",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  medBadgeRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  medStudentName: { fontSize: 13.5, fontWeight: "700", color: "#991B1B" },
  medBadgeText: { backgroundColor: "#DC2626", color: COLORS.white, fontWeight: "800", fontSize: 10, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  medText: { fontSize: 12, color: "#7F1D1D", marginTop: 2, fontWeight: "600" },
});

export default TeacherDashboardScreen;
