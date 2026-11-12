import { tokenStore } from "@/utils/tokenStore";
import axios from "axios";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { API_ENDPOINTS } from "../config/api";

const LoginScreen = () => {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const { height: screenHeight } = useWindowDimensions();
  const heroHeight = Math.min(280, Math.round(screenHeight * 0.33));

  const handleLogin = async () => {
    const username = formData.username.trim();
    if (!username || !formData.password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);

    // Debug logging
    console.log("🔐 Starting login process...");
    console.log("📍 Login endpoint:", API_ENDPOINTS.LOGIN);

    try {
      console.log("📡 Sending login request to:", API_ENDPOINTS.LOGIN);

      const res = await axios.post(API_ENDPOINTS.LOGIN, {
        username,
        password: formData.password,
      });

      console.log("✅ Login response status:", res.status);
      console.log("📄 Response data keys:", Object.keys(res.data));

      const { access, refresh } = res.data;

      if (!access || !refresh) {
        console.log("❌ Missing tokens in response");
        Alert.alert("Login Error", "Invalid response from server");
        return;
      }

      console.log("💾 Storing tokens...");
      await tokenStore.setItem("access_token", access);
      await tokenStore.setItem("refresh_token", refresh);


      console.log("🚀 Navigating to main app...");
      router.replace("/(tabs)");
    } catch (error: any) {
      console.log("❌ Login error occurred:");
      console.log("📋 Error type:", error.constructor.name);

      if (error.response) {
        console.log("📋 Response status:", error.response.status);
        console.log("📋 Response statusText:", error.response.statusText);

        if (error.response.status === 401) {
          Alert.alert("Login Failed", "Invalid username or password");
        } else if (error.response.status === 400) {
          Alert.alert(
            "Login Failed",
            "Bad request - check your credentials format"
          );
        } else if (error.response.status >= 500) {
          Alert.alert(
            "Server Error",
            "The server is experiencing issues. Please try again later."
          );
        } else {
          Alert.alert("Login Failed", `Server error: ${error.response.status}`);
        }
      } else if (error.request) {
        console.log("📋 No response received");
        Alert.alert(
          "Network Error",
          "Cannot connect to server. Check your internet connection."
        );
      } else {
        console.log("📋 Request setup error:", error.message);
        Alert.alert("Error", "Failed to send login request");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <View style={[styles.hero, { height: heroHeight }]}>
          <Image
            source={require("@/assets/images/scheduler.png")}
            style={styles.heroImage}
            resizeMode="cover"
            accessibilityLabel="Clinicians reviewing a weekly schedule board"
          />
        </View>

        <View style={styles.container}>
          <View style={styles.brandRow}>
            <Image
              source={require("@/assets/images/power-logo.png")}
              style={styles.brandLogo}
              resizeMode="contain"
            />
            <Text style={styles.title}>POWER Scheduler</Text>
          </View>
          <Text style={styles.subtitle}>
            Sign in to manage appointments and availability.
          </Text>

          <TextInput
            placeholder="Username"
            style={styles.input}
            value={formData.username}
            onChangeText={(val) => setFormData({ ...formData, username: val })}
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            autoComplete="username"
            textContentType="username"
          />

          <TextInput
            placeholder="Password"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="password"
            textContentType="password"
            style={styles.input}
            value={formData.password}
            onChangeText={(val) => setFormData({ ...formData, password: val })}
          />

          <TouchableOpacity
            style={styles.forgotLink}
            onPress={() => router.push("/forgot-password")}
            accessibilityRole="link"
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Logging in..." : "Log in"}
            </Text>
          </TouchableOpacity>
          <Text style={styles.helpText}>
            Don&apos;t have an account? Ask your site administrator.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#fff" },
  scroll: { flexGrow: 1, backgroundColor: "#fff" },
  hero: {
    width: "100%",
    overflow: "hidden",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroImage: { width: "100%", height: "100%" },
  container: {
    paddingHorizontal: 28,
    paddingTop: 22,
    paddingBottom: 32,
    backgroundColor: "#fff",
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  brandLogo: { width: 44, height: 44, borderRadius: 10 },
  title: { fontSize: 26, fontWeight: "700", color: "#000", flexShrink: 1 },
  subtitle: { marginTop: 10, marginBottom: 22, color: "#666", fontSize: 15 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
    marginBottom: 14,
    fontSize: 16,
  },
  forgotLink: { alignSelf: "flex-end", paddingVertical: 10, marginBottom: 4 },
  forgotText: { color: "#1976d2", fontWeight: "600" },
  button: {
    backgroundColor: "#1976d2",
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  helpText: { textAlign: "center", marginTop: 8, color: "#666" },
});

export default LoginScreen;
