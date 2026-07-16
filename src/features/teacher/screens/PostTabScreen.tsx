import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { COLORS } from "@/shared/theme/colors";
import { ScreenWrapper } from "@/shared/ui/ScreenWrapper";
import { ROUTES } from "@/constants/route";

export const PostTabScreen: React.FC = () => {
  const router = useRouter();

  return (
    <ScreenWrapper title="Post" showHeader scrollable contentContainerStyle={styles.content}>
      <Text style={styles.subtitle}>Share homework or an announcement with a class.</Text>

      <TouchableOpacity
        style={[styles.card, styles.cardHomework]}
        activeOpacity={0.85}
        onPress={() => router.push({ pathname: ROUTES.TEACHER.QUICK_CREATE, params: { type: "homework" } })}
      >
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>📘</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>Homework</Text>
          <Text style={styles.cardSubtitle}>Assign work with a due date to one or more classes</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.card, styles.cardAnnouncement]}
        activeOpacity={0.85}
        onPress={() => router.push({ pathname: ROUTES.TEACHER.QUICK_CREATE, params: { type: "announcement" } })}
      >
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>📣</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>Announcement</Text>
          <Text style={styles.cardSubtitle}>Notify parents about school or class-level updates</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.marksCard} onPress={() => router.push(ROUTES.TEACHER.MARKS_ENTRY)}>
        <Text style={styles.marksCardText}>Enter unit-test marks →</Text>
      </TouchableOpacity>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 30, gap: 14 },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 4 },
  card: {
    borderRadius: 20,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: COLORS.surface,
    shadowColor: "#1C0A4A",
    shadowOpacity: 0.06,
    shadowRadius: 14,
  },
  cardHomework: { borderWidth: 1.5, borderColor: "#DDD6FE" },
  cardAnnouncement: { borderWidth: 1.5, borderColor: "#A78BFA" },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: "#F5F3FF",
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: { fontSize: 22 },
  cardTitle: { fontSize: 15.5, fontWeight: "700", color: COLORS.text },
  cardSubtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 3, lineHeight: 17 },
  marksCard: { alignItems: "center", paddingVertical: 12 },
  marksCardText: { color: COLORS.primary, fontWeight: "700", fontSize: 13.5 },
});

export default PostTabScreen;
