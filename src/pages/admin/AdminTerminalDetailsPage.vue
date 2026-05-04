<!-- src/pages/admin/TerminalDetailPage.vue -->
<template>
  <div class="td">
    <!-- ── Header ── -->
    <div class="td-header">
      <div class="td-header-left">
        <!-- Breadcrumb -->
        <div class="td-breadcrumb">
          <button class="td-back" type="button" @click="$router.back()">
            <i class="fas fa-arrow-left"></i>
          </button>

          <span class="td-bc-sep">/</span>

          <span class="td-bc-link" @click="$router.push('/admin/terminals')">
            Terminals
          </span>

          <span class="td-bc-sep">/</span>
          <span class="td-bc-current">{{ terminal.name }}</span>
        </div>

        <!-- Title -->
        <div class="td-title-row">
          <div class="td-terminal-icon">
            <i class="fas fa-map-location-dot"></i>
          </div>

          <div>
            <h1 class="td-title">{{ terminal.name }}</h1>

            <p class="td-subtitle">
              <i class="fas fa-city"></i>
              {{ terminal.city }}

              <span class="td-dot-sep">·</span>

              <i class="fas fa-clock"></i>
              {{ terminal.hours }}

              <span class="td-dot-sep">·</span>

              <span class="td-coord">
                {{ terminal.lat }}, {{ terminal.lng }}
              </span>
            </p>
          </div>
        </div>
      </div>

      <!-- Search -->
      <div class="td-header-right">
        <div class="td-search-box">
          <i class="fas fa-magnifying-glass td-search-icon"></i>

          <input
            v-model="q"
            class="td-search-input"
            type="text"
            placeholder="Search bus, plate, driver, device…"
          />

          <button
            v-if="q"
            class="td-search-clear"
            type="button"
            @click="q = ''"
          >
            <i class="fas fa-xmark"></i>
          </button>
        </div>

        <button class="td-refresh-btn" type="button" @click="load" :disabled="loading">
          <i class="fas fa-rotate" :class="{ 'fa-spin': loading }"></i>
          Refresh
        </button>
      </div>
    </div>

    <!-- Loading / Error -->
    <div v-if="loading" class="td-loading">
      <i class="fas fa-circle-notch fa-spin"></i>
      Loading terminal details...
    </div>

    <div v-else-if="error" class="td-error">
      <i class="fas fa-triangle-exclamation"></i>
      {{ error }}
    </div>

    <!-- ── Summary cards ── -->
    <div class="td-summary">
      <div class="td-stat">
        <div class="td-stat-value">{{ buses.length }}</div>
        <div class="td-stat-label">Total Buses</div>
      </div>

      <div class="td-stat td-stat--green">
        <div class="td-stat-value">{{ countBy("in-terminal") }}</div>
        <div class="td-stat-label">In Terminal</div>
      </div>

      <div class="td-stat td-stat--blue">
        <div class="td-stat-value">{{ countBy("on-route") }}</div>
        <div class="td-stat-label">On Route</div>
      </div>

      <div class="td-stat td-stat--amber">
        <div class="td-stat-value">{{ countBy("maintenance") }}</div>
        <div class="td-stat-label">Maintenance</div>
      </div>

      <div class="td-stat td-stat--red">
        <div class="td-stat-value">{{ countBy("inactive") }}</div>
        <div class="td-stat-label">Inactive</div>
      </div>
    </div>

    <!-- ── Filter pills ── -->
    <div class="td-filters">
      <button
        v-for="f in filters"
        :key="f.key"
        class="td-pill"
        type="button"
        :class="{ 'td-pill--active': filter === f.key }"
        @click="filter = f.key"
      >
        {{ f.label }}
        <span class="td-pill-count">{{ countBy(f.key) }}</span>
      </button>
    </div>

    <!-- ── Bus Table ── -->
    <div class="td-table-wrap">
      <table class="td-table">
        <thead>
          <tr>
            <th>Bus</th>
            <th>Status</th>
            <th>Driver</th>
            <th>Route</th>
            <th>Passengers</th>
            <th>Device</th>
            <th>Last Activity</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="b in filtered"
            :key="b.id"
            class="td-row"
            @click="openDetail(b)"
          >
            <!-- Bus -->
            <td>
              <div class="td-bus-name">{{ b.code }}</div>
              <div class="td-bus-plate">{{ b.plate }}</div>
            </td>

            <!-- Status -->
            <td>
              <span class="td-status" :class="`td-status--${statusClass(b.status)}`">
                <span class="td-status-dot"></span>
                {{ statusLabel(b.status) }}
              </span>
            </td>

            <!-- Driver -->
            <td>
              <div class="td-driver-name">{{ b.driver }}</div>
              <div class="td-sub">{{ b.driverContact }}</div>
            </td>

            <!-- Route -->
            <td>
              <div class="td-val">{{ b.route }}</div>
              <div class="td-sub">{{ b.routeType }}</div>
            </td>

            <!-- Passengers -->
            <td>
              <div class="td-pax">
                <span class="td-pax-num">{{ b.passengers }}</span>
                <span class="td-pax-cap">/ {{ b.capacity }}</span>
              </div>

              <div class="td-pax-bar">
                <div
                  class="td-pax-fill"
                  :class="paxClass(b.passengers, b.capacity)"
                  :style="{ width: paxPct(b.passengers, b.capacity) }"
                ></div>
              </div>
            </td>

            <!-- Device -->
            <td>
              <div class="td-inline">
                <span
                  class="td-dot"
                  :class="b.deviceOnline ? 'td-dot--ok' : 'td-dot--off'"
                ></span>

                <span class="td-val">{{ b.deviceId }}</span>
              </div>

              <div class="td-sub">
                {{ b.deviceOnline ? "Online" : "Offline" }}
              </div>
            </td>

            <!-- Last Activity -->
            <td>
              <div class="td-val">{{ fmtDateTime(b.lastSeen) }}</div>
              <div class="td-sub">{{ b.lastActivity }}</div>
            </td>

            <!-- Action -->
            <td>
              <button class="td-btn-view" type="button" @click.stop="openDetail(b)">
                <i class="fas fa-circle-info"></i>
              </button>
            </td>
          </tr>

          <tr v-if="!loading && filtered.length === 0">
            <td colspan="8">
              <div class="td-empty">
                <i class="fas fa-bus"></i>
                <p>No buses found</p>
                <small>Try another filter or search keyword</small>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ── Detail Modal ── -->
    <Transition name="td-modal">
      <div v-if="selected" class="td-overlay" @click.self="selected = null">
        <div class="td-modal">
          <div class="td-modal-head">
            <div class="td-modal-head-left">
              <span
                class="td-status"
                :class="`td-status--${statusClass(selected.status)}`"
              >
                <span class="td-status-dot"></span>
                {{ statusLabel(selected.status) }}
              </span>

              <div class="td-modal-title">{{ selected.code }}</div>
              <div class="td-modal-sub">
                {{ selected.plate }} · {{ selected.route }}
              </div>
            </div>

            <button class="td-modal-close" type="button" @click="selected = null">
              <i class="fas fa-xmark"></i>
            </button>
          </div>

          <!-- Stats grid -->
          <div class="td-modal-grid">
            <div class="td-mstat">
              <div class="td-mstat-label">Driver</div>
              <div class="td-mstat-val">{{ selected.driver }}</div>
              <div class="td-mstat-sub">{{ selected.driverContact }}</div>
            </div>

            <div class="td-mstat">
              <div class="td-mstat-label">Route</div>
              <div class="td-mstat-val">{{ selected.route }}</div>
              <div class="td-mstat-sub">{{ selected.routeType }}</div>
            </div>

            <div class="td-mstat">
              <div class="td-mstat-label">Passengers</div>
              <div class="td-mstat-val">
                {{ selected.passengers }} / {{ selected.capacity }}
              </div>
              <div class="td-mstat-sub">
                {{ paxPct(selected.passengers, selected.capacity) }} capacity
              </div>
            </div>

            <div class="td-mstat">
              <div class="td-mstat-label">Device</div>
              <div class="td-mstat-val">{{ selected.deviceId }}</div>
              <div class="td-mstat-sub">
                {{ selected.deviceOnline ? "Online" : "Offline" }}
              </div>
            </div>

            <div class="td-mstat">
              <div class="td-mstat-label">GPS / ToF</div>
              <div class="td-mstat-val">
                {{ selected.gpsState || "—" }}
              </div>
              <div class="td-mstat-sub">
                ToF: {{ selected.tofState || "—" }}
              </div>
            </div>

            <div class="td-mstat">
              <div class="td-mstat-label">Last Seen</div>
              <div class="td-mstat-val">
                {{ fmtDateTime(selected.lastSeen) }}
              </div>
              <div class="td-mstat-sub">
                {{ selected.lastActivity }}
              </div>
            </div>
          </div>

          <!-- Notes -->
          <div v-if="selected.notes" class="td-modal-notes">
            <div class="td-modal-notes-label">
              <i class="fas fa-note-sticky"></i>
              Notes
            </div>

            <p class="td-modal-notes-text">
              {{ selected.notes }}
            </p>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useTerminals } from "@/composables/useTerminal";

const route = useRoute();
const router = useRouter();

const {
  selectedTerminal,
  terminalBuses,
  detailLoading,
  busesLoading,
  detailError,
  busesError,
  fetchTerminalById,
  fetchTerminalBuses,
} = useTerminals();

const q = ref("");
const filter = ref("all");
const selected = ref(null);

let poll = null;

const terminalId = computed(() => route.params.id);

const loading = computed(() => detailLoading.value || busesLoading.value);
const error = computed(() => detailError.value || busesError.value);

const terminal = computed(() => {
  const t = selectedTerminal.value;

  if (!t) {
    return {
      name: "Loading terminal...",
      city: "—",
      hours: "—",
      lat: "—",
      lng: "—",
    };
  }

  return {
    name: t.terminal_name || "Unnamed Terminal",
    city: t.city || "—",
    hours: `${fmtTime(t.available_from)} – ${fmtTime(t.available_to)}`,
    lat: fmtCoord(t.lat),
    lng: fmtCoord(t.lng),
    bus_count: Number(t.bus_count ?? 0),
  };
});

const buses = computed(() => terminalBuses.value || []);

const filters = [
  { key: "all", label: "All" },
  { key: "in-terminal", label: "In Terminal" },
  { key: "on-route", label: "On Route" },
  { key: "maintenance", label: "Maintenance" },
  { key: "inactive", label: "Inactive" },
];

async function load() {
  if (!terminalId.value) return;

  try {
    await Promise.all([
      fetchTerminalById(terminalId.value),
      fetchTerminalBuses(terminalId.value),
    ]);
  } catch (e) {
    // errors are already saved in composable
  }
}

onMounted(async () => {
  await load();

  poll = setInterval(() => {
    load();
  }, 8000);
});

onBeforeUnmount(() => {
  if (poll) clearInterval(poll);
});

watch(
  () => route.params.id,
  async () => {
    selected.value = null;
    q.value = "";
    filter.value = "all";
    await load();
  }
);

const filtered = computed(() => {
  const kw = q.value.trim().toLowerCase();

  return buses.value
    .filter((b) => {
      const haystack = [
        b.code,
        b.plate,
        b.driver,
        b.driverContact,
        b.route,
        b.routeType,
        b.deviceId,
        b.deviceStatus,
        b.gpsState,
        b.tofState,
        b.lastActivity,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(kw);
    })
    .filter((b) => filter.value === "all" || b.status === filter.value);
});

function countBy(key) {
  if (key === "all") return buses.value.length;

  return buses.value.filter((b) => b.status === key).length;
}

function statusClass(status) {
  if (status === "in-terminal") return "green";
  if (status === "on-route") return "blue";
  if (status === "maintenance") return "amber";
  return "red";
}

function statusLabel(status) {
  if (status === "in-terminal") return "In Terminal";
  if (status === "on-route") return "On Route";
  if (status === "maintenance") return "Maintenance";
  return "Inactive";
}

function paxPct(passengers, capacity) {
  const p = Number(passengers ?? 0);
  const c = Number(capacity ?? 0);

  if (!c) return "0%";

  const pct = Math.max(0, Math.min(100, Math.round((p / c) * 100)));
  return `${pct}%`;
}

function paxClass(passengers, capacity) {
  const p = Number(passengers ?? 0);
  const c = Number(capacity ?? 0);

  if (!c) return "td-pax-fill--green";

  const pct = (p / c) * 100;

  if (pct >= 90) return "td-pax-fill--red";
  if (pct >= 70) return "td-pax-fill--amber";
  return "td-pax-fill--green";
}

function fmtCoord(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(6) : "—";
}

function fmtTime(value) {
  const s = String(value || "");
  return s ? s.slice(0, 5) : "—";
}

function fmtDateTime(value) {
  if (!value) return "No activity";

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) {
    return String(value);
  }

  return d.toLocaleString("en-PH", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function openDetail(bus) {
  if (!bus?.id) return;

  router.push(`/admin/buses/${bus.id}`);
}
</script>

<style scoped>
/* ─── Tokens ─────────────────────────────────────── */
.td {
  --green: #10b981;
  --amber: #f59e0b;
  --red: #ef4444;
  --blue: #3b82f6;
  --slate: #64748b;
  --border: rgba(226, 232, 240, 1);
  --bg: #f8fafc;
  --card: #ffffff;
  --text: #0f172a;
  --muted: #64748b;
  --radius: 14px;

  font-family: "DM Sans", "Segoe UI", sans-serif;
  background: var(--bg);
  padding: 24px;
  min-height: 100vh;
  color: var(--text);
}

/* ─── Header ─────────────────────────────────────── */
.td-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.td-header-left {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.td-header-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

/* Breadcrumb */
.td-breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
}

.td-back {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  border: 1px solid var(--border);
  background: var(--card);
  cursor: pointer;
  color: var(--muted);
  font-size: 12px;
  display: grid;
  place-items: center;
  transition: all 0.15s;
}

.td-back:hover {
  background: var(--text);
  color: #fff;
  border-color: var(--text);
}

.td-bc-sep {
  opacity: 0.4;
  font-size: 11px;
}

.td-bc-link {
  cursor: pointer;
  transition: color 0.12s;
}

.td-bc-link:hover {
  color: var(--blue);
}

.td-bc-current {
  color: var(--text);
  font-weight: 700;
}

/* Title row */
.td-title-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.td-terminal-icon {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  background: rgba(59, 130, 246, 0.08);
  border: 1px solid rgba(59, 130, 246, 0.15);
  color: var(--blue);
  display: grid;
  place-items: center;
  font-size: 18px;
  flex-shrink: 0;
}

.td-title {
  font-size: 22px;
  font-weight: 800;
  margin: 0;
  letter-spacing: -0.5px;
}

.td-subtitle {
  font-size: 12px;
  color: var(--muted);
  margin: 4px 0 0;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.td-subtitle i {
  font-size: 10px;
}

.td-dot-sep {
  opacity: 0.4;
}

.td-coord {
  font-family: monospace;
  font-size: 11px;
}

/* Search */
.td-search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 8px 12px;
  min-width: 260px;
}

.td-search-icon {
  color: var(--muted);
  font-size: 13px;
}

.td-search-input {
  border: none;
  outline: none;
  background: transparent;
  font-family: inherit;
  font-size: 13px;
  flex: 1;
  min-width: 0;
  color: var(--text);
}

.td-search-clear {
  border: none;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  padding: 0;
}

.td-refresh-btn {
  height: 36px;
  border: 1px solid var(--border);
  background: var(--card);
  border-radius: 10px;
  padding: 0 12px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.td-refresh-btn:hover {
  background: #f1f5f9;
}

.td-refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Loading / Error */
.td-loading,
.td-error {
  margin-bottom: 16px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--card);
  font-size: 13px;
  font-weight: 700;
  color: var(--muted);
  display: flex;
  align-items: center;
  gap: 8px;
}

.td-error {
  color: var(--red);
  border-color: rgba(239, 68, 68, 0.25);
  background: rgba(239, 68, 68, 0.06);
}

/* Summary */
.td-summary {
  display: grid;
  grid-template-columns: repeat(5, minmax(120px, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.td-stat {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
}

.td-stat-value {
  font-size: 24px;
  font-weight: 900;
  letter-spacing: -0.5px;
}

.td-stat-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--muted);
  margin-top: 2px;
}

.td-stat--green .td-stat-value {
  color: var(--green);
}

.td-stat--blue .td-stat-value {
  color: var(--blue);
}

.td-stat--amber .td-stat-value {
  color: var(--amber);
}

.td-stat--red .td-stat-value {
  color: var(--red);
}

/* Filters */
.td-filters {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.td-pill {
  border: 1px solid var(--border);
  background: var(--card);
  color: var(--muted);
  border-radius: 999px;
  padding: 8px 12px;
  font-family: inherit;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  transition: all 0.15s;
}

.td-pill:hover {
  background: #f1f5f9;
  color: var(--text);
}

.td-pill--active {
  background: var(--text);
  color: #fff;
  border-color: var(--text);
}

.td-pill-count {
  min-width: 20px;
  height: 20px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: rgba(148, 163, 184, 0.16);
  font-size: 11px;
}

.td-pill--active .td-pill-count {
  background: rgba(255, 255, 255, 0.18);
}

/* Table */
.td-table-wrap {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.04);
}

.td-table {
  width: 100%;
  border-collapse: collapse;
}

.td-table th {
  text-align: left;
  padding: 14px 16px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--muted);
  background: #f8fafc;
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}

.td-table td {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
  font-size: 13px;
}

.td-row {
  cursor: pointer;
  transition: background 0.12s;
}

.td-row:hover {
  background: #f8fafc;
}

.td-row:last-child td {
  border-bottom: none;
}

.td-bus-name {
  font-size: 13px;
  font-weight: 900;
  color: var(--text);
}

.td-bus-plate,
.td-sub {
  font-size: 11px;
  color: var(--muted);
  margin-top: 2px;
}

.td-driver-name,
.td-val {
  font-size: 13px;
  font-weight: 800;
  color: var(--text);
}

.td-inline {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.td-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
}

.td-dot--ok {
  background: var(--green);
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.12);
}

.td-dot--off {
  background: var(--red);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.12);
}

/* Status */
.td-status {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 900;
  white-space: nowrap;
}

.td-status-dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: currentColor;
}

.td-status--green {
  color: var(--green);
  background: rgba(16, 185, 129, 0.1);
}

.td-status--blue {
  color: var(--blue);
  background: rgba(59, 130, 246, 0.1);
}

.td-status--amber {
  color: var(--amber);
  background: rgba(245, 158, 11, 0.12);
}

.td-status--red {
  color: var(--red);
  background: rgba(239, 68, 68, 0.1);
}

/* Passenger */
.td-pax {
  display: flex;
  align-items: baseline;
  gap: 3px;
}

.td-pax-num {
  font-size: 13px;
  font-weight: 900;
}

.td-pax-cap {
  font-size: 11px;
  color: var(--muted);
  font-weight: 700;
}

.td-pax-bar {
  width: 80px;
  height: 7px;
  border-radius: 999px;
  background: #e2e8f0;
  overflow: hidden;
  margin-top: 6px;
}

.td-pax-fill {
  height: 100%;
  border-radius: inherit;
  transition: width 0.2s;
}

.td-pax-fill--green {
  background: var(--green);
}

.td-pax-fill--amber {
  background: var(--amber);
}

.td-pax-fill--red {
  background: var(--red);
}

/* View button */
.td-btn-view {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: #fff;
  color: var(--muted);
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: all 0.15s;
}

.td-btn-view:hover {
  background: var(--text);
  color: #fff;
  border-color: var(--text);
}

/* Empty */
.td-empty {
  padding: 44px 20px;
  text-align: center;
  color: var(--muted);
}

.td-empty i {
  font-size: 30px;
  margin-bottom: 10px;
  opacity: 0.65;
}

.td-empty p {
  margin: 0;
  font-size: 14px;
  font-weight: 900;
  color: var(--text);
}

.td-empty small {
  display: block;
  margin-top: 4px;
  font-size: 12px;
}

/* Modal */
.td-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: grid;
  place-items: center;
  padding: 20px;
}

.td-modal {
  width: min(720px, 100%);
  background: var(--card);
  border-radius: 18px;
  border: 1px solid var(--border);
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.22);
  overflow: hidden;
}

.td-modal-head {
  padding: 18px 20px;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.td-modal-head-left {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.td-modal-title {
  font-size: 20px;
  font-weight: 900;
  color: var(--text);
}

.td-modal-sub {
  font-size: 12px;
  color: var(--muted);
  font-weight: 700;
}

.td-modal-close {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: #fff;
  color: var(--muted);
  cursor: pointer;
  display: grid;
  place-items: center;
}

.td-modal-close:hover {
  background: #f1f5f9;
  color: var(--text);
}

/* Modal stats */
.td-modal-grid {
  padding: 20px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.td-mstat {
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 14px;
  background: #f8fafc;
}

.td-mstat-label {
  font-size: 11px;
  font-weight: 900;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 6px;
}

.td-mstat-val {
  font-size: 14px;
  font-weight: 900;
  color: var(--text);
}

.td-mstat-sub {
  font-size: 11px;
  color: var(--muted);
  margin-top: 3px;
}

/* Notes */
.td-modal-notes {
  margin: 0 20px 20px;
  border: 1px solid rgba(245, 158, 11, 0.25);
  background: rgba(245, 158, 11, 0.08);
  border-radius: 14px;
  padding: 14px;
}

.td-modal-notes-label {
  font-size: 12px;
  font-weight: 900;
  color: #b45309;
  display: flex;
  align-items: center;
  gap: 7px;
}

.td-modal-notes-text {
  margin: 7px 0 0;
  font-size: 13px;
  color: var(--text);
}

/* Modal animation */
.td-modal-enter-active,
.td-modal-leave-active {
  transition: opacity 0.18s ease;
}

.td-modal-enter-from,
.td-modal-leave-to {
  opacity: 0;
}

/* Responsive */
@media (max-width: 900px) {
  .td-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .td-table-wrap {
    overflow-x: auto;
  }

  .td-table {
    min-width: 920px;
  }

  .td-modal-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .td {
    padding: 16px;
  }

  .td-header {
    flex-direction: column;
  }

  .td-header-right,
  .td-search-box {
    width: 100%;
  }

  .td-search-box {
    min-width: 0;
  }

  .td-summary {
    grid-template-columns: 1fr;
  }

  .td-modal-grid {
    grid-template-columns: 1fr;
  }
}
</style>