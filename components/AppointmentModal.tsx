import { tokenStore } from "@/utils/tokenStore";
import DateTimePicker from "@react-native-community/datetimepicker";
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
  user_id: number; // Add user_id field for the CustomUser reference
  username: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface ClinicEvent {
  id: number;
  name: string;
  description?: string;
}

interface Appointment {
  id?: number;
  title?: string;
  patient_name?: string;
  provider_name?: string; // Backend returns this
  doctor_name?: string; // Keep for backward compatibility
  appointment_date?: string; // Keep for backward compatibility
  appointment_time?: string; // Keep for backward compatibility
  appointment_datetime?: string; // This is what the backend returns
  duration?: number; // Keep for backward compatibility
  duration_minutes?: number; // Backend returns this
  status: string;
  clinic_event_id?: number;
  clinic_event?: number; // Backend returns this
  notes?: string;
  description?: string; // Backend returns this
  patient_id?: number; // Keep for backward compatibility
  doctor_id?: number; // Keep for backward compatibility
  patient?: number; // Backend returns this
  provider?: number; // Backend returns this
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
  const [clinicEvents, setClinicEvents] = useState<ClinicEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Helper function to handle token expiration
  const handleTokenExpiration = useCallback(
    async (response: Response, errorData: any) => {
      if (response.status === 401 && errorData.code === "token_not_valid") {
        console.log("🔐 Token expired during data loading, clearing storage");
        await tokenStore.removeItem("access_token");
        await tokenStore.removeItem("refresh_token");
        Alert.alert(
          "Session Expired",
          "Your session has expired. Please log in again.",
          [
            {
              text: "OK",
              onPress: () => {
                onClose();
              },
            },
          ]
        );
        return true; // Token was expired
      }
      return false; // Token was not expired
    },
    [onClose]
  );

  // Form state
  const [formData, setFormData] = useState({
    appointment_date: selectedDate || moment().format("YYYY-MM-DD"),
    appointment_time: "09:00",
    duration: 30,
    status: "pending",
    clinic_event_id: 0,
    notes: "",
    patient_id: 0,
    doctor_id: 0,
  });

  const loadUsersData = useCallback(async () => {
    setLoading(true);
    try {
      const token = await tokenStore.getItem("access_token");
      if (!token) {
        console.log("❌ No token found, user needs to log in");
        Alert.alert(
          "Authentication Required",
          "Please log in to access this feature.",
          [
            {
              text: "OK",
              onPress: () => {
                onClose();
              },
            },
          ]
        );
        return;
      }

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

        // Check for token expiration
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }

        if (await handleTokenExpiration(doctorsResponse, errorData)) {
          return; // Exit early if token was expired
        }

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

          // Handle paginated response - extract results array
          const patientsArray = patientsData.results || patientsData || [];
          console.log("🔍 Number of patients:", patientsArray.length);
          console.log("🔍 Patients array:", patientsArray);
          setPatients(patientsArray);
        } else {
          const errorText = await patientsResponse.text();
          console.log("❌ Failed to load patients:", patientsResponse.status);
          console.log("❌ Error response:", errorText);

          // Check for token expiration
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { message: errorText };
          }

          if (await handleTokenExpiration(patientsResponse, errorData)) {
            return; // Exit early if token was expired
          }

          setPatients([]);
        }
      } else {
        console.log("ℹ️ Skipping patient loading - user role is patient");
      }

      // Load clinic events
      console.log("🔍 Loading clinic events");
      const clinicEventsResponse = await fetch(
        `${API_BASE_URL}/api/clinic-events/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log(
        "🔍 Clinic events response status:",
        clinicEventsResponse.status
      );

      if (clinicEventsResponse.ok) {
        const clinicEventsData = await clinicEventsResponse.json();
        console.log("🔍 Clinic events data received:", clinicEventsData);

        // Handle paginated response if needed
        const eventsArray = clinicEventsData.results || clinicEventsData || [];
        console.log("🔍 Number of clinic events:", eventsArray.length);
        setClinicEvents(eventsArray);
      } else {
        const errorText = await clinicEventsResponse.text();
        console.log(
          "❌ Failed to load clinic events:",
          clinicEventsResponse.status
        );
        console.log("❌ Error response:", errorText);

        // Check for token expiration
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }

        if (await handleTokenExpiration(clinicEventsResponse, errorData)) {
          return; // Exit early if token was expired
        }

        setClinicEvents([]);
      }
    } catch (error) {
      console.error("Error loading users data:", error);

      setDoctors([]);
      setPatients([]);
      setClinicEvents([]);
      Alert.alert(
        "Network Error",
        "Could not load doctors, patients or visit types. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }, [currentUser, onClose, handleTokenExpiration]);

  useEffect(() => {
    if (visible) {
      console.log("🔍 AppointmentModal opened, loading users data...");
      console.log("🔍 Current user:", currentUser);
      loadUsersData();

      if (appointment) {
        // Editing existing appointment
        console.log("🔍 Editing existing appointment:", appointment);

        let appointmentDate, appointmentTime;

        // Handle both old format and new format
        if (appointment.appointment_datetime) {
          // Parse from appointment_datetime (backend format)
          const datetime = moment(appointment.appointment_datetime);
          appointmentDate = datetime.format("YYYY-MM-DD");
          appointmentTime = datetime.format("HH:mm");
        } else {
          // Use legacy separate fields
          appointmentDate = appointment.appointment_date
            ? moment(appointment.appointment_date).format("YYYY-MM-DD")
            : selectedDate || moment().format("YYYY-MM-DD");
          appointmentTime = appointment.appointment_time
            ? moment(appointment.appointment_time, "HH:mm:ss").format("HH:mm")
            : "09:00";
        }

        setFormData({
          appointment_date: appointmentDate,
          appointment_time: appointmentTime,
          duration: appointment.duration || appointment.duration_minutes || 30,
          status: appointment.status || "pending",
          clinic_event_id:
            appointment.clinic_event_id || appointment.clinic_event || 0,
          notes: appointment.notes || appointment.description || "",
          patient_id: appointment.patient_id || appointment.patient || 0,
          doctor_id: appointment.doctor_id || appointment.provider || 0,
        });
      } else {
        // Creating new appointment
        console.log("🔍 Creating new appointment");
        setFormData({
          appointment_date: selectedDate || moment().format("YYYY-MM-DD"),
          appointment_time: "09:00",
          duration: 30,
          status: "pending",
          clinic_event_id: 0,
          notes: "",
          patient_id: 0,
          doctor_id: currentUser?.role === "doctor" ? currentUser.user_id : 0,
        });
      }
    }
  }, [visible, appointment, selectedDate, currentUser, loadUsersData]);

  // The appointment stores the patient's USER id (that is what gets saved as
  // `patient`), but the Patient picker's items use the patient record's own
  // `id`. When editing, translate one to the other once the patient list has
  // loaded; otherwise the picker can't find a match and silently shows the
  // first patient in the list instead of the one on the appointment.
  useEffect(() => {
    if (!visible || !appointment || patients.length === 0) return;
    const userId = appointment.patient;
    if (!userId) return;
    const match = patients.find((p) => p.user_id === userId);
    if (match) {
      setFormData((prev) =>
        prev.patient_id === match.id ? prev : { ...prev, patient_id: match.id }
      );
    }
  }, [visible, appointment, patients]);

  // The backend Appointment has no clinic_event column: the clinic event's
  // name is saved as the appointment `title`. So when editing, restore the
  // picker by ID if one is present, otherwise by matching the title to a
  // clinic event name once the clinic events list has loaded.
  useEffect(() => {
    if (!visible || !appointment || clinicEvents.length === 0) return;
    const savedId = appointment.clinic_event_id || appointment.clinic_event;
    let match = savedId
      ? clinicEvents.find((e) => e.id === savedId)
      : undefined;
    if (!match && appointment.title) {
      const title = appointment.title.trim().toLowerCase();
      match = clinicEvents.find((e) => e.name.trim().toLowerCase() === title);
    }
    if (match) {
      const matchId = match.id;
      setFormData((prev) =>
        prev.clinic_event_id === matchId
          ? prev
          : { ...prev, clinic_event_id: matchId }
      );
    }
  }, [visible, appointment, clinicEvents]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios"); // Keep open on iOS, close on Android
    if (selectedDate) {
      const formattedDate = moment(selectedDate).format("YYYY-MM-DD");
      setFormData((prev) => ({
        ...prev,
        appointment_date: formattedDate,
      }));
      console.log("📅 Date changed to:", formattedDate);
    }
  };

  const handleSave = async () => {
    console.log("💾 handleSave called");
    console.log("💾 Current formData:", formData);
    console.log("💾 Patients array:", patients);
    console.log("💾 Doctors array:", doctors);
    console.log("💾 Current user:", currentUser);

    // Check if we have patients and doctors available
    if (patients.length === 0 || doctors.length === 0) {
      console.log("❌ Missing patients or doctors data");
      Alert.alert(
        "Database Status",
        `Current database status:\n\n${
          patients.length === 0
            ? "• No patients found in the database\n"
            : "• Patients are available in the database\n"
        }${
          doctors.length === 0
            ? "• No doctors found in the database\n"
            : "• Doctors are available in the database\n"
        }\nPlease add users to the database to create appointments.`,
        [{ text: "OK" }]
      );
      return;
    }

    if (
      !formData.patient_id ||
      !formData.doctor_id ||
      !formData.clinic_event_id
    ) {
      console.log("❌ Missing required fields");
      console.log("❌ patient_id:", formData.patient_id);
      console.log("❌ doctor_id:", formData.doctor_id);
      console.log("❌ clinic_event_id:", formData.clinic_event_id);
      Alert.alert("Error", "Please select patient, doctor, and clinic event");
      return;
    }

    // Double-check that the selected patient and doctor actually exist
    const selectedPatient = patients.find((p) => p.id === formData.patient_id);
    const selectedDoctor = doctors.find((d) => d.id === formData.doctor_id);
    const selectedClinicEvent = clinicEvents.find(
      (e) => e.id === formData.clinic_event_id
    );

    console.log("🔍 Validation check:");
    console.log("  - Selected patient:", selectedPatient);
    console.log("  - Selected doctor:", selectedDoctor);
    console.log("  - Selected clinic event:", selectedClinicEvent);

    if (!selectedPatient) {
      console.log("❌ Invalid patient selection");
      Alert.alert(
        "Error",
        `Invalid patient selection (ID: ${formData.patient_id}). Please select a valid patient.`
      );
      return;
    }

    if (!selectedDoctor) {
      console.log("❌ Invalid doctor selection");
      Alert.alert(
        "Error",
        `Invalid doctor selection (ID: ${formData.doctor_id}). Please select a valid doctor.`
      );
      return;
    }

    if (!selectedClinicEvent) {
      console.log("❌ Invalid clinic event selection");
      Alert.alert(
        "Error",
        `Invalid clinic event selection (ID: ${formData.clinic_event_id}). Please select a valid clinic event.`
      );
      return;
    }

    console.log("✅ All validation passed, proceeding with save");

    // Show confirmation dialog with selected details
    const patientName = `${selectedPatient.first_name} ${selectedPatient.last_name}`;
    const doctorName = `${selectedDoctor.first_name} ${selectedDoctor.last_name}`;
    const clinicEventName = selectedClinicEvent.name;
    const appointmentTime = `${formData.appointment_date} at ${formData.appointment_time}`;

    console.log("🔒 === PRE-SAVE CONFIRMATION DIALOG ===");
    console.log(
      `🔒 About to show confirmation for: ${patientName} (ID: ${formData.patient_id})`
    );
    console.log(`🔒 Doctor: ${doctorName} (ID: ${formData.doctor_id})`);
    console.log(`🔒 Current formData.patient_id: ${formData.patient_id}`);
    console.log("🔒 =====================================");

    Alert.alert(
      "Confirm Appointment",
      `Please confirm the appointment details:\n\n` +
        `Patient: ${patientName}\n` +
        `Doctor: ${doctorName}\n` +
        `Clinic Event: ${clinicEventName}\n` +
        `Date & Time: ${appointmentTime}\n` +
        `Duration: ${formData.duration} minutes`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Save",
          onPress: async () => {
            console.log("✅ User confirmed, saving appointment");
            await performSave();
          },
        },
      ]
    );
  };

  const performSave = async () => {
    setSaving(true);
    try {
      const token = await tokenStore.getItem("access_token");
      if (!token) {
        Alert.alert("Error", "No authentication token found");
        setSaving(false);
        return;
      }

      // Final validation: Re-check that the selected IDs are still valid
      const finalPatient = patients.find((p) => p.id === formData.patient_id);
      const finalDoctor = doctors.find((d) => d.id === formData.doctor_id);
      const finalClinicEvent = clinicEvents.find(
        (e) => e.id === formData.clinic_event_id
      );

      if (!finalPatient || !finalDoctor || !finalClinicEvent) {
        console.log("❌ Final validation failed");
        console.log("  - Final patient:", finalPatient);
        console.log("  - Final doctor:", finalDoctor);
        console.log("  - Final clinic event:", finalClinicEvent);
        Alert.alert("Error", "Invalid selection detected. Please try again.");
        setSaving(false);
        return;
      }

      // Get current timezone offset dynamically
      const now = new Date();
      const timezoneOffset = -now.getTimezoneOffset(); // getTimezoneOffset returns negative values for positive offsets
      const offsetHours = Math.floor(Math.abs(timezoneOffset) / 60);
      const offsetMinutes = Math.abs(timezoneOffset) % 60;
      const offsetSign = timezoneOffset >= 0 ? "+" : "-";
      const timezoneString = `${offsetSign}${offsetHours
        .toString()
        .padStart(2, "0")}:${offsetMinutes.toString().padStart(2, "0")}`;

      const appointmentData = {
        title: finalClinicEvent.name || "Medical Appointment",
        appointment_datetime: `${formData.appointment_date}T${formData.appointment_time}:00${timezoneString}`, // Use dynamic timezone
        provider: formData.doctor_id, // Use doctor_id as provider
        patient: finalPatient.user_id, // Use patient.user_id instead of patient.id
        duration: formData.duration,
        status: formData.status,
        clinic_event: formData.clinic_event_id,
        notes: formData.notes || "",
      };

      console.log("💾 Final appointment data to save:", appointmentData);
      console.log("💾 Patient details:", finalPatient);
      console.log("💾 Doctor details:", finalDoctor);
      console.log("💾 Clinic event details:", finalClinicEvent);

      // ENHANCED DEBUG: Clear confirmation of what's being saved
      console.log("🎯 === APPOINTMENT SAVE CONFIRMATION ===");
      console.log(
        `🎯 Patient being saved: ${finalPatient.first_name} ${finalPatient.last_name} (Patient ID: ${formData.patient_id}, User ID: ${finalPatient.user_id})`
      );
      console.log(
        `🎯 Doctor being saved: ${finalDoctor.first_name} ${finalDoctor.last_name} (ID: ${formData.doctor_id})`
      );
      console.log(
        `🎯 Clinic event being saved: ${finalClinicEvent.name} (ID: ${formData.clinic_event_id})`
      );
      console.log(
        `🎯 Date/Time being saved: ${appointmentData.appointment_datetime}`
      );
      console.log("🎯 =======================================");

      const url = appointment
        ? `${API_BASE_URL}/api/appointments/${appointment.id}/`
        : `${API_BASE_URL}/api/appointments/`;

      const method = appointment ? "PUT" : "POST";

      console.log("💾 Request URL:", url);
      console.log("💾 Request method:", method);

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(appointmentData),
      });

      console.log("💾 Response status:", response.status);
      console.log(
        "💾 Response headers:",
        Object.fromEntries(response.headers.entries())
      );

      if (response.ok) {
        const responseData = await response.json();
        console.log("✅ Success response:", responseData);

        // BACKEND BUG WORKAROUND: Verify the saved patient matches what we sent
        const expectedPatientName = `${finalPatient.first_name} ${finalPatient.last_name}`;
        const actualPatientName = responseData.patient_name;

        if (actualPatientName !== expectedPatientName) {
          console.log("❌ BACKEND BUG DETECTED:");
          console.log(`   Expected patient: ${expectedPatientName}`);
          console.log(`   Backend returned: ${actualPatientName}`);
          console.log(`   Patient ID sent: ${formData.patient_id}`);

          Alert.alert(
            "Backend Data Error",
            `Warning: The backend saved the appointment with an incorrect patient name.\n\n` +
              `Expected: ${expectedPatientName}\n` +
              `Got: ${actualPatientName}\n\n` +
              `This is a backend data consistency issue. The appointment was created but with wrong patient information.`,
            [
              {
                text: "Report Bug",
                onPress: () => {
                  console.log("🐛 User requested to report backend bug");
                  // Could open bug report form or email
                },
              },
              {
                text: "Continue",
                onPress: () => {
                  onSave();
                  onClose();
                },
              },
            ]
          );
          return;
        }

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
        const errorText = await response.text();
        console.log("❌ Error response status:", response.status);
        console.log("❌ Error response text:", errorText);

        let errorData;
        try {
          errorData = JSON.parse(errorText);
          console.log("❌ Parsed error data:", errorData);
        } catch (parseError) {
          console.log("❌ Could not parse error as JSON:", parseError);
          errorData = { message: errorText };
        }

        // Handle token expiration
        if (response.status === 401 && errorData.code === "token_not_valid") {
          console.log("🔐 Token expired, redirecting to login");
          await tokenStore.removeItem("access_token");
          await tokenStore.removeItem("refresh_token");
          Alert.alert(
            "Session Expired",
            "Your session has expired. Please log in again.",
            [
              {
                text: "OK",
                onPress: () => {
                  onClose();
                  // Navigate to login - you may need to adjust this based on your navigation setup
                  // router.replace("/login");
                },
              },
            ]
          );
          return;
        }

        Alert.alert(
          "Error",
          errorData.message ||
            `Failed to save appointment (${response.status}): ${errorText}`
        );
      }
    } catch (error) {
      console.error("Error saving appointment:", error);
      Alert.alert(
        "Network Error",
        "Could not reach the server. The appointment was NOT saved. Please check your connection and try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // Generate time slots from 8 AM to 5 PM in 30-minute intervals
  const timeSlots: string[] = [];
  for (let hour = 8; hour <= 17; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;
      timeSlots.push(timeString);
    }
  }
  // An existing appointment may sit outside the 8-5 grid (or off the half
  // hour). Keep its own time selectable so the picker shows it instead of
  // jumping to 8:00 AM -- and saving doesn't silently move it.
  if (formData.appointment_time && !timeSlots.includes(formData.appointment_time)) {
    timeSlots.push(formData.appointment_time);
    timeSlots.sort();
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
          </TouchableOpacity>
        </ThemedView>

        <ScrollView style={styles.content}>
          {loading ? (
            <ThemedText>Loading...</ThemedText>
          ) : (
            <>
              {/* Date Section */}
              <ThemedView style={styles.section}>
                <ThemedText style={styles.label}>Date</ThemedText>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => setShowDatePicker(true)}
                >
                  <ThemedText style={styles.dateText}>
                    {moment(formData.appointment_date).format("MMMM D, YYYY")}
                  </ThemedText>
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={new Date(formData.appointment_date)}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={handleDateChange}
                    minimumDate={new Date()}
                  />
                )}
              </ThemedView>

              {/* Clinic Event Section */}
              <ThemedView style={styles.section}>
                <ThemedText style={styles.label}>Clinic Event</ThemedText>
                {clinicEvents.length > 0 ? (
                  <ThemedView style={styles.pickerContainer}>
                    <Picker
                      selectedValue={formData.clinic_event_id}
                      onValueChange={(value) => {
                        console.log(
                          "Clinic event picker value:",
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
                            clinic_event_id: numericValue,
                          }));
                          console.log(
                            "Updated clinic_event_id to:",
                            numericValue
                          );
                        }
                      }}
                      style={styles.picker}
                    >
                      <Picker.Item label="Select Clinic Event" value={0} />
                      {clinicEvents.map((event) => (
                        <Picker.Item
                          key={event.id}
                          label={event.name}
                          value={event.id}
                        />
                      ))}
                    </Picker>
                  </ThemedView>
                ) : (
                  <ThemedView style={styles.pickerContainer}>
                    <ThemedText style={styles.dateText}>
                      No clinic events available. Connect to backend to load
                      data.
                    </ThemedText>
                  </ThemedView>
                )}
              </ThemedView>

              {/* Time Section */}
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
                      );
                    })}
                  </Picker>
                </ThemedView>
              </ThemedView>

              {/* Duration Section */}
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
                  </Picker>
                </ThemedView>
              </ThemedView>

              {/* Patient Section (only for non-patients) */}
              {currentUser?.role !== "patient" && (
                <ThemedView style={styles.section}>
                  <ThemedText style={styles.label}>Patient</ThemedText>
                  {patients.length > 0 ? (
                    <ThemedView style={styles.pickerContainer}>
                      <Picker
                        selectedValue={formData.patient_id || 0}
                        onValueChange={(value) => {
                          console.log(
                            "🧪 Patient picker onValueChange triggered:"
                          );
                          console.log(
                            "  - Selected value:",
                            value,
                            typeof value
                          );
                          console.log(
                            "  - Current formData.patient_id:",
                            formData.patient_id
                          );
                          console.log(
                            "  - Available patients:",
                            patients.map((p) => ({
                              id: p.id,
                              name: `${p.first_name} ${p.last_name}`,
                            }))
                          );

                          // Handle both string and number values, ensure we get a valid number
                          let numericValue = 0;
                          if (typeof value === "string") {
                            numericValue = parseInt(value, 10);
                          } else if (typeof value === "number") {
                            numericValue = value;
                          }

                          // Validate that the patient ID actually exists in our patients array
                          const selectedPatient = patients.find(
                            (p) => p.id === numericValue
                          );

                          console.log(
                            "  - Converted to numeric:",
                            numericValue
                          );
                          console.log("  - Found patient:", selectedPatient);

                          // ENHANCED DEBUGGING: Log the exact patient being selected
                          if (selectedPatient) {
                            console.log(
                              `  - ✅ SELECTING PATIENT: ${selectedPatient.first_name} ${selectedPatient.last_name} (ID: ${selectedPatient.id})`
                            );
                          } else if (numericValue === 0) {
                            console.log(
                              "  - ℹ️ Clearing patient selection (Select Patient)"
                            );
                          } else {
                            console.log(
                              `  - ❌ INVALID SELECTION: Patient ID ${numericValue} not found!`
                            );
                          }

                          if (numericValue === 0 || selectedPatient) {
                            // Only update if it's a valid selection (0 for "Select Patient" or a valid patient ID)
                            setFormData((prev) => {
                              const newFormData = {
                                ...prev,
                                patient_id: numericValue,
                              };
                              console.log("  - Updated formData:", newFormData);
                              console.log(
                                `  - 🎯 FINAL PATIENT SELECTION: ${
                                  numericValue === 0
                                    ? "None"
                                    : selectedPatient
                                    ? `${selectedPatient.first_name} ${selectedPatient.last_name} (ID: ${numericValue})`
                                    : `Unknown patient (ID: ${numericValue})`
                                }`
                              );
                              return newFormData;
                            });
                          } else {
                            console.log(
                              "  - ❌ Invalid patient ID, ignoring selection"
                            );
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
                          console.log(
                            `Rendering patient picker item: ${patientLabel} (ID: ${patient.id})`
                          );
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
                        No patients found in the database. Please add patients
                        to continue.
                      </ThemedText>
                    </ThemedView>
                  )}
                </ThemedView>
              )}

              {/* Doctor Section (only for non-doctors) */}
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

              {/* Status Section */}
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
                    <Picker.Item label="Scheduled" value="scheduled" />
                    <Picker.Item label="Pending" value="pending" />
                    <Picker.Item label="Confirmed" value="confirmed" />
                    <Picker.Item label="Cancelled" value="cancelled" />
                    <Picker.Item label="Completed" value="completed" />
                    <Picker.Item label="In Progress" value="in_progress" />
                    <Picker.Item label="No Show" value="no_show" />
                    <Picker.Item label="Rescheduled" value="rescheduled" />
                  </Picker>
                </ThemedView>
              </ThemedView>

              {/* Notes Section */}
              <ThemedView style={styles.section}>
                <ThemedText style={styles.label}>Notes</ThemedText>
                <TextInput
                  style={styles.textInput}
                  placeholder="Add notes (optional)"
                  placeholderTextColor="#999"
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
    backgroundColor: "transparent",
    borderRadius: 8,
  },
  dateInput: {
    backgroundColor: "transparent",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  pickerContainer: {
    backgroundColor: "transparent",
    borderRadius: 8,
    overflow: "hidden",
  },
  picker: {
    height: Platform.OS === "ios" ? 150 : 50,
  },
  textInput: {
    backgroundColor: "transparent",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#333",
    minHeight: 100,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  singleLineTextInput: {
    backgroundColor: "transparent",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#333",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
});
