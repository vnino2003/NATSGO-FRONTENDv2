// src/router/index.js
import { createRouter, createWebHistory } from "vue-router";

import commuterRoutes from "./commuterRoutes";
import adminRoutes from "./adminRoutes";

const APP_TARGET = import.meta.env.VITE_APP_TARGET || "commuter";

console.log("APP_TARGET:", APP_TARGET);

const routes = APP_TARGET === "admin" ? adminRoutes : commuterRoutes;

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (APP_TARGET === "admin") {
    if (to.meta.guestOnly && token && role === "admin") {
      return next("/dashboard");
    }

    if (to.meta.requiresAuth && (!token || role !== "admin")) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      return next("/login");
    }

    return next();
  }

  return next();
});

export default router;