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
    'https://naryana-ui-n2rys.ondigitalocean.app',
  ],
  config: {
    screens: {
      AdminLogin: 'adminLogin',
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
              Profile: 'profile',
            },
          },
          ProductList: 'products',
          ProductDetail: 'product/:productId',
          Checkout: 'checkout',
          OrderSuccess: 'order-success/:orderId',
          UserLogin: 'login',
          UserRegister: 'register',
          AddAddress: 'address/add',
          ChangePassword: 'change-password',
        },
      },
    },
  },
};

const RootNavigator: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, loading } = useAppSelector((state) => state.auth);
  const [isCheckingAuth, setIsCheckingAuth] = React.useState(true);

  useEffect(() => {
    // Check authentication status on app load
    const checkAuthStatus = async () => {
      if (Platform.OS === 'web') {
        const path = window.location.pathname;

        // If on admin route or adminLogin, attempt to restore auth state
        if (path.startsWith('/admin') || path === '/adminLogin') {
          try {
            // Try to restore auth from stored token
            await dispatch(checkAuth()).unwrap();
          } catch (error) {
            console.error('Auth check failed:', error);
            // If auth check fails and not on login page, redirect to login
            if (path !== '/adminLogin' && path !== '/admin/login') {
              window.location.href = '/adminLogin';
            }
          }
        }
      }
      setIsCheckingAuth(false);
    };

    checkAuthStatus();
  }, [dispatch]);

  // Redirect to dashboard after successful login
  useEffect(() => {
    if (Platform.OS === 'web' && isAuthenticated && !isCheckingAuth) {
      const path = window.location.pathname;
      if (path === '/adminLogin' || path === '/admin/login') {
        window.location.href = '/admin/dashboard';
      }
    }
  }, [isAuthenticated, isCheckingAuth]);

  // Check if we're on admin route (for web)
  const isAdminRoute = Platform.OS === 'web'
    ? (window.location.pathname.startsWith('/admin') || window.location.pathname === '/adminLogin')
    : false;

  // If admin is authenticated, keep them in admin section regardless of URL
  // This prevents admins from accessing user home/main routes
  const shouldShowAdminSection = isAdminRoute || isAuthenticated;

  // Show loading while checking auth
  if (isCheckingAuth && Platform.OS === 'web' && isAdminRoute) {
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
