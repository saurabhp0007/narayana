import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow, spacing } from '../lib/theme';
import {
  PolicyContent,
  privacyPolicy,
  returnRefundPolicy,
  shippingPolicy,
  termsOfService,
} from '../content/staticContent';
import { ScreenHeader } from '../components/common/ScreenHeader';

export type PolicyType = 'privacy' | 'returns' | 'shipping' | 'terms';

const POLICIES: Record<PolicyType, PolicyContent> = {
  privacy: privacyPolicy,
  returns: returnRefundPolicy,
  shipping: shippingPolicy,
  terms: termsOfService,
};

const CALLOUT_COLORS = {
  yellow: { bg: '#fefce8', border: '#facc15', text: '#854d0e' },
  blue: { bg: '#eff6ff', border: '#60a5fa', text: '#1e40af' },
  gray: { bg: colors.lightBackground, border: colors.border, text: colors.primaryHover },
};

export const PolicyScreen = ({ navigation, route }: any) => {
  const type: PolicyType = route.params?.type ?? 'privacy';
  const content = POLICIES[type];

  return (
    <View style={styles.container}>
      <ScreenHeader title={content.title} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.title}>{content.title}</Text>
          <Text style={styles.lastUpdated}>Last updated: {content.lastUpdated}</Text>

          {content.sections.map((section, i) => (
            <View key={i} style={styles.section}>
              <Text style={styles.sectionHeading}>{section.heading}</Text>

              {section.callout ? (
                <View
                  style={[
                    styles.callout,
                    {
                      backgroundColor: CALLOUT_COLORS[section.callout.tone].bg,
                      borderLeftColor: CALLOUT_COLORS[section.callout.tone].border,
                    },
                  ]}
                >
                  <Text style={[styles.calloutText, { color: CALLOUT_COLORS[section.callout.tone].text }]}>
                    {section.callout.text}
                  </Text>
                </View>
              ) : null}

              {section.paragraphs?.map((p, j) => (
                <Text key={j} style={styles.paragraph}>
                  {p}
                </Text>
              ))}

              {section.bullets ? (
                <View style={styles.list}>
                  {section.bullets.map((b, j) => (
                    <View key={j} style={styles.listItem}>
                      <Text style={styles.bullet}>{'•'}</Text>
                      <Text style={styles.listText}>{b}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {section.ordered ? (
                <View style={styles.list}>
                  {section.ordered.map((b, j) => (
                    <View key={j} style={styles.listItem}>
                      <Text style={styles.bullet}>{j + 1}.</Text>
                      <Text style={styles.listText}>{b}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          ))}

          <TouchableOpacity style={styles.backHome} onPress={() => navigation.navigate('Root', { screen: 'Home' })}>
            <Text style={styles.backHomeText}>{'←'} Back to Home</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.lightBackground },
  scrollContent: { padding: spacing.md },
  card: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg, ...shadow.sm },
  title: { fontSize: 24, fontWeight: '700', color: colors.primary, marginBottom: 8 },
  lastUpdated: { fontSize: 13, color: colors.secondary, marginBottom: spacing.lg },
  section: { marginBottom: spacing.lg },
  sectionHeading: { fontSize: 17, fontWeight: '700', color: colors.primary, marginBottom: 8 },
  paragraph: { fontSize: 14, color: colors.secondary, lineHeight: 21, marginBottom: 8 },
  callout: { borderLeftWidth: 4, padding: spacing.sm, borderRadius: radius.sm, marginBottom: 8 },
  calloutText: { fontSize: 14, fontWeight: '600' },
  list: { marginTop: 4, marginBottom: 4, gap: 6 },
  listItem: { flexDirection: 'row', gap: 8 },
  bullet: { fontSize: 14, color: colors.secondary, width: 16 },
  listText: { flex: 1, fontSize: 14, color: colors.secondary, lineHeight: 21 },
  backHome: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderLight },
  backHomeText: { color: colors.info, fontSize: 14, fontWeight: '600' },
});
