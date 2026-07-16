import React from "react";
import { Stack } from "expo-router";

export default function ParentLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="bus-tracking" />
      <Stack.Screen name="bus-alerts" />
      <Stack.Screen name="attendance" />
      <Stack.Screen name="fees" />
      <Stack.Screen name="results" />
      <Stack.Screen name="homework" />
      <Stack.Screen name="announcements" />
      <Stack.Screen name="privacy-consent" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}
