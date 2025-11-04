import axios from "axios";

const API = axios.create({ baseURL: "/api" });

// We can add an interceptor to automatically add the auth token to headers
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// Auth routes
export const login = (formData) => API.post("/auth/login", formData);
export const register = (formData) => API.post("/auth/register", formData);

// Restaurant routes
export const fetchRestaurants = () => API.get("/restaurants");
export const fetchRestaurantById = (id) => API.get(`/restaurants/${id}`);

// Product routes
export const fetchProducts = (restaurantId) => 
  API.get("/products", { params: restaurantId ? { restaurantId } : {} });
export const fetchProductById = (id) => API.get(`/products/${id}`);

// Order routes
export const createOrder = (orderData) => API.post("/orders", orderData);