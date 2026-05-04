<!-- src/components/commuters/home/NotificationDrawer.vue -->
<template>
  <Teleport to="body">
    <Transition name="nd-fade">
      <div
        v-if="modelValue"
        class="nd-overlay"
        @click="$emit('update:modelValue', false)"
      ></div>
    </Transition>

    <Transition name="nd-slide">
      <aside v-if="modelValue" class="nd" @click.stop>
        <!-- Header -->
        <header class="nd__head">
          <div class="nd__head-meta">
            <p class="nd__head-label">Notifications</p>

            <span v-if="unreadCount > 0" class="nd__unread-count">
              {{ unreadCount }} new
            </span>
          </div>

          <div class="nd__head-actions">
            <button
              v-if="items.length"
              class="nd__text-btn"
              type="button"
              @click="$emit('mark-all-read')"
            >
              Read all
            </button>

            <button
              v-if="items.length"
              class="nd__text-btn nd__text-btn--danger"
              type="button"
              @click="$emit('clear')"
            >
              Clear
            </button>

            <button
              class="nd__close"
              type="button"
              aria-label="Close"
              @click="$emit('update:modelValue', false)"
            >
              <i class="fas fa-xmark"></i>
            </button>
          </div>
        </header>

        <!-- Body -->
        <main class="nd__body">
          <!-- Empty -->
          <div v-if="items.length === 0" class="nd__empty">
            <div class="nd__empty-ring">
              <i class="fas fa-bell-slash"></i>
            </div>

            <p class="nd__empty-title">All caught up</p>
            <p class="nd__empty-sub">Nearby bus alerts will appear here.</p>
          </div>

          <!-- List -->
          <TransitionGroup
            v-else
            name="nd-item"
            tag="div"
            class="nd__list"
          >
            <div
              v-for="n in items"
              :key="n.id"
              class="nd__item"
:class="[
  { 'is-unread': !n.read },
  `is-${n.gpsFreshness || n.meta?.gpsFreshness || 'live'}`
]"              role="button"
              tabindex="0"
              @click="$emit('open', n)"
              @keydown.enter="$emit('open', n)"
              @keydown.space.prevent="$emit('open', n)"
            >
              <div class="nd__item-bar" :class="{ active: !n.read }"></div>

              <div class="nd__item-content">
                <div class="nd__item-row">
                  <div class="nd__item-icon-wrap">
                    <i class="fas fa-bus"></i>
                  </div>

                  <div class="nd__item-text">
                    <div class="nd__item-top">
                      <span class="nd__item-title">
                        {{ n.title || "Bus nearby" }}
                      </span>

                      <span class="nd__item-time">
                        {{ n.time || "Now" }}
                      </span>
                    </div>

                    <p class="nd__item-msg">{{ n.message }}</p>
                  </div>
                </div>

                <div class="nd__item-footer">
                  <span class="nd__track-pill">
                    <i class="fas fa-location-arrow"></i>
                    Tap to track
                  </span>

                  <button
                    class="nd__dismiss"
                    type="button"
                    title="Dismiss"
                    @click.stop="$emit('dismiss', n.id)"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </TransitionGroup>
        </main>
      </aside>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  items: { type: Array, default: () => [] },
});

defineEmits([
  "update:modelValue",
  "open",
  "dismiss",
  "mark-all-read",
  "clear",
]);

const unreadCount = computed(() =>
  props.items.filter((n) => !n.read).length
);
</script>

<style scoped>
/* Overlay */
.nd-overlay {
  position: fixed;
  inset: 0;
  background: rgba(10, 14, 26, 0.46);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  z-index: 9990;
}

/* Drawer */
.nd {
  position: fixed;
  top: 0;
  right: 0;
  width: min(320px, 86vw);
  height: 100dvh;
  background: #fff;
  border-left: 1px solid rgba(17, 24, 39, 0.07);
  box-shadow: -32px 0 80px rgba(10, 14, 26, 0.14);
  z-index: 9991;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Header */
.nd__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 16px 14px;
  border-bottom: 1px solid rgba(17, 24, 39, 0.06);
  flex-shrink: 0;
  gap: 12px;
  background: #fff;
}

.nd__head-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.nd__head-label {
  margin: 0;
  font-size: 16px;
  font-weight: 850;
  color: #0f172a;
  letter-spacing: -0.3px;
}

.nd__unread-count {
  font-size: 11px;
  font-weight: 750;
  color: var(--primary-blue, #1e88e5);
  background: rgba(30, 136, 229, 0.1);
  border-radius: 999px;
  padding: 3px 9px;
  white-space: nowrap;
}

.nd__head-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.nd__text-btn {
  border: none;
  background: transparent;
  font-size: 12px;
  font-weight: 750;
  color: rgba(17, 24, 39, 0.42);
  padding: 6px 7px;
  border-radius: 8px;
  cursor: pointer;
  transition: color 0.13s ease, background 0.13s ease;
  white-space: nowrap;
}

.nd__text-btn:hover {
  color: var(--primary-blue, #1e88e5);
  background: rgba(30, 136, 229, 0.06);
}

.nd__text-btn--danger:hover {
  color: #dc2626;
  background: rgba(239, 68, 68, 0.06);
}

.nd__text-btn:active {
  transform: scale(0.96);
}

.nd__close {
  width: 34px;
  height: 34px;
  border: 1px solid rgba(17, 24, 39, 0.09);
  border-radius: 9px;
  background: #f8fafc;
  color: rgba(17, 24, 39, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 13px;
  margin-left: 4px;
  transition: all 0.13s ease;
}

.nd__close:hover {
  background: rgba(239, 68, 68, 0.07);
  color: #dc2626;
  border-color: rgba(239, 68, 68, 0.15);
}

.nd__close:active {
  transform: scale(0.92);
}

/* Body */
.nd__body {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 14px;
  background: #f8fafc;
}

/* Empty */
.nd__empty {
  min-height: 230px;
  border: 1.5px dashed rgba(30, 136, 229, 0.18);
  border-radius: 18px;
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 28px 22px;
}

.nd__empty-ring {
  width: 56px;
  height: 56px;
  border-radius: 18px;
  border: 1.5px solid rgba(17, 24, 39, 0.1);
  background: #fff;
  color: rgba(17, 24, 39, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(17, 24, 39, 0.04);
}

.nd__empty-title {
  margin: 0 0 6px;
  font-size: 15px;
  font-weight: 850;
  color: #0f172a;
  letter-spacing: -0.2px;
}

.nd__empty-sub {
  margin: 0;
  font-size: 13px;
  font-weight: 500;
  color: rgba(17, 24, 39, 0.45);
  line-height: 1.5;
  max-width: 220px;
}

/* List */
.nd__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Item */
.nd__item {
  display: flex;
  align-items: stretch;
  background: #fff;
  border: 1px solid rgba(17, 24, 39, 0.08);
  border-radius: 14px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(17, 24, 39, 0.04);
  transition:
    border-color 0.13s ease,
    box-shadow 0.13s ease,
    transform 0.12s ease;
}

.nd__item:hover {
  border-color: rgba(17, 24, 39, 0.14);
  box-shadow: 0 4px 16px rgba(17, 24, 39, 0.08);
  transform: translateY(-1px);
}

.nd__item:active {
  transform: scale(0.99);
}

.nd__item.is-unread {
  border-color: rgba(30, 136, 229, 0.2);
  box-shadow: 0 2px 12px rgba(30, 136, 229, 0.07);
}

.nd__item-bar {
  width: 3px;
  flex-shrink: 0;
  background: rgba(17, 24, 39, 0.06);
}

.nd__item-bar.active {
  background: linear-gradient(
    180deg,
    var(--primary-blue, #1e88e5),
    var(--accent-teal, #00bcd4)
  );
}

.nd__item-content {
  flex: 1;
  min-width: 0;
  padding: 12px 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.nd__item-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.nd__item-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: 11px;
  background: linear-gradient(
    135deg,
    var(--primary-blue, #1e88e5) 0%,
    var(--accent-teal, #00bcd4) 100%
  );
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
}

.nd__item-text {
  flex: 1;
  min-width: 0;
}

.nd__item-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 3px;
}

.nd__item-title {
  font-size: 13px;
  font-weight: 850;
  color: #0f172a;
  line-height: 1.25;
  letter-spacing: -0.1px;
}

.nd__item-time {
  font-size: 10px;
  font-weight: 650;
  color: rgba(17, 24, 39, 0.3);
  white-space: nowrap;
  flex-shrink: 0;
  padding-top: 1px;
}

.nd__item-msg {
  margin: 0;
  font-size: 12px;
  font-weight: 500;
  color: rgba(17, 24, 39, 0.5);
  line-height: 1.45;
}

.nd__item-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nd__track-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 750;
  color: var(--primary-blue, #1e88e5);
  background: rgba(30, 136, 229, 0.08);
  border-radius: 999px;
  padding: 4px 10px;
  letter-spacing: 0.1px;
}
.nd__item.is-warning {
  border-color: rgba(245, 158, 11, 0.28);
  background: #fffbeb;
}

.nd__item.is-lastKnown,
.nd__item.is-hidden {
  border-color: rgba(156, 163, 175, 0.28);
  background: #f9fafb;
}

.nd__item.is-warning .nd__item-icon-wrap {
  background: #f59e0b;
}

.nd__item.is-lastKnown .nd__item-icon-wrap,
.nd__item.is-hidden .nd__item-icon-wrap {
  background: #9ca3af;
}

.nd__item.is-warning .nd__track-pill,
.nd__item.is-lastKnown .nd__track-pill,
.nd__item.is-hidden .nd__track-pill {
  color: #6b7280;
  background: #f3f4f6;
}
.nd__track-pill i {
  font-size: 9px;
}

.nd__dismiss {
  border: none;
  background: transparent;
  font-size: 11px;
  font-weight: 750;
  color: rgba(17, 24, 39, 0.28);
  padding: 4px 6px;
  border-radius: 6px;
  cursor: pointer;
  transition: color 0.12s ease;
  letter-spacing: 0.1px;
}

.nd__dismiss:hover {
  color: #dc2626;
}

.nd__dismiss:active {
  transform: scale(0.94);
}

/* Drawer transitions */
.nd-fade-enter-active,
.nd-fade-leave-active {
  transition: opacity 0.2s ease;
}

.nd-fade-enter-from,
.nd-fade-leave-to {
  opacity: 0;
}

.nd-slide-enter-active,
.nd-slide-leave-active {
  transition:
    transform 0.28s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.2s ease;
}

.nd-slide-enter-from,
.nd-slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* Card list transitions */
.nd-item-enter-active,
.nd-item-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease,
    max-height 0.24s ease,
    margin 0.24s ease;
}

.nd-item-enter-from {
  opacity: 0;
  transform: translateX(28px) scale(0.98);
  max-height: 0;
  margin-top: 0;
  margin-bottom: 0;
}

.nd-item-enter-to {
  opacity: 1;
  transform: translateX(0) scale(1);
  max-height: 170px;
}

.nd-item-leave-from {
  opacity: 1;
  transform: translateX(0) scale(1);
  max-height: 170px;
}

.nd-item-leave-to {
  opacity: 0;
  transform: translateX(36px) scale(0.96);
  max-height: 0;
  margin-top: 0;
  margin-bottom: 0;
}

.nd-item-move {
  transition: transform 0.22s ease;
}

.nd-item-leave-active {
  overflow: hidden;
}

@media (max-width: 420px) {
  .nd {
    width: 84vw;
    max-width: 320px;
  }

  .nd__head {
    padding: 16px 14px 14px;
  }
}
</style>