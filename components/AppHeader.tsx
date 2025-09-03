import { IconSymbol } from '@/components/ui/IconSymbol';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React from 'react';
import {
    Alert,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface AppHeaderProps {
  showBackButton?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ showBackButton = false }) => {
  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('access_token');
              await AsyncStorage.removeItem('refresh_token');
              router.replace('/login');
            } catch (error) {
              console.error('Error during logout:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.header}>
      <View style={styles.leftSection}>
        {showBackButton ? (
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color="#2c3e50" />
          </TouchableOpacity>
        ) : (
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/power-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        )}
      </View>

      <View style={styles.centerSection}>
        <Text style={styles.appTitle}>POWER Scheduler</Text>
      </View>

      <View style={styles.rightSection}>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <IconSymbol name="rectangle.portrait.and.arrow.right" size={24} color="#e74c3c" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end', // Changed from 'center' to 'flex-end' to align items at bottom
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 24, // Doubled from 12 to 24
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  leftSection: {
    flex: 1,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 2,
    alignItems: 'center',
  },
  rightSection: {
    flex: 1,
    alignItems: 'flex-end',
  },
  logoContainer: {
    width: 60, // Increased from 40 to 60
    height: 60, // Increased from 40 to 60
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  appTitle: {
    fontSize: 22, // Increased from 18 to 22
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
  },
  backButton: {
    padding: 8,
  },
  logoutButton: {
    padding: 8,
  },
});

export default AppHeader;
