<template>
    <div class="kitchen-container p-3 bg-light min-vh-100">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="fw-bold text-danger mb-0"><i class="bi bi-fire me-2"></i>QUẢN LÝ BẾP</h2>
            <button class="btn btn-white shadow-sm border" @click="fetchItems">
                <i class="bi bi-arrow-clockwise me-1"></i> Làm mới
            </button>
        </div>

        <ul class="nav nav-pills nav-fill mb-4 bg-white p-2 rounded shadow-sm">
            <li class="nav-item">
                <button class="nav-link" :class="{ active: activeType === 'all' }" @click="activeType = 'all'">
                    Tất cả <span class="badge ms-1"
                        :class="activeType === 'all' ? 'bg-light text-dark' : 'bg-secondary'">{{ items.length }}</span>
                </button>
            </li>
            <li class="nav-item">
                <button class="nav-link" :class="{ active: activeType === 'dining' }" @click="activeType = 'dining'">
                    <i class="bi bi-shop me-1"></i> Tại bàn
                    <span class="badge ms-1 bg-primary">{{ countByType('dining') }}</span>
                </button>
            </li>
            <li class="nav-item">
                <button class="nav-link" :class="{ active: activeType === 'takeaway' }"
                    @click="activeType = 'takeaway'">
                    <i class="bi bi-bag-check me-1"></i> Mang đi
                    <span class="badge ms-1 bg-success">{{ countByType('takeaway') }}</span>
                </button>
            </li>
        </ul>

        <div v-if="isLoading" class="text-center my-5">
            <div class="spinner-border text-danger"></div>
            <p class="mt-2 text-muted">Đang tải dữ liệu...</p>
        </div>

        <div v-else-if="filteredTables.length === 0" class="text-center my-5 py-5 bg-white rounded shadow-sm border">
            <i class="bi bi-check2-circle fs-1 text-success"></i>
            <h4 class="mt-3 text-muted">Bếp đang rảnh rỗi!</h4>
            <p>Không có đơn hàng nào thuộc nhóm này.</p>
        </div>

        <div v-else>
            <div class="row g-4">
                <div v-for="table in filteredTables" :key="table.tableName" class="col-12 col-xl-6">
                    <div class="card border-0 shadow-sm h-100">
                        <div class="card-header text-white d-flex justify-content-between align-items-center py-3"
                            :class="table.isTakeaway ? 'bg-success' : 'bg-primary'">
                            <h5 class="mb-0 fw-bold">
                                <i :class="table.isTakeaway ? 'bi-bag-fill' : 'bi-geo-alt-fill'"
                                    class="me-2 text-warning"></i>
                                {{ table.tableName }}
                            </h5>
                            <span class="badge bg-white text-dark">{{ table.items.length }} món</span>
                        </div>

                        <div class="card-body p-0">
                            <div class="table-responsive">
                                <table class="table table-hover mb-0 align-middle">
                                    <thead class="table-light">
                                        <tr>
                                            <th class="ps-3">Món ăn</th>
                                            <th class="text-center">Số lượng</th>
                                            <th>Trạng thái</th>
                                            <th class="text-end pe-3">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="item in table.items" :key="item.id"
                                            :class="{ 'bg-warning-subtle': item.status === 'cooking' }">
                                            <td class="ps-3">
                                                <div class="fw-bold"
                                                    :class="item.status === 'cooking' ? 'text-dark' : 'text-primary'">
                                                    {{ item.item_name }}
                                                </div>
                                                <small v-if="item.note" class="text-danger fw-italic">
                                                    <i class="bi bi-info-circle me-1"></i>{{ item.note }}
                                                </small>
                                                <div class="text-muted" style="font-size: 0.75rem;">
                                                    {{ formatTime(item.created_at) }}
                                                </div>
                                            </td>
                                            <td class="text-center fs-5 fw-bold">x{{ item.quantity }}</td>
                                            <td>
                                                <span v-if="item.status === 'pending'"
                                                    class="badge bg-danger-subtle text-danger border border-danger">Chờ
                                                    chế biến</span>
                                                <span v-if="item.status === 'cooking'"
                                                    class="badge bg-warning text-dark border border-warning">Đang
                                                    nấu</span>
                                            </td>
                                            <td class="text-end pe-3">
                                                <div class="d-flex justify-content-end gap-2">
                                                    <button v-if="item.status === 'pending'"
                                                        class="btn btn-sm btn-warning fw-bold"
                                                        @click="startCooking(item)">
                                                        NẤU
                                                    </button>
                                                    <button v-if="item.status === 'cooking'"
                                                        class="btn btn-sm btn-success fw-bold"
                                                        @click="updateStatus(item.id, 'ready')">
                                                        XONG
                                                    </button>
                                                    <button class="btn btn-sm btn-outline-danger"
                                                        @click="cancelItem(item)">
                                                        <i class="bi bi-trash"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="showIngredientModal" class="modal-backdrop-custom" @click.self="showIngredientModal = false">
            <div class="modal-box shadow-lg">
                <div class="modal-box__header">
                    <div>
                        <h5 class="fw-bold mb-0">🛠 Kiểm tra nguyên liệu</h5>
                        <small>{{ modalData.item_name }} &times; {{ modalData.quantity }}</small>
                    </div>
                    <button class="btn-close btn-close-white" @click="showIngredientModal = false"></button>
                </div>

                <div class="modal-box__body">
                    <div v-if="isLoadingIngredients" class="text-center py-4">
                        <div class="spinner-border text-warning"></div>
                        <p class="mt-2 text-muted small">Đang tải công thức...</p>
                    </div>

                    <div v-else>
                        <p class="text-muted small mb-3">
                            <i class="bi bi-pencil-square me-1"></i>
                            Bếp có thể điều chỉnh hoặc thêm nguyên liệu thực tế trước khi xác nhận.
                        </p>

                        <div v-for="(ing, index) in modalData.ingredients" :key="ing.id"
                            class="ingredient-row d-flex align-items-center gap-3 mb-3 p-2 rounded"
                            :class="ing.quantity_required > ing.stock_quantity ? 'bg-danger bg-opacity-10 border border-danger' : 'bg-light'">

                            <div class="flex-grow-1">
                                <div class="fw-semibold">{{ ing.name }}</div>
                                <small class="text-muted">Kho còn:
                                    <span
                                        :class="ing.stock_quantity < ing.quantity_required ? 'text-danger fw-bold' : 'text-success fw-bold'">
                                        {{ ing.stock_quantity }} {{ ing.unit }}
                                    </span>
                                </small>
                            </div>

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

                            <button class="btn btn-sm btn-link text-danger p-0 ms-2" @click="removeIngredient(index)">
                                <i class="bi bi-x-circle-fill fs-5"></i>
                            </button>
                        </div>

                        <div class="mt-4 pt-3 border-top">
                            <label class="form-label small text-muted fw-bold mb-2">Thêm nguyên liệu phát sinh:</label>
                            <div class="d-flex gap-2">
                                <select class="form-select form-select-sm" v-model="selectedNewIngredientId">
                                    <option value="" disabled>-- Chọn từ kho --</option>
                                    <option v-for="item in allIngredients" :key="item.id" :value="item.id">
                                        {{ item.name }} (Kho: {{ item.stock_quantity }} {{ item.unit }})
                                    </option>
                                </select>
                                <button class="btn btn-sm btn-primary text-nowrap" @click="addNewIngredient">
                                    <i class="bi bi-plus-lg"></i> Thêm
                                </button>
                            </div>
                        </div>

                    </div>
                </div>

                <div class="modal-box__footer">
                    <button class="btn btn-secondary" @click="showIngredientModal = false">
                        <i class="bi bi-x-circle me-1"></i> Đóng
                    </button>
                    <button class="btn btn-warning fw-bold text-dark" :disabled="isLoadingIngredients"
                        @click="confirmStartCooking">
                        <i class="bi bi-play-fill me-1"></i> Xác nhận nấu
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import api from '@/services/api';
import Swal from 'sweetalert2';

const items = ref([]);
const isLoading = ref(true);
const activeType = ref('all');
let refreshInterval = null;

// ─── STATE CHO NGUYÊN LIỆU ────────────────────────────────────
const showIngredientModal = ref(false);
const isLoadingIngredients = ref(false);
const modalData = ref({ item_name: '', quantity: 1, ingredients: [] });
const currentCookingItemId = ref(null);

// Thêm State để lưu trữ toàn bộ nguyên liệu trong kho
const allIngredients = ref([]);
const selectedNewIngredientId = ref('');
// ──────────────────────────────────────────────────────────────

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

// Gọi API lấy tất cả nguyên liệu trong kho để nhét vào Select Box
const fetchAllIngredients = async () => {
    try {
        const res = await api.get('/kitchen/ingredients'); 
        if (res.data.success) {
            allIngredients.value = res.data.data;
        }
    } catch (error) {
        console.error("Lỗi tải danh sách nguyên liệu kho:", error);
    }
};

const countByType = (type) => {
    if (type === 'dining') return items.value.filter(i => i.order?.table?.name).length;
    if (type === 'takeaway') return items.value.filter(i => !i.order?.table?.name).length;
    return 0;
};

const filteredTables = computed(() => {
    let list = items.value;
    if (activeType.value === 'dining') {
        list = list.filter(i => i.order?.table?.name);
    } else if (activeType.value === 'takeaway') {
        list = list.filter(i => !i.order?.table?.name);
    }

    const groups = {};
    list.forEach(item => {
        const name = item.order?.table?.name || 'Đơn Mang Đi';
        if (!groups[name]) {
            groups[name] = { tableName: name, isTakeaway: !item.order?.table?.name, items: [] };
        }
        groups[name].items.push(item);
    });
    return Object.values(groups);
});

// ─── CÁC HÀM XỬ LÝ (MODAL, NGUYÊN LIỆU) ──────────────────────
const startCooking = async (item) => {
    currentCookingItemId.value = item.id;
    showIngredientModal.value = true;
    isLoadingIngredients.value = true;
    selectedNewIngredientId.value = ''; // Reset select box
    modalData.value = { item_name: item.item_name, quantity: item.quantity, ingredients: [] };

    try {
        const res = await api.get(`/kitchen/items/${item.id}/ingredients`);
        if (res.data.success) {
            modalData.value = res.data.data;
        }
    } catch (error) {
        Swal.fire({ icon: 'error', title: 'Lỗi', text: 'Không tải được nguyên liệu!' });
        showIngredientModal.value = false;
    } finally {
        isLoadingIngredients.value = false;
    }
};

// Hàm xử lý Thêm nguyên liệu từ Select box vào danh sách
const addNewIngredient = () => {
    if (!selectedNewIngredientId.value) return;

    // Tìm thông tin nguyên liệu từ kho
    const ingInfo = allIngredients.value.find(i => i.id === selectedNewIngredientId.value);
    if (!ingInfo) return;

    // Kiểm tra xem đã có trong danh sách hiển thị chưa
    const existingIndex = modalData.value.ingredients.findIndex(i => i.id === ingInfo.id);

    if (existingIndex !== -1) {
        // Nếu có rồi thì tăng số lượng lên 1
        modalData.value.ingredients[existingIndex].quantity_required += 1;
    } else {
        // Nếu chưa có thì push vào mảng
        modalData.value.ingredients.push({
            id: ingInfo.id,
            name: ingInfo.name,
            unit: ingInfo.unit,
            stock_quantity: ingInfo.stock_quantity,
            quantity_required: 1 // Gán mặc định là 1 (bếp tự sửa lại)
        });
    }

    selectedNewIngredientId.value = ''; // Reset select box
};

// Hàm xóa nguyên liệu khỏi danh sách
const removeIngredient = (index) => {
    modalData.value.ingredients.splice(index, 1);
};

// ✅ Quan trọng: Gửi mảng nguyên liệu xuống Backend
const confirmStartCooking = async () => {
    try {
        // Map lại mảng để phù hợp với định dạng gửi lên API
        const payload = {
            status: 'cooking',
            used_ingredients: modalData.value.ingredients.map(ing => ({
                ingredient_id: ing.id,
                quantity: ing.quantity_required
            }))
        };

        // Gửi bằng PATCH hoặc POST tùy thiết kế Backend của bạn
        const res = await api.patch(`/kitchen/items/${currentCookingItemId.value}/status`, payload);

        if (res.data.success) {
            showIngredientModal.value = false;
            fetchItems();
        }
    } catch (error) {
        Swal.fire({ icon: 'error', title: 'Lỗi', text: 'Không thể cập nhật trạng thái!' });
    }
};

// Cập nhật trạng thái thông thường (ví dụ: Chuyển sang READY)
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
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Đồng ý hủy món',
        cancelButtonText: 'Quay lại',
        inputValidator: (value) => {
            if (!value || value.trim() === '') return 'Vui lòng nhập lý do!';
        }
    });

    if (!isConfirmed) return;

    try {
        const res = await api.patch(`/kitchen/items/${item.id}/status`, {
            status: 'cancelled',
            cancel_reason: reason.trim()
        });
        if (res.data.success) fetchItems();
    } catch (error) {
        Swal.fire({ icon: 'error', title: 'Lỗi kết nối', text: 'Không thể kết nối.' });
    }
};

const formatTime = (timeString) => {
    return new Date(timeString).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

onMounted(() => {
    fetchItems();
    fetchAllIngredients(); // Lấy kho ngay khi vào trang
    refreshInterval = setInterval(fetchItems, 10000);
});

onUnmounted(() => clearInterval(refreshInterval));
</script>



<style scoped>
.nav-pills .nav-link {
    color: #6c757d;
    font-weight: bold;
    border-radius: 8px;
}

.nav-pills .nav-link.active {
    background-color: #dc3545;
    color: white;
}

.card {
    border-radius: 12px;
    overflow: hidden;
}

.table th {
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #6c757d;
}

/* ─── MODAL OVERLAY & BOX ───────────────────────────────────── */
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



/* Ẩn mũi tên tăng giảm số lượng mặc định của input type="number" */
input[type=number]::-webkit-inner-spin-button,
input[type=number]::-webkit-outer-spin-button {
    -webkit-appearance: none;
}
</style>