import React from "react";
import { Stack } from "expo-router";

export default function FeesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="pay" />
      <Stack.Screen name="receipt" />
    </Stack>
  );
}
