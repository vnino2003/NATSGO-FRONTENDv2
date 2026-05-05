<!-- src/components/commuters/home/HomeTabs/ExploreTab.vue -->
<template>
  <div class="explore-tab">
    <div class="services-grid">
      <!-- Track -->
      <RouterLink
        to="/track-bus"
        class="service-card service-card--primary"
        data-tour="service-track"
      >
        <div class="service-icon">
          <i class="fas fa-location-crosshairs"></i>
        </div>

        <div class="service-info">
          <p>Live Bus Tracking</p>
          <span>See buses on the map</span>
        </div>

        <i class="fas fa-chevron-right service-arrow"></i>
      </RouterLink>

      <!-- Terminal -->
      <RouterLink
        to="/terminal"
        class="service-card"
        data-tour="service-terminal"
      >
        <div class="service-icon">
          <i class="fas fa-bus-alt"></i>
        </div>

        <div class="service-info">
          <p>Terminals</p>
          <span>View terminal details</span>
        </div>

        <i class="fas fa-chevron-right service-arrow"></i>
      </RouterLink>

      <!-- Facebook -->
      <a
        class="service-card"
        data-tour="service-facebook"
        href="https://www.facebook.com/"
        target="_blank"
        rel="noopener noreferrer"
      >
        <div class="service-icon">
          <i class="fab fa-facebook-f"></i>
        </div>

        <div class="service-info">
          <p>Announcements</p>
          <span>Facebook news & updates</span>
        </div>

        <i class="fas fa-up-right-from-square service-arrow"></i>
      </a>

      <!-- Help / Repeat Guide -->
      <button
        class="service-card service-card--help"
        data-tour="service-help"
        type="button"
        @click="askRepeatGuide"
      >
        <div class="service-capy-wrap">
          <img
            src="/mascots/natsgo-capy-closed.png"
            alt="NatsGo Capy"
            class="service-capy-img"
          />
        </div>

        <div class="service-info">
          <p>App Guide</p>
          <span>Repeat the tutorial</span>
        </div>

        <i class="fas fa-rotate-right service-arrow"></i>
      </button>
    </div>

    <!-- Confirmation Modal -->
    <Teleport to="body">
      <Transition name="help-modal-fade">
        <div
          v-if="showConfirm"
          class="help-confirm-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Repeat guide confirmation"
          @click.self="closeConfirm"
        >
          <div class="help-confirm-card">
            <button
              class="help-confirm-close"
              type="button"
              aria-label="Close"
              @click="closeConfirm"
            >
              <i class="fas fa-times"></i>
            </button>

            <div class="help-confirm-capy-shell">
              <img
                src="/mascots/natsgo-capy-open.png"
                alt="NatsGo Capy"
                class="help-confirm-capy"
              />
            </div>

            <p class="help-confirm-kicker">NatsGo Capy</p>

            <h3 class="help-confirm-title">Repeat app guide?</h3>

            <p class="help-confirm-text">
              Ipapakita ko ulit sa’yo ang quick guide ng NATSGO commuter app.
            </p>

            <div class="help-confirm-actions">
              <button
                class="help-confirm-btn help-confirm-btn--ghost"
                type="button"
                @click="closeConfirm"
              >
                Maybe later
              </button>

              <button
                class="help-confirm-btn help-confirm-btn--primary"
                type="button"
                @click="repeatGuide"
              >
                Start guide
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <NearestBusesSection />
  </div>
</template>

<script setup>
import { ref } from "vue";
import NearestBusesSection from "@/components/commuters/home/NearestBusCard.vue";
import { useCommuterDriverTour } from "@/composables/useCommuterDriverTour";

const showConfirm = ref(false);

const { startTour, resetTour } = useCommuterDriverTour();

function askRepeatGuide() {
  showConfirm.value = true;
}

function closeConfirm() {
  showConfirm.value = false;
}

function repeatGuide() {
  showConfirm.value = false;

  resetTour();

  setTimeout(() => {
    startTour(true);
  }, 250);
}
</script>

<style scoped>
.explore-tab {
  width: 100%;
  padding: 0 2px 12px;
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}

.service-card {
  position: relative;
  min-height: 66px;
  padding: 12px 10px;
  border-radius: 13px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 5px 14px rgba(15, 23, 42, 0.06);
  text-decoration: none;
  color: #0f172a;
  display: flex;
  align-items: center;
  gap: 9px;
  overflow: hidden;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transform: translateY(0) scale(1);
  transition:
    transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1),
    box-shadow 0.22s ease,
    border-color 0.22s ease,
    background 0.22s ease;
}

button.service-card {
  width: 100%;
  font-family: inherit;
  text-align: left;
}

.service-card::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(37, 99, 235, 0.06),
    rgba(6, 182, 212, 0.025)
  );
  opacity: 0;
  transition: opacity 0.22s ease;
}

.service-card:hover {
  transform: translateY(-2px) scale(1.01);
  border-color: rgba(37, 99, 235, 0.18);
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.1);
}

.service-card:hover::before {
  opacity: 1;
}

.service-card:active {
  transform: translateY(0) scale(0.97);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
}

.service-card:active::before {
  opacity: 1;
}

.service-card--primary,
.service-card--help {
  background: rgba(255, 255, 255, 0.94);
}

/* Removed blue background boxes */
.service-icon {
  position: relative;
  z-index: 1;
  width: 26px;
  height: 26px;
  flex: 0 0 26px;
  border-radius: 0;
  background: transparent;
  color: #1677f2;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  transition:
    transform 0.22s ease,
    color 0.22s ease;
}

.service-capy-wrap {
  position: relative;
  z-index: 1;
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
  border-radius: 0;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
}

.service-capy-img {
  width: 34px;
  height: 34px;
  object-fit: contain;
  transform: translateY(2px);
  transition: transform 0.22s ease;
}

.service-card:hover .service-icon {
  transform: scale(1.08);
  color: #0f5fc9;
}

.service-card:hover .service-capy-img {
  transform: translateY(2px) scale(1.08);
}

.service-card:active .service-icon {
  transform: scale(0.96);
}

.service-card:active .service-capy-img {
  transform: translateY(2px) scale(0.96);
}

.service-info {
  position: relative;
  z-index: 1;
  min-width: 0;
  flex: 1;
}

.service-info p {
  margin: 0;
  font-size: 11px;
  font-weight: 850;
  color: #0f172a;
  line-height: 1.15;
  letter-spacing: -0.1px;
}

.service-info span {
  display: block;
  margin-top: 3px;
  font-size: 9px;
  font-weight: 600;
  color: #64748b;
  line-height: 1.15;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.service-arrow {
  position: relative;
  z-index: 1;
  font-size: 9px;
  color: #94a3b8;
  flex: 0 0 auto;
  transition:
    transform 0.22s ease,
    color 0.22s ease;
}

.service-card:hover .service-arrow {
  transform: translateX(2px);
  color: #2563eb;
}

/* Confirmation modal */
.help-confirm-overlay {
  position: fixed;
  inset: 0;
  z-index: 99999;
  background: rgba(15, 23, 42, 0.42);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
}

.help-confirm-card {
  position: relative;
  width: min(92vw, 340px);
  border-radius: 24px;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 22px 70px rgba(15, 23, 42, 0.22);
  padding: 22px 18px 18px;
  text-align: center;
  overflow: hidden;
}

.help-confirm-card::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at top, rgba(37, 99, 235, 0.1), transparent 42%),
    linear-gradient(135deg, rgba(6, 182, 212, 0.06), rgba(255, 255, 255, 0));
  pointer-events: none;
}

.help-confirm-close {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 2;
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.06);
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.help-confirm-capy-shell {
  position: relative;
  z-index: 1;
  width: 96px;
  height: 96px;
  margin: 4px auto 10px;
  border-radius: 999px;
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
}

.help-confirm-capy {
  width: 98px;
  height: 98px;
  object-fit: contain;
  transform: translateY(6px);
}

.help-confirm-kicker {
  position: relative;
  z-index: 1;
  margin: 0 0 5px;
  font-size: 11px;
  font-weight: 900;
  color: #1677f2;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.help-confirm-title {
  position: relative;
  z-index: 1;
  margin: 0;
  font-size: 19px;
  font-weight: 900;
  color: #0f172a;
  line-height: 1.2;
}

.help-confirm-text {
  position: relative;
  z-index: 1;
  margin: 8px auto 17px;
  max-width: 260px;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  line-height: 1.45;
}

.help-confirm-actions {
  position: relative;
  z-index: 1;
  display: flex;
  gap: 9px;
}

.help-confirm-btn {
  flex: 1;
  min-height: 42px;
  border-radius: 13px;
  font-size: 12px;
  font-weight: 900;
  cursor: pointer;
  border: 1px solid transparent;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    background 0.18s ease;
}

.help-confirm-btn:active {
  transform: scale(0.96);
}

.help-confirm-btn--ghost {
  background: rgba(15, 23, 42, 0.05);
  color: #475569;
  border-color: rgba(15, 23, 42, 0.06);
}

.help-confirm-btn--primary {
  background: #1677f2;
  color: #ffffff;
  box-shadow: 0 8px 18px rgba(22, 119, 242, 0.25);
}

.help-modal-fade-enter-active,
.help-modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.help-modal-fade-enter-from,
.help-modal-fade-leave-to {
  opacity: 0;
}

/* Smaller phones */
@media (max-width: 360px) {
  .services-grid {
    gap: 8px;
  }

  .service-card {
    min-height: 62px;
    padding: 10px 8px;
    gap: 8px;
  }

  .service-icon {
    width: 24px;
    height: 24px;
    flex-basis: 24px;
    font-size: 15px;
  }

  .service-capy-wrap {
    width: 29px;
    height: 29px;
    flex-basis: 29px;
  }

  .service-capy-img {
    width: 31px;
    height: 31px;
  }

  .service-info p {
    font-size: 10px;
  }

  .service-info span {
    font-size: 8px;
  }

  .help-confirm-card {
    width: min(94vw, 320px);
    padding: 20px 15px 15px;
  }
}
</style>