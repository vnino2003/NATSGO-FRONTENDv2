// src/services/api/http.js
import axios from "axios";

export const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

export const STATIC_BASE = API_BASE.replace(/\/api\/?$/, "");

export function toStaticUrl(url) {
  if (!url) return null;
  if (String(url).startsWith("http")) return url;

  const base = STATIC_BASE.replace(/\/$/, "");
  const path = String(url).startsWith("/") ? url : `/${url}`;

  return `${base}${path}`;
}

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const adminToken = localStorage.getItem("natsgo_admin_token");
    const commuterToken = localStorage.getItem("natsgo_commuter_token");

    const token = adminToken || commuterToken;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API error:", {
      baseURL: error?.config?.baseURL,
      url: error?.config?.url,
      method: error?.config?.method,
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message,
    });

    if (error?.response?.status === 401) {
      localStorage.removeItem("natsgo_admin_token");
      localStorage.removeItem("natsgo_admin_user");
      localStorage.removeItem("natsgo_commuter_token");
      localStorage.removeItem("natsgo_commuter_user");
    }

    return Promise.reject(error);
  }
);

export default api;