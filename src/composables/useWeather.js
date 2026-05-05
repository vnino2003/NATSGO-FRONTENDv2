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
  cached_at: null,
};

const weather = ref(loadCachedWeather());
const loading = ref(false);
const error = ref("");
const isRefreshing = ref(false);

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
    const payload = {
      ...data,
      cached_at: Date.now(),
    };

    localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(payload));
    weather.value = payload;
  } catch {
    weather.value = data;
  }
}

function isCacheFresh() {
  const cachedAt = Number(weather.value?.cached_at || 0);
  if (!cachedAt) return false;

  return Date.now() - cachedAt < WEATHER_CACHE_MAX_AGE;
}

function hasUsableWeatherData() {
  return (
    weather.value &&
    weather.value.temp !== null &&
    weather.value.temp !== undefined
  );
}

export function useWeather() {
  const hasWeather = computed(() => {
    return hasUsableWeatherData();
  });

  const temp = computed(() => weather.value?.temp ?? "");
  const min = computed(() => weather.value?.min ?? "");
  const max = computed(() => weather.value?.max ?? "");
  const heatIndex = computed(() => weather.value?.heatIndex ?? null);
  const condition = computed(() => weather.value?.condition || "Weather unavailable");
  const location = computed(() => weather.value?.location || "Current location");
  const icon = computed(() => weather.value?.icon || "fas fa-cloud");

  async function loadWeather(options = {}) {
    const { force = false } = options;

    // Never show loading UI for weather card.
    // This prevents the card from blinking / going blank.
    loading.value = false;

    if (isRefreshing.value) return;

    if (!force && hasUsableWeatherData() && isCacheFresh()) {
      return;
    }

    isRefreshing.value = true;
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
        temp: data.temp ?? data.temperature ?? null,
        min: data.min ?? data.temp_min ?? null,
        max: data.max ?? data.temp_max ?? null,
        heatIndex: data.heatIndex ?? data.heat_index ?? null,
        condition: data.condition || data.weather || "Weather unavailable",
        location: data.location || data.place || "Current location",
        icon: data.icon || "fas fa-cloud",
        updated_at: data.updated_at || new Date().toISOString(),
      };

      saveCachedWeather(nextWeather);
    } catch (err) {
      console.error("loadWeather error:", err);

      error.value = err?.message || "Unable to load weather right now.";

      // Keep old cached weather. Do not reset card.
      const cached = loadCachedWeather();

      if (cached?.temp !== null && cached?.temp !== undefined) {
        weather.value = cached;
      }
    } finally {
      loading.value = false;
      isRefreshing.value = false;
    }
  }

  return {
    weather,
    loading,
    isRefreshing,
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
      enableHighAccuracy: false,
      timeout: 8000,
      maximumAge: 10 * 60 * 1000,
    });
  });
}