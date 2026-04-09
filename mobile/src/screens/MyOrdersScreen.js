import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { fetchMyOrders } from '../services/api';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MyOrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const { data } = await fetchMyOrders();
      setOrders(data);
    } catch (error) {
      console.log('Error fetching orders', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    if (status === 'DELIVERED') return '#48bb78';
    if (status === 'OUT_FOR_DELIVERY') return '#ed8936';
    if (status === 'PREPARING') return '#ecc94b';
    return '#a0aec0';
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#e53e3e" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders</Text>
        <View style={{ width: 50 }} />
      </View>

      <FlatList
        data={orders}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card}
            onPress={() => navigation.navigate('TrackOrder', { id: item.id })}
          >
            <View style={styles.row}>
              <Text style={styles.orderId}>Order #{item.id}</Text>
              <Text style={[styles.status, { color: getStatusColor(item.status) }]}>{item.status}</Text>
            </View>
            <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            
            <View style={styles.itemPreview}>
               {item.items.map(i => (
                 <Text key={i.id} style={styles.itemText}>{i.quantity}x {i.product.name}</Text>
               ))}
            </View>

            <View style={styles.rowBottom}>
              <Text style={styles.total}>Total: ₹{item.totalPrice}</Text>
              <Text style={styles.trackText}>Track Now →</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fcfcfc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#1a202c' },
  backText: { color: '#e53e3e', fontWeight: 'bold' },
  list: { padding: 20 },
  card: { backgroundColor: 'white', padding: 20, borderRadius: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { fontSize: 18, fontWeight: '900' },
  status: { fontSize: 12, fontWeight: '800' },
  date: { color: '#a0aec0', fontSize: 12, marginTop: 4, marginBottom: 12 },
  itemPreview: { backgroundColor: '#f7fafc', padding: 12, borderRadius: 8, marginBottom: 16 },
  itemText: { color: '#4a5568', fontSize: 14, marginBottom: 2 },
  rowBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  total: { fontSize: 16, fontWeight: '800', color: '#e53e3e' },
  trackText: { color: '#3182ce', fontWeight: 'bold' }
});
