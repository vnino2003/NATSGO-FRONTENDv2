// src/composables/useWeather.js
import { ref, computed } from "vue";
import { getCurrentWeatherByCoords } from "@/services/api/weatherService";

const WEATHER_CACHE_KEY = "natsgo_weather_cache_v1";
const WEATHER_CACHE_MAX_AGE = 10 * 60 * 1000; // 10 minutes

const DEFAULT_WEATHER = {
  temp: null,
  min: null,
  max: null,
  heatIndex: null,
  condition: "",
  location: "",
  icon: "fas fa-cloud",
  updated_at: null,
};

const weather = ref(loadCachedWeather());
const loading = ref(false);
const error = ref("");

function loadCachedWeather() {
  try {
    const raw = localStorage.getItem(WEATHER_CACHE_KEY);
    if (!raw) return { ...DEFAULT_WEATHER };

    const cached = JSON.parse(raw);

    if (!cached || typeof cached !== "object") {
      return { ...DEFAULT_WEATHER };
    }

    return {
      ...DEFAULT_WEATHER,
      ...cached,
    };
  } catch {
    return { ...DEFAULT_WEATHER };
  }
}

function saveCachedWeather(data) {
  try {
    localStorage.setItem(
      WEATHER_CACHE_KEY,
      JSON.stringify({
        ...data,
        cached_at: Date.now(),
      })
    );
  } catch {
    // ignore storage errors
  }
}

function isCacheFresh() {
  try {
    const raw = localStorage.getItem(WEATHER_CACHE_KEY);
    if (!raw) return false;

    const cached = JSON.parse(raw);
    if (!cached?.cached_at) return false;

    return Date.now() - Number(cached.cached_at) < WEATHER_CACHE_MAX_AGE;
  } catch {
    return false;
  }
}

export function useWeather() {
  const hasWeather = computed(() => {
    return (
      weather.value &&
      weather.value.temp !== null &&
      weather.value.temp !== undefined &&
      weather.value.location
    );
  });

  const temp = computed(() => weather.value?.temp ?? "");
  const min = computed(() => weather.value?.min ?? "");
  const max = computed(() => weather.value?.max ?? "");
  const heatIndex = computed(() => weather.value?.heatIndex ?? null);
  const condition = computed(() => weather.value?.condition || "Weather unavailable");
  const location = computed(() => weather.value?.location || "");
  const icon = computed(() => weather.value?.icon || "fas fa-cloud");

  async function loadWeather(options = {}) {
    const { force = false } = options;

    // Important:
    // If may cached weather na, huwag na mag-loading UI.
    // I-refresh lang silently sa background.
    const alreadyHasWeather = hasWeather.value;

    if (!force && alreadyHasWeather && isCacheFresh()) {
      return;
    }

    if (!alreadyHasWeather) {
      loading.value = true;
    }

    error.value = "";

    try {
      const position = await getCurrentPosition();

      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      const response = await getCurrentWeatherByCoords(latitude, longitude);
      const data = response?.data?.data || response?.data || null;

      if (!data) {
        throw new Error("No weather data received");
      }

      const nextWeather = {
        temp: data.temp ?? null,
        min: data.min ?? null,
        max: data.max ?? null,
        heatIndex: data.heatIndex ?? data.heat_index ?? null,
        condition: data.condition || "Weather unavailable",
        location: data.location || "",
        icon: data.icon || "fas fa-cloud",
        updated_at: data.updated_at || new Date().toISOString(),
      };

      weather.value = nextWeather;
      saveCachedWeather(nextWeather);
    } catch (err) {
      console.error("loadWeather error:", err);

      error.value =
        err?.message || "Unable to load weather right now.";

      // Do not clear old weather.
      // Para hindi nawawala yung card kapag failed yung refresh.
      if (!hasWeather.value) {
        weather.value = loadCachedWeather();
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
    temp,
    min,
    max,
    heatIndex,
    condition,
    location,
    icon,
    loadWeather,
  };
}

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 10 * 60 * 1000,
    });
  });
}