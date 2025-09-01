// components/APIDebugger.tsx
// A debug component to test API connectivity and view configuration

import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, TouchableOpacity } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import {
  API_BASE_URL,
  API_ENDPOINTS,
  getAPIConfig,
  testAPIConnection,
} from "@/config/api";

export default function APIDebugger() {
  const [isVisible, setIsVisible] = useState(false);
  const [testResults, setTestResults] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const testAllEndpoints = async () => {
    setLoading(true);
    setTestResults("");

    try {
      const token = await AsyncStorage.getItem("access_token");
      const config = getAPIConfig();

      let results = `🔧 API Configuration Debug\n`;
      results += `Environment: ${config.environment}\n`;
      results += `Base URL: ${config.currentURL}\n`;
      results += `Token Present: ${token ? "✅ Yes" : "❌ No"}\n\n`;

      results += `🧪 Testing Endpoints:\n\n`;

      // Test each endpoint
      for (const [name, url] of Object.entries(API_ENDPOINTS)) {
        try {
          const response = await fetch(url, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...(token && { Authorization: `Bearer ${token}` }),
            },
          });

          const status = response.status;
          const statusIcon = status < 400 ? "✅" : status === 401 ? "🔐" : "❌";
          results += `${statusIcon} ${name}: ${status}\n`;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          results += `❌ ${name}: Error - ${errorMessage}\n`;
        }
      }

      // Test connection
      const connectionOk = await testAPIConnection();
      results += `\n🌐 Connection Test: ${
        connectionOk ? "✅ Success" : "❌ Failed"
      }\n`;

      setTestResults(results);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setTestResults(`❌ Test failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const clearTokens = async () => {
    Alert.alert(
      "Clear Tokens",
      "This will clear authentication tokens for testing. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.multiRemove(["access_token", "refresh_token"]);
            Alert.alert("Success", "Tokens cleared!");
          },
        },
      ]
    );
  };

  if (!isVisible) {
    return (
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => setIsVisible(true)}
      >
        <ThemedText style={styles.toggleButtonText}>🔧 API Debug</ThemedText>
      </TouchableOpacity>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="subtitle">API Debugger</ThemedText>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => setIsVisible(false)}
        >
          <ThemedText>✕</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <ScrollView style={styles.content}>
        <ThemedView style={styles.section}>
          <ThemedText type="defaultSemiBold">Current Configuration:</ThemedText>
          <ThemedText style={styles.code}>Base URL: {API_BASE_URL}</ThemedText>
          <ThemedText style={styles.code}>
            Environment: {__DEV__ ? "Development" : "Production"}
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.testButton]}
            onPress={testAllEndpoints}
            disabled={loading}
          >
            <ThemedText style={styles.buttonText}>
              {loading ? "Testing..." : "Test All Endpoints"}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.clearButton]}
            onPress={clearTokens}
          >
            <ThemedText style={styles.buttonText}>Clear Tokens</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {testResults && (
          <ThemedView style={styles.results}>
            <ThemedText style={styles.resultsText}>{testResults}</ThemedText>
          </ThemedView>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  toggleButton: {
    position: "absolute",
    top: 50,
    right: 20,
    backgroundColor: "#3498db",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    zIndex: 1000,
  },
  toggleButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.9)",
    zIndex: 999,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 60,
  },
  closeButton: {
    padding: 10,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
  },
  code: {
    fontFamily: "monospace",
    fontSize: 12,
    color: "#00ff00",
    marginTop: 5,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  testButton: {
    backgroundColor: "#2ecc71",
  },
  clearButton: {
    backgroundColor: "#e74c3c",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  results: {
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 15,
    borderRadius: 8,
  },
  resultsText: {
    fontFamily: "monospace",
    fontSize: 11,
    lineHeight: 16,
  },
});
