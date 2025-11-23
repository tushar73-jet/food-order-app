import { useEffect } from "react";

export default function RazorpayCheckout({ orderId, amount, currency, keyId, onSuccess, onError }) {
  useEffect(() => {
    const loadRazorpayScript = () => {
      return new Promise((resolve) => {
        if (window.Razorpay) {
          resolve();
          return;
        }
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve();
        script.onerror = () => {
          if (onError) onError("Failed to load Razorpay checkout");
        };
        document.body.appendChild(script);
      });
    };

    const openRazorpay = async () => {
      try {
        await loadRazorpayScript();

        const options = {
          key: keyId,
          amount: amount,
          currency: currency,
          name: "FoodStore",
          description: "Order Payment",
          order_id: orderId,
          handler: function (response) {
            onSuccess(response);
          },
          prefill: {
            name: "",
            email: "",
            contact: "",
          },
          notes: {
            address: "FoodStore Order",
          },
          theme: {
            color: "#6366f1",
          },
          modal: {
            ondismiss: function () {
              if (onError) onError("Payment cancelled by user");
            },
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      } catch (error) {
        if (onError) onError(error.message || "Payment initialization failed");
      }
    };

    if (orderId && keyId) {
      openRazorpay();
    }
  }, [orderId, amount, currency, keyId, onSuccess, onError]);

  return null;
}

