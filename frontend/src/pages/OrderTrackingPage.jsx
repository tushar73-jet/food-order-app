import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import socket from "../utils/socket";
import { fetchOrderById } from "../services/api";

export default function OrderTrackingPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!id) {
      setErrorMsg("Invalid order ID");
      setLoading(false);
      return;
    }

    async function loadOrder() {
      try {
        const { data } = await fetchOrderById(id);

        setOrder(data);
        setStatus(data.status);
        setLoading(false);
      } catch (error) {
        if (error.response?.status === 401) {
          setErrorMsg("Please login to view this order.");
        } else if (error.response?.status === 404) {
          setErrorMsg("Order not found.");
        } else {
          setErrorMsg(error.response?.data?.error || "Failed to load order. Please try again.");
        }
        setLoading(false);
      }
    }

    loadOrder();

    // Setup socket connection for real-time updates
    if (socket.connected) {
      socket.emit("join_order_room", id);
    } else {
      socket.once("connect", () => {
        socket.emit("join_order_room", id);
      });
    }

    const handler = (data) => {
      setStatus(data.status);
    };

    socket.on("order_status_updated", handler);

    return () => {
      socket.off("order_status_updated", handler);
    };
  }, [id]);

  if (loading) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Loading order...</h2>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div style={{ padding: 40 }}>
        <h2>{errorMsg}</h2>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ padding: 40 }}>
        <h2>No order found.</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: "40px" }}>
      <h1>Tracking Order #{id}</h1>

      <div
        style={{
          marginTop: "20px",
          padding: "16px",
          background: "#f7f7f7",
          borderRadius: "10px",
          width: "fit-content",
        }}
      >
        <h2>Status: {status}</h2>
      </div>

      <h3 style={{ marginTop: "30px" }}>Items:</h3>

      {order.items?.length > 0 ? (
        order.items.map((item) => (
          <div
            key={item.id}
            style={{
              padding: "10px",
              background: "#eee",
              marginBottom: "10px",
              borderRadius: "8px",
              width: "fit-content",
            }}
          >
            {item.product?.name || "Unknown Product"} × {item.quantity}
          </div>
        ))
      ) : (
        <p>No items found.</p>
      )}
    </div>
  );
}
