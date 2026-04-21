import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useCart } from '../context/CartContext';
import { verifyPayment } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CartScreen({ navigation }) {
  const { cartItems, removeFromCart, addToCart, clearCart, getTotalPrice } = useCart();
  const [loading, setLoading] = useState(false);

  const subtotal = Number(getTotalPrice());
  const tax = subtotal * 0.05;
  const grandTotal = subtotal + tax;

  const handleCheckout = async () => {
    const token = await AsyncStorage.getItem("token");
    if (!token) {
      navigation.navigate("Login");
      return;
    }

    setLoading(true);
    try {
      /**
       * 💡 Portfolio Note: 
       * This uses an explicit "Demo Payment" signature which is only accepted
       * by the backend if ALLOW_DEMO_PAYMENTS=true is set in the environment.
       */
      const payload = {
        razorpay_order_id: "MOBILE_TEST_ORDER",
        razorpay_payment_id: "MOBILE_TEST_PAYMENT",
        razorpay_signature: "MOBILE_TEST_SIG",
        items: cartItems.map(item => ({ productId: item.id, quantity: item.quantity })),
      };
      
      const { data } = await verifyPayment(payload);
      clearCart();
      navigation.navigate('TrackOrder', { id: data.id });
    } catch (error) {
      const errorDetail = error.response?.data?.error || "Payment verification failed.";
      Alert.alert(
        "Checkout Restricted", 
        `${errorDetail}\n\nNote: For portfolio review, ensure ALLOW_DEMO_PAYMENTS=true is set on the backend.`
      );
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={{ fontSize: 60, marginBottom: 20 }}>🛒</Text>
        <Text style={styles.emptyText}>Your basket is empty</Text>
        <TouchableOpacity style={styles.checkoutBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.checkoutText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Basket</Text>
        <View style={{ width: 50 }} />
      </View>

      <FlatList
        data={cartItems}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.cartItem}>
             <View style={styles.itemInfo}>
               <Text style={styles.itemName}>{item.name}</Text>
               <Text style={styles.itemPrice}>₹{item.price}</Text>
             </View>
             <View style={styles.controls}>
               <TouchableOpacity onPress={() => removeFromCart(item.id)} style={styles.ctrlBtn}><Text style={styles.ctrlText}>-</Text></TouchableOpacity>
               <Text style={styles.qty}>{item.quantity}</Text>
               <TouchableOpacity onPress={() => addToCart(item)} style={styles.ctrlBtn}><Text style={styles.ctrlText}>+</Text></TouchableOpacity>
             </View>
          </View>
        )}
      />

      <View style={styles.summaryBox}>
        <View style={styles.row}><Text style={styles.summaryLabel}>Subtotal</Text><Text style={styles.summaryVal}>₹{subtotal.toFixed(2)}</Text></View>
        <View style={styles.row}><Text style={styles.summaryLabel}>GST (5%)</Text><Text style={styles.summaryVal}>₹{tax.toFixed(2)}</Text></View>
        <View style={[styles.row, { marginTop: 10, borderTopWidth: 1, borderColor: '#edf2f7', paddingTop: 10 }]}>
          <Text style={styles.totalLabel}>Total</Text><Text style={styles.totalVal}>₹{grandTotal.toFixed(2)}</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.checkoutBtn} 
          onPress={handleCheckout} 
          disabled={loading}
        >
          <Text style={styles.checkoutText}>{loading ? "Processing..." : "Secure Checkout (Demo Mode)"}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fcfcfc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fcfcfc' },
  emptyText: { fontSize: 24, fontWeight: '800', color: '#a0aec0', marginBottom: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#1a202c' },
  backText: { color: '#e53e3e', fontWeight: 'bold' },
  list: { padding: 20 },
  cartItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: 16, borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: '800' },
  itemPrice: { fontSize: 14, color: '#718096', marginTop: 4 },
  controls: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f7fafc', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4 },
  ctrlBtn: { padding: 8 },
  ctrlText: { fontSize: 18, fontWeight: '900', color: '#e53e3e' },
  qty: { marginHorizontal: 12, fontWeight: 'bold' },
  summaryBox: { padding: 24, backgroundColor: 'white', borderTopLeftRadius: 30, borderTopRightRadius: 30, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { color: '#718096', fontWeight: '600' },
  summaryVal: { fontWeight: '700' },
  totalLabel: { fontSize: 20, fontWeight: '900' },
  totalVal: { fontSize: 24, fontWeight: '900', color: '#e53e3e' },
  checkoutBtn: { marginTop: 20, backgroundColor: '#e53e3e', padding: 16, borderRadius: 16, alignItems: 'center' },
  checkoutText: { color: 'white', fontWeight: '900', fontSize: 16 }
});
