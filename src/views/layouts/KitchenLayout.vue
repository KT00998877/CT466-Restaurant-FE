<template>
    <div class="kitchen-layout">
        <aside class="sidebar" :class="{ 'sidebar-closed': !isSidebarOpen }">
            <div class="sidebar-header">
                <span v-if="isSidebarOpen" class="logo-text text-danger">KITCHEN PANEL</span>
                <span v-else class="logo-icon text-danger">KP</span>
            </div>

            <ul class="sidebar-menu">
                <li>
                    <router-link to="/kitchen/pending" title="Món chờ chế biến">
                        <i class="bi bi-fire"></i>
                        <span v-if="isSidebarOpen">Món chờ chế biến</span>
                    </router-link>
                </li>
                <li>
                    <router-link to="/kitchen/history" title="Đã hoàn thành">
                        <i class="bi bi-check2-circle"></i>
                        <span v-if="isSidebarOpen">Món đã xong</span>
                    </router-link>
                </li>
            </ul>
        </aside>

        <div class="main-wrapper">
            <header class="admin-header">
                <div class="hamburger" @click="toggleSidebar">
                    <i class="bi bi-list fs-3"></i>
                </div>

                <div class="nav-actions d-flex align-items-center gap-3">
                    <div class="user-dropdown position-relative">
                        <div class="user-info" @click="toggleUserDropdown">
                            <span class="fw-bold me-2 d-none d-md-inline">{{ user?.name || 'Đầu Bếp' }}</span>
                            <i class="bi bi-person-badge fs-3 text-secondary"></i>
                        </div>

                        <ul class="user-dropdown-content" :class="{ show: isUserDropdownOpen }">
                            <li class="user-name d-md-none">Xin chào, {{ user?.name || 'Đầu Bếp' }}</li>
                            <li>
                                <a href="#" @click.prevent="handleLogout">
                                    <i class="bi bi-box-arrow-right me-2"></i>Đăng xuất
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </header>

            <main class="admin-content">
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
/* Giữ nguyên cấu trúc CSS của AdminLayout, chỉ đổi class cha và một số màu nhấn */
.kitchen-layout {
    display: flex;
    min-height: 100vh;
    background-color: #f4f6f9;
}

/* ================= SIDEBAR ================= */
.sidebar {
    width: 260px;
    background-color: #2c3e50;
    /* Đổi màu nền xíu cho khác biệt với admin */
    color: #c2c7d0;
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
    color: white;
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
    color: #c2c7d0;
    text-decoration: none;
    font-size: 1.1rem;
    /* Chữ to hơn chút cho bếp dễ nhìn */
    transition: all 0.3s;
    white-space: nowrap;
    overflow: hidden;
}

.sidebar-closed .sidebar-menu li a {
    justify-content: center;
    padding: 15px 0;
}

.sidebar-menu li a i {
    font-size: 1.4rem;
}

.sidebar-menu li a:hover,
.sidebar-menu li a.router-link-exact-active {
    background-color: #e74c3c;
    /* Chuyển màu active sang Đỏ/Cam cho hợp với Lửa/Bếp */
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
.admin-header {
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
    color: #e74c3c;
    border-bottom: 1px solid #eee;
    margin-bottom: 5px;
}

.user-dropdown-content li a {
    display: block;
    padding: 12px 20px;
    color: #444;
    text-decoration: none;
    transition: 0.2s;
}

.user-dropdown-content li a:hover {
    background: #fff5eb;
    color: #e74c3c;
}

/* ================= CONTENT SLOT ================= */
.admin-content {
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