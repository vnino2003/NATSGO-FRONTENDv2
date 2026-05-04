// src/composables/useLiveBuses.js
import { ref, onUnmounted } from "vue";
import { getLiveBuses } from "../services/api/publicTrackingService";

const LIVE_GPS_SECONDS = 15;

const PH_LAT_MIN = 4;
const PH_LAT_MAX = 22;
const PH_LNG_MIN = 116;
const PH_LNG_MAX = 127;

export function useLiveBuses({ intervalMs = 1000 } = {}) {
  const loading = ref(false);
  const error = ref(null);
  const buses = ref([]);

  let timer = null;

  const lastGoodByBusId = new Map();

  function cleanName(v) {
    const s = String(v ?? "").trim();
    return s || null;
  }

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

  function formatAgo(seconds) {
    if (!Number.isFinite(seconds)) return "Last location";

    if (seconds < 10) return "Live just now";
    if (seconds < 60) return `Last seen ${seconds}s ago`;

    const mins = Math.floor(seconds / 60);

    if (mins < 60) {
      return `Last seen ${mins} min${mins > 1 ? "s" : ""} ago`;
    }

    const hours = Math.floor(mins / 60);

    if (hours < 24) {
      return `Last seen ${hours} hr${hours > 1 ? "s" : ""} ago`;
    }

    const days = Math.floor(hours / 24);

    return `Last seen ${days} day${days > 1 ? "s" : ""} ago`;
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

  function hasCoords(row) {
    return isValidGpsCoord(row?.lat, row?.lng);
  }

  function isBusOk(row) {
    const s = String(row?.bus_status || "active").toLowerCase();
    return ["active", "online", "in_service"].includes(s);
  }

  function isDeviceOnline(row) {
    const status = String(row?.device_status || "").toLowerCase();
    const onlineFlag = Number(row?.is_online ?? 0) === 1;

    if (status === "offline" && !onlineFlag) return false;

    return status === "online" || status === "warning" || onlineFlag;
  }

  function isGpsLive(row) {
    const gpsState = String(row?.gps_state || "").toLowerCase();
    const gpsAge = secondsAgo(row?.updated_at);

    return gpsState === "active" && gpsAge <= LIVE_GPS_SECONDS && hasCoords(row);
  }

  function normalize(row, fallback = null) {
    const capacity = Number(row.capacity ?? fallback?.capacity ?? 0);

    const passengerCount = Number(
      row.passenger_count ?? fallback?.passenger_count ?? 0
    );

    const currentRowHasValidGps = hasCoords(row);

    const safeLat = currentRowHasValidGps
      ? Number(row.lat)
      : fallback?.lat ?? null;

    const safeLng = currentRowHasValidGps
      ? Number(row.lng)
      : fallback?.lng ?? null;

    /*
      IMPORTANT:
      This must be the actual GPS recorded_at from database.
      Do not use Date.now() here.
      This prevents refresh from resetting "Last seen 1 hr ago" back to "Just now".
    */
    const safeUpdatedAt = currentRowHasValidGps
      ? row.updated_at
      : fallback?.updatedAt ?? row.updated_at ?? null;

    const gpsAgeSec = secondsAgo(safeUpdatedAt);

    const liveCheckRow = {
      ...row,
      lat: safeLat,
      lng: safeLng,
      updated_at: safeUpdatedAt,
    };

    const isLiveLocation = isGpsLive(liveCheckRow);

    const locationLabel = isLiveLocation
      ? "Live now"
      : formatAgo(gpsAgeSec);

    const route = row.bus_code
      ? `${row.bus_code} • ${row.plate_no || ""}`.trim()
      : row.plate_no || fallback?.route || `Bus #${row.bus_id}`;

    const trackNo = row.bus_code || fallback?.trackNo || String(row.bus_id);

    const terminalState = row.terminal_state || {};

    const currentTerminalId =
      row.current_terminal_id != null
        ? Number(row.current_terminal_id)
        : terminalState.current_terminal_id != null
          ? Number(terminalState.current_terminal_id)
          : fallback?.currentTerminalId ?? null;

    const targetTerminalId =
      row.target_terminal_id != null
        ? Number(row.target_terminal_id)
        : terminalState.target_terminal_id != null
          ? Number(terminalState.target_terminal_id)
          : fallback?.targetTerminalId ?? null;

    const currentTerminalName =
      cleanName(row.current_terminal_name || terminalState.current_terminal_name) ||
      fallback?.currentTerminalName ||
      null;

    const targetTerminalName =
      cleanName(row.target_terminal_name || terminalState.target_terminal_name) ||
      fallback?.targetTerminalName ||
      null;

    const atTerminal =
      Number(row.at_terminal ?? terminalState.at_terminal ?? fallback?.atTerminal ?? 0) === 1;

    const distM =
      row.dist_m != null
        ? Number(row.dist_m)
        : terminalState.dist_m != null
          ? Number(terminalState.dist_m)
          : fallback?.distM ?? null;

    const directionLabel =
      currentTerminalName && targetTerminalName
        ? `${currentTerminalName} → ${targetTerminalName}`
        : currentTerminalName
          ? `${currentTerminalName} → (unknown)`
          : targetTerminalName
            ? `(unknown) → ${targetTerminalName}`
            : row.route_label || fallback?.directionLabel || "Route: unknown";

    const terminalStateLabel = atTerminal
      ? currentTerminalName
        ? `At ${currentTerminalName}`
        : "At terminal"
      : currentTerminalName && targetTerminalName
        ? `On route: ${currentTerminalName} → ${targetTerminalName}`
        : "On route";

    const telemetryAgeSec = secondsAgo(row.last_seen_at);

    return {
      id: row.bus_id,
      bus_id: row.bus_id,
      bus_code: row.bus_code,
      plate_no: row.plate_no,
      capacity,
      bus_status: row.bus_status || "active",

      seats: passengerCount,
      passenger_count: passengerCount,
      in_total: Number(row.in_total ?? fallback?.in_total ?? 0),
      out_total: Number(row.out_total ?? fallback?.out_total ?? 0),
      last_event: row.last_event ?? fallback?.last_event ?? null,
      last_event_at: row.last_event_at ?? fallback?.last_event_at ?? null,

      route,
      trackNo,

      device_id: row.device_id,
      device_code: row.device_code,
      esp32_id: row.esp32_id,
      device_status: row.device_status,
      gps_state: row.gps_state,
      gps_badge: row.gps_badge,
      gps_enabled: row.gps_enabled,
      last_seen_at: row.last_seen_at,
      is_online: Number(row.is_online ?? 0) === 1,

      lat: safeLat,
      lng: safeLng,

      speedKmh:
        isLiveLocation && row.speed_kmh != null
          ? Number(row.speed_kmh)
          : null,

      altitudeM:
        row.altitude_m != null
          ? Number(row.altitude_m)
          : fallback?.altitudeM ?? null,

      hdop:
        row.hdop != null
          ? Number(row.hdop)
          : fallback?.hdop ?? null,

      sats:
        row.satellites != null
          ? Number(row.satellites)
          : fallback?.sats ?? null,

      updatedAt: safeUpdatedAt,

      isLiveLocation,
      locationLabel,
      gpsLossAgeSec: gpsAgeSec,
      telemetryAgeSec,

      currentTerminalId,
      targetTerminalId,
      currentTerminalName,
      targetTerminalName,
      atTerminal,
      distM,
      directionLabel,
      terminalStateLabel,

      terminal_state: {
        at_terminal: atTerminal ? 1 : 0,
        current_terminal_id: currentTerminalId,
        current_terminal_name: currentTerminalName,
        target_terminal_id: targetTerminalId,
        target_terminal_name: targetTerminalName,
        dist_m: distM,
      },
    };
  }

  async function fetchOnce() {
    try {
      loading.value = true;
      error.value = null;

      const res = await getLiveBuses();
      const list = Array.isArray(res.data) ? res.data : [];

      const next = [];

      for (const row of list) {
        if (!row || !row.bus_id || !isBusOk(row)) continue;

        if (!isDeviceOnline(row)) {
          lastGoodByBusId.delete(row.bus_id);
          continue;
        }

        const fallback = lastGoodByBusId.get(row.bus_id) || null;

        if (!hasCoords(row) && !fallback) continue;

        const normalized = normalize(row, fallback);

        if (!isValidGpsCoord(normalized.lat, normalized.lng)) continue;

        lastGoodByBusId.set(row.bus_id, normalized);
        next.push(normalized);
      }

      buses.value = next;
    } catch (e) {
      error.value =
        e?.response?.data?.message ||
        e?.message ||
        "Failed to load live buses";
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