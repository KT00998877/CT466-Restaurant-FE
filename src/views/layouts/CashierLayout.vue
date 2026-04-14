<template>
    <div class="panel-layout cashier-theme">
        <!-- Sidebar -->
        <aside class="panel-sidebar" :class="{ collapsed: !isSidebarOpen }">
            <!-- Logo -->
            <div class="panel-logo">
                <div class="panel-logo__mark">
                    <div class="panel-logo__icon">
                        <i class="bi bi-cash-coin"></i>
                    </div>
                    <div class="panel-logo__texts">
                        <span class="panel-logo__title">Cashier Panel</span>
                        <span class="panel-logo__sub">Thu ngân</span>
                    </div>
                </div>
            </div>

            <!-- Nav -->
            <nav class="panel-nav">
                <div class="panel-nav__section">
                    <span v-if="isSidebarOpen" class="panel-nav__label">Nghiệp vụ</span>
                    <router-link to="/cashier/orders" class="panel-nav__item" title="Đơn hàng & Thanh toán">
                        <i class="bi bi-receipt panel-nav__icon"></i>
                        <span class="panel-nav__text">Đơn hàng & Thanh toán</span>
                    </router-link>
                    <router-link to="/cashier/reservations" class="panel-nav__item" title="Quản lý Đặt bàn">
                        <i class="bi bi-calendar-check panel-nav__icon"></i>
                        <span class="panel-nav__text">Quản lý Đặt bàn</span>
                    </router-link>
                </div>
            </nav>

            <!-- Footer user -->
            <div class="panel-footer">
                <div class="panel-user" @click="toggleUserDropdown" ref="userRef">
                    <div class="panel-user__avatar">{{ userInitials }}</div>
                    <div class="panel-user__info">
                        <span class="panel-user__name">{{ user?.name || 'Thu Ngân' }}</span>
                        <span class="panel-user__role">Thu ngân</span>
                    </div>
                    <i class="bi bi-three-dots-vertical panel-user__dots"></i>

                    <div class="panel-user__dropdown" :class="{ show: isUserDropdownOpen }">
                        <router-link to="/" class="panel-dropdown__item">
                            <i class="bi bi-shop"></i> Xem trang web
                        </router-link>
                        <div class="panel-dropdown__divider"></div>
                        <a href="#" class="panel-dropdown__item panel-dropdown__item--danger"
                            @click.prevent="handleLogout">
                            <i class="bi bi-box-arrow-right"></i> Đăng xuất
                        </a>
                    </div>
                </div>
            </div>
        </aside>

        <!-- Main -->
        <div class="panel-main">
            <!-- Topbar -->
            <header class="panel-header">
                <button class="panel-header__toggle" @click="toggleSidebar">
                    <i class="bi bi-list"></i>
                </button>
                <div class="panel-header__breadcrumb">
                    <span class="panel-header__breadcrumb-parent">Thu ngân</span>
                    <i class="bi bi-chevron-right panel-header__breadcrumb-sep"></i>
                    <span class="panel-header__breadcrumb-current">{{ currentPageTitle }}</span>
                </div>
                <div class="panel-header__actions">
                    <span class="panel-header__role-badge">
                        <i class="bi bi-cash-coin me-1"></i> Thu ngân
                    </span>
                </div>
            </header>

            <main class="panel-content">
                <router-view></router-view>
            </main>
        </div>

        <!-- Mobile overlay -->
        <div v-if="!isSidebarOpen === false && isMobile" class="panel-overlay" @click="toggleSidebar"></div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuth } from '@/composables/useAuth';
import '@/assets/panel-layout.css';

const router = useRouter();
const route = useRoute();
const { user, logout } = useAuth();

const isMobile = ref(window.innerWidth <= 768);
const isSidebarOpen = ref(window.innerWidth > 768);
const isUserDropdownOpen = ref(false);
const userRef = ref(null);

const pageMap = {
    '/cashier/orders': 'Đơn hàng & Thanh toán',
    '/cashier/reservations': 'Quản lý Đặt bàn',
};
const currentPageTitle = computed(() => pageMap[route.path] || 'Cashier');

const userInitials = computed(() => {
    const name = user?.value?.name || 'TN';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
});

const toggleSidebar = () => { isSidebarOpen.value = !isSidebarOpen.value; };
const toggleUserDropdown = (e) => {
    e.stopPropagation();
    isUserDropdownOpen.value = !isUserDropdownOpen.value;
};
const handleLogout = async () => {
    isUserDropdownOpen.value = false;
    try { await logout(); } finally { router.push('/login'); }
};

const onResize = () => {
    isMobile.value = window.innerWidth <= 768;
    isSidebarOpen.value = window.innerWidth > 768;
};
const onClickOutside = (e) => {
    if (userRef.value && !userRef.value.contains(e.target)) {
        isUserDropdownOpen.value = false;
    }
};

onMounted(() => {
    window.addEventListener('resize', onResize);
    window.addEventListener('click', onClickOutside);
});
onUnmounted(() => {
    window.removeEventListener('resize', onResize);
    window.removeEventListener('click', onClickOutside);
});
</script>

<style scoped>
/* Override accent → xanh lá cho Cashier */
.cashier-theme {
    --accent-color: #27ae60;
    --accent-hover: #1e8449;
    --accent-light: rgba(39, 174, 96, 0.12);
}
</style>