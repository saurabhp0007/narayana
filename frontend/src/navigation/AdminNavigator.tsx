import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import GenderManagementScreen from '../screens/admin/GenderManagementScreen';
import CategoryManagementScreen from '../screens/admin/CategoryManagementScreen';
import SubcategoryManagementScreen from '../screens/admin/SubcategoryManagementScreen';
import ProductManagementScreen from '../screens/admin/ProductManagementScreen';
import OrderManagementScreen from '../screens/admin/OrderManagementScreen';
import OfferManagementScreen from '../screens/admin/OfferManagementScreen';

export type AdminStackParamList = {
  AdminDashboard: undefined;
  AdminGender: undefined;
  AdminCategory: undefined;
  AdminSubcategory: undefined;
  AdminProduct: undefined;
  AdminOrder: undefined;
  AdminOffer: undefined;
};

const Stack = createNativeStackNavigator<AdminStackParamList>();

const AdminNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="AdminDashboard"
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
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{ title: 'Admin Dashboard' }}
      />
      <Stack.Screen
        name="AdminGender"
        component={GenderManagementScreen}
        options={{ title: 'Gender Management' }}
      />
      <Stack.Screen
        name="AdminCategory"
        component={CategoryManagementScreen}
        options={{ title: 'Category Management' }}
      />
      <Stack.Screen
        name="AdminSubcategory"
        component={SubcategoryManagementScreen}
        options={{ title: 'Subcategory Management' }}
      />
      <Stack.Screen
        name="AdminProduct"
        component={ProductManagementScreen}
        options={{ title: 'Product Management' }}
      />
      <Stack.Screen
        name="AdminOrder"
        component={OrderManagementScreen}
        options={{ title: 'Order Management' }}
      />
      <Stack.Screen
        name="AdminOffer"
        component={OfferManagementScreen}
        options={{ title: 'Offer Management' }}
      />
    </Stack.Navigator>
  );
};

export default AdminNavigator;
