// src/services/api/publicTrackingService.js
import http from "./http";

export function getLiveBuses() {
  return http.get("/track/live-buses");
}