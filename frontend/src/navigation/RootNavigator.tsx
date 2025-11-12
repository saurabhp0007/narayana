import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform } from 'react-native';
import { useAppDispatch, useAppSelector } from '../store/store';
import { checkAuth } from '../store/slices/authSlice';
import AdminNavigator from './AdminNavigator';
import UserNavigator from './UserNavigator';
import AdminLoginScreen from '../screens/admin/AdminLoginScreen';

const Stack = createNativeStackNavigator();

// Linking configuration for React Native Web
const linking = {
  prefixes: ['http://localhost:19006', 'http://localhost:3000'],
  config: {
    screens: {
      Admin: {
        path: 'admin',
        screens: {
          AdminLogin: 'login',
          AdminDashboard: 'dashboard',
          AdminGender: 'genders',
          AdminCategory: 'categories',
          AdminSubcategory: 'subcategories',
          AdminProduct: 'products',
          AdminOrder: 'orders',
          AdminOffer: 'offers',
        },
      },
      User: {
        path: '',
        screens: {
          Home: '',
          ProductList: 'products',
          ProductDetail: 'product/:id',
          Cart: 'cart',
          Wishlist: 'wishlist',
          Checkout: 'checkout',
          OrderSuccess: 'order-success',
        },
      },
    },
  },
};

const RootNavigator: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Check if user is authenticated on app load
    if (Platform.OS === 'web') {
      const path = window.location.pathname;
      if (path.startsWith('/admin')) {
        dispatch(checkAuth());
      }
    }
  }, [dispatch]);

  // Check if we're on admin route (for web)
  const isAdminRoute = Platform.OS === 'web'
    ? window.location.pathname.startsWith('/admin')
    : false;

  return (
    <NavigationContainer linking={Platform.OS === 'web' ? linking : undefined}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAdminRoute ? (
          <>
            {!isAuthenticated ? (
              <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
            ) : (
              <Stack.Screen name="Admin" component={AdminNavigator} />
            )}
          </>
        ) : (
          <Stack.Screen name="User" component={UserNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
