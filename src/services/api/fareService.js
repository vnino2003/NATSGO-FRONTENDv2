// src/services/api/fareService.js
import api from "./http";

// ══════════════════════════════════════════════════════════════
//  FARE MATRIX
//  Route identity: { fromId, toId, type } — integer terminal IDs.
// ══════════════════════════════════════════════════════════════

/**
 * List all grouped routes with their fares.
 * @param {{ q?: string }} params
 */
export function getFares(params = {}) {
  return api.get("/admin/fares", { params });
}

/**
 * Get a single route's fares.
 * @param {number} fromId
 * @param {number} toId
 * @param {string} type
 */
export function getFareByRoute(fromId, toId, type) {
  return api.get(
    `/admin/fares/${fromId}/${toId}/${encodeURIComponent(type)}`
  );
}

/**
 * Create a new route with all four passenger fares.
 * @param {{
 *   from_terminal_id: number,
 *   to_terminal_id: number,
 *   type: string,
 *   fares: FaresMap
 * }} payload
 */
export function createFare(payload) {
  return api.post("/admin/fares", payload);
}

/**
 * Update an existing route's identity and/or fares.
 * @param {number} fromId   — current from terminal id
 * @param {number} toId     — current to terminal id
 * @param {string} type     — current route type
 * @param {{
 *   from_terminal_id?: number,
 *   to_terminal_id?: number,
 *   type?: string,
 *   fares?: Partial<FaresMap>
 * }} payload
 */
export function updateFare(fromId, toId, type, payload) {
  return api.put(
    `/admin/fares/${fromId}/${toId}/${encodeURIComponent(type)}`,
    payload
  );
}

/**
 * Hard-delete a route (removes all 4 passenger-type rows).
 * @param {number} fromId
 * @param {number} toId
 * @param {string} type
 */
export function deleteFare(fromId, toId, type) {
  return api.delete(
    `/admin/fares/${fromId}/${toId}/${encodeURIComponent(type)}`
  );
}

// ══════════════════════════════════════════════════════════════
//  PROMOTIONS
// ══════════════════════════════════════════════════════════════

/**
 * List all active promotions.
 * @param {{ q?: string, status?: 'active'|'expired'|'upcoming' }} params
 */
export function getPromotions(params = {}) {
  return api.get("/admin/promotions", { params });
}

/**
 * Get a single promotion by id.
 * @param {number|string} id
 */
export function getPromotionById(id) {
  return api.get(`/admin/promotions/${id}`);
}

/**
 * Create a new promotion.
 * @param {{
 *   name: string,
 *   description?: string,
 *   type: 'percent'|'flat',
 *   value: number,
 *   startDate: string,
 *   endDate?: string|null,
 *   appliesTo: string[],
 *   routes?: Array<{ from_terminal_id: number, to_terminal_id: number, route_type?: string }>,
 * }} payload
 */
export function createPromotion(payload) {
  return api.post("/admin/promotions", payload);
}

/**
 * Update an existing promotion.
 * @param {number|string} id
 * @param {Partial<PromoPayload>} payload
 */
export function updatePromotion(id, payload) {
  return api.put(`/admin/promotions/${id}`, payload);
}

/**
 * Soft-delete a promotion.
 * @param {number|string} id
 */
export function deletePromotion(id) {
  return api.delete(`/admin/promotions/${id}`);
}

// ══════════════════════════════════════════════════════════════
//  FARE IMAGE
// ══════════════════════════════════════════════════════════════

/**
 * Get the stored image record for a route (404 if none).
 * @param {number} fromId
 * @param {number} toId
 * @param {string} type
 */
export function getFareImage(fromId, toId, type) {
  return api.get(
    `/admin/fares/${fromId}/${toId}/${encodeURIComponent(type)}/image`
  );
}

/**
 * Upload (or replace) the fare matrix image for a route.
 * @param {number} fromId
 * @param {number} toId
 * @param {string} type
 * @param {File} file
 * @param {(pct: number)=>void} [onProgress]
 */
export function uploadFareImage(fromId, toId, type, file, onProgress) {
  const formData = new FormData();
  formData.append("image", file);

  return api.post(
    `/admin/fares/${fromId}/${toId}/${encodeURIComponent(type)}/image`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: onProgress
        ? (e) => onProgress(e.total ? Math.round((e.loaded * 100) / e.total) : 0)
        : undefined,
    }
  );
}

/**
 * Delete the stored image for a route (resets mode to 'manual').
 * @param {number} fromId
 * @param {number} toId
 * @param {string} type
 */
export function deleteFareImage(fromId, toId, type) {
  return api.delete(
    `/admin/fares/${fromId}/${toId}/${encodeURIComponent(type)}/image`
  );
}

/**
 * Switch a route's display mode without touching the image file.
 * @param {number} fromId
 * @param {number} toId
 * @param {string} type
 * @param {'manual'|'image'} mode
 */
export function setFareDisplayMode(fromId, toId, type, mode) {
  return api.patch(
    `/admin/fares/${fromId}/${toId}/${encodeURIComponent(type)}/mode`,
    { mode }
  );
}

// ── JSDoc types ──────────────────────────────────────────────
/**
 * @typedef {{ regular: number, student: number, senior: number, pwd: number }} FaresMap
 *
 * @typedef {{
 *   image_id: number,
 *   from_terminal_id: number,
 *   to_terminal_id: number,
 *   route_type: string,
 *   filename: string,
 *   original_name: string,
 *   mime_type: string,
 *   size_bytes: number,
 *   url: string,
 *   display_mode: 'manual'|'image',
 *   uploaded_at: string,
 *   updated_at: string,
 * }} FareImage
 *
 * @typedef {{
 *   from_terminal_id: number,
 *   to_terminal_id: number,
 *   from_name: string,
 *   to_name: string,
 *   type: string,
 *   fares: FaresMap,
 *   display_mode: 'manual'|'image',
 *   created_at: string,
 *   updated_at: string,
 * }} FareRoute
 *
 * @typedef {{
 *   id: number,
 *   name: string,
 *   description: string,
 *   type: 'percent'|'flat',
 *   value: number,
 *   startDate: string,
 *   endDate: string|null,
 *   appliesTo: string[],
 *   routes: string[],
 *   status: 'active'|'expired'|'upcoming',
 *   created_at: string,
 *   updated_at: string,
 * }} Promotion
 */