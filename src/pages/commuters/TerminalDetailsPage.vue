<!-- src/pages/commuters/TerminalDetailsPage.vue -->
<template>
  <div class="td-page">

    <!-- ── Header ── -->
    <div class="td-header">
      <button class="td-back-btn" type="button" @click="goBack">
        <i class="fas fa-chevron-left"></i>
      </button>

      <div class="td-header-body">
        <div class="td-header-name">{{ terminal?.terminal_name || "Terminal" }}</div>
        <div class="td-header-city">
          <i class="fas fa-location-dot"></i>
          {{ terminal?.city || "—" }}
        </div>
      </div>

      <button class="td-refresh-btn" type="button" @click="refreshNow" :disabled="busy">
        <i class="fas fa-rotate" :class="{ 'td-spin': busy }"></i>
      </button>
    </div>

    <!-- ── Stats row ── -->
    <div class="td-stats">
      <div class="td-stat">
        <span class="td-stat-value">{{ insideBuses.length }}</span>
        <span class="td-stat-label">Buses inside</span>
      </div>
      <div class="td-stat-sep"></div>
      <div class="td-stat">
        <span class="td-stat-live">
          <span class="td-live-dot"></span>
          Live
        </span>
        <span class="td-stat-label">Updates every second</span>
      </div>
    </div>

    <!-- ── Actions ── -->
    <div class="td-actions">
      <button
        class="td-btn td-btn--primary"
        type="button"
        @click="viewOnLiveTrack"
        :disabled="!terminalIdNum"
      >
        <i class="fas fa-map-location-dot"></i>
        View on Live Track
      </button>
      <a
        v-if="mapsUrl"
        class="td-btn"
        :href="mapsUrl"
        target="_blank"
        rel="noopener noreferrer"
      >
        <i class="fas fa-map"></i>
        Maps
      </a>
    </div>

    <!-- ── Divider label ── -->
    <div class="td-section-label">
      <span>Buses at this terminal</span>
    </div>

    <!-- ── Bus list ── -->
    <div class="td-list">
      <!-- Empty -->
      <div v-if="insideBuses.length === 0" class="td-empty">
        <div class="td-empty-icon"><i class="fas fa-bus"></i></div>
        <p class="td-empty-title">No buses right now</p>
        <p class="td-empty-sub">Buses in transit will appear on Live Track.</p>
      </div>

      <!-- Rows -->
      <div v-else class="td-rows">
        <div
          v-for="b in insideBuses"
          :key="b.id"
          class="td-row"
          role="button"
          @click="openBusOnTrack(b)"
        >
          <!-- Occ indicator -->
          <div class="td-occ-bar" :class="occClass(b)"></div>

          <!-- Bus info -->
          <div class="td-row-body">
            <div class="td-row-top">
              <span class="td-row-code">{{ b.trackNo || b.bus_code || b.plate_no || `#${b.id}` }}</span>
              <span class="td-row-route">{{ b.route || "Route" }}</span>
            </div>
            <div class="td-row-meta">
              <span class="td-meta-tag" :class="occClass(b)">
                <i class="fas fa-user"></i>
                {{ seatsLabel(b) }}
              </span>
              <span class="td-meta-tag td-meta-tag--soft">
                <i class="fas fa-satellite-dish"></i>
                Sats {{ b.sats ?? "—" }}
              </span>
              <span class="td-meta-tag td-meta-tag--soft">
                HDOP {{ b.hdop ?? "—" }}
              </span>
            </div>
          </div>

          <i class="fas fa-chevron-right td-row-chevron"></i>
        </div>
      </div>

      <div style="height: 20px;"></div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useTerminals } from "@/composables/useTerminal";
import { useLiveBuses } from "@/composables/useLiveBuses";

const route = useRoute();
const router = useRouter();
const { rows, fetchTerminals } = useTerminals();
const { buses, start, stop, fetchOnce } = useLiveBuses({ intervalMs: 1000 });

const busy = ref(false);

const terminalId = computed(() => route.query?.terminalId || "");
const terminalIdNum = computed(() => {
  const n = Number(terminalId.value);
  return Number.isFinite(n) ? n : NaN;
});
const terminals = computed(() => Array.isArray(rows.value) ? rows.value : []);
const terminal = computed(() => terminals.value.find((t) => Number(t.terminal_id) === terminalIdNum.value) || null);

function isAtTerminal(bus) {
  const v = bus?.at_terminal ?? bus?.atTerminal ?? bus?.terminal_state?.at_terminal ?? bus?.terminal_state?.atTerminal ?? bus?.terminal_state?.atTerminalFlag;
  return Number(v) === 1 || v === true;
}
function busCurrentTerminalId(bus) {
  const v = bus?.terminal_state?.current_terminal_id ?? bus?.terminal_state?.currentTerminalId ?? bus?.current_terminal_id ?? bus?.currentTerminalId;
  const n = Number(v); return Number.isFinite(n) ? n : NaN;
}

const insideBuses = computed(() => {
  const tid = terminalIdNum.value;
  if (!Number.isFinite(tid)) return [];
  return (buses.value || []).filter((b) => isAtTerminal(b) && busCurrentTerminalId(b) === tid);
});

function occClass(bus) {
  const cap = Number(bus.capacity ?? 0), used = Number(bus.seats ?? 0);
  if (!cap || cap < 1) return "low";
  const r = Math.max(0, Math.min(1, used / cap));
  if (r >= 0.85) return "full"; if (r >= 0.55) return "mid"; return "low";
}
function seatsLabel(bus) {
  const cap = Number(bus.capacity ?? 0), used = Number(bus.seats ?? 0);
  if (!cap || cap < 1) return "— seats";
  return `${used}/${cap} seats`;
}

const mapsUrl = computed(() => {
  const t = terminal.value; if (!t) return "";
  const lat = Number(t.lat), lng = Number(t.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng)) return `https://www.google.com/maps?q=${lat},${lng}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${t.terminal_name || "Terminal"}, ${t.city || ""}`)}`;
});

function goBack() { router.back(); }
function viewOnLiveTrack() {
  const tid = terminalIdNum.value;
  if (!Number.isFinite(tid)) return;
  router.push({ path: "/track-bus", query: { terminalId: String(tid) } });
}
function openBusOnTrack(bus) {
  const tid = terminalIdNum.value;
  router.push({ path: "/track-bus", query: { terminalId: String(tid) } });
}

async function refreshNow() {
  busy.value = true;
  try { await fetchOnce(); } finally { busy.value = false; }
}
async function loadTerminalInfo() { await fetchTerminals({ q: "" }); await nextTick(); }

watch(() => route.query?.terminalId, async () => { await loadTerminalInfo(); });

onMounted(async () => { await loadTerminalInfo(); start(); await fetchOnce(); });
onUnmounted(() => stop());
</script>

<style scoped>
/* ── Base ── */
.td-page {
  height: calc(100vh - var(--bottom-nav-h, 72px));
  background: #F8F9FB;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ── Header ── */
.td-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px 12px;
  background: #ffffff;
  border-bottom: 1px solid rgba(15, 23, 42, 0.07);
  flex-shrink: 0;
}

.td-back-btn,
.td-refresh-btn {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  border: none;
  background: #F1F5F9;
  color: #0F172A;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  font-size: 13px;
  transition: background 0.15s;
}
.td-back-btn:active,
.td-refresh-btn:active { background: #E2E8F0; transform: scale(0.95); }
.td-refresh-btn:disabled { opacity: 0.35; cursor: not-allowed; }

.td-header-body {
  flex: 1;
  min-width: 0;
}
.td-header-name {
  font-size: 15px;
  font-weight: 800;
  color: #0F172A;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
  letter-spacing: -0.2px;
}
.td-header-city {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 500;
  color: #94A3B8;
  margin-top: 2px;
}
.td-header-city i { font-size: 10px; color: #CBD5E1; }

.td-spin { animation: td-rotate 0.8s linear infinite; }
@keyframes td-rotate { to { transform: rotate(360deg); } }

/* ── Stats row ── */
.td-stats {
  display: flex;
  align-items: center;
  background: #ffffff;
  padding: 14px 18px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  flex-shrink: 0;
}
.td-stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.td-stat-sep {
  width: 1px;
  height: 28px;
  background: #EEF0F4;
  margin: 0 16px;
}
.td-stat-value {
  font-size: 24px;
  font-weight: 800;
  color: #0F172A;
  line-height: 1;
  letter-spacing: -0.5px;
}
.td-stat-live {
  font-size: 13px;
  font-weight: 700;
  color: #15803D;
  display: flex;
  align-items: center;
  gap: 6px;
  line-height: 1;
}
.td-live-dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: #16A34A;
  animation: td-pulse 1.6s ease infinite;
  flex-shrink: 0;
}
@keyframes td-pulse {
  0%   { box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.35); }
  70%  { box-shadow: 0 0 0 7px rgba(22, 163, 74, 0); }
  100% { box-shadow: 0 0 0 0 rgba(22, 163, 74, 0); }
}
.td-stat-label {
  font-size: 11px;
  font-weight: 500;
  color: #94A3B8;
  margin-top: 3px;
}

/* ── Actions ── */
.td-actions {
  display: flex;
  gap: 8px;
  padding: 12px 14px;
  background: #ffffff;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  flex-shrink: 0;
}
.td-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 1px solid #EEF0F4;
  background: #F8F9FB;
  color: #64748B;
  border-radius: 11px;
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.13s ease;
}
.td-btn:active { transform: scale(0.97); }
.td-btn--primary {
  background: #0F172A;
  color: #fff;
  border-color: transparent;
  flex: 2;
  justify-content: center;
}
.td-btn--primary:hover { background: #1E293B; }
.td-btn--primary:disabled { opacity: 0.4; cursor: not-allowed; }

/* ── Section label ── */
.td-section-label {
  padding: 14px 16px 6px;
  flex-shrink: 0;
}
.td-section-label span {
  font-size: 10px;
  font-weight: 700;
  color: #94A3B8;
  text-transform: uppercase;
  letter-spacing: 0.7px;
}

/* ── List ── */
.td-list {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 0 14px;
}
.td-rows {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 2px;
}

/* ── Empty ── */
.td-empty {
  text-align: center;
  padding: 48px 16px;
}
.td-empty-icon {
  width: 48px; height: 48px;
  border-radius: 14px;
  background: #F1F5F9;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 14px;
  font-size: 18px;
  color: #94A3B8;
}
.td-empty-title {
  font-size: 14px;
  font-weight: 700;
  color: #0F172A;
  margin-bottom: 4px;
}
.td-empty-sub {
  font-size: 12px;
  color: #94A3B8;
}

/* ── Bus row ── */
.td-row {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #ffffff;
  border: 1px solid #EEF0F4;
  border-radius: 14px;
  padding: 12px;
  cursor: pointer;
  transition: border-color 0.13s, box-shadow 0.13s;
  overflow: hidden;
  position: relative;
}
.td-row:active { transform: scale(0.99); }
.td-row:hover {
  border-color: #C7DFFE;
  box-shadow: 0 4px 14px rgba(22, 119, 242, 0.07);
}

/* Left color bar */
.td-occ-bar {
  width: 3px;
  height: 40px;
  border-radius: 999px;
  flex-shrink: 0;
}
.td-occ-bar.low  { background: #16A34A; }
.td-occ-bar.mid  { background: #F59E0B; }
.td-occ-bar.full { background: #EF4444; }

.td-row-body { flex: 1; min-width: 0; }
.td-row-top {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 6px;
}
.td-row-code {
  font-size: 13px;
  font-weight: 800;
  color: #0F172A;
  white-space: nowrap;
  letter-spacing: -0.1px;
}
.td-row-route {
  font-size: 12px;
  font-weight: 500;
  color: #94A3B8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.td-row-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.td-meta-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 6px;
  border: 1px solid transparent;
}
.td-meta-tag.low  { color: #15803D; background: #F0FDF4; border-color: #BBF7D0; }
.td-meta-tag.mid  { color: #B45309; background: #FFFBEB; border-color: #FDE68A; }
.td-meta-tag.full { color: #B91C1C; background: #FFF5F5; border-color: #FECACA; }
.td-meta-tag--soft {
  color: #64748B;
  background: #F8F9FB;
  border-color: #EEF0F4;
}

.td-row-chevron {
  color: #CBD5E1;
  font-size: 12px;
  flex-shrink: 0;
}
</style>