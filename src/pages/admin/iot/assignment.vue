<!-- src/pages/admin/AssignmentPage.vue -->
<template>
  <div class="ap">

    <!-- ── Header ── -->
    <div class="ap-header">
      <div class="ap-header-left">
        <div class="ap-title-row">
          <h1 class="ap-title">Assignments</h1>
          <span class="ap-live-badge">
            <span class="ap-live-dot"></span>
            Live
          </span>
        </div>
        <p class="ap-subtitle">Bus ⇄ Device · GPS · Passenger Counter</p>
      </div>

      <div class="ap-header-right">
        <div class="ap-search-box">
          <i class="fas fa-magnifying-glass ap-search-icon"></i>
          <input
            v-model="q"
            class="ap-search-input"
            type="text"
            placeholder="Search bus, plate, device, ESP32…"
          />
          <button v-if="q" class="ap-search-clear" @click="q = ''">
            <i class="fas fa-xmark"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- ── State feedback ── -->
    <div v-if="loading && !buses.length" class="ap-state-row">
      <i class="fas fa-circle-notch fa-spin"></i> Loading assignments…
    </div>
    <div v-else-if="error" class="ap-state-row ap-state-error">
      <i class="fas fa-triangle-exclamation"></i> {{ error }}
    </div>

    <!-- ── Summary cards ── -->
    <div class="ap-summary">
      <div class="ap-stat">
        <div class="ap-stat-value">{{ buses.length }}</div>
        <div class="ap-stat-label">Total Buses</div>
      </div>
      <div class="ap-stat ap-stat--green">
        <div class="ap-stat-value">{{ assignedCount }}</div>
        <div class="ap-stat-label">Assigned</div>
      </div>
      <div class="ap-stat ap-stat--red">
        <div class="ap-stat-value">{{ buses.length - assignedCount }}</div>
        <div class="ap-stat-label">Unassigned</div>
      </div>
      <div class="ap-stat ap-stat--amber">
        <div class="ap-stat-value">{{ unassignedDevices.length }}</div>
        <div class="ap-stat-label">Free Devices</div>
      </div>
    </div>

    <!-- ── Filter pills + action ── -->
    <div class="ap-toolbar">
      <div class="ap-filters">
        <button
          v-for="f in filters"
          :key="f.key"
          class="ap-pill"
          :class="{ 'ap-pill--active': flt === f.key }"
          @click="flt = f.key"
        >
          {{ f.label }}
          <span class="ap-pill-count">{{ countBy(f.key) }}</span>
        </button>
      </div>

      <div class="ap-toolbar-right">
        <button class="ap-btn ap-btn--ghost" type="button" @click="refresh" :disabled="loading">
          <i class="fas fa-rotate" :class="{ 'ap-spin': loading }"></i>
          <span class="ap-btn-label">Refresh</span>
        </button>
        <button class="ap-btn ap-btn--primary" type="button" @click="openAssign">
          <i class="fas fa-plus"></i>
          <span class="ap-btn-label">New Assignment</span>
        </button>
      </div>
    </div>

    <!-- ── Table ── -->
    <div class="ap-table-wrap">
      <table class="ap-table">
        <thead>
          <tr>
            <th>Bus</th>
            <th>Device</th>
            <th>ESP32 ID</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in filteredAssignments" :key="a.bus_id" class="ap-row">

            <!-- Bus -->
            <td>
              <div class="ap-cell-name">{{ a.bus_code }}</div>
              <div class="ap-cell-sub">{{ a.plate_no }} · Cap {{ a.capacity }}</div>
            </td>

            <!-- Device -->
            <td>
              <div class="ap-cell-name">
                {{ a.device_id ? a.device_code : '—' }}
              </div>
              <div class="ap-cell-sub">
                {{ a.device_id ? 'IoT device linked' : 'No device assigned' }}
              </div>
            </td>

            <!-- ESP32 -->
            <td>
              <div class="ap-cell-mono">{{ a.device_id ? a.esp32_id : '—' }}</div>
              <div class="ap-cell-sub">ESP32 / MAC</div>
            </td>

            <!-- Status chip -->
            <td>
              <span class="ap-status" :class="a.device_id ? 'ap-status--on' : 'ap-status--off'">
                <span class="ap-status-dot"></span>
                {{ a.device_id ? 'Assigned' : 'Unassigned' }}
              </span>
            </td>

            <!-- Actions -->
            <td>
              <div class="ap-actions">
                <button class="ap-icon-btn" type="button" @click="editAssign(a)" title="Edit">
                  <i class="fas fa-pen"></i>
                </button>
                <button
                  class="ap-icon-btn ap-icon-btn--danger"
                  type="button"
                  @click="doUnassign(a)"
                  :disabled="!a.device_id || loading"
                  title="Unassign device"
                >
                  <i class="fas fa-link-slash"></i>
                </button>
              </div>
            </td>
          </tr>

          <tr v-if="!loading && filteredAssignments.length === 0">
            <td colspan="5">
              <div class="ap-empty">
                <i class="fas fa-link"></i>
                <p>No results found</p>
                <small>Try clearing the search or changing the filter</small>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ── Modal: New / Edit ── -->
    <Transition name="ap-modal">
      <div v-if="modalOpen" class="ap-overlay" @click.self="closeModal">
        <div class="ap-modal">

          <div class="ap-modal-head">
            <div class="ap-modal-head-left">
              <div class="ap-modal-title">
                <i class="fas" :class="isEditing ? 'fa-pen' : 'fa-link'"></i>
                {{ isEditing ? 'Edit Assignment' : 'New Assignment' }}
              </div>
              <div class="ap-modal-sub">
                {{ isEditing
                  ? 'Move this device to a different bus.'
                  : 'Link an unassigned device to a bus.' }}
              </div>
            </div>
            <button class="ap-modal-close" @click="closeModal" :disabled="loading">
              <i class="fas fa-xmark"></i>
            </button>
          </div>

          <div class="ap-modal-body">
            <div class="ap-form-grid">

              <label class="ap-field">
                <span class="ap-field-label">Bus *</span>
                <select class="ap-input" v-model="form.bus_id" :disabled="loading">
                  <option disabled value="">Select a bus</option>
                  <option v-for="b in buses" :key="b.bus_id" :value="b.bus_id">
                    {{ b.bus_code }} · {{ b.plate_no }}
                  </option>
                </select>
              </label>

              <label class="ap-field">
                <span class="ap-field-label">Device (Unassigned) *</span>
                <select class="ap-input" v-model="form.device_id" :disabled="isEditing || loading">
                  <option disabled value="">Select a device</option>
                  <option v-for="d in unassignedDevices" :key="d.id" :value="d.id">
                    {{ d.device_code }} · {{ d.esp32_id }}
                  </option>
                </select>
                <span v-if="isEditing" class="ap-field-hint">
                  <i class="fas fa-lock"></i>
                  Device is locked. Unassign first to change it.
                </span>
              </label>

            </div>

            <div v-if="error" class="ap-modal-err">
              <i class="fas fa-triangle-exclamation"></i> {{ error }}
            </div>
          </div>

          <div class="ap-modal-foot">
            <button class="ap-btn ap-btn--ghost" type="button" @click="closeModal" :disabled="loading">
              Cancel
            </button>
            <button class="ap-btn ap-btn--primary" type="button" @click="saveAssign" :disabled="loading">
              <i class="fas fa-check"></i>
              {{ loading ? 'Saving…' : 'Save Assignment' }}
            </button>
          </div>

        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue"
import { useBusAssignments } from "@/composables/useBusAssignments"
import { useDevices } from "@/composables/useDevices"

const { rows: assignmentRows, loading, error, fetchCurrentAssignments, assign, unassign } =
  useBusAssignments()

const { rows: deviceRows, fetchDevices } = useDevices()

// ── Toolbar state ───────────────────────────────────────
const q   = ref("")
const flt = ref("all")

const filters = [
  { key: "all",        label: "All" },
  { key: "assigned",   label: "Assigned" },
  { key: "unassigned", label: "Unassigned" },
]

// ── Computed ─────────────────────────────────────────────
const buses = computed(() => assignmentRows.value || [])

const unassignedDevices = computed(() => {
  const used = new Set(buses.value.map(b => b.device_id).filter(Boolean))
  return (deviceRows.value || []).filter(d => !used.has(d.id))
})

const assignedCount = computed(() => buses.value.filter(b => !!b.device_id).length)

const filteredAssignments = computed(() => {
  const kw = q.value.trim().toLowerCase()
  return buses.value.filter(a => {
    const hay = [a.bus_code, a.plate_no, a.device_code || "", a.esp32_id || ""]
      .join(" ").toLowerCase()
    const matchSearch = !kw || hay.includes(kw)
    const isAssigned  = !!a.device_id
    const matchFilter =
      flt.value === "all" ||
      (flt.value === "assigned"   && isAssigned) ||
      (flt.value === "unassigned" && !isAssigned)
    return matchSearch && matchFilter
  })
})

function countBy(key) {
  if (key === "all")        return buses.value.length
  if (key === "assigned")   return buses.value.filter(b => !!b.device_id).length
  if (key === "unassigned") return buses.value.filter(b => !b.device_id).length
  return 0
}

// ── Modal ────────────────────────────────────────────────
const modalOpen      = ref(false)
const isEditing      = ref(false)
const editingBusId   = ref(null)
const form           = ref({ bus_id: "", device_id: "" })

function openAssign() {
  isEditing.value    = false
  editingBusId.value = null
  form.value         = { bus_id: "", device_id: "" }
  modalOpen.value    = true
}

function editAssign(a) {
  isEditing.value    = true
  editingBusId.value = a.bus_id
  form.value         = { bus_id: a.bus_id, device_id: a.device_id || "" }
  modalOpen.value    = true
}

function closeModal() { modalOpen.value = false }

async function saveAssign() {
  if (!form.value.bus_id) return alert("Please select a Bus.")

  if (!isEditing.value) {
    if (!form.value.device_id) return alert("Please select a Device.")
    try {
      await assign(form.value.bus_id, form.value.device_id, "")
      modalOpen.value = false
    } catch (e) {}
    return
  }

  const oldBusId = editingBusId.value
  const newBusId = form.value.bus_id
  const deviceId = form.value.device_id

  if (!deviceId) return alert("This bus has no device. Use New Assignment instead.")

  try {
    if (newBusId !== oldBusId) {
      await unassign(oldBusId, "Moved assignment")
      await assign(newBusId, deviceId, "")
    } else {
      alert("No change detected. Move the assignment by selecting a different bus.")
    }
    modalOpen.value = false
  } catch (e) {}
}

async function doUnassign(a) {
  if (!a.device_id) return
  const ok = confirm(`Unassign ${a.device_code} from ${a.bus_code}?`)
  if (!ok) return
  try { await unassign(a.bus_id, "Unassigned from admin") } catch (e) {}
}

async function refresh() {
  await Promise.all([fetchCurrentAssignments(), fetchDevices()])
}

onMounted(refresh)
</script>

<style scoped>
/* ─── Tokens ─────────────────────────────── */
.ap {
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
}

/* ─── Header ─────────────────────────────── */
.ap-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.ap-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ap-title {
  font-size: 22px;
  font-weight: 800;
  margin: 0;
  letter-spacing: -0.5px;
}

.ap-subtitle {
  font-size: 12px;
  color: var(--muted);
  margin: 4px 0 0;
}

.ap-live-badge {
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

.ap-live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  animation: appulse 1.4s ease-in-out infinite;
}

@keyframes appulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: .4; transform: scale(.8); }
}

/* Search */
.ap-search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 8px 12px;
  min-width: 280px;
}

.ap-search-icon { color: var(--muted); font-size: 13px; }

.ap-search-input {
  border: none;
  outline: none;
  background: transparent;
  font-size: 13px;
  font-family: inherit;
  flex: 1;
  color: var(--text);
}

.ap-search-clear {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--muted);
  padding: 0;
  line-height: 1;
}

/* ─── State ──────────────────────────────── */
.ap-state-row {
  font-size: 13px;
  color: var(--muted);
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.ap-state-error { color: var(--red); }

/* ─── Summary ────────────────────────────── */
.ap-summary {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.ap-stat {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 14px 20px;
  min-width: 100px;
  flex: 1;
}

.ap-stat-value {
  font-size: 26px;
  font-weight: 900;
  line-height: 1;
  letter-spacing: -1px;
}

.ap-stat-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--muted);
  margin-top: 4px;
  text-transform: uppercase;
  letter-spacing: .5px;
}

.ap-stat--green .ap-stat-value { color: var(--green); }
.ap-stat--red   .ap-stat-value { color: var(--red); }
.ap-stat--amber .ap-stat-value { color: var(--amber); }

/* ─── Toolbar ────────────────────────────── */
.ap-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.ap-filters {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.ap-pill {
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
  font-family: inherit;
  transition: all .15s;
}

.ap-pill:hover { border-color: #94a3b8; color: var(--text); }

.ap-pill--active {
  background: var(--text);
  border-color: var(--text);
  color: #fff;
}

.ap-pill-count {
  background: rgba(255,255,255,.2);
  border-radius: 999px;
  padding: 1px 6px;
  font-size: 10px;
}

.ap-pill:not(.ap-pill--active) .ap-pill-count {
  background: var(--bg);
  color: var(--muted);
}

.ap-toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ─── Buttons ────────────────────────────── */
.ap-btn {
  height: 36px;
  border: 1px solid var(--border);
  background: var(--card);
  border-radius: 10px;
  padding: 0 14px;
  font-family: inherit;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--text);
  transition: all .15s;
  white-space: nowrap;
}

.ap-btn:hover { border-color: #94a3b8; background: #f1f5f9; }
.ap-btn:active { transform: scale(0.98); }
.ap-btn:disabled { opacity: .5; cursor: not-allowed; }

.ap-btn--ghost { background: transparent; border-color: transparent; }
.ap-btn--ghost:hover { background: #f1f5f9; border-color: var(--border); }

.ap-btn--primary {
  background: var(--text);
  border-color: var(--text);
  color: #fff;
  box-shadow: 0 4px 12px rgba(15,23,42,.18);
}
.ap-btn--primary:hover { background: #1e293b; box-shadow: 0 6px 16px rgba(15,23,42,.26); }

.ap-btn--danger {
  background: rgba(239,68,68,.06);
  border-color: rgba(239,68,68,.2);
  color: var(--red);
}
.ap-btn--danger:hover { background: rgba(239,68,68,.1); border-color: rgba(239,68,68,.35); }

@media (max-width: 600px) { .ap-btn-label { display: none; } }

.ap-spin { animation: apspin 1s linear infinite; }
@keyframes apspin { to { transform: rotate(360deg); } }

/* ─── Table ──────────────────────────────── */
.ap-table-wrap {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}

.ap-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.ap-table thead th {
  padding: 11px 16px;
  text-align: left;
  font-size: 11px;
  font-weight: 700;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: .5px;
  background: #f8fafc;
  border-bottom: 1px solid var(--border);
}

.ap-row {
  border-bottom: 1px solid rgba(226,232,240,.6);
  transition: background .12s;
}

.ap-row:last-child { border-bottom: none; }
.ap-row:hover { background: #f8fafc; }

.ap-table td { padding: 13px 16px; vertical-align: middle; }

/* Cell content */
.ap-cell-name {
  font-weight: 700;
  font-size: 13px;
  color: var(--text);
}

.ap-cell-sub {
  font-size: 11px;
  color: var(--muted);
  margin-top: 2px;
}

.ap-cell-mono {
  font-family: monospace;
  font-size: 12px;
  font-weight: 600;
  color: var(--text);
}

/* Status chip */
.ap-status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
}

.ap-status--on {
  background: rgba(16,185,129,.1);
  color: var(--green);
}

.ap-status--off {
  background: rgba(239,68,68,.08);
  color: var(--red);
}

.ap-status-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
}

.ap-status--on .ap-status-dot {
  animation: appulse 1.4s ease-in-out infinite;
}

/* Action buttons */
.ap-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
}

.ap-icon-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--card);
  cursor: pointer;
  color: var(--muted);
  font-size: 12px;
  display: grid;
  place-items: center;
  transition: all .15s;
}

.ap-icon-btn:hover {
  background: var(--text);
  color: #fff;
  border-color: var(--text);
}

.ap-icon-btn--danger:hover {
  background: var(--red);
  border-color: var(--red);
  color: #fff;
}

.ap-icon-btn:disabled {
  opacity: .35;
  cursor: not-allowed;
}

.ap-icon-btn:disabled:hover {
  background: var(--card);
  color: var(--muted);
  border-color: var(--border);
}

/* Empty state */
.ap-empty {
  padding: 52px;
  text-align: center;
  color: var(--muted);
}

.ap-empty i { font-size: 32px; display: block; margin-bottom: 12px; }
.ap-empty p { font-weight: 700; color: var(--text); margin: 0 0 4px; }
.ap-empty small { font-size: 12px; }

/* ─── Modal overlay ──────────────────────── */
.ap-overlay {
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

.ap-modal {
  background: var(--card);
  border-radius: 20px;
  width: min(560px, 100%);
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 24px 60px rgba(0,0,0,.18);
}

.ap-modal-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 24px 24px 0;
  gap: 16px;
}

.ap-modal-head-left { display: flex; flex-direction: column; gap: 3px; }

.ap-modal-title {
  font-size: 17px;
  font-weight: 800;
  letter-spacing: -0.4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.ap-modal-sub { font-size: 12px; color: var(--muted); }

.ap-modal-close {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: none;
  cursor: pointer;
  color: var(--muted);
  font-size: 14px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  transition: all .15s;
}

.ap-modal-close:hover { background: var(--red); color: #fff; border-color: var(--red); }

.ap-modal-body { padding: 18px 24px; }

/* Form */
.ap-form-grid {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.ap-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.ap-field-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: .4px;
}

.ap-field-hint {
  font-size: 11px;
  color: var(--muted);
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 2px;
}

.ap-input {
  height: 40px;
  border: 1px solid var(--border);
  border-radius: 9px;
  padding: 0 12px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  background: var(--card);
  outline: none;
  transition: border-color .15s, box-shadow .15s;
  cursor: pointer;
}

.ap-input:focus {
  border-color: #93c5fd;
  box-shadow: 0 0 0 3px rgba(59,130,246,.12);
}

.ap-input:disabled {
  background: var(--bg);
  color: var(--muted);
  cursor: not-allowed;
}

/* Modal error */
.ap-modal-err {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  font-weight: 600;
  color: var(--red);
  background: rgba(239,68,68,.06);
  border: 1px solid rgba(239,68,68,.15);
  border-radius: 8px;
  padding: 9px 12px;
  margin-top: 14px;
}

/* Modal footer */
.ap-modal-foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 14px 24px 24px;
  border-top: 1px solid var(--border);
  margin-top: 4px;
}

/* ─── Modal transition ───────────────────── */
.ap-modal-enter-active,
.ap-modal-leave-active { transition: all .2s ease; }

.ap-modal-enter-from,
.ap-modal-leave-to {
  opacity: 0;
  transform: scale(.97) translateY(8px);
}

/* ─── Responsive ─────────────────────────── */
@media (max-width: 768px) {
  .ap { padding: 14px; }
  .ap-summary { gap: 8px; }
  .ap-stat { padding: 12px 14px; }
  .ap-stat-value { font-size: 22px; }
  .ap-search-box { min-width: 200px; }
  .ap-toolbar { flex-direction: column; align-items: flex-start; }
}

@media (max-width: 600px) {
  .ap-table thead th:nth-child(3),
  .ap-table td:nth-child(3) { display: none; }
}
</style>