import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { COLORS } from "@/shared/theme/colors";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { useAuthStore } from "@store/authStore";
import { authApi } from "../api/authApi";
import { ROUTES } from "@/constants/route";

/**
 * Plain username + password login — for Teacher and Bus Conductor roles.
 * Parents never see this screen; they onboard via OTP (see OtpRequestScreen).
 */
export const LoginScreen: React.FC = () => {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const setSchoolDomain = useAuthStore((state) => state.setSchoolDomain);
  const setSchoolSchema = useAuthStore((state) => state.setSchoolSchema);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!username) nextErrors.username = "Username is required";
    if (!password) nextErrors.password = "Password is required";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);

    try {
      const result = await authApi.login(username, password);
      await setSchoolDomain(result.tenant_domain ?? null);
      await setSchoolSchema(result.tenant_schema ?? null);
      await setAuth(result.profile, result.access);
      // The root layout's auth gate takes over from here (consent check,
      // then role-based redirect into (teacher) or (conductor)).
    } catch (err: any) {
      setSchoolDomain(null);
      setSchoolSchema(null);
      Alert.alert("Login Failed", err.message || "Invalid credentials, please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <StatusBar style="light" />

      <View style={styles.glowTopRight} />
      <View style={styles.glowBottomLeft} />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image source={require("../../../../assets/campus_nexus_icon.png")} style={styles.logoImage} />
          </View>
          <Text style={styles.title}>
            Campus<Text style={styles.titleHighlight}>Nexus</Text>
          </Text>
          <Text style={styles.subtitle}>School Edition · Staff Sign In</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardGreeting}>Welcome back</Text>
          <Text style={styles.cardSubtitle}>Sign in as Teacher or Bus Conductor</Text>

          <Input
            label="Username"
            placeholder="Enter your username"
            value={username}
            onChangeText={setUsername}
            error={errors.username}
          />

          <Input
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            error={errors.password}
          />

          <Button title="Sign In" onPress={handleLogin} loading={loading} style={styles.button} />

          <TouchableOpacity
            style={styles.parentLink}
            onPress={() => router.push(ROUTES.AUTH.OTP_REQUEST)}
            activeOpacity={0.7}
          >
            <Text style={styles.parentLinkText}>Parent? Sign in with your mobile number →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryDark,
    position: "relative",
  },
  glowTopRight: {
    position: "absolute",
    top: -100,
    right: -100,
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: COLORS.secondary,
    opacity: 0.22,
    zIndex: -1,
  },
  glowBottomLeft: {
    position: "absolute",
    bottom: -120,
    left: -120,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: COLORS.accent,
    opacity: 0.18,
    zIndex: -1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    paddingTop: Platform.OS === "ios" ? 64 : 48,
    paddingBottom: 32,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoContainer: {
    width: 92,
    height: 92,
    borderRadius: 26,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  logoImage: {
    width: 58,
    height: 58,
    resizeMode: "contain",
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: COLORS.white,
    letterSpacing: 1,
  },
  titleHighlight: {
    color: "#C4B5FD",
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.75)",
    marginTop: 6,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 28,
    padding: 24,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
  cardGreeting: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 22,
  },
  button: {
    marginTop: 8,
  },
  parentLink: {
    marginTop: 20,
    alignItems: "center",
  },
  parentLinkText: {
    color: COLORS.primary,
    fontSize: 13.5,
    fontWeight: "700",
  },
});

export default LoginScreen;
