import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Image } from 'react-native';
import { Text, Card, Button, FAB, ActivityIndicator } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { useIsFocused } from '@react-navigation/native';
import { getCurrentUser, getUserProfile, getDashboardStats, getUserDeliveries } from '../services/supabaseService';

import DashboardSummary from '../components/DashboardSummary';
import DeliveryList from '../components/DeliveryList';

const HomeScreen = ({ navigation }) => {
  const [userName, setUserName] = useState('');
  const [dashboardData, setDashboardData] = useState({
    todayDeliveries: 0,
    pendingDeliveries: 0,
    completedDeliveries: 0,
    fuelSaved: 0
  });
  const [recentDeliveries, setRecentDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const isFocused = useIsFocused();

  useEffect(() => {
    getUserInfo();
    if (isFocused) {
      fetchDashboardData();
      fetchRecentDeliveries();
    }
  }, [isFocused]);

  const getUserInfo = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        const profile = await getUserProfile(currentUser.id);
        if (profile) {
          setUserName(profile.full_name || 'Usuario');
        }
        // Return user for use in other functions
        return currentUser;
      }
      return null;
    } catch (error) {
      console.error('Error retrieving user info:', error);
      return null;
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        throw new Error('No user found');
      }
      
      const stats = await getDashboardStats(currentUser.id);
      if (stats) {
        setDashboardData(stats);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set default values on error
      setDashboardData({
        todayDeliveries: 0,
        pendingDeliveries: 0,
        completedDeliveries: 0,
        fuelSaved: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentDeliveries = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        throw new Error('No user found');
      }
      
      const result = await getUserDeliveries(currentUser.id, null, 5); // Get last 5 deliveries
      if (result && result.success && result.deliveries && result.deliveries.length > 0) {
        setRecentDeliveries(result.deliveries);
      } else {
        setRecentDeliveries([]);
      }
    } catch (error) {
      console.error('Error fetching recent deliveries:', error);
      setRecentDeliveries([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchDashboardData(), fetchRecentDeliveries()]);
    setRefreshing(false);
  };

  const handleLogout = async () => {
    try {
      const { logout } = require('../services/supabaseService');
      await logout();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#0047AB" />
      
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Image 
            source={require('../../images/Logo-1.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Button
            mode="text"
            icon="logout"
            onPress={handleLogout}
            style={styles.logoutButton}
            labelStyle={styles.logoutButtonLabel}
            compact
          >
            Cerrar Sesión
          </Button>
        </View>
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>Hola, {userName}</Text>
          </View>
          <Button
            mode="contained"
            icon="plus"
            onPress={() => navigation.navigate('RouteOptimization')}
            style={styles.addButton}
            labelStyle={styles.addButtonLabel}
            compact
          >
            Nueva Ruta
          </Button>
        </View>
      </View>
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0047AB']} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0047AB" />
          </View>
        ) : (
          <>
            <DashboardSummary data={dashboardData} />
            
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Entregas Recientes</Text>
                <Button 
                  mode="text" 
                  onPress={() => navigation.navigate('DeliveryHistory')}
                >
                  Ver todas
                </Button>
              </View>
              
              {recentDeliveries.length > 0 ? (
                <DeliveryList 
                  deliveries={recentDeliveries} 
                  onPressItem={(delivery) => navigation.navigate('RouteDetails', { deliveryId: delivery.id })}
                />
              ) : (
                <Card style={styles.emptyCard}>
                  <Card.Content>
                    <Text style={styles.emptyText}>No hay entregas recientes</Text>
                  </Card.Content>
                </Card>
              )}
            </View>
            
            <Card style={styles.optimizationCard}>
              <Card.Content>
                <Text style={styles.optimizationTitle}>Optimiza tus rutas</Text>
                <Text style={styles.optimizationText}>
                  Ahorra tiempo y combustible optimizando tus rutas de entrega
                </Text>
              </Card.Content>
              <Card.Actions>
                <Button 
                  mode="contained" 
                  onPress={() => navigation.navigate('RouteOptimization')}
                  style={styles.optimizationButton}
                >
                  Optimizar ruta
                </Button>
              </Card.Actions>
            </Card>
          </>
        )}
      </ScrollView>

      {/* AI Chat FAB Button */}
      <FAB
        icon="robot"
        label="Asistente IA"
        style={styles.fab}
        onPress={() => navigation.navigate('AIChat')}
        color="#FFFFFF"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#0047AB',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    width: 50,
    height: 50,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  headerText: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  addButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  addButtonLabel: {
    color: '#0047AB',
    fontWeight: 'bold',
    fontSize: 12,
  },
  logoutButton: {
    backgroundColor: 'transparent',
  },
  logoutButtonLabel: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  section: {
    marginTop: 20,
    marginHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  emptyCard: {
    marginBottom: 16,
    alignItems: 'center',
    padding: 10,
  },
  emptyText: {
    color: '#888888',
    textAlign: 'center',
    padding: 16,
  },
  optimizationCard: {
    margin: 16,
    marginTop: 24,
    marginBottom: 30,
  },
  optimizationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  optimizationText: {
    color: '#666666',
    marginBottom: 8,
  },
  optimizationButton: {
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#0047AB',
  },
});

export default HomeScreen;
