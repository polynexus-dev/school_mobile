import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { COLORS } from "@/shared/theme/colors";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { authApi } from "../api/authApi";
import { ROUTES } from "@/constants/route";

/**
 * Parent onboarding — step 1. Login always hits the base URL / public schema;
 * the backend matches this phone number against a Guardian record to resolve
 * which school (tenant) it belongs to, same rationale as staff login.
 */
export const OtpRequestScreen: React.FC = () => {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequest = async () => {
    const trimmed = phone.trim();
    if (trimmed.length < 10) {
      Alert.alert("Enter a valid number", "Please enter the 10-digit mobile number the school has on file.");
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.requestParentOtp(trimmed);
      router.push({
        pathname: ROUTES.AUTH.OTP_VERIFY,
        params: { phone: trimmed, tenantSchema: res.tenant_schema ?? "" },
      });
    } catch (err: any) {
      Alert.alert("Couldn't send code", err.message || "This number isn't linked to any student yet.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Welcome to{"\n"}VIDYAM School</Text>
        <Text style={styles.heroSubtitle}>Powered by Polynexus</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Parent sign in</Text>
        <Text style={styles.subtitle}>
          Enter the mobile number your child's school has on record. We'll text you a one-time code.
        </Text>

        <Input
          label="Mobile number"
          placeholder="98XXXXXX42"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          maxLength={10}
        />

        <Button title="Send OTP" onPress={handleRequest} loading={loading} style={styles.button} />

        <Text style={styles.footnote}>
          Your data is protected under the DPDP Act 2023. Only your school can invite you.
        </Text>
      </ScrollView>
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
    fontFamily: Platform.select({ ios: undefined, android: undefined }),
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
    padding: 28,
    flexGrow: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 21,
  },
  button: {
    marginTop: 4,
  },
  footnote: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: 24,
    lineHeight: 18,
  },
});

export default OtpRequestScreen;
