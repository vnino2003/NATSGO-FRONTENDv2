<!-- src/pages/commuters/TerminalPage.vue -->
<template>
  <div class="tp-page">

    <!-- ── Header ── -->
    <div class="tp-header" data-tour="terminal-header">
      <div class="tp-header-top">
        <div class="tp-header-title-group">
          <span class="tp-label">Terminals</span>
          <span class="tp-count-pill">{{ filtered.length }}</span>
        </div>
        <button class="tp-icon-btn" type="button" @click="toggleTips" aria-label="Help">
          <i class="fas fa-circle-info"></i>
        </button>
      </div>

      <!-- Search -->
      <div class="tp-search" data-tour="terminal-search">
        <i class="fas fa-magnifying-glass tp-search-icon"></i>
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
          <span>Tap a card to open <b>Details</b>. Use <b>Live Track</b> to open the map.</span>
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
    <div class="tp-list" data-tour="terminal-list">
      <button
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
  background: #F8F9FB;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ── Header ── */
.tp-header {
  padding: 14px 16px 12px;
  background: #ffffff;
  border-bottom: 1px solid rgba(15, 23, 42, 0.07);
  flex-shrink: 0;
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
  font-weight: 800;
  color: #0F172A;
  letter-spacing: -0.4px;
}

.tp-count-pill {
  font-size: 11px;
  font-weight: 700;
  color: #1677F2;
  background: rgba(22, 119, 242, 0.1);
  border-radius: 999px;
  padding: 2px 9px;
}

.tp-icon-btn {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  border: none;
  background: #F1F5F9;
  color: #64748B;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.15s;
}
.tp-icon-btn:active { background: #E2E8F0; }

/* ── Search ── */
.tp-search {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #F8F9FB;
  border: 1px solid #E8ECF0;
  border-radius: 12px;
  padding: 9px 13px;
  margin-bottom: 10px;
  transition: border-color 0.15s;
}
.tp-search:focus-within {
  border-color: #1677F2;
  background: #fff;
}
.tp-search-icon { color: #94A3B8; font-size: 13px; }
.tp-search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 13px;
  font-weight: 500;
  color: #0F172A;
}
.tp-search-input::placeholder { color: #94A3B8; }
.tp-search-clear {
  width: 22px; height: 22px;
  border: none; background: #E8ECF0;
  color: #64748B;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; border-radius: 999px; font-size: 11px;
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
  border: 1px solid #E8ECF0;
  background: transparent;
  border-radius: 999px;
  padding: 5px 13px;
  font-size: 12px;
  font-weight: 600;
  color: #64748B;
  cursor: pointer;
  transition: all 0.13s ease;
  white-space: nowrap;
}
.tp-chip:active { transform: scale(0.97); }
.tp-chip.active {
  background: #0F172A;
  color: #fff;
  border-color: #0F172A;
}

/* ── Tips ── */
.tp-tips {
  margin-top: 10px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  background: #F0F7FF;
  border: 1px solid #C7DFFE;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
  color: #2563EB;
}
.tp-tips i { color: #2563EB; margin-top: 1px; flex-shrink: 0; }

/* ── Notices ── */
.tp-notice {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: #F8F9FB;
  border: 1px solid #E8ECF0;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
  color: #64748B;
}
.tp-notice--error {
  background: #FFF5F5;
  border-color: #FECACA;
  color: #DC2626;
}
.tp-retry {
  margin-left: auto;
  border: 1px solid #FECACA;
  background: transparent;
  color: #DC2626;
  border-radius: 8px;
  padding: 4px 10px;
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
  background: #ffffff;
  border: 1px solid #EEF0F4;
  border-radius: 16px;
  padding: 14px;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
}
.tp-card:active { transform: scale(0.995); box-shadow: none; }
.tp-card:hover {
  border-color: #C7DFFE;
  box-shadow: 0 4px 16px rgba(22, 119, 242, 0.08);
}

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
  color: #0F172A;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: -0.1px;
}
.tp-card-city {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 500;
  color: #94A3B8;
}
.tp-card-city i { font-size: 10px; color: #94A3B8; }

.tp-card-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.tp-buses-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 700;
  color: #94A3B8;
  background: #F8F9FB;
  border: 1px solid #EEF0F4;
  border-radius: 999px;
  padding: 3px 9px;
}
.tp-buses-badge.active {
  color: #15803D;
  background: #F0FDF4;
  border-color: #BBF7D0;
}

.tp-chevron {
  color: #CBD5E1;
  font-size: 12px;
}

/* Hours */
.tp-card-hours {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: #94A3B8;
  padding: 8px 0;
  border-top: 1px solid #F8F9FB;
  border-bottom: 1px solid #F8F9FB;
  margin-bottom: 10px;
}
.tp-card-hours i { font-size: 11px; color: #CBD5E1; }

/* Card actions */
.tp-card-actions {
  display: flex;
  gap: 7px;
}
.tp-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid #EEF0F4;
  background: #F8F9FB;
  color: #64748B;
  border-radius: 10px;
  padding: 8px 13px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.13s ease;
}
.tp-action-btn:active { transform: scale(0.97); }
.tp-action-btn--primary {
  background: #0F172A;
  color: #fff;
  border-color: transparent;
}
.tp-action-btn--primary:hover {
  background: #1E293B;
}

/* Empty */
.tp-empty {
  margin-top: 40px;
  text-align: center;
  padding: 28px 16px;
}
.tp-empty-icon {
  width: 48px; height: 48px;
  border-radius: 14px;
  background: #F1F5F9;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 14px;
  font-size: 18px;
  color: #94A3B8;
}
.tp-empty-title {
  font-size: 14px;
  font-weight: 700;
  color: #0F172A;
  margin-bottom: 4px;
}
.tp-empty-sub {
  font-size: 12px;
  color: #94A3B8;
  margin-bottom: 16px;
}
.tp-reset-btn {
  border: 1px solid #E8ECF0;
  background: #fff;
  color: #0F172A;
  border-radius: 10px;
  padding: 9px 18px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.tp-reset-btn:active { transform: scale(0.97); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>