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

    <div class="order-management">

        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="h4 mb-0">Quản lý Hóa đơn</h2>
            <div>
                <button class="btn btn-primary btn-sm me-2" @click="openCreateModal">
                    <i class="bi bi-plus-circle"></i> Tạo Hóa Đơn Mới
                </button>
                <button class="btn btn-outline-primary btn-sm" @click="fetchOrders">
                    <i class="bi bi-arrow-clockwise"></i> Làm mới
                </button>
            </div>
        </div>

        <div class="card shadow-sm border-0">
            <div class="card-body p-0">
                <div class="table-responsive">
                    <table class="table table-hover align-middle mb-0">
                        <thead class="table-light">
                            <tr>
                                <th>Mã ĐH</th>
                                <th>Khách hàng</th>
                                <th>Ngày đặt</th>
                                <th>Tổng tiền</th>
                                <th>Phương thức thanh toán</th>
                                <th>Trạng thái</th>
                                <th class="text-end">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-if="isLoading">
                                <td colspan="6" class="text-center py-4">Đang tải dữ liệu...</td>
                            </tr>
                            <tr v-else-if="orders.length === 0">
                                <td colspan="6" class="text-center py-4">Chưa có đơn hàng nào.</td>
                            </tr>
                            <tr v-else v-for="order in orders" :key="order.id">
                                <td class="fw-bold">#{{ order.id }}</td>
                                <td>
                                    <div class="fw-bold">{{ order.customer_name }}</div>
                                    <small class="text-muted">{{ order.customer_phone }}</small>
                                </td>
                                <td>{{ formatDate(order.created_at) }}</td>
                                <td class="fw-bold text-danger">{{ formatPrice(order.total_price) }}</td>
                                <td>
                                    <div class="fw-bold text-primary">{{ formatPaymentMethod(order.payment_method) }}
                                    </div>
                                    <span class="badge"
                                        :class="order.payment_status === 'paid' ? 'bg-success' : 'bg-secondary'">
                                        {{ order.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán' }}
                                    </span>
                                </td>
                                <td style="width: 200px;">
                                    <select v-model="order.status" class="form-select form-select-sm fw-medium"
                                        :class="getStatusClass(order.status)" @change="updateStatus(order)"
                                        :disabled="order.isUpdating">
                                        <option value="pending">Chờ xác nhận</option>
                                        <option value="processing">Đang chuẩn bị</option>
                                        <option value="completed">Hoàn thành</option>
                                        <option value="delivering">Đang giao hàng</option>
                                        <option value="cancelled">Đã hủy</option>
                                    </select>
                                </td>

                                <td class="text-end">
                                    <button @click="openDetailModal(order)" class="btn btn-sm btn-outline-info me-2"
                                        title="Xem chi tiết">
                                        <i class="bi bi-eye"></i>
                                    </button>
                                    <button v-if="user?.role === 'admin'" @click="deleteOrder(order.id)"
                                        class="btn btn-sm btn-outline-danger" title="Xóa hóa đơn">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <div v-if="showModal" class="custom-modal-overlay" @click.self="closeModal">
            <div class="custom-modal">
                <div class="modal-header bg-light">
                    <h5 class="mb-0">Chi tiết đơn hàng #{{ selectedOrder?.id }}</h5>
                    <button class="btn-close" @click="closeModal"></button>
                </div>
                <div class="modal-body">
                    <div class="mb-4">
                        <h6 class="fw-bold border-bottom pb-2">Thông tin giao hàng & Thanh toán</h6>
                        <p class="mb-1"><strong>Tên người nhận:</strong> {{ selectedOrder?.customer_name }}</p>
                        <p class="mb-1"><strong>SĐT:</strong> {{ selectedOrder?.customer_phone }}</p>
                        <p class="mb-1" v-if="selectedOrder?.customer_address">
                            <strong>Địa chỉ:</strong> {{ selectedOrder?.customer_address }}
                        </p>
                        <p class="mb-1">
                            <strong>Thanh toán:</strong>
                            <span class="badge bg-secondary text-uppercase me-2">{{ selectedOrder?.payment_method
                                }}</span>
                            <span
                                :class="selectedOrder?.payment_status === 'paid' ? 'text-success fw-bold' : 'text-danger fw-bold'">
                                {{ selectedOrder?.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán' }}
                            </span>
                        </p>
                        <p class="mb-1" v-if="selectedOrder?.notes">
                            <strong>Ghi chú:</strong> <span class="text-danger fw-medium">{{ selectedOrder?.notes
                                }}</span>
                        </p>
                    </div>

                    <div>
                        <h6 class="fw-bold border-bottom pb-2">Danh sách món ăn</h6>
                        <ul class="list-group list-group-flush">
                            <li v-for="item in selectedOrder?.items" :key="item.id"
                                class="list-group-item d-flex justify-content-between align-items-center px-0">
                                <div>
                                    <span class="fw-bold">{{ item.menu_item?.name || 'Món ăn đã bị xóa' }}</span>
                                    <div class="text-muted small">SL: {{ item.quantity }} x {{ formatPrice(item.price)
                                        }}</div>
                                </div>
                                <span class="fw-bold">{{ formatPrice(item.quantity * item.price) }}</span>
                            </li>
                        </ul>
                    </div>
                </div>
                <div class="modal-footer d-flex justify-content-between bg-light">
                    <span class="fs-5 fw-bold text-danger">Tổng cộng: {{ formatPrice(selectedOrder?.total_price)
                        }}</span>
                    <button type="button" class="btn btn-secondary" @click="closeModal">Đóng</button>
                </div>
            </div>
        </div>

        <div v-if="showCreateModal" class="custom-modal-overlay" @click.self="closeCreateModal">
            <div class="custom-modal">
                <div class="modal-header bg-light">
                    <h5 class="mb-0">Tạo Hóa Đơn Mới (Tại Quầy)</h5>
                    <button class="btn-close" @click="closeCreateModal"></button>
                </div>
                <div class="modal-body">
                    <form @submit.prevent="submitNewOrder">
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <label class="form-label">Tên khách hàng *</label>
                                <input type="text" class="form-control" v-model="newOrderData.customer_name" required>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Số điện thoại</label>
                                <input type="text" class="form-control" v-model="newOrderData.customer_phone">
                            </div>
                        </div>

                        <div class="mb-3">
                            <label class="form-label">Tổng tiền (VNĐ) *</label>
                            <input type="number" class="form-control" v-model="newOrderData.total_price" required
                                min="0">
                        </div>

                        <div class="row mb-3">
                            <div class="col-md-6">
                                <label class="form-label">Phương thức TT *</label>
                                <select class="form-select" v-model="newOrderData.payment_method">
                                    <option value="cod">Tiền mặt</option>
                                    <option value="banking">Chuyển khoản</option>
                                </select>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Trạng thái TT *</label>
                                <select class="form-select" v-model="newOrderData.payment_status">
                                    <option value="unpaid">Chưa thanh toán</option>
                                    <option value="paid">Đã thanh toán</option>
                                </select>
                            </div>
                        </div>

                        <div class="mb-3">
                            <label class="form-label">Ghi chú</label>
                            <textarea class="form-control" v-model="newOrderData.notes" rows="2"></textarea>
                        </div>

                        <div class="d-flex justify-content-end gap-2 mt-4">
                            <button type="button" class="btn btn-secondary" @click="closeCreateModal">Hủy</button>
                            <button type="submit" class="btn btn-primary" :disabled="isCreating">
                                {{ isCreating ? 'Đang tạo...' : 'Tạo Hóa Đơn' }}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '@/services/api';
import { useAuth } from '@/composables/useAuth';

const orders = ref([]);
const isLoading = ref(true);
const { user } = useAuth();

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

// --- STATE CHO MODAL TẠO MỚI ---
const showCreateModal = ref(false);
const isCreating = ref(false);

const newOrderData = ref({
    customer_name: '',
    customer_phone: '',
    total_price: 0,
    payment_method: 'cod',
    payment_status: 'paid', // Cashier tạo thường là thu tiền luôn
    status: 'completed', // Nếu khách ăn tại quầy thì thường coi như xong
    notes: ''
});

// --- HÀM XỬ LÝ ---
const openCreateModal = () => {
    // Reset form
    newOrderData.value = {
        customer_name: '',
        customer_phone: '',
        total_price: 0,
        payment_method: 'cod',
        payment_status: 'paid',
        status: 'completed',
        notes: ''
    };
    showCreateModal.value = true;
};

const closeCreateModal = () => {
    showCreateModal.value = false;
};

const submitNewOrder = async () => {
    isCreating.value = true;
    try {
        const response = await api.post('/admin/orders', newOrderData.value);
        if (response.data.success) {
            triggerToast('Tạo hóa đơn thành công!', 'success');
            closeCreateModal();
            fetchOrders(); // Refresh danh sách
        }
    } catch (error) {
        console.error('Lỗi tạo hóa đơn:', error);
        triggerToast(error.response?.data?.message || 'Lỗi khi tạo hóa đơn!', 'error');
    } finally {
        isCreating.value = false;
    }
};

// -- STATE MODAL --
const showModal = ref(false);
const selectedOrder = ref(null);

// Lấy danh sách hóa đơn
const fetchOrders = async () => {
    isLoading.value = true;
    try {
        const response = await api.get('/admin/orders');
        if (response.data.success) {
            orders.value = response.data.data.map(order => ({
                ...order,
                isUpdating: false
            }));
        }
    } catch (error) {
        console.error('Lỗi lấy hóa đơn:', error);
        triggerToast('Không thể tải danh sách hóa đơn!', 'error');
    } finally {
        isLoading.value = false;
    }
};

// Cập nhật trạng thái hóa đơn
const updateStatus = async (order) => {
    order.isUpdating = true;
    try {
        const response = await api.patch(`/admin/orders/${order.id}/status`, {
            status: order.status
        });
        if (response.data.success) {
            triggerToast('Đã cập nhật trạng thái!', 'success');
        }
    } catch (error) {
        console.error('Lỗi cập nhật:', error);
        triggerToast('Không thể cập nhật trạng thái!', 'error');
        await fetchOrders(); // Reset lại nếu lỗi
    } finally {
        order.isUpdating = false;
    }
};

// Xóa hóa đơn
const deleteOrder = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa hóa đơn này? Mọi dữ liệu chi tiết sẽ bị mất!')) return;

    try {
        const response = await api.delete(`/admin/orders/${id}`);
        if (response.data.success) {
            orders.value = orders.value.filter(o => o.id !== id);
            triggerToast('Đã xóa hóa đơn!', 'success');
        }
    } catch (error) {
        console.error('Lỗi xóa hóa đơn:', error);
        triggerToast('Không thể xóa hóa đơn này!', 'error');
    }
};

// Mở Modal xem chi tiết
const openDetailModal = (order) => {
    selectedOrder.value = order;
    showModal.value = true;
};

const closeModal = () => {
    showModal.value = false;
    selectedOrder.value = null;
};

// Helpers
const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(price) || 0);
};

const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    }).format(date);
};

const formatPaymentMethod = (method) => {
    if (!method) return 'Khác';

    // Tạo từ điển dịch các mã sang tên hiển thị đẹp
    const methods = {
        'cod': 'Tiền mặt (COD)',
        'vnpay': 'VNPAY',
        'momo': 'Ví MoMo',
        'banking': 'Chuyển khoản'
    };

    // Nếu có trong từ điển thì lấy tên đẹp, không thì tự viết hoa chữ cái (VD: paypal -> PAYPAL)
    return methods[method.toLowerCase()] || method.toUpperCase();
};

const getStatusClass = (status) => {
    switch (status) {
        case 'pending': return 'text-warning border-warning bg-warning bg-opacity-10';
        case 'processing': return 'text-primary border-primary bg-primary bg-opacity-10';
        case 'completed': return 'text-success border-success bg-success bg-opacity-10';
        case 'delivering': return 'text-secondary border-secondary bg-secondary bg-opacity-10';
        case 'cancelled': return 'text-danger border-danger bg-danger bg-opacity-10';
        default: return '';
    }
};

onMounted(() => {
    fetchOrders();
});
</script>

<style scoped>
/* CSS cho Modal và Toast dùng chung như file MenuManagement.vue */
.custom-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1050;
}

.custom-modal {
    background: white;
    width: 100%;
    max-width: 600px;
    border-radius: 8px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    animation: slideDown 0.3s ease-out;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    border-bottom: 1px solid #dee2e6;
}

.modal-body {
    padding: 20px;
    max-height: 60vh;
    overflow-y: auto;
}

.modal-footer {
    padding: 15px 20px;
    border-top: 1px solid #dee2e6;
}

@keyframes slideDown {
    from {
        transform: translateY(-30px);
        opacity: 0;
    }

    to {
        transform: translateY(0);
        opacity: 1;
    }
}

.custom-toast {
    transform: translateX(120%);
    transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    min-width: 250px;
}

.custom-toast.show {
    transform: translateX(0);
}

select.form-select {
    cursor: pointer;
}
</style>