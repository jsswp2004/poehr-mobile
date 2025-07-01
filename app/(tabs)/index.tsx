import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { router } from "expo-router";
import { jwtDecode } from "jwt-decode";
import moment from "moment";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, TouchableOpacity } from "react-native";

import ParallaxScrollView from "@/components/ParallaxScrollView";
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
  organization?: string; // Add organization field
}

interface Appointment {
  id: number;
  patient_name: string;
  doctor_name: string;
  appointment_date?: string; // Keep for backward compatibility
  appointment_time?: string; // Keep for backward compatibility
  appointment_datetime?: string; // New field from backend
  duration: number;
  status: string;
}

export default function HomeScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (user) {
      loadTodayAppointments();
    }
  }, [user]);

  // Function to get the appropriate logo image based on user organization
  const getOrganizationLogo = () => {
    if (!user?.organization) {
      return require("@/assets/images/power-logo.png");
    }

    const org = user.organization.toLowerCase();

    // Map organizations to their respective logos
    if (org.includes("hospital") || org.includes("medical center")) {
      return require("@/assets/images/icon.png");
    } else if (org.includes("clinic") || org.includes("health")) {
      return require("@/assets/images/adaptive-icon.png");
    } else {
      // Default to POWER IT logo
      return require("@/assets/images/power-logo.png");
    }
  };

  const loadUserData = async () => {
    try {
      const token = await AsyncStorage.getItem("access_token");
      if (token) {
        const decodedToken: any = jwtDecode(token);
        setUser({
          username: decodedToken.username,
          firstName: decodedToken.first_name,
          lastName: decodedToken.last_name,
          role: decodedToken.role,
          email: decodedToken.email,
          user_id: decodedToken.user_id,
          organization: decodedToken.organization || "POWER IT", // Default to POWER IT
        });
      }
    } catch (error) {
      console.error("Failed to load user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadTodayAppointments = async () => {
    setLoadingAppointments(true);
    try {
      const token = await AsyncStorage.getItem("access_token");
      if (!token) return;

      const today = moment().format("YYYY-MM-DD");
      const response = await fetch(
        `${API_BASE_URL}/api/appointments/?date=${today}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("📅 Today's appointments data:", data);
        console.log("📅 First appointment sample:", data[0]);
        if (data[0]) {
          console.log("📅 appointment_time value:", data[0].appointment_time);
          console.log(
            "📅 appointment_datetime value:",
            data[0].appointment_datetime
          );
          console.log(
            "📅 appointment_time type:",
            typeof data[0].appointment_time
          );
          console.log(
            "📅 appointment_datetime type:",
            typeof data[0].appointment_datetime
          );
        }
        setTodayAppointments(data);
      } else {
        console.log("Failed to load appointments:", response.status);
      }
    } catch (error) {
      console.log("Error loading appointments:", error);
    } finally {
      setLoadingAppointments(false);
    }
  };

  const logout = async () => {
    console.log("🚪 Logout button pressed");
    // Use Alert.alert for mobile compatibility instead of window.confirm
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          console.log("🚪 Logging out user...");
          try {
            await AsyncStorage.multiRemove(["access_token", "refresh_token"]);
            console.log("🚪 Tokens cleared, navigating to login...");
            // Use router.replace instead of window.location.href for mobile compatibility
            router.replace("/login");
          } catch (error) {
            console.error("🚪 Error during logout:", error);
          }
        },
      },
    ]);
  };
  const clearAuthForTesting = async () => {
    Alert.alert(
      "Clear Authentication",
      "This will log you out so you can test registration. Continue?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Continue",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove(["access_token", "refresh_token"]);
              router.replace("/login");
            } catch (error) {
              console.error("🚪 Error during auth clear:", error);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <ParallaxScrollView
        headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
        headerImage={
          <Image
            source={require("@/assets/images/power-logo.png")}
            style={styles.organizationLogo}
          />
        }
      >
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">Loading...</ThemedText>
        </ThemedView>
      </ParallaxScrollView>
    );
  }

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={
        <Image source={getOrganizationLogo()} style={styles.organizationLogo} />
      }
    >
      <ThemedView style={styles.header}>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">POWER Scheduler</ThemedText>
        </ThemedView>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <ThemedText style={styles.logoutButtonText}>Logout</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <ThemedView style={styles.userInfo}>
        <ThemedText type="subtitle">
          Welcome, {user?.firstName || user?.username}! 👋
        </ThemedText>
        <ThemedText>Role: {user?.role}</ThemedText>
        <ThemedText>
          Organization: {user?.organization || "POWER IT"}
        </ThemedText>
        {/*<ThemedText>Email: {user?.email}</ThemedText>*/}
      </ThemedView>

      {/*<ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">🎉 Phase 1 Complete!</ThemedText>
        <ThemedText>
          Authentication system is working! You have successfully:
        </ThemedText>
        <ThemedText>• ✅ Logged in with JWT tokens</ThemedText>
        <ThemedText>• ✅ Stored tokens in AsyncStorage</ThemedText>
        <ThemedText>• ✅ Role-based authentication</ThemedText>
        <ThemedText>• ✅ Protected routes</ThemedText>
      </ThemedView>*/}

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">📅 Today&apos;s Appointments</ThemedText>
        {loadingAppointments ? (
          <ThemedText>Loading appointments...</ThemedText>
        ) : todayAppointments.length > 0 ? (
          <>
            <ThemedText>
              You have {todayAppointments.length} appointment(s) today:
            </ThemedText>
            {todayAppointments.slice(0, 3).map((appointment) => {
              // Handle both old format (appointment_time) and new format (appointment_datetime)
              let displayTime = "Time not set";

              if (appointment.appointment_datetime) {
                // New format: parse appointment_datetime
                try {
                  const datetime = moment(appointment.appointment_datetime);
                  if (datetime.isValid()) {
                    displayTime = datetime.format("h:mm A");
                  }
                } catch (error) {
                  console.log("Error parsing appointment_datetime:", error);
                }
              } else if (appointment.appointment_time) {
                // Old format: parse appointment_time
                try {
                  const time = moment(appointment.appointment_time, [
                    "HH:mm:ss",
                    "HH:mm",
                    "YYYY-MM-DDTHH:mm:ss",
                    "YYYY-MM-DD HH:mm:ss",
                  ]);
                  if (time.isValid()) {
                    displayTime = time.format("h:mm A");
                  }
                } catch (error) {
                  console.log("Error parsing appointment_time:", error);
                }
              }

              return (
                <ThemedView key={appointment.id} style={styles.appointmentItem}>
                  <ThemedText style={styles.appointmentTime}>
                    {displayTime}
                  </ThemedText>
                  <ThemedText>
                    {user?.role === "patient"
                      ? `Dr. ${appointment.doctor_name}`
                      : appointment.patient_name}
                  </ThemedText>
                  <ThemedText style={styles.appointmentStatus}>
                    {appointment.status.toUpperCase()}
                  </ThemedText>
                </ThemedView>
              );
            })}
            {todayAppointments.length > 3 && (
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => router.push("/(tabs)/appointments")}
              >
                <ThemedText style={styles.viewAllButtonText}>
                  View all {todayAppointments.length} appointments
                </ThemedText>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <ThemedText>No appointments scheduled for today</ThemedText>
        )}
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Quick Actions</ThemedText>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push("/(tabs)/appointments")}
        >
          <ThemedText>📅 Appointments</ThemedText>
        </TouchableOpacity>

        {(user?.role === "doctor" ||
          user?.role === "admin" ||
          user?.role === "system_admin") && (
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push("/(tabs)/availability")}
          >
            <ThemedText>🗓️ Availability</ThemedText>
          </TouchableOpacity>
        )}

        {user?.role === "patient" && (
          <TouchableOpacity style={styles.menuItem}>
            <ThemedText>👤 My Profile (Coming Soon)</ThemedText>
          </TouchableOpacity>
        )}

        {(user?.role === "doctor" ||
          user?.role === "admin" ||
          user?.role === "system_admin") && (
          <>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push("/(tabs)/patients")}
            >
              <ThemedText>👥 Patients</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push("/register-patient")}
            >
              <ThemedText>➕ Register New Patient</ThemedText>
            </TouchableOpacity>
          </>
        )}

        {/*<TouchableOpacity style={styles.menuItem} onPress={clearAuthForTesting}>
          <ThemedText>🧪 Test Registration (Clear Auth)</ThemedText>
        </TouchableOpacity>
                    <TouchableOpacity style={styles.menuItem}>
              <ThemedText>📊 Reports (Coming Soon)</ThemedText>
            </TouchableOpacity>*/}
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoutButton: {
    backgroundColor: "#e74c3c",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  logoutButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  userInfo: {
    padding: 20,
    marginBottom: 20,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  stepContainer: {
    gap: 8,
    marginBottom: 16,
  },
  menuItem: {
    padding: 15,
    marginVertical: 5,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  appointmentItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    marginVertical: 3,
    borderRadius: 6,
    backgroundColor: "rgba(46, 204, 113, 0.1)",
    borderLeftWidth: 3,
    borderLeftColor: "#2ecc71",
  },
  appointmentTime: {
    fontWeight: "bold",
    fontSize: 14,
  },
  appointmentStatus: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#3498db",
  },
  viewAllButton: {
    backgroundColor: "#3498db",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    marginTop: 10,
    alignSelf: "center",
  },
  viewAllButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  organizationLogo: {
    width: "100%",
    height: "80%",
    position: "absolute",
    top: 0,
    left: 0,
    marginTop: 25,
    marginBottom: 25, // Adjust based on your header height
    resizeMode: "center",
    borderRadius: 10, // Optional: add some border radius for aesthetics
  },
  // Patient List Styles
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  exportButton: {
    backgroundColor: "#2ecc71",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  exportButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  searchContainer: {
    marginBottom: 15,
  },
  searchInput: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    fontSize: 16,
    color: "#333",
  },
  filterContainer: {
    flexDirection: "row",
    gap: 10,
  },
  filterButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
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
  },
  patientList: {
    maxHeight: 300,
  },
  patientItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    marginVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderLeftWidth: 3,
    borderLeftColor: "#3498db",
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 2,
  },
  patientEmail: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 2,
  },
  patientPhone: {
    fontSize: 12,
    opacity: 0.7,
  },
  patientMeta: {
    alignItems: "flex-end",
  },
  patientGender: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#9b59b6",
    marginBottom: 2,
  },
  patientId: {
    fontSize: 10,
    opacity: 0.6,
  },
  morePatients: {
    textAlign: "center",
    fontStyle: "italic",
    opacity: 0.7,
    marginTop: 10,
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
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 8,
    alignItems: "flex-start",
  },
  detailLabel: {
    fontWeight: "bold",
    width: 120,
    color: "#666",
  },
  detailValue: {
    flex: 1,
    color: "#333",
  },
  medicalHistory: {
    backgroundColor: "#f5f5f5",
    padding: 15,
    borderRadius: 8,
    marginTop: 8,
    color: "#333",
    lineHeight: 20,
  },
});
