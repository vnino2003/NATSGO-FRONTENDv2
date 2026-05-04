<template>
  <div class="promos-tab">
    <div v-if="loading" class="loading-box">
      Loading fares and promos…
    </div>

    <div v-else-if="error" class="error-box">
      {{ error }}
    </div>

    <template v-else>
      <!-- FARE SECTION -->
      <div class="section-label">Bus fares</div>

      <!-- IMAGE MODE -->
      <div v-if="hasFareImage" class="fare-image-box">
        <img
          :src="fareImageUrl"
          alt="Fare Matrix"
          class="fare-image"
        />

        <p class="fare-image-note">
          Fare matrix uploaded by admin
        </p>
      </div>

      <!-- TABLE MODE -->
      <div v-else class="fare-list">
        <div class="fare-row header-row">
          <span class="fare-route">Route</span>
          <span class="fare-type">Regular</span>
          <span class="fare-type">Student</span>
          <span class="fare-type">Senior</span>
          <span class="fare-type">PWD</span>
        </div>

        <div v-if="fareRows.length === 0" class="empty-box">
          No fares available.
        </div>

        <div
          v-for="fare in fareRows"
          :key="`${fare.from_terminal_id}|${fare.to_terminal_id}|${fare.type}`"
          class="fare-row"
        >
          <span class="fare-route">
            {{ fare.from_name }} → {{ fare.to_name }}
            <small>{{ fare.type }}</small>
          </span>

          <span class="fare-type">
            <FareAmount :data="discountedFare(fare, 'regular')" />
          </span>

          <span class="fare-type">
            <FareAmount :data="discountedFare(fare, 'student')" />
          </span>

          <span class="fare-type">
            <FareAmount :data="discountedFare(fare, 'senior')" />
          </span>

          <span class="fare-type">
            <FareAmount :data="discountedFare(fare, 'pwd')" />
          </span>
        </div>
      </div>

      <!-- PROMOS SECTION -->
      <div class="section-label promo-section-label">
        Promos & discount
      </div>

      <div class="promo-list">
        <div v-if="activePromos.length === 0" class="empty-box">
          No active promos right now.
        </div>

        <div
          v-for="p in activePromos"
          :key="p.id"
          class="promo-card"
        >
          <div class="promo-dot" :class="promoDotClass(p)"></div>

          <div class="promo-info">
            <p class="promo-title">{{ p.name }}</p>
            <p class="promo-sub">{{ promoDescription(p) }}</p>
          </div>

          <span class="promo-date">
            {{ formatPromoDate(p) }}
          </span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, defineComponent, h, onMounted, ref } from "vue";
import api from "../../../../services/api/http";

const fareRows = ref([]);
const promoRows = ref([]);
const fareImage = ref(null);

const loading = ref(false);
const error = ref("");

const hasFareImage = computed(() => !!fareImage.value?.url);

const fareImageUrl = computed(() => {
  const url = fareImage.value?.url;

  if (!url) return "";

  if (url.startsWith("http")) return url;

  const baseURL = api.defaults.baseURL || "";
  const serverBase = baseURL.replace(/\/api\/?$/, "");

  return `${serverBase}${url}`;
});

const passengerLabels = {
  regular: "Regular",
  student: "Student",
  senior: "Senior Citizen",
  pwd: "PWD",
};

const activePromos = computed(() =>
  promoRows.value.filter((p) => p.status === "active")
);

function normalizeText(v) {
  return String(v || "").trim().toLowerCase();
}

function formatMoney(v) {
  return Number(v || 0).toFixed(2);
}

async function loadFareImage() {
  try {
    const res = await api.get("/fares/image");
    fareImage.value = res.data;
  } catch (err) {
    // 404 means no uploaded image yet, so use table mode
    fareImage.value = null;
  }
}

async function loadFares() {
  const res = await api.get("/fares");
  fareRows.value = Array.isArray(res.data) ? res.data : [];
}

async function loadPromotions() {
  const res = await api.get("/promotions");
  promoRows.value = Array.isArray(res.data) ? res.data : [];
}

async function loadPage() {
  loading.value = true;
  error.value = "";

  try {
    await loadFareImage();

    const tasks = [loadPromotions()];

    if (!hasFareImage.value) {
      tasks.push(loadFares());
    } else {
      fareRows.value = [];
    }

    await Promise.all(tasks);
  } catch (err) {
    console.error("load commuter fare page error:", err);
    error.value =
      err.response?.data?.message ||
      "Failed to load fares and promotions.";
  } finally {
    loading.value = false;
  }
}

function getActivePromoForFare(row, passengerKey) {
  const passengerLabel = passengerLabels[passengerKey];
  const routeLabel = `${row.from_name} → ${row.to_name}`;

  return activePromos.value.find((p) => {
    const appliesToPassenger =
      Array.isArray(p.appliesTo) &&
      p.appliesTo.includes(passengerLabel);

    const appliesToRoute =
      !p.routes ||
      p.routes.length === 0 ||
      p.routes.some((r) => normalizeText(r) === normalizeText(routeLabel));

    return appliesToPassenger && appliesToRoute;
  });
}

function discountedFare(row, passengerKey) {
  const base = Number(row.fares?.[passengerKey] || 0);
  const promo = getActivePromoForFare(row, passengerKey);

  if (!promo) {
    return {
      base,
      final: base,
      hasDiscount: false,
      promo: null,
    };
  }

  let final = base;

  if (promo.type === "percent") {
    final = base - (base * Number(promo.value || 0)) / 100;
  }

  if (promo.type === "flat") {
    final = base - Number(promo.value || 0);
  }

  final = Math.max(0, final);

  return {
    base,
    final: Number(final.toFixed(2)),
    hasDiscount: final < base,
    promo,
  };
}

function promoDotClass(p) {
  if (p.type === "percent") return "dot-blue";
  if (p.type === "flat") return "dot-green";
  return "dot-amber";
}

function promoDescription(p) {
  const discount =
    p.type === "percent"
      ? `${p.value}% off`
      : `₱${formatMoney(p.value)} off`;

  const routes =
    p.routes && p.routes.length
      ? p.routes.join(", ")
      : "All routes";

  return `${discount} · ${routes}`;
}

function formatPromoDate(p) {
  const start = p.startDate
    ? new Date(p.startDate).toLocaleDateString()
    : "";

  const end = p.endDate
    ? new Date(p.endDate).toLocaleDateString()
    : "";

  if (start && end) return `${start}–${end}`;
  if (start) return start;
  return "";
}

const FareAmount = defineComponent({
  props: {
    data: {
      type: Object,
      required: true,
    },
  },
  setup(props) {
    return () => {
      const d = props.data;

      if (!d.hasDiscount) {
        return h("span", { class: "fare-normal" }, `₱${formatMoney(d.final)}`);
      }

      return h("span", { class: "fare-discount-wrap" }, [
        h("span", { class: "fare-old-wrap" }, [
          h("span", { class: "fare-ekis" }, "✕"),
          h("span", { class: "fare-old" }, `₱${formatMoney(d.base)}`),
        ]),
        h("span", { class: "fare-new" }, `₱${formatMoney(d.final)}`),
      ]);
    };
  },
});

onMounted(() => {
  loadPage();
});
</script>

<style scoped>
.promos-tab {
  padding: 0 2px;
}

.loading-box,
.empty-box,
.error-box {
  padding: 14px;
  font-size: 12px;
  text-align: center;
}

.loading-box,
.empty-box {
  color: #6b7280;
}

.error-box {
  color: #dc2626;
  background: #fef2f2;
  border: 0.5px solid #fecaca;
  border-radius: 10px;
}

.section-label {
  font-size: 11px;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.promo-section-label {
  margin-top: 16px;
}

/* IMAGE MODE */
.fare-image-box {
  background: #ffffff;
  border: 0.5px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
  padding: 8px;
}

.fare-image {
  width: 100%;
  max-height: 420px;
  display: block;
  border-radius: 8px;
  object-fit: contain;
  background: #f9fafb;
}

.fare-image-note {
  margin: 8px 2px 0;
  font-size: 10px;
  color: #9ca3af;
  text-align: center;
}

/* TABLE MODE */
.fare-list {
  background: #ffffff;
  border: 0.5px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
}

.fare-row {
  display: flex;
  align-items: center;
  padding: 9px 12px;
  border-bottom: 0.5px solid #f3f4f6;
  gap: 4px;
}

.fare-row:last-child {
  border-bottom: none;
}

.header-row {
  background: #f8fafc;
}

.header-row span {
  font-size: 10px;
  font-weight: 500;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.fare-route {
  flex: 1.5;
  font-size: 12px;
  font-weight: 500;
  color: #111827;
  min-width: 110px;
}

.fare-route small {
  display: block;
  margin-top: 2px;
  font-size: 10px;
  color: #9ca3af;
  font-weight: 400;
}

.fare-type {
  flex: 1;
  font-size: 12px;
  color: #374151;
  text-align: center;
  min-width: 62px;
}

.fare-normal {
  color: #374151;
  font-weight: 500;
}

.fare-discount-wrap {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
}

.fare-old-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
}

.fare-ekis {
  font-size: 10px;
  color: #dc2626;
  font-weight: 800;
  line-height: 1;
}

.fare-old {
  font-size: 10px;
  color: #9ca3af;
  text-decoration: line-through;
  text-decoration-thickness: 1.5px;
}

.fare-new {
  font-size: 12px;
  color: #16a34a;
  font-weight: 700;
}

/* PROMOS */
.promo-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.promo-card {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #ffffff;
  border: 0.5px solid #e5e7eb;
  border-radius: 10px;
  padding: 10px 12px;
}

.promo-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-green {
  background: #10b981;
}

.dot-blue {
  background: #1e88e5;
}

.dot-amber {
  background: #f59e0b;
}

.promo-info {
  flex: 1;
}

.promo-title {
  font-size: 12px;
  font-weight: 500;
  color: #111827;
  margin: 0 0 2px;
}

.promo-sub {
  font-size: 11px;
  color: #6b7280;
  margin: 0;
}

.promo-date {
  font-size: 10px;
  color: #9ca3af;
  flex-shrink: 0;
}

@media (max-width: 640px) {
  .fare-row {
    padding: 9px 8px;
    gap: 2px;
  }

  .fare-route {
    flex: 1.4;
    font-size: 11px;
    min-width: 95px;
  }

  .fare-type {
    font-size: 11px;
    min-width: 50px;
  }

  .header-row span {
    font-size: 9px;
  }

  .fare-old,
  .fare-ekis {
    font-size: 9px;
  }

  .fare-new {
    font-size: 11px;
  }

  .fare-image {
    max-height: 360px;
  }
}
</style>