<template>
    <div class="toast-container position-fixed top-0 end-0 p-3" style="z-index: 1060;">
        <div class="custom-toast"
            :class="{ 'show': showToast, 'bg-success': toastType === 'success', 'bg-danger': toastType === 'error' }">
            <div class="d-flex align-items-center text-white p-3 rounded shadow-sm">
                <i class="bi fs-4 me-2"
                    :class="toastType === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'"></i>
                <span class="fw-medium">{{ toastMessage }}</span>
            </div>
        </div>
    </div>

    <div class="reservation-management">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="h4 mb-0">Quản lý Đặt Bàn</h2>
            <button class="btn btn-outline-primary btn-sm" @click="fetchReservations">
                <i class="bi bi-arrow-clockwise"></i> Làm mới
            </button>
        </div>

        <div class="card shadow-sm border-0">
            <div class="card-body p-0">
                <div class="table-responsive">
                    <table class="table table-hover align-middle mb-0">
                        <thead class="table-light">
                            <tr>
                                <th>Mã</th>
                                <th>Khách hàng</th>
                                <th>Thông tin Bàn</th>
                                <th>Thời gian đến</th>
                                <th>Ghi chú</th>
                                <th>Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-if="isLoading">
                                <td colspan="6" class="text-center py-4">Đang tải dữ liệu...</td>
                            </tr>
                            <tr v-else-if="reservations.length === 0">
                                <td colspan="6" class="text-center py-4">Chưa có lịch đặt bàn nào.</td>
                            </tr>
                            <tr v-else v-for="res in reservations" :key="res.id"
                                :class="{ 'table-warning': isSoon(res.reserved_at, res.status) }">
                                <td class="fw-bold">#{{ res.id }}</td>

                                <td>
                                    <div class="fw-bold text-primary">{{ res.customer_name }}</div>
                                    <div class="small text-muted"><i class="bi bi-telephone-fill me-1"></i>{{
                                        res.customer_phone }}</div>
                                </td>

                                <td>
                                    <div class="fw-bold">{{ res.table?.name || 'Bàn đã xóa' }}</div>
                                    <span class="badge bg-secondary rounded-pill">
                                        <i class="bi bi-people-fill me-1"></i>{{ res.guests }} khách
                                    </span>
                                </td>

                                <td>
                                    <div class="fw-bold text-danger">{{ formatTime(res.reserved_at) }}</div>
                                    <div class="small text-muted">{{ formatDate(res.reserved_at) }}</div>
                                </td>

                                <td style="max-width: 200px;">
                                    <div v-if="res.note" class="text-truncate text-muted small" :title="res.note">
                                        <i class="bi bi-chat-quote me-1"></i>{{ res.note }}
                                    </div>
                                    <span v-else class="text-muted small">Không có</span>
                                </td>

                                <td style="width: 180px;">
                                    <select v-model="res.status" class="form-select form-select-sm fw-medium"
                                        :class="getStatusClass(res.status)" @change="updateStatus(res)"
                                        :disabled="res.isUpdating">
                                        <option value="pending">Chờ xác nhận</option>
                                        <option value="confirmed">Đã xác nhận</option>
                                        <option value="seated">Đang dùng bữa</option>
                                        <option value="completed">Đã rời đi/Hoàn thành</option>
                                        <option value="cancelled">Đã hủy</option>
                                    </select>
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

const reservations = ref([]);
const isLoading = ref(true);

// -- STATE TOAST --
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref('success');
let toastTimeout = null;

const triggerToast = (message, type = 'success') => {
    toastMessage.value = message;
    toastType.value = type;
    showToast.value = true;
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => { showToast.value = false; }, 3000);
};

// ==========================================
// API LOGIC
// ==========================================

// Lấy danh sách đặt bàn
const fetchReservations = async () => {
    isLoading.value = true;
    try {
        const response = await api.get('/cashier/reservations');
        // Chú ý: Backend trả về { reservations: [...] } thay vì { data: [...] }
        if (response.data && response.data.reservations) {
            reservations.value = response.data.reservations.map(res => ({
                ...res,
                isUpdating: false
            }));
        }
    } catch (error) {
        console.error('Lỗi lấy danh sách đặt bàn:', error);
        triggerToast('Không thể tải danh sách đặt bàn!', 'error');
    } finally {
        isLoading.value = false;
    }
};

// Cập nhật trạng thái
const updateStatus = async (res) => {
    res.isUpdating = true;
    try {
        const response = await api.patch(`/cashier/reservations/${res.id}/status`, {
            status: res.status
        });

        // Backend trả về message
        if (response.data && response.data.message) {
            triggerToast('Đã cập nhật trạng thái đặt bàn!', 'success');
        }
    } catch (error) {
        console.error('Lỗi cập nhật:', error);
        triggerToast(error.response?.data?.message || 'Không thể cập nhật trạng thái!', 'error');
        await fetchReservations(); // Tải lại data cũ nếu lỗi
    } finally {
        res.isUpdating = false;
    }
};

// ==========================================
// HELPERS
// ==========================================

// Format lấy Ngày tháng năm
const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    }).format(date);
};

// Format lấy Giờ phút
const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
        hour: '2-digit', minute: '2-digit'
    }).format(date);
};

// Đổi màu nền (highlight) nếu khách sắp đến (trong vòng 2 tiếng) và trạng thái đang là Confirmed
const isSoon = (dateString, status) => {
    if (status !== 'confirmed') return false;

    const reservedTime = new Date(dateString).getTime();
    const now = new Date().getTime();
    const diffHours = (reservedTime - now) / (1000 * 60 * 60);

    // Nếu thời gian đặt bàn cách hiện tại dưới 2 tiếng và chưa qua ngày
    return diffHours > 0 && diffHours <= 2;
};

// Màu sắc cho thẻ Select
// Thêm màu sắc cho trạng thái mới
const getStatusClass = (status) => {
    switch (status) {
        case 'pending': return 'text-warning border-warning bg-warning bg-opacity-10';
        case 'confirmed': return 'text-primary border-primary bg-primary bg-opacity-10';
        case 'seated': return 'text-info border-info bg-info bg-opacity-10'; 
        case 'completed': return 'text-success border-success bg-success bg-opacity-10';
        case 'cancelled': return 'text-danger border-danger bg-danger bg-opacity-10';
        default: return '';
    }
};

onMounted(() => {
    fetchReservations();
});
</script>

<style scoped>
/* TOAST CSS (Dùng chung) */
.custom-toast {
    transform: translateX(120%);
    transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    min-width: 250px;
}

.custom-toast.show {
    transform: translateX(0);
}

/* Bôi vàng nhẹ cho các bàn sắp đến giờ */
.table-warning {
    background-color: #fff3cd !important;
}

select.form-select {
    cursor: pointer;
}
</style>