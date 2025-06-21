import React, { useEffect, useState } from 'react';
import { StyleSheet, Alert, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import moment from 'moment';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { API_BASE_URL } from '@/config/api';

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
  patient_name: string;
  doctor_name: string;
  appointment_date: string;
  appointment_time: string;
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

  const loadUserData = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (token) {
        const decodedToken: any = jwtDecode(token);
        setUser({
          username: decodedToken.username,
          firstName: decodedToken.first_name,
          lastName: decodedToken.last_name,
          role: decodedToken.role,
          email: decodedToken.email,
          user_id: decodedToken.user_id
        });
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTodayAppointments = async () => {
    setLoadingAppointments(true);
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) return;

      const today = moment().format('YYYY-MM-DD');
      const response = await fetch(`${API_BASE_URL}/api/appointments/?date=${today}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTodayAppointments(data);
      } else {
        console.log('Failed to load appointments:', response.status);
      }
    } catch (error) {
      console.log('Error loading appointments:', error);
    } finally {
      setLoadingAppointments(false);
    }
  };

  const logout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          onPress: async () => {
            await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
            router.replace('./login');
          }, 
          style: 'destructive' 
        }
      ]
    );
  };

  const clearAuthForTesting = async () => {
    Alert.alert(
      'Clear Authentication',
      'This will log you out so you can test registration. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Auth',
          onPress: async () => {
            await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
            router.replace('./login');
          },
          style: 'destructive'
        }
      ]
    );
  };

  if (loading) {
    return (
      <ParallaxScrollView
        headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
        headerImage={
          <Image
            source={require('@/assets/images/partial-react-logo.png')}
            style={styles.reactLogo}
          />
        }>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">Loading...</ThemedText>
        </ThemedView>
      </ParallaxScrollView>
    );
  }

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
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
        <ThemedText type="subtitle">📅 Today's Appointments</ThemedText>
        {loadingAppointments ? (
          <ThemedText>Loading appointments...</ThemedText>
        ) : todayAppointments.length > 0 ? (
          <>
            <ThemedText>You have {todayAppointments.length} appointment(s) today:</ThemedText>
            {todayAppointments.slice(0, 3).map(appointment => (
              <ThemedView key={appointment.id} style={styles.appointmentItem}>
                <ThemedText style={styles.appointmentTime}>
                  {moment(appointment.appointment_time, 'HH:mm:ss').format('h:mm A')}
                </ThemedText>
                <ThemedText>
                  {user?.role === 'patient' ? 
                    `Dr. ${appointment.doctor_name}` : 
                    appointment.patient_name
                  }
                </ThemedText>
                <ThemedText style={styles.appointmentStatus}>
                  {appointment.status.toUpperCase()}
                </ThemedText>
              </ThemedView>
            ))}
            {todayAppointments.length > 3 && (
              <TouchableOpacity 
                style={styles.viewAllButton}
                onPress={() => router.push('/(tabs)/appointments')}
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
          onPress={() => router.push('/(tabs)/appointments')}
        >
          <ThemedText>📅 Appointments</ThemedText>
        </TouchableOpacity>
        
        {user?.role === 'patient' && (
          <TouchableOpacity style={styles.menuItem}>
            <ThemedText>👤 My Profile (Coming Soon)</ThemedText>
          </TouchableOpacity>
        )}

        {(user?.role === 'doctor' || user?.role === 'admin') && (
          <>
            <TouchableOpacity style={styles.menuItem}>
              <ThemedText>� Patients (Coming Soon)</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
              <ThemedText>� Reports (Coming Soon)</ThemedText>
            </TouchableOpacity>
          </>
        )}

        {user?.role === 'admin' && (
          <TouchableOpacity style={styles.menuItem}>
            <ThemedText>⚙️ Settings (Coming Soon)</ThemedText>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.menuItem} onPress={clearAuthForTesting}>
          <ThemedText>🧪 Test Registration (Clear Auth)</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">✅ Phase 2 Progress</ThemedText>
        <ThemedText>
          Appointments Module features implemented:
        </ThemedText>
        <ThemedText>• ✅ Calendar view with react-native-calendars</ThemedText>
        <ThemedText>• ✅ Appointment CRUD operations (Create, Edit, Delete)</ThemedText>
        <ThemedText>• ✅ Blocked dates management</ThemedText>
        <ThemedText>• ✅ Role-based permissions</ThemedText>
        <ThemedText>• ✅ Today's appointments overview</ThemedText>
        <ThemedText>• 🔄 API integration (connects when backend is running)</ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  userInfo: {
    padding: 20,
    marginBottom: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  stepContainer: {
    gap: 8,
    marginBottom: 16,
  },
  menuItem: {
    padding: 15,
    marginVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  appointmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    marginVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(46, 204, 113, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#2ecc71',
  },
  appointmentTime: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  appointmentStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#3498db',
  },
  viewAllButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    marginTop: 10,
    alignSelf: 'center',
  },
  viewAllButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
