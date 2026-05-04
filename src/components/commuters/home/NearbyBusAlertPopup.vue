<template>
  <transition name="nearby-pop">
    <div v-if="visible && alert" class="nearby-alert">
      <div class="nearby-alert__icon">
        <i class="fas fa-bus"></i>
      </div>

      <div class="nearby-alert__content" @click="$emit('open', alert)">
        <div class="nearby-alert__top">
          <h4>{{ title }}</h4>
          <span>{{ timeText }}</span>
        </div>

        <p>{{ message }}</p>

        <div class="nearby-alert__meta">
          <span v-if="routeName">
            <i class="fas fa-route"></i>
            {{ routeName }}
          </span>

          <span v-if="distanceText">
            <i class="fas fa-location-dot"></i>
            {{ distanceText }}
          </span>
        </div>
      </div>

      <button class="nearby-alert__close" type="button" @click="$emit('close', alert)">
        <i class="fas fa-xmark"></i>
      </button>
    </div>
  </transition>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  alert: {
    type: Object,
    default: null,
  },
  visible: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["open", "close"]);

const title = computed(() => {
  return (
    props.alert?.title ||
    props.alert?.bus_name ||
    props.alert?.busName ||
    "Nearby Bus Alert"
  );
});

const message = computed(() => {
  return (
    props.alert?.message ||
    props.alert?.body ||
    "A bus is nearby your current location."
  );
});

const routeName = computed(() => {
  return (
    props.alert?.route_name ||
    props.alert?.routeName ||
    props.alert?.route ||
    ""
  );
});

const distanceText = computed(() => {
  const raw =
    props.alert?.distanceKm ??
    props.alert?.distance_km ??
    props.alert?.distance;

  if (raw === null || raw === undefined || raw === "") return "";

  const num = Number(raw);

  if (Number.isNaN(num)) return String(raw);

  if (num < 1) {
    return `${Math.round(num * 1000)}m away`;
  }

  return `${num.toFixed(1)}km away`;
});

const timeText = computed(() => {
  return props.alert?.timeText || props.alert?.time || "Just now";
});
</script>

<style scoped>
.nearby-alert {
  position: fixed;
  top: 78px;
  left: 50%;
  transform: translateX(-50%);
  width: min(92vw, 380px);
  z-index: 9500;

  display: flex;
  align-items: flex-start;
  gap: 12px;

  padding: 14px 14px;
  border-radius: 18px;

  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(226, 232, 240, 0.95);
  box-shadow: 0 16px 42px rgba(15, 23, 42, 0.16);

  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}

.nearby-alert__icon {
  width: 42px;
  height: 42px;
  flex: 0 0 42px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 14px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 17px;
}

.nearby-alert__content {
  flex: 1;
  min-width: 0;
  cursor: pointer;
}

.nearby-alert__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 4px;
}

.nearby-alert__top h4 {
  margin: 0;
  font-size: 13.5px;
  font-weight: 800;
  color: #111827;
  line-height: 1.2;
}

.nearby-alert__top span {
  flex: 0 0 auto;
  font-size: 10.5px;
  font-weight: 700;
  color: #9ca3af;
}

.nearby-alert__content p {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  color: #4b5563;
  line-height: 1.4;
}

.nearby-alert__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 8px;
}

.nearby-alert__meta span {
  display: inline-flex;
  align-items: center;
  gap: 5px;

  padding: 5px 8px;
  border-radius: 999px;

  background: #f3f4f6;
  color: #374151;

  font-size: 10.5px;
  font-weight: 800;
}

.nearby-alert__close {
  width: 30px;
  height: 30px;
  flex: 0 0 30px;

  border: none;
  border-radius: 10px;

  display: flex;
  align-items: center;
  justify-content: center;

  background: #f3f4f6;
  color: #6b7280;
  cursor: pointer;
}

.nearby-alert__close:active {
  transform: scale(0.94);
}

.nearby-pop-enter-active,
.nearby-pop-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.nearby-pop-enter-from,
.nearby-pop-leave-to {
  opacity: 0;
  transform: translate(-50%, -14px) scale(0.96);
}
</style>