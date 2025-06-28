/**
 * Test page for debugging the patients API
 *
 * You can navigate to this page to run diagnostic tests
 * Add this to your app temporarily for debugging
 */

import React from "react";
import { StyleSheet } from "react-native";

import PatientAPIDebugger from "@/components/PatientAPIDebugger";
import { ThemedView } from "@/components/ThemedView";

export default function TestScreen() {
  return (
    <ThemedView style={styles.container}>
      <PatientAPIDebugger />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50, // Account for status bar
  },
});
