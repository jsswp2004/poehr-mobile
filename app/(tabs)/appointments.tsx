import { useCurrentUser } from "@/hooks/useCurrentUser";
import { tokenStore } from "@/utils/tokenStore";
import moment from "moment";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { Calendar, DateData } from "react-native-calendars";

import AppointmentModal from "@/components/AppointmentModal";
import BlockedDateModal from "@/components/BlockedDateModal";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { API_BASE_URL } from "@/config/api";

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

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "scheduled", label: "Scheduled" },
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "no_show", label: "No show" },
  { value: "cancelled", label: "Cancelled" },
];

const APPT_STATUS: Record<string, { bg: string; fg: string; label: string }> = {
  scheduled: { bg: "#e3effc", fg: "#0d5cab", label: "Scheduled" },
  pending: { bg: "#fdf0dc", fg: "#8a4b00", label: "Pending" },
  in_progress: { bg: "#e3f4e6", fg: "#1b6b2a", label: "In progress" },
  completed: { bg: "#eceff2", fg: "#3d4852", label: "Completed" },
  no_show: { bg: "#fde7e7", fg: "#a31d1d", label: "No show" },
  cancelled: { bg: "#eceff2", fg: "#3d4852", label: "Cancelled" },
  rescheduled: { bg: "#eceff2", fg: "#3d4852", label: "Rescheduled" },
};

export default function AppointmentsScreen() {
  const { user, loading: userLoading } = useCurrentUser();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDateDisplay[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    moment().format("YYYY-MM-DD")
  );
  const loading = userLoading;
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [providerFilter, setProviderFilter] = useState<number | null>(null);
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
    if (user) {
      loadAppointments();
      loadBlockedDates();
      loadDoctors();
    }
  }, [user, selectedDate]);

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
  const query = search.trim().toLowerCase();
  const filteredAppointments = dayAppointments.filter((a) => {
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    if (providerFilter !== null && a.provider !== providerFilter) return false;
    if (query) {
      const haystack = [a.patient_name, a.title, a.provider_name, a.doctor_name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
  const filtersActive =
    statusFilter !== "all" || providerFilter !== null || query !== "";
  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setProviderFilter(null);
  };
  // Doctors only ever see their own schedule, so the provider filter is for
  // admins, nurses and registrars.
  const showProviderFilter =
    !!user && user.role !== "patient" && user.role !== "doctor" && doctors.length > 1;
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
            Calendar
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

      <ThemedView style={styles.legendRow}>
        <ThemedView style={styles.legendItem}>
          <ThemedView
            style={[styles.legendDot, { backgroundColor: "#2e7d32" }]}
          />
          <ThemedText style={styles.legendText}>Has appointments</ThemedText>
        </ThemedView>
        <ThemedView style={styles.legendItem}>
          <ThemedView
            style={[styles.legendDot, { backgroundColor: "#c62828" }]}
          />
          <ThemedText style={styles.legendText}>Blocked</ThemedText>
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.selectedDateContainer}>
        <ThemedText type="subtitle">
          {moment(selectedDate).format("MMMM D, YYYY")}
        </ThemedText>

        {dayBlockedDates.length > 0 && (
          <ThemedView style={styles.blockedSection}>
            <ThemedView style={styles.sectionTitleWrapper}>
              <ThemedText style={styles.sectionTitle}>Blocked</ThemedText>
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
                Appointments (
                {filtersActive
                  ? `${filteredAppointments.length} of ${dayAppointments.length}`
                  : dayAppointments.length}
                )
              </ThemedText>
            </ThemedView>
            <ThemedView style={styles.filterBar}>
              <TextInput
                style={styles.filterSearch}
                placeholder="Search patient, visit or provider"
                value={search}
                onChangeText={setSearch}
                autoCapitalize="none"
                autoCorrect={false}
                clearButtonMode="while-editing"
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}
              >
                {STATUS_FILTERS.map((f) => (
                  <TouchableOpacity
                    key={f.value}
                    style={[
                      styles.chip,
                      statusFilter === f.value && styles.chipActive,
                    ]}
                    onPress={() => setStatusFilter(f.value)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: statusFilter === f.value }}
                  >
                    <ThemedText
                      style={[
                        styles.chipText,
                        statusFilter === f.value && styles.chipTextActive,
                      ]}
                    >
                      {f.label}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {showProviderFilter && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipRow}
                >
                  <TouchableOpacity
                    style={[
                      styles.chip,
                      providerFilter === null && styles.chipActive,
                    ]}
                    onPress={() => setProviderFilter(null)}
                    accessibilityRole="button"
                  >
                    <ThemedText
                      style={[
                        styles.chipText,
                        providerFilter === null && styles.chipTextActive,
                      ]}
                    >
                      All providers
                    </ThemedText>
                  </TouchableOpacity>
                  {doctors.map((d) => (
                    <TouchableOpacity
                      key={d.id}
                      style={[
                        styles.chip,
                        providerFilter === d.id && styles.chipActive,
                      ]}
                      onPress={() => setProviderFilter(d.id)}
                      accessibilityRole="button"
                    >
                      <ThemedText
                        style={[
                          styles.chipText,
                          providerFilter === d.id && styles.chipTextActive,
                        ]}
                      >
                        Dr. {d.last_name}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </ThemedView>
            {filteredAppointments.length === 0 && (
              <ThemedView style={styles.noMatch}>
                <ThemedText>No appointments match your filters.</ThemedText>
                <TouchableOpacity onPress={clearFilters}>
                  <ThemedText style={styles.clearLink}>Clear filters</ThemedText>
                </TouchableOpacity>
              </ThemedView>
            )}
            {filteredAppointments.map((appointment) => {
              const st =
                APPT_STATUS[appointment.status] || APPT_STATUS.scheduled;
              const timeText = appointment.appointment_datetime
                ? moment(appointment.appointment_datetime)
                : appointment.appointment_time
                ? moment(appointment.appointment_time, "HH:mm:ss")
                : null;
              const who =
                user?.role === "patient"
                  ? appointment.provider_name ||
                    appointment.doctor_name ||
                    "Unknown Doctor"
                  : appointment.patient_name || "Unknown Patient";
              const sub = [
                appointment.title,
                user?.role !== "patient"
                  ? appointment.provider_name || appointment.doctor_name
                  : null,
                `${appointment.duration_minutes || appointment.duration || 30} min`,
              ]
                .filter(Boolean)
                .join(" · ");
              return (
                <ThemedView key={appointment.id} style={styles.apptCard}>
                  <ThemedView style={styles.apptTimeCol}>
                    <ThemedText style={styles.apptTime}>
                      {timeText ? timeText.format("h:mm") : "--"}
                    </ThemedText>
                    <ThemedText style={styles.apptAmPm}>
                      {timeText ? timeText.format("A") : ""}
                    </ThemedText>
                  </ThemedView>
                  <ThemedView style={styles.apptBody}>
                    <ThemedText style={styles.apptName}>{who}</ThemedText>
                    <ThemedText style={styles.apptSub}>{sub}</ThemedText>
                    {(appointment.notes || appointment.description) && (
                      <ThemedText style={styles.apptNotes} numberOfLines={2}>
                        {appointment.notes || appointment.description}
                      </ThemedText>
                    )}
                    <ThemedView style={styles.apptFooter}>
                      <ThemedText
                        style={[
                          styles.apptChip,
                          { backgroundColor: st.bg, color: st.fg },
                        ]}
                      >
                        {st.label}
                      </ThemedText>
                      {(user?.role === "doctor" || user?.role === "admin") && (
                        <ThemedView style={styles.apptActions}>
                          <TouchableOpacity
                            style={styles.apptEdit}
                            onPress={() => handleEditAppointment(appointment)}
                          >
                            <ThemedText style={styles.apptEditText}>
                              Edit
                            </ThemedText>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.apptDelete}
                            onPress={() => handleDeleteAppointment(appointment)}
                          >
                            <ThemedText style={styles.apptDeleteText}>
                              Delete
                            </ThemedText>
                          </TouchableOpacity>
                        </ThemedView>
                      )}
                    </ThemedView>
                  </ThemedView>
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
                    New appointment
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.blockButton}
                  onPress={handleBlockDate}
                >
                  <ThemedText style={styles.blockButtonText}>
                    Block date
                  </ThemedText>
                </TouchableOpacity>
              </ThemedView>
            )}
          </ThemedView>
        ) : (
          <ThemedView style={styles.noAppointments}>
            <ThemedText>No appointments scheduled for this date.</ThemedText>
            {user?.role !== "patient" && (
              <ThemedView style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.createButton}
                  onPress={handleCreateAppointment}
                >
                  <ThemedText style={styles.createButtonText}>
                    New appointment
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.blockButton}
                  onPress={handleBlockDate}
                >
                  <ThemedText style={styles.blockButtonText}>
                    Block date
                  </ThemedText>
                </TouchableOpacity>
              </ThemedView>
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
  filterBar: {
    paddingHorizontal: 4,
    marginBottom: 8,
    backgroundColor: "transparent",
  },
  filterSearch: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: "#fff",
    color: "#11181C",
  },
  chipRow: {
    paddingVertical: 8,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
    backgroundColor: "#f0f2f5",
  },
  chipActive: {
    backgroundColor: "#1976d2",
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#3d4852",
  },
  chipTextActive: {
    color: "#fff",
  },
  noMatch: {
    alignItems: "center",
    paddingVertical: 16,
    gap: 6,
    backgroundColor: "transparent",
  },
  clearLink: {
    color: "#1976d2",
    fontWeight: "600",
  },
  legendRow: {
    flexDirection: "row",
    gap: 18,
    paddingHorizontal: 20,
    paddingVertical: 6,
    backgroundColor: "transparent",
  },
  legendText: { fontSize: 12, color: "#5b6670" },
  apptCard: {
    flexDirection: "row",
    gap: 12,
    borderWidth: 1,
    borderColor: "#e3e8ee",
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  apptTimeCol: { width: 52, alignItems: "center", backgroundColor: "transparent" },
  apptTime: { fontSize: 18, fontWeight: "700", color: "#1976d2" },
  apptAmPm: { fontSize: 11, fontWeight: "600", color: "#1976d2" },
  apptBody: { flex: 1, backgroundColor: "transparent" },
  apptName: { fontSize: 16, fontWeight: "600", color: "#11181C" },
  apptSub: { fontSize: 12, color: "#5b6670", marginTop: 2 },
  apptNotes: { fontSize: 12, color: "#5b6670", marginTop: 4, fontStyle: "italic" },
  apptFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    backgroundColor: "transparent",
  },
  apptChip: {
    fontSize: 11,
    fontWeight: "600",
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: "hidden",
  },
  apptActions: { flexDirection: "row", gap: 8, backgroundColor: "transparent" },
  apptEdit: {
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#c9dcf2",
    alignItems: "center",
    justifyContent: "center",
  },
  apptEditText: { color: "#0d5cab", fontWeight: "600", fontSize: 13 },
  apptDelete: {
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#f0c4c4",
    alignItems: "center",
    justifyContent: "center",
  },
  apptDeleteText: { color: "#c62828", fontWeight: "600", fontSize: 13 },
});
