<template>
    <div class="panel-layout admin-theme">
        <!-- Sidebar -->
        <aside class="panel-sidebar" :class="{ collapsed: !isSidebarOpen }">
            <!-- Logo -->
            <div class="panel-logo">
                <div class="panel-logo__mark">
                    <div class="panel-logo__icon">
                        <i class="bi bi-grid-fill"></i>
                    </div>
                    <div class="panel-logo__texts">
                        <span class="panel-logo__title">Admin Panel</span>
                        <span class="panel-logo__sub">Nhà hàng XYZ</span>
                    </div>
                </div>
            </div>

            <!-- Navigation -->
            <nav class="panel-nav">
                <div class="panel-nav__section">
                    <span v-if="isSidebarOpen" class="panel-nav__label">Tổng quan</span>
                    <router-link to="/admin/dashboard" class="panel-nav__item" title="Tổng quan">
                        <i class="bi bi-speedometer2 panel-nav__icon"></i>
                        <span class="panel-nav__text">Tổng quan</span>
                    </router-link>
                </div>

                <div class="panel-nav__section">
                    <span v-if="isSidebarOpen" class="panel-nav__label">Quản lý</span>
                    <router-link to="/admin/menu" class="panel-nav__item" title="Thực đơn">
                        <i class="bi bi-card-list panel-nav__icon"></i>
                        <span class="panel-nav__text">Thực đơn</span>
                    </router-link>
                    <router-link to="/admin/dishes" class="panel-nav__item" title="Tiến độ Món ăn">
                        <i class="bi bi-egg panel-nav__icon"></i>
                        <span class="panel-nav__text">Tiến độ Món ăn</span>
                    </router-link>
                    <router-link to="/admin/orders" class="panel-nav__item" title="Hoá đơn">
                        <i class="bi bi-receipt panel-nav__icon"></i>
                        <span class="panel-nav__text">Hoá đơn</span>
                    </router-link>
                    <router-link to="/admin/reservations" class="panel-nav__item" title="Đặt bàn">
                        <i class="bi bi-calendar-check panel-nav__icon"></i>
                        <span class="panel-nav__text">Đặt bàn</span>
                        <span v-if="pendingReservations > 0" class="panel-nav__badge">
                            {{ pendingReservations }}
                        </span>
                    </router-link>
                    <router-link to="/admin/users" class="panel-nav__item" title="Tài khoản">
                        <i class="bi bi-people panel-nav__icon"></i>
                        <span class="panel-nav__text">Tài khoản</span>
                    </router-link>
                </div>

                <div class="panel-nav__section">
                    <span v-if="isSidebarOpen" class="panel-nav__label">Kho & Báo cáo</span>
                    <router-link to="/admin/ingredients" class="panel-nav__item" title="Nguyên liệu">
                        <i class="bi bi-box-seam panel-nav__icon"></i>
                        <span class="panel-nav__text">Nguyên liệu</span>
                    </router-link>
                    <router-link to="/admin/inventory" class="panel-nav__item" title="Kho hàng">
                        <i class="bi bi-bar-chart panel-nav__icon"></i>
                        <span class="panel-nav__text">Kho hàng</span>
                    </router-link>
                    <router-link to="/admin/contacts" class="panel-nav__item" title="Liên hệ">
                        <i class="bi bi-envelope panel-nav__icon"></i>
                        <span class="panel-nav__text">Liên hệ</span>
                    </router-link>
                    <router-link to="/admin/reports" class="panel-nav__item" title="Báo cáo Doanh thu">
                        <i class="bi bi-graph-up panel-nav__icon"></i>
                        <span class="panel-nav__text">Báo cáo Doanh thu</span>
                    </router-link>
                </div>
            </nav>

            <!-- User Footer -->
            <div class="panel-footer">
                <div class="panel-user" @click="toggleUserDropdown" ref="userRef">
                    <div class="panel-user__avatar">{{ userInitials }}</div>
                    <div class="panel-user__info">
                        <span class="panel-user__name">{{ user?.name || 'Admin' }}</span>
                        <span class="panel-user__role">Administrator</span>
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
                <button class="panel-header__toggle" @click="toggleSidebar" title="Toggle sidebar">
                    <i class="bi bi-list"></i>
                </button>

                <div class="panel-header__breadcrumb">
                    <span class="panel-header__breadcrumb-parent">Trang chủ</span>
                    <i class="bi bi-chevron-right panel-header__breadcrumb-sep"></i>
                    <span class="panel-header__breadcrumb-current">{{ currentPageTitle }}</span>
                </div>

                <div class="panel-header__actions">
                    <router-link to="/" class="panel-header__btn">
                        <i class="bi bi-shop"></i>
                        <span>Xem trang web</span>
                    </router-link>
                    <!-- <div class="panel-header__icon-btn" :class="{ 'has-notif': pendingReservations > 0 }">
                        <i class="bi bi-bell"></i>
                    </div> -->
                </div>
            </header>

            <!-- Content -->
            <main class="panel-content">
                <router-view></router-view>
            </main>
        </div>

        <!-- Mobile overlay -->
        <div v-if="isSidebarOpen && isMobile" class="panel-overlay" @click="toggleSidebar"></div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuth } from '@/composables/useAuth';
import api from '@/services/api';
import '@/assets/panel-layout.css';

const router = useRouter();
const route = useRoute();
const { user, logout } = useAuth();

const isMobile = ref(window.innerWidth <= 768);
const isSidebarOpen = ref(window.innerWidth > 768);
const isUserDropdownOpen = ref(false);
const pendingReservations = ref(0);
const userRef = ref(null);

const pageMap = {
    '/admin/dashboard': 'Tổng quan',
    '/admin/menu': 'Thực đơn',
    '/admin/dishes': 'Tiến độ Món ăn',
    '/admin/orders': 'Hoá đơn',
    '/admin/reservations': 'Đặt bàn',
    '/admin/users': 'Tài khoản',
    '/admin/ingredients': 'Nguyên liệu',
    '/admin/inventory': 'Kho hàng',
    '/admin/contacts': 'Liên hệ',
    '/admin/reports': 'Báo cáo',
};
const currentPageTitle = computed(() => pageMap[route.path] || 'Admin');

const userInitials = computed(() => {
    const name = user?.value?.name || 'Admin';
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

const fetchPendingReservations = async () => {
    try {
        const res = await api.get('/admin/reservations');
        const data = res.data.reservations || [];
        pendingReservations.value = data.filter(r => r.status === 'pending').length;
    } catch (e) { /* silent */ }
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
    fetchPendingReservations();
});
onUnmounted(() => {
    window.removeEventListener('resize', onResize);
    window.removeEventListener('click', onClickOutside);
});
</script>

<style scoped>
/* Admin accent — cam (default của panel-layout, khai báo tường minh cho rõ) */
.admin-theme {
    --accent-color: #e8672a;
    --accent-hover: #c45320;
    --accent-light: rgba(232, 103, 42, 0.12);
}
</style>