<template>
    <div class="inventory-management">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="fw-bold text-dark"><i class="bi bi-box-seam me-2"></i>Quản lý Kho (In/Out)</h2>
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
                            <th>Thao tác Kho</th>
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
                                <button class="btn btn-sm btn-warning fw-bold me-2" @click="openTransactionModal(item)">
                                    <i class="bi bi-arrow-left-right me-1"></i> Nhập/Xuất
                                </button>
                                <button class="btn btn-sm btn-info text-white fw-bold" @click="openHistoryModal(item)">
                                    <i class="bi bi-clock-history me-1"></i> Lịch sử
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div v-if="showTransactionModal" class="modal-overlay" @click.self="showTransactionModal = false">
            <div class="modal-content">
                <div class="modal-header border-bottom mb-3 pb-3 d-flex justify-content-between align-items-center">
                    <h4 class="mb-0 fw-bold">Điều chỉnh kho: <span class="text-primary">{{ selectedItem.name }}</span>
                    </h4>
                    <button class="btn-close" @click="showTransactionModal = false"></button>
                </div>

                <form @submit.prevent="submitTransaction">
                    <div class="row g-3">
                        <div class="col-12 text-center mb-2">
                            <span class="badge bg-light text-dark fs-6 border">
                                Tồn kho hiện tại: <strong class="text-success fs-5">{{ selectedItem.stock_quantity
                                    }}</strong> {{ selectedItem.unit }}
                            </span>
                        </div>

                        <div class="col-md-6 form-group">
                            <label class="fw-bold text-muted mb-1">Loại giao dịch</label>
                            <select v-model="transactionForm.type" class="form-select form-select-lg" required>
                                <option value="import">NHẬP KHO</option>
                                <option value="export">XUẤT KHO</option>
                            </select>
                        </div>

                        <div class="col-md-6 form-group">
                            <label class="fw-bold text-muted mb-1">Số lượng ({{ selectedItem.unit }})</label>
                            <input type="number" step="0.01" min="0.01" v-model="transactionForm.quantity"
                                class="form-control form-control-lg" required placeholder="Vd: 5.5">
                        </div>

                        <div class="col-md-6 form-group" v-if="transactionForm.type === 'import'">
                            <label class="fw-bold text-muted mb-1">Đơn giá nhập (VNĐ / {{ selectedItem.unit }})</label>
                            <input type="number" min="0" step="1000" v-model="transactionForm.price"
                                class="form-control form-control-lg" required>
                            <small class="text-muted">Hệ thống sẽ cập nhật giá này làm giá tham khảo mới.</small>
                        </div>

                        <div class="col-md-6 form-group d-flex flex-column justify-content-center"
                            v-if="transactionForm.type === 'import'">
                            <label class="fw-bold text-muted mb-1">Tổng tiền thanh toán</label>
                            <div class="h4 text-danger fw-bold mb-0">
                                {{ formatCurrency((transactionForm.quantity || 0) * (transactionForm.price || 0)) }}
                            </div>
                        </div>

                        <div class="col-12 form-group mt-3">
                            <label class="fw-bold text-muted mb-1">Lý do / Ghi chú (Bắt buộc)</label>
                            <textarea v-model="transactionForm.note" class="form-control" rows="2" required
                                placeholder="Vd: Nhập hàng NCC A, Hủy do hư hỏng, Xuất dùng bếp..."></textarea>
                        </div>
                    </div>

                    <div class="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                        <button type="button" class="btn btn-light border fw-bold px-4"
                            @click="showTransactionModal = false">Hủy</button>
                        <button type="submit" class="btn px-4 fw-bold"
                            :class="transactionForm.type === 'import' ? 'btn-success' : 'btn-danger'"
                            :disabled="isSubmitting">
                            <i class="bi bi-check2-circle me-1"></i> {{ isSubmitting ? 'Đang lưu...' : 'Xác nhận Lưu' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <div v-if="showHistoryModal" class="modal-overlay" @click.self="showHistoryModal = false">
            <div class="modal-content modal-xl">
                <div class="modal-header border-bottom mb-3 pb-3 d-flex justify-content-between align-items-center">
                    <h4 class="mb-0 fw-bold">Lịch sử Kho: <span class="text-primary">{{ selectedItem.name }}</span></h4>
                    <button class="btn-close" @click="showHistoryModal = false"></button>
                </div>

                <div v-if="isLoadingHistory" class="text-center py-4">
                    <div class="spinner-border text-primary"></div>
                </div>

                <div v-else-if="histories.length === 0" class="text-center text-muted py-4">
                    Chưa có lịch sử giao dịch nào cho nguyên liệu này.
                </div>

                <div v-else class="table-responsive" style="max-height: 400px; overflow-y: auto;">
                    <table class="table table-sm table-bordered text-center align-middle mb-0">
                        <thead class="table-light sticky-top">
                            <tr>
                                <th>Thời gian</th>
                                <th>Loại</th>
                                <th>Số lượng</th>
                                <th>Đơn giá</th>
                                <th>Tổng tiền</th>
                                <th>Tồn sau GD</th>
                                <th>Lý do</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="h in histories" :key="h.id">
                                <td class="text-muted small">{{ formatTime(h.created_at) }}</td>
                                <td>
                                    <span class="badge" :class="h.type === 'import' ? 'bg-success' : 'bg-danger'">
                                        {{ h.type === 'import' ? 'NHẬP' : 'XUẤT' }}
                                    </span>
                                </td>
                                <td class="fw-bold" :class="h.type === 'import' ? 'text-success' : 'text-danger'">
                                    {{ h.type === 'import' ? '+' : '-' }}{{ h.quantity }}
                                </td>
                                <td class="text-muted">{{ formatCurrency(h.unit_price) }}</td>
                                <td class="fw-bold">{{ formatCurrency(h.total_price) }}</td>
                                <td class="fw-bold text-primary">{{ h.stock_after }}</td>
                                <td class="text-start small fst-italic">{{ h.note }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

    </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import api from '@/services/api';

const ingredients = ref([]);

// --- MODAL STATE ---
const showTransactionModal = ref(false);
const showHistoryModal = ref(false);
const selectedItem = ref(null);
const isSubmitting = ref(false);

const histories = ref([]);
const isLoadingHistory = ref(false);

const transactionForm = reactive({
    type: 'import',
    quantity: '',
    price: 0, // THÊM MỚI
    note: ''
});

// --- HELPER FORMAT TIỀN TỆ ---
const formatCurrency = (val) => {
    if (val === null || val === undefined) return '0 đ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
};

// --- LẤY DANH SÁCH NGUYÊN LIỆU ---
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

// --- MỞ MODAL GIAO DỊCH ---
const openTransactionModal = (item) => {
    selectedItem.value = item;
    transactionForm.type = 'import';
    transactionForm.quantity = '';
    transactionForm.price = item.price || 0; // Gán giá mặc định của nguyên liệu vào form
    transactionForm.note = '';
    showTransactionModal.value = true;
};

// --- SUBMIT GIAO DỊCH LÊN API ---
const submitTransaction = async () => {
    // Validate phụ trên Frontend
    if (transactionForm.type === 'export' && parseFloat(transactionForm.quantity) > parseFloat(selectedItem.value.stock_quantity)) {
        alert(`Lỗi: Số lượng xuất không được lớn hơn tồn kho hiện tại (${selectedItem.value.stock_quantity})!`);
        return;
    }

    try {
        isSubmitting.value = true;

        // Chuẩn bị payload
        const payload = {
            type: transactionForm.type,
            quantity: transactionForm.quantity,
            note: transactionForm.note
        };

        // Chỉ gửi giá tiền lên nếu là nhập hàng (xuất hàng thì backend tự lấy giá base)
        if (transactionForm.type === 'import') {
            payload.price = transactionForm.price;
        }

        const res = await api.post(`/admin/ingredients/${selectedItem.value.id}/transaction`, payload);

        if (res.data.success) {
            alert(res.data.message);
            showTransactionModal.value = false;
            fetchIngredients(); // Tải lại danh sách để cập nhật số tồn kho và giá mới
        }
    } catch (error) {
        alert(error.response?.data?.message || "Có lỗi xảy ra khi lưu giao dịch!");
    } finally {
        isSubmitting.value = false;
    }
};

// --- MỞ MODAL LỊCH SỬ ---
const openHistoryModal = async (item) => {
    selectedItem.value = item;
    showHistoryModal.value = true;
    isLoadingHistory.value = true;
    histories.value = [];

    try {
        const res = await api.get(`/admin/ingredients/${item.id}/transactions`);
        if (res.data.success) {
            histories.value = res.data.data;
        }
    } catch (error) {
        alert("Không tải được lịch sử!");
    } finally {
        isLoadingHistory.value = false;
    }
};

const formatTime = (timeStr) => {
    return new Date(timeStr).toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
};

onMounted(() => {
    fetchIngredients();
});
</script>


<style scoped>
/* Tái sử dụng CSS Modal overlay tĩnh của bạn */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1050;
    backdrop-filter: blur(3px);
}

.modal-content {
    background: white;
    width: 90%;
    max-width: 500px;
    padding: 25px;
    border-radius: 12px;
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
    animation: slideIn 0.3s ease-out;
}

.modal-content.modal-lg {
    max-width: 800px;
}

@keyframes slideIn {
    from {
        transform: translateY(-50px);
        opacity: 0;
    }

    to {
        transform: translateY(0);
        opacity: 1;
    }
}
</style>