<template>
    <div class="panel-layout kitchen-theme">
        <!-- Sidebar -->
        <aside class="panel-sidebar" :class="{ collapsed: !isSidebarOpen }">
            <!-- Logo -->
            <div class="panel-logo">
                <div class="panel-logo__mark">
                    <div class="panel-logo__icon">
                        <i class="bi bi-fire"></i>
                    </div>
                    <div class="panel-logo__texts">
                        <span class="panel-logo__title">Kitchen Panel</span>
                        <span class="panel-logo__sub">Bếp</span>
                    </div>
                </div>
            </div>

            <!-- Nav -->
            <nav class="panel-nav">
                <div class="panel-nav__section">
                    <span v-if="isSidebarOpen" class="panel-nav__label">Bếp</span>
                    <router-link to="/kitchen/pending" class="panel-nav__item" title="Món chờ chế biến">
                        <i class="bi bi-fire panel-nav__icon"></i>
                        <span class="panel-nav__text">Món chờ chế biến</span>
                    </router-link>
                    <router-link to="/kitchen/history" class="panel-nav__item" title="Món đã xong">
                        <i class="bi bi-check2-circle panel-nav__icon"></i>
                        <span class="panel-nav__text">Món đã xong</span>
                    </router-link>
                </div>

                <div class="panel-nav__section">
                    <span v-if="isSidebarOpen" class="panel-nav__label">Quản lý</span>
                    <router-link to="/kitchen/menu" class="panel-nav__item" title="Thực đơn">
                        <i class="bi bi-card-list panel-nav__icon"></i>
                        <span class="panel-nav__text">Thực đơn</span>
                    </router-link>
                    <router-link to="/kitchen/ingredients" class="panel-nav__item" title="Nguyên liệu">
                        <i class="bi bi-box-seam panel-nav__icon"></i>
                        <span class="panel-nav__text">Danh sách nguyên liệu</span>
                    </router-link>
                </div>
            </nav>

            <!-- Footer user -->
            <div class="panel-footer">
                <div class="panel-user" @click="toggleUserDropdown" ref="userRef">
                    <div class="panel-user__avatar">{{ userInitials }}</div>
                    <div class="panel-user__info">
                        <span class="panel-user__name">{{ user?.name || 'Đầu Bếp' }}</span>
                        <span class="panel-user__role">Bếp trưởng</span>
                    </div>
                    <i class="bi bi-three-dots-vertical panel-user__dots"></i>

                    <div class="panel-user__dropdown" :class="{ show: isUserDropdownOpen }">
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
                    <span class="panel-header__breadcrumb-parent">Bếp</span>
                    <i class="bi bi-chevron-right panel-header__breadcrumb-sep"></i>
                    <span class="panel-header__breadcrumb-current">{{ currentPageTitle }}</span>
                </div>
                <div class="panel-header__actions">
                    <span class="panel-header__role-badge">
                        <i class="bi bi-fire me-1"></i> Bếp
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
    '/kitchen/pending': 'Món chờ chế biến',
    '/kitchen/history': 'Món đã xong',
    '/kitchen/menu': 'Thực đơn',
    '/kitchen/ingredients': 'Danh sách nguyên liệu',
};
const currentPageTitle = computed(() => pageMap[route.path] || 'Kitchen');

const userInitials = computed(() => {
    const name = user?.value?.name || 'DB';
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
/* Override accent → đỏ/cam cho Kitchen */
.kitchen-theme {
    --accent-color: #e74c3c;
    --accent-hover: #c0392b;
    --accent-light: rgba(231, 76, 60, 0.12);
}
</style>