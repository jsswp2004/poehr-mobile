import React, { useState, useEffect } from 'react';
import {
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import moment from 'moment';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { API_BASE_URL } from '@/config/api';

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
}

interface BlockedDate {
  id?: number;
  date: string;
  reason: string;
  doctor_id?: number;
}

interface BlockedDateModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  blockedDate?: BlockedDate;
  selectedDate: string;
  currentUser: User | null;
}

export default function BlockedDateModal({
  visible,
  onClose,
  onSave,
  blockedDate,
  selectedDate,
  currentUser,
}: BlockedDateModalProps) {  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    date: selectedDate,
    reason: '',
    doctor_id: undefined as number | undefined,
  });
  useEffect(() => {
    if (visible) {
      loadDoctors();
      if (blockedDate) {
        // Editing existing blocked date
        setFormData({
          date: moment(blockedDate.date).format('YYYY-MM-DD'),
          reason: blockedDate.reason,
          doctor_id: blockedDate.doctor_id,
        });
      } else {
        // Creating new blocked date
        setFormData({
          date: selectedDate,
          reason: '',
          doctor_id: currentUser?.role === 'doctor' ? currentUser.user_id : undefined,
        });
      }
    }
  }, [visible, blockedDate, selectedDate, currentUser]);  const loadDoctors = async () => {
    console.log('🚀 loadDoctors called, visible:', visible, 'currentUser:', currentUser?.role);
    setLoading(true);
    
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        console.log('❌ No auth token found for loading doctors');
        setDoctors([]);
        return;
      }

      // Load doctors - same logic as AppointmentModal
      console.log('🔍 Loading doctors for blocked date - current user role:', currentUser?.role);
      console.log('🔍 Making request to:', `${API_BASE_URL}/api/users/doctors/`);
      
      const doctorsResponse = await fetch(`${API_BASE_URL}/api/users/doctors/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('🔍 Doctors response status:', doctorsResponse.status);

      if (doctorsResponse.ok) {
        const doctorsData = await doctorsResponse.json();
        console.log('🔍 Doctors data received:', doctorsData);
        console.log('🔍 Number of doctors:', doctorsData?.length || 0);
        setDoctors(doctorsData || []);
      } else {
        const errorText = await doctorsResponse.text();
        console.log('❌ Failed to load doctors:', doctorsResponse.status);
        console.log('❌ Error response:', errorText);
        
        // If backend is unavailable, provide demo data
        if (doctorsResponse.status >= 500 || doctorsResponse.status === 404) {
          console.log('🎭 Backend unavailable, using demo doctors');
          const demoDoctors = [
            { id: 1, username: 'demo_doc1', first_name: 'John', last_name: 'Smith' },
            { id: 2, username: 'demo_doc2', first_name: 'Jane', last_name: 'Doe' },
            { id: 3, username: 'demo_doc3', first_name: 'Mike', last_name: 'Johnson' },
          ];
          setDoctors(demoDoctors);
        } else {
          setDoctors([]);
        }
      }
    } catch (error) {
      console.error('Error loading doctors:', error);
      // Provide demo data on network error
      console.log('🎭 Network error, using demo doctors');
      const demoDoctors = [
        { id: 1, username: 'demo_doc1', first_name: 'John', last_name: 'Smith' },
        { id: 2, username: 'demo_doc2', first_name: 'Jane', last_name: 'Doe' },
        { id: 3, username: 'demo_doc3', first_name: 'Mike', last_name: 'Johnson' },
      ];
      setDoctors(demoDoctors);
    } finally {
      setLoading(false);
    }
  };
  const handleSave = async () => {
    if (!formData.reason.trim()) {
      Alert.alert('Error', 'Please provide a reason for blocking this date');
      return;
    }

    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        Alert.alert('Error', 'Authentication required');
        return;
      }

      const url = blockedDate 
        ? `${API_BASE_URL}/api/blocked-dates/${blockedDate.id}/`
        : `${API_BASE_URL}/api/blocked-dates/`;
      
      const method = blockedDate ? 'PUT' : 'POST';

      console.log('💾 Saving blocked date:', method, url);
      console.log('💾 Data:', formData);

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      console.log('💾 Save response status:', response.status);

      if (response.ok) {
        Alert.alert(
          'Success',
          `Date ${blockedDate ? 'updated' : 'blocked'} successfully!`,
          [{ text: 'OK', onPress: () => { onSave(); onClose(); } }]
        );
      } else {
        const errorText = await response.text();
        console.log('❌ Save error response:', errorText);
        
        if (response.status === 404) {
          Alert.alert(
            'Demo Mode',
            `Blocked date would be ${blockedDate ? 'updated' : 'created'} in demo mode.\n\n${formData.reason} on ${moment(formData.date).format('MMMM D, YYYY')}`,
            [{ text: 'OK', onPress: () => { onSave(); onClose(); } }]
          );
        } else {
          try {
            const errorData = JSON.parse(errorText);
            Alert.alert('Error', errorData.message || 'Failed to save blocked date');
          } catch {
            Alert.alert('Error', 'Failed to save blocked date');
          }
        }
      }
    } catch (error) {
      console.error('Error saving blocked date:', error);
      // Show demo mode success for network errors
      Alert.alert(
        'Demo Mode',
        `Blocked date would be ${blockedDate ? 'updated' : 'created'} in demo mode.\n\n${formData.reason} on ${moment(formData.date).format('MMMM D, YYYY')}`,
        [{ text: 'OK', onPress: () => { onSave(); onClose(); } }]
      );
    } finally {
      setSaving(false);
    }
  };

  const commonReasons = [
    'Personal leave',
    'Medical conference',
    'Vacation',
    'Emergency',
    'Maintenance',
    'Holiday',
    'Other',
  ];

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
            {blockedDate ? 'Edit Blocked Date' : 'Block Date'}
          </ThemedText>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            <ThemedText style={[styles.saveButton, saving && styles.disabledButton]}>
              {saving ? 'Saving...' : 'Save'}
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>

        <ScrollView style={styles.content}>
          {loading ? (
            <ThemedText>Loading...</ThemedText>
          ) : (
            <>              <ThemedView style={styles.section}>
                <ThemedText style={styles.label}>Date</ThemedText>
                <ThemedText style={styles.dateText}>
                  {moment(formData.date).format('MMMM D, YYYY')}
                </ThemedText>
              </ThemedView>

              <ThemedText style={styles.debugText}>
                DEBUG: currentUser?.role = {currentUser?.role || 'null'}, doctors.length = {doctors.length}
              </ThemedText>

              {currentUser?.role !== 'patient' && (
                <ThemedView style={styles.section}>
                  <ThemedText style={styles.label}>Doctor</ThemedText>
                  {doctors.length > 0 ? (
                    <ThemedView style={styles.pickerContainer}>
                      <Picker
                        selectedValue={formData.doctor_id || 0}
                        onValueChange={(value) => {
                          console.log('Doctor picker value:', value, typeof value);
                          if (value !== undefined && value !== null && typeof value === 'number') {
                            setFormData(prev => ({...prev, doctor_id: value === 0 ? undefined : value}));
                          }
                        }}
                        style={styles.picker}
                      >
                        <Picker.Item label="Select Doctor" value={0} />
                        {doctors.map(doctor => {
                          const doctorLabel = doctor.first_name && doctor.last_name 
                            ? `Dr. ${doctor.first_name} ${doctor.last_name}` 
                            : doctor.username ? doctor.username : `Doctor ${doctor.id}`;
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
                        {loading ? 'Loading doctors...' : 'No doctors available. Connect to backend to load data.'}
                      </ThemedText>
                    </ThemedView>
                  )}
                  <ThemedText style={styles.helperText}>
                    Select the doctor to block the date for
                  </ThemedText>
                </ThemedView>
              )}

              <ThemedView style={styles.section}>
                <ThemedText style={styles.label}>Quick Reasons</ThemedText>
                <ThemedView style={styles.reasonButtons}>
                  {commonReasons.map(reason => (
                    <TouchableOpacity
                      key={reason}
                      style={[
                        styles.reasonButton,
                        formData.reason === reason && styles.selectedReasonButton
                      ]}
                      onPress={() => setFormData({...formData, reason})}
                    >
                      <ThemedText style={[
                        styles.reasonButtonText,
                        formData.reason === reason && styles.selectedReasonButtonText
                      ]}>
                        {reason}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </ThemedView>
              </ThemedView>

              <ThemedView style={styles.section}>
                <ThemedText style={styles.label}>Custom Reason</ThemedText>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter reason for blocking this date"
                  value={formData.reason}
                  onChangeText={(text) => setFormData({...formData, reason: text})}
                  multiline
                  numberOfLines={3}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  cancelButton: {
    color: '#e74c3c',
    fontSize: 16,
  },
  saveButton: {
    color: '#3498db',
    fontSize: 16,
    fontWeight: 'bold',
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
    fontWeight: 'bold',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 16,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  pickerContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  helperText: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
  },
  reasonButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reasonButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedReasonButton: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  reasonButtonText: {
    fontSize: 14,
  },
  selectedReasonButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    minHeight: 80,
  },
  debugText: {
    fontSize: 12,
    color: '#ff6b6b',
    marginBottom: 8,
    fontFamily: 'monospace',
  },
});
