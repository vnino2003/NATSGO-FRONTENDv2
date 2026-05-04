<template>
  <div class="dp">

    <!-- ── Header ── -->
    <div class="dp-header">
      <div class="dp-header-left">
        <div class="dp-title-row">
          <h1 class="dp-title">IoT Devices</h1>
          <span class="dp-live-badge">
            <span class="dp-live-dot"></span>
            Live
          </span>
        </div>
        <p class="dp-subtitle">ESP32 · GSM/WiFi · GPS · VL53L1X ToFr</p>
      </div>

      <div class="dp-header-right">
        <div class="dp-search-box">
          <i class="fas fa-magnifying-glass dp-search-icon"></i>
          <input
            v-model="q"
            class="dp-search-input"
            type="text"
            placeholder="Search device, ESP32 ID…"
          />
          <button v-if="q" class="dp-search-clear" @click="q = ''">
            <i class="fas fa-xmark"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- ── State feedback ── -->
    <div v-if="loading && !devices.length" class="dp-state-row">
      <i class="fas fa-circle-notch fa-spin"></i> Loading devices…
    </div>
    <div v-else-if="error" class="dp-state-row dp-state-error">
      <i class="fas fa-triangle-exclamation"></i> {{ error }}
    </div>

    <!-- ── Summary cards ── -->
    <div class="dp-summary">
      <div class="dp-stat">
        <div class="dp-stat-value">{{ devices.length }}</div>
        <div class="dp-stat-label">Total</div>
      </div>
      <div class="dp-stat dp-stat--green">
        <div class="dp-stat-value">{{ countByFilter('online') }}</div>
        <div class="dp-stat-label">Online</div>
      </div>
      <div class="dp-stat dp-stat--red">
        <div class="dp-stat-value">{{ countByFilter('offline') }}</div>
        <div class="dp-stat-label">Offline</div>
      </div>
      <div class="dp-stat dp-stat--amber">
        <div class="dp-stat-value">{{ countByFilter('attention') }}</div>
        <div class="dp-stat-label">Warnings</div>
      </div>
   
    </div>

    <!-- ── Filter pills ── -->
    <div class="dp-filters">
      <button
        v-for="f in filters"
        :key="f.key"
        class="dp-pill"
        :class="{ 'dp-pill--active': filter === f.key }"
        @click="filter = f.key"
      >
        {{ f.label }}
        <span class="dp-pill-count">{{ countByFilter(f.key) }}</span>
      </button>
    </div>

    <!-- ── Table ── -->
    <div class="dp-table-wrap">
      <table class="dp-table">
        <thead>
          <tr>
            <th>Device</th>
            <th>Status</th>
            <th>Network</th>
            <th>GPS</th>
            <th>Sensors</th>
            <th>Last Seen</th>
            <th>Health</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="d in filtered" :key="d.id" class="dp-row">

            <!-- Device -->
            <td>
              <div class="dp-device-name">{{ d.code }}</div>
              <div class="dp-device-sub">{{ d.esp32Id }}</div>
            </td>

            <!-- Online/Offline status -->
            <td>
              <span class="dp-status-chip" :class="d._raw.status === 'online' ? 'dp-status-chip--on' : 'dp-status-chip--off'">
                <span class="dp-status-dot"></span>
                {{ d._raw.status === 'online' ? 'Online' : 'Offline' }}
              </span>
            </td>

            <!-- Network -->
            <td>
              <div class="dp-inline">
                <span class="dp-dot" :class="`dp-dot--${d.network.dot}`"></span>
                <span class="dp-val">{{ d.network.type }}</span>
              </div>
              <div class="dp-sub">{{ d.network.rssi }}</div>
            </td>

            <!-- GPS -->
            <td>
              <div class="dp-inline">
                <span class="dp-dot" :class="`dp-dot--${d.gps.dot}`"></span>
                <span class="dp-val">{{ d.gps.fix }}</span>
              </div>
              <div class="dp-sub">{{ timeAgo(d._raw?.gps_recorded_at) }}</div>
            </td>

            <!-- Sensors -->
            <td>
              <div class="dp-chips">
                <span class="dp-chip" :class="`dp-chip--${d.tof.aChip}`">A</span>
                <span class="dp-chip" :class="`dp-chip--${d.tof.bChip}`">B</span>
<span class="dp-chip" :class="`dp-chip--${d.tof.stateChip}`">ToF</span>
              </div>
            </td>

            <!-- Passengers -->
      
            <!-- Last seen -->
            <td>
              <div class="dp-val">{{ d.lastSeen }}</div>
              <div class="dp-sub">{{ d.assignment || 'Unassigned' }}</div>
            </td>

            <!-- Health -->
            <td>
              <span class="dp-health" :class="`dp-health--${healthClass(d.health.state)}`">
                <i class="fas" :class="healthIcon(d.health.state)"></i>
                {{ d.health.state }}
              </span>
              <div v-if="d.health.issues.length" class="dp-sub">
                {{ d.health.issues.length }} issue(s)
              </div>
            </td>

            <!-- Action -->
            <td>
              <button class="dp-btn-view" @click="openView(d)">
                <i class="fas fa-circle-info"></i>
              </button>
            </td>
          </tr>

          <tr v-if="filtered.length === 0">
            <td colspan="9">
              <div class="dp-empty">
                <i class="fas fa-satellite-dish"></i>
                <p>No devices found</p>
                <small>Try another filter or keyword</small>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ── Detail Modal ── -->
    <Transition name="dp-modal">
      <div v-if="viewDevice" class="dp-overlay" @click.self="viewDevice = null">
        <div class="dp-modal">

          <div class="dp-modal-head">
            <div class="dp-modal-head-left">
              <span class="dp-status-chip" :class="viewDevice._raw.status === 'online' ? 'dp-status-chip--on' : 'dp-status-chip--off'">
                <span class="dp-status-dot"></span>
                {{ viewDevice._raw.status === 'online' ? 'Online' : 'Offline' }}
              </span>
              <div class="dp-modal-title">{{ viewDevice.code }}</div>
              <div class="dp-modal-sub">{{ viewDevice.esp32Id }} · {{ viewDevice.assignment || 'Unassigned' }}</div>
            </div>
            <button class="dp-modal-close" @click="viewDevice = null">
              <i class="fas fa-xmark"></i>
            </button>
          </div>

          <!-- Issues -->
          <div v-if="viewDevice.health.issues.length" class="dp-issues">
            <div class="dp-issues-title">
              <i class="fas fa-triangle-exclamation"></i>
              {{ viewDevice.health.issues.length }} issue(s) detected
            </div>
            <ul class="dp-issues-list">
              <li v-for="i in viewDevice.health.issues" :key="i">{{ i }}</li>
            </ul>
          </div>

          <!-- Stats grid -->
          <div class="dp-modal-grid">
            <div class="dp-mstat">
              <div class="dp-mstat-label">Network</div>
              <div class="dp-mstat-val">{{ viewDevice.network.type }}</div>
              <div class="dp-mstat-sub">{{ viewDevice.network.rssi }}</div>
            </div>
            <div class="dp-mstat">
              <div class="dp-mstat-label">GPS</div>
              <div class="dp-mstat-val">{{ viewDevice.gps.fix }}</div>
              <div class="dp-mstat-sub">Updated {{ timeAgo(viewDevice._raw?.gps_recorded_at) }}</div>
            </div>
   
            <div class="dp-mstat">
              <div class="dp-mstat-label">Health</div>
              <div class="dp-mstat-val" :class="`dp-mstat-val--${healthClass(viewDevice.health.state)}`">
                {{ viewDevice.health.state }}
              </div>
              <div class="dp-mstat-sub">Last seen {{ viewDevice.lastSeen }}</div>
            </div>
          </div>

          <!-- Sensors -->
          <div class="dp-modal-sensors">
            <div class="dp-modal-sensors-title">Sensors</div>
            <div class="dp-chips dp-chips--lg">
              <span class="dp-chip dp-chip--lg" :class="`dp-chip--${viewDevice.tof.aChip}`">
                <i class="fas fa-microchip"></i> ToF A
              </span>
              <span class="dp-chip dp-chip--lg" :class="`dp-chip--${viewDevice.tof.bChip}`">
                <i class="fas fa-microchip"></i> ToF B
              </span>
     <span class="dp-chip dp-chip--lg" :class="`dp-chip--${viewDevice.tof.stateChip}`">
  <i class="fas fa-wave-square"></i> ToF State
</span>
            </div>
          </div>

        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from "vue"
import { useDevices } from "../../../composables/useDevices"

const q = ref("")
const filter = ref("all")
const viewDevice = ref(null)

const filters = [
  { key: "all",        label: "All" },
  { key: "online",     label: "Online" },
  { key: "offline",    label: "Offline" },
  { key: "unassigned", label: "Unassigned" },
  { key: "attention",  label: "Warnings" },
]

const { rows: apiRows, loading, error, fetchDevices } = useDevices()

// ── Formatters ──────────────────────────────

function timeAgo(dateLike) {
  if (!dateLike) return "—"
  const dt = new Date(dateLike)
  const s = Math.floor((Date.now() - dt.getTime()) / 1000)
  if (s < 10)    return "just now"
  if (s < 60)    return `${s}s ago`
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

// ── UI mappers ───────────────────────────────

function networkUiFromApi(d) {
  const online = d.status === "online"
  const rssi   = d.signal_rssi ?? null
  return {
    label: online ? "Connected" : "Offline",
    type:  (d.network_type || "GSM").toUpperCase(),
    rssi:  rssi != null ? `${rssi} dBm` : "—",
    dot:   !online ? "off" : rssi >= -70 ? "ok" : rssi >= -85 ? "warn" : "bad",
  }
}

function gpsUiFromApi(d) {
  const state = String(d.gps_state || "").toLowerCase()
  return {
    dot: state === "active" ? "ok" : state === "searching" ? "warn" : "off",
    fix: state === "active"
      ? "Active (Fix)"
      : state === "searching"
        ? "Searching"
        : "Disconnected",
  }
}

function tofUiFromApi(d) {
  const online     = d.status === "online"
  const tofState   = String(d.tof_state || "").toLowerCase()  // effective from API
  const stateOk    = online && tofState === "ok"
  const aOk        = online && Number(d.tof_a_ok) === 1        // ✅ tof_a_ok from DB
  const bOk        = online && Number(d.tof_b_ok) === 1        // ✅ tof_b_ok from DB

  return {
    aChip:     !online ? "warn" : aOk ? "ok" : "bad",
    bChip:     !online ? "warn" : bOk ? "ok" : "bad",
    stateChip: !online ? "warn" : stateOk ? "ok" : tofState === "stale" ? "warn" : "bad",
  }
}

function healthUiFromApi(d) {
  const issues = []
  const online = d.status === "online"

  if (online && d.gps_state !== "active")                              issues.push("GPS not active")
  if (online && Number(d.tof_a_ok) !== 1)                              issues.push("ToF A not responding")
  if (online && Number(d.tof_b_ok) !== 1)                              issues.push("ToF B not responding")
  if (online && String(d.tof_state || "").toLowerCase() === "stale")   issues.push("ToF state is stale")

  return {
    state:  !online ? "Offline" : issues.length === 0 ? "Healthy" : "Warning",
    issues,
  }
}

function mapRow(d) {
  return {
    id:         d.id,
    code:       d.device_code,
    esp32Id:    d.esp32_id,
    network:    networkUiFromApi(d),
    gps:        gpsUiFromApi(d),
    tof:        tofUiFromApi(d),      // aChip, bChip, stateChip
    health:     healthUiFromApi(d),
    lastSeen:   timeAgo(d.last_seen_at),
    assignment: d.bus_code || null,
    _raw:       d,
  }
}

// ── Computed ─────────────────────────────────

const devices = computed(() => (apiRows.value || []).map(mapRow))

const filtered = computed(() => {
  const kw = q.value.toLowerCase()
  return devices.value
    .filter(d =>
      [d.code, d.esp32Id, d.assignment || ""].join(" ").toLowerCase().includes(kw)
    )
    .filter(d => {
      const st = d._raw.status
      if (filter.value === "online")     return st === "online"
      if (filter.value === "offline")    return st !== "online"
      if (filter.value === "unassigned") return !d.assignment
      if (filter.value === "attention")  return d.health.state === "Warning"
      return true
    })
})

function countByFilter(key) {
  if (key === "all")        return devices.value.length
  if (key === "online")     return devices.value.filter(d => d._raw.status === "online").length
  if (key === "offline")    return devices.value.filter(d => d._raw.status !== "online").length
  if (key === "unassigned") return devices.value.filter(d => !d.assignment).length
  if (key === "attention")  return devices.value.filter(d => d.health.state === "Warning").length
  return 0
}

// ── UI helpers ───────────────────────────────

function healthClass(state) {
  if (state === "Healthy") return "green"
  if (state === "Warning") return "amber"
  return "red"
}

function healthIcon(state) {
  if (state === "Healthy") return "fa-circle-check"
  if (state === "Warning") return "fa-triangle-exclamation"
  return "fa-circle-xmark"
}

function openView(d) { viewDevice.value = d }

// ── Polling ──────────────────────────────────

let poll = null
onMounted(async () => {
  await fetchDevices()
  poll = setInterval(fetchDevices, 5000)
})
onBeforeUnmount(() => { if (poll) clearInterval(poll) })
</script>
<style scoped>
/* ─── Tokens ─────────────────────────────── */
.dp {
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
.dp-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.dp-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dp-title {
  font-size: 22px;
  font-weight: 800;
  margin: 0;
  letter-spacing: -0.5px;
}

.dp-subtitle {
  font-size: 12px;
  color: var(--muted);
  margin: 4px 0 0;
}

.dp-live-badge {
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

.dp-live-dot {
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

/* ─── Search ─────────────────────────────── */
.dp-search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 8px 12px;
  min-width: 260px;
}

.dp-search-icon { color: var(--muted); font-size: 13px; }

.dp-search-input {
  border: none;
  outline: none;
  background: transparent;
  font-size: 13px;
  flex: 1;
  color: var(--text);
}

.dp-search-clear {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--muted);
  padding: 0;
  line-height: 1;
}

/* ─── State row ──────────────────────────── */
.dp-state-row {
  font-size: 13px;
  color: var(--muted);
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.dp-state-error { color: var(--red); }

/* ─── Summary ────────────────────────────── */
.dp-summary {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.dp-stat {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 14px 20px;
  min-width: 100px;
  flex: 1;
}

.dp-stat-value {
  font-size: 26px;
  font-weight: 900;
  line-height: 1;
  letter-spacing: -1px;
}

.dp-stat-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--muted);
  margin-top: 4px;
  text-transform: uppercase;
  letter-spacing: .5px;
}

.dp-stat--green .dp-stat-value { color: var(--green); }
.dp-stat--red   .dp-stat-value { color: var(--red); }
.dp-stat--amber .dp-stat-value { color: var(--amber); }
.dp-stat--blue  .dp-stat-value { color: var(--blue); }

/* ─── Filter pills ───────────────────────── */
.dp-filters {
  display: flex;
  gap: 6px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.dp-pill {
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

.dp-pill:hover { border-color: #94a3b8; color: var(--text); }

.dp-pill--active {
  background: var(--text);
  border-color: var(--text);
  color: #fff;
}

.dp-pill-count {
  background: rgba(255,255,255,.2);
  border-radius: 999px;
  padding: 1px 6px;
  font-size: 10px;
}

.dp-pill:not(.dp-pill--active) .dp-pill-count {
  background: var(--bg);
  color: var(--muted);
}

/* ─── Table ──────────────────────────────── */
.dp-table-wrap {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}

.dp-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.dp-table thead th {
  padding: 11px 14px;
  text-align: left;
  font-size: 11px;
  font-weight: 700;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: .5px;
  background: #f8fafc;
  border-bottom: 1px solid var(--border);
}

.dp-row {
  border-bottom: 1px solid rgba(226,232,240,.6);
  transition: background .12s;
}

.dp-row:last-child { border-bottom: none; }
.dp-row:hover { background: #f8fafc; }

.dp-table td { padding: 12px 14px; vertical-align: middle; }

/* Device name */
.dp-device-name { font-weight: 700; font-size: 13px; }
.dp-device-sub  { font-size: 11px; color: var(--muted); font-family: monospace; margin-top: 2px; }

/* Status chip */
.dp-status-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
}

.dp-status-chip--on {
  background: rgba(16,185,129,.1);
  color: var(--green);
}

.dp-status-chip--off {
  background: rgba(239,68,68,.08);
  color: var(--red);
}

.dp-status-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
}

.dp-status-chip--on .dp-status-dot {
  animation: pulse 1.4s ease-in-out infinite;
}

/* Dot indicator */
.dp-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
.dp-dot--ok   { background: var(--green); }
.dp-dot--warn { background: var(--amber); }
.dp-dot--bad  { background: var(--red); }
.dp-dot--off  { background: #cbd5e1; }

.dp-inline { display: flex; align-items: center; gap: 6px; }
.dp-val    { font-weight: 600; font-size: 12px; }
.dp-sub    { font-size: 11px; color: var(--muted); margin-top: 2px; }

/* Sensor chips */
.dp-chips { display: flex; gap: 4px; flex-wrap: wrap; }

.dp-chip {
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: .3px;
}

.dp-chip--ok   { background: rgba(16,185,129,.1);  color: var(--green); }
.dp-chip--warn { background: rgba(245,158,11,.1);  color: var(--amber); }
.dp-chip--bad  { background: rgba(239,68,68,.08);  color: var(--red); }

.dp-chip--lg { padding: 6px 12px; font-size: 12px; border-radius: 8px; }

/* Passengers */
.dp-pax { display: flex; flex-direction: column; }
.dp-pax-count { font-size: 18px; font-weight: 900; line-height: 1; letter-spacing: -0.5px; }
.dp-pax-sub   { font-size: 10px; color: var(--muted); margin-top: 2px; }

/* Health badge */
.dp-health {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
}

.dp-health--green { background: rgba(16,185,129,.1);  color: var(--green); }
.dp-health--amber { background: rgba(245,158,11,.1);  color: var(--amber); }
.dp-health--red   { background: rgba(239,68,68,.08);  color: var(--red); }

/* View button */
.dp-btn-view {
  width: 32px;
  height: 32px;
  border-radius: 8px;
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

.dp-btn-view:hover {
  background: var(--text);
  color: #fff;
  border-color: var(--text);
}

/* Empty state */
.dp-empty {
  padding: 48px;
  text-align: center;
  color: var(--muted);
}

.dp-empty i { font-size: 32px; margin-bottom: 12px; display: block; }
.dp-empty p { font-weight: 700; margin: 0 0 4px; color: var(--text); }
.dp-empty small { font-size: 12px; }

/* ─── Modal ──────────────────────────────── */
.dp-overlay {
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

.dp-modal {
  background: var(--card);
  border-radius: 20px;
  width: min(680px, 100%);
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 24px 60px rgba(0,0,0,.18);
}

.dp-modal-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 24px 24px 0;
  gap: 16px;
}

.dp-modal-title {
  font-size: 20px;
  font-weight: 800;
  margin: 6px 0 2px;
  letter-spacing: -0.5px;
}

.dp-modal-sub { font-size: 12px; color: var(--muted); }

.dp-modal-close {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: none;
  cursor: pointer;
  color: var(--muted);
  font-size: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all .15s;
}

.dp-modal-close:hover { background: var(--red); color: #fff; border-color: var(--red); }

/* Issues */
.dp-issues {
  margin: 16px 24px 0;
  padding: 12px 16px;
  background: rgba(245,158,11,.07);
  border: 1px solid rgba(245,158,11,.2);
  border-radius: 12px;
}

.dp-issues-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--amber);
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.dp-issues-list {
  margin: 0;
  padding: 0 0 0 16px;
  font-size: 12px;
  color: var(--muted);
}

.dp-issues-list li { margin-bottom: 2px; }

/* Modal grid */
.dp-modal-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 16px 24px;
}

.dp-mstat {
  background: var(--bg);
  border-radius: 12px;
  padding: 14px;
}

.dp-mstat-label {
  font-size: 10px;
  font-weight: 800;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: .5px;
  margin-bottom: 6px;
}

.dp-mstat-val {
  font-size: 20px;
  font-weight: 900;
  letter-spacing: -0.5px;
  line-height: 1;
}

.dp-mstat-val--green { color: var(--green); }
.dp-mstat-val--amber { color: var(--amber); }
.dp-mstat-val--red   { color: var(--red); }

.dp-mstat-sub {
  font-size: 11px;
  color: var(--muted);
  margin-top: 4px;
}

/* Modal sensors */
.dp-modal-sensors {
  padding: 0 24px 24px;
}

.dp-modal-sensors-title {
  font-size: 11px;
  font-weight: 700;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: .5px;
  margin-bottom: 10px;
}

.dp-chips--lg { gap: 8px; }

/* ─── Modal transition ───────────────────── */
.dp-modal-enter-active,
.dp-modal-leave-active { transition: all .2s ease; }

.dp-modal-enter-from,
.dp-modal-leave-to {
  opacity: 0;
  transform: scale(.97) translateY(8px);
}

/* ─── Responsive ─────────────────────────── */
@media (max-width: 768px) {
  .dp { padding: 14px; }
  .dp-modal-grid { grid-template-columns: 1fr; }
  .dp-summary { gap: 8px; }
  .dp-stat { padding: 12px 14px; }
  .dp-stat-value { font-size: 22px; }
}
</style>