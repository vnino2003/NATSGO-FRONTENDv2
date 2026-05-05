import api from "./http";

export function getReportsSummary(range = "month") {
  return api.get("/admin/reports/summary", {
    params: { range },
  });
}

export function getRevenueReport(range = "month") {
  return api.get("/admin/reports/revenue", {
    params: { range },
  });
}

export function getCommuterReport(range = "month") {
  return api.get("/admin/reports/commuters", {
    params: { range },
  });
}

export function getAssignmentReport() {
  return api.get("/admin/reports/assignments");
}

export function getGpsActivityReport() {
  return api.get("/admin/reports/gps");
}

export function getFareCollectionReport(range = "month") {
  return api.get("/admin/reports/fare", {
    params: { range },
  });
}