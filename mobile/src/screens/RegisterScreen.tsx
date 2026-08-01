import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow, spacing } from '../lib/theme';
import { useAuthStore } from '../store/authStore';
import { AuthHeader } from '../components/common/AuthHeader';

type FieldName = 'name' | 'email' | 'password' | 'confirmPassword' | 'phone';

export const RegisterScreen = ({ navigation }: any) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<FieldName | null>(null);
  const [validationError, setValidationError] = useState('');
  const { register, isLoading, error, clearError } = useAuthStore();

  const handleRegister = async () => {
    setValidationError('');

    if (!name || !email || !password || !confirmPassword) {
      setValidationError('Please fill in all required fields');
      return;
    }
    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    try {
      await register(name, email, password, phone || undefined);
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } catch (err) {
      // Error is surfaced via the store's `error` state below
    }
  };

  const displayError = validationError || error;

  const renderField = (opts: {
    field: FieldName;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    value: string;
    onChangeText: (v: string) => void;
    placeholder: string;
    secure?: boolean;
    keyboardType?: 'default' | 'email-address' | 'phone-pad';
    autoCapitalize?: 'none' | 'words';
  }) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{opts.label}</Text>
      <View style={[styles.inputContainer, focusedField === opts.field && styles.inputContainerFocused]}>
        <Ionicons name={opts.icon} size={19} color={colors.secondary} />
        <TextInput
          style={styles.input}
          placeholder={opts.placeholder}
          placeholderTextColor={colors.placeholder}
          value={opts.value}
          onChangeText={opts.onChangeText}
          secureTextEntry={opts.secure && !showPassword}
          keyboardType={opts.keyboardType}
          autoCapitalize={opts.autoCapitalize ?? 'sentences'}
          autoCorrect={false}
          onFocus={() => setFocusedField(opts.field)}
          onBlur={() => setFocusedField(null)}
        />
        {opts.field === 'password' ? (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={19} color={colors.secondary} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <AuthHeader title="Create Account" subtitle="Join Narayan Enterprises today" onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.formCard}>
            {displayError ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={18} color={colors.danger} />
                <Text style={styles.errorText}>{displayError}</Text>
                <TouchableOpacity
                  onPress={() => {
                    clearError();
                    setValidationError('');
                  }}
                  hitSlop={8}
                >
                  <Ionicons name="close" size={18} color={colors.danger} />
                </TouchableOpacity>
              </View>
            ) : null}

            {renderField({
              field: 'name',
              label: 'Full Name *',
              icon: 'person-outline',
              value: name,
              onChangeText: setName,
              placeholder: 'Enter your full name',
              autoCapitalize: 'words',
            })}

            {renderField({
              field: 'email',
              label: 'Email Address *',
              icon: 'mail-outline',
              value: email,
              onChangeText: setEmail,
              placeholder: 'you@example.com',
              keyboardType: 'email-address',
              autoCapitalize: 'none',
            })}

            {renderField({
              field: 'password',
              label: 'Password * (min. 6 characters)',
              icon: 'lock-closed-outline',
              value: password,
              onChangeText: setPassword,
              placeholder: 'Create a password',
              secure: true,
            })}

            {renderField({
              field: 'confirmPassword',
              label: 'Confirm Password *',
              icon: 'lock-closed-outline',
              value: confirmPassword,
              onChangeText: setConfirmPassword,
              placeholder: 'Confirm your password',
              secure: true,
            })}

            {renderField({
              field: 'phone',
              label: 'Phone Number (optional)',
              icon: 'call-outline',
              value: phone,
              onChangeText: setPhone,
              placeholder: 'Enter your phone number',
              keyboardType: 'phone-pad',
            })}

            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.disabledButton]}
              onPress={handleRegister}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Create Account</Text>}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already have an account?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')} hitSlop={6}>
                <Text style={styles.footerLink}>Sign in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  keyboardView: { flex: 1, backgroundColor: colors.lightBackground },
  scrollContent: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xl },
  formCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadow.md,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
    gap: 8,
  },
  errorText: { flex: 1, color: colors.danger, fontSize: 13 },
  inputGroup: { marginBottom: spacing.md },
  label: { fontSize: 13, fontWeight: '600', color: colors.primary, marginBottom: 8 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightBackground,
    borderWidth: 1.5,
    borderColor: 'transparent',
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  inputContainerFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  input: { flex: 1, fontSize: 15, color: colors.primary, padding: 0 },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  disabledButton: { opacity: 0.5 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: spacing.lg },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.borderLight },
  dividerText: { fontSize: 12, color: colors.placeholder },
  footerRow: { flexDirection: 'row', justifyContent: 'center', gap: 4 },
  footerText: { fontSize: 14, color: colors.secondary },
  footerLink: { fontSize: 14, color: colors.info, fontWeight: '700' },
});
