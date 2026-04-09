import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { fetchRestaurants } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RestaurantsScreen({ navigation }) {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRestaurants();
  }, []);

  const loadRestaurants = async () => {
    try {
      const { data } = await fetchRestaurants();
      setRestaurants(data);
    } catch (error) {
      console.log('Error loading restaurants', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    navigation.replace('Login');
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#e53e3e" /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={restaurants}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card} 
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Restaurant', { id: item.id })}
          >
            <Image 
              source={{ uri: item.imageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4' }} 
              style={styles.image} 
            />
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.cuisine}>{item.cuisine} • {item.rating || '4.5'} ⭐️</Text>
              <Text style={styles.address}>{item.address}</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      <View style={styles.bottomNav}>
        <TouchableOpacity onPress={() => navigation.navigate('Cart')} style={styles.navButton}>
          <Text style={styles.navText}>🛒 Cart</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Orders')} style={styles.navButton}>
          <Text style={styles.navText}>📦 Orders</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fcfcfc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  headerTitle: { fontSize: 32, fontWeight: '900', color: '#1a202c' },
  logoutText: { color: '#e53e3e', fontWeight: 'bold' },
  list: { padding: 16 },
  card: { backgroundColor: 'white', borderRadius: 16, marginBottom: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 4 },
  image: { width: '100%', height: 200 },
  info: { padding: 16 },
  name: { fontSize: 20, fontWeight: '800', color: '#1a202c', marginBottom: 4 },
  cuisine: { fontSize: 14, color: '#718096', fontWeight: '600', marginBottom: 4 },
  address: { fontSize: 12, color: '#a0aec0' },
  bottomNav: { flexDirection: 'row', padding: 20, backgroundColor: 'white', borderTopWidth: 1, borderColor: '#edf2f7', justifyContent: 'space-around' },
  navButton: { padding: 12, backgroundColor: '#f7fafc', borderRadius: 12, width: '40%', alignItems: 'center' },
  navText: { fontSize: 16, fontWeight: '700', color: '#2d3748' }
});
