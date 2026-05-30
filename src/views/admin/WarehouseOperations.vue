<template>
    <div class="warehouse-operations">
        <!-- Header -->
        <div class="operations-header mb-4">
            <h2 class="fw-bold text-dark">
                <i class="bi bi-arrow-left-right me-2"></i>Quản lý Xuất Nhập Kho
            </h2>
            <p class="text-muted small">Nhập/Xuất nguyên liệu và theo dõi lịch sử giao dịch</p>
        </div>

        <div class="row g-4">
            <!-- Form Nhập/Xuất -->
            <div class="col-lg-6">
                <div class="card border-0 shadow-sm h-100">
                    <div class="card-header bg-light border-0 py-3">
                        <h5 class="mb-0 fw-bold">
                            <i class="bi bi-pencil-square me-2"></i>Thao tác Kho
                        </h5>
                    </div>

                    <div class="card-body">
                        <!-- Chọn Nguyên liệu -->
                        <div class="mb-4">
                            <label class="form-label fw-bold text-dark mb-2">Chọn Nguyên Liệu</label>
                            <div class="input-group input-group-lg">
                                <i class="bi bi-search input-group-text bg-white border-end-0"></i>
                                <input
                                    type="text"
                                    class="form-control border-start-0"
                                    placeholder="Tìm nguyên liệu..."
                                    v-model="searchKeyword"
                                    @input="filterIngredients">
                            </div>

                            <!-- Danh sách nguyên liệu filtered -->
                            <div v-if="filteredIngredients.length > 0" class="ingredient-list mt-3">
                                <div
                                    v-for="item in filteredIngredients"
                                    :key="item.id"
                                    @click="selectIngredient(item)"
                                    :class="['ingredient-item', { active: selectedItem?.id === item.id }]">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <div>
                                            <div class="fw-bold text-dark">{{ item.name }}</div>
                                            <small class="text-muted">
                                                Tồn: {{ item.stock_quantity }} {{ item.unit }}
                                            </small>
                                        </div>
                                        <span v-if="item.stock_quantity <= item.reorder_level"
                                            class="badge bg-danger">Sắp hết</span>
                                        <span v-else class="badge bg-success">Bình thường</span>
                                    </div>
                                </div>
                            </div>
                            <div v-else-if="searchKeyword" class="text-center text-muted py-3">
                                <small>Không tìm thấy nguyên liệu nào</small>
                            </div>
                        </div>

                        <!-- Form giao dịch -->
                        <div v-if="selectedItem" class="transaction-form">
                            <div class="alert alert-info border-0 mb-3">
                                <small class="fw-bold">
                                    Tồn kho hiện tại: <span class="text-danger">{{ selectedItem.stock_quantity }} {{ selectedItem.unit }}</span>
                                </small>
                            </div>

                            <form @submit.prevent="submitTransaction">
                                <!-- Loại giao dịch -->
                                <div class="mb-3">
                                    <label class="form-label fw-bold text-dark">Loại Giao dịch</label>
                                    <div class="btn-group w-100" role="group">
                                        <input
                                            type="radio"
                                            class="btn-check"
                                            name="transaction-type"
                                            id="import-btn"
                                            value="import"
                                            v-model="transactionForm.type">
                                        <label class="btn btn-outline-success fw-bold" for="import-btn">
                                            <i class="bi bi-box-arrow-in-down me-1"></i>NHẬP KHO
                                        </label>

                                        <input
                                            type="radio"
                                            class="btn-check"
                                            name="transaction-type"
                                            id="export-btn"
                                            value="export"
                                            v-model="transactionForm.type">
                                        <label class="btn btn-outline-danger fw-bold" for="export-btn">
                                            <i class="bi bi-box-arrow-up me-1"></i>XUẤT KHO
                                        </label>
                                    </div>
                                </div>

                                <!-- Số lượng -->
                                <div class="mb-3">
                                    <label class="form-label fw-bold text-dark">Số Lượng ({{ selectedItem.unit }})</label>
                                    <input
                                        type="number"
                                        class="form-control form-control-lg"
                                        step="0.01"
                                        min="0.01"
                                        v-model="transactionForm.quantity"
                                        placeholder="Nhập số lượng"
                                        required>
                                </div>

                                <!-- Đơn giá (chỉ khi nhập) -->
                                <div v-if="transactionForm.type === 'import'" class="mb-3">
                                    <label class="form-label fw-bold text-dark">Đơn Giá Nhập (VNĐ/{{ selectedItem.unit }})</label>
                                    <input
                                        type="number"
                                        class="form-control form-control-lg"
                                        min="0"
                                        step="1000"
                                        v-model="transactionForm.price"
                                        placeholder="Nhập đơn giá"
                                        required>
                                    <small class="text-muted d-block mt-1">
                                        Hệ thống sẽ cập nhật giá này làm giá tham khảo mới
                                    </small>
                                </div>

                                <!-- Tổng tiền (chỉ khi nhập) -->
                                <div v-if="transactionForm.type === 'import'" class="mb-3 p-3 bg-light rounded">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <span class="text-muted">Tổng tiền thanh toán:</span>
                                        <span class="h4 text-danger fw-bold mb-0">
                                            {{ formatCurrency((transactionForm.quantity || 0) * (transactionForm.price || 0)) }}
                                        </span>
                                    </div>
                                </div>

                                <!-- Lý do / Ghi chú -->
                                <div class="mb-4">
                                    <label class="form-label fw-bold text-dark">Lý Do / Ghi Chú</label>
                                    <textarea
                                        class="form-control"
                                        rows="3"
                                        v-model="transactionForm.note"
                                        placeholder="Vd: Nhập hàng từ NCC A, Xuất để nấu món ăn, Hủy do hư hỏng..."
                                        required></textarea>
                                </div>

                                <!-- Button Submit -->
                                <button
                                    type="submit"
                                    class="btn w-100 fw-bold py-2"
                                    :class="transactionForm.type === 'import' ? 'btn-success' : 'btn-danger'"
                                    :disabled="isSubmitting">
                                    <i :class="transactionForm.type === 'import' ? 'bi bi-box-arrow-in-down' : 'bi bi-box-arrow-up'"
                                        class="me-2"></i>
                                    {{ isSubmitting ? 'Đang lưu...' : 'Xác Nhận Lưu' }}
                                </button>
                            </form>
                        </div>

                        <div v-else class="text-center text-muted py-5">
                            <i class="bi bi-inbox" style="font-size: 3rem; opacity: 0.3;"></i>
                            <p class="mt-3">Chọn nguyên liệu để bắt đầu</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Lịch sử giao dịch -->
            <div class="col-lg-6">
                <div class="card border-0 shadow-sm h-100">
                    <div class="card-header bg-light border-0 py-3 d-flex justify-content-between align-items-center">
                        <h5 class="mb-0 fw-bold">
                            <i class="bi bi-clock-history me-2"></i>Lịch Sử Giao Dịch
                        </h5>
                        <button v-if="selectedItem" class="btn btn-sm btn-outline-secondary" @click="fetchHistory">
                            <i class="bi bi-arrow-clockwise"></i>
                        </button>
                    </div>

                    <div class="card-body p-0">
                        <div v-if="!selectedItem" class="text-center text-muted p-5">
                            <i class="bi bi-inbox" style="font-size: 3rem; opacity: 0.3;"></i>
                            <p class="mt-3">Chọn nguyên liệu để xem lịch sử</p>
                        </div>

                        <div v-else-if="isLoadingHistory" class="text-center py-5">
                            <div class="spinner-border text-primary"></div>
                            <p class="text-muted mt-2">Đang tải...</p>
                        </div>

                        <div v-else-if="histories.length === 0" class="text-center text-muted p-5">
                            <i class="bi bi-file-text" style="font-size: 3rem; opacity: 0.3;"></i>
                            <p class="mt-3">Chưa có giao dịch nào</p>
                        </div>

                        <div v-else class="history-list">
                            <div v-for="h in histories" :key="h.id" class="history-item border-bottom p-3">
                                <div class="d-flex justify-content-between align-items-start mb-2">
                                    <div>
                                        <span class="badge" :class="h.type === 'import' ? 'bg-success' : 'bg-danger'">
                                            {{ h.type === 'import' ? 'NHẬP' : 'XUẤT' }}
                                        </span>
                                        <small class="text-muted ms-2">{{ formatTime(h.created_at) }}</small>
                                    </div>
                                    <span class="fw-bold" :class="h.type === 'import' ? 'text-success' : 'text-danger'">
                                        {{ h.type === 'import' ? '+' : '-' }}{{ h.quantity }} {{ selectedItem.unit }}
                                    </span>
                                </div>

                                <div class="row g-2 small mb-2">
                                    <div class="col-6">
                                        <span class="text-muted">Đơn giá:</span>
                                        <span class="fw-bold d-block">{{ formatCurrency(h.unit_price) }}</span>
                                    </div>
                                    <div class="col-6">
                                        <span class="text-muted">Tổng tiền:</span>
                                        <span class="fw-bold d-block">{{ formatCurrency(h.total_price) }}</span>
                                    </div>
                                </div>

                                <div class="small mb-2">
                                    <span class="text-muted">Tồn sau GD:</span>
                                    <span class="badge bg-primary">{{ h.stock_after }} {{ selectedItem.unit }}</span>
                                </div>

                                <div class="small text-muted fst-italic border-top pt-2">
                                    <strong>Ghi chú:</strong> {{ h.note }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue';
import api from '@/services/api';

const ingredients = ref([]);
const selectedItem = ref(null);
const searchKeyword = ref('');
const filteredIngredients = ref([]);

const isSubmitting = ref(false);
const histories = ref([]);
const isLoadingHistory = ref(false);

const transactionForm = reactive({
    type: 'import',
    quantity: '',
    price: 0,
    note: ''
});

const formatCurrency = (val) => {
    if (val === null || val === undefined) return '0 đ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
};

const fetchIngredients = async () => {
    try {
        const res = await api.get('/admin/ingredients');
        if (res.data.success) {
            ingredients.value = res.data.data;
            filteredIngredients.value = res.data.data;
        }
    } catch (error) {
        console.error("Lỗi tải nguyên liệu:", error);
    }
};

const filterIngredients = () => {
    const keyword = searchKeyword.value.toLowerCase();
    filteredIngredients.value = ingredients.value.filter(item =>
        item.name.toLowerCase().includes(keyword)
    );
};

const selectIngredient = (item) => {
    selectedItem.value = item;
    transactionForm.quantity = '';
    transactionForm.price = item.price || 0;
    transactionForm.note = '';
    transactionForm.type = 'import';
    fetchHistory();
};

const submitTransaction = async () => {
    if (transactionForm.type === 'export' && parseFloat(transactionForm.quantity) > parseFloat(selectedItem.value.stock_quantity)) {
        alert(`Lỗi: Số lượng xuất không được lớn hơn tồn kho hiện tại (${selectedItem.value.stock_quantity})!`);
        return;
    }

    try {
        isSubmitting.value = true;

        const payload = {
            type: transactionForm.type,
            quantity: transactionForm.quantity,
            note: transactionForm.note
        };

        if (transactionForm.type === 'import') {
            payload.price = transactionForm.price;
        }

        const res = await api.post(`/admin/ingredients/${selectedItem.value.id}/transaction`, payload);

        if (res.data.success) {
            alert(res.data.message);
            transactionForm.quantity = '';
            transactionForm.price = selectedItem.value.price || 0;
            transactionForm.note = '';
            transactionForm.type = 'import';
            fetchHistory();
            fetchIngredients();
        }
    } catch (error) {
        alert(error.response?.data?.message || "Có lỗi xảy ra khi lưu giao dịch!");
    } finally {
        isSubmitting.value = false;
    }
};

const fetchHistory = async () => {
    if (!selectedItem.value) return;

    isLoadingHistory.value = true;
    histories.value = [];

    try {
        const res = await api.get(`/admin/ingredients/${selectedItem.value.id}/transactions`);
        if (res.data.success) {
            histories.value = res.data.data;
        }
    } catch (error) {
        console.error("Không tải được lịch sử!");
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
.warehouse-operations {
    padding: 0;
}

.operations-header {
    border-bottom: 2px solid #f0f0f0;
    padding-bottom: 1rem;
}

.ingredient-list {
    max-height: 350px;
    overflow-y: auto;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
}

.ingredient-item {
    padding: 12px 15px;
    border-bottom: 1px solid #f0f0f0;
    cursor: pointer;
    transition: all 0.2s ease;
    background-color: #fff;
}

.ingredient-item:last-child {
    border-bottom: none;
}

.ingredient-item:hover {
    background-color: #f8f9fa;
    padding-left: 18px;
}

.ingredient-item.active {
    background-color: #e7f5ff;
    border-left: 4px solid #0d6efd;
    padding-left: 12px;
}

.transaction-form {
    animation: slideIn 0.3s ease-out;
}

.history-list {
    max-height: 600px;
    overflow-y: auto;
}

.history-item {
    transition: background-color 0.2s ease;
}

.history-item:hover {
    background-color: #f8f9fa;
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Scrollbar styling */
.ingredient-list::-webkit-scrollbar,
.history-list::-webkit-scrollbar {
    width: 6px;
}

.ingredient-list::-webkit-scrollbar-track,
.history-list::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
}

.ingredient-list::-webkit-scrollbar-thumb,
.history-list::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 10px;
}

.ingredient-list::-webkit-scrollbar-thumb:hover,
.history-list::-webkit-scrollbar-thumb:hover {
    background: #888;
}
</style>

