<!-- src/pages/commuters/TerminalPage.vue
     UPDATED:
     ✅ card click -> TerminalDetailsPage
     ✅ "View on Live Track" button only -> TrackBusPage
-->
<template>
  <div class="tm-page">
    <!-- Top -->
    <div class="tm-top">
      <div class="tm-header">
        <div class="tm-title">
          <div class="tm-icon">
            <i class="fas fa-building"></i>
          </div>
          <div class="tm-title-text">
            <div class="tm-title-main">Terminals</div>
            <div class="tm-title-sub">Tap a terminal card to view details • Use button for Live Track</div>
          </div>
        </div>

        <button class="tm-icon-btn" type="button" @click="toggleTips" aria-label="Help">
          <i class="fas fa-circle-info"></i>
        </button>
      </div>

      <!-- Search -->
      <div class="tm-search">
        <i class="fas fa-magnifying-glass"></i>
        <input
          v-model="query"
          class="tm-search-input"
          type="text"
          placeholder='Search terminal (e.g., "Calapan", "Naujan")'
        />
        <button v-if="query" class="tm-clear" type="button" aria-label="Clear" @click="query = ''">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Chips -->
      <div class="tm-chips">
        <button
          v-for="c in categories"
          :key="c"
          class="tm-chip"
          :class="{ active: activeCategory === c }"
          type="button"
          @click="activeCategory = c"
        >
          {{ c }}
        </button>

        <span class="tm-count">{{ filtered.length }}</span>
      </div>

      <!-- Tips -->
      <Transition name="fade">
        <div v-if="showTips" class="tm-tips">
          <i class="fas fa-lightbulb"></i>
          Tap a terminal <b>card</b> to open <b>Details</b>. Use the <b>View on Live Track</b> button to open the map.
        </div>
      </Transition>

      <!-- Loading / Error -->
      <Transition name="fade">
        <div v-if="loading" class="tm-banner tm-banner--loading">
          <i class="fas fa-spinner fa-spin"></i>
          <span>Loading terminals…</span>
        </div>
      </Transition>

      <Transition name="fade">
        <div v-if="error" class="tm-banner tm-banner--error">
          <i class="fas fa-triangle-exclamation"></i>
          <span>{{ error }}</span>
          <button class="tm-retry" type="button" @click="reload">
            <i class="fas fa-rotate"></i> Retry
          </button>
        </div>
      </Transition>
    </div>

    <!-- List -->
    <div class="tm-list">
      <!-- ✅ card click goes to details now -->
      <button
        v-for="t in filtered"
        :key="t.terminal_id"
        class="tm-card"
        type="button"
        @click="goToDetails(t)"
      >
        <div class="tm-card-top">
          <div class="tm-card-main">
            <div class="tm-name">{{ t.terminal_name || "Terminal" }}</div>

            <div class="tm-sub">
              <span class="tm-pill">
                <i class="fas fa-location-dot"></i>
                {{ t.city || "—" }}
              </span>

              <span class="tm-pill soft">
                <i class="fas fa-bus"></i>
{{ liveCountForTerminal(t) }} inside              </span>
            </div>
          </div>

          <div class="tm-arrow">
            <i class="fas fa-chevron-right"></i>
          </div>
        </div>

        <div class="tm-meta">
          <div class="tm-meta-item">
            <i class="fas fa-clock"></i>
            <span>{{ hoursLabel(t) }}</span>
          </div>
        </div>

        <!-- ✅ buttons do NOT trigger card click -->
        <div class="tm-actions" @click.stop>
          <button class="tm-btn primary" type="button" @click.stop="goToTrack(t)">
            <i class="fas fa-map-location-dot"></i> View on Live Track
          </button>

          <a class="tm-btn" :href="mapsUrl(t)" target="_blank" rel="noopener noreferrer" @click.stop>
            <i class="fas fa-map"></i> Open Google Maps
          </a>
        </div>
      </button>

      <div v-if="!loading && filtered.length === 0" class="tm-empty">
        <i class="fas fa-building"></i>
        <div class="tm-empty-title">No terminals found</div>
        <div class="tm-empty-sub">Try a different keyword or category.</div>
        <button class="tm-reset" type="button" @click="resetFilters">Reset</button>
      </div>

      <div style="height: 10px"></div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRouter } from "vue-router";

import { useTerminals } from "@/composables/useTerminal"; // ✅ PLURAL
import { useLiveBuses } from "@/composables/useLiveBuses";

const router = useRouter();
const { rows, loading, error, fetchTerminals } = useTerminals();

// live buses polling
const { buses, start, stop, fetchOnce } = useLiveBuses({ intervalMs: 1500 });

const query = ref("");
const activeCategory = ref("All");
const showTips = ref(false);

/* helpers */
function clean(s) {
  return String(s ?? "").trim();
}
function hasCoords(t) {
  const lat = Number(t?.lat);
  const lng = Number(t?.lng);
  return Number.isFinite(lat) && Number.isFinite(lng);
}
function toHHMM(v) {
  const s = clean(v);
  if (!s) return "";
  const parts = s.split(":");
  if (parts.length >= 2) return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
  return s;
}
function hoursLabel(t) {
  const from = toHHMM(t?.available_from);
  const to = toHHMM(t?.available_to);
  if (from && to) return `${from} – ${to}`;
  return "Hours not set";
}

/* ✅ terminal state helpers (same idea as your Details page) */
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

/* ✅ OFFLINE filter (use what you have in payload) */
const OFFLINE_AFTER_SECONDS = 120;

function isOnline(bus) {
  // if backend already gives a boolean, use it
  if (typeof bus?.is_offline === "boolean") return !bus.is_offline;

  // if backend gives a status string
  const s = String(bus?.device_status ?? bus?.status ?? "").toLowerCase();
  if (s === "offline") return false;
  if (s === "online") return true;

  // fallback: use last_seen_at
  const last = bus?.last_seen_at ?? bus?.device_last_seen_at ?? bus?.terminal_state?.last_seen_at;
  if (!last) return true; // if no data, don't auto-hide
  const t = new Date(last).getTime();
  if (!Number.isFinite(t)) return true;

  const ageSec = (Date.now() - t) / 1000;
  return ageSec <= OFFLINE_AFTER_SECONDS;
}

/* data */
const terminals = computed(() => (Array.isArray(rows.value) ? rows.value : []));

/* categories */
const categories = computed(() => {
  const set = new Set();
  for (const t of terminals.value) {
    const c = clean(t.city);
    if (c) set.add(c);
  }
  return ["All", ...Array.from(set)];
});

/* filtered list */
const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();

  return terminals.value.filter((t) => {
    const city = clean(t.city);
    const catOk = activeCategory.value === "All" || city === activeCategory.value;
    if (!catOk) return false;

    if (!q) return true;
    const name = clean(t.terminal_name).toLowerCase();
    const cityLower = city.toLowerCase();
    const idStr = String(t.terminal_id ?? "").toLowerCase();
    return name.includes(q) || cityLower.includes(q) || idStr.includes(q);
  });
});

/* ✅ LIVE count map: terminal_id -> number of buses inside NOW */
const liveInsideCountByTerminal = computed(() => {
  const map = new Map();

  for (const b of buses.value || []) {
    if (!isOnline(b)) continue;
    if (!isAtTerminal(b)) continue;

    const tid = busCurrentTerminalId(b);
    if (!Number.isFinite(tid)) continue;

    map.set(tid, (map.get(tid) || 0) + 1);
  }

  return map;
});

function liveCountForTerminal(t) {
  const tid = Number(t?.terminal_id);
  if (!Number.isFinite(tid)) return 0;
  return liveInsideCountByTerminal.value.get(tid) || 0;
}

/* actions */
function toggleTips() {
  showTips.value = !showTips.value;
}
function resetFilters() {
  query.value = "";
  activeCategory.value = "All";
  showTips.value = false;
}
async function reload() {
  await fetchTerminals({ q: query.value || "" });
  await fetchOnce(); // refresh live buses too
}

/* Google maps url */
function mapsUrl(t) {
  if (hasCoords(t)) return `https://www.google.com/maps?q=${Number(t.lat)},${Number(t.lng)}`;
  const text = encodeURIComponent(`${clean(t.terminal_name)}, ${clean(t.city)}`);
  return `https://www.google.com/maps/search/?api=1&query=${text}`;
}

function goToDetails(t) {
  const terminalId = Number(t?.terminal_id);
  if (!Number.isFinite(terminalId)) return;

  router.push({
    name: "terminalDetails",
    query: { terminalId: String(terminalId) },
  });
}

function goToTrack(t) {
  const terminalId = Number(t?.terminal_id);
  if (!Number.isFinite(terminalId)) return;

  router.push({
    name: "track",
    query: { terminalId: String(terminalId) },
  });
}

/* debounce server search */
let qTimer = null;
watch(
  query,
  (val) => {
    clearTimeout(qTimer);
    qTimer = setTimeout(() => fetchTerminals({ q: val || "" }), 350);
  },
  { flush: "post" }
);

onMounted(async () => {
  await fetchTerminals({ q: "" });
  start();
  await fetchOnce();
});

onUnmounted(() => stop());
</script>
<style scoped>
/* keep your existing CSS (same as before) */
.tm-page {
  height: calc(100vh - var(--bottom-nav-h, 72px));
  background: var(--light-bg, #f5f7fa);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.tm-top {
  padding: 12px;
  position: sticky;
  top: 0;
  z-index: 10;
  background: linear-gradient(to bottom, rgba(245, 247, 250, 0.95), rgba(245, 247, 250, 0.75));
  backdrop-filter: blur(10px);
}
.tm-header {
  background: rgba(255, 255, 255, 0.92);
  border: 2px solid var(--border-light, rgba(209, 213, 219, 0.75));
  border-radius: 18px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  box-shadow: 0 14px 26px rgba(0, 0, 0, 0.10);
}
.tm-title { display: flex; align-items: center; gap: 10px; min-width: 0; }
.tm-icon {
  width: 40px; height: 40px; border-radius: 14px;
  background: linear-gradient(135deg, var(--primary-blue, #1e88e5) 0%, var(--accent-teal, #00bfa6) 100%);
  color: #fff; display: grid; place-items: center;
}
.tm-title-main { font-weight: 1000; font-size: 14px; color: var(--text-dark, #111827); line-height: 1.1; }
.tm-title-sub { font-weight: 900; font-size: 12px; color: var(--text-gray, rgba(31, 41, 55, 0.60)); margin-top: 2px; }
.tm-icon-btn {
  width: 44px; height: 44px; border-radius: 14px;
  border: 2px solid var(--border-light, rgba(209, 213, 219, 0.75));
  background: #fff; color: var(--text-dark, #111827); cursor: pointer;
}
.tm-icon-btn:active { transform: scale(0.96); }

.tm-search {
  margin-top: 10px;
  display: flex; align-items: center; gap: 10px;
  background: rgba(255, 255, 255, 0.92);
  border: 2px solid var(--border-light, rgba(209, 213, 219, 0.75));
  border-radius: 16px;
  padding: 10px 12px;
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.08);
}
.tm-search i { color: var(--text-gray, rgba(31, 41, 55, 0.60)); }
.tm-search-input {
  width: 100%; border: none; outline: none; background: transparent;
  font-weight: 1000; font-size: 13px; color: var(--text-dark, #111827);
}
.tm-clear {
  width: 34px; height: 34px; border-radius: 12px; border: none;
  background: transparent; color: var(--text-gray, rgba(31, 41, 55, 0.60)); cursor: pointer;
}
.tm-clear:active { transform: scale(0.92); }

.tm-chips {
  margin-top: 10px;
  display: flex; gap: 10px; align-items: center;
  overflow-x: auto; padding-bottom: 2px;
}
.tm-chips::-webkit-scrollbar { display: none; }
.tm-chip {
  flex: 0 0 auto;
  border: 2px solid var(--border-light, rgba(209, 213, 219, 0.75));
  background: rgba(255, 255, 255, 0.92);
  border-radius: 999px;
  padding: 9px 12px;
  font-weight: 1000;
  font-size: 12px;
  color: var(--text-dark, #111827);
  cursor: pointer;
  box-shadow: 0 10px 18px rgba(0, 0, 0, 0.06);
}
.tm-chip:active { transform: scale(0.98); }
.tm-chip.active {
  border-color: rgba(0, 131, 143, 0.28);
  color: var(--accent-teal, #00bfa6);
  box-shadow: 0 14px 26px rgba(0, 131, 143, 0.12);
}
.tm-count {
  margin-left: auto;
  flex: 0 0 auto;
  font-weight: 1000;
  font-size: 12px;
  color: #fff;
  background: linear-gradient(135deg, var(--accent-teal, #00bfa6) 0%, #00838f 100%);
  border-radius: 999px;
  padding: 6px 10px;
}

.tm-tips {
  margin-top: 10px;
  padding: 12px;
  border-radius: 16px;
  border: 2px dashed rgba(0, 131, 143, 0.22);
  background: rgba(0, 131, 143, 0.06);
  color: rgba(38, 43, 51, 0.75);
  font-weight: 900;
  font-size: 12px;
  display: flex;
  gap: 10px;
  align-items: flex-start;
}
.tm-tips i { margin-top: 2px; color: rgba(0, 131, 143, 0.95); }

.tm-banner{
  margin-top: 10px;
  padding: 12px;
  border-radius: 16px;
  border: 2px solid var(--border-light, rgba(209, 213, 219, 0.75));
  background: rgba(255,255,255,0.92);
  box-shadow: 0 10px 18px rgba(0,0,0,0.06);
  display:flex;
  align-items:center;
  gap: 10px;
  font-weight: 900;
  font-size: 12px;
  color: rgba(38, 43, 51, 0.75);
}
.tm-banner--loading i { color: rgba(0, 131, 143, 0.95); }
.tm-banner--error{
  border-color: rgba(239, 68, 68, 0.25);
  background: rgba(239, 68, 68, 0.06);
  color: rgba(127, 29, 29, 0.9);
}
.tm-retry{
  margin-left: auto;
  border: 2px solid rgba(239, 68, 68, 0.25);
  background: rgba(255,255,255,0.9);
  color: rgba(127, 29, 29, 0.9);
  border-radius: 12px;
  padding: 8px 10px;
  font-weight: 1000;
  cursor: pointer;
}
.tm-retry:active{ transform: scale(0.98); }

.tm-list {
  padding: 0 12px 12px;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}
.tm-card {
  width: 100%;
  text-align: left;
  border: 2px solid var(--border-light, rgba(209, 213, 219, 0.75));
  background: rgba(255, 255, 255, 0.95);
  border-radius: 18px;
  padding: 12px;
  cursor: pointer;
  box-shadow: 0 14px 26px rgba(0, 0, 0, 0.10);
  transition: transform 0.12s ease, box-shadow 0.12s ease, border-color 0.12s ease;
  margin-top: 10px;
}
.tm-card:active { transform: scale(0.99); }
.tm-card:hover { border-color: rgba(30, 136, 229, 0.22); }

.tm-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}
.tm-name { font-weight: 1000; font-size: 14px; color: rgba(38, 43, 51, 0.92); }
.tm-sub { margin-top: 8px; display: flex; gap: 8px; flex-wrap: wrap; }
.tm-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  padding: 6px 10px;
  border: 2px solid var(--border-light, rgba(209, 213, 219, 0.75));
  background: rgba(17, 24, 39, 0.02);
  color: rgba(38, 43, 51, 0.78);
  font-weight: 1000;
  font-size: 12px;
}
.tm-pill.soft { border-color: rgba(0, 131, 143, 0.18); background: rgba(0, 131, 143, 0.06); }
.tm-arrow { color: rgba(156, 163, 175, 0.95); font-size: 18px; padding-top: 4px; }

.tm-meta { margin-top: 10px; display: grid; gap: 8px; }
.tm-meta-item {
  display: flex; align-items: center; gap: 10px;
  font-weight: 900; font-size: 12px;
  color: rgba(38, 43, 51, 0.72);
}
.tm-meta-item i { color: rgba(0, 131, 143, 0.95); }
.tm-meta-item.muted i { color: rgba(31, 41, 55, 0.55); }
.tm-meta-item.muted { color: rgba(31, 41, 55, 0.60); }

.tm-actions { margin-top: 12px; display: flex; gap: 10px; flex-wrap: wrap; }

.tm-btn {
  border: 2px solid var(--border-light, rgba(209, 213, 219, 0.75));
  background: #fff;
  color: rgba(38, 43, 51, 0.92);
  border-radius: 14px;
  padding: 10px 12px;
  font-weight: 1000;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
.tm-btn:active { transform: scale(0.98); }
.tm-btn.primary {
  border-color: rgba(0, 131, 143, 0.22);
  background: rgba(0, 131, 143, 0.08);
  color: rgba(0, 131, 143, 0.98);
}

.tm-empty {
  margin-top: 12px;
  border: 2px dashed var(--border-light, rgba(209, 213, 219, 0.75));
  border-radius: 18px;
  padding: 22px 14px;
  text-align: center;
  color: rgba(31, 41, 55, 0.60);
  font-weight: 1000;
  background: rgba(255, 255, 255, 0.7);
}
.tm-empty i { font-size: 22px; margin-bottom: 10px; color: var(--accent-teal, #00bfa6); }
.tm-empty-title { font-size: 14px; color: rgba(38, 43, 51, 0.92); }
.tm-empty-sub { margin-top: 4px; font-size: 12px; font-weight: 900; }
.tm-reset {
  margin-top: 12px;
  border: 2px solid rgba(0, 131, 143, 0.22);
  background: rgba(0, 131, 143, 0.08);
  color: rgba(0, 131, 143, 0.98);
  border-radius: 14px;
  padding: 10px 12px;
  font-weight: 1000;
  cursor: pointer;
}
.tm-reset:active { transform: scale(0.98); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.22s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>