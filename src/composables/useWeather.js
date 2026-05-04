// src/composables/useWeather.js
import { ref, computed } from "vue";
import { getCurrentWeatherByCoords } from "@/services/api/weatherService";

const DEFAULT_WEATHER = {
  temp: null,
  heat_index: null,
  feels_like: null,
  humidity: null,
  wind_kmh: null,
  min: null,
  max: null,
  condition: "",
  location: "",
  icon: "fas fa-cloud-rain",
};

export function useWeather() {
  const weather = ref({ ...DEFAULT_WEATHER });
  const loading = ref(false);
  const error = ref("");
  const hasWeather = ref(false);
  const locationDenied = ref(false);

  const temp = computed(() => weather.value?.temp ?? null);

  const heatIndex = computed(() => {
    return weather.value?.heat_index ?? weather.value?.feels_like ?? null;
  });

  const feelsLike = computed(() => {
    return weather.value?.feels_like ?? weather.value?.heat_index ?? null;
  });

  const humidity = computed(() => weather.value?.humidity ?? null);
  const windKmh = computed(() => weather.value?.wind_kmh ?? null);

  const min = computed(() => weather.value?.min ?? null);
  const max = computed(() => weather.value?.max ?? null);

  const condition = computed(() => {
    return weather.value?.condition || "";
  });

  const location = computed(() => {
    return weather.value?.location || "";
  });

  const icon = computed(() => {
    return weather.value?.icon || DEFAULT_WEATHER.icon;
  });

  function getUserCoordinates() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported."));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (geoError) => {
          reject(geoError);
        },
        {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 60 * 1000,
        }
      );
    });
  }

  async function loadWeather() {
    loading.value = true;
    error.value = "";
    locationDenied.value = false;

    try {
      const coords = await getUserCoordinates();
      const data = await getCurrentWeatherByCoords(coords.lat, coords.lng);

      weather.value = {
        ...DEFAULT_WEATHER,
        ...data,
      };

      hasWeather.value = true;
    } catch (err) {
      console.error("loadWeather error:", err);

      hasWeather.value = false;
      weather.value = { ...DEFAULT_WEATHER };

      if (err?.code === 1) {
        locationDenied.value = true;
        error.value = "Location permission denied.";
      } else {
        error.value = "Failed to load weather.";
      }
    } finally {
      loading.value = false;
    }
  }

  return {
    weather,
    loading,
    error,
    hasWeather,
    locationDenied,

    temp,
    heatIndex,
    feelsLike,
    humidity,
    windKmh,
    min,
    max,
    condition,
    location,
    icon,

    loadWeather,
  };
}