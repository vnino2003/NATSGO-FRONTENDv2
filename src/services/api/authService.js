import api from "./http";

export async function adminLogin(payload) {
  const res = await api.post("/auth/admin/login", payload);
  return res.data;
}

export async function commuterLogin(payload) {
  const res = await api.post("/auth/commuter/login", payload);
  return res.data;
}

export async function commuterSignup(payload) {
  const res = await api.post("/auth/commuter/signup", payload);
  return res.data;
}

export async function getMe() {
  const res = await api.get("/auth/me");
  return res.data;
}

export async function logout() {
  const res = await api.post("/auth/logout");
  return res.data;
}