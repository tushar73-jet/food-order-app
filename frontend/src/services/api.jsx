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
  async (error) => {
    const originalRequest = error.config;

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("refreshToken");

      if (refreshToken && !originalRequest.url.includes('/auth/refresh')) {
        try {
          // Use base axios to avoid interceptor loop
          const res = await axios.post(`${API.defaults.baseURL}/auth/refresh`, { refreshToken });
          if (res.data.token) {
            localStorage.setItem("token", res.data.token);
            originalRequest.headers.Authorization = `Bearer ${res.data.token}`;
            return API(originalRequest);
          }
        } catch (refreshError) {
          console.error("Refresh token failed", refreshError);
        }
      }

      // If refresh failed or no refresh token, logout
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      if (!window.location.pathname.includes("/login") && !window.location.pathname.includes("/register")) {
        window.location.href = "/login";
      }
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
export const createRazorpayOrder = (orderData) => API.post("/orders/create-order", orderData);
export const verifyPayment = (paymentData) => API.post("/orders/verify-payment", paymentData);

// Cart
export const fetchCart = () => API.get("/cart");
export const syncCart = (items) => API.post("/cart", { items });
export const clearCartApi = () => API.delete("/cart");

