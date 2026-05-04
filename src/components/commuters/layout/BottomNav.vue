<template>
  <nav class="bottom-nav" data-tour="bottom-nav">
    <RouterLink
      to="/home"
      class="nav-item"
      data-tour="nav-home"
      :class="{ active: isActive('home') }"
    >
      <i class="fas fa-home"></i>
      <span>Home</span>
    </RouterLink>

    <RouterLink
      to="/track-bus"
      class="nav-item"
      data-tour="nav-track"
      :class="{ active: isActive('track') }"
    >
      <i class="fas fa-location-dot"></i>
      <span>Track</span>
    </RouterLink>

    <RouterLink
      to="/terminal"
      class="nav-item"
      data-tour="nav-terminal"
      :class="{ active: isActive('terminal') }"
    >
      <i class="fas fa-bus"></i>
      <span>Terminal</span>
    </RouterLink>

    <RouterLink
      to="/settings"
      class="nav-item"
      data-tour="nav-settings"
      :class="{ active: isActive('settings') }"
    >
      <i class="fas fa-cog"></i>
      <span>Settings</span>
    </RouterLink>
  </nav>
</template>

<script setup>
import { useRoute, RouterLink } from "vue-router";

const route = useRoute();

const isActive = (name) => route.name === name;
</script>