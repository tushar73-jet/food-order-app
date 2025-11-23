import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { useCart } from "../context/CartContext";
import { createPaymentIntent, confirmPayment } from "../services/api";
import PaymentForm from "../components/PaymentForm";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const CartPage = () => {
  const { cartItems, removeFromCart, getTotalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [clientSecret, setClientSecret] = useState("");
  const [paymentError, setPaymentError] = useState(null);
  const token = localStorage.getItem("token");

  const handleCheckout = async () => {
    if (!token) {
      navigate("/login");
      return;
    }

    if (cartItems.length === 0) return;

    setLoading(true);
    setPaymentError(null);

    try {
      const { data } = await createPaymentIntent(getTotalPrice());
      setClientSecret(data.clientSecret);
      setShowPayment(true);
    } catch (error) {
      console.error("Failed to create payment intent", error);
      const errorMessage = error.response?.data?.error || error.message;
      if (errorMessage.includes("not configured") || errorMessage.includes("STRIPE_SECRET_KEY")) {
        setPaymentError("Payment service is not configured. Please contact administrator or check SETUP_PAYMENT.md");
      } else {
        setPaymentError(errorMessage || "Failed to initialize payment. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntent) => {
    setLoading(true);
    try {
      const { data } = await confirmPayment({
        paymentIntentId: paymentIntent.id,
        items: cartItems.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
        totalPrice: getTotalPrice(),
      });
      clearCart();
      navigate(`/track/${data.id}`);
    } catch (error) {
      console.error("Failed to confirm payment and create order", error);
      setPaymentError("Payment succeeded but order creation failed. Please contact support.");
      setLoading(false);
    }
  };

  const handlePaymentError = (error) => {
    setPaymentError(error);
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
          {!showPayment ? (
            <button
              onClick={handleCheckout}
              disabled={!token || loading}
              className="btn btn-primary btn-large btn-full"
            >
              {loading ? "Processing..." : "Proceed to Payment"}
            </button>
          ) : (
            <div className="payment-section">
              <div style={{ marginBottom: "1rem" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.5rem" }}>
                  Secure Checkout
                </h3>
                <p style={{ fontSize: "0.9rem", color: "var(--gray)", margin: 0 }}>
                  Your payment information is secure and encrypted
                </p>
              </div>
              {paymentError && (
                <div className="alert alert-error" style={{ marginBottom: "16px" }}>
                  {paymentError}
                </div>
              )}
              {loading && !clientSecret && (
                <div style={{ textAlign: "center", padding: "2rem" }}>
                  <div className="spinner" style={{ margin: "0 auto 1rem" }}></div>
                  <p>Initializing payment...</p>
                </div>
              )}
              {clientSecret && (
                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    appearance: {
                      theme: "stripe",
                      variables: {
                        colorPrimary: "#6366f1",
                        colorBackground: "#ffffff",
                        colorText: "#1f2937",
                        colorDanger: "#ef4444",
                        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
                        spacingUnit: "4px",
                        borderRadius: "8px",
                      },
                    },
                  }}
                >
                  <PaymentForm
                    amount={getTotalPrice()}
                    clientSecret={clientSecret}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                  />
                </Elements>
              )}
              <button
                onClick={() => {
                  setShowPayment(false);
                  setClientSecret("");
                  setPaymentError(null);
                }}
                className="btn btn-outline btn-full"
                style={{ marginTop: "12px" }}
                disabled={loading}
              >
                Cancel Payment
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartPage;
