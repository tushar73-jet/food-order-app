import { createContext, useState, useContext, useEffect } from "react";
import { fetchCart, syncCart, clearCartApi } from "../services/api";

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const storedCart = localStorage.getItem("cart");
    return storedCart ? JSON.parse(storedCart) : [];
  });
  const token = localStorage.getItem("token");

  // Fetch cart from backend on mount if logged in
  useEffect(() => {
    const loadCart = async () => {
      if (token) {
        try {
          const { data } = await fetchCart();
          if (data && data.length > 0) {
            setCartItems(data);
          } else if (cartItems.length > 0) {
            // If local cart has items but database is empty, sync local to DB
            await syncCart(cartItems);
          }
        } catch (error) {
          console.error("Failed to fetch cart:", error);
        }
      }
    };
    loadCart();
  }, [token]);

  // Sync cart with backend and localStorage on change
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems));

    const syncWithBackend = async () => {
      if (token) {
        try {
          await syncCart(cartItems);
        } catch (error) {
          console.error("Failed to sync cart:", error);
        }
      }
    };

    const timeoutId = setTimeout(syncWithBackend, 500); // Debounce sync
    return () => clearTimeout(timeoutId);
  }, [cartItems, token]);

  const addToCart = (product) => {
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

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        clearCart,
        getTotalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};