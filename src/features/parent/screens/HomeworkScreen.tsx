import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { ScreenWrapper } from "@/shared/ui/ScreenWrapper";
import { COLORS } from "@/shared/theme/colors";
import { ChildSwitcher } from "../components/ChildSwitcher";

/**
 * Homework — SCAFFOLD, mock data. No Homework endpoint in this pass's
 * contract yet (see backend plan's Homework model). Read-only by design:
 * submissions are handled in class, not on the app.
 */
interface HomeworkItem {
  id: number;
  subject: string;
  tagColor: string;
  title: string;
  meta: string;
  status: "pending" | "submitted";
}

const ITEMS: HomeworkItem[] = [
  { id: 1, subject: "MATHEMATICS", tagColor: "#5B21B6", title: "Exercise 5.2 — Fractions word problems", meta: "Due tomorrow, 15 Jul · Assigned by Mr. Kulkarni", status: "pending" },
  { id: 2, subject: "SCIENCE", tagColor: "#0E7490", title: "Diagram: parts of a flower + labels", meta: "Due Thu, 17 Jul · Assigned by Mrs. Iyer", status: "pending" },
  { id: 3, subject: "ENGLISH", tagColor: "#BE185D", title: 'Book review — "The Blue Umbrella"', meta: "Submitted 13 Jul · Checked by Ms. D'Souza", status: "submitted" },
  { id: 4, subject: "HINDI", tagColor: "#5B21B6", title: "निबंध — मेरा प्रिय त्योहार", meta: "Submitted 11 Jul · Checked by Mrs. Verma", status: "submitted" },
];

export const HomeworkScreen: React.FC = () => {
  const pending = ITEMS.filter((i) => i.status === "pending").length;

  return (
    <ScreenWrapper title="Homework" showHeader showBack scrollable right={<ChildSwitcher />} contentContainerStyle={styles.content}>
      <Text style={styles.subtitle}>Read-only view · submissions are handled in class</Text>

      {ITEMS.map((item) => (
        <View
          key={item.id}
          style={[styles.card, { borderLeftColor: item.status === "pending" ? COLORS.warning : COLORS.success }, item.status === "submitted" && styles.cardMuted]}
        >
          <View style={styles.cardTop}>
            <View style={[styles.tag, { backgroundColor: `${item.tagColor}15` }]}>
              <Text style={[styles.tagText, { color: item.tagColor }]}>{item.subject}</Text>
            </View>
            <Text style={[styles.status, item.status === "pending" ? styles.statusPending : styles.statusSubmitted]}>
              {item.status === "pending" ? "PENDING" : "SUBMITTED ✓"}
            </Text>
          </View>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.meta}>{item.meta}</Text>
        </View>
      ))}

      <View style={styles.footNote}>
        <Text style={styles.footNoteText}>
          {pending} pending · class average completion this week is 91%
        </Text>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 30, gap: 11 },
  subtitle: { fontSize: 12.5, color: COLORS.textSecondary, marginBottom: 4 },
  card: { backgroundColor: COLORS.surface, borderRadius: 18, padding: 16, borderLeftWidth: 4, shadowColor: "#1C0A4A", shadowOpacity: 0.05, shadowRadius: 12 },
  cardMuted: { opacity: 0.8 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  tag: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { fontSize: 11, fontWeight: "700" },
  status: { fontSize: 11.5, fontWeight: "700" },
  statusPending: { color: "#B45309" },
  statusSubmitted: { color: "#047857" },
  title: { fontSize: 14.5, fontWeight: "600", color: COLORS.text, marginTop: 9 },
  meta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  footNote: { backgroundColor: "#F5F3FF", borderRadius: 16, padding: 14 },
  footNoteText: { fontSize: 12.5, color: "#5B21B6", lineHeight: 18 },
});

export default HomeworkScreen;
