<template>
    <div class="inventory-management">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="fw-bold text-dark"><i class="bi bi-box-seam me-2"></i>Quản lý Nguyên Liệu</h2>
            <button class="btn btn-outline-secondary" @click="fetchIngredients">
                <i class="bi bi-arrow-clockwise me-1"></i> Làm mới
            </button>
        </div>

        <div class="card border-0 shadow-sm">
            <div class="card-body p-0">
                <table class="table table-hover align-middle mb-0 text-center">
                    <thead class="table-dark">
                        <tr>
                            <th>ID</th>
                            <th>Tên Nguyên Liệu</th>
                            <th>Đơn vị</th>
                            <th>Giá tham khảo</th>
                            <th>Tồn kho hiện tại</th>
                            <th>Mức cảnh báo</th>
                            <th>Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in ingredients" :key="item.id">
                            <td>{{ item.id }}</td>
                            <td class="fw-bold text-primary text-start">{{ item.name }}</td>
                            <td>{{ item.unit }}</td>
                            <td class="text-muted">{{ formatCurrency(item.price) }}</td>
                            <td class="fw-bold"
                                :class="item.stock_quantity <= item.reorder_level ? 'text-danger fs-5' : 'text-success'">
                                {{ item.stock_quantity }}
                                <i v-if="item.stock_quantity <= item.reorder_level"
                                    class="bi bi-exclamation-triangle-fill ms-1" title="Sắp hết hàng!"></i>
                            </td>

                            <td class="text-muted">{{ item.reorder_level }}</td>
                            <td>
                                <span v-if="item.stock_quantity <= item.reorder_level" class="badge bg-danger">Sắp hết</span>
                                <span v-else class="badge bg-success">Bình thường</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '@/services/api';

const ingredients = ref([]);

const formatCurrency = (val) => {
    if (val === null || val === undefined) return '0 đ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
};

const fetchIngredients = async () => {
    try {
        const res = await api.get('/admin/ingredients');
        if (res.data.success) {
            ingredients.value = res.data.data;
        }
    } catch (error) {
        console.error("Lỗi tải nguyên liệu:", error);
    }
};

onMounted(() => {
    fetchIngredients();
});
</script>
