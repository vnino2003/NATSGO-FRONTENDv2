// src/services/api/http.js
import axios from "axios";

export const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

// Static base removes trailing /api
// Example:
// API_BASE = https://backend.up.railway.app/api
// STATIC_BASE = https://backend.up.railway.app
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

    return Promise.reject(error);
  }
);

export default api;