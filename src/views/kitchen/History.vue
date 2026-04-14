<template>
    <div class="kitchen-history p-3">
        <h2 class="fw-bold text-success mb-4"><i class="bi bi-check2-circle me-2"></i>Lịch Sử Chế Biến</h2>

        <div class="card shadow-sm border-0">
            <div class="card-body p-0">
                <div class="table-responsive">
                    <table class="table table-hover align-middle mb-0">
                        <thead class="table-light">
                            <tr>
                                <th>Thời gian xong</th>
                                <th>Bàn</th>
                                <th>Tên món</th>
                                <th>SL</th>
                                <th>Ghi chú</th>
                                <th>Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-if="items.length === 0">
                                <td colspan="6" class="text-center text-muted py-4">Chưa có dữ liệu</td>
                            </tr>
                            <tr v-for="item in items" :key="item.id">
                                <td>{{ formatTime(item.updated_at) }}</td>
                                <td><span class="badge bg-dark">{{ item.order?.table?.name || 'Mang đi' }}</span></td>
                                <td class="fw-bold text-primary">{{ item.item_name }}</td>
                                <td>{{ item.quantity }}</td>
                                <td class="fst-italic text-muted">{{ item.note || '-' }}</td>
                                <td>
                                    <span v-if="item.status === 'ready'" class="badge bg-info text-dark">Đã hoàn thành</span>
                                    <span v-if="item.status === 'served'" class="badge bg-success">Đã lên bàn</span>
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

const items = ref([]);

const fetchHistory = async () => {
    try {
        const res = await api.get('/kitchen/history');
        if (res.data.success) {
            items.value = res.data.data;
        }
    } catch (error) {
        console.error("Lỗi lấy lịch sử:", error);
    }
};

const formatTime = (timeString) => {
    const date = new Date(timeString);
    return date.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
};

onMounted(() => {
    fetchHistory();
});
</script>