// src/composables/useNearbyBuses.js
import { computed, ref, watch } from "vue";
import { useUserLocation } from "@/composables/useUserLocation";
import { useLiveBuses } from "@/composables/useLiveBuses";

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

export function useNearbyBuses({
  intervalMs = 1500,
  maxNearest = 10,
  nearKm = 1.0,
} = {}) {
  const { coords, hasLocation, status, startLocation } = useUserLocation();

  const {
    buses,
    loading,
    error,
    fetchOnce,
    start,
    stop,
  } = useLiveBuses({ intervalMs });

  const nearbyBuses = computed(() => {
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
          kmText:
            km < 1
              ? `${Math.round(km * 1000)} m`
              : `${km.toFixed(1)} km`,
        };
      })
      .filter((b) => b.km <= nearKm)
      .sort((a, b) => a.km - b.km)
      .slice(0, maxNearest);
  });

  const nearestBuses = nearbyBuses;

  function enableLocation() {
    startLocation({ highAccuracy: true });
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
    nearbyBuses,
    nearestBuses,

    loading,
    error,
    fetchOnce,
    start,
    stop,
  };
}