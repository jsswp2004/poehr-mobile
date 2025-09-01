import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { jwtDecode } from "jwt-decode";
import React, { useEffect, useState } from "react";
import {
  Alert,
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
      const token = await AsyncStorage.getItem("access_token");
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
      if (!["doctor", "admin", "system_admin"].includes(userData.role)) {
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
      const token = await AsyncStorage.getItem("access_token");
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
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <ThemedView style={styles.header}>
          <ThemedText style={styles.title}>Quick Register</ThemedText>
          <ThemedText style={styles.subtitle}>Patient Information</ThemedText>
        </ThemedView>

        <ThemedView style={styles.form}>
          <ThemedView style={styles.inputGroup}>
            <ThemedText style={styles.label}>First Name</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.first_name}
              onChangeText={(value) => updateFormData("first_name", value)}
              placeholder="First Name"
              autoCapitalize="words"
            />
          </ThemedView>

          <ThemedView style={styles.inputGroup}>
            <ThemedText style={styles.label}>Last Name *</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.last_name}
              onChangeText={(value) => updateFormData("last_name", value)}
              placeholder="Last Name *"
              autoCapitalize="words"
            />
          </ThemedView>

          <ThemedView style={styles.inputGroup}>
            <ThemedText style={styles.label}>Username *</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.username}
              onChangeText={(value) => updateFormData("username", value)}
              placeholder="Username *"
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
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </ThemedView>

          <ThemedView style={styles.inputGroup}>
            <ThemedText style={styles.label}>Phone Number</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.phone_number}
              onChangeText={(value) => updateFormData("phone_number", value)}
              placeholder="Phone Number"
              keyboardType="phone-pad"
            />
          </ThemedView>

          <ThemedView style={styles.inputGroup}>
            <ThemedText style={styles.label}>Password *</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.password}
              onChangeText={(value) => updateFormData("password", value)}
              placeholder="Password *"
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
              {loading ? "Creating Patient Account..." : "REGISTER"}
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  form: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 30,
    marginBottom: 40,
  },
  submitButtonDisabled: {
    backgroundColor: "#ccc",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
