import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Linking, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export const CommunicationHubScreen = () => {
  const [activeFilter, setActiveFilter] = useState<"all" | "whatsapp" | "alerts">("all");

  const notifications = [
    {
      id: "1",
      title: "Quarter 2 Fee Reminder & UPI Link",
      message: "Q2 Tuition Fee invoice #INV-2026-004 is due on Aug 5. Click to pay instantly via UPI.",
      type: "whatsapp",
      time: "10:30 AM",
      icon: "logo-whatsapp",
      color: "#25D366",
    },
    {
      id: "2",
      title: "Bus Route A Boarding Alert",
      message: "Student Aarav Sharma scanned NFC card and boarded Bus #KA-01-MN-4521 at Stop #4.",
      type: "alerts",
      time: "08:12 AM",
      icon: "bus-outline",
      color: "#0EA5E9",
    },
    {
      id: "3",
      title: "Infirmary Visit Notification",
      message: "Nurse visit logged at 11:15 AM. Administered prescribed inhaler. Student resting comfortably.",
      type: "alerts",
      time: "Yesterday",
      icon: "medical-outline",
      color: "#EF4444",
    },
    {
      id: "4",
      title: "Annual Sports Day Circular & Consent Form",
      message: "Please submit your digital DPDP consent for photo publication by Friday.",
      type: "whatsapp",
      time: "28 Jul",
      icon: "document-text-outline",
      color: "#8B5CF6",
    },
  ];

  const filteredLogs = notifications.filter((item) => {
    if (activeFilter === "whatsapp") return item.type === "whatsapp";
    if (activeFilter === "alerts") return item.type === "alerts";
    return true;
  });

  const openWhatsAppHelpdesk = () => {
    const message = encodeURIComponent("Hello VIDYAM School Support, I have a query regarding my child's profile.");
    Linking.openURL(`whatsapp://send?phone=+919075080310&text=${message}`).catch(() => {
      Linking.openURL(`https://wa.me/919075080310?text=${message}`);
    });
  };

  return (
    <View style={styles.container}>
      {/* Header Banner */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Ionicons name="chatbubbles-outline" size={24} color="#7C3AED" />
          <Text style={styles.headerTitle}>Parent Communication Hub</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          Real-time WhatsApp updates, automated fee alerts, and transport logs in one place.
        </Text>
      </View>

      {/* Direct WhatsApp Helpdesk Button */}
      <TouchableOpacity style={styles.whatsappBanner} onPress={openWhatsAppHelpdesk} activeOpacity={0.85}>
        <Ionicons name="logo-whatsapp" size={22} color="#FFFFFF" />
        <View style={styles.whatsappBannerText}>
          <Text style={styles.whatsappBannerTitle}>Direct WhatsApp School Helpdesk</Text>
          <Text style={styles.whatsappBannerSubtitle}>Connect with class teacher or accounts office in 1-tap</Text>
        </View>
        <Ionicons name="chevron-forward-outline" size={18} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, activeFilter === "all" && styles.filterChipActive]}
          onPress={() => setActiveFilter("all")}
        >
          <Text style={[styles.filterChipText, activeFilter === "all" && styles.filterChipTextActive]}>All Updates</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, activeFilter === "whatsapp" && styles.filterChipActive]}
          onPress={() => setActiveFilter("whatsapp")}
        >
          <Text style={[styles.filterChipText, activeFilter === "whatsapp" && styles.filterChipTextActive]}>
            WhatsApp Logs
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, activeFilter === "alerts" && styles.filterChipActive]}
          onPress={() => setActiveFilter("alerts")}
        >
          <Text style={[styles.filterChipText, activeFilter === "alerts" && styles.filterChipTextActive]}>
            Safety &amp; Bus Alerts
          </Text>
        </TouchableOpacity>
      </View>

      {/* Log Feed */}
      <ScrollView contentContainerStyle={styles.feedContent}>
        {filteredLogs.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={[styles.iconContainer, { backgroundColor: item.color + "15" }]}>
              <Ionicons name={item.icon as any} size={20} color={item.color} />
            </View>
            <View style={styles.cardBody}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardTime}>{item.time}</Text>
              </View>
              <Text style={styles.cardMessage}>{item.message}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { padding: 16, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#0F172A" },
  headerSubtitle: { fontSize: 12, color: "#64748B", marginTop: 4 },
  whatsappBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#25D366",
    margin: 16,
    padding: 14,
    borderRadius: 14,
    gap: 12,
    shadowColor: "#25D366",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  whatsappBannerText: { flex: 1 },
  whatsappBannerTitle: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
  whatsappBannerSubtitle: { fontSize: 11, color: "rgba(255,255,255,0.9)", marginTop: 2 },
  filterRow: { flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "#E2E8F0" },
  filterChipActive: { backgroundColor: "#7C3AED" },
  filterChipText: { fontSize: 12, fontWeight: "600", color: "#475569" },
  filterChipTextActive: { color: "#FFFFFF" },
  feedContent: { paddingHorizontal: 16, paddingBottom: 24 },
  card: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    gap: 12,
  },
  iconContainer: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyCenter: "center" },
  cardBody: { flex: 1 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { fontSize: 14, fontWeight: "700", color: "#1E293B", flex: 1 },
  cardTime: { fontSize: 11, color: "#94A3B8" },
  cardMessage: { fontSize: 12, color: "#475569", marginTop: 4, lineHeight: 17 },
});

export default CommunicationHubScreen;
