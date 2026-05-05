// src/composables/useReports.js
import { computed, ref } from "vue";
import {
  getReportsSummary,
  getRevenueReport,
  getCommuterReport,
  getAssignmentReport,
  getGpsActivityReport,
  getFareCollectionReport,
} from "@/services/api/reportsService";

export function useReports() {
  const loading = ref(false);
  const error = ref("");

  const summaryData = ref(null);
  const revenueReport = ref(null);
  const commuterReport = ref(null);
  const assignmentReport = ref(null);
  const gpsReport = ref(null);
  const fareReport = ref(null);

  function safeArray(value) {
    return Array.isArray(value) ? value : [];
  }

  async function loadReports(range = "month") {
    loading.value = true;
    error.value = "";

    try {
      const [
        summaryRes,
        revenueRes,
        commuterRes,
        assignmentRes,
        gpsRes,
        fareRes,
      ] = await Promise.all([
        getReportsSummary(range),
        getRevenueReport(range),
        getCommuterReport(range),
        getAssignmentReport(),
        getGpsActivityReport(),
        getFareCollectionReport(range),
      ]);

      summaryData.value = summaryRes?.data || null;
      revenueReport.value = revenueRes?.data || null;
      commuterReport.value = commuterRes?.data || null;
      assignmentReport.value = assignmentRes?.data || null;
      gpsReport.value = gpsRes?.data || null;
      fareReport.value = fareRes?.data || null;
    } catch (err) {
      console.error("loadReports error:", err);

      error.value =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to load reports.";
    } finally {
      loading.value = false;
    }
  }

  const assignmentRows = computed(() => {
    return safeArray(assignmentReport.value?.rows);
  });

  const revenueRows = computed(() => {
    return safeArray(revenueReport.value?.rows);
  });

  const commuterRows = computed(() => {
    return safeArray(commuterReport.value?.rows);
  });

  const gpsRows = computed(() => {
    return safeArray(gpsReport.value?.rows);
  });

  const fareRows = computed(() => {
    return safeArray(fareReport.value?.rows);
  });

  return {
    loading,
    error,

    summaryData,
    revenueReport,
    commuterReport,
    assignmentReport,
    gpsReport,
    fareReport,

    assignmentRows,
    revenueRows,
    commuterRows,
    gpsRows,
    fareRows,

    loadReports,
  };
}