import { tokenStore } from "@/utils/tokenStore";
import { jwtDecode } from "jwt-decode";
import moment from "moment";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Calendar, DateData } from "react-native-calendars";

import AppointmentModal from "@/components/AppointmentModal";
import BlockedDateModal from "@/components/BlockedDateModal";
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
}

interface Appointment {
  id: number;
  title: string;
  patient_name: string;
  provider_name?: string; // This is what backend returns
  doctor_name?: string; // Keep for backward compatibility
  appointment_date?: string; // Keep for backward compatibility
  appointment_time?: string; // Keep for backward compatibility
  appointment_datetime: string; // This is what the backend returns
  duration?: number; // Keep for backward compatibility
  duration_minutes: number; // This is what backend returns
  status: string;
  notes?: string;
  description?: string; // Backend returns this
  patient_id?: number; // Keep for backward compatibility
  doctor_id?: number; // Keep for backward compatibility
  patient: number; // Backend returns this
  provider: number; // Backend returns this
  clinic_event?: number;
  arrived?: boolean;
  no_show?: boolean;
  organization?: number;
  created_at?: string;
  updated_at?: string;
  recurrence?: string;
  recurrence_end_date?: string;
}

interface BlockedDateDisplay {
  id: number;
  date: string;
  reason: string;
  doctor_id?: number;
}

interface Doctor {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

export default function AppointmentsScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDateDisplay[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    moment().format("YYYY-MM-DD")
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<
    Appointment | undefined
  >();
  const [blockedDateModalVisible, setBlockedDateModalVisible] = useState(false);
  const [editingBlockedDate, setEditingBlockedDate] = useState<
    BlockedDateDisplay | undefined
  >();

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (user) {
      loadAppointments();
      loadBlockedDates();
      loadDoctors();
    }
  }, [user, selectedDate]);

  const loadUserData = async () => {
    try {
      const token = await tokenStore.getItem("access_token");
      if (token) {
        const decodedToken: any = jwtDecode(token);
        setUser({
          username: decodedToken.username,
          firstName: decodedToken.first_name,
          lastName: decodedToken.last_name,
          role: decodedToken.role,
          email: decodedToken.email,
          user_id: decodedToken.user_id,
        });
      }
    } catch (error) {
      console.error("Failed to load user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAppointments = async () => {
    try {
      const token = await tokenStore.getItem("access_token");
      if (!token) {
        console.log("❌ No token found for loading appointments");
        return;
      }

      console.log(
        "🔍 Loading appointments from:",
        `${API_BASE_URL}/api/appointments/`
      );
      const response = await fetch(`${API_BASE_URL}/api/appointments/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("🔍 Appointments response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("🔍 Appointments data received:", data);
        console.log("🔍 Number of appointments:", data.length || 0);
        console.log("🔍 First appointment sample:", data[0]);
        setAppointments(data);
      } else {
        const errorText = await response.text();
        console.error(
          "❌ Failed to load appointments:",
          response.status,
          errorText
        );
      }
    } catch (error) {
      console.error("❌ Error loading appointments:", error);
    }
  };
  const loadDoctors = async () => {
    try {
      const token = await tokenStore.getItem("access_token");
      if (!token) {
        console.log("❌ No auth token found for loading doctors");
        setDoctors([]);
        return;
      }

      console.log(
        "🔍 Loading doctors from:",
        `${API_BASE_URL}/api/users/doctors/`
      );

      const response = await fetch(`${API_BASE_URL}/api/users/doctors/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("🔍 Doctors response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("🔍 Doctors loaded:", data?.length || 0, "items");
        console.log(
          "🔍 Doctor names:",
          data?.map(
            (d: Doctor) => `${d.first_name} ${d.last_name} (ID: ${d.id})`
          )
        );
        setDoctors(data || []);
      } else {
        console.error("Failed to load doctors:", response.status);
        setDoctors([]);
      }
    } catch (error) {
      console.error("Error loading doctors:", error);
      setDoctors([]);
    }
  };

  const loadBlockedDates = async () => {
    try {
      const token = await tokenStore.getItem("access_token");
      if (!token) {
        console.log("❌ No auth token found for loading blocked dates");
        setBlockedDates([]);
        return;
      }

      console.log(
        "🔍 Loading blocked dates from:",
        `${API_BASE_URL}/api/availability/?is_blocked=true`
      );

      const response = await fetch(
        `${API_BASE_URL}/api/availability/?is_blocked=true`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("🔍 Blocked dates response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("🔍 Blocked dates loaded:", data?.length || 0, "items");
        console.log(
          "🔍 Raw blocked dates data:",
          JSON.stringify(data, null, 2)
        );

        // Convert availability data to BlockedDateDisplay format
        const blockedDateDisplays: BlockedDateDisplay[] =
          data?.map((item: any) => ({
            id: item.id,
            date: moment(item.start_time).format("YYYY-MM-DD"),
            reason: item.block_type || "Blocked",
            doctor_id: item.doctor,
          })) || [];

        console.log("🔍 Converted blocked dates:", blockedDateDisplays);
        setBlockedDates(blockedDateDisplays);
      } else {
        console.error("Failed to load blocked dates:", response.status);
        setBlockedDates([]);
      }
    } catch (error) {
      console.error("Error loading blocked dates:", error);
      setBlockedDates([]);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadAppointments();
    await loadBlockedDates();
    await loadDoctors();
    setRefreshing(false);
  };
  const getMarkedDates = () => {
    const marked: any = {};

    // Mark selected date
    if (selectedDate) {
      marked[selectedDate] = {
        selected: true,
        selectedColor: "#1976d2",
      };
    }

    // Mark appointment dates
    (appointments || []).forEach((appointment) => {
      if (appointment) {
        let date;
        if (appointment.appointment_datetime) {
          // Extract date from appointment_datetime
          date = moment(appointment.appointment_datetime).format("YYYY-MM-DD");
        } else if (appointment.appointment_date) {
          // Use legacy appointment_date field
          date = moment(appointment.appointment_date).format("YYYY-MM-DD");
        }

        if (date) {
          if (marked[date]) {
            marked[date] = {
              ...marked[date],
              marked: true,
              dotColor: "#2e7d32",
            };
          } else {
            marked[date] = {
              marked: true,
              dotColor: "#2e7d32",
            };
          }
        }
      }
    });

    // Mark blocked dates
    (blockedDates || []).forEach((blocked) => {
      if (blocked && blocked.date) {
        const date = moment(blocked.date).format("YYYY-MM-DD");
        if (marked[date]) {
          marked[date] = {
            ...marked[date],
            marked: true,
            dotColor: "#c62828",
          };
        } else {
          marked[date] = {
            marked: true,
            dotColor: "#c62828",
          };
        }
      }
    });

    return marked;
  };
  const getAppointmentsForDate = (date: string) => {
    console.log("🔍 Getting appointments for date:", date);
    console.log("🔍 Total appointments available:", appointments?.length || 0);

    if (!date || !appointments) return [];

    const filtered = appointments.filter((appointment) => {
      if (!appointment) return false;

      // Handle both old format (appointment_date) and new format (appointment_datetime)
      let appointmentDate;
      if (appointment.appointment_datetime) {
        // Extract date from appointment_datetime (format: 2025-06-26T19:30:00+00:00)
        appointmentDate = moment(appointment.appointment_datetime).format(
          "YYYY-MM-DD"
        );
        console.log(
          `🔍 Appointment ${appointment.id}: datetime=${appointment.appointment_datetime}, extracted date=${appointmentDate}`
        );
      } else if (appointment.appointment_date) {
        // Use legacy appointment_date field
        appointmentDate = moment(appointment.appointment_date).format(
          "YYYY-MM-DD"
        );
        console.log(
          `🔍 Appointment ${appointment.id}: legacy date=${appointment.appointment_date}, formatted=${appointmentDate}`
        );
      } else {
        console.log(`🔍 Appointment ${appointment.id}: no date field found`);
        return false;
      }

      const matches = appointmentDate === date;
      console.log(
        `🔍 Appointment ${appointment.id}: ${appointmentDate} === ${date} ? ${matches}`
      );
      return matches;
    });

    console.log("🔍 Filtered appointments for date:", filtered.length);
    return filtered;
  };

  const getDoctorNameById = (doctorId?: number): string => {
    if (!doctorId) return "";
    const doctor = doctors.find((d) => d.id === doctorId);
    if (!doctor) return "";
    return `Dr. ${doctor.first_name} ${doctor.last_name}`;
  };

  // Convert BlockedDateDisplay to the format expected by BlockedDateModal
  const convertToModalFormat = (blockedDate: BlockedDateDisplay) => {
    return {
      id: blockedDate.id,
      start_time: `${blockedDate.date}T00:00:00Z`,
      end_time: `${blockedDate.date}T23:59:59Z`,
      is_blocked: true,
      block_type: blockedDate.reason,
      doctor: blockedDate.doctor_id,
    };
  };

  const getBlockedDatesForDate = (date: string) => {
    if (!date || !blockedDates) return [];
    return blockedDates.filter(
      (blocked) =>
        blocked &&
        blocked.date &&
        moment(blocked.date).format("YYYY-MM-DD") === date
    );
  };

  const onDayPress = (day: DateData) => {
    if (day && day.dateString) {
      setSelectedDate(day.dateString);
    }
  };

  const handleCreateAppointment = () => {
    setEditingAppointment(undefined);
    setModalVisible(true);
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setModalVisible(true);
  };

  const handleDeleteAppointment = async (appointment: Appointment) => {
    Alert.alert(
      "Delete Appointment",
      `Are you sure you want to delete the appointment with ${appointment.patient_name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await tokenStore.getItem("access_token");
              if (!token) return;

              const response = await fetch(
                `${API_BASE_URL}/api/appointments/${appointment.id}/`,
                {
                  method: "DELETE",
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                }
              );

              if (response.ok) {
                Alert.alert("Success", "Appointment deleted successfully");
                await loadAppointments(); // Refresh the list
              } else {
                Alert.alert("Error", "Failed to delete appointment");
              }
            } catch (error) {
              console.error("Error deleting appointment:", error);
              Alert.alert("Error", "Failed to delete appointment");
            }
          },
        },
      ]
    );
  };

  const handleModalSave = async () => {
    await loadAppointments(); // Refresh appointments after saving
  };

  const handleBlockDate = () => {
    setEditingBlockedDate(undefined);
    setBlockedDateModalVisible(true);
  };

  const handleEditBlockedDate = (blockedDate: BlockedDateDisplay) => {
    setEditingBlockedDate(blockedDate);
    setBlockedDateModalVisible(true);
  };

  const handleDeleteBlockedDate = async (blockedDate: BlockedDateDisplay) => {
    Alert.alert(
      "Remove Block",
      "Are you sure you want to remove this blocked date?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await tokenStore.getItem("access_token");
              if (!token) return;

              const response = await fetch(
                `${API_BASE_URL}/api/availability/${blockedDate.id}/`,
                {
                  method: "DELETE",
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                }
              );

              if (response.ok) {
                Alert.alert("Success", "Blocked date removed successfully");
                await loadBlockedDates(); // Refresh the list
              } else {
                Alert.alert("Error", "Failed to remove blocked date");
              }
            } catch (error) {
              console.error("Error deleting blocked date:", error);
              Alert.alert("Error", "Failed to remove blocked date");
            }
          },
        },
      ]
    );
  };

  const handleBlockedDateSave = async () => {
    await loadBlockedDates(); // Refresh blocked dates after saving
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color="#1976d2" />
        <ThemedText>Loading appointments...</ThemedText>
      </ThemedView>
    );
  }
  const dayAppointments = getAppointmentsForDate(selectedDate);
  const dayBlockedDates = getBlockedDatesForDate(selectedDate);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <ThemedView style={styles.header}>
        <ThemedView style={styles.headerTitleWrapper}>
          <ThemedText type="title" style={styles.headerTitle}>
            Appointments 📅
          </ThemedText>
        </ThemedView>
        <TouchableOpacity style={styles.refreshButton} onPress={refreshData}>
          <ThemedText style={styles.refreshButtonText}>
            {refreshing ? "Refreshing..." : "Refresh"}
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <ThemedView style={styles.calendarContainer}>
        <Calendar
          onDayPress={onDayPress}
          markedDates={getMarkedDates()}
          theme={{
            backgroundColor: "transparent",
            calendarBackground: "transparent",
            textSectionTitleColor: "#b6c1cd",
            selectedDayBackgroundColor: "#1976d2",
            selectedDayTextColor: "#ffffff",
            todayTextColor: "#1976d2",
            dayTextColor: "#2d4150",
            textDisabledColor: "#ddd",
            dotColor: "#00adf5",
            selectedDotColor: "#ffffff",
            arrowColor: "#1976d2",
            disabledArrowColor: "#ddd",
            monthTextColor: "#2d4150",
            indicatorColor: "#1976d2",
            textDayFontWeight: "300",
            textMonthFontWeight: "bold",
            textDayHeaderFontWeight: "300",
            textDayFontSize: 16,
            textMonthFontSize: 16,
            textDayHeaderFontSize: 13,
          }}
        />
      </ThemedView>

      <ThemedView style={styles.legendContainer}>
        <ThemedText type="subtitle">Legend</ThemedText>
        <ThemedView style={styles.legendItem}>
          <ThemedView
            style={[styles.legendDot, { backgroundColor: "#2e7d32" }]}
          />
          <ThemedText>Appointments</ThemedText>
        </ThemedView>
        <ThemedView style={styles.legendItem}>
          <ThemedView
            style={[styles.legendDot, { backgroundColor: "#c62828" }]}
          />
          <ThemedText>Blocked Dates</ThemedText>
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.selectedDateContainer}>
        <ThemedText type="subtitle">
          {moment(selectedDate).format("MMMM D, YYYY")}
        </ThemedText>

        {dayBlockedDates.length > 0 && (
          <ThemedView style={styles.blockedSection}>
            <ThemedView style={styles.sectionTitleWrapper}>
              <ThemedText style={styles.sectionTitle}>🚫 Blocked</ThemedText>
            </ThemedView>
            {dayBlockedDates.map((blocked) => (
              <ThemedView key={blocked.id} style={styles.blockedItem}>
                <ThemedView style={styles.blockedItemHeader}>
                  <ThemedView style={styles.blockedInfo}>
                    <ThemedText style={styles.blockedReason}>
                      {blocked.reason}
                    </ThemedText>
                    {blocked.doctor_id && (
                      <ThemedText style={styles.blockedDoctor}>
                        {getDoctorNameById(blocked.doctor_id)}
                      </ThemedText>
                    )}
                  </ThemedView>
                  {(user?.role === "doctor" || user?.role === "admin") && (
                    <ThemedView style={styles.blockedActions}>
                      <TouchableOpacity
                        style={styles.editBlockedButton}
                        onPress={() => handleEditBlockedDate(blocked)}
                      >
                        <ThemedText style={styles.editBlockedButtonText}>
                          Edit
                        </ThemedText>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteBlockedButton}
                        onPress={() => handleDeleteBlockedDate(blocked)}
                      >
                        <ThemedText style={styles.deleteBlockedButtonText}>
                          Remove
                        </ThemedText>
                      </TouchableOpacity>
                    </ThemedView>
                  )}
                </ThemedView>
              </ThemedView>
            ))}
          </ThemedView>
        )}

        {dayAppointments.length > 0 ? (
          <ThemedView style={styles.appointmentsSection}>
            <ThemedView style={styles.sectionTitleWrapper}>
              <ThemedText style={styles.sectionTitle}>
                Appointments📅({dayAppointments.length})
              </ThemedText>
            </ThemedView>
            {dayAppointments.map((appointment) => {
              console.log(
                "🔍 Rendering appointment:",
                appointment.id,
                appointment.title
              );
              return (
                <ThemedView key={appointment.id} style={styles.appointmentItem}>
                  <ThemedView style={styles.appointmentHeader}>
                    <ThemedText style={styles.appointmentTime}>
                      {appointment.appointment_datetime
                        ? moment(appointment.appointment_datetime).format(
                            "h:mm A"
                          )
                        : appointment.appointment_time
                        ? moment(
                            appointment.appointment_time,
                            "HH:mm:ss"
                          ).format("h:mm A")
                        : "Time not set"}
                    </ThemedText>
                    <ThemedText
                      style={[
                        styles.status,
                        appointment.status === "confirmed" &&
                          styles.statusConfirmed,
                        appointment.status === "pending" &&
                          styles.statusPending,
                        appointment.status === "cancelled" &&
                          styles.statusCancelled,
                      ]}
                    >
                      {(appointment.status || "PENDING").toUpperCase()}
                    </ThemedText>
                  </ThemedView>

                  <ThemedText style={styles.appointmentName}>
                    {user?.role === "patient"
                      ? appointment.provider_name ||
                        appointment.doctor_name ||
                        "Unknown Doctor"
                      : appointment.patient_name || "Unknown Patient"}
                  </ThemedText>

                  {appointment.title && (
                    <ThemedText style={styles.appointmentEvent}>
                      🏥 {appointment.title}
                    </ThemedText>
                  )}

                  <ThemedText style={styles.appointmentDuration}>
                    Duration:{" "}
                    {appointment.duration_minutes || appointment.duration || 30}{" "}
                    minutes
                  </ThemedText>

                  {(appointment.notes || appointment.description) && (
                    <ThemedText style={styles.appointmentNotes}>
                      Notes: {appointment.notes || appointment.description}
                    </ThemedText>
                  )}

                  {(user?.role === "doctor" || user?.role === "admin") && (
                    <ThemedView style={styles.appointmentActions}>
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => handleEditAppointment(appointment)}
                      >
                        <ThemedText style={styles.editButtonText}>
                          Edit
                        </ThemedText>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteAppointment(appointment)}
                      >
                        <ThemedText style={styles.deleteButtonText}>
                          Delete
                        </ThemedText>
                      </TouchableOpacity>
                    </ThemedView>
                  )}
                </ThemedView>
              );
            })}

            {/* Action buttons for creating appointments and blocking dates */}
            {user?.role !== "patient" && (
              <ThemedView style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.createButton}
                  onPress={handleCreateAppointment}
                >
                  <ThemedText style={styles.createButtonText}>
                    + Create Appointment
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.blockButton}
                  onPress={handleBlockDate}
                >
                  <ThemedText style={styles.blockButtonText}>
                    🚫 Block Date
                  </ThemedText>
                </TouchableOpacity>
              </ThemedView>
            )}
          </ThemedView>
        ) : (
          <ThemedView style={styles.noAppointments}>
            <ThemedText>No appointments scheduled for this date.</ThemedText>
            <ThemedText style={styles.debugText}>
              Current user role: {user?.role || "No role"}
            </ThemedText>
            <ThemedText style={styles.debugText}>
              Selected date: {selectedDate}
            </ThemedText>
            <ThemedText style={styles.debugText}>
              Total appointments in system: {appointments?.length || 0}
            </ThemedText>
            <ThemedText style={styles.debugText}>
              Appointments for this date: {dayAppointments.length}
            </ThemedText>
            {user?.role !== "patient" && (
              <ThemedView style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.createButton}
                  onPress={handleCreateAppointment}
                >
                  <ThemedText style={styles.createButtonText}>
                    + Create Appointment
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.blockButton}
                  onPress={handleBlockDate}
                >
                  <ThemedText style={styles.blockButtonText}>
                    🚫 Block Date
                  </ThemedText>
                </TouchableOpacity>
              </ThemedView>
            )}
            {user?.role === "patient" && (
              <ThemedText style={styles.debugText}>
                Patient role - buttons hidden
              </ThemedText>
            )}
          </ThemedView>
        )}
      </ThemedView>

      <AppointmentModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleModalSave}
        appointment={editingAppointment}
        selectedDate={selectedDate}
        currentUser={user}
      />

      <BlockedDateModal
        visible={blockedDateModalVisible}
        onClose={() => setBlockedDateModalVisible(false)}
        onSave={handleBlockedDateSave}
        blockedDate={
          editingBlockedDate
            ? convertToModalFormat(editingBlockedDate)
            : undefined
        }
        selectedDate={selectedDate}
        currentUser={user}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  scrollContent: {
    paddingBottom: 100, // Add padding to prevent buttons from being hidden under tab bar
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitleWrapper: {
    flex: 1,
    minWidth: 0, // Allow text to shrink and wrap
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#222",
    textAlign: "left",
    flexShrink: 1,
    flexWrap: "wrap",
  },
  refreshButton: {
    backgroundColor: "#1976d2",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  refreshButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  calendarContainer: {
    marginBottom: 20,
    borderRadius: 10,
    padding: 10,
    backgroundColor: "transparent",
  },
  legendContainer: {
    marginBottom: 20,
    padding: 15,
    borderRadius: 10,
    backgroundColor: "transparent",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  selectedDateContainer: {
    marginBottom: 20,
  },
  blockedSection: {
    marginTop: 15,
  },
  blockedItem: {
    padding: 10,
    marginTop: 5,
    borderRadius: 5,
    backgroundColor: "#ffebee",
    borderLeftWidth: 4,
    borderLeftColor: "#c62828",
  },
  blockedItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  blockedReason: {
    flex: 1,
    fontSize: 14,
  },
  blockedInfo: {
    flex: 1,
  },
  blockedDoctor: {
    fontSize: 12,
    opacity: 0.7,
    fontStyle: "italic",
    marginTop: 2,
  },
  blockedActions: {
    flexDirection: "row",
    gap: 8,
  },
  editBlockedButton: {
    backgroundColor: "#ef6c00",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  editBlockedButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  deleteBlockedButton: {
    backgroundColor: "#c62828",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  deleteBlockedButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  appointmentsSection: {
    marginTop: 15,
  },
  sectionTitle: {
    fontWeight: "bold",
    marginBottom: 10,
    flexShrink: 1,
    flexWrap: "wrap",
  },
  sectionTitleWrapper: {
    flex: 1,
    minWidth: 0, // Allow text to shrink and wrap
  },
  appointmentItem: {
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    backgroundColor: "transparent",
    borderLeftWidth: 4,
    borderLeftColor: "#2e7d32",
  },
  appointmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  appointmentTime: {
    fontSize: 16,
    fontWeight: "bold",
  },
  status: {
    fontSize: 12,
    fontWeight: "bold",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusConfirmed: {
    backgroundColor: "#2e7d32",
    color: "white",
  },
  statusPending: {
    backgroundColor: "#ef6c00",
    color: "white",
  },
  statusCancelled: {
    backgroundColor: "#c62828",
    color: "white",
  },
  appointmentName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 5,
  },
  appointmentEvent: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1976d2",
    marginBottom: 5,
  },
  appointmentDuration: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 5,
  },
  appointmentNotes: {
    fontSize: 14,
    fontStyle: "italic",
    opacity: 0.8,
    marginTop: 5,
  },
  appointmentActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
    gap: 10,
  },
  editButton: {
    backgroundColor: "#1976d2",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  editButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  deleteButton: {
    backgroundColor: "#c62828",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  deleteButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  noAppointments: {
    padding: 20,
    textAlign: "center",
    marginTop: 15,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginTop: 20,
    paddingVertical: 10,
  },
  createButton: {
    backgroundColor: "#2e7d32",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 8,
    flex: 1,
    minHeight: 50,
  },
  createButtonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 16,
  },
  blockButton: {
    backgroundColor: "#c62828",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 8,
    flex: 1,
    minHeight: 50,
  },
  blockButtonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 16,
  },
  debugText: {
    color: "#666",
    fontSize: 12,
    marginTop: 10,
    textAlign: "center",
  },
});
