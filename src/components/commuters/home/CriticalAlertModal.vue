<template>
  <Teleport to="body">
    <Transition name="ca-fade">
      <div v-if="modelValue" class="ca-overlay" @click.self="onOverlayClick">
        <Transition name="ca-slide">
          <div v-if="modelValue" class="ca-modal" role="alertdialog" aria-modal="true" aria-labelledby="ca-title">
            <div class="ca-top">
              <div class="ca-icon">
                <i class="fas fa-triangle-exclamation"></i>
              </div>
              <div class="ca-top-text">
                <p id="ca-title" class="ca-heading">{{ title }}</p>
                <p class="ca-sub">{{ subtitle }}</p>
              </div>
              <button class="ca-close" @click="close" type="button" aria-label="Close">
                <i class="fas fa-xmark"></i>
              </button>
            </div>

            <div class="ca-body">
              <p class="ca-detail">{{ body }}</p>

              <div v-if="affectedRoutes.length" class="ca-routes">
                <p class="ca-routes-label">Affected routes</p>
                <div class="ca-routes-list">
                  <span v-for="r in affectedRoutes" :key="r" class="ca-route-pill">{{ r }}</span>
                </div>
              </div>

              <div class="ca-actions">
                <button class="ca-btn-primary" @click="onAction" type="button">
                  <i class="fas fa-map-location-dot"></i>
                  View Alternate Routes
                </button>
                <button class="ca-btn-secondary" @click="close" type="button">Dismiss</button>
              </div>

              <p class="ca-timestamp">
                <i class="fas fa-clock"></i>
                {{ timestamp }}
              </p>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
const props = defineProps({
  modelValue:    { type: Boolean, default: false },
  title:         { type: String,  default: "Service Disruption" },
  subtitle:      { type: String,  default: "" },
  body:          { type: String,  default: "" },
  affectedRoutes:{ type: Array,   default: () => [] },
  timestamp:     { type: String,  default: "" },
  dismissable:   { type: Boolean, default: false },
});

const emit = defineEmits(["update:modelValue", "action"]);

function close()    { emit("update:modelValue", false); }
function onAction() { emit("action"); close(); }
function onOverlayClick() { if (props.dismissable) close(); }
</script>

<style scoped>
.ca-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.ca-modal {
  width: 100%;
  max-width: 400px;
  background: var(--bg-white);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.3);
}

.ca-top {
  background: linear-gradient(135deg, #b91c1c 0%, #ef4444 100%);
  padding: 20px;
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.ca-icon {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 22px;
  flex-shrink: 0;
}

.ca-top-text { flex: 1; }

.ca-heading {
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 4px;
  line-height: 1.3;
}

.ca-sub {
  color: rgba(255, 255, 255, 0.85);
  font-size: 12px;
  font-weight: 600;
  margin: 0;
  line-height: 1.4;
}

.ca-close {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.2s;
}
.ca-close:hover { background: rgba(255, 255, 255, 0.3); }

.ca-body { padding: 20px; }

.ca-detail {
  font-size: 14px;
  color: var(--text-gray);
  line-height: 1.6;
  margin: 0 0 16px;
}

.ca-routes-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-gray);
  margin: 0 0 8px;
}

.ca-routes-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.ca-route-pill {
  background: rgba(239, 68, 68, 0.1);
  color: var(--error-red);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 999px;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 800;
}

.ca-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
}

.ca-btn-primary {
  flex: 1;
  background: linear-gradient(135deg, #b91c1c 0%, #ef4444 100%);
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: filter 0.2s;
}
.ca-btn-primary:active { filter: brightness(0.9); }

.ca-btn-secondary {
  background: var(--light-bg);
  color: var(--text-dark);
  border: 2px solid var(--border-light);
  border-radius: 10px;
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
}
.ca-btn-secondary:active { background: var(--border-light); }

.ca-timestamp {
  font-size: 11px;
  color: var(--text-gray);
  display: flex;
  align-items: center;
  gap: 6px;
  opacity: 0.7;
  margin: 0;
}

/* Transitions */
.ca-fade-enter-active, .ca-fade-leave-active { transition: opacity 0.25s ease; }
.ca-fade-enter-from, .ca-fade-leave-to       { opacity: 0; }

.ca-slide-enter-active { transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease; }
.ca-slide-leave-active { transition: transform 0.2s ease, opacity 0.2s ease; }
.ca-slide-enter-from   { transform: scale(0.92) translateY(16px); opacity: 0; }
.ca-slide-leave-to     { transform: scale(0.95) translateY(8px);  opacity: 0; }
</style>