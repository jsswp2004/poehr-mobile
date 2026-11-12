import { tokenStore } from "@/utils/tokenStore";
import { router } from "expo-router";
import { jwtDecode } from "jwt-decode";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { API_BASE_URL } from "@/config/api";

interface User {
  username: string;
  firstName?: string;
  lastName?: string;
  role: string;
  email?: string;
  user_id: number;
  organization?: string;
}

export default function RegisterPatientScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    phone_number: "",
    password: "",
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const token = await tokenStore.getItem("access_token");
      if (!token) {
        router.replace("/login");
        return;
      }

      const decodedToken: any = jwtDecode(token);
      const userData: User = {
        username: decodedToken.username || "",
        firstName: decodedToken.first_name || "",
        lastName: decodedToken.last_name || "",
        role: decodedToken.role || "",
        email: decodedToken.email || "",
        user_id: decodedToken.user_id || 0,
        organization: decodedToken.organization || "",
      };

      setUser(userData);

      // Check if user has permission
      if (!["doctor", "admin", "system_admin", "registrar"].includes(userData.role)) {
        Alert.alert(
          "Access Denied",
          "You don't have permission to register patients",
          [{ text: "OK", onPress: () => router.back() }]
        );
        return;
      }
    } catch (error) {
      console.error("❌ Error loading user data:", error);
      Alert.alert("Error", "Failed to load user data", [
        { text: "OK", onPress: () => router.replace("/login") },
      ]);
    }
  };

  const validateForm = () => {
    const required = [
      "first_name",
      "last_name",
      "username",
      "email",
      "phone_number",
      "password",
    ];

    for (const field of required) {
      if (!formData[field as keyof typeof formData].trim()) {
        Alert.alert("Error", `${field.replace("_", " ")} is required`);
        return false;
      }
    }

    if (formData.password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters long");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    console.log("🚀 Starting patient registration...");
    if (!validateForm()) return;

    setLoading(true);
    try {
      const token = await tokenStore.getItem("access_token");
      if (!token) {
        Alert.alert("Error", "Authentication required");
        router.replace("/login");
        return;
      }

      const registrationData = {
        ...formData,
        role: "patient",
      };

      console.log("📝 Registering patient with data:", registrationData);

      const response = await fetch(`${API_BASE_URL}/api/users/register/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registrationData),
      });

      const responseData = await response.json();

      if (response.ok) {
        console.log("✅ Patient registered successfully:", responseData);

        // Reset form
        setFormData({
          first_name: "",
          last_name: "",
          username: "",
          email: "",
          phone_number: "",
          password: "",
        });

        Alert.alert(
          "Registration Successful! 🎉",
          `Patient ${registrationData.first_name} ${registrationData.last_name} has been registered successfully.\n\nUsername: ${registrationData.username}`,
          [
            {
              text: "Register Another",
              style: "default",
            },
            {
              text: "Go Back",
              style: "cancel",
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        console.error("❌ Registration failed:", responseData);
        const errorMessage =
          responseData.error || responseData.message || "Registration failed";
        Alert.alert("Registration Failed", errorMessage);
      }
    } catch (error) {
      console.error("❌ Registration error:", error);
      Alert.alert("Error", "Network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ThemedView style={styles.header}>
          <ThemedText style={styles.title}>Register patient</ThemedText>
          <ThemedText style={styles.subtitle}>
            Create a patient account. Fields marked * are required.
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.form}>
          <ThemedView style={styles.inputGroup}>
            <ThemedText style={styles.label}>First name</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.first_name}
              onChangeText={(value) => updateFormData("first_name", value)}
              placeholder="Maria"
              autoCapitalize="words"
            />
          </ThemedView>

          <ThemedView style={styles.inputGroup}>
            <ThemedText style={styles.label}>Last name *</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.last_name}
              onChangeText={(value) => updateFormData("last_name", value)}
              placeholder="Santos"
              autoCapitalize="words"
            />
          </ThemedView>

          <ThemedView style={styles.inputGroup}>
            <ThemedText style={styles.label}>Username *</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.username}
              onChangeText={(value) => updateFormData("username", value)}
              placeholder="Used to log in"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </ThemedView>

          <ThemedView style={styles.inputGroup}>
            <ThemedText style={styles.label}>Email</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(value) => updateFormData("email", value)}
              placeholder="name@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </ThemedView>

          <ThemedView style={styles.inputGroup}>
            <ThemedText style={styles.label}>Phone number</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.phone_number}
              onChangeText={(value) => updateFormData("phone_number", value)}
              placeholder="(555) 123-4567"
              keyboardType="phone-pad"
            />
          </ThemedView>

          <ThemedView style={styles.inputGroup}>
            <ThemedText style={styles.label}>Password *</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.password}
              onChangeText={(value) => updateFormData("password", value)}
              placeholder="At least 8 characters"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </ThemedView>

          <TouchableOpacity
            style={[
              styles.submitButton,
              loading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <ThemedText style={styles.submitButtonText}>
              {loading ? "Creating account..." : "Register patient"}
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 6,
    backgroundColor: "transparent",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#5b6670",
  },
  form: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
    backgroundColor: "transparent",
  },
  inputGroup: {
    marginBottom: 16,
    backgroundColor: "transparent",
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#c5ccd4",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
    fontSize: 16,
    backgroundColor: "#fff",
    color: "#11181C",
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: "#1976d2",
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
