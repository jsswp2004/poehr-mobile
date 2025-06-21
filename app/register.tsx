import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Text, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import { router } from 'expo-router';
import { API_ENDPOINTS } from '../config/api';

const RegisterScreen = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    role: 'patient'
  });
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    // Validation
    if (!formData.username || !formData.email || !formData.password || !formData.first_name || !formData.last_name) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      // Remove confirmPassword from the data sent to backend
      const { confirmPassword, ...registerData } = formData;
        // Replace with your actual backend IP/URL
      const res = await axios.post(API_ENDPOINTS.REGISTER, registerData);
      
      Alert.alert(
        'Success', 
        'Account created successfully! Please login.',
        [{ text: 'OK', onPress: () => router.replace('./login') }]
      );
    } catch (error: any) {
      console.log(error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      Alert.alert('Registration Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      
      <TextInput 
        placeholder="First Name *" 
        style={styles.input} 
        value={formData.first_name}
        onChangeText={(val) => setFormData({ ...formData, first_name: val })}
      />
      
      <TextInput 
        placeholder="Last Name *" 
        style={styles.input} 
        value={formData.last_name}
        onChangeText={(val) => setFormData({ ...formData, last_name: val })}
      />
      
      <TextInput 
        placeholder="Username *" 
        style={styles.input} 
        value={formData.username}
        onChangeText={(val) => setFormData({ ...formData, username: val })}
        autoCapitalize="none"
      />
      
      <TextInput 
        placeholder="Email *" 
        style={styles.input} 
        value={formData.email}
        onChangeText={(val) => setFormData({ ...formData, email: val })}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <Text style={styles.label}>Role</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={formData.role}
          onValueChange={(itemValue: string) => setFormData({ ...formData, role: itemValue })}
          style={styles.picker}
        >
          <Picker.Item label="Patient" value="patient" />
          <Picker.Item label="Doctor" value="doctor" />
          <Picker.Item label="Admin" value="admin" />
        </Picker>
      </View>
      
      <TextInput 
        placeholder="Password *" 
        secureTextEntry 
        style={styles.input} 
        value={formData.password}
        onChangeText={(val) => setFormData({ ...formData, password: val })}
      />
      
      <TextInput 
        placeholder="Confirm Password *" 
        secureTextEntry 
        style={styles.input} 
        value={formData.confirmPassword}
        onChangeText={(val) => setFormData({ ...formData, confirmPassword: val })}
      />
      
      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleRegister}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Creating Account...' : 'Register'}
        </Text>
      </TouchableOpacity>
        <TouchableOpacity onPress={() => router.replace('./login')}>
        <Text style={styles.link}>Already have an account? Login</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { 
    padding: 20, 
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    marginTop: 20,
    color: '#2c3e50'
  },
  input: { 
    borderWidth: 1, 
    marginBottom: 15, 
    padding: 15, 
    borderRadius: 8,
    backgroundColor: 'white',
    borderColor: '#ddd',
    fontSize: 16
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#2c3e50',
    fontWeight: '500'
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: 'white',
    marginBottom: 15
  },
  picker: {
    height: 50
  },
  button: {
    backgroundColor: '#27ae60',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    marginTop: 10
  },
  buttonDisabled: {
    backgroundColor: '#bdc3c7'
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold'
  },
  link: { 
    color: '#3498db', 
    marginTop: 15, 
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 16
  },
});

export default RegisterScreen;
