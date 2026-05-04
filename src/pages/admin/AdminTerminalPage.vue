<!-- src/pages/admin/TerminalPage.vue -->
<template>
  <div class="tp">

    <!-- ── Header ── -->
    <div class="tp-header">
      <div class="tp-header-left">
        <div class="tp-title-row">
          <h1 class="tp-title">Terminals</h1>
          <span class="tp-count-badge">{{ rows?.length || 0 }} / 2</span>
        </div>
        <p class="tp-subtitle">Location · Schedule · Bus Assignments</p>
      </div>

      <div class="tp-header-right">
        <p v-if="loading" class="tp-state-hint">
          <i class="fas fa-circle-notch fa-spin"></i> Refreshing…
        </p>
        <p v-else-if="error" class="tp-state-hint tp-state-hint--err">
          <i class="fas fa-triangle-exclamation"></i> {{ error }}
        </p>

        <button class="tp-btn tp-btn--ghost" type="button" @click="load" :disabled="loading">
          <i class="fas fa-rotate"></i>
          <span class="tp-btn-label">Refresh</span>
        </button>

        <button
          v-if="!limitReached"
          class="tp-btn tp-btn--primary"
          type="button"
          @click="openNew"
        >
          <i class="fas fa-plus"></i>
          <span class="tp-btn-label">New Terminal</span>
        </button>

        <div v-else class="tp-limit-badge">
          <i class="fas fa-lock"></i>
          Max reached
        </div>
      </div>
    </div>

    <!-- ── Summary row ── -->
    <div class="tp-summary">
      <div class="tp-stat">
        <div class="tp-stat-value">{{ rows?.length || 0 }}</div>
        <div class="tp-stat-label">Total</div>
      </div>
      <div class="tp-stat tp-stat--blue">
        <div class="tp-stat-value">{{ totalBuses }}</div>
        <div class="tp-stat-label">Buses In</div>
      </div>
      <div class="tp-stat tp-stat--green">
        <div class="tp-stat-value">{{ 2 - (rows?.length || 0) }}</div>
        <div class="tp-stat-label">Slots Free</div>
      </div>
    </div>

    <!-- ── Terminal Cards ── -->
    <div class="tp-cards">
      <div v-for="t in rows" :key="t.terminal_id" class="tp-card" @click="goToDetail(t)" style="cursor:pointer">

        <!-- Card top -->
        <div class="tp-card-head">
          <div class="tp-card-icon">
            <i class="fas fa-map-location-dot"></i>
          </div>
          <div class="tp-card-info">
            <div class="tp-card-name">{{ t.terminal_name }}</div>
            <div class="tp-card-city">
              <i class="fas fa-city"></i>
              {{ t.city || '—' }}
              <span class="tp-id-tag">ID {{ t.terminal_id }}</span>
            </div>
          </div>
          <div class="tp-card-actions">
            <button class="tp-icon-btn" type="button" @click.stop="openEdit(t)" title="Edit">
              <i class="fas fa-pen"></i>
            </button>
            <button class="tp-icon-btn tp-icon-btn--danger" type="button" @click.stop="askDelete(t)" title="Delete">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>

        <!-- Mini map -->
        <div class="tp-map-wrap">
          <div class="tp-map-canvas" :ref="setMapEl(t.terminal_id)"></div>
          <div class="tp-map-coord">
            {{ fmtCoord(t.lat) }}, {{ fmtCoord(t.lng) }}
          </div>
        </div>

        <!-- Stats row -->
        <div class="tp-card-stats">
          <div class="tp-cstat">
            <div class="tp-cstat-label"><i class="fas fa-clock"></i> Hours</div>
            <div class="tp-cstat-val">{{ fmtTime(t.available_from) }} – {{ fmtTime(t.available_to) }}</div>
          </div>
          <div class="tp-cstat">
            <div class="tp-cstat-label"><i class="fas fa-bus"></i> Buses</div>
            <div class="tp-cstat-val">
              <span class="tp-bus-chip" :class="Number(t.bus_count ?? 0) > 0 ? 'tp-bus-chip--active' : ''">
                {{ Number(t.bus_count ?? 0) }}
              </span>
              <span class="tp-cstat-sub">{{ Number(t.bus_count ?? 0) === 0 ? 'None present' : 'In terminal' }}</span>
            </div>
          </div>
        </div>

        <!-- Card footer -->
        <div class="tp-card-foot">
          <span class="tp-foot-tip"><i class="fas fa-circle-info"></i> Keep coordinates accurate</span>
          <div class="tp-foot-actions">
            <button
              class="tp-link"
              type="button"
              @click.stop="openInFullMap(t)"
              :disabled="!isValidCoord(t)"
            >
              <i class="fas fa-map"></i> Full map
            </button>
            <button class="tp-link tp-link--primary" type="button" @click.stop="goToDetail(t)">
              <i class="fas fa-bus"></i> View Buses <i class="fas fa-arrow-right"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="!loading && (rows?.length || 0) === 0" class="tp-empty">
        <i class="fas fa-map-location-dot"></i>
        <p>No terminals yet</p>
        <small>Add up to 2 terminals to get started.</small>
        <div class="tp-empty-actions">
          <button v-if="!limitReached" class="tp-btn tp-btn--primary" type="button" @click="openNew">
            <i class="fas fa-plus"></i>
            <span class="tp-btn-label">New Terminal</span>
          </button>
          <button class="tp-btn tp-btn--ghost" type="button" @click="load" :disabled="loading">
            <i class="fas fa-rotate"></i>
            <span class="tp-btn-label">Refresh</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ── Footnote ── -->
    <div class="tp-footnote">
      <i class="fas fa-arrows-rotate"></i> Auto-refresh every 8s
      <span class="tp-footnote-sep">·</span>
      <i class="fas fa-circle-info"></i> Max 2 terminals. Delete one to add another.
    </div>

    <!-- ── Create / Edit Modal ── -->
    <Transition name="tp-modal">
      <div v-if="showModal" class="tp-overlay" @click.self="closeModal">
        <div class="tp-modal">
          <div class="tp-modal-head">
            <div class="tp-modal-head-left">
              <div class="tp-modal-title">
                <i class="fas fa-location-dot"></i>
                {{ editing ? 'Edit Terminal' : 'New Terminal' }}
              </div>
              <div class="tp-modal-sub">Fill in the terminal details below</div>
            </div>
            <button class="tp-modal-close" type="button" @click="closeModal" :disabled="saving">
              <i class="fas fa-xmark"></i>
            </button>
          </div>

          <div class="tp-modal-body">
            <div class="tp-form-grid">
              <label class="tp-field">
                <span class="tp-field-label">Terminal Name *</span>
                <input class="tp-input" v-model.trim="form.terminal_name" placeholder="e.g., Calapan Terminal" :disabled="saving" />
              </label>
              <label class="tp-field">
                <span class="tp-field-label">City *</span>
                <input class="tp-input" v-model.trim="form.city" placeholder="e.g., Calapan City" :disabled="saving" />
              </label>
              <label class="tp-field">
                <span class="tp-field-label">Latitude *</span>
                <input class="tp-input" v-model.number="form.lat" type="number" step="0.0000001" placeholder="13.4100123" :disabled="saving" />
                <span class="tp-field-hint">Copy from Google Maps pin</span>
              </label>
              <label class="tp-field">
                <span class="tp-field-label">Longitude *</span>
                <input class="tp-input" v-model.number="form.lng" type="number" step="0.0000001" placeholder="121.1800456" :disabled="saving" />
              </label>
              <label class="tp-field">
                <span class="tp-field-label">Available From *</span>
                <input class="tp-input" v-model="form.available_from" type="time" :disabled="saving" />
              </label>
              <label class="tp-field">
                <span class="tp-field-label">Available To *</span>
                <input class="tp-input" v-model="form.available_to" type="time" :disabled="saving" />
              </label>
            </div>

            <!-- Preview -->
            <div class="tp-preview">
              <div class="tp-preview-label">Preview</div>
              <div class="tp-preview-body">
                <span class="tp-preview-chip">
                  <i class="fas fa-clock"></i>
                  {{ form.available_from || '—' }} – {{ form.available_to || '—' }}
                </span>
                <span class="tp-preview-coord">{{ fmtCoord(form.lat) }}, {{ fmtCoord(form.lng) }}</span>
              </div>
            </div>

            <p v-if="modalError" class="tp-modal-err">
              <i class="fas fa-triangle-exclamation"></i> {{ modalError }}
            </p>
          </div>

          <div class="tp-modal-foot">
            <button class="tp-btn tp-btn--ghost" type="button" @click="closeModal" :disabled="saving">Cancel</button>
            <button class="tp-btn tp-btn--primary" type="button" @click="save" :disabled="saving">
              <i class="fas fa-check"></i>
              {{ saving ? 'Saving…' : 'Save Terminal' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ── Delete Confirm Modal ── -->
    <Transition name="tp-modal">
      <div v-if="deleteTarget" class="tp-overlay" @click.self="deleteTarget = null">
        <div class="tp-modal tp-modal--sm">
          <div class="tp-modal-head">
            <div class="tp-modal-head-left">
              <div class="tp-modal-title tp-modal-title--danger">
                <i class="fas fa-trash"></i> Delete Terminal
              </div>
              <div class="tp-modal-sub">This action cannot be undone</div>
            </div>
            <button class="tp-modal-close" type="button" @click="deleteTarget = null" :disabled="deleting">
              <i class="fas fa-xmark"></i>
            </button>
          </div>
          <div class="tp-modal-body">
            <p class="tp-delete-confirm">
              Delete <strong>{{ deleteTarget.terminal_name }}</strong>?
            </p>
            <p class="tp-delete-note">Note: Re-assign any buses before deleting.</p>
            <p v-if="deleteError" class="tp-modal-err">
              <i class="fas fa-triangle-exclamation"></i> {{ deleteError }}
            </p>
          </div>
          <div class="tp-modal-foot">
            <button class="tp-btn tp-btn--ghost" type="button" @click="deleteTarget = null" :disabled="deleting">Cancel</button>
            <button class="tp-btn tp-btn--danger" type="button" @click="doDelete" :disabled="deleting">
              <i class="fas fa-trash"></i>
              {{ deleting ? 'Deleting…' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useTerminals } from "../../composables/useTerminal";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

const router = useRouter();
const { rows, loading, error, fetchTerminals, addTerminal, editTerminal, removeTerminal } = useTerminals();

let poll = null;

async function load() {
  await fetchTerminals({ q: "" });
  await nextTick();
  syncMiniMapsToRows();
}

onMounted(async () => {
  await load();
  poll = setInterval(load, 8000);
});

onBeforeUnmount(() => {
  if (poll) clearInterval(poll);
  destroyAllMiniMaps();
});

const limitReached = computed(() => (rows.value?.length || 0) >= 2);
const totalBuses   = computed(() => (rows.value || []).reduce((s, t) => s + Number(t.bus_count ?? 0), 0));

function fmtCoord(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(6) : "—";
}
function fmtTime(v) {
  const s = String(v || "");
  return s ? s.slice(0, 5) : "—";
}

function isValidCoord(t) {
  return Number.isFinite(Number(t?.lat)) && Number.isFinite(Number(t?.lng));
}

function openInFullMap(t) {
  if (!isValidCoord(t)) return;
  router.push({
    path: "/admin/live",
    query: {
      focus: "terminal",
      lat: String(Number(t.lat)),
      lng: String(Number(t.lng)),
      name: t.terminal_name || "Terminal",
      id: String(t.terminal_id),
    },
  });
}

function goToDetail(t) {
  router.push({ path: `/admin/terminals/${t.terminal_id}` });
}

// ── Leaflet mini maps ──────────────────────────────────────
const mapEls  = new Map();
const maps    = new Map();
const markers = new Map();
const FALLBACK = { lat: 12.8797, lng: 121.774 };

function setMapEl(id) {
  return (el) => {
    if (el) mapEls.set(id, el);
    else mapEls.delete(id);
  };
}

function makePinIcon() {
  return L.divIcon({
    className: "tp-leaflet-pin",
    html: `<div class="tp-leaflet-pin__dot"><i class="fas fa-location-dot"></i></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 28],
  });
}

function initMiniMap(t) {
  const id = t.terminal_id;
  const el = mapEls.get(id);
  if (!el || maps.has(id)) return;

  const lat = Number(t.lat);
  const lng = Number(t.lng);
  const ok  = Number.isFinite(lat) && Number.isFinite(lng);
  const start = ok ? [lat, lng] : [FALLBACK.lat, FALLBACK.lng];

  const m = L.map(el, {
    zoomControl: false, attributionControl: false,
    dragging: false, scrollWheelZoom: false,
    doubleClickZoom: false, boxZoom: false, keyboard: false, tap: true,
  }).setView(start, ok ? 15 : 6);

  L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", { maxZoom: 20 }).addTo(m);
  maps.set(id, m);

  if (ok) markers.set(id, L.marker([lat, lng], { icon: makePinIcon(), interactive: false }).addTo(m));

  requestAnimationFrame(() => m.invalidateSize());
  setTimeout(() => m.invalidateSize(), 250);
}

function updateMiniMap(t) {
  const id = t.terminal_id;
  const m  = maps.get(id);
  if (!m) return;
  const lat = Number(t.lat), lng = Number(t.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
  m.setView([lat, lng], Math.max(m.getZoom(), 15), { animate: false });
  const mk = markers.get(id);
  if (mk) mk.setLatLng([lat, lng]);
  else markers.set(id, L.marker([lat, lng], { icon: makePinIcon(), interactive: false }).addTo(m));
}

function removeMiniMap(id) {
  markers.delete(id);
  const m = maps.get(id);
  if (m) { m.off(); m.remove(); maps.delete(id); }
}

function syncMiniMapsToRows() {
  const list = rows.value || [];
  const ids  = new Set(list.map(t => t.terminal_id));
  for (const id of maps.keys()) if (!ids.has(id)) removeMiniMap(id);
  for (const t of list) { initMiniMap(t); updateMiniMap(t); }
}

function destroyAllMiniMaps() {
  for (const id of maps.keys()) removeMiniMap(id);
  mapEls.clear();
}

watch(rows, async () => { await nextTick(); syncMiniMapsToRows(); }, { deep: true });

// ── Modal ──────────────────────────────────────────────────
const showModal  = ref(false);
const editing    = ref(false);
const saving     = ref(false);
const modalError = ref("");

const form = reactive({
  terminal_id: null, terminal_name: "", city: "",
  lat: null, lng: null, available_from: "05:00", available_to: "22:00",
});

function openNew() {
  if (limitReached.value) return;
  editing.value = false;
  modalError.value = "";
  Object.assign(form, { terminal_id: null, terminal_name: "", city: "", lat: null, lng: null, available_from: "05:00", available_to: "22:00" });
  showModal.value = true;
}

function openEdit(t) {
  editing.value = true;
  modalError.value = "";
  Object.assign(form, {
    terminal_id: t.terminal_id, terminal_name: t.terminal_name, city: t.city,
    lat: Number(t.lat), lng: Number(t.lng),
    available_from: fmtTime(t.available_from), available_to: fmtTime(t.available_to),
  });
  showModal.value = true;
}

function closeModal() { showModal.value = false; modalError.value = ""; saving.value = false; }

function validate() {
  if (!form.terminal_name) return "Terminal name is required.";
  if (!form.city) return "City is required.";
  const lat = Number(form.lat), lng = Number(form.lng);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) return "Latitude must be valid (-90 to 90).";
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) return "Longitude must be valid (-180 to 180).";
  if (!form.available_from || !form.available_to) return "Available time is required.";
  if (form.available_from >= form.available_to) return "'From' must be earlier than 'To'.";
  if (!editing.value && limitReached.value) return "Max terminals reached (2).";
  return "";
}

async function save() {
  modalError.value = "";
  const msg = validate();
  if (msg) return (modalError.value = msg);
  saving.value = true;
  try {
    const payload = {
      terminal_name: form.terminal_name, city: form.city,
      lat: Number(form.lat), lng: Number(form.lng),
      available_from: form.available_from, available_to: form.available_to,
    };
    if (editing.value && form.terminal_id != null) await editTerminal(form.terminal_id, payload);
    else await addTerminal(payload);
    closeModal();
    await load();
  } catch (e) {
    modalError.value = e?.response?.data?.message || e?.message || "Failed to save terminal.";
  } finally {
    saving.value = false;
  }
}

// ── Delete ─────────────────────────────────────────────────
const deleteTarget = ref(null);
const deleting     = ref(false);
const deleteError  = ref("");

function askDelete(t) { deleteError.value = ""; deleting.value = false; deleteTarget.value = t; }

async function doDelete() {
  if (!deleteTarget.value) return;
  deleteError.value = "";
  deleting.value = true;
  try {
    await removeTerminal(deleteTarget.value.terminal_id);
    deleteTarget.value = null;
    await load();
  } catch (e) {
    deleteError.value = e?.response?.data?.message || e?.message || "Failed to delete terminal.";
  } finally {
    deleting.value = false;
  }
}
</script>

<style scoped>
/* ─── Tokens (mirrors DevicePage) ──────────────── */
.tp {
  --green:  #10b981;
  --amber:  #f59e0b;
  --red:    #ef4444;
  --blue:   #3b82f6;
  --slate:  #64748b;
  --border: rgba(226,232,240,1);
  --bg:     #f8fafc;
  --card:   #ffffff;
  --text:   #0f172a;
  --muted:  #64748b;
  --radius: 14px;

  font-family: 'DM Sans', 'Segoe UI', sans-serif;
  background: var(--bg);
  padding: 24px;
  min-height: 100vh;
  color: var(--text);
}

/* ─── Header ────────────────────────────────────── */
.tp-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.tp-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.tp-title {
  font-size: 22px;
  font-weight: 800;
  margin: 0;
  letter-spacing: -0.5px;
}

.tp-subtitle {
  font-size: 12px;
  color: var(--muted);
  margin: 4px 0 0;
}

.tp-count-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 999px;
  background: rgba(59,130,246,.1);
  color: var(--blue);
}

.tp-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.tp-state-hint {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
  display: flex;
  align-items: center;
  gap: 6px;
}
.tp-state-hint--err { color: var(--red); }

/* ─── Buttons ───────────────────────────────────── */
.tp-btn {
  height: 36px;
  border: 1px solid var(--border);
  background: var(--card);
  border-radius: 10px;
  padding: 0 14px;
  font-family: inherit;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--text);
  transition: all .15s;
  white-space: nowrap;
}

.tp-btn:hover { border-color: #94a3b8; background: #f1f5f9; }
.tp-btn:active { transform: scale(0.98); }
.tp-btn:disabled { opacity: .5; cursor: not-allowed; }

.tp-btn--ghost { background: transparent; border-color: transparent; }
.tp-btn--ghost:hover { background: #f1f5f9; border-color: var(--border); }

.tp-btn--primary {
  background: var(--text);
  border-color: var(--text);
  color: #fff;
  box-shadow: 0 4px 12px rgba(15,23,42,.18);
}
.tp-btn--primary:hover { background: #1e293b; box-shadow: 0 6px 16px rgba(15,23,42,.26); }

.tp-btn--danger {
  background: var(--red);
  border-color: var(--red);
  color: #fff;
  box-shadow: 0 4px 12px rgba(239,68,68,.25);
}
.tp-btn--danger:hover { background: #dc2626; }

@media (max-width: 600px) { .tp-btn-label { display: none; } }

.tp-limit-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 36px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--card);
  font-weight: 700;
  font-size: 12px;
  color: var(--muted);
}

/* ─── Summary ───────────────────────────────────── */
.tp-summary {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.tp-stat {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 14px 20px;
  min-width: 100px;
  flex: 1;
}

.tp-stat-value {
  font-size: 26px;
  font-weight: 900;
  line-height: 1;
  letter-spacing: -1px;
}

.tp-stat-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--muted);
  margin-top: 4px;
  text-transform: uppercase;
  letter-spacing: .5px;
}

.tp-stat--blue  .tp-stat-value { color: var(--blue); }
.tp-stat--green .tp-stat-value { color: var(--green); }

/* ─── Cards grid ────────────────────────────────── */
.tp-cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

@media (max-width: 860px) { .tp-cards { grid-template-columns: 1fr; } }

/* ─── Card ──────────────────────────────────────── */
.tp-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: box-shadow .15s, border-color .15s, transform .15s;
}

.tp-card:hover {
  box-shadow: 0 8px 24px rgba(15,23,42,.08);
  border-color: #cbd5e1;
  transform: translateY(-1px);
}

/* Card head */
.tp-card-head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid var(--border);
  background: #f8fafc;
}

.tp-card-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(59,130,246,.08);
  border: 1px solid rgba(59,130,246,.15);
  color: var(--blue);
  display: grid;
  place-items: center;
  font-size: 16px;
  flex-shrink: 0;
}

.tp-card-info { flex: 1; min-width: 0; }

.tp-card-name {
  font-weight: 800;
  font-size: 14px;
  letter-spacing: -0.3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tp-card-city {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--muted);
  font-weight: 600;
  margin-top: 3px;
  flex-wrap: wrap;
}

.tp-card-city i { font-size: 10px; }

.tp-id-tag {
  font-size: 10px;
  font-family: monospace;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 5px;
  padding: 1px 6px;
  color: var(--muted);
}

.tp-card-actions { display: flex; gap: 6px; }

.tp-icon-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--card);
  cursor: pointer;
  color: var(--muted);
  font-size: 12px;
  display: grid;
  place-items: center;
  transition: all .15s;
}

.tp-icon-btn:hover {
  background: var(--text);
  color: #fff;
  border-color: var(--text);
}

.tp-icon-btn--danger:hover {
  background: var(--red);
  border-color: var(--red);
  color: #fff;
}

/* Mini map */
.tp-map-wrap {
  position: relative;
  height: 100px;
  border-bottom: 1px solid var(--border);
  overflow: hidden;
  background: #f0f4f8;
}

.tp-map-canvas {
  position: absolute;
  inset: 0;
}

.tp-map-canvas :deep(.leaflet-container) {
  width: 100% !important;
  height: 100% !important;
  background: #f0f4f8;
}

.tp-map-coord {
  position: absolute;
  right: 8px;
  bottom: 8px;
  z-index: 500;
  font-size: 10px;
  font-weight: 700;
  font-family: monospace;
  background: rgba(255,255,255,.92);
  border: 1px solid var(--border);
  padding: 3px 8px;
  border-radius: 999px;
  color: var(--muted);
  backdrop-filter: blur(4px);
}

/* Leaflet pin */
:global(.tp-leaflet-pin) {
  background: transparent !important;
  border: none !important;
}

:global(.tp-leaflet-pin__dot) {
  width: 30px;
  height: 30px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,.96);
  border: 2px solid rgba(59,130,246,.4);
  box-shadow: 0 4px 12px rgba(0,0,0,.12);
}

:global(.tp-leaflet-pin__dot i) {
  color: var(--blue, #3b82f6);
  font-size: 14px;
}

/* Card stats */
.tp-card-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  border-bottom: 1px solid var(--border);
}

.tp-cstat {
  padding: 12px 14px;
}

.tp-cstat:first-child {
  border-right: 1px solid var(--border);
}

.tp-cstat-label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .5px;
  color: var(--muted);
  margin-bottom: 6px;
}

.tp-cstat-val {
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 8px;
}

.tp-cstat-sub {
  font-size: 11px;
  font-weight: 500;
  color: var(--muted);
}

.tp-bus-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  border-radius: 6px;
  background: var(--bg);
  border: 1px solid var(--border);
  font-size: 13px;
  font-weight: 800;
  color: var(--muted);
  padding: 0 6px;
}

.tp-bus-chip--active {
  background: rgba(59,130,246,.08);
  border-color: rgba(59,130,246,.2);
  color: var(--blue);
}

/* Card footer */
.tp-card-foot {
  padding: 10px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: auto;
}

.tp-foot-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  color: var(--muted);
}

.tp-foot-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.tp-link {
  border: none;
  background: transparent;
  cursor: pointer;
  font-family: inherit;
  font-weight: 700;
  font-size: 12px;
  color: var(--blue);
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 8px;
  border-radius: 7px;
  transition: background .12s;
}

.tp-link:hover { background: rgba(59,130,246,.08); }
.tp-link:disabled { opacity: .4; cursor: not-allowed; }

.tp-link--primary {
  color: var(--text);
  font-weight: 800;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 7px;
}

/* Empty state */
.tp-empty {
  grid-column: 1 / -1;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 52px 20px;
  text-align: center;
  color: var(--muted);
}

.tp-empty i { font-size: 32px; display: block; margin-bottom: 12px; }
.tp-empty p { font-weight: 800; color: var(--text); margin: 0 0 4px; }
.tp-empty small { font-size: 12px; }
.tp-empty-actions { margin-top: 16px; display: flex; justify-content: center; gap: 8px; flex-wrap: wrap; }

/* Footnote */
.tp-footnote {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
  padding: 10px 2px 4px;
}

.tp-footnote-sep { opacity: .4; }

/* ─── Modal overlay ─────────────────────────────── */
.tp-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15,23,42,.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  padding: 20px;
}

.tp-modal {
  background: var(--card);
  border-radius: 20px;
  width: min(640px, 100%);
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 24px 60px rgba(0,0,0,.18);
}

.tp-modal--sm { width: min(420px, 100%); }

.tp-modal-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 22px 22px 0;
  gap: 16px;
}

.tp-modal-head-left { display: flex; flex-direction: column; gap: 3px; }

.tp-modal-title {
  font-size: 17px;
  font-weight: 800;
  letter-spacing: -0.4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tp-modal-title--danger { color: var(--red); }

.tp-modal-sub { font-size: 12px; color: var(--muted); }

.tp-modal-close {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: none;
  cursor: pointer;
  color: var(--muted);
  font-size: 14px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  transition: all .15s;
}

.tp-modal-close:hover { background: var(--red); color: #fff; border-color: var(--red); }

.tp-modal-body { padding: 16px 22px; }

/* Form grid */
.tp-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 14px;
}

@media (max-width: 500px) { .tp-form-grid { grid-template-columns: 1fr; } }

.tp-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.tp-field-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: .4px;
}

.tp-field-hint {
  font-size: 10px;
  color: var(--muted);
}

.tp-input {
  height: 38px;
  border: 1px solid var(--border);
  border-radius: 9px;
  padding: 0 12px;
  font-family: inherit;
  font-size: 13px;
  color: var(--text);
  background: var(--card);
  outline: none;
  transition: border-color .15s, box-shadow .15s;
}

.tp-input:focus {
  border-color: #93c5fd;
  box-shadow: 0 0 0 3px rgba(59,130,246,.12);
}

.tp-input:disabled { background: var(--bg); color: var(--muted); }

/* Preview block */
.tp-preview {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px 14px;
  margin-bottom: 12px;
}

.tp-preview-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .5px;
  color: var(--muted);
  margin-bottom: 8px;
}

.tp-preview-body { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }

.tp-preview-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  padding: 5px 11px;
  border-radius: 999px;
  background: var(--card);
  border: 1px solid var(--border);
  color: var(--text);
}

.tp-preview-coord {
  font-family: monospace;
  font-size: 12px;
  color: var(--muted);
}

/* Modal error */
.tp-modal-err {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  font-weight: 600;
  color: var(--red);
  background: rgba(239,68,68,.06);
  border: 1px solid rgba(239,68,68,.15);
  border-radius: 8px;
  padding: 9px 12px;
  margin: 0;
}

/* Delete confirm */
.tp-delete-confirm {
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 6px;
}

.tp-delete-note {
  font-size: 12px;
  color: var(--muted);
  margin: 0 0 12px;
}

/* Modal footer */
.tp-modal-foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 14px 22px 22px;
  border-top: 1px solid var(--border);
  margin-top: 4px;
}

/* ─── Modal transition ──────────────────────────── */
.tp-modal-enter-active,
.tp-modal-leave-active { transition: all .2s ease; }

.tp-modal-enter-from,
.tp-modal-leave-to {
  opacity: 0;
  transform: scale(.97) translateY(8px);
}

/* ─── Responsive ────────────────────────────────── */
@media (max-width: 768px) {
  .tp { padding: 14px; }
  .tp-summary { gap: 8px; }
  .tp-stat { padding: 12px 14px; }
  .tp-stat-value { font-size: 22px; }
}
</style>