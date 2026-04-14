<template>
    <div class="waiter-layout waiter-theme">
        <!-- Header -->
        <header class="waiter-header">
            <div class="waiter-brand">
                <i class="bi bi-person-workspace" style="font-size:18px; color: var(--accent-color)"></i>
                <span>Phục vụ</span>
            </div>

            <div class="waiter-user" @click="toggleUserDropdown" ref="userRef">
                <div class="waiter-user__trigger">
                    <div class="waiter-user__avatar">{{ userInitials }}</div>
                    <span class="waiter-user__name">{{ user?.name || 'Waiter' }}</span>
                    <i class="bi bi-chevron-down" style="font-size:11px; color:#999"></i>
                </div>

                <div class="waiter-user__dropdown" :class="{ show: isUserDropdownOpen }">
                    <a href="#" class="panel-dropdown__item panel-dropdown__item--danger" @click.prevent="handleLogout">
                        <i class="bi bi-box-arrow-right"></i> Đăng xuất
                    </a>
                </div>
            </div>
        </header>

        <!-- Content -->
        <main class="waiter-content">
            <router-view></router-view>
        </main>

        <!-- Nav (trái desktop / dưới mobile) -->
        <nav class="waiter-nav">
            <ul class="waiter-nav__menu">
                <li>
                    <router-link to="/waiter/tables" class="waiter-nav__item" title="Sơ đồ bàn">
                        <i class="bi bi-grid-3x3-gap"></i>
                        <span>Sơ đồ bàn</span>
                    </router-link>
                </li>
                <li>
                    <router-link to="/waiter/kitchen-status" class="waiter-nav__item" title="Trạng thái Bếp">
                        <i class="bi bi-bell"></i>
                        <span v-if="readyCount > 0" class="waiter-nav__badge">{{ readyCount }}</span>
                        <span>Trạng thái Bếp</span>
                    </router-link>
                </li>
                <li>
                    <router-link to="/waiter/my-orders" class="waiter-nav__item" title="Đơn hàng">
                        <i class="bi bi-receipt"></i>
                        <span>Đơn hàng</span>
                    </router-link>
                </li>
            </ul>
        </nav>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/composables/useAuth';
import api from '@/services/api';
import '@/assets/panel-layout.css';

const router = useRouter();
const { user, logout } = useAuth();

const isUserDropdownOpen = ref(false);
const readyCount = ref(0);
const userRef = ref(null);
let notificationInterval = null;

const userInitials = computed(() => {
    const name = user?.value?.name || 'PV';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
});

const fetchReadyCount = async () => {
    try {
        const res = await api.get('/waiter/notifications/ready-count');
        if (res.data.success) readyCount.value = res.data.count;
    } catch (e) { /* silent */ }
};

const toggleUserDropdown = (e) => {
    e.stopPropagation();
    isUserDropdownOpen.value = !isUserDropdownOpen.value;
};

const handleLogout = async () => {
    isUserDropdownOpen.value = false;
    try { await logout(); } finally { router.push('/login'); }
};

const onClickOutside = (e) => {
    if (userRef.value && !userRef.value.contains(e.target)) {
        isUserDropdownOpen.value = false;
    }
};

onMounted(() => {
    window.addEventListener('click', onClickOutside);
    fetchReadyCount();
    notificationInterval = setInterval(fetchReadyCount, 10000);
});

onUnmounted(() => {
    window.removeEventListener('click', onClickOutside);
    if (notificationInterval) clearInterval(notificationInterval);
});
</script>

<style scoped>
/* Override accent → cam cho Waiter */
.waiter-theme {
    --accent-color: #e67e22;
    --accent-hover: #ca6f1e;
    --accent-light: rgba(230, 126, 34, 0.12);
}
</style>