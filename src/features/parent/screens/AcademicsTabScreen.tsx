import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ScreenWrapper } from "@/shared/ui/ScreenWrapper";
import { COLORS } from "@/shared/theme/colors";
import { ChildSwitcher } from "../components/ChildSwitcher";
import { ROUTES } from "@/constants/route";

const ITEMS = [
  { icon: "📊", title: "Results & Exams", subtitle: "Report cards, unit tests & rank", route: ROUTES.PARENT.RESULTS },
  { icon: "📘", title: "Homework", subtitle: "Pending and submitted work", route: ROUTES.PARENT.HOMEWORK },
  { icon: "📣", title: "Announcements", subtitle: "School, class & transport notices", route: ROUTES.PARENT.ANNOUNCEMENTS },
  { icon: "✓", title: "Attendance", subtitle: "Calendar & correction trail", route: ROUTES.PARENT.ATTENDANCE },
] as const;

export const AcademicsTabScreen: React.FC = () => {
  const router = useRouter();

  return (
    <ScreenWrapper title="Academics" showHeader showBack={false} scrollable right={<ChildSwitcher />} contentContainerStyle={styles.content}>
      {ITEMS.map((item) => (
        <TouchableOpacity key={item.title} style={styles.card} onPress={() => router.push(item.route)} activeOpacity={0.85}>
          <View style={styles.iconCircle}>
            <Text style={{ fontSize: 20 }}>{item.icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      ))}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 30, gap: 12 },
  card: { backgroundColor: COLORS.surface, borderRadius: 18, padding: 16, flexDirection: "row", alignItems: "center", gap: 14, shadowColor: "#1C0A4A", shadowOpacity: 0.05, shadowRadius: 12 },
  iconCircle: { width: 46, height: 46, borderRadius: 15, backgroundColor: "#F5F3FF", alignItems: "center", justifyContent: "center" },
  title: { fontSize: 14.5, fontWeight: "600", color: COLORS.text },
  subtitle: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  chevron: { fontSize: 20, color: COLORS.textMuted },
});

export default AcademicsTabScreen;
