import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, shadow, spacing } from '../lib/theme';
import { Accordion, AccordionItem } from '../components/common/Accordion';
import { jobPositions, whyWorkWithUs, CONTACT_EMAIL } from '../content/staticContent';
import { ScreenHeader } from '../components/common/ScreenHeader';

export const CareersScreen = ({ navigation }: any) => {
  return (
    <View style={styles.container}>
      <ScreenHeader title="Careers" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <LinearGradient colors={['#2563eb', '#1d4ed8']} style={styles.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Text style={styles.heroTitle}>Join Our Team</Text>
          <Text style={styles.heroSubtitle}>
            Build your career with Narayan Enterprises and be part of our growing fashion retail family.
          </Text>
        </LinearGradient>

        <View style={styles.card}>
          <Text style={styles.h2}>Why Work With Us</Text>
          <View style={styles.grid2}>
            {whyWorkWithUs.map((item) => (
              <View key={item.title} style={styles.whyTile}>
                <View style={styles.iconCircle}>
                  <Ionicons name={item.icon as any} size={26} color={colors.info} />
                </View>
                <Text style={styles.tileTitle}>{item.title}</Text>
                <Text style={styles.tileDesc}>{item.description}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.h2}>Open Positions</Text>
          <Accordion>
            {jobPositions.map((position) => (
              <AccordionItem key={position.id} id={position.id} title={position.title}>
                <View style={styles.positionMeta}>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>{position.type}</Text>
                  </View>
                  <View style={styles.locationRow}>
                    <Ionicons name="location-outline" size={14} color={colors.secondary} />
                    <Text style={styles.locationText}>{position.location}</Text>
                  </View>
                </View>
                <Text style={styles.positionDesc}>{position.description}</Text>
                <Text style={styles.reqTitle}>Requirements:</Text>
                {position.requirements.map((req, i) => (
                  <View key={i} style={styles.reqRow}>
                    <Text style={styles.reqBullet}>{'•'}</Text>
                    <Text style={styles.reqText}>{req}</Text>
                  </View>
                ))}
                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={() =>
                    Linking.openURL(`mailto:${CONTACT_EMAIL}?subject=Application for ${position.title}`)
                  }
                >
                  <Text style={styles.applyButtonText}>Apply Now</Text>
                  <Ionicons name="arrow-forward" size={16} color="#fff" />
                </TouchableOpacity>
              </AccordionItem>
            ))}
          </Accordion>
        </View>

        <View style={styles.card}>
          <Text style={styles.h2}>Don't See Your Role?</Text>
          <Text style={styles.paragraph}>
            We're always looking for talented individuals to join our team. Send us your resume and we'll keep
            you in mind for future opportunities.
          </Text>
          <View style={styles.howToApply}>
            <Text style={styles.howToApplyTitle}>How to Apply</Text>
            <Text style={styles.howToApplyItem}>1. Prepare your updated resume/CV</Text>
            <Text style={styles.howToApplyItem}>
              2. Write a brief cover letter explaining why you want to join Narayan Enterprises
            </Text>
            <Text style={styles.howToApplyItem}>3. Send your application to: {CONTACT_EMAIL}</Text>
            <Text style={styles.howToApplyItem}>
              4. We'll review your application and contact you if there's a suitable opportunity
            </Text>
          </View>
          <View style={styles.ctaRow}>
            <TouchableOpacity
              style={styles.primaryCta}
              onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}?subject=General Application`)}
            >
              <Text style={styles.primaryCtaText}>Send Application</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryCta} onPress={() => navigation.navigate('Contact')}>
              <Text style={styles.secondaryCtaText}>Contact Us</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.lightBackground },
  scrollContent: { padding: spacing.md, gap: spacing.md },
  hero: { borderRadius: radius.lg, padding: spacing.lg },
  heroTitle: { fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 8 },
  heroSubtitle: { fontSize: 15, color: 'rgba(255,255,255,0.9)', lineHeight: 21 },
  card: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg, ...shadow.sm },
  h2: { fontSize: 19, fontWeight: '700', color: colors.primary, marginBottom: spacing.md },
  paragraph: { fontSize: 14, color: colors.secondary, lineHeight: 21, marginBottom: spacing.sm },
  grid2: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, justifyContent: 'space-between' },
  whyTile: { width: '47%', alignItems: 'center' },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  tileTitle: { fontSize: 14, fontWeight: '600', color: colors.primary, textAlign: 'center', marginBottom: 4 },
  tileDesc: { fontSize: 12, color: colors.secondary, textAlign: 'center', lineHeight: 16 },
  positionMeta: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.sm },
  typeBadge: { backgroundColor: '#dbeafe', paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.full },
  typeBadgeText: { fontSize: 12, fontWeight: '600', color: '#1e40af' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 12, color: colors.secondary },
  positionDesc: { fontSize: 13, color: colors.secondary, lineHeight: 19, marginBottom: spacing.sm },
  reqTitle: { fontSize: 13, fontWeight: '700', color: colors.primary, marginBottom: 6 },
  reqRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  reqBullet: { color: colors.secondary },
  reqText: { flex: 1, fontSize: 13, color: colors.secondary, lineHeight: 18 },
  applyButton: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: radius.md,
  },
  applyButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  howToApply: { backgroundColor: colors.lightBackground, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  howToApplyTitle: { fontSize: 15, fontWeight: '700', color: colors.primary, marginBottom: 8 },
  howToApplyItem: { fontSize: 13, color: colors.secondary, lineHeight: 20, marginBottom: 6 },
  ctaRow: { flexDirection: 'row', gap: spacing.sm },
  primaryCta: { flex: 1, backgroundColor: '#2563eb', paddingVertical: 12, borderRadius: radius.md, alignItems: 'center' },
  primaryCtaText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  secondaryCta: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  secondaryCtaText: { color: colors.primary, fontWeight: '700', fontSize: 14 },
});
