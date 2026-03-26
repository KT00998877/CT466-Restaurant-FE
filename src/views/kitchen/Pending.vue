<template>
    <div class="kitchen-pending p-3">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="fw-bold text-danger"><i class="bi bi-fire me-2"></i>Món Cần Chế Biến</h2>
            <button class="btn btn-outline-secondary" @click="fetchItems">
                <i class="bi bi-arrow-clockwise me-1"></i> Làm mới
            </button>
        </div>

        <div v-if="isLoading" class="text-center my-5">
            <div class="spinner-border text-danger" role="status"></div>
            <p class="mt-2 text-muted">Đang tải dữ liệu bếp...</p>
        </div>

        <div v-else-if="items.length === 0" class="text-center my-5 py-5 bg-white rounded shadow-sm">
            <i class="bi bi-emoji-sunglasses fs-1 text-success"></i>
            <h4 class="mt-3 text-muted">Bếp đang rảnh rỗi!</h4>
            <p>Chưa có order nào được gửi xuống.</p>
        </div>

        <div v-else class="row g-3">
            <div v-for="item in items" :key="item.id" class="col-12 col-md-6 col-lg-4">
                <div class="card h-100 shadow-sm border-0"
                    :class="item.status === 'cooking' ? 'border-start border-4 border-warning' : ''">
                    <div class="card-header bg-white d-flex justify-content-between align-items-center">
                        <span class="badge bg-dark fs-6">{{ item.order?.table?.name || 'Mang đi' }}</span>
                        <small class="text-muted"><i class="bi bi-clock"></i> {{ formatTime(item.created_at) }}</small>
                    </div>

                    <div class="card-body">
                        <h4 class="card-title text-primary fw-bold">{{ item.quantity }}x {{ item.item_name }}</h4>

                        <div v-if="item.note" class="alert alert-warning py-2 mb-0 mt-3">
                            <i class="bi bi-exclamation-triangle-fill me-1"></i>
                            <strong>Ghi chú:</strong> {{ item.note }}
                        </div>
                    </div>

                    <div class="card-footer bg-white border-top-0 d-flex gap-2 p-3">
                        <button v-if="item.status === 'pending'" class="btn btn-warning flex-grow-1 fw-bold text-dark"
                            @click="updateStatus(item.id, 'cooking')">
                            <i class="bi bi-play-fill"></i> NẤU NGAY
                        </button>

                        <button v-if="item.status === 'cooking'" class="btn btn-success flex-grow-1 fw-bold"
                            @click="updateStatus(item.id, 'ready')">
                            <i class="bi bi-check-lg"></i> HOÀN THÀNH
                        </button>

                        <button v-if="item.status === 'pending' || item.status === 'cooking'"
                            class="btn btn-danger fw-bold px-3" @click="cancelItem(item)">
                            <i class="bi bi-x-circle"></i> HỦY
                        </button>

                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import api from '@/services/api';

const items = ref([]);
const isLoading = ref(true);
let refreshInterval = null;
// Hàm lấy danh sách món ăn cần chế biến (trạng thái pending hoặc cooking)
const fetchItems = async () => {
    try {
        const res = await api.get('/kitchen/pending');
        if (res.data.success) {
            items.value = res.data.data;
        }
    } catch (error) {
        console.error("Lỗi lấy dữ liệu bếp:", error);
    } finally {
        isLoading.value = false;
    }
};

// Hàm cập nhật trạng thái món ăn (từ pending -> cooking -> ready)

const updateStatus = async (id, newStatus) => {
    try {
        const res = await api.patch(`/kitchen/items/${id}/status`, { status: newStatus });
        if (res.data.success) {
            // Cập nhật lại danh sách ngay lập tức
            fetchItems();
        }
    } catch (error) {
        alert('Lỗi cập nhật trạng thái!');
    }
};

// ─── HÀM HỦY MÓN DÀNH CHO BẾP ────────────────────────────────
const cancelItem = async (item) => {
    // 1. Hỏi xác nhận và lấy lý do hủy
    const reason = prompt(`Bạn đang hủy món "${item.item_name}" của bàn ${item.order?.table?.name || 'Mang đi'}.\nVui lòng nhập lý do (VD: Hết nguyên liệu, Khách đổi ý...):`);

    // Nếu người dùng bấm "Cancel" trên popup, hoặc để trống lý do
    if (reason === null) return;
    if (reason.trim() === '') {
        alert("Bắt buộc phải nhập lý do khi hủy món!");
        return;
    }

    try {
        // 2. Tái sử dụng API cập nhật trạng thái, gửi kèm lý do
        const res = await api.patch(`/kitchen/items/${item.id}/status`, {
            status: 'cancelled',
            cancel_reason: reason // Gửi thêm trường này lên server
        });

        if (res.data.success) {
            alert("Đã hủy món thành công!");
            fetchItems(); // Tải lại danh sách
        } else {
            alert(res.data.message || 'Lỗi: Không thể hủy món!');
        }
    } catch (error) {
        console.error("Lỗi khi hủy món:", error);
        alert("Có lỗi kết nối, không thể hủy lúc này!");
    }
};

// Hàm định dạng thời gian hiển thị cho bếp (chỉ giờ và phút)
const formatTime = (timeString) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

onMounted(() => {
    fetchItems();
    // Tự động load lại mỗi 10 giây để bếp không phải bấm F5
    refreshInterval = setInterval(fetchItems, 10000);
});

onUnmounted(() => {
    clearInterval(refreshInterval);
});
</script>