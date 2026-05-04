<!-- src/components/commuters/home/AnnouncementsTab.vue -->
<template>
  <div class="an-page">

    <!-- Page label -->
    <div class="an-header">
      <span class="an-header-title">Announcements</span>
      <span class="an-header-count" v-if="safeItems.length">{{ safeItems.length }}</span>
    </div>

    <!-- Empty -->
    <div v-if="!safeItems.length" class="an-empty">
      <div class="an-empty-icon">
        <i class="fas fa-bell-slash"></i>
      </div>
      <p class="an-empty-title">No announcements</p>
      <p class="an-empty-sub">Check back later for updates.</p>
    </div>

    <!-- List -->
    <div v-else class="an-list">
      <div
        v-for="item in safeItems"
        :key="item.id"
        class="an-card"
        :class="`an-card--${normalizeType(item.type)}`"
      >
        <!-- Left bar -->
        <div class="an-bar" :class="`an-bar--${normalizeType(item.type)}`"></div>

        <!-- Content -->
        <div class="an-content">
          <div class="an-top">
            <span class="an-type-tag" :class="`an-type-tag--${normalizeType(item.type)}`">
              <i class="fas" :class="typeIcon(item.type)"></i>
              {{ typeLabel(item.type) }}
            </span>
            <span class="an-date">{{ formatDate(item.created_at) }}</span>
          </div>
          <p class="an-title">{{ item.title }}</p>
          <p class="an-body">{{ item.body }}</p>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  items: { type: Array, default: () => [] },
});

const safeItems = computed(() =>
  Array.isArray(props.items) ? props.items : []
);

function normalizeType(type) {
  const v = String(type || "info").toLowerCase();
  return ["info", "holiday", "alert"].includes(v) ? v : "info";
}

function typeLabel(type) {
  return { info: "Info", holiday: "Holiday", alert: "Alert" }[normalizeType(type)] ?? "Info";
}

function typeIcon(type) {
  return {
    info:    "fa-circle-info",
    holiday: "fa-star",
    alert:   "fa-triangle-exclamation",
  }[normalizeType(type)] ?? "fa-circle-info";
}

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
</script>

<style scoped>
/* ── Page wrapper ── */
.an-page {
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* ── Header ── */
.an-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 0 12px;
}
.an-header-title {
  font-size: 13px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.1px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.an-header-count {
  font-size: 11px;
  font-weight: 700;
  color: rgba(17, 24, 39, 0.4);
  background: rgba(17, 24, 39, 0.06);
  border-radius: 999px;
  padding: 2px 8px;
}

/* ── Empty ── */
.an-empty {
  text-align: center;
  padding: 40px 16px;
}
.an-empty-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: rgba(17, 24, 39, 0.04);
  border: 1px solid rgba(17, 24, 39, 0.08);
  color: rgba(17, 24, 39, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  margin: 0 auto 14px;
}
.an-empty-title {
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 700;
  color: #111827;
}
.an-empty-sub {
  margin: 0;
  font-size: 12px;
  font-weight: 500;
  color: rgba(17, 24, 39, 0.38);
}

/* ── List ── */
.an-list {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

/* ── Card ── */
.an-card {
  display: flex;
  align-items: stretch;
  background: #fff;
  border: 1px solid rgba(17, 24, 39, 0.08);
  border-radius: 13px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(17, 24, 39, 0.04);
}

.an-card--alert  { border-color: rgba(239, 68, 68, 0.18); background: rgba(255, 247, 247, 0.6); }
.an-card--holiday { border-color: rgba(245, 158, 11, 0.2); background: rgba(255, 251, 235, 0.6); }
.an-card--info   { border-color: rgba(30, 136, 229, 0.15); background: #fff; }

/* Left accent bar */
.an-bar {
  width: 3px;
  flex-shrink: 0;
}
.an-bar--info    { background: var(--primary-blue, #1e88e5); }
.an-bar--holiday { background: #f59e0b; }
.an-bar--alert   { background: #ef4444; }

/* Content */
.an-content {
  flex: 1;
  min-width: 0;
  padding: 11px 12px;
}
.an-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}

/* Type tag */
.an-type-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  font-weight: 800;
  border-radius: 999px;
  padding: 3px 8px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
.an-type-tag--info {
  color: var(--primary-blue, #1e88e5);
  background: rgba(30, 136, 229, 0.09);
}
.an-type-tag--holiday {
  color: #b45309;
  background: rgba(245, 158, 11, 0.1);
}
.an-type-tag--alert {
  color: #dc2626;
  background: rgba(239, 68, 68, 0.09);
}

/* Date */
.an-date {
  font-size: 10px;
  font-weight: 600;
  color: rgba(17, 24, 39, 0.3);
  white-space: nowrap;
  flex-shrink: 0;
}

/* Title & body */
.an-title {
  margin: 0 0 3px;
  font-size: 13px;
  font-weight: 700;
  color: #111827;
  line-height: 1.3;
  letter-spacing: -0.1px;
}
.an-body {
  margin: 0;
  font-size: 12px;
  font-weight: 500;
  color: rgba(17, 24, 39, 0.5);
  line-height: 1.45;
}
</style>