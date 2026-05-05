import { defineStore } from "pinia";
import {
  adminLogin,
  commuterLogin,
  commuterSignup,
  getMe,
  logout,
} from "@/services/api/authService";
import { API_BASE } from "@/services/api/http";

function safeParse(value) {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export const useAuthStore = defineStore("auth", {
  state: () => ({
    adminToken: localStorage.getItem("natsgo_admin_token"),
    commuterToken: localStorage.getItem("natsgo_commuter_token"),

    adminUser: safeParse(localStorage.getItem("natsgo_admin_user")),
    commuterUser: safeParse(localStorage.getItem("natsgo_commuter_user")),

    loading: false,
  }),

  getters: {
    isAdminLoggedIn: (state) => Boolean(state.adminToken && state.adminUser),
    isCommuterLoggedIn: (state) =>
      Boolean(state.commuterToken && state.commuterUser),

    currentAdmin: (state) => state.adminUser,
    currentCommuter: (state) => state.commuterUser,

    canManageAdmins: (state) =>
      Boolean(state.adminUser?.permissions?.can_manage_admins),
  },

  actions: {
    setAdminSession(token, user) {
      this.adminToken = token;
      this.adminUser = user;

      localStorage.setItem("natsgo_admin_token", token);
      localStorage.setItem("natsgo_admin_user", JSON.stringify(user));
    },

    setCommuterSession(token, user) {
      this.commuterToken = token;
      this.commuterUser = user;

      localStorage.setItem("natsgo_commuter_token", token);
      localStorage.setItem("natsgo_commuter_user", JSON.stringify(user));
    },

    async loginAdmin(payload) {
      this.loading = true;

      try {
        const data = await adminLogin(payload);
        this.setAdminSession(data.token, data.user);

        localStorage.removeItem("token");
        localStorage.removeItem("role");

        return data;
      } finally {
        this.loading = false;
      }
    },

    async loginCommuter(payload) {
      this.loading = true;

      try {
        const data = await commuterLogin(payload);
        this.setCommuterSession(data.token, data.user);
        return data;
      } finally {
        this.loading = false;
      }
    },

    async signupCommuter(payload) {
      this.loading = true;

      try {
        const data = await commuterSignup(payload);
        this.setCommuterSession(data.token, data.user);
        return data;
      } finally {
        this.loading = false;
      }
    },

    startGoogleLogin() {
      window.location.href = `${API_BASE}/auth/google`;
    },

    startFacebookLogin() {
      window.location.href = `${API_BASE}/auth/facebook`;
    },

    handleOAuthCallback({ token, user, type }) {
      if (!token || !user) return;

      const parsedUser =
        typeof user === "string" ? JSON.parse(decodeURIComponent(user)) : user;

      if (type === "commuter") {
        this.setCommuterSession(token, parsedUser);
      } else {
        this.setAdminSession(token, parsedUser);
      }
    },

    async refreshMe(type = "commuter") {
      const data = await getMe();

      if (type === "admin") {
        this.setAdminSession(this.adminToken, data.data);
      } else {
        this.setCommuterSession(this.commuterToken, data.data);
      }

      return data.data;
    },

    async logoutAdmin() {
      try {
        await logout();
      } catch {}

      this.adminToken = null;
      this.adminUser = null;

      localStorage.removeItem("natsgo_admin_token");
      localStorage.removeItem("natsgo_admin_user");
      localStorage.removeItem("token");
      localStorage.removeItem("role");
    },

    async logoutCommuter() {
      try {
        await logout();
      } catch {}

      this.commuterToken = null;
      this.commuterUser = null;

      localStorage.removeItem("natsgo_commuter_token");
      localStorage.removeItem("natsgo_commuter_user");
    },
  },
});