import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppDispatch, useAppSelector } from '../store/store';
import { checkAuth } from '../store/slices/authSlice';
import AdminNavigator from './AdminNavigator';
import UserNavigator from './UserNavigator';
import LoginScreen from '../screens/common/LoginScreen';

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
      Login: 'login',
      Admin: {
        path: 'admin',
        screens: {
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
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [userType, setUserType] = React.useState<'admin' | 'user' | null>(null);
  const [initializing, setInitializing] = React.useState(true);

  useEffect(() => {
    // Check authentication status on app load
    const checkAuthStatus = async () => {
      try {
        // Check if user is logged in and what type
        const storedUserType = await AsyncStorage.getItem('userType');
        setUserType(storedUserType as 'admin' | 'user' | null);

        // If admin type stored, try to restore admin auth
        if (storedUserType === 'admin') {
          try {
            await dispatch(checkAuth()).unwrap();
            console.log('Admin auth restored successfully');
          } catch (error) {
            console.error('Admin auth check failed:', error);
            // Clear stored data if auth fails
            await AsyncStorage.removeItem('userType');
            await AsyncStorage.removeItem('adminToken');
            setUserType(null);
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      } finally {
        setInitializing(false);
      }
    };

    checkAuthStatus();
  }, [dispatch]);

  // Listen for userType changes
  useEffect(() => {
    const checkUserType = async () => {
      const storedUserType = await AsyncStorage.getItem('userType');
      if (storedUserType !== userType) {
        setUserType(storedUserType as 'admin' | 'user' | null);
      }
    };

    // Check every second for userType changes (mobile only)
    const interval = setInterval(checkUserType, 1000);
    return () => clearInterval(interval);
  }, [userType]);

  // Determine what to show
  const shouldShowAdmin = isAuthenticated && userType === 'admin';

  // Show loading while initializing
  if (initializing) {
    return null; // or a loading spinner
  }

  console.log('RootNavigator state:', { isAuthenticated, userType, shouldShowAdmin });

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {shouldShowAdmin ? (
          <Stack.Screen name="Admin" component={AdminNavigator} />
        ) : (
          <Stack.Screen name="User" component={UserNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
