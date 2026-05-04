// src/composables/useAdminLiveBuses.js
import { ref, onUnmounted } from "vue";
import { getLiveBuses } from "@/services/api/publicTrackingService";

const LIVE_GPS_SECONDS = 15;

// Philippines bounds to reject 0,0 and random invalid points
const PH_LAT_MIN = 4;
const PH_LAT_MAX = 22;
const PH_LNG_MIN = 116;
const PH_LNG_MAX = 127;

export function useAdminLiveBuses({ intervalMs = 2000 } = {}) {
  const buses = ref([]);
  const loading = ref(false);
  const error = ref(null);

  let timer = null;

  function parseDate(v) {
    if (!v) return null;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function secondsAgo(v) {
    const d = parseDate(v);
    if (!d) return Infinity;
    return Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  }

  function formatSeen(v) {
    const sec = secondsAgo(v);

    if (!Number.isFinite(sec)) return "No heartbeat";
    if (sec < 10) return "Just now";
    if (sec < 60) return `${sec}s ago`;

    const mins = Math.floor(sec / 60);
    if (mins < 60) return `${mins} min${mins > 1 ? "s" : ""} ago`;

    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hr${hrs > 1 ? "s" : ""} ago`;

    const days = Math.floor(hrs / 24);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }

  function isValidGpsCoord(lat, lng) {
    const la = Number(lat);
    const ln = Number(lng);

    if (!Number.isFinite(la) || !Number.isFinite(ln)) return false;
    if (la === 0 && ln === 0) return false;

    return (
      la >= PH_LAT_MIN &&
      la <= PH_LAT_MAX &&
      ln >= PH_LNG_MIN &&
      ln <= PH_LNG_MAX
    );
  }

  function getStatus(row) {
    const deviceStatus = String(row?.device_status || "").toLowerCase();
    const gpsState = String(row?.gps_state || "").toLowerCase();
    const isOnline = Number(row?.is_online ?? 0) === 1;

    if (deviceStatus === "offline" || !isOnline) return "Offline";

    if (
      deviceStatus === "warning" ||
      gpsState === "searching" ||
      gpsState === "disconnected" ||
      gpsState === "disabled"
    ) {
      return "Warning";
    }

    return "Online";
  }

  function getSignal(row) {
    const gpsState = String(row?.gps_state || "").toLowerCase();
    const gpsBadge = row?.gps_badge;

    if (gpsBadge) return gpsBadge;

    if (gpsState === "active") return "GPS Active";
    if (gpsState === "searching") return "GPS Searching";
    if (gpsState === "disconnected") return "GPS Disconnected";
    if (gpsState === "disabled") return "GPS Disabled";

    return "GPS Unknown";
  }

  function getRoute(row) {
    if (row?.route_label) return row.route_label;

    const cur =
      row?.current_terminal_name ||
      row?.terminal_state?.current_terminal_name ||
      null;

    const tgt =
      row?.target_terminal_name ||
      row?.terminal_state?.target_terminal_name ||
      null;

    if (cur && tgt) return `${cur} → ${tgt}`;
    if (cur) return `${cur} → —`;
    if (tgt) return `— → ${tgt}`;

    return "Unknown route";
  }

  function normalize(row) {
    const hasGps = isValidGpsCoord(row?.lat, row?.lng);

    const gpsAge = secondsAgo(row?.updated_at);
    const isFreshGps = gpsAge <= LIVE_GPS_SECONDS;
    const gpsState = String(row?.gps_state || "").toLowerCase();

    const isLiveLocation = hasGps && gpsState === "active" && isFreshGps;

    const status = getStatus(row);

    const capacity = Number(row?.capacity ?? 0);
    const passengerCount = Number(row?.passenger_count ?? 0);

    const occPct =
      capacity > 0
        ? Math.max(0, Math.min(100, Math.round((passengerCount / capacity) * 100)))
        : null;

    return {
      id: row.bus_id,
      bus_id: row.bus_id,

      code: row.bus_code || `BUS-${row.bus_id}`,
      bus_code: row.bus_code || `BUS-${row.bus_id}`,
      plate: row.plate_no || "—",
      plate_no: row.plate_no || "—",

      capacity,
      passengerCount,
      passenger_count: passengerCount,
      occPct,

      route: getRoute(row),

      deviceId: row.device_id,
      device_id: row.device_id,
      deviceCode: row.device_code,
      device_code: row.device_code,
      esp32_id: row.esp32_id,

      device_status: row.device_status,
      gps_state: row.gps_state,
      gps_badge: row.gps_badge,
      gps_enabled: row.gps_enabled,
      is_online: Number(row.is_online ?? 0) === 1,

      status,
      signal: getSignal(row),

      hasGps,
      hasValidGps: hasGps,

      // Keep lat/lng as null if invalid.
      // Admin list still shows the bus, but map marker is skipped.
      lat: hasGps ? Number(row.lat) : null,
      lng: hasGps ? Number(row.lng) : null,

      speed:
        isLiveLocation && row.speed_kmh != null
          ? Number(row.speed_kmh)
          : "—",

      speedKmh:
        isLiveLocation && row.speed_kmh != null
          ? Number(row.speed_kmh)
          : null,

      altitudeM: row.altitude_m != null ? Number(row.altitude_m) : null,
      hdop: row.hdop != null ? Number(row.hdop) : null,
      satellites: row.satellites != null ? Number(row.satellites) : null,

      updatedAt: row.updated_at,
      last_seen_at: row.last_seen_at,
      lastSeen: formatSeen(row.last_seen_at),

      isLiveLocation,

      terminalAt: Number(row.at_terminal ?? row.terminal_state?.at_terminal ?? 0) === 1,
      at_terminal: Number(row.at_terminal ?? row.terminal_state?.at_terminal ?? 0) === 1 ? 1 : 0,

      currentTerminalId:
        row.current_terminal_id ??
        row.terminal_state?.current_terminal_id ??
        null,

      targetTerminalId:
        row.target_terminal_id ??
        row.terminal_state?.target_terminal_id ??
        null,

      currentTerminalName:
        row.current_terminal_name ??
        row.terminal_state?.current_terminal_name ??
        null,

      targetTerminalName:
        row.target_terminal_name ??
        row.terminal_state?.target_terminal_name ??
        null,

      distM:
        row.dist_m != null && Number(row.dist_m) < 1000000
          ? Number(row.dist_m)
          : null,

      terminal_state: row.terminal_state || null,

      raw: row,
    };
  }

  async function fetchOnce() {
    try {
      loading.value = true;
      error.value = null;

      const res = await getLiveBuses();
      const list = Array.isArray(res.data) ? res.data : [];

      /*
        Admin rule:
        DO NOT hide offline buses.
        DO NOT hide GPS searching/disconnected buses.
        DO NOT hide buses with null/0 GPS.
        Only require bus_id.
      */
      buses.value = list
        .filter((row) => row && row.bus_id)
        .map(normalize);
    } catch (e) {
      error.value =
        e?.response?.data?.message ||
        e?.message ||
        "Failed to load admin live buses";
    } finally {
      loading.value = false;
    }
  }

  function start() {
    stop();
    fetchOnce();
    timer = setInterval(fetchOnce, intervalMs);
  }

  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  onUnmounted(() => stop());

  return {
    buses,
    loading,
    error,
    fetchOnce,
    start,
    stop,
  };
}