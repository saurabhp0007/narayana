import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../lib/theme';
import { useAuthStore } from '../store/authStore';
import { ScreenHeader } from '../components/common/ScreenHeader';

export const ProfileScreen = ({ navigation }: any) => {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          navigation.reset({
            index: 0,
            routes: [{ name: 'Home' }],
          });
        },
      },
    ]);
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Profile" />
        <View style={styles.notLoggedIn}>
          <Ionicons name="person-circle-outline" size={80} color={colors.secondary} />
          <Text style={styles.notLoggedInTitle}>Not Logged In</Text>
          <Text style={styles.notLoggedInText}>Login to access your profile</Text>
          <TouchableOpacity style={styles.loginButton} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.registerButton} onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerButtonText}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Profile" />

      {/* User Info */}
      <View style={styles.userInfoSection}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person-circle" size={80} color={colors.primary} />
        </View>
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
        {user.phone && <Text style={styles.userPhone}>{user.phone}</Text>}
      </View>

      {/* Menu Items */}
      <View style={styles.menuSection}>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Orders')}>
          <Ionicons name="receipt-outline" size={24} color={colors.primary} />
          <Text style={styles.menuText}>My Orders</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.secondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Wishlist')}>
          <Ionicons name="heart-outline" size={24} color={colors.primary} />
          <Text style={styles.menuText}>Wishlist</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.secondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Cart')}>
          <Ionicons name="cart-outline" size={24} color={colors.primary} />
          <Text style={styles.menuText}>Shopping Cart</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.secondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="location-outline" size={24} color={colors.primary} />
          <Text style={styles.menuText}>Addresses</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.secondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="settings-outline" size={24} color={colors.primary} />
          <Text style={styles.menuText}>Settings</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.secondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="help-circle-outline" size={24} color={colors.primary} />
          <Text style={styles.menuText}>Help & Support</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.secondary} />
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <View style={styles.logoutSection}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Account Info */}
      <View style={styles.accountInfo}>
        <Text style={styles.accountInfoText}>
          Member since {new Date(user.createdAt).toLocaleDateString()}
        </Text>
        {user.lastLoginAt && (
          <Text style={styles.accountInfoText}>
            Last login: {new Date(user.lastLoginAt).toLocaleDateString()}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  notLoggedIn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  notLoggedInTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 16,
  },
  notLoggedInText: {
    fontSize: 14,
    color: colors.secondary,
    marginTop: 8,
  },
  loginButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 48,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  registerButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 48,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  registerButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  userInfoSection: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
  },
  userEmail: {
    fontSize: 16,
    color: colors.secondary,
    marginTop: 4,
  },
  userPhone: {
    fontSize: 14,
    color: colors.secondary,
    marginTop: 4,
  },
  menuSection: {
    paddingVertical: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: colors.primary,
    marginLeft: 16,
  },
  logoutSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 8,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    color: colors.danger,
    fontWeight: '600',
  },
  accountInfo: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  accountInfoText: {
    fontSize: 12,
    color: colors.secondary,
    marginBottom: 4,
  },
});
