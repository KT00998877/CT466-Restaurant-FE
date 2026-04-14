<template>
    <div class="menu-management">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="h4 mb-0">Danh sách Thực đơn</h2>
        </div>

        <div class="card shadow-sm border-0">
            <div class="card-body p-0">
                <div class="table-responsive">
                    <table class="table table-hover align-middle mb-0">
                        <thead class="table-light">
                            <tr>
                                <th>ID</th>
                                <th>Tên món</th>
                                <th>Danh mục</th>
                                <th>Giá</th>
                                <th class="text-center">Đặc sắc</th>
                                <th class="text-center">Món ngon</th>
                                <th>Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-if="isLoading">
                                <td colspan="7" class="text-center py-4">Đang tải dữ liệu...</td>
                            </tr>
                            <tr v-else v-for="item in menuItems" :key="item.id">
                                <td>#{{ item.id }}</td>
                                <td class="fw-bold">{{ item.name }}</td>
                                <td>{{ item.category?.name || 'Chưa có' }}</td>
                                <td>{{ formatPrice(item.price) }}</td>

                                <td class="text-center">
                                    <i v-if="item.is_featured" class="bi bi-check-circle-fill text-success fs-5"></i>
                                    <i v-else class="bi bi-dash text-muted fs-5"></i>
                                </td>

                                <td class="text-center">
                                    <i v-if="item.is_daily_special"
                                        class="bi bi-check-circle-fill text-success fs-5"></i>
                                    <i v-else class="bi bi-dash text-muted fs-5"></i>
                                </td>

                                <td>
                                    <span class="badge" :class="getStatusClass(item.status)">
                                        {{ getStatusLabel(item.status) }}
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '@/services/api';

const menuItems = ref([]);
const isLoading = ref(true);

// ==========================================
// API FETCH
// ==========================================
const fetchMenuItems = async () => {
    isLoading.value = true;
    try {
        const response = await api.get('/kitchen/menu-items');
        if (response.data.success) {
            menuItems.value = response.data.data;
        }
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu:', error);
    } finally {
        isLoading.value = false;
    }
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================
const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

// Hàm chuyển đổi mã trạng thái thành chữ
const getStatusLabel = (status) => {
    if (status === 1) return 'Đang kinh doanh';
    if (status === 2) return 'Tạm hết nguyên liệu';
    return 'Ngừng kinh doanh';
};

// Hàm lấy màu nền (badge) cho trạng thái
const getStatusClass = (status) => {
    if (status === 1) return 'bg-success';
    if (status === 2) return 'bg-warning text-dark';
    return 'bg-danger';
};

onMounted(() => {
    fetchMenuItems();
});
</script>

<style scoped>

.menu-management {
    padding: 1rem;
}

.table th {
    font-weight: 600;
}
</style>