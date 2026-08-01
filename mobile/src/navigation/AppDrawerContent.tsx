import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, radius, spacing } from '../lib/theme';
import { Accordion, AccordionItem } from '../components/common/Accordion';
import { useDataStore } from '../store/dataStore';
import { useAuthStore } from '../store/authStore';
import { offerApi } from '../lib/api';
import { Category, Offer } from '../types';

export function AppDrawerContent(props: DrawerContentComponentProps) {
  const { navigation } = props;
  const insets = useSafeAreaInsets();
  const { genders, fetchGenders, categoriesByGender, fetchCategoriesByGender } = useDataStore();
  const { user, logout } = useAuthStore();
  const [navbarOffers, setNavbarOffers] = useState<Offer[]>([]);

  useEffect(() => {
    fetchGenders();
    offerApi
      .getNavbar()
      .then((res) => setNavbarOffers(res.data.data || res.data || []))
      .catch(() => setNavbarOffers([]));
  }, []);

  useEffect(() => {
    genders.forEach((gender) => fetchCategoriesByGender(gender._id));
  }, [genders]);

  const go = (screen: string, params?: any) => {
    navigation.dispatch(CommonActions.navigate({ name: 'Root', params: { screen, params } }));
  };

  const goToGender = (genderId: string) => go('Products', { genderId });
  const goToCategory = (category: Category) => go('Products', { categoryId: category._id });

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradients.chrome} style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <TouchableOpacity
          onPress={() => {
            navigation.closeDrawer();
            go('Home');
          }}
          hitSlop={10}
        >
          <Image
            source={require('../../assets/brand/logo.png')}
            style={[styles.logo, { tintColor: colors.white }]}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.closeDrawer()} hitSlop={10}>
          <Ionicons name="close" size={24} color={colors.white} />
        </TouchableOpacity>
      </LinearGradient>

    <ScrollView contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.plainRow} onPress={() => go('Products')}>
        <Text style={styles.plainRowText}>SHOP ALL</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.plainRow} onPress={() => go('Products')}>
        <Text style={styles.plainRowText}>FOOTWEAR</Text>
      </TouchableOpacity>

      <Accordion>
        {genders.map((gender) => (
          <AccordionItem key={gender._id} id={gender._id} title={gender.name}>
            <TouchableOpacity onPress={() => goToGender(gender._id)} style={styles.viewAllRow}>
              <Text style={styles.viewAllText}>View All {gender.name}</Text>
            </TouchableOpacity>
            {(categoriesByGender[gender._id] ?? []).map((category) => (
              <TouchableOpacity
                key={category._id}
                onPress={() => goToCategory(category)}
                style={styles.subRow}
              >
                <Text style={styles.subRowText}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </AccordionItem>
        ))}

        {navbarOffers.length > 0 ? (
          <AccordionItem id="offers" title="OFFERS" titleColor={colors.danger}>
            {navbarOffers.map((offer) => (
              <TouchableOpacity
                key={offer._id}
                onPress={() =>
                  go('Products', {
                    offerId: offer._id,
                    productIds: offer.productIds.join(','),
                    title: offer.name,
                  })
                }
                style={styles.subRow}
              >
                <Text style={styles.subRowText}>{offer.name}</Text>
              </TouchableOpacity>
            ))}
          </AccordionItem>
        ) : null}
      </Accordion>

      <View style={styles.divider} />

      {user ? (
        <>
          <TouchableOpacity style={styles.accountRow} onPress={() => go('Orders')}>
            <Ionicons name="receipt-outline" size={18} color={colors.primary} />
            <Text style={styles.accountRowText}>Track Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.accountRow}
            onPress={async () => {
              await logout();
              navigation.closeDrawer();
            }}
          >
            <Ionicons name="log-out-outline" size={18} color={colors.danger} />
            <Text style={[styles.accountRowText, { color: colors.danger }]}>Logout</Text>
          </TouchableOpacity>
        </>
      ) : (
        <TouchableOpacity style={styles.accountRow} onPress={() => go('Login')}>
          <Ionicons name="log-in-outline" size={18} color={colors.primary} />
          <Text style={styles.accountRowText}>Login / Register</Text>
        </TouchableOpacity>
      )}

      <View style={styles.divider} />

      <TouchableOpacity style={styles.linkRow} onPress={() => go('About')}>
        <Text style={styles.linkRowText}>About Us</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.linkRow} onPress={() => go('Contact')}>
        <Text style={styles.linkRowText}>Contact Us</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.linkRow} onPress={() => go('Careers')}>
        <Text style={styles.linkRowText}>Careers</Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      <TouchableOpacity style={styles.linkRow} onPress={() => go('Policy', { type: 'privacy' })}>
        <Text style={styles.policyText}>Privacy Policy</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.linkRow} onPress={() => go('Policy', { type: 'shipping' })}>
        <Text style={styles.policyText}>Shipping Policy</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.linkRow} onPress={() => go('Policy', { type: 'terms' })}>
        <Text style={styles.policyText}>Terms of Service</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.linkRow} onPress={() => go('Policy', { type: 'returns' })}>
        <Text style={styles.policyText}>Return & Refund Policy</Text>
      </TouchableOpacity>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  content: { paddingHorizontal: spacing.md, paddingTop: spacing.lg, paddingBottom: spacing.xl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  logo: { width: 120, height: 50 },
  plainRow: { paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderLight },
  plainRowText: { fontSize: 15, fontWeight: '700', color: colors.primary, letterSpacing: 0.5 },
  viewAllRow: { paddingVertical: 8 },
  viewAllText: { fontSize: 14, fontWeight: '600', color: colors.info },
  subRow: { paddingVertical: 8 },
  subRowText: { fontSize: 14, color: colors.secondary },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.borderLight, marginVertical: spacing.md },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: spacing.sm },
  accountRowText: { fontSize: 15, fontWeight: '600', color: colors.primary },
  linkRow: { paddingVertical: 8 },
  linkRowText: { fontSize: 14, color: colors.primary },
  policyText: { fontSize: 13, color: colors.secondary },
});
