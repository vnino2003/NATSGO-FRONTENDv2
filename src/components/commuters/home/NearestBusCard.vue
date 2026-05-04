<template>
  <div class="section nb">
    <!-- Header -->
    <div class="nb__head">
      <div class="nb__headLeft">
        <h3 class="nb__title">Nearby Buses</h3>

        <span v-if="locationEnabled && visibleNearestBuses.length > 0" class="nb__count">
          {{ visibleNearestBuses.length }} found
        </span>
      </div>

      <small v-if="locationEnabled" class="nb__updated">
        <span
          class="nb__updatedDot"
          :class="{ 'nb__updatedDot--pulse': !loading }"
        ></span>
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
      <div v-if="loading && visibleNearestBuses.length === 0" class="nb__skeletonWrap">
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
      <div v-else-if="visibleNearestBuses.length === 0" class="nb__empty">
        <div class="nb__emptyRing">
          <div class="nb__emptyRingInner">
            <i class="fas fa-bus-simple"></i>
          </div>
        </div>

        <p class="nb__emptyTitle">No live buses nearby</p>

        <p class="nb__emptySub">
          Watching within <b>{{ nearKm }} km</b> — old GPS locations are not shown as active nearby buses.
        </p>

        <p v-if="error" class="nb__errorInline">
          <i class="fas fa-triangle-exclamation"></i>
          {{ error }}
        </p>
      </div>

      <!-- Bus list -->
      <div v-else class="nb__itemsWrap">
        <div
          class="nb__items"
          :class="{ 'nb__items--scroll': visibleNearestBuses.length > MAX_VISIBLE }"
        >
          <div
            v-for="bus in visibleNearestBuses"
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

                <span
                  v-if="isArriving(bus) && !isGpsStale(bus)"
                  class="nb__badgePulse"
                ></span>
              </div>

              <div class="nb__meta">
                <p class="nb__route">{{ bus.route }}</p>

                <p class="nb__plate">
                  Track #{{ bus.trackNo }} · {{ bus.plate_no || "—" }}
                </p>

                <p class="nb__gpsStatus" :class="{ stale: isGpsStale(bus) }">
                  <i :class="gpsStatusIcon(bus)"></i>
                  {{ gpsStatusText(bus) }}
                </p>
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

              <span class="nb__pill" :class="pillClass(bus)">
                {{ pillText(bus) }}
              </span>

              <div class="nb__seats">
                <i class="fas fa-user-group"></i>
                <b>{{ availableSeats(bus) }}</b> seats left
              </div>
            </div>

            <i class="fas fa-chevron-right nb__chevron"></i>
          </div>
        </div>

        <p v-if="error" class="nb__error">
          <i class="fas fa-triangle-exclamation"></i>
          {{ error }}
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
          <span>
            <i class="fas fa-bus"></i>
            {{ confirmBus.plate_no || "No plate" }}
          </span>

          <span>
            <i class="fas fa-location-dot"></i>
            {{ confirmBus.kmText || "Nearby" }}
          </span>

          <span v-if="isGpsStale(confirmBus)" class="nbConfirm__stale">
            <i class="fas fa-clock"></i>
            {{ gpsStatusText(confirmBus) }}
          </span>
        </div>

        <div class="nbConfirm__actions">
          <button class="nbConfirm__btn ghost" type="button" @click="cancelTrack">
            Cancel
          </button>

          <button class="nbConfirm__btn primary" type="button" @click="confirmTrack">
            Yes, track
          </button>
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

/*
  Nearby behavior:
  - <= 60s old: active nearby
  - > 60s old: stale, still can show as last known
  - > 30 mins old: hidden from Nearby Buses
*/
const STALE_GPS_SECONDS = 60;
const HIDE_OLD_GPS_SECONDS = 30 * 60;

const router = useRouter();
const lastUpdatedAt = ref(Date.now());

const { hasLocation, enableLocation, nearestBuses, loading, error } = useNearbyBuses({
  intervalMs: 1500,
  maxNearest: 10,
  nearKm,
});

const locationEnabled = computed(() => hasLocation.value);

const visibleNearestBuses = computed(() => {
  return nearestBuses.value.filter((bus) => {
    const age = getGpsAgeSeconds(bus);

    if (!Number.isFinite(age)) return true;

    return age <= HIDE_OLD_GPS_SECONDS;
  });
});

const lastUpdatedText = computed(() => {
  const s = Math.floor((Date.now() - lastUpdatedAt.value) / 1000);

  if (s < 10) return "Live";

  const m = Math.floor(s / 60);

  if (m < 1) return `${s}s ago`;

  return `${m}m ago`;
});

watch(
  () => visibleNearestBuses.value,
  () => {
    if (locationEnabled.value) {
      lastUpdatedAt.value = Date.now();
    }
  },
  { deep: true }
);

function goToTrack(bus) {
  confirmBus.value = bus;
}

function cancelTrack() {
  confirmBus.value = null;
}

function confirmTrack() {
  if (!confirmBus.value) return;

  router.push({
    path: "/track-bus",
    query: {
      busId: confirmBus.value.id,
      focus: "1",
      fromNearby: "1",
    },
  });
}

function goToLiveMap() {
  router.push({ path: "/track-bus" });
}

function getBusKm(bus) {
  if (bus.distanceKm != null) return Number(bus.distanceKm);

  const raw = bus.kmText || "";
  const num = parseFloat(raw);

  if (raw.includes("m") && !raw.includes("km")) return num / 1000;

  return Number.isNaN(num) ? 99 : num;
}

function parseDate(v) {
  if (!v) return null;

  const d = new Date(v);

  return Number.isNaN(d.getTime()) ? null : d;
}

function secondsAgoFromDate(v) {
  const d = parseDate(v);

  if (!d) return Infinity;

  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
}

function getGpsAgeSeconds(bus) {
  const directAge =
    bus.gpsLossAgeSec ??
    bus.gpsAgeSec ??
    bus.gps_age_sec ??
    bus.locationAgeSec ??
    null;

  if (directAge !== null && directAge !== undefined) {
    const n = Number(directAge);

    if (Number.isFinite(n)) return n;
  }

  const timestamp =
    bus.updatedAt ??
    bus.updated_at ??
    bus.gps_updated_at ??
    bus.recorded_at ??
    bus.last_gps_at ??
    null;

  return secondsAgoFromDate(timestamp);
}

function formatAgo(seconds) {
  if (!Number.isFinite(seconds)) return "Last known location";

  if (seconds < 10) return "Live now";
  if (seconds < 60) return `Last seen ${seconds}s ago`;

  const mins = Math.floor(seconds / 60);

  if (mins < 60) {
    return `Last seen ${mins} min${mins > 1 ? "s" : ""} ago`;
  }

  const hours = Math.floor(mins / 60);

  if (hours < 24) {
    return `Last seen ${hours} hr${hours > 1 ? "s" : ""} ago`;
  }

  const days = Math.floor(hours / 24);

  return `Last seen ${days} day${days > 1 ? "s" : ""} ago`;
}

function isGpsStale(bus) {
  if (bus?.isLiveLocation === true) return false;

  return getGpsAgeSeconds(bus) > STALE_GPS_SECONDS;
}

function isGpsTooOld(bus) {
  return getGpsAgeSeconds(bus) > HIDE_OLD_GPS_SECONDS;
}

function gpsStatusText(bus) {
  if (isGpsTooOld(bus)) return "Old GPS location";
  if (isGpsStale(bus)) return bus.locationLabel || formatAgo(getGpsAgeSeconds(bus));

  return bus.locationLabel || "Live now";
}

function gpsStatusIcon(bus) {
  if (isGpsStale(bus)) return "fas fa-clock";
  return "fas fa-signal";
}

function isArriving(bus) {
  if (isGpsStale(bus)) return false;

  return getBusKm(bus) <= 0.15;
}

function isVeryClose(bus) {
  if (isGpsStale(bus)) return false;

  return getBusKm(bus) <= 0.35;
}

function isNearby(bus) {
  if (isGpsStale(bus)) return false;

  return getBusKm(bus) <= 0.7;
}

function distLabel(bus) {
  if (isGpsStale(bus)) {
    return "Last known";
  }

  const km = getBusKm(bus);

  if (km <= 0.15) return "Arriving";
  if (km <= 0.35) return "Very close";
  if (km <= 0.7) return "Nearby";

  return "Approaching";
}

function distIcon(bus) {
  if (isGpsStale(bus)) return "fas fa-clock";

  const km = getBusKm(bus);

  if (km <= 0.15) return "fas fa-circle-dot";
  if (km <= 0.35) return "fas fa-location-arrow";

  return "fas fa-arrow-right-to-bracket";
}

function distLabelClass(bus) {
  if (isGpsStale(bus)) return "nb__distLabel--stale";
  if (isArriving(bus)) return "nb__distLabel--arriving";
  if (isVeryClose(bus)) return "nb__distLabel--close";
  if (isNearby(bus)) return "nb__distLabel--nearby";

  return "nb__distLabel--far";
}

function proximityClass(bus) {
  if (isGpsStale(bus)) return "nb__item--stale";
  if (isArriving(bus)) return "nb__item--arriving";
  if (isVeryClose(bus)) return "nb__item--close";

  return "";
}

function badgeClass(bus) {
  if (isGpsStale(bus)) return "nb__badge--stale";
  if (isArriving(bus)) return "nb__badge--arriving";
  if (isVeryClose(bus)) return "nb__badge--close";

  return "nb__badge--default";
}

function availableSeats(bus) {
  return Math.max(0, Number(bus.capacity || 0) - Number(bus.seats || 0));
}

function pillClass(bus) {
  if (isGpsStale(bus)) return "pill-gray";

  const avail = availableSeats(bus);
  const cap = Number(bus.capacity || 0);

  if (cap <= 0) return "pill-gray";
  if (avail <= 0) return "pill-red";
  if (avail <= 3) return "pill-yellow";

  return "pill-green";
}

function pillText(bus) {
  if (isGpsStale(bus)) return "LAST";

  const avail = availableSeats(bus);
  const cap = Number(bus.capacity || 0);

  if (cap <= 0) return "—";
  if (avail <= 0) return "FULL";
  if (avail <= 3) return "FILLING";

  return "OPEN";
}
</script>

<style scoped>
.nb {
  display: flex;
  flex-direction: column;
  gap: 0;
}

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
  0% {
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.5);
  }

  70% {
    box-shadow: 0 0 0 6px rgba(34, 197, 94, 0);
  }

  100% {
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
  }
}

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
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}

.nb__ctaBtn:active {
  transform: scale(0.97);
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.2);
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

.nb__skeletonWrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

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
  top: 0;
  left: -60%;
  width: 60%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.04), transparent);
  animation: nbShimmer 1.3s infinite;
}

@keyframes nbShimmer {
  0% {
    transform: translateX(0);
  }

  100% {
    transform: translateX(280%);
  }
}

.nb__skLeft {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.nb__skLines {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nb__skRight {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.nb__skBadge {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: #f3f4f6;
  flex-shrink: 0;
}

.nb__skLine {
  height: 10px;
  border-radius: 999px;
  background: #f3f4f6;
  width: 130px;
}

.nb__skLine--lg {
  width: 170px;
  height: 12px;
}

.nb__skLine--sm {
  width: 70px;
}

.nb__skPill {
  width: 64px;
  height: 20px;
  border-radius: 999px;
  background: #f3f4f6;
}

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
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 1.5px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  animation: nbSpin 10s linear infinite;
}

@keyframes nbSpin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.nb__emptyRingInner {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #eff6ff;
  display: flex;
  align-items: center;
  justify-content: center;
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

.nb__itemsWrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nb__items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nb__items--scroll {
  max-height: 330px;
  overflow-y: auto;
  padding-right: 2px;
  overscroll-behavior: contain;
  scroll-behavior: smooth;
}

.nb__items--scroll::-webkit-scrollbar {
  width: 3px;
}

.nb__items--scroll::-webkit-scrollbar-thumb {
  background: #e5e7eb;
  border-radius: 999px;
}

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
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.nb__item:active {
  transform: scale(0.985);
  box-shadow: none;
}

.nb__item:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

.nb__item--arriving {
  border-color: rgba(34, 197, 94, 0.3);
}

.nb__item--arriving::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  border-radius: 14px 0 0 14px;
  background: #22c55e;
}

.nb__item--close {
  border-color: rgba(234, 179, 8, 0.3);
}

.nb__item--close::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  border-radius: 14px 0 0 14px;
  background: #eab308;
}

.nb__item--stale {
  border-color: #e5e7eb;
  background: #fafafa;
}

.nb__item--stale::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  border-radius: 14px 0 0 14px;
  background: #9ca3af;
}

.nb__chevron {
  font-size: 10px;
  color: #d1d5db;
  flex-shrink: 0;
  transition: transform 0.15s;
}

.nb__item:active .nb__chevron {
  transform: translateX(2px);
}

.nb__badge {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
  position: relative;
}

.nb__badge--default {
  background: #eff6ff;
  color: #2563eb;
}

.nb__badge--close {
  background: #fefce8;
  color: #b45309;
}

.nb__badge--arriving {
  background: #f0fdf4;
  color: #16a34a;
}

.nb__badge--stale {
  background: #f3f4f6;
  color: #6b7280;
}

.nb__badgePulse {
  position: absolute;
  inset: -4px;
  border-radius: 12px;
  border: 2px solid rgba(34, 197, 94, 0.35);
  animation: nbBadgePulse 1.5s ease-out infinite;
}

@keyframes nbBadgePulse {
  0% {
    opacity: 1;
    transform: scale(1);
  }

  100% {
    opacity: 0;
    transform: scale(1.4);
  }
}

.nb__itemLeft {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.nb__meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

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

.nb__gpsStatus {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin: 1px 0 0;
  font-size: 10.5px;
  font-weight: 700;
  color: #0f766e;
  line-height: 1.2;
}

.nb__gpsStatus.stale {
  color: #92400e;
}

.nb__itemRight {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  flex-shrink: 0;
}

.nb__distWrap {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1px;
}

.nb__distLabel {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.nb__distLabel--arriving {
  color: #16a34a;
}

.nb__distLabel--close {
  color: #b45309;
}

.nb__distLabel--nearby {
  color: #2563eb;
}

.nb__distLabel--far {
  color: #9ca3af;
}

.nb__distLabel--stale {
  color: #92400e;
}

.nb__distKm {
  font-size: 11px;
  font-weight: 500;
  color: #9ca3af;
}

.nb__pill {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 999px;
}

.pill-green {
  background: #f0fdf4;
  color: #16a34a;
  border: 1px solid #bbf7d0;
}

.pill-yellow {
  background: #fefce8;
  color: #b45309;
  border: 1px solid #fde68a;
}

.pill-red {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.pill-gray {
  background: #f9fafb;
  color: #9ca3af;
  border: 1px solid #f3f4f6;
}

.nb__seats {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 500;
  color: #9ca3af;
}

.nb__seats i {
  font-size: 9px;
}

.nb__seats b {
  color: #374151;
  font-weight: 700;
}

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
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.25);
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

.nbConfirm__text b {
  color: #111827;
  font-weight: 700;
}

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

.nbConfirm__meta .nbConfirm__stale {
  background: #fffbeb;
  color: #92400e;
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

.nbConfirm__btn:active {
  transform: scale(0.97);
}

.nbConfirm__btn.ghost {
  background: #f3f4f6;
  color: #374151;
}

.nbConfirm__btn.primary {
  background: #2563eb;
  color: #fff;
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.25);
}

.nb-confirm-enter-active,
.nb-confirm-leave-active {
  transition: opacity 0.18s ease;
}

.nb-confirm-enter-from,
.nb-confirm-leave-to {
  opacity: 0;
}

.nb-confirm-enter-active .nbConfirm__card,
.nb-confirm-leave-active .nbConfirm__card {
  transition: transform 0.18s ease, opacity 0.18s ease;
}

.nb-confirm-enter-from .nbConfirm__card,
.nb-confirm-leave-to .nbConfirm__card {
  transform: translateY(12px) scale(0.97);
  opacity: 0;
}
</style>