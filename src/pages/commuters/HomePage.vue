<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";

import DrawerMenu         from "@/components/commuters/home/DrawerMenu.vue";
import HomeHeader         from "@/components/commuters/home/HomeHeader.vue";
import AuthModal          from "@/components/commuters/authModal/AuthModal.vue";
import WeatherCard        from "@/components/commuters/home/WeatherCard.vue";
import HomeTabs           from "@/components/commuters/home/HomeTabs/HomeTabs.vue";
import NotificationDrawer from "@/components/commuters/home/NotificationDrawer.vue";
import CriticalAlertModal from "@/components/commuters/home/CriticalAlertModal.vue";

import { useNearbyBusAlerts } from "@/composables/useNearbyBusAlerts";
import { useUpdates } from "@/composables/useUpdates";

const drawerOpen = ref(false);
const authOpen   = ref(false);
const notifOpen  = ref(false);
const search     = ref("");

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
  cooldownMs: 300000, // 5 minutes
// dismissCooldownMs: 10000,
// clearCooldownMs: 10000,
});
function openNotif(n) {
  markRead(n.id);
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

onMounted(async () => {
  await loadPublicUpdates();

  updatesTimer = setInterval(() => {
    loadPublicUpdates();
  }, 5000);
});

onBeforeUnmount(() => {
  if (updatesTimer) clearInterval(updatesTimer);
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

  <div id="home" class="page active">
    <HomeHeader
      v-model="search"
      :unread="unreadCount"
      @open-drawer="drawerOpen = true"
      @open-notif="notifOpen = true"
    />

    <div class="page-content">
      <p v-if="loading && !announcements.length && !alerts.length" class="updates-loading">
        Loading updates...
      </p>

      <p v-if="error" class="updates-error">
        {{ error }}
      </p>

      <WeatherCard
        :alerts="alerts"
        @dismiss="dismissAdvisory"
      />

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