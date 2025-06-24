import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import moment from "moment";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Modal,
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
  email: string;
}

interface Patient {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface Appointment {
  id?: number;
  patient_name?: string;
  doctor_name?: string;
  appointment_date: string;
  appointment_time: string;
  duration: number;
  status: string;
  notes?: string;
  patient_id: number;
  doctor_id: number;
}

interface AppointmentModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  appointment?: Appointment;
  selectedDate: string;
  currentUser: User | null;
}

export default function AppointmentModal({
  visible,
  onClose,
  onSave,
  appointment,
  selectedDate,
  currentUser,
}: AppointmentModalProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    appointment_date: selectedDate || moment().format("YYYY-MM-DD"),
    appointment_time: "09:00",
    duration: 30,
    status: "pending",
    notes: "",
    patient_id: 0,
    doctor_id: 0,
  });

  const loadUsersData = useCallback(async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("access_token");
      if (!token) return;

      // Load doctors
      console.log("🔍 Loading doctors - current user role:", currentUser?.role);
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
        setDoctors([]);
      }

      // Load patients (only for doctors and admins)
      if (currentUser?.role !== "patient") {
        console.log(
          "🔍 Loading patients - current user role:",
          currentUser?.role
        );
        console.log(
          "🔍 Making request to:",
          `${API_BASE_URL}/api/users/patients/`
        );
        console.log("🔍 Using token:", token ? "Token present" : "No token");

        const patientsResponse = await fetch(
          `${API_BASE_URL}/api/users/patients/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        console.log("🔍 Patients response status:", patientsResponse.status);

        if (patientsResponse.ok) {
          const patientsData = await patientsResponse.json();
          console.log("🔍 Patients data received:", patientsData);
          console.log("🔍 Number of patients:", patientsData?.length || 0);
          setPatients(patientsData || []);
        } else {
          const errorText = await patientsResponse.text();
          console.log("❌ Failed to load patients:", patientsResponse.status);
          console.log("❌ Error response:", errorText);
          setPatients([]);
        }
      } else {
        console.log("ℹ️ Skipping patient loading - user role is patient");
      }
    } catch (error) {
      console.error("Error loading users data:", error);
      setDoctors([]);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (visible) {
      loadUsersData();

      if (appointment) {
        // Editing existing appointment
        setFormData({
          appointment_date: appointment.appointment_date
            ? moment(appointment.appointment_date).format("YYYY-MM-DD")
            : selectedDate || moment().format("YYYY-MM-DD"),
          appointment_time: appointment.appointment_time
            ? moment(appointment.appointment_time, "HH:mm:ss").format("HH:mm")
            : "09:00",
          duration: appointment.duration || 30,
          status: appointment.status || "pending",
          notes: appointment.notes || "",
          patient_id: appointment.patient_id || 0,
          doctor_id: appointment.doctor_id || 0,
        });
      } else {
        // Creating new appointment
        setFormData({
          appointment_date: selectedDate || moment().format("YYYY-MM-DD"),
          appointment_time: "09:00",
          duration: 30,
          status: "pending",
          notes: "",
          patient_id: 0,
          doctor_id: currentUser?.role === "doctor" ? currentUser.user_id : 0,
        });
      }
    }
  }, [visible, appointment, selectedDate, currentUser, loadUsersData]);

  const handleSave = async () => {
    // Check if we have patients and doctors available
    if (patients.length === 0 || doctors.length === 0) {
      Alert.alert(
        "Demo Mode",
        `Missing data to create appointments:\n\n${
          patients.length === 0 ? "• No patients available\n" : ""
        }${
          doctors.length === 0 ? "• No doctors available\n" : ""
        }\nPlease add users in Django Admin first:\n${API_BASE_URL}/admin/\n\nCreate users with roles 'patient' and 'doctor' to enable appointments.`,
        [{ text: "OK" }]
      );
      return;
    }

    if (!formData.patient_id || !formData.doctor_id) {
      Alert.alert("Error", "Please select both patient and doctor");
      return;
    }

    setSaving(true);
    try {
      const token = await AsyncStorage.getItem("access_token");
      if (!token) {
        Alert.alert("Error", "No authentication token found");
        setSaving(false);
        return;
      }

      const appointmentData = {
        ...formData,
        appointment_time: formData.appointment_time + ":00", // Add seconds
      };

      const url = appointment
        ? `${API_BASE_URL}/api/appointments/${appointment.id}/`
        : `${API_BASE_URL}/api/appointments/`;

      const method = appointment ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(appointmentData),
      });

      if (response.ok) {
        Alert.alert(
          "Success",
          `Appointment ${appointment ? "updated" : "created"} successfully!`,
          [
            {
              text: "OK",
              onPress: () => {
                onSave();
                onClose();
              },
            },
          ]
        );
      } else {
        const errorData = await response.json();
        Alert.alert("Error", errorData.message || "Failed to save appointment");
      }
    } catch (error) {
      console.error("Error saving appointment:", error);
      // Show demo mode message when backend is not available
      Alert.alert(
        "Demo Mode",
        `Backend not connected. In a real environment, this appointment would be ${
          appointment ? "updated" : "created"
        }.`,
        [
          {
            text: "OK",
            onPress: () => {
              onSave();
              onClose();
            },
          },
        ]
      );
    } finally {
      setSaving(false);
    }
  };

  const timeSlots = [];
  for (let hour = 8; hour <= 17; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;
      timeSlots.push(timeString);
    }
  }

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
            {appointment ? "Edit Appointment" : "New Appointment"}
          </ThemedText>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            <ThemedText
              style={[styles.saveButton, saving && styles.disabledButton]}
            >
              {saving ? "Saving..." : "Save"}
            </ThemedText>
          </TouchableOpacity>        </ThemedView>
        <ScrollView style={styles.content}>
          {loading ? (
            <ThemedText>Loading...</ThemedText>
          ) : (
            <>
              <ThemedView style={styles.section}>
                <ThemedText style={styles.label}>Date</ThemedText>
                <input
                  type="date"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 16,
                    color: "#333",
                    width: "100%",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                  }}
                  value={
                    formData.appointment_date || moment().format("YYYY-MM-DD")
                  }
                  onChange={(e) => {
                    const selectedDate = e.target.value;
                    if (selectedDate) {
                      setFormData((prev) => ({
                        ...prev,
                        appointment_date: selectedDate,
                      }));
                    }
                  }}
                  min={moment().format("YYYY-MM-DD")} // Prevent selecting past dates
                />
              </ThemedView>
              <ThemedView style={styles.section}>
                <ThemedText style={styles.label}>Time</ThemedText>
                <ThemedView style={styles.pickerContainer}>
                  <Picker
                    selectedValue={formData.appointment_time || "09:00"}
                    onValueChange={(value) => {
                      console.log("Time picker value:", value, typeof value);
                      if (value && typeof value === "string" && value !== "") {
                        setFormData((prev) => ({
                          ...prev,
                          appointment_time: value,
                        }));
                      }
                    }}
                    style={styles.picker}
                  >
                    {timeSlots.map((time) => {
                      const timeLabel = moment(time, "HH:mm").format("h:mm A");
                      return (
                        <Picker.Item
                          key={time}
                          label={timeLabel}
                          value={time}
                        />
                      );                    })}
                  </Picker>
                </ThemedView>
              </ThemedView>
              <ThemedView style={styles.section}>
                <ThemedText style={styles.label}>Duration (minutes)</ThemedText>
                <ThemedView style={styles.pickerContainer}>
                  <Picker
                    selectedValue={formData.duration || 30}
                    onValueChange={(value) => {
                      console.log(
                        "Duration picker value:",
                        value,
                        typeof value
                      );

                      // Handle both string and number values
                      const numericValue =
                        typeof value === "string" ? parseInt(value, 10) : value;
                      if (
                        value !== undefined &&
                        value !== null &&
                        !isNaN(numericValue) &&
                        numericValue > 0
                      ) {
                        setFormData((prev) => ({
                          ...prev,
                          duration: numericValue,
                        }));
                        console.log("Updated duration to:", numericValue);
                      }
                    }}
                    style={styles.picker}
                  >
                    {[15, 30, 45, 60, 90, 120].map((duration) => (
                      <Picker.Item
                        key={duration}
                        label={`${duration} minutes`}
                        value={duration}
                      />
                    ))}
                  </Picker>                </ThemedView>
              </ThemedView>
              {currentUser?.role !== "patient" && (
                <ThemedView style={styles.section}>
                  <ThemedText style={styles.label}>Patient</ThemedText>
                  {patients.length > 0 ? (
                    <ThemedView style={styles.pickerContainer}>
                      <Picker
                        selectedValue={formData.patient_id || 0}
                        onValueChange={(value) => {
                          console.log(
                            "Patient picker value:",
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
                              patient_id: numericValue,
                            }));
                            console.log("Updated patient_id to:", numericValue);
                          }
                        }}
                        style={styles.picker}
                      >
                        <Picker.Item label="Select Patient" value={0} />
                        {patients.map((patient) => {
                          const patientLabel =
                            patient.first_name && patient.last_name
                              ? `${patient.first_name} ${patient.last_name}`
                              : patient.username
                              ? patient.username
                              : `Patient ${patient.id}`;
                          return (
                            <Picker.Item
                              key={patient.id}
                              label={patientLabel}
                              value={patient.id}
                            />
                          );
                        })}
                      </Picker>
                    </ThemedView>
                  ) : (
                    <ThemedView style={styles.pickerContainer}>
                      <ThemedText style={styles.dateText}>
                        No patients available. Connect to backend to load data.
                      </ThemedText>
                    </ThemedView>
                  )}
                </ThemedView>
              )}
              {currentUser?.role !== "doctor" && (
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
                              doctor_id: numericValue,
                            }));
                            console.log("Updated doctor_id to:", numericValue);
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
                        No doctors available. Connect to backend to load data.
                      </ThemedText>
                    </ThemedView>
                  )}
                </ThemedView>
              )}
              <ThemedView style={styles.section}>
                <ThemedText style={styles.label}>Status</ThemedText>
                <ThemedView style={styles.pickerContainer}>
                  <Picker
                    selectedValue={formData.status || "pending"}
                    onValueChange={(value) => {
                      console.log("Status picker value:", value, typeof value);
                      if (value && typeof value === "string" && value !== "") {
                        setFormData((prev) => ({ ...prev, status: value }));
                      }
                    }}
                    style={styles.picker}
                  >
                    <Picker.Item label="Pending" value="pending" />
                    <Picker.Item label="Confirmed" value="confirmed" />
                    <Picker.Item label="Cancelled" value="cancelled" />
                    <Picker.Item label="Completed" value="completed" />
                  </Picker>
                </ThemedView>
              </ThemedView>
              <ThemedView style={styles.section}>
                <ThemedText style={styles.label}>Notes</ThemedText>
                <TextInput
                  style={styles.textInput}
                  placeholder="Add notes (optional)"
                  value={formData.notes || ""}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, notes: text || "" }))
                  }
                  multiline
                  numberOfLines={4}
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
  pickerContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    overflow: "hidden",
  },
  picker: {
    height: Platform.OS === "ios" ? 150 : 50,
  },
  textInput: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#333",
    minHeight: 100,
  },
});
