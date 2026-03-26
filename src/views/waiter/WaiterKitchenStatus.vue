<template>
    <div class="p-3">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="fw-bold text-success"><i class="bi bi-bell-fill me-2"></i>Món Chờ Bưng Lên Bàn</h2>
            <button class="btn btn-outline-secondary" @click="fetchReadyItems">
                <i class="bi bi-arrow-clockwise me-1"></i> Làm mới
            </button>
        </div>

        <div v-if="items.length === 0" class="text-center my-5 py-5 bg-white rounded shadow-sm">
            <i class="bi bi-check-circle fs-1 text-muted"></i>
            <h4 class="mt-3 text-muted">Tuyệt vời!</h4>
            <p>Tất cả các món đã được bưng lên bàn cho khách.</p>
        </div>

        <div v-else class="row g-4">
            <div v-for="(tableItems, tableName) in groupedItems" :key="tableName" class="col-12 col-md-6 col-lg-4">
                <div class="card h-100 shadow-sm border-0 border-top border-4 border-success">
                    <div class="card-header bg-white d-flex justify-content-between align-items-center py-3">
                        <h5 class="mb-0 fw-bold">Bàn: <span class="text-danger">{{ tableName }}</span></h5>
                        <span class="badge bg-success rounded-pill">{{ tableItems.length }} món</span>
                    </div>

                    <div class="card-body p-0">
                        <ul class="list-group list-group-flush">
                            <li v-for="item in tableItems" :key="item.id" class="list-group-item p-3">
                                <div class="d-flex justify-content-between align-items-start">
                                    <div>
                                        <h6 class="fw-bold mb-1 text-primary">{{ item.quantity }}x {{ item.item_name }}
                                        </h6>
                                        <div v-if="item.note" class="text-muted small fst-italic mt-1">
                                            <i class="bi bi-info-circle me-1"></i> {{ item.note }}
                                        </div>
                                    </div>
                                    <button class="btn btn-sm btn-outline-success ms-2" @click="markAsServed(item)"
                                        title="Đã bưng món này">
                                        <i class="bi bi-check2"></i>
                                    </button>
                                </div>
                            </li>
                        </ul>
                    </div>

                    <div class="card-footer bg-light border-top-0 p-3">
                        <button class="btn btn-success w-100 fw-bold" @click="markAllAsServed(tableItems)">
                            <i class="bi bi-check2-all me-2"></i> ĐÃ BƯNG TẤT CẢ LÊN BÀN NÀY
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<script setup>
// Thêm 'computed' vào đây
import { ref, computed, onMounted, onUnmounted } from 'vue';
import api from '@/services/api';

const items = ref([]);
let intervalId = null;

// ─── LOGIC GOM NHÓM THEO BÀN ────────────────────────────────
const groupedItems = computed(() => {
    const groups = {};
    items.value.forEach(item => {
        // Lấy tên bàn, nếu không có thì gán là 'Khách mang đi'
        const tableName = item.order?.table?.name || 'Khách mang đi';

        // Nếu tên bàn chưa có trong mảng groups thì tạo mới
        if (!groups[tableName]) {
            groups[tableName] = [];
        }

        // Nhét món ăn vào đúng mâm của bàn đó
        groups[tableName].push(item);
    });
    return groups;
});
// ────────────────────────────────────────────────────────────

const fetchReadyItems = async () => {
    try {
        const res = await api.get('/waiter/items/ready');
        if (res.data.success) {
            items.value = res.data.data;
        }
    } catch (error) {
        console.error("Lỗi lấy danh sách bưng món:", error);
    }
};

const markAsServed = async (item) => {
    try {
        const res = await api.put(`/waiter/order-items/${item.id}/serve`);
        if (res.data.success) {
            items.value = items.value.filter(i => i.id !== item.id);
        }
    } catch (error) {
        console.error("Lỗi:", error);
    }
};

// ─── XỬ LÝ BƯNG TẤT CẢ CÙNG LÚC ─────────────────────────────
const markAllAsServed = async (tableItems) => {
    // Để an toàn, hỏi xác nhận trước khi quét sạch cả bàn
    if (!confirm('Xác nhận đã mang TẤT CẢ các món này lên bàn?')) return;

    try {
        // Dùng Promise.all để gọi API cập nhật nhiều món cùng một lúc cho tốc độ nhanh nhất
        await Promise.all(
            tableItems.map(item => api.put(`/waiter/order-items/${item.id}/serve`))
        );

        // Lọc bỏ những món vừa bưng ra khỏi danh sách hiển thị
        const servedIds = tableItems.map(item => item.id);
        items.value = items.value.filter(i => !servedIds.includes(i.id));

    } catch (error) {
        alert("Có lỗi xảy ra khi cập nhật hàng loạt!");
        console.error(error);
    }
};
// ────────────────────────────────────────────────────────────

onMounted(() => {
    fetchReadyItems();
    intervalId = setInterval(fetchReadyItems, 5000);
});

onUnmounted(() => {
    clearInterval(intervalId);
});
</script>