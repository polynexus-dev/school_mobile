import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { ScreenWrapper } from "@/shared/ui/ScreenWrapper";
import { COLORS } from "@/shared/theme/colors";
import { parentApi, AnnouncementItem } from "../api/parentApi";

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / 3600000);
  if (hours < 1) return "now";
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export const AnnouncementsScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<AnnouncementItem[]>([]);
  const [filter, setFilter] = useState<string>("All");

  useEffect(() => {
    parentApi
      .getAnnouncements()
      .then(setItems)
      .catch((err) => console.error("Failed to load announcements:", err))
      .finally(() => setLoading(false));
  }, []);

  const categories = ["All", ...Array.from(new Set(items.map((i) => i.category).filter(Boolean)))] as string[];
  const visible = filter === "All" ? items : items.filter((i) => i.category === filter);

  return (
    <ScreenWrapper title="Announcements" showHeader showBack scrollable contentContainerStyle={styles.content}>
      <View style={styles.chipRow}>
        {categories.map((c) => (
          <TouchableOpacity key={c} style={[styles.chip, filter === c && styles.chipOn]} onPress={() => setFilter(c)}>
            <Text style={[styles.chipText, filter === c && styles.chipTextOn]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && <ActivityIndicator color={COLORS.primary} style={{ marginTop: 24 }} />}

      {!loading &&
        visible.map((a) => (
          <View key={a.id} style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.dot} />
              <View style={styles.tag}>
                <Text style={styles.tagText}>{(a.category || "school").toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }} />
              <Text style={styles.when}>{timeAgo(a.created_at)}</Text>
            </View>
            <Text style={styles.title}>{a.title}</Text>
            <Text style={styles.body}>{a.body}</Text>
          </View>
        ))}

      {!loading && visible.length === 0 && <Text style={styles.emptyText}>No announcements yet.</Text>}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 30, gap: 11 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  chip: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 999, paddingHorizontal: 15, paddingVertical: 8 },
  chipOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 12.5, fontWeight: "600", color: COLORS.textSecondary },
  chipTextOn: { color: "#fff" },
  card: { backgroundColor: COLORS.surface, borderRadius: 18, padding: 16, borderWidth: 1.5, borderColor: "#DDD6FE" },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 9 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  tag: { backgroundColor: "#F5F3FF", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { fontSize: 10.5, fontWeight: "700", color: "#5B21B6" },
  when: { fontSize: 11.5, color: COLORS.textMuted },
  title: { fontSize: 14.5, fontWeight: "600", color: COLORS.text, marginTop: 9 },
  body: { fontSize: 12.5, color: COLORS.textSecondary, marginTop: 4, lineHeight: 19 },
  emptyText: { textAlign: "center", color: COLORS.textMuted, marginTop: 30 },
});

export default AnnouncementsScreen;
