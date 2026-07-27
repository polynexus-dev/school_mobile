import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { COLORS } from "@/shared/theme/colors";
import { Button } from "@/shared/ui/Button";
import { useAuthStore } from "@store/authStore";
import { authApi } from "../api/authApi";
import { ROUTES } from "@/constants/route";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

export const OtpVerifyScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone?: string; tenantSchema?: string }>();
  const phone = params.phone ?? "";
  const tenantSchema = params.tenantSchema ?? "";

  const setAuth = useAuthStore((state) => state.setAuth);
  const setSchoolDomain = useAuthStore((state) => state.setSchoolDomain);
  const setSchoolSchema = useAuthStore((state) => state.setSchoolSchema);

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [error, setError] = useState("");
  const inputRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);

  const handleDigitChange = (value: string, index: number) => {
    const clean = value.replace(/[^0-9]/g, "");
    const next = [...digits];
    next[index] = clean.slice(-1);
    setDigits(next);
    setError("");
    if (clean && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otp = digits.join("");
    if (otp.length !== OTP_LENGTH) {
      setError("Enter the full 6-digit code.");
      return;
    }
    if (!tenantSchema) {
      setError("Session expired — please request a new code.");
      return;
    }
    setVerifying(true);
    setError("");
    try {
      const result = await authApi.verifyParentOtp(phone, otp, tenantSchema);
      await setSchoolDomain(result.tenant_domain ?? null);
      await setSchoolSchema(result.tenant_schema ?? null);
      await setAuth(result.profile, result.access);

      // If the school has phone-matched candidate children awaiting the
      // parent's confirmation, route there next; otherwise the root layout's
      // gate takes over (consent check, then the Parent dashboard).
      try {
        const links = await authApi.getGuardianLinks();
        const pending = links.filter((l) => l.status === "pending");
        if (pending.length > 0) {
          router.replace(ROUTES.AUTH.LINK_CHILDREN);
          return;
        }
      } catch (linkErr) {
        console.error("Failed to check guardian links after OTP verify:", linkErr);
      }
    } catch (err: any) {
      setError(err.message || "Incorrect code. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (secondsLeft > 0 || !phone) return;
    setResending(true);
    try {
      await authApi.requestParentOtp(phone, tenantSchema || undefined);
      setSecondsLeft(RESEND_SECONDS);
      setDigits(Array(OTP_LENGTH).fill(""));
    } catch (err: any) {
      Alert.alert("Couldn't resend", err.message || "Please try again shortly.");
    } finally {
      setResending(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Welcome to{"\n"}VIDYAM School</Text>
        <Text style={styles.heroSubtitle}>Powered by Polynexus</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Verify your invite</Text>
        <Text style={styles.subtitle}>
          The school sent a one-time code to <Text style={styles.bold}>+91 {phone || "••••••••••"}</Text>
        </Text>

        <View style={styles.otpRow}>
          {digits.map((d, i) => (
            <TextInput
              key={i}
              ref={(r) => {
                inputRefs.current[i] = r;
              }}
              value={d}
              onChangeText={(v) => handleDigitChange(v, i)}
              onKeyPress={(e) => handleKeyPress(e, i)}
              keyboardType="number-pad"
              maxLength={1}
              style={[styles.otpBox, !!error && styles.otpBoxError]}
            />
          ))}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity onPress={handleResend} disabled={secondsLeft > 0 || resending} style={styles.resendRow}>
          <Text style={styles.resendText}>
            {secondsLeft > 0 ? `Didn't get it? Resend in 0:${String(secondsLeft).padStart(2, "0")}` : "Resend code"}
          </Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }} />

        <Button title="Verify & Continue" onPress={handleVerify} loading={verifying} />
        <Text style={styles.footnote}>Your data is protected under the DPDP Act 2023.</Text>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  hero: {
    height: 220,
    backgroundColor: COLORS.primaryDark,
    justifyContent: "flex-end",
    paddingHorizontal: 28,
    paddingBottom: 28,
  },
  heroTitle: {
    fontWeight: "700",
    fontSize: 26,
    color: COLORS.white,
    lineHeight: 32,
  },
  heroSubtitle: {
    fontSize: 13.5,
    color: "rgba(255,255,255,0.75)",
    marginTop: 8,
  },
  content: {
    flex: 1,
    padding: 28,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 6,
    marginBottom: 16,
    lineHeight: 21,
  },
  bold: {
    color: COLORS.text,
    fontWeight: "700",
  },
  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  otpBox: {
    width: 46,
    height: 56,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: "#F5F3FF",
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.primaryDark,
  },
  otpBoxError: {
    borderColor: COLORS.error,
    backgroundColor: "#FEF2F2",
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12.5,
    marginTop: 10,
    fontWeight: "600",
  },
  resendRow: {
    marginTop: 16,
    alignItems: "center",
  },
  resendText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  footnote: {
    fontSize: 11.5,
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: 14,
    lineHeight: 17,
  },
});

export default OtpVerifyScreen;
