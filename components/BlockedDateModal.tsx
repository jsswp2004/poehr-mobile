import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import moment from "moment";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { API_BASE_URL } from "@/config/api";

interface User {
  user_id: number;
  username: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

interface Doctor {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
}

interface BlockedDate {
  id?: number;
  start_time: string;
  end_time: string;
  is_blocked: boolean;
  block_type?: string;
  doctor?: number;
}

interface BlockedDateModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  blockedDate?: BlockedDate;
  selectedDate: string;
  currentUser: User | null;
}

export default function BlockedDateModal({
  visible,
  onClose,
  onSave,
  blockedDate,
  selectedDate,
  currentUser,
}: BlockedDateModalProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDoctorPicker, setShowDoctorPicker] = useState(false);
  // Form state
  const [formData, setFormData] = useState({
    date: selectedDate,
    reason: "",
    doctor_id: undefined as number | undefined,
  });

  const loadDoctors = useCallback(async () => {
    console.log(
      "🚀 loadDoctors called, visible:",
      visible,
      "currentUser:",
      currentUser?.role
    );
    setLoading(true);

    try {
      const token = await AsyncStorage.getItem("access_token");
      if (!token) {
        console.log("❌ No auth token found for loading doctors");
        setDoctors([]);
        return;
      }

      console.log(
        "🔑 Using token (first 20 chars):",
        token.substring(0, 20) + "..."
      );
      console.log("🔑 Token length:", token.length);

      // Load doctors - same logic as AppointmentModal
      console.log(
        "🔍 Loading doctors for blocked date - current user role:",
        currentUser?.role
      );
      console.log(
        "🔍 Making request to:",
        `${API_BASE_URL}/api/users/doctors/`
      );
      console.log("🔍 API_BASE_URL:", API_BASE_URL);

      // Test basic connectivity first
      console.log("🧪 Testing basic connectivity to API...");
      try {
        const testResponse = await fetch(`${API_BASE_URL}/api/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        console.log("🧪 Basic API test status:", testResponse.status);
      } catch (testError) {
        console.log("🧪 Basic API test failed:", testError);
      }

      const doctorsResponse = await fetch(
        `${API_BASE_URL}/api/users/doctors/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("🔍 Doctors response status:", doctorsResponse.status);
      console.log("🔍 Doctors response headers:", doctorsResponse.headers);

      if (doctorsResponse.ok) {
        const doctorsData = await doctorsResponse.json();
        console.log("🔍 Doctors data received:", doctorsData);
        console.log("🔍 Number of doctors:", doctorsData?.length || 0);
        console.log("🔍 First doctor sample:", doctorsData?.[0]);
        setDoctors(doctorsData || []);

        // Debug state update
        console.log(
          "✅ Updated doctors state with",
          doctorsData?.length || 0,
          "doctors"
        );
      } else {
        const errorText = await doctorsResponse.text();
        console.log("❌ Failed to load doctors:", doctorsResponse.status);
        console.log("❌ Error response:", errorText);
        console.log("❌ Response type:", typeof errorText);

        // Try to parse error as JSON for more details
        try {
          const errorJson = JSON.parse(errorText);
          console.log("❌ Parsed error:", errorJson);
        } catch (parseError) {
          console.log("❌ Could not parse error as JSON:", parseError);
        }

        // If backend is unavailable, provide demo data
        if (doctorsResponse.status >= 500 || doctorsResponse.status === 404) {
          console.log("🎭 Backend unavailable, using demo doctors");
          const demoDoctors = [
            {
              id: 1,
              username: "demo_doc1",
              first_name: "John",
              last_name: "Smith",
            },
            {
              id: 2,
              username: "demo_doc2",
              first_name: "Jane",
              last_name: "Doe",
            },
            {
              id: 3,
              username: "demo_doc3",
              first_name: "Mike",
              last_name: "Johnson",
            },
          ];
          setDoctors(demoDoctors);
        } else {
          setDoctors([]);
        }
      }
    } catch (error) {
      console.error("❌ Network error loading doctors:", error);

      // Type-safe error handling
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorName = error instanceof Error ? error.name : "Unknown";

      console.error("❌ Error details:", {
        message: errorMessage,
        name: errorName,
        error: error,
      });

      // Check if this is a network connectivity issue
      if (
        errorMessage?.includes("Network request failed") ||
        errorMessage?.includes("fetch")
      ) {
        console.log("🌐 This appears to be a network connectivity issue");
      }
      // Provide demo data on network error
      console.log("🎭 Network error, using demo doctors");
      const demoDoctors = [
        {
          id: 1,
          username: "demo_doc1",
          first_name: "John",
          last_name: "Smith",
        },
        { id: 2, username: "demo_doc2", first_name: "Jane", last_name: "Doe" },
        {
          id: 3,
          username: "demo_doc3",
          first_name: "Mike",
          last_name: "Johnson",
        },
      ];
      setDoctors(demoDoctors);
    } finally {
      setLoading(false);
    }
  }, [currentUser, visible]);

  useEffect(() => {
    if (visible) {
      loadDoctors();
      if (blockedDate) {
        // Editing existing blocked date
        setFormData({
          date: moment(blockedDate.start_time).format("YYYY-MM-DD"),
          reason: blockedDate.block_type || "",
          doctor_id: blockedDate.doctor,
        });
      } else {
        // Creating new blocked date
        setFormData({
          date: selectedDate,
          reason: "",
          doctor_id:
            currentUser?.role === "doctor" ? currentUser.user_id : undefined,
        });
      }
    }
  }, [visible, blockedDate, selectedDate, currentUser, loadDoctors]);

  const handleSave = async () => {
    if (!formData.reason.trim()) {
      Alert.alert("Error", "Please provide a reason for blocking this date");
      return;
    }

    setSaving(true);
    try {
      const token = await AsyncStorage.getItem("access_token");
      if (!token) {
        Alert.alert("Error", "Authentication required");
        return;
      }
      const url = blockedDate
        ? `${API_BASE_URL}/api/availability/${blockedDate.id}/`
        : `${API_BASE_URL}/api/availability/`;

      const method = blockedDate ? "PUT" : "POST";

      // Convert the form data to match the Availability model
      const availabilityData = {
        doctor: formData.doctor_id,
        start_time: `${formData.date}T00:00:00Z`, // Start of the day
        end_time: `${formData.date}T23:59:59Z`, // End of the day
        is_blocked: true,
        block_type: formData.reason || "Other",
        recurrence: "none",
      };

      console.log("💾 Saving blocked date:", method, url);
      console.log("💾 Data:", availabilityData);
      console.log("💾 Selected doctor info:", {
        doctor_id: formData.doctor_id,
        doctor_name: doctors.find((d) => d.id === formData.doctor_id),
      });

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(availabilityData),
      });

      console.log("💾 Save response status:", response.status);

      if (response.ok) {
        Alert.alert(
          "✅ Success",
          `${moment(formData.date).format("MMMM D, YYYY")} has been ${
            blockedDate ? "updated" : "blocked"
          } successfully!\n\nReason: ${formData.reason}`,
          [
            {
              text: "View Calendar",
              onPress: () => {
                onSave(); // Refresh the data
                onClose(); // Close the modal
                // Navigate back to appointments page
                setTimeout(() => {
                  try {
                    router.replace("/(tabs)/appointments");
                  } catch (navError) {
                    console.log("Navigation error:", navError);
                  }
                }, 100);
              },
            },
          ]
        );
      } else {
        const errorText = await response.text();
        console.log("❌ Save error response:", errorText);

        if (response.status === 404) {
          Alert.alert(
            "🎭 Demo Mode Success",
            `${moment(formData.date).format("MMMM D, YYYY")} would be ${
              blockedDate ? "updated" : "blocked"
            } in demo mode!\n\nReason: ${formData.reason}`,
            [
              {
                text: "View Calendar",
                onPress: () => {
                  onSave(); // Refresh the data
                  onClose(); // Close the modal
                  // Navigate back to appointments page
                  setTimeout(() => {
                    try {
                      router.replace("/(tabs)/appointments");
                    } catch (navError) {
                      console.log("Navigation error:", navError);
                    }
                  }, 100);
                },
              },
            ]
          );
        } else {
          try {
            const errorData = JSON.parse(errorText);
            Alert.alert(
              "Error",
              errorData.message || "Failed to save blocked date"
            );
          } catch {
            Alert.alert("Error", "Failed to save blocked date");
          }
        }
      }
    } catch (error) {
      console.error("Error saving blocked date:", error);
      // Show demo mode success for network errors
      Alert.alert(
        "🎭 Demo Mode Success",
        `${moment(formData.date).format("MMMM D, YYYY")} would be ${
          blockedDate ? "updated" : "blocked"
        } in demo mode!\n\nReason: ${formData.reason}`,
        [
          {
            text: "View Calendar",
            onPress: () => {
              onSave(); // Refresh the data
              onClose(); // Close the modal
              // Navigate back to appointments page
              setTimeout(() => {
                try {
                  router.replace("/(tabs)/appointments");
                } catch (navError) {
                  console.log("Navigation error:", navError);
                }
              }, 100);
            },
          },
        ]
      );
    } finally {
      setSaving(false);
    }
  };
  const commonReasons = ["Lunch", "Meeting", "Vacation", "On Leave", "Other"];

  // Debug render
  console.log("🎨 Rendering BlockedDateModal...");
  console.log(
    "🎨 Current state - loading:",
    loading,
    "doctors.length:",
    doctors.length
  );
  console.log("🎨 Current user role:", currentUser?.role);
  console.log(
    "🎨 Should show doctor section:",
    currentUser?.role !== "patient"
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <ThemedText style={styles.cancelButton}>Cancel</ThemedText>
          </TouchableOpacity>
          <ThemedText type="title">
            {blockedDate ? "Edit Blocked Date" : "Block Date"}
          </ThemedText>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            <ThemedText
              style={[styles.saveButton, saving && styles.disabledButton]}
            >
              {saving ? "Saving..." : "Save"}
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
        <ScrollView style={styles.content}>
          {loading ? (
            <ThemedText>Loading...</ThemedText>
          ) : (
            <>
              <ThemedView style={styles.section}>
                <ThemedText style={styles.label}>Date</ThemedText>
                <TouchableOpacity
                  style={[styles.dateText, styles.dateInput]}
                  onPress={() => {
                    // For now, we'll show an alert to let user know this is a demo
                    // In a real app, you'd use a proper date picker library
                    Alert.alert(
                      "Date Selection",
                      `Currently selected: ${moment(formData.date).format(
                        "MMMM D, YYYY"
                      )}\n\nIn demo mode, you can change the date by editing the form data directly.`,
                      [{ text: "OK" }]
                    );
                  }}
                >
                  <ThemedText style={styles.dateDisplayText}>
                    {moment(formData.date).format("MMMM D, YYYY")}
                  </ThemedText>
                </TouchableOpacity>
                <ThemedText style={styles.dateHelp}>
                  Tap to select a date to block for appointments
                </ThemedText>
              </ThemedView>
              {currentUser?.role !== "patient" && (
                <ThemedView style={styles.section}>
                  <ThemedText style={styles.label}>Doctor</ThemedText>
                  {doctors.length > 0 ? (
                    <ThemedView style={styles.pickerContainer}>
                      {/* Custom Doctor Picker using TouchableOpacity */}
                      <TouchableOpacity
                        style={styles.customPickerButton}
                        onPress={() => {
                          console.log("🎨 Doctor picker button pressed");
                          setShowDoctorPicker(!showDoctorPicker);
                        }}
                      >
                        <ThemedText style={styles.customPickerText}>
                          {formData.doctor_id
                            ? (() => {
                                const selectedDoctor = doctors.find(
                                  (d) => d.id === formData.doctor_id
                                );
                                return selectedDoctor
                                  ? `Dr. ${selectedDoctor.first_name} ${selectedDoctor.last_name}`
                                  : "Select Doctor";
                              })()
                            : "Select Doctor"}
                        </ThemedText>
                        <ThemedText style={styles.dropdownArrow}>
                          {showDoctorPicker ? "▲" : "▼"}
                        </ThemedText>
                      </TouchableOpacity>

                      {/* Dropdown Options */}
                      {showDoctorPicker && (
                        <ThemedView style={styles.dropdownOptions}>
                          {doctors.map((doctor) => {
                            const doctorLabel =
                              doctor.first_name && doctor.last_name
                                ? `Dr. ${doctor.first_name} ${doctor.last_name}`
                                : doctor.username
                                ? doctor.username
                                : `Doctor ${doctor.id}`;
                            console.log(
                              "🎨 Adding dropdown option:",
                              doctorLabel,
                              "ID:",
                              doctor.id
                            );
                            return (
                              <TouchableOpacity
                                key={doctor.id}
                                style={[
                                  styles.dropdownOption,
                                  formData.doctor_id === doctor.id &&
                                    styles.selectedDropdownOption,
                                ]}
                                onPress={() => {
                                  console.log(
                                    "🎨 Selected doctor:",
                                    doctorLabel,
                                    "ID:",
                                    doctor.id
                                  );
                                  setFormData((prev) => ({
                                    ...prev,
                                    doctor_id: doctor.id,
                                  }));
                                  setShowDoctorPicker(false);
                                }}
                              >
                                <ThemedText
                                  style={[
                                    styles.dropdownOptionText,
                                    formData.doctor_id === doctor.id &&
                                      styles.selectedDropdownOptionText,
                                  ]}
                                >
                                  {doctorLabel}
                                </ThemedText>
                              </TouchableOpacity>
                            );
                          })}
                        </ThemedView>
                      )}
                    </ThemedView>
                  ) : (
                    <ThemedView style={styles.pickerContainer}>
                      <ThemedText style={styles.dateText}>
                        {loading
                          ? "Loading doctors..."
                          : "No doctors available. Connect to backend to load data."}
                      </ThemedText>
                    </ThemedView>
                  )}
                  <ThemedText style={styles.helperText}>
                    Select the doctor to block the date for
                  </ThemedText>
                </ThemedView>
              )}
              <ThemedView style={styles.section}>
                <ThemedText style={styles.label}>Quick Reasons</ThemedText>
                <ThemedView style={styles.reasonButtons}>
                  {commonReasons.map((reason) => (
                    <TouchableOpacity
                      key={reason}
                      style={[
                        styles.reasonButton,
                        formData.reason === reason &&
                          styles.selectedReasonButton,
                      ]}
                      onPress={() => setFormData({ ...formData, reason })}
                    >
                      <ThemedText
                        style={[
                          styles.reasonButtonText,
                          formData.reason === reason &&
                            styles.selectedReasonButtonText,
                        ]}
                      >
                        {reason}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </ThemedView>
              </ThemedView>
              <ThemedView style={styles.section}>
                <ThemedText style={styles.label}>Custom Reason</ThemedText>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter reason for blocking this date"
                  placeholderTextColor="#999"
                  value={formData.reason}
                  onChangeText={(text) =>
                    setFormData({ ...formData, reason: text })
                  }
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </ThemedView>
            </>
          )}
        </ScrollView>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  cancelButton: {
    color: "#e74c3c",
    fontSize: 16,
  },
  saveButton: {
    color: "#3498db",
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledButton: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  dateText: {
    fontSize: 16,
    padding: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  dateDisplayText: {
    fontSize: 16,
    color: "#333",
  },
  pickerContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#007AFF",
    minHeight: 60,
  },
  picker: {
    height: 50,
    color: "#000",
    backgroundColor: "transparent",
  },
  customPickerButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    minHeight: 50,
  },
  customPickerText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  dropdownArrow: {
    fontSize: 16,
    color: "#007AFF",
    marginLeft: 8,
  },
  dropdownOptions: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    marginTop: 4,
    maxHeight: 200,
  },
  dropdownOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  selectedDropdownOption: {
    backgroundColor: "#007AFF",
  },
  dropdownOptionText: {
    fontSize: 16,
    color: "#333",
  },
  selectedDropdownOptionText: {
    color: "#fff",
    fontWeight: "bold",
  },
  helperText: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
  },
  reasonButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  reasonButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "transparent",
  },
  selectedReasonButton: {
    backgroundColor: "#3498db",
    borderColor: "#3498db",
  },
  reasonButtonText: {
    fontSize: 14,
  },
  selectedReasonButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  textInput: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#000",
    minHeight: 80,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  dateHelp: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
    fontStyle: "italic",
  },
});
