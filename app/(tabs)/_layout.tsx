import { Tabs, router } from "expo-router";
import React from "react";
import { Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { STAFF_ROLES, useCurrentUser } from "@/hooks/useCurrentUser";

// Five tabs: Home, My Day (staff), Calendar, Patients, More.
// Register patient and Availability are still real routes, reached from
// Home and More, so they are hidden from the tab bar (href: null).
// Screens reached from More/Home have no tab, so give them a back button.
const subScreenHeader = {
  headerShown: true,
  headerShadowVisible: false,
  // The navigator header already handles the safe area.
  sceneStyle: { paddingTop: 0, backgroundColor: "#fff" },
  headerTitleAlign: "left" as const,
  headerTitleStyle: { fontSize: 18, fontWeight: "700" as const },
  headerLeft: () => (
    <TouchableOpacity
      onPress={() =>
        router.canGoBack() ? router.back() : router.replace("/(tabs)/more")
      }
      accessibilityRole="button"
      accessibilityLabel="Go back"
      hitSlop={8}
      style={{
        minWidth: 56,
        minHeight: 44,
        flexDirection: "row",
        alignItems: "center",
        paddingLeft: 12,
      }}
    >
      <Text style={{ fontSize: 34, lineHeight: 36, color: "#0d5cab", marginTop: -4 }}>‹</Text>
      <Text style={{ fontSize: 16, fontWeight: "600", color: "#0d5cab" }}>Back</Text>
    </TouchableOpacity>
  ),
};

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { user } = useCurrentUser();
  const isStaff = !!user && STAFF_ROLES.includes(user.role);
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        // Redesign: each screen draws its own title row, so no global header.
        headerShown: false,
        sceneStyle: { paddingTop: insets.top, backgroundColor: "#fff" },
        tabBarButton: HapticTab as any,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-schedule"
        options={{
          title: "My Day",
          // Hidden until we know the signed-in user is staff.
          href: isStaff ? undefined : null,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="list.bullet" color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: "Calendar",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="calendar" color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="patients"
        options={{
          title: "Patients",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="person.2.fill" color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="ellipsis" color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="register-patient"
        options={{ href: null, title: "Register patient", ...subScreenHeader }}
      />
      <Tabs.Screen
        name="availability"
        options={{ href: null, title: "Availability", ...subScreenHeader }}
      />
    </Tabs>
  );
}
