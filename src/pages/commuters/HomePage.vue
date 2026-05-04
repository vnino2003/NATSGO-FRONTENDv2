<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from "vue";

import DrawerMenu from "@/components/commuters/home/DrawerMenu.vue";
import HomeHeader from "@/components/commuters/home/HomeHeader.vue";
import AuthModal from "@/components/commuters/authModal/AuthModal.vue";
import WeatherCard from "@/components/commuters/home/WeatherCard.vue";
import HomeTabs from "@/components/commuters/home/HomeTabs/HomeTabs.vue";
import NotificationDrawer from "@/components/commuters/home/NotificationDrawer.vue";
import CriticalAlertModal from "@/components/commuters/home/CriticalAlertModal.vue";
import NearbyBusAlertPopup from "@/components/commuters/home/NearbyBusAlertPopup.vue";

import { useNearbyBusAlerts } from "@/composables/useNearbyBusAlerts";
import { useUpdates } from "@/composables/useUpdates";

const drawerOpen = ref(false);
const authOpen = ref(false);
const notifOpen = ref(false);
const search = ref("");

const {
  announcements,
  alerts,
  loading,
  error,
  loadPublicUpdates,
} = useUpdates();

let updatesTimer = null;

const {
  notifications,
  unreadCount,
  markRead,
  markAllRead,
  dismiss,
  clear: clearNotifications,

  /*
    NEW:
    These are from useNearbyBusAlerts.
    This is what makes the popup dynamic.
  */
  latestPopupAlert,
  popupEventId,
} = useNearbyBusAlerts({
  intervalMs: 1500,
  maxNearest: 4,
  nearKm: 1.0,
  cooldownMs: 300000,
});

const popupVisible = ref(false);
const activeNearbyAlert = ref(null);
let popupTimer = null;

/*
  Sound helper.
  Uses Web Audio API para kahit wala kang mp3 file.
*/
let audioCtx = null;

function playNearbySound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    if (!audioCtx) {
      audioCtx = new AudioContext();
    }

    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }

    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    oscillator.type = "sine";

    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
    oscillator.frequency.setValueAtTime(660, audioCtx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, audioCtx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.38);

    oscillator.connect(gain);
    gain.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.4);
  } catch (err) {
    console.warn("Nearby alert sound blocked or unavailable:", err);
  }
}

function showNearbyPopup(notification) {
  if (!notification) return;

  activeNearbyAlert.value = notification;
  popupVisible.value = true;

  playNearbySound();

  if (popupTimer) {
    clearTimeout(popupTimer);
  }

  popupTimer = setTimeout(() => {
    popupVisible.value = false;
  }, 5500);
}

/*
  NEW DYNAMIC WATCHER:
  Hindi na notification id ang basis.
  Every time may real nearby bus event,
  popupEventId increases, then lalabas popup.
*/
watch(
  popupEventId,
  () => {
    if (!latestPopupAlert.value) return;

    showNearbyPopup(latestPopupAlert.value);
  }
);

function openNotif(n) {
  if (!n) return;

  markRead(n.id);
  notifOpen.value = true;
  popupVisible.value = false;
}

function closeNearbyPopup(n) {
  popupVisible.value = false;

  if (n?.id) {
    markRead(n.id);
  }
}

const criticalAlert = ref({
  show: false,
  title: "Route 12 Suspended",
  subtitle: "Due to severe flooding along Rizal Ave.",
  body: "All Route 12 buses are suspended. Please use Route 5 or Route 8.",
  affectedRoutes: ["Route 12"],
  timestamp: "Updated 2:45 PM",
});

function dismissAdvisory(id) {
  alerts.value = alerts.value.filter((a) => a.id !== id);
}

function markAnnouncementRead(id) {
  const item = announcements.value.find((a) => a.id === id);

  if (item) {
    item.read = true;
  }
}

onMounted(async () => {
  await loadPublicUpdates();

  updatesTimer = setInterval(() => {
    loadPublicUpdates();
  }, 5000);
});

onBeforeUnmount(() => {
  if (updatesTimer) {
    clearInterval(updatesTimer);
  }

  if (popupTimer) {
    clearTimeout(popupTimer);
  }
});
</script>

<template>
  <DrawerMenu v-model="drawerOpen" @open-auth="authOpen = true" />

  <NotificationDrawer
    v-model="notifOpen"
    :items="notifications"
    @open="openNotif"
    @dismiss="dismiss"
    @mark-all-read="markAllRead"
    @clear="clearNotifications"
  />

  <AuthModal v-model="authOpen" />

  <NearbyBusAlertPopup
    :visible="popupVisible"
    :alert="activeNearbyAlert"
    @open="openNotif"
    @close="closeNearbyPopup"
  />

  <CriticalAlertModal
    v-if="criticalAlert.show"
    :alert="criticalAlert"
    @close="criticalAlert.show = false"
  />

  <div id="home" class="page active">
    <HomeHeader
      v-model="search"
      :unread="unreadCount"
      @open-drawer="drawerOpen = true"
      @open-notif="notifOpen = true"
    />

    <div class="page-content">
      <p
        v-if="loading && !announcements.length && !alerts.length"
        class="updates-loading"
      >
        Loading updates...
      </p>

      <p v-if="error" class="updates-error">
        {{ error }}
      </p>

      <WeatherCard :alerts="alerts" @dismiss="dismissAdvisory" />

      <HomeTabs
        :announcements="announcements"
        @read="markAnnouncementRead"
      />
    </div>
  </div>
</template>

<style scoped>
.updates-loading,
.updates-error {
  margin: 0 0 10px;
  font-size: 12px;
  font-weight: 600;
}

.updates-loading {
  color: #6b7280;
}

.updates-error {
  color: #dc2626;
}
</style>