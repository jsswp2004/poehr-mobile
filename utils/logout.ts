import { router } from "expo-router";
import { Alert } from "react-native";

import { tokenStore } from "@/utils/tokenStore";

/** Ask for confirmation, clear stored tokens, and return to the login screen. */
export function confirmLogout() {
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
}
