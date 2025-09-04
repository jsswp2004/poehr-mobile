import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { jwtDecode } from "jwt-decode";
import moment from "moment";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { API_BASE_URL } from "@/config/api";

interface User {
  username: string;
  firstName?: string;
  lastName?: string;
  role: "doctor" | "admin" | "system_admin" | "patient" | "registrar";
  email?: string;
  user_id: number;
  organization?: string;
}

interface Patient {
  id: number;
  user_id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string; // Note: API uses 'phone_number' not 'phone'
  date_of_birth?: string;
  gender?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  medical_history?: string;
  created_at?: string;
  provider?: number;
  provider_name?: number;
  last_appointment_date?: string;
  organization?: number;
}

export default function PatientsScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Patient list state
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [isEditingPatient, setIsEditingPatient] = useState(false);
  const [editedPatient, setEditedPatient] = useState<Patient | null>(null);
  const [savingPatient, setSavingPatient] = useState(false);
  const [deletingPatient, setDeletingPatient] = useState(false);

  // Debug: Log component mount
  useEffect(() => {
    console.log("🏥 PatientsScreen component mounted");
  }, []);

  // Refresh patients when screen comes into focus (e.g., after registration)
  useFocusEffect(
    useCallback(() => {
      console.log("🔄 PatientsScreen focused - refreshing patient list");
      if (
        user &&
        (user.role === "doctor" ||
          user.role === "admin" ||
          user.role === "system_admin" ||
          user.role === "registrar")
      ) {
        loadPatients();
      }
    }, [user])
  );

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (user) {
      console.log("👤 User loaded in Patients tab:", user);
      console.log("🔐 User role:", user.role);
      console.log("🔍 PATIENTS DEBUG - Role type check:", typeof user.role);
      console.log("🔍 PATIENTS DEBUG - Role === 'registrar':", user.role === "registrar");
      console.log("🔍 PATIENTS DEBUG - Role === 'admin':", user.role === "admin");
      console.log("🔍 PATIENTS DEBUG - Role === 'doctor':", user.role === "doctor");
      if (
        user.role === "doctor" ||
        user.role === "admin" ||
        user.role === "system_admin" ||
        user.role === "registrar"
      ) {
        console.log("✅ User has access to patients, loading patients...");
        loadPatients();
      } else {
        console.log("❌ User does not have access to patients, redirecting...");
        console.log("❌ PATIENTS DEBUG - Denied role was:", user.role);
        // Redirect patients to home tab
        router.replace("/(tabs)");
      }
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      const token = await AsyncStorage.getItem("access_token");
      if (token) {
        const decodedToken: any = jwtDecode(token);
        console.log("🔍 PATIENTS DEBUG - Raw JWT role:", decodedToken.role);
        console.log("🔍 PATIENTS DEBUG - Full JWT token:", decodedToken);
        setUser({
          username: decodedToken.username,
          firstName: decodedToken.first_name,
          lastName: decodedToken.last_name,
          role: decodedToken.role as
            | "doctor"
            | "admin"
            | "system_admin"
            | "patient"
            | "registrar",
          email: decodedToken.email,
          user_id: decodedToken.user_id,
          organization: decodedToken.organization || "POWER IT",
        });
      }
    } catch (error) {
      console.error("Failed to load user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadPatients = async () => {
    console.log("🔄 Starting to load patients...");
    console.log("🌐 API_BASE_URL:", API_BASE_URL);
    setLoadingPatients(true);
    try {
      const token = await AsyncStorage.getItem("access_token");
      if (!token) {
        console.log("❌ No access token found");
        return;
      }

      console.log(
        "🔑 Token found, making API request to:",
        `${API_BASE_URL}/api/users/patients/?page_size=100&ordering=-id`
      );
      const response = await fetch(
        `${API_BASE_URL}/api/users/patients/?page_size=100&ordering=-id`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("📡 API Response status:", response.status);
      console.log("📡 API Response headers:", response.headers);

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Patients API success! Data received:", data);
        console.log("✅ Data type:", typeof data);
        console.log("✅ Is data an array?", Array.isArray(data));

        // Check for pagination information
        if (data.count !== undefined) {
          console.log("📄 Pagination detected:");
          console.log("📄 Total patients in database:", data.count);
          console.log("📄 Next page URL:", data.next);
          console.log("📄 Previous page URL:", data.previous);
        }

        // Handle both paginated and non-paginated responses
        const patientsArray = Array.isArray(data) ? data : data.results || [];
        console.log("📊 Number of patients returned:", patientsArray.length);
        console.log("🔍 First patient sample:", patientsArray[0]);
        console.log(
          "🔍 Last patient sample:",
          patientsArray[patientsArray.length - 1]
        );

        // Log all patient names for debugging
        if (patientsArray.length > 0) {
          console.log(
            "👥 All patients:",
            patientsArray.map(
              (p: Patient) => `${p.first_name} ${p.last_name} (ID: ${p.id})`
            )
          );
        } else {
          console.log("⚠️ No patients in the array - this might be the issue!");
        }

        setPatients(patientsArray);
      } else if (response.status === 404) {
        console.log(
          "⚠️ Patients endpoint not found (404) - Backend might be missing /api/users/patients/ endpoint"
        );
        // Show user-friendly message about missing endpoint
        Alert.alert(
          "Patients Feature Not Available",
          "The patients endpoint is not available on the backend server. Please contact your system administrator.",
          [{ text: "OK" }]
        );
      } else {
        console.log("❌ Failed to load patients. Status:", response.status);
        const errorText = await response.text();
        console.log("❌ Error response:", errorText);

        // Show generic error for other status codes
        Alert.alert(
          "Error Loading Patients",
          `Failed to load patients (HTTP ${response.status}). Please try again later.`,
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.log("💥 Error loading patients:", error);
      console.log("💥 Error details:", JSON.stringify(error, null, 2));

      // Show network error
      Alert.alert(
        "Network Error",
        "Unable to connect to the server. Please check your internet connection and try again.",
        [{ text: "OK" }]
      );
    } finally {
      setLoadingPatients(false);
      console.log("🏁 Finished loading patients");
    }
  };

  const filterPatients = useCallback(() => {
    let filtered = patients;

    // Filter by search query (name or email)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (patient) =>
          patient.first_name.toLowerCase().includes(query) ||
          patient.last_name.toLowerCase().includes(query) ||
          patient.email.toLowerCase().includes(query)
      );
    }

    // Filter by gender
    if (genderFilter !== "all" && genderFilter) {
      filtered = filtered.filter(
        (patient) =>
          patient.gender?.toLowerCase() === genderFilter.toLowerCase()
      );
    }

    setFilteredPatients(filtered);
  }, [patients, searchQuery, genderFilter]);

  // Filter patients when search query or gender filter changes
  useEffect(() => {
    filterPatients();
  }, [filterPatients]);

  const exportToCSV = () => {
    // Allow all users except patients to export CSV
    if (user?.role === "patient") {
      Alert.alert("Access Denied", "Patients cannot export patient data.");
      return;
    }

    // Create CSV content
    const headers = [
      "ID",
      "First Name",
      "Last Name",
      "Email",
      "Phone",
      "Date of Birth",
      "Gender",
      "Address",
    ];

    const csvContent = [
      headers.join(","),
      ...filteredPatients.map((patient) =>
        [
          patient.id,
          patient.first_name,
          patient.last_name,
          patient.email,
          patient.phone_number || "",
          patient.date_of_birth || "",
          patient.gender || "",
          patient.address || "",
        ].join(",")
      ),
    ].join("\n");

    // In a real app, you'd use a library like react-native-fs to save the file
    Alert.alert(
      "CSV Export",
      `Generated CSV with ${filteredPatients.length} patients. In a real app, this would download a file.`
    );
    console.log("CSV Content:", csvContent);
  };

  const savePatient = async () => {
    if (!editedPatient) return;

    setSavingPatient(true);
    try {
      const token = await AsyncStorage.getItem("access_token");
      if (!token) {
        Alert.alert("Error", "No access token found. Please log in again.");
        return;
      }

      console.log("🔄 Saving patient data:", editedPatient);

      const response = await fetch(
        `${API_BASE_URL}/api/users/patients/${editedPatient.id}/`,
        {
          method: "PATCH", // Use PATCH for partial updates
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            first_name: editedPatient.first_name,
            last_name: editedPatient.last_name,
            email: editedPatient.email,
            phone_number: editedPatient.phone_number,
            date_of_birth: editedPatient.date_of_birth,
            gender: editedPatient.gender,
            address: editedPatient.address,
            emergency_contact_name: editedPatient.emergency_contact_name,
            emergency_contact_phone: editedPatient.emergency_contact_phone,
            medical_history: editedPatient.medical_history,
          }),
        }
      );

      if (response.ok) {
        const updatedPatient = await response.json();
        console.log("✅ Patient updated successfully:", updatedPatient);

        // Update the patient in the local state
        setPatients((prevPatients) =>
          prevPatients.map((p) =>
            p.id === editedPatient.id ? { ...p, ...updatedPatient } : p
          )
        );

        // Update the selected patient for the modal
        setSelectedPatient({ ...selectedPatient, ...updatedPatient });

        // Reset editing state
        setIsEditingPatient(false);
        setEditedPatient(null);

        Alert.alert("Success", "Patient information updated successfully!");
      } else {
        const errorText = await response.text();
        console.log("❌ Failed to update patient:", errorText);
        Alert.alert(
          "Error",
          "Failed to update patient information. Please try again."
        );
      }
    } catch (error) {
      console.log("💥 Error updating patient:", error);
      Alert.alert(
        "Error",
        "Network error. Please check your connection and try again."
      );
    } finally {
      setSavingPatient(false);
    }
  };

  const deletePatient = async () => {
    if (!selectedPatient) return;

    Alert.alert(
      "Delete Patient",
      `Are you sure you want to delete ${selectedPatient.first_name} ${selectedPatient.last_name}? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeletingPatient(true);
            try {
              const token = await AsyncStorage.getItem("access_token");
              if (!token) {
                Alert.alert(
                  "Error",
                  "No access token found. Please log in again."
                );
                return;
              }

              const response = await fetch(
                `${API_BASE_URL}/api/users/patients/${selectedPatient.id}/`,
                {
                  method: "DELETE",
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                }
              );

              if (response.ok || response.status === 204) {
                console.log("✅ Patient deleted successfully");

                // Remove patient from the list
                setPatients((prevPatients) =>
                  prevPatients.filter((p) => p.id !== selectedPatient.id)
                );

                // Close modal
                setShowPatientModal(false);
                setSelectedPatient(null);
                setIsEditingPatient(false);
                setEditedPatient(null);

                Alert.alert("Success", "Patient deleted successfully!");
              } else {
                const errorText = await response.text();
                console.log("❌ Failed to delete patient:", errorText);
                Alert.alert(
                  "Error",
                  "Failed to delete patient. Please try again."
                );
              }
            } catch (error) {
              console.log("💥 Error deleting patient:", error);
              Alert.alert(
                "Error",
                "Network error. Please check your connection and try again."
              );
            } finally {
              setDeletingPatient(false);
            }
          },
        },
      ]
    );
  };

  const startEditingPatient = () => {
    if (selectedPatient) {
      setEditedPatient({ ...selectedPatient });
      setIsEditingPatient(true);
    }
  };

  const cancelEditingPatient = () => {
    setIsEditingPatient(false);
    setEditedPatient(null);
  };

  const updateEditedPatientField = (field: keyof Patient, value: string) => {
    if (editedPatient) {
      setEditedPatient((prev) => (prev ? { ...prev, [field]: value } : null));
    }
  };

  const closeModal = () => {
    setShowPatientModal(false);
    setSelectedPatient(null);
    setIsEditingPatient(false);
    setEditedPatient(null);
  };

  // Only show to doctors, admins, and system_admins
  if (
    user?.role !== "doctor" &&
    user?.role !== "admin" &&
    user?.role !== "system_admin"
  ) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.accessDenied}>
          <ThemedText type="title">Access Denied</ThemedText>
          <ThemedText style={styles.accessDeniedText}>
            Only doctors and administrators can access the patient list.
          </ThemedText>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace("/(tabs)")}
          >
            <ThemedText style={styles.backButtonText}>Go to Home</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    );
  }

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="title">Loading...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loadingPatients}
            onRefresh={loadPatients}
            title="Pull to refresh patients"
            tintColor="#3498db"
          />
        }
      >
        {/* Header */}
        <ThemedView style={styles.header}>
          <ThemedView style={styles.headerTitleContainer}>
            <ThemedView style={styles.headerTitleWrapper}>
              <ThemedText type="title" style={styles.headerTitle}>
                Patient Management 👥
              </ThemedText>
            </ThemedView>
            {(user?.role as string) !== "patient" && (
              <>
                <TouchableOpacity
                  style={styles.refreshButton}
                  onPress={loadPatients}
                  disabled={loadingPatients}
                >
                  <ThemedText style={styles.refreshButtonText}>
                    {loadingPatients ? "🔄 Loading..." : "🔄 Refresh"}
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.exportButton}
                  onPress={exportToCSV}
                >
                  <ThemedText style={styles.exportButtonText}>
                    Export CSV
                  </ThemedText>
                </TouchableOpacity>
              </>
            )}
          </ThemedView>
        </ThemedView>

        {/* Search and Filter Controls */}
        <ThemedView style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or email..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />

          {/* <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                genderFilter === "all" && styles.filterButtonActive,
              ]}
              onPress={() => setGenderFilter("all")}
            >
              <ThemedText style={styles.filterButtonText}>All</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                genderFilter === "male" && styles.filterButtonActive,
              ]}
              onPress={() => setGenderFilter("male")}
            >
              <ThemedText style={styles.filterButtonText}>Male</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                genderFilter === "female" && styles.filterButtonActive,
              ]}
              onPress={() => setGenderFilter("female")}
            >
              <ThemedText style={styles.filterButtonText}>Female</ThemedText>
            </TouchableOpacity>
          </View>*/}
        </ThemedView>

        {/* Patient Count */}
        <ThemedView style={styles.statsContainer}>
          <ThemedText style={styles.statsText}>
            {loadingPatients
              ? "Loading patients..."
              : `Showing ${filteredPatients.length} of ${patients.length} patients`}
          </ThemedText>
          {!loadingPatients && patients.length === 0 && (
            <TouchableOpacity style={styles.retryButton} onPress={loadPatients}>
              <ThemedText style={styles.retryButtonText}>
                🔄 Retry Loading Patients
              </ThemedText>
            </TouchableOpacity>
          )}
        </ThemedView>

        {/* Patient List */}
        {loadingPatients ? (
          <ThemedView style={styles.loadingContainer}>
            <ThemedText>Loading patients...</ThemedText>
          </ThemedView>
        ) : filteredPatients.length > 0 ? (
          <ThemedView style={styles.patientListContainer}>
            {filteredPatients.map((patient) => (
              <TouchableOpacity
                key={patient.id}
                style={styles.patientItem}
                onPress={() => {
                  setSelectedPatient(patient);
                  setShowPatientModal(true);
                  setIsEditingPatient(false);
                  setEditedPatient(null);
                }}
              >
                <ThemedView style={styles.patientInfo}>
                  <ThemedText style={styles.patientName}>
                    {patient.first_name} {patient.last_name}
                  </ThemedText>
                  <ThemedText style={styles.patientEmail}>
                    {patient.email}
                  </ThemedText>
                  {patient.phone_number && (
                    <ThemedText style={styles.patientPhone}>
                      {patient.phone_number}
                    </ThemedText>
                  )}
                  {patient.date_of_birth && (
                    <ThemedText style={styles.patientAge}>
                      Age:{" "}
                      {moment().diff(moment(patient.date_of_birth), "years")}{" "}
                      years
                    </ThemedText>
                  )}
                </ThemedView>
                <ThemedView style={styles.patientMeta}>
                  {patient.gender && (
                    <ThemedText style={styles.patientGender}>
                      {patient.gender.charAt(0).toUpperCase() +
                        patient.gender.slice(1)}
                    </ThemedText>
                  )}
                  <ThemedText style={styles.patientId}>
                    ID: {patient.id}
                  </ThemedText>
                  <ThemedText style={styles.patientRegistered}>
                    {patient.last_appointment_date
                      ? `Last visit: ${moment(
                          patient.last_appointment_date
                        ).format("MMM YYYY")}`
                      : "No visits yet"}
                  </ThemedText>
                </ThemedView>
              </TouchableOpacity>
            ))}
          </ThemedView>
        ) : (
          <ThemedView style={styles.emptyContainer}>
            <ThemedText style={styles.emptyText}>
              {searchQuery || genderFilter !== "all"
                ? "No patients found matching your search criteria"
                : "No patients found"}
            </ThemedText>
            {patients.length === 0 && (
              <ThemedText style={styles.emptySubtext}>
                This could mean the endpoint is not available or there are no
                patients in the system.
              </ThemedText>
            )}
          </ThemedView>
        )}
      </ScrollView>

      {/* Patient Details Modal */}
      <Modal
        visible={showPatientModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleContainer}>
              <ThemedText type="title" style={styles.modalTitle}>
                {isEditingPatient ? "Edit Patient" : "Patient Details"}
              </ThemedText>
            </View>
            <View style={styles.modalHeaderButtons}>
              {!isEditingPatient ? (
                <>
                  {(user?.role === "admin" ||
                    user?.role === "system_admin" ||
                    user?.role === "registrar") && (
                    <>
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={startEditingPatient}
                        disabled={deletingPatient}
                      >
                        <ThemedText style={styles.editButtonText}>
                          ✏️ Edit
                        </ThemedText>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={deletePatient}
                        disabled={deletingPatient}
                      >
                        <ThemedText style={styles.deleteButtonText}>
                          {deletingPatient ? "Deleting..." : "🗑️ Delete"}
                        </ThemedText>
                      </TouchableOpacity>
                    </>
                  )}
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={closeModal}
                  >
                    <ThemedText style={styles.closeButtonText}>✕</ThemedText>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={savePatient}
                    disabled={savingPatient}
                  >
                    <ThemedText style={styles.saveButtonText}>
                      {savingPatient ? "💾 Saving..." : "💾 Save"}
                    </ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={cancelEditingPatient}
                    disabled={savingPatient}
                  >
                    <ThemedText style={styles.cancelButtonText}>
                      ❌ Cancel
                    </ThemedText>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>

          {selectedPatient && (
            <ScrollView style={styles.modalContent}>
              <ThemedView style={styles.detailSection}>
                <ThemedText type="subtitle">Personal Information</ThemedText>

                {/* First Name */}
                <ThemedView style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>
                    First Name:
                  </ThemedText>
                  {isEditingPatient ? (
                    <TextInput
                      style={styles.editInput}
                      value={editedPatient?.first_name || ""}
                      onChangeText={(value) =>
                        updateEditedPatientField("first_name", value)
                      }
                      placeholder="First Name"
                    />
                  ) : (
                    <ThemedText style={styles.detailValue}>
                      {selectedPatient.first_name}
                    </ThemedText>
                  )}
                </ThemedView>

                {/* Last Name */}
                <ThemedView style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>Last Name:</ThemedText>
                  {isEditingPatient ? (
                    <TextInput
                      style={styles.editInput}
                      value={editedPatient?.last_name || ""}
                      onChangeText={(value) =>
                        updateEditedPatientField("last_name", value)
                      }
                      placeholder="Last Name"
                    />
                  ) : (
                    <ThemedText style={styles.detailValue}>
                      {selectedPatient.last_name}
                    </ThemedText>
                  )}
                </ThemedView>

                {/* Email */}
                <ThemedView style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>Email:</ThemedText>
                  {isEditingPatient ? (
                    <TextInput
                      style={styles.editInput}
                      value={editedPatient?.email || ""}
                      onChangeText={(value) =>
                        updateEditedPatientField("email", value)
                      }
                      placeholder="Email"
                      keyboardType="email-address"
                    />
                  ) : (
                    <ThemedText style={styles.detailValue}>
                      {selectedPatient.email}
                    </ThemedText>
                  )}
                </ThemedView>

                {/* Phone */}
                <ThemedView style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>Phone:</ThemedText>
                  {isEditingPatient ? (
                    <TextInput
                      style={styles.editInput}
                      value={editedPatient?.phone_number || ""}
                      onChangeText={(value) =>
                        updateEditedPatientField("phone_number", value)
                      }
                      placeholder="Phone Number"
                      keyboardType="phone-pad"
                    />
                  ) : (
                    <ThemedText style={styles.detailValue}>
                      {selectedPatient.phone_number || "Not provided"}
                    </ThemedText>
                  )}
                </ThemedView>

                {/* Date of Birth */}
                <ThemedView style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>
                    Date of Birth:
                  </ThemedText>
                  {isEditingPatient ? (
                    <TextInput
                      style={styles.editInput}
                      value={editedPatient?.date_of_birth || ""}
                      onChangeText={(value) =>
                        updateEditedPatientField("date_of_birth", value)
                      }
                      placeholder="YYYY-MM-DD"
                    />
                  ) : (
                    <ThemedText style={styles.detailValue}>
                      {selectedPatient.date_of_birth
                        ? `${moment(selectedPatient.date_of_birth).format(
                            "MMMM D, YYYY"
                          )} (Age: ${moment().diff(
                            moment(selectedPatient.date_of_birth),
                            "years"
                          )})`
                        : "Not provided"}
                    </ThemedText>
                  )}
                </ThemedView>

                {/* Gender */}
                <ThemedView style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>Gender:</ThemedText>
                  {isEditingPatient ? (
                    <TextInput
                      style={styles.editInput}
                      value={editedPatient?.gender || ""}
                      onChangeText={(value) =>
                        updateEditedPatientField("gender", value)
                      }
                      placeholder="Gender"
                    />
                  ) : (
                    <ThemedText style={styles.detailValue}>
                      {selectedPatient.gender
                        ? selectedPatient.gender.charAt(0).toUpperCase() +
                          selectedPatient.gender.slice(1)
                        : "Not provided"}
                    </ThemedText>
                  )}
                </ThemedView>

                {/* Address */}
                <ThemedView style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>Address:</ThemedText>
                  {isEditingPatient ? (
                    <TextInput
                      style={styles.editTextArea}
                      value={editedPatient?.address || ""}
                      onChangeText={(value) =>
                        updateEditedPatientField("address", value)
                      }
                      placeholder="Address"
                      multiline={true}
                      numberOfLines={3}
                    />
                  ) : (
                    <ThemedText style={styles.detailValue}>
                      {selectedPatient.address || "Not provided"}
                    </ThemedText>
                  )}
                </ThemedView>
              </ThemedView>

              {/* Emergency Contact Section */}
              <ThemedView style={styles.detailSection}>
                <ThemedText type="subtitle">Emergency Contact</ThemedText>

                {/* Emergency Contact Name */}
                <ThemedView style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>Name:</ThemedText>
                  {isEditingPatient ? (
                    <TextInput
                      style={styles.editInput}
                      value={editedPatient?.emergency_contact_name || ""}
                      onChangeText={(value) =>
                        updateEditedPatientField(
                          "emergency_contact_name",
                          value
                        )
                      }
                      placeholder="Emergency Contact Name"
                    />
                  ) : (
                    <ThemedText style={styles.detailValue}>
                      {selectedPatient.emergency_contact_name || "Not provided"}
                    </ThemedText>
                  )}
                </ThemedView>

                {/* Emergency Contact Phone */}
                <ThemedView style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>Phone:</ThemedText>
                  {isEditingPatient ? (
                    <TextInput
                      style={styles.editInput}
                      value={editedPatient?.emergency_contact_phone || ""}
                      onChangeText={(value) =>
                        updateEditedPatientField(
                          "emergency_contact_phone",
                          value
                        )
                      }
                      placeholder="Emergency Contact Phone"
                      keyboardType="phone-pad"
                    />
                  ) : (
                    <ThemedText style={styles.detailValue}>
                      {selectedPatient.emergency_contact_phone ||
                        "Not provided"}
                    </ThemedText>
                  )}
                </ThemedView>
              </ThemedView>

              {/* Medical History Section */}
              <ThemedView style={styles.detailSection}>
                <ThemedText type="subtitle">Medical History</ThemedText>
                {isEditingPatient ? (
                  <TextInput
                    style={styles.editTextArea}
                    value={editedPatient?.medical_history || ""}
                    onChangeText={(value) =>
                      updateEditedPatientField("medical_history", value)
                    }
                    placeholder="Medical History and Notes"
                    multiline={true}
                    numberOfLines={6}
                  />
                ) : (
                  <ThemedText style={styles.medicalHistory}>
                    {selectedPatient.medical_history ||
                      "No medical history recorded"}
                  </ThemedText>
                )}
              </ThemedView>

              <ThemedView style={styles.detailSection}>
                <ThemedText type="subtitle">Account Information</ThemedText>
                <ThemedView style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>
                    Patient ID:
                  </ThemedText>
                  <ThemedText style={styles.detailValue}>
                    {selectedPatient.id}
                  </ThemedText>
                </ThemedView>
                <ThemedView style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>User ID:</ThemedText>
                  <ThemedText style={styles.detailValue}>
                    {selectedPatient.user_id}
                  </ThemedText>
                </ThemedView>
                <ThemedView style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>
                    Last Visit:
                  </ThemedText>
                  <ThemedText style={styles.detailValue}>
                    {selectedPatient.last_appointment_date
                      ? moment(selectedPatient.last_appointment_date).format(
                          "MMMM D, YYYY"
                        )
                      : "No visits yet"}
                  </ThemedText>
                </ThemedView>
              </ThemedView>
            </ScrollView>
          )}
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 70,
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 15,
  },
  headerTitleWrapper: {
    flex: 1,
    minWidth: 0, // Allow text to shrink and wrap
  },
  headerTitle: {
    flex: 1,
    flexShrink: 1,
    flexWrap: "wrap",
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "bold",
  },
  exportButton: {
    backgroundColor: "#2ecc71",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 80,
    alignItems: "center",
  },
  exportButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
  },
  refreshButton: {
    backgroundColor: "#3498db",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 80,
    alignItems: "center",
    marginRight: 10,
  },
  refreshButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
  },
  searchContainer: {
    padding: 20,
    backgroundColor: "#fff",
    marginTop: 10,
  },
  searchInput: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    color: "#333",
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  filterContainer: {
    flexDirection: "row",
    gap: 10,
  },
  filterButton: {
    backgroundColor: "#e9ecef",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterButtonActive: {
    backgroundColor: "#3498db",
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
  },
  statsContainer: {
    padding: 15,
    backgroundColor: "#fff",
    marginTop: 10,
  },
  statsText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  retryButton: {
    marginTop: 10,
    backgroundColor: "#3498db",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    alignSelf: "flex-start",
  },
  retryButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 50,
  },
  patientListContainer: {
    padding: 10,
  },
  patientItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 20,
    marginVertical: 5,
    marginHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: "#3498db",
  },
  patientInfo: {
    flex: 1,
    marginRight: 15,
  },
  patientName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#2c3e50",
  },
  patientEmail: {
    fontSize: 14,
    color: "#7f8c8d",
    marginBottom: 2,
  },
  patientPhone: {
    fontSize: 14,
    color: "#7f8c8d",
    marginBottom: 2,
  },
  patientAge: {
    fontSize: 12,
    color: "#95a5a6",
  },
  patientMeta: {
    alignItems: "flex-end",
  },
  patientGender: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#9b59b6",
    marginBottom: 4,
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  patientId: {
    fontSize: 10,
    color: "#bdc3c7",
    marginBottom: 2,
  },
  patientRegistered: {
    fontSize: 10,
    color: "#bdc3c7",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 50,
  },
  emptyText: {
    fontSize: 16,
    color: "#7f8c8d",
    textAlign: "center",
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#95a5a6",
    textAlign: "center",
    fontStyle: "italic",
  },
  accessDenied: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  accessDeniedText: {
    fontSize: 16,
    color: "#7f8c8d",
    textAlign: "center",
    marginVertical: 20,
  },
  backButton: {
    backgroundColor: "#3498db",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#f8f9fa",
    minHeight: 70,
  },
  modalTitleContainer: {
    flex: 1,
    paddingRight: 15,
    justifyContent: "center",
  },
  modalTitle: {
    flexShrink: 1,
    fontSize: 18,
    lineHeight: 24,
  },
  closeButton: {
    padding: 10,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#666",
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  detailSection: {
    marginBottom: 25,
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 8,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 8,
    alignItems: "flex-start",
  },
  detailLabel: {
    fontWeight: "bold",
    width: 120,
    color: "#495057",
  },
  detailValue: {
    flex: 1,
    color: "#333",
  },
  medicalHistory: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginTop: 8,
    color: "#333",
    lineHeight: 20,
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  // Edit modal styles
  modalHeaderButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  editButton: {
    backgroundColor: "#3498db",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  editButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  deleteButton: {
    backgroundColor: "#e74c3c",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  saveButton: {
    backgroundColor: "#27ae60",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  saveButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  cancelButton: {
    backgroundColor: "#95a5a6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  cancelButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  editInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    padding: 8,
    fontSize: 14,
    color: "#333",
    minHeight: 40,
  },
  editTextArea: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    padding: 8,
    fontSize: 14,
    color: "#333",
    minHeight: 80,
    textAlignVertical: "top",
  },
});
