import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { fetchRestaurantById } from '../services/api';
import { useCart } from '../context/CartContext';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RestaurantScreen({ route, navigation }) {
  const { id } = route.params;
  const { addToCart, cartItems } = useCart();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRestaurant();
  }, []);

  const loadRestaurant = async () => {
    try {
      const { data } = await fetchRestaurantById(id);
      console.log('Restaurant detail fetched successfully');
      setRestaurant(data);
    } catch (error) {
      console.log('Error loading restaurant detail:', error.message);
      if (error.response) {
        console.log('Backend response status:', error.response.status);
        console.log('Backend response data:', error.response.data);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#e53e3e" /></View>;
  }

  if (!restaurant) return <View style={styles.center}><Text>Failed to load.</Text></View>;

  const cartItemCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Image */}
      <Image 
        source={{ uri: restaurant.imageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4' }} 
        style={styles.headerImage} 
      />
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.detailsContainer}>
        <Text style={styles.name}>{restaurant.name}</Text>
        <Text style={styles.cuisine}>{restaurant.cuisine} • {restaurant.address}</Text>
      </View>

      <FlatList
        data={restaurant.products}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.menuItem}>
            <View style={styles.menuInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              {item.description && <Text style={styles.itemDesc}>{item.description}</Text>}
              <Text style={styles.itemPrice}>₹{item.price}</Text>
            </View>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => addToCart(item)}
            >
              <Text style={styles.addText}>ADD</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {cartItemCount > 0 && (
        <TouchableOpacity style={styles.viewCartBtn} onPress={() => navigation.navigate('Cart')}>
          <Text style={styles.viewCartText}>View Cart ({cartItemCount} items)</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fcfcfc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerImage: { width: '100%', height: 250, position: 'absolute', top: 0 },
  backButton: { position: 'absolute', top: 50, left: 20, backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 8 },
  backText: { color: 'white', fontWeight: 'bold' },
  detailsContainer: { marginTop: 200, backgroundColor: '#fcfcfc', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, paddingBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 10 },
  name: { fontSize: 28, fontWeight: '900', color: '#1a202c', marginBottom: 6 },
  cuisine: { fontSize: 14, color: '#718096', fontWeight: '600' },
  list: { padding: 16, paddingBottom: 100 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: 16, borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  menuInfo: { flex: 1, paddingRight: 10 },
  itemName: { fontSize: 16, fontWeight: '800', color: '#2d3748', marginBottom: 4 },
  itemDesc: { fontSize: 12, color: '#a0aec0', marginBottom: 8 },
  itemPrice: { fontSize: 16, fontWeight: '800', color: '#e53e3e' },
  addButton: { paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#fde8e8', borderRadius: 8 },
  addText: { color: '#e53e3e', fontWeight: '800', fontSize: 14 },
  viewCartBtn: { position: 'absolute', bottom: 30, left: 20, right: 20, backgroundColor: '#e53e3e', padding: 16, borderRadius: 16, alignItems: 'center', shadowColor: '#e53e3e', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  viewCartText: { color: 'white', fontWeight: '900', fontSize: 16 }
});
