import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal } from "react-native";
import { useAuthStore } from "@store/authStore";
import { COLORS } from "@/shared/theme/colors";

function initials(first?: string, last?: string) {
  return `${(first?.[0] ?? "").toUpperCase()}${(last?.[0] ?? "").toUpperCase()}` || "?";
}

interface Props {
  /** Renders light text/pill suited for a dark gradient header. */
  variant?: "light" | "surface";
}

export const ChildSwitcher: React.FC<Props> = ({ variant = "surface" }) => {
  const students = useAuthStore((s) => s.students);
  const activeStudentId = useAuthStore((s) => s.activeStudentId);
  const setActiveStudentId = useAuthStore((s) => s.setActiveStudentId);
  const [open, setOpen] = useState(false);

  const active = students.find((s) => s.id === activeStudentId) ?? students[0];

  if (!active) return null;

  return (
    <>
      <TouchableOpacity
        style={[styles.pill, variant === "light" ? styles.pillLight : styles.pillSurface]}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(active.first_name, active.last_name)}</Text>
        </View>
        <Text style={[styles.name, variant === "light" && styles.nameLight]}>
          {active.first_name} · {active.class_section}
        </Text>
        <Text style={[styles.caret, variant === "light" && styles.caretLight]}>▾</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Switch child</Text>
            {students.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={styles.sheetRow}
                onPress={() => {
                  setActiveStudentId(s.id);
                  setOpen(false);
                }}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials(s.first_name, s.last_name)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sheetName}>
                    {s.first_name} {s.last_name}
                  </Text>
                  <Text style={styles.sheetMeta}>Class {s.class_section}</Text>
                </View>
                {s.id === active.id && <Text style={styles.checkMark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },
  pillSurface: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  pillLight: { backgroundColor: "rgba(255,255,255,0.14)", borderWidth: 1, borderColor: "rgba(255,255,255,0.22)" },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.secondary, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 11 },
  name: { fontSize: 12.5, fontWeight: "600", color: COLORS.text },
  nameLight: { color: "#fff" },
  caret: { fontSize: 10, color: COLORS.textMuted },
  caretLight: { color: "rgba(255,255,255,0.7)" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 28 },
  sheet: { backgroundColor: COLORS.surface, borderRadius: 22, padding: 18 },
  sheetTitle: { fontSize: 15, fontWeight: "700", color: COLORS.text, marginBottom: 10 },
  sheetRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  sheetName: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  sheetMeta: { fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
  checkMark: { color: COLORS.primary, fontWeight: "700", fontSize: 15 },
});

export default ChildSwitcher;
