<!-- src/components/commuters/home/WeatherCard.vue -->
<template>
  <section
    class="weather-card"
    data-tour="weather-card"
    :class="`weather-card--${temperatureMode}`"
  >
    <div class="weather-card__glow"></div>

    <!-- No Location / No Weather State -->
    <div v-if="!hasWeather" class="weather-empty">
      <div class="weather-empty__icon">
        <i class="fas fa-location-dot"></i>
      </div>

      <div class="weather-empty__text">
        <strong>Turn on location</strong>
        <span>Enable location to see weather in your area.</span>
      </div>

      <button class="weather-empty__btn" type="button" @click="loadWeather">
        Retry
      </button>
    </div>

    <!-- Weather Content -->
    <div v-else class="weather-card__content">
      <div class="weather-card__left">
        <div class="weather-card__temp">
          {{ temp }}°
        </div>

        <div class="weather-card__summary">
          <div class="weather-card__temp-label">Actual temp</div>

          <div class="weather-card__condition">
            <i :class="icon"></i>
            <span>{{ condition }}</span>
          </div>

          <div class="weather-card__location">
            <i class="fas fa-location-dot"></i>
            <span>{{ cleanLocation }}</span>
          </div>
        </div>
      </div>

      <div class="weather-card__right">
        <div class="weather-card__label">Today</div>

        <div class="weather-card__range">
          <span>{{ min }}°</span>
          <span class="weather-card__range-separator"></span>
          <span>{{ max }}°</span>
        </div>

        <div class="weather-card__range-label">Low / High</div>

        <div
          v-if="heatIndex !== null"
          class="weather-card__heat"
          :class="`weather-card__heat--${heatLevel}`"
        >
          <i class="fas fa-temperature-high"></i>
          <span>Feels like {{ heatIndex }}°</span>
        </div>
      </div>
    </div>

    <!-- Alert stays visible even without location -->
    <div
      v-if="currentAlert"
      class="weather-alert"
      :class="`weather-alert--${normalizeSeverity(currentAlert.severity)}`"
    >
      <div class="weather-alert__track">
        <span
          class="weather-alert__text"
          :key="currentAlertKey"
          @animationend="showNextAlert"
        >
          {{ currentAlert.title }}
          <template v-if="currentAlert.meta">
            — {{ currentAlert.meta }}
          </template>
        </span>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useWeather } from "@/composables/useWeather";

const props = defineProps({
  alerts: { type: Array, default: () => [] },
});

const {
  hasWeather,
  temp,
  heatIndex,
  min,
  max,
  condition,
  location,
  icon,
  loadWeather,
} = useWeather();

const currentIndex = ref(0);
const animationRound = ref(0);

const safeAlerts = computed(() => {
  return Array.isArray(props.alerts) ? props.alerts : [];
});

const currentAlert = computed(() => {
  if (!safeAlerts.value.length) return null;

  return safeAlerts.value[currentIndex.value % safeAlerts.value.length];
});

const currentAlertKey = computed(() => {
  const alert = currentAlert.value;

  if (!alert) return "empty";

  return `${alert.id || alert.title}-${currentIndex.value}-${animationRound.value}`;
});

const alertSignature = computed(() => {
  return safeAlerts.value
    .map((alert) => {
      return `${alert.id || ""}-${alert.title || ""}-${alert.meta || ""}-${
        alert.severity || ""
      }`;
    })
    .join("|");
});

const cleanLocation = computed(() => {
  const value = String(location.value || "").trim();

  if (!value) return "";

  return value
    .replace("Philippines (the)", "Philippines")
    .replace(", Philippines", "")
    .trim();
});

const temperatureMode = computed(() => {
  if (!hasWeather.value) return "default";

  const value = Number(temp.value);

  if (value >= 35) return "very-hot";
  if (value >= 32) return "hot";
  if (value >= 28) return "warm";
  if (value >= 24) return "mild";

  return "cool";
});

const heatLevel = computed(() => {
  const value = Number(heatIndex.value);

  if (value >= 42) return "danger";
  if (value >= 33) return "caution";

  return "normal";
});

function showNextAlert() {
  if (!safeAlerts.value.length) return;

  currentIndex.value = (currentIndex.value + 1) % safeAlerts.value.length;
  animationRound.value += 1;
}

function normalizeSeverity(severity) {
  const value = String(severity || "info").toLowerCase();

  if (["info", "warning", "error"].includes(value)) {
    return value;
  }

  return "info";
}

watch(
  alertSignature,
  () => {
    if (currentIndex.value >= safeAlerts.value.length) {
      currentIndex.value = 0;
    }

    animationRound.value += 1;
  }
);

onMounted(() => {
  loadWeather();
});
</script>

<style scoped>
.weather-card {
  position: relative;
  overflow: hidden;
  border-radius: 18px;
  color: #ffffff;
  margin-bottom: 24px;
  background:
    radial-gradient(
      circle at top left,
      rgba(255, 255, 255, 0.22),
      transparent 34%
    ),
    linear-gradient(135deg, #0d47a1 0%, #1e88e5 44%, #00acc1 100%);
  box-shadow: 0 14px 30px rgba(14, 116, 144, 0.22);
}

.weather-card--default,
.weather-card--mild {
  background:
    radial-gradient(
      circle at top left,
      rgba(255, 255, 255, 0.24),
      transparent 34%
    ),
    linear-gradient(135deg, #0d47a1 0%, #1e88e5 44%, #00acc1 100%);
}

.weather-card--cool {
  background:
    radial-gradient(
      circle at top left,
      rgba(255, 255, 255, 0.22),
      transparent 34%
    ),
    linear-gradient(135deg, #075985 0%, #0284c7 48%, #06b6d4 100%);
}

.weather-card--warm {
  background:
    radial-gradient(
      circle at top left,
      rgba(255, 255, 255, 0.24),
      transparent 34%
    ),
    linear-gradient(135deg, #0f766e 0%, #0891b2 42%, #f59e0b 100%);
}

.weather-card--hot {
  background:
    radial-gradient(
      circle at top left,
      rgba(255, 255, 255, 0.22),
      transparent 34%
    ),
    linear-gradient(135deg, #b45309 0%, #f59e0b 46%, #ef4444 100%);
}

.weather-card--very-hot {
  background:
    radial-gradient(
      circle at top left,
      rgba(255, 255, 255, 0.2),
      transparent 34%
    ),
    linear-gradient(135deg, #7f1d1d 0%, #dc2626 48%, #f97316 100%);
}

.weather-card__glow {
  position: absolute;
  top: -48px;
  right: -36px;
  width: 140px;
  height: 140px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  filter: blur(2px);
  pointer-events: none;
}

.weather-card__content {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 15px 15px 13px;
}

.weather-card__left {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 13px;
}

.weather-card__temp {
  min-width: 70px;
  font-size: 42px;
  line-height: 1;
  font-weight: 800;
  letter-spacing: -2px;
  display: flex;
  align-items: center;
}

.weather-card__summary {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.weather-card__temp-label {
  width: fit-content;
  padding: 3px 7px;
  border-radius: 999px;
  font-size: 9px;
  font-weight: 800;
  line-height: 1;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(255, 255, 255, 0.88);
  background: rgba(255, 255, 255, 0.14);
}

.weather-card__condition,
.weather-card__location {
  display: flex;
  align-items: center;
  min-width: 0;
}

.weather-card__condition {
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
}

.weather-card__condition i {
  width: 20px;
  font-size: 18px;
  text-align: center;
}

.weather-card__location {
  gap: 7px;
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.78);
}

.weather-card__location span,
.weather-card__condition span {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.weather-card__right {
  flex-shrink: 0;
  text-align: right;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
}

.weather-card__label {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.72);
}

.weather-card__range {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 4px;
  font-size: 19px;
  font-weight: 800;
}

.weather-card__range-separator {
  width: 1px;
  height: 17px;
  border-radius: 99px;
  background: rgba(255, 255, 255, 0.32);
}

.weather-card__range-label {
  margin-top: 2px;
  font-size: 10px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.66);
}

.weather-card__heat {
  margin-top: 6px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  max-width: 125px;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 800;
  line-height: 1;
  white-space: nowrap;
  color: rgba(255, 255, 255, 0.94);
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.16);
}

.weather-card__heat i {
  font-size: 10px;
}

.weather-card__heat--normal {
  background: rgba(255, 255, 255, 0.14);
}

.weather-card__heat--caution {
  background: rgba(245, 158, 11, 0.3);
  border-color: rgba(255, 255, 255, 0.2);
}

.weather-card__heat--danger {
  background: rgba(239, 68, 68, 0.36);
  border-color: rgba(255, 255, 255, 0.22);
}

.weather-empty {
  position: relative;
  z-index: 1;
  min-height: 92px;
  padding: 15px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.weather-empty__icon {
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 14px;
  font-size: 17px;
  color: #ffffff;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.16);
}

.weather-empty__text {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.weather-empty__text strong {
  font-size: 15px;
  font-weight: 800;
}

.weather-empty__text span {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.76);
  line-height: 1.3;
}

.weather-empty__btn {
  flex-shrink: 0;
  border: none;
  outline: none;
  cursor: pointer;
  padding: 8px 11px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  color: #0f172a;
  background: rgba(255, 255, 255, 0.92);
}

.weather-alert {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  min-height: 34px;
  border-top: 1px solid rgba(255, 255, 255, 0.13);
  background: rgba(0, 0, 0, 0.2);
}

.weather-alert--info {
  background: rgba(0, 0, 0, 0.2);
}

.weather-alert--warning {
  background: rgba(245, 158, 11, 0.28);
}

.weather-alert--error {
  background: rgba(239, 68, 68, 0.34);
}

.weather-alert__track {
  flex: 1;
  overflow: hidden;
  white-space: nowrap;
}

.weather-alert__text {
  display: inline-block;
  padding-left: 100%;
  animation: weather-alert-scroll 14s linear forwards;
  font-size: 12px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
}

@keyframes weather-alert-scroll {
  0% {
    transform: translateX(0);
  }

  100% {
    transform: translateX(-120%);
  }
}

@media (max-width: 380px) {
  .weather-card__content {
    padding: 14px 13px 12px;
  }

  .weather-card__left {
    gap: 10px;
  }

  .weather-card__temp {
    min-width: 58px;
    font-size: 36px;
  }

  .weather-card__range {
    font-size: 17px;
  }

  .weather-card__condition {
    font-size: 13px;
  }

  .weather-card__location {
    max-width: 125px;
  }

  .weather-card__heat {
    max-width: 118px;
    padding: 4px 7px;
    font-size: 9px;
  }

  .weather-empty {
    min-height: 88px;
    padding: 14px;
  }

  .weather-empty__btn {
    padding: 7px 10px;
  }
}
</style>