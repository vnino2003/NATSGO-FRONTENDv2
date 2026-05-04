<template>
  <div class="admin-login-page">
    <div class="login-card">
      <div class="brand">
        <div class="logo">N</div>
        <div>
          <h1>NATSGO Admin</h1>
          <p>Sign in to continue</p>
        </div>
      </div>

      <form class="form" @submit.prevent="handleLogin">
        <div class="field">
          <label>Email</label>
          <input
            v-model.trim="email"
            type="email"
            placeholder="admin@example.com"
            autocomplete="email"
            required
          />
        </div>

        <div class="field">
          <label>Password</label>
          <input
            v-model="password"
            type="password"
            placeholder="••••••••"
            autocomplete="current-password"
            required
          />
        </div>

        <p v-if="error" class="error">{{ error }}</p>

        <button type="submit" :disabled="loading">
          <span v-if="loading">Signing in...</span>
          <span v-else>Login</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
// import http from "@/services/api/http";

const router = useRouter();

const email = ref("");
const password = ref("");
const loading = ref(false);
const error = ref("");

async function handleLogin() {
  try {
    loading.value = true;
    error.value = "";

    /*
      TEMP LOGIN muna habang wala ka pang real admin auth endpoint.
      Palitan mo ito later ng backend login.
    */
    if (!email.value || !password.value) {
      error.value = "Email and password are required.";
      return;
    }

    // TEMP admin session
    localStorage.setItem("token", "dev-admin-token");
    localStorage.setItem("role", "admin");

    router.push("/dashboard");

    /*
      Kapag ready na backend auth, use this instead:

      const { data } = await http.post("/admin/auth/login", {
        email: email.value,
        password: password.value,
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.user.role);

      router.push("/dashboard");
    */
  } catch (e) {
    error.value =
      e?.response?.data?.message ||
      e?.message ||
      "Login failed.";
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.admin-login-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background:
    radial-gradient(circle at top left, rgba(30, 111, 181, 0.18), transparent 35%),
    linear-gradient(135deg, #f8fafc, #eef6ff);
  font-family: "DM Sans", "Segoe UI", sans-serif;
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: white;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 22px;
  padding: 28px;
  box-shadow: 0 18px 60px rgba(15, 23, 42, 0.12);
}

.brand {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 24px;
}

.logo {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  background: #1e6fb5;
  color: white;
  font-size: 22px;
  font-weight: 900;
}

.brand h1 {
  margin: 0;
  font-size: 22px;
  font-weight: 900;
  color: #0f172a;
}

.brand p {
  margin: 3px 0 0;
  font-size: 13px;
  color: #64748b;
  font-weight: 600;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.field label {
  font-size: 12px;
  font-weight: 800;
  color: #334155;
}

.field input {
  height: 44px;
  border-radius: 12px;
  border: 1.5px solid #e2e8f0;
  padding: 0 13px;
  outline: none;
  font-size: 14px;
  color: #0f172a;
}

.field input:focus {
  border-color: #1e6fb5;
  box-shadow: 0 0 0 4px rgba(30, 111, 181, 0.1);
}

.error {
  margin: 0;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(239, 68, 68, 0.08);
  color: #b91c1c;
  font-size: 13px;
  font-weight: 700;
}

button {
  height: 44px;
  border: none;
  border-radius: 12px;
  background: #0f172a;
  color: white;
  font-weight: 900;
  cursor: pointer;
}

button:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}
</style>