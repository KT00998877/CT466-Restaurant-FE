import { createRouter, createWebHistory } from "vue-router";

// --- Import Views ---
import HomeView from "../views/user/HomeView.vue";
import LoginView from "../views/auth/LoginView.vue";
import RegisterView from "../views/auth/RegisterView.vue";
import ReservationView from "../views/user/ReservationView.vue";
import MyReservationsView from "../views/user/MyreservationsView.vue";
import Contact from "../views/user/Contact.vue";
import Cart from "../views/user/Cart.vue";
import DetailMenuItem from "../views/user/DetailMenuItem.vue";
import Orders from "../views/user/Orders.vue";
import PrivacyPolicy from "../views/user/PrivacyPolicy.vue";
import TermsOfService from "../views/user/TermsOfService.vue";
import RefundPolicy from "../views/user/RefundPolicy.vue";
import ShippingPolicy from "../views/user/ShippingPolicy.vue";
import UserProfile from "../views/user/UserProfile.vue";

// --- Import Layouts ---
import AdminLayout from "../views/layouts/AdminLayout.vue";
import CashierLayout from "../views/layouts/CashierLayout.vue";


// --- Import Waiter Layout ---
import WaiterLayout from "../views/layouts/WaiterLayout.vue"; 
import TableMap from "../views/waiter/TableMap.vue";
import Order from "../views/waiter/Order.vue";
import WaiterKitchenStatus from "../views/waiter/WaiterKitchenStatus.vue";
import WaiterOrders from "../views/waiter/WaiterOrders.vue";

// --- Import Kitchen Layout ---
import KitchenLayout from "../views/layouts/KitchenLayout.vue";
import PendingOrders from "../views/kitchen/Pending.vue";
import History from "../views/kitchen/History.vue";
import Ingredient from "../views/kitchen/Ingredient.vue";

// --- Import Admin Components ---
import Dashboard from "../views/admin/Dashboard.vue";
import MenuManagement from "../views/admin/MenuManagement.vue";
import OrderManagement from "../views/admin/OrderManagement.vue";
import ReservationManagement from "../views/admin/ReservationManagement.vue";
import UserManagement from "../views/admin/UserManagement.vue";
import IngredientManager from "../views/admin/IngredientManager.vue";
import AdminInventory from "../views/admin/AdminInventory.vue";
import AdminReport from "../views/admin/AdminReport.vue";


const routes = [
  // ─── AUTH (GUEST) ──────────────────────────────────────────
  {
    path: "/login",
    name: "login",
    component: LoginView,
    meta: { guest: true },
  },
  {
    path: "/register",
    name: "register",
    component: RegisterView,
    meta: { guest: true },
  },

  // ─── USER (PUBLIC) ─────────────────────────────────────────
  { path: "/", name: "home", component: HomeView },
  {
    path: "/about",
    name: "about",
    component: () => import("../views/user/Introduction.vue"),
  },
  {
    path: "/menu",
    name: "menu",
    component: () => import("../views/user/Menu.vue"),
  },
  {
    path: "/menu/category/:id?",
    name: "menu-category",
    component: () => import("../views/user/Menu.vue"),
    props: true,
  },
  { path: "/menu-detail/:id", name: "menu-detail", component: DetailMenuItem },

  { path: "/privacy", name: "privacy-policy", component: PrivacyPolicy },
  { path: "/terms", name: "terms-of-service", component: TermsOfService },
  { path: "/refund", name: "refund-policy", component: RefundPolicy },
  { path: "/shipping", name: "shipping-policy", component: ShippingPolicy },
  {
    path: "/payment-return",
    name: "payment-return",
    component: () => import("../views/user/PaymentReturn.vue"),
  },

  // ─── USER (YÊU CẦU ĐĂNG NHẬP) ──────────────────────────────
  {
    path: "/reservation",
    name: "reservation",
    component: ReservationView,
    meta: { requiresAuth: true },
  },
  {
    path: "/my-reservations",
    name: "my-reservations",
    component: MyReservationsView,
    meta: { requiresAuth: true },
  },
  {
    path: "/contact",
    name: "contact",
    component: Contact,
    meta: { requiresAuth: true },
  },
  {
    path: "/cart",
    name: "cart",
    component: Cart,
    meta: { requiresAuth: true },
  },
  {
    path: "/orders",
    name: "orders",
    component: Orders,
    meta: { requiresAuth: true },
  },

  {
    path: "/profile",
    name: "profile",
    component: UserProfile,
    meta: { requiresAuth: true },
  },

  // ─── CASHIER (THU NGÂN) ────────────────────────────────────
  {
    path: "/cashier",
    component: CashierLayout,
    meta: { requiresAuth: true, role: "cashier" }, // Đánh dấu route này chỉ dành cho cashier
    children: [
      {
        path: "orders",
        name: "cashier-orders",
        component: OrderManagement, // Tái sử dụng form quản lý hoá đơn
      },
      {
        path: "reservations",
        name: "cashier-reservations",
        component: ReservationManagement, // Tái sử dụng form quản lý đặt bàn
      },
    ],
  },

  // ─── WAITER (PHỤC VỤ) ─────────────────────────────────────
  {
    path: "/waiter",
    component: WaiterLayout,
    meta: { requiresAuth: true, role: "waiter" },
    children: [
      {
        path: "tables",
        name: "waiter-tables",
        component: TableMap,
      },
      {
        path: "order/:id", 
        name: "waiter-orders",
        component: Order,
      },
      {
        path: "kitchen-status",
        name: "waiter-kitchen-status",
        component: WaiterKitchenStatus,
      },
      {
        path: "my-orders",
        name: "waiter-my-orders",
        component: WaiterOrders,
      }
    ],
  },

  // ─── KITCHEN (BẾP) ───────────────────────────────────────

  {
    path: "/kitchen",
    component: KitchenLayout,
    meta: { requiresAuth: true, role: "kitchen" },
    children: [
      { path: "pending", name: "kitchen-pending", component: PendingOrders },
      { path: "history", name: "kitchen-history", component: History },
      { path: "ingredients", name: "kitchen-ingredients", component: Ingredient }

    ]
},

  // ─── ADMIN (QUẢN TRỊ VIÊN) ──────────────────────────────────
  {
    path: "/admin",
    component: AdminLayout,
    meta: { requiresAuth: true, role: "admin" }, // Sửa lại thành thuộc tính role
    children: [
      { path: "dashboard", name: "admin-dashboard", component: Dashboard },
      { path: "menu", name: "admin-menu", component: MenuManagement },
      { path: "orders", name: "admin-orders", component: OrderManagement },
      {
        path: "reservations",
        name: "admin-reservations",
        component: ReservationManagement,
      },
      { path: "users", name: "admin-users", component: UserManagement },
      { path: "ingredients", name: "admin-ingredients", component: IngredientManager },
      { path: "inventory", name: "admin-inventory", component: AdminInventory },
      { path: "reports", name: "admin-reports", component: AdminReport }
    ],
  },

  // Catch-all route
  { path: "/:pathMatch(.*)*", redirect: "/" },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// ─── BẢO MẬT & ĐIỀU HƯỚNG (NAVIGATION GUARD) ─────────────────
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("user_role");

  // 1. Trạng thái GUEST: Đã login rồi thì đẩy về đúng trang làm việc của từng người
  if (to.meta.guest && token) {
    if (role === "admin") return next("/admin/dashboard");
    if (role === "cashier") return next("/cashier/orders"); // Thu ngân vào thẳng trang quản lý hoá đơn
    return next("/"); // Khách hàng đẩy về trang chủ
  }

  // 2. Trạng thái REQUIRES AUTH: Yêu cầu đăng nhập
  if (to.meta.requiresAuth) {
    if (!token) return next("/login");

    // Kiểm tra phân quyền: Nếu route yêu cầu role cụ thể
    if (to.meta.role) {
      // Nếu trang yêu cầu admin nhưng người dùng không phải admin
      if (to.meta.role === "admin" && role !== "admin") {
        return next("/"); // Đuổi về trang chủ
      }

      // Nếu trang yêu cầu cashier nhưng người dùng không phải cashier
      if (to.meta.role === "cashier" && role !== "cashier") {
        if (role === "admin") return next("/admin/dashboard"); // Admin đi lạc vào link thu ngân thì trả về nhà Admin
        return next("/"); // Khách đi lạc thì đuổi về trang chủ
      }
    }
  }

  next();
});

export default router;
