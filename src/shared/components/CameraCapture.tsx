import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Easing,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import FaceMeshOverlay from "./FaceMeshOverlay";

const { width: SW } = Dimensions.get("window");
const OVAL_W = SW * 0.58;
const OVAL_H = OVAL_W * 1.32;

interface AngleConfig {
  color: string;
  icon: string;
  label: string;
  sub: string;
  arrow: "left" | "right" | null;
}

const ANGLE: Record<string, AngleConfig> = {
  front: {
    color: "#6366F1",
    icon: "👤",
    label: "Look Straight Ahead",
    sub: "Position face in the oval and keep steady.",
    arrow: null,
  },
  left: {
    color: "#F59E0B",
    icon: "👈",
    label: "Turn Head SLIGHTLY Left",
    sub: "Turn head slightly (15°–30°) to the LEFT. Keep both eyes visible.",
    arrow: "left",
  },
  right: {
    color: "#EC4899",
    icon: "👉",
    label: "Turn Head SLIGHTLY Right",
    sub: "Turn head slightly (15°–30°) to the RIGHT. Keep both eyes visible.",
    arrow: "right",
  },
};

const ALIGN_DELAY = 1500;
const COUNTDOWN_FROM = 5; // 5-second countdown for front camera

interface CameraCaptureProps {
  onCapture: (uri: string) => void;
  onCancel?: () => void;
  angleGuide?: "front" | "left" | "right";
  guideText?: string;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  onCapture,
  onCancel,
  angleGuide = "front",
  guideText,
}) => {
  const cameraRef = useRef<any>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [facing, setFacing] = useState<"front" | "back">("front");
  const [autoTimerEnabled, setAutoTimerEnabled] = useState<boolean>(true);

  const [phase, setPhase] = useState<"aligning" | "countdown" | "captured">("aligning");
  const [countdown, setCountdown] = useState(COUNTDOWN_FROM);

  const alignTimerRef = useRef<any>(null);
  const countdownRef = useRef<any>(null);

  const arrowAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const resetFlowRef = useRef<() => void>(() => {});

  const startArrow = useCallback(() => {
    const cfg = ANGLE[angleGuide];
    if (!cfg || !cfg.arrow) return;
    arrowAnim.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(arrowAnim, { toValue: 1, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(arrowAnim, { toValue: 0, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, [angleGuide, arrowAnim]);

  const startPulse = useCallback(() => {
    pulseAnim.setValue(1);
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0, duration: 500, useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);

  const capture = useCallback(async () => {
    if (!cameraRef.current) return;
    setPhase("captured");
    if (alignTimerRef.current) clearTimeout(alignTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    pulseAnim.stopAnimation();
    arrowAnim.stopAnimation();

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        base64: false,
        skipProcessing: false,
      });
      if (photo?.uri) {
        await onCapture(photo.uri);
      }
    } catch (err) {
      console.warn("Capture error, resetting flow:", err);
      resetFlowRef.current();
    }
  }, [onCapture, pulseAnim, arrowAnim]);

  const startCountdown = useCallback(() => {
    let count = COUNTDOWN_FROM;
    setCountdown(count);
    countdownRef.current = setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count <= 0) {
        if (countdownRef.current) clearInterval(countdownRef.current);
        capture();
      }
    }, 1000);
  }, [capture]);

  const resetFlow = useCallback(() => {
    if (alignTimerRef.current) clearTimeout(alignTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    setPhase("aligning");
    setCountdown(COUNTDOWN_FROM);

    arrowAnim.stopAnimation(); arrowAnim.setValue(0);
    pulseAnim.stopAnimation(); pulseAnim.setValue(1);
    fadeAnim.stopAnimation(); fadeAnim.setValue(0);

    startArrow();

    Animated.timing(fadeAnim, {
      toValue: 1, duration: 400, useNativeDriver: true,
    }).start();

    // Auto-timer runs only when facing FRONT and autoTimerEnabled is true
    if (facing === "front" && autoTimerEnabled) {
      alignTimerRef.current = setTimeout(() => {
        setPhase("countdown");
        startPulse();
        startCountdown();
      }, ALIGN_DELAY);
    }
  }, [facing, autoTimerEnabled, arrowAnim, pulseAnim, fadeAnim, startArrow, startPulse, startCountdown]);

  resetFlowRef.current = resetFlow;

  useEffect(() => {
    resetFlow();
    return () => {
      if (alignTimerRef.current) clearTimeout(alignTimerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [angleGuide, facing, autoTimerEnabled, resetFlow]);

  const toggleCameraFacing = () => {
    const nextFacing = facing === "front" ? "back" : "front";
    setFacing(nextFacing);
    // When switching to back camera, default to manual mode so parent controls capture
    if (nextFacing === "back") {
      setAutoTimerEnabled(false);
    } else {
      setAutoTimerEnabled(true);
    }
  };

  if (!permission) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={s.centered}>
        <Text style={s.permTitle}>📷 Camera Access Required</Text>
        <Text style={s.permSub}>Allow camera access to capture your child's face angles.</Text>
        <TouchableOpacity style={s.permBtn} onPress={requestPermission}>
          <Text style={s.permBtnText}>Grant Permission</Text>
        </TouchableOpacity>
        {onCancel && (
          <TouchableOpacity style={[s.permBtn, s.permBtnSecondary]} onPress={onCancel}>
            <Text style={s.permBtnSecondaryText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  const cfg = ANGLE[angleGuide] || ANGLE.front;
  const color = cfg.color;
  const isAligning = phase === "aligning";
  const isCountdown = phase === "countdown";
  const isCaptured = phase === "captured";

  const arrowTX = arrowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: cfg.arrow === "left" ? [0, -20] : cfg.arrow === "right" ? [0, 20] : [0, 0],
  });

  const ovalColor = isCaptured ? "#22C55E" : isCountdown ? color : "#6366F1";

  return (
    <View style={s.root}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing} />

      {/* Header Controls Bar */}
      <View style={s.headerControls}>
        <TouchableOpacity style={s.controlPill} onPress={toggleCameraFacing} activeOpacity={0.8}>
          <Text style={s.controlPillText}>
            {facing === "front" ? "📷 Front (Selfie)" : "📸 Back Camera"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.controlPill, autoTimerEnabled ? s.controlPillActive : null]}
          onPress={() => setAutoTimerEnabled(!autoTimerEnabled)}
          activeOpacity={0.8}
        >
          <Text style={s.controlPillText}>
            {autoTimerEnabled ? "⏱ Auto (5s)" : "👆 Manual"}
          </Text>
        </TouchableOpacity>

        {onCancel && (
          <TouchableOpacity style={s.closeCircle} onPress={onCancel} activeOpacity={0.8}>
            <Text style={s.closeCircleText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Top Guidance Banner */}
      <View style={s.banner}>
        <Text style={s.bannerTitle}>{cfg.icon}  {cfg.label}</Text>
        <Text style={s.bannerSub}>{guideText || cfg.sub}</Text>
      </View>

      {/* Oval + Arrow + Mesh */}
      <View style={s.ovalArea}>
        {cfg.arrow && (
          <Animated.Text
            style={[
              s.arrow,
              cfg.arrow === "left" ? s.arrowL : s.arrowR,
              { transform: [{ translateX: arrowTX }] },
            ]}
          >
            {cfg.arrow === "left" ? "←" : "→"}
          </Animated.Text>
        )}

        <Animated.View
          style={[
            s.oval,
            {
              borderColor: ovalColor,
              shadowColor: ovalColor,
              opacity: fadeAnim,
              transform: [{ scale: isCountdown ? pulseAnim : 1 }],
              borderStyle: isAligning ? "dashed" : "solid",
            },
          ]}
        />

        <FaceMeshOverlay width={OVAL_W * 0.88} height={OVAL_H * 0.88} phase={phase} />

        <View style={s.ovalInner}>
          {isCaptured ? (
            <ActivityIndicator size="small" color="#22C55E" />
          ) : isCountdown ? (
            <>
              <Text style={[s.countNum, { color }]}>{countdown}</Text>
              <Text style={s.countLabel}>Hold steady</Text>
            </>
          ) : (
            <Text style={s.manualTag}>{facing === "back" ? "Back Camera Mode" : "Manual Click Ready"}</Text>
          )}
        </View>
      </View>

      {/* Bottom Footer */}
      <View style={s.footer}>
        <View style={[
          s.statusPill,
          isCountdown ? { borderColor: color, backgroundColor: `${color}22` }
          : isCaptured ? { borderColor: "#22C55E", backgroundColor: "#22C55E22" }
          : { borderColor: "#6366F1", backgroundColor: "#6366F122" },
        ]}>
          <Text style={s.statusText}>
            {isCaptured
              ? "✓ Photo Captured"
              : isCountdown
              ? `Auto-capturing in ${countdown}s...`
              : `Position face & tap button (${facing === "back" ? "Back Cam" : "Front Cam"})`}
          </Text>
        </View>

        <View style={s.shutterRow}>
          <TouchableOpacity
            style={s.flipCircleBtn}
            onPress={toggleCameraFacing}
            activeOpacity={0.8}
          >
            <Text style={s.flipCircleIcon}>🔄</Text>
            <Text style={s.flipCircleSub}>{facing === "front" ? "Back" : "Front"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.shutterBtn, { backgroundColor: isCaptured ? "#22C55E" : color }]}
            onPress={capture}
            disabled={isCaptured}
            activeOpacity={0.8}
          >
            <Text style={s.shutterText}>
              {isCaptured ? "Captured!" : `📸 Snap ${angleGuide.toUpperCase()} Photo`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "space-between",
  },
  centered: {
    flex: 1,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  permTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F8FAFC",
    marginBottom: 8,
  },
  permSub: {
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
    marginBottom: 20,
  },
  permBtn: {
    backgroundColor: "#7C3AED",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 4,
  },
  permBtnText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 14,
  },
  permBtnSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#475569",
    marginTop: 10,
  },
  permBtnSecondaryText: {
    color: "#94A3B8",
    fontWeight: "600",
    fontSize: 13,
  },
  headerControls: {
    marginTop: 50,
    marginHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    zIndex: 10,
  },
  controlPill: {
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  controlPillActive: {
    backgroundColor: "#7C3AED",
    borderColor: "#A78BFA",
  },
  controlPillText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  closeCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  closeCircleText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "700",
  },
  banner: {
    marginTop: 10,
    marginHorizontal: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
  },
  bannerTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  bannerSub: {
    color: "#CBD5E1",
    fontSize: 12,
    marginTop: 3,
    textAlign: "center",
  },
  ovalArea: {
    alignItems: "center",
    justifyContent: "center",
    height: OVAL_H + 40,
  },
  oval: {
    width: OVAL_W,
    height: OVAL_H,
    borderRadius: OVAL_W / 2,
    borderWidth: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 8,
  },
  ovalInner: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  countNum: {
    fontSize: 48,
    fontWeight: "900",
  },
  countLabel: {
    color: "#E2E8F0",
    fontSize: 12,
    fontWeight: "600",
    marginTop: -4,
  },
  manualTag: {
    color: "#CBD5E1",
    fontSize: 11,
    fontWeight: "700",
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  arrow: {
    position: "absolute",
    fontSize: 32,
    color: "#F59E0B",
    fontWeight: "900",
  },
  arrowL: { left: SW * 0.1 },
  arrowR: { right: SW * 0.1 },
  footer: {
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 12,
  },
  statusPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  shutterRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: 12,
  },
  flipCircleBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(30, 41, 59, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  flipCircleIcon: {
    fontSize: 18,
  },
  flipCircleSub: {
    fontSize: 9,
    color: "#E2E8F0",
    fontWeight: "700",
    marginTop: -2,
  },
  shutterBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  shutterText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
});

export const styles = s;

export default CameraCapture;
