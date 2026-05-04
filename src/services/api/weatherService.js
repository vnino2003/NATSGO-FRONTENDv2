// src/services/api/weatherService.js
import api from "@/services/api/http";

export async function getCurrentWeatherByCoords(lat, lng) {
  const res = await api.get("/weather/current", {
    params: {
      lat,
      lng,
    },
  });

  return res.data?.data || res.data;
}