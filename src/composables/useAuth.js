// src/composables/useAuth.js
import { ref, computed } from "vue";
import api from "../services/api";

// Khởi tạo trạng thái từ localStorage
const user = ref(JSON.parse(localStorage.getItem("user") || "null"));
const token = ref(localStorage.getItem("token") || null);

export function useAuth() {
  const isLoggedIn = computed(() => !!token.value);

  // Getter lấy role nhanh
  const userRole = computed(() => user.value?.role || null);
  const isAdmin = computed(() => user.value?.role === "admin");

  async function register(form) {
    const { data } = await api.post("/register", form);
    setSession(data);
    return data;
  }

  async function login(form) {
    const { data } = await api.post("/login", form);
    setSession(data);
    return data; // Trả về data để Login.vue xử lý router.push
  }

  async function logout() {
    try {
      await api.post("/auth/logout"); // Cập nhật đúng prefix route của bạn
    } finally {
      clearSession();
    }
  }

  async function fetchMe() {
    try {
      const { data } = await api.get("/auth/me");
      user.value = data.user;
      localStorage.setItem("user", JSON.stringify(data.user));
      return data.user;
    } catch (error) {
      clearSession();
      throw error;
    }
  }

  function setSession(data) {
    user.value = data.user;
    token.value = data.token;

    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("token", data.token);
    localStorage.setItem("user_role", data.user.role); // Lưu riêng role để Router Guard check nhanh

    // CẬP NHẬT QUAN TRỌNG: Gán token vào header mặc định của axios ngay lập tức
    api.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
  }

  function clearSession() {
    user.value = null;
    token.value = null;
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("user_role");

    // Xóa header Authorization
    delete api.defaults.headers.common["Authorization"];
  }

  return {
    user,
    token,
    isLoggedIn,
    userRole,
    isAdmin,
    register,
    login,
    logout,
    fetchMe,
  };
}
