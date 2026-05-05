<template>
  <div class="ap">
    <div class="ap-header">
      <div>
        <div class="ap-title-row">
          <h1 class="ap-title">Admin Accounts</h1>
          <span class="ap-live-badge">
            <span class="ap-live-dot"></span>
            Live
          </span>
        </div>
        <p class="ap-subtitle">
          Account Management · Roles · Permissions · Access Control
        </p>
      </div>

      <div class="ap-header-actions">
        <div class="ap-search-box">
          <i class="fas fa-magnifying-glass ap-search-icon"></i>
          <input
            v-model="q"
            class="ap-search-input"
            type="text"
            placeholder="Search name, email, role…"
          />
          <button v-if="q" class="ap-search-clear" @click="q = ''">
            <i class="fas fa-xmark"></i>
          </button>
        </div>

        <button v-if="canManageAdmins" class="ap-btn-add" @click="openAdd">
          <i class="fas fa-plus"></i>
          Add Admin
        </button>
      </div>
    </div>

    <div v-if="loading" class="ap-loading">
      <i class="fas fa-spinner fa-spin"></i>
      Loading admin accounts...
    </div>

    <div v-else-if="error" class="ap-error-box">
      <i class="fas fa-circle-exclamation"></i>
      {{ error }}
    </div>

    <div v-else class="ap-layout">
      <aside class="ap-sidebar">
        <div class="ap-profile-card">
          <div class="ap-profile-top">
            <div class="ap-avatar-ring">
              <div class="ap-avatar ap-avatar--purple">
                {{ initials(currentAdmin?.name) }}
              </div>
              <span class="ap-online-ring"></span>
            </div>

            <div class="ap-profile-name">
              {{ currentAdmin?.name || "Admin" }}
            </div>

            <div class="ap-profile-email">
              {{ currentAdmin?.email || "—" }}
            </div>

            <span
              class="ap-role-chip"
              :class="`ap-role--${roleClass(currentAdmin?.role_key)}`"
            >
              <i class="fas" :class="roleIcon(currentAdmin?.role_key)"></i>
              {{ currentAdmin?.role || "—" }}
            </span>
          </div>

          <div class="ap-profile-divider"></div>

          <div class="ap-profile-stats">
            <div class="ap-pstat">
              <div class="ap-pstat-label">Status</div>
              <div class="ap-pstat-val">
                <span class="ap-status-chip ap-status-chip--on">
                  <span class="ap-status-dot"></span>
                  Online
                </span>
              </div>
            </div>

            <div class="ap-pstat">
              <div class="ap-pstat-label">Member Since</div>
              <div class="ap-pstat-val ap-pstat-val--text">
                {{ formatDate(currentAdmin?.created_at) }}
              </div>
            </div>

            <div class="ap-pstat">
              <div class="ap-pstat-label">Last Login</div>
              <div class="ap-pstat-val ap-pstat-val--text">
                {{ timeAgo(currentAdmin?.last_login_at) }}
              </div>
            </div>

            <div class="ap-pstat">
              <div class="ap-pstat-label">Access Level</div>
              <div class="ap-pstat-val ap-pstat-val--text">
                {{ permLabel(currentAdmin) }}
              </div>
            </div>
          </div>

          <div class="ap-profile-divider"></div>

          <button class="ap-btn-edit-me" @click="openEditSelf">
            <i class="fas fa-pen"></i>
            Edit My Profile
          </button>
        </div>
      </aside>

      <div class="ap-main">
        <div class="ap-filterbar">
          <div class="ap-filters">
            <button
              v-for="f in filters"
              :key="f.key"
              class="ap-pill"
              :class="{ 'ap-pill--active': filter === f.key }"
              @click="filter = f.key"
            >
              {{ f.label }}
              <span class="ap-pill-count">{{ countByFilter(f.key) }}</span>
            </button>
          </div>

          <div class="ap-sort-wrap">
            <span class="ap-sort-label">Sort</span>
            <select v-model="sortBy" class="ap-sort-select">
              <option value="name">Name</option>
              <option value="role">Role</option>
              <option value="created_at">Created</option>
              <option value="last_login_at">Last Login</option>
            </select>
          </div>
        </div>

        <div class="ap-table-wrap">
          <table class="ap-table">
            <thead>
              <tr>
                <th>Admin</th>
                <th>Role</th>
                <th>Status</th>
                <th>Permissions</th>
                <th>Created</th>
                <th>Last Login</th>
                <th v-if="canManageAdmins"></th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="a in filtered"
                :key="a.id"
                class="ap-row"
                :class="{ 'ap-row--me': a.id === currentAdmin?.id }"
              >
                <td>
                  <div class="ap-admin-cell">
                    <div
                      class="ap-avatar ap-avatar--sm"
                      :class="`ap-avatar--${roleClass(a.role_key)}`"
                    >
                      {{ initials(a.name) }}
                    </div>

                    <div>
                      <div class="ap-admin-name">
                        {{ a.name }}
                        <span v-if="a.id === currentAdmin?.id" class="ap-you-badge">
                          You
                        </span>
                      </div>
                      <div class="ap-admin-email">{{ a.email }}</div>
                    </div>
                  </div>
                </td>

                <td>
                  <span
                    class="ap-role-chip"
                    :class="`ap-role--${roleClass(a.role_key)}`"
                  >
                    <i class="fas" :class="roleIcon(a.role_key)"></i>
                    {{ a.role }}
                  </span>
                </td>

                <td>
                  <span class="ap-status-chip" :class="statusChipClass(a)">
                    <span class="ap-status-dot"></span>
                    {{ statusLabel(a) }}
                  </span>
                </td>

                <td>
                  <div class="ap-perm-chips">
                    <span
                      v-for="p in permChips(a)"
                      :key="p.label"
                      class="ap-perm-chip"
                      :class="p.cls"
                      :title="p.label"
                    >
                      <i class="fas" :class="p.icon"></i>
                    </span>
                  </div>
                </td>

                <td>
                  <div class="ap-cell-main">{{ formatDate(a.created_at) }}</div>
                  <div class="ap-cell-sub">{{ timeAgo(a.created_at) }}</div>
                </td>

                <td>
                  <div class="ap-cell-main">
                    {{ a.last_login_at ? timeAgo(a.last_login_at) : "—" }}
                  </div>
                  <div class="ap-cell-sub">
                    {{
                      a.last_login_at
                        ? formatDate(a.last_login_at)
                        : "Never logged in"
                    }}
                  </div>
                </td>

                <td v-if="canManageAdmins">
                  <div class="ap-actions">
                    <button
                      class="ap-btn-action ap-btn-action--edit"
                      title="Edit"
                      @click="openEdit(a)"
                    >
                      <i class="fas fa-pen"></i>
                    </button>

                    <button
                      class="ap-btn-action"
                      :class="
                        a.status === 'inactive'
                          ? 'ap-btn-action--activate'
                          : 'ap-btn-action--deactivate'
                      "
                      :disabled="a.id === currentAdmin?.id"
                      :title="
                        a.status === 'inactive' ? 'Activate' : 'Deactivate'
                      "
                      @click="toggleStatus(a)"
                    >
                      <i
                        class="fas"
                        :class="
                          a.status === 'inactive'
                            ? 'fa-toggle-off'
                            : 'fa-toggle-on'
                        "
                      ></i>
                    </button>

                    <button
                      class="ap-btn-action ap-btn-action--delete"
                      :disabled="a.id === currentAdmin?.id"
                      title="Delete"
                      @click="confirmDelete(a)"
                    >
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>

              <tr v-if="filtered.length === 0">
                <td :colspan="canManageAdmins ? 7 : 6">
                  <div class="ap-empty">
                    <i class="fas fa-users-slash"></i>
                    <p>No admins found</p>
                    <small>Try another filter or keyword</small>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="ap-table-footer">
          Showing {{ filtered.length }} of {{ adminAccounts.length }}
          admin{{ adminAccounts.length !== 1 ? "s" : "" }}
        </div>
      </div>
    </div>

    <Transition name="ap-modal">
      <div v-if="formModal.open" class="ap-overlay" @click.self="closeForm">
        <div class="ap-modal">
          <div class="ap-modal-head">
            <div>
              <div class="ap-modal-title">
                {{ formModal.isEdit ? "Edit Admin Account" : "Add New Admin" }}
              </div>
              <div class="ap-modal-sub">
                {{
                  formModal.isEdit
                    ? "Update account details and role"
                    : "Create a new administrator account"
                }}
              </div>
            </div>

            <button class="ap-modal-close" @click="closeForm">
              <i class="fas fa-xmark"></i>
            </button>
          </div>

          <div class="ap-modal-body">
            <div class="ap-form-row">
              <div class="ap-form-group">
                <label class="ap-label">Full Name</label>
                <input
                  v-model="form.name"
                  class="ap-input"
                  type="text"
                  placeholder="e.g. Juan Dela Cruz"
                />
              </div>

              <div class="ap-form-group">
                <label class="ap-label">Email Address</label>
                <input
                  v-model="form.email"
                  class="ap-input"
                  type="email"
                  placeholder="admin@example.com"
                />
              </div>
            </div>

            <div class="ap-form-row">
              <div class="ap-form-group">
                <label class="ap-label">
                  Password
                  <span v-if="formModal.isEdit">(optional)</span>
                </label>
                <input
                  v-model="form.password"
                  class="ap-input"
                  type="password"
                  :placeholder="
                    formModal.isEdit
                      ? 'Leave blank to keep current password'
                      : 'Temporary password'
                  "
                />
              </div>

              <div class="ap-form-group">
                <label class="ap-label">Confirm Password</label>
                <input
                  v-model="form.confirmPassword"
                  class="ap-input"
                  type="password"
                  placeholder="Repeat password"
                />
              </div>
            </div>

            <div class="ap-form-row">
              <div class="ap-form-group">
                <label class="ap-label">Role</label>
                <select v-model="form.role_id" class="ap-select">
                  <option value="" disabled>Select role…</option>
                  <option
                    v-for="r in adminRoles"
                    :key="r.role_id"
                    :value="r.role_id"
                  >
                    {{ r.role_name }}
                  </option>
                </select>
              </div>

              <div class="ap-form-group">
                <label class="ap-label">Status</label>
                <select v-model="form.status" class="ap-select">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div v-if="selectedRole" class="ap-role-preview">
              <div class="ap-role-preview-title">
                <i class="fas fa-shield-halved"></i>
                Permission preview for <strong>{{ selectedRole.role_name }}</strong>
              </div>

              <div class="ap-perm-list ap-perm-list--preview">
                <div
                  v-for="p in permChips(rolePreviewUser)"
                  :key="p.label"
                  class="ap-perm-row"
                  :class="p.cls"
                >
                  <i class="fas" :class="p.icon"></i>
                  <span>{{ p.label }}</span>
                  <i class="fas fa-check ap-perm-check"></i>
                </div>
              </div>
            </div>

            <div v-if="formError" class="ap-form-error">
              <i class="fas fa-circle-exclamation"></i>
              {{ formError }}
            </div>
          </div>

          <div class="ap-modal-foot">
            <button class="ap-btn-cancel" @click="closeForm">Cancel</button>

            <button class="ap-btn-submit" @click="submitForm">
              <i
                class="fas"
                :class="formModal.isEdit ? 'fa-floppy-disk' : 'fa-plus'"
              ></i>
              {{ formModal.isEdit ? "Save Changes" : "Create Account" }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="ap-modal">
      <div
        v-if="deleteTarget"
        class="ap-overlay"
        @click.self="deleteTarget = null"
      >
        <div class="ap-modal ap-modal--sm">
          <div class="ap-modal-head">
            <div class="ap-modal-title ap-modal-title--danger">
              <i class="fas fa-triangle-exclamation"></i>
              Delete Admin Account
            </div>

            <button class="ap-modal-close" @click="deleteTarget = null">
              <i class="fas fa-xmark"></i>
            </button>
          </div>

          <div class="ap-delete-body">
            <div class="ap-avatar ap-avatar--danger ap-avatar--lg">
              {{ initials(deleteTarget.name) }}
            </div>

            <p>You are about to permanently delete</p>
            <strong>{{ deleteTarget.name }}</strong>
            <p class="ap-delete-sub">
              {{ deleteTarget.email }} · {{ deleteTarget.role }}
            </p>
            <p class="ap-delete-warn">This action cannot be undone.</p>
          </div>

          <div class="ap-modal-foot">
            <button class="ap-btn-cancel" @click="deleteTarget = null">
              Cancel
            </button>

            <button class="ap-btn-delete" @click="doDelete">
              <i class="fas fa-trash"></i>
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="ap-toast">
      <div v-if="toast.show" class="ap-toast" :class="`ap-toast--${toast.type}`">
        <i
          class="fas"
          :class="
            toast.type === 'success'
              ? 'fa-circle-check'
              : 'fa-circle-exclamation'
          "
        ></i>
        {{ toast.msg }}
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { useAdminAccounts } from "@/composables/useAdminAccounts";

const {
  loading,
  error,
  currentAdmin,
  adminAccounts,
  adminRoles,
  canManageAdmins,
  loadAdminAccountPage,
  createAdmin,
  updateAdmin,
  changeAdminStatus,
  removeAdmin,
} = useAdminAccounts();

const q = ref("");
const filter = ref("all");
const sortBy = ref("name");

const filters = [
  { key: "all", label: "All" },
  { key: "online", label: "Online" },
  { key: "active", label: "Active" },
  { key: "inactive", label: "Inactive" },
  { key: "managers", label: "Managers" },
];

const formModal = reactive({
  open: false,
  isEdit: false,
  targetId: null,
});

const form = reactive({
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  role_id: "",
  status: "active",
});

const formError = ref("");
const deleteTarget = ref(null);

const toast = reactive({
  show: false,
  msg: "",
  type: "success",
});

let toastTimer = null;

const selectedRole = computed(() => {
  return adminRoles.value.find(
    (r) => Number(r.role_id) === Number(form.role_id)
  );
});

const rolePreviewUser = computed(() => {
  if (!selectedRole.value) return null;

  return {
    permissions: {
      can_manage_admins: Boolean(selectedRole.value.can_manage_admins),
      can_view_dashboard: Boolean(selectedRole.value.can_view_dashboard),
      can_manage_buses: Boolean(selectedRole.value.can_manage_buses),
      can_manage_devices: Boolean(selectedRole.value.can_manage_devices),
      can_manage_routes: Boolean(selectedRole.value.can_manage_routes),
      can_manage_fares: Boolean(selectedRole.value.can_manage_fares),
      can_manage_announcements: Boolean(
        selectedRole.value.can_manage_announcements
      ),
    },
  };
});

const filtered = computed(() => {
  const kw = q.value.toLowerCase();

  return adminAccounts.value
    .filter((a) =>
      [a.name, a.email, a.role, a.role_key]
        .join(" ")
        .toLowerCase()
        .includes(kw)
    )
    .filter((a) => {
      if (filter.value === "active") return a.status === "active";
      if (filter.value === "inactive") return a.status === "inactive";
      if (filter.value === "online") return isOnline(a);
      if (filter.value === "managers") {
        return ["head_manager", "grand_manager"].includes(a.role_key);
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy.value === "role") {
        return String(a.role || "").localeCompare(String(b.role || ""));
      }

      if (sortBy.value === "created_at" || sortBy.value === "last_login_at") {
        return new Date(b[sortBy.value] || 0) - new Date(a[sortBy.value] || 0);
      }

      return String(a[sortBy.value] || "").localeCompare(
        String(b[sortBy.value] || "")
      );
    });
});

function openAdd() {
  if (!canManageAdmins.value) return;

  Object.assign(form, {
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role_id: "",
    status: "active",
  });

  formError.value = "";

  Object.assign(formModal, {
    open: true,
    isEdit: false,
    targetId: null,
  });
}

function openEdit(a) {
  if (!canManageAdmins.value) return;

  Object.assign(form, {
    name: a.name,
    email: a.email,
    password: "",
    confirmPassword: "",
    role_id: a.role_id,
    status: a.status,
  });

  formError.value = "";

  Object.assign(formModal, {
    open: true,
    isEdit: true,
    targetId: a.id,
  });
}

function openEditSelf() {
  if (!currentAdmin.value) return;

  Object.assign(form, {
    name: currentAdmin.value.name,
    email: currentAdmin.value.email,
    password: "",
    confirmPassword: "",
    role_id: currentAdmin.value.role_id,
    status: currentAdmin.value.status,
  });

  formError.value = "";

  Object.assign(formModal, {
    open: true,
    isEdit: true,
    targetId: currentAdmin.value.id,
  });
}

function closeForm() {
  formModal.open = false;
}

async function submitForm() {
  formError.value = "";

  if (!form.name.trim()) {
    formError.value = "Name is required.";
    return;
  }

  if (!form.email.trim()) {
    formError.value = "Email is required.";
    return;
  }

  if (!form.role_id) {
    formError.value = "Please select a role.";
    return;
  }

  if (!formModal.isEdit && !form.password) {
    formError.value = "Password is required.";
    return;
  }

  if (form.password && form.password.length < 6) {
    formError.value = "Password must be at least 6 characters.";
    return;
  }

  if (form.password && form.password !== form.confirmPassword) {
    formError.value = "Passwords do not match.";
    return;
  }

  try {
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      role_id: Number(form.role_id),
      status: form.status,
    };

    if (form.password) {
      payload.password = form.password;
    }

    if (formModal.isEdit) {
      await updateAdmin(formModal.targetId, payload);
      showToast("Account updated successfully.", "success");
    } else {
      await createAdmin({
        ...payload,
        password: form.password,
      });
      showToast("New admin account created.", "success");
    }

    closeForm();
  } catch (err) {
    formError.value =
      err?.response?.data?.message || "Failed to save admin account.";
  }
}

async function toggleStatus(a) {
  if (!canManageAdmins.value) return;

  if (a.id === currentAdmin.value?.id) {
    showToast("You cannot deactivate your own account.", "error");
    return;
  }

  try {
    const nextStatus = a.status === "inactive" ? "active" : "inactive";
    await changeAdminStatus(a.id, nextStatus);

    showToast(
      `Account ${nextStatus === "active" ? "activated" : "deactivated"}.`,
      "success"
    );
  } catch (err) {
    showToast(
      err?.response?.data?.message || "Failed to update account status.",
      "error"
    );
  }
}

function confirmDelete(a) {
  if (!canManageAdmins.value) return;

  if (a.id === currentAdmin.value?.id) {
    showToast("You cannot delete your own account.", "error");
    return;
  }

  deleteTarget.value = a;
}

async function doDelete() {
  if (!deleteTarget.value) return;

  try {
    await removeAdmin(deleteTarget.value.id);
    deleteTarget.value = null;
    showToast("Account deleted.", "success");
  } catch (err) {
    showToast(
      err?.response?.data?.message || "Failed to delete account.",
      "error"
    );
  }
}

function isOnline(user) {
  if (!user?.last_login_at || user.status === "inactive") return false;

  const diff = Date.now() - new Date(user.last_login_at).getTime();
  return diff <= 10 * 60 * 1000;
}

function statusLabel(user) {
  if (user.status === "inactive") return "Inactive";
  if (isOnline(user)) return "Online";
  return "Active";
}

function statusChipClass(user) {
  if (user.status === "inactive") return "ap-status-chip--off";
  if (isOnline(user)) return "ap-status-chip--on";
  return "ap-status-chip--active";
}

function countByFilter(key) {
  if (key === "all") return adminAccounts.value.length;
  if (key === "online") return adminAccounts.value.filter(isOnline).length;
  if (key === "active") {
    return adminAccounts.value.filter((a) => a.status === "active").length;
  }
  if (key === "inactive") {
    return adminAccounts.value.filter((a) => a.status === "inactive").length;
  }
  if (key === "managers") {
    return adminAccounts.value.filter((a) =>
      ["head_manager", "grand_manager"].includes(a.role_key)
    ).length;
  }

  return 0;
}

function timeAgo(d) {
  if (!d) return "—";

  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);

  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;

  return `${Math.floor(s / 86400)}d ago`;
}

function formatDate(d) {
  if (!d) return "—";

  return new Date(d).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function initials(name) {
  return (name || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function roleClass(roleKeyOrName) {
  const r = String(roleKeyOrName || "").toLowerCase();

  if (r.includes("head")) return "purple";
  if (r.includes("grand")) return "blue";
  if (r.includes("secretary")) return "amber";
  if (r.includes("staff")) return "slate";

  return "slate";
}

function roleIcon(roleKeyOrName) {
  const r = String(roleKeyOrName || "").toLowerCase();

  if (r.includes("head")) return "fa-crown";
  if (r.includes("grand")) return "fa-shield-halved";
  if (r.includes("secretary")) return "fa-briefcase";
  if (r.includes("staff")) return "fa-user";

  return "fa-user";
}

function permLabel(user) {
  if (user?.permissions?.can_manage_admins) return "Full Access";
  if (user?.permissions?.can_manage_buses || user?.permissions?.can_manage_devices) {
    return "Operations Access";
  }
  if (user?.permissions?.can_manage_fares || user?.permissions?.can_manage_announcements) {
    return "Limited Access";
  }

  return "View Only";
}

function permChips(user) {
  const p = user?.permissions || {};
  const chips = [];

  if (p.can_view_dashboard || user) {
    chips.push({
      label: "View",
      icon: "fa-eye",
      cls: "ap-perm-chip--ok",
    });
  }

  if (p.can_manage_fares) {
    chips.push({
      label: "Fares",
      icon: "fa-ticket",
      cls: "ap-perm-chip--blue",
    });
  }

  if (p.can_manage_buses || p.can_manage_devices || p.can_manage_routes) {
    chips.push({
      label: "Operations",
      icon: "fa-bus",
      cls: "ap-perm-chip--amber",
    });
  }

  if (p.can_manage_admins) {
    chips.push({
      label: "Manage Admins",
      icon: "fa-users-gear",
      cls: "ap-perm-chip--purple",
    });
  }

  return chips;
}

function showToast(msg, type = "success") {
  clearTimeout(toastTimer);

  Object.assign(toast, {
    show: true,
    msg,
    type,
  });

  toastTimer = setTimeout(() => {
    toast.show = false;
  }, 3000);
}

onMounted(async () => {
  try {
    await loadAdminAccountPage();
  } catch {}
});
</script>

<style scoped>
.ap {
  --green: #10b981;
  --amber: #f59e0b;
  --red: #ef4444;
  --blue: #3b82f6;
  --teal: #14b8a6;
  --purple: #8b5cf6;
  --slate: #64748b;
  --border: rgba(226, 232, 240, 1);
  --bg: #f8fafc;
  --card: #ffffff;
  --text: #0f172a;
  --muted: #64748b;
  --radius: 14px;

  font-family: "DM Sans", "Segoe UI", sans-serif;
  background: var(--bg);
  padding: 24px;
  min-height: 100vh;
  color: var(--text);
}

.ap-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.ap-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.ap-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ap-title {
  font-size: 22px;
  font-weight: 800;
  margin: 0;
  letter-spacing: -0.5px;
}

.ap-subtitle {
  font-size: 12px;
  color: var(--muted);
  margin: 4px 0 0;
}

.ap-live-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 999px;
  background: rgba(16, 185, 129, 0.1);
  color: var(--green);
}

.ap-live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  animation: pulse 1.4s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }

  50% {
    opacity: 0.4;
    transform: scale(0.8);
  }
}

.ap-search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 8px 12px;
  min-width: 230px;
}

.ap-search-icon {
  color: var(--muted);
  font-size: 13px;
}

.ap-search-input {
  border: none;
  outline: none;
  background: transparent;
  font-size: 13px;
  flex: 1;
  color: var(--text);
}

.ap-search-clear {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--muted);
  padding: 0;
}

.ap-btn-add {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 18px;
  border-radius: 10px;
  border: none;
  background: var(--text);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 0.15s;
}

.ap-btn-add:hover {
  opacity: 0.85;
}

.ap-loading,
.ap-error-box {
  background: #fff;
  border: 1px solid rgba(226, 232, 240, 1);
  border-radius: 14px;
  padding: 18px;
  font-size: 13px;
  font-weight: 700;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 10px;
}

.ap-error-box {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.06);
  border-color: rgba(239, 68, 68, 0.2);
}

.ap-layout {
  display: grid;
  grid-template-columns: 256px 1fr;
  gap: 20px;
  align-items: start;
}

.ap-sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ap-profile-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}

.ap-profile-top {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 28px 20px 20px;
  gap: 6px;
  background: linear-gradient(160deg, rgba(139, 92, 246, 0.06) 0%, transparent 70%);
}

.ap-avatar-ring {
  position: relative;
  margin-bottom: 4px;
}

.ap-online-ring {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--green);
  border: 2px solid var(--card);
}

.ap-avatar {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 900;
  flex-shrink: 0;
  letter-spacing: -0.5px;
}

.ap-avatar--sm {
  width: 36px;
  height: 36px;
  font-size: 12px;
  border-radius: 10px;
}

.ap-avatar--lg {
  width: 56px;
  height: 56px;
  font-size: 18px;
  border-radius: 16px;
}

.ap-avatar--purple {
  background: rgba(139, 92, 246, 0.12);
  color: var(--purple);
}

.ap-avatar--blue {
  background: rgba(59, 130, 246, 0.12);
  color: var(--blue);
}

.ap-avatar--teal {
  background: rgba(20, 184, 166, 0.12);
  color: var(--teal);
}

.ap-avatar--amber {
  background: rgba(245, 158, 11, 0.12);
  color: var(--amber);
}

.ap-avatar--slate {
  background: rgba(100, 116, 139, 0.1);
  color: var(--slate);
}

.ap-avatar--danger {
  background: rgba(239, 68, 68, 0.1);
  color: var(--red);
}

.ap-profile-name {
  font-size: 15px;
  font-weight: 800;
  letter-spacing: -0.3px;
  text-align: center;
}

.ap-profile-email {
  font-size: 11px;
  color: var(--muted);
  text-align: center;
  font-family: monospace;
}

.ap-profile-divider {
  height: 1px;
  background: var(--border);
}

.ap-profile-stats {
  display: flex;
  flex-direction: column;
}

.ap-pstat {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.5);
}

.ap-pstat:last-child {
  border-bottom: none;
}

.ap-pstat-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--muted);
}

.ap-pstat-val {
  display: flex;
  align-items: center;
}

.ap-pstat-val--text {
  font-size: 11px;
  font-weight: 700;
  color: var(--text);
}

.ap-btn-edit-me {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  width: 100%;
  padding: 12px;
  border: none;
  border-top: 1px solid var(--border);
  background: transparent;
  font-size: 12px;
  font-weight: 700;
  color: var(--muted);
  cursor: pointer;
  transition: all 0.15s;
}

.ap-btn-edit-me:hover {
  background: var(--bg);
  color: var(--text);
}

.ap-main {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ap-filterbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.ap-filters {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.ap-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 13px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--card);
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
  cursor: pointer;
  transition: all 0.15s;
}

.ap-pill:hover {
  border-color: #94a3b8;
  color: var(--text);
}

.ap-pill--active {
  background: var(--text);
  border-color: var(--text);
  color: #fff;
}

.ap-pill-count {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 999px;
  padding: 1px 6px;
  font-size: 10px;
}

.ap-pill:not(.ap-pill--active) .ap-pill-count {
  background: var(--bg);
  color: var(--muted);
}

.ap-sort-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.ap-sort-label {
  font-size: 12px;
  color: var(--muted);
  font-weight: 600;
}

.ap-sort-select {
  padding: 6px 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 12px;
  background: var(--card);
  color: var(--text);
  outline: none;
  font-family: inherit;
  cursor: pointer;
}

.ap-table-wrap {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}

.ap-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.ap-table thead th {
  padding: 11px 14px;
  text-align: left;
  font-size: 11px;
  font-weight: 700;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: #f8fafc;
  border-bottom: 1px solid var(--border);
}

.ap-row {
  border-bottom: 1px solid rgba(226, 232, 240, 0.6);
  transition: background 0.12s;
}

.ap-row:last-child {
  border-bottom: none;
}

.ap-row:hover {
  background: #f8fafc;
}

.ap-row--me {
  background: rgba(139, 92, 246, 0.03);
}

.ap-table td {
  padding: 11px 14px;
  vertical-align: middle;
}

.ap-admin-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ap-admin-name {
  font-weight: 700;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.ap-admin-email {
  font-size: 11px;
  color: var(--muted);
  margin-top: 2px;
  font-family: monospace;
}

.ap-you-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 7px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  background: rgba(139, 92, 246, 0.1);
  color: var(--purple);
}

.ap-role-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

.ap-role--purple {
  background: rgba(139, 92, 246, 0.1);
  color: var(--purple);
}

.ap-role--blue {
  background: rgba(59, 130, 246, 0.1);
  color: var(--blue);
}

.ap-role--teal {
  background: rgba(20, 184, 166, 0.1);
  color: var(--teal);
}

.ap-role--amber {
  background: rgba(245, 158, 11, 0.1);
  color: var(--amber);
}

.ap-role--slate {
  background: rgba(100, 116, 139, 0.1);
  color: var(--slate);
}

.ap-status-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
}

.ap-status-chip--on {
  background: rgba(16, 185, 129, 0.1);
  color: var(--green);
}

.ap-status-chip--active {
  background: rgba(59, 130, 246, 0.08);
  color: var(--blue);
}

.ap-status-chip--off {
  background: rgba(239, 68, 68, 0.08);
  color: var(--red);
}

.ap-status-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
}

.ap-status-chip--on .ap-status-dot {
  animation: pulse 1.4s ease-in-out infinite;
}

.ap-perm-chips {
  display: flex;
  gap: 4px;
}

.ap-perm-chip {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
}

.ap-perm-chip--ok {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
}

.ap-perm-chip--blue {
  background: rgba(59, 130, 246, 0.1);
  color: #2563eb;
}

.ap-perm-chip--amber {
  background: rgba(245, 158, 11, 0.1);
  color: #d97706;
}

.ap-perm-chip--purple {
  background: rgba(139, 92, 246, 0.1);
  color: #7c3aed;
}

.ap-cell-main {
  font-size: 12px;
  font-weight: 600;
}

.ap-cell-sub {
  font-size: 11px;
  color: var(--muted);
  margin-top: 2px;
}

.ap-actions {
  display: flex;
  gap: 4px;
}

.ap-btn-action {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  border: 1px solid var(--border);
  background: var(--card);
  cursor: pointer;
  color: var(--muted);
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.ap-btn-action:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.ap-btn-action--edit:not(:disabled):hover {
  background: var(--blue);
  color: #fff;
  border-color: var(--blue);
}

.ap-btn-action--deactivate:not(:disabled):hover {
  background: var(--amber);
  color: #fff;
  border-color: var(--amber);
}

.ap-btn-action--activate:not(:disabled):hover {
  background: var(--green);
  color: #fff;
  border-color: var(--green);
}

.ap-btn-action--delete:not(:disabled):hover {
  background: var(--red);
  color: #fff;
  border-color: var(--red);
}

.ap-table-footer {
  font-size: 12px;
  color: var(--muted);
  padding: 4px 2px;
  font-weight: 600;
}

.ap-empty {
  padding: 48px;
  text-align: center;
  color: var(--muted);
}

.ap-empty i {
  font-size: 32px;
  margin-bottom: 12px;
  display: block;
}

.ap-empty p {
  font-weight: 700;
  margin: 0 0 4px;
  color: var(--text);
}

.ap-empty small {
  font-size: 12px;
}

.ap-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  padding: 20px;
}

.ap-modal {
  background: var(--card);
  border-radius: 20px;
  width: min(640px, 100%);
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.18);
}

.ap-modal--sm {
  width: min(420px, 100%);
}

.ap-modal-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 24px 24px 0;
  gap: 16px;
}

.ap-modal-title {
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.ap-modal-title--danger {
  color: var(--red);
}

.ap-modal-sub {
  font-size: 12px;
  color: var(--muted);
  margin-top: 3px;
}

.ap-modal-close {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: none;
  cursor: pointer;
  color: var(--muted);
  font-size: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.15s;
}

.ap-modal-close:hover {
  background: var(--red);
  color: #fff;
  border-color: var(--red);
}

.ap-modal-body {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ap-form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.ap-form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ap-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.ap-input,
.ap-select {
  padding: 9px 12px;
  border: 1px solid var(--border);
  border-radius: 9px;
  font-size: 13px;
  background: var(--bg);
  color: var(--text);
  outline: none;
  font-family: inherit;
  transition: border-color 0.15s;
}

.ap-input:focus,
.ap-select:focus {
  border-color: #94a3b8;
}

.ap-role-preview {
  padding: 12px 14px;
  background: var(--bg);
  border-radius: 10px;
  border: 1px solid var(--border);
}

.ap-role-preview-title {
  font-size: 11px;
  font-weight: 700;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.ap-perm-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ap-perm-list--preview {
  margin-top: 8px;
}

.ap-perm-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
}

.ap-perm-row .fas {
  font-size: 11px;
  width: 14px;
  text-align: center;
}

.ap-perm-check {
  margin-left: auto;
  font-size: 10px;
}

.ap-perm-row.ap-perm-chip--ok {
  background: rgba(16, 185, 129, 0.08);
  color: #059669;
}

.ap-perm-row.ap-perm-chip--blue {
  background: rgba(59, 130, 246, 0.08);
  color: #2563eb;
}

.ap-perm-row.ap-perm-chip--amber {
  background: rgba(245, 158, 11, 0.08);
  color: #d97706;
}

.ap-perm-row.ap-perm-chip--purple {
  background: rgba(139, 92, 246, 0.08);
  color: #7c3aed;
}

.ap-form-error {
  padding: 10px 14px;
  background: rgba(239, 68, 68, 0.06);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 9px;
  font-size: 12px;
  color: var(--red);
  display: flex;
  align-items: center;
  gap: 7px;
}

.ap-modal-foot {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px;
  border-top: 1px solid var(--border);
}

.ap-btn-cancel {
  padding: 9px 18px;
  border-radius: 9px;
  border: 1px solid var(--border);
  background: var(--card);
  font-size: 13px;
  font-weight: 700;
  color: var(--muted);
  cursor: pointer;
  transition: all 0.15s;
}

.ap-btn-cancel:hover {
  background: var(--bg);
}

.ap-btn-submit {
  padding: 9px 20px;
  border-radius: 9px;
  border: none;
  background: var(--text);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  transition: opacity 0.15s;
}

.ap-btn-submit:hover {
  opacity: 0.85;
}

.ap-btn-delete {
  padding: 9px 20px;
  border-radius: 9px;
  border: none;
  background: var(--red);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  transition: opacity 0.15s;
}

.ap-btn-delete:hover {
  opacity: 0.85;
}

.ap-delete-body {
  padding: 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.ap-delete-body p {
  margin: 0;
  font-size: 13px;
  color: var(--muted);
}

.ap-delete-body strong {
  font-size: 16px;
  font-weight: 800;
  color: var(--text);
}

.ap-delete-sub {
  font-size: 12px;
  color: var(--muted) !important;
}

.ap-delete-warn {
  font-size: 12px;
  color: var(--red) !important;
  font-weight: 700;
}

.ap-toast {
  position: fixed;
  bottom: 28px;
  right: 28px;
  padding: 12px 18px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 1001;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.ap-toast--success {
  background: var(--green);
  color: #fff;
}

.ap-toast--error {
  background: var(--red);
  color: #fff;
}

.ap-modal-enter-active,
.ap-modal-leave-active {
  transition: all 0.2s ease;
}

.ap-modal-enter-from,
.ap-modal-leave-to {
  opacity: 0;
  transform: scale(0.97) translateY(8px);
}

.ap-toast-enter-active,
.ap-toast-leave-active {
  transition: all 0.25s ease;
}

.ap-toast-enter-from,
.ap-toast-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

@media (max-width: 900px) {
  .ap-layout {
    grid-template-columns: 1fr;
  }

  .ap-sidebar {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
}

@media (max-width: 600px) {
  .ap {
    padding: 14px;
  }

  .ap-sidebar {
    grid-template-columns: 1fr;
  }

  .ap-form-row {
    grid-template-columns: 1fr;
  }

  .ap-header-actions,
  .ap-search-box {
    width: 100%;
  }

  .ap-search-box {
    min-width: 0;
  }
}
</style>