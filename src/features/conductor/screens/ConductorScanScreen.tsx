import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useLocalSearchParams, useRouter } from "expo-router";
import { COLORS } from "@/shared/theme/colors";
import { conductorApi, ScanErrorKind, ScannedStudent, RosterStudent } from "../api/conductorApi";
import { ROUTES } from "@/constants/route";

const ERROR_COPY: Record<ScanErrorKind, { label: string; hint: string; recovery: string }> = {
  wrong_route: { label: "WRONG ROUTE", hint: "This student is subscribed to a different route.", recovery: "Resume scanning" },
  not_subscribed: { label: "NOT SUBSCRIBED", hint: "This student isn't subscribed to any bus route.", recovery: "Call school office" },
  already_scanned: { label: "ALREADY SCANNED", hint: "This student was already scanned boarding this trip.", recovery: "Resume scanning" },
  not_boarded: { label: "NOT BOARDED", hint: "This student hasn't been scanned boarding yet.", recovery: "Resume scanning" },
  already_alighted: { label: "ALREADY ALIGHTED", hint: "This student was already confirmed off the bus.", recovery: "Resume scanning" },
  no_receiving_adult: { label: "NO ADULT ON RECORD", hint: "No authorized adult was recorded to receive this student.", recovery: "Resume scanning" },
  unreadable: { label: "UNREADABLE", hint: "That ID card couldn't be matched to a student.", recovery: "Resume scanning" },
};

const initialsOf = (name: string) =>
  name.split(" ").filter(Boolean).map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";

type ScanState = { kind: "scanning" } | { kind: "success"; student: ScannedStudent } | { kind: "error"; error: ScanErrorKind };

export const ConductorScanScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ tripId?: string; routeId?: string }>();
  const tripId = Number(params.tripId);
  const routeId = Number(params.routeId);

  const [permission, requestPermission] = useCameraPermissions();
  const [state, setState] = useState<ScanState>({ kind: "scanning" });
  const [boardedCount, setBoardedCount] = useState(0);
  const [expectedCount, setExpectedCount] = useState(0);
  const [locked, setLocked] = useState(false);
  const rosterRef = useRef<RosterStudent[]>([]);

  useEffect(() => {
    if (!routeId || !tripId) return;
    const load = async () => {
      try {
        const [roster, scans] = await Promise.all([
          conductorApi.getRoster(routeId),
          conductorApi.getBoardingScans(tripId),
        ]);
        rosterRef.current = roster;
        setExpectedCount(roster.length);
        setBoardedCount(scans.length);
      } catch (err) {
        console.error("Failed to load roster/boarding scans:", err);
      }
    };
    load();
  }, [routeId, tripId]);

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (locked || !tripId) return;
    const studentId = parseInt(data, 10);
    if (!Number.isFinite(studentId)) {
      setState({ kind: "error", error: "unreadable" });
      return;
    }
    setLocked(true);
    const result = await conductorApi.scanBoarding(studentId, tripId);
    if ("scan" in result) {
      const student = rosterRef.current.find((s) => s.id === result.scan.student);
      const name = student?.full_name || student?.name || `Student #${result.scan.student}`;
      setState({
        kind: "success",
        student: {
          id: result.scan.student,
          name,
          initials: initialsOf(name),
          classSection: student?.class_section_name || "",
          stopName: "",
        },
      });
      setBoardedCount((c) => c + 1);
    } else {
      setState({ kind: "error", error: result.error.code });
    }
  };

  const resumeScanning = () => {
    setState({ kind: "scanning" });
    setLocked(false);
  };

  if (!permission) return <View style={s.root} />;
  if (!permission.granted) {
    return (
      <View style={[s.root, s.center]}>
        <Text style={s.permTitle}>Camera required</Text>
        <Text style={s.permSub}>Allow camera access to scan student ID cards.</Text>
        <TouchableOpacity onPress={requestPermission}>
          <Text style={s.permBtn}>Grant permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Text style={s.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Scan ID cards</Text>
          <Text style={s.headerSubtitle}>{boardedCount} of {expectedCount || "?"} boarded</Text>
        </View>
      </View>

      <View style={s.cameraFrame}>
        <CameraView
          style={StyleSheet.absoluteFill}
          onBarcodeScanned={state.kind === "scanning" ? handleBarcodeScanned : undefined}
        />
        <View style={s.scanCorners} />
        <View style={s.scanHint}>
          <Text style={s.scanHintText}>POINT AT THE QR ON THE ID CARD</Text>
        </View>
      </View>

      {state.kind === "success" && (
        <View style={s.successCard}>
          <View style={s.successRow}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{state.student.initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.studentName}>{state.student.name}</Text>
              {!!state.student.classSection && <Text style={s.studentMeta}>{state.student.classSection}</Text>}
            </View>
          </View>
          <View style={s.boardedPill}>
            <View style={s.boardedCheck}>
              <Text style={s.boardedCheckText}>✓</Text>
            </View>
            <Text style={s.boardedText}>BOARDED · {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text>
          </View>
          <Text style={s.notifiedText}>Parent notified automatically</Text>
        </View>
      )}

      {state.kind === "error" && (
        <View style={s.errorCard}>
          <View style={s.successRow}>
            <View style={[s.avatar, { backgroundColor: "#0891B2" }]}>
              <Text style={s.avatarText}>?</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.studentName}>Student</Text>
              <Text style={[s.studentMeta, { color: "#B91C1C" }]}>{ERROR_COPY[state.error].hint}</Text>
            </View>
          </View>
          <View style={s.errorPill}>
            <View style={s.errorX}>
              <Text style={s.errorXText}>✕</Text>
            </View>
            <Text style={s.errorText}>{ERROR_COPY[state.error].label}</Text>
          </View>
        </View>
      )}

      <View style={s.footer}>
        {state.kind === "scanning" ? (
          <View style={{ height: 56 }} />
        ) : state.kind === "success" ? (
          <View style={s.footerRow}>
            <TouchableOpacity style={s.primaryBtnFull} onPress={resumeScanning}>
              <Text style={s.primaryBtnText}>Next student →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={s.primaryBtnFull} onPress={resumeScanning}>
            <Text style={s.primaryBtnText}>{ERROR_COPY[state.error].recovery}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={s.tripSummaryLink}
          onPress={() => router.push({ pathname: ROUTES.CONDUCTOR.TRIP_SUMMARY, params: { tripId: String(tripId), routeId: String(routeId) } })}
        >
          <Text style={s.tripSummaryLinkText}>End boarding · view trip summary →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  center: { alignItems: "center", justifyContent: "center", padding: 32 },
  permTitle: { fontSize: 18, fontWeight: "700", color: COLORS.text, marginBottom: 8 },
  permSub: { fontSize: 13, color: COLORS.textSecondary, textAlign: "center", marginBottom: 18 },
  permBtn: { color: COLORS.primary, fontWeight: "700", fontSize: 15 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingTop: 56, paddingHorizontal: 20 },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: COLORS.surface, alignItems: "center", justifyContent: "center" },
  backBtnText: { fontSize: 16, color: COLORS.text },
  headerTitle: { fontSize: 15.5, fontWeight: "700", color: COLORS.text },
  headerSubtitle: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
  cameraFrame: { marginHorizontal: 18, marginTop: 14, height: 250, borderRadius: 24, overflow: "hidden", backgroundColor: "#181329" },
  scanCorners: { position: "absolute", left: "20%", top: "20%", right: "20%", bottom: "20%", borderWidth: 3, borderColor: "rgba(16,185,129,0.8)", borderRadius: 18 },
  scanHint: { position: "absolute", bottom: 12, alignSelf: "center", backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  scanHintText: { color: "#A7F3D0", fontSize: 10.5, fontWeight: "700" },
  successCard: { margin: 18, backgroundColor: COLORS.surface, borderWidth: 2.5, borderColor: COLORS.success, borderRadius: 26, padding: 20 },
  errorCard: { margin: 18, backgroundColor: COLORS.surface, borderWidth: 2.5, borderColor: COLORS.error, borderRadius: 26, padding: 20 },
  successRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  avatar: { width: 68, height: 68, borderRadius: 18, backgroundColor: COLORS.secondary, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 22 },
  studentName: { fontSize: 19, fontWeight: "700", color: COLORS.text },
  studentMeta: { fontSize: 13, color: "#047857", marginTop: 3, fontWeight: "600" },
  boardedPill: { marginTop: 16, backgroundColor: COLORS.success, borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9 },
  boardedCheck: { width: 24, height: 24, borderRadius: 12, backgroundColor: "#04241A", alignItems: "center", justifyContent: "center" },
  boardedCheckText: { color: "#6EE7B7", fontWeight: "800" },
  boardedText: { color: "#04241A", fontWeight: "800", fontSize: 17 },
  notifiedText: { textAlign: "center", fontSize: 11.5, color: COLORS.textMuted, marginTop: 9 },
  errorPill: { marginTop: 16, backgroundColor: COLORS.error, borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9 },
  errorX: { width: 24, height: 24, borderRadius: 12, backgroundColor: "#3F0606", alignItems: "center", justifyContent: "center" },
  errorXText: { color: "#FECACA", fontWeight: "800" },
  errorText: { color: "#fff", fontWeight: "800", fontSize: 17 },
  footer: { paddingHorizontal: 20, paddingBottom: 30, marginTop: "auto", gap: 10 },
  footerRow: { flexDirection: "row", gap: 12 },
  primaryBtnFull: { height: 54, borderRadius: 16, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 14.5 },
  tripSummaryLink: { alignItems: "center", paddingVertical: 6 },
  tripSummaryLinkText: { color: COLORS.textMuted, fontSize: 12, fontWeight: "600" },
});

export default ConductorScanScreen;
