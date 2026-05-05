<template>
  <!-- Backdrop for mobile drawer -->
  <div
    v-if="drawer && !collapsed"
    class="as-backdrop"
    @click="$emit('update:collapsed', true)"
  ></div>

  <aside
    class="admin-sidebar"
    :class="{
      collapsed: collapsed,
      drawer: drawer,
      open: drawer && !collapsed,
    }"
  >
    <!-- Brand -->
    <div class="as-brand">
      <div class="as-logo">
        <span class="as-logo-letter">N</span>
      </div>

      <div v-if="!collapsed" class="as-brand-text">
        <p class="as-name">NATSGO</p>
        <p class="as-sub">System</p>
      </div>
    </div>

    <!-- Nav -->
    <nav class="as-nav">
      <RouterLink class="as-item" to="/admin/dashboard" title="Dashboard">
        <i class="fas fa-chart-line"></i>
        <span v-if="!collapsed">Dashboard</span>
      </RouterLink>

      <!-- Operations -->
      <p v-if="!collapsed" class="as-section">Operations</p>

      <RouterLink class="as-item" to="/admin/live">
        <i class="fas fa-map-location-dot"></i>
        <span v-if="!collapsed">Live Tracking</span>
      </RouterLink>

      <RouterLink class="as-item" to="/admin/buses">
        <i class="fas fa-bus"></i>
        <span v-if="!collapsed">Buses</span>
      </RouterLink>

    
      <RouterLink class="as-item" to="/admin/terminals">
        <i class="fas fa-warehouse"></i>
        <span v-if="!collapsed">Terminals</span>
      </RouterLink>

      <!-- IoT -->
      <p v-if="!collapsed" class="as-section">IoT</p>

      <button
        class="as-item as-item-btn"
        type="button"
        :class="{ activeish: isIoTRoute }"
        :title="collapsed ? 'IoT' : ''"
        @click="toggleIoT"
      >
        <i class="fas fa-microchip"></i>

        <span v-if="!collapsed" class="as-item-flex">
          <span>IoT</span>
          <i
            class="fas as-caret"
            :class="iotOpen ? 'fa-chevron-up' : 'fa-chevron-down'"
          ></i>
        </span>
      </button>

      <div class="as-submenu" :class="{ open: iotOpen && !collapsed }">
        <RouterLink class="as-subitem" to="/admin/iot/devices">
          <i class="fas fa-sim-card"></i>
          <span>Devices</span>
        </RouterLink>

        <RouterLink class="as-subitem" to="/admin/iot/assignments">
          <i class="fas fa-link"></i>
          <span>Assignments</span>
        </RouterLink>
      </div>

      <!-- Monitoring -->
      <p v-if="!collapsed" class="as-section">Monitoring</p>

      <RouterLink class="as-item" to="/admin/alerts">
        <i class="fas fa-bell"></i>
        <span v-if="!collapsed">Alerts & Logs</span>
      </RouterLink>

      <RouterLink class="as-item" to="/admin/analytics">
        <i class="fas fa-chart-pie"></i>
        <span v-if="!collapsed"></span>
      </RouterLink>

      <!-- System -->
      <p v-if="!collapsed" class="as-section">System</p>

      <!-- Users Dropdown -->
      <button
        class="as-item as-item-btn"
        type="button"
        :class="{ activeish: isUsersRoute }"
        :title="collapsed ? 'Users' : ''"
        @click="toggleUsers"
      >
        <i class="fas fa-users"></i>

        <span v-if="!collapsed" class="as-item-flex">
          <span>Users</span>
          <i
            class="fas as-caret"
            :class="usersOpen ? 'fa-chevron-up' : 'fa-chevron-down'"
          ></i>
        </span>
      </button>

      <div class="as-submenu" :class="{ open: usersOpen && !collapsed }">
        <RouterLink class="as-subitem" to="/admin/users/commuters">
          <i class="fas fa-user"></i>
          <span>Commuters</span>
        </RouterLink>

        <RouterLink class="as-subitem" to="/admin/users/admins">
          <i class="fas fa-user-shield"></i>
          <span>Admins</span>
        </RouterLink>
      </div>

   

      <RouterLink class="as-item" to="/admin/fare-promos">
        <i class="fas fa-money-bill-wave"></i>
        <span v-if="!collapsed">Fare & Promos</span>
      </RouterLink>

      <RouterLink class="as-item" to="/admin/announcements-alert">
        <i class="fas fa-bullhorn"></i>
        <span v-if="!collapsed">Announcements & Alert tickets</span>
      </RouterLink>
         <RouterLink class="as-item" to="/admin/settings">
        <i class="fas fa-gear"></i>
        <span v-if="!collapsed">Settings</span>
      </RouterLink>
    </nav>

    <!-- Footer -->
    <button
      class="as-collapse"
      type="button"
      @click="$emit('update:collapsed', !collapsed)"
    >
      <i
        class="fas"
        :class="collapsed ? 'fa-angles-right' : 'fa-angles-left'"
      ></i>
      <span v-if="!collapsed">Collapse</span>
    </button>
  </aside>
</template>

<script setup>
import { computed, ref, watchEffect } from "vue";
import { useRoute } from "vue-router";

const props = defineProps({
  collapsed: { type: Boolean, default: true },
  drawer: { type: Boolean, default: false },
});

defineEmits(["update:collapsed"]);

const collapsed = computed(() => props.collapsed);
const drawer = computed(() => props.drawer);

const route = useRoute();

/* IoT dropdown */
const isIoTRoute = computed(() =>
  String(route.path || "").startsWith("/admin/iot")
);

const iotOpen = ref(false);

function toggleIoT() {
  if (collapsed.value) return;
  iotOpen.value = !iotOpen.value;
}

/* Users dropdown */
const isUsersRoute = computed(() =>
  String(route.path || "").startsWith("/admin/users")
);

const usersOpen = ref(false);

function toggleUsers() {
  if (collapsed.value) return;
  usersOpen.value = !usersOpen.value;
}

/* Auto-open dropdowns based on route */
watchEffect(() => {
  if (collapsed.value) return;

  if (isIoTRoute.value) {
    iotOpen.value = true;
  }

  if (isUsersRoute.value) {
    usersOpen.value = true;
  }
});
</script>