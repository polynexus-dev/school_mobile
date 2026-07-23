import React, { useState, useEffect } from "react";
import {
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
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { useAuthStore } from "@store/authStore";
import { storage } from "@services/storage/secureStore";
import { authApi } from "../api/authApi";
import { ROUTES } from "@/constants/route";

type LoginMethod = "password" | "otp";

export const LoginScreen: React.FC = () => {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const setSchoolDomain = useAuthStore((state) => state.setSchoolDomain);
  const setSchoolSchema = useAuthStore((state) => state.setSchoolSchema);

  const [loginMethod, setLoginMethod] = useState<LoginMethod>("password"); // password as default primary
  const [loading, setLoading] = useState(false);

  // Password Login Fields (Works for Teacher, Conductor, and Parent)
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // OTP Login Fields (Parent onboarding/recovery)
  const [phone, setPhone] = useState("");

  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const loadSavedCredentials = async () => {
      try {
        const storedRememberMe = await storage.getItem("cns_remember_me");
        if (storedRememberMe === "true") {
          setRememberMe(true);
          const storedUsername = await storage.getItem("cns_saved_username");
          const storedPassword = await storage.getItem("cns_saved_password");
          const storedPhone = await storage.getItem("cns_saved_phone");
          if (storedUsername) setUsername(storedUsername);
          if (storedPassword) setPassword(storedPassword);
          if (storedPhone) setPhone(storedPhone);
        }
      } catch (err) {
        console.error("Failed to load saved credentials:", err);
      }
    };
    loadSavedCredentials();
  }, []);

  const validatePasswordFields = () => {
    const nextErrors: Record<string, string> = {};
    if (!username) nextErrors.username = "Username or Email is required";
    if (!password) nextErrors.password = "Password is required";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handlePasswordLogin = async () => {
    if (!validatePasswordFields()) return;
    setLoading(true);

    try {
      const result = await authApi.login(username, password);
      await setSchoolDomain(result.tenant_domain ?? null);
      await setSchoolSchema(result.tenant_schema ?? null);
      await setAuth(result.profile, result.access);

      if (rememberMe) {
        await storage.setItem("cns_remember_me", "true");
        await storage.setItem("cns_saved_username", username);
        await storage.setItem("cns_saved_password", password);
      } else {
        await storage.removeItem("cns_remember_me");
        await storage.removeItem("cns_saved_username");
        await storage.removeItem("cns_saved_password");
      }
    } catch (err: any) {
      setSchoolDomain(null);
      setSchoolSchema(null);
      Alert.alert("Login Failed", err.message || "Invalid credentials, please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleParentOtpRequest = async () => {
    const trimmed = phone.trim();
    if (trimmed.length < 10) {
      Alert.alert("Enter a valid number", "Please enter the 10-digit mobile number the school has on file.");
      return;
    }
    setLoading(true);
    try {
      await authApi.requestParentOtp(trimmed);
      if (rememberMe) {
        await storage.setItem("cns_remember_me", "true");
        await storage.setItem("cns_saved_phone", trimmed);
      } else {
        await storage.removeItem("cns_remember_me");
        await storage.removeItem("cns_saved_phone");
      }
      router.push({ pathname: ROUTES.AUTH.OTP_VERIFY, params: { phone: trimmed } });
    } catch (err: any) {
      Alert.alert("Couldn't send code", err.message || "This number isn't linked to any student yet.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-violet-955"
      style={{ backgroundColor: "#2e1065" }}
    >
      <StatusBar style="light" />

      {/* Decorative Glow Elements */}
      <View 
        className="absolute -top-24 -right-24 w-80 h-80 rounded-full opacity-20" 
        style={{ backgroundColor: "#8b5cf6" }} 
      />
      <View 
        className="absolute -bottom-28 -left-28 w-80 h-80 rounded-full opacity-15" 
        style={{ backgroundColor: "#d946ef" }} 
      />

      <ScrollView 
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center mb-8">
          <View className="w-20 h-20 bg-white rounded-3xl justify-center items-center mb-4 shadow-lg shadow-black/30">
            <Image 
              source={require("../../../../assets/campus_nexus_icon.png")} 
              className="w-12 h-12" 
              resizeMode="contain" 
            />
          </View>
          <Text className="text-3xl font-extrabold text-white tracking-wider">
            Campus<Text className="text-violet-300">Nexus</Text>
          </Text>
          <Text className="text-sm text-white/70 mt-1.5 font-semibold tracking-wide">
            School Edition
          </Text>
        </View>

        <View className="bg-white rounded-3xl p-6 shadow-xl shadow-black/25">
          <Text className="text-xl font-extrabold text-slate-800 mb-1">
            Welcome back
          </Text>
          <Text className="text-sm text-slate-500 mb-6">
            {loginMethod === "password" 
              ? "Sign in with your username or email" 
              : "Enter your registered mobile number"
            }
          </Text>

          {/* Dynamic Form Content */}
          {loginMethod === "password" ? (
            <View>
              <Input
                label="Username / Email"
                placeholder="Enter username or email"
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
              <TouchableOpacity 
                activeOpacity={0.7} 
                onPress={() => setRememberMe(!rememberMe)}
                style={{ flexDirection: "row", alignItems: "center", marginVertical: 12 }}
              >
                <Ionicons 
                  name={rememberMe ? "checkbox" : "square-outline"} 
                  size={20} 
                  color="#7c3aed"
                />
                <Text style={{ marginLeft: 8, fontSize: 13.5, color: "#475569" }}>
                  Remember me
                </Text>
              </TouchableOpacity>
              <Button 
                title="Sign In" 
                onPress={handlePasswordLogin} 
                loading={loading} 
                style={{ marginTop: 8 }}
              />

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setLoginMethod("otp")}
                className="mt-6 items-center"
              >
                <Text className="text-sm font-bold text-violet-600">
                  Parent? Sign in with Mobile OTP instead →
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <Input
                label="Mobile number"
                placeholder="98XXXXXX42"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={10}
              />
              <TouchableOpacity 
                activeOpacity={0.7} 
                onPress={() => setRememberMe(!rememberMe)}
                style={{ flexDirection: "row", alignItems: "center", marginVertical: 12 }}
              >
                <Ionicons 
                  name={rememberMe ? "checkbox" : "square-outline"} 
                  size={20} 
                  color="#7c3aed"
                />
                <Text style={{ marginLeft: 8, fontSize: 13.5, color: "#475569" }}>
                  Remember me
                </Text>
              </TouchableOpacity>
              <Button 
                title="Send OTP" 
                onPress={handleParentOtpRequest} 
                loading={loading} 
                style={{ marginTop: 8 }}
              />

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setLoginMethod("password")}
                className="mt-6 items-center"
              >
                <Text className="text-sm font-bold text-violet-600">
                  Sign in with Username & Password instead →
                </Text>
              </TouchableOpacity>

              <Text className="text-[11px] text-slate-400 text-center leading-normal mt-6 px-2">
                Your data is protected under the DPDP Act 2023. We will send a 6-digit one-time passcode to this number.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;
