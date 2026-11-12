import { Tabs } from "expo-router";
import React from "react";

import { AppHeader } from "@/components/AppHeader";
import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { STAFF_ROLES, useCurrentUser } from "@/hooks/useCurrentUser";

// Five tabs: Home, My Day (staff), Calendar, Patients, More.
// Register patient and Availability are still real routes, reached from
// Home and More, so they are hidden from the tab bar (href: null).
export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { user } = useCurrentUser();
  const isStaff = !!user && STAFF_ROLES.includes(user.role);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: true,
        header: () => <AppHeader />,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
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
            <IconSymbol size={28} name="list.bullet" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: "Calendar",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="calendar" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="patients"
        options={{
          title: "Patients",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="person.2.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="ellipsis" color={color} />
          ),
        }}
      />
      <Tabs.Screen name="register-patient" options={{ href: null, title: "Register" }} />
      <Tabs.Screen name="availability" options={{ href: null, title: "Availability" }} />
    </Tabs>
  );
}
