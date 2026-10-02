import { tokenStore } from "@/utils/tokenStore";
import axios from "axios";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { API_ENDPOINTS } from "../config/api";

const LoginScreen = () => {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);

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
    <View style={styles.container}>
      <Text style={styles.title}>POWER Mobile</Text>
      <Text style={styles.subtitle}>Welcome back!</Text>

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
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Logging in..." : "Login"}
        </Text>
      </TouchableOpacity>
      <Text style={styles.helpText}>
        Don&apos;t have an account? Ask your site administrator.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  helpText: {
    textAlign: "center",
    marginTop: 16,
    color: "#666",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 4,
    color: "#000",
  },
  subtitle: {
    marginBottom: 24,
    color: "#666",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#1976d2",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  link: {
    color: "#1976d2",
    marginTop: 15,
    textAlign: "center",
    fontSize: 16,
  },
});

export default LoginScreen;
