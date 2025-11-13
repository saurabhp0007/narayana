import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import userService from '../../services/user.service';

const ChangePasswordScreen: React.FC = () => {
  const navigation = useNavigation();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const validateForm = () => {
    let valid = true;
    const newErrors = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    };

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
      valid = false;
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
      valid = false;
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
      valid = false;
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
      valid = false;
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      valid = false;
    }

    if (formData.currentPassword && formData.newPassword && formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = 'New password must be different from current password';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleChangePassword = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await userService.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      if (Platform.OS === 'web') {
        alert('Password changed successfully!');
      } else {
        Alert.alert('Success', 'Password changed successfully!');
      }

      // Clear form and go back
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      navigation.goBack();
    } catch (error: any) {
      console.error('Change password error:', error);
      const message = error.response?.data?.message || 'Failed to change password';
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Error', message);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    setErrors({ ...errors, [field]: '' });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Change Password</Text>
      </View>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={24} color="#6200ee" />
        <Text style={styles.infoText}>
          Choose a strong password with at least 6 characters. Make sure it's unique and not used elsewhere.
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Current Password *</Text>
          <View style={[styles.inputWrapper, errors.currentPassword ? styles.inputError : null]}>
            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter your current password"
              value={formData.currentPassword}
              onChangeText={(text) => updateField('currentPassword', text)}
              secureTextEntry={!showCurrentPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
              <Ionicons
                name={showCurrentPassword ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>
          {errors.currentPassword ? <Text style={styles.errorText}>{errors.currentPassword}</Text> : null}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>New Password *</Text>
          <View style={[styles.inputWrapper, errors.newPassword ? styles.inputError : null]}>
            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter new password (min 6 characters)"
              value={formData.newPassword}
              onChangeText={(text) => updateField('newPassword', text)}
              secureTextEntry={!showNewPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
              <Ionicons
                name={showNewPassword ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>
          {errors.newPassword ? <Text style={styles.errorText}>{errors.newPassword}</Text> : null}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Confirm New Password *</Text>
          <View style={[styles.inputWrapper, errors.confirmPassword ? styles.inputError : null]}>
            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Re-enter your new password"
              value={formData.confirmPassword}
              onChangeText={(text) => updateField('confirmPassword', text)}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <Ionicons
                name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>
          {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleChangePassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>Change Password</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>Password Tips:</Text>
        <View style={styles.tipRow}>
          <Ionicons name="checkmark-circle" size={16} color="#4caf50" />
          <Text style={styles.tipText}>Use at least 6 characters</Text>
        </View>
        <View style={styles.tipRow}>
          <Ionicons name="checkmark-circle" size={16} color="#4caf50" />
          <Text style={styles.tipText}>Mix uppercase and lowercase letters</Text>
        </View>
        <View style={styles.tipRow}>
          <Ionicons name="checkmark-circle" size={16} color="#4caf50" />
          <Text style={styles.tipText}>Include numbers and special characters</Text>
        </View>
        <View style={styles.tipRow}>
          <Ionicons name="checkmark-circle" size={16} color="#4caf50" />
          <Text style={styles.tipText}>Avoid using common words or phrases</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#e8eaf6',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  form: {
    padding: 16,
  },
  inputContainer: {
    marginBottom: 20,
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
    backgroundColor: 'white',
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
  errorText: {
    color: '#f44336',
    fontSize: 12,
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#6200ee',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tipsContainer: {
    backgroundColor: 'white',
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 8,
    gap: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
  },
});

export default ChangePasswordScreen;
