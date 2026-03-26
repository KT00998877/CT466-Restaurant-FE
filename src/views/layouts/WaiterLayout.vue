<template>
    <div class="waiter-layout">
        <header class="waiter-header">
            <div class="brand">
                <i class="bi bi-shop fs-4 text-primary me-2"></i>
                <span class="fw-bold">POS Phục vụ</span>
            </div>

            <div class="user-dropdown position-relative">
                <div class="user-info" @click="toggleUserDropdown">
                    <span class="fw-bold me-2">{{ user?.name || 'Waiter' }}</span>
                    <i class="bi bi-person-circle fs-3 text-secondary"></i>
                </div>

                <ul class="user-dropdown-content" :class="{ show: isUserDropdownOpen }">
                    <li>
                        <a href="#" @click.prevent="handleLogout">
                            <i class="bi bi-box-arrow-right me-2"></i>Đăng xuất
                        </a>
                    </li>
                </ul>
            </div>
        </header>

        <main class="waiter-content">
            <router-view></router-view>
        </main>

        <nav class="waiter-nav">
            <ul class="nav-menu">
                <li>
                    <router-link to="/waiter/tables" title="Sơ đồ bàn">
                        <i class="bi bi-grid-3x3-gap"></i>
                        <span>Sơ đồ bàn</span>
                    </router-link>
                </li>
                <li>
                    <router-link to="/waiter/kitchen-status" title="Bếp / Bar">
                        <div class="position-relative">
                            <i class="bi bi-bell"></i>
                           <span v-if="readyCount > 0"
                                class="badge bg-danger rounded-pill position-absolute top-0 start-100 translate-middle"
                                style="font-size: 0.6rem;">
                                {{ readyCount }}
                            </span>
                        </div>
                        <span>Trạng thái Bếp</span>
                    </router-link>
                </li>
                <li>
                    <router-link to="/waiter/my-orders" title="Đơn trong ngày">
                        <i class="bi bi-receipt"></i>
                        <span>Đơn hàng</span>
                    </router-link>
                </li>
            </ul>
        </nav>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/composables/useAuth';
import api from '@/services/api';

const router = useRouter();
const { user, logout } = useAuth();
const isUserDropdownOpen = ref(false);

// --- LOGIC THÔNG BÁO TỪ BẾP ---
const readyCount = ref(0);
let notificationInterval = null;

const fetchReadyCount = async () => {
    try {
        const res = await api.get('/waiter/notifications/ready-count');
        if (res.data.success) {
            readyCount.value = res.data.count;
        }
    } catch (error) {
        console.error("Lỗi lấy thông báo bếp:", error);
    }
};
// ------------------------------

// 1. SỬA LẠI HÀM NÀY: Mở / Đóng menu khi bấm vào tên User
const toggleUserDropdown = (event) => {
    event.preventDefault();
    isUserDropdownOpen.value = !isUserDropdownOpen.value;
};

// 2. SỬA LẠI HÀM NÀY: Xử lý Đăng xuất
const handleLogout = async () => {
    isUserDropdownOpen.value = false;
    try {
        await logout();
    } finally {
        router.push('/login');
    }
};

// 3. SỬA LẠI HÀM NÀY: Đóng menu khi bấm ra ngoài khoảng trống
const closeClickOutside = (e) => {
    if (!e.target.closest('.user-dropdown')) {
        isUserDropdownOpen.value = false;
    }
};

onMounted(() => {
    window.addEventListener('click', closeClickOutside);

    // Khởi chạy đếm thông báo và lặp lại mỗi 10 giây
    fetchReadyCount();
    notificationInterval = setInterval(fetchReadyCount, 10000);
});

onUnmounted(() => {
    window.removeEventListener('click', closeClickOutside);
    if (notificationInterval) clearInterval(notificationInterval);
});
</script>

<style scoped>
/* Tổng thể Layout */
.waiter-layout {
    display: grid;
    /* Desktop: Cột 1 là Nav (100px), Cột 2 là phần còn lại */
    /* Hàng 1 là Header (60px), Hàng 2 là Content */
    grid-template-areas:
        "nav header"
        "nav content";
    grid-template-columns: 100px 1fr;
    grid-template-rows: 60px 1fr;
    height: 100vh;
    width: 100vw;
    background-color: #f4f6f9;
    overflow: hidden;
}

/* ================= HEADER (Bên phải Nav) ================= */
.waiter-header {
    grid-area: header;
    height: 60px;
    background-color: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 20px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    z-index: 10;
}

.brand {
    display: flex;
    align-items: center;
    color: #333;
}

.user-info {
    display: flex;
    align-items: center;
    cursor: pointer;
}

/* ================= DROPDOWN (Nằm trên cùng) ================= */
.user-dropdown-content {
    display: none;
    position: absolute;
    top: 100%;
    right: 0;
    background: white;
    min-width: 160px;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    margin-top: 10px;
    /* Hạ xuống một chút so với nút */
    padding: 8px 0;
    list-style: none;
    z-index: 9999;
}

.user-dropdown-content.show {
    display: block;
}

.user-dropdown-content li a {
    display: block;
    padding: 12px 20px;
    color: #e74c3c;
    text-decoration: none;
    font-weight: 500;
}

/* ================= SIDEBAR NAV (Bên trái) ================= */
.waiter-nav {
    grid-area: nav;
    background-color: white;
    box-shadow: 2px 0 10px rgba(0, 0, 0, 0.05);
    z-index: 20;
    display: flex;
    flex-direction: column;
}

.nav-menu {
    list-style: none;
    margin: 0;
    padding: 20px 0;
    display: flex;
    flex-direction: column;
    /* Xếp dọc */
    gap: 10px;
}

.nav-menu li a {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 15px 5px;
    color: #6c757d;
    text-decoration: none;
    font-size: 0.8rem;
    transition: all 0.2s ease;
}

.nav-menu li a i {
    font-size: 1.6rem;
    margin-bottom: 5px;
}

.nav-menu li a:hover,
.nav-menu li a.router-link-exact-active {
    color: #e67e22;
    background-color: #fff5eb;
    border-right: 3px solid #e67e22;
}

/* ================= MAIN CONTENT ================= */
.waiter-content {
    grid-area: content;
    overflow-y: auto;
    padding: 20px;
}

/* ================= RESPONSIVE (Mobile) ================= */
@media (max-width: 768px) {
    .waiter-layout {
        /* Chuyển về layout Header trên cùng, Content giữa, Nav dưới cùng */
        grid-template-areas:
            "header"
            "content"
            "nav";
        grid-template-columns: 100%;
        grid-template-rows: 60px 1fr 70px;
    }

    .waiter-nav {
        flex-direction: row;
        box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
    }

    .nav-menu {
        flex-direction: row;
        width: 100%;
        padding: 0;
        gap: 0;
    }

    .nav-menu li {
        flex: 1;
    }

    .nav-menu li a {
        padding: 10px 0;
        border-right: none;
    }

    .nav-menu li a.router-link-exact-active {
        border-top: 3px solid #e67e22;
        border-right: none;
    }
}
</style>