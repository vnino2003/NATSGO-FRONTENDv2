<template>
  <teleport to="body">
    <transition name="wizard-fade">
      <div v-if="isOpen && step" class="wizard-overlay">
        <div class="wizard-card">
          <button class="wizard-close" type="button" @click="$emit('skip')">
            <i class="fas fa-times"></i>
          </button>

          <div class="wizard-icon">
            <i :class="step.icon"></i>
          </div>

          <p class="wizard-count">
            Step {{ currentStep + 1 }} of {{ totalSteps }}
          </p>

          <h2 class="wizard-title">
            {{ step.title }}
          </h2>

          <p class="wizard-desc">
            {{ step.description }}
          </p>

          <div class="wizard-dots">
            <span
              v-for="(_, index) in totalSteps"
              :key="index"
              :class="{ active: index === currentStep }"
            ></span>
          </div>

          <div class="wizard-actions">
            <button
              v-if="!isFirst"
              class="wizard-btn secondary"
              type="button"
              @click="$emit('back')"
            >
              Back
            </button>

            <button
              class="wizard-btn primary"
              type="button"
              @click="$emit('next')"
            >
              {{ isLast ? "Finish" : "Next" }}
            </button>
          </div>

          <button class="wizard-skip" type="button" @click="$emit('skip')">
            Skip guide
          </button>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  step: {
    type: Object,
    default: null,
  },
  currentStep: {
    type: Number,
    default: 0,
  },
  totalSteps: {
    type: Number,
    default: 1,
  },
  isFirst: {
    type: Boolean,
    default: false,
  },
  isLast: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["next", "back", "skip"]);
</script>

<style scoped>
.wizard-overlay {
  position: fixed;
  inset: 0;
  z-index: 100000;
  background: rgba(15, 23, 42, 0.52);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
}

.wizard-card {
  position: relative;
  width: min(390px, 100%);
  background: #ffffff;
  border: 1px solid #eef0f4;
  border-radius: 24px;
  padding: 26px 20px 18px;
  box-shadow: 0 22px 70px rgba(15, 23, 42, 0.28);
  text-align: center;
}

.wizard-close {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 999px;
  background: #f3f4f6;
  color: #374151;
  cursor: pointer;
  display: grid;
  place-items: center;
}

.wizard-icon {
  width: 64px;
  height: 64px;
  margin: 4px auto 14px;
  border-radius: 20px;
  background: linear-gradient(135deg, #2563eb, #38bdf8);
  color: #ffffff;
  display: grid;
  place-items: center;
  font-size: 26px;
  box-shadow: 0 12px 28px rgba(37, 99, 235, 0.25);
}

.wizard-count {
  margin: 0 0 8px;
  color: #6b7280;
  font-size: 12px;
  font-weight: 700;
}

.wizard-title {
  margin: 0;
  color: #111827;
  font-size: 21px;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.wizard-desc {
  margin: 10px auto 18px;
  max-width: 310px;
  color: #6b7280;
  font-size: 13.5px;
  font-weight: 500;
  line-height: 1.55;
}

.wizard-dots {
  display: flex;
  justify-content: center;
  gap: 7px;
  margin-bottom: 18px;
}

.wizard-dots span {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #cbd5e1;
  transition: width 0.2s ease, background 0.2s ease;
}

.wizard-dots span.active {
  width: 24px;
  background: #2563eb;
}

.wizard-actions {
  display: flex;
  gap: 10px;
}

.wizard-btn {
  flex: 1;
  border: none;
  border-radius: 14px;
  padding: 12px 14px;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease,
    background 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}

.wizard-btn:active {
  transform: scale(0.97);
}

.wizard-btn.primary {
  background: #2563eb;
  color: #ffffff;
  box-shadow: 0 5px 16px rgba(37, 99, 235, 0.24);
}

.wizard-btn.secondary {
  background: #f3f4f6;
  color: #374151;
}

.wizard-skip {
  margin-top: 12px;
  border: none;
  background: transparent;
  color: #6b7280;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.wizard-fade-enter-active,
.wizard-fade-leave-active {
  transition: opacity 0.22s ease;
}

.wizard-fade-enter-from,
.wizard-fade-leave-to {
  opacity: 0;
}
</style>