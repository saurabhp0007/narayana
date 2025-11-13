import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import userService, { User, AddressData } from '../../services/user.service';

const UserProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const loadProfile = async () => {
    try {
      const profile = await userService.getProfile();
      setUser(profile);
      setFormData({
        name: profile.name,
        email: profile.email,
        phone: profile.phone || '',
      });
    } catch (error: any) {
      console.error('Failed to load profile:', error);
      if (error.response?.status === 401) {
        // Token expired or invalid
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('user');
        navigation.navigate('UserLogin' as never);
      }
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  };

  const validateForm = () => {
    let valid = true;
    const newErrors = {
      name: '',
      email: '',
      phone: '',
    };

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
      valid = false;
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
      valid = false;
    }

    if (formData.phone && !/^[0-9]{10}$/.test(formData.phone)) {
      newErrors.phone = 'Phone must be 10 digits';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSaveProfile = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const updated = await userService.updateProfile({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
      });
      setUser(updated);
      await AsyncStorage.setItem('user', JSON.stringify(updated));
      setEditMode(false);
      if (Platform.OS === 'web') {
        alert('Profile updated successfully!');
      } else {
        Alert.alert('Success', 'Profile updated successfully!');
      }
    } catch (error: any) {
      console.error('Update profile error:', error);
      const message = error.response?.data?.message || 'Failed to update profile';
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Error', message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
      });
      setErrors({ name: '', email: '', phone: '' });
    }
    setEditMode(false);
  };

  const handleLogout = async () => {
    const confirmLogout = () => {
      AsyncStorage.removeItem('userToken');
      AsyncStorage.removeItem('user');
      navigation.navigate('Home' as never);
    };

    if (Platform.OS === 'web') {
      if (confirm('Are you sure you want to logout?')) {
        confirmLogout();
      }
    } else {
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Logout', onPress: confirmLogout, style: 'destructive' },
        ]
      );
    }
  };

  const handleDeleteAddress = async (index: number) => {
    const confirmDelete = async () => {
      try {
        const updated = await userService.deleteAddress(index);
        setUser(updated);
        if (Platform.OS === 'web') {
          alert('Address deleted successfully!');
        } else {
          Alert.alert('Success', 'Address deleted successfully!');
        }
      } catch (error: any) {
        const message = error.response?.data?.message || 'Failed to delete address';
        if (Platform.OS === 'web') {
          alert(message);
        } else {
          Alert.alert('Error', message);
        }
      }
    };

    if (Platform.OS === 'web') {
      if (confirm('Are you sure you want to delete this address?')) {
        confirmDelete();
      }
    } else {
      Alert.alert(
        'Delete Address',
        'Are you sure you want to delete this address?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', onPress: confirmDelete, style: 'destructive' },
        ]
      );
    }
  };

  const handleSetDefaultAddress = async (index: number) => {
    try {
      const updated = await userService.setDefaultAddress(index);
      setUser(updated);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to set default address';
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Error', message);
      }
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    setErrors({ ...errors, [field]: '' });
  };

  if (loading && !user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#999" />
        <Text style={styles.errorText}>Failed to load profile</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadProfile}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6200ee']} />
      }
    >
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person-circle-outline" size={80} color="#6200ee" />
        </View>
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
      </View>

      {/* Profile Information */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Profile Information</Text>
          {!editMode ? (
            <TouchableOpacity onPress={() => setEditMode(true)}>
              <Ionicons name="create-outline" size={24} color="#6200ee" />
            </TouchableOpacity>
          ) : null}
        </View>

        {!editMode ? (
          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={20} color="#666" />
              <Text style={styles.infoLabel}>Name:</Text>
              <Text style={styles.infoValue}>{user.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={20} color="#666" />
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{user.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={20} color="#666" />
              <Text style={styles.infoLabel}>Phone:</Text>
              <Text style={styles.infoValue}>{user.phone || 'Not provided'}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name *</Text>
              <View style={[styles.inputWrapper, errors.name ? styles.inputError : null]}>
                <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChangeText={(text) => updateField('name', text)}
                  autoCapitalize="words"
                />
              </View>
              {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email *</Text>
              <View style={[styles.inputWrapper, errors.email ? styles.inputError : null]}>
                <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  value={formData.email}
                  onChangeText={(text) => updateField('email', text)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Phone (Optional)</Text>
              <View style={[styles.inputWrapper, errors.phone ? styles.inputError : null]}>
                <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="10-digit mobile number"
                  value={formData.phone}
                  onChangeText={(text) => updateField('phone', text)}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
              {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}
            </View>

            <View style={styles.editActions}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancelEdit}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSaveProfile}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Addresses Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Saved Addresses</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AddAddress' as never, { mode: 'add' } as never)}>
            <Ionicons name="add-circle-outline" size={24} color="#6200ee" />
          </TouchableOpacity>
        </View>

        {user.addresses && user.addresses.length > 0 ? (
          user.addresses.map((address, index) => (
            <View key={index} style={styles.addressCard}>
              {address.isDefault && (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                </View>
              )}
              <Text style={styles.addressName}>{address.fullName}</Text>
              <Text style={styles.addressPhone}>{address.phone}</Text>
              <Text style={styles.addressText}>
                {address.addressLine1}
                {address.addressLine2 ? `, ${address.addressLine2}` : ''}
              </Text>
              <Text style={styles.addressText}>
                {address.city}, {address.state} - {address.pincode}
              </Text>
              <Text style={styles.addressText}>{address.country}</Text>

              <View style={styles.addressActions}>
                {!address.isDefault && (
                  <TouchableOpacity
                    style={styles.addressActionButton}
                    onPress={() => handleSetDefaultAddress(index)}
                  >
                    <Ionicons name="checkmark-circle-outline" size={18} color="#6200ee" />
                    <Text style={styles.addressActionText}>Set Default</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.addressActionButton}
                  onPress={() => navigation.navigate('AddAddress' as never, { mode: 'edit', index, address } as never)}
                >
                  <Ionicons name="create-outline" size={18} color="#6200ee" />
                  <Text style={styles.addressActionText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.addressActionButton}
                  onPress={() => handleDeleteAddress(index)}
                >
                  <Ionicons name="trash-outline" size={18} color="#f44336" />
                  <Text style={[styles.addressActionText, { color: '#f44336' }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="location-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No saved addresses</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('AddAddress' as never, { mode: 'add' } as never)}
            >
              <Text style={styles.addButtonText}>Add Address</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Account Actions */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('ChangePassword' as never)}
        >
          <Ionicons name="key-outline" size={24} color="#333" />
          <Text style={styles.actionButtonText}>Change Password</Text>
          <Ionicons name="chevron-forward-outline" size={24} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, styles.logoutButton]} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#f44336" />
          <Text style={[styles.actionButtonText, { color: '#f44336' }]}>Logout</Text>
          <Ionicons name="chevron-forward-outline" size={24} color="#f44336" />
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Member since {new Date(user.createdAt || '').toLocaleDateString()}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#6200ee',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: 'white',
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    backgroundColor: 'white',
    marginTop: 16,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  infoContainer: {
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    width: 60,
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 12,
  },
  inputError: {
    borderColor: '#f44336',
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#6200ee',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  addressCard: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    position: 'relative',
  },
  defaultBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#4caf50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  defaultBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  addressName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  addressPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  addressActions: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 16,
  },
  addressActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addressActionText: {
    fontSize: 14,
    color: '#6200ee',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: '#6200ee',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 16,
  },
  logoutButton: {
    borderBottomWidth: 0,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
});

export default UserProfileScreen;
