<template>
  <div class="fm">
    <!-- PAGE HEADER -->
    <div class="fm-page-header">
      <div>
        <div class="fm-breadcrumb">
          Admin Panel <span>›</span> Fare Management
        </div>
        <h1 class="fm-page-title">Fare Management</h1>
        <p class="fm-page-desc">
          Configure route fares, passenger discounts, uploaded fare matrix, and promotional campaigns.
        </p>
      </div>

      <div class="fm-last-updated">
        <span class="fm-lu-dot"></span>
        Last synced just now
      </div>
    </div>

    <!-- TABS -->
    <div class="fm-tabs">
      <button
        v-for="t in tabList"
        :key="t.key"
        type="button"
        :class="['fm-tab', { 'fm-tab--active': tab === t.key }]"
        @click="tab = t.key"
      >
        <span class="fm-tab-icon" v-html="t.icon"></span>
        {{ t.label }}
        <span class="fm-tab-count">{{ t.count }}</span>
      </button>
    </div>

    <!-- FARES TAB -->
    <section v-if="tab === 'fares'" class="fm-panel">
      <!-- TOOLBAR -->
      <div class="fm-toolbar">
        <div class="fm-toolbar-left">
          <div class="fm-search-wrap">
            <i class="fas fa-search"></i>
            <input
              v-model="fareSearch"
              class="fm-search"
              placeholder="Search routes…"
              @input="onFareSearch"
            />
          </div>

          <div class="fm-save-status">
            <template v-if="faresSaving">
              <span class="fm-spinner"></span>
              Saving…
            </template>
            <template v-else-if="faresSaved">
              <span class="fm-saved-dot"></span>
              All changes saved
            </template>
          </div>
        </div>

        <div class="fm-toolbar-right">
          <button class="fm-btn fm-btn--ghost" type="button" @click="loadFares">
            <i class="fas fa-rotate-right"></i>
            Refresh
          </button>

          <button
            class="fm-btn fm-btn--secondary"
            type="button"
            :disabled="faresSaving || !faresDirty"
            @click="saveFares"
          >
            <i class="fas fa-save"></i>
            Save changes
          </button>

          <button class="fm-btn fm-btn--primary" type="button" @click="openFareModal('add')">
            <i class="fas fa-plus"></i>
            Add route
          </button>
        </div>
      </div>

      <!-- MODE BANNER -->
      <div class="fm-mode-banner">
        <div class="fm-mode-label">
          <i class="fas fa-table-list"></i>
          Fare Entry Mode
        </div>

        <div class="fm-mode-toggle">
          <button
            type="button"
            :class="['fm-mode-btn', { 'fm-mode-btn--active': fareMode === 'manual' }]"
            @click="fareMode = 'manual'"
          >
            <i class="fas fa-list"></i>
            Manual Entry
          </button>

          <button
            type="button"
            :class="['fm-mode-btn', { 'fm-mode-btn--active': fareMode === 'upload' }]"
            @click="switchToUploadMode"
          >
            <i class="fas fa-upload"></i>
            Upload Image
          </button>
        </div>
      </div>

      <!-- LOADING / ERROR -->
      <div v-if="faresLoading" class="fm-loading">
        <span class="fm-spinner"></span>
        Loading fares…
      </div>

      <div v-else-if="faresError" class="fm-form-error">
        <i class="fas fa-circle-exclamation"></i>
        {{ faresError }}
      </div>

      <template v-else>
        <!-- UPLOAD MODE -->
        <div v-if="fareMode === 'upload'" class="fm-upload-area">
          <div v-if="globalImageLoading" class="fm-loading">
            <span class="fm-spinner"></span>
            Loading image…
          </div>

          <template v-else>
            <div
              class="fm-dropzone"
              :class="{ 'fm-dropzone--over': isDragging }"
              @dragover.prevent="isDragging = true"
              @dragleave.prevent="isDragging = false"
              @drop.prevent="handleDrop"
              @click="fileInput?.click()"
            >
              <input
                ref="fileInput"
                type="file"
                accept="image/*"
                hidden
                @change="handleFileSelect"
              />

              <template v-if="!uploadedImageUrl">
                <div class="fm-dropzone-icon">
                  <i class="fas fa-image"></i>
                </div>
                <div class="fm-dropzone-title">Drop fare matrix image here</div>
                <div class="fm-dropzone-sub">or click to browse — PNG, JPG, WEBP supported</div>
              </template>

              <template v-else>
                <div class="fm-uploaded-preview">
                  <img
                    :src="uploadedImageUrl"
                    alt="Fare matrix"
                    class="fm-preview-img"
                    @error="handlePreviewError"
                  />

                  <div class="fm-preview-overlay">
                    <button
                      class="fm-preview-change"
                      type="button"
                      @click.stop="fileInput?.click()"
                    >
                      <i class="fas fa-upload"></i>
                      Change image
                    </button>

                    <button
                      class="fm-preview-remove"
                      type="button"
                      @click.stop="removeGlobalImage"
                    >
                      <i class="fas fa-trash"></i>
                      Remove
                    </button>
                  </div>
                </div>
              </template>
            </div>

            <div v-if="globalImageUploading" class="fm-upload-progress">
              <div class="fm-progress-track">
                <div class="fm-progress-bar" :style="{ width: `${globalUploadProgress}%` }"></div>
              </div>
              <span>Uploading… {{ globalUploadProgress }}%</span>
            </div>

            <div v-if="imageDebugUrl" class="fm-image-debug">
              Image URL:
              <span>{{ imageDebugUrl }}</span>
            </div>

            <div class="fm-upload-note">
              <i class="fas fa-circle-info"></i>
              This image will be shown as the fare matrix for all routes across the entire system.
            </div>
          </template>
        </div>

        <!-- MANUAL TABLE MODE -->
        <div v-else class="fm-table-wrap">
          <table class="fm-table">
            <thead>
              <tr>
                <th class="fm-th-route">Route</th>
                <th v-for="pt in passengerTypes" :key="pt.key" class="fm-th-fare">
                  <span class="fm-th-dot" :style="{ background: pt.color }"></span>
                  {{ pt.label }}
                </th>
                <th class="fm-th-actions"></th>
              </tr>
            </thead>

            <tbody>
              <tr v-if="filteredFares.length === 0">
                <td :colspan="passengerTypes.length + 2" class="fm-empty-cell">
                  <div class="fm-table-empty">
                    <i class="fas fa-route"></i>
                    <p>No routes found</p>
                    <small>Try a different search or add a new route.</small>
                  </div>
                </td>
              </tr>

              <tr
                v-for="row in filteredFares"
                :key="`${row.from_terminal_id}|${row.to_terminal_id}|${row.type}`"
                class="fm-row"
              >
                <td class="fm-td-route">
                  <div class="fm-route-label">
                    <span>{{ row.from_name }}</span>
                    <i class="fas fa-arrow-right"></i>
                    <span>{{ row.to_name }}</span>
                  </div>

                  <div class="fm-route-badges">
                    <span class="fm-route-type-badge">{{ row.type }}</span>
                  </div>
                </td>

                <td v-for="pt in passengerTypes" :key="pt.key" class="fm-td-fare">
                  <div class="fm-fare-input-wrap">
                    <span class="fm-peso">₱</span>
                    <input
                      v-model.number="row.fares[pt.key]"
                      class="fm-fare-input"
                      type="number"
                      min="0"
                      step="0.5"
                      @change="markFareDirty(row)"
                    />
                  </div>

                  <div
                    v-if="discountedFare(row, pt.key).hasDiscount"
                    class="fm-discount-preview"
                  >
                    <span class="fm-old-fare">
                      ₱{{ discountedFare(row, pt.key).base.toFixed(2) }}
                    </span>

                    <span class="fm-new-fare">
                      ₱{{ discountedFare(row, pt.key).final.toFixed(2) }}
                    </span>

                    <span class="fm-promo-tag">
                      {{ discountedFare(row, pt.key).promo.name }}
                    </span>
                  </div>
                </td>

                <td class="fm-td-actions">
                  <button
                    class="fm-action-btn fm-action-btn--edit"
                    type="button"
                    title="Edit"
                    @click="openFareModal('edit', row)"
                  >
                    <i class="fas fa-pen"></i>
                  </button>

                  <button
                    class="fm-action-btn fm-action-btn--del"
                    type="button"
                    title="Delete"
                    @click="confirmDeleteFare(row)"
                  >
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <!-- LEGEND -->
      <div class="fm-legend">
        <span class="fm-legend-title">Passenger types:</span>

        <span v-for="pt in passengerTypes" :key="pt.key" class="fm-legend-item">
          <span class="fm-legend-dot" :style="{ background: pt.color }"></span>
          {{ pt.label }}
          <em>{{ pt.note }}</em>
        </span>
      </div>
    </section>

    <!-- PROMOTIONS TAB -->
    <section v-if="tab === 'promos'" class="fm-panel">
      <div class="fm-toolbar">
        <div class="fm-toolbar-left">
          <div class="fm-search-wrap">
            <i class="fas fa-search"></i>
            <input v-model="promoSearch" class="fm-search" placeholder="Search promotions…" />
          </div>

          <div class="fm-filter-pills">
            <button
              v-for="f in promoFilters"
              :key="f.key"
              type="button"
              :class="['fm-filter-pill', { 'fm-filter-pill--active': promoFilter === f.key }]"
              @click="promoFilter = f.key"
            >
              {{ f.label }}
            </button>
          </div>
        </div>

        <button class="fm-btn fm-btn--primary" type="button" @click="openAddPromo">
          <i class="fas fa-plus"></i>
          New promotion
        </button>
      </div>

      <div v-if="promosLoading" class="fm-loading">
        <span class="fm-spinner"></span>
        Loading promotions…
      </div>

      <div v-else-if="promosError" class="fm-form-error">
        <i class="fas fa-circle-exclamation"></i>
        {{ promosError }}
      </div>

      <template v-else>
        <div v-if="filteredPromos.length === 0" class="fm-promos-empty">
          <i class="fas fa-tags"></i>
          <p>No promotions yet</p>
          <small>Create your first promotion to offer discounts to commuters.</small>
          <button class="fm-btn fm-btn--primary" type="button" @click="openAddPromo">
            New promotion
          </button>
        </div>

        <div v-else class="fm-promos-grid">
          <article v-for="p in filteredPromos" :key="p.id" class="fm-promo-card">
            <div class="fm-promo-card-header">
              <div class="fm-promo-card-top">
                <span
                  :class="[
                    'fm-promo-status',
                    p.status === 'active'
                      ? 'fm-promo-status--active'
                      : p.status === 'expired'
                        ? 'fm-promo-status--expired'
                        : 'fm-promo-status--upcoming',
                  ]"
                >
                  <span></span>
                  {{ p.status === 'active' ? 'Active' : p.status === 'expired' ? 'Expired' : 'Upcoming' }}
                </span>

                <div class="fm-promo-actions">
                  <button class="fm-action-btn fm-action-btn--edit" type="button" @click="openEditPromo(p)">
                    <i class="fas fa-pen"></i>
                  </button>

                  <button class="fm-action-btn fm-action-btn--del" type="button" @click="confirmDeletePromo(p)">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>

              <div class="fm-promo-discount">
                {{ p.type === 'percent' ? `${p.value}%` : `₱${Number(p.value).toFixed(2)}` }}
                <span>OFF</span>
              </div>

              <h3>{{ p.name }}</h3>
              <p>{{ p.description }}</p>
            </div>

            <div class="fm-promo-card-body">
              <div class="fm-promo-meta-row">
                <span>Applies to</span>
                <div class="fm-promo-pills">
                  <b v-for="a in p.appliesTo" :key="a">{{ a }}</b>
                </div>
              </div>

              <div class="fm-promo-meta-row">
                <span>Routes</span>
                <small v-if="p.routes && p.routes.length">{{ p.routes.join(', ') }}</small>
                <small v-else>All routes</small>
              </div>

              <div class="fm-promo-meta-row">
                <span>Validity</span>
                <small>
                  {{ formatDate(p.startDate) }}
                  <template v-if="p.endDate"> – {{ formatDate(p.endDate) }}</template>
                  <template v-else> · Ongoing</template>
                </small>
              </div>
            </div>
          </article>
        </div>
      </template>
    </section>

    <!-- FARE MODAL -->
    <Transition name="fm-modal">
      <div v-if="showFareModal" class="fm-overlay" @click.self="showFareModal = false">
        <div class="fm-modal">
          <div class="fm-modal-head">
            <div>
              <h2>{{ fareModalMode === 'edit' ? 'Edit route fare' : 'Add new route' }}</h2>
              <p>Configure pricing per passenger type.</p>
            </div>

            <button class="fm-modal-close" type="button" @click="showFareModal = false">
              <i class="fas fa-xmark"></i>
            </button>
          </div>

          <div class="fm-modal-body">
            <div class="fm-form-section">
              <h3>Route details</h3>

              <div class="fm-form-grid">
                <label class="fm-field">
                  <span>From terminal <b>*</b></span>
                  <select v-model.number="fareForm.from_terminal_id" class="fm-input">
                    <option value="" disabled>Select terminal…</option>
                    <option v-for="t in terminals" :key="t.terminal_id" :value="t.terminal_id">
                      {{ t.name }}
                    </option>
                  </select>
                </label>

                <label class="fm-field">
                  <span>To terminal <b>*</b></span>
                  <select v-model.number="fareForm.to_terminal_id" class="fm-input">
                    <option value="" disabled>Select terminal…</option>
                    <option v-for="t in terminals" :key="t.terminal_id" :value="t.terminal_id">
                      {{ t.name }}
                    </option>
                  </select>
                </label>

                <div class="fm-field fm-field--full">
                  <span>Route type</span>

                  <div class="fm-radio-row">
                    <label
                      v-for="rt in routeTypes"
                      :key="rt"
                      :class="['fm-radio-chip', { 'fm-radio-chip--active': fareForm.type === rt }]"
                    >
                      <input v-model="fareForm.type" type="radio" :value="rt" />
                      {{ rt }}
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div class="fm-form-section">
              <h3>Fares per passenger type</h3>

              <div class="fm-fares-grid">
                <label v-for="pt in passengerTypes" :key="pt.key" class="fm-fare-field">
                  <span>
                    <i :style="{ background: pt.color }"></i>
                    {{ pt.label }}
                  </span>

                  <div class="fm-fare-input-wrap fm-fare-input-wrap--lg">
                    <span class="fm-peso">₱</span>
                    <input
                      v-model.number="fareForm.fares[pt.key]"
                      class="fm-fare-input"
                      type="number"
                      min="0"
                      step="0.5"
                    />
                  </div>

                  <small v-if="pt.key !== 'regular' && fareForm.fares.regular">
                    {{ Math.round((1 - fareForm.fares[pt.key] / fareForm.fares.regular) * 100) }}% off regular
                  </small>
                </label>
              </div>
            </div>

            <div v-if="fareFormError" class="fm-form-error">
              <i class="fas fa-circle-exclamation"></i>
              {{ fareFormError }}
            </div>
          </div>

          <div class="fm-modal-foot">
            <button class="fm-btn fm-btn--ghost" type="button" @click="showFareModal = false">
              Cancel
            </button>

            <button class="fm-btn fm-btn--primary" type="button" :disabled="fareModalSaving" @click="saveFareModal">
              <span v-if="fareModalSaving" class="fm-spinner"></span>
              {{ fareModalMode === 'edit' ? 'Save changes' : 'Add route' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- PROMO MODAL -->
    <Transition name="fm-modal">
      <div v-if="showPromoModal" class="fm-overlay" @click.self="closePromoModal">
        <div class="fm-modal fm-modal--wide">
          <div class="fm-modal-head">
            <div>
              <h2>{{ editingPromoId ? 'Edit promotion' : 'New promotion' }}</h2>
              <p>Create discount campaigns for commuters.</p>
            </div>

            <button class="fm-modal-close" type="button" @click="closePromoModal">
              <i class="fas fa-xmark"></i>
            </button>
          </div>

          <div class="fm-modal-body">
            <div class="fm-form-section">
              <h3>Promotion details</h3>

              <div class="fm-form-grid">
                <label class="fm-field fm-field--full">
                  <span>Promotion name <b>*</b></span>
                  <input v-model="promoForm.name" class="fm-input" placeholder="e.g. Student Discount Week" />
                </label>

                <label class="fm-field fm-field--full">
                  <span>Description</span>
                  <textarea
                    v-model="promoForm.description"
                    class="fm-textarea"
                    rows="2"
                    placeholder="Brief description for commuters…"
                  ></textarea>
                </label>
              </div>
            </div>

            <div class="fm-form-section">
              <h3>Discount configuration</h3>

              <div class="fm-form-grid">
                <div class="fm-field">
                  <span>Discount type</span>

                  <div class="fm-radio-row">
                    <label :class="['fm-radio-chip', { 'fm-radio-chip--active': promoForm.type === 'percent' }]">
                      <input v-model="promoForm.type" type="radio" value="percent" />
                      Percentage (%)
                    </label>

                    <label :class="['fm-radio-chip', { 'fm-radio-chip--active': promoForm.type === 'flat' }]">
                      <input v-model="promoForm.type" type="radio" value="flat" />
                      Flat amount (₱)
                    </label>
                  </div>
                </div>

                <label class="fm-field">
                  <span>{{ promoForm.type === 'percent' ? 'Discount %' : 'Amount ₱' }} <b>*</b></span>
                  <div class="fm-fare-input-wrap fm-fare-input-wrap--lg">
                    <span class="fm-peso">{{ promoForm.type === 'percent' ? '%' : '₱' }}</span>
                    <input v-model.number="promoForm.value" class="fm-fare-input" type="number" min="0" />
                  </div>
                </label>

                <label class="fm-field">
                  <span>Start date</span>
                  <input v-model="promoForm.startDate" class="fm-input" type="date" />
                </label>

                <label class="fm-field">
                  <span>End date <em>(optional)</em></span>
                  <input v-model="promoForm.endDate" class="fm-input" type="date" />
                </label>
              </div>
            </div>

            <div class="fm-form-section">
              <h3>Applies to <b>*</b></h3>

              <div class="fm-check-row">
                <label
                  v-for="pt in passengerTypes"
                  :key="pt.key"
                  :class="['fm-check-chip', { 'fm-check-chip--active': promoForm.appliesTo.includes(pt.label) }]"
                >
                  <input v-model="promoForm.appliesTo" type="checkbox" :value="pt.label" />
                  <span :style="{ background: pt.color }"></span>
                  {{ pt.label }}
                </label>
              </div>
            </div>

            <div class="fm-form-section">
              <h3>Applicable routes <em>(leave empty for all routes)</em></h3>

              <div class="fm-check-row">
                <button
                  v-for="route in routeOptionsForPromo"
                  :key="`${route.from_terminal_id}|${route.to_terminal_id}|${route.route_type}`"
                  type="button"
                  :class="['fm-check-chip', { 'fm-check-chip--active': isPromoRouteSelected(route) }]"
                  @click="togglePromoRoute(route)"
                >
                  {{ route.label }}
                  <small>{{ route.route_type }}</small>
                </button>
              </div>
            </div>

            <div v-if="promoError" class="fm-form-error">
              <i class="fas fa-circle-exclamation"></i>
              {{ promoError }}
            </div>
          </div>

          <div class="fm-modal-foot">
            <button class="fm-btn fm-btn--ghost" type="button" @click="closePromoModal">
              Cancel
            </button>

            <button class="fm-btn fm-btn--primary" type="button" :disabled="promoModalSaving" @click="savePromo">
              <span v-if="promoModalSaving" class="fm-spinner"></span>
              {{ editingPromoId ? 'Save changes' : 'Create promotion' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- DELETE CONFIRM -->
    <Transition name="fm-modal">
      <div v-if="deleteConfirm" class="fm-overlay" @click.self="deleteConfirm = null">
        <div class="fm-confirm-modal">
          <div class="fm-confirm-icon">
            <i class="fas fa-triangle-exclamation"></i>
          </div>

          <h2>{{ deleteConfirm.title }}</h2>
          <p>{{ deleteConfirm.message }}</p>

          <div class="fm-confirm-actions">
            <button class="fm-btn fm-btn--ghost" type="button" @click="deleteConfirm = null">
              Cancel
            </button>

            <button class="fm-btn fm-btn--danger" type="button" :disabled="deleteConfirm.loading" @click="confirmDelete">
              <span v-if="deleteConfirm.loading" class="fm-spinner"></span>
              Delete
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { useFares, usePromotions } from "../../composables/useFares";
import api, { toStaticUrl } from "../../services/api/http";

const {
  rows: fareRows,
  loading: faresLoading,
  error: faresError,
  fetchFares,
  addFare,
  editFare,
  removeFare,
} = useFares();

const {
  rows: promoRows,
  loading: promosLoading,
  error: promosError,
  fetchPromotions,
  addPromotion,
  editPromotion,
  removePromotion,
} = usePromotions();

const passengerTypes = [
  { key: "regular", label: "Regular", color: "#3b82f6", note: "Full fare" },
  { key: "student", label: "Student", color: "#8b5cf6", note: "20% discount" },
  { key: "senior", label: "Senior Citizen", color: "#f59e0b", note: "20% discount" },
  { key: "pwd", label: "PWD", color: "#10b981", note: "20% discount" },
];

const routeTypes = ["Regular Route", "Express Route", "Provincial", "City Shuttle"];

const tab = ref("fares");

const tabList = computed(() => [
  {
    key: "fares",
    label: "Fare Matrix",
    icon: '<i class="fas fa-table"></i>',
    count: fareRows.value.length,
  },
  {
    key: "promos",
    label: "Promotions",
    icon: '<i class="fas fa-tags"></i>',
    count: promoRows.value.length,
  },
]);

function passengerLabel(key) {
  return passengerTypes.find((p) => p.key === key)?.label || key;
}

function normalizeText(v) {
  return String(v || "").trim().toLowerCase();
}

function getActivePromoForFare(row, passengerKey) {
  const label = passengerLabel(passengerKey);
  const routeLabel = `${row.from_name} → ${row.to_name}`;

  return promoRows.value.find((p) => {
    if (p.status !== "active") return false;

    const appliesToPassenger =
      Array.isArray(p.appliesTo) && p.appliesTo.includes(label);

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

/* Terminals */
const terminals = ref([]);

async function loadTerminals() {
  try {
    const res = await api.get("/admin/terminals");
    const data = Array.isArray(res.data) ? res.data : res.data?.data || [];

    const map = new Map();

    for (const t of data) {
      const id = t.terminal_id;
      const name = t.terminal_name ?? t.name ?? "";

      if (id && !map.has(id)) {
        map.set(id, {
          ...t,
          terminal_id: id,
          name,
        });
      }
    }

    terminals.value = [...map.values()];
  } catch (err) {
    console.error("Failed to load terminals:", err);
  }
}

/* Fares */
const fareSearch = ref("");
const fareMode = ref("manual");
const faresSaving = ref(false);
const faresSaved = ref(false);
const faresDirty = ref(false);
const dirtyRows = ref(new Set());

const filteredFares = computed(() => {
  const kw = fareSearch.value.toLowerCase();

  return fareRows.value.filter((r) => {
    const text = `${r.from_name || ""} ${r.to_name || ""} ${r.type || ""}`.toLowerCase();
    return !kw || text.includes(kw);
  });
});

async function loadFares() {
  await fetchFares(fareSearch.value ? { q: fareSearch.value } : {});
}

let searchTimer = null;
function onFareSearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(loadFares, 300);
}

function markFareDirty(row) {
  faresDirty.value = true;
  dirtyRows.value.add(`${row.from_terminal_id}|${row.to_terminal_id}|${row.type}`);
}

let savedTimer = null;

async function saveFares() {
  if (!faresDirty.value) return;

  faresSaving.value = true;

  try {
    for (const key of dirtyRows.value) {
      const row = fareRows.value.find(
        (r) => `${r.from_terminal_id}|${r.to_terminal_id}|${r.type}` === key
      );

      if (row) {
        await editFare(row.from_terminal_id, row.to_terminal_id, row.type, {
          fares: { ...row.fares },
        });
      }
    }

    dirtyRows.value.clear();
    faresDirty.value = false;
    faresSaved.value = true;

    clearTimeout(savedTimer);
    savedTimer = setTimeout(() => {
      faresSaved.value = false;
    }, 3500);
  } finally {
    faresSaving.value = false;
  }
}

/* Global fare image */
const uploadedImageUrl = ref(null);
const imageDebugUrl = ref("");
const isDragging = ref(false);
const fileInput = ref(null);
const globalImageLoading = ref(false);
const globalImageUploading = ref(false);
const globalUploadProgress = ref(0);

async function switchToUploadMode() {
  fareMode.value = "upload";
  await loadGlobalImage();
}

async function loadGlobalImage() {
  globalImageLoading.value = true;
  uploadedImageUrl.value = null;
  imageDebugUrl.value = "";

  try {
    const res = await api.get("/admin/fares/image", {
      headers: {
        "Cache-Control": "no-cache",
      },
    });

    const fullUrl = toStaticUrl(res.data?.url);
    uploadedImageUrl.value = fullUrl ? `${fullUrl}?v=${Date.now()}` : null;
    imageDebugUrl.value = fullUrl || "";
  } catch (err) {
    if (err?.response?.status !== 404) {
      console.error("Failed to load fare image:", err);
    }

    uploadedImageUrl.value = null;
    imageDebugUrl.value = "";
  } finally {
    globalImageLoading.value = false;
  }
}

function handleFileSelect(e) {
  const file = e.target.files?.[0];

  if (file) doUpload(file);

  e.target.value = "";
}

function handleDrop(e) {
  isDragging.value = false;

  const file = e.dataTransfer.files?.[0];

  if (file) doUpload(file);
}

async function doUpload(file) {
  if (!file.type?.startsWith("image/")) {
    alert("Please upload an image file.");
    return;
  }

  globalImageUploading.value = true;
  globalUploadProgress.value = 0;

  const formData = new FormData();
  formData.append("image", file);

  let tick = null;

  try {
    tick = setInterval(() => {
      if (globalUploadProgress.value < 85) {
        globalUploadProgress.value += 15;
      }
    }, 150);

    const res = await api.post("/admin/fares/image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress(e) {
        if (e.total) {
          globalUploadProgress.value = Math.round((e.loaded / e.total) * 100);
        }
      },
    });

    const fullUrl = toStaticUrl(res.data?.url);
    uploadedImageUrl.value = fullUrl ? `${fullUrl}?v=${Date.now()}` : null;
    imageDebugUrl.value = fullUrl || "";
    globalUploadProgress.value = 100;
  } catch (err) {
    console.error("Upload failed:", err);
    alert(err?.response?.data?.message || "Image upload failed. Please try again.");
  } finally {
    if (tick) clearInterval(tick);

    globalImageUploading.value = false;

    setTimeout(() => {
      globalUploadProgress.value = 0;
    }, 800);
  }
}

async function removeGlobalImage() {
  try {
    await api.delete("/admin/fares/image");
    uploadedImageUrl.value = null;
    imageDebugUrl.value = "";
  } catch (err) {
    console.error("Failed to delete image:", err);
    alert(err?.response?.data?.message || "Failed to remove image. Please try again.");
  }
}

function handlePreviewError() {
  console.error("Fare image failed to load:", uploadedImageUrl.value);
  alert(
    "Image exists in database, but the file URL cannot be opened. Check backend static uploads: app.use('/uploads', express.static(...))."
  );
}

/* Fare modal */
const showFareModal = ref(false);
const fareModalMode = ref("add");
const fareFormError = ref("");
const fareModalSaving = ref(false);
let editingFareOrig = null;

function blankFareForm() {
  return {
    from_terminal_id: "",
    to_terminal_id: "",
    type: "Regular Route",
    fares: {
      regular: 0,
      student: 0,
      senior: 0,
      pwd: 0,
    },
  };
}

const fareForm = reactive(blankFareForm());

function resetFareForm() {
  Object.assign(fareForm, blankFareForm());
}

function openFareModal(mode, row = null) {
  fareModalMode.value = mode;
  fareFormError.value = "";

  if (mode === "edit" && row) {
    editingFareOrig = {
      from_terminal_id: row.from_terminal_id,
      to_terminal_id: row.to_terminal_id,
      type: row.type,
    };

    Object.assign(fareForm, {
      from_terminal_id: row.from_terminal_id,
      to_terminal_id: row.to_terminal_id,
      type: row.type,
      fares: { ...row.fares },
    });
  } else {
    editingFareOrig = null;
    resetFareForm();
  }

  showFareModal.value = true;
}

async function saveFareModal() {
  fareFormError.value = "";

  if (!fareForm.from_terminal_id) {
    fareFormError.value = "From terminal is required.";
    return;
  }

  if (!fareForm.to_terminal_id) {
    fareFormError.value = "To terminal is required.";
    return;
  }

  if (fareForm.from_terminal_id === fareForm.to_terminal_id) {
    fareFormError.value = "From and To terminals must be different.";
    return;
  }

  fareModalSaving.value = true;

  try {
    let result = null;

    if (fareModalMode.value === "edit") {
      result = await editFare(
        editingFareOrig.from_terminal_id,
        editingFareOrig.to_terminal_id,
        editingFareOrig.type,
        {
          from_terminal_id: fareForm.from_terminal_id,
          to_terminal_id: fareForm.to_terminal_id,
          type: fareForm.type,
          fares: { ...fareForm.fares },
        }
      );
    } else {
      result = await addFare({
        from_terminal_id: fareForm.from_terminal_id,
        to_terminal_id: fareForm.to_terminal_id,
        type: fareForm.type,
        fares: { ...fareForm.fares },
      });
    }

    if (!result) {
      fareFormError.value = "Failed to save route.";
      return;
    }

    showFareModal.value = false;
  } finally {
    fareModalSaving.value = false;
  }
}

/* Promo routes */
const routeOptionsForPromo = computed(() =>
  fareRows.value.map((r) => ({
    from_terminal_id: r.from_terminal_id,
    to_terminal_id: r.to_terminal_id,
    route_type: r.type,
    label: `${r.from_name} → ${r.to_name}`,
  }))
);

function isPromoRouteSelected(route) {
  return promoForm.selectedRoutes.some(
    (r) =>
      r.from_terminal_id === route.from_terminal_id &&
      r.to_terminal_id === route.to_terminal_id &&
      r.route_type === route.route_type
  );
}

function togglePromoRoute(route) {
  const idx = promoForm.selectedRoutes.findIndex(
    (r) =>
      r.from_terminal_id === route.from_terminal_id &&
      r.to_terminal_id === route.to_terminal_id &&
      r.route_type === route.route_type
  );

  if (idx >= 0) {
    promoForm.selectedRoutes.splice(idx, 1);
  } else {
    promoForm.selectedRoutes.push({ ...route });
  }
}

/* Promotions */
const promoSearch = ref("");
const promoFilter = ref("all");

const promoFilters = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "expired", label: "Expired" },
  { key: "upcoming", label: "Upcoming" },
];

const filteredPromos = computed(() => {
  const kw = promoSearch.value.toLowerCase();

  return promoRows.value.filter((p) => {
    const text = `${p.name || ""} ${p.description || ""}`.toLowerCase();

    if (kw && !text.includes(kw)) return false;
    if (promoFilter.value !== "all" && p.status !== promoFilter.value) return false;

    return true;
  });
});

function formatDate(value) {
  if (!value) return "";

  const dateOnly = String(value).slice(0, 10);
  const [year, month, day] = dateOnly.split("-");

  if (!year || !month || !day) return String(value);

  return `${Number(month)}/${Number(day)}/${year}`;
}

function toDateInput(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

/* Promo modal */
const showPromoModal = ref(false);
const editingPromoId = ref(null);
const promoError = ref("");
const promoModalSaving = ref(false);

function blankPromoForm() {
  return {
    name: "",
    description: "",
    type: "percent",
    value: 0,
    appliesTo: [],
    selectedRoutes: [],
    startDate: new Date().toISOString().slice(0, 10),
    endDate: "",
  };
}

const promoForm = reactive(blankPromoForm());

function resetPromoForm() {
  Object.assign(promoForm, blankPromoForm());
}

function openAddPromo() {
  editingPromoId.value = null;
  promoError.value = "";
  resetPromoForm();
  showPromoModal.value = true;
}

function openEditPromo(p) {
  editingPromoId.value = p.id;
  promoError.value = "";

  const selectedRoutes = routeOptionsForPromo.value.filter((r) =>
    (p.routes || []).some((label) => normalizeText(label) === normalizeText(r.label))
  );

  Object.assign(promoForm, {
    name: p.name,
    description: p.description || "",
    type: p.type,
    value: Number(p.value || 0),
    appliesTo: [...(p.appliesTo || [])],
    selectedRoutes,
    startDate: toDateInput(p.startDate),
    endDate: toDateInput(p.endDate),
  });

  showPromoModal.value = true;
}

async function savePromo() {
  promoError.value = "";

  if (!promoForm.name.trim()) {
    promoError.value = "Promotion name is required.";
    return;
  }

  if (Number(promoForm.value) <= 0) {
    promoError.value = "Discount value must be greater than 0.";
    return;
  }

  if (!promoForm.appliesTo.length) {
    promoError.value = "Select at least one passenger type.";
    return;
  }

  const payload = {
    name: promoForm.name,
    description: promoForm.description,
    type: promoForm.type,
    value: Number(promoForm.value),
    appliesTo: [...promoForm.appliesTo],
    routes: promoForm.selectedRoutes.map((r) => ({
      from_terminal_id: r.from_terminal_id,
      to_terminal_id: r.to_terminal_id,
      route_type: r.route_type,
    })),
    startDate: promoForm.startDate,
    endDate: promoForm.endDate || null,
  };

  promoModalSaving.value = true;

  try {
    const result = editingPromoId.value
      ? await editPromotion(editingPromoId.value, payload)
      : await addPromotion(payload);

    if (!result) {
      promoError.value = "Failed to save promotion.";
      return;
    }

    closePromoModal();
  } finally {
    promoModalSaving.value = false;
  }
}

function closePromoModal() {
  showPromoModal.value = false;
  editingPromoId.value = null;
  promoError.value = "";
}

/* Delete confirm */
const deleteConfirm = ref(null);

function confirmDeleteFare(row) {
  deleteConfirm.value = {
    title: "Delete route?",
    message: `Remove "${row.from_name} → ${row.to_name} (${row.type})" from the fare matrix?`,
    loading: false,
    action: async () => {
      await removeFare(row.from_terminal_id, row.to_terminal_id, row.type);
    },
  };
}

function confirmDeletePromo(p) {
  deleteConfirm.value = {
    title: "Delete promotion?",
    message: `Remove "${p.name}" permanently?`,
    loading: false,
    action: async () => {
      await removePromotion(p.id);
    },
  };
}

async function confirmDelete() {
  if (!deleteConfirm.value?.action) return;

  deleteConfirm.value.loading = true;
  await deleteConfirm.value.action();
  deleteConfirm.value = null;
}

/* Init */
onMounted(async () => {
  await Promise.all([loadTerminals(), loadFares(), fetchPromotions()]);
});
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap");

*,
*::before,
*::after {
  box-sizing: border-box;
}

.fm {
  --bg: #f8fafc;
  --card: #ffffff;
  --text: #0f172a;
  --muted: #64748b;
  --border: #e2e8f0;
  --soft: #f1f5f9;
  --primary: #0369a1;
  --primary-dark: #075985;
  --danger: #dc2626;
  --green: #16a34a;
  --amber: #d97706;
  --shadow: 0 8px 28px rgba(15, 23, 42, 0.08);

  min-height: 100vh;
  padding: 28px;
  background: var(--bg);
  color: var(--text);
  font-family: "Plus Jakarta Sans", system-ui, sans-serif;
}

button,
input,
select,
textarea {
  font: inherit;
}

button {
  cursor: pointer;
}

button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.fm-page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 22px;
}

.fm-breadcrumb {
  color: var(--muted);
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 6px;
}

.fm-breadcrumb span {
  margin: 0 5px;
}

.fm-page-title {
  margin: 0;
  font-size: 26px;
  line-height: 1.1;
  letter-spacing: -0.04em;
  font-weight: 800;
}

.fm-page-desc {
  margin: 6px 0 0;
  color: var(--muted);
  font-size: 13px;
}

.fm-last-updated {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--card);
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.fm-lu-dot,
.fm-saved-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--green);
}

.fm-tabs {
  display: flex;
  width: fit-content;
  gap: 4px;
  padding: 4px;
  margin-bottom: 20px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 14px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.fm-tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 15px;
  border: 0;
  border-radius: 11px;
  background: transparent;
  color: var(--muted);
  font-size: 13px;
  font-weight: 800;
}

.fm-tab--active {
  background: #0f172a;
  color: #fff;
}

.fm-tab-count {
  min-width: 20px;
  padding: 2px 7px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.18);
  font-size: 11px;
}

.fm-tab--active .fm-tab-count {
  background: rgba(255, 255, 255, 0.2);
}

.fm-panel {
  overflow: hidden;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 18px;
  box-shadow: var(--shadow);
}

.fm-toolbar,
.fm-mode-banner,
.fm-legend {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 18px;
  border-bottom: 1px solid var(--border);
}

.fm-toolbar {
  flex-wrap: wrap;
}

.fm-toolbar-left,
.fm-toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.fm-search-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 240px;
  height: 38px;
  padding: 0 12px;
  background: var(--soft);
  border: 1px solid var(--border);
  border-radius: 11px;
  color: var(--muted);
}

.fm-search {
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--text);
  font-size: 13px;
  font-weight: 600;
}

.fm-save-status {
  min-width: 120px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
}

.fm-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 36px;
  padding: 0 14px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: #fff;
  color: #334155;
  font-size: 12px;
  font-weight: 800;
  transition: 0.15s ease;
}

.fm-btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

.fm-btn--primary {
  border-color: var(--primary);
  background: var(--primary);
  color: #fff;
}

.fm-btn--primary:hover:not(:disabled) {
  background: var(--primary-dark);
}

.fm-btn--secondary {
  border-color: #bae6fd;
  background: #e0f2fe;
  color: #075985;
}

.fm-btn--ghost {
  background: #fff;
}

.fm-btn--danger {
  border-color: var(--danger);
  background: var(--danger);
  color: #fff;
}

.fm-mode-banner {
  background: #eff6ff;
}

.fm-mode-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #075985;
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.fm-mode-toggle {
  display: inline-flex;
  gap: 6px;
}

.fm-mode-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid #bae6fd;
  border-radius: 10px;
  background: #fff;
  color: #075985;
  font-size: 12px;
  font-weight: 800;
}

.fm-mode-btn--active {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
}

.fm-loading,
.fm-form-error {
  margin: 18px;
  padding: 18px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 700;
}

.fm-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--muted);
  background: var(--soft);
}

.fm-form-error {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: #991b1b;
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.fm-spinner {
  width: 15px;
  height: 15px;
  border-radius: 50%;
  border: 2px solid currentColor;
  border-top-color: transparent;
  animation: fm-spin 0.8s linear infinite;
}

@keyframes fm-spin {
  to {
    transform: rotate(360deg);
  }
}

/* Upload */
.fm-upload-area {
  padding: 24px;
}

.fm-dropzone {
  min-height: 220px;
  border: 2px dashed #60a5fa;
  border-radius: 18px;
  background: #f8fbff;
  display: grid;
  place-items: center;
  text-align: center;
  overflow: hidden;
  position: relative;
  transition: 0.15s ease;
}

.fm-dropzone--over {
  background: #eff6ff;
  border-color: #2563eb;
}

.fm-dropzone-icon {
  width: 58px;
  height: 58px;
  display: grid;
  place-items: center;
  margin: 0 auto 12px;
  border-radius: 16px;
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 26px;
}

.fm-dropzone-title {
  color: var(--text);
  font-size: 15px;
  font-weight: 900;
}

.fm-dropzone-sub {
  margin-top: 4px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 600;
}

.fm-uploaded-preview {
  width: 100%;
  position: relative;
}

.fm-preview-img {
  display: block;
  width: 100%;
  max-height: 520px;
  object-fit: contain;
  background: #f8fafc;
}

.fm-preview-overlay {
  position: absolute;
  inset: auto 14px 14px auto;
  display: flex;
  gap: 8px;
}

.fm-preview-change,
.fm-preview-remove {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 34px;
  padding: 0 12px;
  border: 0;
  border-radius: 10px;
  color: #fff;
  font-size: 12px;
  font-weight: 900;
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.22);
}

.fm-preview-change {
  background: var(--primary);
}

.fm-preview-remove {
  background: var(--danger);
}

.fm-upload-progress {
  margin-top: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 800;
}

.fm-progress-track {
  flex: 1;
  height: 8px;
  border-radius: 999px;
  background: #e2e8f0;
  overflow: hidden;
}

.fm-progress-bar {
  height: 100%;
  border-radius: inherit;
  background: var(--primary);
}

.fm-image-debug {
  margin-top: 12px;
  padding: 10px 12px;
  border: 1px solid #e0f2fe;
  border-radius: 10px;
  background: #f0f9ff;
  color: #0369a1;
  font-size: 11px;
  font-weight: 800;
  word-break: break-all;
}

.fm-image-debug span {
  color: #0f172a;
}

.fm-upload-note {
  margin-top: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid #fde68a;
  background: #fffbeb;
  color: #92400e;
  font-size: 12px;
  font-weight: 700;
}

/* Table */
.fm-table-wrap {
  overflow-x: auto;
}

.fm-table {
  width: 100%;
  border-collapse: collapse;
}

.fm-table th {
  padding: 13px 14px;
  background: #f8fafc;
  color: #475569;
  border-bottom: 1px solid var(--border);
  text-align: left;
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.fm-table td {
  padding: 14px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: top;
}

.fm-th-dot,
.fm-legend-dot {
  width: 8px;
  height: 8px;
  display: inline-block;
  border-radius: 999px;
  margin-right: 6px;
}

.fm-row:hover {
  background: #fafafa;
}

.fm-route-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 900;
}

.fm-route-label i {
  color: var(--muted);
  font-size: 11px;
}

.fm-route-badges {
  margin-top: 7px;
}

.fm-route-type-badge {
  display: inline-flex;
  padding: 3px 8px;
  border-radius: 999px;
  background: #e0f2fe;
  color: #075985;
  font-size: 10px;
  font-weight: 900;
}

.fm-fare-input-wrap {
  display: flex;
  align-items: center;
  width: 110px;
  height: 34px;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: #fff;
}

.fm-peso {
  padding: 0 9px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 900;
}

.fm-fare-input {
  min-width: 0;
  flex: 1;
  height: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--text);
  font-size: 13px;
  font-weight: 800;
}

.fm-discount-preview {
  margin-top: 7px;
  display: flex;
  gap: 5px;
  align-items: center;
  flex-wrap: wrap;
}

.fm-old-fare {
  color: #94a3b8;
  text-decoration: line-through;
  font-size: 11px;
  font-weight: 800;
}

.fm-new-fare {
  color: var(--green);
  font-size: 11px;
  font-weight: 900;
}

.fm-promo-tag {
  padding: 2px 6px;
  border-radius: 999px;
  background: #dcfce7;
  color: #166534;
  font-size: 9px;
  font-weight: 900;
}

.fm-td-actions {
  white-space: nowrap;
  text-align: right;
}

.fm-action-btn {
  width: 30px;
  height: 30px;
  display: inline-grid;
  place-items: center;
  margin-left: 5px;
  border: 1px solid var(--border);
  border-radius: 9px;
  background: #fff;
  color: #475569;
}

.fm-action-btn--edit:hover {
  color: #075985;
  background: #e0f2fe;
}

.fm-action-btn--del:hover {
  color: #991b1b;
  background: #fee2e2;
}

.fm-empty-cell {
  padding: 50px !important;
}

.fm-table-empty,
.fm-promos-empty {
  text-align: center;
  color: var(--muted);
}

.fm-table-empty i,
.fm-promos-empty i {
  font-size: 34px;
  margin-bottom: 10px;
  opacity: 0.5;
}

.fm-table-empty p,
.fm-promos-empty p {
  margin: 0;
  color: var(--text);
  font-weight: 900;
}

.fm-table-empty small,
.fm-promos-empty small {
  display: block;
  margin-top: 4px;
  font-size: 12px;
}

.fm-legend {
  justify-content: flex-start;
  flex-wrap: wrap;
  background: #fafafa;
}

.fm-legend-title {
  color: #475569;
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
}

.fm-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: #475569;
  font-size: 12px;
  font-weight: 700;
}

.fm-legend-item em {
  color: #94a3b8;
  font-style: italic;
  font-weight: 600;
}

/* Promotions */
.fm-filter-pills {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.fm-filter-pill {
  padding: 7px 11px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: #fff;
  color: var(--muted);
  font-size: 12px;
  font-weight: 800;
}

.fm-filter-pill--active {
  background: #0f172a;
  color: #fff;
  border-color: #0f172a;
}

.fm-promos-empty {
  padding: 60px 18px;
}

.fm-promos-empty .fm-btn {
  margin-top: 16px;
}

.fm-promos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  padding: 18px;
}

.fm-promo-card {
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.fm-promo-card-header {
  padding: 16px;
  background: linear-gradient(135deg, #f8fafc, #eff6ff);
  border-bottom: 1px solid var(--border);
}

.fm-promo-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.fm-promo-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 900;
}

.fm-promo-status span {
  width: 7px;
  height: 7px;
  border-radius: 999px;
}

.fm-promo-status--active {
  background: #dcfce7;
  color: #166534;
}

.fm-promo-status--active span {
  background: #16a34a;
}

.fm-promo-status--expired {
  background: #fee2e2;
  color: #991b1b;
}

.fm-promo-status--expired span {
  background: #dc2626;
}

.fm-promo-status--upcoming {
  background: #fef3c7;
  color: #92400e;
}

.fm-promo-status--upcoming span {
  background: #d97706;
}

.fm-promo-actions {
  display: flex;
}

.fm-promo-discount {
  margin-top: 16px;
  color: #0f172a;
  font-size: 34px;
  line-height: 1;
  font-weight: 900;
  letter-spacing: -0.04em;
}

.fm-promo-discount span {
  color: var(--muted);
  font-size: 12px;
  letter-spacing: 0;
}

.fm-promo-card h3 {
  margin: 10px 0 4px;
  font-size: 15px;
  font-weight: 900;
}

.fm-promo-card p {
  margin: 0;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.5;
}

.fm-promo-card-body {
  padding: 14px 16px;
}

.fm-promo-meta-row {
  display: grid;
  grid-template-columns: 90px 1fr;
  gap: 10px;
  padding: 9px 0;
  border-bottom: 1px solid #f1f5f9;
  font-size: 12px;
}

.fm-promo-meta-row:last-child {
  border-bottom: 0;
}

.fm-promo-meta-row > span {
  color: var(--muted);
  font-weight: 900;
}

.fm-promo-meta-row small {
  color: #334155;
  font-weight: 700;
  line-height: 1.45;
}

.fm-promo-pills {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.fm-promo-pills b {
  padding: 3px 7px;
  border-radius: 999px;
  background: #f1f5f9;
  color: #334155;
  font-size: 10px;
}

/* Modal */
.fm-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(15, 23, 42, 0.58);
  backdrop-filter: blur(6px);
}

.fm-modal {
  width: min(680px, 100%);
  max-height: 90vh;
  overflow: auto;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 24px 80px rgba(15, 23, 42, 0.35);
}

.fm-modal--wide {
  width: min(840px, 100%);
}

.fm-modal-head {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  padding: 18px 20px;
  border-bottom: 1px solid var(--border);
}

.fm-modal-head h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 900;
}

.fm-modal-head p {
  margin: 4px 0 0;
  color: var(--muted);
  font-size: 12px;
  font-weight: 600;
}

.fm-modal-close {
  width: 34px;
  height: 34px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: #fff;
}

.fm-modal-body {
  padding: 18px 20px;
}

.fm-form-section {
  margin-bottom: 18px;
}

.fm-form-section h3 {
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.fm-form-section h3 em,
.fm-field em {
  color: var(--muted);
  font-style: normal;
  font-weight: 700;
  text-transform: none;
}

.fm-form-section h3 b,
.fm-field b {
  color: var(--danger);
}

.fm-form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.fm-field {
  display: grid;
  gap: 7px;
}

.fm-field--full {
  grid-column: 1 / -1;
}

.fm-field > span {
  color: #334155;
  font-size: 12px;
  font-weight: 900;
}

.fm-input,
.fm-textarea {
  width: 100%;
  border: 1px solid var(--border);
  outline: 0;
  border-radius: 11px;
  background: #fff;
  color: var(--text);
  font-size: 13px;
  font-weight: 700;
}

.fm-input {
  height: 39px;
  padding: 0 12px;
}

.fm-textarea {
  padding: 10px 12px;
  resize: vertical;
}

.fm-input:focus,
.fm-textarea:focus {
  border-color: #38bdf8;
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.15);
}

.fm-radio-row,
.fm-check-row {
  display: flex;
  gap: 7px;
  flex-wrap: wrap;
}

.fm-radio-chip,
.fm-check-chip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: #fff;
  color: #475569;
  font-size: 12px;
  font-weight: 900;
}

.fm-radio-chip input,
.fm-check-chip input {
  display: none;
}

.fm-radio-chip--active,
.fm-check-chip--active {
  background: #0f172a;
  border-color: #0f172a;
  color: #fff;
}

.fm-check-chip span {
  width: 8px;
  height: 8px;
  border-radius: 999px;
}

.fm-check-chip small {
  opacity: 0.7;
}

.fm-fares-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.fm-fare-field {
  display: grid;
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: #f8fafc;
}

.fm-fare-field > span {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  font-weight: 900;
}

.fm-fare-field > span i {
  width: 8px;
  height: 8px;
  border-radius: 999px;
}

.fm-fare-field small {
  color: var(--green);
  font-size: 11px;
  font-weight: 900;
}

.fm-fare-input-wrap--lg {
  width: 100%;
}

.fm-modal-foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 14px 20px;
  border-top: 1px solid var(--border);
  background: #f8fafc;
}

.fm-confirm-modal {
  width: min(390px, 100%);
  padding: 28px 22px 20px;
  border-radius: 18px;
  background: #fff;
  text-align: center;
  box-shadow: 0 24px 80px rgba(15, 23, 42, 0.35);
}

.fm-confirm-icon {
  width: 54px;
  height: 54px;
  display: grid;
  place-items: center;
  margin: 0 auto 12px;
  border-radius: 50%;
  background: #fee2e2;
  color: var(--danger);
  font-size: 24px;
}

.fm-confirm-modal h2 {
  margin: 0;
  font-size: 17px;
  font-weight: 900;
}

.fm-confirm-modal p {
  margin: 8px 0 20px;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.5;
}

.fm-confirm-actions {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.fm-modal-enter-active,
.fm-modal-leave-active {
  transition: 0.18s ease;
}

.fm-modal-enter-from,
.fm-modal-leave-to {
  opacity: 0;
}

.fm-modal-enter-from .fm-modal,
.fm-modal-enter-from .fm-confirm-modal,
.fm-modal-leave-to .fm-modal,
.fm-modal-leave-to .fm-confirm-modal {
  transform: translateY(8px) scale(0.98);
}

@media (max-width: 760px) {
  .fm {
    padding: 16px;
  }

  .fm-page-header,
  .fm-toolbar,
  .fm-mode-banner {
    align-items: stretch;
    flex-direction: column;
  }

  .fm-toolbar-left,
  .fm-toolbar-right,
  .fm-mode-toggle {
    width: 100%;
  }

  .fm-search-wrap {
    width: 100%;
    min-width: 0;
  }

  .fm-btn,
  .fm-mode-btn {
    flex: 1;
  }

  .fm-form-grid,
  .fm-fares-grid,
  .fm-promos-grid {
    grid-template-columns: 1fr;
  }

  .fm-preview-overlay {
    inset: auto 10px 10px 10px;
    justify-content: center;
  }

  .fm-legend {
    align-items: flex-start;
  }
}
</style>