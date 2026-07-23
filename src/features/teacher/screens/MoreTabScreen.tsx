import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { COLORS } from "@/shared/theme/colors";
import { ScreenWrapper } from "@/shared/ui/ScreenWrapper";
import { useAuthStore } from "@store/authStore";
import { ROUTES } from "@/constants/route";
import { teacherApi } from "../api/teacherApi";

function initials(name?: string) {
  if (!name) return "T";
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "T";
}

export const MoreTabScreen: React.FC = () => {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const name = `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim() || user?.username || "Teacher";

  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const loadPendingCount = async () => {
      try {
        const count = await teacherApi.getPendingCorrectionsCount();
        setPendingCount(count);
      } catch (err) {
        console.error("Failed to load corrections count", err);
      }
    };
    loadPendingCount();
  }, []);

  const handleLogout = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace(ROUTES.AUTH.LOGIN);
        },
      },
    ]);
  };

  return (
    <ScreenWrapper title="More" showHeader scrollable contentContainerStyle={styles.content}>
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(name)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.meta}>{user?.tenant_name || "Teacher"}</Text>
        </View>
      </View>

      <View style={styles.menu}>
        <TouchableOpacity style={styles.menuRow} onPress={() => router.push(ROUTES.TEACHER.NOTIFICATIONS)}>
          <Text style={styles.menuLabel}>Notifications</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuRow} onPress={() => router.push(ROUTES.TEACHER.CORRECTIONS)}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Text style={styles.menuLabel}>Correction requests</Text>
            {pendingCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingCount}</Text>
              </View>
            )}
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuRow} onPress={() => router.push(ROUTES.TEACHER.MARKS_ENTRY)}>
          <Text style={styles.menuLabel}>Marks entry</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuRow} onPress={() => router.push(ROUTES.TEACHER.QUICK_CREATE)}>
          <Text style={styles.menuLabel}>New post</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Sign out</Text>
      </TouchableOpacity>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 30, gap: 18 },
  profileCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    shadowColor: "#1C0A4A",
    shadowOpacity: 0.06,
    shadowRadius: 14,
  },
  avatar: { width: 54, height: 54, borderRadius: 18, backgroundColor: COLORS.secondary, alignItems: "center", justifyContent: "center" },
  avatarText: { color: COLORS.white, fontWeight: "700", fontSize: 18 },
  name: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  meta: { fontSize: 12.5, color: COLORS.textSecondary, marginTop: 2 },
  menu: { backgroundColor: COLORS.surface, borderRadius: 18 },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuLabel: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  chevron: { fontSize: 18, color: COLORS.textMuted },
  logoutBtn: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.error,
    alignItems: "center",
    paddingVertical: 15,
  },
  logoutText: { color: COLORS.error, fontWeight: "700", fontSize: 14 },
  badge: {
    backgroundColor: COLORS.error,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 10.5,
    fontWeight: "700",
  },
});

export default MoreTabScreen;
