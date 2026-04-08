import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// In React Native, process.env or import.meta.env depends on your configuration.
// For local development, point it to your computer's IP address instead of localhost.
// Replace this with your actual development machine IP using port 5000:
const API_BASE_URL = "http://192.168.1.100:5000/api"; 

const API = axios.create({
  baseURL: API_BASE_URL,
});

API.interceptors.request.use(async (req) => {
  const token = await AsyncStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export const login = (formData) => API.post("/auth/login", formData);
export const register = (formData) => API.post("/auth/register", formData);

export const fetchRestaurants = () => API.get("/restaurants");
export const fetchRestaurantById = (id) => API.get(`/restaurants/${id}`);

export const fetchMyOrders = () => API.get("/orders/my-orders");
export const fetchOrderById = (id) => API.get(`/orders/${id}`);

// Note: Razorpay integration on RN will require react-native-razorpay module.
export const createRazorpayOrder = (amount) => API.post("/orders/create-order", { amount });
export const verifyPayment = (paymentData) => API.post("/orders/verify-payment", paymentData);

// Cart
export const fetchCart = () => API.get("/cart");
export const syncCart = (items) => API.post("/cart", { items });
export const clearCartApi = () => API.delete("/cart");
