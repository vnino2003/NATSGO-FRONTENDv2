<!-- src/pages/commuters/TerminalPage.vue -->
<template>
  <div class="tp-page">

    <!-- ── Header ── -->
<div class="tp-header" data-tour="terminal-header">      <div class="tp-header-top">
        <div class="tp-header-title-group">
          <span class="tp-label">Terminals</span>
          <span class="tp-count-pill">{{ filtered.length }}</span>
        </div>
        <button class="tp-icon-btn" type="button" @click="toggleTips" aria-label="Help">
          <i class="fas fa-circle-info"></i>
        </button>
      </div>

      <!-- Search -->
<div class="tp-search" data-tour="terminal-search">        <i class="fas fa-magnifying-glass tp-search-icon"></i>
        <input
          v-model="query"
          class="tp-search-input"
          type="text"
          placeholder="Search terminals…"
        />
        <button v-if="query" class="tp-search-clear" type="button" @click="query = ''">
          <i class="fas fa-xmark"></i>
        </button>
      </div>

      <!-- City filter chips -->
      <div class="tp-chips">
        <button
          v-for="c in categories"
          :key="c"
          class="tp-chip"
          :class="{ active: activeCategory === c }"
          type="button"
          @click="activeCategory = c"
        >{{ c }}</button>
      </div>

      <!-- Tips -->
      <Transition name="fade">
        <div v-if="showTips" class="tp-tips">
          <i class="fas fa-lightbulb"></i>
          <span>Tap a card to open <b>Details</b>. Use <b>View on Live Track</b> to open the map.</span>
        </div>
      </Transition>

      <!-- Loading / Error -->
      <Transition name="fade">
        <div v-if="loading" class="tp-notice">
          <i class="fas fa-spinner fa-spin"></i>
          <span>Loading terminals…</span>
        </div>
      </Transition>
      <Transition name="fade">
        <div v-if="error" class="tp-notice tp-notice--error">
          <i class="fas fa-triangle-exclamation"></i>
          <span>{{ error }}</span>
          <button class="tp-retry" type="button" @click="reload">Retry</button>
        </div>
      </Transition>
    </div>

    <!-- ── List ── -->
<div class="tp-list" data-tour="terminal-list">      <button
        v-for="t in filtered"
        :key="t.terminal_id"
        class="tp-card"
        type="button"
        @click="goToDetails(t)"
      >
        <!-- Card top row -->
        <div class="tp-card-row">
          <div class="tp-card-info">
            <div class="tp-card-name">{{ t.terminal_name || "Terminal" }}</div>
            <div class="tp-card-city">
              <i class="fas fa-location-dot"></i>
              {{ t.city || "—" }}
            </div>
          </div>

          <div class="tp-card-right">
            <div class="tp-buses-badge" :class="liveCountForTerminal(t) > 0 ? 'active' : ''">
              <i class="fas fa-bus"></i>
              {{ liveCountForTerminal(t) }}
            </div>
            <i class="fas fa-chevron-right tp-chevron"></i>
          </div>
        </div>

        <!-- Hours -->
        <div class="tp-card-hours">
          <i class="fas fa-clock"></i>
          <span>{{ hoursLabel(t) }}</span>
        </div>

        <!-- Actions -->
        <div class="tp-card-actions" @click.stop>
          <button class="tp-action-btn tp-action-btn--primary" type="button" @click.stop="goToTrack(t)">
            <i class="fas fa-map-location-dot"></i>
            Live Track
          </button>
          <a class="tp-action-btn" :href="mapsUrl(t)" target="_blank" rel="noopener noreferrer" @click.stop>
            <i class="fas fa-map"></i>
            Maps
          </a>
        </div>
      </button>

      <!-- Empty -->
      <div v-if="!loading && filtered.length === 0" class="tp-empty">
        <div class="tp-empty-icon"><i class="fas fa-building"></i></div>
        <p class="tp-empty-title">No terminals found</p>
        <p class="tp-empty-sub">Try a different keyword or category.</p>
        <button class="tp-reset-btn" type="button" @click="resetFilters">Reset filters</button>
      </div>

      <div style="height: 16px;"></div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useTerminals } from "@/composables/useTerminal";
import { useLiveBuses } from "@/composables/useLiveBuses";

const router = useRouter();
const { rows, loading, error, fetchTerminals } = useTerminals();
const { buses, start, stop, fetchOnce } = useLiveBuses({ intervalMs: 1500 });

const query = ref("");
const activeCategory = ref("All");
const showTips = ref(false);

function clean(s) { return String(s ?? "").trim(); }
function hasCoords(t) {
  const lat = Number(t?.lat), lng = Number(t?.lng);
  return Number.isFinite(lat) && Number.isFinite(lng);
}
function toHHMM(v) {
  const s = clean(v); if (!s) return "";
  const parts = s.split(":");
  if (parts.length >= 2) return `${parts[0].padStart(2,"0")}:${parts[1].padStart(2,"0")}`;
  return s;
}
function hoursLabel(t) {
  const from = toHHMM(t?.available_from), to = toHHMM(t?.available_to);
  return (from && to) ? `${from} – ${to}` : "Hours not set";
}
function isAtTerminal(bus) {
  const v = bus?.at_terminal ?? bus?.atTerminal ?? bus?.terminal_state?.at_terminal ?? bus?.terminal_state?.atTerminal ?? bus?.terminal_state?.atTerminalFlag;
  return Number(v) === 1 || v === true;
}
function busCurrentTerminalId(bus) {
  const v = bus?.terminal_state?.current_terminal_id ?? bus?.terminal_state?.currentTerminalId ?? bus?.current_terminal_id ?? bus?.currentTerminalId;
  const n = Number(v); return Number.isFinite(n) ? n : NaN;
}

const OFFLINE_AFTER_SECONDS = 120;
function isOnline(bus) {
  if (typeof bus?.is_offline === "boolean") return !bus.is_offline;
  const s = String(bus?.device_status ?? bus?.status ?? "").toLowerCase();
  if (s === "offline") return false; if (s === "online") return true;
  const last = bus?.last_seen_at ?? bus?.device_last_seen_at ?? bus?.terminal_state?.last_seen_at;
  if (!last) return true;
  const t = new Date(last).getTime();
  if (!Number.isFinite(t)) return true;
  return (Date.now() - t) / 1000 <= OFFLINE_AFTER_SECONDS;
}

const terminals = computed(() => Array.isArray(rows.value) ? rows.value : []);
const categories = computed(() => {
  const set = new Set();
  for (const t of terminals.value) { const c = clean(t.city); if (c) set.add(c); }
  return ["All", ...Array.from(set)];
});
const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  return terminals.value.filter((t) => {
    const city = clean(t.city);
    const catOk = activeCategory.value === "All" || city === activeCategory.value;
    if (!catOk) return false;
    if (!q) return true;
    return clean(t.terminal_name).toLowerCase().includes(q) || city.toLowerCase().includes(q) || String(t.terminal_id ?? "").includes(q);
  });
});
const liveInsideCountByTerminal = computed(() => {
  const map = new Map();
  for (const b of buses.value || []) {
    if (!isOnline(b) || !isAtTerminal(b)) continue;
    const tid = busCurrentTerminalId(b);
    if (!Number.isFinite(tid)) continue;
    map.set(tid, (map.get(tid) || 0) + 1);
  }
  return map;
});
function liveCountForTerminal(t) {
  const tid = Number(t?.terminal_id);
  return Number.isFinite(tid) ? (liveInsideCountByTerminal.value.get(tid) || 0) : 0;
}

function toggleTips() { showTips.value = !showTips.value; }
function resetFilters() { query.value = ""; activeCategory.value = "All"; showTips.value = false; }
async function reload() { await fetchTerminals({ q: query.value || "" }); await fetchOnce(); }
function mapsUrl(t) {
  if (hasCoords(t)) return `https://www.google.com/maps?q=${Number(t.lat)},${Number(t.lng)}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${clean(t.terminal_name)}, ${clean(t.city)}`)}`;
}
function goToDetails(t) {
  const id = Number(t?.terminal_id);
  if (!Number.isFinite(id)) return;
  router.push({ name: "terminalDetails", query: { terminalId: String(id) } });
}
function goToTrack(t) {
  const id = Number(t?.terminal_id);
  if (!Number.isFinite(id)) return;
  router.push({ name: "track", query: { terminalId: String(id) } });
}

let qTimer = null;
watch(query, (val) => {
  clearTimeout(qTimer);
  qTimer = setTimeout(() => fetchTerminals({ q: val || "" }), 350);
}, { flush: "post" });

onMounted(async () => { await fetchTerminals({ q: "" }); start(); await fetchOnce(); });
onUnmounted(() => stop());
</script>

<style scoped>
/* ── Base ── */
.tp-page {
  height: calc(100vh - var(--bottom-nav-h, 72px));
  background: var(--light-bg, #F5F7FA);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ── Header ── */
.tp-header {
  padding: 12px 14px 12px;
  background: linear-gradient(135deg, var(--primary-blue, #1E88E5) 0%, var(--accent-teal, #00BCD4) 100%);
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(30, 136, 229, 0.15);
}
.tp-header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.tp-header-title-group {
  display: flex;
  align-items: center;
  gap: 8px;
}
.tp-label {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.3px;
}
.tp-count-pill {
  font-size: 11px;
  font-weight: 700;
  color: var(--primary-blue, #1E88E5);
  background: #fff;
  border-radius: 999px;
  padding: 3px 9px;
}
.tp-icon-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 15px;
}
.tp-icon-btn:active { opacity: 0.7; }

/* ── Search ── */
.tp-search {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 20px;
  padding: 8px 13px;
  margin-bottom: 10px;
}
.tp-search-icon { color: rgba(255, 255, 255, 0.75); font-size: 13px; }
.tp-search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 13px;
  font-weight: 500;
  color: #fff;
}
.tp-search-input::placeholder { color: rgba(255, 255, 255, 0.65); }
.tp-search-clear {
  width: 24px; height: 24px;
  border: none; background: transparent;
  color: rgba(255, 255, 255, 0.75);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; border-radius: 6px; font-size: 12px;
}

/* ── Chips ── */
.tp-chips {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 2px;
  scrollbar-width: none;
}
.tp-chips::-webkit-scrollbar { display: none; }
.tp-chip {
  flex: 0 0 auto;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.15);
  border-radius: 999px;
  padding: 5px 13px;
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  transition: all 0.14s ease;
  white-space: nowrap;
}
.tp-chip:active { transform: scale(0.97); }
.tp-chip.active {
  background: #fff;
  color: var(--primary-blue, #1E88E5);
  border-color: #fff;
}

/* ── Tips / notices ── */
.tp-tips {
  margin-top: 10px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
}
.tp-tips i { color: #fff; margin-top: 1px; flex-shrink: 0; }

.tp-notice {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}
.tp-notice--error {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.35);
  color: #fff;
}
.tp-retry {
  margin-left: auto;
  border: 1px solid rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  border-radius: 8px;
  padding: 5px 10px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

/* ── List ── */
.tp-list {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 12px 14px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* ── Card ── */
.tp-card {
  width: 100%;
  text-align: left;
  background: var(--bg-white, #fff);
  border: 1.5px solid var(--border-light, #E5E7EB);
  border-radius: 14px;
  padding: 13px;
  cursor: pointer;
  transition: border-color 0.12s ease, box-shadow 0.12s ease;
  box-shadow: 0 1px 4px rgba(30, 136, 229, 0.05);
}
.tp-card:active { transform: scale(0.995); box-shadow: none; }
.tp-card:hover { border-color: var(--primary-blue, #1E88E5); box-shadow: 0 4px 12px rgba(30, 136, 229, 0.1); }

.tp-card-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}
.tp-card-info { flex: 1; min-width: 0; }
.tp-card-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-dark, #1F2937);
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.tp-card-city {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 500;
  color: #9CA3AF;
}
.tp-card-city i { font-size: 11px; color: var(--accent-teal, #00BCD4); }

.tp-card-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}
.tp-buses-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 700;
  color: #9CA3AF;
  background: #F3F4F6;
  border: 1px solid var(--border-light, #E5E7EB);
  border-radius: 999px;
  padding: 4px 9px;
}
.tp-buses-badge.active {
  color: #166534;
  background: rgba(22, 163, 74, 0.08);
  border-color: rgba(22, 163, 74, 0.2);
}
.tp-chevron {
  color: #D1D5DB;
  font-size: 13px;
}

/* Hours */
.tp-card-hours {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: #9CA3AF;
  padding: 8px 0;
  border-top: 1px solid #F3F4F6;
  border-bottom: 1px solid #F3F4F6;
  margin-bottom: 10px;
}
.tp-card-hours i { font-size: 11px; color: var(--accent-teal, #00BCD4); }

/* Card actions */
.tp-card-actions {
  display: flex;
  gap: 7px;
}
.tp-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1.5px solid var(--border-light, #E5E7EB);
  background: #F5F7FA;
  color: #6B7280;
  border-radius: 9px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.12s ease;
}
.tp-action-btn:active { transform: scale(0.97); }
.tp-action-btn--primary {
  background: linear-gradient(135deg, var(--primary-blue, #1E88E5) 0%, var(--accent-teal, #00BCD4) 100%);
  color: #fff;
  border-color: transparent;
}

/* Empty */
.tp-empty {
  margin-top: 32px;
  text-align: center;
  padding: 28px 16px;
}
.tp-empty-icon {
  width: 48px; height: 48px;
  border-radius: 14px;
  background: rgba(30, 136, 229, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 14px;
  font-size: 18px;
  color: var(--primary-blue, #1E88E5);
}
.tp-empty-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-dark, #1F2937);
  margin-bottom: 4px;
}
.tp-empty-sub {
  font-size: 12px;
  color: #9CA3AF;
  margin-bottom: 16px;
}
.tp-reset-btn {
  border: 1.5px solid var(--border-light, #E5E7EB);
  background: #fff;
  color: var(--text-dark, #1F2937);
  border-radius: 10px;
  padding: 9px 16px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.tp-reset-btn:active { transform: scale(0.97); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>