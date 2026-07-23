import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl, ScrollView } from "react-native";
import { COLORS } from "@/shared/theme/colors";
import { ScreenWrapper } from "@/shared/ui/ScreenWrapper";
import { notificationApi, AppNotification } from "../api/notificationApi";

const TYPE_ICON: Record<string, string> = {
  fee_invoice: "💳",
  fee_payment: "💳",
  attendance_correction: "📅",
  announcement: "📣",
  guardian_link: "👪",
  marks_published: "🎓",
  report_card: "📄",
  promotion: "⬆️",
  general: "🔔",
};

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export const NotificationsScreen: React.FC = () => {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async (pageNum: number, replace: boolean) => {
    const data = await notificationApi.getNotifications(pageNum);
    setItems((prev) => (replace ? data.results : [...prev, ...data.results]));
    setHasNext(!!data.next);
    setPage(pageNum);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await load(1, true);
      } catch (err) {
        console.error("Failed to load notifications:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await load(1, true);
    } catch (err) {
      console.error("Failed to refresh notifications:", err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLoadMore = async () => {
    if (!hasNext || loadingMore) return;
    setLoadingMore(true);
    try {
      await load(page + 1, false);
    } catch (err) {
      console.error("Failed to load more notifications:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleMarkRead = async (n: AppNotification) => {
    if (n.is_read) return;
    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
    try {
      await notificationApi.markRead(n.id);
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await notificationApi.markAllRead();
      setItems((prev) => prev.map((x) => ({ ...x, is_read: true })));
    } catch (err) {
      console.error("Failed to mark all read:", err);
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <ScreenWrapper
      title="Notifications"
      showHeader
      showBack
      right={
        <TouchableOpacity onPress={handleMarkAllRead} disabled={markingAll}>
          <Text style={styles.markAllText}>{markingAll ? "…" : "Mark all read"}</Text>
        </TouchableOpacity>
      }
    >
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        >
          {items.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No notifications yet.</Text>
            </View>
          )}
          {items.map((n) => (
            <TouchableOpacity
              key={n.id}
              onPress={() => handleMarkRead(n)}
              style={[styles.card, !n.is_read && styles.cardUnread]}
              activeOpacity={0.75}
            >
              <Text style={styles.icon}>{TYPE_ICON[n.notification_type] || "🔔"}</Text>
              <View style={{ flex: 1 }}>
                <View style={styles.titleRow}>
                  <Text style={styles.title}>{n.title}</Text>
                  {!n.is_read && <View style={styles.dot} />}
                </View>
                {!!n.message && <Text style={styles.message}>{n.message}</Text>}
                <Text style={styles.time}>{timeAgo(n.created_at)}</Text>
              </View>
            </TouchableOpacity>
          ))}
          {hasNext && (
            <TouchableOpacity style={styles.loadMoreBtn} onPress={handleLoadMore} disabled={loadingMore}>
              {loadingMore ? <ActivityIndicator color={COLORS.primary} /> : <Text style={styles.loadMoreText}>Load more</Text>}
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { padding: 16, gap: 10, paddingBottom: 30 },
  markAllText: { color: COLORS.primary, fontWeight: "700", fontSize: 12.5 },
  emptyState: { alignItems: "center", paddingVertical: 60 },
  emptyText: { color: COLORS.textMuted, fontSize: 13.5 },
  card: { flexDirection: "row", gap: 12, backgroundColor: COLORS.surface, borderRadius: 16, padding: 14, opacity: 0.72 },
  cardUnread: { opacity: 1, borderWidth: 1.5, borderColor: "#DDD6FE" },
  icon: { fontSize: 20 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  title: { fontSize: 14, fontWeight: "700", color: COLORS.text, flexShrink: 1 },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: COLORS.primary },
  message: { fontSize: 12.5, color: COLORS.textSecondary, marginTop: 3, lineHeight: 18 },
  time: { fontSize: 11, color: COLORS.textMuted, marginTop: 6 },
  loadMoreBtn: { alignItems: "center", paddingVertical: 14 },
  loadMoreText: { color: COLORS.primary, fontWeight: "700", fontSize: 13 },
});

export default NotificationsScreen;
