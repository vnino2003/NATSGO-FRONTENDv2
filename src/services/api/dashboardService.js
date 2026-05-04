// src/services/api/dashboardService.js
import api from "./http";

export async function getAdminDashboard() {
  const res = await api.get("/admin/dashboard");
  return res.data;
}