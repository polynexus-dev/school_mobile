import React, { useCallback, useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { COLORS } from "@/shared/theme/colors";
import { Button } from "@/shared/ui/Button";
import { authApi } from "../api/authApi";
import { useAuthStore, LinkedStudent } from "@store/authStore";
import { ROUTES } from "@/constants/route";

interface Candidate {
  linkId: number;
  student: LinkedStudent;
  selected: boolean;
}

function initials(first?: string, last?: string) {
  return `${(first?.[0] ?? "").toUpperCase()}${(last?.[0] ?? "").toUpperCase()}` || "?";
}

export const LinkChildrenScreen: React.FC = () => {
  const router = useRouter();
  const setStudents = useAuthStore((state) => state.setStudents);
  const user = useAuthStore((state) => state.user);

  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [admissionNo, setAdmissionNo] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const links = await authApi.getGuardianLinks();
      const pending = links
        .filter((l) => l.status === "pending")
        .map((l) => ({ linkId: l.id, student: l.student, selected: true }));
      setCandidates(pending);
    } catch (err: any) {
      Alert.alert("Couldn't load children", err.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const toggle = (linkId: number) => {
    setCandidates((prev) => prev.map((c) => (c.linkId === linkId ? { ...c, selected: !c.selected } : c)));
  };

  const handleRequestByAdmissionNo = async () => {
    if (!admissionNo.trim()) return;
    setRequesting(true);
    try {
      await authApi.requestGuardianLink(admissionNo.trim());
      Alert.alert("Request sent", "The school office will verify this link shortly.");
      setAddModalVisible(false);
      setAdmissionNo("");
      fetchCandidates();
    } catch (err: any) {
      Alert.alert("Couldn't send request", err.message || "Check the admission number and try again.");
    } finally {
      setRequesting(false);
    }
  };

  const selectedCount = candidates.filter((c) => c.selected).length;

  const handleConfirm = async () => {
    const ids = candidates.filter((c) => c.selected).map((c) => c.student.id);
    if (ids.length === 0) {
      Alert.alert("Select at least one child", "Confirm at least one child to continue.");
      return;
    }
    setConfirming(true);
    try {
      await authApi.confirmGuardianLinks(ids);
      const confirmedStudents = candidates.filter((c) => c.selected).map((c) => c.student);
      await setStudents(confirmedStudents);
      // The root layout's gate takes over next (consent check, then Parent home).
      router.replace(ROUTES.PARENT.DASHBOARD);
    } catch (err: any) {
      Alert.alert("Couldn't confirm", err.message || "Please try again.");
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.progressRow}>
          <View style={[styles.progressBar, styles.progressActive]} />
          <View style={[styles.progressBar, styles.progressActive]} />
          <View style={styles.progressBar} />
        </View>
        <Text style={styles.title}>Link your children</Text>
        <Text style={styles.subtitle}>
          We found these students linked to your number. Confirm each child.
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {candidates.map((c) => (
          <TouchableOpacity
            key={c.linkId}
            style={[styles.card, c.selected && styles.cardSelected]}
            onPress={() => toggle(c.linkId)}
            activeOpacity={0.8}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials(c.student.first_name, c.student.last_name)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>
                {c.student.first_name} {c.student.last_name}
              </Text>
              <Text style={styles.meta}>
                Class {c.student.class_section} · Roll {c.student.roll_no ?? "—"} · Adm no. {c.student.admission_no}
              </Text>
            </View>
            <View style={[styles.checkCircle, c.selected && styles.checkCircleOn]}>
              {c.selected && <Text style={styles.checkMark}>✓</Text>}
            </View>
          </TouchableOpacity>
        ))}

        {candidates.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No phone-matched children found yet.</Text>
            <Text style={styles.emptySubtext}>Use "Add another child" below with an admission number.</Text>
          </View>
        )}

        <TouchableOpacity style={styles.addCard} onPress={() => setAddModalVisible(true)} activeOpacity={0.8}>
          <View style={styles.addIcon}>
            <Text style={styles.addIconText}>+</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.addTitle}>Add another child</Text>
            <Text style={styles.addSubtitle}>Enter admission number to request a link</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>
            Your relationship to each child is verified by the school office. Linked children appear in the
            switcher at the top of every screen.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={`Confirm ${selectedCount} ${selectedCount === 1 ? "child" : "children"}`}
          onPress={handleConfirm}
          loading={confirming}
          disabled={selectedCount === 0}
        />
      </View>

      <Modal visible={addModalVisible} transparent animationType="slide" onRequestClose={() => setAddModalVisible(false)}>
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Request a link</Text>
            <Text style={styles.modalSubtitle}>Enter the child's admission number exactly as printed on their ID card.</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. GPS-2019-0231"
              placeholderTextColor={COLORS.textMuted}
              value={admissionNo}
              onChangeText={setAdmissionNo}
              autoCapitalize="characters"
            />
            <Button title="Send request" onPress={handleRequestByAdmissionNo} loading={requesting} style={{ marginTop: 16 }} />
            <TouchableOpacity style={styles.modalCancel} onPress={() => setAddModalVisible(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.background },
  header: { paddingTop: 60, paddingHorizontal: 28 },
  progressRow: { flexDirection: "row", gap: 6, marginBottom: 22 },
  progressBar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: COLORS.border },
  progressActive: { backgroundColor: COLORS.primary },
  title: { fontSize: 22, fontWeight: "700", color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 6, lineHeight: 21 },
  list: { padding: 20, paddingBottom: 40, gap: 14 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  cardSelected: {
    borderColor: COLORS.primary,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: COLORS.white, fontWeight: "700", fontSize: 18 },
  name: { fontSize: 15.5, fontWeight: "600", color: COLORS.text },
  meta: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkCircleOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  checkMark: { color: COLORS.white, fontWeight: "700", fontSize: 13 },
  emptyState: { alignItems: "center", paddingVertical: 20 },
  emptyText: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  emptySubtext: { fontSize: 12.5, color: COLORS.textSecondary, marginTop: 4, textAlign: "center" },
  addCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: COLORS.accent,
  },
  addIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#F5F3FF",
    alignItems: "center",
    justifyContent: "center",
  },
  addIconText: { color: COLORS.primary, fontSize: 24, fontWeight: "700" },
  addTitle: { fontSize: 15, fontWeight: "600", color: COLORS.primary },
  addSubtitle: { fontSize: 12.5, color: COLORS.textMuted, marginTop: 2 },
  noticeBox: { backgroundColor: "#F5F3FF", borderRadius: 16, padding: 14 },
  noticeText: { fontSize: 12.5, color: "#5B21B6", lineHeight: 19 },
  footer: { padding: 20, paddingBottom: 30, backgroundColor: COLORS.background },
  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: COLORS.text },
  modalSubtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 6, marginBottom: 16, lineHeight: 19 },
  modalInput: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    fontSize: 15,
    color: COLORS.text,
  },
  modalCancel: { alignItems: "center", marginTop: 14, paddingVertical: 8 },
  modalCancelText: { color: COLORS.textSecondary, fontWeight: "600", fontSize: 13.5 },
});

export default LinkChildrenScreen;
