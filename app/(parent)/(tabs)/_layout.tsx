import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "@/shared/theme/colors";

export default function ParentTabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          position: "absolute",
          left: 12,
          right: 12,
          bottom: insets.bottom > 0 ? insets.bottom : 12,
          height: 65,
          paddingTop: 8,
          paddingBottom: 12,
          borderRadius: 20,
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: "#1C0A4A",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
        tabBarItemStyle: { justifyContent: "center", alignItems: "center" },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "home" : "home-outline"} size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="bus"
        options={{
          title: "Bus",
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "bus" : "bus-outline"} size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="academics"
        options={{
          title: "Academics",
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "school" : "school-outline"} size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "grid" : "grid-outline"} size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
