import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { router } from "expo-router";
import { jwtDecode } from "jwt-decode";
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
    if (!formData.username || !formData.password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);

    // Debug logging
    console.log("🔐 Starting login process...");
    console.log("📍 Login endpoint:", API_ENDPOINTS.LOGIN);
    console.log("👤 Username:", formData.username);
    console.log("🔒 Password length:", formData.password.length);

    try {
      console.log("📡 Sending login request to:", API_ENDPOINTS.LOGIN);

      const res = await axios.post(API_ENDPOINTS.LOGIN, formData);

      console.log("✅ Login response status:", res.status);
      console.log("📄 Response data keys:", Object.keys(res.data));

      const { access, refresh } = res.data;

      if (!access || !refresh) {
        console.log("❌ Missing tokens in response");
        console.log("📄 Full response:", res.data);
        Alert.alert("Login Error", "Invalid response from server");
        return;
      }

      console.log("💾 Storing tokens...");
      await AsyncStorage.setItem("access_token", access);
      await AsyncStorage.setItem("refresh_token", refresh);

      console.log("🔍 Decoding user token...");
      const user = jwtDecode(access);
      console.log("👤 Logged in user:", user);

      console.log("🚀 Navigating to main app...");
      router.replace("/(tabs)");
    } catch (error: any) {
      console.log("❌ Login error occurred:");
      console.log("📋 Error type:", error.constructor.name);

      if (error.response) {
        console.log("📋 Response status:", error.response.status);
        console.log("📋 Response statusText:", error.response.statusText);
        console.log("📋 Response data:", error.response.data);
        console.log("📋 Response headers:", error.response.headers);

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
        console.log("📋 Request details:", error.request);
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
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
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
      <TouchableOpacity onPress={() => router.push("./register")}>
        <Text>Don&apos;t have an account? Ask your site administrator</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    color: "#2c3e50",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
    color: "#7f8c8d",
  },
  input: {
    borderWidth: 1,
    marginBottom: 15,
    padding: 15,
    borderRadius: 8,
    backgroundColor: "white",
    borderColor: "#ddd",
    fontSize: 16,
  },
  button: {
    backgroundColor: "#3498db",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  buttonDisabled: {
    backgroundColor: "#bdc3c7",
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
  },
  link: {
    color: "#3498db",
    marginTop: 15,
    textAlign: "center",
    fontSize: 16,
  },
});

export default LoginScreen;
