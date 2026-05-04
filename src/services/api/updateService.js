// src/services/api/updateService.js
import api from "./http";

/* =========================
   PUBLIC / COMMUTER
========================= */

export async function getPublicAnnouncements() {
  const { data } = await api.get("/updates/public/announcements");
  return data.announcements || [];
}

export async function getPublicAlerts() {
  const { data } = await api.get("/updates/public/alerts");
  return data.alerts || [];
}

/* =========================
   ADMIN ANNOUNCEMENTS
========================= */

export async function getAnnouncements() {
  const { data } = await api.get("/updates/announcements");
  return data.announcements || [];
}

export async function createAnnouncement(payload) {
  const { data } = await api.post("/updates/announcements", payload);
  return data;
}

export async function updateAnnouncement(id, payload) {
  const { data } = await api.put(`/updates/announcements/${id}`, payload);
  return data;
}

export async function deleteAnnouncement(id) {
  const { data } = await api.delete(`/updates/announcements/${id}`);
  return data;
}

/* =========================
   ADMIN ALERT TICKERS
========================= */

export async function getAlertTickers() {
  const { data } = await api.get("/updates/alerts");
  return data.alerts || [];
}

export async function createAlertTicker(payload) {
  const { data } = await api.post("/updates/alerts", payload);
  return data;
}

export async function updateAlertTicker(id, payload) {
  const { data } = await api.put(`/updates/alerts/${id}`, payload);
  return data;
}

export async function deleteAlertTicker(id) {
  const { data } = await api.delete(`/updates/alerts/${id}`);
  return data;
}