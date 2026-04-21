import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchCart, syncCart, clearCartApi } from "../services/api";

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isReady, setIsReady] = useState(false);
  const [token, setToken] = useState(null);
  const [lastModified, setLastModified] = useState(0);

  // Initialize cart from AsyncStorage and check for token
  useEffect(() => {
    const initialize = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("token");
        setToken(storedToken);

        const storedCart = await AsyncStorage.getItem("cart");
        const storedTimestamp = await AsyncStorage.getItem("cart_last_modified");
        
        if (storedCart) {
          setCartItems(JSON.parse(storedCart));
          setLastModified(Number(storedTimestamp) || Date.now());
        }
      } catch (error) {
        console.error("❌ Failed to load initial cart/token data:", error);
      } finally {
        setIsReady(true);
      }
    };
    initialize();
  }, []);

  // Fetch cart from backend if logged in
  useEffect(() => {
    const loadCartIfLoggedIn = async () => {
      if (token && isReady) {
        try {
          const { data } = await fetchCart(); // Now returns { items, updatedAt }
          const serverItems = data.items || [];
          const serverUpdatedAt = new Date(data.updatedAt).getTime();

          // 🛡️ Deterministic Sync: Server state wins if it's newer than the last local modification
          if (serverUpdatedAt > lastModified) {
            console.log("🔄 Cart Sync: Server state prioritized (Server is newer)");
            setCartItems(serverItems);
            setLastModified(serverUpdatedAt);
            await AsyncStorage.setItem("cart", JSON.stringify(serverItems));
            await AsyncStorage.setItem("cart_last_modified", serverUpdatedAt.toString());
          } else if (cartItems.length > 0) {
            console.log("📤 Cart Sync: Pushing local state to server (Local is newer)");
            await syncCart(cartItems);
          }
        } catch (error) {
          console.warn("⚠️  Cart Sync Failed: Backend unreachable or session expired. Local state preserved.", error);
        }
      }
    };
    loadCartIfLoggedIn();
  }, [token, isReady]);

  // Sync cart with backend and AsyncStorage on change
  useEffect(() => {
    if (!isReady) return; 

    const saveAndSync = async () => {
      try {
        const now = Date.now();
        await AsyncStorage.setItem("cart", JSON.stringify(cartItems));
        await AsyncStorage.setItem("cart_last_modified", now.toString());

        if (token) {
          await syncCart(cartItems);
        }
      } catch (error) {
        console.warn("⚠️  Sync failure: Could not persist cart to server. Will retry on next update.", error);
      }
    };

    const timeoutId = setTimeout(saveAndSync, 500); // Debounce sync
    return () => clearTimeout(timeoutId);
  }, [cartItems, token, isReady]);

  const addToCart = (product) => {
    setLastModified(Date.now());
    setCartItems((prevItems) => {
      const exist = prevItems.find((item) => item.id === product.id);
      if (exist) {
        return prevItems.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prevItems, { ...product, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (productId) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.id !== productId)
    );
  };

  const clearCart = async () => {
    setCartItems([]);
    if (token) {
      try {
        await clearCartApi();
      } catch (error) {
        console.error("Failed to clear cart on server:", error);
      }
    }
  };

  const getTotalPrice = () => {
    return cartItems
      .reduce((total, item) => total + Number(item.price) * item.quantity, 0)
      .toFixed(2);
  };

  // Allow triggering a refetch of token manually when user logs in/out
  const refreshToken = async () => {
    const storedToken = await AsyncStorage.getItem("token");
    setToken(storedToken);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        clearCart,
        getTotalPrice,
        refreshToken, // Call this component after login/logout
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
