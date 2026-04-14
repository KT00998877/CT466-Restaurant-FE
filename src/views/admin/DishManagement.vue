<template>
    <div class="order-management-container container-fluid py-4">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="fw-bold text-primary"><i class="bi bi-clipboard-data"></i> Quản lý Đơn hàng & Tiến độ món</h2>
            <button class="btn btn-outline-primary" @click="fetchOrders" :disabled="isLoading">
                <i class="bi bi-arrow-clockwise" :class="{ 'fa-spin': isLoading }"></i> Làm mới
            </button>
        </div>

        <div class="row g-3 mb-4 bg-white p-3 rounded shadow-sm border">
            <div class="col-12 col-md-4">
                <div class="input-group">
                    <span class="input-group-text bg-light text-muted"><i class="bi bi-search"></i></span>
                    <input type="text" class="form-control" v-model="searchQuery"
                        placeholder="Tìm ID, Tên khách, SĐT, Tên bàn...">
                </div>
            </div>

            <div class="col-12 col-md-3">
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
                    <span class="input-group-text bg-light"><i class="bi bi-tags"></i></span>
                    <select class="form-select" v-model="filterStatus">
                        <option value="">Tất cả trạng thái</option>
                        <option value="pending">Chờ xử lý</option>
                        <option value="processing">Đang làm món</option>
                        <option value="serving">Đang phục vụ</option>
                        <option value="delivering">Đang giao</option>
                        <option value="completed">Đã hoàn thành</option>
                        <option value="cancelled">Đã hủy</option>
                    </select>
                </div>
            </div>

            <div class="col-12 col-md-2">
                <div class="input-group">
                    <span class="input-group-text bg-light"><i class="bi bi-sort-down"></i></span>
                    <select class="form-select" v-model="sortOrder">
                        <option value="desc">Mới nhất</option>
                        <option value="asc">Cũ nhất</option>
                    </select>
                </div>
            </div>
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

                    <div class="card-header bg-white d-flex justify-content-between align-items-center py-3">
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

                        <span class="badge fs-6" :class="getOrderStatusClass(order.status)">
                            {{ getOrderStatusText(order.status) }}
                        </span>
                    </div>

                    <div class="card-body p-0">
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
                            <button class="btn btn-sm btn-success" @click="updateOrderStatus(order.id, 'completed')">
                                <i class="bi bi-check2-circle"></i> Hoàn thành
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
const filterType = ref(''); // '' (tất cả), 'dine-in', 'takeaway'
const filterStatus = ref(''); // '' (tất cả), 'pending', 'processing', ...
const sortOrder = ref('desc'); // 'desc' (mới nhất), 'asc' (cũ nhất)

// --- COMPUTED: LỌC & SẮP XẾP DỮ LIỆU ---
const filteredAndSortedOrders = computed(() => {
    let result = orders.value;

    // 1. Lọc theo chuỗi tìm kiếm (ID, Tên, SĐT, Tên Bàn)
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

    // 2. Lọc theo Loại đơn
    if (filterType.value === 'dine-in') {
        result = result.filter(order => order.table_id !== null);
    } else if (filterType.value === 'takeaway') {
        result = result.filter(order => order.table_id === null);
    }

    // 3. Lọc theo Trạng thái
    if (filterStatus.value) {
        result = result.filter(order => order.status === filterStatus.value);
    }

    // 4. Sắp xếp theo Thời gian tạo
    result = [...result].sort((a, b) => {
        const timeA = new Date(a.created_at).getTime();
        const timeB = new Date(b.created_at).getTime();
        return sortOrder.value === 'desc' ? timeB - timeA : timeA - timeB;
    });

    return result;
});

// Hàm reset nhanh các bộ lọc
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
    if (!confirm('Xác nhận cập nhật trạng thái đơn hàng này?')) return;

    try {
        const response = await api.put(`/admin/orders/${orderId}/status`, {
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