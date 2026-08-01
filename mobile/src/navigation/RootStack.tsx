import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';
import { BottomTabBar } from '../components/common/BottomTabBar';

// Screens
import { HomeScreen } from '../screens/HomeScreen';
import { ProductsScreen } from '../screens/ProductsScreen';
import { ProductDetailScreen } from '../screens/ProductDetailScreen';
import { CartScreen } from '../screens/CartScreen';
import { WishlistScreen } from '../screens/WishlistScreen';
import { OrdersScreen } from '../screens/OrdersScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { OffersScreen } from '../screens/OffersScreen';
import { CategoriesScreen } from '../screens/CategoriesScreen';
import { AboutScreen } from '../screens/AboutScreen';
import { CareersScreen } from '../screens/CareersScreen';
import { ContactScreen } from '../screens/ContactScreen';
import { PolicyScreen } from '../screens/PolicyScreen';

const Stack = createNativeStackNavigator();

// A single flat stack — every screen (not just the 5 "tab" destinations) is a
// sibling here, so the persistent BottomTabBar rendered below it stays
// visible everywhere instead of disappearing whenever a screen outside a
// bottom-tabs navigator gets pushed.
export const RootStack = () => {
  const { user, loadFromStorage } = useAuthStore();
  const { fetchCount: fetchCartCount } = useCartStore();
  const { fetchCount: fetchWishlistCount } = useWishlistStore();

  useEffect(() => {
    loadFromStorage();
  }, []);

  useEffect(() => {
    if (user) {
      fetchCartCount();
      fetchWishlistCount();
    }
  }, [user]);

  return (
    <View style={styles.container}>
      <View style={styles.stackArea}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Products" component={ProductsScreen} />
          <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
          <Stack.Screen name="Cart" component={CartScreen} />
          <Stack.Screen name="Wishlist" component={WishlistScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Orders" component={OrdersScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Offers" component={OffersScreen} />
          <Stack.Screen name="Categories" component={CategoriesScreen} />
          <Stack.Screen name="About" component={AboutScreen} />
          <Stack.Screen name="Careers" component={CareersScreen} />
          <Stack.Screen name="Contact" component={ContactScreen} />
          <Stack.Screen name="Policy" component={PolicyScreen} />
        </Stack.Navigator>
      </View>
      <BottomTabBar />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  stackArea: { flex: 1 },
});
