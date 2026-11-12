import { tokenStore } from "@/utils/tokenStore";
import DateTimePicker from "@react-native-community/datetimepicker";
import SelectField from "@/components/SelectField";
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

      const doctorsResponse = await fetch(
        `${API_BASE_URL}/api/users/doctors/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );


      if (doctorsResponse.ok) {
        const doctorsData = await doctorsResponse.json();
        setDoctors(doctorsData || []);
      } else {
        const errorText = await doctorsResponse.text();

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

        const patientsResponse = await fetch(
          `${API_BASE_URL}/api/users/patients/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );


        if (patientsResponse.ok) {
          const patientsData = await patientsResponse.json();

          // Handle paginated response - extract results array
          const patientsArray = patientsData.results || patientsData || [];
          setPatients(patientsArray);
        } else {
          const errorText = await patientsResponse.text();

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
      }

      // Load clinic events
      const clinicEventsResponse = await fetch(
        `${API_BASE_URL}/api/clinic-events/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );


      if (clinicEventsResponse.ok) {
        const clinicEventsData = await clinicEventsResponse.json();

        // Handle paginated response if needed
        const eventsArray = clinicEventsData.results || clinicEventsData || [];
        setClinicEvents(eventsArray);
      } else {
        const errorText = await clinicEventsResponse.text();

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
      loadUsersData();

      if (appointment) {
        // Editing existing appointment

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
    }
  };

  const handleSave = async () => {

    // Check if we have patients and doctors available
    if (patients.length === 0 || doctors.length === 0) {
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
      Alert.alert("Error", "Please select patient, doctor, and clinic event");
      return;
    }

    // Double-check that the selected patient and doctor actually exist
    const selectedPatient = patients.find((p) => p.id === formData.patient_id);
    const selectedDoctor = doctors.find((d) => d.id === formData.doctor_id);
    const selectedClinicEvent = clinicEvents.find(
      (e) => e.id === formData.clinic_event_id
    );


    if (!selectedPatient) {
      Alert.alert(
        "Error",
        `Invalid patient selection (ID: ${formData.patient_id}). Please select a valid patient.`
      );
      return;
    }

    if (!selectedDoctor) {
      Alert.alert(
        "Error",
        `Invalid doctor selection (ID: ${formData.doctor_id}). Please select a valid doctor.`
      );
      return;
    }

    if (!selectedClinicEvent) {
      Alert.alert(
        "Error",
        `Invalid clinic event selection (ID: ${formData.clinic_event_id}). Please select a valid clinic event.`
      );
      return;
    }


    // Show confirmation dialog with selected details
    const patientName = `${selectedPatient.first_name} ${selectedPatient.last_name}`;
    const doctorName = `${selectedDoctor.first_name} ${selectedDoctor.last_name}`;
    const clinicEventName = selectedClinicEvent.name;
    const appointmentTime = `${formData.appointment_date} at ${formData.appointment_time}`;


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


      // ENHANCED DEBUG: Clear confirmation of what's being saved

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
        const responseData = await response.json();

        // BACKEND BUG WORKAROUND: Verify the saved patient matches what we sent
        const expectedPatientName = `${finalPatient.first_name} ${finalPatient.last_name}`;
        const actualPatientName = responseData.patient_name;

        if (actualPatientName !== expectedPatientName) {

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

        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (parseError) {
          errorData = { message: errorText };
        }

        // Handle token expiration
        if (response.status === 401 && errorData.code === "token_not_valid") {
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
          <ThemedText style={styles.headerTitle}>
            {appointment ? "Edit appointment" : "New appointment"}
          </ThemedText>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            <ThemedText
              style={[styles.saveButton, saving && styles.disabledButton]}
            >
              {saving ? "Saving..." : "Save"}
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentInner}
          keyboardShouldPersistTaps="handled"
        >
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
                    display={Platform.OS === "ios" ? "inline" : "default"}
                    onChange={handleDateChange}
                    minimumDate={new Date()}
                  />
                )}
              </ThemedView>

              {/* Clinic Event Section */}
              <ThemedView style={styles.section}>
                <ThemedText style={styles.label}>Clinic Event</ThemedText>
                {clinicEvents.length > 0 ? (
                  <SelectField
                    title="Clinic event"
                    value={formData.clinic_event_id || 0}
                    options={[{ label: "Select clinic event", value: 0 }, ...clinicEvents.map((e) => ({ label: e.name, value: e.id }))]}
                    onChange={(v) => setFormData((prev) => ({ ...prev, clinic_event_id: Number(v) }))}
                  />
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
                <SelectField
                  title="Time"
                  value={formData.appointment_time || "09:00"}
                  options={timeSlots.map((time) => ({ label: moment(time, "HH:mm").format("h:mm A"), value: time }))}
                  onChange={(v) => setFormData((prev) => ({ ...prev, appointment_time: String(v) }))}
                />
              </ThemedView>

              {/* Duration Section */}
              <ThemedView style={styles.section}>
                <ThemedText style={styles.label}>Duration</ThemedText>
                <SelectField
                  title="Duration"
                  value={formData.duration || 30}
                  options={[15, 30, 45, 60, 90, 120].map((d) => ({ label: `${d} minutes`, value: d }))}
                  onChange={(v) => setFormData((prev) => ({ ...prev, duration: Number(v) }))}
                />
              </ThemedView>

              {/* Patient Section (only for non-patients) */}
              {currentUser?.role !== "patient" && (
                <ThemedView style={styles.section}>
                  <ThemedText style={styles.label}>Patient</ThemedText>
                  {patients.length > 0 ? (
                    <SelectField
                      title="Patient"
                      value={formData.patient_id || 0}
                      options={[{ label: "Select patient", value: 0 }, ...patients.map((p) => ({
                        label: p.first_name && p.last_name ? `${p.first_name} ${p.last_name}` : p.username ? p.username : `Patient ${p.id}`,
                        value: p.id,
                      }))]}
                      onChange={(v) => setFormData((prev) => ({ ...prev, patient_id: Number(v) }))}
                    />
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
                    <SelectField
                      title="Doctor"
                      value={formData.doctor_id || 0}
                      options={[{ label: "Select doctor", value: 0 }, ...doctors.map((d) => ({
                        label: d.first_name && d.last_name ? `Dr. ${d.first_name} ${d.last_name}` : d.username ? d.username : `Doctor ${d.id}`,
                        value: d.id,
                      }))]}
                      onChange={(v) => setFormData((prev) => ({ ...prev, doctor_id: Number(v) }))}
                    />
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
                <SelectField
                  title="Status"
                  value={formData.status || "pending"}
                  options={[
                    { label: "Scheduled", value: "scheduled" },
                    { label: "Pending", value: "pending" },
                    { label: "Confirmed", value: "confirmed" },
                    { label: "Cancelled", value: "cancelled" },
                    { label: "Completed", value: "completed" },
                    { label: "In progress", value: "in_progress" },
                    { label: "No show", value: "no_show" },
                    { label: "Rescheduled", value: "rescheduled" },
                  ]}
                  onChange={(v) => setFormData((prev) => ({ ...prev, status: String(v) }))}
                />
              </ThemedView>

              {/* Notes Section */}
              <ThemedView style={styles.section}>
                <ThemedText style={styles.label}>Notes</ThemedText>
                <TextInput
                  style={styles.textInput}
                  placeholder="Add notes (optional)"
                  placeholderTextColor="#8b95a0"
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
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: "#e3e8ee",
    backgroundColor: "#fff",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  cancelButton: {
    color: "#5b6670",
    fontSize: 16,
    fontWeight: "600",
    paddingVertical: 8,
  },
  saveButton: {
    color: "#1976d2",
    fontSize: 16,
    fontWeight: "700",
    paddingVertical: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: 20,
    paddingBottom: 48,
  },
  section: {
    marginBottom: 18,
    backgroundColor: "transparent",
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },
  dateText: {
    fontSize: 16,
    padding: 14,
    backgroundColor: "transparent",
    color: "#11181C",
  },
  dateInput: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#c5ccd4",
    minHeight: 50,
    justifyContent: "center",
  },
  pickerContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#c5ccd4",
    overflow: "hidden",
  },
  picker: {
    height: Platform.OS === "ios" ? 150 : 50,
  },
  textInput: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#11181C",
    minHeight: 100,
    borderWidth: 1,
    borderColor: "#c5ccd4",
  },
  singleLineTextInput: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: "#11181C",
    minHeight: 50,
    borderWidth: 1,
    borderColor: "#c5ccd4",
  },
});
