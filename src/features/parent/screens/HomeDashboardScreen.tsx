import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/shared/theme/colors";
import { ScreenWrapper } from "@/shared/ui/ScreenWrapper";
import { useAuthStore } from "@store/authStore";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { parentApi, AnnouncementItem, AttendanceEntry } from "../api/parentApi";
import { ChildSwitcher } from "../components/ChildSwitcher";
import { ROUTES } from "@/constants/route";

function initials(first?: string, last?: string) {
  return `${(first?.[0] ?? "").toUpperCase()}${(last?.[0] ?? "").toUpperCase()}` || "?";
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / 3600000);
  if (hours < 1) return "now";
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export const HomeDashboardScreen: React.FC = () => {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const students = useAuthStore((state) => state.students);
  const activeStudentId = useAuthStore((state) => state.activeStudentId);
  const setStudents = useAuthStore((state) => state.setStudents);
  const setActiveStudentId = useAuthStore((state) => state.setActiveStudentId);
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [attendancePct, setAttendancePct] = useState<number | null>(null);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);

  const activeStudent = students.find((s) => s.id === activeStudentId) ?? students[0];

  const load = useCallback(async () => {
    console.log("[Dashboard] Loading parent dashboard...");
    setLoading(true);
    try {
      console.log("[Dashboard] Fetching children and feed...");
      const [children, feed] = await Promise.all([parentApi.getMyChildren(), parentApi.getAnnouncements()]);
      console.log("[Dashboard] Children fetched:", JSON.stringify(children));
      console.log("[Dashboard] Announcements fetched count:", feed.length);
      if (children.length > 0) {
        await setStudents(children);
      } else {
        console.warn("[Dashboard] Children array is empty!");
      }
      setAnnouncements(feed.slice(0, 4));
    } catch (err) {
      console.error("[Dashboard] Failed to load parent dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, [setStudents]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!activeStudent) return;
    parentApi
      .getAttendance(activeStudent.id)
      .then((entries: AttendanceEntry[]) => {
        if (entries.length === 0) {
          setAttendancePct(null);
          return;
        }
        const present = entries.filter((e) => e.status === "present").length;
        setAttendancePct(Math.round((present / entries.length) * 100));
      })
      .catch((err) => console.error("Failed to load attendance summary:", err));
  }, [activeStudent?.id]);

  const parentName = `${user?.first_name ?? ""}`.trim() || user?.username || "there";
  const today = new Date();

  return (
    <ScreenWrapper style={styles.root} scrollable disablePadding>
      <View style={[styles.hero, { paddingTop: insets.top + 8 }]}>
        <View style={styles.heroTopRow}>
          <ChildSwitcher variant="light" />
          {students.length > 1 &&
            students
              .filter((s) => s.id !== activeStudent?.id)
              .slice(0, 1)
              .map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={styles.secondaryAvatar}
                  onPress={() => setActiveStudentId(s.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.secondaryAvatarText}>{initials(s.first_name, s.last_name)}</Text>
                </TouchableOpacity>
              ))}
          <View style={{ flex: 1 }} />
          <TouchableOpacity style={styles.bellBtn} onPress={() => router.push(ROUTES.PARENT.BUS_ALERTS)}>
            <Ionicons name="notifications-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.heroTextBlock}>
          <Text style={styles.heroDate}>
            {today.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
          </Text>
          <Text style={styles.heroGreeting}>Good day, {parentName}</Text>
        </View>
      </View>

      <View style={styles.body}>
        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 30 }} />
        ) : !activeStudent ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No linked children found yet.</Text>
          </View>
        ) : (
          <>
            <View style={styles.studentCard}>
              <View style={styles.studentAvatar}>
                <Text style={styles.studentAvatarText}>{initials(activeStudent.first_name, activeStudent.last_name)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.studentName}>
                  {activeStudent.first_name} {activeStudent.last_name}
                </Text>
                <Text style={styles.studentMeta}>
                  {activeStudent.class_section.startsWith("Class") ? activeStudent.class_section : `Class ${activeStudent.class_section}`} · Roll {activeStudent.roll_no ?? "—"}
                </Text>
              </View>
              {attendancePct !== null && (
                <View style={styles.attendancePill}>
                  <View style={styles.attendanceDot} />
                  <Text style={styles.attendancePillText}>{attendancePct}% PRESENT</Text>
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.busCard} onPress={() => router.push(ROUTES.PARENT.BUS_TRACKING)} activeOpacity={0.85}>
              <View style={styles.liveRow}>
                <View style={styles.liveDot} />
                <Text style={styles.liveLabel}>LIVE BUS TRACKING</Text>
              </View>
              <View style={styles.busRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.busTitle}>See the live route &amp; ETA</Text>
                  <Text style={styles.busSubtitle}>Tap to open the live map</Text>
                </View>
                <View style={styles.trackBtn}>
                  <Text style={styles.trackBtnText}>Track →</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Fee-due banner placeholder — no fee endpoint in this pass's REST
                contract yet; wire to a real invoice-summary call once it ships. */}
            <TouchableOpacity style={styles.feeBanner} onPress={() => router.push(ROUTES.PARENT.FEES)} activeOpacity={0.85}>
              <View style={styles.feeIcon}>
                <Text style={styles.feeIconText}>₹</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.feeTitle}>Check fees &amp; payments</Text>
                <Text style={styles.feeSubtitle}>View invoices and pay online</Text>
              </View>
              <Text style={styles.feeCta}>Open</Text>
            </TouchableOpacity>

            <View style={styles.quickGrid}>
              <TouchableOpacity style={styles.quickTile} onPress={() => router.push(ROUTES.PARENT.ATTENDANCE)}>
                <Text style={styles.quickIcon}>✓</Text>
                <Text style={styles.quickLabel}>Attendance</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickTile} onPress={() => router.push(ROUTES.PARENT.FEES)}>
                <Text style={styles.quickIcon}>₹</Text>
                <Text style={styles.quickLabel}>Fees</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickTile} onPress={() => router.push(ROUTES.PARENT.RESULTS)}>
                <Text style={styles.quickIcon}>📊</Text>
                <Text style={styles.quickLabel}>Results</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickTile} onPress={() => router.push(ROUTES.PARENT.HOMEWORK)}>
                <Text style={styles.quickIcon}>📘</Text>
                <Text style={styles.quickLabel}>Homework</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Announcements</Text>
              <TouchableOpacity onPress={() => router.push(ROUTES.PARENT.ANNOUNCEMENTS)}>
                <Text style={styles.sectionLink}>See all</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.announceCard}>
              {announcements.map((a, idx) => (
                <View key={a.id} style={[styles.announceRow, idx < announcements.length - 1 && styles.announceRowBorder]}>
                  <View style={styles.announceDot} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.announceTitle}>{a.title}</Text>
                    <Text style={styles.announceMeta}>{a.class_section_name || a.category || "School"}</Text>
                  </View>
                  <Text style={styles.announceTime}>{timeAgo(a.created_at)}</Text>
                </View>
              ))}
              {announcements.length === 0 && <Text style={styles.emptyText}>No announcements yet.</Text>}
            </View>
          </>
        )}
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  root: { backgroundColor: COLORS.background },
  hero: { backgroundColor: COLORS.primaryDark, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },
  heroTopRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  secondaryAvatar: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center",
  },
  secondaryAvatarText: { color: "rgba(255,255,255,0.8)", fontWeight: "700", fontSize: 11 },
  bellBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.14)", alignItems: "center", justifyContent: "center" },
  heroTextBlock: { marginTop: 18 },
  heroDate: { color: "rgba(255,255,255,0.7)", fontSize: 13 },
  heroGreeting: { color: "#fff", fontWeight: "700", fontSize: 21, marginTop: 2 },
  body: { paddingHorizontal: 18, marginTop: -26, gap: 14, paddingBottom: 30 },
  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyText: { fontSize: 13, color: COLORS.textMuted, textAlign: "center" },
  studentCard: {
    backgroundColor: COLORS.surface, borderRadius: 20, padding: 16, flexDirection: "row", alignItems: "center", gap: 14,
    shadowColor: "#1C0A4A", shadowOpacity: 0.08, shadowRadius: 18,
  },
  studentAvatar: { width: 54, height: 54, borderRadius: 18, backgroundColor: COLORS.secondary, alignItems: "center", justifyContent: "center" },
  studentAvatarText: { color: "#fff", fontWeight: "700", fontSize: 19 },
  studentName: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  studentMeta: { fontSize: 12.5, color: COLORS.textSecondary, marginTop: 1 },
  attendancePill: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#ECFDF5", borderWidth: 1, borderColor: "#A7F3D0", borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6 },
  attendanceDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.success },
  attendancePillText: { fontSize: 11.5, fontWeight: "700", color: "#047857" },
  busCard: { backgroundColor: "#0F172A", borderRadius: 20, padding: 16 },
  liveRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#22D3EE" },
  liveLabel: { fontSize: 11, fontWeight: "700", color: "#A5F3FC" },
  busRow: { flexDirection: "row", alignItems: "flex-end", marginTop: 10 },
  busTitle: { color: "#fff", fontWeight: "700", fontSize: 15.5 },
  busSubtitle: { color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 3 },
  trackBtn: { backgroundColor: "rgba(255,255,255,0.12)", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)", borderRadius: 12, paddingHorizontal: 13, paddingVertical: 8 },
  trackBtnText: { color: "#fff", fontSize: 12.5, fontWeight: "600" },
  feeBanner: { backgroundColor: "#FFFBEB", borderWidth: 1, borderColor: "#FDE68A", borderRadius: 20, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  feeIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: "#F59E0B", alignItems: "center", justifyContent: "center" },
  feeIconText: { color: "#fff", fontWeight: "700", fontSize: 17 },
  feeTitle: { fontWeight: "600", fontSize: 13.5, color: "#78350F" },
  feeSubtitle: { fontSize: 11.5, color: "#B45309", marginTop: 1 },
  feeCta: { color: "#1E1B2E", fontWeight: "700", fontSize: 12.5, backgroundColor: "#fff", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7 },
  quickGrid: { flexDirection: "row", gap: 10 },
  quickTile: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 18, paddingVertical: 14, alignItems: "center", gap: 8, shadowColor: "#1C0A4A", shadowOpacity: 0.05, shadowRadius: 12 },
  quickIcon: { fontSize: 18 },
  quickLabel: { fontSize: 11, fontWeight: "600", color: "#4B5563" },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 2 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: COLORS.text },
  sectionLink: { fontSize: 12.5, fontWeight: "600", color: COLORS.primary },
  announceCard: { backgroundColor: COLORS.surface, borderRadius: 20, paddingHorizontal: 16 },
  announceRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 13 },
  announceRowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  announceDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  announceTitle: { fontSize: 13.5, fontWeight: "600", color: COLORS.text },
  announceMeta: { fontSize: 11.5, color: COLORS.textMuted, marginTop: 1 },
  announceTime: { fontSize: 11, color: COLORS.textMuted },
});

export default HomeDashboardScreen;
