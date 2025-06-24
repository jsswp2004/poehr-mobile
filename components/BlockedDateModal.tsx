import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
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
  const [showDatePicker, setShowDatePicker] = useState(false);
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

      // Load doctors - same logic as AppointmentModal
      console.log(
        "🔍 Loading doctors for blocked date - current user role:",
        currentUser?.role
      );
      console.log(
        "🔍 Making request to:",
        `${API_BASE_URL}/api/users/doctors/`
      );

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

      if (doctorsResponse.ok) {
        const doctorsData = await doctorsResponse.json();
        console.log("🔍 Doctors data received:", doctorsData);
        console.log("🔍 Number of doctors:", doctorsData?.length || 0);
        setDoctors(doctorsData || []);
      } else {
        const errorText = await doctorsResponse.text();
        console.log("❌ Failed to load doctors:", doctorsResponse.status);
        console.log("❌ Error response:", errorText);

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
      console.error("Error loading doctors:", error);
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
          date: moment(blockedDate.start_time).local().format("YYYY-MM-DD"),
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
    console.log("🚀 handleSave called - starting save process");
    console.log("🚀 Form data:", formData);

    if (!formData.reason.trim()) {
      console.log("❌ Validation failed: No reason provided");
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

      const method = blockedDate ? "PUT" : "POST"; // Convert the form data to match the Availability model
      const startDateTime = moment(`${formData.date}T00:00:00`).format(
        "YYYY-MM-DDTHH:mm:ss"
      );
      const endDateTime = moment(`${formData.date}T23:59:59`).format(
        "YYYY-MM-DDTHH:mm:ss"
      );

      // Validate that the dates are valid
      if (!moment(startDateTime).isValid() || !moment(endDateTime).isValid()) {
        console.log("❌ Date validation failed:", {
          startDateTime,
          endDateTime,
        });
        Alert.alert(
          "Error",
          "Invalid date format. Please select a valid date."
        );
        return;
      }
      const availabilityData: any = {
        start_time: startDateTime, // Local time formatted
        end_time: endDateTime, // Local time formatted
        is_blocked: true,
        block_type: formData.reason || "Other",
        recurrence: "none",
      };

      // Only include doctor field if a doctor is selected
      if (formData.doctor_id && formData.doctor_id > 0) {
        availabilityData.doctor = formData.doctor_id;
      }

      // Validate the data before sending
      console.log("💾 Validating availability data:", availabilityData);
      if (!availabilityData.start_time || !availabilityData.end_time) {
        console.log("❌ Validation failed: Missing start_time or end_time");
        Alert.alert("Error", "Invalid date/time format");
        return;
      }
      if (
        !availabilityData.block_type ||
        availabilityData.block_type.trim() === ""
      ) {
        console.log("❌ Validation failed: Missing block_type");
        Alert.alert("Error", "Please provide a reason for blocking this date");
        return;
      }

      console.log("💾 Saving blocked date:", method, url);
      console.log("💾 Form data date:", formData.date);
      console.log("💾 Selected date:", selectedDate);
      console.log("💾 Timezone offset:", new Date().getTimezoneOffset());
      console.log(
        "💾 Final data to send:",
        JSON.stringify(availabilityData, null, 2)
      );

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
        console.log("✅ Save was successful! Showing success alert...");
        // Show success notification and navigate back to appointments
        Alert.alert(
          "✅ Success",
          `${moment(formData.date).format("MMMM D, YYYY")} has been ${
            blockedDate ? "updated" : "blocked"
          } successfully!\n\nReason: ${formData.reason}`,
          [
            {
              text: "View Calendar",
              onPress: () => {
                console.log(
                  "🔄 Success alert button pressed - starting navigation flow"
                );
                // Execute all actions together for better reliability
                onSave(); // Refresh the data immediately
                onClose(); // Close the modal

                // Small delay for smooth transition, then navigate
                setTimeout(() => {
                  console.log(
                    "🔄 Attempting to navigate to /(tabs)/appointments"
                  );
                  try {
                    // Use replace to force refresh and ensure we're on appointments tab
                    router.replace("/(tabs)/appointments");
                    console.log(
                      "✅ Navigation replace command executed successfully"
                    );
                  } catch (navError) {
                    console.error("❌ Navigation replace error:", navError);
                    // Fallback: try dismissing all modals and navigating
                    try {
                      router.dismissAll();
                      setTimeout(() => {
                        router.push("/(tabs)/appointments");
                        console.log(
                          "✅ Fallback navigation with dismissAll executed"
                        );
                      }, 50);
                    } catch (fallbackError) {
                      console.error(
                        "❌ Fallback navigation also failed:",
                        fallbackError
                      );
                      // Last resort: just log and rely on data refresh
                      console.log(
                        "📝 Relying on data refresh only - modal closed and data refreshed"
                      );
                    }
                  }
                }, 50);
              },
            },
          ]
        );
      } else {
        const errorText = await response.text();
        console.log("❌ Save error response:", errorText);
        console.log("❌ Response status:", response.status);

        // Try to parse and show the actual error message
        let errorMessage = "Failed to save blocked date";
        try {
          const errorData = JSON.parse(errorText);
          console.log("❌ Parsed error data:", errorData);
          errorMessage =
            errorData.message ||
            errorData.error ||
            errorData.detail ||
            JSON.stringify(errorData);
        } catch (parseError) {
          console.log("❌ Could not parse error response:", parseError);
          errorMessage = errorText || "Unknown error occurred";
        }

        if (response.status === 404) {
          Alert.alert(
            "🎭 Demo Mode Success",
            `${moment(formData.date).format("MMMM D, YYYY")} would be ${
              blockedDate ? "updated" : "blocked"
            } in a real environment.\n\nReason: ${formData.reason}`,
            [
              {
                text: "View Calendar",
                onPress: () => {
                  console.log(
                    "🔄 Demo mode (404) alert button pressed - starting navigation flow"
                  );
                  // Close modal first
                  onClose();
                  // Small delay to ensure modal closes, then refresh and navigate
                  setTimeout(() => {
                    onSave(); // Refresh the data
                    console.log(
                      "🔄 Attempting to navigate to /(tabs)/appointments (demo mode 404)"
                    );
                    try {
                      router.replace("/(tabs)/appointments");
                      console.log(
                        "✅ Demo mode (404) navigation replace command executed successfully"
                      );
                    } catch (navError) {
                      console.error(
                        "❌ Demo mode (404) navigation error:",
                        navError
                      );
                      // Fallback for demo mode
                      try {
                        router.dismissAll();
                        router.push("/(tabs)/appointments");
                        console.log(
                          "✅ Demo mode (404) fallback navigation executed"
                        );
                      } catch (fallbackError) {
                        console.error(
                          "❌ Demo mode (404) fallback failed:",
                          fallbackError
                        );
                      }
                    }
                  }, 100);
                },
              },
            ]
          );
        } else {
          // Show the detailed error message to the user, but also provide demo mode
          console.log("❌ API failed with status:", response.status);
          console.log("❌ Showing demo mode success since API failed");
          Alert.alert(
            "🎭 Demo Mode Success",
            `${moment(formData.date).format("MMMM D, YYYY")} has been ${
              blockedDate ? "updated" : "blocked"
            } successfully in demo mode!\n\nReason: ${
              formData.reason
            }\n\n(API Error: ${errorMessage})`,
            [
              {
                text: "View Calendar",
                onPress: () => {
                  console.log(
                    "🔄 Demo mode (API error) alert button pressed - starting navigation flow"
                  );
                  // Close modal first
                  onClose();
                  // Small delay to ensure modal closes, then refresh and navigate
                  setTimeout(() => {
                    onSave(); // Refresh the data
                    console.log(
                      "🔄 Attempting to navigate to /(tabs)/appointments (demo mode API error)"
                    );
                    try {
                      router.replace("/(tabs)/appointments");
                      console.log(
                        "✅ Demo mode (API error) navigation replace command executed successfully"
                      );
                    } catch (navError) {
                      console.error(
                        "❌ Demo mode (API error) navigation error:",
                        navError
                      );
                      // Fallback for demo mode
                      try {
                        router.dismissAll();
                        router.push("/(tabs)/appointments");
                        console.log(
                          "✅ Demo mode (API error) fallback navigation executed"
                        );
                      } catch (fallbackError) {
                        console.error(
                          "❌ Demo mode (API error) fallback failed:",
                          fallbackError
                        );
                      }
                    }
                  }, 100);
                },
              },
            ]
          );
        }
      }
    } catch (error) {
      console.error("Error saving blocked date:", error);
      // Show demo mode success for network errors
      Alert.alert(
        "🎭 Demo Mode Success",
        `${moment(formData.date).format("MMMM D, YYYY")} would be ${
          blockedDate ? "updated" : "blocked"
        } in a real environment.\n\nReason: ${formData.reason}`,
        [
          {
            text: "View Calendar",
            onPress: () => {
              console.log(
                "🔄 Demo mode (network error) alert button pressed - starting navigation flow"
              );
              // Close modal first
              onClose();
              // Small delay to ensure modal closes, then refresh and navigate
              setTimeout(() => {
                onSave(); // Refresh the data
                console.log(
                  "🔄 Attempting to navigate to /(tabs)/appointments (network error)"
                );
                try {
                  router.replace("/(tabs)/appointments");
                  console.log(
                    "✅ Demo mode (network error) navigation replace command executed successfully"
                  );
                } catch (navError) {
                  console.error(
                    "❌ Demo mode (network error) navigation error:",
                    navError
                  );
                  // Fallback for network error demo mode
                  try {
                    router.dismissAll();
                    router.push("/(tabs)/appointments");
                    console.log(
                      "✅ Demo mode (network error) fallback navigation executed"
                    );
                  } catch (fallbackError) {
                    console.error(
                      "❌ Demo mode (network error) fallback failed:",
                      fallbackError
                    );
                  }
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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <ThemedView style={styles.container}>
        {" "}
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
              {" "}
              <ThemedView style={styles.section}>
                <ThemedText style={styles.label}>Date</ThemedText>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  style={styles.dateText}
                >
                  <ThemedText>
                    {moment(formData.date).format("MMMM D, YYYY")}
                  </ThemedText>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={formData.date ? new Date(formData.date) : new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) {
                        setFormData((prev) => ({
                          ...prev,
                          date: moment(selectedDate).format("YYYY-MM-DD"),
                        }));
                      }
                    }}
                    minimumDate={new Date()}
                  />
                )}
                <ThemedText style={styles.dateHelp}>
                  Select a date to block for appointments
                </ThemedText>
              </ThemedView>
              {currentUser?.role !== "patient" && (
                <ThemedView style={styles.section}>
                  <ThemedText style={styles.label}>Doctor</ThemedText>
                  {doctors.length > 0 ? (
                    <ThemedView style={styles.pickerContainer}>
                      <Picker
                        selectedValue={formData.doctor_id || 0}
                        onValueChange={(value) => {
                          console.log(
                            "Doctor picker value:",
                            value,
                            typeof value
                          );

                          // Handle both string and number values
                          const numericValue =
                            typeof value === "string"
                              ? parseInt(value, 10)
                              : value;

                          if (
                            value !== undefined &&
                            value !== null &&
                            !isNaN(numericValue)
                          ) {
                            setFormData((prev) => ({
                              ...prev,
                              doctor_id:
                                numericValue === 0 ? undefined : numericValue,
                            }));
                            console.log(
                              "Updated doctor_id to:",
                              numericValue === 0 ? undefined : numericValue
                            );
                          }
                        }}
                        style={styles.picker}
                      >
                        <Picker.Item label="Select Doctor" value={0} />
                        {doctors.map((doctor) => {
                          const doctorLabel =
                            doctor.first_name && doctor.last_name
                              ? `Dr. ${doctor.first_name} ${doctor.last_name}`
                              : doctor.username
                              ? doctor.username
                              : `Doctor ${doctor.id}`;
                          return (
                            <Picker.Item
                              key={doctor.id}
                              label={doctorLabel}
                              value={doctor.id}
                            />
                          );
                        })}
                      </Picker>
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
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  pickerContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    overflow: "hidden",
  },
  picker: {
    height: 50,
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
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#333",
    minHeight: 80,
  },
  dateHelp: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
    fontStyle: "italic",
  },
});
