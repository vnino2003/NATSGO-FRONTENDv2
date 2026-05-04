<!-- src/pages/admin/AlertsPage.vue -->
<template>
  <div class="al">

    <!-- ── Header ── -->
    <div class="al-header">
      <div class="al-header-left">
        <div class="al-title-row">
          <h1 class="al-title">Alerts</h1>
          <span class="al-live-badge" v-if="filtered.some(n => n.active && n.unread)">
            <span class="al-live-dot"></span>
            New
          </span>
        </div>
        <p class="al-subtitle">System events · IoT health · Auth logs · Bus updates</p>
      </div>

      <div class="al-header-right">
        <div class="al-search">
          <i class="fas fa-magnifying-glass al-search-icon"></i>
          <input
            v-model="q"
            class="al-search-input"
            type="text"
            placeholder="Search title, message, type…"
            @keyup.enter="refresh"
          />
          <button v-if="q" class="al-search-clear" @click="q = ''">
            <i class="fas fa-xmark"></i>
          </button>
        </div>
        <button class="al-btn-ghost" @click="onClearResolved" :disabled="loading">
          <i class="fas fa-broom"></i>
          Clear Resolved
        </button>
        <button class="al-btn-danger" @click="onClearAll" :disabled="loading">
          <i class="fas fa-trash"></i>
          Clear All
        </button>
        <button class="al-btn-primary" @click="refresh" :disabled="loading">
          <i class="fas fa-rotate" :class="{ 'fa-spin': loading }"></i>
          {{ loading ? 'Refreshing…' : 'Refresh' }}
        </button>
      </div>
    </div>

    <!-- ── Summary cards ── -->
    <div class="al-summary">
      <div class="al-stat">
        <div class="al-stat-value">{{ sorted.length }}</div>
        <div class="al-stat-label">Total</div>
      </div>
      <div class="al-stat al-stat--red">
        <div class="al-stat-value">{{ filterCount('critical') }}</div>
        <div class="al-stat-label">Critical</div>
      </div>
      <div class="al-stat al-stat--amber">
        <div class="al-stat-value">{{ filterCount('warning') }}</div>
        <div class="al-stat-label">Warnings</div>
      </div>
      <div class="al-stat al-stat--blue">
        <div class="al-stat-value">{{ filterCount('unread') }}</div>
        <div class="al-stat-label">Unread</div>
      </div>
      <div class="al-stat al-stat--green">
        <div class="al-stat-value">{{ filterCount('resolved') }}</div>
        <div class="al-stat-label">Resolved</div>
      </div>
    </div>

    <!-- ── Filters + pager ── -->
    <div class="al-toolbar">
      <div class="al-filters">
        <button
          v-for="f in filters"
          :key="f.key"
          class="al-pill"
          :class="{ 'al-pill--active': activeFilter === f.key }"
          @click="activeFilter = f.key"
        >
          {{ f.label }}
          <span class="al-pill-count">{{ filterCount(f.key) }}</span>
        </button>
      </div>

      <div class="al-pager">
        <button class="al-icon-btn" :disabled="offset === 0 || loading" @click="prevPage">
          <i class="fas fa-chevron-left"></i>
        </button>
        <span class="al-page-info">
          {{ offset + 1 }}–{{ Math.min(offset + limit, total) }} <span class="al-page-of">of {{ total }}</span>
        </span>
        <button class="al-icon-btn" :disabled="offset + limit >= total || loading" @click="nextPage">
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>

    <!-- ── Error ── -->
    <div v-if="hasError" class="al-error">
      <i class="fas fa-triangle-exclamation"></i>
      {{ error }}
    </div>

    <!-- ── List ── -->
    <div class="al-list">

      <!-- Empty -->
      <div v-if="!loading && filtered.length === 0" class="al-empty">
        <i class="fas fa-bell-slash"></i>
        <p>No notifications found</p>
        <small>Try adjusting your search or filter</small>
      </div>

      <!-- Notification cards -->
      <div
        v-for="n in filtered"
        :key="n.id"
        class="al-card"
        :class="[
          `al-card--${sevKey(n.severity)}`,
          { 'al-card--unread': n.unread, 'al-card--resolved': !n.active }
        ]"
      >
        <!-- Severity bar -->
        <div class="al-card-bar" :class="`al-bar--${sevKey(n.severity)}`"></div>

        <!-- Icon -->
        <div class="al-card-icon" :class="`al-icon--${sevKey(n.severity)}`">
          <i :class="iconFor(n)"></i>
        </div>

        <!-- Body -->
        <div class="al-card-body">
          <div class="al-card-top">
            <div class="al-card-title-row">
              <span class="al-card-title">{{ n.title }}</span>
              <span v-if="n.unread" class="al-unread-dot" title="Unread"></span>
            </div>
            <div class="al-card-badges">
              <span class="al-badge al-badge--cat">{{ categoryLabel(n.category) }}</span>
              <span class="al-badge" :class="`al-badge--${sevKey(n.severity)}`">{{ severityLabel(n.severity) }}</span>
              <span class="al-badge" :class="n.active ? 'al-badge--active' : 'al-badge--resolved'">
                {{ n.active ? 'Active' : 'Resolved' }}
              </span>
            </div>
          </div>

          <p class="al-card-msg">{{ n.message }}</p>

          <div class="al-card-footer">
            <div class="al-card-meta">
              <span class="al-meta-item">
                <i class="fas fa-clock"></i>
                {{ prettyTime(n.updated_at || n.created_at) }}
              </span>
              <span v-if="n.type" class="al-meta-sep">·</span>
              <span v-if="n.type" class="al-meta-item">{{ n.type }}</span>
              <span v-if="n.dedupe_key" class="al-meta-sep">·</span>
              <span v-if="n.dedupe_key" class="al-meta-item al-mono">{{ n.dedupe_key }}</span>
            </div>

            <div class="al-card-actions">
              <button v-if="n.unread" class="al-action-btn" @click="markRead(n.id)" title="Mark as read">
                <i class="fas fa-envelope-open"></i>
                <span>Read</span>
              </button>
              <button v-else class="al-action-btn" @click="markUnread(n.id)" title="Mark as unread">
                <i class="fas fa-envelope"></i>
                <span>Unread</span>
              </button>
              <button v-if="n.active" class="al-action-btn al-action-btn--resolve" @click="resolve(n.id)" title="Resolve">
                <i class="fas fa-check"></i>
                <span>Resolve</span>
              </button>
              <button class="al-action-btn al-action-btn--delete" @click="onDeleteOne(n)" title="Delete">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading skeletons -->
      <template v-if="loading && sorted.length === 0">
        <div v-for="n in 5" :key="'sk-' + n" class="al-card al-card-skeleton">
          <div class="al-card-bar al-bar--gray"></div>
          <div class="al-skel al-skel-icon"></div>
          <div class="al-card-body">
            <div class="al-skel" style="width:60%;height:14px;margin-bottom:8px;"></div>
            <div class="al-skel" style="width:90%;height:12px;margin-bottom:6px;"></div>
            <div class="al-skel" style="width:40%;height:10px;"></div>
          </div>
        </div>
      </template>

    </div>

    <!-- ── Footer ── -->
    <div class="al-footer" v-if="!loading && sorted.length > 0">
      <span class="al-footer-text">
        Showing <b>{{ filtered.length }}</b> of <b>{{ total }}</b> notifications
      </span>
      <div class="al-pager">
        <button class="al-icon-btn" :disabled="offset === 0 || loading" @click="prevPage">
          <i class="fas fa-chevron-left"></i>
        </button>
        <span class="al-page-info">
          Page {{ Math.floor(offset / limit) + 1 }}
        </span>
        <button class="al-icon-btn" :disabled="offset + limit >= total || loading" @click="nextPage">
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useNotifications } from "@/composables/useNotifications";

const q             = ref("");
const activeFilter  = ref("all");

const filters = [
  { key: "all",      label: "All" },
  { key: "active",   label: "Active" },
  { key: "unread",   label: "Unread" },
  { key: "critical", label: "Critical" },
  { key: "warning",  label: "Warnings" },
  { key: "info",     label: "Info" },
  { key: "resolved", label: "Resolved" },
];

const {
  rows,
  total,
  limit,
  offset,
  loading,
  error,
  hasError,
  refreshAll,
  setPage,
  markRead,
  markUnread,
  resolve,
  remove,
  clear,
  severityLabel,
  severityClass,
  categoryLabel,
} = useNotifications();

onMounted(() => refresh());

function refresh() {
  setPage(0);
  refreshAll({ q: q.value });
}

function nextPage() {
  setPage(offset.value + limit.value);
  refreshAll({ q: q.value });
}

function prevPage() {
  setPage(Math.max(offset.value - limit.value, 0));
  refreshAll({ q: q.value });
}

function prettyTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" });
}

function iconFor(n) {
  if (n.severity === 3) return "fas fa-circle-exclamation";
  if (n.severity === 2) return "fas fa-triangle-exclamation";
  return "fas fa-circle-info";
}

function sevKey(severity) {
  if (severity === 3) return "red";
  if (severity === 2) return "amber";
  return "blue";
}

function sortTs(n) {
  const t = new Date(n?.updated_at || n?.created_at || 0).getTime();
  return Number.isFinite(t) ? t : 0;
}

const sorted = computed(() => {
  const list = Array.isArray(rows.value) ? [...rows.value] : [];
  list.sort((a, b) => sortTs(b) - sortTs(a));
  return list;
});

const filtered = computed(() => {
  const f = activeFilter.value;
  let list = [...sorted.value];
  if (f === "active")   list = list.filter(x => x.active);
  if (f === "resolved") list = list.filter(x => !x.active);
  if (f === "unread")   list = list.filter(x => x.unread);
  if (f === "critical") list = list.filter(x => x.severity === 3);
  if (f === "warning")  list = list.filter(x => x.severity === 2);
  if (f === "info")     list = list.filter(x => x.severity === 1);
  return list;
});

function filterCount(key) {
  const list = sorted.value;
  if (key === "all")      return list.length;
  if (key === "active")   return list.filter(x => x.active).length;
  if (key === "resolved") return list.filter(x => !x.active).length;
  if (key === "unread")   return list.filter(x => x.unread).length;
  if (key === "critical") return list.filter(x => x.severity === 3).length;
  if (key === "warning")  return list.filter(x => x.severity === 2).length;
  if (key === "info")     return list.filter(x => x.severity === 1).length;
  return 0;
}

async function onDeleteOne(n) {
  const ok = confirm(`Delete this notification?\n\n${n.title}`);
  if (!ok) return;
  await remove(n.id);
}

async function onClearResolved() {
  const ok = confirm("Clear all resolved notifications?");
  if (!ok) return;
  await clear({ mode: "resolved" });
}

async function onClearAll() {
  const ok = confirm("⚠️ Clear ALL notifications? This cannot be undone.");
  if (!ok) return;
  await clear({ mode: "all" });
}
</script>

<style scoped>
/* ─── Tokens ─────────────────────────────── */
.al {
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
.al-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.al-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.al-title {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.5px;
  margin: 0;
}

.al-subtitle {
  font-size: 12px;
  color: var(--muted);
  margin: 4px 0 0;
}

.al-live-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 999px;
  background: rgba(239,68,68,.1);
  color: var(--red);
}

.al-live-dot {
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

.al-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

/* Search */
.al-search {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 8px 12px;
  min-width: 260px;
  transition: all .15s;
}

.al-search:focus-within {
  border-color: var(--blue);
  box-shadow: 0 0 0 3px rgba(59,130,246,.1);
}

.al-search-icon { color: var(--muted); font-size: 12px; flex-shrink: 0; }

.al-search-input {
  border: none;
  outline: none;
  background: transparent;
  font-size: 13px;
  flex: 1;
  color: var(--text);
  font-family: inherit;
}

.al-search-input::placeholder { color: var(--muted); }

.al-search-clear {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--muted);
  padding: 0;
  font-size: 11px;
}

/* Buttons */
.al-btn-ghost {
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
  white-space: nowrap;
  transition: all .15s;
  font-family: inherit;
}
.al-btn-ghost:hover { color: var(--text); border-color: #94a3b8; }
.al-btn-ghost:disabled { opacity: .5; cursor: not-allowed; }

.al-btn-danger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid rgba(239,68,68,.2);
  background: rgba(239,68,68,.06);
  font-size: 13px;
  font-weight: 700;
  color: var(--red);
  cursor: pointer;
  white-space: nowrap;
  transition: all .15s;
  font-family: inherit;
}
.al-btn-danger:hover { background: rgba(239,68,68,.12); }
.al-btn-danger:disabled { opacity: .5; cursor: not-allowed; }

.al-btn-primary {
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
  white-space: nowrap;
  transition: opacity .15s;
  font-family: inherit;
}
.al-btn-primary:hover { opacity: .85; }
.al-btn-primary:disabled { opacity: .5; cursor: not-allowed; }

/* ─── Summary ────────────────────────────── */
.al-summary {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.al-stat {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 14px 20px;
  min-width: 90px;
  flex: 1;
}

.al-stat-value {
  font-size: 26px;
  font-weight: 900;
  line-height: 1;
  letter-spacing: -1px;
}

.al-stat-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--muted);
  margin-top: 4px;
  text-transform: uppercase;
  letter-spacing: .5px;
}

.al-stat--red   .al-stat-value { color: var(--red); }
.al-stat--amber .al-stat-value { color: var(--amber); }
.al-stat--blue  .al-stat-value { color: var(--blue); }
.al-stat--green .al-stat-value { color: var(--green); }

/* ─── Toolbar ────────────────────────────── */
.al-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.al-filters {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.al-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--card);
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
  cursor: pointer;
  transition: all .15s;
  font-family: inherit;
}

.al-pill:hover { color: var(--text); border-color: #94a3b8; }

.al-pill--active {
  background: var(--text);
  border-color: var(--text);
  color: #fff;
}

.al-pill-count {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 999px;
  background: rgba(255,255,255,.2);
}

.al-pill:not(.al-pill--active) .al-pill-count {
  background: var(--bg);
  color: var(--muted);
}

.al-pager {
  display: flex;
  align-items: center;
  gap: 8px;
}

.al-page-info {
  font-size: 12px;
  font-weight: 700;
  color: var(--text);
  white-space: nowrap;
}

.al-page-of { color: var(--muted); font-weight: 600; }

.al-icon-btn {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--card);
  cursor: pointer;
  color: var(--muted);
  font-size: 11px;
  display: grid;
  place-items: center;
  transition: all .15s;
  font-family: inherit;
}
.al-icon-btn:hover:not(:disabled) { color: var(--text); border-color: #94a3b8; }
.al-icon-btn:disabled { opacity: .4; cursor: not-allowed; }

/* ─── Error ──────────────────────────────── */
.al-error {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid rgba(239,68,68,.2);
  background: rgba(239,68,68,.06);
  color: #991b1b;
  font-size: 13px;
  font-weight: 700;
}

/* ─── List ───────────────────────────────── */
.al-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* ─── Empty ──────────────────────────────── */
.al-empty {
  padding: 56px 20px;
  text-align: center;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--muted);
}

.al-empty i { font-size: 28px; display: block; margin-bottom: 12px; opacity: .5; }
.al-empty p { font-weight: 800; color: var(--text); margin: 0 0 4px; }
.al-empty small { font-size: 12px; }

/* ─── Card ───────────────────────────────── */
.al-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  transition: box-shadow .15s, border-color .15s;
  position: relative;
}

.al-card:hover { border-color: #cbd5e1; box-shadow: 0 2px 12px rgba(0,0,0,.06); }

/* Unread — blue ring */
.al-card--unread {
  border-color: rgba(59,130,246,.3);
  box-shadow: 0 0 0 2px rgba(59,130,246,.1);
}

/* Resolved — dimmed */
.al-card--resolved:not(.al-card--unread) {
  opacity: .72;
}

.al-card--resolved:not(.al-card--unread) .al-card-title,
.al-card--resolved:not(.al-card--unread) .al-card-msg {
  color: var(--muted);
}

/* Left severity bar */
.al-card-bar {
  width: 4px;
  align-self: stretch;
  flex-shrink: 0;
  border-radius: 0;
}

.al-bar--red   { background: var(--red); }
.al-bar--amber { background: var(--amber); }
.al-bar--blue  { background: var(--blue); }
.al-bar--gray  { background: #e2e8f0; }

/* Icon */
.al-card-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  font-size: 15px;
  flex-shrink: 0;
  margin: 14px 0 14px 0;
}

.al-icon--red   { background: rgba(239,68,68,.08);  color: var(--red); }
.al-icon--amber { background: rgba(245,158,11,.08); color: var(--amber); }
.al-icon--blue  { background: rgba(59,130,246,.08); color: var(--blue); }

/* Body */
.al-card-body {
  flex: 1;
  min-width: 0;
  padding: 14px 14px 14px 0;
}

.al-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.al-card-title-row {
  display: flex;
  align-items: center;
  gap: 7px;
}

.al-card-title {
  font-size: 13px;
  font-weight: 800;
  color: var(--text);
}

.al-unread-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--blue);
  flex-shrink: 0;
}

.al-card-badges {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
  flex-shrink: 0;
}

/* Badges */
.al-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  border: 1px solid transparent;
}

.al-badge--cat      { background: #f1f5f9; color: var(--muted); border-color: var(--border); }
.al-badge--red      { background: rgba(239,68,68,.08);  color: #991b1b; border-color: rgba(239,68,68,.2); }
.al-badge--amber    { background: rgba(245,158,11,.08); color: #78350f; border-color: rgba(245,158,11,.2); }
.al-badge--blue     { background: rgba(59,130,246,.08); color: #1e40af; border-color: rgba(59,130,246,.2); }
.al-badge--active   { background: rgba(245,158,11,.08); color: #78350f; border-color: rgba(245,158,11,.2); }
.al-badge--resolved { background: #f1f5f9; color: var(--muted); border-color: var(--border); }

/* Message */
.al-card-msg {
  font-size: 12px;
  color: var(--muted);
  margin: 6px 0 10px;
  line-height: 1.5;
  word-break: break-word;
}

/* Footer */
.al-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.al-card-meta {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
}

.al-meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  color: var(--muted);
}

.al-meta-sep { font-size: 11px; color: #cbd5e1; }
.al-mono { font-family: monospace; font-size: .9em; }

/* Action buttons */
.al-card-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.al-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 28px;
  padding: 0 10px;
  border-radius: 7px;
  border: 1px solid var(--border);
  background: transparent;
  font-size: 11px;
  font-weight: 700;
  color: var(--muted);
  cursor: pointer;
  transition: all .15s;
  font-family: inherit;
  white-space: nowrap;
}

.al-action-btn:hover {
  background: var(--bg);
  color: var(--text);
  border-color: #94a3b8;
}

.al-action-btn--resolve {
  color: var(--green);
  border-color: rgba(16,185,129,.25);
}

.al-action-btn--resolve:hover {
  background: rgba(16,185,129,.06);
  border-color: rgba(16,185,129,.4);
  color: var(--green);
}

.al-action-btn--delete {
  color: var(--red);
  border-color: rgba(239,68,68,.2);
  padding: 0 8px;
}

.al-action-btn--delete:hover {
  background: rgba(239,68,68,.06);
  border-color: rgba(239,68,68,.35);
}

/* ─── Skeleton ───────────────────────────── */
@keyframes shimmer {
  0%, 100% { opacity: .45; }
  50%       { opacity: .85; }
}

.al-skel {
  display: block;
  background: #e2e8f0;
  border-radius: 6px;
  animation: shimmer 1.4s ease-in-out infinite;
}

.al-skel-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  margin: 14px 0;
  flex-shrink: 0;
}

.al-card-skeleton { pointer-events: none; }

/* ─── Footer ─────────────────────────────── */
.al-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2px;
  flex-wrap: wrap;
  gap: 12px;
}

.al-footer-text {
  font-size: 12px;
  color: var(--muted);
}

.al-footer-text b { font-weight: 700; color: var(--text); }

/* ─── Responsive ─────────────────────────── */
@media (max-width: 900px) {
  .al-header { flex-direction: column; }
  .al-header-right { width: 100%; }
  .al-search { min-width: 0; flex: 1; }
}

@media (max-width: 640px) {
  .al { padding: 14px; gap: 14px; }
  .al-summary { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .al-card-top { flex-direction: column; }
  .al-card-footer { flex-direction: column; align-items: flex-start; }
}
</style>