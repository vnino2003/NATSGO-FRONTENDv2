<!-- src/pages/admin/BusDetailsPage.vue -->
<template>
  <div class="bd">

    <!-- ── Back nav ── -->
    <div class="bd-nav">
      <button class="bd-back" @click="$router.push('/admin/buses')">
        <i class="fas fa-arrow-left"></i>
        Back to Fleet
      </button>
      <span class="bd-breadcrumb">
        <span class="bd-breadcrumb-muted">Fleet</span>
        <i class="fas fa-chevron-right" style="font-size:9px;"></i>
        <span>{{ bus.bus_code }}</span>
      </span>
    </div>

    <!-- ── Page header ── -->
    <div class="bd-header">
      <div class="bd-header-left">
        <div class="bd-bus-avatar" :class="bus.device_online ? 'bd-avatar--on' : 'bd-avatar--off'">
          <i class="fas fa-bus"></i>
        </div>
        <div>
          <div class="bd-header-title-row">
            <h1 class="bd-title">{{ bus.bus_code }}</h1>
            <span class="bd-status-chip" :class="bus.device_online ? 'bd-chip--on' : 'bd-chip--off'">
              <span class="bd-chip-dot"></span>
              {{ bus.device_online ? 'Online' : 'Offline' }}
            </span>
            <span v-if="isFull" class="bd-full-badge">FULL</span>
          </div>
          <p class="bd-subtitle">{{ bus.plate_no }} · Capacity {{ bus.capacity }} seats · ID {{ bus.id }}</p>
        </div>
      </div>
      <div class="bd-header-actions">
<button class="bd-btn-ghost" @click="openEditModal">          <i class="fas fa-pen"></i>
          Edit Bus
        </button>
<button class="bd-btn-primary" @click="refresh" :disabled="loading">         <i class="fas fa-rotate" :class="{ 'fa-spin': loading }"></i>
          Refresh
        </button>
      </div>
    </div>

    <!-- ── Stat cards row ── -->
    <div class="bd-stats">

      <div class="bd-stat">
        <div class="bd-stat-icon bd-stat-icon--blue">
          <i class="fas fa-users"></i>
        </div>
        <div class="bd-stat-body">
          <div class="bd-stat-value">{{ passengerCount }}</div>
          <div class="bd-stat-label">Passengers</div>
        </div>
        <div class="bd-stat-sub">of {{ bus.capacity }} seats</div>
      </div>

      <div class="bd-stat">
        <div class="bd-stat-icon" :class="occIconClass">
          <i class="fas fa-gauge-high"></i>
        </div>
        <div class="bd-stat-body">
          <div class="bd-stat-value" :class="occValueClass">{{ occupancyPercent }}%</div>
          <div class="bd-stat-label">Occupancy</div>
        </div>
        <div class="bd-occ-bar-wrap">
          <div class="bd-occ-bar-track">
            <div class="bd-occ-bar-fill" :class="occBarClass" :style="{ width: occupancyPercent + '%' }"></div>
          </div>
        </div>
      </div>

      <div class="bd-stat">
        <div class="bd-stat-icon bd-stat-icon--green">
          <i class="fas fa-peso-sign"></i>
        </div>
        <div class="bd-stat-body">
          <div class="bd-stat-value">{{ formatCurrency(estimatedRevenue) }}</div>
          <div class="bd-stat-label">Est. Revenue</div>
        </div>
        <div class="bd-stat-sub">@ ₱{{ fare }} / passenger</div>
      </div>

      <div class="bd-stat">
        <div class="bd-stat-icon bd-stat-icon--amber">
          <i class="fas fa-clock"></i>
        </div>
        <div class="bd-stat-body">
          <div class="bd-stat-value">{{ timeAgo(bus.device_last_seen_at) }}</div>
          <div class="bd-stat-label">Last Seen</div>
        </div>
        <div class="bd-stat-sub">{{ formatTs(bus.device_last_seen_at) }}</div>
      </div>

    </div>

    <!-- ── Main grid ── -->
    <div class="bd-grid">

      <!-- Left column -->
      <div class="bd-col-left">

        <!-- Bus Info -->
        <div class="bd-card">
          <div class="bd-card-head">
            <i class="fas fa-bus bd-card-ico"></i>
            <span>Bus Information</span>
          </div>
          <div class="bd-info-rows">
            <div class="bd-info-row">
              <span class="bd-info-label">Bus Code</span>
              <span class="bd-info-val bd-mono">{{ bus.bus_code }}</span>
            </div>
            <div class="bd-info-row">
              <span class="bd-info-label">Plate No.</span>
              <span class="bd-info-val bd-mono">{{ bus.plate_no }}</span>
            </div>
            <div class="bd-info-row">
              <span class="bd-info-label">Capacity</span>
              <span class="bd-info-val">{{ bus.capacity }} seats</span>
            </div>
            <div class="bd-info-row">
              <span class="bd-info-label">Status</span>
              <span class="bd-tag" :class="bus.bus_status === 'active' ? 'bd-tag--green' : 'bd-tag--red'">
                {{ bus.bus_status }}
              </span>
            </div>
            <div class="bd-info-row">
              <span class="bd-info-label">Bus ID</span>
              <span class="bd-info-val bd-mono bd-muted">#{{ bus.id }}</span>
            </div>
            <div class="bd-info-row">
              <span class="bd-info-label">Registered</span>
              <span class="bd-info-val">{{ formatTs(bus.created_at) }}</span>
            </div>
          </div>
        </div>

        <!-- Device Info -->
        <div class="bd-card">
          <div class="bd-card-head">
            <i class="fas fa-microchip bd-card-ico"></i>
            <span>IoT Device</span>
          </div>
          <div v-if="bus.device" class="bd-info-rows">
            <div class="bd-info-row">
              <span class="bd-info-label">Device Code</span>
              <span class="bd-info-val bd-mono">{{ bus.device.device_code }}</span>
            </div>
            <div class="bd-info-row">
              <span class="bd-info-label">ESP32 ID</span>
              <span class="bd-info-val bd-mono bd-muted">{{ bus.device.esp32_id }}</span>
            </div>
            <div class="bd-info-row">
              <span class="bd-info-label">Connection</span>
              <span class="bd-tag" :class="bus.device_online ? 'bd-tag--green' : 'bd-tag--red'">
                {{ bus.device_online ? 'Online' : 'Offline' }}
              </span>
            </div>
            <div class="bd-info-row">
              <span class="bd-info-label">Network</span>
              <span class="bd-info-val">{{ bus.device.network_type || 'GSM' }}</span>
            </div>
            <div class="bd-info-row">
              <span class="bd-info-label">Signal</span>
              <div class="bd-signal-bars">
                <span
                  v-for="n in 4" :key="n"
                  class="bd-signal-bar"
                  :class="signalActive(n) ? 'bd-signal-bar--on' : 'bd-signal-bar--off'"
                  :style="{ height: (n * 5 + 4) + 'px' }"
                ></span>
                <span class="bd-info-val" style="margin-left:6px;">{{ bus.device.signal_rssi ?? '—' }} dBm</span>
              </div>
            </div>
            <div class="bd-info-row">
              <span class="bd-info-label">GPS</span>
              <span class="bd-tag" :class="bus.device.gps_state === 'active' ? 'bd-tag--green' : 'bd-tag--amber'">
                {{ bus.device.gps_state || 'unknown' }}
              </span>
            </div>
            <div class="bd-info-row">
              <span class="bd-info-label">ToF Sensor A</span>
              <span class="bd-tag" :class="bus.device.tof_a_ok ? 'bd-tag--green' : 'bd-tag--red'">
                {{ bus.device.tof_a_ok ? 'OK' : 'Fault' }}
              </span>
            </div>
            <div class="bd-info-row">
              <span class="bd-info-label">ToF Sensor B</span>
              <span class="bd-tag" :class="bus.device.tof_b_ok ? 'bd-tag--green' : 'bd-tag--red'">
                {{ bus.device.tof_b_ok ? 'OK' : 'Fault' }}
              </span>
            </div>
          </div>
          <div v-else class="bd-empty-inline">
            <i class="fas fa-link-slash"></i>
            No device assigned to this bus
          </div>
        </div>

      </div>

      <!-- Right column -->
      <div class="bd-col-right">

        <!-- Occupancy & Revenue -->
        <div class="bd-card">
          <div class="bd-card-head">
            <i class="fas fa-chart-pie bd-card-ico"></i>
            <span>Occupancy & Revenue</span>
          </div>

          <!-- Big occupancy display -->
          <div class="bd-occ-display">
            <div class="bd-occ-ring-wrap">
              <svg viewBox="0 0 120 120" class="bd-occ-ring">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#e2e8f0" stroke-width="10"/>
                <circle
                  cx="60" cy="60" r="50"
                  fill="none"
                  :stroke="occRingColor"
                  stroke-width="10"
                  stroke-linecap="round"
                  stroke-dasharray="314"
:stroke-dashoffset="314 - (314 * occupancyPercent / 100)"                  transform="rotate(-90 60 60)"
                  style="transition: stroke-dashoffset 0.6s ease;"
                />
                <text x="60" y="55" text-anchor="middle" class="bd-ring-pct" :fill="occRingColor" font-size="22" font-weight="900" font-family="DM Sans,sans-serif">{{ bus.occupancy_percent }}%</text>
                <text x="60" y="72" text-anchor="middle" fill="#94a3b8" font-size="9" font-weight="600" font-family="DM Sans,sans-serif">OCCUPIED</text>
              </svg>
            </div>
            <div class="bd-occ-details">
              <div class="bd-occ-detail-row">
                <span class="bd-occ-detail-label">Passengers</span>
                <span class="bd-occ-detail-val">{{ bus.passenger_count }} / {{ bus.capacity }}</span>
              </div>
              <div class="bd-occ-detail-row">
                <span class="bd-occ-detail-label">Available Seats</span>
                <span class="bd-occ-detail-val">{{ availableSeats }}</span>
              </div>
              <div class="bd-occ-detail-row">
                <span class="bd-occ-detail-label">Fare / Passenger</span>
                <span class="bd-occ-detail-val">₱{{ fare }}</span>
              </div>
              <div class="bd-occ-divider"></div>
              <div class="bd-occ-detail-row">
                <span class="bd-occ-detail-label">Total Boarded Today</span>
                <span class="bd-occ-detail-val">{{ totalBoardedToday }}</span>
              </div>
              <div class="bd-occ-detail-row">
                <span class="bd-occ-detail-label">Est. Revenue (current)</span>
                <span class="bd-occ-detail-val bd-occ-detail-val--green">{{ formatCurrency(estimatedRevenue) }}</span>
              </div>
              <div class="bd-occ-detail-row">
                <span class="bd-occ-detail-label">Est. Revenue (today)</span>
                <span class="bd-occ-detail-val bd-occ-detail-val--green">{{ formatCurrency(estimatedRevenueToday) }}</span>
              </div>
              <div class="bd-occ-detail-row">
                <span class="bd-occ-detail-label">Est. Max Revenue</span>
                <span class="bd-occ-detail-val bd-muted">{{ formatCurrency(maxRevenue) }}</span>
              </div>
            </div>
          </div>

          <!-- Fare selector -->
          <div class="bd-fare-row">
            <span class="bd-fare-label">Base Fare</span>
            <div class="bd-fare-chips">
              <button
                v-for="f in fareOptions" :key="f"
                class="bd-fare-chip"
                :class="{ 'bd-fare-chip--active': fare === f }"
                @click="fare = f"
              >₱{{ f }}</button>
            </div>
          </div>
        </div>

        <!-- Route / Terminal -->
        <div class="bd-card">
          <div class="bd-card-head">
            <i class="fas fa-route bd-card-ico"></i>
            <span>Route & Terminal</span>
          </div>

          <div v-if="bus.terminal_state" class="bd-route-body">
            <!-- Terminal state visual -->
            <div class="bd-terminal-flow">
              <div class="bd-terminal-node" :class="Number(bus.terminal_state.at_terminal) === 1 ? 'bd-terminal-node--active' : ''">
                <i class="fas fa-building"></i>
                <span>{{ bus.terminal_state.current_terminal_name || 'Terminal A' }}</span>
              </div>
              <div class="bd-terminal-line">
                <div class="bd-terminal-bus-dot" :class="Number(bus.terminal_state.at_terminal) === 1 ? 'bd-terminal-bus-dot--terminal' : 'bd-terminal-bus-dot--road'">
                  <i class="fas fa-bus" style="font-size:9px;"></i>
                </div>
              </div>
              <div class="bd-terminal-node" :class="Number(bus.terminal_state.at_terminal) !== 1 ? 'bd-terminal-node--active' : ''">
                <i class="fas fa-building"></i>
                <span>{{ bus.terminal_state.target_terminal_name || 'Terminal B' }}</span>
              </div>
            </div>

            <div class="bd-info-rows" style="margin-top:16px;">
              <div class="bd-info-row">
                <span class="bd-info-label">State</span>
                <span class="bd-tag" :class="Number(bus.terminal_state.at_terminal) === 1 ? 'bd-tag--teal' : 'bd-tag--blue'">
                  {{ Number(bus.terminal_state.at_terminal) === 1 ? 'At Terminal' : 'En Route' }}
                </span>
              </div>
              <div class="bd-info-row">
                <span class="bd-info-label">From</span>
                <span class="bd-info-val">{{ bus.terminal_state.current_terminal_name || '—' }}</span>
              </div>
              <div class="bd-info-row">
                <span class="bd-info-label">To</span>
                <span class="bd-info-val">{{ bus.terminal_state.target_terminal_name || '—' }}</span>
              </div>
              <!-- <div class="bd-info-row">
                <span class="bd-info-label">Distance</span>
                <span class="bd-info-val">{{ bus.terminal_state.dist_m != null ? Math.round(bus.terminal_state.dist_m) + ' m' : '—' }}</span>
              </div> -->
            </div>
          </div>

          <div v-else class="bd-empty-inline">
            <i class="fas fa-question-circle"></i>
            No route state available
          </div>
        </div>

        <!-- GPS Location -->
        <div class="bd-card">
          <div class="bd-card-head">
            <i class="fas fa-location-dot bd-card-ico"></i>
            <span>GPS Location</span>
          </div>
          <div class="bd-map-placeholder">
            <div class="bd-map-inner">
              <i class="fas fa-map-location-dot bd-map-icon"></i>
              <div class="bd-map-coords">
                <span>{{ bus.gps?.lat ?? '14.1234° N' }}</span>
                <span class="bd-map-sep">·</span>
                <span>{{ bus.gps?.lng ?? '121.4567° E' }}</span>
              </div>
              <span class="bd-map-updated">Updated {{ timeAgo(bus.device_last_seen_at) }}</span>
            </div>
          </div>
          <div class="bd-info-rows" style="margin-top:0;">
            <div class="bd-info-row">
              <span class="bd-info-label">Latitude</span>
              <span class="bd-info-val bd-mono">{{ bus.gps?.lat ?? '14.123456' }}</span>
            </div>
            <div class="bd-info-row">
              <span class="bd-info-label">Longitude</span>
              <span class="bd-info-val bd-mono">{{ bus.gps?.lng ?? '121.456789' }}</span>
            </div>

          </div>
        </div>

      </div>
    </div>

    <!-- ── Recent Activity ── -->
    <div class="bd-card bd-card--full">
      <div class="bd-card-head">
        <i class="fas fa-clock-rotate-left bd-card-ico"></i>
        <span>Recent Activity</span>
      </div>
      <div class="bd-activity">
        <div class="bd-activity-row" v-for="ev in activity" :key="ev.id">
          <div class="bd-activity-icon" :class="`bd-activity-icon--${ev.type}`">
            <i class="fas" :class="ev.icon"></i>
          </div>
          <div class="bd-activity-body">
            <span class="bd-activity-label">{{ ev.label }}</span>
            <span class="bd-activity-sub">{{ ev.sub }}</span>
          </div>
          <span class="bd-activity-time">{{ ev.time }}</span>
        </div>
      </div>
    </div>

    <!-- ── Edit Modal (static shell) ── -->
    <Transition name="bd-modal">
      <div v-if="showEditModal" class="bd-overlay" @click.self="showEditModal = false">
        <div class="bd-modal">
          <div class="bd-modal-head">
            <div>
              <div class="bd-modal-title">Edit Bus</div>
              <div class="bd-modal-sub">Update bus record for {{ bus.bus_code }}</div>
            </div>
            <button class="bd-modal-close" @click="showEditModal = false">
              <i class="fas fa-xmark"></i>
            </button>
          </div>
          <div class="bd-modal-body">
            <div class="bd-form-grid">
              <label class="bd-field">
                <span class="bd-field-label">Bus Code</span>
                <input class="bd-input bd-input--disabled" :value="bus.bus_code" disabled />
              </label>
              <label class="bd-field">
                <span class="bd-field-label">Plate No <span class="bd-required">*</span></span>
<input class="bd-input" v-model.trim="editForm.plate_no" placeholder="e.g. ABC-1234" />              </label>
              <label class="bd-field">
                <span class="bd-field-label">Capacity <span class="bd-required">*</span></span>
<input class="bd-input" type="number" v-model.number="editForm.capacity" min="1" />              </label>
              <label class="bd-field">
                <span class="bd-field-label">Status</span>
<select class="bd-input" v-model="editForm.bus_status">                  <option>active</option>
                  <option>inactive</option>
                </select>
              </label>
            </div>
          </div>
          <div class="bd-modal-foot">
<button class="bd-foot-cancel" @click="closeEditModal" :disabled="saving">Cancel</button>
<button class="bd-foot-save" @click="saveBusChanges" :disabled="saving">
           <i class="fas" :class="saving ? 'fa-circle-notch fa-spin' : 'fa-check'"></i>
{{ saving ? 'Saving…' : 'Save Changes' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useBuses } from "@/composables/useBuses";

const route = useRoute();
const router = useRouter();

const {
  one,
  loading,
  error,
  fetchBus,
  editBus,
} = useBuses();

const busId = computed(() => route.params.id);

const fare = ref(13);
const fareOptions = [11, 13, 15, 20];

const showEditModal = ref(false);
const saving = ref(false);
const modalError = ref("");

const editForm = reactive({
  plate_no: "",
  capacity: 40,
  bus_status: "active",
});

let poll = null;

const bus = computed(() => {
  return one.value || {
    id: null,
    bus_code: "Loading...",
    plate_no: "—",
    capacity: 0,
    bus_status: "active",
    passenger_count: 0,
    occupancy_percent: 0,
    total_boarded_today: 0,
    device_online: false,
    device_status: "unassigned",
    device_last_seen_at: null,
    created_at: null,
    device: null,
    terminal_state: null,
    gps: null,
    ir: null,
  };
});

async function loadBus() {
  console.log("DETAIL PAGE ROUTE ID:", busId.value);

  if (!busId.value) return;

  const data = await fetchBus(busId.value);

  console.log("DETAIL PAGE API DATA:", data);
  console.log("ONE VALUE:", one.value);
}
onMounted(async () => {
  await loadBus();
  poll = setInterval(loadBus, 5000);
});

onBeforeUnmount(() => {
  if (poll) clearInterval(poll);
});

function refresh() {
  loadBus();
}

function openEditModal() {
  editForm.plate_no = bus.value.plate_no || "";
  editForm.capacity = Number(bus.value.capacity || 40);
  editForm.bus_status = bus.value.bus_status || "active";
  modalError.value = "";
  showEditModal.value = true;
}

function closeEditModal() {
  showEditModal.value = false;
  saving.value = false;
  modalError.value = "";
}

async function saveBusChanges() {
  modalError.value = "";

  const plate = String(editForm.plate_no || "").trim();
  const cap = Number(editForm.capacity);

  if (!plate) {
    modalError.value = "Plate No is required.";
    return;
  }

  if (!Number.isFinite(cap) || cap <= 0) {
    modalError.value = "Capacity must be greater than 0.";
    return;
  }

  saving.value = true;

  try {
    await editBus(busId.value, {
      plate_no: plate,
      capacity: cap,
      bus_status: editForm.bus_status,
    });

    closeEditModal();
    await loadBus();
  } catch (e) {
    modalError.value =
      e?.response?.data?.message ||
      e?.message ||
      "Failed to update bus.";
  } finally {
    saving.value = false;
  }
}

const passengerCount = computed(() => {
  const n = Number(bus.value.passenger_count ?? 0);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
});

const capacity = computed(() => {
  const n = Number(bus.value.capacity ?? 0);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
});

const occupancyPercent = computed(() => {
  const fromApi = Number(bus.value.occupancy_percent);
  if (Number.isFinite(fromApi)) return clampPct(fromApi);

  if (capacity.value <= 0) return 0;
  return clampPct((passengerCount.value / capacity.value) * 100);
});

const availableSeats = computed(() => {
  return Math.max(capacity.value - passengerCount.value, 0);
});

const totalBoardedToday = computed(() => {
  const fromApi = Number(bus.value.total_boarded_today);
  if (Number.isFinite(fromApi)) return Math.max(0, fromApi);

  const fromIr = Number(bus.value.ir?.in_total);
  if (Number.isFinite(fromIr)) return Math.max(0, fromIr);

  return 0;
});

const isFull = computed(() => {
  return capacity.value > 0 && passengerCount.value >= capacity.value;
});

const estimatedRevenue = computed(() => {
  return passengerCount.value * fare.value;
});

const estimatedRevenueToday = computed(() => {
  return totalBoardedToday.value * fare.value;
});

const maxRevenue = computed(() => {
  return capacity.value * fare.value;
});

const occRingColor = computed(() => {
  const p = occupancyPercent.value;
  if (p >= 100) return "#ef4444";
  if (p >= 70) return "#f59e0b";
  return "#10b981";
});

const occIconClass = computed(() => {
  const p = occupancyPercent.value;
  if (p >= 100) return "bd-stat-icon--red";
  if (p >= 70) return "bd-stat-icon--amber";
  return "bd-stat-icon--green";
});

const occValueClass = computed(() => {
  const p = occupancyPercent.value;
  if (p >= 100) return "bd-val--red";
  if (p >= 70) return "bd-val--amber";
  return "bd-val--green";
});

const occBarClass = computed(() => {
  const p = occupancyPercent.value;
  if (p >= 100) return "bd-bar--red";
  if (p >= 70) return "bd-bar--amber";
  return "bd-bar--green";
});

function signalActive(n) {
  const rssi = Number(bus.value.device?.signal_rssi ?? -999);

  if (rssi >= -60) return n <= 4;
  if (rssi >= -70) return n <= 3;
  if (rssi >= -85) return n <= 2;
  return n <= 1;
}

function clampPct(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function formatCurrency(v) {
  return "₱" + Number(v || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function timeAgo(dateLike) {
  if (!dateLike) return "—";

  const dt = new Date(dateLike);
  if (isNaN(dt)) return "—";

  const s = Math.floor((Date.now() - dt.getTime()) / 1000);

  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;

  return `${Math.floor(s / 86400)}d ago`;
}

function formatTs(dateLike) {
  if (!dateLike) return "—";

  const dt = new Date(dateLike);
  return isNaN(dt)
    ? "—"
    : dt.toLocaleString("en-PH", {
        dateStyle: "medium",
        timeStyle: "short",
      });
}

const activity = computed(() => {
  if (Array.isArray(bus.value.activity) && bus.value.activity.length) {
    return bus.value.activity.map((ev) => ({
      id: ev.id,
      type: ev.type,
      icon: ev.icon,
      label: ev.label,
      sub: ev.sub,
      time: timeAgo(ev.recorded_at),
    }));
  }

  return [
    {
      id: "empty",
      type: "terminal",
      icon: "fa-circle-info",
      label: "No recent activity",
      sub: "No device, terminal, or passenger events available yet",
      time: "—",
    },
  ];
});
</script>

<style scoped>
/* ─── Tokens ─────────────────────────────── */
.bd {
  --green:  #10b981;
  --amber:  #f59e0b;
  --red:    #ef4444;
  --blue:   #3b82f6;
  --teal:   #14b8a6;
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

/* ─── Nav ────────────────────────────────── */
.bd-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.bd-back {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 32px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--card);
  font-size: 13px;
  font-weight: 600;
  color: var(--muted);
  cursor: pointer;
  transition: all .15s;
}

.bd-back:hover { color: var(--text); border-color: #94a3b8; }

.bd-breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--muted);
}

.bd-breadcrumb-muted { color: var(--muted); }

/* ─── Page header ────────────────────────── */
.bd-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.bd-header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.bd-bus-avatar {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  font-size: 22px;
  flex-shrink: 0;
  border: 1px solid;
}

.bd-avatar--on {
  background: rgba(59,130,246,.08);
  border-color: rgba(59,130,246,.2);
  color: var(--blue);
}

.bd-avatar--off {
  background: #f1f5f9;
  border-color: var(--border);
  color: var(--muted);
}

.bd-header-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.bd-title {
  font-size: 24px;
  font-weight: 900;
  letter-spacing: -0.8px;
  margin: 0;
}

.bd-subtitle {
  font-size: 12px;
  color: var(--muted);
  margin: 4px 0 0;
}

.bd-status-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
}

.bd-chip--on  { background: rgba(16,185,129,.1); color: var(--green); }
.bd-chip--off { background: rgba(239,68,68,.08); color: var(--red); }

.bd-chip-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
  animation: pulse 1.4s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: .4; transform: scale(.8); }
}

.bd-full-badge {
  font-size: 9px;
  font-weight: 900;
  letter-spacing: .1em;
  padding: 3px 7px;
  border-radius: 4px;
  background: rgba(239,68,68,.08);
  border: 1px solid rgba(239,68,68,.2);
  color: var(--red);
}

.bd-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.bd-btn-ghost {
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

.bd-btn-ghost:hover { color: var(--text); border-color: #94a3b8; }

.bd-btn-primary {
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

.bd-btn-primary:hover { opacity: 0.85; }

/* ─── Stat cards row ─────────────────────── */
.bd-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.bd-stat {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  position: relative;
  overflow: hidden;
}

.bd-stat-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  font-size: 15px;
  flex-shrink: 0;
}

.bd-stat-icon--blue  { background: rgba(59,130,246,.08); color: var(--blue); }
.bd-stat-icon--green { background: rgba(16,185,129,.08); color: var(--green); }
.bd-stat-icon--amber { background: rgba(245,158,11,.08); color: var(--amber); }
.bd-stat-icon--red   { background: rgba(239,68,68,.08);  color: var(--red); }

.bd-stat-body { flex: 1; min-width: 0; }

.bd-stat-value {
  font-size: 22px;
  font-weight: 900;
  letter-spacing: -0.5px;
  line-height: 1;
}

.bd-stat-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: .5px;
  margin-top: 4px;
}

.bd-stat-sub {
  position: absolute;
  bottom: 12px;
  right: 14px;
  font-size: 10px;
  color: var(--muted);
  font-weight: 600;
  text-align: right;
}

.bd-val--green { color: var(--green); }
.bd-val--amber { color: var(--amber); }
.bd-val--red   { color: var(--red); }

.bd-occ-bar-wrap {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 0;
}

.bd-occ-bar-track {
  height: 3px;
  background: #e2e8f0;
}

.bd-occ-bar-fill {
  height: 100%;
  transition: width .4s ease;
}

.bd-bar--green { background: var(--green); }
.bd-bar--amber { background: var(--amber); }
.bd-bar--red   { background: var(--red); }

/* ─── Main grid ──────────────────────────── */
.bd-grid {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 16px;
  align-items: start;
}

.bd-col-left,
.bd-col-right {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ─── Card ───────────────────────────────── */
.bd-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}

.bd-card--full { width: 100%; }

.bd-card-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
  background: #f8fafc;
}

.bd-card-ico {
  font-size: 13px;
  color: var(--muted);
}

/* ─── Info rows ──────────────────────────── */
.bd-info-rows { padding: 6px 0; }

.bd-info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 9px 16px;
  border-bottom: 1px solid rgba(226,232,240,.5);
}

.bd-info-row:last-child { border-bottom: none; }

.bd-info-label {
  font-size: 12px;
  color: var(--muted);
  font-weight: 600;
  flex-shrink: 0;
}

.bd-info-val {
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
  text-align: right;
}

.bd-mono    { font-family: monospace; }
.bd-muted   { color: var(--muted) !important; font-weight: 600 !important; }

/* ─── Tags / badges ──────────────────────── */
.bd-tag {
  display: inline-flex;
  align-items: center;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  text-transform: capitalize;
}

.bd-tag--green { background: rgba(16,185,129,.1); color: #065f46; }
.bd-tag--red   { background: rgba(239,68,68,.08); color: #991b1b; }
.bd-tag--amber { background: rgba(245,158,11,.1); color: #78350f; }
.bd-tag--blue  { background: rgba(59,130,246,.1); color: #1e3a8a; }
.bd-tag--teal  { background: rgba(20,184,166,.1); color: #0f766e; }

/* ─── Signal bars ────────────────────────── */
.bd-signal-bars {
  display: flex;
  align-items: flex-end;
  gap: 2px;
}

.bd-signal-bar {
  width: 5px;
  border-radius: 2px 2px 0 0;
  display: block;
}

.bd-signal-bar--on  { background: var(--green); }
.bd-signal-bar--off { background: #e2e8f0; }

/* ─── Occupancy ring ─────────────────────── */
.bd-occ-display {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px 16px 16px;
}

.bd-occ-ring-wrap {
  flex-shrink: 0;
  width: 120px;
  height: 120px;
}

.bd-occ-ring { width: 100%; height: 100%; }

.bd-occ-details { flex: 1; }

.bd-occ-detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 0;
  border-bottom: 1px solid rgba(226,232,240,.4);
  gap: 8px;
}

.bd-occ-detail-row:last-child { border-bottom: none; }

.bd-occ-detail-label {
  font-size: 11px;
  color: var(--muted);
  font-weight: 600;
}

.bd-occ-detail-val {
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
}

.bd-occ-detail-val--green { color: var(--green); }

.bd-occ-divider {
  border-bottom: 1px dashed rgba(226,232,240,.8);
  margin: 4px 0;
}

/* ─── Fare selector ──────────────────────── */
.bd-fare-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-top: 1px solid var(--border);
  background: #f8fafc;
}

.bd-fare-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--muted);
  flex-shrink: 0;
}

.bd-fare-chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.bd-fare-chip {
  padding: 4px 12px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--card);
  font-size: 12px;
  font-weight: 700;
  color: var(--muted);
  cursor: pointer;
  transition: all .15s;
}

.bd-fare-chip:hover { color: var(--text); border-color: #94a3b8; }

.bd-fare-chip--active {
  background: var(--text);
  border-color: var(--text);
  color: #fff;
}

/* ─── Terminal flow ──────────────────────── */
.bd-route-body { padding: 16px; }

.bd-terminal-flow {
  display: flex;
  align-items: center;
  gap: 0;
  background: #f8fafc;
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
}

.bd-terminal-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 14px 16px;
  font-size: 11px;
  font-weight: 700;
  color: var(--muted);
  text-align: center;
  flex: 1;
  transition: all .2s;
}

.bd-terminal-node i { font-size: 18px; }

.bd-terminal-node--active {
  background: rgba(59,130,246,.06);
  color: var(--blue);
}

.bd-terminal-line {
  position: relative;
  flex: 1;
  height: 2px;
  background: var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
}

.bd-terminal-bus-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--card);
  color: #fff;
}

.bd-terminal-bus-dot--road     { background: var(--blue); }
.bd-terminal-bus-dot--terminal { background: var(--green); }

/* ─── Map placeholder ────────────────────── */
.bd-map-placeholder {
  background: linear-gradient(135deg, #e8f4fd 0%, #dbeafe 100%);
  height: 110px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid var(--border);
}

.bd-map-inner {
  text-align: center;
}

.bd-map-icon {
  font-size: 28px;
  color: var(--blue);
  opacity: .6;
  display: block;
  margin-bottom: 6px;
}

.bd-map-coords {
  font-size: 12px;
  font-weight: 700;
  color: var(--text);
  font-family: monospace;
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: center;
}

.bd-map-sep { color: var(--muted); }

.bd-map-updated {
  font-size: 10px;
  color: var(--muted);
  margin-top: 4px;
  display: block;
}

/* ─── Activity feed ──────────────────────── */
.bd-activity { padding: 4px 0; }

.bd-activity-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 16px;
  border-bottom: 1px solid rgba(226,232,240,.5);
  transition: background .12s;
}

.bd-activity-row:last-child { border-bottom: none; }
.bd-activity-row:hover { background: #f8fafc; }

.bd-activity-icon {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  display: grid;
  place-items: center;
  font-size: 12px;
  flex-shrink: 0;
}

.bd-activity-icon--board    { background: rgba(59,130,246,.1);  color: var(--blue); }
.bd-activity-icon--route    { background: rgba(16,185,129,.1);  color: var(--green); }
.bd-activity-icon--terminal { background: rgba(20,184,166,.1);  color: var(--teal); }
.bd-activity-icon--online   { background: rgba(16,185,129,.1);  color: var(--green); }
.bd-activity-icon--offline  { background: rgba(239,68,68,.08);  color: var(--red); }

.bd-activity-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.bd-activity-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
}

.bd-activity-sub {
  font-size: 11px;
  color: var(--muted);
}

.bd-activity-time {
  font-size: 11px;
  color: var(--muted);
  font-weight: 600;
  flex-shrink: 0;
}

/* ─── Empty inline ───────────────────────── */
.bd-empty-inline {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 20px 16px;
  font-size: 13px;
  color: var(--muted);
}

/* ─── Modal ──────────────────────────────── */
.bd-overlay {
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

.bd-modal {
  background: var(--card);
  border-radius: 20px;
  width: min(480px, 100%);
  box-shadow: 0 24px 60px rgba(0,0,0,.18);
  overflow: hidden;
}

.bd-modal-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 22px 22px 0;
  gap: 16px;
}

.bd-modal-title { font-size: 17px; font-weight: 800; letter-spacing: -0.4px; }
.bd-modal-sub   { font-size: 12px; color: var(--muted); margin-top: 3px; }

.bd-modal-close {
  width: 32px; height: 32px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: none;
  cursor: pointer;
  color: var(--muted);
  font-size: 14px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  transition: all .15s;
}

.bd-modal-close:hover { background: var(--red); color: #fff; border-color: var(--red); }

.bd-modal-body { padding: 18px 22px; }

.bd-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.bd-field { display: flex; flex-direction: column; gap: 6px; }

.bd-field-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .05em;
  text-transform: uppercase;
  color: var(--muted);
}

.bd-required { color: var(--red); }

.bd-input {
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

.bd-input:focus {
  border-color: var(--blue);
  box-shadow: 0 0 0 3px rgba(59,130,246,.12);
  background: var(--card);
}

.bd-input--disabled { opacity: 0.6; cursor: not-allowed; }

.bd-modal-foot {
  padding: 14px 22px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  border-top: 1px solid var(--border);
  background: var(--bg);
}

.bd-foot-cancel {
  height: 36px; padding: 0 16px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--card);
  font-size: 13px; font-weight: 700;
  color: var(--muted);
  cursor: pointer;
  transition: all .15s;
}

.bd-foot-cancel:hover { color: var(--text); border-color: #94a3b8; }

.bd-foot-save {
  height: 36px; padding: 0 16px;
  border-radius: 10px;
  border: none;
  background: var(--text);
  color: #fff;
  font-size: 13px; font-weight: 700;
  cursor: pointer;
  display: inline-flex; align-items: center; gap: 7px;
  transition: opacity .15s;
}

.bd-foot-save:hover { opacity: 0.85; }

/* ─── Modal transition ───────────────────── */
.bd-modal-enter-active,
.bd-modal-leave-active { transition: all .2s ease; }

.bd-modal-enter-from,
.bd-modal-leave-to { opacity: 0; transform: scale(.97) translateY(8px); }

/* ─── Responsive ─────────────────────────── */
@media (max-width: 1024px) {
  .bd-grid { grid-template-columns: 1fr; }
  .bd-stats { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 640px) {
  .bd { padding: 14px; gap: 14px; }
  .bd-stats { grid-template-columns: 1fr 1fr; }
  .bd-occ-display { flex-direction: column; align-items: flex-start; }
  .bd-form-grid { grid-template-columns: 1fr; }
  .bd-header { flex-direction: column; align-items: flex-start; }
}
</style>