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
  View,
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
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    first_name: "",
    last_name: "",
    phone_number: "",
    date_of_birth: "",
    gender: "",
    address: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    medical_history: "",
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
      "username",
      "email",
      "password",
      "first_name",
      "last_name",
      "phone_number",
      "date_of_birth",
      "gender",
      "address",
      "emergency_contact_name",
      "emergency_contact_phone",
    ];

    for (const field of required) {
      if (!formData[field as keyof typeof formData].trim()) {
        Alert.alert("Error", `${field.replace("_", " ")} is required`);
        return false;
      }
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return false;
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

      delete registrationData.confirmPassword;

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
        Alert.alert("Success", "Patient registered successfully!", [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]);
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
          <ThemedText style={styles.title}>Register New Patient</ThemedText>
          <ThemedText style={styles.subtitle}>
            Enter patient information below
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.form}>
          <ThemedView style={styles.inputGroup}>
            <ThemedText style={styles.label}>Username *</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.username}
              onChangeText={(value) => updateFormData("username", value)}
              placeholder="Enter username"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </ThemedView>

          <ThemedView style={styles.inputGroup}>
            <ThemedText style={styles.label}>Email *</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(value) => updateFormData("email", value)}
              placeholder="Enter email address"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </ThemedView>

          <ThemedView style={styles.inputGroup}>
            <ThemedText style={styles.label}>Password *</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.password}
              onChangeText={(value) => updateFormData("password", value)}
              placeholder="Enter password (min 8 characters)"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </ThemedView>

          <ThemedView style={styles.inputGroup}>
            <ThemedText style={styles.label}>Confirm Password *</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.confirmPassword}
              onChangeText={(value) => updateFormData("confirmPassword", value)}
              placeholder="Confirm password"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </ThemedView>

          <ThemedView style={styles.inputGroup}>
            <ThemedText style={styles.label}>First Name *</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.first_name}
              onChangeText={(value) => updateFormData("first_name", value)}
              placeholder="Enter first name"
              autoCapitalize="words"
            />
          </ThemedView>

          <ThemedView style={styles.inputGroup}>
            <ThemedText style={styles.label}>Last Name *</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.last_name}
              onChangeText={(value) => updateFormData("last_name", value)}
              placeholder="Enter last name"
              autoCapitalize="words"
            />
          </ThemedView>

          <ThemedView style={styles.inputGroup}>
            <ThemedText style={styles.label}>Phone Number *</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.phone_number}
              onChangeText={(value) => updateFormData("phone_number", value)}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
            />
          </ThemedView>

          <ThemedView style={styles.inputGroup}>
            <ThemedText style={styles.label}>
              Date of Birth * (YYYY-MM-DD)
            </ThemedText>
            <TextInput
              style={styles.input}
              value={formData.date_of_birth}
              onChangeText={(value) => updateFormData("date_of_birth", value)}
              placeholder="YYYY-MM-DD"
              keyboardType="numeric"
            />
          </ThemedView>

          <ThemedView style={styles.inputGroup}>
            <ThemedText style={styles.label}>Gender *</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.gender}
              onChangeText={(value) => updateFormData("gender", value)}
              placeholder="Enter gender"
              autoCapitalize="words"
            />
          </ThemedView>

          <ThemedView style={styles.inputGroup}>
            <ThemedText style={styles.label}>Address *</ThemedText>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.address}
              onChangeText={(value) => updateFormData("address", value)}
              placeholder="Enter address"
              multiline
              numberOfLines={3}
              autoCapitalize="words"
            />
          </ThemedView>

          <ThemedView style={styles.inputGroup}>
            <ThemedText style={styles.label}>
              Emergency Contact Name *
            </ThemedText>
            <TextInput
              style={styles.input}
              value={formData.emergency_contact_name}
              onChangeText={(value) =>
                updateFormData("emergency_contact_name", value)
              }
              placeholder="Enter emergency contact name"
              autoCapitalize="words"
            />
          </ThemedView>

          <ThemedView style={styles.inputGroup}>
            <ThemedText style={styles.label}>
              Emergency Contact Phone *
            </ThemedText>
            <TextInput
              style={styles.input}
              value={formData.emergency_contact_phone}
              onChangeText={(value) =>
                updateFormData("emergency_contact_phone", value)
              }
              placeholder="Enter emergency contact phone"
              keyboardType="phone-pad"
            />
          </ThemedView>

          <ThemedView style={styles.inputGroup}>
            <ThemedText style={styles.label}>
              Medical History (Optional)
            </ThemedText>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.medical_history}
              onChangeText={(value) => updateFormData("medical_history", value)}
              placeholder="Enter any relevant medical history"
              multiline
              numberOfLines={4}
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
              {loading ? "Registering..." : "Register Patient"}
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
