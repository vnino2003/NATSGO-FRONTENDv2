<!-- src/components/commuters/home/DrawerMenu.vue -->
<template>
  <Teleport to="body">
    <Transition name="dm-fade">
      <div
        v-if="modelValue"
        class="dm-overlay"
        @click="$emit('update:modelValue', false)"
      ></div>
    </Transition>

    <Transition name="dm-slide">
      <aside v-if="modelValue" class="dm-drawer" @click.stop>
        <div class="dm-header">
          <button
            class="dm-close"
            type="button"
            aria-label="Close"
            @click="$emit('update:modelValue', false)"
          >
            <i class="fas fa-xmark"></i>
          </button>
        </div>

        <div class="dm-content">
          <button class="dm-profile" type="button" @click="openAuthFromDrawer">
            <div class="dm-avatar">
              <i class="fas fa-user"></i>
            </div>

            <p class="dm-profile-text">Not signed in</p>
          </button>

          <nav class="dm-menu">
            <a href="#" class="dm-menu-item">
              <i class="fas fa-envelope"></i>
              <span>Contact Us</span>
            </a>

            <a href="#" class="dm-menu-item">
              <i class="fab fa-facebook"></i>
              <span>Facebook Page</span>
            </a>

            <a href="#" class="dm-menu-item">
              <i class="fas fa-bell"></i>
              <span>Arrival Notice</span>
            </a>
          </nav>
        </div>
      </aside>
    </Transition>
  </Teleport>
</template>

<script setup>
defineProps({
  modelValue: { type: Boolean, default: false },
});

const emit = defineEmits(["update:modelValue", "open-auth"]);

function openAuthFromDrawer() {
  emit("update:modelValue", false);

  setTimeout(() => {
    emit("open-auth");
  }, 80);
}
</script>

<style scoped>
.dm-overlay {
  position: fixed;
  inset: 0;
  display: block;
  background: rgba(10, 14, 26, 0.46);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  z-index: 9990;
}

.dm-drawer {
  position: fixed;
  top: 0;
  left: 0;
  width: min(270px, 78vw);
  height: 100dvh;
  background: #fff;
  border-right: 1px solid rgba(17, 24, 39, 0.08);
  box-shadow: 18px 0 55px rgba(15, 23, 42, 0.14);
  z-index: 9991;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dm-header {
  height: 54px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 10px 14px;
  border-bottom: 1px solid rgba(17, 24, 39, 0.06);
  background: #fff;
}

.dm-close {
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 11px;
  background: transparent;
  color: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, transform 0.15s ease;
}

.dm-close:hover {
  background: rgba(239, 68, 68, 0.08);
  color: #dc2626;
}

.dm-close:active {
  transform: scale(0.92);
}

.dm-content {
  flex: 1;
  padding: 28px 22px;
  overflow-y: auto;
  background: #fff;
}

.dm-profile {
  width: 100%;
  border: none;
  background: transparent;
  padding: 0;
  margin: 0 0 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.dm-avatar {
  width: 48px;
  height: 48px;
  border-radius: 999px;
  background: linear-gradient(
    135deg,
    var(--primary-blue, #1e88e5),
    var(--accent-teal, #00bcd4)
  );
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  box-shadow: 0 10px 24px rgba(0, 188, 212, 0.2);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.dm-profile:hover .dm-avatar {
  transform: translateY(-1px);
  box-shadow: 0 14px 28px rgba(0, 188, 212, 0.26);
}

.dm-profile-text {
  margin: 9px 0 0;
  font-size: 12px;
  font-weight: 700;
  color: rgba(15, 23, 42, 0.62);
}

.dm-menu {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dm-menu-item {
  min-height: 42px;
  border-radius: 12px;
  padding: 0 8px;
  display: flex;
  align-items: center;
  gap: 13px;
  text-decoration: none;
  color: rgba(15, 23, 42, 0.78);
  font-size: 13px;
  font-weight: 700;
  transition: background 0.15s ease, color 0.15s ease, transform 0.15s ease;
}

.dm-menu-item i {
  width: 18px;
  text-align: center;
  color: var(--accent-teal, #00bcd4);
  font-size: 15px;
}

.dm-menu-item:hover {
  background: rgba(0, 188, 212, 0.07);
  color: #0f172a;
  transform: translateX(2px);
}

.dm-menu-item:active {
  transform: scale(0.98);
}

.dm-fade-enter-active,
.dm-fade-leave-active {
  transition: opacity 0.22s ease;
}

.dm-fade-enter-from,
.dm-fade-leave-to {
  opacity: 0;
}

.dm-slide-enter-active,
.dm-slide-leave-active {
  transition:
    transform 0.26s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.2s ease;
}

.dm-slide-enter-from,
.dm-slide-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

@media (max-width: 420px) {
  .dm-drawer {
    width: 76vw;
    max-width: 270px;
  }

  .dm-content {
    padding: 26px 20px;
  }
}
</style>