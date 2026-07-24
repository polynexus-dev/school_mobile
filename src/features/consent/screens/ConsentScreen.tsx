import React, { useState } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@store/authStore";
import { authApi } from "@/features/auth";
import { COLORS } from "@/shared/theme/colors";
import { Button } from "@/shared/ui/Button";
import { useRouter } from "expo-router";
import { ROUTES } from "@/constants/route";
import { Feather } from "@expo/vector-icons";

/**
 * Account-level DPDP gate shown once after first login/onboarding, before any
 * role dashboard. This is distinct from the Parent app's per-child granular
 * privacy & consent screen (bus GPS / face recognition / photo-sharing toggles)
 * — that one lives at (parent)/privacy-consent.tsx and is opt-in per consent
 * type; this one is the single required "you must accept to use the app" gate.
 */
export const ConsentScreen: React.FC = () => {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const updateConsentStatus = useAuthStore((state) => state.updateConsentStatus);
  const user = useAuthStore((state) => state.user);

  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [errorText, setErrorText] = useState("");

  const handleAgreeConsent = async () => {
    if (!agreed) {
      setErrorText("Please check the box to confirm you accept the terms.");
      return;
    }
    setLoading(true);
    setErrorText("");
    try {
      await authApi.grantConsent();
      setSuccessVisible(true);
    } catch (err: any) {
      setErrorText(err.message || "Failed to submit consent. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace(ROUTES.AUTH.LOGIN);
  };

  const displayName = user
    ? `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username
    : "there";

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.glowTopRight} />
      <View style={styles.glowBottomLeft} />

      <View style={styles.header}>
        <Text style={styles.title}>Data Consent</Text>
        <Text style={styles.subtitle}>Privacy Notice Verification</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.noticeHeader}>
          <Text style={styles.noticeIcon}>📋</Text>
          <View>
            <Text style={styles.noticeTitle}>DPDP Act Compliance Notice</Text>
            <Text style={styles.noticeSubtitle}>Section 6 Information Form</Text>
          </View>
        </View>

        <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContentContainer}>
          <Text style={styles.greeting}>Dear {displayName},</Text>
          <Text style={styles.bodyText}>
            To continue providing secure school ERP services (class timetables, attendance, homework, fees
            and bus tracking), we require your explicit consent to process your profile data in accordance
            with the <Text style={styles.boldText}>Digital Personal Data Protection (DPDP) Act, 2023</Text>.
          </Text>

          <Text style={styles.sectionTitle}>1. What Data We Process:</Text>
          <Text style={styles.bodyText}>
            • Basic profile details: your name, role, and school/class mapping.{"\n"}
            • For parents: your linked children's academic and attendance records.{"\n"}
            • For teachers: classroom rosters and attendance/marks you enter.
          </Text>

          <Text style={styles.sectionTitle}>2. Processing Purpose:</Text>
          <Text style={styles.bodyText}>
            All records are stored securely in this school's dedicated database schema and processed
            exclusively for academic operations, transport safety, and attendance integrity.
          </Text>

          <Text style={styles.sectionTitle}>3. Your Privacy Rights:</Text>
          <Text style={styles.bodyText}>
            You have the right to request access to your records, request corrections, or request erasure
            of your data. You can also withdraw optional consents (such as bus GPS or face recognition, for
            parents) at any time from Privacy &amp; Consent in the app.
          </Text>
        </ScrollView>

        {errorText ? (
          <View style={styles.errorBanner}>
            <Feather name="alert-circle" size={16} color={COLORS.error} />
            <Text style={styles.errorBannerText}>{errorText}</Text>
          </View>
        ) : null}

        <TouchableOpacity style={styles.checkboxContainer} activeOpacity={0.8} onPress={() => setAgreed(!agreed)}>
          <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
            {agreed && <Feather name="check" size={12} color={COLORS.white} />}
          </View>
          <Text style={styles.checkboxLabel}>
            I hereby give clear, unconditional, and informed consent to {user?.tenant_name || "my school"} and
            its technology partner, Polynexus Technologies, to process my personal data through the
            VIDYUM platform for school ERP services.
          </Text>
        </TouchableOpacity>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.signOutButton} onPress={handleLogout}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
          <Button title="Agree & Proceed" onPress={handleAgreeConsent} loading={loading} disabled={!agreed} style={styles.agreeButton} />
        </View>
      </View>

      <Modal visible={successVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.successIconCircle}>
              <Feather name="check" size={32} color={COLORS.success} />
            </View>
            <Text style={styles.modalTitle}>Consent Recorded</Text>
            <Text style={styles.modalDescription}>
              Thank you! Your privacy preferences have been successfully registered under the DPDP Act (2023).
            </Text>
            <TouchableOpacity
              style={styles.modalProceedButton}
              activeOpacity={0.8}
              onPress={() => {
                setSuccessVisible(false);
                updateConsentStatus(true);
                // The root layout's gate takes over from here (role-based redirect).
              }}
            >
              <Text style={styles.modalProceedButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primaryDark },
  glowTopRight: {
    position: "absolute", top: -100, right: -100, width: 300, height: 300, borderRadius: 150,
    backgroundColor: COLORS.secondary, opacity: 0.18,
  },
  glowBottomLeft: {
    position: "absolute", bottom: -100, left: -100, width: 300, height: 300, borderRadius: 150,
    backgroundColor: COLORS.accent, opacity: 0.18,
  },
  header: { alignItems: "center", marginVertical: 20 },
  title: { fontSize: 28, fontWeight: "900", color: COLORS.white, letterSpacing: 1 },
  subtitle: { fontSize: 13, color: "rgba(255, 255, 255, 0.7)", marginTop: 4, fontWeight: "600", letterSpacing: 0.5 },
  card: {
    flex: 1, backgroundColor: COLORS.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24,
  },
  noticeHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: 12 },
  noticeIcon: { fontSize: 28, marginRight: 12 },
  noticeTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  noticeSubtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  scrollContent: { flex: 1, backgroundColor: COLORS.background, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  scrollContentContainer: { paddingBottom: 16 },
  greeting: { fontSize: 14, fontWeight: "700", color: COLORS.text, marginBottom: 8 },
  bodyText: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18, marginBottom: 12 },
  boldText: { fontWeight: "700", color: COLORS.text },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: COLORS.text, marginTop: 10, marginBottom: 6 },
  checkboxContainer: { flexDirection: "row", alignItems: "flex-start", marginTop: 16, marginBottom: 20 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: COLORS.primary, alignItems: "center", justifyContent: "center", marginRight: 10, marginTop: 2 },
  checkboxChecked: { backgroundColor: COLORS.primary },
  checkboxLabel: { flex: 1, fontSize: 12, color: COLORS.textSecondary, lineHeight: 16 },
  buttonRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  signOutButton: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.border, alignItems: "center", justifyContent: "center", marginRight: 12 },
  signOutText: { fontSize: 14, fontWeight: "700", color: COLORS.textSecondary },
  agreeButton: { flex: 1, borderRadius: 14, height: 48 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(15, 12, 22, 0.6)", justifyContent: "center", alignItems: "center", padding: 24 },
  modalCard: { backgroundColor: COLORS.surface, borderRadius: 24, padding: 28, width: "100%", maxWidth: 320, alignItems: "center" },
  successIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: "rgba(16, 185, 129, 0.1)", alignItems: "center", justifyContent: "center", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: "800", color: COLORS.text, marginBottom: 10, textAlign: "center" },
  modalDescription: { fontSize: 13, color: COLORS.textSecondary, textAlign: "center", lineHeight: 18, marginBottom: 24 },
  modalProceedButton: { backgroundColor: COLORS.primary, paddingVertical: 14, width: "100%", borderRadius: 14, alignItems: "center", justifyContent: "center" },
  modalProceedButtonText: { color: COLORS.white, fontSize: 14, fontWeight: "700" },
  errorBanner: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(239, 68, 68, 0.08)", borderWidth: 1, borderColor: "rgba(239, 68, 68, 0.2)", borderRadius: 12, padding: 12, marginTop: 16, gap: 8 },
  errorBannerText: { flex: 1, fontSize: 12, color: COLORS.error, fontWeight: "500" },
});

export default ConsentScreen;
