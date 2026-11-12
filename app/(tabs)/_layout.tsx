import { Tabs } from "expo-router";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { STAFF_ROLES, useCurrentUser } from "@/hooks/useCurrentUser";

// Five tabs: Home, My Day (staff), Calendar, Patients, More.
// Register patient and Availability are stack screens (app/), opened from
// Home and More, so they get a native back button.
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
    </Tabs>
  );
}
