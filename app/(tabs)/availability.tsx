import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { API_BASE_URL } from "@/config/api";

interface AvailabilityItem {
  id: number;
  doctor: number;
  start_time: string;
  end_time: string;
  is_blocked: boolean;
  block_type?: string;
  recurrence?: string;
  recurrence_end_date?: string;
  created_at?: string;
}

interface Doctor {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

interface Holiday {
  id: number;
  date: string;
  name: string;
  is_recognized: boolean;
}

export default function AvailabilityScreen() {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [schedules, setSchedules] = useState<AvailabilityItem[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [showRecurrenceModal, setShowRecurrenceModal] = useState(false);
  const [showBlockTypeModal, setShowBlockTypeModal] = useState(false);
  const isFetchingRef = useRef(false);

  // Date picker state
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showRecurrenceEndDatePicker, setShowRecurrenceEndDatePicker] =
    useState(false);

  const [formData, setFormData] = useState({
    start_time: new Date(),
    end_time: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours later
    is_blocked: false,
    recurrence: "none",
    recurrence_end_date: new Date(),
    block_type: "Lunch",
  });

  function getTodayAt(hour: number, minute: number = 0): Date {
    const date = new Date();
    date.setHours(hour, minute, 0, 0);
    return date;
  }

  function formatDateForDisplay(date: Date): string {
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  }

  // Unique by doctor, start_time, end_time, is_blocked (dedupes recurrences)
  const uniqueByTime = (arr: AvailabilityItem[]): AvailabilityItem[] => {
    const seen = new Set();
    return arr.filter((item) => {
      const key = `${item.doctor}_${item.start_time}_${item.end_time}_${item.is_blocked}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    const fetchDoctors = async () => {
      console.log("🔄 Loading doctors...");
      try {
        const token = await AsyncStorage.getItem("access_token");
        if (!token) {
          console.log("❌ No token found for doctors");
          return;
        }

        console.log("🔑 Making doctors API request...");
        const response = await fetch(`${API_BASE_URL}/api/users/doctors/`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        console.log("📡 Doctors API response status:", response.status);
        if (response.ok) {
          const data = await response.json();
          console.log("✅ Doctors loaded:", data);
          console.log("📊 Number of doctors:", data?.length || 0);
          setDoctors(data || []);
        } else {
          console.log("❌ Failed to load doctors, status:", response.status);
          const errorText = await response.text();
          console.log("Error details:", errorText);
        }
      } catch (error) {
        console.error("💥 Error loading doctors:", error);
        Alert.alert("Error", "Failed to load doctors");
      }
    };
    fetchDoctors();
  }, []);

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const token = await AsyncStorage.getItem("access_token");
        if (!token) return;

        const response = await fetch(`${API_BASE_URL}/api/holidays/`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          setHolidays(data.filter((h: Holiday) => h.is_recognized) || []);
        }
      } catch (error) {
        console.log("Could not load holidays:", error);
      }
    };
    fetchHolidays();
  }, []);

  const fetchSchedules = useCallback(async () => {
    if (!selectedDoctor || isFetchingRef.current) return;
    try {
      isFetchingRef.current = true;
      const token = await AsyncStorage.getItem("access_token");
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/api/availability/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        const doctorSchedules = data.filter(
          (s: AvailabilityItem) =>
            String(s.doctor) === String(selectedDoctor.id)
        );
        console.log("Doctor schedules:", doctorSchedules);
        setSchedules(uniqueByTime(doctorSchedules));
      } else {
        Alert.alert("Error", "Failed to load schedules");
      }
    } catch (error) {
      console.error("Error fetching schedules:", error);
      Alert.alert("Error", "Failed to load schedules");
    } finally {
      isFetchingRef.current = false;
    }
  }, [selectedDoctor]);

  useEffect(() => {
    if (selectedDoctor) fetchSchedules();
  }, [selectedDoctor, fetchSchedules]);

  const loadUserData = async () => {
    setLoading(false);
  };

  const isHoliday = (date: Date): boolean => {
    return holidays.some(
      (h) => new Date(h.date).toDateString() === date.toDateString()
    );
  };

  const handleSubmit = async () => {
    if (!selectedDoctor || !formData.start_time || !formData.end_time) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    const startDate = formData.start_time;
    if ([0, 6].includes(startDate.getDay()) || isHoliday(startDate)) {
      Alert.alert("Error", "Cannot schedule on weekends or holidays");
      return;
    }

    const payload = {
      doctor: selectedDoctor.id,
      start_time: formData.start_time.toISOString(),
      end_time: formData.end_time.toISOString(),
      is_blocked: formData.is_blocked,
      recurrence: formData.recurrence,
      recurrence_end_date:
        formData.recurrence === "none"
          ? null
          : formData.recurrence_end_date.toISOString().split("T")[0], // YYYY-MM-DD format
      block_type: formData.is_blocked ? formData.block_type : null,
    };

    console.log("=== SAVE REQUEST DEBUG ===");
    console.log("Payload being sent:", JSON.stringify(payload, null, 2));
    console.log("Selected doctor:", selectedDoctor);
    console.log("Form data:", formData);

    try {
      const token = await AsyncStorage.getItem("access_token");
      if (!token) {
        console.error("No token found");
        return;
      }

      const url = editingId
        ? `${API_BASE_URL}/api/availability/${editingId}/`
        : `${API_BASE_URL}/api/availability/`;

      const method = editingId ? "PUT" : "POST";

      console.log("Making request to:", url);
      console.log("Method:", method);
      console.log("Headers:", {
        Authorization: `Bearer ${token.substring(0, 20)}...`,
        "Content-Type": "application/json",
      });
      console.log("API_BASE_URL:", API_BASE_URL);

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        Alert.alert(
          "Success",
          editingId ? "Schedule updated!" : "Schedule saved!"
        );
        setFormData({
          start_time: getTodayAt(8),
          end_time: getTodayAt(17),
          is_blocked: false,
          recurrence: "none",
          recurrence_end_date: new Date(),
          block_type: "Lunch",
        });
        setEditingId(null);
        await fetchSchedules();
      } else {
        const errorText = await response.text();
        console.error("Server error:", response.status, errorText);
        Alert.alert(
          "Error",
          `Failed to save schedule: ${response.status} - ${errorText}`
        );
      }
    } catch (error) {
      console.error("Error saving schedule:", error);
      Alert.alert("Error", "Failed to save schedule");
    }
  };

  const handleEdit = (schedule: AvailabilityItem) => {
    setEditingId(schedule.id);
    setFormData({
      start_time: new Date(schedule.start_time),
      end_time: new Date(schedule.end_time),
      is_blocked: schedule.is_blocked,
      recurrence: schedule.recurrence || "none",
      recurrence_end_date: schedule.recurrence_end_date
        ? new Date(schedule.recurrence_end_date)
        : new Date(),
      block_type: schedule.block_type || "Lunch",
    });
    const doc = doctors.find((d) => d.id === schedule.doctor);
    setSelectedDoctor(doc || null);
  };

  const handleDelete = async (id: number) => {
    Alert.alert(
      "Delete Schedule",
      "Are you sure you want to delete this schedule?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("access_token");
              if (!token) return;

              const response = await fetch(
                `${API_BASE_URL}/api/availability/${id}/`,
                {
                  method: "DELETE",
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                }
              );

              if (response.ok) {
                Alert.alert("Success", "Schedule deleted");
                await fetchSchedules();
              } else {
                Alert.alert("Error", "Failed to delete schedule");
              }
            } catch (error) {
              console.error("Error deleting schedule:", error);
              Alert.alert("Error", "Failed to delete schedule");
            }
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    setFormData({
      start_time: getTodayAt(8),
      end_time: getTodayAt(17),
      is_blocked: false,
      recurrence: "none",
      recurrence_end_date: new Date(),
      block_type: "Lunch",
    });
    setEditingId(null);
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchSchedules();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color="#3498db" />
        <ThemedText>Loading availability...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <ThemedView style={styles.header}>
        <ThemedView style={styles.headerTitleWrapper}>
          <ThemedText type="title" style={styles.headerTitle}>
            Clinician Schedule 🛠️
          </ThemedText>
        </ThemedView>
        <TouchableOpacity style={styles.refreshButton} onPress={refreshData}>
          <ThemedText style={styles.refreshButtonText}>
            {refreshing ? "Refreshing..." : "Refresh"}
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {/* Schedule Maintenance Form */}
      <ThemedView style={styles.formContainer}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Schedule Form
        </ThemedText>

        {/* Doctor Selection */}
        <ThemedView style={styles.inputContainer}>
          <ThemedText style={styles.inputLabel}>Select Clinician</ThemedText>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => {
              console.log("🔄 Doctor dropdown pressed");
              setShowDoctorModal(true);
            }}
            disabled={doctors.length === 0}
          >
            <ThemedText style={styles.dropdownText}>
              {selectedDoctor
                ? `Dr. ${selectedDoctor.first_name} ${selectedDoctor.last_name}`
                : doctors.length > 0
                ? "Choose a clinician..."
                : "Loading doctors..."}
            </ThemedText>
            <ThemedText style={styles.dropdownArrow}>▼</ThemedText>
          </TouchableOpacity>
          {doctors.length === 0 && (
            <ThemedText style={styles.loadingText}>
              Loading doctors...
            </ThemedText>
          )}
        </ThemedView>

        {/* Start Time */}
        <ThemedView style={styles.inputContainer}>
          <ThemedText style={styles.inputLabel}>Start Time</ThemedText>
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => setShowStartDatePicker(true)}
          >
            <ThemedText style={styles.datePickerText}>
              {formatDateForDisplay(formData.start_time)}
            </ThemedText>
          </TouchableOpacity>
          {showStartDatePicker && (
            <DateTimePicker
              value={formData.start_time}
              mode="datetime"
              display="default"
              onChange={(event, selectedDate) => {
                setShowStartDatePicker(false);
                if (selectedDate) {
                  setFormData({ ...formData, start_time: selectedDate });
                }
              }}
            />
          )}
        </ThemedView>

        {/* End Time */}
        <ThemedView style={styles.inputContainer}>
          <ThemedText style={styles.inputLabel}>End Time</ThemedText>
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => setShowEndDatePicker(true)}
          >
            <ThemedText style={styles.datePickerText}>
              {formatDateForDisplay(formData.end_time)}
            </ThemedText>
          </TouchableOpacity>
          {showEndDatePicker && (
            <DateTimePicker
              value={formData.end_time}
              mode="datetime"
              display="default"
              onChange={(event, selectedDate) => {
                setShowEndDatePicker(false);
                if (selectedDate) {
                  setFormData({ ...formData, end_time: selectedDate });
                }
              }}
            />
          )}
        </ThemedView>

        {/* Recurrence */}
        <ThemedView style={styles.inputContainer}>
          <ThemedText style={styles.inputLabel}>Recurrence</ThemedText>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowRecurrenceModal(true)}
          >
            <ThemedText style={styles.dropdownText}>
              {formData.recurrence === "none"
                ? "None"
                : formData.recurrence === "daily"
                ? "Daily"
                : formData.recurrence === "weekly"
                ? "Weekly"
                : formData.recurrence === "monthly"
                ? "Monthly"
                : "None"}
            </ThemedText>
            <ThemedText style={styles.dropdownArrow}>▼</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {/* Recurrence End Date */}
        <ThemedView style={styles.inputContainer}>
          <ThemedText style={styles.inputLabel}>Recurrence End Date</ThemedText>
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => setShowRecurrenceEndDatePicker(true)}
          >
            <ThemedText style={styles.datePickerText}>
              {formData.recurrence_end_date.toLocaleDateString()}
            </ThemedText>
          </TouchableOpacity>
          {showRecurrenceEndDatePicker && (
            <DateTimePicker
              value={formData.recurrence_end_date}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowRecurrenceEndDatePicker(false);
                if (selectedDate) {
                  setFormData({
                    ...formData,
                    recurrence_end_date: selectedDate,
                  });
                }
              }}
            />
          )}
        </ThemedView>

        {/* Block Schedule Checkbox */}
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() =>
            setFormData({ ...formData, is_blocked: !formData.is_blocked })
          }
        >
          <View
            style={[
              styles.checkbox,
              formData.is_blocked && styles.checkboxChecked,
            ]}
          >
            {formData.is_blocked && (
              <ThemedText style={styles.checkmark}>✓</ThemedText>
            )}
          </View>
          <ThemedText style={styles.checkboxLabel}>
            Block this schedule
          </ThemedText>
        </TouchableOpacity>

        {/* Block Type (conditional) */}
        {formData.is_blocked && (
          <ThemedView style={styles.inputContainer}>
            <ThemedText style={styles.inputLabel}>Block Type</ThemedText>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowBlockTypeModal(true)}
            >
              <ThemedText style={styles.dropdownText}>
                {formData.block_type}
              </ThemedText>
              <ThemedText style={styles.dropdownArrow}>▼</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        )}

        {/* Action Buttons */}
        <ThemedView style={styles.actionButtons}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSubmit}>
            <ThemedText style={styles.saveButtonText}>
              {editingId ? "Update" : "Save"}
            </ThemedText>
          </TouchableOpacity>
          {editingId && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
            >
              <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
            </TouchableOpacity>
          )}
        </ThemedView>
      </ThemedView>

      {/* Schedule Overview */}
      {selectedDoctor && (
        <ThemedView style={styles.overviewContainer}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            📋 Schedule Overview
          </ThemedText>

          {/* Available Schedules */}
          <ThemedView style={styles.scheduleSection}>
            <ThemedText style={styles.scheduleTypeTitle}>
              ✅ Availability
            </ThemedText>
            {schedules.filter((s) => !s.is_blocked).length > 0 ? (
              schedules
                .filter((s) => !s.is_blocked)
                .map((s) => (
                  <ThemedView key={s.id} style={styles.scheduleItem}>
                    <ThemedText style={styles.scheduleTime}>
                      {new Date(s.start_time).toLocaleString()} —{" "}
                      {new Date(s.end_time).toLocaleString()}
                    </ThemedText>
                    <ThemedView style={styles.scheduleActions}>
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => handleEdit(s)}
                      >
                        <ThemedText style={styles.actionButtonText}>
                          ✏️
                        </ThemedText>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDelete(s.id)}
                      >
                        <ThemedText style={styles.actionButtonText}>
                          🗑️
                        </ThemedText>
                      </TouchableOpacity>
                    </ThemedView>
                  </ThemedView>
                ))
            ) : (
              <ThemedText style={styles.emptyText}>
                No availability scheduled
              </ThemedText>
            )}
          </ThemedView>

          {/* Blocked Schedules */}
          <ThemedView style={styles.scheduleSection}>
            <ThemedText style={styles.scheduleTypeTitle}>🚫 Blocked</ThemedText>
            {schedules.filter((s) => s.is_blocked).length > 0 ? (
              schedules
                .filter((s) => s.is_blocked)
                .map((s) => (
                  <ThemedView key={s.id} style={styles.scheduleItem}>
                    <ThemedText style={styles.scheduleTime}>
                      {new Date(s.start_time).toLocaleString()} —{" "}
                      {new Date(s.end_time).toLocaleString()}
                      {s.block_type && ` | ${s.block_type}`}
                      {` | Dr. ${selectedDoctor.first_name} ${selectedDoctor.last_name}`}
                    </ThemedText>
                    <ThemedView style={styles.scheduleActions}>
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => handleEdit(s)}
                      >
                        <ThemedText style={styles.actionButtonText}>
                          ✏️
                        </ThemedText>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDelete(s.id)}
                      >
                        <ThemedText style={styles.actionButtonText}>
                          🗑️
                        </ThemedText>
                      </TouchableOpacity>
                    </ThemedView>
                  </ThemedView>
                ))
            ) : (
              <ThemedText style={styles.emptyText}>No blocked times</ThemedText>
            )}
          </ThemedView>
        </ThemedView>
      )}

      {/* Doctor Selection Modal */}
      <Modal
        visible={showDoctorModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDoctorModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ThemedText style={styles.modalTitle}>Select Clinician</ThemedText>
            <ScrollView style={styles.modalOptions}>
              {doctors.map((doc) => (
                <TouchableOpacity
                  key={doc.id}
                  style={styles.modalOption}
                  onPress={() => {
                    console.log("🔄 Selected doctor:", doc);
                    setSelectedDoctor(doc);
                    setShowDoctorModal(false);
                  }}
                >
                  <ThemedText style={styles.modalOptionText}>
                    Dr. {doc.first_name} {doc.last_name}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowDoctorModal(false)}
            >
              <ThemedText style={styles.modalCloseText}>Cancel</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Recurrence Selection Modal */}
      <Modal
        visible={showRecurrenceModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRecurrenceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ThemedText style={styles.modalTitle}>Select Recurrence</ThemedText>
            <ScrollView style={styles.modalOptions}>
              {["none", "daily", "weekly", "monthly"].map((value) => (
                <TouchableOpacity
                  key={value}
                  style={styles.modalOption}
                  onPress={() => {
                    setFormData({ ...formData, recurrence: value });
                    setShowRecurrenceModal(false);
                  }}
                >
                  <ThemedText style={styles.modalOptionText}>
                    {value === "none"
                      ? "None"
                      : value.charAt(0).toUpperCase() + value.slice(1)}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowRecurrenceModal(false)}
            >
              <ThemedText style={styles.modalCloseText}>Cancel</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Block Type Selection Modal */}
      <Modal
        visible={showBlockTypeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBlockTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ThemedText style={styles.modalTitle}>Select Block Type</ThemedText>
            <ScrollView style={styles.modalOptions}>
              {["Lunch", "Meeting", "Vacation", "On Leave"].map((value) => (
                <TouchableOpacity
                  key={value}
                  style={styles.modalOption}
                  onPress={() => {
                    setFormData({ ...formData, block_type: value });
                    setShowBlockTypeModal(false);
                  }}
                >
                  <ThemedText style={styles.modalOptionText}>
                    {value}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowBlockTypeModal(false)}
            >
              <ThemedText style={styles.modalCloseText}>Cancel</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    flexWrap: "wrap",
    gap: 10,
  },
  headerTitleWrapper: {
    flex: 1,
    minWidth: 0,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 24,
    lineHeight: 28,
    flexShrink: 1,
    fontWeight: "bold",
  },
  refreshButton: {
    backgroundColor: "#3498db",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 5,
    minWidth: 80,
    alignItems: "center",
  },
  refreshButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  formContainer: {
    marginBottom: 30,
    padding: 20,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  sectionTitle: {
    fontWeight: "bold",
    marginBottom: 15,
    fontSize: 18,
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontWeight: "600",
    marginBottom: 8,
    fontSize: 16,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "white",
    fontSize: 16,
    minHeight: 50,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "white",
    paddingHorizontal: 8,
    minHeight: 50,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "white",
    minHeight: 50,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: "hidden",
  },
  pickerTouchable: {
    flex: 1,
  },
  picker: {
    height: 50,
    backgroundColor: "transparent",
    color: "#333",
    marginVertical: 0,
  },
  pickerItem: {
    fontSize: 16,
    color: "#333",
    backgroundColor: "white",
    height: 50,
  },
  datePickerButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "white",
    minHeight: 50,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  datePickerText: {
    fontSize: 16,
    color: "#333",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: "#3498db",
    borderRadius: 4,
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  checkboxChecked: {
    backgroundColor: "#3498db",
  },
  checkmark: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
  },
  checkboxLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginTop: 20,
  },
  saveButton: {
    backgroundColor: "#2ecc71",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    flex: 1,
  },
  saveButtonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: "#e74c3c",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    flex: 1,
  },
  cancelButtonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 16,
  },
  overviewContainer: {
    marginBottom: 30,
    padding: 20,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  scheduleSection: {
    marginBottom: 20,
  },
  scheduleTypeTitle: {
    fontWeight: "bold",
    marginBottom: 10,
    fontSize: 16,
    color: "#2c3e50",
  },
  scheduleItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderLeftWidth: 4,
    borderLeftColor: "#3498db",
  },
  scheduleTime: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  scheduleActions: {
    flexDirection: "row",
    gap: 8,
  },
  editButton: {
    backgroundColor: "#3498db",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  deleteButton: {
    backgroundColor: "#e74c3c",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  actionButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  emptyText: {
    fontStyle: "italic",
    color: "#666",
    textAlign: "center",
    padding: 20,
  },
  loadingText: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
    marginTop: 5,
  },
  // Custom dropdown styles
  dropdownButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "white",
    minHeight: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dropdownText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  dropdownArrow: {
    fontSize: 12,
    color: "#666",
    marginLeft: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 10,
    margin: 20,
    maxHeight: "70%",
    minWidth: "80%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    textAlign: "center",
  },
  modalOptions: {
    maxHeight: 300,
  },
  modalOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalOptionText: {
    fontSize: 16,
    color: "#333",
  },
  modalCloseButton: {
    backgroundColor: "#e74c3c",
    padding: 15,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  modalCloseText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});
