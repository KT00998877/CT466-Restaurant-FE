<template>
    <div class="p-3">
        <h2 class="fw-bold mb-4"><i class="bi bi-receipt me-2"></i>Hóa Đơn Hôm Nay</h2>

        <div class="bg-white rounded shadow-sm overflow-hidden">
            <table class="table table-hover mb-0 text-center align-middle">
                <thead class="table-light">
                    <tr>
                        <th>Mã Đơn</th>
                        <th>Bàn</th>
                        <th>Tổng tiền</th>
                        <th>Hình thức</th>
                        <th>Trạng thái</th>
                        <th>Thời gian</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-if="orders.length === 0">
                        <td colspan="6" class="text-muted py-4">Chưa có hóa đơn nào trong hôm nay.</td>
                    </tr>
                    <tr v-for="order in orders" :key="order.id">
                        <td class="fw-bold">#{{ order.id }}</td>
                        <td>{{ order.table?.name || 'Mang đi' }}</td>

                        <td class="fw-bold"
                            :class="order.status === 'cancelled' ? 'text-muted text-decoration-line-through' : 'text-danger'">
                            {{ formatCurrency(order.status === 'cancelled' ? 0 : order.total_price) }}
                        </td>

                        <td>
                            <span class="badge bg-secondary">{{ order.payment_method?.toUpperCase() || 'CHƯA RÕ'
                                }}</span>
                        </td>

                        <td>
                            <span class="badge" :class="getStatusBadge(order.status).class">
                                {{ getStatusBadge(order.status).text }}
                            </span>
                        </td>

                        <td>{{ formatTime(order.updated_at) }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '@/services/api';

const orders = ref([]);

const fetchTodayOrders = async () => {
    try {
        const res = await api.get('/waiter/orders/today'); // API lấy danh sách bill hôm nay
        if (res.data.success) {
            orders.value = res.data.data;
        }
    } catch (error) {
        console.error("Lỗi tải hóa đơn:", error);
    }
};

// --- HÀM XỬ LÝ 3 TRẠNG THÁI ---
const getStatusBadge = (status) => {
    switch (status) {
        case 'completed':
            return { text: 'Đã thanh toán', class: 'bg-success' };       // Xanh lá
        case 'serving':
            return { text: 'Đang phục vụ', class: 'bg-warning text-dark' }; // Vàng
        case 'cancelled':
            return { text: 'Đã hủy bàn', class: 'bg-danger' };           // Đỏ
        default:
            return { text: 'Không rõ', class: 'bg-secondary' };
    }
};

const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
const formatTime = (timeStr) => new Date(timeStr).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

onMounted(fetchTodayOrders);
</script>