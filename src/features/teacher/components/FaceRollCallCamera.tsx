import React, { useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { RosterStudent, AttendanceStatus, BatchRecognitionResult } from "../api/teacherApi";

interface Props {
  roster: RosterStudent[];
  onScan: (imageUri: string) => Promise<BatchRecognitionResult>;
  onFinish: (missingStatuses: Record<number, AttendanceStatus>) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
}

type Stage = "camera" | "scanning" | "result";

function initials(name: string | null) {
  if (!name) return "?";
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";
}

/**
 * Classroom batch roll-call — one photo, matched against every registered
 * face for this class via the real backend recognition pipeline
 * (BatchClassroomRecognitionView). Matched students are already written as
 * present server-side by the time this shows results; anyone it couldn't
 * confidently match is listed for the teacher to confirm by hand.
 */
export const FaceRollCallCamera: React.FC<Props> = ({ roster, onScan, onFinish, onCancel, submitting }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [stage, setStage] = useState<Stage>("camera");
  const [result, setResult] = useState<BatchRecognitionResult | null>(null);
  const [missingStatuses, setMissingStatuses] = useState<Record<number, AttendanceStatus>>({});
  const [scanError, setScanError] = useState<string | null>(null);

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

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    setScanError(null);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      setStage("scanning");
      if (!photo?.uri) throw new Error("Couldn't capture a photo — try again.");
      const scanResult = await onScan(photo.uri);
      setResult(scanResult);
      const matchedIds = new Set(scanResult.matches.map((m) => m.student_id));
      const initial: Record<number, AttendanceStatus> = {};
      // Anyone the roster has that the scan didn't match (including the
      // whole roster on a no-face/no-registered-faces outcome) needs a
      // manual call — default to absent since the scan didn't see them.
      roster.forEach((r) => {
        if (!matchedIds.has(r.id)) initial[r.id] = "absent";
      });
      setMissingStatuses(initial);
      setStage("result");
    } catch (err: any) {
      console.warn("Face roll call capture error:", err);
      const detail = err?.response?.data?.error || err?.response?.data?.detail || err?.message || "Recognition failed — try rescanning or switch to manual.";
      setScanError(detail);
      setStage("camera");
    }
  };

  const toggleMissing = (id: number) => {
    setMissingStatuses((prev) => ({ ...prev, [id]: prev[id] === "present" ? "absent" : "present" }));
  };

  const missingRoster = result
    ? roster.filter((r) => result.matches.every((m) => m.student_id !== r.id))
    : [];

  if (stage === "scanning") {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color="#A78BFA" />
        <Text style={s.scanningText}>Analysing classroom photo…</Text>
      </View>
    );
  }

  if (stage === "result" && result) {
    const matchedCount = result.matches.length;
    return (
      <View style={s.resultRoot}>
        <View style={s.resultHeader}>
          <Text style={s.resultTitle}>
            {result.status === "ok" ? `${matchedCount} of ${roster.length} recognised` : "No matches found"}
          </Text>
          {result.message && <Text style={s.resultSubtitle}>{result.message}</Text>}
          {result.status === "ok" && (
            <Text style={s.resultSubtitle}>
              {result.faces_detected ?? 0} face(s) detected · {matchedCount} marked present automatically
            </Text>
          )}
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={s.resultList}>
          {missingRoster.length === 0 ? (
            <Text style={s.emptyText}>Everyone in this class was recognised. Nothing left to confirm.</Text>
          ) : (
            <>
              <Text style={s.sectionLabel}>NEEDS MANUAL CONFIRMATION</Text>
              {missingRoster.map((r) => {
                const status = missingStatuses[r.id] ?? "absent";
                return (
                  <View key={r.id} style={s.rosterRow}>
                    <View style={s.rosterAvatar}>
                      <Text style={s.rosterAvatarText}>{initials(`${r.first_name} ${r.last_name ?? ""}`)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.rosterName}>{r.first_name} {r.last_name}</Text>
                      <Text style={s.rosterRoll}>Roll {r.roll_no ?? "—"}</Text>
                    </View>
                    <View style={s.toggleWrap}>
                      <TouchableOpacity style={[s.toggleBtn, status === "present" && s.toggleBtnPresentOn]} onPress={() => toggleMissing(r.id)}>
                        <Text style={[s.toggleText, status === "present" && s.toggleTextOn]}>P</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[s.toggleBtn, status === "absent" && s.toggleBtnAbsentOn]} onPress={() => toggleMissing(r.id)}>
                        <Text style={[s.toggleText, status === "absent" && s.toggleTextOn]}>A</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </>
          )}
        </ScrollView>

        <View style={s.resultFooter}>
          <TouchableOpacity style={s.reviewBtn} onPress={() => setStage("camera")}>
            <Text style={s.reviewBtnText}>Rescan</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.submitBtnLight}
            disabled={submitting}
            onPress={() => onFinish(missingStatuses)}
          >
            {submitting ? <ActivityIndicator color="#04241A" /> : <Text style={s.submitBtnText}>Done</Text>}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />

      <View style={s.scanBanner}>
        <Text style={s.scanBannerText}>POINT AT THE CLASSROOM &amp; CAPTURE</Text>
      </View>

      <TouchableOpacity style={s.cancelBtn} onPress={onCancel}>
        <Text style={s.cancelBtnText}>✕ Close</Text>
      </TouchableOpacity>

      {scanError && (
        <View style={s.errorBanner}>
          <Text style={s.errorBannerText}>{scanError}</Text>
        </View>
      )}

      <View style={s.footer}>
        <Text style={s.footerTitle}>{roster.length} students on this roster</Text>
        <View style={s.footerRow}>
          <TouchableOpacity style={s.reviewBtn} onPress={onCancel}>
            <Text style={s.reviewBtnText}>Switch to manual</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.captureBtn} onPress={handleCapture}>
            <Text style={s.captureBtnText}>📸 Scan classroom</Text>
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
  scanningText: { color: "#fff", fontSize: 14.5, fontWeight: "600", marginTop: 16 },
  scanBanner: {
    position: "absolute", top: 56, left: 16, flexDirection: "row", alignItems: "center", gap: 7,
    backgroundColor: "rgba(0,0,0,0.45)", borderRadius: 10, paddingHorizontal: 11, paddingVertical: 6,
  },
  scanBannerText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  cancelBtn: {
    position: "absolute", top: 56, right: 16, backgroundColor: "rgba(15,23,42,0.75)",
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
  },
  cancelBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  errorBanner: {
    position: "absolute", top: 104, left: 16, right: 16, backgroundColor: "rgba(239,68,68,0.92)",
    borderRadius: 12, padding: 12,
  },
  errorBannerText: { color: "#fff", fontSize: 12.5, fontWeight: "600" },
  footer: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 22, paddingBottom: 34, backgroundColor: "rgba(0,0,0,0.4)" },
  footerTitle: { color: "#fff", fontWeight: "600", fontSize: 15, marginBottom: 12 },
  footerRow: { flexDirection: "row", gap: 12 },
  reviewBtn: { flex: 1, height: 54, borderRadius: 16, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.3)", alignItems: "center", justifyContent: "center" },
  reviewBtnText: { color: "#fff", fontWeight: "600", fontSize: 13.5 },
  captureBtn: { flex: 1.4, height: 54, borderRadius: 16, backgroundColor: "#10B981", alignItems: "center", justifyContent: "center" },
  captureBtnText: { color: "#04241A", fontWeight: "700", fontSize: 14.5 },
  // Result / review screen
  resultRoot: { flex: 1, backgroundColor: "#0E0A1F" },
  resultHeader: { paddingTop: 64, paddingHorizontal: 22, paddingBottom: 16 },
  resultTitle: { color: "#fff", fontSize: 19, fontWeight: "700" },
  resultSubtitle: { color: "rgba(255,255,255,0.65)", fontSize: 12.5, marginTop: 4 },
  resultList: { padding: 18, paddingBottom: 20, gap: 9 },
  sectionLabel: { color: "rgba(255,255,255,0.45)", fontSize: 10.5, fontWeight: "700", letterSpacing: 0.5, marginBottom: 4 },
  emptyText: { color: "rgba(255,255,255,0.6)", textAlign: "center", marginTop: 30, fontSize: 13.5 },
  rosterRow: { backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 16, padding: 12, flexDirection: "row", alignItems: "center", gap: 12 },
  rosterAvatar: { width: 38, height: 38, borderRadius: 12, backgroundColor: "#7C3AED", alignItems: "center", justifyContent: "center" },
  rosterAvatarText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  rosterName: { fontSize: 14, fontWeight: "600", color: "#fff" },
  rosterRoll: { fontSize: 11.5, color: "rgba(255,255,255,0.5)", marginTop: 1 },
  toggleWrap: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 12, padding: 3, gap: 2 },
  toggleBtn: { borderRadius: 9, paddingVertical: 7, paddingHorizontal: 14 },
  toggleBtnPresentOn: { backgroundColor: "#10B981" },
  toggleBtnAbsentOn: { backgroundColor: "#EF4444" },
  toggleText: { fontSize: 12.5, fontWeight: "700", color: "rgba(255,255,255,0.5)" },
  toggleTextOn: { color: "#fff" },
  resultFooter: { flexDirection: "row", gap: 12, padding: 22, paddingBottom: 34, backgroundColor: "rgba(255,255,255,0.04)" },
  submitBtnLight: { flex: 1.4, height: 54, borderRadius: 16, backgroundColor: "#10B981", alignItems: "center", justifyContent: "center" },
  submitBtnText: { color: "#04241A", fontWeight: "700", fontSize: 14.5 },
});

export default FaceRollCallCamera;
