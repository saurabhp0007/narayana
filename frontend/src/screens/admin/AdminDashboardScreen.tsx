import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../../navigation/AdminNavigator';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { logout } from '../../store/slices/authSlice';

type NavigationProp = NativeStackNavigationProp<AdminStackParamList, 'AdminDashboard'>;

interface ManagementCard {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  route: keyof AdminStackParamList;
  description: string;
}

const AdminDashboardScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  const { admin } = useAppSelector((state) => state.auth);

  const managementCards: ManagementCard[] = [
    {
      title: 'Genders',
      icon: 'people',
      color: '#2196f3',
      route: 'AdminGender',
      description: 'Manage gender categories',
    },
    {
      title: 'Categories',
      icon: 'grid',
      color: '#4caf50',
      route: 'AdminCategory',
      description: 'Manage product categories',
    },
    {
      title: 'Subcategories',
      icon: 'list',
      color: '#ff9800',
      route: 'AdminSubcategory',
      description: 'Manage subcategories',
    },
    {
      title: 'Products',
      icon: 'cube',
      color: '#9c27b0',
      route: 'AdminProduct',
      description: 'Manage product catalog',
    },
    {
      title: 'Orders',
      icon: 'receipt',
      color: '#f44336',
      route: 'AdminOrder',
      description: 'View and manage orders',
    },
    {
      title: 'Offers',
      icon: 'pricetag',
      color: '#00bcd4',
      route: 'AdminOffer',
      description: 'Manage offers and discounts',
    },
  ];

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => dispatch(logout()),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.adminName}>{admin?.name || 'Admin'}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#f44336" />
        </TouchableOpacity>
      </View>

      {/* Management Cards */}
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Management</Text>
        <View style={styles.grid}>
          {managementCards.map((card) => (
            <TouchableOpacity
              key={card.route}
              style={styles.card}
              onPress={() => navigation.navigate(card.route)}
            >
              <View style={[styles.iconContainer, { backgroundColor: `${card.color}20` }]}>
                <Ionicons name={card.icon} size={32} color={card.color} />
              </View>
              <Text style={styles.cardTitle}>{card.title}</Text>
              <Text style={styles.cardDescription}>{card.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  welcomeText: {
    fontSize: 14,
    color: '#666',
  },
  adminName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  logoutButton: {
    padding: 8,
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
});

export default AdminDashboardScreen;
