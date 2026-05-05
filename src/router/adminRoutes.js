// src/router/adminRoutes.js
import AdminLayout from "../layouts/AdminLayout.vue";

import AdminDashboard from "../pages/admin/AdminDashboard.vue";
import AdminBusesPage from "../pages/admin/AdminBusesPage.vue";
import AdminBusesDetailsPage from "../pages/admin/AdminBusesDetailsPage.vue";
import AdminNotificationPage from "../pages/admin/AdminNotificationPage.vue";
import AdminLiveTrackPage from "../pages/admin/AdminLiveTrackPage.vue";
import AdminTerminalPage from "../pages/admin/AdminTerminalPage.vue";
import AdminTerminalDetailsPage from "../pages/admin/AdminTerminalDetailsPage.vue";
import AdminRoutesPage from "../pages/admin/AdminRoutesPage.vue";
import AdminAnalyticsPage from "../pages/admin/AdminAnalyticsPage.vue";
import AdminFarePage from "../pages/admin/AdminFarePage.vue";
import AdminAnnouncementPage from "../pages/admin/AdminAnnouncementPage.vue";
import AdminSettingPage from "../pages/admin/AdminSettingPage.vue";

import IoTDevices from "../pages/admin/iot/Devices.vue";
import IoTAssignments from "../pages/admin/iot/assignment.vue";

import AdminLoginPage from "../pages/admin/AdminLoginPage.vue";
import AdminAccountPage from "../pages/admin/AdminAccountPage.vue";

export default [
  {
    path: "/login",
    name: "adminLogin",
    component: AdminLoginPage,
    meta: { guestOnly: true },
  },

  {
    path: "/",
    component: AdminLayout,
    meta: { requiresAuth: true, role: "admin" },
    children: [
      {
        path: "",
        redirect: "/dashboard",
      },

      {
        path: "dashboard",
        name: "adminDashboard",
        component: AdminDashboard,
      },

      {
        path: "live",
        name: "adminLive",
        component: AdminLiveTrackPage,
      },

      {
        path: "buses",
        name: "adminBuses",
        component: AdminBusesPage,
      },

      {
        path: "buses/:id",
        name: "adminBusDetails",
        component: AdminBusesDetailsPage,
      },

      {
        path: "iot",
        children: [
          {
            path: "",
            redirect: "/iot/devices",
          },
          {
            path: "devices",
            name: "adminIoTDevices",
            component: IoTDevices,
          },
          {
            path: "assignments",
            name: "adminIoTAssignments",
            component: IoTAssignments,
          },
        ],
      },

       {
        path: "users",
        children: [
          {
            path: "",
            redirect: "/iot/commuters",
          },
          {
            path: "devices",
            name: "adminIoTDevices",
            component: IoTDevices,
          },
          {
            path: "admins",
            name: "adminAccount",
            component: AdminAccountPage,
          },
        ],
      },

      {
        path: "terminals",
        name: "adminTerminals",
        component: AdminTerminalPage,
      },

      {
        path: "terminals/:id",
        name: "adminTerminalDetails",
        component: AdminTerminalDetailsPage,
      },

      {
        path: "alerts",
        name: "adminAlerts",
        component: AdminNotificationPage,
      },

      {
        path: "routes",
        name: "adminRoutes",
        component: AdminRoutesPage,
      },

      {
        path: "analytics",
        name: "adminAnalytics",
        component: AdminAnalyticsPage,
      },

      {
        path: "settings",
        name: "adminSettings",
        component: AdminSettingPage,
      },
      {
        path: "users/admins",
        name: "adminAccount",
        component: AdminAccountPage,
      },

      {
        path: "fare-promos",
        name: "adminFarePromos",
        component: AdminFarePage,
      },

      {
        path: "announcements-alert",
        name: "adminAnnouncementsAlert",
        component: AdminAnnouncementPage,
      },
    ],
  },

  /*
    Backward compatibility:
    If your old sidebar still uses /admin/dashboard, /admin/live, etc.,
    this redirects them to /dashboard, /live, etc.
  */
  {
    path: "/admin",
    redirect: "/dashboard",
  },

  {
    path: "/admin/:pathMatch(.*)*",
    redirect: (to) => {
      const pathMatch = to.params.pathMatch;

      const path = Array.isArray(pathMatch)
        ? pathMatch.join("/")
        : pathMatch || "dashboard";

      return `/${path}`;
    },
  },

  {
    path: "/:pathMatch(.*)*",
    redirect: "/dashboard",
  },
];