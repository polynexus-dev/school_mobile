import React, { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { useAuthStore, UserRole } from "@store/authStore";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { COLORS } from "@/shared/theme/colors";
import { StatusBar } from "expo-status-bar";
import { ROUTES } from "@/constants/route";

const ROLE_GROUP: Record<UserRole, string> = {
  teacher: "(teacher)",
  parent: "(parent)",
  conductor: "(conductor)",
};

const ROLE_HOME: Record<UserRole, string> = {
  teacher: ROUTES.TEACHER.DASHBOARD,
  parent: ROUTES.PARENT.DASHBOARD,
  conductor: ROUTES.CONDUCTOR.ROUTE,
};

function RootLayoutNav() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isLoading, initializeAuth, user } = useAuthStore();

  useEffect(() => {
    // 1. Load persisted token/user values
    initializeAuth();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const currentGroup = segments[0];
    const inConsentGroup = currentGroup === "(consent)";
    const inAuthGroup = currentGroup === "(auth)";
    const inAppGroup =
      currentGroup === "(teacher)" || currentGroup === "(parent)" || currentGroup === "(conductor)";

    if (!isAuthenticated) {
      // Redirect to login if accessing any protected route while unauthenticated
      if (inAppGroup || inConsentGroup) {
        router.replace(ROUTES.AUTH.LOGIN);
      }
      return;
    }

    // User is authenticated past this point.
    if (user && user.consent_given === false) {
      // Force to the DPDP consent gate until it is accepted.
      if (!inConsentGroup) {
        router.replace(ROUTES.CONSENT.CONSENT);
      }
      return;
    }

    if (!user) return;

    const homeRoute = ROLE_HOME[user.role];
    const roleGroup = ROLE_GROUP[user.role];

    if (inAuthGroup || inConsentGroup) {
      router.replace(homeRoute as any);
      return;
    }

    // Genuinely separate route groups per role (Teacher / Parent / Conductor) —
    // a user landing in a group that isn't their own gets bounced to their home.
    if (inAppGroup && currentGroup !== roleGroup) {
      router.replace(homeRoute as any);
    }
  }, [isAuthenticated, isLoading, segments, user?.consent_given, user?.role]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.background } }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(consent)" />
      <Stack.Screen name="(teacher)" />
      <Stack.Screen name="(parent)" />
      <Stack.Screen name="(conductor)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <RootLayoutNav />
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
});
