// src/composables/useUpdates.js
import { ref, computed } from "vue";

import {
  getPublicAnnouncements,
  getPublicAlerts,
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getAlertTickers,
  createAlertTicker,
  updateAlertTicker,
  deleteAlertTicker,
} from "@/services/api/updateService";

export function useUpdates() {
  const tab = ref("announcements");

  const announcements = ref([]);
  const alerts = ref([]);

  const loading = ref(false);
  const saving = ref(false);
  const error = ref("");

  const announcementCount = computed(() => announcements.value.length);
  const alertCount = computed(() => alerts.value.length);

  async function loadPublicUpdates() {
    loading.value = true;
    error.value = "";

    try {
      const [announcementList, alertList] = await Promise.all([
        getPublicAnnouncements(),
        getPublicAlerts(),
      ]);

      announcements.value = Array.isArray(announcementList)
        ? announcementList
        : [];

      alerts.value = Array.isArray(alertList)
        ? alertList
        : [];
    } catch (err) {
      console.error("loadPublicUpdates error:", err);
      error.value =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load updates";
    } finally {
      loading.value = false;
    }
  }

  async function loadAdminUpdates() {
    loading.value = true;
    error.value = "";

    try {
      const [announcementList, alertList] = await Promise.all([
        getAnnouncements(),
        getAlertTickers(),
      ]);

      announcements.value = Array.isArray(announcementList)
        ? announcementList
        : [];

      alerts.value = Array.isArray(alertList)
        ? alertList
        : [];
    } catch (err) {
      console.error("loadAdminUpdates error:", err);
      error.value =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load updates";
    } finally {
      loading.value = false;
    }
  }

  async function saveAnnouncement(payload, id = null) {
    saving.value = true;
    error.value = "";

    try {
      if (id) {
        await updateAnnouncement(id, payload);
      } else {
        await createAnnouncement(payload);
      }

      await loadAdminUpdates();
    } catch (err) {
      console.error("saveAnnouncement error:", err);
      error.value =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to save announcement";
      throw err;
    } finally {
      saving.value = false;
    }
  }

  async function removeAnnouncement(id) {
    saving.value = true;
    error.value = "";

    try {
      await deleteAnnouncement(id);
      announcements.value = announcements.value.filter((x) => x.id !== id);
    } catch (err) {
      console.error("removeAnnouncement error:", err);
      error.value =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to delete announcement";
      throw err;
    } finally {
      saving.value = false;
    }
  }

  async function saveAlert(payload, id = null) {
    saving.value = true;
    error.value = "";

    try {
      if (id) {
        await updateAlertTicker(id, payload);
      } else {
        await createAlertTicker(payload);
      }

      await loadAdminUpdates();
    } catch (err) {
      console.error("saveAlert error:", err);
      error.value =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to save alert ticker";
      throw err;
    } finally {
      saving.value = false;
    }
  }

  async function removeAlert(id) {
    saving.value = true;
    error.value = "";

    try {
      await deleteAlertTicker(id);
      alerts.value = alerts.value.filter((x) => x.id !== id);
    } catch (err) {
      console.error("removeAlert error:", err);
      error.value =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to delete alert ticker";
      throw err;
    } finally {
      saving.value = false;
    }
  }

  return {
    tab,

    announcements,
    alerts,

    loading,
    saving,
    error,

    announcementCount,
    alertCount,

    loadPublicUpdates,
    loadAdminUpdates,

    saveAnnouncement,
    removeAnnouncement,

    saveAlert,
    removeAlert,
  };
}