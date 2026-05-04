<!-- src/pages/admin/SettingsPage.vue -->
<template>
  <div class="settings-page">
    <!-- Header -->
    <div class="settings-header">
      <div>
        <h1>Settings</h1>
        <p>Manage basic admin account and system preferences.</p>
      </div>

      <button class="btn-primary" :disabled="saving" @click="saveAll">
        <i class="fas" :class="saving ? 'fa-circle-notch fa-spin' : 'fa-check'"></i>
        {{ saving ? "Saving..." : "Save Changes" }}
      </button>
    </div>

    <!-- Tabs -->
    <div class="settings-tabs">
      <button
        v-for="section in sections"
        :key="section.key"
        class="settings-tab"
        :class="{ active: activeSection === section.key }"
        @click="activeSection = section.key"
      >
        <i :class="section.icon"></i>
        <span>{{ section.label }}</span>
      </button>
    </div>

    <!-- Content -->
    <div class="settings-card">
      <!-- Account -->
      <section v-if="activeSection === 'account'">
        <div class="section-head">
          <div>
            <h2>Account</h2>
            <p>Basic admin profile information.</p>
          </div>
        </div>

        <div class="profile-summary">
          <div class="avatar">
            {{ initials }}
          </div>

          <div>
            <h3>{{ form.account.full_name || "Admin User" }}</h3>
            <p>{{ form.account.email || "No email set" }}</p>
            <span class="role-badge">
              <i class="fas fa-user-shield"></i>
              {{ roleLabel }}
            </span>
          </div>
        </div>

        <div class="form-grid">
          <div class="field">
            <label>Full Name</label>
            <input
              v-model="form.account.full_name"
              type="text"
              placeholder="Enter full name"
            />
          </div>

          <div class="field">
            <label>Username</label>
            <input
              v-model="form.account.username"
              type="text"
              placeholder="Enter username"
            />
          </div>

          <div class="field">
            <label>Email Address</label>
            <input
              v-model="form.account.email"
              type="email"
              placeholder="Enter email address"
            />
          </div>

          <div class="field">
            <label>Phone Number</label>
            <input
              v-model="form.account.phone"
              type="text"
              placeholder="Enter phone number"
            />
          </div>
        </div>
      </section>

      <!-- Security -->
      <section v-if="activeSection === 'security'">
        <div class="section-head">
          <div>
            <h2>Security</h2>
            <p>Update your admin password.</p>
          </div>
        </div>

        <div class="form-grid">
          <div class="field full">
            <label>Current Password</label>
            <div class="password-field">
              <input
                v-model="form.security.current_password"
                :type="showPassword.current ? 'text' : 'password'"
                placeholder="Enter current password"
              />
              <button type="button" @click="showPassword.current = !showPassword.current">
                <i class="fas" :class="showPassword.current ? 'fa-eye-slash' : 'fa-eye'"></i>
              </button>
            </div>
          </div>

          <div class="field">
            <label>New Password</label>
            <div class="password-field">
              <input
                v-model="form.security.new_password"
                :type="showPassword.new ? 'text' : 'password'"
                placeholder="Enter new password"
              />
              <button type="button" @click="showPassword.new = !showPassword.new">
                <i class="fas" :class="showPassword.new ? 'fa-eye-slash' : 'fa-eye'"></i>
              </button>
            </div>
          </div>

          <div class="field">
            <label>Confirm Password</label>
            <div class="password-field">
              <input
                v-model="form.security.confirm_password"
                :type="showPassword.confirm ? 'text' : 'password'"
                placeholder="Confirm new password"
              />
              <button type="button" @click="showPassword.confirm = !showPassword.confirm">
                <i class="fas" :class="showPassword.confirm ? 'fa-eye-slash' : 'fa-eye'"></i>
              </button>
            </div>
          </div>
        </div>

        <div v-if="form.security.new_password" class="password-strength">
          <div class="strength-bars">
            <span
              v-for="i in 4"
              :key="i"
              :class="{ filled: passwordStrength.score >= i }"
            ></span>
          </div>
          <p>{{ passwordStrength.label }}</p>
        </div>

        <button class="btn-primary small" @click="changePassword">
          <i class="fas fa-key"></i>
          Update Password
        </button>
      </section>

      <!-- Notifications -->
      <section v-if="activeSection === 'notifications'">
        <div class="section-head">
          <div>
            <h2>Notifications</h2>
            <p>Choose which admin alerts should appear in the dashboard.</p>
          </div>
        </div>

        <div class="setting-list">
          <div
            v-for="item in notificationSettings"
            :key="item.key"
            class="setting-row"
          >
            <div class="setting-left">
              <div class="setting-icon">
                <i :class="item.icon"></i>
              </div>

              <div>
                <h3>{{ item.label }}</h3>
                <p>{{ item.desc }}</p>
              </div>
            </div>

            <label class="toggle">
              <input v-model="form.notifications[item.key]" type="checkbox" />
              <span></span>
            </label>
          </div>
        </div>
      </section>

      <!-- System -->

    </div>

    <!-- Bottom save bar -->
    <div class="save-bar">
      <button class="btn-ghost" @click="resetForm">
        <i class="fas fa-rotate-left"></i>
        Reset
      </button>

      <button class="btn-primary" :disabled="saving" @click="saveAll">
        <i class="fas" :class="saving ? 'fa-circle-notch fa-spin' : 'fa-check'"></i>
        {{ saving ? "Saving..." : "Save Changes" }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from "vue";

const activeSection = ref("account");
const saving = ref(false);

const sections = [
  {
    key: "account",
    label: "Account",
    icon: "fas fa-user",
  },
  {
    key: "security",
    label: "Security",
    icon: "fas fa-shield-halved",
  },
  {
    key: "notifications",
    label: "Notifications",
    icon: "fas fa-bell",
  },

];

const defaultForm = {
  account: {
    id: 1,
    full_name: "Juan dela Cruz",
    username: "juandc",
    email: "admin@bustrack.ph",
    phone: "+63 912 345 6789",
    role: "admin",
  },

  security: {
    current_password: "",
    new_password: "",
    confirm_password: "",
  },

  notifications: {
    critical_alerts: true,
    device_alerts: true,
    gps_alerts: true,
    bus_full_alerts: true,
  },

  system: {
    default_capacity: 45,
    occupancy_warning: 80,
    device_offline_timeout: 120,
    terminal_arrival_range: 60,
  },
};

const form = reactive(clone(defaultForm));

const showPassword = reactive({
  current: false,
  new: false,
  confirm: false,
});

const notificationSettings = [
  {
    key: "critical_alerts",
    label: "Critical Alerts",
    desc: "System errors and urgent operational alerts.",
    icon: "fas fa-triangle-exclamation",
  },
  {
    key: "device_alerts",
    label: "Device Alerts",
    desc: "Offline devices and sensor-related warnings.",
    icon: "fas fa-microchip",
  },
  {
    key: "gps_alerts",
    label: "GPS Alerts",
    desc: "GPS disconnected, searching, or location issues.",
    icon: "fas fa-location-dot",
  },
  {
    key: "bus_full_alerts",
    label: "Bus Full Alerts",
    desc: "Notify admins when a bus reaches high occupancy.",
    icon: "fas fa-bus",
  },
];

const initials = computed(() => {
  const name = form.account.full_name || "Admin User";
  const parts = name.trim().split(" ").filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return parts[0]?.[0]?.toUpperCase() || "A";
});

const roleLabel = computed(() => {
  const labels = {
    super_admin: "Super Admin",
    admin: "Admin",
    operator: "Operator",
    viewer: "Viewer",
  };

  return labels[form.account.role] || "Admin";
});

const passwordStrength = computed(() => {
  const password = form.security.new_password;

  if (!password) {
    return {
      score: 0,
      label: "",
    };
  }

  let score = 0;

  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const labels = {
    1: "Weak password",
    2: "Fair password",
    3: "Good password",
    4: "Strong password",
  };

  return {
    score,
    label: labels[score] || "Weak password",
  };
});

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function resetForm() {
  Object.assign(form.account, clone(defaultForm.account));
  Object.assign(form.security, clone(defaultForm.security));
  Object.assign(form.notifications, clone(defaultForm.notifications));
  Object.assign(form.system, clone(defaultForm.system));
}

function changePassword() {
  if (!form.security.current_password) {
    alert("Please enter your current password.");
    return;
  }

  if (!form.security.new_password) {
    alert("Please enter a new password.");
    return;
  }

  if (form.security.new_password !== form.security.confirm_password) {
    alert("New password and confirm password do not match.");
    return;
  }

  alert("Password updated successfully.");

  form.security.current_password = "";
  form.security.new_password = "";
  form.security.confirm_password = "";
}

async function saveAll() {
  saving.value = true;

  try {
    // Replace this with your API request later.
    // Example:
    // await updateAdminSettings(form)

    await new Promise((resolve) => setTimeout(resolve, 700));
    alert("Settings saved successfully.");
  } catch (error) {
    console.error("saveAll error:", error);
    alert("Failed to save settings.");
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.settings-page {
  --bg: #f8fafc;
  --card: #ffffff;
  --text: #0f172a;
  --muted: #64748b;
  --border: #e2e8f0;
  --soft: #f1f5f9;
  --green: #10b981;
  --red: #ef4444;
  --blue: #3b82f6;

  min-height: 100vh;
  padding: 24px;
  background: var(--bg);
  color: var(--text);
  font-family: "DM Sans", "Segoe UI", sans-serif;
}

/* Header */
.settings-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.settings-header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.5px;
}

.settings-header p {
  margin: 5px 0 0;
  font-size: 13px;
  color: var(--muted);
}

/* Tabs */
.settings-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.settings-tab {
  height: 38px;
  padding: 0 14px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--card);
  color: var(--muted);
  font-size: 13px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: 0.15s ease;
}

.settings-tab:hover {
  border-color: #cbd5e1;
  color: var(--text);
}

.settings-tab.active {
  background: var(--text);
  color: #ffffff;
  border-color: var(--text);
}

/* Card */
.settings-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 18px;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.section-head h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.3px;
}

.section-head p {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--muted);
}

/* Profile */
.profile-summary {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--bg);
  margin-bottom: 16px;
}

.avatar {
  width: 54px;
  height: 54px;
  border-radius: 14px;
  background: var(--text);
  color: #ffffff;
  display: grid;
  place-items: center;
  font-size: 18px;
  font-weight: 900;
  flex-shrink: 0;
}

.profile-summary h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 800;
}

.profile-summary p {
  margin: 3px 0 7px;
  font-size: 12px;
  color: var(--muted);
  font-weight: 600;
}

.role-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 24px;
  padding: 0 9px;
  border-radius: 999px;
  background: #e0f2fe;
  color: #075985;
  font-size: 11px;
  font-weight: 800;
}

/* Forms */
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field.full {
  grid-column: 1 / -1;
}

.field label {
  font-size: 11px;
  font-weight: 800;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.field input {
  width: 100%;
  height: 40px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg);
  color: var(--text);
  padding: 0 12px;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  outline: none;
  box-sizing: border-box;
}

.field input:focus {
  background: var(--card);
  border-color: var(--blue);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
}

/* Password */
.password-field {
  position: relative;
}

.password-field input {
  padding-right: 42px;
}

.password-field button {
  position: absolute;
  top: 50%;
  right: 10px;
  transform: translateY(-50%);
  border: none;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  font-size: 13px;
}

.password-strength {
  margin-top: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.strength-bars {
  display: flex;
  gap: 4px;
}

.strength-bars span {
  width: 38px;
  height: 5px;
  border-radius: 999px;
  background: #e2e8f0;
}

.strength-bars span.filled {
  background: var(--text);
}

.password-strength p {
  margin: 0;
  font-size: 12px;
  color: var(--muted);
  font-weight: 700;
}

/* Setting rows */
.setting-list {
  border: 1px solid var(--border);
  border-radius: 14px;
  overflow: hidden;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px;
  border-bottom: 1px solid var(--border);
}

.setting-row:last-child {
  border-bottom: none;
}

.setting-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.setting-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: var(--soft);
  color: var(--muted);
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.setting-left h3 {
  margin: 0;
  font-size: 13px;
  font-weight: 800;
}

.setting-left p {
  margin: 3px 0 0;
  font-size: 12px;
  color: var(--muted);
}

/* Toggle */
.toggle {
  position: relative;
  display: inline-flex;
  cursor: pointer;
  flex-shrink: 0;
}

.toggle input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.toggle span {
  width: 42px;
  height: 24px;
  border-radius: 999px;
  background: #cbd5e1;
  position: relative;
  transition: 0.2s ease;
}

.toggle span::before {
  content: "";
  position: absolute;
  width: 18px;
  height: 18px;
  top: 3px;
  left: 3px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.25);
  transition: 0.2s ease;
}

.toggle input:checked + span {
  background: var(--text);
}

.toggle input:checked + span::before {
  transform: translateX(18px);
}

/* Note */
.note-box {
  margin-top: 16px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid rgba(59, 130, 246, 0.18);
  background: rgba(59, 130, 246, 0.06);
  color: #1e40af;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: flex-start;
  gap: 9px;
  line-height: 1.5;
}

/* Buttons */
.btn-primary,
.btn-ghost {
  height: 38px;
  padding: 0 15px;
  border-radius: 10px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: 0.15s ease;
  white-space: nowrap;
}

.btn-primary {
  border: none;
  background: var(--text);
  color: #ffffff;
}

.btn-primary:hover {
  opacity: 0.88;
}

.btn-primary:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.btn-primary.small {
  margin-top: 16px;
  height: 34px;
  font-size: 12px;
}

.btn-ghost {
  border: 1px solid var(--border);
  background: var(--card);
  color: var(--muted);
}

.btn-ghost:hover {
  color: var(--text);
  border-color: #cbd5e1;
}

/* Save bar */
.save-bar {
  margin-top: 16px;
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--card);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* Responsive */
@media (max-width: 768px) {
  .settings-page {
    padding: 16px;
  }

  .settings-header {
    flex-direction: column;
  }

  .settings-header .btn-primary {
    width: 100%;
  }

  .settings-tabs {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
  }

  .settings-tab {
    justify-content: center;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .save-bar {
    flex-direction: column-reverse;
  }

  .save-bar button {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .settings-tabs {
    grid-template-columns: 1fr;
  }

  .profile-summary {
    align-items: flex-start;
  }

  .setting-row {
    align-items: flex-start;
  }
}
</style>