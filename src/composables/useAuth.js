// src/composables/useAuth.js
import { computed, ref } from "vue";
import {
  adminLogin as adminLoginApi,
  commuterLogin as commuterLoginApi,
  commuterSignup as commuterSignupApi,
  getMe,
  logout as logoutApi,
} from "@/services/api/authService";

function safeParse(value) {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

const adminUser = ref(safeParse(localStorage.getItem("natsgo_admin_user")));
const commuterUser = ref(
  safeParse(localStorage.getItem("natsgo_commuter_user"))
);

export function useAuth() {
  const adminToken = computed(() => localStorage.getItem("natsgo_admin_token"));
  const commuterToken = computed(() =>
    localStorage.getItem("natsgo_commuter_token")
  );

  const isAdminLoggedIn = computed(() => {
    return Boolean(adminToken.value && adminUser.value);
  });

  const isCommuterLoggedIn = computed(() => {
    return Boolean(commuterToken.value && commuterUser.value);
  });

  async function loginAdmin(email, password) {
    const data = await adminLoginApi({ email, password });

    localStorage.setItem("natsgo_admin_token", data.token);
    localStorage.setItem("natsgo_admin_user", JSON.stringify(data.user));

    adminUser.value = data.user;

    return data;
  }

  async function loginCommuter(email, password) {
    const data = await commuterLoginApi({ email, password });

    localStorage.setItem("natsgo_commuter_token", data.token);
    localStorage.setItem("natsgo_commuter_user", JSON.stringify(data.user));

    commuterUser.value = data.user;

    return data;
  }

  async function signupCommuter(payload) {
    const data = await commuterSignupApi(payload);

    localStorage.setItem("natsgo_commuter_token", data.token);
    localStorage.setItem("natsgo_commuter_user", JSON.stringify(data.user));

    commuterUser.value = data.user;

    return data;
  }

  async function refreshMe(type = "admin") {
    const data = await getMe();
    const user = data.data;

    if (type === "admin") {
      adminUser.value = user;
      localStorage.setItem("natsgo_admin_user", JSON.stringify(user));
    } else {
      commuterUser.value = user;
      localStorage.setItem("natsgo_commuter_user", JSON.stringify(user));
    }

    return user;
  }

  async function logoutAdmin() {
    try {
      await logoutApi();
    } catch {}

    localStorage.removeItem("natsgo_admin_token");
    localStorage.removeItem("natsgo_admin_user");
    adminUser.value = null;
  }

  async function logoutCommuter() {
    try {
      await logoutApi();
    } catch {}

    localStorage.removeItem("natsgo_commuter_token");
    localStorage.removeItem("natsgo_commuter_user");
    commuterUser.value = null;
  }

  return {
    adminUser,
    commuterUser,
    adminToken,
    commuterToken,
    isAdminLoggedIn,
    isCommuterLoggedIn,
    loginAdmin,
    loginCommuter,
    signupCommuter,
    refreshMe,
    logoutAdmin,
    logoutCommuter,
  };
}