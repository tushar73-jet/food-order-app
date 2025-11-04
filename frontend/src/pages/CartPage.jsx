import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { createOrder } from "../services/api";

const CartPage = () => {
  const { cartItems, removeFromCart, getTotalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("token");

  const handleCheckout = async () => {
    if (!token) {
      navigate("/login");
      return;
    }

    if (cartItems.length === 0) return;

    setLoading(true);
    try {
      await createOrder({
        items: cartItems.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
        totalPrice: getTotalPrice(),
      });
      clearCart();
      navigate("/");
    } catch (error) {
      console.error("Failed to place order", error);
      alert("Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="cart-page">
        <h2 className="page-title">Your Cart</h2>
        <div className="empty-state">
          <p>Your cart is empty</p>
          <Link to="/" className="btn btn-primary">Start Shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h2 className="page-title">Your Cart</h2>
      <div className="cart">
        <div className="cart__items">
          {cartItems.map((item) => (
            <div key={item.id} className="cart-item">
              <img
                src={item.imageUrl || "https://via.placeholder.com/100"}
                alt={item.name}
                className="cart-item__image"
              />
              <div className="cart-item__info">
                <h4>{item.name}</h4>
                <p>${Number(item.price)} × {item.quantity}</p>
              </div>
              <div className="cart-item__price">
                ${(Number(item.price) * item.quantity).toFixed(2)}
              </div>
              <button
                onClick={() => removeFromCart(item.id)}
                className="btn btn-danger btn-icon"
                aria-label="Remove item"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <div className="cart__summary">
          <div className="cart-summary__total">
            <span>Total:</span>
            <span className="total-price">${getTotalPrice()}</span>
          </div>
          {!token && (
            <p className="cart-summary__note">
              Please <Link to="/login">login</Link> to checkout
            </p>
          )}
          <button
            onClick={handleCheckout}
            disabled={!token || loading}
            className="btn btn-primary btn-large btn-full"
          >
            {loading ? "Processing..." : "Proceed to Checkout"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
