import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/user/HomeScreen';
import ProductListScreen from '../screens/user/ProductListScreen';
import ProductDetailScreen from '../screens/user/ProductDetailScreen';
import CartScreen from '../screens/user/CartScreen';
import WishlistScreen from '../screens/user/WishlistScreen';
import CheckoutScreen from '../screens/user/CheckoutScreen';
import OrderSuccessScreen from '../screens/user/OrderSuccessScreen';
import UserLoginScreen from '../screens/user/UserLoginScreen';
import UserRegisterScreen from '../screens/user/UserRegisterScreen';
import UserProfileScreen from '../screens/user/UserProfileScreen';
import AddAddressScreen from '../screens/user/AddAddressScreen';
import ChangePasswordScreen from '../screens/user/ChangePasswordScreen';

export type UserStackParamList = {
  Main: undefined;
  ProductList: { genderId?: string; categoryId?: string; subcategoryId?: string };
  ProductDetail: { productId: string };
  Checkout: undefined;
  OrderSuccess: { orderId: string };
  UserLogin: undefined;
  UserRegister: undefined;
  UserProfile: undefined;
  AddAddress: { mode: 'add' | 'edit'; index?: number; address?: any };
  ChangePassword: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Cart: undefined;
  Wishlist: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<UserStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Bottom Tab Navigator
const MainTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Cart') {
            iconName = focused ? 'cart' : 'cart-outline';
          } else if (route.name === 'Wishlist') {
            iconName = focused ? 'heart' : 'heart-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6200ee',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Cart" component={CartScreen} />
      <Tab.Screen name="Wishlist" component={WishlistScreen} />
      <Tab.Screen name="Profile" component={UserProfileScreen} />
    </Tab.Navigator>
  );
};

// Main Stack Navigator
const UserNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#6200ee',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="Main"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ProductList"
        component={ProductListScreen}
        options={{ title: 'Products' }}
      />
      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{ title: 'Product Details' }}
      />
      <Stack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{ title: 'Checkout' }}
      />
      <Stack.Screen
        name="OrderSuccess"
        component={OrderSuccessScreen}
        options={{ title: 'Order Confirmation', headerLeft: () => null }}
      />
      <Stack.Screen
        name="UserLogin"
        component={UserLoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="UserRegister"
        component={UserRegisterScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AddAddress"
        component={AddAddressScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default UserNavigator;
