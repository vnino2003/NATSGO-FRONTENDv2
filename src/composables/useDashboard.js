// src/composables/useDashboard.js
import { computed, ref } from "vue";
import { getAdminDashboard } from "@/services/api/dashboardService";

const EMPTY_STATS = {
  totalBuses: 0,
  onlineBuses: 0,
  offlineBuses: 0,
  noDeviceBuses: 0,
  fullBuses: 0,
  totalPassengers: 0,
  busesAtTerminal: 0,
  busesEnRoute: 0,

  totalDevices: 0,
  activeDevices: 0,
  offlineDevices: 0,
  unassignedDevices: 0,
  gpsIssues: 0,
  sensorWarnings: 0,
  deviceWarnings: 0,
};

const EMPTY_FARE_INFO = {
  baseFare: 0,
  fareRoutes: 0,
  activePromotions: 0,
  hasFareImage: false,
  totalFareImages: 0,
};

const EMPTY_COMMUTER_INFO = {
  announcements: 0,
  alertTickers: 0,
};

export function useDashboard() {
  const data = ref(null);
  const loading = ref(false);
  const error = ref("");

  const stats = computed(() => ({
    ...EMPTY_STATS,
    ...(data.value?.stats || {}),
  }));

  const terminals = computed(() => data.value?.terminals || []);
  const alerts = computed(() => data.value?.alerts || []);
  const activity = computed(() => data.value?.activity || []);

  const fareInfo = computed(() => ({
    ...EMPTY_FARE_INFO,
    ...(data.value?.fareInfo || {}),
  }));

  const commuterInfo = computed(() => ({
    ...EMPTY_COMMUTER_INFO,
    ...(data.value?.commuterInfo || {}),
  }));

  // Old chart data, keep this if some old dashboard code still imports/uses it.
  // You can remove this later after Occupancy Snapshot is fully removed.
  const occupancyHourly = computed(() => data.value?.occupancyHourly || []);

  // New Route Load Summary data
  const routeLoadSummary = computed(() => {
    const raw = data.value?.routeLoadSummary || data.value?.route_load_summary || [];

    return raw.map((r, index) => {
      const from = r.from || r.from_location || r.origin || "Unknown";
      const to = r.to || r.to_location || r.destination || "Unknown";

      const totalBuses = Number(
        r.totalBuses ?? r.total_buses ?? r.bus_count ?? 0
      );

      const atTerminalBuses = Number(
        r.atTerminalBuses ?? r.at_terminal_buses ?? r.terminal_buses ?? 0
      );

      const enRouteBuses = Number(
        r.enRouteBuses ?? r.en_route_buses ?? r.running_buses ?? 0
      );

      const offlineBuses = Number(
        r.offlineBuses ?? r.offline_buses ?? 0
      );

      const activeBuses = Number(
        r.activeBuses ??
          r.active_buses ??
          atTerminalBuses + enRouteBuses
      );

      const totalPassengers = Number(
        r.totalPassengers ?? r.total_passengers ?? r.passengers ?? 0
      );

      const fullBuses = Number(
        r.fullBuses ?? r.full_buses ?? r.crowded_buses ?? 0
      );

      const capacity = Number(
        r.capacity ??
          r.total_capacity ??
          activeBuses * 30
      );

      return {
        key: r.key || `${from}-${to}-${index}`,
        from,
        to,

        totalBuses,
        activeBuses,
        atTerminalBuses,
        enRouteBuses,
        offlineBuses,

        totalPassengers,
        fullBuses,
        capacity,
      };
    });
  });

  const generatedAt = computed(() => {
    return data.value?.generated_at || data.value?.generatedAt || null;
  });

  async function fetchDashboard() {
    loading.value = true;
    error.value = "";

    try {
      const res = await getAdminDashboard();

      if (!res?.ok) {
        throw new Error(res?.message || "Failed to load dashboard.");
      }

      data.value = res;
      return res;
    } catch (err) {
      console.error("fetchDashboard error:", err);

      error.value =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load dashboard.";

      throw err;
    } finally {
      loading.value = false;
    }
  }

  return {
    data,

    stats,
    terminals,
    alerts,
    activity,
    fareInfo,
    commuterInfo,

    // Keep old one temporarily
    occupancyHourly,

    // New one for Route Load Summary
    routeLoadSummary,

    generatedAt,
    loading,
    error,
    fetchDashboard,
  };
}