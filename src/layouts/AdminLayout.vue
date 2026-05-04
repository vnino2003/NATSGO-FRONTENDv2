<template>
  <div class="admin-layout">
    <AdminSidebar
      v-model:collapsed="sidebarCollapsed"
      :drawer="isDrawerMode"
    />

    <div class="admin-main">
      <AdminTopbar
        :collapsed="sidebarCollapsed"
        @toggle-sidebar="toggleSidebar"
      />

      <main class="admin-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";

import "../assets/css/admin.css";
import AdminSidebar from "../components/admin/layout/AdminSidebar.vue";
import AdminTopbar from "../components/admin/layout/AdminTopbar.vue";
import { useNotificationToasts } from "@/composables/useNotificationToasts";

// On mobile, sidebar starts closed (collapsed = true)
// On desktop, sidebar starts open (collapsed = false)
const MOBILE_BP = 980;

const isDrawerMode = ref(window.innerWidth <= MOBILE_BP);
const sidebarCollapsed = ref(window.innerWidth <= MOBILE_BP); // closed by default on mobile

function onResize() {
  isDrawerMode.value = window.innerWidth <= MOBILE_BP;
  // auto-close when resizing into mobile
  if (isDrawerMode.value) sidebarCollapsed.value = true;
}

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value;
}

const router = useRouter();
const toastFeed = useNotificationToasts({
  pollMs: 3000,
  previewLimit: 5,
  autoCloseMs: 5000,
});

function goNotifications() {
  router.push("/admin/notifications");
}

onMounted(() => {
  window.addEventListener("resize", onResize);
  toastFeed.start({ onOpenNotifications: goNotifications });
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", onResize);
  toastFeed.stop();
});
</script>