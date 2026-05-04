// // src/services/api/http.js
// import axios from "axios";

// const api = axios.create({
//   baseURL: import.meta.env.VITE_API_BASE,
//   timeout: 15000
// });

// // Optional: log errors nicely
// api.interceptors.response.use(
//   (res) => res,
//   (err) => {
//     // keep default error but with cleaner message
//     return Promise.reject(err);
//   }
// );

// export default api;


// src/services/api/http.js
import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

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