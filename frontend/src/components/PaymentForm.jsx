import { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

export default function PaymentForm({ amount, clientSecret, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message);
      setLoading(false);
      return;
    }

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin,
      },
      redirect: "if_required",
    });

    if (confirmError) {
      setError(confirmError.message);
      setLoading(false);
      if (onError) onError(confirmError.message);
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      onSuccess(paymentIntent);
    } else {
      setError("Payment failed. Please try again.");
      setLoading(false);
      if (onError) onError("Payment failed. Please try again.");
    }
  };

  return (
    <div className="payment-form-wrapper">
      <h3 style={{ marginBottom: "1rem", fontSize: "1.25rem", fontWeight: 600 }}>
        Payment Details
      </h3>
      <form onSubmit={handleSubmit} className="payment-form">
        <div className="payment-element-wrapper">
          <PaymentElement />
        </div>
        {error && (
          <div className="alert alert-error" style={{ marginTop: "16px" }}>
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={!stripe || loading}
          className="btn btn-primary btn-large btn-full"
          style={{ marginTop: "20px" }}
        >
          {loading ? (
            <>
              <span className="spinner-small" style={{ display: "inline-block", marginRight: "8px" }}></span>
              Processing Payment...
            </>
          ) : (
            `Pay $${parseFloat(amount).toFixed(2)}`
          )}
        </button>
      </form>
    </div>
  );
}

