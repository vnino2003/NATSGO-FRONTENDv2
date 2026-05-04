<template>
  <div class="section nb">
    <!-- Header -->
    <div class="nb__head">
      <div class="nb__headLeft">
        <h3 class="nb__title">Nearby Buses</h3>
        <span v-if="locationEnabled && nearestBuses.length > 0" class="nb__count">
          {{ nearestBuses.length }} found
        </span>
      </div>
      <small v-if="locationEnabled" class="nb__updated">
        <span class="nb__updatedDot" :class="{ 'nb__updatedDot--pulse': !loading }"></span>
        {{ lastUpdatedText }}
      </small>
    </div>

    <!-- Before location enabled -->
    <div v-if="!locationEnabled" class="nb__ctaCard">
      <div class="nb__ctaIcon">
        <i class="fas fa-location-crosshairs"></i>
      </div>
      <p class="nb__ctaTitle">Find buses near you</p>
      <p class="nb__ctaText">
        Turn on location to see real-time buses within your area.
      </p>
      <button class="nb__ctaBtn" @click="enableLocation" type="button">
        <i class="fas fa-location-dot"></i>
        Enable Location
      </button>
      <p class="nb__ctaHint">
        <i class="fas fa-shield-halved"></i>
        Used only to show buses within your radius
      </p>
    </div>

    <!-- After location enabled -->
    <div v-else class="nb__list">

      <!-- Loading skeleton -->
      <div v-if="loading && nearestBuses.length === 0" class="nb__skeletonWrap">
        <div class="nb__skeleton" v-for="i in 3" :key="i">
          <div class="nb__skLeft">
            <div class="nb__skBadge"></div>
            <div class="nb__skLines">
              <div class="nb__skLine nb__skLine--lg"></div>
              <div class="nb__skLine"></div>
            </div>
          </div>
          <div class="nb__skRight">
            <div class="nb__skPill"></div>
            <div class="nb__skLine nb__skLine--sm"></div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else-if="nearestBuses.length === 0" class="nb__empty">
        <div class="nb__emptyRing">
          <div class="nb__emptyRingInner">
            <i class="fas fa-bus-simple"></i>
          </div>
        </div>
        <p class="nb__emptyTitle">No buses nearby</p>
        <p class="nb__emptySub">
          Watching within <b>{{ nearKm }} km</b> — we'll alert you when one arrives.
        </p>
        <p v-if="error" class="nb__errorInline">
          <i class="fas fa-triangle-exclamation"></i> {{ error }}
        </p>
      </div>

      <!-- Bus list -->
      <div v-else class="nb__itemsWrap">
        <div
          class="nb__items"
          :class="{ 'nb__items--scroll': nearestBuses.length > MAX_VISIBLE }"
        >
          <div
            v-for="bus in nearestBuses"
            :key="bus.id"
            class="nb__item"
            :class="proximityClass(bus)"
            @click="goToTrack(bus)"
            role="button"
            tabindex="0"
            @keydown.enter="goToTrack(bus)"
          >
            <div class="nb__itemLeft">
              <div class="nb__badge" :class="badgeClass(bus)">
                <i class="fas fa-bus"></i>
                <span v-if="isArriving(bus)" class="nb__badgePulse"></span>
              </div>
              <div class="nb__meta">
                <p class="nb__route">{{ bus.route }}</p>
                <p class="nb__plate">Track #{{ bus.trackNo }} · {{ bus.plate_no || "—" }}</p>
              </div>
            </div>

            <div class="nb__itemRight">
              <div class="nb__distWrap">
                <span class="nb__distLabel" :class="distLabelClass(bus)">
                  <i :class="distIcon(bus)"></i>
                  {{ distLabel(bus) }}
                </span>
                <span class="nb__distKm">{{ bus.kmText }}</span>
              </div>
              <span class="nb__pill" :class="pillClass(bus)">{{ pillText(bus) }}</span>
              <div class="nb__seats">
                <i class="fas fa-user-group"></i>
                <b>{{ availableSeats(bus) }}</b> seats left
              </div>
            </div>

            <i class="fas fa-chevron-right nb__chevron"></i>
          </div>
        </div>

        <p v-if="error" class="nb__error">
          <i class="fas fa-triangle-exclamation"></i> {{ error }}
        </p>

        <button class="nb__footer" type="button" @click="goToLiveMap">
          <i class="fas fa-map-location-dot"></i>
          View all on live map
          <i class="fas fa-arrow-right"></i>
        </button>
      </div>
    </div>
  </div>

  <!-- Track confirmation modal -->
  <Transition name="nb-confirm">
    <div v-if="confirmBus" class="nbConfirm" @click.self="cancelTrack">
      <div class="nbConfirm__card">
        <div class="nbConfirm__icon">
          <i class="fas fa-location-arrow"></i>
        </div>
        <h3 class="nbConfirm__title">Track this bus?</h3>
        <p class="nbConfirm__text">
          Do you want to track <b>{{ confirmBus.route }}</b> Track #{{ confirmBus.trackNo }}?
        </p>
        <div class="nbConfirm__meta">
          <span><i class="fas fa-bus"></i> {{ confirmBus.plate_no || "No plate" }}</span>
          <span><i class="fas fa-location-dot"></i> {{ confirmBus.kmText || "Nearby" }}</span>
        </div>
        <div class="nbConfirm__actions">
          <button class="nbConfirm__btn ghost" type="button" @click="cancelTrack">Cancel</button>
          <button class="nbConfirm__btn primary" type="button" @click="confirmTrack">Yes, track</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useNearbyBuses } from "@/composables/useNearbyBuses";

const confirmBus = ref(null);
const MAX_VISIBLE = 4;
const nearKm = 1.0;

const router = useRouter();
const lastUpdatedAt = ref(Date.now());

const { hasLocation, enableLocation, nearestBuses, loading, error } = useNearbyBuses({
  intervalMs: 1500,
  maxNearest: 10,
  nearKm,
});

const locationEnabled = computed(() => hasLocation.value);

const lastUpdatedText = computed(() => {
  const s = Math.floor((Date.now() - lastUpdatedAt.value) / 1000);
  if (s < 10) return "Live";
  const m = Math.floor(s / 60);
  if (m < 1) return `${s}s ago`;
  return `${m}m ago`;
});

watch(() => nearestBuses.value, () => {
  if (locationEnabled.value) lastUpdatedAt.value = Date.now();
}, { deep: true });

function goToTrack(bus) { confirmBus.value = bus; }
function cancelTrack() { confirmBus.value = null; }
function confirmTrack() {
  if (!confirmBus.value) return;
  router.push({ path: "/track-bus", query: { busId: confirmBus.value.id, focus: "1", fromNearby: "1" } });
}
function goToLiveMap() { router.push({ path: "/track-bus" }); }

function getBusKm(bus) {
  if (bus.distanceKm != null) return Number(bus.distanceKm);
  const raw = bus.kmText || "";
  const num = parseFloat(raw);
  if (raw.includes("m") && !raw.includes("km")) return num / 1000;
  return isNaN(num) ? 99 : num;
}

function isArriving(bus)  { return getBusKm(bus) <= 0.15; }
function isVeryClose(bus) { return getBusKm(bus) <= 0.35; }
function isNearby(bus)    { return getBusKm(bus) <= 0.7; }

function distLabel(bus) {
  const km = getBusKm(bus);
  if (km <= 0.15) return "Arriving";
  if (km <= 0.35) return "Very close";
  if (km <= 0.7)  return "Nearby";
  return "Approaching";
}
function distIcon(bus) {
  const km = getBusKm(bus);
  if (km <= 0.15) return "fas fa-circle-dot";
  if (km <= 0.35) return "fas fa-location-arrow";
  return "fas fa-arrow-right-to-bracket";
}
function distLabelClass(bus) {
  if (isArriving(bus))  return "nb__distLabel--arriving";
  if (isVeryClose(bus)) return "nb__distLabel--close";
  if (isNearby(bus))    return "nb__distLabel--nearby";
  return "nb__distLabel--far";
}
function proximityClass(bus) {
  if (isArriving(bus))  return "nb__item--arriving";
  if (isVeryClose(bus)) return "nb__item--close";
  return "";
}
function badgeClass(bus) {
  if (isArriving(bus))  return "nb__badge--arriving";
  if (isVeryClose(bus)) return "nb__badge--close";
  return "nb__badge--default";
}
function availableSeats(bus) {
  return Math.max(0, Number(bus.capacity || 0) - Number(bus.seats || 0));
}
function pillClass(bus) {
  const avail = availableSeats(bus);
  const cap   = Number(bus.capacity || 0);
  if (cap <= 0)   return "pill-gray";
  if (avail <= 0) return "pill-red";
  if (avail <= 3) return "pill-yellow";
  return "pill-green";
}
function pillText(bus) {
  const avail = availableSeats(bus);
  const cap   = Number(bus.capacity || 0);
  if (cap <= 0)   return "—";
  if (avail <= 0) return "FULL";
  if (avail <= 3) return "FILLING";
  return "OPEN";
}
</script>

<style scoped>
/* ── Root ── */
.nb {
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* ── Header ── */
.nb__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.nb__headLeft {
  display: flex;
  align-items: center;
  gap: 8px;
}
.nb__title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #111827;
  letter-spacing: -0.01em;
}
.nb__count {
  font-size: 11px;
  font-weight: 700;
  background: #eff6ff;
  color: #2563eb;
  border: 1px solid #dbeafe;
  border-radius: 999px;
  padding: 2px 8px;
}
.nb__updated {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 600;
  color: #9ca3af;
}
.nb__updatedDot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #d1d5db;
  flex-shrink: 0;
}
.nb__updatedDot--pulse {
  background: #22c55e;
  animation: nbDotPulse 2s infinite;
}
@keyframes nbDotPulse {
  0%   { box-shadow: 0 0 0 0 rgba(34,197,94,0.5); }
  70%  { box-shadow: 0 0 0 6px rgba(34,197,94,0); }
  100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
}

/* ── CTA Card ── */
.nb__ctaCard {
  background: #ffffff;
  border: 1px solid #eef0f4;
  border-radius: 16px;
  padding: 28px 20px 22px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.nb__ctaIcon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: #eff6ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #2563eb;
  margin-bottom: 14px;
}

.nb__ctaTitle {
  font-size: 15px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 6px;
  letter-spacing: -0.01em;
}
.nb__ctaText {
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  margin: 0 0 18px;
  line-height: 1.55;
  max-width: 230px;
}
.nb__ctaBtn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 10px 20px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  background: #2563eb;
  box-shadow: 0 4px 14px rgba(37,99,235,0.25);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}
.nb__ctaBtn:active {
  transform: scale(0.97);
  box-shadow: 0 2px 8px rgba(37,99,235,0.2);
}
.nb__ctaHint {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 600;
  color: #9ca3af;
  margin-top: 12px;
}

/* ── Skeleton ── */
.nb__skeletonWrap { display: flex; flex-direction: column; gap: 8px; }
.nb__skeleton {
  background: #fff;
  border: 1px solid #eef0f4;
  border-radius: 14px;
  padding: 14px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  position: relative;
  overflow: hidden;
}
.nb__skeleton::after {
  content: "";
  position: absolute;
  top: 0; left: -60%;
  width: 60%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(0,0,0,0.04), transparent);
  animation: nbShimmer 1.3s infinite;
}
@keyframes nbShimmer {
  0%   { transform: translateX(0); }
  100% { transform: translateX(280%); }
}
.nb__skLeft    { display: flex; gap: 12px; align-items: flex-start; }
.nb__skLines   { display: flex; flex-direction: column; gap: 8px; }
.nb__skRight   { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
.nb__skBadge   { width: 42px; height: 42px; border-radius: 10px; background: #f3f4f6; flex-shrink: 0; }
.nb__skLine    { height: 10px; border-radius: 999px; background: #f3f4f6; width: 130px; }
.nb__skLine--lg{ width: 170px; height: 12px; }
.nb__skLine--sm{ width: 70px; }
.nb__skPill    { width: 64px; height: 20px; border-radius: 999px; background: #f3f4f6; }

/* ── Empty state ── */
.nb__empty {
  background: #fff;
  border: 1px dashed #e5e7eb;
  border-radius: 16px;
  padding: 30px 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.nb__emptyRing {
  width: 60px; height: 60px;
  border-radius: 50%;
  border: 1.5px solid #e5e7eb;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 12px;
  animation: nbSpin 10s linear infinite;
}
@keyframes nbSpin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
.nb__emptyRingInner {
  width: 44px; height: 44px;
  border-radius: 50%;
  background: #eff6ff;
  display: flex; align-items: center; justify-content: center;
  color: #2563eb;
  font-size: 16px;
  animation: nbSpin 10s linear infinite reverse;
}
.nb__emptyTitle {
  font-size: 14px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 5px;
}
.nb__emptySub {
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  margin: 0;
  line-height: 1.55;
}

/* ── Items ── */
.nb__itemsWrap { display: flex; flex-direction: column; gap: 8px; }
.nb__items     { display: flex; flex-direction: column; gap: 8px; }
.nb__items--scroll {
  max-height: 330px;
  overflow-y: auto;
  padding-right: 2px;
  overscroll-behavior: contain;
  scroll-behavior: smooth;
}
.nb__items--scroll::-webkit-scrollbar { width: 3px; }
.nb__items--scroll::-webkit-scrollbar-thumb {
  background: #e5e7eb;
  border-radius: 999px;
}

/* ── Bus Item ── */
.nb__item {
  background: #fff;
  border: 1px solid #eef0f4;
  border-radius: 14px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  position: relative;
  overflow: hidden;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.nb__item:active {
  transform: scale(0.985);
  box-shadow: none;
}
.nb__item:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

/* Arriving accent */
.nb__item--arriving {
  border-color: rgba(34,197,94,0.3);
}
.nb__item--arriving::before {
  content: "";
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 3px;
  border-radius: 14px 0 0 14px;
  background: #22c55e;
}

/* Very close accent */
.nb__item--close {
  border-color: rgba(234,179,8,0.3);
}
.nb__item--close::before {
  content: "";
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 3px;
  border-radius: 14px 0 0 14px;
  background: #eab308;
}

/* ── Chevron ── */
.nb__chevron {
  font-size: 10px;
  color: #d1d5db;
  flex-shrink: 0;
  transition: transform 0.15s;
}
.nb__item:active .nb__chevron { transform: translateX(2px); }

/* ── Badge ── */
.nb__badge {
  width: 42px; height: 42px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
  position: relative;
}
.nb__badge--default  { background: #eff6ff; color: #2563eb; }
.nb__badge--close    { background: #fefce8; color: #b45309; }
.nb__badge--arriving { background: #f0fdf4; color: #16a34a; }

.nb__badgePulse {
  position: absolute;
  inset: -4px;
  border-radius: 12px;
  border: 2px solid rgba(34,197,94,0.35);
  animation: nbBadgePulse 1.5s ease-out infinite;
}
@keyframes nbBadgePulse {
  0%   { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(1.4); }
}

/* ── Meta ── */
.nb__itemLeft { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
.nb__meta     { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.nb__route {
  font-size: 14px;
  font-weight: 700;
  color: #111827;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: -0.01em;
}
.nb__plate {
  font-size: 11px;
  font-weight: 500;
  color: #9ca3af;
  margin: 0;
}

/* ── Right ── */
.nb__itemRight {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  flex-shrink: 0;
}
.nb__distWrap  { display: flex; flex-direction: column; align-items: flex-end; gap: 1px; }
.nb__distLabel {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.nb__distLabel--arriving { color: #16a34a; }
.nb__distLabel--close    { color: #b45309; }
.nb__distLabel--nearby   { color: #2563eb; }
.nb__distLabel--far      { color: #9ca3af; }
.nb__distKm {
  font-size: 11px;
  font-weight: 500;
  color: #9ca3af;
}

/* ── Pill ── */
.nb__pill {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 999px;
}
.pill-green  { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
.pill-yellow { background: #fefce8; color: #b45309; border: 1px solid #fde68a; }
.pill-red    { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
.pill-gray   { background: #f9fafb; color: #9ca3af; border: 1px solid #f3f4f6; }

/* ── Seats ── */
.nb__seats {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 500;
  color: #9ca3af;
}
.nb__seats i { font-size: 9px; }
.nb__seats b { color: #374151; font-weight: 700; }

/* ── Footer ── */
.nb__footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 11px 16px;
  border: 1px solid #eef0f4;
  border-radius: 12px;
  background: #fff;
  color: #6b7280;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
  -webkit-tap-highlight-color: transparent;
}
.nb__footer:active {
  background: #f9fafb;
  transform: scale(0.98);
}

/* ── Error ── */
.nb__error,
.nb__errorInline {
  font-size: 12px;
  font-weight: 600;
  color: #dc2626;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
}

/* ── Modal ── */
.nbConfirm {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
}
.nbConfirm__card {
  width: min(340px, 100%);
  background: #fff;
  border-radius: 20px;
  padding: 22px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  border: 1px solid #eef0f4;
}
.nbConfirm__icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  margin: 0 auto 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 20px;
  background: #2563eb;
  box-shadow: 0 8px 20px rgba(37,99,235,0.25);
}
.nbConfirm__title {
  margin: 0 0 7px;
  font-size: 17px;
  font-weight: 700;
  color: #111827;
  letter-spacing: -0.01em;
}
.nbConfirm__text {
  margin: 0;
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  line-height: 1.55;
}
.nbConfirm__text b { color: #111827; font-weight: 700; }
.nbConfirm__meta {
  margin-top: 14px;
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}
.nbConfirm__meta span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 10px;
  border-radius: 999px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 11px;
  font-weight: 700;
}
.nbConfirm__actions {
  margin-top: 18px;
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 8px;
}
.nbConfirm__btn {
  height: 42px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
  transition: transform 0.15s ease;
}
.nbConfirm__btn:active { transform: scale(0.97); }
.nbConfirm__btn.ghost   { background: #f3f4f6; color: #374151; }
.nbConfirm__btn.primary { background: #2563eb; color: #fff; box-shadow: 0 6px 16px rgba(37,99,235,0.25); }

/* Transition */
.nb-confirm-enter-active,
.nb-confirm-leave-active { transition: opacity 0.18s ease; }
.nb-confirm-enter-from,
.nb-confirm-leave-to     { opacity: 0; }
.nb-confirm-enter-active .nbConfirm__card,
.nb-confirm-leave-active .nbConfirm__card { transition: transform 0.18s ease, opacity 0.18s ease; }
.nb-confirm-enter-from .nbConfirm__card,
.nb-confirm-leave-to .nbConfirm__card     { transform: translateY(12px) scale(0.97); opacity: 0; }
</style>