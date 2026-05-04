import { computed, ref, watch } from "vue";
import { useUserLocation } from "@/composables/useUserLocation";
import { useLiveBuses } from "@/composables/useLiveBuses";

const notifKey = "near_bus_notifs_items_v9";
const stateKey = "near_bus_notif_state_v9";

const LIVE_GPS_SECONDS = 15;
const WARNING_GPS_SECONDS = 5 * 60;
const HIDE_OLD_GPS_SECONDS = 30 * 60;

function safeJsonParse(s, fallback) {
  try {
    const parsed = JSON.parse(s);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

const notifications = ref(
  Array.isArray(safeJsonParse(localStorage.getItem(notifKey), []))
    ? safeJsonParse(localStorage.getItem(notifKey), [])
    : []
);

const notifState = ref(safeJsonParse(localStorage.getItem(stateKey), {}) || {});

/*
  NEW:
  This is the real popup trigger.
  Kahit same notification id ang na-update,
  tataas ang popupEventId para mag-trigger sa HomePage.
*/
const latestPopupAlert = ref(null);
const popupEventId = ref(0);

function triggerPopup(notification) {
  if (!notification) return;

  latestPopupAlert.value = {
    ...notification,
    popupTriggeredAt: Date.now(),
  };

  popupEventId.value += 1;
}

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
    Math.sin(dLon / 2) *
      Math.sin(dLon / 2) *
      Math.cos(lat1) *
      Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));

  return R * c;
}

function parseDate(v) {
  if (!v) return null;

  const d = new Date(v);

  return Number.isNaN(d.getTime()) ? null : d;
}

function secondsAgoFromDate(v) {
  const d = parseDate(v);

  if (!d) return Infinity;

  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
}

function getGpsAgeSeconds(bus) {
  const directAge =
    bus?.gpsLossAgeSec ??
    bus?.gpsAgeSec ??
    bus?.gps_age_sec ??
    bus?.locationAgeSec ??
    null;

  if (directAge !== null && directAge !== undefined) {
    const n = Number(directAge);

    if (Number.isFinite(n)) return n;
  }

  const timestamp =
    bus?.updatedAt ??
    bus?.updated_at ??
    bus?.gps_updated_at ??
    bus?.recorded_at ??
    bus?.last_gps_at ??
    null;

  return secondsAgoFromDate(timestamp);
}

function gpsFreshness(bus) {
  const age = getGpsAgeSeconds(bus);

  if (!Number.isFinite(age)) return "hidden";
  if (age <= LIVE_GPS_SECONDS && bus?.isLiveLocation !== false) return "live";
  if (age <= WARNING_GPS_SECONDS) return "warning";
  if (age <= HIDE_OLD_GPS_SECONDS) return "lastKnown";

  return "hidden";
}

function canTriggerNearbyAlert(bus) {
  return gpsFreshness(bus) === "live";
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

function formatGpsAge(bus) {
  const age = getGpsAgeSeconds(bus);

  if (!Number.isFinite(age)) return "Last known location";
  if (age <= LIVE_GPS_SECONDS) return "Live now";
  if (age < 60) return `Last seen ${age}s ago`;

  const mins = Math.floor(age / 60);

  if (mins < 60) return `Last seen ${mins} min${mins > 1 ? "s" : ""} ago`;

  const hours = Math.floor(mins / 60);

  return `Last seen ${hours} hr${hours > 1 ? "s" : ""} ago`;
}

function getBusId(bus) {
  return String(bus?.id ?? bus?.bus_id ?? bus?.busId ?? "");
}

function getNotificationBusId(n) {
  return String(n?.busId ?? n?.meta?.bus_id ?? n?.bus?.id ?? n?.bus?.bus_id ?? "");
}

function buildNotifText(bus, busId, mode = "near") {
  const label =
    bus.trackNo ||
    bus.track_no ||
    bus.bus_code ||
    bus.busCode ||
    bus.plate_no ||
    "Bus";

  const routeText =
    bus.route ||
    bus.route_name ||
    bus.routeName ||
    bus.plate_no ||
    `Bus #${busId}`;

  return {
    title: mode === "still" ? `${label} is still nearby` : `${label} is near`,
    msg: `${bus.kmText} away • ${routeText} • ${formatGpsAge(bus)}`,
  };
}

export function useNearbyBusAlerts({
  intervalMs = 1500,
  maxNearest = 4,
  nearKm = 1.0,
  cooldownMs = 5 * 60 * 1000,
} = {}) {
  const { coords, hasLocation, status, startLocation } = useUserLocation();

  const { buses, start, stop, fetchOnce, loading, error } = useLiveBuses({
    intervalMs,
  });

  const unreadCount = computed(() =>
    notifications.value.reduce((acc, n) => acc + (n.read ? 0 : 1), 0)
  );

  const nearestBuses = computed(() => {
    if (!hasLocation.value || !coords.value) return [];

    const user = coords.value;

    return (buses.value || [])
      .filter(
        (b) =>
          Number.isFinite(Number(b.lat)) &&
          Number.isFinite(Number(b.lng))
      )
      .map((b) => {
        const km = haversineKm(user, {
          lat: Number(b.lat),
          lng: Number(b.lng),
        });

        const freshness = gpsFreshness(b);
        const gpsAgeSec = getGpsAgeSeconds(b);

        return {
          ...b,
          km,
          distanceKm: km,
          kmText:
            km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`,
          gpsAgeSec,
          gpsFreshness: freshness,
          canAlertNearby: freshness === "live",
          canShowNearby: freshness !== "hidden",
        };
      })
      .filter((b) => b.canShowNearby)
      .sort((a, b) => a.km - b.km)
      .slice(0, maxNearest);
  });

  function removeStaleNotifications() {
    const before = notifications.value.length;

    notifications.value = notifications.value.filter((n) => {
      const freshness = gpsFreshness(n.bus);
      return freshness !== "hidden";
    });

    if (notifications.value.length !== before) {
      saveNotifs();
    }
  }

  function addNotif({ bus, title, msg, now, forceNew = false, shouldPopup = true }) {
    const busId = getBusId(bus);

    if (!busId) return null;
    if (!canTriggerNearbyAlert(bus)) return null;

    const existingIndex = notifications.value.findIndex(
      (n) => getNotificationBusId(n) === busId
    );

    if (existingIndex !== -1 && !forceNew) return null;

    const notification = {
      id: `near-${busId}-${now}`,
      type: "nearby_bus",
      busId,
      bus,
      title,
      message: msg,
      time: "Just now",
      read: false,
      createdAt: now,
      gpsFreshness: gpsFreshness(bus),
      gpsAgeSec: getGpsAgeSeconds(bus),
      meta: {
        bus_id: busId,
        km: bus.km,
        lat: bus.lat,
        lng: bus.lng,
        gpsAgeSec: getGpsAgeSeconds(bus),
        gpsFreshness: gpsFreshness(bus),
      },
    };

    notifications.value.unshift(notification);

    if (notifications.value.length > 30) {
      notifications.value = notifications.value.slice(0, 30);
    }

    saveNotifs();

    if (shouldPopup) {
      triggerPopup(notification);
    }

    return notification;
  }

  function updateExistingNotif({ bus, title, msg, now, shouldPopup = true }) {
    const busId = getBusId(bus);

    if (!busId) return false;
    if (!canTriggerNearbyAlert(bus)) return false;

    const index = notifications.value.findIndex(
      (n) => getNotificationBusId(n) === busId
    );

    if (index === -1) return false;

    const updatedNotification = {
      ...notifications.value[index],
      bus,
      title,
      message: msg,
      time: "Just now",
      read: false,
      createdAt: now,
      gpsFreshness: gpsFreshness(bus),
      gpsAgeSec: getGpsAgeSeconds(bus),
      meta: {
        ...notifications.value[index].meta,
        bus_id: busId,
        km: bus.km,
        lat: bus.lat,
        lng: bus.lng,
        gpsAgeSec: getGpsAgeSeconds(bus),
        gpsFreshness: gpsFreshness(bus),
      },
    };

    notifications.value[index] = updatedNotification;

    /*
      Move updated notification to top.
      Mas natural sa notification drawer.
    */
    notifications.value.splice(index, 1);
    notifications.value.unshift(updatedNotification);

    saveNotifs();

    if (shouldPopup) {
      triggerPopup(updatedNotification);
    }

    return true;
  }

  function maybeCreateNearBusNotifs(list) {
    const now = Date.now();
    let changedState = false;

    for (const bus of list) {
      if (!(bus.km <= nearKm)) continue;

      /*
        Popup/notification only kapag live GPS.
        Warning/lastKnown can still show sa nearby cards,
        pero hindi dapat mag-alert popup.
      */
      if (!canTriggerNearbyAlert(bus)) continue;

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

      /*
        First time nearby.
      */
      if (!state.everNotified && !hasVisibleNotif) {
        const text = buildNotifText(bus, busId, "near");

        const created = addNotif({
          bus,
          title: text.title,
          msg: text.msg,
          now,
          shouldPopup: true,
        });

        if (created) {
          notifState.value[busId] = {
            lastAt: now,
            everNotified: true,
          };

          changedState = true;
        }

        continue;
      }

      /*
        Existing notification, pero cooldown passed.
        IMPORTANT:
        Dati same id ito kaya hindi nagpa-popup sa HomePage watcher.
        Ngayon may popupEventId na, so magpa-popup na ulit.
      */
      if (hasVisibleNotif && cooldownPassed) {
        const text = buildNotifText(bus, busId, "still");

        const updated = updateExistingNotif({
          bus,
          title: text.title,
          msg: text.msg,
          now,
          shouldPopup: true,
        });

        if (updated) {
          notifState.value[busId] = {
            ...state,
            lastAt: now,
            everNotified: true,
          };

          changedState = true;
        }

        continue;
      }

      /*
        Notification was cleared/dismissed, but same bus is still nearby
        and cooldown passed.
      */
      if (!hasVisibleNotif && state.everNotified && cooldownPassed) {
        const text = buildNotifText(bus, busId, "still");

        const created = addNotif({
          bus,
          title: text.title,
          msg: text.msg,
          now,
          forceNew: true,
          shouldPopup: true,
        });

        if (created) {
          notifState.value[busId] = {
            ...state,
            lastAt: now,
            everNotified: true,
          };

          changedState = true;
        }
      }
    }

    if (changedState) saveNotifState();
  }

  function refreshTimes() {
    notifications.value = notifications.value.map((n) => {
      const ms = Number(n.createdAt || String(n.id).split("-").pop());
      const bus = n.bus || {};
      const freshness = gpsFreshness(bus);
      const gpsAgeSec = getGpsAgeSeconds(bus);

      if (!Number.isFinite(ms)) {
        return {
          ...n,
          gpsFreshness: freshness,
          gpsAgeSec,
        };
      }

      return {
        ...n,
        time: fmtTimeAgo(new Date(ms)),
        gpsFreshness: freshness,
        gpsAgeSec,
      };
    });

    saveNotifs();
  }

  watch(
    nearestBuses,
    (list) => {
      if (!hasLocation.value) return;

      removeStaleNotifications();
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

    const bus = nearestBuses.value.find(
      (b) =>
        String(getBusId(b)) === String(busId) &&
        b.km <= nearKm &&
        canTriggerNearbyAlert(b)
    );

    /*
      Do not instantly recreate after dismiss.
      Mas okay behavior: dismissed means user closed it.
      It will only come back after cooldown through maybeCreateNearBusNotifs.
    */
    if (bus) {
      const now = Date.now();

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
  }

  function resetNearbyNotificationMemory() {
    notifications.value = [];
    notifState.value = {};
    latestPopupAlert.value = null;
    popupEventId.value = 0;

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

    /*
      NEW:
      HomePage should watch this for popup.
    */
    latestPopupAlert,
    popupEventId,
  };
}