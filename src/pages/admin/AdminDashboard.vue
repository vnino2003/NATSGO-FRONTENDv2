<!-- src/pages/admin/AdminDashboard.vue -->
<template>
  <div class="dash">

    <!-- ── Header ── -->
    <div class="dash-header">
      <div class="dash-header-left">
        <div class="dash-title-row">
          <h1 class="dash-title">Operations Dashboard</h1>
          <span class="dash-live-badge">
            <span class="dash-live-dot"></span>
            Live
          </span>
        </div>
        <p class="dash-subtitle">
          Real-time overview of buses, devices, terminals, and system health
        </p>
      </div>

      <div class="dash-header-right">
        <span class="dash-updated">
          <i class="fas fa-clock"></i>
          {{ lastUpdatedLabel }}
        </span>

        <button class="dash-btn-ghost" @click="refresh" :disabled="loading">
          <i class="fas fa-rotate" :class="{ 'fa-spin': loading }"></i>
          Refresh
        </button>
      </div>
    </div>

    <!-- ── State ── -->
    <div v-if="loading && !hasData" class="dash-state-row">
      <i class="fas fa-circle-notch fa-spin"></i>
      Loading dashboard data…
    </div>

    <div v-if="error" class="dash-state-row dash-state-error">
      <i class="fas fa-triangle-exclamation"></i>
      {{ error }}
    </div>

    <!-- ── KPI Cards ── -->
    <div class="dash-kpi-grid">

      <div class="dash-kpi" @click="go('/admin/buses')">
        <div class="dash-kpi-top">
          <span class="dash-kpi-label">Active Buses</span>
          <span class="dash-tag dash-tag-green">
            <i class="fas fa-wifi"></i>
            Live
          </span>
        </div>

        <div class="dash-kpi-val">{{ stats.onlineBuses }}</div>

        <div class="dash-kpi-sub">
          <i class="fas fa-bus"></i>
          {{ stats.totalBuses }} total in fleet
        </div>

        <div class="dash-kpi-ico dash-ico-blue">
          <i class="fas fa-bus"></i>
        </div>
      </div>

      <div class="dash-kpi" @click="go('/admin/buses')">
        <div class="dash-kpi-top">
          <span class="dash-kpi-label">Passengers</span>
          <span class="dash-tag dash-tag-blue">
            <i class="fas fa-users"></i>
            Current
          </span>
        </div>

        <div class="dash-kpi-val">{{ stats.totalPassengers }}</div>

        <div class="dash-kpi-sub">
          <i class="fas fa-circle-info"></i>
          Total passengers across all active buses
        </div>

        <div class="dash-kpi-ico dash-ico-teal">
          <i class="fas fa-user-group"></i>
        </div>
      </div>

      <div class="dash-kpi" @click="go('/admin/terminals')">
        <div class="dash-kpi-top">
          <span class="dash-kpi-label">Terminals</span>
          <span class="dash-tag dash-tag-teal">
            <i class="fas fa-location-dot"></i>
            Listed
          </span>
        </div>

        <div class="dash-kpi-val">{{ terminals.length }}</div>

        <div class="dash-kpi-sub">
          <i class="fas fa-building"></i>
          {{ stats.busesAtTerminal }} bus(es) docked
        </div>

        <div class="dash-kpi-ico dash-ico-purple">
          <i class="fas fa-building"></i>
        </div>
      </div>

      <div class="dash-kpi dash-kpi--warn" @click="go('/admin/alerts')">
        <div class="dash-kpi-top">
          <span class="dash-kpi-label">Alerts</span>
          <span class="dash-tag dash-tag-amber">
            <i class="fas fa-triangle-exclamation"></i>
            Attention
          </span>
        </div>

        <div class="dash-kpi-val">{{ alerts.length }}</div>

        <div class="dash-kpi-sub">
          <i class="fas fa-eye"></i>
          {{ stats.deviceWarnings }} device warning(s)
        </div>

        <div class="dash-kpi-ico dash-ico-amber">
          <i class="fas fa-bell"></i>
        </div>
      </div>

    </div>

    <!-- ── Main Grid ── -->
    <div class="dash-main-grid">

      <!-- ── LEFT COLUMN ── -->
      <div class="dash-left">

        <!-- Quick Actions -->
        <div class="dash-card">
          <div class="dash-card-head">
            <i class="fas fa-bolt dash-card-ico"></i>
            <span>Quick Actions</span>
            <span class="dash-chip">
              <i class="fas fa-shield-halved"></i>
              Admin
            </span>
          </div>

          <div class="dash-quick-grid">
            <button class="dash-quick" @click="go('/admin/buses')">
              <div class="dash-quick-ico dash-ico-blue">
                <i class="fas fa-bus"></i>
              </div>
              <span>Buses</span>
            </button>

            <button class="dash-quick" @click="go('/admin/iot/devices')">
              <div class="dash-quick-ico dash-ico-teal">
                <i class="fas fa-microchip"></i>
              </div>
              <span>Devices</span>
            </button>

            <button class="dash-quick" @click="go('/admin/terminals')">
              <div class="dash-quick-ico dash-ico-purple">
                <i class="fas fa-building"></i>
              </div>
              <span>Terminals</span>
            </button>

            <button class="dash-quick" @click="go('/admin/live')">
              <div class="dash-quick-ico dash-ico-green">
                <i class="fas fa-map-location-dot"></i>
              </div>
              <span>Live Track</span>
            </button>

            <button class="dash-quick" @click="go('/admin/fare-promos')">
              <div class="dash-quick-ico dash-ico-amber">
                <i class="fas fa-peso-sign"></i>
              </div>
              <span>Fare Matrix</span>
            </button>

            <button class="dash-quick" @click="go('/admin/announcements-alert')">
              <div class="dash-quick-ico dash-ico-red">
                <i class="fas fa-megaphone"></i>
              </div>
              <span>Announcements</span>
            </button>
          </div>
        </div>

        <!-- Route Load Summary -->
      <!-- Route Load Summary -->
<div class="dash-card">
  <div class="dash-card-head">
    <i class="fas fa-route dash-card-ico"></i>
    <span>Route Load Summary</span>

    <span class="dash-chip">
      <i class="fas fa-users"></i>
      Live Load
    </span>
  </div>

  <div class="dash-route-summary-sub">
    Current passenger load grouped by route. Passenger count is the total inside buses that are online or at terminal.
  </div>

  <div v-if="routeLoads.length === 0" class="dash-empty-inline">
    <i class="fas fa-circle-info"></i>
    No route load data yet
  </div>

  <div v-else class="dash-route-grid">
    <div
      v-for="route in routeLoads"
      :key="route.key"
      class="dash-route-card"
    >
      <div class="dash-route-top">
        <div>
          <div class="dash-route-name">
            {{ route.from }}
            <i class="fas fa-arrow-right"></i>
            {{ route.to }}

            <span
              v-if="route.offlineBuses > 0"
              class="dash-route-offline-badge"
            >
              Offline
            </span>
          </div>

          <div class="dash-route-meta">
            {{ route.totalBuses }} bus(es) assigned on this route
          </div>
        </div>

        <span class="dash-tag" :class="route.statusClass">
          {{ route.statusText }}
        </span>
      </div>

      <div class="dash-route-stats">
        <div class="dash-route-stat">
          <div class="dash-route-stat-val">
            {{ route.totalPassengers }}
          </div>
          <div class="dash-route-stat-lbl">
            Total passengers
          </div>
        </div>

        <div class="dash-route-stat">
          <div class="dash-route-stat-val dash-val-teal">
            {{ route.atTerminalBuses }}
          </div>
          <div class="dash-route-stat-lbl">
            At terminal
          </div>
        </div>

        <div class="dash-route-stat">
          <div class="dash-route-stat-val dash-val-blue">
            {{ route.enRouteBuses }}
          </div>
          <div class="dash-route-stat-lbl">
            En route
          </div>
        </div>

        <div class="dash-route-stat">
          <div
            class="dash-route-stat-val"
            :class="route.offlineBuses > 0 ? 'dash-val-red' : ''"
          >
            {{ route.offlineBuses }}
          </div>
          <div class="dash-route-stat-lbl">
            Offline
          </div>
        </div>
      </div>

      <div class="dash-route-bottom-row">
        <div>
          <div class="dash-route-small-label">Average load</div>
          <div class="dash-route-small-value">
            {{ route.averagePassengers }} passengers / active bus
          </div>
        </div>

        <div>
          <div class="dash-route-small-label">Full / crowded</div>
          <div
            class="dash-route-small-value"
            :class="route.fullBuses > 0 ? 'dash-val-amber' : ''"
          >
            {{ route.fullBuses }} bus(es)
          </div>
        </div>
      </div>

      <div class="dash-route-bar">
        <div
          class="dash-route-bar-fill"
          :class="route.barClass"
          :style="{ width: route.loadPercent + '%' }"
        ></div>
      </div>

      <div class="dash-route-foot">
        <span>{{ route.loadPercent }}% estimated load</span>

        <button class="dash-link-btn" @click="go('/admin/live')">
          Track route →
        </button>
      </div>
    </div>
  </div>
</div>
        <!-- Live Operations Panel -->
        <div class="dash-card">
          <div class="dash-card-head">
            <i class="fas fa-map-signs dash-card-ico"></i>
            <span>Live Operations</span>

            <button class="dash-head-btn" @click="go('/admin/live')">
              <i class="fas fa-arrow-up-right-from-square"></i>
              Track
            </button>
          </div>

          <div class="dash-bar-row">
            <span class="dash-bar-lbl">At Terminal</span>
            <div class="dash-bar-track">
              <div
                class="dash-bar-fill dash-bar-teal"
                :style="{ width: pct(stats.busesAtTerminal, stats.totalBuses) + '%' }"
              ></div>
            </div>
            <span class="dash-tag dash-tag-teal">{{ stats.busesAtTerminal }}</span>
          </div>

          <div class="dash-bar-row">
            <span class="dash-bar-lbl">En Route</span>
            <div class="dash-bar-track">
              <div
                class="dash-bar-fill dash-bar-blue"
                :style="{ width: pct(stats.busesEnRoute, stats.totalBuses) + '%' }"
              ></div>
            </div>
            <span class="dash-tag dash-tag-blue">{{ stats.busesEnRoute }}</span>
          </div>

          <div class="dash-bar-row">
            <span class="dash-bar-lbl">Offline / No Signal</span>
            <div class="dash-bar-track">
              <div
                class="dash-bar-fill dash-bar-red"
                :style="{ width: pct(stats.offlineBuses, stats.totalBuses) + '%' }"
              ></div>
            </div>
            <span class="dash-tag dash-tag-red">{{ stats.offlineBuses }}</span>
          </div>

          <div class="dash-bar-row">
            <span class="dash-bar-lbl">No Device</span>
            <div class="dash-bar-track">
              <div
                class="dash-bar-fill dash-bar-red"
                :style="{ width: pct(stats.noDeviceBuses, stats.totalBuses) + '%' }"
              ></div>
            </div>
            <span class="dash-tag dash-tag-red">{{ stats.noDeviceBuses }}</span>
          </div>

          <div class="dash-bar-row">
            <span class="dash-bar-lbl">Full / Crowded</span>
            <div class="dash-bar-track">
              <div
                class="dash-bar-fill dash-bar-amber"
                :style="{ width: pct(stats.fullBuses, stats.totalBuses) + '%' }"
              ></div>
            </div>
            <span class="dash-tag dash-tag-amber">{{ stats.fullBuses }}</span>
          </div>
        </div>

      </div>

      <!-- ── RIGHT COLUMN ── -->
      <div class="dash-right">

        <!-- Device Health -->
        <div class="dash-card">
          <div class="dash-card-head">
            <i class="fas fa-microchip dash-card-ico"></i>
            <span>Device Health</span>

            <button class="dash-head-btn" @click="go('/admin/iot/devices')">
              <i class="fas fa-arrow-up-right-from-square"></i>
              Devices
            </button>
          </div>

          <div class="dash-health-mini">
            <div class="dash-mini-box">
              <div class="dash-mini-val dash-val-green">{{ stats.activeDevices }}</div>
              <div class="dash-mini-lbl">Online</div>
            </div>

            <div class="dash-mini-box">
              <div class="dash-mini-val dash-val-red">{{ stats.offlineDevices }}</div>
              <div class="dash-mini-lbl">Offline</div>
            </div>

            <div class="dash-mini-box">
              <div class="dash-mini-val dash-val-amber">{{ stats.deviceWarnings }}</div>
              <div class="dash-mini-lbl">Warnings</div>
            </div>
          </div>

          <div class="dash-bar-row">
            <span class="dash-bar-lbl">Online</span>
            <div class="dash-bar-track">
              <div
                class="dash-bar-fill dash-bar-green"
                :style="{ width: pct(stats.activeDevices, stats.totalDevices) + '%' }"
              ></div>
            </div>
            <span class="dash-tag dash-tag-green">{{ stats.activeDevices }}</span>
          </div>

          <div class="dash-bar-row">
            <span class="dash-bar-lbl">GPS Issues</span>
            <div class="dash-bar-track">
              <div
                class="dash-bar-fill dash-bar-amber"
                :style="{ width: pct(stats.gpsIssues, stats.totalDevices) + '%' }"
              ></div>
            </div>
            <span class="dash-tag dash-tag-amber">{{ stats.gpsIssues }}</span>
          </div>

          <div class="dash-bar-row">
            <span class="dash-bar-lbl">Sensor Faults</span>
            <div class="dash-bar-track">
              <div
                class="dash-bar-fill dash-bar-red"
                :style="{ width: pct(stats.sensorWarnings, stats.totalDevices) + '%' }"
              ></div>
            </div>
            <span class="dash-tag dash-tag-red">{{ stats.sensorWarnings }}</span>
          </div>

          <div class="dash-bar-row">
            <span class="dash-bar-lbl">Unassigned</span>
            <div class="dash-bar-track">
              <div
                class="dash-bar-fill dash-bar-red"
                :style="{ width: pct(stats.unassignedDevices, stats.totalDevices) + '%' }"
              ></div>
            </div>
            <span class="dash-tag dash-tag-red">{{ stats.unassignedDevices }}</span>
          </div>
        </div>

        <!-- Terminal Overview -->
        <div class="dash-card">
          <div class="dash-card-head">
            <i class="fas fa-building dash-card-ico"></i>
            <span>Terminal Overview</span>

            <button class="dash-head-btn" @click="go('/admin/terminals')">
              <i class="fas fa-arrow-up-right-from-square"></i>
              Manage
            </button>
          </div>

          <div v-if="terminals.length === 0" class="dash-empty-inline">
            <i class="fas fa-building"></i>
            No terminals found
          </div>

          <div v-for="(term, index) in terminals" :key="term.id">
            <div
              class="dash-terminal-row dash-terminal-row--clickable"
              @click="go(`/admin/terminals/${term.id}`)"
            >
              <div class="dash-terminal-left">
                <div class="dash-terminal-ico">
                  <i class="fas fa-building"></i>
                </div>

                <div>
                  <div class="dash-terminal-name">{{ term.name }}</div>
                  <div class="dash-terminal-sub">{{ term.city }}</div>
                  <div class="dash-terminal-meta">
                    <i class="fas fa-clock"></i>
                    {{ term.operating_hours || "—" }}
                  </div>
                </div>
              </div>

              <div class="dash-terminal-right">
                <span class="dash-tag dash-tag-teal">
                  {{ term.buses_inside }} buses
                </span>
                <span class="dash-tag dash-tag-green" style="margin-top:4px">
                  Active
                </span>
              </div>
            </div>

            <div v-if="index !== terminals.length - 1" class="dash-divider"></div>
          </div>
        </div>

        <!-- Active Alerts -->
        <div class="dash-card">
          <div class="dash-card-head">
            <i class="fas fa-bell dash-card-ico"></i>
            <span>Active Alerts</span>

            <button class="dash-head-btn" @click="go('/admin/alerts')">
              Manage
            </button>
          </div>

          <div v-if="alerts.length === 0" class="dash-empty-inline">
            <i class="fas fa-circle-check" style="color:var(--green)"></i>
            No active alerts — all systems normal
          </div>

          <div v-for="a in alerts.slice(0, 5)" :key="a.id" class="dash-alert-row">
            <div class="dash-alert-ico" :class="`dash-alert-${a.severity}`">
              <i class="fas" :class="a.icon"></i>
            </div>

            <div class="dash-alert-body">
              <div class="dash-alert-title">{{ a.title }}</div>
              <div class="dash-alert-sub">{{ a.sub }}</div>
              <small class="dash-alert-time">{{ timeAgo(a.time_at) }}</small>
            </div>

            <span class="dash-tag" :class="severityTagClass(a.severity)">
              {{ a.severity === "critical" ? "Urgent" : a.severity === "warning" ? "Warning" : "Info" }}
            </span>
          </div>
        </div>

   
      </div>
    </div>

    <!-- ── Bottom Row: Commuter Info + Activity ── -->
    <div class="dash-bottom-grid">

      <!-- Commuter Info -->
      <div class="dash-card">
        <div class="dash-card-head">
          <i class="fas fa-newspaper dash-card-ico"></i>
          <span>Commuter Information</span>
        </div>

        <div class="dash-info-tiles">
          <div class="dash-info-tile">
            <div class="dash-info-tile-val">
              ₱{{ fareInfo.baseFare }}
            </div>
            <div class="dash-info-tile-lbl">Base Fare</div>
            <button class="dash-link-btn" @click="go('/admin/fare-promos')">
              Manage Fares →
            </button>
          </div>

          <div class="dash-info-tile">
            <div class="dash-info-tile-val dash-val-green">
              {{ fareInfo.activePromotions }}
            </div>
            <div class="dash-info-tile-lbl">Promotions</div>
            <button class="dash-link-btn" @click="go('/admin/fare-promos')">
              View →
            </button>
          </div>

          <div class="dash-info-tile">
            <div class="dash-info-tile-val">
              {{ commuterInfo.announcements }}
            </div>
            <div class="dash-info-tile-lbl">Announcements</div>
            <button class="dash-link-btn" @click="go('/admin/announcements-alert')">
              Manage →
            </button>
          </div>

          <div class="dash-info-tile">
            <div
              class="dash-info-tile-val"
              :class="commuterInfo.alertTickers > 0 ? 'dash-val-amber' : ''"
            >
              {{ commuterInfo.alertTickers }}
            </div>
            <div class="dash-info-tile-lbl">Alert Tickers</div>
            <button class="dash-link-btn" @click="go('/admin/announcements-alert')">
              Manage →
            </button>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="dash-card">
        <div class="dash-card-head">
          <i class="fas fa-clock-rotate-left dash-card-ico"></i>
          <span>Recent Activity</span>
        </div>

        <div v-if="activity.length === 0" class="dash-empty-inline">
          <i class="fas fa-circle-info"></i>
          No recent activity yet
        </div>

        <div v-for="ev in activity" :key="ev.id" class="dash-act-row">
          <div class="dash-act-ico" :class="`dash-act-${ev.color}`">
            <i class="fas" :class="ev.icon"></i>
          </div>

          <div class="dash-act-body">
            <div class="dash-act-lbl">{{ ev.label }}</div>
            <div class="dash-act-sub">{{ ev.sub }}</div>
          </div>

          <span class="dash-act-time">{{ timeAgo(ev.time_at) }}</span>
        </div>
      </div>

    </div>

  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useDashboard } from "@/composables/useDashboard";

const router = useRouter();

const dashboard = useDashboard();

const {
  stats,
  terminals,
  alerts,
  activity,
  fareInfo,
  commuterInfo,
  generatedAt,
  loading,
  error,
  fetchDashboard,
} = dashboard;

const hasData = computed(() => {
  return (
    stats.value.totalBuses > 0 ||
    stats.value.totalDevices > 0 ||
    terminals.value.length > 0
  );
});

const lastUpdatedLabel = computed(() => {
  if (!generatedAt.value) return "Not yet refreshed";

  const dt = new Date(generatedAt.value);
  if (Number.isNaN(dt.getTime())) return "Not yet refreshed";

  const s = Math.floor((Date.now() - dt.getTime()) / 1000);

  if (s < 10) return "Updated just now";
  if (s < 60) return `Updated ${s}s ago`;
  if (s < 3600) return `Updated ${Math.floor(s / 60)}m ago`;
  return `Updated ${Math.floor(s / 3600)}h ago`;
});

const routeLoads = computed(() => {
  const raw = dashboard.routeLoadSummary?.value || [];

  return raw.map((r, index) => {
    const from = r.from || r.from_location || r.origin || "Unknown";
    const to = r.to || r.to_location || r.destination || "Unknown";

    const totalBuses = Number(r.totalBuses ?? r.total_buses ?? r.bus_count ?? 0);
    const atTerminalBuses = Number(r.atTerminalBuses ?? r.at_terminal_buses ?? 0);
    const enRouteBuses = Number(r.enRouteBuses ?? r.en_route_buses ?? 0);
    const offlineBuses = Number(r.offlineBuses ?? r.offline_buses ?? 0);

    const activeBuses = atTerminalBuses + enRouteBuses;

    const totalPassengers = Number(
      r.totalPassengers ?? r.total_passengers ?? r.passengers ?? 0
    );

    const fullBuses = Number(
      r.fullBuses ?? r.full_buses ?? r.crowded_buses ?? 0
    );

    const averagePassengers =
      activeBuses > 0
        ? Math.round((totalPassengers / activeBuses) * 10) / 10
        : 0;

    const capacity = Number(
      r.capacity ?? r.total_capacity ?? activeBuses * 30
    );

    const loadPercent =
      capacity > 0
        ? Math.min(100, Math.round((totalPassengers / capacity) * 100))
        : 0;

    let statusText = "Normal";
    let statusClass = "dash-tag-green";
    let barClass = "dash-bar-green";

    if (offlineBuses > 0) {
      statusText = "Needs Check";
      statusClass = "dash-tag-red";
      barClass = "dash-bar-red";
    } else if (loadPercent >= 85 || fullBuses > 0) {
      statusText = "Crowded";
      statusClass = "dash-tag-amber";
      barClass = "dash-bar-amber";
    }

    if (loadPercent >= 100) {
      statusText = "Full";
      statusClass = "dash-tag-red";
      barClass = "dash-bar-red";
    }

    return {
      key: r.key || `${from}-${to}-${index}`,
      from,
      to,
      totalBuses,
      atTerminalBuses,
      enRouteBuses,
      offlineBuses,
      activeBuses,
      totalPassengers,
      averagePassengers,
      fullBuses,
      loadPercent,
      statusText,
      statusClass,
      barClass,
    };
  });
});

function pct(n, total) {
  const a = Number(n) || 0;
  const b = Number(total) || 0;

  if (b <= 0) return 0;
  return Math.min(100, Math.round((a / b) * 100));
}

function timeAgo(dateLike) {
  if (!dateLike) return "—";

  const dt = new Date(dateLike);
  if (Number.isNaN(dt.getTime())) return "—";

  const s = Math.floor((Date.now() - dt.getTime()) / 1000);

  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function severityTagClass(s) {
  if (s === "critical") return "dash-tag-red";
  if (s === "warning") return "dash-tag-amber";
  return "dash-tag-blue";
}

function go(path) {
  router.push(path);
}

async function refresh() {
  try {
    await fetchDashboard();
  } catch {
    // error is handled by composable
  }
}

let poll = null;

onMounted(async () => {
  await refresh();
  poll = setInterval(refresh, 6000);
});

onBeforeUnmount(() => {
  if (poll) clearInterval(poll);
});
</script>

<style scoped>
/* ─── Tokens ─────────────────────────────── */
.dash {
  --green:   #10b981;
  --amber:   #f59e0b;
  --red:     #ef4444;
  --blue:    #3b82f6;
  --teal:    #14b8a6;
  --purple:  #8b5cf6;
  --border:  rgba(226,232,240,1);
  --bg:      #f8fafc;
  --card:    #ffffff;
  --text:    #0f172a;
  --muted:   #64748b;
  --radius:  14px;

  font-family: 'DM Sans', 'Segoe UI', sans-serif;
  background: var(--bg);
  padding: 24px;
  min-height: 100vh;
  color: var(--text);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ─── Header ─────────────────────────────── */
.dash-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.dash-header-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.dash-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.dash-title {
  font-size: 24px;
  font-weight: 900;
  letter-spacing: -0.8px;
  margin: 0;
}

.dash-subtitle {
  font-size: 12px;
  color: var(--muted);
  margin: 4px 0 0;
}

.dash-live-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  background: rgba(16,185,129,.1);
  color: var(--green);
}

.dash-live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  animation: pulse 1.4s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: .4; transform: scale(.8); }
}

.dash-updated {
  font-size: 11px;
  color: var(--muted);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 5px;
}

/* ─── State ──────────────────────────────── */
.dash-state-row {
  font-size: 13px;
  color: var(--muted);
  display: flex;
  align-items: center;
  gap: 8px;
}

.dash-state-error {
  color: var(--red);
}

/* ─── KPI Grid ───────────────────────────── */
.dash-kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.dash-kpi {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: border-color .15s, box-shadow .15s, transform .15s;
}

.dash-kpi:hover {
  border-color: #94a3b8;
  box-shadow: 0 4px 12px rgba(0,0,0,.05);
  transform: translateY(-1px);
}

.dash-kpi--warn {
  border-color: rgba(245,158,11,.25);
  background: linear-gradient(160deg, rgba(245,158,11,.04), #fff 60%);
}

.dash-kpi-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
}

.dash-kpi-label {
  font-size: 11px;
  font-weight: 800;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: .5px;
}

.dash-kpi-val {
  font-size: 30px;
  font-weight: 900;
  letter-spacing: -1px;
  line-height: 1;
}

.dash-kpi-sub {
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.dash-kpi-ico {
  position: absolute;
  right: 14px;
  bottom: 12px;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  opacity: .18;
}

/* ─── Main Grid ──────────────────────────── */
.dash-main-grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 16px;
  align-items: start;
}

.dash-left,
.dash-right {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ─── Cards ──────────────────────────────── */
.dash-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}

.dash-card--tip {
  border-style: dashed;
  border-color: rgba(20,184,166,.3);
  background: rgba(20,184,166,.03);
}

.dash-card-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 13px 16px;
  border-bottom: 1px solid var(--border);
  font-size: 13px;
  font-weight: 700;
  background: #f8fafc;
}

.dash-card-ico {
  font-size: 12px;
  color: var(--muted);
}

.dash-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  background: rgba(20,184,166,.08);
  border: 1px solid rgba(20,184,166,.2);
  color: var(--teal);
  margin-left: auto;
}

.dash-head-btn {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 26px;
  padding: 0 10px;
  border-radius: 7px;
  border: 1px solid var(--border);
  background: var(--card);
  font-size: 11px;
  font-weight: 700;
  color: var(--muted);
  cursor: pointer;
  font-family: inherit;
  transition: all .15s;
}

.dash-head-btn:hover {
  color: var(--text);
  border-color: #94a3b8;
}

/* ─── Quick Actions ──────────────────────── */
.dash-quick-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 10px;
  padding: 14px;
}

.dash-quick {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  padding: 14px 6px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  cursor: pointer;
  transition: all .15s;
  font-family: inherit;
  font-size: 11px;
  font-weight: 700;
  color: var(--text);
}

.dash-quick:hover {
  border-color: #94a3b8;
  background: #f1f5f9;
}

.dash-quick-ico {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  font-size: 14px;
}
/* ─── Route Load Summary ─────────────────── */
.dash-route-summary-sub {
  padding: 12px 16px 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
  line-height: 1.5;
}

.dash-route-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 14px;
}

.dash-route-card {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 14px;
  transition: border-color .15s, background .15s;
}

.dash-route-card:hover {
  border-color: #94a3b8;
  background: #f1f5f9;
}

.dash-route-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
}

.dash-route-name {
  font-size: 14px;
  font-weight: 900;
  letter-spacing: -0.2px;
  display: flex;
  align-items: center;
  gap: 7px;
  flex-wrap: wrap;
}

.dash-route-name i {
  font-size: 10px;
  color: var(--muted);
}

.dash-route-offline-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(239,68,68,.08);
  color: #991b1b;
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: .3px;
}

.dash-route-meta {
  margin-top: 4px;
  font-size: 11px;
  font-weight: 700;
  color: var(--muted);
}

.dash-route-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-top: 14px;
}

.dash-route-stat {
  background: #fff;
  border: 1px solid rgba(226,232,240,.85);
  border-radius: 10px;
  padding: 10px;
}

.dash-route-stat-val {
  font-size: 19px;
  font-weight: 900;
  letter-spacing: -0.5px;
}

.dash-route-stat-lbl {
  margin-top: 2px;
  font-size: 10px;
  font-weight: 700;
  color: var(--muted);
  line-height: 1.2;
}

.dash-route-bottom-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 12px;
  padding: 10px;
  background: #fff;
  border: 1px solid rgba(226,232,240,.85);
  border-radius: 10px;
}

.dash-route-small-label {
  font-size: 10px;
  font-weight: 800;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: .3px;
}

.dash-route-small-value {
  margin-top: 3px;
  font-size: 12px;
  font-weight: 800;
  color: var(--text);
}

.dash-route-bar {
  height: 6px;
  background: #e2e8f0;
  border-radius: 99px;
  overflow: hidden;
  margin-top: 12px;
}

.dash-route-bar-fill {
  height: 100%;
  border-radius: 99px;
  transition: width .5s ease;
}

.dash-route-foot {
  margin-top: 9px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 11px;
  font-weight: 700;
  color: var(--muted);
}

.dash-val-blue {
  color: var(--blue);
}

.dash-val-teal {
  color: var(--teal);
}
/* ─── Bar rows ───────────────────────────── */
.dash-bar-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-bottom: 1px solid rgba(226,232,240,.5);
}

.dash-bar-row:last-child {
  border-bottom: none;
}

.dash-bar-lbl {
  font-size: 12px;
  color: var(--muted);
  font-weight: 600;
  width: 130px;
  flex-shrink: 0;
}

.dash-bar-track {
  flex: 1;
  height: 5px;
  background: #e2e8f0;
  border-radius: 99px;
  overflow: hidden;
}

.dash-bar-fill {
  height: 100%;
  border-radius: 99px;
  transition: width .5s ease;
}

.dash-bar-green { background: var(--green); }
.dash-bar-red   { background: var(--red); }
.dash-bar-amber { background: var(--amber); }
.dash-bar-blue  { background: var(--blue); }
.dash-bar-teal  { background: var(--teal); }

/* ─── Tags ───────────────────────────────── */
.dash-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

.dash-tag-green { background: rgba(16,185,129,.1); color: #065f46; }
.dash-tag-red { background: rgba(239,68,68,.08); color: #991b1b; }
.dash-tag-amber { background: rgba(245,158,11,.1); color: #78350f; }
.dash-tag-blue { background: rgba(59,130,246,.1); color: #1e3a8a; }
.dash-tag-teal { background: rgba(20,184,166,.1); color: #0f766e; }

/* ─── Icon colors ────────────────────────── */
.dash-ico-blue { background: rgba(59,130,246,.08); color: var(--blue); }
.dash-ico-green { background: rgba(16,185,129,.08); color: var(--green); }
.dash-ico-red { background: rgba(239,68,68,.08); color: var(--red); }
.dash-ico-amber { background: rgba(245,158,11,.08); color: var(--amber); }
.dash-ico-teal { background: rgba(20,184,166,.08); color: var(--teal); }
.dash-ico-purple { background: rgba(139,92,246,.08); color: var(--purple); }

/* ─── Value colors ───────────────────────── */
.dash-val-green { color: var(--green); }
.dash-val-red { color: var(--red); }
.dash-val-amber { color: var(--amber); }

/* ─── Health mini ────────────────────────── */
.dash-health-mini {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding: 14px;
  border-bottom: 1px solid var(--border);
}

.dash-mini-box {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px;
  text-align: center;
}

.dash-mini-val {
  font-size: 22px;
  font-weight: 900;
  letter-spacing: -0.5px;
}

.dash-mini-lbl {
  font-size: 10px;
  font-weight: 700;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: .4px;
  margin-top: 4px;
}

/* ─── Terminal rows ──────────────────────── */
.dash-terminal-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
}

.dash-terminal-row--clickable {
  cursor: pointer;
  transition: background .12s;
}

.dash-terminal-row--clickable:hover {
  background: #f8fafc;
}

.dash-terminal-left {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.dash-terminal-ico {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(139,92,246,.08);
  color: var(--purple);
  display: grid;
  place-items: center;
  font-size: 14px;
  flex-shrink: 0;
}

.dash-terminal-name {
  font-size: 13px;
  font-weight: 700;
}

.dash-terminal-sub {
  font-size: 11px;
  color: var(--muted);
  margin-top: 2px;
}

.dash-terminal-meta {
  font-size: 11px;
  color: var(--muted);
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.dash-terminal-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.dash-divider {
  height: 1px;
  background: var(--border);
  margin: 0 16px;
}

/* ─── Alerts ─────────────────────────────── */
.dash-alert-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 11px 16px;
  border-bottom: 1px solid rgba(226,232,240,.5);
  transition: background .12s;
}

.dash-alert-row:last-child {
  border-bottom: none;
}

.dash-alert-row:hover {
  background: #f8fafc;
}

.dash-alert-ico {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  font-size: 11px;
  flex-shrink: 0;
}

.dash-alert-critical { background: rgba(239,68,68,.08); color: var(--red); }
.dash-alert-warning { background: rgba(245,158,11,.1); color: var(--amber); }
.dash-alert-info { background: rgba(59,130,246,.1); color: var(--blue); }

.dash-alert-body {
  flex: 1;
}

.dash-alert-title {
  font-size: 12px;
  font-weight: 700;
}

.dash-alert-sub {
  font-size: 11px;
  color: var(--muted);
  margin-top: 2px;
}

.dash-alert-time {
  display: block;
  font-size: 10px;
  color: var(--muted);
  margin-top: 3px;
}

/* ─── Activity ───────────────────────────── */
.dash-act-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-bottom: 1px solid rgba(226,232,240,.5);
  transition: background .12s;
}

.dash-act-row:last-child {
  border-bottom: none;
}

.dash-act-row:hover {
  background: #f8fafc;
}

.dash-act-ico {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  font-size: 11px;
  flex-shrink: 0;
}

.dash-act-green { background: rgba(16,185,129,.1); color: var(--green); }
.dash-act-blue { background: rgba(59,130,246,.1); color: var(--blue); }
.dash-act-amber { background: rgba(245,158,11,.1); color: var(--amber); }
.dash-act-red { background: rgba(239,68,68,.08); color: var(--red); }
.dash-act-teal { background: rgba(20,184,166,.1); color: var(--teal); }

.dash-act-body {
  flex: 1;
}

.dash-act-lbl {
  font-size: 12px;
  font-weight: 700;
}

.dash-act-sub {
  font-size: 11px;
  color: var(--muted);
}

.dash-act-time {
  font-size: 10px;
  color: var(--muted);
  font-weight: 600;
  white-space: nowrap;
}

/* ─── Bottom grid ────────────────────────── */
.dash-bottom-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

/* ─── Commuter Info tiles ────────────────── */
.dash-info-tiles {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  padding: 14px;
}

.dash-info-tile {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 14px;
}

.dash-info-tile-val {
  font-size: 20px;
  font-weight: 900;
  letter-spacing: -0.5px;
}

.dash-info-tile-lbl {
  font-size: 11px;
  color: var(--muted);
  font-weight: 600;
  margin-top: 3px;
}

.dash-link-btn {
  background: none;
  border: none;
  padding: 0;
  font-size: 11px;
  font-weight: 700;
  color: var(--blue);
  cursor: pointer;
  margin-top: 8px;
  display: block;
  font-family: inherit;
  transition: opacity .15s;
}

.dash-link-btn:hover {
  opacity: .7;
}

/* ─── Tip panel ──────────────────────────── */
.dash-tip-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 14px 16px;
}

.dash-tip-ico {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: rgba(20,184,166,.1);
  border: 1px solid rgba(20,184,166,.2);
  color: var(--teal);
  display: grid;
  place-items: center;
  font-size: 14px;
  flex-shrink: 0;
}

.dash-tip-title {
  font-size: 13px;
  font-weight: 700;
}

.dash-tip-sub {
  font-size: 12px;
  color: var(--muted);
  margin-top: 4px;
  line-height: 1.5;
}

/* ─── Buttons ────────────────────────────── */
.dash-btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px;
  border-radius: 9px;
  border: 1px solid var(--border);
  background: var(--card);
  font-size: 12px;
  font-weight: 700;
  color: var(--muted);
  cursor: pointer;
  transition: all .15s;
  font-family: inherit;
}

.dash-btn-ghost:hover {
  color: var(--text);
  border-color: #94a3b8;
}

.dash-btn-ghost:disabled {
  opacity: .5;
  cursor: not-allowed;
}

/* ─── Empty ──────────────────────────────── */
.dash-empty-inline {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 18px 16px;
  font-size: 13px;
  color: var(--muted);
}

/* ─── Responsive ─────────────────────────── */
@media (max-width: 1200px) {
  .dash-route-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .dash-route-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .dash-route-bottom-row {
    grid-template-columns: 1fr;
  }

  .dash-route-foot {
    flex-direction: column;
    align-items: flex-start;
  }
}
@media (max-width: 1024px) {
  .dash-main-grid {
    grid-template-columns: 1fr;
  }

  .dash-bottom-grid {
    grid-template-columns: 1fr;
  }

  .dash-kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .dash {
    padding: 14px;
    gap: 12px;
  }

  .dash-kpi-grid {
    grid-template-columns: 1fr 1fr;
  }

  .dash-quick-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .dash-info-tiles {
    grid-template-columns: 1fr 1fr;
  }

  .dash-health-mini {
    grid-template-columns: repeat(3, 1fr);
  }

  .dash-header {
    flex-direction: column;
  }

  .dash-header-right {
    width: 100%;
    justify-content: space-between;
  }

  .dash-bar-lbl {
    width: 105px;
  }

  .dash-route-stats {
    grid-template-columns: 1fr;
  }

  .dash-route-foot {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>