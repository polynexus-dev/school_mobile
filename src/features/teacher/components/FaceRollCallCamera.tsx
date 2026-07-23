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
 * Classroom batch roll-call — camera-assisted manual confirmation.
 *
 * TODO(follow-up): wire this to the backend's batch-classroom-recognition
 * endpoint (see plan: "new batch scan a room API surface") and drive the
 * per-face overlay + recognized count from real InsightFace results. Until
 * that pipeline exists, this must NOT claim to have matched or
 * liveness-checked anyone — no recognition happens here yet, so the camera
 * is shown for the teacher's own visual reference only, and "Submit" marks
 * the whole roster present as an explicit manual action.
 */
export const FaceRollCallCamera: React.FC<Props> = ({ roster, onSubmit, onCancel, submitting }) => {
  const [permission, requestPermission] = useCameraPermissions();

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
        <Text style={s.scanBannerText}>CAMERA VIEW · MANUAL ROLL CALL</Text>
      </View>

      <TouchableOpacity style={s.cancelBtn} onPress={onCancel}>
        <Text style={s.cancelBtnText}>✕ Close</Text>
      </TouchableOpacity>

      <View style={s.footer}>
        <Text style={s.footerTitle}>
          No automatic recognition yet — confirm all {roster.length} present manually
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
  footer: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 22, paddingBottom: 34, backgroundColor: "rgba(0,0,0,0.4)" },
  footerTitle: { color: "#fff", fontWeight: "600", fontSize: 15, marginBottom: 12 },
  footerRow: { flexDirection: "row", gap: 12 },
  reviewBtn: { flex: 1, height: 54, borderRadius: 16, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.3)", alignItems: "center", justifyContent: "center" },
  reviewBtnText: { color: "#fff", fontWeight: "600", fontSize: 13.5 },
  submitBtn: { flex: 1.4, height: 54, borderRadius: 16, backgroundColor: "#10B981", alignItems: "center", justifyContent: "center" },
  submitBtnText: { color: "#04241A", fontWeight: "700", fontSize: 14.5 },
});

export default FaceRollCallCamera;
