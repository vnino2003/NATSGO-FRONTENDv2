<!-- src/views/commuters/SettingsPage.vue -->
<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";

const router = useRouter();
const auth = useAuthStore();

// ── toggles ──────────────────────────────────────────────
const notifNearbyBus   = ref(true);
const notifAlerts      = ref(true);
const notifAnnounce    = ref(false);
const notifSound       = ref(true);
const darkMode         = ref(false);
const locationSharing  = ref(true);
const analytics        = ref(true);
const crashReports     = ref(true);

// ── language ─────────────────────────────────────────────
const language = ref("en");
const languages = [
  { value: "en", label: "English" },
  { value: "fil", label: "Filipino" },
  { value: "ceb", label: "Bisaya" },
];

// ── account modal ─────────────────────────────────────────
const showEditProfile  = ref(false);
const showChangePass   = ref(false);
const showDeleteConfirm = ref(false);
const showAbout        = ref(false);
const showFeedback     = ref(false);

const profileName  = ref(auth.currentCommuter?.name  || "");
const profileEmail = ref(auth.currentCommuter?.email || "");
const profilePhone = ref(auth.currentCommuter?.phone || "");

const currentPass = ref("");
const newPass     = ref("");
const confirmPass = ref("");
const passError   = ref("");

const feedbackText = ref("");
const feedbackSent = ref(false);

const avatarInitials = computed(() => {
  const name = auth.currentCommuter?.name || auth.currentCommuter?.email || "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
});

// ── actions ───────────────────────────────────────────────
function saveProfile() {
  // wire to auth.updateProfile(payload) when ready
  showEditProfile.value = false;
}

function changePassword() {
  passError.value = "";
  if (!newPass.value || newPass.value.length < 6) {
    passError.value = "Password must be at least 6 characters.";
    return;
  }
  if (newPass.value !== confirmPass.value) {
    passError.value = "Passwords do not match.";
    return;
  }
  // wire to auth.changePassword(currentPass, newPass) when ready
  currentPass.value = "";
  newPass.value = "";
  confirmPass.value = "";
  showChangePass.value = false;
}

function deleteAccount() {
  // wire to auth.deleteAccount() when ready
  auth.logoutCommuter();
  showDeleteConfirm.value = false;
  router.push("/");
}

function submitFeedback() {
  if (!feedbackText.value.trim()) return;
  // wire to your feedback API when ready
  feedbackSent.value = true;
  feedbackText.value = "";
  setTimeout(() => {
    feedbackSent.value = false;
    showFeedback.value = false;
  }, 2200);
}

function goBack() {
  router.back();
}
</script>

<template>
  <!-- ── MODALS ─────────────────────────────────────────── -->

  <!-- Edit Profile -->
  <Teleport to="body">
    <Transition name="sheet-fade">
      <div v-if="showEditProfile" class="sheet-overlay" @click.self="showEditProfile = false">
        <div class="sheet-card">
          <div class="sheet-handle" />
          <div class="sheet-header">
            <h2 class="sheet-title">Edit Profile</h2>
            <button class="sheet-close" @click="showEditProfile = false">
              <i class="fas fa-times" />
            </button>
          </div>

          <div class="field-group">
            <label class="field-label">Full Name</label>
            <input v-model="profileName" class="field-input" type="text" placeholder="Your name" />
          </div>
          <div class="field-group">
            <label class="field-label">Email</label>
            <input v-model="profileEmail" class="field-input" type="email" placeholder="your@email.com" />
          </div>
          <div class="field-group">
            <label class="field-label">Phone</label>
            <input v-model="profilePhone" class="field-input" type="tel" placeholder="+63 9XX XXX XXXX" />
          </div>

          <button class="btn-primary" @click="saveProfile">Save Changes</button>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Change Password -->
  <Teleport to="body">
    <Transition name="sheet-fade">
      <div v-if="showChangePass" class="sheet-overlay" @click.self="showChangePass = false">
        <div class="sheet-card">
          <div class="sheet-handle" />
          <div class="sheet-header">
            <h2 class="sheet-title">Change Password</h2>
            <button class="sheet-close" @click="showChangePass = false">
              <i class="fas fa-times" />
            </button>
          </div>

          <div class="field-group">
            <label class="field-label">Current Password</label>
            <input v-model="currentPass" class="field-input" type="password" placeholder="••••••••" />
          </div>
          <div class="field-group">
            <label class="field-label">New Password</label>
            <input v-model="newPass" class="field-input" type="password" placeholder="••••••••" />
          </div>
          <div class="field-group">
            <label class="field-label">Confirm New Password</label>
            <input v-model="confirmPass" class="field-input" type="password" placeholder="••••••••" />
          </div>

          <p v-if="passError" class="field-error">{{ passError }}</p>

          <button class="btn-primary" @click="changePassword">Update Password</button>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Delete Account Confirm -->
  <Teleport to="body">
    <Transition name="sheet-fade">
      <div v-if="showDeleteConfirm" class="sheet-overlay" @click.self="showDeleteConfirm = false">
        <div class="sheet-card sheet-card--danger">
          <div class="sheet-handle" />
          <div class="danger-icon-wrap">
            <i class="fas fa-triangle-exclamation danger-icon" />
          </div>
          <h2 class="danger-title">Delete Account?</h2>
          <p class="danger-body">
            This will permanently remove your NATSGO account and all your data.
            This action <strong>cannot</strong> be undone.
          </p>
          <div class="danger-actions">
            <button class="btn-ghost" @click="showDeleteConfirm = false">Cancel</button>
            <button class="btn-danger" @click="deleteAccount">Yes, Delete</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- About -->
  <Teleport to="body">
    <Transition name="sheet-fade">
      <div v-if="showAbout" class="sheet-overlay" @click.self="showAbout = false">
        <div class="sheet-card sheet-card--center">
          <div class="sheet-handle" />
          <img src="/mascots/natsgo-capy-closed.png" alt="NatsGo Capy" class="about-capy" />
          <h2 class="about-title">NATSGO</h2>
          <p class="about-sub">Commuter Edition</p>
          <div class="about-badge">Version 1.0.0</div>
          <div class="about-divider" />
          <div class="about-info-row">
            <span>Developed by</span>
            <strong>NATSGO Team</strong>
          </div>
          <div class="about-info-row">
            <span>Platform</span>
            <strong>Web App (PWA)</strong>
          </div>
          <div class="about-info-row">
            <span>License</span>
            <strong>All rights reserved</strong>
          </div>
          <button class="btn-ghost" style="margin-top:18px" @click="showAbout = false">Close</button>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Feedback -->
  <Teleport to="body">
    <Transition name="sheet-fade">
      <div v-if="showFeedback" class="sheet-overlay" @click.self="showFeedback = false">
        <div class="sheet-card">
          <div class="sheet-handle" />
          <div class="sheet-header">
            <h2 class="sheet-title">Send Feedback</h2>
            <button class="sheet-close" @click="showFeedback = false">
              <i class="fas fa-times" />
            </button>
          </div>

          <Transition name="fade" mode="out-in">
            <div v-if="feedbackSent" key="sent" class="feedback-sent">
              <i class="fas fa-circle-check feedback-sent-icon" />
              <p>Thanks for your feedback!</p>
            </div>
            <div v-else key="form">
              <div class="field-group">
                <label class="field-label">Your message</label>
                <textarea
                  v-model="feedbackText"
                  class="field-input field-textarea"
                  placeholder="Tell us what you think or report an issue…"
                  rows="5"
                />
              </div>
              <button class="btn-primary" @click="submitFeedback">Submit</button>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- ── PAGE ───────────────────────────────────────────── -->
  <div id="settings" class="page active">

    <!-- Header -->
    <div class="settings-header">
      <button class="back-btn" type="button" @click="goBack">
        <i class="fas fa-arrow-left" />
      </button>
      <h1 class="settings-title">Settings</h1>
    </div>

    <div class="page-content">

      <!-- ─── Account ──────────────────────────────────── -->
      <template v-if="auth.isCommuterLoggedIn">
        <div class="section-label">Account</div>

        <!-- Profile Card -->
        <div class="profile-card">
          <div class="profile-avatar">{{ avatarInitials }}</div>
          <div class="profile-info">
            <p class="profile-name">{{ auth.currentCommuter?.name || "Commuter" }}</p>
            <p class="profile-email">{{ auth.currentCommuter?.email }}</p>
          </div>
          <button class="profile-edit-btn" type="button" @click="showEditProfile = true">
            <i class="fas fa-pen" />
          </button>
        </div>

        <div class="settings-group">
          <button class="settings-row" type="button" @click="showChangePass = true">
            <div class="row-icon row-icon--blue">
              <i class="fas fa-lock" />
            </div>
            <div class="row-body">
              <p class="row-title">Change Password</p>
              <span class="row-sub">Update your login password</span>
            </div>
            <i class="fas fa-chevron-right row-arrow" />
          </button>

          <div class="row-divider" />

          <button class="settings-row settings-row--danger" type="button" @click="showDeleteConfirm = true">
            <div class="row-icon row-icon--red">
              <i class="fas fa-trash" />
            </div>
            <div class="row-body">
              <p class="row-title">Delete Account</p>
              <span class="row-sub">Permanently remove your account</span>
            </div>
            <i class="fas fa-chevron-right row-arrow" />
          </button>
        </div>

        <button class="logout-btn" type="button" @click="auth.logoutCommuter()">
          <i class="fas fa-right-from-bracket" />
          Log Out
        </button>
      </template>

      <!-- Not logged in -->
      <template v-else>
        <div class="section-label">Account</div>
        <div class="guest-card">
          <i class="fas fa-user-circle guest-icon" />
          <p class="guest-title">Not signed in</p>
          <p class="guest-sub">Sign in to manage your account and preferences.</p>
          <RouterLink to="/" class="btn-primary btn-primary--inline">
            Sign In / Register
          </RouterLink>
        </div>
      </template>

      <!-- ─── Notifications ────────────────────────────── -->
      <div class="section-label">Notifications</div>
      <div class="settings-group">
        <div class="settings-row settings-row--toggle">
          <div class="row-icon row-icon--orange">
            <i class="fas fa-bell" />
          </div>
          <div class="row-body">
            <p class="row-title">Nearby Bus Alerts</p>
            <span class="row-sub">Popup when a bus is within 1 km</span>
          </div>
          <label class="toggle">
            <input v-model="notifNearbyBus" type="checkbox" />
            <span class="toggle-track" />
          </label>
        </div>

        <div class="row-divider" />

        <div class="settings-row settings-row--toggle">
          <div class="row-icon row-icon--red">
            <i class="fas fa-triangle-exclamation" />
          </div>
          <div class="row-body">
            <p class="row-title">Critical Alerts</p>
            <span class="row-sub">Suspended routes, major disruptions</span>
          </div>
          <label class="toggle">
            <input v-model="notifAlerts" type="checkbox" />
            <span class="toggle-track" />
          </label>
        </div>

        <div class="row-divider" />

        <div class="settings-row settings-row--toggle">
          <div class="row-icon row-icon--blue">
            <i class="fas fa-bullhorn" />
          </div>
          <div class="row-body">
            <p class="row-title">Announcements</p>
            <span class="row-sub">News and service updates</span>
          </div>
          <label class="toggle">
            <input v-model="notifAnnounce" type="checkbox" />
            <span class="toggle-track" />
          </label>
        </div>

        <div class="row-divider" />

        <div class="settings-row settings-row--toggle">
          <div class="row-icon row-icon--green">
            <i class="fas fa-volume-high" />
          </div>
          <div class="row-body">
            <p class="row-title">Alert Sound</p>
            <span class="row-sub">Play a tone on nearby alerts</span>
          </div>
          <label class="toggle">
            <input v-model="notifSound" type="checkbox" />
            <span class="toggle-track" />
          </label>
        </div>
      </div>

      <!-- ─── Appearance ────────────────────────────────── -->
      <div class="section-label">Appearance</div>
      <div class="settings-group">
        <div class="settings-row settings-row--toggle">
          <div class="row-icon row-icon--indigo">
            <i class="fas fa-moon" />
          </div>
          <div class="row-body">
            <p class="row-title">Dark Mode</p>
            <span class="row-sub">Switch to dark theme</span>
          </div>
          <label class="toggle">
            <input v-model="darkMode" type="checkbox" />
            <span class="toggle-track" />
          </label>
        </div>

        <div class="row-divider" />

        <div class="settings-row settings-row--select">
          <div class="row-icon row-icon--teal">
            <i class="fas fa-language" />
          </div>
          <div class="row-body">
            <p class="row-title">Language</p>
            <span class="row-sub">Choose your preferred language</span>
          </div>
          <select v-model="language" class="row-select">
            <option v-for="lang in languages" :key="lang.value" :value="lang.value">
              {{ lang.label }}
            </option>
          </select>
        </div>
      </div>

      <!-- ─── Privacy ───────────────────────────────────── -->
      <div class="section-label">Privacy & Data</div>
      <div class="settings-group">
        <div class="settings-row settings-row--toggle">
          <div class="row-icon row-icon--blue">
            <i class="fas fa-location-dot" />
          </div>
          <div class="row-body">
            <p class="row-title">Location Sharing</p>
            <span class="row-sub">Used for nearby bus alerts</span>
          </div>
          <label class="toggle">
            <input v-model="locationSharing" type="checkbox" />
            <span class="toggle-track" />
          </label>
        </div>

        <div class="row-divider" />

        <div class="settings-row settings-row--toggle">
          <div class="row-icon row-icon--green">
            <i class="fas fa-chart-simple" />
          </div>
          <div class="row-body">
            <p class="row-title">Usage Analytics</p>
            <span class="row-sub">Help us improve the app</span>
          </div>
          <label class="toggle">
            <input v-model="analytics" type="checkbox" />
            <span class="toggle-track" />
          </label>
        </div>

        <div class="row-divider" />

        <div class="settings-row settings-row--toggle">
          <div class="row-icon row-icon--orange">
            <i class="fas fa-bug" />
          </div>
          <div class="row-body">
            <p class="row-title">Crash Reports</p>
            <span class="row-sub">Automatically send error logs</span>
          </div>
          <label class="toggle">
            <input v-model="crashReports" type="checkbox" />
            <span class="toggle-track" />
          </label>
        </div>
      </div>

      <!-- ─── Support ───────────────────────────────────── -->
      <div class="section-label">Support & Info</div>
      <div class="settings-group">
        <button class="settings-row" type="button" @click="showFeedback = true">
          <div class="row-icon row-icon--blue">
            <i class="fas fa-comment-dots" />
          </div>
          <div class="row-body">
            <p class="row-title">Send Feedback</p>
            <span class="row-sub">Report issues or share ideas</span>
          </div>
          <i class="fas fa-chevron-right row-arrow" />
        </button>

        <div class="row-divider" />

        <a
          class="settings-row"
          href="https://www.facebook.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div class="row-icon row-icon--blue">
            <i class="fab fa-facebook-f" />
          </div>
          <div class="row-body">
            <p class="row-title">Facebook Page</p>
            <span class="row-sub">Follow us for updates</span>
          </div>
          <i class="fas fa-up-right-from-square row-arrow" />
        </a>

        <div class="row-divider" />

        <button class="settings-row" type="button" @click="showAbout = true">
          <div class="row-icon row-icon--gray">
            <i class="fas fa-circle-info" />
          </div>
          <div class="row-body">
            <p class="row-title">About NATSGO</p>
            <span class="row-sub">Version, credits, and licenses</span>
          </div>
          <i class="fas fa-chevron-right row-arrow" />
        </button>
      </div>

      <p class="footer-note">NATSGO Commuter App &copy; {{ new Date().getFullYear() }}</p>
    </div>
  </div>
</template>

<style scoped>
/* ── Layout ─────────────────────────────────────────────── */
.page {
  min-height: 100dvh;
  background: #f1f5f9;
  display: flex;
  flex-direction: column;
}

.page-content {
  flex: 1;
  padding: 12px 16px 40px;
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* ── Header ─────────────────────────────────────────────── */
.settings-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px 10px;
  background: #ffffff;
  border-bottom: 1px solid rgba(15, 23, 42, 0.07);
  position: sticky;
  top: 0;
  z-index: 10;
}

.back-btn {
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.05);
  color: #0f172a;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
  flex-shrink: 0;
  transition: background 0.18s;
}

.back-btn:active { background: rgba(15, 23, 42, 0.1); }

.settings-title {
  margin: 0;
  font-size: 17px;
  font-weight: 900;
  color: #0f172a;
  letter-spacing: -0.3px;
}

/* ── Section Label ──────────────────────────────────────── */
.section-label {
  margin: 20px 0 6px 2px;
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #94a3b8;
}

/* ── Settings Group ─────────────────────────────────────── */
.settings-group {
  border-radius: 16px;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.07);
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
  overflow: hidden;
}

.settings-row {
  width: 100%;
  min-height: 60px;
  padding: 11px 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  background: transparent;
  border: none;
  font-family: inherit;
  text-align: left;
  text-decoration: none;
  color: #0f172a;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.15s;
}

.settings-row:active { background: rgba(15, 23, 42, 0.04); }

.settings-row--danger .row-title { color: #dc2626; }

.settings-row--toggle,
.settings-row--select {
  cursor: default;
}

.row-divider {
  height: 1px;
  background: rgba(15, 23, 42, 0.06);
  margin: 0 14px;
}

/* ── Row Icon ───────────────────────────────────────────── */
.row-icon {
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.row-icon--blue   { background: rgba(22, 119, 242, 0.1);  color: #1677f2; }
.row-icon--red    { background: rgba(220, 38, 38, 0.1);   color: #dc2626; }
.row-icon--green  { background: rgba(16, 185, 129, 0.1);  color: #059669; }
.row-icon--orange { background: rgba(245, 158, 11, 0.1);  color: #d97706; }
.row-icon--teal   { background: rgba(20, 184, 166, 0.1);  color: #0d9488; }
.row-icon--indigo { background: rgba(99, 102, 241, 0.1);  color: #6366f1; }
.row-icon--gray   { background: rgba(100, 116, 139, 0.1); color: #64748b; }

/* ── Row Body ───────────────────────────────────────────── */
.row-body {
  flex: 1;
  min-width: 0;
}

.row-title {
  margin: 0;
  font-size: 13px;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.2;
}

.row-sub {
  display: block;
  margin-top: 2px;
  font-size: 10px;
  font-weight: 600;
  color: #94a3b8;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.row-arrow {
  font-size: 10px;
  color: #cbd5e1;
  flex-shrink: 0;
}

/* ── Toggle ─────────────────────────────────────────────── */
.toggle {
  position: relative;
  flex-shrink: 0;
  cursor: pointer;
}

.toggle input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-track {
  display: block;
  width: 44px;
  height: 26px;
  border-radius: 999px;
  background: #e2e8f0;
  position: relative;
  transition: background 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}

.toggle-track::after {
  content: "";
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  border-radius: 999px;
  background: #ffffff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.18);
  transition: transform 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}

.toggle input:checked + .toggle-track {
  background: #1677f2;
}

.toggle input:checked + .toggle-track::after {
  transform: translateX(18px);
}

/* ── Select ─────────────────────────────────────────────── */
.row-select {
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.03);
  color: #0f172a;
  font-size: 12px;
  font-weight: 700;
  font-family: inherit;
  padding: 6px 8px;
  cursor: pointer;
  outline: none;
  flex-shrink: 0;
}

/* ── Profile Card ───────────────────────────────────────── */
.profile-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border-radius: 16px;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.07);
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
  margin-bottom: 10px;
}

.profile-avatar {
  width: 46px;
  height: 46px;
  border-radius: 999px;
  background: rgba(22, 119, 242, 0.12);
  color: #1677f2;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 900;
  flex-shrink: 0;
}

.profile-info {
  flex: 1;
  min-width: 0;
}

.profile-name {
  margin: 0;
  font-size: 14px;
  font-weight: 900;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.profile-email {
  margin: 2px 0 0;
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.profile-edit-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 999px;
  background: rgba(22, 119, 242, 0.08);
  color: #1677f2;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s;
}

.profile-edit-btn:active { background: rgba(22, 119, 242, 0.16); }

/* ── Logout ─────────────────────────────────────────────── */
.logout-btn {
  margin-top: 10px;
  width: 100%;
  height: 46px;
  border: none;
  border-radius: 14px;
  background: rgba(220, 38, 38, 0.07);
  color: #dc2626;
  font-size: 13px;
  font-weight: 900;
  font-family: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: background 0.15s;
}

.logout-btn:active { background: rgba(220, 38, 38, 0.13); }

/* ── Guest Card ─────────────────────────────────────────── */
.guest-card {
  border-radius: 16px;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.07);
  padding: 22px 18px;
  text-align: center;
}

.guest-icon {
  font-size: 42px;
  color: #cbd5e1;
  display: block;
  margin-bottom: 10px;
}

.guest-title {
  margin: 0 0 5px;
  font-size: 15px;
  font-weight: 900;
  color: #0f172a;
}

.guest-sub {
  margin: 0 0 16px;
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  line-height: 1.4;
}

/* ── Buttons ─────────────────────────────────────────────── */
.btn-primary {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 46px;
  border: none;
  border-radius: 13px;
  background: #1677f2;
  color: #ffffff;
  font-size: 13px;
  font-weight: 900;
  font-family: inherit;
  cursor: pointer;
  text-decoration: none;
  transition: box-shadow 0.18s, transform 0.15s;
  box-shadow: 0 6px 18px rgba(22, 119, 242, 0.28);
}

.btn-primary:active { transform: scale(0.97); }

.btn-primary--inline {
  display: inline-flex;
  width: auto;
  padding: 0 22px;
}

.btn-ghost {
  flex: 1;
  min-height: 44px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 13px;
  background: rgba(15, 23, 42, 0.04);
  color: #475569;
  font-size: 12px;
  font-weight: 900;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-ghost:active { background: rgba(15, 23, 42, 0.08); }

.btn-danger {
  flex: 1;
  min-height: 44px;
  border: none;
  border-radius: 13px;
  background: #dc2626;
  color: #ffffff;
  font-size: 12px;
  font-weight: 900;
  font-family: inherit;
  cursor: pointer;
  transition: opacity 0.15s;
}

.btn-danger:active { opacity: 0.85; }

/* ── Footer ─────────────────────────────────────────────── */
.footer-note {
  margin: 28px 0 0;
  text-align: center;
  font-size: 10px;
  font-weight: 700;
  color: #cbd5e1;
}

/* ── Sheets / Modals ─────────────────────────────────────── */
.sheet-overlay {
  position: fixed;
  inset: 0;
  z-index: 99999;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0 0 env(safe-area-inset-bottom, 0);
}

.sheet-card {
  position: relative;
  width: min(100vw, 480px);
  border-radius: 24px 24px 0 0;
  background: #ffffff;
  padding: 10px 18px 30px;
  box-shadow: 0 -8px 40px rgba(15, 23, 42, 0.14);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sheet-card--danger { text-align: center; }
.sheet-card--center { text-align: center; align-items: center; }

.sheet-handle {
  width: 36px;
  height: 4px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.1);
  margin: 0 auto 6px;
  flex-shrink: 0;
}

.sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sheet-title {
  margin: 0;
  font-size: 16px;
  font-weight: 900;
  color: #0f172a;
}

.sheet-close {
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

/* ── Form Fields ─────────────────────────────────────────── */
.field-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.field-label {
  font-size: 11px;
  font-weight: 800;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.field-input {
  width: 100%;
  min-height: 44px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.13);
  background: rgba(15, 23, 42, 0.02);
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
  font-family: inherit;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.18s;
}

.field-input:focus {
  border-color: #1677f2;
  background: rgba(22, 119, 242, 0.03);
}

.field-textarea {
  min-height: auto;
  resize: vertical;
}

.field-error {
  margin: 0;
  font-size: 11px;
  font-weight: 700;
  color: #dc2626;
}

/* ── Danger Modal ────────────────────────────────────────── */
.danger-icon-wrap {
  margin: 8px auto 0;
  width: 56px;
  height: 56px;
  border-radius: 999px;
  background: rgba(220, 38, 38, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.danger-icon {
  font-size: 24px;
  color: #dc2626;
}

.danger-title {
  margin: 0;
  font-size: 19px;
  font-weight: 900;
  color: #0f172a;
}

.danger-body {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  line-height: 1.5;
}

.danger-actions {
  display: flex;
  gap: 10px;
  margin-top: 4px;
}

/* ── About Sheet ─────────────────────────────────────────── */
.about-capy {
  width: 80px;
  height: 80px;
  object-fit: contain;
  margin-top: 6px;
}

.about-title {
  margin: 4px 0 0;
  font-size: 22px;
  font-weight: 900;
  color: #0f172a;
  letter-spacing: -0.5px;
}

.about-sub {
  margin: 2px 0 0;
  font-size: 12px;
  font-weight: 700;
  color: #94a3b8;
}

.about-badge {
  margin-top: 4px;
  padding: 4px 12px;
  border-radius: 999px;
  background: rgba(22, 119, 242, 0.1);
  color: #1677f2;
  font-size: 11px;
  font-weight: 900;
}

.about-divider {
  width: 100%;
  height: 1px;
  background: rgba(15, 23, 42, 0.07);
  margin: 4px 0;
}

.about-info-row {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  padding: 4px 0;
}

.about-info-row span { color: #94a3b8; font-weight: 700; }
.about-info-row strong { color: #0f172a; font-weight: 900; }

/* ── Feedback Sent ───────────────────────────────────────── */
.feedback-sent {
  text-align: center;
  padding: 22px 0 8px;
}

.feedback-sent-icon {
  font-size: 36px;
  color: #059669;
  display: block;
  margin-bottom: 10px;
}

.feedback-sent p {
  margin: 0;
  font-size: 14px;
  font-weight: 800;
  color: #0f172a;
}

/* ── Transitions ─────────────────────────────────────────── */
.sheet-fade-enter-active,
.sheet-fade-leave-active {
  transition: opacity 0.22s ease;
}

.sheet-fade-enter-active .sheet-card,
.sheet-fade-leave-active .sheet-card {
  transition: transform 0.26s cubic-bezier(0.32, 0.72, 0, 1);
}

.sheet-fade-enter-from,
.sheet-fade-leave-to {
  opacity: 0;
}

.sheet-fade-enter-from .sheet-card,
.sheet-fade-leave-to .sheet-card {
  transform: translateY(100%);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ── Responsive ──────────────────────────────────────────── */
@media (max-width: 360px) {
  .page-content { padding: 10px 12px 36px; }
  .sheet-card { padding: 10px 14px 24px; }
}
</style>