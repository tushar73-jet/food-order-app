import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// We will import screens as they are built
// import RestaurantsScreen from './src/screens/RestaurantsScreen';
// import RestaurantScreen from './src/screens/RestaurantScreen';
// import CartScreen from './src/screens/CartScreen';
// import LoginScreen from './src/screens/LoginScreen';
// import RegisterScreen from './src/screens/RegisterScreen';
// import OrderTrackingScreen from './src/screens/OrderTrackingScreen';
// import MyOrdersScreen from './src/screens/MyOrdersScreen';

import { View, Text } from 'react-native';

const Stack = createNativeStackNavigator();

// Temporary placeholder screens since we haven't built the UI yet
const PlaceholderScreen = ({ route }) => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
    <Text>Screen: {route.name}</Text>
  </View>
);

import { CartProvider } from './src/context/CartContext';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';

export default function App() {
  return (
    <CartProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Restaurants" component={PlaceholderScreen} />
          <Stack.Screen name="Restaurant" component={PlaceholderScreen} />
          <Stack.Screen name="Cart" component={PlaceholderScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Orders" component={PlaceholderScreen} />
          <Stack.Screen name="TrackOrder" component={PlaceholderScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </CartProvider>
  );
}
