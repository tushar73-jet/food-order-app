import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { fetchRiderOrders, updateOrderStatus } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RiderDashboardScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
    // In a real app we'd also listen to websockets here to get new dispatched orders instantly
  }, []);

  const loadOrders = async () => {
    try {
      const { data } = await fetchRiderOrders();
      setOrders(data);
    } catch (error) {
      console.log('Error loading rider orders', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeliver = async (id) => {
    try {
      setLoading(true);
      await updateOrderStatus(id, 'DELIVERED');
      loadOrders();
    } catch (e) {
      console.log(e);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    navigation.replace('Login');
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#3182ce" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Rider App</Text>
        <TouchableOpacity onPress={handleLogout}><Text style={styles.logoutText}>Logout</Text></TouchableOpacity>
      </View>

      {orders.length === 0 ? (
        <View style={styles.center}>
            <Text style={{ fontSize: 60, marginBottom: 20 }}>🛵</Text>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#a0aec0' }}>No active deliveries</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.orderId}>Order #{item.id}</Text>
                <Text style={styles.price}>₹{item.totalPrice}</Text>
              </View>
              <Text style={styles.customerName}>👤 {item.user?.name || 'Customer'}</Text>
              <Text style={styles.itemsDesc}>{item.items.length} items to deliver</Text>
              
              <TouchableOpacity 
                style={styles.actionBtn}
                onPress={() => handleDeliver(item.id)}
              >
                <Text style={styles.actionText}>✅ Mark as Delivered</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fcfcfc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center', backgroundColor: '#3182ce' },
  headerTitle: { fontSize: 24, fontWeight: '900', color: 'white' },
  logoutText: { color: 'white', fontWeight: 'bold' },
  list: { padding: 20 },
  card: { backgroundColor: 'white', padding: 20, borderRadius: 16, marginBottom: 16, borderWidth: 2, borderColor: '#ebf8ff', shadowColor: '#3182ce', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  orderId: { fontSize: 22, fontWeight: '900', color: '#2b6cb0' },
  price: { fontSize: 20, fontWeight: '900', color: '#2d3748' },
  customerName: { fontSize: 16, fontWeight: '700', color: '#4a5568', marginBottom: 4 },
  itemsDesc: { color: '#a0aec0', marginBottom: 20, fontWeight: '600' },
  actionBtn: { backgroundColor: '#48bb78', padding: 16, borderRadius: 12, alignItems: 'center' },
  actionText: { color: 'white', fontWeight: '900', fontSize: 16 }
});
