// src/composables/useFares.js
import { ref, computed } from "vue";
import {
  getFares,
  getFareByRoute,
  createFare,
  updateFare,
  deleteFare,
  getFareImage,
  uploadFareImage,
  deleteFareImage,
  setFareDisplayMode,
} from "../services/api/fareService";

export function useFares() {
  const rows           = ref([]);
  const selected       = ref(null);
  const loading        = ref(false);
  const saving         = ref(false);
  const error          = ref("");
  const image          = ref(null);
  const uploading      = ref(false);
  const uploadProgress = ref(0);

  const hasError = computed(() => !!error.value);
  const isEmpty  = computed(() => !loading.value && rows.value.length === 0);

  // ── Fetch all ──────────────────────────────────────────────
  async function fetchFares(params = {}) {
    loading.value = true;
    error.value   = "";
    try {
      const res  = await getFares(params);
      rows.value = Array.isArray(res.data) ? res.data : [];
      return rows.value;
    } catch (e) {
      error.value = e?.response?.data?.message || e?.message || "Failed to fetch fares";
      rows.value  = [];
      return [];
    } finally {
      loading.value = false;
    }
  }

  // ── Fetch single ───────────────────────────────────────────
  async function fetchFare(fromId, toId, type) {
    if (!fromId || !toId || !type) return null;
    loading.value = true;
    error.value   = "";
    try {
      const res      = await getFareByRoute(fromId, toId, type);
      selected.value = res.data || null;
      return selected.value;
    } catch (e) {
      error.value    = e?.response?.data?.message || e?.message || "Failed to fetch fare";
      selected.value = null;
      return null;
    } finally {
      loading.value = false;
    }
  }

  // ── Create ─────────────────────────────────────────────────
  // payload: { from_terminal_id, to_terminal_id, type, fares }
  async function addFare(payload) {
    saving.value = true;
    error.value  = "";
    try {
      const res  = await createFare(payload);
      const row  = res.data;
      rows.value = [row, ...rows.value];
      return row;
    } catch (e) {
      error.value = e?.response?.data?.message || e?.message || "Failed to create fare";
      return null;
    } finally {
      saving.value = false;
    }
  }

  // ── Update ─────────────────────────────────────────────────
  // Pass original (fromId, toId, type) so the URL is correct even
  // when the payload renames the route.
  async function editFare(origFromId, origToId, origType, payload) {
    saving.value = true;
    error.value  = "";
    try {
      const res     = await updateFare(origFromId, origToId, origType, payload);
      const updated = res.data;
      rows.value = rows.value.map((r) =>
        r.from_terminal_id === origFromId &&
        r.to_terminal_id   === origToId   &&
        r.type             === origType
          ? updated
          : r
      );
      if (
        selected.value?.from_terminal_id === origFromId &&
        selected.value?.to_terminal_id   === origToId   &&
        selected.value?.type             === origType
      ) {
        selected.value = updated;
      }
      return updated;
    } catch (e) {
      error.value = e?.response?.data?.message || e?.message || "Failed to update fare";
      return null;
    } finally {
      saving.value = false;
    }
  }

  // ── Delete ─────────────────────────────────────────────────
  async function removeFare(fromId, toId, type) {
    saving.value = true;
    error.value  = "";
    try {
      await deleteFare(fromId, toId, type);
      rows.value = rows.value.filter(
        (r) => !(
          r.from_terminal_id === fromId &&
          r.to_terminal_id   === toId   &&
          r.type             === type
        )
      );
      if (
        selected.value?.from_terminal_id === fromId &&
        selected.value?.to_terminal_id   === toId   &&
        selected.value?.type             === type
      ) {
        selected.value = null;
      }
      return true;
    } catch (e) {
      error.value = e?.response?.data?.message || e?.message || "Failed to delete fare";
      return false;
    } finally {
      saving.value = false;
    }
  }

  // ── Image: fetch ───────────────────────────────────────────
  async function fetchFareImage(fromId, toId, type) {
    image.value = null;
    try {
      const res   = await getFareImage(fromId, toId, type);
      image.value = res.data || null;
      return image.value;
    } catch (e) {
      if (e?.response?.status !== 404) {
        error.value = e?.response?.data?.message || e?.message || "Failed to fetch image";
      }
      image.value = null;
      return null;
    }
  }

  // ── Image: upload ──────────────────────────────────────────
  async function uploadImage(fromId, toId, type, file) {
    uploading.value      = true;
    uploadProgress.value = 0;
    error.value          = "";
    try {
      const res   = await uploadFareImage(fromId, toId, type, file, (pct) => {
        uploadProgress.value = pct;
      });
      image.value = res.data || null;
      _patchRowMode(fromId, toId, type, "image");
      return image.value;
    } catch (e) {
      error.value = e?.response?.data?.message || e?.message || "Failed to upload image";
      return null;
    } finally {
      uploading.value      = false;
      uploadProgress.value = 0;
    }
  }

  // ── Image: remove ──────────────────────────────────────────
  async function removeImage(fromId, toId, type) {
    saving.value = true;
    error.value  = "";
    try {
      await deleteFareImage(fromId, toId, type);
      image.value = null;
      _patchRowMode(fromId, toId, type, "manual");
      return true;
    } catch (e) {
      error.value = e?.response?.data?.message || e?.message || "Failed to delete image";
      return false;
    } finally {
      saving.value = false;
    }
  }

  // ── Mode switch ────────────────────────────────────────────
  async function switchMode(fromId, toId, type, mode) {
    const prev = image.value?.display_mode ?? "manual";
    _patchRowMode(fromId, toId, type, mode);
    if (image.value) image.value = { ...image.value, display_mode: mode };
    try {
      await setFareDisplayMode(fromId, toId, type, mode);
      return true;
    } catch (e) {
      _patchRowMode(fromId, toId, type, prev);
      if (image.value) image.value = { ...image.value, display_mode: prev };
      error.value = e?.response?.data?.message || e?.message || "Failed to switch display mode";
      return false;
    }
  }

  function _patchRowMode(fromId, toId, type, mode) {
    const row = rows.value.find(
      (r) => r.from_terminal_id === fromId &&
             r.to_terminal_id   === toId   &&
             r.type             === type
    );
    if (row) row.display_mode = mode;
  }

  function clearSelected() { selected.value = null; }
  function clearError()    { error.value    = "";   }

  return {
    // state
    rows,
    selected,
    loading,
    saving,
    error,
    hasError,
    isEmpty,
    // image state
    image,
    uploading,
    uploadProgress,
    // fare actions
    fetchFares,
    fetchFare,
    addFare,
    editFare,
    removeFare,
    // image actions
    fetchFareImage,
    uploadImage,
    removeImage,
    switchMode,
    clearSelected,
    clearError,
  };
}


// ══════════════════════════════════════════════════════════════
//  usePromotions
// ══════════════════════════════════════════════════════════════
import {
  getPromotions,
  getPromotionById,
  createPromotion,
  updatePromotion,
  deletePromotion,
} from "../services/api/fareService";

export function usePromotions() {
  const rows     = ref([]);
  const selected = ref(null);
  const loading  = ref(false);
  const saving   = ref(false);
  const error    = ref("");

  const hasError = computed(() => !!error.value);
  const isEmpty  = computed(() => !loading.value && rows.value.length === 0);

  const activeCount   = computed(() => rows.value.filter((p) => p.status === "active").length);
  const expiredCount  = computed(() => rows.value.filter((p) => p.status === "expired").length);
  const upcomingCount = computed(() => rows.value.filter((p) => p.status === "upcoming").length);

  async function fetchPromotions(params = {}) {
    loading.value = true;
    error.value   = "";
    try {
      const res  = await getPromotions(params);
      rows.value = Array.isArray(res.data) ? res.data : [];
      return rows.value;
    } catch (e) {
      error.value = e?.response?.data?.message || e?.message || "Failed to fetch promotions";
      rows.value  = [];
      return [];
    } finally {
      loading.value = false;
    }
  }

  async function fetchPromotion(id) {
    if (!id) return null;
    loading.value = true;
    error.value   = "";
    try {
      const res      = await getPromotionById(id);
      selected.value = res.data || null;
      return selected.value;
    } catch (e) {
      error.value    = e?.response?.data?.message || e?.message || "Failed to fetch promotion";
      selected.value = null;
      return null;
    } finally {
      loading.value = false;
    }
  }

  // payload: { name, description, type, value, startDate, endDate,
  //            appliesTo, routes: [{ from_terminal_id, to_terminal_id, route_type? }] }
  async function addPromotion(payload) {
    saving.value = true;
    error.value  = "";
    try {
      const res  = await createPromotion(payload);
      const row  = res.data;
      rows.value = [row, ...rows.value];
      return row;
    } catch (e) {
      error.value = e?.response?.data?.message || e?.message || "Failed to create promotion";
      return null;
    } finally {
      saving.value = false;
    }
  }

  async function editPromotion(id, payload) {
    saving.value = true;
    error.value  = "";
    try {
      const res     = await updatePromotion(id, payload);
      const updated = res.data;
      rows.value    = rows.value.map((p) => (p.id === updated.id ? updated : p));
      if (selected.value?.id === updated.id) selected.value = updated;
      return updated;
    } catch (e) {
      error.value = e?.response?.data?.message || e?.message || "Failed to update promotion";
      return null;
    } finally {
      saving.value = false;
    }
  }

  async function removePromotion(id) {
    saving.value = true;
    error.value  = "";
    try {
      await deletePromotion(id);
      rows.value = rows.value.filter((p) => p.id !== id);
      if (selected.value?.id === id) selected.value = null;
      return true;
    } catch (e) {
      error.value = e?.response?.data?.message || e?.message || "Failed to delete promotion";
      return false;
    } finally {
      saving.value = false;
    }
  }

  function clearSelected() { selected.value = null; }
  function clearError()    { error.value    = "";   }

  return {
    rows, selected, loading, saving, error,
    hasError, isEmpty,
    activeCount, expiredCount, upcomingCount,
    fetchPromotions, fetchPromotion,
    addPromotion, editPromotion, removePromotion,
    clearSelected, clearError,
  };
}