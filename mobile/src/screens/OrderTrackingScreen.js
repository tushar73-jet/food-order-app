import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { fetchOrderById } from '../services/api';
import socket from '../utils/socket';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OrderTrackingScreen({ route, navigation }) {
  const { id } = route.params;
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const statuses = ["PENDING", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"];

  useEffect(() => {
    loadOrder();

    socket.emit("join_order", id);
    socket.on("order_status_updated", (data) => {
      setStatus(data.status);
    });

    return () => {
      socket.off("order_status_updated");
    };
  }, [id]);

  const loadOrder = async () => {
    try {
      const { data } = await fetchOrderById(id);
      setOrder(data);
      setStatus(data.status);
    } catch (error) {
      console.log('Error loading tracking', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#e53e3e" /></View>;

  const currentStep = statuses.indexOf(status);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Tracking #{id}</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.trackerBox}>
        {statuses.map((step, index) => {
          const isActive = index <= currentStep;
          return (
            <View key={step} style={styles.stepRow}>
               <View style={styles.iconCol}>
                 <View style={[styles.dot, isActive ? styles.dotActive : null]} />
                 {index < statuses.length - 1 && <View style={[styles.line, isActive ? styles.lineActive : null]} />}
               </View>
               <View style={styles.textCol}>
                 <Text style={[styles.stepText, isActive ? styles.stepTextActive : null]}>{step.replace(/_/g, ' ')}</Text>
               </View>
            </View>
          );
        })}
      </View>
      
      {status === 'DELIVERED' && (
        <View style={styles.successBox}>
          <Text style={{ fontSize: 40, textAlign: 'center' }}>🎉</Text>
          <Text style={styles.successText}>Enjoy your food!</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fcfcfc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#1a202c' },
  backText: { color: '#e53e3e', fontWeight: 'bold' },
  trackerBox: { padding: 40, backgroundColor: 'white', margin: 20, borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 4 },
  stepRow: { flexDirection: 'row', minHeight: 60 },
  iconCol: { width: 40, alignItems: 'center' },
  dot: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#e2e8f0', zIndex: 2 },
  dotActive: { backgroundColor: '#e53e3e' },
  line: { width: 2, height: 44, backgroundColor: '#e2e8f0', position: 'absolute', top: 16 },
  lineActive: { backgroundColor: '#e53e3e' },
  textCol: { flex: 1, paddingLeft: 10, paddingTop: -2 },
  stepText: { fontSize: 16, fontWeight: '700', color: '#a0aec0' },
  stepTextActive: { color: '#1a202c', fontWeight: '900' },
  successBox: { marginHorizontal: 20, padding: 20, backgroundColor: '#f0fff4', borderRadius: 16, alignItems: 'center' },
  successText: { color: '#38a169', fontWeight: '900', fontSize: 20, marginTop: 10 }
});
