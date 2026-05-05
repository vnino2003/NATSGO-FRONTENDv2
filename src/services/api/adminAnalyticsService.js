import api from "./http";

export function getAdminAnalyticsDashboard(period = "today") {
  return api.get("/admin/analytics/dashboard", {
    params: { period },
  });
}