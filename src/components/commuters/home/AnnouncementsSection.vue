<template>
  <div v-if="items.length" class="ann-section section">
    <div class="ann-card">
      <!-- Header (toggle) -->
      <button class="ann-header" @click="open = !open" type="button">
        <div class="ann-header-left">
          <span class="ann-dot"></span>
          <span class="ann-header-title">Announcements</span>
          <span v-if="unread > 0" class="ann-badge">{{ unread }} new</span>
        </div>
        <i class="fas ann-chevron" :class="open ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
      </button>

      <!-- Body -->
      <Transition name="ann-expand">
        <div v-if="open" class="ann-body">
          <div
            v-for="item in items"
            :key="item.id"
            class="ann-item"
            :class="{ 'ann-item--unread': !item.read }"
            @click="onRead(item)"
          >
            <div class="ann-item-icon" :class="`ann-icon--${item.type}`">
              <i :class="iconFor(item.type)"></i>
            </div>

            <div class="ann-item-content">
              <p class="ann-item-title">{{ item.title }}</p>
              <p class="ann-item-sub">{{ item.body }}</p>
              <p class="ann-item-date">
                <i class="fas fa-calendar-days"></i>
                {{ item.date }}
              </p>
            </div>

            <span v-if="!item.read" class="ann-unread-dot"></span>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

const props = defineProps({
  items: { type: Array, default: () => [] },
  // each item: { id, title, body, date, type: 'holiday' | 'info' | 'notice', read: Boolean }
});

const emit = defineEmits(["read"]);

const open = ref(true);

const unread = computed(() => props.items.filter(i => !i.read).length);

function onRead(item) {
  if (!item.read) emit("read", item.id);
}

function iconFor(type) {
  return {
    holiday: "fas fa-calendar-star",
    info:    "fas fa-circle-info",
    notice:  "fas fa-megaphone",
  }[type] ?? "fas fa-circle-info";
}
</script>

<style scoped>
.ann-card {
  background: var(--bg-white);
  border: 2px solid var(--border-light);
  border-radius: 12px;
  overflow: hidden;
}

.ann-header {
  width: 100%;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: none;
  border: none;
  cursor: pointer;
  transition: background 0.2s;
}
.ann-header:hover  { background: var(--light-bg); }
.ann-header:active { background: var(--border-light); }

.ann-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ann-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--success-green);
  flex-shrink: 0;
}

.ann-header-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-dark);
}

.ann-badge {
  background: rgba(16, 185, 129, 0.12);
  color: var(--success-green);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 10px;
  font-weight: 800;
}

.ann-chevron {
  color: var(--text-gray);
  font-size: 12px;
  transition: transform 0.25s ease;
}

.ann-body {
  border-top: 2px solid var(--border-light);
}

.ann-item {
  padding: 14px 16px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
  border-bottom: 1px solid var(--border-light);
  cursor: pointer;
  transition: background 0.2s;
  position: relative;
}
.ann-item:last-child    { border-bottom: none; }
.ann-item:hover         { background: var(--light-bg); }
.ann-item--unread       { background: rgba(16, 185, 129, 0.04); }

.ann-item-icon {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
}

.ann-icon--holiday { background: rgba(255, 152, 0, 0.12); color: var(--warning-orange); }
.ann-icon--info    { background: rgba(16, 185, 129, 0.12); color: var(--success-green); }
.ann-icon--notice  { background: rgba(30, 136, 229, 0.12); color: var(--primary-blue);  }

.ann-item-content  { flex: 1; min-width: 0; }

.ann-item-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-dark);
  margin: 0 0 3px;
  line-height: 1.3;
}

.ann-item-sub {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-gray);
  margin: 0 0 5px;
  line-height: 1.4;
}

.ann-item-date {
  font-size: 10px;
  color: var(--text-gray);
  opacity: 0.7;
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 0;
}

.ann-unread-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent-teal);
  flex-shrink: 0;
  align-self: center;
}

/* Transition */
.ann-expand-enter-active { transition: all 0.28s ease; }
.ann-expand-leave-active { transition: all 0.22s ease; }
.ann-expand-enter-from, .ann-expand-leave-to { opacity: 0; transform: translateY(-6px); }
</style>