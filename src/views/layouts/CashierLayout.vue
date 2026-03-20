<template>
    <div class="cashier-layout">
        <aside class="sidebar" :class="{ 'sidebar-closed': !isSidebarOpen }">
            <div class="sidebar-header">
                <span v-if="isSidebarOpen" class="logo-text text-success">CASHIER PANEL</span>
                <span v-else class="logo-icon text-success">CP</span>
            </div>

            <ul class="sidebar-menu">

                <li>
                    <router-link to="/cashier/orders" title="Quản lý Hoá đơn & Thanh toán">
                        <i class="bi bi-receipt"></i>
                        <span v-if="isSidebarOpen">Đơn hàng & Thanh toán</span>
                    </router-link>
                </li>
                <li>
                    <router-link to="/cashier/reservations" title="Quản lý Đặt bàn">
                        <i class="bi bi-calendar-check"></i>
                        <span v-if="isSidebarOpen">Quản lý Đặt bàn</span>
                    </router-link>
                </li>
            </ul>
        </aside>

        <div class="main-wrapper">
            <header class="cashier-header">
                <div class="hamburger" @click="toggleSidebar">
                    <i class="bi bi-list fs-3"></i>
                </div>

                <div class="nav-actions d-flex align-items-center gap-3">
                    <router-link to="/" class="btn btn-outline-secondary btn-sm me-2">
                        <i class="bi bi-shop me-1"></i> Xem trang web
                    </router-link>

                    <div class="user-dropdown position-relative">
                        <div class="user-info" @click="toggleUserDropdown">
                            <div class="d-none d-md-flex flex-column text-end me-2">
                                <span class="fw-bold lh-1">{{ user?.name || 'Cashier' }}</span>
                                <small class="text-success fw-medium">Thu ngân</small>
                            </div>
                            <i class="bi bi-person-badge fs-3 text-success"></i>
                        </div>

                        <ul class="user-dropdown-content" :class="{ show: isUserDropdownOpen }">
                            <li class="user-name d-md-none">
                                Xin chào, {{ user?.name }}
                                <span class="badge bg-success mt-1">Thu ngân</span>
                            </li>
                            <li>
                                <a href="#" @click.prevent="handleLogout">
                                    <i class="bi bi-box-arrow-right me-2"></i>Đăng xuất
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </header>

            <main class="cashier-content">
                <router-view></router-view>
            </main>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/composables/useAuth';

const router = useRouter();
const { user, logout } = useAuth();

// Mặc định mở Sidebar trên Desktop, đóng trên Mobile
const isSidebarOpen = ref(window.innerWidth > 768);
const isUserDropdownOpen = ref(false);

const toggleSidebar = () => {
    isSidebarOpen.value = !isSidebarOpen.value;
};

const toggleUserDropdown = (event) => {
    event.preventDefault();
    isUserDropdownOpen.value = !isUserDropdownOpen.value;
};

const handleLogout = async () => {
    isUserDropdownOpen.value = false;
    try {
        await logout();
    } finally {
        router.push('/login');
    }
};

// Đóng dropdown khi click ra ngoài
const closeClickOutside = (e) => {
    if (!e.target.closest('.user-dropdown')) {
        isUserDropdownOpen.value = false;
    }
};

onMounted(() => {
    window.addEventListener('click', closeClickOutside);
    // Tự động điều chỉnh sidebar khi resize màn hình
    window.addEventListener('resize', () => {
        if (window.innerWidth <= 768) isSidebarOpen.value = false;
        else isSidebarOpen.value = true;
    });
});

onUnmounted(() => {
    window.removeEventListener('click', closeClickOutside);
});
</script>

<style scoped>
.cashier-layout {
    display: flex;
    min-height: 100vh;
    background-color: #f8f9fa;
}

/* ================= SIDEBAR ================= */
.sidebar {
    width: 260px;
    background-color: #2c3e50;
    /* Thay đổi một chút màu nền để phân biệt với Admin */
    color: #ecf0f1;
    transition: width 0.3s ease;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    z-index: 1000;
}

.sidebar-closed {
    width: 70px;
}

.sidebar-header {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #1a252f;
    border-bottom: 1px solid #34495e;
}

.logo-text {
    font-size: 1.2rem;
    font-weight: bold;
    letter-spacing: 1px;
}

.logo-icon {
    font-size: 1.5rem;
    font-weight: bold;
}

.sidebar-menu {
    list-style: none;
    padding: 10px 0;
    margin: 0;
}

.sidebar-menu li a {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 15px 20px;
    color: #ecf0f1;
    text-decoration: none;
    font-size: 1rem;
    transition: all 0.3s;
    white-space: nowrap;
    overflow: hidden;
}

.sidebar-closed .sidebar-menu li a {
    justify-content: center;
    padding: 15px 0;
}

.sidebar-menu li a i {
    font-size: 1.3rem;
}

.sidebar-menu li a:hover,
.sidebar-menu li a.router-link-exact-active {
    background-color: #27ae60;
    /* Đổi màu active sang xanh lá (màu thường thấy của thu ngân/tiền bạc) */
    color: white;
}

/* ================= MAIN WRAPPER ================= */
.main-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

/* ================= HEADER ================= */
.cashier-header {
    height: 60px;
    background-color: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 20px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    z-index: 999;
}

.hamburger {
    cursor: pointer;
    color: #333;
}

.user-info {
    display: flex;
    align-items: center;
    cursor: pointer;
}

/* ================= DROPDOWN ================= */
.user-dropdown-content {
    display: none;
    position: absolute;
    top: 100%;
    right: 0;
    background: white;
    min-width: 200px;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    margin-top: 15px;
    padding: 10px 0;
    list-style: none;
}

.user-dropdown-content.show {
    display: block;
}

.user-dropdown-content .user-name {
    padding: 10px 20px;
    font-weight: bold;
    color: #27ae60;
    border-bottom: 1px solid #eee;
    margin-bottom: 5px;
    display: flex;
    flex-direction: column;
}

.user-dropdown-content li a {
    display: block;
    padding: 12px 20px;
    color: #444;
    text-decoration: none;
    transition: 0.2s;
}

.user-dropdown-content li a:hover {
    background: #e8f8f5;
    color: #27ae60;
}

/* ================= CONTENT SLOT ================= */
.cashier-content {
    flex: 1;
    padding: 25px;
    overflow-y: auto;
}

/* ================= RESPONSIVE ================= */
@media (max-width: 768px) {
    .sidebar {
        position: fixed;
        height: 100vh;
        left: -260px;
    }

    .sidebar:not(.sidebar-closed) {
        left: 0;
        width: 260px;
    }

    .main-wrapper {
        width: 100%;
    }
}
</style>