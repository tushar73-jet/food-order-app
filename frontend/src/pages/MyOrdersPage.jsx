import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchMyOrders } from "../services/api";

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    async function loadOrders() {
      try {
        const { data } = await fetchMyOrders();
        setOrders(data);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch orders:", error);
        if (error.response?.status === 401) {
          navigate("/login");
        } else {
          setErrorMsg(error.response?.data?.error || "Failed to load orders. Please try again.");
          setLoading(false);
        }
      }
    }

    loadOrders();
  }, [token, navigate]);

  if (loading) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Loading orders...</h2>
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

  return (
    <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "30px" }}>My Orders</h1>

      {orders.length === 0 ? (
        <div style={{ padding: "40px", textAlign: "center" }}>
          <p style={{ fontSize: "18px", marginBottom: "20px" }}>You haven't placed any orders yet.</p>
          <Link to="/" className="btn btn-primary">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "20px" }}>
          {orders.map((order) => (
            <div
              key={order.id}
              style={{
                padding: "20px",
                background: "#f7f7f7",
                borderRadius: "10px",
                border: "1px solid #ddd",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                <div>
                  <h3 style={{ margin: 0 }}>Order #{order.id}</h3>
                  <p style={{ margin: "5px 0", color: "#666" }}>
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      padding: "8px 16px",
                      background: getStatusColor(order.status),
                      color: "white",
                      borderRadius: "20px",
                      display: "inline-block",
                      fontWeight: "bold",
                    }}
                  >
                    {order.status}
                  </div>
                  <p style={{ margin: "10px 0 0 0", fontSize: "18px", fontWeight: "bold" }}>
                    ${Number(order.totalPrice).toFixed(2)}
                  </p>
                </div>
              </div>

              <div style={{ marginTop: "15px" }}>
                <Link
                  to={`/track/${order.id}`}
                  className="btn btn-primary"
                  style={{ textDecoration: "none" }}
                >
                  Track Order
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getStatusColor(status) {
  const colors = {
    PENDING: "#ff9800",
    PREPARING: "#2196f3",
    OUT_FOR_DELIVERY: "#9c27b0",
    DELIVERED: "#4caf50",
    CANCELLED: "#f44336",
  };
  return colors[status] || "#757575";
}

