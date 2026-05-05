<template>
  <div class="auth-callback">
    <div class="auth-card">
      <i class="fas fa-spinner fa-spin"></i>
      <h1>Signing you in...</h1>
      <p>Please wait while we finish your login.</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

onMounted(() => {
  const token = route.query.token;
  const user = route.query.user;
  const type = route.query.type || "commuter";

  if (!token || !user) {
    router.replace("/");
    return;
  }

  auth.handleOAuthCallback({
    token,
    user,
    type,
  });

  if (type === "admin") {
    router.replace("/dashboard");
  } else {
    router.replace("/");
  }
});
</script>

<style scoped>
.auth-callback {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #f8fafc;
  font-family: "DM Sans", "Segoe UI", sans-serif;
}

.auth-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  padding: 28px;
  text-align: center;
  width: min(360px, calc(100% - 32px));
}

.auth-card i {
  font-size: 28px;
  color: #0ea5e9;
}

.auth-card h1 {
  font-size: 20px;
  margin: 14px 0 6px;
}

.auth-card p {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}
</style>