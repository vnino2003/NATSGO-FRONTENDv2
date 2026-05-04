<!-- src/views/admin/UpdatesManagement.vue -->
<template>
  <div class="updates-page">
    <div class="updates-head">
      <div>
        <h1>Updates Management</h1>
        <p>Create commuter announcements and alert ticker messages.</p>
      </div>

      <button class="primary-btn" @click="openCreate">
        <i class="fas fa-plus"></i>
        Add {{ tab === "announcements" ? "Announcement" : "Alert" }}
      </button>
    </div>

    <div class="tabs">
      <button
        class="tab-btn"
        :class="{ active: tab === 'announcements' }"
        @click="tab = 'announcements'"
      >
        Announcements
        <span>{{ announcementCount }}</span>
      </button>

      <button
        class="tab-btn"
        :class="{ active: tab === 'alerts' }"
        @click="tab = 'alerts'"
      >
        Alert Ticker
        <span>{{ alertCount }}</span>
      </button>
    </div>

    <p v-if="loading" class="state-text">
      <i class="fas fa-circle-notch fa-spin"></i>
      Loading updates...
    </p>

    <p v-else-if="error" class="state-text error">
      <i class="fas fa-triangle-exclamation"></i>
      {{ error }}
    </p>

    <div v-else>
      <!-- ANNOUNCEMENTS -->
      <div v-if="tab === 'announcements'" class="list">
        <div
          v-for="item in announcements"
          :key="item.id"
          class="row"
        >
          <div class="row-main">
            <div class="row-title">
              <span class="dot" :class="`dot-${item.type}`"></span>
              {{ item.title }}
            </div>

            <p>{{ item.body }}</p>

            <div class="meta">
              <span>{{ item.type }}</span>
              <span>{{ item.is_published ? "Published" : "Hidden" }}</span>
              <span>{{ formatDate(item.created_at) }}</span>
            </div>
          </div>

          <div class="row-actions">
            <button @click="openEditAnnouncement(item)">
              <i class="fas fa-pen"></i>
            </button>

            <button class="danger" @click="removeAnnouncement(item.id)">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>

        <div v-if="!announcements.length" class="empty">
          No announcements yet.
        </div>
      </div>

      <!-- ALERTS -->
      <div v-if="tab === 'alerts'" class="list">
        <div
          v-for="item in alerts"
          :key="item.id"
          class="row"
        >
          <div class="row-main">
            <div class="row-title">
              <span class="dot" :class="`dot-${item.severity}`"></span>
              {{ item.title }}
            </div>

            <p>{{ item.meta }}</p>

            <div class="meta">
              <span>{{ item.severity }}</span>
              <span>{{ item.is_active ? "Active" : "Inactive" }}</span>
              <span>{{ formatDate(item.created_at) }}</span>
            </div>
          </div>

          <div class="row-actions">
            <button @click="openEditAlert(item)">
              <i class="fas fa-pen"></i>
            </button>

            <button class="danger" @click="removeAlert(item.id)">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>

        <div v-if="!alerts.length" class="empty">
          No alert tickers yet.
        </div>
      </div>
    </div>

    <!-- MODAL -->
  <!-- MODAL -->
<Teleport to="body">
  <div
    v-if="modalOpen"
    class="admin-modal-overlay"
    @click.self="closeModal"
  >
    <form class="admin-modal" @submit.prevent="submitForm">
      <div class="admin-modal-head">
        <h2 class="admin-modal-title">
          <i class="fas fa-bullhorn"></i>
          {{ editingId ? "Edit" : "Add" }} {{ modalTypeLabel }}
        </h2>

        <button type="button" class="admin-icon-btn" @click="closeModal">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="admin-modal-body">
        <div class="admin-form-grid">
          <label class="admin-field" style="grid-column: 1 / -1;">
            <span>Title</span>
            <input v-model="form.title" class="admin-input" type="text" required />
          </label>

          <label
            v-if="formMode === 'announcements'"
            class="admin-field"
            style="grid-column: 1 / -1;"
          >
            <span>Body</span>
            <textarea
              v-model="form.body"
              class="admin-input"
              rows="4"
              required
              style="height: auto; padding-top: 10px; resize: vertical;"
            ></textarea>
          </label>

          <label
            v-if="formMode === 'alerts'"
            class="admin-field"
            style="grid-column: 1 / -1;"
          >
            <span>Meta / Message</span>
            <input
              v-model="form.meta"
              class="admin-input"
              type="text"
              placeholder="Route 5 · Estimated arrival: 3:15 PM"
              required
            />
          </label>

          <label v-if="formMode === 'announcements'" class="admin-field">
            <span>Type</span>
            <select v-model="form.type" class="admin-input">
              <option value="info">Info</option>
              <option value="holiday">Holiday</option>
              <option value="alert">Alert</option>
            </select>
          </label>

          <label v-if="formMode === 'alerts'" class="admin-field">
            <span>Severity</span>
            <select v-model="form.severity" class="admin-input">
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
            </select>
          </label>

          <label class="admin-field">
            <span>Starts At</span>
            <input v-model="form.starts_at" class="admin-input" type="datetime-local" />
          </label>

          <label class="admin-field">
            <span>Ends At</span>
            <input v-model="form.ends_at" class="admin-input" type="datetime-local" />
          </label>

          <label
            class="admin-field"
            style="grid-column: 1 / -1; flex-direction: row; align-items: center; gap: 10px;"
          >
            <input
              v-if="formMode === 'announcements'"
              v-model="form.is_published"
              type="checkbox"
              style="width: 16px; height: 16px;"
            />

            <input
              v-else
              v-model="form.is_active"
              type="checkbox"
              style="width: 16px; height: 16px;"
            />

            <span style="margin: 0;">
              {{ formMode === "announcements" ? "Published" : "Active" }}
            </span>
          </label>
        </div>
      </div>

      <div class="admin-modal-foot">
        <button type="button" class="admin-btn" @click="closeModal">
          Cancel
        </button>

        <button type="submit" class="admin-btn primary" :disabled="saving">
          <i v-if="saving" class="fas fa-circle-notch fa-spin"></i>
          <i v-else class="fas fa-save"></i>
          Save
        </button>
      </div>
    </form>
  </div>
</Teleport>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { useUpdates } from "@/composables/useUpdates";

const {
  tab,
  announcements,
  alerts,
  loading,
  saving,
  error,
  announcementCount,
  alertCount,
  loadAdminUpdates,
  saveAnnouncement,
  removeAnnouncement,
  saveAlert,
  removeAlert,
} = useUpdates();

const modalOpen = ref(false);
const formMode = ref("announcements");
const editingId = ref(null);

const form = reactive({
  title: "",
  body: "",
  meta: "",
  type: "info",
  severity: "info",
  is_published: true,
  is_active: true,
  starts_at: "",
  ends_at: "",
});

const modalTypeLabel = computed(() =>
  formMode.value === "announcements" ? "Announcement" : "Alert Ticker"
);

onMounted(loadAdminUpdates);

function resetForm() {
  form.title = "";
  form.body = "";
  form.meta = "";
  form.type = "info";
  form.severity = "info";
  form.is_published = true;
  form.is_active = true;
  form.starts_at = "";
  form.ends_at = "";
  editingId.value = null;
}

function openCreate() {
  resetForm();
  formMode.value = tab.value;
  modalOpen.value = true;
}

function openEditAnnouncement(item) {
  resetForm();

  formMode.value = "announcements";
  editingId.value = item.id;

  form.title = item.title || "";
  form.body = item.body || "";
  form.type = item.type || "info";
  form.is_published = Boolean(item.is_published);
  form.starts_at = toDatetimeLocal(item.starts_at);
  form.ends_at = toDatetimeLocal(item.ends_at);

  modalOpen.value = true;
}

function openEditAlert(item) {
  resetForm();

  formMode.value = "alerts";
  editingId.value = item.id;

  form.title = item.title || "";
  form.meta = item.meta || "";
  form.severity = item.severity || "info";
  form.is_active = Boolean(item.is_active);
  form.starts_at = toDatetimeLocal(item.starts_at);
  form.ends_at = toDatetimeLocal(item.ends_at);

  modalOpen.value = true;
}

function closeModal() {
  modalOpen.value = false;
  resetForm();
}

async function submitForm() {
  if (formMode.value === "announcements") {
    await saveAnnouncement(
      {
        title: form.title,
        body: form.body,
        type: form.type,
        is_published: form.is_published,
        starts_at: form.starts_at || null,
        ends_at: form.ends_at || null,
      },
      editingId.value
    );
  } else {
    await saveAlert(
      {
        title: form.title,
        meta: form.meta,
        severity: form.severity,
        is_active: form.is_active,
        starts_at: form.starts_at || null,
        ends_at: form.ends_at || null,
      },
      editingId.value
    );
  }

  closeModal();
}

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function toDatetimeLocal(value) {
  if (!value) return "";

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) return "";

  const pad = (n) => String(n).padStart(2, "0");

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}
</script>

<style scoped>
.updates-page {
  padding: 24px;
  color: #111827;
}

.updates-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.updates-head h1 {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
}

.updates-head p {
  margin: 4px 0 0;
  color: #6b7280;
  font-size: 13px;
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 18px;
  border-bottom: 1px solid #e5e7eb;
}

.tab-btn {
  border: none;
  background: transparent;
  padding: 10px 4px;
  margin-right: 16px;
  font-size: 13px;
  font-weight: 700;
  color: #6b7280;
  cursor: pointer;
  border-bottom: 2px solid transparent;
}

.tab-btn.active {
  color: #1E88E5;
  border-bottom-color: #1E88E5;
}

.tab-btn span {
  margin-left: 6px;
  font-size: 11px;
  background: #eff6ff;
  color: #1E88E5;
  padding: 2px 7px;
  border-radius: 999px;
}

.primary-btn {
  border: none;
  background: #1E88E5;
  color: white;
  height: 36px;
  padding: 0 14px;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.ghost-btn {
  border: 1px solid #e5e7eb;
  background: white;
  color: #374151;
  height: 36px;
  padding: 0 14px;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.state-text {
  color: #6b7280;
  font-size: 13px;
}

.state-text.error {
  color: #dc2626;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.row {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 14px;
  display: flex;
  justify-content: space-between;
  gap: 14px;
}

.row-main {
  min-width: 0;
}

.row-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 800;
  color: #111827;
}

.row p {
  margin: 5px 0 8px;
  font-size: 13px;
  color: #4b5563;
  line-height: 1.4;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.meta span {
  font-size: 11px;
  color: #6b7280;
  background: #f3f4f6;
  border-radius: 999px;
  padding: 3px 8px;
  text-transform: capitalize;
}

.row-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.row-actions button {
  width: 32px;
  height: 32px;
  border: 1px solid #e5e7eb;
  background: white;
  color: #374151;
  border-radius: 8px;
  cursor: pointer;
}

.row-actions button.danger {
  color: #dc2626;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.dot-info {
  background: #1E88E5;
}

.dot-holiday,
.dot-warning {
  background: #f59e0b;
}

.dot-alert,
.dot-error {
  background: #ef4444;
}

.empty {
  padding: 32px;
  text-align: center;
  color: #9ca3af;
  border: 1px dashed #d1d5db;
  border-radius: 12px;
  font-size: 13px;
}

label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  color: #374151;
  font-weight: 700;
  margin-bottom: 12px;
}

input,
textarea,
select {
  border: 1px solid #d1d5db;
  border-radius: 9px;
  padding: 9px 10px;
  font-size: 13px;
  outline: none;
  font-family: inherit;
}

input:focus,
textarea:focus,
select:focus {
  border-color: #1E88E5;
  box-shadow: 0 0 0 3px rgba(30, 136, 229, 0.12);
}


.check input {
  width: 15px;
  height: 15px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 14px;
}

@media (max-width: 640px) {
  .updates-page {
    padding: 16px;
  }

  .updates-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .two-col {
    grid-template-columns: 1fr;
  }

  .row {
    flex-direction: column;
  }

  .row-actions {
    justify-content: flex-end;
  }
}
</style>