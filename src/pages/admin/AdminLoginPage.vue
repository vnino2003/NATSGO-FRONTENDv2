<template>
  <main class="admin-login-page">
    <!-- LEFT PANEL -->
    <section class="brand-panel">
      <div class="brand-bg"></div>
      <div class="brand-grid"></div>

      <div class="hero-layout">
        <div class="hero-copy">
          <h1>Manage your fleet with confidence.</h1>

          <p>
            Sign in to monitor buses, terminals, fares, GPS devices, and commuter
            updates in one clean dashboard.
          </p>
        </div>

        <div class="bus-showcase" aria-hidden="true">
          <div class="bus-glow"></div>

          <img
            src="/admin/natsgo-bus.png"
            alt="NATSGO bus"
            class="bus-image"
          />
        </div>
      </div>
    </section>

    <!-- RIGHT PANEL -->
    <section class="login-panel">
      <div class="login-shell">
        <div class="mobile-brand">
          <div class="brand-logo small">
            <span>N</span>
          </div>

          <div>
            <p class="mobile-brand-name">NATSGO</p>
            <p class="mobile-brand-subtitle">Admin Portal</p>
          </div>
        </div>

        <h2>Welcome back</h2>

        <p class="login-subtitle">
          Sign in to manage NATSGO operations.
        </p>

        <form class="login-form" @submit.prevent="handleLogin">
          <div class="form-group">
            <label for="admin-email">Email Address</label>

            <div class="input-box">
              <i class="fas fa-envelope"></i>

              <input
                id="admin-email"
                v-model.trim="email"
                type="email"
                placeholder="admin@natsgo.com"
                autocomplete="email"
                required
                :disabled="auth.loading"
              />
            </div>
          </div>

          <div class="form-group">
            <div class="label-row">
              <label for="admin-password">Password</label>

              <button type="button" :disabled="auth.loading" @click="forgotPassword">
                Forgot?
              </button>
            </div>

            <div class="input-box">
              <i class="fas fa-lock"></i>

              <input
                id="admin-password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Enter your password"
                autocomplete="current-password"
                required
                :disabled="auth.loading"
              />

              <button
                type="button"
                class="password-toggle"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
                :disabled="auth.loading"
                @click="showPassword = !showPassword"
              >
                <i
                  class="fas"
                  :class="showPassword ? 'fa-eye-slash' : 'fa-eye'"
                ></i>
              </button>
            </div>
          </div>

          <p v-if="error" class="error-message">
            <i class="fas fa-circle-exclamation"></i>
            <span>{{ error }}</span>
          </p>

          <button class="login-button" type="submit" :disabled="auth.loading">
            <span v-if="auth.loading" class="spinner"></span>
            <span>{{ auth.loading ? "Signing in..." : "Sign in to dashboard" }}</span>
            <i v-if="!auth.loading" class="fas fa-arrow-right"></i>
          </button>
        </form>

        <p class="help-text">
          Need admin access?
          <a href="mailto:it@natsgo.com">Contact IT Admin</a>
        </p>
      </div>
    </section>
  </main>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";

const router = useRouter();
const auth = useAuthStore();

const email = ref("");
const password = ref("");
const error = ref("");
const showPassword = ref(false);

async function handleLogin() {
  error.value = "";

  if (!email.value || !password.value) {
    error.value = "Email and password are required.";
    return;
  }

  try {
    await auth.loginAdmin({
      email: email.value,
      password: password.value,
    });

    router.push("/dashboard");
  } catch (e) {
    error.value =
      e?.response?.data?.message ||
      e?.message ||
      "Login failed. Please try again.";
  }
}

function forgotPassword() {
  error.value = "Password recovery is not connected yet. Please contact IT Admin.";
}
</script>

<style scoped>
.admin-login-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 460px;
  background: #ffffff;
  color: #0f172a;
  font-family: "DM Sans", "Inter", "Segoe UI", sans-serif;
  overflow: hidden;
}

/* =========================
   LEFT BRAND PANEL
========================= */
.brand-panel {
  position: relative;
  min-height: 100vh;
  padding: 40px 46px;
  background:
    radial-gradient(circle at 12% 18%, rgba(255, 255, 255, 0.24), transparent 26%),
    radial-gradient(circle at 82% 76%, rgba(255, 255, 255, 0.2), transparent 34%),
    linear-gradient(135deg, #0b63c7 0%, #1478ed 48%, #5bbdff 100%);
  overflow: hidden;
}

.brand-bg {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(120deg, rgba(15, 23, 42, 0.14), transparent 58%),
    linear-gradient(to bottom, transparent 0%, rgba(15, 23, 42, 0.08) 100%);
  pointer-events: none;
}

.brand-grid {
  position: absolute;
  inset: 0;
  opacity: 0.16;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.34) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.34) 1px, transparent 1px);
  background-size: 42px 42px;
  mask-image: linear-gradient(to bottom, #000 0%, transparent 96%);
  pointer-events: none;
}

.brand-logo {
  width: 50px;
  height: 50px;
  border-radius: 17px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.96);
  color: #1478ed;
  box-shadow: 0 16px 34px rgba(15, 23, 42, 0.2);
}

.brand-logo span {
  font-size: 24px;
  font-weight: 1000;
  letter-spacing: -1px;
  line-height: 1;
}

.brand-logo.small {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: #1478ed;
  color: #ffffff;
  box-shadow: 0 12px 26px rgba(20, 120, 237, 0.22);
}

.brand-logo.small span {
  font-size: 19px;
}

.mobile-brand-name,
.mobile-brand-subtitle {
  margin: 0;
}

.mobile-brand-name {
  color: #0f172a;
  font-size: 13px;
  font-weight: 950;
  letter-spacing: 0.7px;
}

.mobile-brand-subtitle {
  margin-top: 2px;
  color: #64748b;
  font-size: 11px;
  font-weight: 750;
}

/* Hero */
.hero-layout {
  position: relative;
  z-index: 2;
  min-height: calc(100vh - 100px);
  display: grid;
  grid-template-columns: minmax(360px, 0.95fr) minmax(360px, 1.05fr);
  align-items: center;
  gap: 26px;
}

.hero-copy {
  position: relative;
  z-index: 4;
  max-width: 540px;
  transform: translateY(-10px);
}

.hero-copy h1 {
  margin: 0;
  max-width: 570px;
  color: #ffffff;
  font-size: clamp(42px, 5.2vw, 66px);
  font-weight: 1000;
  line-height: 0.96;
  letter-spacing: -2.8px;
}

.hero-copy p {
  margin: 19px 0 0;
  max-width: 475px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 15.5px;
  font-weight: 700;
  line-height: 1.75;
}

/* Bus visual */
.bus-showcase {
  position: relative;
  min-height: 440px;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translateX(-20px);
}

.bus-image {
  position: relative;
  z-index: 3;
  width: min(590px, 105%);
  max-height: 390px;
  object-fit: contain;
  filter:
    drop-shadow(0 34px 30px rgba(15, 23, 42, 0.32))
    drop-shadow(0 10px 10px rgba(15, 23, 42, 0.16));
  animation: busFloat 4.6s ease-in-out infinite;
}

.bus-glow {
  position: absolute;
  z-index: 1;
  left: 13%;
  right: 12%;
  bottom: 46px;
  height: 78px;
  border-radius: 999px;
  background: radial-gradient(ellipse, rgba(15, 23, 42, 0.34), transparent 68%);
  filter: blur(6px);
}

/* =========================
   RIGHT LOGIN PANEL
========================= */
.login-panel {
  position: relative;
  z-index: 6;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 34px;
  background:
    radial-gradient(circle at top right, rgba(20, 120, 237, 0.08), transparent 30%),
    linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  box-shadow: -24px 0 60px rgba(15, 23, 42, 0.06);
}

.login-shell {
  width: 100%;
  max-width: 380px;
}

.mobile-brand {
  display: none;
  align-items: center;
  gap: 11px;
  margin-bottom: 24px;
}

.login-shell h2 {
  margin: 0 0 8px;
  color: #020617;
  font-size: 32px;
  font-weight: 1000;
  line-height: 1.05;
  letter-spacing: -1.2px;
}

.login-subtitle {
  margin: 0 0 31px;
  color: #64748b;
  font-size: 14px;
  font-weight: 650;
  line-height: 1.5;
}

.login-form {
  display: flex;
  flex-direction: column;
}

.form-group {
  margin-bottom: 17px;
}

.label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #334155;
  font-size: 11px;
  font-weight: 950;
  letter-spacing: 0.55px;
  text-transform: uppercase;
}

.label-row button {
  margin-bottom: 8px;
  border: none;
  background: transparent;
  color: #1478ed;
  font-family: inherit;
  font-size: 11.5px;
  font-weight: 950;
  cursor: pointer;
}

.label-row button:hover {
  text-decoration: underline;
}

.label-row button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.input-box {
  position: relative;
}

.input-box > i {
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  font-size: 13px;
  pointer-events: none;
}

.input-box input {
  width: 100%;
  height: 51px;
  box-sizing: border-box;
  border: 1.5px solid #dbe4ef;
  border-radius: 16px;
  outline: none;
  background: #f8fafc;
  color: #0f172a;
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
  padding: 0 45px 0 42px;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    background 0.18s ease;
}

.input-box input::placeholder {
  color: #9ca3af;
  font-weight: 650;
}

.input-box input:focus {
  background: #ffffff;
  border-color: #1478ed;
  box-shadow: 0 0 0 4px rgba(20, 120, 237, 0.11);
}

.input-box input:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.password-toggle {
  position: absolute;
  right: 8px;
  top: 50%;
  width: 35px;
  height: 35px;
  display: grid;
  place-items: center;
  transform: translateY(-50%);
  border: none;
  border-radius: 12px;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
}

.password-toggle:hover:not(:disabled) {
  background: rgba(15, 23, 42, 0.05);
  color: #475569;
}

.password-toggle:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 0 0 14px;
  padding: 12px 13px;
  border-radius: 14px;
  color: #b91c1c;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.18);
  font-size: 12.5px;
  font-weight: 800;
  line-height: 1.35;
}

.error-message i {
  margin-top: 1px;
}

.login-button {
  width: 100%;
  height: 53px;
  margin-top: 4px;
  border: none;
  border-radius: 16px;
  background: linear-gradient(135deg, #1677f2 0%, #0b67c8 100%);
  color: #ffffff;
  font-family: inherit;
  font-size: 14px;
  font-weight: 950;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  box-shadow: 0 14px 28px rgba(20, 120, 237, 0.28);
  transition:
    transform 0.16s ease,
    box-shadow 0.16s ease,
    filter 0.16s ease;
}

.login-button:hover:not(:disabled) {
  filter: brightness(1.04);
  box-shadow: 0 16px 32px rgba(20, 120, 237, 0.34);
}

.login-button:active:not(:disabled) {
  transform: scale(0.985);
}

.login-button:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  box-shadow: none;
}

.login-button i {
  font-size: 12px;
  transition: transform 0.16s ease;
}

.login-button:hover:not(:disabled) i {
  transform: translateX(3px);
}

.spinner {
  width: 15px;
  height: 15px;
  border: 2px solid rgba(255, 255, 255, 0.36);
  border-top-color: #ffffff;
  border-radius: 999px;
  animation: spin 0.65s linear infinite;
}

.help-text {
  margin: 24px 0 0;
  color: #94a3b8;
  text-align: center;
  font-size: 12.5px;
  font-weight: 700;
}

.help-text a {
  color: #1478ed;
  font-weight: 950;
  text-decoration: none;
}

.help-text a:hover {
  text-decoration: underline;
}

/* =========================
   ANIMATIONS
========================= */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes busFloat {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-9px);
  }
}

/* =========================
   RESPONSIVE
========================= */
@media (max-width: 1180px) {
  .admin-login-page {
    grid-template-columns: minmax(0, 1fr) 430px;
  }

  .brand-panel {
    padding: 34px;
  }

  .hero-layout {
    grid-template-columns: 1fr;
    align-content: center;
    min-height: calc(100vh - 80px);
  }

  .hero-copy {
    max-width: 560px;
  }

  .hero-copy h1 {
    font-size: 48px;
  }

  .bus-showcase {
    position: absolute;
    right: 10px;
    bottom: 10px;
    width: min(480px, 54vw);
    min-height: 330px;
    transform: none;
  }

  .bus-image {
    width: 100%;
  }
}

@media (max-width: 920px) {
  .admin-login-page {
    grid-template-columns: 1fr;
    overflow: visible;
    background: #f8fbff;
  }

  .brand-panel {
    min-height: 620px;
    padding: 32px;
  }

  .hero-layout {
    min-height: 500px;
    grid-template-columns: 1fr;
    align-content: start;
    padding-top: 72px;
  }

  .hero-copy h1 {
    font-size: 42px;
    letter-spacing: -1.7px;
  }

  .hero-copy p {
    max-width: 560px;
  }

  .bus-showcase {
    right: 50%;
    bottom: 20px;
    width: min(520px, 82vw);
    min-height: 290px;
    transform: translateX(50%);
  }

  .login-panel {
    min-height: auto;
    padding: 34px 28px;
    box-shadow: none;
  }
}

@media (max-width: 680px) {
  .brand-panel {
    display: none;
  }

  .login-panel {
    min-height: 100vh;
    align-items: stretch;
    padding: 22px;
    background:
      radial-gradient(circle at top, rgba(20, 120, 237, 0.1), transparent 34%),
      #f6f8fb;
  }

  .login-shell {
    max-width: none;
    margin: auto 0;
    padding: 24px 18px 20px;
    border-radius: 26px;
    background: #ffffff;
    border: 1px solid rgba(15, 23, 42, 0.07);
    box-shadow: 0 20px 55px rgba(15, 23, 42, 0.08);
  }

  .mobile-brand {
    display: flex;
  }

  .login-shell h2 {
    font-size: 28px;
  }

  .login-subtitle {
    margin-bottom: 27px;
  }
}

@media (max-width: 390px) {
  .login-panel {
    padding: 16px;
  }

  .login-shell {
    padding: 22px 15px 18px;
  }

  .input-box input,
  .login-button {
    height: 49px;
  }

  .login-shell h2 {
    font-size: 26px;
  }
}
</style>