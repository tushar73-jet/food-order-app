import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { createRazorpayOrder, verifyPayment } from "../services/api";
import RazorpayCheckout from "../components/RazorpayCheckout";

const CartPage = () => {
  const { cartItems, removeFromCart, getTotalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [razorpayOrder, setRazorpayOrder] = useState(null);
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
      const { data } = await createRazorpayOrder(getTotalPrice());
      setRazorpayOrder(data);
    } catch (error) {
      console.error("Failed to create Razorpay order", error);
      const errorMessage = error.response?.data?.error || error.message || "Unknown error";
      
      if (errorMessage.includes("not configured") || errorMessage.includes("RAZORPAY")) {
        setPaymentError("⚠️ Payment service is not configured on the server. Please contact the administrator to add Razorpay API keys to the backend environment variables.");
      } else if (error.response?.status === 503) {
        setPaymentError("⚠️ Payment service unavailable. The server needs Razorpay API keys configured. Please contact support.");
      } else if (error.response?.status === 401) {
        setPaymentError("Please login to continue with payment.");
        navigate("/login");
      } else if (error.response?.status >= 500) {
        setPaymentError("Server error. Please try again later or contact support.");
      } else {
        setPaymentError(`Payment initialization failed: ${errorMessage}`);
      }
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (response) => {
    setLoading(true);
    try {
      const { data } = await verifyPayment({
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
        items: cartItems.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
        totalPrice: getTotalPrice(),
      });
      clearCart();
      setRazorpayOrder(null);
      navigate(`/track/${data.id}`);
    } catch (error) {
      console.error("Failed to verify payment and create order", error);
      setPaymentError("Payment succeeded but order creation failed. Please contact support.");
      setLoading(false);
      setRazorpayOrder(null);
    }
  };

  const handlePaymentError = (error) => {
    setPaymentError(error || "Payment failed. Please try again.");
    setLoading(false);
    setRazorpayOrder(null);
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
                <p>₹{Number(item.price)} × {item.quantity}</p>
              </div>
              <div className="cart-item__price">
                ₹{(Number(item.price) * item.quantity).toFixed(2)}
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
            <span className="total-price">₹{getTotalPrice()}</span>
          </div>
          {!token && (
            <p className="cart-summary__note">
              Please <Link to="/login">login</Link> to checkout
            </p>
          )}
          {paymentError && (
            <div className="alert alert-error" style={{ marginBottom: "16px", marginTop: "1rem" }}>
              {paymentError}
            </div>
          )}
          {razorpayOrder && (
            <RazorpayCheckout
              orderId={razorpayOrder.id}
              amount={razorpayOrder.amount}
              currency={razorpayOrder.currency}
              keyId={razorpayOrder.keyId}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          )}
          <button
            onClick={handleCheckout}
            disabled={!token || loading || razorpayOrder}
            className="btn btn-primary btn-large btn-full"
          >
            {loading ? "Processing..." : razorpayOrder ? "Opening Payment..." : "Proceed to Payment"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
