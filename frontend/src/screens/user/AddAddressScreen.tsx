import React, { useState, useEffect } from 'react';
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
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import userService, { AddressData } from '../../services/user.service';

interface RouteParams {
  mode: 'add' | 'edit';
  index?: number;
  address?: AddressData;
}

const AddAddressScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as RouteParams;

  const isEditMode = params?.mode === 'edit';
  const addressIndex = params?.index;
  const existingAddress = params?.address;

  const [formData, setFormData] = useState<AddressData>({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    isDefault: false,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    city: '',
    state: '',
    pincode: '',
    country: '',
  });

  useEffect(() => {
    if (isEditMode && existingAddress) {
      setFormData(existingAddress);
    }
  }, [isEditMode, existingAddress]);

  const validateForm = () => {
    let valid = true;
    const newErrors = {
      fullName: '',
      phone: '',
      addressLine1: '',
      city: '',
      state: '',
      pincode: '',
      country: '',
    };

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
      valid = false;
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
      valid = false;
    } else if (!/^[0-9]{10}$/.test(formData.phone)) {
      newErrors.phone = 'Phone must be 10 digits';
      valid = false;
    }

    if (!formData.addressLine1.trim()) {
      newErrors.addressLine1 = 'Address is required';
      valid = false;
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
      valid = false;
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
      valid = false;
    }

    if (!formData.pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
      valid = false;
    } else if (!/^[0-9]{6}$/.test(formData.pincode)) {
      newErrors.pincode = 'Pincode must be 6 digits';
      valid = false;
    }

    if (!formData.country.trim()) {
      newErrors.country = 'Country is required';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      if (isEditMode && addressIndex !== undefined) {
        await userService.updateAddress(addressIndex, formData);
        if (Platform.OS === 'web') {
          alert('Address updated successfully!');
        } else {
          Alert.alert('Success', 'Address updated successfully!');
        }
      } else {
        await userService.addAddress(formData);
        if (Platform.OS === 'web') {
          alert('Address added successfully!');
        } else {
          Alert.alert('Success', 'Address added successfully!');
        }
      }
      navigation.goBack();
    } catch (error: any) {
      console.error('Save address error:', error);
      const message = error.response?.data?.message || 'Failed to save address';
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Error', message);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof AddressData, value: string | boolean) => {
    setFormData({ ...formData, [field]: value });
    if (typeof value === 'string') {
      setErrors({ ...errors, [field]: '' });
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>{isEditMode ? 'Edit Address' : 'Add New Address'}</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Full Name *</Text>
          <View style={[styles.inputWrapper, errors.fullName ? styles.inputError : null]}>
            <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter recipient's full name"
              value={formData.fullName}
              onChangeText={(text) => updateField('fullName', text)}
              autoCapitalize="words"
            />
          </View>
          {errors.fullName ? <Text style={styles.errorText}>{errors.fullName}</Text> : null}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Phone Number *</Text>
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

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Address Line 1 *</Text>
          <View style={[styles.inputWrapper, errors.addressLine1 ? styles.inputError : null]}>
            <Ionicons name="home-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="House No., Building Name"
              value={formData.addressLine1}
              onChangeText={(text) => updateField('addressLine1', text)}
              autoCapitalize="words"
            />
          </View>
          {errors.addressLine1 ? <Text style={styles.errorText}>{errors.addressLine1}</Text> : null}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Address Line 2 (Optional)</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="location-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Road Name, Area, Colony"
              value={formData.addressLine2}
              onChangeText={(text) => updateField('addressLine2', text)}
              autoCapitalize="words"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.inputContainer, styles.halfWidth]}>
            <Text style={styles.label}>City *</Text>
            <View style={[styles.inputWrapper, errors.city ? styles.inputError : null]}>
              <TextInput
                style={styles.input}
                placeholder="City"
                value={formData.city}
                onChangeText={(text) => updateField('city', text)}
                autoCapitalize="words"
              />
            </View>
            {errors.city ? <Text style={styles.errorText}>{errors.city}</Text> : null}
          </View>

          <View style={[styles.inputContainer, styles.halfWidth]}>
            <Text style={styles.label}>State *</Text>
            <View style={[styles.inputWrapper, errors.state ? styles.inputError : null]}>
              <TextInput
                style={styles.input}
                placeholder="State"
                value={formData.state}
                onChangeText={(text) => updateField('state', text)}
                autoCapitalize="words"
              />
            </View>
            {errors.state ? <Text style={styles.errorText}>{errors.state}</Text> : null}
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.inputContainer, styles.halfWidth]}>
            <Text style={styles.label}>Pincode *</Text>
            <View style={[styles.inputWrapper, errors.pincode ? styles.inputError : null]}>
              <TextInput
                style={styles.input}
                placeholder="6 digits"
                value={formData.pincode}
                onChangeText={(text) => updateField('pincode', text)}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>
            {errors.pincode ? <Text style={styles.errorText}>{errors.pincode}</Text> : null}
          </View>

          <View style={[styles.inputContainer, styles.halfWidth]}>
            <Text style={styles.label}>Country *</Text>
            <View style={[styles.inputWrapper, errors.country ? styles.inputError : null]}>
              <TextInput
                style={styles.input}
                placeholder="Country"
                value={formData.country}
                onChangeText={(text) => updateField('country', text)}
                autoCapitalize="words"
              />
            </View>
            {errors.country ? <Text style={styles.errorText}>{errors.country}</Text> : null}
          </View>
        </View>

        <View style={styles.switchContainer}>
          <View style={styles.switchLabelContainer}>
            <Ionicons name="star-outline" size={20} color="#666" />
            <Text style={styles.switchLabel}>Set as default address</Text>
          </View>
          <Switch
            value={formData.isDefault}
            onValueChange={(value) => updateField('isDefault', value)}
            trackColor={{ false: '#d0d0d0', true: '#b39ddb' }}
            thumbColor={formData.isDefault ? '#6200ee' : '#f4f3f4'}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>
              {isEditMode ? 'Update Address' : 'Save Address'}
            </Text>
          )}
        </TouchableOpacity>
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 24,
  },
  switchLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#6200ee',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddAddressScreen;
