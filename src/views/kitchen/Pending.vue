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

        <div v-else>
            <div v-for="(group, index) in groupedOrders" :key="index" class="mb-5">
                <div v-if="group.items.length > 0">
                    <h4 class="fw-bold mb-3 border-bottom pb-2" :class="group.colorClass">
                        <i :class="group.icon" class="me-2"></i>{{ group.title }}
                        <span class="badge rounded-pill bg-secondary ms-2" style="font-size: 0.9rem;">
                            {{ group.items.length }} món
                        </span>
                    </h4>

                    <div class="row g-3">
                        <div v-for="item in group.items" :key="item.id" class="col-12 col-md-6 col-lg-4">
                            <div class="card h-100 shadow-sm border-0"
                                :class="item.status === 'cooking' ? 'border-start border-4 border-warning' : ''">
                                <div class="card-header bg-white d-flex justify-content-between align-items-center">
                                    <span class="badge bg-dark fs-6">{{ item.order?.table?.name || 'Mang đi' }}</span>
                                    <small class="text-muted"><i class="bi bi-clock"></i> {{ formatTime(item.created_at)
                                        }}</small>
                                </div>

                                <div class="card-body">
                                    <h4 class="card-title text-primary fw-bold">{{ item.quantity }}x {{ item.item_name
                                        }}</h4>
                                    <div v-if="item.note" class="alert alert-warning py-2 mb-0 mt-3">
                                        <i class="bi bi-exclamation-triangle-fill me-1"></i>
                                        <strong>Ghi chú:</strong> {{ item.note }}
                                    </div>
                                </div>

                                <div class="card-footer bg-white border-top-0 d-flex gap-2 p-3">
                                    <!-- ✅ Đổi @click từ updateStatus sang startCooking -->
                                    <button v-if="item.status === 'pending'"
                                        class="btn btn-warning flex-grow-1 fw-bold text-dark"
                                        @click="startCooking(item)">
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
            </div>
        </div>

        <!-- ============================================================ -->
        <!-- MODAL NGUYÊN LIỆU — Hiện khi bếp bấm "NẤU NGAY"             -->
        <!-- ============================================================ -->
        <div v-if="showIngredientModal" class="modal-backdrop-custom" @click.self="showIngredientModal = false">
            <div class="modal-box shadow-lg">

                <!-- Header -->
                <div class="modal-box__header">
                    <div>
                        <h5 class="fw-bold mb-0">
                            <i class="bi bi-basket2-fill me-2 text-warning"></i>Nguyên liệu cần dùng
                        </h5>
                        <small class="text-muted">{{ modalData.item_name }} &times; {{ modalData.quantity }}</small>
                    </div>
                    <button class="btn-close btn-close-white" @click="showIngredientModal = false"></button>
                </div>

                <!-- Body -->
                <div class="modal-box__body">
                    <div v-if="isLoadingIngredients" class="text-center py-4">
                        <div class="spinner-border text-warning" role="status"></div>
                        <p class="mt-2 text-muted small">Đang tải nguyên liệu...</p>
                    </div>

                    <div v-else-if="modalData.ingredients.length === 0" class="text-center py-4 text-muted">
                        <i class="bi bi-info-circle fs-3"></i>
                        <p class="mt-2">Món này không có công thức nguyên liệu.</p>
                    </div>

                    <div v-else>
                        <p class="text-muted small mb-3">
                            <i class="bi bi-pencil-square me-1"></i>
                            Bếp có thể điều chỉnh số lượng thực tế trước khi xác nhận nấu.
                        </p>

                        <div v-for="ing in modalData.ingredients" :key="ing.id"
                            class="ingredient-row d-flex align-items-center gap-3 mb-3 p-2 rounded"
                            :class="ing.quantity_required > ing.stock_quantity ? 'bg-danger bg-opacity-10 border border-danger' : 'bg-light'">

                            <!-- Tên nguyên liệu -->
                            <div class="flex-grow-1">
                                <div class="fw-semibold">{{ ing.name }}</div>
                                <small class="text-muted">
                                    Kho còn: <span
                                        :class="ing.stock_quantity < ing.quantity_required ? 'text-danger fw-bold' : 'text-success fw-bold'">
                                        {{ ing.stock_quantity }} {{ ing.unit }}
                                    </span>
                                </small>
                            </div>

                            <!-- Input số lượng chỉnh sửa được -->
                            <div class="d-flex align-items-center gap-1">
                                <button class="btn btn-sm btn-outline-secondary px-2"
                                    @click="ing.quantity_required = Math.max(0, +(ing.quantity_required - 0.01).toFixed(3))">
                                    <i class="bi bi-dash"></i>
                                </button>
                                <input type="number" class="form-control form-control-sm text-center"
                                    style="width: 80px;" v-model.number="ing.quantity_required" min="0" step="0.01" />
                                <button class="btn btn-sm btn-outline-secondary px-2"
                                    @click="ing.quantity_required = +(ing.quantity_required + 0.01).toFixed(3)">
                                    <i class="bi bi-plus"></i>
                                </button>
                                <span class="text-muted small ms-1" style="min-width:30px">{{ ing.unit }}</span>
                            </div>

                            <!-- Cảnh báo thiếu kho -->
                            <div v-if="ing.quantity_required > ing.stock_quantity" title="Không đủ tồn kho!">
                                <i class="bi bi-exclamation-triangle-fill text-danger fs-5"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div class="modal-box__footer">
                    <button class="btn btn-secondary" @click="showIngredientModal = false">
                        <i class="bi bi-x-circle me-1"></i> Đóng
                    </button>
                    <button class="btn btn-warning fw-bold text-dark" :disabled="isLoadingIngredients"
                        @click="confirmStartCooking">
                        <i class="bi bi-play-fill me-1"></i> Xác nhận & Bắt đầu nấu
                    </button>
                </div>
            </div>
        </div>
        <!-- ============================================================ -->
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import api from '@/services/api';
import Swal from 'sweetalert2';

const items = ref([]);
const isLoading = ref(true);
let refreshInterval = null;

// ─── STATE CHO MODAL NGUYÊN LIỆU ──────────────────────────────
const showIngredientModal = ref(false);
const isLoadingIngredients = ref(false);
const modalData = ref({ item_name: '', quantity: 1, ingredients: [] });
const currentCookingItemId = ref(null); // Lưu id món đang xét để sau dùng
// ──────────────────────────────────────────────────────────────

const groupedOrders = computed(() => [
    {
        title: 'Khách dùng tại bàn',
        icon: 'bi-shop',
        colorClass: 'text-primary',
        items: items.value.filter(item => item.order?.table?.name)
    },
    {
        title: 'Khách mang đi',
        icon: 'bi-bag-check-fill',
        colorClass: 'text-success',
        items: items.value.filter(item => !item.order?.table?.name)
    }
]);

const fetchItems = async () => {
    try {
        const res = await api.get('/kitchen/pending');
        if (res.data.success) items.value = res.data.data;
    } catch (error) {
        console.error("Lỗi lấy dữ liệu bếp:", error);
    } finally {
        isLoading.value = false;
    }
};

// ─── MỞ MODAL KHI BẾP BẤM "NẤU NGAY" ────────────────────────
const startCooking = async (item) => {
    currentCookingItemId.value = item.id;
    showIngredientModal.value = true;
    isLoadingIngredients.value = true;

    // Đặt tên món trước để modal hiện ngay, không trống
    modalData.value = { item_name: item.item_name, quantity: item.quantity, ingredients: [] };

    try {
        const res = await api.get(`/kitchen/items/${item.id}/ingredients`);
        if (res.data.success) {
            modalData.value = res.data.data;
        }
    } catch (error) {
        console.error("Lỗi tải nguyên liệu:", error);
        Swal.fire({ icon: 'error', title: 'Lỗi', text: 'Không tải được nguyên liệu!' });
        showIngredientModal.value = false;
    } finally {
        isLoadingIngredients.value = false;
    }
};

// ─── XÁC NHẬN BẮT ĐẦU NẤU (SAU KHI BẾP ĐÃ ĐIỀU CHỈNH) ──────
const confirmStartCooking = async () => {
    showIngredientModal.value = false;
    await updateStatus(currentCookingItemId.value, 'cooking');
};
// ──────────────────────────────────────────────────────────────

const updateStatus = async (id, newStatus) => {
    try {
        const res = await api.patch(`/kitchen/items/${id}/status`, { status: newStatus });
        if (res.data.success) fetchItems();
    } catch (error) {
        alert('Lỗi cập nhật trạng thái!');
    }
};

const cancelItem = async (item) => {
    const tableName = item.order?.table?.name || 'Mang đi';
    const { value: reason, isConfirmed } = await Swal.fire({
        title: 'Xác nhận hủy món?',
        html: `Bạn đang hủy món <b>"${item.item_name}"</b> của bàn <b>${tableName}</b>.<br><br>Vui lòng nhập lý do hủy:`,
        icon: 'warning',
        input: 'text',
        inputPlaceholder: 'VD: Hết nguyên liệu, Khách đổi ý...',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Đồng ý hủy món',
        cancelButtonText: 'Quay lại',
        inputValidator: (value) => {
            if (!value || value.trim() === '') return 'Bạn cần nhập lý do để báo cho nhân viên phục vụ!';
        }
    });

    if (!isConfirmed) return;

    try {
        const res = await api.patch(`/kitchen/items/${item.id}/status`, {
            status: 'cancelled',
            cancel_reason: reason.trim()
        });
        if (res.data.success) {
            Swal.fire({ icon: 'success', title: 'Đã hủy món!', timer: 2000, showConfirmButton: false });
            fetchItems();
        } else {
            Swal.fire({ icon: 'error', title: 'Không thể hủy món', text: res.data.message });
        }
    } catch (error) {
        Swal.fire({ icon: 'error', title: 'Lỗi kết nối', text: 'Không thể kết nối đến máy chủ.' });
    }
};

const formatTime = (timeString) => {
    return new Date(timeString).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

onMounted(() => {
    fetchItems();
    refreshInterval = setInterval(fetchItems, 10000);
});

onUnmounted(() => clearInterval(refreshInterval));
</script>

<style scoped>
/* ─── MODAL OVERLAY ─────────────────────────────────────────── */
.modal-backdrop-custom {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.55);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1050;
    padding: 1rem;
}

.modal-box {
    background: #fff;
    border-radius: 12px;
    width: 100%;
    max-width: 520px;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.modal-box__header {
    background: #212529;
    color: #fff;
    padding: 1rem 1.25rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.modal-box__body {
    padding: 1.25rem;
    overflow-y: auto;
    flex: 1;
}

.modal-box__footer {
    padding: 1rem 1.25rem;
    border-top: 1px solid #dee2e6;
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    background: #f8f9fa;
}

/* Input số lượng bỏ spinner mặc định */
input[type=number]::-webkit-inner-spin-button,
input[type=number]::-webkit-outer-spin-button {
    -webkit-appearance: none;
}
</style>    