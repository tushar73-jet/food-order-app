import axios from "axios";
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export const login = (formData) => API.post("/auth/login", formData);
export const register = (formData) => API.post("/auth/register", formData);

export const fetchRestaurants = () => API.get("/restaurants");
export const fetchRestaurantById = (id) => API.get(`/restaurants/${id}`);

export const createOrder = (orderData) => API.post("/orders", orderData);
export const fetchMyOrders = () => API.get("/orders/my-orders");
export const fetchOrderById = (id) => API.get(`/orders/${id}`);
export const createRazorpayOrder = (amount) =>
  API.post("/orders/create-order", { amount });
export const verifyPayment = (paymentData) =>
  API.post("/orders/verify-payment", paymentData);
