<template>
  <div v-if="current" class="sab-ticker" :class="severityClass(current.severity)">
    
    <!-- Icon -->
    <div class="sab-icon">
      <i :class="iconFor(current.severity)"></i>
    </div>

    <!-- Marquee Text -->
    <div class="sab-marquee">
      <span>
        {{ current.title }} — {{ current.meta }}
      </span>
    </div>

    <!-- Dismiss -->
    <button class="sab-dismiss" @click="dismiss(current.id)" aria-label="Dismiss">
      <i class="fas fa-xmark"></i>
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";

const props = defineProps({
  items: { type: Array, default: () => [] },
});

const emit = defineEmits(["dismiss"]);

const index = ref(0);
let timer = null;

// Current active alert
const current = computed(() => {
  if (!props.items.length) return null;
  return props.items[index.value];
});

// Auto rotate alerts
onMounted(() => {
  timer = setInterval(() => {
    if (props.items.length > 1) {
      index.value = (index.value + 1) % props.items.length;
    }
  }, 4000); // change every 4 seconds
});

onBeforeUnmount(() => {
  clearInterval(timer);
});

// Dismiss current alert
function dismiss(id) {
  emit("dismiss", id);

  // reset index safely after removal
  setTimeout(() => {
    if (index.value >= props.items.length) {
      index.value = 0;
    }
  }, 0);
}

// Styling helpers
function severityClass(s) {
  return {
    warning: "sab--warning",
    info: "sab--info",
    error: "sab--error",
  }[s] || "sab--info";
}

function iconFor(s) {
  return {
    warning: "fas fa-clock",
    info: "fas fa-circle-info",
    error: "fas fa-triangle-exclamation",
  }[s] || "fas fa-bell";
}
</script>

<style scoped>
/* ─────────────────────────────
   MAIN TICKER BAR
───────────────────────────── */
.sab-ticker {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  background: var(--bg-white);
  border-left: 4px solid var(--primary-blue);
  overflow: hidden;
  position: relative;
}

/* ICON */
.sab-icon {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  flex-shrink: 0;
}

/* MARQUEE TEXT */
.sab-marquee {
  flex: 1;
  overflow: hidden;
  white-space: nowrap;
  position: relative;
}

.sab-marquee span {
  display: inline-block;
  padding-left: 100%;
  animation: scroll 8s linear infinite;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-dark);
}

/* SCROLL ANIMATION */
@keyframes scroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(-100%); }
}

/* DISMISS BUTTON */
.sab-dismiss {
  background: none;
  border: none;
  font-size: 14px;
  cursor: pointer;
  color: var(--text-gray);
  opacity: 0.7;
  transition: 0.2s;
}
.sab-dismiss:hover {
  opacity: 1;
}

/* ─────────────────────────────
   SEVERITY THEMES
───────────────────────────── */

/* WARNING */
.sab--warning {
  border-left-color: #f59e0b;
}
.sab--warning .sab-icon {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}

/* INFO */
.sab--info {
  border-left-color: #3b82f6;
}
.sab--info .sab-icon {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
}

/* ERROR */
.sab--error {
  border-left-color: #ef4444;
}
.sab--error .sab-icon {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}
</style>