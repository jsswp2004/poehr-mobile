import { IconSymbol } from "@/components/ui/IconSymbol";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { tokenStore } from "@/utils/tokenStore";
import Constants from "expo-constants";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const roleLabel = (r?: string) =>
  (r || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default function MoreScreen() {
  const { user } = useCurrentUser();
  const role = user?.role;
  const canRegister =
    !!role && ["doctor", "admin", "system_admin", "registrar"].includes(role);
  const canManageAvailability =
    !!role && ["doctor", "admin", "system_admin"].includes(role);

  const initials = `${user?.firstName?.[0] || user?.username?.[0] || "?"}${
    user?.lastName?.[0] || ""
  }`.toUpperCase();

  const logout = () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          try {
            await tokenStore.removeItem("access_token");
            await tokenStore.removeItem("refresh_token");
            router.replace("/login");
          } catch {
            Alert.alert("Error", "Failed to log out. Please try again.");
          }
        },
      },
    ]);
  };

  const Row = ({
    icon,
    label,
    onPress,
  }: {
    icon: string;
    label: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity style={styles.row} onPress={onPress} accessibilityRole="button">
      <IconSymbol name={icon as any} size={24} color="#1976d2" />
      <Text style={styles.rowLabel}>{label}</Text>
      <IconSymbol name="chevron.right" size={20} color="#8b95a0" />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.profile}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>
            {[user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
              user?.username}
          </Text>
          <Text style={styles.meta}>
            {[roleLabel(role), user?.organization].filter(Boolean).join(" · ")}
          </Text>
        </View>
      </View>

      {(canRegister || canManageAvailability) && (
        <View style={styles.group}>
          {canRegister && (
            <Row
              icon="person.badge.plus"
              label="Register patient"
              onPress={() => router.push("/register-patient")}
            />
          )}
          {canManageAvailability && (
            <Row
              icon="clock.fill"
              label="Availability"
              onPress={() => router.push("/availability")}
            />
          )}
        </View>
      )}

      <TouchableOpacity style={styles.logout} onPress={logout} accessibilityRole="button">
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>
        POWER Scheduler {Constants.expoConfig?.version || ""}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 20, paddingBottom: 40 },
  profile: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 24 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#e3effc", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#0d5cab", fontWeight: "700", fontSize: 20 },
  name: { fontSize: 20, fontWeight: "700", color: "#11181C" },
  meta: { fontSize: 13, color: "#5b6670", marginTop: 2 },
  group: { borderWidth: 1, borderColor: "#e3e8ee", borderRadius: 14, overflow: "hidden", marginBottom: 20 },
  row: { flexDirection: "row", alignItems: "center", gap: 14, minHeight: 56, paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#e3e8ee" },
  rowLabel: { flex: 1, fontSize: 16, color: "#11181C", fontWeight: "500" },
  logout: { minHeight: 50, borderRadius: 12, borderWidth: 1, borderColor: "#f0c4c4", alignItems: "center", justifyContent: "center" },
  logoutText: { color: "#c62828", fontWeight: "600", fontSize: 16 },
  version: { textAlign: "center", color: "#8b95a0", fontSize: 12, marginTop: 24 },
});
