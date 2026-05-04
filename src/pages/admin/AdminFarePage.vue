<template>
  <div class="fm">

    <!-- ── Page Header ── -->
    <div class="fm-page-header">
      <div class="fm-page-header-left">
        <div class="fm-breadcrumb">Admin Panel <span class="fm-breadcrumb-sep">›</span> Fare Management</div>
        <h1 class="fm-page-title">Fare Management</h1>
        <p class="fm-page-desc">Configure route fares, passenger discounts, and promotional campaigns.</p>
      </div>
      <div class="fm-page-header-right">
        <div class="fm-last-updated">
          <span class="fm-lu-dot"></span>
          Last synced just now
        </div>
      </div>
    </div>

    <!-- ── Tabs ── -->
    <div class="fm-tabs">
      <button
        v-for="t in tabList" :key="t.key"
        :class="['fm-tab', { 'fm-tab--active': tab === t.key }]"
        @click="tab = t.key"
      >
        <span class="fm-tab-icon" v-html="t.icon"></span>
        {{ t.label }}
        <span v-if="t.count != null" class="fm-tab-count">{{ t.count }}</span>
      </button>
    </div>

    <!-- ══════════════════ FARE MATRIX TAB ══════════════════ -->
    <div v-if="tab === 'fares'" class="fm-panel">

      <!-- Toolbar -->
      <div class="fm-toolbar">
        <div class="fm-toolbar-left">
          <div class="fm-search-wrap">
            <svg class="fm-search-icon" width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8.5" cy="8.5" r="5.5"/><path d="M15 15l-3-3"/></svg>
            <input v-model="fareSearch" class="fm-search" placeholder="Search routes…" @input="onFareSearch" />
          </div>
          <div class="fm-save-status">
            <template v-if="faresSaving">
              <svg class="fm-spin" width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M10 3a7 7 0 110 14A7 7 0 0110 3z" stroke-dasharray="30" stroke-dashoffset="10"/></svg>
              <span>Saving…</span>
            </template>
            <template v-else-if="faresSaved">
              <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="#16a34a" stroke-width="2.4"><path d="M4 10l4.5 4.5L16 7"/></svg>
              <span style="color:#16a34a">All changes saved</span>
            </template>
          </div>
        </div>
        <div class="fm-toolbar-right">
          <button class="fm-btn fm-btn--ghost" @click="loadFares">
            <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4v5h5M16 10a6 6 0 11-1.8-4.2L16 9"/></svg>
            Refresh
          </button>
          <button class="fm-btn fm-btn--secondary" @click="saveFares" :disabled="faresSaving || !faresDirty">
            <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 3h10l2 2v12a1 1 0 01-1 1H4a1 1 0 01-1-1V5l2-2zM13 3v5H7V3M12 17v-5H8v5"/></svg>
            Save changes
          </button>
          <button class="fm-btn fm-btn--primary" @click="openFareModal('add')">
            <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M10 4v12M4 10h12"/></svg>
            Add route
          </button>
        </div>
      </div>

      <!-- Upload / Manual toggle banner -->
      <div class="fm-mode-banner">
        <div class="fm-mode-label">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="14" height="14" rx="2"/><path d="M7 10h6M7 13h4M7 7h6"/></svg>
          Fare Entry Mode
        </div>
        <div class="fm-mode-toggle">
          <button :class="['fm-mode-btn', fareMode === 'manual' ? 'fm-mode-btn--active' : '']" @click="fareMode = 'manual'">
            <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h14M3 10h10M3 14h7"/></svg>
            Manual Entry
          </button>
          <button :class="['fm-mode-btn', fareMode === 'upload' ? 'fm-mode-btn--active' : '']" @click="switchToUploadMode">
            <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 14v2a1 1 0 001 1h10a1 1 0 001-1v-2M10 4v9M7 7l3-3 3 3"/></svg>
            Upload Image
          </button>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="faresLoading" class="fm-loading">
        <svg class="fm-spin" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 3a7 7 0 110 14A7 7 0 0110 3z" stroke-dasharray="30" stroke-dashoffset="10"/></svg>
        Loading fares…
      </div>

      <!-- Error state -->
      <div v-else-if="faresError" class="fm-form-error" style="margin:16px 20px">
        <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="10" cy="10" r="8"/><path d="M10 7v4M10 14v.5"/></svg>
        {{ faresError }}
      </div>

      <template v-else>
        <!-- ── Image Upload Mode ── -->
        <div v-if="fareMode === 'upload'" class="fm-upload-area">

          <!-- Loading spinner while fetching existing image -->
          <div v-if="globalImageLoading" class="fm-loading" style="min-height:120px">
            <svg class="fm-spin" width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 3a7 7 0 110 14A7 7 0 0110 3z" stroke-dasharray="30" stroke-dashoffset="10"/></svg>
            Loading image…
          </div>

          <template v-else>
            <div
              class="fm-dropzone"
              :class="{ 'fm-dropzone--over': isDragging }"
              @dragover.prevent="isDragging = true"
              @dragleave="isDragging = false"
              @drop.prevent="handleDrop"
              @click="$refs.fileInput.click()"
            >
              <input ref="fileInput" type="file" accept="image/*" style="display:none" @change="handleFileSelect" />

              <template v-if="!uploadedImageUrl">
                <div class="fm-dropzone-icon">
                  <svg width="32" height="32" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="2" y="4" width="16" height="12" rx="2"/><path d="M6 9l2.5 3L11 10l3 4"/><circle cx="7" cy="7.5" r="1"/></svg>
                </div>
                <div class="fm-dropzone-title">Drop fare matrix image here</div>
                <div class="fm-dropzone-sub">or click to browse — PNG, JPG supported</div>
              </template>

              <template v-else>
                <div class="fm-uploaded-preview">
                  <img :src="uploadedImageUrl" alt="Fare matrix" class="fm-preview-img" />
                  <div class="fm-preview-overlay">
                    <button class="fm-preview-change" @click.stop="$refs.fileInput.click()">
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 14v2a1 1 0 001 1h10a1 1 0 001-1v-2M10 4v9M7 7l3-3 3 3"/></svg>
                      Change image
                    </button>
                    <button class="fm-preview-remove" @click.stop="removeGlobalImage">
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h12M8 6V4h4v2M7 6l1 10h4l1-10"/></svg>
                      Remove
                    </button>
                  </div>
                </div>
              </template>
            </div>

            <div v-if="globalImageUploading" class="fm-upload-progress">
              <div class="fm-progress-bar" :style="{ width: globalUploadProgress + '%' }"></div>
              <span>Uploading… {{ globalUploadProgress }}%</span>
            </div>

            <div class="fm-upload-note">
              <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="10" cy="10" r="8"/><path d="M10 9v5M10 7v.5"/></svg>
              This image will be shown as the fare matrix for all routes across the entire system.
            </div>
          </template>
        </div>

        <!-- ── Manual Table Mode ── -->
        <div v-else class="fm-table-wrap">
          <table class="fm-table">
            <thead>
              <tr>
                <th class="fm-th-route">Route</th>
                <th v-for="pt in passengerTypes" :key="pt.key" class="fm-th-fare">
                  <div class="fm-th-inner">
                    <span class="fm-th-dot" :style="{ background: pt.color }"></span>
                    {{ pt.label }}
                  </div>
                </th>
                <th class="fm-th-actions"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredFares.length === 0">
                <td :colspan="passengerTypes.length + 2" class="fm-empty-cell">
                  <div class="fm-table-empty">
                    <svg width="28" height="28" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M3 3h14l-1.5 9H4.5L3 3z"/><circle cx="8" cy="17" r="1"/><circle cx="13" cy="17" r="1"/></svg>
                    <p>No routes found</p>
                    <small>Try a different search or add a new route</small>
                  </div>
                </td>
              </tr>
              <tr v-for="row in filteredFares" :key="`${row.from_terminal_id}|${row.to_terminal_id}|${row.type}`" class="fm-row">
                <td class="fm-td-route">
                  <div class="fm-route-wrap">
                    <div class="fm-route-label">
                      <span class="fm-route-from">{{ row.from_name }}</span>
                      <svg class="fm-route-arrow" width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 10h12M12 6l4 4-4 4"/></svg>
                      <span class="fm-route-to">{{ row.to_name }}</span>
                    </div>
                    <div class="fm-route-badges">
                      <span class="fm-route-type-badge">{{ row.type }}</span>
                    </div>
                  </div>
                </td>
          <td v-for="pt in passengerTypes" :key="pt.key" class="fm-td-fare">
  <div class="fm-fare-input-wrap">
    <span class="fm-peso">₱</span>
    <input
      class="fm-fare-input"
      type="number"
      min="0"
      step="0.5"
      v-model.number="row.fares[pt.key]"
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
                  <div class="fm-row-actions">
                    <button class="fm-action-btn fm-action-btn--edit" @click="openFareModal('edit', row)" title="Edit">
                      <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M13 3l4 4L6 18H2v-4L13 3z"/></svg>
                    </button>
                    <button class="fm-action-btn fm-action-btn--del" @click="confirmDeleteFare(row)" title="Delete">
                      <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 6h12M8 6V4h4v2M7 6l1 10h4l1-10"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <!-- Passenger Type Legend -->
      <div class="fm-legend">
        <span class="fm-legend-title">Passenger types:</span>
        <div v-for="pt in passengerTypes" :key="pt.key" class="fm-legend-item">
          <span class="fm-legend-dot" :style="{ background: pt.color }"></span>
          {{ pt.label }}
          <span class="fm-legend-note">{{ pt.note }}</span>
        </div>
      </div>
    </div>

    <!-- ══════════════════ PROMOTIONS TAB ══════════════════ -->
    <div v-if="tab === 'promos'" class="fm-panel">

      <div class="fm-toolbar">
        <div class="fm-toolbar-left">
          <div class="fm-search-wrap">
            <svg class="fm-search-icon" width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8.5" cy="8.5" r="5.5"/><path d="M15 15l-3-3"/></svg>
            <input v-model="promoSearch" class="fm-search" placeholder="Search promotions…" />
          </div>
          <div class="fm-filter-pills">
            <button
              v-for="f in promoFilters" :key="f.key"
              :class="['fm-filter-pill', { 'fm-filter-pill--active': promoFilter === f.key }]"
              @click="promoFilter = f.key"
            >{{ f.label }}</button>
          </div>
        </div>
        <div class="fm-toolbar-right">
          <button class="fm-btn fm-btn--primary" @click="openAddPromo">
            <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M10 4v12M4 10h12"/></svg>
            New promotion
          </button>
        </div>
      </div>

      <div v-if="promosLoading" class="fm-loading">
        <svg class="fm-spin" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 3a7 7 0 110 14A7 7 0 0110 3z" stroke-dasharray="30" stroke-dashoffset="10"/></svg>
        Loading promotions…
      </div>

      <div v-else-if="promosError" class="fm-form-error" style="margin:16px 20px">
        <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="10" cy="10" r="8"/><path d="M10 7v4M10 14v.5"/></svg>
        {{ promosError }}
      </div>

      <template v-else>
        <div v-if="filteredPromos.length === 0" class="fm-promos-empty">
          <div class="fm-promos-empty-icon">
            <svg width="36" height="36" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M3 10l7-7 7 7M5 8v8a1 1 0 001 1h3v-4h2v4h3a1 1 0 001-1V8"/></svg>
          </div>
          <p>No promotions yet</p>
          <small>Create your first promotion to offer discounts to commuters.</small>
          <button class="fm-btn fm-btn--primary" style="margin-top:16px" @click="openAddPromo">+ New promotion</button>
        </div>

        <div v-else class="fm-promos-grid">
          <div v-for="p in filteredPromos" :key="p.id" class="fm-promo-card">
            <div class="fm-promo-card-header">
              <div class="fm-promo-card-top">
                <span :class="['fm-promo-status',
                  p.status === 'active'   ? 'fm-promo-status--active'   :
                  p.status === 'expired'  ? 'fm-promo-status--expired'  :
                                            'fm-promo-status--upcoming']">
                  <span class="fm-promo-status-dot"></span>
                  {{ p.status === 'active' ? 'Active' : p.status === 'expired' ? 'Expired' : 'Upcoming' }}
                </span>
                <div class="fm-promo-actions">
                  <button class="fm-action-btn fm-action-btn--edit" @click="openEditPromo(p)" title="Edit">
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M13 3l4 4L6 18H2v-4L13 3z"/></svg>
                  </button>
                  <button class="fm-action-btn fm-action-btn--del" @click="confirmDeletePromo(p)" title="Delete">
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 6h12M8 6V4h4v2M7 6l1 10h4l1-10"/></svg>
                  </button>
                </div>
              </div>
              <div class="fm-promo-discount">
                {{ p.type === 'percent' ? p.value + '%' : '₱' + p.value.toFixed(2) }}
                <span class="fm-promo-discount-label">OFF</span>
              </div>
              <div class="fm-promo-name">{{ p.name }}</div>
              <div class="fm-promo-desc">{{ p.description }}</div>
            </div>
            <div class="fm-promo-card-body">
              <div class="fm-promo-meta-row">
                <span class="fm-promo-meta-label">Applies to</span>
                <div class="fm-promo-pills">
                  <span v-for="a in p.appliesTo" :key="a" class="fm-promo-pill">{{ a }}</span>
                </div>
              </div>
              <div class="fm-promo-meta-row">
                <span class="fm-promo-meta-label">Routes</span>
                <span v-if="p.routes && p.routes.length" class="fm-promo-routes">{{ p.routes.join(', ') }}</span>
                <span v-else class="fm-promo-routes fm-muted">All routes</span>
              </div>
              <div class="fm-promo-meta-row">
                <span class="fm-promo-meta-label">Validity</span>
                <span class="fm-promo-validity">
                  {{ formatDate(p.startDate) }}
                  <template v-if="p.endDate"> – {{ formatDate(p.endDate) }}</template>
                  <template v-else> · Ongoing</template>
                </span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- ══════════════════ ADD/EDIT FARE MODAL ══════════════════ -->
    <Transition name="fm-modal">
      <div v-if="showFareModal" class="fm-overlay" @click.self="showFareModal = false">
        <div class="fm-modal">
          <div class="fm-modal-head">
            <div class="fm-modal-head-left">
              <div class="fm-modal-icon">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 3h14l-1.5 9H4.5L3 3z"/><circle cx="8" cy="17" r="1"/><circle cx="13" cy="17" r="1"/></svg>
              </div>
              <div>
                <div class="fm-modal-title">{{ fareModalMode === 'edit' ? 'Edit route fare' : 'Add new route' }}</div>
                <div class="fm-modal-sub">Configure pricing per passenger type</div>
              </div>
            </div>
            <button class="fm-modal-close" @click="showFareModal = false">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 5l10 10M15 5L5 15"/></svg>
            </button>
          </div>
          <div class="fm-modal-body">
            <div class="fm-form-section">
              <div class="fm-form-section-title">Route details</div>
              <div class="fm-form-grid">
                <div class="fm-field">
                  <label class="fm-label">From terminal <span class="fm-req">*</span></label>
                  <select class="fm-input" v-model.number="fareForm.from_terminal_id">
                    <option value="" disabled>Select terminal…</option>
                    <option v-for="t in terminals" :key="t.terminal_id" :value="t.terminal_id">{{ t.name }}</option>
                  </select>
                </div>
                <div class="fm-field">
                  <label class="fm-label">To terminal <span class="fm-req">*</span></label>
                  <select class="fm-input" v-model.number="fareForm.to_terminal_id">
                    <option value="" disabled>Select terminal…</option>
                    <option v-for="t in terminals" :key="t.terminal_id" :value="t.terminal_id">{{ t.name }}</option>
                  </select>
                </div>
                <div class="fm-field fm-field--full">
                  <label class="fm-label">Route type</label>
                  <div class="fm-radio-row">
                    <label v-for="rt in routeTypes" :key="rt" :class="['fm-radio-chip', fareForm.type === rt ? 'fm-radio-chip--active' : '']">
                      <input type="radio" :value="rt" v-model="fareForm.type" />
                      {{ rt }}
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div class="fm-form-section">
              <div class="fm-form-section-title">Fares per passenger type</div>
              <div class="fm-fares-grid">
                <div v-for="pt in passengerTypes" :key="pt.key" class="fm-fare-field">
                  <div class="fm-fare-field-header">
                    <span class="fm-fare-dot" :style="{ background: pt.color }"></span>
                    <label class="fm-label">{{ pt.label }}</label>
                  </div>
                  <div class="fm-fare-input-wrap fm-fare-input-wrap--lg">
                    <span class="fm-peso">₱</span>
                    <input class="fm-fare-input" type="number" min="0" step="0.5" v-model.number="fareForm.fares[pt.key]" />
                  </div>
                  <div v-if="pt.key !== 'regular' && fareForm.fares.regular" class="fm-fare-hint">
                    {{ Math.round((1 - fareForm.fares[pt.key] / fareForm.fares.regular) * 100) }}% off regular
                  </div>
                </div>
              </div>
            </div>
            <div v-if="fareFormError" class="fm-form-error">
              <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="10" cy="10" r="8"/><path d="M10 7v4M10 14v.5"/></svg>
              {{ fareFormError }}
            </div>
          </div>
          <div class="fm-modal-foot">
            <button class="fm-btn fm-btn--ghost" @click="showFareModal = false">Cancel</button>
            <button class="fm-btn fm-btn--primary" @click="saveFareModal" :disabled="fareModalSaving">
              <svg v-if="fareModalSaving" class="fm-spin" width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 3a7 7 0 110 14A7 7 0 0110 3z" stroke-dasharray="30" stroke-dashoffset="10"/></svg>
              {{ fareModalMode === 'edit' ? 'Save changes' : 'Add route' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ══════════════════ ADD/EDIT PROMO MODAL ══════════════════ -->
    <Transition name="fm-modal">
      <div v-if="showPromoModal" class="fm-overlay" @click.self="closePromoModal">
        <div class="fm-modal fm-modal--wide">
          <div class="fm-modal-head">
            <div class="fm-modal-head-left">
              <div class="fm-modal-icon fm-modal-icon--green">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 3H5a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V8M9 3l6 5M9 3v5h6"/></svg>
              </div>
              <div>
                <div class="fm-modal-title">{{ editingPromoId ? 'Edit promotion' : 'New promotion' }}</div>
                <div class="fm-modal-sub">Create discount campaigns for commuters</div>
              </div>
            </div>
            <button class="fm-modal-close" @click="closePromoModal">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 5l10 10M15 5L5 15"/></svg>
            </button>
          </div>
          <div class="fm-modal-body">
            <div class="fm-form-section">
              <div class="fm-form-section-title">Promotion details</div>
              <div class="fm-form-grid">
                <div class="fm-field fm-field--full">
                  <label class="fm-label">Promotion name <span class="fm-req">*</span></label>
                  <input class="fm-input" v-model="promoForm.name" placeholder="e.g. Senior Citizen Day" />
                </div>
                <div class="fm-field fm-field--full">
                  <label class="fm-label">Description</label>
                  <textarea class="fm-textarea" v-model="promoForm.description" placeholder="Brief description for commuters…" rows="2"></textarea>
                </div>
              </div>
            </div>
            <div class="fm-form-section">
              <div class="fm-form-section-title">Discount configuration</div>
              <div class="fm-form-grid">
                <div class="fm-field">
                  <label class="fm-label">Discount type</label>
                  <div class="fm-radio-row">
                    <label :class="['fm-radio-chip', promoForm.type === 'percent' ? 'fm-radio-chip--active' : '']">
                      <input type="radio" value="percent" v-model="promoForm.type" />
                      Percentage (%)
                    </label>
                    <label :class="['fm-radio-chip', promoForm.type === 'flat' ? 'fm-radio-chip--active' : '']">
                      <input type="radio" value="flat" v-model="promoForm.type" />
                      Flat amount (₱)
                    </label>
                  </div>
                </div>
                <div class="fm-field">
                  <label class="fm-label">{{ promoForm.type === 'percent' ? 'Discount %' : 'Amount ₱' }} <span class="fm-req">*</span></label>
                  <div class="fm-fare-input-wrap fm-fare-input-wrap--lg">
                    <span class="fm-peso">{{ promoForm.type === 'percent' ? '%' : '₱' }}</span>
                    <input class="fm-fare-input" type="number" min="0" v-model.number="promoForm.value" />
                  </div>
                </div>
                <div class="fm-field">
                  <label class="fm-label">Start date</label>
                  <input class="fm-input" type="date" v-model="promoForm.startDate" />
                </div>
                <div class="fm-field">
                  <label class="fm-label">End date <em class="fm-opt">(optional)</em></label>
                  <input class="fm-input" type="date" v-model="promoForm.endDate" />
                </div>
              </div>
            </div>
            <div class="fm-form-section">
              <div class="fm-form-section-title">Applies to <span class="fm-req">*</span></div>
              <div class="fm-check-row">
                <label
                  v-for="pt in passengerTypes" :key="pt.key"
                  :class="['fm-check-chip', promoForm.appliesTo.includes(pt.label) ? 'fm-check-chip--active' : '']"
                >
                  <input type="checkbox" :value="pt.label" v-model="promoForm.appliesTo" />
                  <span class="fm-check-dot" :style="{ background: pt.color }"></span>
                  {{ pt.label }}
                </label>
              </div>
            </div>
            <div class="fm-form-section">
              <div class="fm-form-section-title">Applicable routes <em class="fm-opt">(leave empty for all routes)</em></div>
              <div class="fm-check-row">
                <label
                  v-for="route in routeOptionsForPromo" :key="route.label"
                  :class="['fm-check-chip', promoForm.selectedRoutes.some(r => r.from_terminal_id === route.from_terminal_id && r.to_terminal_id === route.to_terminal_id) ? 'fm-check-chip--active' : '']"
                  @click.prevent="togglePromoRoute(route)"
                >
                  {{ route.label }}
                </label>
              </div>
            </div>
            <div v-if="promoError" class="fm-form-error">
              <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="10" cy="10" r="8"/><path d="M10 7v4M10 14v.5"/></svg>
              {{ promoError }}
            </div>
          </div>
          <div class="fm-modal-foot">
            <button class="fm-btn fm-btn--ghost" @click="closePromoModal">Cancel</button>
            <button class="fm-btn fm-btn--primary" @click="savePromo" :disabled="promoModalSaving">
              <svg v-if="promoModalSaving" class="fm-spin" width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 3a7 7 0 110 14A7 7 0 0110 3z" stroke-dasharray="30" stroke-dashoffset="10"/></svg>
              {{ editingPromoId ? 'Save changes' : 'Create promotion' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ══════════════════ DELETE CONFIRM ══════════════════ -->
    <Transition name="fm-modal">
      <div v-if="deleteConfirm" class="fm-overlay" @click.self="deleteConfirm = null">
        <div class="fm-confirm-modal">
          <div class="fm-confirm-icon">
            <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="#dc2626" stroke-width="1.6"><circle cx="10" cy="10" r="8"/><path d="M10 7v4M10 14v.5"/></svg>
          </div>
          <div class="fm-confirm-title">{{ deleteConfirm.title }}</div>
          <div class="fm-confirm-msg">{{ deleteConfirm.message }}</div>
          <div class="fm-confirm-actions">
            <button class="fm-btn fm-btn--ghost" @click="deleteConfirm = null">Cancel</button>
            <button class="fm-btn fm-btn--danger" @click="confirmDelete" :disabled="deleteConfirm.loading">
              <svg v-if="deleteConfirm.loading" class="fm-spin" width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 3a7 7 0 110 14A7 7 0 0110 3z" stroke-dasharray="30" stroke-dashoffset="10"/></svg>
              Delete
            </button>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useFares }      from '../../composables/useFares'
import { usePromotions } from '../../composables/useFares'
import api               from '../../services/api/http'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// ── Composables ──────────────────────────────────────────────
const {
  rows: fareRows,
  loading: faresLoading,
  error: faresError,
  fetchFares,
  addFare,
  editFare,
  removeFare,
} = useFares()

const {
  rows: promoRows,
  loading: promosLoading,
  error: promosError,
  fetchPromotions,
  addPromotion,
  editPromotion,
  removePromotion,
} = usePromotions()

// ── Static config ────────────────────────────────────────────
const passengerTypes = [
  { key: 'regular', label: 'Regular',       color: '#3b82f6', note: 'Full fare'    },
  { key: 'student', label: 'Student',        color: '#8b5cf6', note: '20% discount' },
  { key: 'senior',  label: 'Senior Citizen', color: '#f59e0b', note: '20% discount' },
  { key: 'pwd',     label: 'PWD',            color: '#10b981', note: '20% discount' },
]
const routeTypes = ['Regular Route', 'Express Route', 'Provincial', 'City Shuttle']
function passengerLabel(key) {
  const found = passengerTypes.find(p => p.key === key)
  return found?.label || key
}

function normalizeText(v) {
  return String(v || '').trim().toLowerCase()
}

function getActivePromoForFare(row, passengerKey) {
  const label = passengerLabel(passengerKey)
  const routeLabel = `${row.from_name} → ${row.to_name}`

  return promoRows.value.find(p => {
    if (p.status !== 'active') return false

    const appliesToPassenger =
      Array.isArray(p.appliesTo) &&
      p.appliesTo.includes(label)

    const appliesToRoute =
      !p.routes ||
      p.routes.length === 0 ||
      p.routes.some(r => normalizeText(r) === normalizeText(routeLabel))

    return appliesToPassenger && appliesToRoute
  })
}

function discountedFare(row, passengerKey) {
  const base = Number(row.fares?.[passengerKey] || 0)
  const promo = getActivePromoForFare(row, passengerKey)

  if (!promo) {
    return {
      base,
      final: base,
      hasDiscount: false,
      promo: null,
    }
  }

  let final = base

  if (promo.type === 'percent') {
    final = base - (base * Number(promo.value || 0) / 100)
  }

  if (promo.type === 'flat') {
    final = base - Number(promo.value || 0)
  }

  final = Math.max(0, final)

  return {
    base,
    final: Number(final.toFixed(2)),
    hasDiscount: final < base,
    promo,
  }
}
// ── Tab ──────────────────────────────────────────────────────
const tab = ref('fares')
const tabList = computed(() => [
  {
    key: 'fares', label: 'Fare Matrix',
    icon: '<svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="14" height="14" rx="1.5"/><path d="M7 7h6M7 10h4M7 13h2"/></svg>',
    count: fareRows.value.length,
  },
  {
    key: 'promos', label: 'Promotions',
    icon: '<svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 3H5a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V8M9 3l6 5M9 3v5h6"/></svg>',
    count: promoRows.value.length,
  },
])

// ── Terminals ────────────────────────────────────────────────
const terminals = ref([])
async function loadTerminals() {
  try {
    const res = await api.get('/admin/terminals')
    const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])

    const map = new Map()

    for (const t of data) {
      const id = t.terminal_id
      const name = t.terminal_name ?? t.name ?? ''

      if (id && !map.has(id)) {
        map.set(id, {
          ...t,
          terminal_id: id,
          name,
        })
      }
    }

    terminals.value = [...map.values()]
  } catch (e) {
    console.error('Failed to load terminals', e)
  }
}


// ── Fares ────────────────────────────────────────────────────
const fareSearch  = ref('')
const fareMode    = ref('manual')
const faresSaving = ref(false)
const faresSaved  = ref(false)
const faresDirty  = ref(false)
const dirtyRows   = ref(new Set())

const filteredFares = computed(() => {
  const kw = fareSearch.value.toLowerCase()
  return fareRows.value.filter(r =>
    !kw || (r.from_name + ' ' + r.to_name + ' ' + r.type).toLowerCase().includes(kw)
  )
})

async function loadFares() {
  await fetchFares(fareSearch.value ? { q: fareSearch.value } : {})
}

function onFareSearch() { loadFares() }

function markFareDirty(row) {
  faresDirty.value = true
  dirtyRows.value.add(`${row.from_terminal_id}|${row.to_terminal_id}|${row.type}`)
}

let savedTimer = null
async function saveFares() {
  if (!faresDirty.value) return
  faresSaving.value = true
  try {
    for (const key of dirtyRows.value) {
      const row = fareRows.value.find(
        r => `${r.from_terminal_id}|${r.to_terminal_id}|${r.type}` === key
      )
      if (row) {
        await editFare(row.from_terminal_id, row.to_terminal_id, row.type, { fares: { ...row.fares } })
      }
    }
    dirtyRows.value.clear()
    faresDirty.value = false
    faresSaved.value = true
    clearTimeout(savedTimer)
    savedTimer = setTimeout(() => { faresSaved.value = false }, 3500)
  } finally {
    faresSaving.value = false
  }
}

// ── Global Fare Matrix Image ──────────────────────────────────
const uploadedImageUrl     = ref(null)
const isDragging           = ref(false)
const fileInput            = ref(null)
const globalImageLoading   = ref(false)
const globalImageUploading = ref(false)
const globalUploadProgress = ref(0)

function toFullUrl(url) {
  if (!url) return null
  return url.startsWith('http') ? url : API_BASE + url
}

// Called when clicking "Upload Image" mode button
async function switchToUploadMode() {
  fareMode.value = 'upload'
  await loadGlobalImage()
}

// Fetch the single global image and populate the preview
async function loadGlobalImage() {
  globalImageLoading.value = true
  uploadedImageUrl.value   = null
  try {
    const res = await api.get('/admin/fares/image')
    uploadedImageUrl.value = toFullUrl(res.data?.url)
  } catch {
    // 404 = no image yet, perfectly fine
    uploadedImageUrl.value = null
  } finally {
    globalImageLoading.value = false
  }
}

function handleFileSelect(e) {
  const file = e.target.files[0]
  if (file) doUpload(file)
  // Reset input so the same file can be re-selected after removal
  e.target.value = ''
}

function handleDrop(e) {
  isDragging.value = false
  const file = e.dataTransfer.files[0]
  if (file) doUpload(file)
}

async function doUpload(file) {
  globalImageUploading.value = true
  globalUploadProgress.value = 0

  const formData = new FormData()
  formData.append('image', file)

  try {
    // Simulate progress since axios upload progress events may not be wired
    const tick = setInterval(() => {
      if (globalUploadProgress.value < 85) globalUploadProgress.value += 15
    }, 150)

    const res = await api.post('/admin/fares/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress(e) {
        if (e.total) {
          globalUploadProgress.value = Math.round((e.loaded / e.total) * 100)
        }
      },
    })

    clearInterval(tick)
    globalUploadProgress.value = 100
    uploadedImageUrl.value = toFullUrl(res.data?.url)
  } catch (err) {
    console.error('Upload failed', err)
    alert('Image upload failed. Please try again.')
  } finally {
    globalImageUploading.value = false
    setTimeout(() => { globalUploadProgress.value = 0 }, 800)
  }
}

async function removeGlobalImage() {
  try {
    await api.delete('/admin/fares/image')
    uploadedImageUrl.value = null
  } catch (err) {
    console.error('Failed to delete image', err)
    alert('Failed to remove image. Please try again.')
  }
}

// ── Fare Modal ───────────────────────────────────────────────
const showFareModal   = ref(false)
const fareModalMode   = ref('add')
const fareFormError   = ref('')
const fareModalSaving = ref(false)
let editingFareOrig   = null

const blankFareForm = () => ({
  from_terminal_id: '',
  to_terminal_id:   '',
  type:             'Regular Route',
  fares:            { regular: 0, student: 0, senior: 0, pwd: 0 },
})
const fareForm = reactive(blankFareForm())

function openFareModal(mode, row = null) {
  fareModalMode.value = mode
  fareFormError.value = ''
  if (mode === 'edit' && row) {
    editingFareOrig = {
      from_terminal_id: row.from_terminal_id,
      to_terminal_id:   row.to_terminal_id,
      type:             row.type,
    }
    Object.assign(fareForm, {
      from_terminal_id: row.from_terminal_id,
      to_terminal_id:   row.to_terminal_id,
      type:             row.type,
      fares:            { ...row.fares },
    })
  } else {
    editingFareOrig = null
    Object.assign(fareForm, blankFareForm())
  }
  showFareModal.value = true
}

async function saveFareModal() {
  fareFormError.value = ''
  if (!fareForm.from_terminal_id) { fareFormError.value = 'From terminal is required.'; return }
  if (!fareForm.to_terminal_id)   { fareFormError.value = 'To terminal is required.';   return }
  if (fareForm.from_terminal_id === fareForm.to_terminal_id) {
    fareFormError.value = 'From and To terminals must be different.'; return
  }

  fareModalSaving.value = true
  try {
    if (fareModalMode.value === 'edit') {
      const result = await editFare(
        editingFareOrig.from_terminal_id,
        editingFareOrig.to_terminal_id,
        editingFareOrig.type,
        {
          from_terminal_id: fareForm.from_terminal_id,
          to_terminal_id:   fareForm.to_terminal_id,
          type:             fareForm.type,
          fares:            { ...fareForm.fares },
        }
      )
      if (!result) { fareFormError.value = 'Failed to update route.'; return }
    } else {
      const result = await addFare({
        from_terminal_id: fareForm.from_terminal_id,
        to_terminal_id:   fareForm.to_terminal_id,
        type:             fareForm.type,
        fares:            { ...fareForm.fares },
      })
      if (!result) { fareFormError.value = 'Failed to create route.'; return }
    }
    showFareModal.value = false
  } finally {
    fareModalSaving.value = false
  }
}

// ── Promo route options ───────────────────────────────────────
const routeOptionsForPromo = computed(() =>
  fareRows.value.map(r => ({
    from_terminal_id: r.from_terminal_id,
    to_terminal_id:   r.to_terminal_id,
    route_type:       r.type,
    label:            `${r.from_name} → ${r.to_name}`,
  }))
)

// ── Promotions ───────────────────────────────────────────────
const promoSearch  = ref('')
const promoFilter  = ref('all')
const promoFilters = [
  { key: 'all',      label: 'All'      },
  { key: 'active',   label: 'Active'   },
  { key: 'expired',  label: 'Expired'  },
  { key: 'upcoming', label: 'Upcoming' },
]

const filteredPromos = computed(() => {
  const kw = promoSearch.value.toLowerCase()
  return promoRows.value.filter(p => {
    if (kw && !p.name.toLowerCase().includes(kw) && !(p.description || '').toLowerCase().includes(kw)) return false
    if (promoFilter.value !== 'all' && p.status !== promoFilter.value) return false
    return true
  })
})

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Promo Modal ──────────────────────────────────────────────
const showPromoModal   = ref(false)
const editingPromoId   = ref(null)
const promoError       = ref('')
const promoModalSaving = ref(false)

const blankPromoForm = () => ({
  name:           '',
  description:    '',
  type:           'percent',
  value:          0,
  appliesTo:      [],
  selectedRoutes: [],
  startDate:      new Date().toISOString().slice(0, 10),
  endDate:        '',
})
const promoForm = reactive(blankPromoForm())

function togglePromoRoute(route) {
  const idx = promoForm.selectedRoutes.findIndex(
    r => r.from_terminal_id === route.from_terminal_id && r.to_terminal_id === route.to_terminal_id
  )
  if (idx >= 0) promoForm.selectedRoutes.splice(idx, 1)
  else          promoForm.selectedRoutes.push({ ...route })
}

function openAddPromo() {
  editingPromoId.value = null
  promoError.value     = ''
  Object.assign(promoForm, blankPromoForm())
  showPromoModal.value = true
}

function openEditPromo(p) {
  editingPromoId.value = p.id
  promoError.value     = ''
  const selectedRoutes = routeOptionsForPromo.value.filter(r => (p.routes || []).includes(r.label))
  Object.assign(promoForm, {
    name:           p.name,
    description:    p.description || '',
    type:           p.type,
    value:          p.value,
    appliesTo:      [...p.appliesTo],
    selectedRoutes,
    startDate:      p.startDate,
    endDate:        p.endDate || '',
  })
  showPromoModal.value = true
}

async function savePromo() {
  promoError.value = ''
  if (!promoForm.name.trim())      { promoError.value = 'Promotion name is required.'; return }
  if (promoForm.value <= 0)        { promoError.value = 'Discount value must be greater than 0.'; return }
  if (!promoForm.appliesTo.length) { promoError.value = 'Select at least one passenger type.'; return }

  const payload = {
    name:        promoForm.name,
    description: promoForm.description,
    type:        promoForm.type,
    value:       promoForm.value,
    appliesTo:   [...promoForm.appliesTo],
    routes:      promoForm.selectedRoutes.map(r => ({
      from_terminal_id: r.from_terminal_id,
      to_terminal_id:   r.to_terminal_id,
      route_type:       r.route_type,
    })),
    startDate: promoForm.startDate,
    endDate:   promoForm.endDate || null,
  }

  promoModalSaving.value = true
  try {
    const result = editingPromoId.value
      ? await editPromotion(editingPromoId.value, payload)
      : await addPromotion(payload)
    if (!result) { promoError.value = 'Failed to save promotion.'; return }
    closePromoModal()
  } finally {
    promoModalSaving.value = false
  }
}

function closePromoModal() {
  showPromoModal.value = false
  editingPromoId.value = null
  promoError.value     = ''
}

// ── Delete confirm ───────────────────────────────────────────
const deleteConfirm = ref(null)

function confirmDeleteFare(row) {
  deleteConfirm.value = {
    title:   'Delete route?',
    message: `Remove "${row.from_name} → ${row.to_name} (${row.type})" from the fare matrix?`,
    loading: false,
    action:  async () => { await removeFare(row.from_terminal_id, row.to_terminal_id, row.type) },
  }
}

function confirmDeletePromo(p) {
  deleteConfirm.value = {
    title:   'Delete promotion?',
    message: `Remove "${p.name}" permanently?`,
    loading: false,
    action:  async () => { await removePromotion(p.id) },
  }
}

async function confirmDelete() {
  if (!deleteConfirm.value?.action) return
  deleteConfirm.value.loading = true
  await deleteConfirm.value.action()
  deleteConfirm.value = null
}

// ── Init ─────────────────────────────────────────────────────
onMounted(async () => {
  await Promise.all([loadTerminals(), loadFares(), fetchPromotions()])
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.fm {
  --c-bg:       #f9fafb;
  --c-card:     #ffffff;
  --c-border:   #e5e7eb;
  --c-border-2: #f3f4f6;
  --c-text:     #111827;
  --c-muted:    #6b7280;
  --c-muted-2:  #9ca3af;
  --c-primary:  #111827;
  --c-accent:   #2563eb;
  --c-green:    #16a34a;
  --c-red:      #dc2626;
  --c-amber:    #d97706;
  --radius-sm:  6px;
  --radius-md:  10px;
  --radius-lg:  14px;
  --shadow-sm:  0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04);
  --shadow-md:  0 4px 16px rgba(0,0,0,.08), 0 1px 4px rgba(0,0,0,.04);
  --shadow-lg:  0 16px 48px rgba(0,0,0,.12), 0 4px 12px rgba(0,0,0,.06);

  font-family: 'Plus Jakarta Sans', 'Segoe UI', system-ui, sans-serif;
  color: var(--c-text);
  background: var(--c-bg);
  padding: 32px;
  min-height: 100vh;
}

.fm-page-header { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; margin-bottom:28px; flex-wrap:wrap; }
.fm-breadcrumb { font-size:11px; font-weight:500; color:var(--c-muted); margin-bottom:6px; letter-spacing:.02em; }
.fm-breadcrumb-sep { margin:0 5px; }
.fm-page-title { font-size:24px; font-weight:800; color:var(--c-text); letter-spacing:-.6px; line-height:1.1; }
.fm-page-desc { font-size:13px; color:var(--c-muted); margin-top:4px; }
.fm-last-updated { display:flex; align-items:center; gap:6px; font-size:12px; color:var(--c-muted); background:var(--c-card); border:1px solid var(--c-border); border-radius:99px; padding:6px 12px; box-shadow:var(--shadow-sm); }
.fm-lu-dot { width:6px; height:6px; border-radius:50%; background:var(--c-green); animation:pulse 2s ease-in-out infinite; }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }

.fm-tabs { display:flex; gap:2px; margin-bottom:24px; background:var(--c-card); border:1px solid var(--c-border); border-radius:var(--radius-md); padding:4px; width:fit-content; box-shadow:var(--shadow-sm); }
.fm-tab { display:inline-flex; align-items:center; gap:7px; padding:8px 16px; border:none; border-radius:calc(var(--radius-md) - 2px); background:transparent; font-family:inherit; font-size:13px; font-weight:600; color:var(--c-muted); cursor:pointer; transition:all .15s; white-space:nowrap; }
.fm-tab:hover:not(.fm-tab--active) { color:var(--c-text); background:var(--c-border-2); }
.fm-tab--active { background:var(--c-primary); color:#fff; box-shadow:var(--shadow-sm); }
.fm-tab-count { font-size:10px; font-weight:700; padding:1px 6px; border-radius:99px; background:rgba(255,255,255,.2); }
.fm-tab:not(.fm-tab--active) .fm-tab-count { background:var(--c-border); color:var(--c-muted); }

.fm-panel { background:var(--c-card); border:1px solid var(--c-border); border-radius:var(--radius-lg); overflow:hidden; box-shadow:var(--shadow-sm); }

.fm-toolbar { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:16px 20px; border-bottom:1px solid var(--c-border-2); flex-wrap:wrap; background:#fdfdfd; }
.fm-toolbar-left  { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
.fm-toolbar-right { display:flex; align-items:center; gap:6px; }

.fm-search-wrap { display:flex; align-items:center; gap:8px; background:var(--c-bg); border:1px solid var(--c-border); border-radius:var(--radius-sm); padding:0 12px; height:34px; min-width:220px; transition:border-color .12s,box-shadow .12s; }
.fm-search-wrap:focus-within { border-color:#9ca3af; box-shadow:0 0 0 3px rgba(156,163,175,.15); }
.fm-search-icon { color:var(--c-muted-2); flex-shrink:0; }
.fm-search { border:none; outline:none; background:transparent; font-family:inherit; font-size:13px; color:var(--c-text); flex:1; }

.fm-save-status { display:flex; align-items:center; gap:5px; font-size:12px; color:var(--c-muted-2); min-width:120px; }

.fm-loading { display:flex; align-items:center; gap:10px; padding:40px 20px; font-size:13px; color:var(--c-muted); justify-content:center; }

.fm-btn { display:inline-flex; align-items:center; gap:6px; height:34px; padding:0 14px; border-radius:var(--radius-sm); border:1px solid var(--c-border); background:var(--c-card); font-family:inherit; font-size:12px; font-weight:600; color:#374151; cursor:pointer; white-space:nowrap; transition:all .12s; }
.fm-btn:hover  { background:var(--c-bg); border-color:#9ca3af; }
.fm-btn:active { transform:scale(.98); }
.fm-btn:disabled { opacity:.4; pointer-events:none; }
.fm-btn--ghost { background:transparent; border-color:var(--c-border); color:var(--c-muted); }
.fm-btn--ghost:hover { background:var(--c-bg); color:var(--c-text); }
.fm-btn--secondary { background:#f8fafc; border-color:var(--c-border); }
.fm-btn--primary { background:var(--c-primary); border-color:var(--c-primary); color:#fff; }
.fm-btn--primary:hover { background:#1f2937; border-color:#1f2937; }
.fm-btn--danger { background:#fef2f2; border-color:#fecaca; color:var(--c-red); }
.fm-btn--danger:hover { background:var(--c-red); color:#fff; border-color:var(--c-red); }

.fm-mode-banner { display:flex; align-items:center; justify-content:space-between; padding:10px 20px; background:#f0f9ff; border-bottom:1px solid #bae6fd; gap:12px; flex-wrap:wrap; }
.fm-mode-label { display:flex; align-items:center; gap:6px; font-size:12px; font-weight:600; color:#0369a1; letter-spacing:.02em; text-transform:uppercase; }
.fm-mode-toggle { display:flex; background:#fff; border:1px solid #bae6fd; border-radius:var(--radius-sm); padding:2px; gap:2px; }
.fm-mode-btn { display:inline-flex; align-items:center; gap:5px; padding:5px 12px; border:none; border-radius:calc(var(--radius-sm) - 1px); background:transparent; font-family:inherit; font-size:12px; font-weight:600; color:#0369a1; cursor:pointer; transition:all .12s; }
.fm-mode-btn--active { background:#0369a1; color:#fff; box-shadow:var(--shadow-sm); }

.fm-upload-area { padding:24px 20px; }
.fm-dropzone { border:2px dashed var(--c-border); border-radius:var(--radius-lg); background:var(--c-bg); min-height:220px; display:flex; flex-direction:column; align-items:center; justify-content:center; cursor:pointer; transition:all .15s; text-align:center; padding:32px; position:relative; overflow:hidden; }
.fm-dropzone:hover, .fm-dropzone--over { border-color:var(--c-accent); background:#eff6ff; }
.fm-dropzone-icon { width:64px; height:64px; background:var(--c-card); border:1px solid var(--c-border); border-radius:16px; display:grid; place-items:center; color:var(--c-muted-2); margin-bottom:14px; box-shadow:var(--shadow-sm); }
.fm-dropzone-title { font-size:14px; font-weight:700; color:var(--c-text); margin-bottom:4px; }
.fm-dropzone-sub   { font-size:12px; color:var(--c-muted); }
.fm-uploaded-preview { width:100%; max-height:400px; position:relative; border-radius:var(--radius-md); overflow:hidden; }
.fm-preview-img { width:100%; max-height:400px; object-fit:contain; display:block; }
.fm-preview-overlay { position:absolute; inset:0; background:rgba(0,0,0,.4); display:flex; align-items:center; justify-content:center; gap:10px; opacity:0; transition:opacity .15s; }
.fm-uploaded-preview:hover .fm-preview-overlay { opacity:1; }
.fm-preview-change, .fm-preview-remove { display:inline-flex; align-items:center; gap:5px; padding:8px 14px; border-radius:var(--radius-sm); border:none; font-family:inherit; font-size:12px; font-weight:600; cursor:pointer; }
.fm-preview-change { background:#fff; color:var(--c-text); }
.fm-preview-remove { background:#dc2626; color:#fff; }
.fm-upload-progress { margin-top:10px; font-size:12px; color:var(--c-muted); display:flex; flex-direction:column; gap:4px; }
.fm-progress-bar { height:3px; background:var(--c-accent); border-radius:99px; transition:width .2s; }
.fm-upload-note { display:flex; align-items:flex-start; gap:7px; margin-top:12px; padding:10px 14px; background:#fffbeb; border:1px solid #fde68a; border-radius:var(--radius-sm); font-size:12px; color:#92400e; line-height:1.5; }

.fm-table-wrap { overflow-x:auto; }
.fm-table { width:100%; border-collapse:collapse; font-size:13px; }
.fm-table thead th { padding:12px 16px; text-align:left; font-size:10.5px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:var(--c-muted); background:#fafafa; border-bottom:1px solid var(--c-border); white-space:nowrap; }
.fm-th-route { min-width:200px; }
.fm-th-fare  { text-align:right !important; min-width:120px; }
.fm-th-actions { width:72px; }
.fm-th-inner { display:flex; align-items:center; justify-content:flex-end; gap:5px; }
.fm-th-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
.fm-row { border-bottom:1px solid var(--c-border-2); transition:background .1s; }
.fm-row:last-child { border-bottom:none; }
.fm-row:hover { background:#fafafa; }
.fm-table td { padding:13px 16px; vertical-align:middle; }
.fm-td-fare    { text-align:right; }
.fm-td-actions { text-align:right; }
.fm-route-wrap { display:flex; flex-direction:column; gap:4px; }
.fm-route-label { display:flex; align-items:center; gap:6px; font-weight:700; font-size:13px; }
.fm-route-from, .fm-route-to { color:var(--c-text); }
.fm-route-arrow { color:var(--c-muted-2); flex-shrink:0; }
.fm-route-badges { display:flex; align-items:center; gap:4px; flex-wrap:wrap; }
.fm-route-type-badge { display:inline-flex; align-items:center; font-size:10px; font-weight:600; letter-spacing:.04em; color:var(--c-muted); background:var(--c-bg); border:1px solid var(--c-border); border-radius:99px; padding:2px 8px; }
.fm-fare-input-wrap { display:inline-flex; align-items:center; border:1px solid transparent; border-radius:var(--radius-sm); overflow:hidden; transition:border-color .12s,background .12s; justify-content:flex-end; }
.fm-fare-input-wrap:hover, .fm-fare-input-wrap:focus-within { border-color:var(--c-border); background:var(--c-card); }
.fm-fare-input-wrap:focus-within { border-color:#6b7280; }
.fm-fare-input-wrap--lg { border-color:var(--c-border); background:var(--c-card); }
.fm-peso { padding:0 7px; font-size:11px; font-weight:600; color:var(--c-muted-2); border-right:1px solid var(--c-border); height:32px; display:flex; align-items:center; background:#f9fafb; flex-shrink:0; }
input.fm-fare-input { border:none; outline:none; width:72px; padding:0 8px; height:32px; font-family:'JetBrains Mono',monospace; font-size:12px; font-weight:500; color:var(--c-text); background:transparent; text-align:right; }
.fm-row-actions { display:flex; align-items:center; gap:4px; justify-content:flex-end; }
.fm-action-btn { width:30px; height:30px; border-radius:var(--radius-sm); border:1px solid var(--c-border); background:var(--c-card); cursor:pointer; display:grid; place-items:center; color:var(--c-muted); opacity:0; transition:all .12s; }
.fm-row:hover .fm-action-btn { opacity:1; }
.fm-action-btn--edit:hover { background:#eff6ff; border-color:#bfdbfe; color:var(--c-accent); }
.fm-action-btn--del:hover  { background:#fef2f2; border-color:#fecaca; color:var(--c-red); }
.fm-promo-actions .fm-action-btn { opacity:1; }
.fm-empty-cell { padding:0 !important; }
.fm-table-empty { padding:48px 20px; text-align:center; color:var(--c-muted-2); }
.fm-table-empty svg { margin-bottom:10px; }
.fm-table-empty p { font-size:14px; font-weight:600; color:var(--c-muted); margin-bottom:4px; }
.fm-table-empty small { font-size:12px; }

.fm-legend { display:flex; align-items:center; gap:16px; padding:12px 20px; border-top:1px solid var(--c-border-2); background:#fafafa; flex-wrap:wrap; }
.fm-legend-title { font-size:11px; font-weight:700; color:var(--c-muted); text-transform:uppercase; letter-spacing:.05em; }
.fm-legend-item  { display:flex; align-items:center; gap:5px; font-size:11px; color:var(--c-muted); }
.fm-legend-dot   { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
.fm-legend-note  { color:var(--c-muted-2); font-style:italic; }

.fm-filter-pills { display:flex; gap:4px; }
.fm-filter-pill { padding:5px 11px; border:1px solid var(--c-border); border-radius:99px; background:var(--c-card); font-family:inherit; font-size:11px; font-weight:600; color:var(--c-muted); cursor:pointer; transition:all .12s; }
.fm-filter-pill:hover { border-color:#9ca3af; color:var(--c-text); }
.fm-filter-pill--active { background:var(--c-text); border-color:var(--c-text); color:#fff; }

.fm-promos-empty { padding:72px 20px; text-align:center; color:var(--c-muted-2); }
.fm-promos-empty-icon { width:72px; height:72px; background:var(--c-bg); border:1px solid var(--c-border); border-radius:20px; display:grid; place-items:center; margin:0 auto 16px; color:var(--c-muted-2); }
.fm-promos-empty p     { font-size:15px; font-weight:700; color:var(--c-muted); margin-bottom:6px; }
.fm-promos-empty small { font-size:13px; }
.fm-promos-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:1px; background:var(--c-border); }
.fm-promo-card { background:var(--c-card); transition:background .1s; }
.fm-promo-card:hover { background:#fafafa; }
.fm-promo-card-header { padding:20px 20px 16px; border-bottom:1px solid var(--c-border-2); }
.fm-promo-card-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
.fm-promo-status { display:inline-flex; align-items:center; gap:5px; font-size:10.5px; font-weight:700; letter-spacing:.04em; padding:3px 9px; border-radius:99px; }
.fm-promo-status-dot { width:5px; height:5px; border-radius:50%; background:currentColor; animation:pulse 2s ease-in-out infinite; }
.fm-promo-status--active   { background:#ecfdf5; color:#059669; border:1px solid #a7f3d0; }
.fm-promo-status--expired  { background:#fef2f2; color:#dc2626; border:1px solid #fecaca; }
.fm-promo-status--upcoming { background:#eff6ff; color:#2563eb; border:1px solid #bfdbfe; }
.fm-promo-discount { font-size:36px; font-weight:800; color:var(--c-text); letter-spacing:-1.5px; line-height:1; display:flex; align-items:baseline; gap:4px; }
.fm-promo-discount-label { font-size:12px; font-weight:700; color:var(--c-muted); letter-spacing:.06em; }
.fm-promo-name { font-size:15px; font-weight:700; color:var(--c-text); margin-top:8px; margin-bottom:4px; }
.fm-promo-desc { font-size:12px; color:var(--c-muted); line-height:1.5; }
.fm-promo-card-body { padding:14px 20px; }
.fm-promo-meta-row { display:flex; align-items:flex-start; gap:10px; margin-bottom:8px; font-size:12px; }
.fm-promo-meta-row:last-child { margin-bottom:0; }
.fm-promo-meta-label { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--c-muted-2); min-width:64px; padding-top:2px; }
.fm-promo-pills { display:flex; flex-wrap:wrap; gap:3px; }
.fm-promo-pill { font-size:10.5px; font-weight:600; padding:2px 7px; border-radius:99px; background:#eff6ff; border:1px solid #bfdbfe; color:#1d4ed8; }
.fm-promo-routes { color:var(--c-text); font-weight:500; }
.fm-promo-validity { color:var(--c-text); font-weight:500; }
.fm-muted { color:var(--c-muted-2); }

.fm-overlay { position:fixed; inset:0; background:rgba(15,23,42,.45); backdrop-filter:blur(6px); display:grid; place-items:center; z-index:9999; padding:16px; }
.fm-modal { width:min(540px,100%); background:var(--c-card); border:1px solid var(--c-border); border-radius:var(--radius-lg); overflow:hidden; box-shadow:var(--shadow-lg); }
.fm-modal--wide { width:min(640px,100%); }
.fm-modal-head { display:flex; align-items:flex-start; justify-content:space-between; padding:20px 20px 18px; border-bottom:1px solid var(--c-border); gap:12px; background:#fafafa; }
.fm-modal-head-left { display:flex; align-items:flex-start; gap:12px; }
.fm-modal-icon { width:38px; height:38px; background:#f0f9ff; border:1px solid #bae6fd; border-radius:var(--radius-sm); display:grid; place-items:center; color:#0369a1; flex-shrink:0; }
.fm-modal-icon--green { background:#f0fdf4; border-color:#bbf7d0; color:var(--c-green); }
.fm-modal-title { font-size:14px; font-weight:700; color:var(--c-text); margin-bottom:2px; }
.fm-modal-sub   { font-size:12px; color:var(--c-muted); }
.fm-modal-close { width:30px; height:30px; border:1px solid var(--c-border); border-radius:var(--radius-sm); background:var(--c-card); cursor:pointer; display:grid; place-items:center; color:var(--c-muted); flex-shrink:0; transition:all .12s; }
.fm-modal-close:hover { background:#fef2f2; border-color:#fecaca; color:var(--c-red); }
.fm-modal-body { padding:20px; max-height:65vh; overflow-y:auto; display:flex; flex-direction:column; gap:20px; }
.fm-modal-foot { display:flex; justify-content:flex-end; gap:8px; padding:14px 20px; border-top:1px solid var(--c-border); background:#fafafa; }
.fm-discount-preview {
  margin-top: 7px;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  font-size: 11px;
}

.fm-old-fare {
  color: #9ca3af;
  text-decoration: line-through;
  font-weight: 600;
}

.fm-new-fare {
  color: #16a34a;
  font-weight: 900;
}

.fm-promo-tag {
  padding: 2px 6px;
  border-radius: 999px;
  background: #dcfce7;
  color: #15803d;
  font-weight: 700;
  font-size: 10px;
}
.fm-form-section {}
.fm-form-section-title { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:var(--c-muted); margin-bottom:12px; padding-bottom:8px; border-bottom:1px solid var(--c-border-2); }
.fm-form-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
.fm-field { display:flex; flex-direction:column; gap:6px; }
.fm-field--full { grid-column:1 / -1; }
.fm-label { font-size:11px; font-weight:700; letter-spacing:.05em; text-transform:uppercase; color:var(--c-muted); }
.fm-req { color:var(--c-red); }
.fm-opt { font-style:italic; text-transform:none; letter-spacing:0; font-weight:400; opacity:.7; }
input.fm-input, select.fm-input, textarea.fm-textarea { height:36px; border:1px solid var(--c-border); border-radius:var(--radius-sm); padding:0 11px; outline:none; background:var(--c-card); font-family:inherit; font-size:13px; color:var(--c-text); width:100%; transition:border-color .12s,box-shadow .12s; }
textarea.fm-textarea { height:auto; padding:9px 11px; resize:vertical; }
input.fm-input:focus, select.fm-input:focus, textarea.fm-textarea:focus { border-color:#6b7280; box-shadow:0 0 0 3px rgba(107,114,128,.12); }
.fm-radio-row { display:flex; gap:6px; flex-wrap:wrap; }
.fm-radio-chip { display:inline-flex; align-items:center; padding:6px 12px; border:1px solid var(--c-border); border-radius:99px; background:var(--c-card); font-size:12px; font-weight:600; color:var(--c-muted); cursor:pointer; transition:all .12s; }
.fm-radio-chip input { display:none; }
.fm-radio-chip--active { background:var(--c-primary); border-color:var(--c-primary); color:#fff; }
.fm-radio-chip:hover:not(.fm-radio-chip--active) { border-color:#9ca3af; color:var(--c-text); }
.fm-fares-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:12px; }
.fm-fare-field { background:var(--c-bg); border:1px solid var(--c-border); border-radius:var(--radius-sm); padding:12px; }
.fm-fare-field-header { display:flex; align-items:center; gap:6px; margin-bottom:8px; }
.fm-fare-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
.fm-fare-input-wrap--lg { width:100%; }
.fm-fare-input-wrap--lg input.fm-fare-input { width:100%; }
.fm-fare-hint { font-size:10px; color:var(--c-green); margin-top:5px; font-weight:600; }
.fm-check-row { display:flex; flex-wrap:wrap; gap:6px; }
.fm-check-chip { display:inline-flex; align-items:center; gap:5px; padding:6px 12px; border:1px solid var(--c-border); border-radius:99px; background:var(--c-card); font-size:12px; font-weight:600; color:var(--c-muted); cursor:pointer; transition:all .12s; }
.fm-check-chip input { display:none; }
.fm-check-chip--active { background:var(--c-primary); border-color:var(--c-primary); color:#fff; }
.fm-check-chip--active .fm-check-dot { opacity:.7; }
.fm-check-dot { width:7px; height:7px; border-radius:50%; }
.fm-check-chip:hover:not(.fm-check-chip--active) { border-color:#9ca3af; color:var(--c-text); }
.fm-form-error { display:flex; align-items:flex-start; gap:7px; padding:10px 13px; border-radius:var(--radius-sm); border:1px solid #fecaca; background:#fef2f2; color:#b91c1c; font-size:12px; font-weight:500; line-height:1.5; }

.fm-confirm-modal { background:var(--c-card); border:1px solid var(--c-border); border-radius:var(--radius-lg); padding:28px 24px 20px; width:min(380px,100%); box-shadow:var(--shadow-lg); text-align:center; }
.fm-confirm-icon { margin-bottom:14px; }
.fm-confirm-title { font-size:16px; font-weight:800; color:var(--c-text); margin-bottom:6px; }
.fm-confirm-msg   { font-size:13px; color:var(--c-muted); line-height:1.5; margin-bottom:20px; }
.fm-confirm-actions { display:flex; gap:8px; justify-content:center; }

.fm-spin { animation:spin 1s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }

.fm-modal-enter-active, .fm-modal-leave-active { transition:all .2s ease; }
.fm-modal-enter-from, .fm-modal-leave-to { opacity:0; transform:scale(.97) translateY(8px); }

@media (max-width:768px) {
  .fm { padding:16px; }
  .fm-form-grid { grid-template-columns:1fr; }
  .fm-field--full { grid-column:1; }
  .fm-fares-grid { grid-template-columns:1fr; }
  .fm-promos-grid { grid-template-columns:1fr; }
  .fm-toolbar { flex-direction:column; align-items:flex-start; }
  .fm-page-header { flex-direction:column; }
}
</style>