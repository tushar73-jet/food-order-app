import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import { fetchOrderById } from "../services/api";

const socket = io(import.meta.env.VITE_API_URL);

const OrderTrackingPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const { data } = await fetchOrderById(id);
        setOrder(data);
        setStatus(data.status);
      } catch (error) {
        console.error("Failed to load order");
      }
    };
    loadOrder();

    socket.emit("join_order_room", id);

    socket.on("order_status_updated", (data) => {
      setStatus(data.status);
      alert(`Order Update: Your order is now ${data.status}`);
    });

    return () => {
      socket.off("order_status_updated");
    };
  }, [id]);

  if (!order) return <div className="p-8 text-center">Loading order...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Track Order #{order.id}</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex justify-between items-center mb-4">
          <span className="text-gray-600">Status:</span>
          <span className={`px-4 py-2 rounded-full text-white font-bold ${
            status === 'DELIVERED' ? 'bg-green-500' : 'bg-blue-500'
          }`}>
            {status}
          </span>
        </div>
        <p className="text-xl font-semibold">Total: ${order.totalPrice}</p>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-lg">Order Items:</h3>
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between border-b py-2">
            <span>{item.product.name} x {item.quantity}</span>
            <span>${(item.product.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderTrackingPage;