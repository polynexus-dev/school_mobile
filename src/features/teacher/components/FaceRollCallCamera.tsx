import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { RosterStudent } from "../api/teacherApi";

interface Props {
  roster: RosterStudent[];
  onSubmit: (recognizedIds: number[]) => void;
  onCancel: () => void;
  submitting?: boolean;
}

/**
 * Classroom batch roll-call camera — visual scaffold only.
 *
 * TODO(follow-up): wire this to the backend's batch-classroom-recognition
 * endpoint (see plan: "new batch scan a room API surface"). For now it
 * shows the CampusFlow-style dark scanning UI with static sample face boxes
 * and, on "Submit", simply marks every roster student present — matching
 * the design's face roll-call layout without the real InsightFace pipeline.
 */
export const FaceRollCallCamera: React.FC<Props> = ({ roster, onSubmit, onCancel, submitting }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const recognizedCount = Math.max(roster.length - 1, 0); // simulated: "all but one" recognized

  if (!permission) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color="#A78BFA" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={s.centered}>
        <Text style={s.permTitle}>Camera required</Text>
        <Text style={s.permSub}>Allow camera access to batch-scan the classroom.</Text>
        <TouchableOpacity onPress={requestPermission}>
          <Text style={s.permBtn}>Grant permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <CameraView style={StyleSheet.absoluteFill} facing="back" />

      <View style={s.scanBanner}>
        <View style={s.liveDot} />
        <Text style={s.scanBannerText}>SCANNING · POINT AT THE CLASS</Text>
      </View>

      <TouchableOpacity style={s.cancelBtn} onPress={onCancel}>
        <Text style={s.cancelBtnText}>✕ Close</Text>
      </TouchableOpacity>

      {/* Static sample face boxes — decorative placeholder for the real
          batch-recognition overlay described in the design. */}
      <View style={[s.faceBox, s.faceBoxGreen, { left: "10%", top: "22%" }]}>
        <Text style={s.faceBoxLabel}>MATCHED ✓</Text>
      </View>
      <View style={[s.faceBox, s.faceBoxGreen, { left: "44%", top: "32%" }]}>
        <Text style={s.faceBoxLabel}>MATCHED ✓</Text>
      </View>
      <View style={[s.faceBox, s.faceBoxAmber, { left: "70%", top: "20%" }]}>
        <Text style={[s.faceBoxLabel, s.faceBoxLabelAmber]}>CONFIRM?</Text>
      </View>

      <View style={s.liveness}>
        <Text style={s.livenessText}>LIVENESS ON</Text>
      </View>

      <View style={s.footer}>
        <Text style={s.footerTitle}>
          Recognized · {recognizedCount} of {roster.length}
        </Text>
        <View style={s.footerRow}>
          <TouchableOpacity style={s.reviewBtn} onPress={onCancel}>
            <Text style={s.reviewBtnText}>Switch to manual</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.submitBtn}
            disabled={submitting}
            onPress={() => onSubmit(roster.map((r) => r.id))}
          >
            {submitting ? (
              <ActivityIndicator color="#04241A" />
            ) : (
              <Text style={s.submitBtnText}>Submit {roster.length} present</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0E0A1F" },
  centered: { flex: 1, backgroundColor: "#0E0A1F", alignItems: "center", justifyContent: "center", padding: 32 },
  permTitle: { color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 8 },
  permSub: { color: "#94A3B8", fontSize: 13, textAlign: "center", marginBottom: 20 },
  permBtn: { color: "#A78BFA", fontSize: 15, fontWeight: "700" },
  scanBanner: {
    position: "absolute",
    top: 56,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#22D3EE" },
  scanBannerText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  cancelBtn: {
    position: "absolute",
    top: 56,
    right: 16,
    backgroundColor: "rgba(15,23,42,0.75)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  cancelBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  faceBox: { position: "absolute", width: 74, height: 88, borderRadius: 16, borderWidth: 2.5 },
  faceBoxGreen: { borderColor: "#10B981" },
  faceBoxAmber: { borderColor: "#F59E0B", borderStyle: "dashed" },
  faceBoxLabel: {
    position: "absolute",
    bottom: -22,
    left: 0,
    right: 0,
    textAlign: "center",
    color: "#04241A",
    backgroundColor: "#10B981",
    fontSize: 9.5,
    fontWeight: "800",
    borderRadius: 7,
    paddingVertical: 2,
  },
  faceBoxLabelAmber: { backgroundColor: "#F59E0B", color: "#3A2503" },
  liveness: {
    position: "absolute",
    bottom: 150,
    right: 16,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  livenessText: { color: "#A5F3FC", fontSize: 11, fontWeight: "700" },
  footer: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 22, paddingBottom: 34, backgroundColor: "rgba(0,0,0,0.4)" },
  footerTitle: { color: "#fff", fontWeight: "600", fontSize: 15, marginBottom: 12 },
  footerRow: { flexDirection: "row", gap: 12 },
  reviewBtn: { flex: 1, height: 54, borderRadius: 16, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.3)", alignItems: "center", justifyContent: "center" },
  reviewBtnText: { color: "#fff", fontWeight: "600", fontSize: 13.5 },
  submitBtn: { flex: 1.4, height: 54, borderRadius: 16, backgroundColor: "#10B981", alignItems: "center", justifyContent: "center" },
  submitBtnText: { color: "#04241A", fontWeight: "700", fontSize: 14.5 },
});

export default FaceRollCallCamera;
