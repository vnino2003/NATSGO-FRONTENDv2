// src/composables/useNearbyBusAlerts.js
import { computed, ref, watch } from "vue";
import { useUserLocation } from "@/composables/useUserLocation";
import { useLiveBuses } from "@/composables/useLiveBuses";

const notifKey = "near_bus_notifs_items_v7";
const stateKey = "near_bus_notif_state_v7";

function safeJsonParse(s, fallback) {
  try {
    const parsed = JSON.parse(s);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

/*
  Shared notification state.
  This makes the bell state consistent even if multiple components use this composable.
*/
const notifications = ref(
  Array.isArray(safeJsonParse(localStorage.getItem(notifKey), []))
    ? safeJsonParse(localStorage.getItem(notifKey), [])
    : []
);

const notifState = ref(safeJsonParse(localStorage.getItem(stateKey), {}) || {});

function saveNotifs() {
  localStorage.setItem(notifKey, JSON.stringify(notifications.value));
}

function saveNotifState() {
  localStorage.setItem(stateKey, JSON.stringify(notifState.value));
}

function haversineKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * c;
}

function fmtTimeAgo(d) {
  const diff = Math.max(0, Date.now() - d.getTime());
  const s = Math.floor(diff / 1000);

  if (s < 20) return "Just now";

  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min${m > 1 ? "s" : ""} ago`;

  const h = Math.floor(m / 60);
  return `${h} hr${h > 1 ? "s" : ""} ago`;
}

function getBusId(bus) {
  return String(bus?.id ?? bus?.bus_id ?? "");
}

function getNotificationBusId(n) {
  return String(n?.busId ?? n?.meta?.bus_id ?? n?.bus?.id ?? "");
}

function buildNotifText(bus, busId, mode = "near") {
  const label = bus.trackNo || bus.bus_code || "Bus";

  return {
    title: mode === "still" ? `${label} is still nearby` : `${label} is near`,
    msg: `${bus.kmText} away • ${bus.route || bus.plate_no || `Bus #${busId}`}`,
  };
}

export function useNearbyBusAlerts({
  intervalMs = 1500,
  maxNearest = 4,
  nearKm = 1.0,

  // If the notification is NOT removed, update the same card after this.
  cooldownMs = 5 * 60 * 1000,
} = {}) {
  const { coords, hasLocation, status, startLocation } = useUserLocation();

  const {
    buses,
    start,
    stop,
    fetchOnce,
    loading,
    error,
  } = useLiveBuses({ intervalMs });

  const unreadCount = computed(() =>
    notifications.value.reduce((acc, n) => acc + (n.read ? 0 : 1), 0)
  );

  const nearestBuses = computed(() => {
    if (!hasLocation.value || !coords.value) return [];

    const user = coords.value;

    return (buses.value || [])
      .filter((b) => Number.isFinite(Number(b.lat)) && Number.isFinite(Number(b.lng)))
      .map((b) => {
        const km = haversineKm(user, {
          lat: Number(b.lat),
          lng: Number(b.lng),
        });

        return {
          ...b,
          km,
          distanceKm: km,
          kmText: km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`,
        };
      })
      .sort((a, b) => a.km - b.km)
      .slice(0, maxNearest);
  });

  function addNotif({ bus, title, msg, now, forceNew = false }) {
    const busId = getBusId(bus);
    if (!busId) return;

    const existingIndex = notifications.value.findIndex(
      (n) => getNotificationBusId(n) === busId
    );

    if (existingIndex !== -1 && !forceNew) return;

    notifications.value.unshift({
      id: `near-${busId}-${now}`,
      type: "nearby_bus",
      busId,
      bus,
      title,
      message: msg,
      time: "Just now",
      read: false,
      createdAt: now,
      meta: {
        bus_id: busId,
        km: bus.km,
        lat: bus.lat,
        lng: bus.lng,
      },
    });

    if (notifications.value.length > 30) {
      notifications.value = notifications.value.slice(0, 30);
    }

    saveNotifs();
  }

  function updateExistingNotif({ bus, title, msg, now }) {
    const busId = getBusId(bus);
    if (!busId) return false;

    const index = notifications.value.findIndex(
      (n) => getNotificationBusId(n) === busId
    );

    if (index === -1) return false;

    notifications.value[index] = {
      ...notifications.value[index],
      bus,
      title,
      message: msg,
      time: "Just now",
      read: false,
      createdAt: now,
      meta: {
        ...notifications.value[index].meta,
        bus_id: busId,
        km: bus.km,
        lat: bus.lat,
        lng: bus.lng,
      },
    };

    saveNotifs();
    return true;
  }

  function maybeCreateNearBusNotifs(list) {
    const now = Date.now();
    let changedState = false;

    for (const bus of list) {
      if (!(bus.km <= nearKm)) continue;

      const busId = getBusId(bus);
      if (!busId) continue;

      const state = notifState.value[busId] || {
        lastAt: 0,
        everNotified: false,
      };

      const existingIndex = notifications.value.findIndex(
        (n) => getNotificationBusId(n) === busId
      );

      const hasVisibleNotif = existingIndex !== -1;
      const cooldownPassed = !state.lastAt || now - state.lastAt >= cooldownMs;

      // First time: create "is near"
      if (!state.everNotified && !hasVisibleNotif) {
        const text = buildNotifText(bus, busId, "near");

        addNotif({
          bus,
          title: text.title,
          msg: text.msg,
          now,
        });

        notifState.value[busId] = {
          lastAt: now,
          everNotified: true,
        };

        changedState = true;
        continue;
      }

      // If user did NOT remove it:
      // after 5 mins, update/overwrite SAME card to "still nearby"
      if (hasVisibleNotif && cooldownPassed) {
        const text = buildNotifText(bus, busId, "still");

        updateExistingNotif({
          bus,
          title: text.title,
          msg: text.msg,
          now,
        });

        notifState.value[busId] = {
          ...state,
          lastAt: now,
          everNotified: true,
        };

        changedState = true;
        continue;
      }

      // If user removed it:
      // since no visible notification exists, immediately create a new "still nearby"
      if (!hasVisibleNotif && state.everNotified) {
        const text = buildNotifText(bus, busId, "still");

        addNotif({
          bus,
          title: text.title,
          msg: text.msg,
          now,
          forceNew: true,
        });

        notifState.value[busId] = {
          ...state,
          lastAt: now,
          everNotified: true,
        };

        changedState = true;
      }
    }

    if (changedState) saveNotifState();
  }

  function refreshTimes() {
    notifications.value = notifications.value.map((n) => {
      const ms = Number(n.createdAt || String(n.id).split("-").pop());
      if (!Number.isFinite(ms)) return n;

      return {
        ...n,
        time: fmtTimeAgo(new Date(ms)),
      };
    });

    saveNotifs();
  }

  watch(
    nearestBuses,
    (list) => {
      if (!hasLocation.value) return;

      maybeCreateNearBusNotifs(list);
      refreshTimes();
    },
    { deep: true }
  );

  function enableLocation() {
    startLocation({ highAccuracy: true });
  }

  function markAllRead() {
    notifications.value = notifications.value.map((n) => ({
      ...n,
      read: true,
    }));

    saveNotifs();
  }

  function markRead(id) {
    notifications.value = notifications.value.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );

    saveNotifs();
  }

  function dismiss(id) {
    const item = notifications.value.find((n) => n.id === id);
    const busId = getNotificationBusId(item);

    notifications.value = notifications.value.filter((n) => n.id !== id);
    saveNotifs();

    // If bus is still nearby, immediately display a NEW "still nearby" notification.
    const bus = nearestBuses.value.find(
      (b) => String(getBusId(b)) === String(busId) && b.km <= nearKm
    );

    if (bus) {
      const now = Date.now();
      const text = buildNotifText(bus, busId, "still");

      addNotif({
        bus,
        title: text.title,
        msg: text.msg,
        now,
        forceNew: true,
      });

      notifState.value[busId] = {
        ...(notifState.value[busId] || {}),
        lastAt: now,
        everNotified: true,
      };

      saveNotifState();
    }
  }

  function clear() {
    notifications.value = [];
    saveNotifs();

    /*
      Do NOT reset notifState.
      If buses are still nearby, they can appear again as "still nearby".
    */
  }

  function resetNearbyNotificationMemory() {
    notifications.value = [];
    notifState.value = {};

    saveNotifs();
    saveNotifState();
  }

  watch(
    hasLocation,
    (on) => {
      if (on) start();
      else stop();
    },
    { immediate: true }
  );

  return {
    coords,
    hasLocation,
    status,
    enableLocation,

    buses,
    nearestBuses,
    loading,
    error,
    fetchOnce,

    notifications,
    unreadCount,
    markRead,
    markAllRead,
    dismiss,
    clear,
    resetNearbyNotificationMemory,
  };
}