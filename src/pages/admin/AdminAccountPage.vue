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
/* paste your existing AdminAccountPage CSS here */
/* your CSS is already good, no need to rewrite everything */

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
</style>