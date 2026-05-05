<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";

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
import { useAuthStore } from "@/stores/authStore";

const auth = useAuthStore();

const drawerOpen = ref(false);
const authOpen = ref(false);
const notifOpen = ref(false);
const search = ref("");
const authStartView = ref("chooser");

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
} = useNearbyBusAlerts({
  intervalMs: 1500,
  maxNearest: 4,
  nearKm: 1.0,
  cooldownMs: 300000,
});

const popupVisible = ref(false);
const activeNearbyAlert = ref(null);
let popupTimer = null;

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

const latestUnreadNotification = computed(() => {
  return notifications.value.find((n) => !n.read) || notifications.value[0] || null;
});

function showNearbyPopup(notification) {
  if (!notification) return;

  activeNearbyAlert.value = notification;
  popupVisible.value = true;

  playNearbySound();

  if (popupTimer) clearTimeout(popupTimer);

  popupTimer = setTimeout(() => {
    popupVisible.value = false;
  }, 5500);
}

watch(
  () => latestUnreadNotification.value?.id,
  (newId, oldId) => {
    if (!newId || newId === oldId) return;

    const item = latestUnreadNotification.value;
    showNearbyPopup(item);
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
  if (item) item.read = true;
}

function openAuth(view = "chooser") {
  authStartView.value = view;
  authOpen.value = true;
}

async function handleCommuterLogin(payload) {
  try {
    await auth.loginCommuter(payload);
    authOpen.value = false;
  } catch {
    // error is displayed inside AuthModal from auth.error
  }
}

async function handleCommuterSignup(payload) {
  try {
    await auth.signupCommuter(payload);
    authOpen.value = false;
  } catch {
    // error is displayed inside AuthModal from auth.error
  }
}

function handleGoogleLogin() {
  auth.startGoogleLogin();
}

function handleFacebookLogin() {
  auth.startFacebookLogin();
}

function handleForgotPassword(email) {
  alert(
    email
      ? `Password reset is not connected yet for ${email}.`
      : "Password reset is not connected yet."
  );
}

onMounted(async () => {
  await loadPublicUpdates();

  updatesTimer = setInterval(() => {
    loadPublicUpdates();
  }, 5000);
});

onBeforeUnmount(() => {
  if (updatesTimer) clearInterval(updatesTimer);
  if (popupTimer) clearTimeout(popupTimer);
});
</script>

<template>
  <DrawerMenu
    v-model="drawerOpen"
    @open-auth="openAuth('chooser')"
  />

  <NotificationDrawer
    v-model="notifOpen"
    :items="notifications"
    @open="openNotif"
    @dismiss="dismiss"
    @mark-all-read="markAllRead"
    @clear="clearNotifications"
  />

  <AuthModal
    v-model="authOpen"
    :start-view="authStartView"
    :loading="auth.loading"
    :error="auth.error"
    @login="handleCommuterLogin"
    @signup="handleCommuterSignup"
    @google="handleGoogleLogin"
    @facebook="handleFacebookLogin"
    @forgot-password="handleForgotPassword"
  />

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
      <div v-if="auth.isCommuterLoggedIn" class="signed-in-strip">
        <span>
          <i class="fas fa-circle-check"></i>
          Signed in as
          <strong>{{ auth.currentCommuter?.name || auth.currentCommuter?.email }}</strong>
        </span>

        <button type="button" @click="auth.logoutCommuter()">
          Logout
        </button>
      </div>

     <WeatherCard
  :alerts="alerts"
  @dismiss="dismissAdvisory"
/>

<p v-if="error" class="updates-error">
  {{ error }}
</p>
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

.signed-in-strip {
  margin: 0 0 12px;
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.2);
  color: #047857;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
  font-weight: 700;
}

.signed-in-strip span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.signed-in-strip strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.signed-in-strip button {
  border: none;
  background: #047857;
  color: white;
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 11px;
  font-weight: 800;
  cursor: pointer;
  flex-shrink: 0;
}
</style>