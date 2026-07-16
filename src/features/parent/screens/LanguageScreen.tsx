import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ScreenWrapper } from "@/shared/ui/ScreenWrapper";
import { COLORS } from "@/shared/theme/colors";

type Lang = "en" | "mr" | "hi";

const LANGS: { code: Lang; label: string; sub: string }[] = [
  { code: "en", label: "English", sub: "Default" },
  { code: "mr", label: "मराठी", sub: "Marathi" },
  { code: "hi", label: "हिन्दी", sub: "Hindi" },
];

const PREVIEW: Record<Lang, { line1: string; line2: string; line3: string; line4: string }> = {
  en: {
    line1: "Aarav boarded at 7:42 AM",
    line2: "Scanned at Datta Chowk · Conductor: R. Pawar",
    line3: "Term 2 fee due · ₹12,500",
    line4: "Pay by 20 July",
  },
  mr: {
    line1: "आरव ७:४२ वाजता बसमध्ये चढला",
    line2: "दत्त चौक येथे स्कॅन · वाहक: आर. पवार",
    line3: "सत्र २ शुल्क देय · ₹१२,५००",
    line4: "२० जुलैपर्यंत भरा",
  },
  hi: {
    line1: "आरव सुबह 7:42 बजे बस में चढ़ा",
    line2: "दत्त चौक पर स्कैन · कंडक्टर: आर. पवार",
    line3: "सत्र 2 शुल्क बकाया · ₹12,500",
    line4: "20 जुलाई तक भुगतान करें",
  },
};

export const LanguageScreen: React.FC = () => {
  const router = useRouter();
  const [selected, setSelected] = useState<Lang>("en");
  const preview = PREVIEW[selected];

  return (
    <ScreenWrapper title="App language" showHeader showBack scrollable contentContainerStyle={styles.content}>
      <Text style={styles.subtitle}>
        Announcements from the school are shown in their original language with translation available.
      </Text>

      {LANGS.map((l) => (
        <TouchableOpacity
          key={l.code}
          style={[styles.row, selected === l.code && styles.rowOn]}
          onPress={() => setSelected(l.code)}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.rowLabel}>{l.label}</Text>
            <Text style={styles.rowSub}>{l.sub}</Text>
          </View>
          <View style={[styles.radio, selected === l.code && styles.radioOn]} />
        </TouchableOpacity>
      ))}

      <View style={styles.previewCard}>
        <Text style={styles.previewLabel}>PREVIEW · {LANGS.find((l) => l.code === selected)?.label}</Text>
        <View style={styles.previewBlock}>
          <Text style={styles.previewLine1}>{preview.line1}</Text>
          <Text style={styles.previewLine2}>{preview.line2}</Text>
        </View>
        <View style={styles.previewBlock}>
          <Text style={styles.previewLine1}>{preview.line3}</Text>
          <Text style={styles.previewLine2}>{preview.line4}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.applyBtn}
        onPress={() => {
          Alert.alert("Language updated (preview only)", "Full localization isn't wired to app strings yet.");
          router.back();
        }}
      >
        <Text style={styles.applyBtnText}>Apply</Text>
      </TouchableOpacity>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 30, gap: 11 },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 19, marginBottom: 4 },
  row: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 18, padding: 16, flexDirection: "row", alignItems: "center", gap: 13 },
  rowOn: { borderWidth: 1.5, borderColor: COLORS.primary },
  rowLabel: { fontSize: 15, fontWeight: "600", color: COLORS.text },
  rowSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: "#D1D5DB", backgroundColor: "#fff" },
  radioOn: { borderWidth: 6.5, borderColor: COLORS.primary },
  previewCard: { marginTop: 8, backgroundColor: COLORS.surface, borderRadius: 20, padding: 18, gap: 10 },
  previewLabel: { fontSize: 11, fontWeight: "700", color: COLORS.textMuted, letterSpacing: 0.5 },
  previewBlock: { backgroundColor: COLORS.background, borderRadius: 14, padding: 14 },
  previewLine1: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  previewLine2: { fontSize: 12.5, color: COLORS.textSecondary, marginTop: 3 },
  applyBtn: { marginTop: 10, height: 56, borderRadius: 16, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
  applyBtnText: { color: "#fff", fontWeight: "700", fontSize: 15.5 },
});

export default LanguageScreen;
