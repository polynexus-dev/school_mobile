import React from "react";
import { Stack } from "expo-router";

/**
 * Stack only — no bottom tab bar. Confirmed from the Conductor App design
 * file: none of its screens show a tab bar (oversized glanceable UI instead).
 */
export default function ConductorLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="route" />
      <Stack.Screen name="scan" />
      <Stack.Screen name="trip-summary" />
      <Stack.Screen name="evening-drop" />
    </Stack>
  );
}
