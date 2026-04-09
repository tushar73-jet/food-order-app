import axios from "axios";
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const login = (formData) => API.post("/auth/login", formData);
export const register = (formData) => API.post("/auth/register", formData);
export const forgotPassword = (email) => API.post("/auth/forgot-password", { email });
export const resetPassword = (token, password) => API.post(`/auth/reset-password/${token}`, { password });
export const fetchAllUsers = () => API.get("/auth/users");
export const updateUserRole = (id, role) => API.put(`/auth/users/${id}/role`, { role });

export const fetchRestaurants = () => API.get("/restaurants");
export const fetchRestaurantById = (id) => API.get(`/restaurants/${id}`);

export const fetchMyOrders = () => API.get("/orders/my-orders");
export const fetchOrderById = (id) => API.get(`/orders/${id}`);
export const fetchAllAdminOrders = () => API.get("/orders/admin/all");
export const updateOrderStatus = (id, status) => API.put(`/orders/${id}/status`, { status });
export const createRazorpayOrder = (items) => API.post("/orders/create-order", { items });
export const verifyPayment = (paymentData) => API.post("/orders/verify-payment", paymentData);

// Cart
export const fetchCart = () => API.get("/cart");
export const syncCart = (items) => API.post("/cart", { items });
export const clearCartApi = () => API.delete("/cart");

