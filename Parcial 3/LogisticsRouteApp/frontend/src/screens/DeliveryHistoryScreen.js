import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Searchbar, Chip, ActivityIndicator } from 'react-native-paper';
import { getUserDeliveries, getCurrentUser } from '../services/supabaseService';

import DeliveryList from '../components/DeliveryList';

const DeliveryHistoryScreen = ({ navigation }) => {
  const [deliveries, setDeliveries] = useState([]);
  const [filteredDeliveries, setFilteredDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  useEffect(() => {
    fetchDeliveries();
    
    // Auto-refresh cuando se navega a esta pantalla
    const unsubscribe = navigation.addListener('focus', () => {
      fetchDeliveries();
    });
    
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    filterDeliveries();
  }, [searchQuery, selectedFilter, deliveries]);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        console.error('No user found');
        setDeliveries([]);
        return;
      }
      
      const result = await getUserDeliveries(currentUser.id);
      
      if (result && result.success && result.deliveries && result.deliveries.length > 0) {
        setDeliveries(result.deliveries);
      } else {
        setDeliveries([]);
      }
    } catch (error) {
      console.error('Error fetching deliveries:', error);
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDeliveries();
    setRefreshing(false);
  };

  const filterDeliveries = () => {
    let filtered = [...deliveries];

    // Filter by status
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(delivery => delivery.status === selectedFilter);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(delivery => {
        const searchLower = searchQuery.toLowerCase();
        const hasMatchingDestination = delivery.destinations && delivery.destinations.some(dest => 
          dest.address && dest.address.toLowerCase().includes(searchLower)
        );
        const hasMatchingDate = delivery.createdAt && 
          new Date(delivery.createdAt).toLocaleDateString().includes(searchLower);
        
        return hasMatchingDestination || hasMatchingDate;
      });
    }

    setFilteredDeliveries(filtered);
  };

  const getStatusStats = () => {
    return {
      all: deliveries.length,
      pending: deliveries.filter(d => d.status === 'pending').length,
      in_progress: deliveries.filter(d => d.status === 'in_progress').length,
      completed: deliveries.filter(d => d.status === 'completed').length,
    };
  };

  const stats = getStatusStats();

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Buscar entregas..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        <Chip
          selected={selectedFilter === 'all'}
          onPress={() => setSelectedFilter('all')}
          style={styles.chip}
          textStyle={styles.chipText}
          compact={true}
        >
          Todas ({stats.all})
        </Chip>
        <Chip
          selected={selectedFilter === 'pending'}
          onPress={() => setSelectedFilter('pending')}
          style={styles.chip}
          textStyle={styles.chipText}
          compact={true}
        >
          Pendientes ({stats.pending})
        </Chip>
        <Chip
          selected={selectedFilter === 'in_progress'}
          onPress={() => setSelectedFilter('in_progress')}
          style={styles.chip}
          textStyle={styles.chipText}
          compact={true}
        >
          En progreso ({stats.in_progress})
        </Chip>
        <Chip
          selected={selectedFilter === 'completed'}
          onPress={() => setSelectedFilter('completed')}
          style={styles.chip}
          textStyle={styles.chipText}
          compact={true}
        >
          Completadas ({stats.completed})
        </Chip>
      </ScrollView>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0047AB" />
        </View>
      ) : (
        <ScrollView
          style={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0047AB']} />
          }
        >
          {filteredDeliveries.length > 0 ? (
            <DeliveryList 
              deliveries={filteredDeliveries}
              onPressItem={(delivery) => navigation.navigate('RouteDetails', { deliveryId: delivery.id })}
            />
          ) : (
            <Card style={styles.emptyCard}>
              <Card.Content>
                <Text style={styles.emptyText}>
                  {searchQuery || selectedFilter !== 'all' 
                    ? 'No se encontraron entregas con los filtros seleccionados'
                    : 'No tienes entregas registradas aún'}
                </Text>
              </Card.Content>
            </Card>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    elevation: 0,
    backgroundColor: '#F5F5F5',
  },
  filterContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 12,
    maxHeight: 60,
  },
  filterContent: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  chip: {
    marginRight: 8,
    height: 32,
  },
  chipText: {
    fontSize: 13,
    marginVertical: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  listContainer: {
    flex: 1,
    padding: 16,
  },
  emptyCard: {
    marginTop: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666666',
    padding: 20,
  },
});

export default DeliveryHistoryScreen;