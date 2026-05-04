<template>
  <div class="app-shell">
    <div class="app-container">
      <router-view />
    </div>

    <BottomNav />

    <!-- Global Location Gate Overlay -->
    <transition name="fade">
      <div v-if="showGate" class="loc-overlay">
        <div class="loc-card">
          <div class="loc-icon">
            <i class="fas fa-location-dot"></i>
          </div>

          <h3 class="loc-title">{{ gateTitle }}</h3>
          <p class="loc-text">{{ gateText }}</p>

          <div class="loc-status" :class="statusClass">
            <span v-if="status === 'idle'">
              <i class="fas fa-circle-info"></i>
              Tap to enable location
            </span>

            <span v-else-if="status === 'requesting'">
              <i class="fas fa-spinner fa-spin"></i>
              Turning on location…
            </span>

            <span v-else-if="status === 'connected'">
              <i class="fas fa-check"></i>
              Location connected
            </span>

            <span v-else-if="status === 'denied'">
              <i class="fas fa-triangle-exclamation"></i>
              Location blocked
            </span>

            <span v-else>
              <i class="fas fa-triangle-exclamation"></i>
              Location unavailable
            </span>
          </div>

          <button
            class="loc-btn primary"
            type="button"
            @click="enableLocation"
            :disabled="status === 'requesting'"
          >
            <i class="fas fa-location-dot"></i>
            Turn On Location
          </button>

          <button class="loc-btn ghost" type="button" @click="skipLocation">
            Use Without Location
          </button>

          <div v-if="status === 'denied'" class="loc-help">
            <div class="loc-help-title">
              <i class="fas fa-gear"></i>
              How to allow
            </div>

            <ul>
              <li>Chrome: click 🔒 → Site settings → Location → Allow</li>
              <li>Turn ON location in device settings</li>
              <li>Refresh the page, then tap "Turn On Location"</li>
              <li>Requires HTTPS or localhost</li>
            </ul>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import "../assets/css/styles.css";

import { computed, nextTick, onMounted, ref, watch } from "vue";

import BottomNav from "../components/commuters/layout/BottomNav.vue";

import { useUserLocation } from "@/composables/useUserLocation";
import { useCommuterDriverTour } from "@/composables/useCommuterDriverTour";

const { status, startLocation, getPermissionState } = useUserLocation();
const { startTour } = useCommuterDriverTour();

const dismissed = ref(false);
const readyToShowGate = ref(false);

const showGate = computed(() => {
  if (!readyToShowGate.value) return false;
  if (dismissed.value) return false;

  return status.value !== "connected";
});

const gateTitle = computed(() => {
  if (status.value === "requesting") return "Turning On Location…";
  if (status.value === "denied") return "Location Blocked";
  if (status.value === "error") return "Location Unavailable";
  if (status.value === "connected") return "Location Connected";

  return "Turn On Location";
});

const gateText = computed(() => {
  if (status.value === "connected") {
    return "Near-bus alerts are now enabled.";
  }

  if (status.value === "denied") {
    return "Location is blocked. Allow it in your browser settings to get near-bus notifications.";
  }

  if (status.value === "error") {
    return "Location is needed for near-bus notifications. You can still use the app without it.";
  }

  if (status.value === "requesting") {
    return "Please allow location permission to see nearby buses and real-time alerts.";
  }

  return "Enable location to see nearby buses and get real-time alerts.";
});

const statusClass = computed(() => {
  if (status.value === "connected") return "ok";

  if (status.value === "denied" || status.value === "error") {
    return "bad";
  }

  if (status.value === "requesting") return "warn";

  return "";
});

function enableLocation() {
  startLocation({ highAccuracy: true });
}

function skipLocation() {
  dismissed.value = true;

  nextTick(() => {
    startTourIfReady();
  });
}

function startTourIfReady() {
  if (showGate.value) return;

  nextTick(() => {
    startTour(false);
  });
}

watch(
  () => status.value,
  (newStatus) => {
    if (newStatus === "connected") {
      dismissed.value = true;

      nextTick(() => {
        startTourIfReady();
      });
    }
  }
);

onMounted(async () => {
  try {
    const perm = await getPermissionState();

    if (perm === "granted") {
      dismissed.value = true;
      readyToShowGate.value = true;

      startLocation({ highAccuracy: true });

      nextTick(() => {
        startTourIfReady();
      });

      return;
    }

    readyToShowGate.value = true;
  } catch (err) {
    readyToShowGate.value = true;
  }
});
</script>

<style scoped>
.app-shell {
  position: relative;
  min-height: 100vh;
}

/* ── Overlay ── */
.loc-overlay {
  position: fixed;
  inset: 0;
  background: rgba(249, 250, 251, 0.88);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 16px;
}

/* ── Card ── */
.loc-card {
  width: min(380px, 100%);
  background: #ffffff;
  border: 1px solid #eef0f4;
  border-radius: 20px;
  padding: 24px 20px 20px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.1);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* ── Icon ── */
.loc-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: #eff6ff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2563eb;
  font-size: 20px;
  margin-bottom: 14px;
}

/* ── Text ── */
.loc-title {
  margin: 0 0 6px;
  font-size: 17px;
  font-weight: 700;
  color: #111827;
  letter-spacing: -0.01em;
}

.loc-text {
  margin: 0 0 14px;
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  line-height: 1.55;
  max-width: 280px;
}

/* ── Status pill ── */
.loc-status {
  width: 100%;
  border-radius: 10px;
  padding: 9px 12px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid #eef0f4;
  background: #f9fafb;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-bottom: 12px;
}

.loc-status.warn {
  color: #b45309;
  border-color: #fde68a;
  background: #fefce8;
}

.loc-status.ok {
  color: #16a34a;
  border-color: #bbf7d0;
  background: #f0fdf4;
}

.loc-status.bad {
  color: #dc2626;
  border-color: #fecaca;
  background: #fef2f2;
}

/* ── Buttons ── */
.loc-btn {
  width: 100%;
  border: none;
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  margin-top: 8px;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    background 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}

.loc-btn:active {
  transform: scale(0.97);
}

.loc-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loc-btn.primary {
  background: #2563eb;
  color: #fff;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);
}

.loc-btn.primary:active {
  box-shadow: 0 2px 6px rgba(37, 99, 235, 0.2);
}

.loc-btn.ghost {
  background: #f3f4f6;
  color: #374151;
}

.loc-btn.ghost:active {
  background: #e5e7eb;
}

/* ── Help box ── */
.loc-help {
  margin-top: 14px;
  width: 100%;
  text-align: left;
  border: 1px dashed #e5e7eb;
  border-radius: 12px;
  padding: 12px 14px;
  background: #f9fafb;
}

.loc-help-title {
  font-size: 12px;
  font-weight: 700;
  color: #374151;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.loc-help ul {
  margin: 0;
  padding-left: 16px;
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  line-height: 1.65;
}

/* ── Transition ── */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.22s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>