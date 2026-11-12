import { API_BASE_URL } from "@/config/api";
import axios from "axios";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Asks the backend (django-rest-passwordreset) to email a reset link, the
// same endpoint the web app's Forgot Password page uses.
export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const value = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(value)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/password-reset/`, { email: value });
      setSent(true);
    } catch (e: any) {
      if (e?.response?.status === 400 || e?.response?.status === 404) {
        // Don't reveal whether an address has an account.
        setSent(true);
      } else if (e?.request) {
        setError("Cannot connect to server. Check your internet connection.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset your password</Text>
      {sent ? (
        <>
          <Text style={styles.body}>
            If an account exists for {email.trim()}, a reset link is on its way.
            Open the link in the email to choose a new password, then log in
            here.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.replace("/login")}
          >
            <Text style={styles.buttonText}>Back to log in</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.body}>
            Enter the email on your account. We will send a link to choose a new
            password.
          </Text>
          <TextInput
            placeholder="Email"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
          />
          {!!error && <Text style={styles.error}>{error}</Text>}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={submit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Send reset link</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.back}
            onPress={() => router.replace("/login")}
          >
            <Text style={styles.backText}>Back to log in</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  title: { fontSize: 26, fontWeight: "700", marginBottom: 8, color: "#000" },
  body: { color: "#666", marginBottom: 20, lineHeight: 21 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  error: { color: "#c62828", marginBottom: 12 },
  button: {
    backgroundColor: "#1976d2",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontWeight: "600" },
  back: { alignItems: "center", paddingVertical: 12 },
  backText: { color: "#1976d2", fontWeight: "600" },
});
