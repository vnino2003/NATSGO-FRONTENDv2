<template>
  <Teleport to="body">
    <Transition name="tour-fade">
      <div v-if="isOpen && activeStep" class="tour-layer">
        <div class="tour-dim"></div>

        <div
          v-if="targetRect"
          class="tour-spotlight"
          :style="spotlightStyle"
        ></div>

        <div
          v-if="targetRect"
          class="tour-bubble-wrap"
          :style="bubbleWrapStyle"
        >
          <!-- Capybara -->
          <div class="tour-capy" :class="{ talking: isTyping }">
            <img
              :src="mascotSrc"
              :alt="mascotName"
              class="tour-capy__img"
            />
          </div>

          <!-- Speech bubble -->
          <div class="tour-bubble">
            <div class="tour-bubble__tail"></div>

            <div class="tour-head">
              <div class="tour-step">
                Step {{ currentIndex + 1 }} of {{ steps.length }}
              </div>
              <div class="tour-name">{{ mascotName }}</div>
            </div>

            <h3 class="tour-title">
              {{ typedTitle }}
              <span v-if="showCursor" class="tour-cursor">|</span>
            </h3>

            <p class="tour-text">
              {{ typedText }}
              <span
                v-if="showCursor && typedTitle === fullTitle"
                class="tour-cursor"
              >
                |
              </span>
            </p>

            <div class="tour-actions">
              <button
                v-if="currentIndex > 0"
                class="tour-btn ghost"
                type="button"
                @click="prev"
              >
                Back
              </button>

              <button class="tour-btn muted" type="button" @click="skip">
                Skip
              </button>

              <button class="tour-btn primary" type="button" @click="next">
                {{ isLast ? "Done" : "Next" }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref } from "vue";
import { useRouter } from "vue-router";

const props = defineProps({
  steps: {
    type: Array,
    default: () => [],
  },
  storageKey: {
    type: String,
    default: "natsgo_character_tour_done",
  },
  mascotSrc: {
    type: String,
    default: "/mascots/natsgo-capybara.png",
  },
  mascotName: {
    type: String,
    default: "NatsGo Capy",
  },
});

const router = useRouter();

const isOpen = ref(false);
const currentIndex = ref(0);
const targetRect = ref(null);

const typedTitle = ref("");
const typedText = ref("");
const showCursor = ref(true);
const isTyping = ref(false);

let resizeHandler = null;
let typingInterval = null;
let cursorInterval = null;

const activeStep = computed(() => props.steps[currentIndex.value] || null);
const isLast = computed(() => currentIndex.value === props.steps.length - 1);
const fullTitle = computed(() => activeStep.value?.title || "");
const fullText = computed(() => activeStep.value?.text || "");

const spotlightStyle = computed(() => {
  if (!targetRect.value) return {};

  return {
    top: `${targetRect.value.top - 8}px`,
    left: `${targetRect.value.left - 8}px`,
    width: `${targetRect.value.width + 16}px`,
    height: `${targetRect.value.height + 16}px`,
  };
});

const bubbleWrapStyle = computed(() => {
  if (!targetRect.value) return {};

  const wrapWidth = Math.min(500, window.innerWidth - 20);
  const targetCenterX = targetRect.value.left + targetRect.value.width / 2;

  let left = targetCenterX - wrapWidth / 2;
  left = Math.max(10, Math.min(left, window.innerWidth - wrapWidth - 10));

  const spaceBelow = window.innerHeight - targetRect.value.bottom;
  const spaceAbove = targetRect.value.top;

  let top;

  if (spaceBelow > 250 || spaceBelow >= spaceAbove) {
    top = targetRect.value.bottom + 18;
  } else {
    top = targetRect.value.top - 220;
  }

  top = Math.max(10, Math.min(top, window.innerHeight - 220));

  return {
    width: `${wrapWidth}px`,
    left: `${left}px`,
    top: `${top}px`,
  };
});

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clearTyping() {
  if (typingInterval) {
    clearInterval(typingInterval);
    typingInterval = null;
  }

  if (cursorInterval) {
    clearInterval(cursorInterval);
    cursorInterval = null;
  }

  isTyping.value = false;
}

function startTyping() {
  clearTyping();

  typedTitle.value = "";
  typedText.value = "";
  showCursor.value = true;
  isTyping.value = true;

  const title = fullTitle.value;
  const text = fullText.value;

  let titleIndex = 0;
  let textIndex = 0;
  let phase = "title";

  cursorInterval = setInterval(() => {
    showCursor.value = !showCursor.value;
  }, 500);

  typingInterval = setInterval(() => {
    if (phase === "title") {
      if (titleIndex < title.length) {
        typedTitle.value += title[titleIndex];
        titleIndex += 1;
        return;
      }

      phase = "text";
      return;
    }

    if (phase === "text") {
      if (textIndex < text.length) {
        typedText.value += text[textIndex];
        textIndex += 1;
        return;
      }

      clearInterval(typingInterval);
      typingInterval = null;
      isTyping.value = false;
    }
  }, 18);
}

async function focusStep() {
  const step = activeStep.value;
  if (!step) return;

  if (step.route) {
    await router.push(step.route).catch(() => {});
    await wait(280);
  }

  await nextTick();

  const el = document.querySelector(step.selector);

  if (!el) {
    targetRect.value = {
      top: window.innerHeight / 2 - 40,
      left: window.innerWidth / 2 - 80,
      width: 160,
      height: 80,
      bottom: window.innerHeight / 2 + 40,
      right: window.innerWidth / 2 + 80,
    };

    startTyping();
    return;
  }

  el.scrollIntoView({
    behavior: "smooth",
    block: "center",
    inline: "center",
  });

  await wait(320);

  const rect = el.getBoundingClientRect();

  targetRect.value = {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
    bottom: rect.bottom,
    right: rect.right,
  };

  startTyping();
}

async function start(force = false) {
  const completed = localStorage.getItem(props.storageKey) === "true";

  if (completed && !force) return;
  if (!props.steps.length) return;

  currentIndex.value = 0;
  isOpen.value = true;

  await focusStep();

  resizeHandler = () => focusStep();
  window.addEventListener("resize", resizeHandler);
  window.addEventListener("scroll", resizeHandler, true);
}

async function next() {
  if (isLast.value) {
    finish();
    return;
  }

  currentIndex.value += 1;
  await focusStep();
}

async function prev() {
  if (currentIndex.value <= 0) return;

  currentIndex.value -= 1;
  await focusStep();
}

function finish() {
  localStorage.setItem(props.storageKey, "true");
  close();
}

function skip() {
  localStorage.setItem(props.storageKey, "true");
  close();
}

function close() {
  isOpen.value = false;
  targetRect.value = null;
  clearTyping();

  if (resizeHandler) {
    window.removeEventListener("resize", resizeHandler);
    window.removeEventListener("scroll", resizeHandler, true);
    resizeHandler = null;
  }
}

onBeforeUnmount(() => {
  close();
});

defineExpose({
  start,
});
</script>

<style scoped>
.tour-layer {
  position: fixed;
  inset: 0;
  z-index: 100000;
  pointer-events: none;
}

.tour-dim {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.58);
  backdrop-filter: blur(2px);
}

.tour-spotlight {
  position: fixed;
  border-radius: 18px;
  border: 3px solid #38bdf8;
  box-shadow:
    0 0 0 9999px rgba(15, 23, 42, 0.52),
    0 0 0 8px rgba(56, 189, 248, 0.18),
    0 18px 50px rgba(0, 0, 0, 0.24);
  background: rgba(255, 255, 255, 0.04);
  transition: all 0.24s ease;
}

.tour-bubble-wrap {
  position: fixed;
  display: flex;
  align-items: flex-end;
  gap: 0;
  pointer-events: none;
  transition: all 0.24s ease;
}

.tour-capy {
  width: 125px;
  flex-shrink: 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  margin-right: -8px;
  z-index: 2;
}

.tour-capy__img {
  width: 100%;
  max-height: 165px;
  object-fit: contain;
  display: block;
  filter: drop-shadow(0 14px 24px rgba(0, 0, 0, 0.22));
  animation: capy-idle 2s ease-in-out infinite;
}

.tour-capy.talking .tour-capy__img {
  animation: capy-talk 0.35s ease-in-out infinite;
}

.tour-bubble {
  position: relative;
  flex: 1;
  min-height: 170px;
  background: #ffffff;
  border-radius: 28px;
  padding: 16px 18px 14px;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.28);
  pointer-events: auto;
}

.tour-bubble__tail {
  position: absolute;
  left: -10px;
  top: 42px;
  width: 22px;
  height: 22px;
  background: #ffffff;
  transform: rotate(45deg);
  border-radius: 6px;
}

.tour-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}

.tour-step {
  font-size: 11px;
  font-weight: 900;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.tour-name {
  font-size: 12px;
  font-weight: 900;
  color: #1e88e5;
}

.tour-title {
  margin: 0 0 6px;
  font-size: 21px;
  font-weight: 900;
  color: #0f172a;
  line-height: 1.2;
}

.tour-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: #64748b;
  font-weight: 600;
  min-height: 64px;
}

.tour-cursor {
  color: #1e88e5;
  font-weight: 900;
  animation: blink-cursor 1s steps(1) infinite;
}

.tour-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.tour-btn {
  border: none;
  border-radius: 12px;
  padding: 10px 14px;
  font-size: 12px;
  font-weight: 900;
  cursor: pointer;
  transition: transform 0.14s ease;
}

.tour-btn:active {
  transform: scale(0.96);
}

.tour-btn.primary {
  background: #1e88e5;
  color: #fff;
}

.tour-btn.ghost {
  background: #e0f2fe;
  color: #0369a1;
}

.tour-btn.muted {
  background: #f1f5f9;
  color: #64748b;
}

.tour-fade-enter-active,
.tour-fade-leave-active {
  transition: opacity 0.22s ease;
}

.tour-fade-enter-from,
.tour-fade-leave-to {
  opacity: 0;
}

@keyframes capy-idle {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-4px) rotate(-1deg); }
}

@keyframes capy-talk {
  0%   { transform: translateY(0) scale(1) rotate(0deg); }
  25%  { transform: translateY(-2px) scale(1.02, 0.98) rotate(-1deg); }
  50%  { transform: translateY(0) scale(0.98, 1.02) rotate(1deg); }
  75%  { transform: translateY(-1px) scale(1.01, 0.99) rotate(-1deg); }
  100% { transform: translateY(0) scale(1) rotate(0deg); }
}

@keyframes blink-cursor {
  0%, 50% { opacity: 1; }
  50.01%, 100% { opacity: 0; }
}

@media (max-width: 560px) {
  .tour-capy {
    width: 90px;
  }

  .tour-capy__img {
    max-height: 120px;
  }

  .tour-bubble {
    border-radius: 22px;
    padding: 14px 14px 12px;
  }

  .tour-title {
    font-size: 17px;
  }

  .tour-text {
    font-size: 12.8px;
    min-height: 58px;
  }
}

@media (max-width: 420px) {
  .tour-capy {
    width: 72px;
  }

  .tour-capy__img {
    max-height: 96px;
  }

  .tour-title {
    font-size: 16px;
  }

  .tour-text {
    font-size: 12.3px;
  }
}
</style>