<template>
    <div class="dashboard-container">
        <h2 class="page-title mb-4">Tổng quan hệ thống</h2>

        <div v-if="isLoading" class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Đang tải...</span>
            </div>
            <p class="mt-2 text-muted">Đang tổng hợp dữ liệu...</p>
        </div>

        <div v-else>
            <div class="row g-4 mb-4">
                <div class="col-12 col-sm-6 col-lg-3">
                    <div class="stat-card revenue">
                        <div class="stat-icon">
                            <i class="bi bi-currency-dollar"></i>
                        </div>
                        <div class="stat-details">
                            <p class="stat-label">Tổng doanh thu (Đã thu)</p>
                            <h3 class="stat-value">{{ formatCurrency(stats.revenue) }}</h3>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-sm-6 col-lg-3">
                    <div class="stat-card orders">
                        <div class="stat-icon">
                            <i class="bi bi-receipt"></i>
                        </div>
                        <div class="stat-details">
                            <p class="stat-label">Tổng đơn hàng</p>
                            <h3 class="stat-value">{{ stats.orders }}</h3>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-sm-6 col-lg-3">
                    <div class="stat-card users">
                        <div class="stat-icon">
                            <i class="bi bi-people"></i>
                        </div>
                        <div class="stat-details">
                            <p class="stat-label">Khách hàng mới (Tháng này)</p>
                            <h3 class="stat-value">{{ stats.newUsers }}</h3>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-sm-6 col-lg-3">
                    <router-link to="/admin/reservations" class="text-decoration-none">
                        <div class="stat-card reservations clickable-card">
                            <div class="stat-icon">
                                <i class="bi bi-calendar-check"></i>
                            </div>
                            <div class="stat-details">
                                <p class="stat-label">Yêu cầu đặt bàn mới</p>
                                <h3 class="stat-value text-dark">{{ stats.pendingReservations }}</h3>
                            </div>
                        </div>
                    </router-link>
                </div>
            </div>

            <div class="card border-0 shadow-sm">
                <div class="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
                    <h5 class="mb-0 fw-bold">Đơn hàng gần đây</h5>
                    <router-link to="/admin/orders" class="btn btn-sm btn-outline-primary">Xem tất cả</router-link>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover align-middle mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th>Mã ĐH</th>
                                    <th>Khách hàng</th>
                                    <th>Ngày đặt</th>
                                    <th>Tổng tiền</th>
                                    <th>Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-if="recentOrders.length === 0">
                                    <td colspan="5" class="text-center py-4">Chưa có đơn hàng nào.</td>
                                </tr>
                                <tr v-else v-for="order in recentOrders" :key="order.id">
                                    <td><span class="fw-bold text-secondary">#{{ order.id }}</span></td>
                                    <td>{{ order.customer_name }}</td>
                                    <td>{{ formatDate(order.created_at) }}</td>
                                    <td class="fw-bold text-danger">{{ formatCurrency(order.total_price) }}</td>
                                    <td>
                                        <span class="badge" :class="getStatusClass(order.status)">
                                            {{ getStatusText(order.status) }}
                                        </span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '@/services/api';

const isLoading = ref(true);

// State chứa dữ liệu thống kê thật
const stats = ref({
    revenue: 0,
    orders: 0,
    newUsers: 0,
    pendingReservations: 0
});

// State chứa 5 đơn hàng mới nhất
const recentOrders = ref([]);

// Hàm lấy dữ liệu Dashboard
const fetchDashboardData = async () => {
    isLoading.value = true;
    try {
        // Dùng Promise.all để gọi 3 API cùng một lúc thay vì gọi tuần tự chờ nhau (Giúp load cực nhanh)
        const [ordersRes, usersRes, reservationsRes] = await Promise.all([
            api.get('/admin/orders'),
            api.get('/admin/users'),
            api.get('/admin/reservations')
        ]);

        const ordersData = ordersRes.data.success ? ordersRes.data.data : [];
        const usersData = usersRes.data.success ? usersRes.data.data : [];
        const reservationsData = reservationsRes.data.reservations ? reservationsRes.data.reservations : [];

        // 1. TÍNH DOANH THU (CHỈ LẤY CÁC ĐƠN ĐÃ THANH TOÁN: 'paid')
        stats.value.revenue = ordersData
            .filter(order => order.payment_status === 'paid')
            .reduce((sum, order) => sum + Number(order.total_price), 0);

        // 2. TỔNG SỐ ĐƠN HÀNG
        stats.value.orders = ordersData.length;

        // 3. KHÁCH HÀNG MỚI (Lọc những khách tạo tài khoản trong tháng này)
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        stats.value.newUsers = usersData.filter(user => {
            const userDate = new Date(user.created_at);
            return userDate.getMonth() === currentMonth && userDate.getFullYear() === currentYear;
        }).length;

        // 4. YÊU CẦU ĐẶT BÀN CHỜ XÁC NHẬN
        stats.value.pendingReservations = reservationsData.filter(res => res.status === 'pending').length;

        // 5. LẤY 5 ĐƠN HÀNG GẦN NHẤT ĐỂ HIỂN THỊ RA BẢNG (API đã sắp xếp latest() nên chỉ cần cắt 5 cái đầu)
        recentOrders.value = ordersData.slice(0, 5);

    } catch (error) {
        console.error("Lỗi khi tải dữ liệu Dashboard:", error);
    } finally {
        isLoading.value = false;
    }
};

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value) || 0);
};

const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

// Dịch trạng thái từ tiếng Anh sang tiếng Việt
const getStatusText = (status) => {
    switch (status) {
        case 'completed': return 'Hoàn thành';
        case 'pending': return 'Chờ xác nhận';
        case 'processing': return 'Đang chuẩn bị';
        case 'delivering': return 'Đang giao hàng';
        case 'cancelled': return 'Đã hủy';
        default: return 'Không rõ';
    }
};

const getStatusClass = (status) => {
    switch (status) {
        case 'completed': return 'bg-success';
        case 'pending': return 'bg-warning text-dark';
        case 'processing': return 'bg-info text-dark';
        case 'delivering': return 'bg-secondary text-white';
        case 'cancelled': return 'bg-danger';
        default: return 'bg-secondary';
    }
};

onMounted(() => {
    fetchDashboardData();
});
</script>

<style scoped>
/* GIỮ NGUYÊN TOÀN BỘ CSS CỦA BẠN TRƯỚC ĐÓ Ở ĐÂY */
.page-title {
    color: #333;
    font-weight: 700;
    font-size: 1.5rem;
}

.stat-card {
    background: #fff;
    border-radius: 10px;
    padding: 20px;
    display: flex;
    align-items: center;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.stat-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.stat-icon {
    width: 60px;
    height: 60px;
    border-radius: 12px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 1.8rem;
    margin-right: 15px;
}

.stat-details {
    flex: 1;
}

.stat-label {
    margin: 0;
    color: #888;
    font-size: 0.9rem;
    font-weight: 500;
}

.stat-value {
    margin: 0;
    color: #333;
    font-size: 1.4rem;
    font-weight: 700;
}

.revenue .stat-icon {
    background-color: #e3f2fd;
    color: #1976d2;
}

.orders .stat-icon {
    background-color: #e8f5e9;
    color: #388e3c;
}

.users .stat-icon {
    background-color: #f3e5f5;
    color: #7b1fa2;
}

.reservations .stat-icon {
    background-color: #fff3e0;
    color: #e67e22;
}

.table th {
    font-weight: 600;
    color: #555;
    text-transform: uppercase;
    font-size: 0.85rem;
    letter-spacing: 0.5px;
}

.table td {
    vertical-align: middle;
    padding: 12px 15px;
}

.badge {
    padding: 6px 10px;
    font-weight: 500;
    border-radius: 6px;
}

/* Thêm class để báo hiệu card có thể click */
.clickable-card {
    cursor: pointer;
}

/* Đảm bảo màu chữ bên trong router-link không bị biến thành màu xanh của link */
.clickable-card .stat-label {
    color: #888;
    transition: color 0.3s ease;
}

.clickable-card:hover .stat-label {
    color: #e67e22;
    /* Đổi màu chữ label khi hover cho đồng bộ với icon */
}
</style>