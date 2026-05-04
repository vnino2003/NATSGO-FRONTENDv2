<!-- src/pages/admin/LiveTrackingPage.vue -->
<template>
  <div class="lt">

    <!-- ── Header ── -->
    <div class="lt-header">
      <div class="lt-header-left">
        <div class="lt-title-row">
          <h1 class="lt-title">Live Tracking</h1>
          <span class="lt-live-badge">
            <span class="lt-live-dot"></span>
            Live
          </span>
        </div>
        <p class="lt-subtitle">Real-time bus monitoring · GPS · Terminals</p>
      </div>
      <div class="lt-header-right">
        <button class="lt-btn-ghost" @click="refreshOnce" :disabled="false">
          <i class="fas fa-rotate"></i>
          Refresh
        </button>
        <button class="lt-btn-primary" @click="fitAll">
          <i class="fas fa-location-crosshairs"></i>
          Fit All
        </button>
      </div>
    </div>

    <!-- ── Summary cards ── -->
    <div class="lt-summary">
      <div class="lt-stat">
        <div class="lt-stat-value">{{ uiBuses.length }}</div>
        <div class="lt-stat-label">Total Buses</div>
      </div>
      <div class="lt-stat lt-stat--green">
        <div class="lt-stat-value">{{ countBy('Online') }}</div>
        <div class="lt-stat-label">Online</div>
      </div>
      <div class="lt-stat lt-stat--amber">
        <div class="lt-stat-value">{{ countBy('Warning') }}</div>
        <div class="lt-stat-label">Warning</div>
      </div>
      <div class="lt-stat lt-stat--red">
        <div class="lt-stat-value">{{ countBy('Offline') }}</div>
        <div class="lt-stat-label">Offline</div>
      </div>
      <div class="lt-stat lt-stat--blue">
        <div class="lt-stat-value">{{ (terminals || []).length }}</div>
        <div class="lt-stat-label">Terminals</div>
      </div>
    </div>

    <!-- ── Tabs ── -->
    <div class="lt-tabs">
      <button class="lt-tab" :class="{ 'lt-tab--active': view === 'tracking' }" @click="view = 'tracking'">
        <i class="fas fa-location-dot"></i>
        Tracking
      </button>
      <button class="lt-tab" :class="{ 'lt-tab--active': view === 'analytics' }" @click="view = 'analytics'">
        <i class="fas fa-chart-line"></i>
        Analytics
      </button>
    </div>

    <!-- ── Tracking view ── -->
    <div class="lt-grid" v-if="view === 'tracking'">

      <!-- Map -->
      <div class="lt-map-card">
        <div class="lt-card-head">
          <div class="lt-card-title">
            <i class="fas fa-map" style="color:var(--muted);font-size:13px;"></i>
            Map
          </div>
          <div class="lt-map-controls">
            <button class="lt-icon-btn" @click="zoomIn" title="Zoom in"><i class="fas fa-plus"></i></button>
            <button class="lt-icon-btn" @click="zoomOut" title="Zoom out"><i class="fas fa-minus"></i></button>
            <button class="lt-icon-btn" @click="centerOnMe" title="My location"><i class="fas fa-location-arrow"></i></button>
          </div>
        </div>

        <div class="lt-map-canvas" ref="mapEl">
          <div class="lt-legend">
            <div class="lt-legend-item"><span class="lt-dot lt-dot--green"></span> Online</div>
            <div class="lt-legend-item"><span class="lt-dot lt-dot--amber"></span> Warning</div>
            <div class="lt-legend-item"><span class="lt-dot lt-dot--red"></span> Offline</div>
            <div class="lt-legend-sep"></div>
            <div class="lt-legend-item"><span class="lt-dot lt-dot--blue"></span> Terminal</div>
            <div class="lt-legend-item"><span class="lt-dot lt-dot--range"></span> Range ({{ TERMINAL_RANGE_M }}m)</div>
          </div>
        </div>
      </div>

      <!-- Panel -->
      <div class="lt-panel-card">
        <div class="lt-card-head">
          <div class="lt-card-title">
            <i class="fas" :class="panelView === 'buses' ? 'fa-satellite-dish' : 'fa-map-location-dot'" style="color:var(--muted);font-size:13px;"></i>
            {{ panelView === 'buses' ? 'Tracked Buses' : 'Terminals' }}
            <span class="lt-badge">{{ panelView === 'buses' ? filteredBuses.length : filteredTerminals.length }}</span>
          </div>
          <div class="lt-panel-switch">
            <button class="lt-switch-btn" :class="{ 'lt-switch-btn--active': panelView === 'buses' }" @click="panelView = 'buses'">
              <i class="fas fa-bus"></i> Buses
            </button>
            <button class="lt-switch-btn" :class="{ 'lt-switch-btn--active': panelView === 'terminals' }" @click="panelView = 'terminals'">
              <i class="fas fa-building"></i> Terminals
            </button>
          </div>
        </div>

        <!-- Search + filters -->
        <div class="lt-panel-tools">
          <div class="lt-search">
            <i class="fas fa-magnifying-glass lt-search-icon"></i>
            <input
              v-if="panelView === 'buses'"
              v-model="q"
              class="lt-search-input"
              type="text"
              placeholder="Search bus…"
            />
            <input
              v-else
              v-model="tq"
              class="lt-search-input"
              type="text"
              placeholder="Search terminal…"
            />
            <button v-if="panelView === 'buses' ? q : tq" class="lt-search-clear" @click="panelView === 'buses' ? (q = '') : (tq = '')">
              <i class="fas fa-xmark"></i>
            </button>
          </div>

          <div class="lt-filters" v-if="panelView === 'buses'">
            <button class="lt-pill" :class="{ 'lt-pill--active': filter === 'all' }" @click="filter = 'all'">All <span class="lt-pill-count">{{ uiBuses.length }}</span></button>
            <button class="lt-pill" :class="{ 'lt-pill--active': filter === 'online' }" @click="filter = 'online'">Online</button>
            <button class="lt-pill" :class="{ 'lt-pill--active': filter === 'warning' }" @click="filter = 'warning'">Warning</button>
            <button class="lt-pill" :class="{ 'lt-pill--active': filter === 'offline' }" @click="filter = 'offline'">Offline</button>
          </div>
          <div class="lt-term-hint" v-else>
            <i class="fas fa-circle-info"></i>
            Click a terminal to show its range on the map
          </div>
        </div>

        <!-- Bus list -->
        <div class="lt-list" v-if="panelView === 'buses'">
          <button
            v-for="b in filteredBuses"
            :key="b.id"
            class="lt-bus-item"
            :class="{ 'lt-bus-item--active': selectedBus?.id === b.id }"
            @click="selectBus(b)"
          >
            <div class="lt-bus-item-top">
              <div class="lt-bus-item-left">
                <div class="lt-bus-code">{{ b.code }}</div>
                <div class="lt-bus-meta">
                  <span class="lt-mono">{{ b.plate || '—' }}</span>
                  <span class="lt-sep">·</span>
                  <span>{{ b.route || 'Unknown route' }}</span>
                  <span class="lt-sep">·</span>
                  <span class="lt-pax"><i class="fas fa-users"></i> {{ b.passengerCount }}/{{ b.capacity || '—' }}<span v-if="b.occPct != null"> ({{ b.occPct }}%)</span></span>
                </div>
              </div>
              <div class="lt-bus-item-right">
                <div class="lt-speed">
                  <span class="lt-speed-num">{{ b.speed }}</span>
                  <span class="lt-speed-unit">km/h</span>
                </div>
                <span class="lt-status-chip" :class="`lt-status-chip--${statusKey(b.status)}`">
                  <i class="fas" :class="statusIcon(b.status)"></i>
                  {{ b.status }}
                </span>
              </div>
            </div>
            <div class="lt-bus-item-bottom">
              <span class="lt-meta-item"><i class="fas fa-location-crosshairs"></i> {{ safeFixed(b.lat) }}, {{ safeFixed(b.lng) }}</span>
              <span class="lt-sep">·</span>
              <span class="lt-meta-item"><i class="fas fa-road"></i> {{ b.terminalAt ? 'at terminal' : 'on road' }}<span v-if="b.distM != null"> · {{ Math.round(b.distM) }}m</span></span>
              <span class="lt-sep">·</span>
              <span class="lt-meta-item"><i class="fas fa-signal"></i> {{ b.signal }}</span>
              <span class="lt-sep">·</span>
              <span class="lt-meta-item"><i class="fas fa-clock"></i> {{ b.lastSeen }}</span>
            </div>
          </button>

          <div v-if="!filteredBuses.length" class="lt-empty">
            <i class="fas fa-bus"></i>
            <p>No buses found</p>
            <small>Try another keyword or filter</small>
          </div>
        </div>

        <!-- Terminal list -->
        <div class="lt-list" v-else>
          <button
            v-for="t in filteredTerminals"
            :key="t.terminal_id"
            class="lt-term-item"
            :class="{ 'lt-term-item--active': selectedTerminal?.terminal_id === t.terminal_id }"
            @click="selectTerminal(t)"
          >
            <div class="lt-term-item-top">
              <div class="lt-term-left">
                <div class="lt-term-icon-wrap">
                  <i class="fas fa-building"></i>
                </div>
                <div class="lt-term-info">
                  <div class="lt-term-name-row">
                    <span class="lt-term-name">{{ t.terminal_name || 'Terminal' }}</span>
                    <span class="lt-term-id-badge">ID {{ t.terminal_id }}</span>
                  </div>
                  <div class="lt-term-city"><i class="fas fa-city"></i> {{ t.city || '—' }}</div>
                </div>
              </div>
              <span class="lt-term-bus-count">
                <i class="fas fa-bus"></i>
                {{ Number(t.bus_count ?? 0) }}
              </span>
            </div>
            <div class="lt-term-item-bottom">
              <span class="lt-meta-item"><i class="fas fa-location-crosshairs"></i> {{ safeFixed(t.lat) }}, {{ safeFixed(t.lng) }}</span>
              <span class="lt-sep">·</span>
              <span class="lt-meta-item"><i class="fas fa-bullseye"></i> {{ TERMINAL_RANGE_M }}m range</span>
              <span class="lt-sep">·</span>
              <span class="lt-meta-item"><i class="fas fa-clock"></i> {{ fmtTime(t.available_from) }}–{{ fmtTime(t.available_to) }}</span>
            </div>
          </button>

          <div v-if="!filteredTerminals.length" class="lt-empty">
            <i class="fas fa-building"></i>
            <p>No terminals found</p>
            <small>Try another keyword</small>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Analytics view ── -->
    <div v-else class="lt-analytics-card">
      <div class="lt-card-head">
        <div class="lt-card-title">
          <i class="fas fa-chart-line" style="color:var(--muted);font-size:13px;"></i>
          Analytics
        </div>
      </div>
      <div class="lt-analytics-empty">
        <i class="fas fa-chart-line"></i>
        <p>Coming soon</p>
        <small>Charts and analytics will be available here</small>
      </div>
    </div>

    <!-- ── Floating: Bus selected ── -->
    <Transition name="lt-float">
      <div v-if="selectedBus" class="lt-float">
        <div class="lt-float-left">
          <div class="lt-float-title">
            <i class="fas fa-bus"></i>
            {{ selectedBus.code }}
            <span class="lt-status-chip" :class="`lt-status-chip--${statusKey(selectedBus.status)}`">
              <i class="fas" :class="statusIcon(selectedBus.status)"></i>
              {{ selectedBus.status }}
            </span>
          </div>
          <div class="lt-float-sub">
            <span class="lt-mono">{{ selectedBus.plate }}</span>
            <span class="lt-sep">·</span>
            {{ selectedBus.route || 'Unknown route' }}
            <span class="lt-sep">·</span>
            <i class="fas fa-users"></i> {{ selectedBus.passengerCount }}/{{ selectedBus.capacity || '—' }}
            <span v-if="selectedBus.occPct != null"> ({{ selectedBus.occPct }}%)</span>
            <span class="lt-sep">·</span>
            {{ selectedBus.terminalAt ? 'at terminal' : 'on road' }}
            <span v-if="selectedBus.distM != null"> · {{ Math.round(selectedBus.distM) }}m</span>
          </div>
        </div>
        <div class="lt-float-actions">
          <button class="lt-btn-ghost lt-btn-sm" @click="centerOnSelectedBus">
            <i class="fas fa-crosshairs"></i> Center
          </button>
          <button class="lt-btn-danger lt-btn-sm" @click="clearSelected">
            <i class="fas fa-xmark"></i> Close
          </button>
        </div>
      </div>
    </Transition>

    <!-- ── Floating: Terminal selected ── -->
    <Transition name="lt-float">
      <div v-if="selectedTerminal" class="lt-float lt-float--terminal">
        <div class="lt-float-left">
          <div class="lt-float-title">
            <i class="fas fa-building"></i>
            {{ selectedTerminal.terminal_name || 'Terminal' }}
            <span class="lt-term-bus-count">
              <i class="fas fa-bus"></i> {{ Number(selectedTerminal.bus_count ?? 0) }}
            </span>
          </div>
          <div class="lt-float-sub">
            {{ selectedTerminal.city || '—' }}
            <span class="lt-sep">·</span>
            <span class="lt-mono">{{ safeFixed(selectedTerminal.lat) }}, {{ safeFixed(selectedTerminal.lng) }}</span>
            <span class="lt-sep">·</span>
            {{ fmtTime(selectedTerminal.available_from) }}–{{ fmtTime(selectedTerminal.available_to) }}
            <span class="lt-sep">·</span>
            <i class="fas fa-bullseye"></i> {{ TERMINAL_RANGE_M }}m range
          </div>
        </div>
        <div class="lt-float-actions">
          <button class="lt-btn-ghost lt-btn-sm" @click="centerOnSelectedTerminal">
            <i class="fas fa-crosshairs"></i> Center
          </button>
          <button class="lt-btn-danger lt-btn-sm" @click="clearSelected">
            <i class="fas fa-xmark"></i> Close
          </button>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { useAdminLiveBuses } from "@/composables/useAdminLiveBuses";
import { useTerminals } from "@/composables/useTerminal";

const view      = ref("tracking");
const panelView = ref("buses");

const q      = ref("");
const filter = ref("all");
const tq     = ref("");

const selectedBus      = ref(null);
const selectedTerminal = ref(null);

const mapEl = ref(null);
let map      = null;
let myMarker = null;

const busMarkers      = new Map();
const terminalMarkers = new Map();

const FALLBACK         = { lat: 12.8797, lng: 121.774 };
const TERMINAL_RANGE_M = 60;

let terminalRangeCircle = null;

function clearTerminalRangeCircle() {
  if (terminalRangeCircle && map) map.removeLayer(terminalRangeCircle);
  terminalRangeCircle = null;
}

function drawTerminalRangeCircle(t) {
  if (!map || !t) return;
  const lat = Number(t.lat);
  const lng = Number(t.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
  clearTerminalRangeCircle();
  terminalRangeCircle = L.circle([lat, lng], {
    radius: TERMINAL_RANGE_M,
    color: "#3b82f6",
    weight: 2,
    opacity: 0.8,
    fillColor: "#3b82f6",
    fillOpacity: 0.08,
  }).addTo(map);
}

const { buses, start, stop, fetchOnce } = useAdminLiveBuses({ intervalMs: 2000 });
const { rows: terminals, fetchTerminals } = useTerminals();

const uiBuses = computed(() => buses.value || []);

let terminalPoll = null;

async function loadTerminalsOnce() {
  await fetchTerminals({ q: "" });
  await nextTick();
  syncTerminalMarkers();
}

const filteredBuses = computed(() => {
  const kw = q.value.trim().toLowerCase();
  return uiBuses.value
    .filter(b => {
      if (!kw) return true;
      return [b.code, b.plate, b.route, b.status, b.signal, b.passengerCount, b.capacity]
        .join(" ").toLowerCase().includes(kw);
    })
    .filter(b => {
      if (filter.value === "online")  return b.status === "Online";
      if (filter.value === "warning") return b.status === "Warning";
      if (filter.value === "offline") return b.status === "Offline";
      return true;
    });
});

const filteredTerminals = computed(() => {
  const kw = tq.value.trim().toLowerCase();
  return (terminals.value || []).filter(t => {
    if (!kw) return true;
    return [t.terminal_name, t.city, t.terminal_id].join(" ").toLowerCase().includes(kw);
  });
});

function countBy(status) { return uiBuses.value.filter(b => b.status === status).length; }
function safeFixed(v) { const n = Number(v); return Number.isFinite(n) ? n.toFixed(5) : "—"; }
function fmtTime(v) { const s = String(v || ""); return s ? s.slice(0, 5) : "—"; }

function statusKey(s) {
  if (s === "Online")  return "green";
  if (s === "Warning") return "amber";
  return "red";
}

function statusIcon(s) {
  if (s === "Online")  return "fa-circle-check";
  if (s === "Warning") return "fa-triangle-exclamation";
  return "fa-circle-xmark";
}

function clearSelected() {
  selectedBus.value = null;
  selectedTerminal.value = null;
  clearTerminalRangeCircle();
  refreshAllMarkerIcons();
}

function selectBus(b) {
  selectedTerminal.value = null;
  clearTerminalRangeCircle();
  selectedBus.value = b;
  panelView.value = "buses";
  refreshAllMarkerIcons();
  centerOnSelectedBus();
}

function selectTerminal(t) {
  selectedBus.value = null;
  selectedTerminal.value = t;
  panelView.value = "terminals";
  refreshAllMarkerIcons();
  drawTerminalRangeCircle(t);
  centerOnSelectedTerminal();
}

/* ── Leaflet icons ── */
function makeBusDivIcon(bus, isSelected = false) {
  const key = statusKey(bus.status);
  const sel = isSelected ? "sel" : "";
  return L.divIcon({
    className: "",
    html: `<div class="lt-map-bus ${key} ${sel}"><i class="fas fa-bus"></i></div>`,
    iconSize:   [36, 36],
    iconAnchor: [18, 18],
  });
}

function makeTerminalDivIcon(isSelected = false) {
  const sel = isSelected ? "sel" : "";
  return L.divIcon({
    className: "",
    html: `<div class="lt-map-term ${sel}"><i class="fas fa-building"></i></div>`,
    iconSize:   [36, 44],
    iconAnchor: [18, 40],
  });
}

function makeMyDivIcon() {
  return L.divIcon({
    className: "",
    html: `<div class="lt-map-me"></div>`,
    iconSize:   [14, 14],
    iconAnchor: [7, 7],
  });
}

/* ── Map init ── */
function initLeaflet() {
  if (!mapEl.value || map) return;
  map = L.map(mapEl.value, { zoomControl: false, attributionControl: false, tap: true })
    .setView([FALLBACK.lat, FALLBACK.lng], 6);
  L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", { maxZoom: 20 }).addTo(map);
  map.on("click", () => { clearSelected(); });
  requestAnimationFrame(() => map?.invalidateSize());
  setTimeout(() => map?.invalidateSize(), 350);
}

function addOrUpdateBusMarker(bus) {
  if (!map || !Number.isFinite(Number(bus.lat)) || !Number.isFinite(Number(bus.lng))) return;
  const pos = [Number(bus.lat), Number(bus.lng)];
  const existing = busMarkers.get(bus.id);
  if (existing) {
    existing.setLatLng(pos);
    existing.setIcon(makeBusDivIcon(bus, selectedBus.value?.id === bus.id));
    return;
  }
  const m = L.marker(pos, { icon: makeBusDivIcon(bus, selectedBus.value?.id === bus.id) }).addTo(map);
  m.on("click", (e) => { L.DomEvent.stopPropagation(e); selectBus(bus); });
  busMarkers.set(bus.id, m);
}

function removeBusMarker(id) {
  const m = busMarkers.get(id);
  if (m && map) map.removeLayer(m);
  busMarkers.delete(id);
}

function addOrUpdateTerminalMarker(t) {
  if (!map) return;
  const id  = t.terminal_id;
  const lat = Number(t.lat);
  const lng = Number(t.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
  const pos = [lat, lng];
  const existing = terminalMarkers.get(id);
  if (existing) {
    existing.setLatLng(pos);
    existing.setIcon(makeTerminalDivIcon(selectedTerminal.value?.terminal_id === id));
    return;
  }
  const m = L.marker(pos, { icon: makeTerminalDivIcon(selectedTerminal.value?.terminal_id === id) }).addTo(map);
  m.on("click", (e) => { L.DomEvent.stopPropagation(e); selectTerminal(t); });
  terminalMarkers.set(id, m);
}

function removeTerminalMarker(id) {
  const m = terminalMarkers.get(id);
  if (m && map) map.removeLayer(m);
  terminalMarkers.delete(id);
}

function refreshAllMarkerIcons() {
  for (const b of uiBuses.value) {
    const m = busMarkers.get(b.id);
    if (m) m.setIcon(makeBusDivIcon(b, selectedBus.value?.id === b.id));
  }
  for (const t of (terminals.value || [])) {
    const m = terminalMarkers.get(t.terminal_id);
    if (m) m.setIcon(makeTerminalDivIcon(selectedTerminal.value?.terminal_id === t.terminal_id));
  }
}

function syncBusMarkers() {
  if (!map) return;
  const nextIds = new Set(uiBuses.value.map(b => b.id));
  for (const id of busMarkers.keys()) if (!nextIds.has(id)) removeBusMarker(id);
  uiBuses.value.forEach(addOrUpdateBusMarker);
  if (selectedBus.value) {
    const updated = uiBuses.value.find(x => x.id === selectedBus.value.id);
    if (updated) selectedBus.value = updated;
  }
  refreshAllMarkerIcons();
}

function syncTerminalMarkers() {
  if (!map) return;
  const list   = terminals.value || [];
  const nextIds = new Set(list.map(t => t.terminal_id));
  for (const id of terminalMarkers.keys()) if (!nextIds.has(id)) removeTerminalMarker(id);
  list.forEach(addOrUpdateTerminalMarker);
  if (selectedTerminal.value) {
    const updated = list.find(x => x.terminal_id === selectedTerminal.value.terminal_id);
    if (updated) { selectedTerminal.value = updated; drawTerminalRangeCircle(updated); }
  }
  refreshAllMarkerIcons();
}

watch(buses,     () => syncBusMarkers(),                            { deep: true });
watch(terminals, async () => { await nextTick(); syncTerminalMarkers(); }, { deep: true });

function fitAll() {
  if (!map) return;
  const pts = [];
  uiBuses.value.forEach(b => { const la = Number(b.lat), ln = Number(b.lng); if (Number.isFinite(la) && Number.isFinite(ln)) pts.push([la, ln]); });
  (terminals.value || []).forEach(t => { const la = Number(t.lat), ln = Number(t.lng); if (Number.isFinite(la) && Number.isFinite(ln)) pts.push([la, ln]); });
  if (!pts.length) return;
  map.fitBounds(L.latLngBounds(pts), { padding: [40, 40] });
}

function centerOnSelectedBus() {
  if (!map || !selectedBus.value) return;
  map.flyTo([Number(selectedBus.value.lat), Number(selectedBus.value.lng)], Math.max(map.getZoom(), 16), { duration: 0.5 });
}

function centerOnSelectedTerminal() {
  if (!map || !selectedTerminal.value) return;
  map.flyTo([Number(selectedTerminal.value.lat), Number(selectedTerminal.value.lng)], Math.max(map.getZoom(), 15), { duration: 0.5 });
}

function zoomIn()  { map?.zoomIn(); }
function zoomOut() { map?.zoomOut(); }

function refreshOnce() {
  fetchOnce();
  loadTerminalsOnce();
}

function centerOnMe() {
  if (!map) return;
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(pos => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    if (!myMarker) myMarker = L.marker([lat, lng], { icon: makeMyDivIcon(), interactive: false }).addTo(map);
    else myMarker.setLatLng([lat, lng]);
    map.flyTo([lat, lng], 15, { duration: 0.6 });
  }, () => {}, { enableHighAccuracy: true, timeout: 12000 });
}

onMounted(async () => {
  initLeaflet();
  start();
  await fetchOnce();
  await loadTerminalsOnce();
  terminalPoll = setInterval(loadTerminalsOnce, 8000);
  await nextTick();
  syncBusMarkers();
  syncTerminalMarkers();
  setTimeout(() => map?.invalidateSize(), 350);
});

onUnmounted(() => {
  stop();
  if (terminalPoll) clearInterval(terminalPoll);
  clearTerminalRangeCircle();
  if (map) { map.off(); map.remove(); map = null; }
});
</script>

<style scoped>
/* ─── Tokens ─────────────────────────────── */
.lt {
  --green:  #10b981;
  --amber:  #f59e0b;
  --red:    #ef4444;
  --blue:   #3b82f6;
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
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ─── Header ─────────────────────────────── */
.lt-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.lt-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.lt-title {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.5px;
  margin: 0;
}

.lt-subtitle {
  font-size: 12px;
  color: var(--muted);
  margin: 4px 0 0;
}

.lt-live-badge {
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

.lt-live-dot {
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

.lt-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.lt-btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--card);
  font-size: 13px;
  font-weight: 700;
  color: var(--muted);
  cursor: pointer;
  transition: all .15s;
}
.lt-btn-ghost:hover { color: var(--text); border-color: #94a3b8; }

.lt-btn-primary {
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
.lt-btn-primary:hover { opacity: .85; }

.lt-btn-danger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid rgba(239,68,68,.2);
  background: rgba(239,68,68,.06);
  color: var(--red);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all .15s;
}
.lt-btn-danger:hover { background: rgba(239,68,68,.12); }

.lt-btn-sm { height: 32px; padding: 0 12px; font-size: 12px; border-radius: 8px; }

/* ─── Summary ────────────────────────────── */
.lt-summary {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.lt-stat {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 14px 20px;
  min-width: 100px;
  flex: 1;
}

.lt-stat-value {
  font-size: 26px;
  font-weight: 900;
  line-height: 1;
  letter-spacing: -1px;
}

.lt-stat-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--muted);
  margin-top: 4px;
  text-transform: uppercase;
  letter-spacing: .5px;
}

.lt-stat--green .lt-stat-value { color: var(--green); }
.lt-stat--amber .lt-stat-value { color: var(--amber); }
.lt-stat--red   .lt-stat-value { color: var(--red); }
.lt-stat--blue  .lt-stat-value { color: var(--blue); }

/* ─── Tabs ───────────────────────────────── */
.lt-tabs {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid var(--border);
  padding-bottom: 0;
}

.lt-tab {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 38px;
  padding: 0 14px;
  border: none;
  background: transparent;
  font-size: 13px;
  font-weight: 600;
  color: var(--muted);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: all .15s;
}

.lt-tab:hover { color: var(--text); }

.lt-tab--active {
  color: var(--blue);
  border-bottom-color: var(--blue);
}

/* ─── Grid ───────────────────────────────── */
.lt-grid {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 16px;
  align-items: start;
  min-height: 600px;
}

/* ─── Card shell ─────────────────────────── */
.lt-map-card,
.lt-panel-card,
.lt-analytics-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}

.lt-panel-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 600px;
}

.lt-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
  background: #f8fafc;
  gap: 12px;
  flex-wrap: wrap;
}

.lt-card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
}

.lt-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 800;
  background: #dbeafe;
  color: #1e40af;
  border: 1px solid #bfdbfe;
}

/* ─── Map ────────────────────────────────── */
.lt-map-controls {
  display: flex;
  gap: 6px;
}

.lt-icon-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--card);
  cursor: pointer;
  color: var(--muted);
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all .15s;
}
.lt-icon-btn:hover { background: var(--bg); color: var(--text); }

.lt-map-canvas {
  position: relative;
  min-height: 500px;
}

.lt-map-canvas :deep(.leaflet-container) {
  width: 100% !important;
  height: 100% !important;
  min-height: 500px;
}

/* ─── Legend ─────────────────────────────── */
.lt-legend {
  position: absolute;
  left: 12px;
  bottom: 12px;
  background: rgba(255,255,255,.92);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 7px;
  z-index: 500;
  backdrop-filter: blur(8px);
  box-shadow: 0 2px 8px rgba(0,0,0,.07);
}

.lt-legend-item {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 11px;
  font-weight: 600;
  color: var(--muted);
}

.lt-legend-sep {
  height: 1px;
  background: var(--border);
}

.lt-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.lt-dot--green { background: var(--green); }
.lt-dot--amber { background: var(--amber); }
.lt-dot--red   { background: var(--red); }
.lt-dot--blue  { background: var(--blue); }
.lt-dot--range { background: rgba(59,130,246,.25); border: 1px solid rgba(59,130,246,.6); }

/* ─── Panel switch ───────────────────────── */
.lt-panel-switch {
  display: flex;
  gap: 4px;
}

.lt-switch-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 28px;
  padding: 0 10px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--card);
  font-size: 12px;
  font-weight: 700;
  color: var(--muted);
  cursor: pointer;
  transition: all .15s;
}

.lt-switch-btn:hover { color: var(--text); border-color: #94a3b8; }

.lt-switch-btn--active {
  background: var(--text);
  border-color: var(--text);
  color: #fff;
}

/* ─── Panel tools ────────────────────────── */
.lt-panel-tools {
  padding: 12px;
  border-bottom: 1px solid var(--border);
}

.lt-search {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 34px;
  padding: 0 10px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg);
  transition: all .15s;
}

.lt-search:focus-within {
  border-color: var(--blue);
  box-shadow: 0 0 0 3px rgba(59,130,246,.1);
  background: var(--card);
}

.lt-search-icon { font-size: 12px; color: var(--muted); flex-shrink: 0; }

.lt-search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 13px;
  color: var(--text);
}

.lt-search-input::placeholder { color: var(--muted); }

.lt-search-clear {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--muted);
  padding: 0;
  font-size: 11px;
  transition: color .15s;
}
.lt-search-clear:hover { color: var(--text); }

.lt-filters {
  display: flex;
  gap: 6px;
  margin-top: 10px;
  flex-wrap: wrap;
}

.lt-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--card);
  font-size: 11px;
  font-weight: 700;
  color: var(--muted);
  cursor: pointer;
  transition: all .15s;
}

.lt-pill:hover { color: var(--text); border-color: #94a3b8; }

.lt-pill--active {
  background: var(--text);
  border-color: var(--text);
  color: #fff;
}

.lt-pill-count {
  font-size: 10px;
  background: rgba(255,255,255,.2);
  border-radius: 999px;
  padding: 0 5px;
}

.lt-pill:not(.lt-pill--active) .lt-pill-count {
  background: var(--bg);
  color: var(--muted);
}

.lt-term-hint {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 11px;
  font-weight: 600;
  color: var(--muted);
}

/* ─── Lists ──────────────────────────────── */
.lt-list {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow-y: auto;
  flex: 1;
}

/* Bus item */
.lt-bus-item {
  width: 100%;
  text-align: left;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: rgba(255,255,255,.5);
  padding: 11px 12px;
  cursor: pointer;
  transition: all .12s;
}

.lt-bus-item:hover { background: rgba(59,130,246,.04); border-color: #cbd5e1; }
.lt-bus-item--active { background: #dbeafe; border-color: var(--blue); }

.lt-bus-item-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.lt-bus-code { font-size: 13px; font-weight: 800; color: var(--text); }

.lt-bus-meta {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
  font-size: 11px;
  font-weight: 600;
  color: var(--muted);
  margin-top: 3px;
}

.lt-pax { display: inline-flex; align-items: center; gap: 4px; color: var(--text); font-weight: 700; }
.lt-pax i { color: var(--muted); font-size: 10px; }

.lt-bus-item-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 5px;
  flex-shrink: 0;
}

.lt-speed { display: flex; align-items: baseline; gap: 3px; }
.lt-speed-num  { font-size: 15px; font-weight: 900; }
.lt-speed-unit { font-size: 10px; color: var(--muted); font-weight: 600; }

.lt-status-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;
}

.lt-status-chip--green { background: rgba(16,185,129,.1);  color: #065f46; }
.lt-status-chip--amber { background: rgba(245,158,11,.1);  color: #78350f; }
.lt-status-chip--red   { background: rgba(239,68,68,.08);  color: #991b1b; }

.lt-bus-item-bottom {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  font-size: 10px;
  font-weight: 600;
  color: var(--muted);
}

.lt-meta-item { display: inline-flex; align-items: center; gap: 4px; }
.lt-sep { color: #cbd5e1; }
.lt-mono { font-family: monospace; }

/* Terminal item */
.lt-term-item {
  width: 100%;
  text-align: left;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: rgba(255,255,255,.5);
  padding: 11px 12px;
  cursor: pointer;
  transition: all .12s;
}

.lt-term-item:hover { background: rgba(59,130,246,.04); border-color: #cbd5e1; }
.lt-term-item--active { background: rgba(59,130,246,.08); border-color: var(--blue); }

.lt-term-item-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.lt-term-left {
  display: flex;
  align-items: flex-start;
  gap: 9px;
}

.lt-term-icon-wrap {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(59,130,246,.08);
  color: var(--blue);
  display: grid;
  place-items: center;
  font-size: 13px;
  flex-shrink: 0;
}

.lt-term-name-row {
  display: flex;
  align-items: center;
  gap: 7px;
  flex-wrap: wrap;
}

.lt-term-name { font-size: 13px; font-weight: 800; }

.lt-term-id-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 999px;
  background: #f1f5f9;
  border: 1px solid var(--border);
  color: var(--muted);
}

.lt-term-city {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 600;
  color: var(--muted);
  margin-top: 3px;
}

.lt-term-bus-count {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 9px;
  border-radius: 999px;
  background: rgba(59,130,246,.08);
  border: 1px solid rgba(59,130,246,.2);
  color: #1e40af;
  font-size: 11px;
  font-weight: 800;
  flex-shrink: 0;
}

.lt-term-item-bottom {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 8px;
  font-size: 10px;
  font-weight: 600;
  color: var(--muted);
}

/* ─── Empty ──────────────────────────────── */
.lt-empty {
  padding: 36px 20px;
  text-align: center;
  color: var(--muted);
}

.lt-empty i { font-size: 24px; display: block; margin-bottom: 10px; }
.lt-empty p { font-weight: 700; margin: 0 0 4px; color: var(--text); font-size: 13px; }
.lt-empty small { font-size: 11px; }

/* ─── Analytics ──────────────────────────── */
.lt-analytics-card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }

.lt-analytics-empty {
  padding: 80px 40px;
  text-align: center;
  color: var(--muted);
}

.lt-analytics-empty i { font-size: 36px; display: block; margin-bottom: 14px; opacity: .4; }
.lt-analytics-empty p { font-weight: 800; color: var(--text); margin: 0 0 6px; }
.lt-analytics-empty small { font-size: 13px; }

/* ─── Floating panel ─────────────────────── */
.lt-float {
  position: fixed;
  bottom: 20px;
  right: 24px;
  background: rgba(255,255,255,.96);
  border: 1px solid var(--border);
  border-radius: 14px;
  box-shadow: 0 8px 32px rgba(0,0,0,.12);
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  backdrop-filter: blur(12px);
  z-index: 1000;
  max-width: 600px;
}

.lt-float--terminal { border-color: rgba(59,130,246,.3); }

.lt-float-left { flex: 1; min-width: 0; }

.lt-float-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 800;
  flex-wrap: wrap;
}

.lt-float-sub {
  margin-top: 5px;
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.lt-float-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

/* ─── Float transition ───────────────────── */
.lt-float-enter-active,
.lt-float-leave-active { transition: all .2s ease; }

.lt-float-enter-from,
.lt-float-leave-to { opacity: 0; transform: translateY(10px) scale(.97); }

/* ─── Responsive ─────────────────────────── */
@media (max-width: 1100px) {
  .lt-grid { grid-template-columns: 1fr; }
  .lt-panel-card { min-height: 400px; }
}

@media (max-width: 768px) {
  .lt { padding: 14px; gap: 14px; }
  .lt-summary { gap: 8px; }
  .lt-stat { padding: 12px 14px; }
  .lt-stat-value { font-size: 22px; }
  .lt-float { position: relative; bottom: auto; right: auto; margin-top: 8px; flex-direction: column; align-items: flex-start; }
}

@media (max-width: 520px) {
  .lt-summary { grid-template-columns: 1fr 1fr; display: grid; }
}
</style>

<!-- ── Global: Leaflet marker styles ── -->
<style>
/* Bus marker */
.lt-map-bus {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid #10b981;
  background: rgba(255,255,255,.96);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 14px rgba(0,0,0,.12);
  cursor: pointer;
  transition: transform .12s ease, box-shadow .12s ease;
  font-size: 15px;
  color: #10b981;
}

.lt-map-bus.amber { border-color: #f59e0b; color: #f59e0b; }
.lt-map-bus.red   { border-color: #ef4444; color: #ef4444; }

.lt-map-bus.sel {
  transform: scale(1.18);
  box-shadow: 0 8px 24px rgba(0,0,0,.18);
}

/* Terminal marker */
.lt-map-term {
  width: 34px;
  height: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  background: transparent;
  border: none;
  cursor: pointer;
  position: relative;
}

.lt-map-term::before {
  content: "";
  width: 30px;
  height: 30px;
  border-radius: 8px 8px 0 0;
  background: rgba(255,255,255,.98);
  border: 2px solid #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 14px rgba(0,0,0,.12);
}

.lt-map-term i {
  position: absolute;
  top: 7px;
  font-size: 13px;
  color: #3b82f6;
}

.lt-map-term::after {
  content: "";
  width: 0;
  height: 0;
  border-left: 7px solid transparent;
  border-right: 7px solid transparent;
  border-top: 8px solid #3b82f6;
  margin-top: -2px;
}

.lt-map-term.sel::before { border-color: #10b981; }
.lt-map-term.sel i       { color: #10b981; }
.lt-map-term.sel::after  { border-top-color: #10b981; }

/* My location */
.lt-map-me {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #3b82f6;
  border: 3px solid #fff;
  box-shadow: 0 2px 8px rgba(59,130,246,.4);
}
</style>