<!-- src/pages/commuters/TrackBusPage.vue -->
<template>
  <div class="tb-page">
    <!-- Map -->
    <div class="tb-map-wrap">
      <div class="tb-map" ref="mapEl"></div>

      <!-- Quick actions -->
      <div class="tb-fab-stack">
        <button class="tb-fab" type="button" @click="centerOnUser" aria-label="Center on me">
          <i class="fas fa-crosshairs"></i>
        </button>
        <button class="tb-fab" type="button" @click="openSheetMid" aria-label="Open list">
          <i class="fas fa-list"></i>
        </button>
      </div>

      <!-- Selected bus card -->
      <Transition name="slide-up">
        <div v-if="selectedBus" class="tb-bus-card" aria-hidden="false">
          <div class="tb-card-header">
            <div class="tb-card-icon-wrap">
              <i class="fas fa-bus"></i>
            </div>

            <div class="tb-card-header-body">
              <div class="tb-card-title">{{ selectedBus.route }}</div>
              <div class="tb-card-subtitle">Track #{{ selectedBus.trackNo }}</div>

              <div class="tb-card-live-line" :class="liveClass(selectedBus)">
                <span class="tb-card-live-dot"></span>
                {{ liveLabel(selectedBus) }}
              </div>
            </div>

            <span class="tb-status-badge" :class="isAtTerminal(selectedBus) ? 'at' : 'en'">
              <i class="fas" :class="isAtTerminal(selectedBus) ? 'fa-building' : 'fa-route'"></i>
              {{ isAtTerminal(selectedBus) ? "At terminal" : "En route" }}
            </span>

            <button class="tb-card-close" @click="closeSelected" aria-label="Close">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <!-- Stats row -->
          <div class="tb-card-stats">
            <div class="tb-card-stat">
              <div class="tb-card-stat-label">Distance</div>
              <div class="tb-card-stat-value">
                {{ hasUserLocation ? formatKm(distanceKm(selectedBus)) : "—" }}
              </div>
            </div>

            <div class="tb-card-stat-divider"></div>

            <div class="tb-card-stat">
              <div class="tb-card-stat-label">ETA</div>
              <div class="tb-card-stat-value">
                {{ hasUserLocation ? formatEta(etaMinutes(selectedBus)) : "—" }}
              </div>
            </div>

            <div class="tb-card-stat-divider"></div>

            <div class="tb-card-stat">
              <div class="tb-card-stat-label">Speed</div>
              <div class="tb-card-stat-value">
                {{ selectedBus.speedKmh ?? "—" }}
                <span class="tb-card-stat-unit">km/h</span>
              </div>
            </div>

            <div class="tb-card-stat-divider"></div>

            <div class="tb-card-stat">
              <div class="tb-card-stat-label">Seats</div>
              <div class="tb-card-stat-value" :class="occClass(selectedBus)">
                {{ seatsLabel(selectedBus) }}
              </div>
            </div>
          </div>

          <!-- Route info -->
          <div class="tb-card-route-row">
            <i class="fas fa-map-signs tb-card-route-icon"></i>
            <span class="tb-card-route-text">{{ terminalLabel(selectedBus) }}</span>

            <span
              v-if="selectedBus.directionLabel && isAtTerminal(selectedBus)"
              class="tb-card-dir-chip"
            >
              {{ selectedBus.directionLabel }}
            </span>
          </div>

          <!-- Actions -->
          <div class="tb-card-actions">
            <button class="tb-card-btn tb-card-btn-primary" @click="focusBus(selectedBus)" type="button">
              <i class="fas fa-location-arrow"></i>
              Focus
            </button>

            <button class="tb-card-btn" @click="centerOnUser" type="button">
              <i class="fas fa-user"></i>
              My Location
            </button>

            <button class="tb-card-btn" @click="openSheetMid" type="button">
              <i class="fas fa-list"></i>
              List
            </button>
          </div>
        </div>
      </Transition>

      <!-- Selected terminal card -->
      <Transition name="slide-up">
        <div v-if="selectedTerminal" class="tb-term-card" aria-hidden="false">
          <div class="tb-card-header">
            <div class="tb-card-icon-wrap tb-card-icon-wrap--term">
              <i class="fas fa-building"></i>
            </div>

            <div class="tb-card-header-body">
              <div class="tb-card-title">
                {{ selectedTerminal.terminal_name || "Terminal" }}
              </div>

              <div class="tb-card-subtitle">
                <i class="fas fa-location-dot"></i>
                {{ selectedTerminal.city || "—" }}
              </div>
            </div>

            <button class="tb-card-close" @click="closeTerminal" aria-label="Close terminal">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div class="tb-card-stats">
            <div class="tb-card-stat">
              <div class="tb-card-stat-label">Buses inside</div>
              <div class="tb-card-stat-value">
                {{ busesInsideCount(selectedTerminal.terminal_id) }}
              </div>
            </div>

            <div class="tb-card-stat-divider"></div>

            <div class="tb-card-stat tb-card-stat--wide">
              <div class="tb-card-stat-label">Bus list</div>

              <div class="tb-card-stat-value tb-card-stat-value--small">
                <span
                  v-if="busesInsideList(selectedTerminal.terminal_id).length === 0"
                  class="tb-card-empty-tag"
                >
                  None
                </span>

                <template v-else>
                  <span
                    v-for="code in busesInsideList(selectedTerminal.terminal_id)"
                    :key="code"
                    class="tb-card-bus-tag"
                  >
                    {{ code }}
                  </span>
                </template>
              </div>
            </div>
          </div>

          <div class="tb-card-actions">
            <button class="tb-card-btn tb-card-btn-primary" type="button" @click="focusTerminal(selectedTerminal)">
              <i class="fas fa-location-arrow"></i>
              Focus
            </button>

            <button class="tb-card-btn" type="button" @click="openSheetMid">
              <i class="fas fa-list"></i>
              All buses
            </button>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Bottom sheet -->
    <div class="tb-sheet" ref="sheetEl" :class="{ dragging: isDragging }" :style="sheetStyle">
      <div class="tb-sheet-handle" ref="sheetHandleEl" @pointerdown="onSheetPointerDown">
        <div class="tb-sheet-pill-wrap">
          <div class="tb-sheet-pill"></div>
        </div>

        <div class="tb-sheet-header">
          <div class="tb-sheet-header-left">
            <span class="tb-sheet-title">Buses</span>

            <span class="tb-live-badge">
              <span class="tb-live-dot"></span>
              Live / Last GPS
            </span>
          </div>

          <span class="tb-sheet-count-badge">{{ filteredBuses.length }}</span>
        </div>

        <div class="tb-search-wrap" @pointerdown.stop>
          <i class="fas fa-magnifying-glass tb-search-icon"></i>

          <input
            v-model="query"
            class="tb-search-input"
            type="text"
            placeholder="Search bus code, plate, or route…"
          />

          <button
            v-if="query"
            class="tb-search-clear"
            @click.stop="query = ''"
            aria-label="Clear"
            type="button"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="tb-filter-row" @pointerdown.stop>
          <button class="tb-chip" :class="{ active: filter === 'nearby' }" @click="filter = 'nearby'">
            <i class="fas fa-location-crosshairs"></i>
            Nearby
          </button>

          <button class="tb-chip" :class="{ active: filter === 'all' }" @click="filter = 'all'">
            All buses
          </button>

          <button class="tb-chip" :class="{ active: filter === 'at-terminal' }" @click="filter = 'at-terminal'">
            <i class="fas fa-building"></i>
            Terminal
          </button>

          <button class="tb-chip" :class="{ active: filter === 'en-route' }" @click="filter = 'en-route'">
            <i class="fas fa-route"></i>
            En route
          </button>
        </div>
      </div>

      <div class="tb-sheet-content" ref="sheetContentEl">
        <div class="tb-sheet-list">
          <!-- At terminal -->
          <template v-if="filter === 'at-terminal'">
            <div v-for="group in terminalGroups" :key="group.terminalId" class="tb-group-block">
              <div class="tb-section-label" @click="selectTerminalById(group.terminalId)">
                <div class="tb-section-label-left">
                  <i class="fas fa-building tb-section-label-icon"></i>

                  <div>
                    <span class="tb-section-label-name">{{ group.terminalName }}</span>
                    <span class="tb-section-label-city" v-if="group.city"> · {{ group.city }}</span>
                  </div>
                </div>

                <span class="tb-section-count" :class="group.buses.length > 0 ? 'has-buses' : ''">
                  {{ group.buses.length }}
                </span>
              </div>

              <div v-if="group.buses.length > 0" class="tb-group-rows">
                <div
                  v-for="bus in group.buses"
                  :key="bus.id"
                  class="tb-bus-row"
                  :class="{ selected: selectedBus?.id === bus.id }"
                  @click="selectBus(bus)"
                >
                  <div class="tb-occ-dot" :class="occClass(bus)"></div>

                  <div class="tb-row-body">
                    <div class="tb-row-top">
                      <p class="tb-row-title">{{ bus.route }}</p>
                      <span class="tb-trk-label">#{{ bus.trackNo }}</span>
                    </div>

                    <div class="tb-row-meta">
                      <span class="tb-meta-item tb-live-row" :class="liveClass(bus)">
                        <span class="tb-row-live-dot"></span>
                        {{ liveLabel(bus) }}
                      </span>

                      <span class="tb-dot-sep">·</span>

                      <span class="tb-meta-item" v-if="hasUserLocation">
                        <i class="fas fa-location-dot"></i>
                        {{ formatKm(distanceKm(bus)) }}
                      </span>

                      <span class="tb-dot-sep" v-if="hasUserLocation">·</span>

                      <span class="tb-meta-item" v-if="hasUserLocation">
                        <i class="fas fa-clock"></i>
                        {{ formatEta(etaMinutes(bus)) }}
                      </span>

                      <template v-if="bus.directionLabel">
                        <span class="tb-dot-sep">·</span>
                        <span class="tb-meta-item tb-meta-muted">{{ bus.directionLabel }}</span>
                      </template>
                    </div>
                  </div>

                  <i class="fas fa-chevron-right tb-row-chevron"></i>
                </div>
              </div>

              <div v-else class="tb-group-empty">No buses at this terminal</div>
            </div>
          </template>

          <!-- En route -->
          <template v-else-if="filter === 'en-route'">
            <div v-for="group in routeGroups" :key="group.routeKey" class="tb-group-block">
              <div class="tb-section-label tb-section-label--route">
                <div class="tb-section-label-left">
                  <i class="fas fa-route tb-section-label-icon tb-section-label-icon--route"></i>
                  <span class="tb-section-label-name">{{ group.routeKey }}</span>
                </div>

                <span class="tb-section-count" :class="group.buses.length > 0 ? 'has-buses' : ''">
                  {{ group.buses.length }}
                </span>
              </div>

              <div v-if="group.buses.length > 0" class="tb-group-rows">
                <div
                  v-for="bus in group.buses"
                  :key="bus.id"
                  class="tb-bus-row"
                  :class="{ selected: selectedBus?.id === bus.id }"
                  @click="selectBus(bus)"
                >
                  <div class="tb-occ-dot" :class="occClass(bus)"></div>

                  <div class="tb-row-body">
                    <div class="tb-row-top">
                      <p class="tb-row-title">{{ bus.route }}</p>
                      <span class="tb-trk-label">#{{ bus.trackNo }}</span>
                    </div>

                    <div class="tb-row-meta">
                      <span class="tb-meta-item tb-live-row" :class="liveClass(bus)">
                        <span class="tb-row-live-dot"></span>
                        {{ liveLabel(bus) }}
                      </span>

                      <span class="tb-dot-sep">·</span>

                      <span class="tb-meta-item" v-if="hasUserLocation">
                        <i class="fas fa-location-dot"></i>
                        {{ formatKm(distanceKm(bus)) }}
                      </span>

                      <span class="tb-dot-sep" v-if="hasUserLocation">·</span>

                      <span class="tb-meta-item" v-if="hasUserLocation">
                        <i class="fas fa-clock"></i>
                        {{ formatEta(etaMinutes(bus)) }}
                      </span>

                      <span class="tb-dot-sep">·</span>

                      <span class="tb-meta-item tb-meta-muted">
                        {{ bus.speedKmh ?? "—" }} km/h
                      </span>
                    </div>
                  </div>

                  <i class="fas fa-chevron-right tb-row-chevron"></i>
                </div>
              </div>

              <div v-else class="tb-group-empty">No buses on this route</div>
            </div>
          </template>

          <!-- Nearby / All -->
          <template v-else>
            <TransitionGroup name="list" tag="div" class="tb-list-wrap">
              <div
                v-for="bus in filteredBuses"
                :key="bus.id"
                class="tb-bus-row"
                :class="{ selected: selectedBus?.id === bus.id }"
                @click="selectBus(bus)"
              >
                <div class="tb-occ-dot" :class="occClass(bus)"></div>

                <div class="tb-row-body">
                  <div class="tb-row-top">
                    <p class="tb-row-title">{{ bus.route }}</p>

                    <span class="tb-status-pill" :class="isAtTerminal(bus) ? 'at' : 'en'">
                      <i class="fas" :class="isAtTerminal(bus) ? 'fa-building' : 'fa-route'"></i>
                      {{ isAtTerminal(bus) ? "At terminal" : "En route" }}
                    </span>
                  </div>

                  <div class="tb-row-meta">
                    <span class="tb-meta-item tb-live-row" :class="liveClass(bus)">
                      <span class="tb-row-live-dot"></span>
                      {{ liveLabel(bus) }}
                    </span>

                    <span class="tb-dot-sep">·</span>

                    <span class="tb-meta-item" v-if="hasUserLocation">
                      <i class="fas fa-location-dot"></i>
                      {{ formatKm(distanceKm(bus)) }}
                    </span>

                    <span class="tb-dot-sep" v-if="hasUserLocation">·</span>

                    <span class="tb-meta-item" v-if="hasUserLocation">
                      <i class="fas fa-clock"></i>
                      {{ formatEta(etaMinutes(bus)) }}
                    </span>

                    <span class="tb-dot-sep">·</span>

                    <span class="tb-meta-item tb-meta-muted">
                      {{ terminalLabel(bus) }}
                    </span>

                    <template v-if="bus.directionLabel && isAtTerminal(bus)">
                      <span class="tb-dot-sep">·</span>
                      <span class="tb-meta-item tb-meta-muted">{{ bus.directionLabel }}</span>
                    </template>
                  </div>
                </div>

                <i class="fas fa-chevron-right tb-row-chevron"></i>
              </div>
            </TransitionGroup>

            <div v-if="filteredBuses.length === 0" class="tb-empty">
              <div class="tb-empty-icon"><i class="fas fa-bus"></i></div>
              <p class="tb-empty-title">No buses found</p>

              <p class="tb-empty-sub" v-if="filter === 'nearby' && !hasUserLocation">
                Turn on location to see nearby buses.
              </p>

              <p class="tb-empty-sub" v-else-if="filter === 'nearby'">
                No buses within {{ NEARBY_KM }} km.
              </p>

              <p class="tb-empty-sub" v-else>
                Try a different filter or search term.
              </p>

              <div class="tb-empty-actions">
                <button v-if="query" class="tb-mini-btn" @click="query = ''" type="button">
                  Clear search
                </button>

                <button class="tb-mini-btn" @click="filter = 'all'" type="button">
                  Show all
                </button>
              </div>
            </div>
          </template>
        </div>
      </div>

      <div class="tb-sheet-footer">
        <span class="tb-footer-dot"></span>

        <span class="tb-footer-text" v-if="hasUserLocation">
          Sorted by nearest · live or last known GPS shown
        </span>

        <span class="tb-footer-text" v-else>
          Turn on location for distance &amp; ETA
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import L from "leaflet";

import { useLiveBuses } from "../../composables/useLiveBuses";
import { useUserLocation } from "@/composables/useUserLocation";
import { useTerminals } from "@/composables/useTerminal";

/* ========= Router ========= */
const route = useRoute();
const router = useRouter();

/* ========= Constants ========= */
const FALLBACK_VIEW = { lat: 12.8797, lng: 121.774 };
const NEARBY_KM = 1;
const AVG_SPEED_KMH = 18;
const BASE_DELAY_MIN = 1.5;

/* ========= Refs ========= */
const mapEl = ref(null);
const sheetEl = ref(null);
const sheetHandleEl = ref(null);
const sheetContentEl = ref(null);

const selectedBus = ref(null);
const selectedTerminal = ref(null);

const query = ref("");
const filter = ref("nearby");

/* ========= Live buses ========= */
const {
  buses,
  start: startLive,
  stop: stopLive,
  fetchOnce,
} = useLiveBuses({ intervalMs: 1000 });

/* ========= Location ========= */
const { coords, hasLocation } = useUserLocation();

const hasUserLocation = computed(() => !!hasLocation.value && !!coords.value);

const currentPos = computed(() => {
  if (!coords.value) return null;

  return {
    lat: Number(coords.value.lat),
    lng: Number(coords.value.lng),
  };
});

/* ========= Terminals ========= */
const { rows: terminalsRows, fetchTerminals } = useTerminals();
const terminals = computed(() => terminalsRows.value || []);

let terminalPoll = null;

const terminalById = computed(() => {
  const m = new Map();

  for (const t of terminals.value) {
    m.set(Number(t.terminal_id), t);
  }

  return m;
});

function findTerminalById(id) {
  const tid = Number(id);

  if (!Number.isFinite(tid)) return null;

  return terminals.value.find((t) => Number(t.terminal_id) === tid) || null;
}

async function maybeFocusTerminalFromQuery() {
  const tid = route.query?.terminalId;

  if (!tid) return;

  const t = findTerminalById(tid);

  if (!t) return;

  selectTerminal(t);

  const q = { ...route.query };
  delete q.terminalId;

  router.replace({ query: q });
}

async function maybeFocusBusFromQuery() {
  const busId = route.query?.busId || route.query?.bus_id || route.query?.id;

  if (!busId) return;

  const target = buses.value.find((b) => {
    return (
      String(b.id) === String(busId) ||
      String(b.bus_id) === String(busId) ||
      String(b.bus_code) === String(busId)
    );
  });

  if (!target) return;

  selectBus(target);

  const q = { ...route.query };
  delete q.busId;
  delete q.bus_id;
  delete q.id;

  router.replace({ query: q });
}

async function loadTerminalsOnce() {
  await fetchTerminals({ q: "" });
  await nextTick();

  syncTerminalMarkers();

  await nextTick();
  await maybeFocusTerminalFromQuery();
}

/* ========= Leaflet ========= */
let map = null;
let userMarker = null;

const busMarkers = new Map();
const terminalMarkers = new Map();

function initLeaflet() {
  if (!mapEl.value || map) return;

  map = L.map(mapEl.value, {
    zoomControl: false,
    attributionControl: false,
    tap: true,
  }).setView([FALLBACK_VIEW.lat, FALLBACK_VIEW.lng], 6);

  L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
    maxZoom: 20,
  }).addTo(map);

  map.on("click", (e) => {
    if (e?.originalEvent?.target?.closest?.(".tb-leaflet-bus-pill")) return;
    if (e?.originalEvent?.target?.closest?.(".tb-leaflet-term-pill")) return;

    selectedBus.value = null;
    selectedTerminal.value = null;

    refreshAllBusMarkerIcons();
    collapseSheet();
  });

  requestAnimationFrame(() => map?.invalidateSize());
  setTimeout(() => map?.invalidateSize(), 350);
}

/* ========= User marker ========= */
function makeUserDivIcon() {
  return L.divIcon({
    className: "tb-leaflet-user-icon",
    html: `
      <div class="tb-leaflet-user-dot">
        <div class="tb-leaflet-user-core"></div>
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

function ensureUserMarker() {
  if (!map || !hasUserLocation.value || !currentPos.value) return;
  if (userMarker) return;

  userMarker = L.marker([currentPos.value.lat, currentPos.value.lng], {
    icon: makeUserDivIcon(),
    interactive: false,
  }).addTo(map);
}

function updateUserMarker() {
  if (!map || !userMarker || !currentPos.value) return;

  userMarker.setLatLng([currentPos.value.lat, currentPos.value.lng]);
}

function removeUserMarker() {
  if (!map || !userMarker) return;

  map.removeLayer(userMarker);
  userMarker = null;
}

/* ========= Terminal markers ========= */
function makeTerminalDivIcon() {
  return L.divIcon({
    className: "tb-leaflet-term-icon",
    html: `
      <div class="tb-leaflet-term-pill" aria-label="terminal">
        <i class="fas fa-building"></i>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 30],
  });
}

function addOrUpdateTerminalMarker(t) {
  if (!map) return;

  const lat = Number(t.lat);
  const lng = Number(t.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

  const id = Number(t.terminal_id);
  const pos = [lat, lng];
  const existing = terminalMarkers.get(id);

  if (existing) {
    existing.setLatLng(pos);
    return;
  }

  const m = L.marker(pos, {
    icon: makeTerminalDivIcon(),
  }).addTo(map);

  m.on("click", () => selectTerminal(t));

  terminalMarkers.set(id, m);
}

function removeTerminalMarker(id) {
  const m = terminalMarkers.get(id);

  if (m && map) {
    map.removeLayer(m);
  }

  terminalMarkers.delete(id);
}

function syncTerminalMarkers() {
  if (!map) return;

  const list = terminals.value || [];
  const nextIds = new Set(list.map((t) => Number(t.terminal_id)));

  for (const id of terminalMarkers.keys()) {
    if (!nextIds.has(id)) {
      removeTerminalMarker(id);
    }
  }

  list.forEach(addOrUpdateTerminalMarker);
}

/* ========= Bus helpers ========= */
function occClass(bus) {
  const cap = Number(bus?.capacity ?? 0);
  const used = Number(bus?.seats ?? bus?.passenger_count ?? 0);

  if (!cap || cap < 1) return "low";

  const r = Math.max(0, Math.min(1, used / cap));

  if (r >= 0.85) return "full";
  if (r >= 0.55) return "mid";

  return "low";
}

function liveClass(bus) {
  return bus?.isLiveLocation ? "live" : "last";
}

function liveLabel(bus) {
  if (bus?.locationLabel) return bus.locationLabel;
  if (bus?.isLiveLocation) return "Live now";

  return "Last location";
}

function hasBusCoords(bus) {
  const lat = Number(bus?.lat);
  const lng = Number(bus?.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat === 0 && lng === 0) return false;

  return lat >= 4 && lat <= 22 && lng >= 116 && lng <= 127;
}

/* ========= Bus markers ========= */
function makeBusDivIcon(bus, isSelected = false) {
  const cls = occClass(bus);
  const sel = isSelected ? "selected" : "";
  const term = isAtTerminal(bus) ? "at-term" : "en-route";
  const loc = bus?.isLiveLocation ? "live" : "last-location";
  const flag = bus?.isLiveLocation ? "LIVE" : "LAST";

  return L.divIcon({
    className: "tb-leaflet-bus-icon",
    html: `
      <div class="tb-leaflet-bus-pill ${cls} ${sel} ${term} ${loc}">
        <i class="fas fa-bus"></i>
        <span class="tb-mini-flag">${flag}</span>
      </div>
    `,
    iconSize: [46, 38],
    iconAnchor: [23, 19],
  });
}

function addOrUpdateBusMarker(bus) {
  if (!map) return;

  if (!hasBusCoords(bus)) {
    removeMarker(bus.id);
    return;
  }

  const pos = [Number(bus.lat), Number(bus.lng)];
  const existing = busMarkers.get(bus.id);

  if (existing) {
    existing.setLatLng(pos);
    existing.setIcon(makeBusDivIcon(bus, selectedBus.value?.id === bus.id));
    return;
  }

  const m = L.marker(pos, {
    icon: makeBusDivIcon(bus, selectedBus.value?.id === bus.id),
  }).addTo(map);

  m.on("click", () => selectBus(bus));

  busMarkers.set(bus.id, m);
}

function removeMarker(id) {
  const m = busMarkers.get(id);

  if (m && map) {
    map.removeLayer(m);
  }

  busMarkers.delete(id);
}

function refreshAllBusMarkerIcons() {
  for (const b of buses.value) {
    const m = busMarkers.get(b.id);

    if (!m) continue;

    m.setIcon(makeBusDivIcon(b, selectedBus.value?.id === b.id));
  }
}

/* ========= Focus helpers ========= */
function focusBus(bus) {
  if (!map) return;

  if (!hasBusCoords(bus)) {
    alert("This bus has no saved GPS location yet.");
    return;
  }

  map.flyTo([Number(bus.lat), Number(bus.lng)], Math.max(map.getZoom(), 16), {
    duration: 0.5,
  });
}

function focusTerminal(t) {
  if (!map) return;

  const lat = Number(t.lat);
  const lng = Number(t.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

  map.flyTo([lat, lng], Math.max(map.getZoom(), 15), {
    duration: 0.5,
  });
}

function centerOnUser() {
  if (!map) return;

  if (!hasUserLocation.value || !currentPos.value) {
    alert("Location is off. Turn on location from the app overlay.");
    return;
  }

  map.flyTo([currentPos.value.lat, currentPos.value.lng], 16, {
    duration: 0.5,
  });
}

/* ========= Selection ========= */
function selectBus(bus) {
  selectedBus.value = bus;
  selectedTerminal.value = null;

  refreshAllBusMarkerIcons();
  collapseSheet();

  if (hasBusCoords(bus)) {
    focusBus(bus);
  }
}

function closeSelected() {
  selectedBus.value = null;

  refreshAllBusMarkerIcons();
  openSheetMid();
}

function selectTerminal(t) {
  selectedTerminal.value = t;
  selectedBus.value = null;

  refreshAllBusMarkerIcons();
  collapseSheet();
  focusTerminal(t);
}

function selectTerminalById(id) {
  const t = findTerminalById(id);

  if (t) {
    selectTerminal(t);
  }
}

function closeTerminal() {
  selectedTerminal.value = null;
  openSheetMid();
}

/* ========= Terminal helpers ========= */
function terminalName(id) {
  const t = terminalById.value.get(Number(id));

  return t?.terminal_name || null;
}

function terminalLabel(bus) {
  if (bus?.terminalStateLabel) return bus.terminalStateLabel;

  const curId =
    bus?.terminal_state?.current_terminal_id ??
    bus?.current_terminal_id ??
    bus?.currentTerminalId ??
    null;

  const tgtId =
    bus?.terminal_state?.target_terminal_id ??
    bus?.target_terminal_id ??
    bus?.targetTerminalId ??
    null;

  const curName =
    bus?.terminal_state?.current_terminal_name ||
    bus?.currentTerminalName ||
    terminalName(curId) ||
    "—";

  const tgtName =
    bus?.terminal_state?.target_terminal_name ||
    bus?.targetTerminalName ||
    terminalName(tgtId) ||
    "—";

  if (isAtTerminal(bus)) {
    return `At ${curName}`;
  }

  return `${curName} → ${tgtName}`;
}

function isAtTerminal(bus) {
  const v =
    bus?.at_terminal ??
    bus?.atTerminal ??
    bus?.terminal_state?.at_terminal ??
    bus?.terminal_state?.atTerminal ??
    bus?.terminal_state?.atTerminalFlag;

  return Number(v) === 1 || v === true;
}

function busCurrentTerminalId(bus) {
  const v =
    bus?.terminal_state?.current_terminal_id ??
    bus?.terminal_state?.currentTerminalId ??
    bus?.current_terminal_id ??
    bus?.currentTerminalId;

  const n = Number(v);

  return Number.isFinite(n) ? n : NaN;
}

function busTargetTerminalId(bus) {
  const v =
    bus?.terminal_state?.target_terminal_id ??
    bus?.terminal_state?.targetTerminalId ??
    bus?.target_terminal_id ??
    bus?.targetTerminalId;

  const n = Number(v);

  return Number.isFinite(n) ? n : NaN;
}

function busesInsideCount(terminalId) {
  const tid = Number(terminalId);

  return buses.value.filter((b) => {
    return isAtTerminal(b) && busCurrentTerminalId(b) === tid;
  }).length;
}

function busesInsideList(terminalId) {
  const tid = Number(terminalId);

  return buses.value
    .filter((b) => isAtTerminal(b) && busCurrentTerminalId(b) === tid)
    .map((b) => b.bus_code || b.trackNo || b.plate_no || `#${b.id}`)
    .slice(0, 8);
}

/* ========= Distance + ETA ========= */
function distanceKm(bus) {
  if (!hasUserLocation.value || !currentPos.value) return Infinity;

  if (!hasBusCoords(bus)) return Infinity;

  const a = currentPos.value;

  const b = {
    lat: Number(bus?.lat),
    lng: Number(bus?.lng),
  };

  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));

  return R * c;
}

function formatKm(n) {
  if (!Number.isFinite(n)) return "—";
  if (n < 1) return `${Math.round(n * 1000)} m`;

  return `${n.toFixed(1)} km`;
}

function etaMinutes(bus) {
  if (!hasUserLocation.value || !currentPos.value) return Infinity;

  const km = distanceKm(bus);

  if (!Number.isFinite(km)) return Infinity;

  const travelMin = (km / AVG_SPEED_KMH) * 60;

  return Math.max(1, Math.round(travelMin + BASE_DELAY_MIN));
}

function formatEta(mins) {
  if (!Number.isFinite(mins)) return "—";
  if (mins <= 1) return "1 min";
  if (mins < 60) return `${mins} mins`;

  const h = Math.floor(mins / 60);
  const m = mins % 60;

  return `${h}h ${m}m`;
}

/* ========= Occupancy label ========= */
function seatsLabel(bus) {
  const cap = Number(bus?.capacity ?? 0);
  const used = Number(bus?.seats ?? bus?.passenger_count ?? 0);

  if (!cap || cap < 1) return "—";

  return `${used}/${cap}`;
}

/* ========= Filtered list ========= */
const filteredBuses = computed(() => {
  const q = query.value.trim().toLowerCase();

  let list = [...buses.value]
    .filter((b) => hasBusCoords(b))
    .map((b) => ({
      ...b,
      _km: distanceKm(b),
    }));

  if (q) {
    list = list.filter((b) => {
      const idStr = String(b.id || "").toLowerCase();
      const codeStr = String(b.bus_code || b.trackNo || "").toLowerCase();
      const plateStr = String(b.plate_no || "").toLowerCase();
      const routeStr = String(b.route || "").toLowerCase();
      const termStr = String(terminalLabel(b) || "").toLowerCase();
      const dirStr = String(b.directionLabel || "").toLowerCase();
      const liveStr = String(liveLabel(b) || "").toLowerCase();

      return (
        idStr.includes(q) ||
        codeStr.includes(q) ||
        plateStr.includes(q) ||
        routeStr.includes(q) ||
        termStr.includes(q) ||
        dirStr.includes(q) ||
        liveStr.includes(q)
      );
    });
  }

  if (filter.value === "nearby") {
    if (!hasUserLocation.value || !currentPos.value) return [];

    list = list.filter((b) => Number.isFinite(b._km) && b._km <= NEARBY_KM);
  } else if (filter.value === "at-terminal") {
    list = list.filter((b) => isAtTerminal(b));
  } else if (filter.value === "en-route") {
    list = list.filter((b) => !isAtTerminal(b));
  }

  if (hasUserLocation.value) {
    list.sort((a, b) => a._km - b._km);
  } else {
    list.sort((a, b) =>
      String(a.bus_code || "").localeCompare(String(b.bus_code || ""))
    );
  }

  return list;
});

/* ========= Terminal grouped view ========= */
const terminalGroups = computed(() => {
  const q = query.value.trim().toLowerCase();

  let groups = terminals.value.map((t) => ({
    terminalId: Number(t.terminal_id),
    terminalName: t.terminal_name || `Terminal ${t.terminal_id}`,
    city: t.city || "",
    buses: [],
  }));

  const atBuses = buses.value.filter((b) => isAtTerminal(b) && hasBusCoords(b));

  for (const bus of atBuses) {
    const tid = busCurrentTerminalId(bus);

    const group = groups.find((g) => Number(g.terminalId) === Number(tid));

    if (group) {
      group.buses.push({
        ...bus,
        _km: distanceKm(bus),
      });
    }
  }

  if (q) {
    groups = groups.map((g) => {
      const groupMatches =
        g.terminalName.toLowerCase().includes(q) ||
        g.city.toLowerCase().includes(q);

      return {
        ...g,
        buses: groupMatches
          ? g.buses
          : g.buses.filter((b) => {
              const idStr = String(b.id || "").toLowerCase();
              const codeStr = String(b.bus_code || b.trackNo || "").toLowerCase();
              const plateStr = String(b.plate_no || "").toLowerCase();
              const routeStr = String(b.route || "").toLowerCase();
              const dirStr = String(b.directionLabel || "").toLowerCase();
              const liveStr = String(liveLabel(b) || "").toLowerCase();

              return (
                idStr.includes(q) ||
                codeStr.includes(q) ||
                plateStr.includes(q) ||
                routeStr.includes(q) ||
                dirStr.includes(q) ||
                liveStr.includes(q)
              );
            }),
      };
    });
  }

  groups.sort((a, b) => a.terminalName.localeCompare(b.terminalName));

  groups.forEach((g) => {
    if (hasUserLocation.value) {
      g.buses.sort((a, b) => a._km - b._km);
    }
  });

  return groups;
});

const knownRouteDirections = computed(() => {
  const list = [];

  for (const from of terminals.value) {
    for (const to of terminals.value) {
      if (Number(from.terminal_id) === Number(to.terminal_id)) continue;

      list.push({
        routeKey: `${from.terminal_name} → ${to.terminal_name}`,
        fromTerminalId: Number(from.terminal_id),
        targetTerminalId: Number(to.terminal_id),
        buses: [],
      });
    }
  }

  return list;
});

/* ========= En-route grouped view ========= */
const routeGroups = computed(() => {
  const q = query.value.trim().toLowerCase();

  let groups = knownRouteDirections.value.map((r) => ({
    ...r,
    buses: [],
  }));

  const enBuses = buses.value.filter((b) => !isAtTerminal(b) && hasBusCoords(b));

  for (const bus of enBuses) {
    const curId = busCurrentTerminalId(bus);
    const tgtId = busTargetTerminalId(bus);

    let group = groups.find((g) => {
      return Number(g.fromTerminalId) === curId && Number(g.targetTerminalId) === tgtId;
    });

    if (!group) {
      const curName =
        bus?.terminal_state?.current_terminal_name ||
        bus?.currentTerminalName ||
        terminalName(curId) ||
        "—";

      const tgtName =
        bus?.terminal_state?.target_terminal_name ||
        bus?.targetTerminalName ||
        terminalName(tgtId) ||
        "—";

      group = {
        routeKey: `${curName} → ${tgtName}`,
        fromTerminalId: curId,
        targetTerminalId: tgtId,
        buses: [],
      };

      groups.push(group);
    }

    group.buses.push({
      ...bus,
      _km: distanceKm(bus),
    });
  }

  if (q) {
    groups = groups.map((g) => {
      const groupMatches = g.routeKey.toLowerCase().includes(q);

      return {
        ...g,
        buses: groupMatches
          ? g.buses
          : g.buses.filter((b) => {
              const idStr = String(b.id || "").toLowerCase();
              const codeStr = String(b.bus_code || b.trackNo || "").toLowerCase();
              const plateStr = String(b.plate_no || "").toLowerCase();
              const routeStr = String(b.route || "").toLowerCase();
              const dirStr = String(b.directionLabel || "").toLowerCase();
              const liveStr = String(liveLabel(b) || "").toLowerCase();

              return (
                idStr.includes(q) ||
                codeStr.includes(q) ||
                plateStr.includes(q) ||
                routeStr.includes(q) ||
                dirStr.includes(q) ||
                liveStr.includes(q)
              );
            }),
      };
    });
  }

  groups.sort((a, b) => a.routeKey.localeCompare(b.routeKey));

  groups.forEach((g) => {
    if (hasUserLocation.value) {
      g.buses.sort((a, b) => a._km - b._km);
    }
  });

  return groups;
});

/* ========= Bottom Sheet Drag ========= */
const isDragging = ref(false);
const sheetY = ref(0);
const sheetAnimating = ref(true);

let startY = 0;
let startSheetY = 0;
let lastY = 0;
let lastT = 0;
let velocity = 0;
let raf = 0;

function sheetHeightPx() {
  const el = sheetEl.value;

  if (!el) return 0;

  return el.getBoundingClientRect().height;
}

function snapPoints() {
  const h = sheetHeightPx();
  const peek = 170;
  const collapsed = Math.max(0, h - peek);
  const mid = Math.max(0, Math.round(h * 0.45));
  const expanded = 0;

  return {
    expanded,
    mid,
    collapsed,
  };
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

const sheetStyle = computed(() => ({
  transform: `translate3d(0, ${sheetY.value}px, 0)`,
  transition: sheetAnimating.value
    ? "transform 280ms cubic-bezier(0.22, 1, 0.36, 1)"
    : "none",
}));

function setSheetY(px) {
  const { expanded, collapsed } = snapPoints();

  sheetY.value = clamp(px, expanded, collapsed);
}

function nearestSnap(targetY) {
  const { expanded, mid, collapsed } = snapPoints();
  const points = [expanded, mid, collapsed];

  let best = points[0];
  let bestDist = Math.abs(targetY - best);

  for (const p of points) {
    const d = Math.abs(targetY - p);

    if (d < bestDist) {
      best = p;
      bestDist = d;
    }
  }

  return best;
}

function snapTo(y) {
  sheetAnimating.value = true;
  setSheetY(y);

  const { collapsed } = snapPoints();

  if (y >= collapsed - 2 && sheetContentEl.value) {
    sheetContentEl.value.scrollTop = 0;
  }

  requestAnimationFrame(() => map?.invalidateSize());
  setTimeout(() => map?.invalidateSize(), 320);
}

function openSheetMid() {
  snapTo(snapPoints().mid);
}

function collapseSheet() {
  snapTo(snapPoints().collapsed);
}

function onSheetPointerDown(e) {
  if (e.button != null && e.button !== 0) return;

  const content = sheetContentEl.value;
  const handle = sheetHandleEl.value;
  const inHandle = handle && handle.contains(e.target);

  if (!inHandle && content) {
    const atTop = content.scrollTop <= 0;

    if (!atTop) return;
  }

  isDragging.value = true;
  sheetAnimating.value = false;

  startY = e.clientY;
  startSheetY = sheetY.value;
  lastY = e.clientY;
  lastT = performance.now();
  velocity = 0;

  sheetEl.value?.setPointerCapture?.(e.pointerId);

  window.addEventListener("pointermove", onSheetPointerMove, {
    passive: false,
  });

  window.addEventListener("pointerup", onSheetPointerUp, {
    passive: true,
  });

  e.preventDefault();
}

function onSheetPointerMove(e) {
  if (!isDragging.value) return;

  const now = performance.now();
  const dy = e.clientY - startY;
  const next = startSheetY + dy;
  const dt = now - lastT || 1;
  const v = (e.clientY - lastY) / dt;

  velocity = velocity * 0.7 + v * 0.3;
  lastY = e.clientY;
  lastT = now;

  cancelAnimationFrame(raf);

  raf = requestAnimationFrame(() => setSheetY(next));
  requestAnimationFrame(() => map?.invalidateSize());

  e.preventDefault();
}

function onSheetPointerUp() {
  if (!isDragging.value) return;

  isDragging.value = false;
  sheetAnimating.value = true;

  const { expanded, mid, collapsed } = snapPoints();
  const v = velocity;
  const y = sheetY.value;

  const flickDown = v > 0.6;
  const flickUp = v < -0.6;

  let target;

  if (flickUp) {
    target = expanded;
  } else if (flickDown) {
    target = collapsed;
  } else {
    target = nearestSnap(y);
  }

  if (!flickUp && !flickDown) {
    if (y > (mid + collapsed) / 2) target = collapsed;
    else if (y > (expanded + mid) / 2) target = mid;
    else target = expanded;
  }

  snapTo(target);

  window.removeEventListener("pointermove", onSheetPointerMove);
  window.removeEventListener("pointerup", onSheetPointerUp);
}

/* ========= Sync markers ========= */
function syncMarkersToBuses() {
  const next = buses.value || [];
  const nextIdsWithCoords = new Set(next.filter(hasBusCoords).map((b) => b.id));

  for (const id of busMarkers.keys()) {
    if (!nextIdsWithCoords.has(id)) {
      removeMarker(id);
    }
  }

  if (map) {
    next.forEach(addOrUpdateBusMarker);
    refreshAllBusMarkerIcons();
  }

  if (selectedBus.value) {
    const updated = next.find((b) => b.id === selectedBus.value.id);

    if (updated) {
      selectedBus.value = updated;
    } else {
      selectedBus.value = null;
    }
  }
}

watch(
  buses,
  async () => {
    syncMarkersToBuses();
    await nextTick();
    await maybeFocusBusFromQuery();
  },
  { deep: true }
);

watch(
  () => currentPos.value,
  () => {
    if (!map) return;

    if (!hasUserLocation.value) {
      removeUserMarker();
      return;
    }

    ensureUserMarker();
    updateUserMarker();
  },
  { deep: true }
);

watch(
  () => terminals.value,
  () => {
    syncTerminalMarkers();
  },
  { deep: true }
);

watch(
  () => route.query?.terminalId,
  async () => {
    await nextTick();
    await maybeFocusTerminalFromQuery();
  }
);

watch(
  () => [route.query?.busId, route.query?.bus_id, route.query?.id],
  async () => {
    await nextTick();
    await maybeFocusBusFromQuery();
  }
);

/* ========= Lifecycle ========= */
onMounted(async () => {
  initLeaflet();

  await nextTick();

  openSheetMid();

  window.addEventListener("resize", openSheetMid);

  requestAnimationFrame(() => map?.invalidateSize());
  setTimeout(() => map?.invalidateSize(), 350);

  startLive();

  await fetchOnce();
  syncMarkersToBuses();
  await maybeFocusBusFromQuery();

  await loadTerminalsOnce();

  terminalPoll = setInterval(loadTerminalsOnce, 10000);

  if (hasUserLocation.value) {
    ensureUserMarker();
    updateUserMarker();
  }
});

onUnmounted(() => {
  stopLive();

  window.removeEventListener("resize", openSheetMid);
  window.removeEventListener("pointermove", onSheetPointerMove);
  window.removeEventListener("pointerup", onSheetPointerUp);

  cancelAnimationFrame(raf);

  if (terminalPoll) {
    clearInterval(terminalPoll);
  }

  for (const id of busMarkers.keys()) {
    removeMarker(id);
  }

  for (const id of terminalMarkers.keys()) {
    removeTerminalMarker(id);
  }

  if (map) {
    map.off();
    map.remove();
    map = null;
  }
});
</script>

<style>
:root {
  --bottom-nav-h: 72px;
}

/* ===== Page ===== */
.tb-page {
  position: relative;
  height: calc(100vh - var(--bottom-nav-h));
  width: 100%;
  overflow: hidden;
  background: var(--light-bg);
}

/* ===== Map ===== */
.tb-map-wrap {
  position: absolute;
  inset: 0;
}

.tb-map {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: linear-gradient(135deg, #e3f2fd 0%, #e0f2f1 100%);
  touch-action: pan-x pan-y;
  z-index: 1;
}

.tb-map .leaflet-container {
  width: 100% !important;
  height: 100% !important;
}

/* ===== FAB stack ===== */
.tb-fab-stack {
  position: absolute;
  right: 14px;
  bottom: calc(var(--bottom-nav-h) + 18px + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 12;
}

.tb-fab {
  width: 52px;
  height: 52px;
  border-radius: 999px;
  background: white;
  border: 1.5px solid rgba(17, 24, 39, 0.1);
  color: var(--primary-blue);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.tb-fab:active {
  transform: scale(0.92);
}

/* ===== Selected cards ===== */
.tb-bus-card,
.tb-term-card {
  position: absolute;
  left: 12px;
  right: 12px;
  top: 12px;
  background: rgba(255, 255, 255, 0.97);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(17, 24, 39, 0.08);
  border-radius: 20px;
  padding: 16px;
  box-shadow:
    0 16px 48px rgba(0, 0, 0, 0.14),
    0 4px 12px rgba(0, 0, 0, 0.06);
  z-index: 20;
}

.tb-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.tb-card-icon-wrap {
  width: 42px;
  height: 42px;
  border-radius: 13px;
  background: rgba(55, 138, 221, 0.1);
  color: #1d6fb5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  flex-shrink: 0;
}

.tb-card-icon-wrap--term {
  background: rgba(2, 132, 199, 0.1);
  color: #0369a1;
}

.tb-card-header-body {
  flex: 1;
  min-width: 0;
}

.tb-card-title {
  font-size: 15px;
  font-weight: 800;
  color: var(--text-dark);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}

.tb-card-subtitle {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-gray);
  margin-top: 2px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.tb-card-live-line {
  margin-top: 5px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 800;
  line-height: 1;
}

.tb-card-live-line.live {
  color: #0f766e;
}

.tb-card-live-line.last {
  color: #92400e;
}

.tb-card-live-dot,
.tb-row-live-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  flex-shrink: 0;
}

.tb-card-live-line.live .tb-card-live-dot,
.tb-live-row.live .tb-row-live-dot {
  background: #10b981;
  box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.45);
  animation: tbLivePulse 1.4s infinite;
}

.tb-card-live-line.last .tb-card-live-dot,
.tb-live-row.last .tb-row-live-dot {
  background: #f59e0b;
}

.tb-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 800;
  padding: 5px 10px;
  border-radius: 999px;
  flex-shrink: 0;
  white-space: nowrap;
}

.tb-status-badge.en {
  background: rgba(14, 165, 233, 0.1);
  color: #0369a1;
  border: 1.5px solid rgba(14, 165, 233, 0.2);
}

.tb-status-badge.at {
  background: rgba(22, 163, 74, 0.1);
  color: #166534;
  border: 1.5px solid rgba(22, 163, 74, 0.2);
}

.tb-card-close {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: none;
  background: rgba(17, 24, 39, 0.05);
  color: var(--text-gray);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  font-size: 12px;
}

.tb-card-close:active {
  transform: scale(0.9);
}

.tb-card-stats {
  display: flex;
  align-items: stretch;
  background: rgba(17, 24, 39, 0.03);
  border: 1px solid rgba(17, 24, 39, 0.07);
  border-radius: 14px;
  padding: 12px 0;
  margin-bottom: 12px;
  overflow: hidden;
}

.tb-card-stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 0 8px;
}

.tb-card-stat--wide {
  flex: 2;
}

.tb-card-stat-divider {
  width: 1px;
  background: rgba(17, 24, 39, 0.08);
  align-self: stretch;
  margin: 2px 0;
}

.tb-card-stat-label {
  font-size: 10px;
  font-weight: 700;
  color: var(--text-gray);
  text-transform: uppercase;
  letter-spacing: 0.3px;
  white-space: nowrap;
}

.tb-card-stat-value {
  font-size: 15px;
  font-weight: 900;
  color: var(--text-dark);
  line-height: 1.1;
}

.tb-card-stat-value.low {
  color: #166534;
}

.tb-card-stat-value.mid {
  color: #b45309;
}

.tb-card-stat-value.full {
  color: #b91c1c;
}

.tb-card-stat-unit {
  font-size: 10px;
  font-weight: 700;
  color: var(--text-gray);
}

.tb-card-stat-value--small {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-dark);
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
}

.tb-card-bus-tag {
  display: inline-block;
  background: rgba(55, 138, 221, 0.1);
  color: #1d6fb5;
  border: 1px solid rgba(55, 138, 221, 0.2);
  border-radius: 6px;
  padding: 2px 7px;
  font-size: 11px;
  font-weight: 800;
}

.tb-card-empty-tag {
  color: var(--text-gray);
  font-size: 12px;
  font-weight: 600;
}

.tb-card-route-row {
  display: flex;
  align-items: center;
  gap: 7px;
  background: rgba(17, 24, 39, 0.03);
  border: 1px solid rgba(17, 24, 39, 0.07);
  border-radius: 10px;
  padding: 9px 12px;
  margin-bottom: 12px;
}

.tb-card-route-icon {
  color: var(--text-gray);
  font-size: 12px;
  flex-shrink: 0;
}

.tb-card-route-text {
  flex: 1;
  font-size: 12px;
  font-weight: 700;
  color: var(--text-dark);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tb-card-dir-chip {
  font-size: 10px;
  font-weight: 800;
  color: #1e40af;
  background: rgba(59, 130, 246, 0.08);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 6px;
  padding: 2px 7px;
  white-space: nowrap;
  flex-shrink: 0;
}

.tb-card-actions {
  display: flex;
  gap: 7px;
}

.tb-card-btn {
  flex: 1;
  border: 1.5px solid rgba(17, 24, 39, 0.1);
  background: white;
  color: var(--text-dark);
  border-radius: 10px;
  padding: 9px 8px;
  font-size: 12px;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  cursor: pointer;
  white-space: nowrap;
}

.tb-card-btn:active {
  transform: scale(0.96);
}

.tb-card-btn-primary {
  background: var(--primary-blue, #1e6fb5);
  color: white;
  border-color: transparent;
}

/* ===== Bottom sheet ===== */
.tb-sheet {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 76%;
  z-index: 30;
  display: flex;
  flex-direction: column;
  will-change: transform;
  pointer-events: auto;
}

.tb-sheet.dragging {
  transition: none !important;
}

.tb-sheet-handle {
  background: rgba(255, 255, 255, 0.97);
  backdrop-filter: blur(12px);
  border-radius: 20px 20px 0 0;
  border: 1.5px solid rgba(17, 24, 39, 0.09);
  border-bottom: none;
  padding: 0 14px 12px;
  box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.08);
  user-select: none;
  touch-action: none;
  flex-shrink: 0;
}

.tb-sheet-pill-wrap {
  display: flex;
  justify-content: center;
  padding: 10px 0 12px;
}

.tb-sheet-pill {
  width: 36px;
  height: 4px;
  border-radius: 999px;
  background: rgba(17, 24, 39, 0.15);
}

.tb-sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.tb-sheet-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tb-sheet-title {
  font-size: 16px;
  font-weight: 900;
  color: var(--text-dark);
}

.tb-live-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 800;
  color: #0f6e56;
  background: rgba(29, 158, 117, 0.1);
  border: 1.5px solid rgba(29, 158, 117, 0.2);
  padding: 3px 8px;
  border-radius: 999px;
}

.tb-live-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: #1d9e75;
  box-shadow: 0 0 0 0 rgba(29, 158, 117, 0.4);
  animation: tbLivePulse 1.4s infinite;
}

@keyframes tbLivePulse {
  0% {
    box-shadow: 0 0 0 0 rgba(29, 158, 117, 0.4);
  }

  70% {
    box-shadow: 0 0 0 8px rgba(29, 158, 117, 0);
  }

  100% {
    box-shadow: 0 0 0 0 rgba(29, 158, 117, 0);
  }
}

.tb-sheet-count-badge {
  font-size: 11px;
  font-weight: 800;
  color: #0c447c;
  background: rgba(55, 138, 221, 0.1);
  border: 1.5px solid rgba(55, 138, 221, 0.2);
  padding: 4px 10px;
  border-radius: 999px;
}

.tb-search-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(17, 24, 39, 0.04);
  border: 1.5px solid rgba(17, 24, 39, 0.08);
  border-radius: 12px;
  padding: 9px 12px;
  margin-bottom: 10px;
}

.tb-search-icon {
  color: var(--text-gray);
  font-size: 13px;
}

.tb-search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-dark);
  min-width: 0;
}

.tb-search-input::placeholder {
  color: rgba(17, 24, 39, 0.3);
  font-weight: 500;
}

.tb-search-clear {
  border: none;
  background: transparent;
  color: var(--text-gray);
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
}

.tb-filter-row {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 2px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.tb-filter-row::-webkit-scrollbar {
  display: none;
}

.tb-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: 1.5px solid rgba(17, 24, 39, 0.1);
  background: white;
  color: var(--text-gray);
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tb-chip:active {
  transform: scale(0.96);
}

.tb-chip.active {
  border-color: rgba(55, 138, 221, 0.35);
  background: rgba(55, 138, 221, 0.08);
  color: #185fa5;
}

/* ===== List area ===== */
.tb-sheet-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  background: rgba(247, 248, 250, 0.98);
  backdrop-filter: blur(8px);
  border-left: 1.5px solid rgba(17, 24, 39, 0.09);
  border-right: 1.5px solid rgba(17, 24, 39, 0.09);
}

.tb-sheet-list {
  padding: 12px 10px 0;
}

.tb-list-wrap {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tb-group-block {
  margin-bottom: 16px;
}

.tb-section-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 4px 8px;
  cursor: pointer;
  gap: 8px;
}

.tb-section-label--route {
  cursor: default;
}

.tb-section-label-left {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
  flex: 1;
}

.tb-section-label-icon {
  font-size: 11px;
  color: #0284c7;
  flex-shrink: 0;
}

.tb-section-label-icon--route {
  color: #0369a1;
}

.tb-section-label-name {
  font-size: 12px;
  font-weight: 800;
  color: var(--text-dark);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.tb-section-label-city {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-gray);
}

.tb-section-count {
  font-size: 11px;
  font-weight: 800;
  color: var(--text-gray);
  background: rgba(17, 24, 39, 0.06);
  border-radius: 999px;
  padding: 2px 8px;
  flex-shrink: 0;
  min-width: 22px;
  text-align: center;
}

.tb-section-count.has-buses {
  color: #0c447c;
  background: rgba(55, 138, 221, 0.1);
}

.tb-group-rows {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.tb-group-empty {
  font-size: 11px;
  font-weight: 600;
  color: rgba(17, 24, 39, 0.3);
  padding: 8px 4px 4px;
  font-style: italic;
}

/* ===== Bus row ===== */
.tb-bus-row {
  display: flex;
  align-items: center;
  gap: 10px;
  background: white;
  border: 1.5px solid rgba(17, 24, 39, 0.07);
  border-radius: 13px;
  padding: 11px 12px;
  cursor: pointer;
  transition:
    background 0.12s ease,
    border-color 0.12s ease;
}

.tb-bus-row:active {
  transform: scale(0.99);
}

.tb-bus-row.selected {
  border-color: rgba(55, 138, 221, 0.35);
  background: rgba(55, 138, 221, 0.04);
  box-shadow: 0 2px 12px rgba(55, 138, 221, 0.1);
}

.tb-occ-dot {
  width: 9px;
  height: 9px;
  border-radius: 999px;
  flex-shrink: 0;
  margin-left: 2px;
}

.tb-occ-dot.low {
  background: #16a34a;
}

.tb-occ-dot.mid {
  background: #f59e0b;
}

.tb-occ-dot.full {
  background: #ef4444;
}

.tb-row-body {
  flex: 1;
  min-width: 0;
}

.tb-row-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}

.tb-row-title {
  font-size: 13px;
  font-weight: 800;
  color: var(--text-dark);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
  margin: 0;
}

.tb-trk-label {
  font-size: 10px;
  font-weight: 800;
  color: var(--text-gray);
  background: rgba(17, 24, 39, 0.05);
  padding: 2px 7px;
  border-radius: 999px;
  flex-shrink: 0;
}

.tb-row-meta {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  overflow: hidden;
  flex-wrap: nowrap;
}

.tb-meta-item {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-gray);
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  min-width: 0;
}

.tb-meta-muted {
  overflow: hidden;
  text-overflow: ellipsis;
}

.tb-live-row {
  font-weight: 800;
  flex-shrink: 0;
}

.tb-live-row.live {
  color: #0f766e;
}

.tb-live-row.last {
  color: #92400e;
}

.tb-dot-sep {
  font-size: 10px;
  color: rgba(17, 24, 39, 0.25);
  flex-shrink: 0;
}

.tb-row-chevron {
  color: rgba(17, 24, 39, 0.25);
  font-size: 11px;
  flex-shrink: 0;
}

.tb-status-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  font-weight: 800;
  border-radius: 999px;
  padding: 3px 7px;
  white-space: nowrap;
  flex-shrink: 0;
}

.tb-status-pill.en {
  color: #0369a1;
  background: rgba(14, 165, 233, 0.08);
}

.tb-status-pill.at {
  color: #166534;
  background: rgba(22, 163, 74, 0.08);
}

/* ===== Empty state ===== */
.tb-empty {
  text-align: center;
  padding: 28px 16px;
}

.tb-empty-icon {
  width: 44px;
  height: 44px;
  border-radius: 999px;
  background: rgba(17, 24, 39, 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
  font-size: 20px;
  color: var(--text-gray);
}

.tb-empty-title {
  font-size: 14px;
  font-weight: 800;
  color: var(--text-dark);
  margin-bottom: 4px;
}

.tb-empty-sub {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-gray);
  margin-bottom: 14px;
}

.tb-empty-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
}

.tb-mini-btn {
  border: none;
  background: var(--primary-blue, #1e6fb5);
  color: white;
  border-radius: 999px;
  padding: 7px 12px;
  font-size: 12px;
  font-weight: 800;
}

/* ===== Footer ===== */
.tb-sheet-footer {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 10px 14px calc(10px + env(safe-area-inset-bottom));
  background: rgba(247, 248, 250, 0.98);
  border: 1.5px solid rgba(17, 24, 39, 0.09);
  border-top: 1px solid rgba(17, 24, 39, 0.07);
  flex-shrink: 0;
}

.tb-footer-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: #1d9e75;
  flex-shrink: 0;
}

.tb-footer-text {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-gray);
}

/* ===== Leaflet markers ===== */
.tb-leaflet-bus-icon {
  background: transparent;
  border: none;
}

.tb-leaflet-bus-pill {
  width: 42px;
  height: 38px;
  border-radius: 999px;
  background: #fff;
  border: 2px solid var(--accent-teal);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.1);
  transition:
    transform 0.12s ease,
    box-shadow 0.12s ease,
    opacity 0.12s ease,
    filter 0.12s ease;
  position: relative;
}

.tb-leaflet-bus-pill i {
  color: var(--accent-teal);
  font-size: 18px;
}

.tb-leaflet-bus-pill.low {
  border-color: #16a34a;
}

.tb-leaflet-bus-pill.low i {
  color: #16a34a;
}

.tb-leaflet-bus-pill.mid {
  border-color: #f59e0b;
}

.tb-leaflet-bus-pill.mid i {
  color: #f59e0b;
}

.tb-leaflet-bus-pill.full {
  border-color: #ef4444;
}

.tb-leaflet-bus-pill.full i {
  color: #ef4444;
}

.tb-leaflet-bus-pill.selected {
  transform: scale(1.14);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.18);
}

.tb-leaflet-bus-pill.last-location {
  opacity: 0.72;
  filter: grayscale(0.2);
  border-style: dashed;
}

.tb-leaflet-bus-pill.live {
  opacity: 1;
}

.tb-mini-flag {
  position: absolute;
  right: -8px;
  top: -5px;
  min-width: 25px;
  height: 15px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 7px;
  font-weight: 900;
  padding: 0 5px;
  color: white;
  border: 1.5px solid white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.tb-leaflet-bus-pill.live .tb-mini-flag {
  background: rgba(16, 185, 129, 0.95);
}

.tb-leaflet-bus-pill.last-location .tb-mini-flag {
  background: rgba(245, 158, 11, 0.95);
}

.tb-leaflet-term-icon {
  background: transparent;
  border: none;
}

.tb-leaflet-term-pill {
  width: 34px;
  height: 34px;
  border-radius: 12px 12px 12px 4px;
  background: white;
  border: 2px solid #0369a1;
  color: #0369a1;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.12);
  transform: rotate(-45deg);
}

.tb-leaflet-term-pill i {
  transform: rotate(45deg);
  font-size: 14px;
}

.tb-leaflet-user-icon {
  background: transparent;
  border: none;
}

.tb-leaflet-user-dot {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background: rgba(59, 130, 246, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
}

.tb-leaflet-user-core {
  width: 11px;
  height: 11px;
  border-radius: 999px;
  background: #2563eb;
  border: 2px solid white;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.45);
}

/* ===== Transitions ===== */
.slide-up-enter-active,
.slide-up-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.list-enter-active,
.list-leave-active {
  transition:
    opacity 0.16s ease,
    transform 0.16s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>