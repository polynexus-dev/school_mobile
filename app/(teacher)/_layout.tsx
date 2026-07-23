import React from "react";
import { Stack } from "expo-router";

export default function TeacherLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="mark-attendance" />
      <Stack.Screen name="corrections" />
      <Stack.Screen name="quick-create" />
      <Stack.Screen name="marks-entry" />
      <Stack.Screen name="notifications" />
    </Stack>
  );
}
