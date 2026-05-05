// src/composables/useAdminAccounts.js
import { computed, ref } from "vue";
import {
  getCurrentAdmin,
  getAdminAccounts,
  getAdminRoles,
  createAdminAccount,
  updateAdminAccount,
  updateAdminStatus,
  deleteAdminAccount,
} from "@/services/api/adminAccountService";

const currentAdmin = ref(null);
const adminAccounts = ref([]);
const adminRoles = ref([]);

export function useAdminAccounts() {
  const loading = ref(false);
  const error = ref("");

  const canManageAdmins = computed(() => {
    return currentAdmin.value?.permissions?.can_manage_admins === true;
  });

  async function fetchCurrentAdmin() {
    const res = await getCurrentAdmin();
    currentAdmin.value = res.data;
    return res.data;
  }

  async function fetchAdminRoles() {
    const res = await getAdminRoles();
    adminRoles.value = res.data || [];
    return adminRoles.value;
  }

  async function fetchAdminAccounts(params = {}) {
    const res = await getAdminAccounts(params);
    adminAccounts.value = res.data || [];
    return adminAccounts.value;
  }

  async function loadAdminAccountPage() {
    loading.value = true;
    error.value = "";

    try {
      await Promise.all([
        fetchCurrentAdmin(),
        fetchAdminRoles(),
        fetchAdminAccounts(),
      ]);
    } catch (err) {
      error.value =
        err?.response?.data?.message || "Failed to load admin accounts.";
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function createAdmin(payload) {
    const res = await createAdminAccount(payload);
    adminAccounts.value.unshift(res.data);
    return res.data;
  }

  async function updateAdmin(id, payload) {
    const res = await updateAdminAccount(id, payload);

    const idx = adminAccounts.value.findIndex((a) => a.id === Number(id));
    if (idx !== -1) adminAccounts.value[idx] = res.data;

    if (currentAdmin.value?.id === Number(id)) {
      currentAdmin.value = res.data;
    }

    return res.data;
  }

  async function changeAdminStatus(id, status) {
    const res = await updateAdminStatus(id, status);

    const idx = adminAccounts.value.findIndex((a) => a.id === Number(id));
    if (idx !== -1) adminAccounts.value[idx] = res.data;

    return res.data;
  }

  async function removeAdmin(id) {
    await deleteAdminAccount(id);
    adminAccounts.value = adminAccounts.value.filter(
      (a) => a.id !== Number(id)
    );
  }

  return {
    loading,
    error,
    currentAdmin,
    adminAccounts,
    adminRoles,
    canManageAdmins,
    loadAdminAccountPage,
    fetchCurrentAdmin,
    fetchAdminRoles,
    fetchAdminAccounts,
    createAdmin,
    updateAdmin,
    changeAdminStatus,
    removeAdmin,
  };
}