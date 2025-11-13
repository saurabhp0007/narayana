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
  prefixes: [
    'http://localhost:19006',
    'http://localhost:3000',
    'https://narayana-qm1hbxpxc-saurabhs-projects-2660e0f6.vercel.app',
  ],
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
          Main: {
            path: '',
            screens: {
              Home: '',
              Cart: 'cart',
              Wishlist: 'wishlist',
            },
          },
          ProductList: 'products',
          ProductDetail: 'product/:id',
          Checkout: 'checkout',
          OrderSuccess: 'order-success',
        },
      },
    },
  },
};

const RootNavigator: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, loading } = useAppSelector((state) => state.auth);
  const [initialCheckDone, setInitialCheckDone] = React.useState(false);

  useEffect(() => {
    // Check authentication status on app load
    const checkAuthStatus = async () => {
      if (Platform.OS === 'web') {
        const path = window.location.pathname;

        // If on admin route (but not login), try to restore session
        if (path.startsWith('/admin') && path !== '/admin/login') {
          try {
            await dispatch(checkAuth()).unwrap();
          } catch (error) {
            // Auth failed - will show login screen based on isAuthenticated state
            console.log('Auth check failed, showing login');
          }
        }
      }
      setInitialCheckDone(true);
    };

    checkAuthStatus();
  }, [dispatch]);

  // Check if we're on admin route (for web)
  const isAdminRoute = Platform.OS === 'web'
    ? window.location.pathname.startsWith('/admin')
    : false;

  // If admin is authenticated, keep them in admin section
  // This prevents admins from accessing user home/main routes
  const shouldShowAdminSection = isAdminRoute || isAuthenticated;

  // Show loading while checking auth on initial load for admin routes
  if (!initialCheckDone && Platform.OS === 'web' && isAdminRoute) {
    return null; // or a loading spinner
  }

  return (
    <NavigationContainer linking={Platform.OS === 'web' ? linking : undefined}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {shouldShowAdminSection ? (
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
