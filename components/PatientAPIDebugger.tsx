/**
 * PatientAPIDebugger Component
 *
 * Add this component to your app to test the patients API directly
 * You can import and use this in any screen to debug the issue
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { API_BASE_URL } from "@/config/api";

interface TestResult {
  test: string;
  status: "running" | "success" | "error";
  message: string;
  data?: any;
}

export default function PatientAPIDebugger() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (
    test: string,
    status: "running" | "success" | "error",
    message: string,
    data?: any
  ) => {
    setResults((prev) => [...prev, { test, status, message, data }]);
  };

  const clearResults = () => {
    setResults([]);
  };

  const runTests = async () => {
    setIsRunning(true);
    clearResults();

    try {
      // Test 1: Check AsyncStorage for token
      addResult("Token Check", "running", "Checking for access token...");
      const token = await AsyncStorage.getItem("access_token");

      if (!token) {
        addResult(
          "Token Check",
          "error",
          "No access token found in AsyncStorage"
        );
        setIsRunning(false);
        return;
      }

      addResult(
        "Token Check",
        "success",
        `Token found: ${token.substring(0, 50)}...`
      );

      // Test 2: Decode token
      addResult("Token Decode", "running", "Decoding JWT token...");
      try {
        const decodedToken: any = jwtDecode(token);
        addResult(
          "Token Decode",
          "success",
          "Token decoded successfully",
          decodedToken
        );

        // Check expiration
        const now = Date.now() / 1000;
        if (decodedToken.exp < now) {
          addResult("Token Expiry", "error", "Token has expired!");
        } else {
          const expiresIn = Math.round((decodedToken.exp - now) / 60);
          addResult(
            "Token Expiry",
            "success",
            `Token expires in ${expiresIn} minutes`
          );
        }
      } catch (error) {
        addResult("Token Decode", "error", `Failed to decode token: ${error}`);
        setIsRunning(false);
        return;
      }

      // Test 3: Test API connectivity
      addResult(
        "API Connectivity",
        "running",
        `Testing connection to ${API_BASE_URL}...`
      );
      try {
        const connectResponse = await fetch(API_BASE_URL, {
          method: "HEAD",
        });
        addResult(
          "API Connectivity",
          "success",
          `Server responded with status: ${connectResponse.status}`
        );
      } catch (error) {
        addResult("API Connectivity", "error", `Cannot reach server: ${error}`);
      }

      // Test 4: Test patients endpoint
      addResult(
        "Patients API",
        "running",
        "Testing /api/patients/ endpoint..."
      );
      try {
        const response = await fetch(`${API_BASE_URL}/api/patients/`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        addResult(
          "Patients API Response",
          "success",
          `Status: ${response.status}, OK: ${response.ok}`
        );

        if (response.ok) {
          const data = await response.json();
          addResult(
            "Patients Data",
            "success",
            `Received ${data.length} patients`,
            data
          );

          if (data.length > 0) {
            addResult(
              "First Patient",
              "success",
              "Sample patient data",
              data[0]
            );
          } else {
            addResult(
              "Patients Count",
              "error",
              "No patients found in database"
            );
          }
        } else {
          const errorText = await response.text();
          addResult(
            "Patients API",
            "error",
            `HTTP ${response.status}: ${errorText}`
          );
        }
      } catch (error) {
        addResult("Patients API", "error", `Network error: ${error}`);
      }

      // Test 5: Test other endpoints for comparison
      addResult("Other Endpoints", "running", "Testing other API endpoints...");

      const endpointsToTest = [
        "/api/appointments/",
        "/api/auth/user/", // if this exists
      ];

      for (const endpoint of endpointsToTest) {
        try {
          const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
          addResult(
            `Endpoint ${endpoint}`,
            response.ok ? "success" : "error",
            `Status: ${response.status}`
          );
        } catch (error) {
          addResult(`Endpoint ${endpoint}`, "error", `Error: ${error}`);
        }
      }
    } catch (error) {
      addResult("Unexpected Error", "error", `${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  const showResultDetails = (result: TestResult) => {
    if (result.data) {
      Alert.alert(result.test, JSON.stringify(result.data, null, 2), [
        { text: "OK" },
      ]);
    }
  };

  const getStatusColor = (status: "running" | "success" | "error") => {
    switch (status) {
      case "running":
        return "#f39c12";
      case "success":
        return "#27ae60";
      case "error":
        return "#e74c3c";
    }
  };

  const getStatusIcon = (status: "running" | "success" | "error") => {
    switch (status) {
      case "running":
        return "⏳";
      case "success":
        return "✅";
      case "error":
        return "❌";
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧪 Patient API Debugger</Text>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, styles.runButton]}
          onPress={runTests}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>
            {isRunning ? "Running Tests..." : "Run API Tests"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.clearButton]}
          onPress={clearResults}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>Clear Results</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.results} showsVerticalScrollIndicator={false}>
        {results.map((result, index) => (
          <TouchableOpacity
            key={index}
            style={styles.resultItem}
            onPress={() => showResultDetails(result)}
          >
            <View style={styles.resultHeader}>
              <Text style={styles.resultIcon}>
                {getStatusIcon(result.status)}
              </Text>
              <Text style={styles.resultTest}>{result.test}</Text>
            </View>
            <Text
              style={[
                styles.resultMessage,
                { color: getStatusColor(result.status) },
              ]}
            >
              {result.message}
            </Text>
            {result.data && (
              <Text style={styles.tapHint}>Tap to view data</Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.info}>
        <Text style={styles.infoTitle}>Usage Instructions:</Text>
        <Text style={styles.infoText}>
          1. Make sure you're logged in to the app{"\n"}
          2. Tap "Run API Tests" to debug the patients API{"\n"}
          3. Check the results to identify issues{"\n"}
          4. Tap any result with data to view details
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f8f9fa",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#2c3e50",
  },
  controls: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  runButton: {
    backgroundColor: "#3498db",
  },
  clearButton: {
    backgroundColor: "#95a5a6",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  results: {
    flex: 1,
    marginBottom: 20,
  },
  resultItem: {
    backgroundColor: "white",
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#3498db",
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  resultIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  resultTest: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  resultMessage: {
    fontSize: 14,
    marginLeft: 26,
  },
  tapHint: {
    fontSize: 12,
    color: "#7f8c8d",
    fontStyle: "italic",
    marginLeft: 26,
    marginTop: 5,
  },
  info: {
    backgroundColor: "#e8f4fd",
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#3498db",
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 5,
  },
  infoText: {
    fontSize: 14,
    color: "#34495e",
    lineHeight: 20,
  },
});
