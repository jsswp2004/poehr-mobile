import React, { useEffect, useState } from 'react';
import { StyleSheet, Alert, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import { Calendar, DateData } from 'react-native-calendars';
import moment from 'moment';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import AppointmentModal from '@/components/AppointmentModal';
import BlockedDateModal from '@/components/BlockedDateModal';
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
  notes?: string;
  patient_id: number;
  doctor_id: number;
}

interface BlockedDate {
  id: number;
  date: string;
  reason: string;
  doctor_id?: number;
}

export default function AppointmentsScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(moment().format('YYYY-MM-DD'));
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | undefined>();
  const [blockedDateModalVisible, setBlockedDateModalVisible] = useState(false);
  const [editingBlockedDate, setEditingBlockedDate] = useState<BlockedDate | undefined>();

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (user) {
      loadAppointments();
      loadBlockedDates();
    }
  }, [user, selectedDate]);

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

  const loadAppointments = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/api/appointments/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
      } else {
        console.error('Failed to load appointments:', response.status);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  };
  const loadBlockedDates = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        console.log('❌ No auth token found for loading blocked dates');
        setBlockedDates([]);
        return;
      }

      console.log('🔍 Loading blocked dates from:', `${API_BASE_URL}/api/blocked-dates/`);

      const response = await fetch(`${API_BASE_URL}/api/blocked-dates/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('🔍 Blocked dates response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Blocked dates loaded:', data?.length || 0, 'items');
        setBlockedDates(data);
      } else {
        console.error('Failed to load blocked dates:', response.status);
          // If backend is unavailable, provide demo data
        if (response.status >= 500 || response.status === 404) {
          console.log('🎭 Backend unavailable, using demo blocked dates');
          const demoBlockedDates = [
            {
              id: 1,
              date: moment().add(2, 'days').format('YYYY-MM-DD'),
              reason: 'Medical conference',
              doctor_id: 1,
            },
            {
              id: 2,
              date: moment().add(7, 'days').format('YYYY-MM-DD'),
              reason: 'Personal leave',
              doctor_id: undefined, // General block
            },
          ];
          setBlockedDates(demoBlockedDates);
        } else {
          setBlockedDates([]);
        }
      }
    } catch (error) {
      console.error('Error loading blocked dates:', error);      // Provide demo data on network error
      console.log('🎭 Network error, using demo blocked dates');
      const demoBlockedDates = [
        {
          id: 1,
          date: moment().add(2, 'days').format('YYYY-MM-DD'),
          reason: 'Medical conference',
          doctor_id: 1,
        },
        {
          id: 2,
          date: moment().add(7, 'days').format('YYYY-MM-DD'),
          reason: 'Personal leave',
          doctor_id: undefined, // General block
        },
      ];
      setBlockedDates(demoBlockedDates);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadAppointments();
    await loadBlockedDates();
    setRefreshing(false);
  };
  const getMarkedDates = () => {
    const marked: any = {};
    
    // Mark selected date
    if (selectedDate) {
      marked[selectedDate] = {
        selected: true,
        selectedColor: '#3498db',
      };
    }

    // Mark appointment dates
    (appointments || []).forEach(appointment => {
      if (appointment && appointment.appointment_date) {
        const date = moment(appointment.appointment_date).format('YYYY-MM-DD');
        if (marked[date]) {
          marked[date] = {
            ...marked[date],
            marked: true,
            dotColor: '#2ecc71',
          };
        } else {
          marked[date] = {
            marked: true,
            dotColor: '#2ecc71',
          };
        }
      }
    });

    // Mark blocked dates
    (blockedDates || []).forEach(blocked => {
      if (blocked && blocked.date) {
        const date = moment(blocked.date).format('YYYY-MM-DD');
        if (marked[date]) {
          marked[date] = {
            ...marked[date],
            marked: true,
            dotColor: '#e74c3c',
          };
        } else {
          marked[date] = {
            marked: true,
            dotColor: '#e74c3c',
          };
        }
      }
    });

    return marked;
  };
  const getAppointmentsForDate = (date: string) => {
    if (!date || !appointments) return [];
    return appointments.filter(appointment => 
      appointment && appointment.appointment_date &&
      moment(appointment.appointment_date).format('YYYY-MM-DD') === date
    );
  };

  const getBlockedDatesForDate = (date: string) => {
    if (!date || !blockedDates) return [];
    return blockedDates.filter(blocked => 
      blocked && blocked.date &&
      moment(blocked.date).format('YYYY-MM-DD') === date
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
      'Delete Appointment',
      `Are you sure you want to delete the appointment with ${appointment.patient_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('access_token');
              if (!token) return;

              const response = await fetch(`${API_BASE_URL}/api/appointments/${appointment.id}/`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              });

              if (response.ok) {
                Alert.alert('Success', 'Appointment deleted successfully');
                await loadAppointments(); // Refresh the list
              } else {
                Alert.alert('Error', 'Failed to delete appointment');
              }
            } catch (error) {
              console.error('Error deleting appointment:', error);
              Alert.alert('Error', 'Failed to delete appointment');
            }
          }
        }      ]
    );
  };

  const handleModalSave = async () => {
    await loadAppointments(); // Refresh appointments after saving
  };

  const handleBlockDate = () => {
    setEditingBlockedDate(undefined);
    setBlockedDateModalVisible(true);
  };

  const handleEditBlockedDate = (blockedDate: BlockedDate) => {
    setEditingBlockedDate(blockedDate);
    setBlockedDateModalVisible(true);
  };

  const handleDeleteBlockedDate = async (blockedDate: BlockedDate) => {
    Alert.alert(
      'Remove Block',
      'Are you sure you want to remove this blocked date?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('access_token');
              if (!token) return;

              const response = await fetch(`${API_BASE_URL}/api/blocked-dates/${blockedDate.id}/`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              });

              if (response.ok) {
                Alert.alert('Success', 'Blocked date removed successfully');
                await loadBlockedDates(); // Refresh the list
              } else {
                Alert.alert('Error', 'Failed to remove blocked date');
              }
            } catch (error) {
              console.error('Error deleting blocked date:', error);
              Alert.alert('Error', 'Failed to remove blocked date');
            }
          }        }
      ]
    );
  };

  const handleBlockedDateSave = async () => {
    await loadBlockedDates(); // Refresh blocked dates after saving
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color="#3498db" />
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
        <ThemedText type="title">📅 Appointments</ThemedText>
        <TouchableOpacity style={styles.refreshButton} onPress={refreshData}>
          <ThemedText style={styles.refreshButtonText}>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {/* Info banner for when no patients are available */}
      <ThemedView style={styles.infoBanner}>
        <ThemedText style={styles.infoBannerTitle}>🏥 Getting Started</ThemedText>
        <ThemedText style={styles.infoBannerText}>
          To create appointments, you need patients and doctors in the system.
        </ThemedText>
        <ThemedText style={styles.infoBannerText}>
          • Backend is running at {API_BASE_URL}
        </ThemedText>
        <ThemedText style={styles.infoBannerText}>
          • Visit Django Admin to add test users: {API_BASE_URL}/admin/
        </ThemedText>
        <ThemedText style={styles.infoBannerText}>
          • Create users with roles: 'patient', 'doctor', 'admin'
        </ThemedText>
        <TouchableOpacity 
          style={styles.adminButton}
          onPress={() => {
            Alert.alert(
              'Django Admin',
              `Open Django Admin at:\n${API_BASE_URL}/admin/\n\nCreate test users with different roles (patient, doctor, admin) to populate the appointment system.`,
              [
                { text: 'OK', style: 'default' }
              ]
            );
          }}
        >
          <ThemedText style={styles.adminButtonText}>📝 Django Admin Guide</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <ThemedView style={styles.calendarContainer}>
        <Calendar
          onDayPress={onDayPress}
          markedDates={getMarkedDates()}
          theme={{
            backgroundColor: 'transparent',
            calendarBackground: 'transparent',
            textSectionTitleColor: '#b6c1cd',
            selectedDayBackgroundColor: '#3498db',
            selectedDayTextColor: '#ffffff',
            todayTextColor: '#3498db',
            dayTextColor: '#2d4150',
            textDisabledColor: '#d9e1e8',
            dotColor: '#00adf5',
            selectedDotColor: '#ffffff',
            arrowColor: '#3498db',
            disabledArrowColor: '#d9e1e8',
            monthTextColor: '#2d4150',
            indicatorColor: '#3498db',
            textDayFontWeight: '300',
            textMonthFontWeight: 'bold',
            textDayHeaderFontWeight: '300',
            textDayFontSize: 16,
            textMonthFontSize: 16,
            textDayHeaderFontSize: 13
          }}
        />
      </ThemedView>      <ThemedView style={styles.legendContainer}>
        <ThemedText type="subtitle">Legend</ThemedText>
        <ThemedView style={styles.legendItem}>
          <ThemedView style={[styles.legendDot, { backgroundColor: '#2ecc71' }]} />
          <ThemedText>Appointments</ThemedText>
        </ThemedView>
        <ThemedView style={styles.legendItem}>
          <ThemedView style={[styles.legendDot, { backgroundColor: '#e74c3c' }]} />
          <ThemedText>Blocked Dates</ThemedText>
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.selectedDateContainer}>
        <ThemedText type="subtitle">
          {moment(selectedDate).format('MMMM D, YYYY')}
        </ThemedText>

        {dayBlockedDates.length > 0 && (
          <ThemedView style={styles.blockedSection}>
            <ThemedText style={styles.sectionTitle}>🚫 Blocked</ThemedText>
            {dayBlockedDates.map(blocked => (
              <ThemedView key={blocked.id} style={styles.blockedItem}>
                <ThemedView style={styles.blockedItemHeader}>
                  <ThemedText style={styles.blockedReason}>{blocked.reason}</ThemedText>
                  {(user?.role === 'doctor' || user?.role === 'admin') && (
                    <ThemedView style={styles.blockedActions}>
                      <TouchableOpacity 
                        style={styles.editBlockedButton}
                        onPress={() => handleEditBlockedDate(blocked)}
                      >
                        <ThemedText style={styles.editBlockedButtonText}>Edit</ThemedText>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.deleteBlockedButton}
                        onPress={() => handleDeleteBlockedDate(blocked)}
                      >
                        <ThemedText style={styles.deleteBlockedButtonText}>Remove</ThemedText>
                      </TouchableOpacity>                    </ThemedView>
                  )}
                </ThemedView>
              </ThemedView>
            ))}
          </ThemedView>
        )}

        {dayAppointments.length > 0 ? (
          <ThemedView style={styles.appointmentsSection}>
            <ThemedText style={styles.sectionTitle}>📅 Appointments ({dayAppointments.length})</ThemedText>
            {dayAppointments.map(appointment => (
              <ThemedView key={appointment.id} style={styles.appointmentItem}>
                <ThemedView style={styles.appointmentHeader}>
                  <ThemedText style={styles.appointmentTime}>
                    {appointment.appointment_time ? 
                      moment(appointment.appointment_time, 'HH:mm:ss').format('h:mm A') : 
                      'Time not set'
                    }
                  </ThemedText>
                  <ThemedText style={[styles.status, 
                    appointment.status === 'confirmed' && styles.statusConfirmed,
                    appointment.status === 'pending' && styles.statusPending,
                    appointment.status === 'cancelled' && styles.statusCancelled
                  ]}>
                    {(appointment.status || 'PENDING').toUpperCase()}
                  </ThemedText>
                </ThemedView>
                
                <ThemedText style={styles.appointmentName}>
                  {user?.role === 'patient' ? 
                    `Dr. ${appointment.doctor_name || 'Unknown'}` : 
                    appointment.patient_name || 'Unknown Patient'
                  }
                </ThemedText>
                
                <ThemedText style={styles.appointmentDuration}>
                  Duration: {appointment.duration || 30} minutes
                </ThemedText>
                
                {appointment.notes && (
                  <ThemedText style={styles.appointmentNotes}>
                    Notes: {appointment.notes}
                  </ThemedText>
                )}

                {(user?.role === 'doctor' || user?.role === 'admin') && (
                  <ThemedView style={styles.appointmentActions}>
                    <TouchableOpacity 
                      style={styles.editButton}
                      onPress={() => handleEditAppointment(appointment)}
                    >
                      <ThemedText style={styles.editButtonText}>Edit</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={() => handleDeleteAppointment(appointment)}
                    >
                      <ThemedText style={styles.deleteButtonText}>Delete</ThemedText>                    </TouchableOpacity>
                  </ThemedView>
                )}
              </ThemedView>
            ))}
          </ThemedView>        ) : (
          <ThemedView style={styles.noAppointments}>
            <ThemedText>No appointments scheduled for this date.</ThemedText>
            <ThemedText style={styles.debugText}>Current user role: {user?.role || 'No role'}</ThemedText>
            {user?.role !== 'patient' && (
              <ThemedView style={styles.actionButtons}>
                <TouchableOpacity style={styles.createButton} onPress={handleCreateAppointment}>
                  <ThemedText style={styles.createButtonText}>+ Create Appointment</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.blockButton} onPress={handleBlockDate}>
                  <ThemedText style={styles.blockButtonText}>🚫 Block Date</ThemedText>
                </TouchableOpacity>
              </ThemedView>
            )}
            {user?.role === 'patient' && (
              <ThemedText style={styles.debugText}>Patient role - buttons hidden</ThemedText>
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
        blockedDate={editingBlockedDate}
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
    flexDirection: 'row',    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  refreshButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  infoBanner: {
    marginBottom: 20,
    padding: 15,
    borderRadius: 10,
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },  infoBannerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#3498db',
  },
  infoBannerText: {
    fontSize: 14,
    marginBottom: 4,
    opacity: 0.8,
  },
  adminButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  adminButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  calendarContainer: {
    marginBottom: 20,
    borderRadius: 10,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  legendContainer: {
    marginBottom: 20,
    padding: 15,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },  selectedDateContainer: {
    marginBottom: 20,
  },
  blockedSection: {
    marginTop: 15,
  },
  blockedItem: {
    padding: 10,
    marginTop: 5,
    borderRadius: 5,
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: '#e74c3c',
  },
  blockedItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  blockedReason: {
    flex: 1,
    fontSize: 14,
  },
  blockedActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editBlockedButton: {
    backgroundColor: '#f39c12',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  editBlockedButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  deleteBlockedButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  deleteBlockedButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  appointmentsSection: {
    marginTop: 15,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
  },
  appointmentItem: {
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: '#2ecc71',
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  appointmentTime: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  status: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusConfirmed: {
    backgroundColor: '#2ecc71',
    color: 'white',
  },
  statusPending: {
    backgroundColor: '#f39c12',
    color: 'white',
  },
  statusCancelled: {
    backgroundColor: '#e74c3c',
    color: 'white',
  },
  appointmentName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  appointmentDuration: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 5,
  },
  appointmentNotes: {
    fontSize: 14,
    fontStyle: 'italic',
    opacity: 0.8,
    marginTop: 5,
  },
  appointmentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    gap: 10,
  },
  editButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  editButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },  deleteButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  noAppointments: {
    padding: 20,
    textAlign: 'center',
    marginTop: 15,
  },  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 20,
    paddingVertical: 10,
  },  createButton: {
    backgroundColor: '#2ecc71',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 8,
    flex: 1,
    minHeight: 50,
  },  createButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },  blockButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 8,
    flex: 1,
    minHeight: 50,
  },  blockButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
  debugText: {
    color: '#666',
    fontSize: 12,
    marginTop: 10,
    textAlign: 'center',
  },
});
