import "../global.css";
import React, { useEffect, useState } from "react";
import { Stack, router, useSegments, useRootNavigationState } from "expo-router";
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
  const segments = useSegments();
  const rootNavigationState = useRootNavigationState();
  const { isAuthenticated, isLoading, initializeAuth, user } = useAuthStore();
  const [isNavReady, setIsNavReady] = useState(false);

  useEffect(() => {
    // 1. Load persisted token/user values
    initializeAuth();
  }, []);

  // Safe navigation ready check to avoid race conditions with Expo Router context
  useEffect(() => {
    if (rootNavigationState?.key) {
      const t = setTimeout(() => setIsNavReady(true), 150);
      return () => clearTimeout(t);
    } else {
      setIsNavReady(false);
    }
  }, [rootNavigationState?.key]);

  useEffect(() => {
    if (isLoading || !isNavReady) return;

    const currentGroup = segments[0];
    const inConsentGroup = currentGroup === "(consent)";
    const inAuthGroup = currentGroup === "(auth)";
    const inAppGroup =
      currentGroup === "(teacher)" || currentGroup === "(parent)" || currentGroup === "(conductor)";

    const performRedirect = (route: string, retries = 0) => {
      try {
        router.replace(route as any);
      } catch (e) {
        if (retries < 15) {
          setTimeout(() => performRedirect(route, retries + 1), 80);
        } else {
          console.error("[Navigation] Redirect failed permanently after 15 retries:", e);
        }
      }
    };

    if (!isAuthenticated) {
      // Redirect to login if accessing any protected route while unauthenticated
      if (inAppGroup || inConsentGroup) {
        performRedirect(ROUTES.AUTH.LOGIN);
      }
      return;
    }

    // User is authenticated past this point.
    if (user && user.consent_given === false) {
      // Force to the DPDP consent gate until it is accepted.
      if (!inConsentGroup) {
        performRedirect(ROUTES.CONSENT.CONSENT);
      }
      return;
    }

    if (!user) return;

    const homeRoute = ROLE_HOME[user.role];
    const roleGroup = ROLE_GROUP[user.role];

    if (!homeRoute || !roleGroup) {
      console.error(`[Navigation] Invalid route mapping for role: ${user.role}`);
      return;
    }

    if (inAuthGroup || inConsentGroup) {
      performRedirect(homeRoute);
      return;
    }

    // Separator route groups per role (Teacher / Parent / Conductor) —
    // a user landing in a group that isn't their own gets bounced to their home.
    if (inAppGroup && currentGroup !== roleGroup) {
      performRedirect(homeRoute);
    }
  }, [isAuthenticated, isLoading, isNavReady, segments, user?.consent_given, user?.role]);

  if (isLoading || !isNavReady) {
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
