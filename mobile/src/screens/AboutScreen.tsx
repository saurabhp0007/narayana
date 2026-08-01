import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, shadow, spacing } from '../lib/theme';
import { whatWeOffer, whyChooseUs } from '../content/staticContent';
import { ScreenHeader } from '../components/common/ScreenHeader';

export const AboutScreen = ({ navigation }: any) => {
  return (
    <View style={styles.container}>
      <ScreenHeader title="About Us" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.h1}>About Narayan Enterprises</Text>
          <Text style={styles.lead}>
            We believe fashion is more than just clothing—it's a reflection of individuality, culture, and
            creativity.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.h2}>Our Story</Text>
          <Text style={styles.paragraph}>
            Narayan Enterprises is an Indian fashion retailer specializing in authentic branded apparel,
            accessories, and footwear. Based in Delhi's Dwarka sector, we have established ourselves as a
            trusted source for genuine, high-quality fashion products.
          </Text>
          <Text style={styles.paragraph}>
            We draw inspiration from global fashion capitals to serve style-conscious consumers of all ages,
            bringing the latest trends and timeless classics to our valued customers across India.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.h2}>Our Mission</Text>
          <Text style={styles.paragraph}>
            To provide authentic, high-quality branded fashion at competitive prices while delivering an
            exceptional shopping experience. We are committed to offering 100% genuine products that meet the
            highest standards of quality and craftsmanship.
          </Text>
          <Text style={styles.paragraph}>
            Our goal is to make premium fashion accessible to everyone, ensuring that every customer receives
            authentic merchandise they can trust.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.h2}>What We Offer</Text>
          <View style={styles.grid2}>
            {whatWeOffer.map((item) => (
              <View key={item.title} style={styles.offerTile}>
                <View style={styles.iconSquare}>
                  <Ionicons name={item.icon as any} size={22} color={colors.info} />
                </View>
                <Text style={styles.tileTitle}>{item.title}</Text>
                <Text style={styles.tileDesc}>{item.description}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.h2}>Why Choose Us</Text>
          {whyChooseUs.map((item) => (
            <View key={item.title} style={styles.checkRow}>
              <View style={styles.checkCircle}>
                <Ionicons name="checkmark" size={16} color={colors.success} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.checkTitle}>{item.title}</Text>
                <Text style={styles.checkDesc}>{item.description}</Text>
              </View>
            </View>
          ))}
        </View>

        <LinearGradient colors={['#2563eb', '#1d4ed8']} style={styles.ctaCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Text style={styles.ctaTitle}>Visit Our Store</Text>
          <Text style={styles.ctaText}>Experience our collection in person at our physical store in Delhi.</Text>
          <View style={styles.ctaInfoRow}>
            <Ionicons name="location-outline" size={18} color="#fff" />
            <Text style={styles.ctaInfoText}>Plot KH No. 266, Mahadev Road, Dhul Siras, Dwarka Sector 29, Delhi 110077</Text>
          </View>
          <View style={styles.ctaInfoRow}>
            <Ionicons name="time-outline" size={18} color="#fff" />
            <Text style={styles.ctaInfoText}>Open Everyday: 9:00 AM – 8:00 PM</Text>
          </View>
          <TouchableOpacity style={styles.ctaButton} onPress={() => navigation.navigate('Contact')}>
            <Text style={styles.ctaButtonText}>Contact Us</Text>
          </TouchableOpacity>
        </LinearGradient>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.lightBackground },
  scrollContent: { padding: spacing.md, gap: spacing.md },
  card: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg, ...shadow.sm },
  h1: { fontSize: 26, fontWeight: '700', color: colors.primary, marginBottom: spacing.sm },
  lead: { fontSize: 16, color: colors.secondary, lineHeight: 24 },
  h2: { fontSize: 19, fontWeight: '700', color: colors.primary, marginBottom: spacing.sm },
  paragraph: { fontSize: 14, color: colors.secondary, lineHeight: 21, marginBottom: 8 },
  grid2: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: 4 },
  offerTile: {
    width: '47%',
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  iconSquare: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  tileTitle: { fontSize: 14, fontWeight: '600', color: colors.primary, marginBottom: 4 },
  tileDesc: { fontSize: 12, color: colors.secondary, lineHeight: 17 },
  checkRow: { flexDirection: 'row', gap: 12, marginBottom: spacing.md, alignItems: 'flex-start' },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkTitle: { fontSize: 15, fontWeight: '600', color: colors.primary },
  checkDesc: { fontSize: 13, color: colors.secondary, marginTop: 2 },
  ctaCard: { borderRadius: radius.lg, padding: spacing.lg },
  ctaTitle: { fontSize: 19, fontWeight: '700', color: '#fff', marginBottom: 8 },
  ctaText: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginBottom: spacing.md },
  ctaInfoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  ctaInfoText: { flex: 1, fontSize: 13, color: '#fff' },
  ctaButton: {
    marginTop: spacing.md,
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  ctaButtonText: { color: '#2563eb', fontWeight: '700', fontSize: 15 },
});
