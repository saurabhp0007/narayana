import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow, spacing } from '../lib/theme';
import { CONTACT_EMAIL, WHATSAPP_NUMBERS, STORE_ADDRESS, INSTAGRAM_HANDLE } from '../content/staticContent';
import { ScreenHeader } from '../components/common/ScreenHeader';

interface InfoCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  title: string;
  children: React.ReactNode;
}

function InfoCard({ icon, iconBg, iconColor, title, children }: InfoCardProps) {
  return (
    <View style={styles.infoCard}>
      <View style={styles.infoHeader}>
        <View style={[styles.iconSquare, { backgroundColor: iconBg }]}>
          <Ionicons name={icon} size={22} color={iconColor} />
        </View>
        <Text style={styles.infoTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

export const ContactScreen = ({ navigation }: any) => {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  const handleSubmit = () => {
    if (!form.name || !form.email || !form.subject || !form.message) return;
    setStatus('submitting');
    setTimeout(() => {
      setStatus('success');
      setForm({ name: '', email: '', subject: '', message: '' });
    }, 1200);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Contact Us" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.h1}>Contact Us</Text>
          <Text style={styles.lead}>
            We're here to help! Reach out to us through any of the following methods and we'll respond within 24
            hours.
          </Text>
        </View>

        <InfoCard icon="logo-whatsapp" iconBg="#dcfce7" iconColor="#16a34a" title="WhatsApp">
          {WHATSAPP_NUMBERS.map((num) => (
            <TouchableOpacity key={num} onPress={() => Linking.openURL(`https://wa.me/${num.replace(/\D/g, '')}`)}>
              <Text style={styles.link}>{num}</Text>
            </TouchableOpacity>
          ))}
        </InfoCard>

        <InfoCard icon="mail-outline" iconBg="#dbeafe" iconColor="#2563eb" title="Email">
          <TouchableOpacity onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}`)}>
            <Text style={styles.link}>{CONTACT_EMAIL}</Text>
          </TouchableOpacity>
        </InfoCard>

        <InfoCard icon="location-outline" iconBg="#fee2e2" iconColor="#dc2626" title="Store Address">
          <Text style={styles.infoText}>{STORE_ADDRESS}</Text>
        </InfoCard>

        <InfoCard icon="time-outline" iconBg="#fef9c3" iconColor="#ca8a04" title="Business Hours">
          <Text style={styles.infoText}>Everyday: 9:00 AM – 8:00 PM</Text>
        </InfoCard>

        <InfoCard icon="logo-instagram" iconBg="#f3e8ff" iconColor="#9333ea" title="Follow Us">
          <TouchableOpacity onPress={() => Linking.openURL('https://instagram.com/narayan_enterprises2.0')}>
            <Text style={styles.link}>{INSTAGRAM_HANDLE}</Text>
          </TouchableOpacity>
        </InfoCard>

        <View style={styles.card}>
          <Text style={styles.h2}>Send Us a Message</Text>
          <Text style={styles.lead}>Fill out the form below and we'll get back to you within 24 hours.</Text>

          {status === 'success' ? (
            <View style={styles.successBanner}>
              <Text style={styles.successText}>Thank you for your message! We'll get back to you within 24 hours.</Text>
            </View>
          ) : null}

          <Text style={styles.label}>Your Name *</Text>
          <TextInput
            style={styles.input}
            value={form.name}
            onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
            placeholder="John Doe"
            placeholderTextColor={colors.placeholder}
          />

          <Text style={styles.label}>Email Address *</Text>
          <TextInput
            style={styles.input}
            value={form.email}
            onChangeText={(v) => setForm((f) => ({ ...f, email: v }))}
            placeholder="john@example.com"
            placeholderTextColor={colors.placeholder}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Subject *</Text>
          <TextInput
            style={styles.input}
            value={form.subject}
            onChangeText={(v) => setForm((f) => ({ ...f, subject: v }))}
            placeholder="How can we help you?"
            placeholderTextColor={colors.placeholder}
          />

          <Text style={styles.label}>Message *</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={form.message}
            onChangeText={(v) => setForm((f) => ({ ...f, message: v }))}
            placeholder="Tell us more about your inquiry..."
            placeholderTextColor={colors.placeholder}
            multiline
            numberOfLines={5}
          />

          <TouchableOpacity
            style={[styles.submitButton, status === 'submitting' && styles.submitDisabled]}
            onPress={handleSubmit}
            disabled={status === 'submitting'}
          >
            <Text style={styles.submitText}>{status === 'submitting' ? 'Sending...' : 'Send Message'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.lightBackground },
  scrollContent: { padding: spacing.md, gap: spacing.md },
  card: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg, ...shadow.sm },
  h1: { fontSize: 24, fontWeight: '700', color: colors.primary, marginBottom: 8 },
  h2: { fontSize: 19, fontWeight: '700', color: colors.primary, marginBottom: 8 },
  lead: { fontSize: 14, color: colors.secondary, lineHeight: 21, marginBottom: spacing.md },
  infoCard: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg, ...shadow.sm },
  infoHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  iconSquare: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  infoTitle: { fontSize: 16, fontWeight: '700', color: colors.primary },
  infoText: { fontSize: 14, color: colors.secondary, lineHeight: 20 },
  link: { fontSize: 14, color: colors.info, marginBottom: 4 },
  label: { fontSize: 13, fontWeight: '600', color: colors.primaryHover, marginBottom: 6, marginTop: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.primary,
  },
  textarea: { height: 110, textAlignVertical: 'top' },
  submitButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  submitDisabled: { backgroundColor: colors.placeholder },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  successBanner: {
    backgroundColor: '#f0fdf4',
    borderLeftWidth: 4,
    borderLeftColor: '#4ade80',
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
  },
  successText: { color: '#166534', fontSize: 13 },
});
