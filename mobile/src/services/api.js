import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { API_URL } from "../config";

const API_BASE_URL = API_URL;
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

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
      // Optional: Navigation redirect can be handled via state or a global emitter
    }
    return Promise.reject(error);
  }
);

export const login = (formData) => API.post("/auth/login", formData);
export const register = (formData) => API.post("/auth/register", formData);

export const fetchRestaurants = () => API.get("/restaurants");
export const fetchRestaurantById = (id) => API.get(`/restaurants/${id}`);

export const fetchMyOrders = () => API.get("/orders/my-orders");
export const fetchOrderById = (id) => API.get(`/orders/${id}`);

// Note: Razorpay integration on RN will require react-native-razorpay module.
export const createRazorpayOrder = (items) => API.post("/orders/create-order", { items });
export const verifyPayment = (paymentData) => API.post("/orders/verify-payment", paymentData);

// Rider
export const fetchRiderOrders = () => API.get("/orders/rider/active");
export const updateOrderStatus = (id, status) => API.put(`/orders/${id}/status`, { status });

// Cart
export const fetchCart = () => API.get("/cart");
export const syncCart = (items) => API.post("/cart", { items });
export const clearCartApi = () => API.delete("/cart");
