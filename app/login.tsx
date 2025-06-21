import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Text, Alert, TouchableOpacity } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import { router } from 'expo-router';
import { API_ENDPOINTS } from '../config/api';

const LoginScreen = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!formData.username || !formData.password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {      // Replace with your actual backend IP/URL
      const res = await axios.post(API_ENDPOINTS.LOGIN, formData);
      const { access, refresh } = res.data;

      await AsyncStorage.setItem('access_token', access);
      await AsyncStorage.setItem('refresh_token', refresh);

      const user = jwtDecode(access);
      console.log('Logged in user:', user);
      router.replace('/(tabs)');    } catch (error: any) {
      console.log(error.response?.data || error.message);
      Alert.alert('Login Failed', 'Check your username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PoEHR Mobile</Text>
      <Text style={styles.subtitle}>Welcome back</Text>
      
      <TextInput 
        placeholder="Username" 
        style={styles.input} 
        value={formData.username}
        onChangeText={(val) => setFormData({ ...formData, username: val })}
        autoCapitalize="none"
      />
      
      <TextInput 
        placeholder="Password" 
        secureTextEntry 
        style={styles.input} 
        value={formData.password}
        onChangeText={(val) => setFormData({ ...formData, password: val })}
      />
      
      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Logging in...' : 'Login'}
        </Text>
      </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('./register')}>
        <Text style={styles.link}>Don't have an account? Register</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    padding: 20, 
    flex: 1, 
    justifyContent: 'center',
    backgroundColor: '#f5f5f5'
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#2c3e50'
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#7f8c8d'
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
  button: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15
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
    textAlign: 'center',
    fontSize: 16
  },
});

export default LoginScreen;
