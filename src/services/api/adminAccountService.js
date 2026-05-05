// src/services/api/adminAccountService.js
import api from "./http";

export async function getCurrentAdmin() {
  const res = await api.get("/admin/accounts/me");
  return res.data;
}

export async function getAdminRoles() {
  const res = await api.get("/admin/accounts/roles");
  return res.data;
}

export async function getAdminAccounts(params = {}) {
  const res = await api.get("/admin/accounts", { params });
  return res.data;
}

export async function createAdminAccount(payload) {
  const res = await api.post("/admin/accounts", payload);
  return res.data;
}

export async function updateAdminAccount(id, payload) {
  const res = await api.put(`/admin/accounts/${id}`, payload);
  return res.data;
}

export async function updateAdminStatus(id, status) {
  const res = await api.patch(`/admin/accounts/${id}/status`, { status });
  return res.data;
}

export async function deleteAdminAccount(id) {
  const res = await api.delete(`/admin/accounts/${id}`);
  return res.data;
}