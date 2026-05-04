<!-- src/pages/admin/BusesPage.vue -->
<template>
  <div class="bp">

    <!-- ── Header ── -->
    <div class="bp-header">
      <div class="bp-header-left">
        <div class="bp-title-row">
          <h1 class="bp-title">Bus Fleet</h1>
          <span class="bp-live-badge">
            <span class="bp-live-dot"></span>
            Live
          </span>
        </div>
        <p class="bp-subtitle">Vehicles · Occupancy · Routes · Terminals</p>
      </div>

      <div class="bp-header-right">
        <div class="bp-search-box">
          <i class="fas fa-magnifying-glass bp-search-icon"></i>
          <input
            v-model="localSearch"
            class="bp-search-input"
            type="text"
            placeholder="Search bus code, plate, device…"
          />
          <button v-if="localSearch" class="bp-search-clear" @click="localSearch = ''">
            <i class="fas fa-xmark"></i>
          </button>
        </div>
        <button class="bp-btn-refresh" @click="refresh" :disabled="loading" title="Refresh">
          <i class="fas fa-rotate" :class="{ 'fa-spin': loading }"></i>
        </button>
        <button class="bp-btn-add" @click="openNewBus">
          <i class="fas fa-plus"></i>
          New Bus
        </button>
      </div>
    </div>

    <!-- ── State feedback ── -->
    <div v-if="loading && !rows.length" class="bp-state-row">
      <i class="fas fa-circle-notch fa-spin"></i> Loading buses…
    </div>
    <div v-else-if="error" class="bp-state-row bp-state-error">
      <i class="fas fa-triangle-exclamation"></i> {{ error }}
    </div>

    <!-- ── Summary cards ── -->
    <div class="bp-summary">
      <div class="bp-stat">
        <div class="bp-stat-value">{{ rows.length }}</div>
        <div class="bp-stat-label">Total</div>
      </div>
      <div class="bp-stat bp-stat--green">
        <div class="bp-stat-value">{{ counts.online }}</div>
        <div class="bp-stat-label">Online</div>
      </div>
      <div class="bp-stat bp-stat--red">
        <div class="bp-stat-value">{{ counts.offline }}</div>
        <div class="bp-stat-label">Offline</div>
      </div>
      <div class="bp-stat bp-stat--amber">
        <div class="bp-stat-value">{{ counts.full }}</div>
        <div class="bp-stat-label">Full</div>
      </div>
      <div class="bp-stat bp-stat--blue">
        <div class="bp-stat-value">{{ counts.enRoute }}</div>
        <div class="bp-stat-label">En Route</div>
      </div>
    </div>

    <!-- ── Filter pills ── -->
    <div class="bp-filters">
      <button
        v-for="f in filters"
        :key="f.key"
        class="bp-pill"
        :class="{ 'bp-pill--active': filterStatus === f.key }"
        @click="filterStatus = f.key"
      >
        {{ f.label }}
        <span class="bp-pill-count">{{ countByFilter(f.key) }}</span>
      </button>
    </div>

    <!-- ── Table ── -->
    <div class="bp-table-wrap">
      <table class="bp-table">
        <thead>
          <tr>
            <th>Bus</th>
            <th>Plate</th>
            <th>Occupancy</th>
            <th>Device</th>
            <th>Route</th>
            <th>Last Seen</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>

          <!-- Skeleton -->
          <tr v-if="loading && !rows.length" v-for="n in 5" :key="'sk-' + n" class="bp-row">
            <td><div class="bp-skel" style="width:140px;height:32px;border-radius:8px;"></div></td>
            <td><div class="bp-skel" style="width:80px;height:14px;"></div></td>
            <td><div class="bp-skel" style="width:110px;height:14px;"></div></td>
            <td><div class="bp-skel" style="width:90px;height:22px;border-radius:99px;"></div></td>
            <td><div class="bp-skel" style="width:130px;height:22px;border-radius:99px;"></div></td>
            <td><div class="bp-skel" style="width:80px;height:14px;"></div></td>
            <td><div class="bp-skel" style="width:70px;height:22px;border-radius:99px;"></div></td>
            <td></td>
          </tr>

          <!-- Data rows -->
          <tr v-for="b in filteredRows" :key="b.id" class="bp-row">

            <!-- Bus -->
            <td>
              <div class="bp-bus-name">{{ b.bus_code }}</div>
              <div class="bp-bus-sub">ID {{ b.id }}</div>
            </td>

            <!-- Plate -->
            <td>
              <span class="bp-mono bp-plate">{{ b.plate_no || '—' }}</span>
            </td>

            <!-- Occupancy -->
            <td>
              <template v-if="b.device_status === 'assigned' && b.passenger_count != null && b.capacity">
                <div class="bp-occ-row">
                  <span class="bp-occ-num" :class="occClass(b)">{{ safeOcc(b) }}</span>
                  <span class="bp-occ-cap">/ {{ b.capacity }}</span>
                  <span class="bp-occ-pct" :class="occClass(b)">{{ clampPct(b.occupancy_percent) }}%</span>
                  <span v-if="isFull(b)" class="bp-full-badge">FULL</span>
                </div>
                <div class="bp-bar-track">
                  <div class="bp-bar-fill" :class="occClass(b)" :style="{ width: clampPct(b.occupancy_percent) + '%' }"></div>
                </div>
              </template>
              <span v-else class="bp-muted">—</span>
            </td>

            <!-- Device -->
            <td>
              <div class="bp-inline">
                <span class="bp-dot" :class="`bp-dot--${devicePill(b).dot}`"></span>
                <span class="bp-val">{{ devicePill(b).text }}</span>
              </div>
              <div v-if="b.device?.device_code" class="bp-sub bp-mono">{{ b.device.device_code }}</div>
            </td>

            <!-- Route -->
            <td>
              <div class="bp-inline">
                <span class="bp-dot" :class="`bp-dot--${routePill(b).dot}`"></span>
                <span class="bp-val">{{ routePill(b).text }}</span>
              </div>
              <div v-if="b.terminal_state?.dist_m != null" class="bp-sub">
                {{ Math.round(b.terminal_state.dist_m) }}m ·
                {{ Number(b.terminal_state?.at_terminal) === 1 ? 'at terminal' : 'on road' }}
              </div>
            </td>

            <!-- Last Seen -->
            <td>
              <div class="bp-val">{{ timeAgo(b.device_last_seen_at) }}</div>
              <div v-if="b.device_last_seen_at" class="bp-sub">{{ formatTs(b.device_last_seen_at) }}</div>
            </td>

            <!-- Status chip -->
            <td>
              <span class="bp-status-chip" :class="devicePill(b).online ? 'bp-status-chip--on' : 'bp-status-chip--off'">
                <span class="bp-status-dot"></span>
                {{ devicePill(b).online ? 'Online' : devicePill(b).assigned ? 'Offline' : 'No Device' }}
              </span>
            </td>

            <!-- Actions -->
            <td>
              <div class="bp-actions">
                <button class="bp-btn-view" @click="viewBus(b.id)" title="View details">
                  <i class="fas fa-circle-info"></i>
                </button>
                <button class="bp-btn-view" @click="openEdit(b)" title="Edit bus">
                  <i class="fas fa-pen"></i>
                </button>
              </div>
            </td>
          </tr>

          <!-- Empty -->
          <tr v-if="!loading && filteredRows.length === 0">
            <td colspan="8">
              <div class="bp-empty">
                <i class="fas fa-bus-simple"></i>
                <p>No buses found</p>
                <small>Try another filter or keyword</small>
              </div>
            </td>
          </tr>

        </tbody>
      </table>
    </div>

    <!-- ── Footer ── -->
    <div class="bp-footer" v-if="!loading && rows.length > 0">
      <span class="bp-footer-text">
        Showing <b>{{ filteredRows.length }}</b> of <b>{{ rows.length }}</b> buses
      </span>
      <span class="bp-footer-live">
        <span class="bp-live-dot"></span>
        Live · refreshes every 5s
      </span>
    </div>

    <!-- ── Modal ── -->
    <Transition name="bp-modal">
      <div v-if="showBusModal" class="bp-overlay" @click.self="closeBusModal">
        <div class="bp-modal">

          <div class="bp-modal-head">
            <div>
              <div class="bp-modal-title">{{ editing ? 'Edit Bus' : 'New Bus' }}</div>
              <div class="bp-modal-sub">{{ editing ? 'Update bus record details' : 'Register a new bus to the fleet' }}</div>
            </div>
            <button class="bp-modal-close" type="button" @click="closeBusModal">
              <i class="fas fa-xmark"></i>
            </button>
          </div>

          <div class="bp-modal-body">
            <div class="bp-form-grid">
              <label class="bp-field" v-if="editing">
                <span class="bp-field-label">Bus Code</span>
                <input class="bp-input bp-input--disabled" v-model="form.bus_code" disabled />
              </label>
              <label class="bp-field">
                <span class="bp-field-label">Plate No <span class="bp-required">*</span></span>
                <input class="bp-input" v-model.trim="form.plate_no" placeholder="e.g. ABC-1234" />
              </label>
              <label class="bp-field">
                <span class="bp-field-label">Capacity <span class="bp-required">*</span></span>
                <input class="bp-input" v-model.number="form.capacity" type="number" min="1" step="1" placeholder="40" />
              </label>
            </div>

            <div v-if="modalError" class="bp-modal-error">
              <i class="fas fa-circle-exclamation"></i>
              {{ modalError }}
            </div>
          </div>

          <div class="bp-modal-foot">
            <button class="bp-foot-cancel" type="button" @click="closeBusModal" :disabled="saving">Cancel</button>
            <button class="bp-foot-save" type="button" @click="saveBus" :disabled="saving">
              <i class="fas" :class="saving ? 'fa-circle-notch fa-spin' : 'fa-check'"></i>
              {{ saving ? 'Saving…' : 'Save Bus' }}
            </button>
          </div>

        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { useBuses } from "@/composables/useBuses";

const props = defineProps({ search: { type: String, default: "" } });
const router = useRouter();
const { rows, loading, error, fetchBuses, addBus, editBus: apiEditBus } = useBuses();

let poll = null;
const localSearch  = ref("");
const filterStatus = ref("all");

const filters = [
  { key: "all",         label: "All" },
  { key: "online",      label: "Online" },
  { key: "offline",     label: "Offline" },
  { key: "at-terminal", label: "At Terminal" },
  { key: "en-route",    label: "En Route" },
];

async function refresh() { await fetchBuses(); }

onMounted(async () => {
  await refresh();
  poll = setInterval(refresh, 5000);
});
onBeforeUnmount(() => { if (poll) clearInterval(poll); });

/* ── Counts ── */
const counts = computed(() => {
  const list = rows.value || [];
  return {
    all:       list.length,
    online:    list.filter(b => b.device_online).length,
    offline:   list.filter(b => !b.device_online && b.device_status === "assigned").length,
    full:      list.filter(b => isFull(b)).length,
    atTerminal:list.filter(b => Number(b.terminal_state?.at_terminal) === 1).length,
    enRoute:   list.filter(b => b.device_status === "assigned" && Number(b.terminal_state?.at_terminal) !== 1).length,
  };
});

function countByFilter(key) {
  const c = counts.value;
  if (key === "all")         return c.all;
  if (key === "online")      return c.online;
  if (key === "offline")     return c.offline;
  if (key === "at-terminal") return c.atTerminal;
  if (key === "en-route")    return c.enRoute;
  return 0;
}

/* ── Filtering ── */
const filteredRows = computed(() => {
  const qTop   = String(props.search  || "").trim().toLowerCase();
  const qLocal = String(localSearch.value || "").trim().toLowerCase();
  const q = (qTop + " " + qLocal).trim();
  let out = rows.value || [];

  if (filterStatus.value === "online")      out = out.filter(b => b.device_online);
  else if (filterStatus.value === "offline") out = out.filter(b => !b.device_online && b.device_status === "assigned");
  else if (filterStatus.value === "at-terminal") out = out.filter(b => Number(b.terminal_state?.at_terminal) === 1);
  else if (filterStatus.value === "en-route") out = out.filter(b => b.device_status === "assigned" && Number(b.terminal_state?.at_terminal) !== 1);

  if (!q) return out;
  return out.filter(b =>
    [b.bus_code, b.plate_no, b.bus_status, b.capacity, b.device_status,
     b.device?.device_code, b.device?.esp32_id,
     b.terminal_state?.current_terminal_name,
     b.terminal_state?.target_terminal_name]
      .some(x => String(x ?? "").toLowerCase().includes(q))
  );
});

/* ── Helpers ── */
function safeOcc(b) {
  const cap = Number(b.capacity ?? 0);
  const occ = Number(b.passenger_count ?? 0);
  if (!Number.isFinite(cap) || cap <= 0) return Number.isFinite(occ) ? Math.max(0, occ) : 0;
  return Math.min(Math.max(occ, 0), cap);
}

function isFull(b) {
  const cap = Number(b.capacity ?? 0);
  const occ = Number(b.passenger_count ?? 0);
  if (!Number.isFinite(cap) || cap <= 0 || !Number.isFinite(occ)) return false;
  return occ >= cap;
}

function occClass(b) {
  const pct = clampPct(b.occupancy_percent);
  if (isFull(b) || pct >= 100) return "full";
  if (pct >= 70) return "warn";
  return "ok";
}

function clampPct(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function devicePill(b) {
  const ds = String(b.device_status || "unassigned").toLowerCase();
  if (ds !== "assigned") return { text: "No device", dot: "off", online: false, assigned: false };
  if (b.device_online)   return { text: "Online",    dot: "ok",  online: true,  assigned: true };
  return                        { text: "Offline",   dot: "bad", online: false, assigned: true };
}

function routePill(b) {
  if (String(b.device_status || "").toLowerCase() !== "assigned")
    return { text: "No device", dot: "off" };
  const ts = b.terminal_state;
  if (!ts) return { text: "No state", dot: "warn" };
  const cur = ts.current_terminal_name;
  const tgt = ts.target_terminal_name;
  const label = b.route_label || (cur && tgt ? `${cur} → ${tgt}` : cur || tgt || "Unknown");
  if (Number(ts.at_terminal) === 1) return { text: label, dot: "ok" };
  return { text: label, dot: "blue" };
}

function timeAgo(dateLike) {
  if (!dateLike) return "—";
  const dt = new Date(dateLike);
  if (isNaN(dt)) return "—";
  const s = Math.floor((Date.now() - dt) / 1000);
  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function formatTs(dateLike) {
  if (!dateLike) return "";
  const dt = new Date(dateLike);
  return isNaN(dt) ? "" : dt.toLocaleString();
}

function viewBus(id) { router.push(`/admin/buses/${id}`); }

/* ── Modal ── */
const showBusModal = ref(false);
const editing      = ref(false);
const saving       = ref(false);
const modalError   = ref("");
const form = reactive({ id: null, bus_code: "", plate_no: "", capacity: 40, bus_status: "active" });

function openNewBus() {
  editing.value = false;
  modalError.value = "";
  Object.assign(form, { id: null, bus_code: "", plate_no: "", capacity: 40, bus_status: "active" });
  showBusModal.value = true;
}

function openEdit(b) {
  editing.value = true;
  modalError.value = "";
  Object.assign(form, { id: b.id, bus_code: b.bus_code, plate_no: b.plate_no, capacity: Number(b.capacity ?? 40), bus_status: String(b.bus_status || "active").toLowerCase() });
  showBusModal.value = true;
}

function closeBusModal() {
  showBusModal.value = false;
  modalError.value = "";
  saving.value = false;
}

async function saveBus() {
  modalError.value = "";
  const plate = String(form.plate_no || "").trim();
  const cap   = Number(form.capacity);
  if (!plate)                            { modalError.value = "Plate No is required."; return; }
  if (!Number.isFinite(cap) || cap <= 0) { modalError.value = "Capacity must be greater than 0."; return; }

  const payload = { plate_no: plate, capacity: cap, bus_status: String(form.bus_status || "active").toLowerCase() };
  saving.value = true;
  try {
    if (!editing.value) {
      await addBus(payload);
    } else {
      typeof apiEditBus === "function" && apiEditBus.length >= 2
        ? await apiEditBus(form.id, payload)
        : await apiEditBus({ id: form.id, ...payload });
    }
    closeBusModal();
    await refresh();
  } catch (e) {
    modalError.value = e?.message || "Failed to save bus.";
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
/* ─── Tokens ─────────────────────────────── */
.bp {
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

/* ─── Header ─────────────────────────────── */
.bp-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.bp-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.bp-title {
  font-size: 22px;
  font-weight: 800;
  margin: 0;
  letter-spacing: -0.5px;
}

.bp-subtitle {
  font-size: 12px;
  color: var(--muted);
  margin: 4px 0 0;
}

.bp-live-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 999px;
  background: rgba(16,185,129,.1);
  color: var(--green);
}

.bp-live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  animation: pulse 1.4s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: .4; transform: scale(.8); }
}

/* ─── Header right ───────────────────────── */
.bp-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.bp-search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 8px 12px;
  min-width: 240px;
}

.bp-search-icon { color: var(--muted); font-size: 13px; }

.bp-search-input {
  border: none;
  outline: none;
  background: transparent;
  font-size: 13px;
  flex: 1;
  color: var(--text);
}

.bp-search-clear {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--muted);
  padding: 0;
  line-height: 1;
}

.bp-btn-refresh {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--card);
  cursor: pointer;
  color: var(--muted);
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all .15s;
}

.bp-btn-refresh:hover { background: var(--bg); color: var(--text); }
.bp-btn-refresh:disabled { opacity: 0.5; cursor: not-allowed; }

.bp-btn-add {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 14px;
  border-radius: 10px;
  border: none;
  background: var(--text);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity .15s;
}

.bp-btn-add:hover { opacity: 0.85; }

/* ─── State row ──────────────────────────── */
.bp-state-row {
  font-size: 13px;
  color: var(--muted);
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.bp-state-error { color: var(--red); }

/* ─── Summary cards ──────────────────────── */
.bp-summary {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.bp-stat {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 14px 20px;
  min-width: 100px;
  flex: 1;
}

.bp-stat-value {
  font-size: 26px;
  font-weight: 900;
  line-height: 1;
  letter-spacing: -1px;
}

.bp-stat-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--muted);
  margin-top: 4px;
  text-transform: uppercase;
  letter-spacing: .5px;
}

.bp-stat--green .bp-stat-value { color: var(--green); }
.bp-stat--red   .bp-stat-value { color: var(--red); }
.bp-stat--amber .bp-stat-value { color: var(--amber); }
.bp-stat--blue  .bp-stat-value { color: var(--blue); }

/* ─── Filter pills ───────────────────────── */
.bp-filters {
  display: flex;
  gap: 6px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.bp-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--card);
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
  cursor: pointer;
  transition: all .15s;
}

.bp-pill:hover { border-color: #94a3b8; color: var(--text); }

.bp-pill--active {
  background: var(--text);
  border-color: var(--text);
  color: #fff;
}

.bp-pill-count {
  background: rgba(255,255,255,.2);
  border-radius: 999px;
  padding: 1px 6px;
  font-size: 10px;
}

.bp-pill:not(.bp-pill--active) .bp-pill-count {
  background: var(--bg);
  color: var(--muted);
}

/* ─── Table ──────────────────────────────── */
.bp-table-wrap {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}

.bp-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.bp-table thead th {
  padding: 11px 14px;
  text-align: left;
  font-size: 11px;
  font-weight: 700;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: .5px;
  background: #f8fafc;
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}

.bp-row {
  border-bottom: 1px solid rgba(226,232,240,.6);
  transition: background .12s;
}

.bp-row:last-child { border-bottom: none; }
.bp-row:hover { background: #f8fafc; }

.bp-table td { padding: 12px 14px; vertical-align: middle; }

/* Bus cell */
.bp-bus-name { font-weight: 700; font-size: 13px; font-family: monospace; }
.bp-bus-sub  { font-size: 11px; color: var(--muted); margin-top: 2px; }

/* Plate */
.bp-mono  { font-family: monospace; }
.bp-plate { font-weight: 700; font-size: 13px; }

/* Occupancy */
.bp-occ-row {
  display: flex;
  align-items: baseline;
  gap: 4px;
  flex-wrap: wrap;
}

.bp-occ-num { font-size: 14px; font-weight: 900; }
.bp-occ-cap { font-size: 11px; color: var(--muted); font-weight: 600; }
.bp-occ-pct { font-size: 11px; font-weight: 700; margin-left: 2px; }

.bp-occ-num.ok,  .bp-occ-pct.ok  { color: var(--green); }
.bp-occ-num.warn,.bp-occ-pct.warn { color: var(--amber); }
.bp-occ-num.full,.bp-occ-pct.full { color: var(--red); }

.bp-full-badge {
  font-size: 9px;
  font-weight: 900;
  letter-spacing: .08em;
  color: var(--red);
  background: rgba(239,68,68,.08);
  border: 1px solid rgba(239,68,68,.2);
  border-radius: 4px;
  padding: 2px 5px;
}

.bp-bar-track {
  height: 3px;
  border-radius: 99px;
  background: rgba(226,232,240,1);
  overflow: hidden;
  width: 100%;
  max-width: 110px;
  margin-top: 5px;
}

.bp-bar-fill {
  height: 100%;
  border-radius: 99px;
  transition: width .4s ease;
}

.bp-bar-fill.ok   { background: var(--green); }
.bp-bar-fill.warn { background: var(--amber); }
.bp-bar-fill.full { background: var(--red); }

/* Dot indicators */
.bp-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
.bp-dot--ok   { background: var(--green); }
.bp-dot--warn { background: var(--amber); }
.bp-dot--bad  { background: var(--red); }
.bp-dot--off  { background: #cbd5e1; }
.bp-dot--blue { background: var(--blue); }

.bp-inline { display: flex; align-items: center; gap: 6px; }
.bp-val    { font-weight: 600; font-size: 12px; }
.bp-sub    { font-size: 11px; color: var(--muted); margin-top: 2px; }
.bp-muted  { font-size: 12px; color: var(--muted); }

/* Status chip */
.bp-status-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

.bp-status-chip--on {
  background: rgba(16,185,129,.1);
  color: var(--green);
}

.bp-status-chip--off {
  background: rgba(239,68,68,.08);
  color: var(--red);
}

.bp-status-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
}

.bp-status-chip--on .bp-status-dot {
  animation: pulse 1.4s ease-in-out infinite;
}

/* Actions */
.bp-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.bp-btn-view {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--card);
  cursor: pointer;
  color: var(--muted);
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all .15s;
}

.bp-btn-view:hover {
  background: var(--text);
  color: #fff;
  border-color: var(--text);
}

/* Skeleton */
@keyframes shimmer {
  0%, 100% { opacity: .45; }
  50%       { opacity: .85; }
}

.bp-skel {
  display: block;
  background: #e2e8f0;
  border-radius: 6px;
  animation: shimmer 1.4s ease-in-out infinite;
}

/* Empty state */
.bp-empty {
  padding: 48px;
  text-align: center;
  color: var(--muted);
}

.bp-empty i { font-size: 32px; margin-bottom: 12px; display: block; }
.bp-empty p { font-weight: 700; margin: 0 0 4px; color: var(--text); }
.bp-empty small { font-size: 12px; }

/* ─── Footer ─────────────────────────────── */
.bp-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  padding: 0 4px;
}

.bp-footer-text {
  font-size: 12px;
  color: var(--muted);
}

.bp-footer-text b { font-weight: 700; color: var(--text); }

.bp-footer-live {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  color: var(--green);
}

/* ─── Modal ──────────────────────────────── */
.bp-overlay {
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

.bp-modal {
  background: var(--card);
  border-radius: 20px;
  width: min(480px, 100%);
  box-shadow: 0 24px 60px rgba(0,0,0,.18);
  overflow: hidden;
}

.bp-modal-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 22px 22px 0;
  gap: 16px;
}

.bp-modal-title {
  font-size: 17px;
  font-weight: 800;
  letter-spacing: -0.4px;
}

.bp-modal-sub {
  font-size: 12px;
  color: var(--muted);
  margin-top: 3px;
}

.bp-modal-close {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: none;
  cursor: pointer;
  color: var(--muted);
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all .15s;
}

.bp-modal-close:hover { background: var(--red); color: #fff; border-color: var(--red); }

.bp-modal-body { padding: 18px 22px; }

.bp-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.bp-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.bp-field-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .05em;
  text-transform: uppercase;
  color: var(--muted);
}

.bp-required { color: var(--red); }

.bp-input {
  height: 38px;
  border-radius: 10px;
  border: 1px solid var(--border);
  padding: 0 12px;
  outline: none;
  background: var(--bg);
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  transition: border-color .15s, box-shadow .15s;
}

.bp-input:focus {
  border-color: var(--blue);
  box-shadow: 0 0 0 3px rgba(59,130,246,.12);
  background: var(--card);
}

.bp-input--disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.bp-modal-error {
  margin-top: 12px;
  padding: 10px 13px;
  border-radius: 10px;
  border: 1px solid rgba(239,68,68,.2);
  background: rgba(239,68,68,.06);
  color: #b91c1c;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
}

.bp-modal-foot {
  padding: 14px 22px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  border-top: 1px solid var(--border);
  background: var(--bg);
}

.bp-foot-cancel {
  height: 36px;
  padding: 0 16px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--card);
  font-size: 13px;
  font-weight: 700;
  color: var(--muted);
  cursor: pointer;
  transition: all .15s;
}

.bp-foot-cancel:hover { color: var(--text); border-color: #94a3b8; }

.bp-foot-save {
  height: 36px;
  padding: 0 16px;
  border-radius: 10px;
  border: none;
  background: var(--text);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  transition: opacity .15s;
}

.bp-foot-save:hover { opacity: 0.85; }
.bp-foot-save:disabled,
.bp-foot-cancel:disabled { opacity: 0.5; cursor: not-allowed; }

/* ─── Modal transition ───────────────────── */
.bp-modal-enter-active,
.bp-modal-leave-active { transition: all .2s ease; }

.bp-modal-enter-from,
.bp-modal-leave-to {
  opacity: 0;
  transform: scale(.97) translateY(8px);
}

/* ─── Responsive ─────────────────────────── */
@media (max-width: 768px) {
  .bp { padding: 14px; }
  .bp-form-grid { grid-template-columns: 1fr; }
  .bp-summary { gap: 8px; }
  .bp-stat { padding: 12px 14px; }
  .bp-stat-value { font-size: 22px; }
  .bp-header-right { width: 100%; }
  .bp-search-box { min-width: 0; flex: 1; }
}
</style>