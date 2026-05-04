// src/composables/useTerminals.js
import { ref } from "vue";
import {
  getAdminTerminals,
  getTerminalById,
  getTerminalBusesById,
  createTerminal,
  updateTerminal,
  deleteTerminal,
} from "@/services/api/terminalService";

export function useTerminals() {
  const rows = ref([]);
  const selectedTerminal = ref(null);
  const terminalBuses = ref([]);

  const loading = ref(false);
  const detailLoading = ref(false);
  const busesLoading = ref(false);

  const error = ref("");
  const detailError = ref("");
  const busesError = ref("");

  async function fetchTerminals(params = {}) {
    loading.value = true;
    error.value = "";

    try {
      const res = await getAdminTerminals(params);
      rows.value = Array.isArray(res.data) ? res.data : [];
    } catch (e) {
      error.value =
        e?.response?.data?.message ||
        e?.message ||
        "Failed to load terminals.";
    } finally {
      loading.value = false;
    }
  }

  async function fetchTerminalById(id) {
    detailLoading.value = true;
    detailError.value = "";

    try {
      const res = await getTerminalById(id);
      selectedTerminal.value = res.data || null;
      return res.data;
    } catch (e) {
      detailError.value =
        e?.response?.data?.message ||
        e?.message ||
        "Failed to load terminal.";
      selectedTerminal.value = null;
      throw e;
    } finally {
      detailLoading.value = false;
    }
  }

  async function fetchTerminalBuses(id) {
    busesLoading.value = true;
    busesError.value = "";

    try {
      const res = await getTerminalBusesById(id);
      terminalBuses.value = Array.isArray(res.data) ? res.data : [];
      return terminalBuses.value;
    } catch (e) {
      busesError.value =
        e?.response?.data?.message ||
        e?.message ||
        "Failed to load terminal buses.";
      terminalBuses.value = [];
      throw e;
    } finally {
      busesLoading.value = false;
    }
  }

  async function addTerminal(payload) {
    const res = await createTerminal(payload);
    return res.data;
  }

  async function editTerminal(id, payload) {
    const res = await updateTerminal(id, payload);
    return res.data;
  }

  async function removeTerminal(id) {
    const res = await deleteTerminal(id);
    return res.data;
  }

  return {
    rows,
    selectedTerminal,
    terminalBuses,

    loading,
    detailLoading,
    busesLoading,

    error,
    detailError,
    busesError,

    fetchTerminals,
    fetchTerminalById,
    fetchTerminalBuses,

    addTerminal,
    editTerminal,
    removeTerminal,
  };
}