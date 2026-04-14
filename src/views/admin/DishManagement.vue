<template>
    <div class="order-management-container container-fluid py-4">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="fw-bold text-primary"><i class="bi bi-clipboard-data"></i> Quản lý Đơn hàng & Tiến độ món</h2>
            <button class="btn btn-outline-primary" @click="fetchOrders" :disabled="isLoading">
                <i class="bi bi-arrow-clockwise" :class="{ 'fa-spin': isLoading }"></i> Làm mới
            </button>
        </div>

        <div class="row g-3 mb-4 bg-white p-3 rounded shadow-sm border">
            <div class="col-12 col-md-5">
                <div class="input-group">
                    <span class="input-group-text bg-light text-muted"><i class="bi bi-search"></i></span>
                    <input type="text" class="form-control" v-model="searchQuery"
                        placeholder="Tìm ID, Tên khách, SĐT, Tên bàn...">
                </div>
            </div>

            <div class="col-12 col-md-4">
                <div class="input-group">
                    <span class="input-group-text bg-light"><i class="bi bi-funnel"></i></span>
                    <select class="form-select" v-model="filterType">
                        <option value="">Tất cả loại đơn</option>
                        <option value="dine-in">Dùng tại bàn</option>
                        <option value="takeaway">Mang đi / Online</option>
                    </select>
                </div>
            </div>

            <div class="col-12 col-md-3">
                <div class="input-group">
                    <span class="input-group-text bg-light"><i class="bi bi-sort-down"></i></span>
                    <select class="form-select" v-model="sortOrder">
                        <option value="desc">Mới nhất</option>
                        <option value="asc">Cũ nhất</option>
                    </select>
                </div>
            </div>
        </div>

        <div class="quick-tabs-container mb-4">
            <button v-for="tab in filterTabs" :key="tab.value" class="quick-tab"
                :class="{ active: filterStatus === tab.value }" @click="filterStatus = tab.value">
                {{ tab.label }}
                <span class="count-badge" :class="tab.badgeClass">{{ tab.count }}</span>
            </button>
        </div>

        <div v-if="isLoading" class="text-center py-5">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="mt-2 text-muted">Đang tải dữ liệu đơn hàng...</p>
        </div>

        <div v-else-if="orders.length === 0" class="text-center py-5 bg-white rounded shadow-sm border">
            <i class="bi bi-inbox text-muted" style="font-size: 3rem;"></i>
            <h5 class="mt-3">Chưa có đơn hàng nào</h5>
        </div>

        <div v-else-if="filteredAndSortedOrders.length === 0"
            class="text-center py-5 bg-white rounded shadow-sm border">
            <i class="bi bi-search text-muted" style="font-size: 3rem;"></i>
            <h5 class="mt-3 text-muted">Không tìm thấy đơn hàng phù hợp với bộ lọc</h5>
            <button class="btn btn-link mt-2" @click="resetFilters">Xóa bộ lọc</button>
        </div>

        <div v-else class="row g-3">
            <div class="col-12 col-xl-6" v-for="order in filteredAndSortedOrders" :key="order.id">
                <div class="card shadow-sm h-100 border-0"
                    :class="{ 'border-start border-4 border-warning': order.status === 'pending' }">

                    <div class="card-header bg-white d-flex justify-content-between align-items-center py-3"
                        style="cursor: pointer; user-select: none;" @click="toggleOrderDetails(order.id)">
                        <div>
                            <h5 class="mb-1 fw-bold">#{{ order.id }}</h5>
                            <span v-if="order.table_id === null" class="badge bg-info text-dark me-2">
                                <i class="bi bi-bag-check"></i> Mang đi / Online
                            </span>
                            <span v-else class="badge bg-primary me-2">
                                <i class="bi bi-shop"></i> Bàn {{ order.table?.name || order.table_id }}
                            </span>
                            <small class="text-muted"><i class="bi bi-clock"></i> {{ formatDate(order.created_at)
                                }}</small>
                        </div>

                        <div class="d-flex align-items-center gap-3">
                            <span class="badge fs-6" :class="getOrderStatusClass(order.status)">
                                {{ getOrderStatusText(order.status) }}
                            </span>
                            <i class="bi text-muted"
                                :class="expandedOrders.includes(order.id) ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
                        </div>
                    </div>

                    <div class="card-body p-0" v-show="expandedOrders.includes(order.id)">
                        <div class="table-responsive">
                            <table class="table table-hover table-borderless mb-0 align-middle">
                                <thead class="table-light text-muted small">
                                    <tr>
                                        <th class="ps-3">Tên món</th>
                                        <th class="text-center">SL</th>
                                        <th>Trạng thái bếp</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="item in order.items" :key="item.id"
                                        :class="{ 'opacity-50': item.status === 'cancelled' }">
                                        <td class="ps-3">
                                            <div class="fw-bold">{{ item.item_name }}</div>
                                            <small v-if="item.note" class="text-danger fst-italic">Ghi chú: {{ item.note
                                                }}</small>
                                        </td>
                                        <td class="text-center fw-bold">{{ item.quantity }}</td>
                                        <td>
                                            <span class="badge" :class="getItemStatusClass(item.status)">
                                                {{ getItemStatusText(item.status) }}
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="card-footer bg-light d-flex justify-content-between align-items-center">
                        <div class="small text-muted">
                            <div v-if="order.table_id === null">
                                <i class="bi bi-person"></i> {{ order.customer_name || 'Khách vãng lai' }}
                                <span v-if="order.customer_phone">- {{ order.customer_phone }}</span>
                            </div>
                            <div class="fw-bold text-dark mt-1">
                                Tổng: <span class="text-danger">{{ formatCurrency(order.total_price) }}</span>
                            </div>
                        </div>

                        <div v-if="order.table_id === null && !['completed', 'cancelled'].includes(order.status)"
                            class="d-flex gap-2">

                            <button v-if="order.status !== 'delivering'" class="btn btn-sm btn-primary"
                                @click.stop="updateOrderStatus(order.id, 'delivering')"
                                :disabled="!canCompleteOrder(order)"
                                :title="!canCompleteOrder(order) ? 'Chưa thể đi giao vì còn món đang chế biến' : 'Bắt đầu giao hàng'">
                                <i class="bi bi-truck"></i> Tiến hành giao
                            </button>

                            <button v-if="order.status === 'delivering'" class="btn btn-sm btn-success"
                                @click.stop="updateOrderStatus(order.id, 'completed')"
                                title="Xác nhận đơn hàng đã giao thành công">
                                <i class="bi bi-check-circle-fill"></i> Giao xong
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '@/services/api';

const orders = ref([]);
const isLoading = ref(false);

// --- CÁC BIẾN CHO TÌM KIẾM & LỌC ---
const searchQuery = ref('');
const filterType = ref('');
const filterStatus = ref('');
const sortOrder = ref('desc');

// --- BIẾN CHO THU GỌN/MỞ RỘNG (CẢI TIẾN 1) ---
const expandedOrders = ref([]);

const toggleOrderDetails = (orderId) => {
    const index = expandedOrders.value.indexOf(orderId);
    if (index > -1) {
        expandedOrders.value.splice(index, 1);
    } else {
        expandedOrders.value.push(orderId);
    }
};

// --- COMPUTED: TẠO TAB & ĐẾM SỐ LƯỢNG (CẢI TIẾN 2) ---
const getOrderCount = (status) => {
    let baseOrders = orders.value;
    // Vẫn tôn trọng bộ lọc Loại đơn (Dùng tại bàn / Mang đi) khi đếm
    if (filterType.value === 'dine-in') baseOrders = baseOrders.filter(o => o.table_id !== null);
    if (filterType.value === 'takeaway') baseOrders = baseOrders.filter(o => o.table_id === null);

    if (status === '') return baseOrders.length;
    return baseOrders.filter(o => o.status === status).length;
};

const filterTabs = computed(() => [
    { value: '', label: 'Tất cả', count: getOrderCount(''), badgeClass: 'bg-secondary' },
    { value: 'pending', label: 'Chờ xử lý', count: getOrderCount('pending'), badgeClass: 'bg-warning text-dark' },
    { value: 'processing', label: 'Đang làm món', count: getOrderCount('processing'), badgeClass: 'bg-primary' },
    { value: 'serving', label: 'Đang phục vụ', count: getOrderCount('serving'), badgeClass: 'bg-info text-dark' },
    { value: 'delivering', label: 'Đang giao', count: getOrderCount('delivering'), badgeClass: 'bg-info text-dark' },
    { value: 'completed', label: 'Hoàn thành', count: getOrderCount('completed'), badgeClass: 'bg-success' },
    { value: 'cancelled', label: 'Đã hủy', count: getOrderCount('cancelled'), badgeClass: 'bg-danger' }
]);

// --- COMPUTED: LỌC & SẮP XẾP DỮ LIỆU ---
const filteredAndSortedOrders = computed(() => {
    let result = orders.value;

    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase().trim();
        result = result.filter(order => {
            const idMatch = order.id.toString().includes(query);
            const nameMatch = (order.customer_name || '').toLowerCase().includes(query);
            const phoneMatch = (order.customer_phone || '').includes(query);
            const tableMatch = (order.table?.name || '').toLowerCase().includes(query);

            return idMatch || nameMatch || phoneMatch || tableMatch;
        });
    }

    if (filterType.value === 'dine-in') {
        result = result.filter(order => order.table_id !== null);
    } else if (filterType.value === 'takeaway') {
        result = result.filter(order => order.table_id === null);
    }

    if (filterStatus.value) {
        result = result.filter(order => order.status === filterStatus.value);
    }

    result = [...result].sort((a, b) => {
        const timeA = new Date(a.created_at).getTime();
        const timeB = new Date(b.created_at).getTime();
        return sortOrder.value === 'desc' ? timeB - timeA : timeA - timeB;
    });

    return result;
});

const resetFilters = () => {
    searchQuery.value = '';
    filterType.value = '';
    filterStatus.value = '';
    sortOrder.value = 'desc';
};

// ==========================================
// API LOGIC
// ==========================================
const fetchOrders = async () => {
    isLoading.value = true;
    try {
        const response = await api.get('/admin/orders');
        if (response.data.success) {
            orders.value = response.data.data;
        }
    } catch (error) {
        console.error("Lỗi khi tải danh sách đơn hàng:", error);
        alert("Không thể tải danh sách đơn hàng.");
    } finally {
        isLoading.value = false;
    }
};

const updateOrderStatus = async (orderId, newStatus) => {
    if (!confirm('Xác nhận tiến hành giao hàng?')) return;

    try {
        const response = await api.patch(`/admin/orders/${orderId}/status`, {
            status: newStatus
        });
        if (response.data.success) {
            fetchOrders();
        } else {
            alert(response.data.message);
        }
    } catch (error) {
        console.error("Lỗi cập nhật:", error);
        alert("Có lỗi xảy ra khi cập nhật!");
    }
};

const canCompleteOrder = (order) => {
    if (!order.items || order.items.length === 0) return false;
    const hasUnfinishedItems = order.items.some(item =>
        ['pending', 'cooking'].includes(item.status)
    );
    return !hasUnfinishedItems;
};

// ==========================================
// HELPERS
// ==========================================
const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
};

const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' - ' + date.toLocaleDateString('vi-VN');
};

const getOrderStatusClass = (status) => {
    const map = {
        'pending': 'bg-warning text-dark',
        'serving': 'bg-info text-dark',
        'processing': 'bg-primary',
        'delivering': 'bg-info text-dark',
        'completed': 'bg-success',
        'cancelled': 'bg-danger'
    };
    return map[status] || 'bg-secondary';
};

const getOrderStatusText = (status) => {
    const map = {
        'pending': 'Chờ xử lý',
        'serving': 'Đang phục vụ',
        'processing': 'Đang làm món',
        'delivering': 'Đang giao',
        'completed': 'Đã hoàn thành',
        'cancelled': 'Đã hủy'
    };
    return map[status] || status;
};

const getItemStatusClass = (status) => {
    const map = {
        'pending': 'bg-warning text-dark',
        'cooking': 'bg-primary',
        'ready': 'bg-success',
        'served': 'bg-secondary',
        'cancelled': 'bg-danger'
    };
    return map[status] || 'bg-secondary';
};

const getItemStatusText = (status) => {
    const map = {
        'pending': 'Chờ làm',
        'cooking': 'Đang nấu',
        'ready': 'Nấu xong',
        'served': 'Đã lên món/Giao',
        'cancelled': 'Đã hủy'
    };
    return map[status] || status;
};

onMounted(() => {
    fetchOrders();
});
</script>

<style scoped>
/* --- STYLE CHO TABS BỘ LỌC DÀNH CHO BOOTSTRAP --- */
.quick-tabs-container {
    display: flex;
    gap: 0.75rem;
    overflow-x: auto;
    padding-bottom: 0.5rem;
    scrollbar-width: none;
    /* Firefox */
}

.quick-tabs-container::-webkit-scrollbar {
    display: none;
    /* Chrome, Safari, Edge */
}

.quick-tab {
    display: flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    border: 1px solid #dee2e6;
    /* Màu border chuẩn bootstrap */
    background: #fff;
    color: #495057;
    font-weight: 500;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.quick-tab:hover {
    background: #f8f9fa;
    border-color: #ced4da;
}

.quick-tab.active {
    background-color: #e7f1ff;
    /* Xanh nhạt chuẩn alert-primary */
    border-color: #0d6efd;
    /* Xanh primary bootstrap */
    color: #0d6efd;
    box-shadow: 0 2px 4px rgba(13, 110, 253, 0.15);
}

.count-badge {
    padding: 3px 8px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 700;
}

/* ----------------------------------------------- */

.card-header:hover {
    background-color: #f8f9fa !important;
}
</style>