// src/router/index.js
import { createRouter, createWebHistory } from "vue-router";

import commuterRoutes from "./commuterRoutes";
import adminRoutes from "./adminRoutes";

import { useAuthStore } from "@/stores/authStore";

const APP_TARGET = import.meta.env.VITE_APP_TARGET || "commuter";

console.log("APP_TARGET:", APP_TARGET);

const callbackRoute = {
  path: "/auth/callback",
  name: "AuthCallback",
  component: () => import("@/pages/AuthCallbackPage.vue"),
};

const routes =
  APP_TARGET === "admin"
    ? [...adminRoutes, callbackRoute]
    : [...commuterRoutes, callbackRoute];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  const auth = useAuthStore();

  if (APP_TARGET === "admin") {
    if (to.meta.guestOnly && auth.isAdminLoggedIn) {
      return "/dashboard";
    }

    if (to.meta.requiresAuth && !auth.isAdminLoggedIn) {
      return "/login";
    }

    if (to.meta.headManagerOnly && !auth.canManageAdmins) {
      return "/dashboard";
    }

    return true;
  }

  if (to.meta.requiresCommuter && !auth.isCommuterLoggedIn) {
    return "/";
  }

  return true;
});

export default router;