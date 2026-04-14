<template>
    <div class="dashboard-wrap">

        <!-- Page Header -->
        <div class="page-header">
            <div>
                <h2 class="page-title">Tổng quan hệ thống</h2>
                <p class="page-sub">Cập nhật lúc {{ lastUpdated }}</p>
            </div>
            <div class="header-date">
                <i class="bi bi-calendar3"></i>
                <span>{{ currentMonth }}</span>
            </div>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="loading-state">
            <div class="loading-spinner"></div>
            <p>Đang tổng hợp dữ liệu...</p>
        </div>

        <div v-else>
            <!-- Stat Cards -->
            <div class="stat-grid">
                <!-- Doanh thu -->
                <div class="stat-card">
                    <div class="stat-accent" style="background:#3b8dd4"></div>
                    <div class="stat-header">
                        <div class="stat-icon-wrap" style="background:#e6f1fb">
                            <i class="bi bi-currency-dollar" style="color:#3b8dd4"></i>
                        </div>
                        <span class="stat-delta stat-delta--up">
                            <i class="bi bi-arrow-up"></i> Đã thu
                        </span>
                    </div>
                    <p class="stat-label">Doanh thu</p>
                    <h3 class="stat-value">{{ formatCurrencyShort(stats.revenue) }}</h3>
                    <p class="stat-detail">{{ formatCurrency(stats.revenue) }}</p>
                </div>

                <!-- Đơn hàng -->
                <div class="stat-card">
                    <div class="stat-accent" style="background:#4caf6e"></div>
                    <div class="stat-header">
                        <div class="stat-icon-wrap" style="background:#e8f5ee">
                            <i class="bi bi-receipt" style="color:#4caf6e"></i>
                        </div>
                        <span class="stat-delta stat-delta--neutral">Tất cả</span>
                    </div>
                    <p class="stat-label">Tổng đơn hàng</p>
                    <h3 class="stat-value">{{ stats.orders }}</h3>
                    <p class="stat-detail">Đơn trong hệ thống</p>
                </div>

                <!-- Khách hàng mới -->
                <div class="stat-card">
                    <div class="stat-accent" style="background:#7c6ee0"></div>
                    <div class="stat-header">
                        <div class="stat-icon-wrap" style="background:#eeecfc">
                            <i class="bi bi-people" style="color:#7c6ee0"></i>
                        </div>
                        <span class="stat-delta stat-delta--neutral">Tháng này</span>
                    </div>
                    <p class="stat-label">Khách hàng mới</p>
                    <h3 class="stat-value">{{ stats.newUsers }}</h3>
                    <p class="stat-detail">Tài khoản đăng ký</p>
                </div>

                <!-- Đặt bàn -->
                <router-link to="/admin/reservations" class="stat-card stat-card--link">
                    <div class="stat-accent" style="background:#e8892a"></div>
                    <div class="stat-header">
                        <div class="stat-icon-wrap" style="background:#fff3e0">
                            <i class="bi bi-calendar-check" style="color:#e8892a"></i>
                        </div>
                        <span v-if="stats.pendingReservations > 0" class="stat-delta stat-delta--warn">
                            Cần xử lý
                        </span>
                        <span v-else class="stat-delta stat-delta--neutral">Trống</span>
                    </div>
                    <p class="stat-label">Yêu cầu đặt bàn</p>
                    <h3 class="stat-value">{{ stats.pendingReservations }}</h3>
                    <p class="stat-detail">Đang chờ xác nhận →</p>
                </router-link>
            </div>

            <!-- Bottom Grid: Table + Sidebar -->
            <div class="content-grid">
                <!-- Recent Orders Table -->
                <div class="data-card">
                    <div class="data-card-header">
                        <h5 class="data-card-title">
                            <i class="bi bi-clock-history me-2" style="color:#3b8dd4;font-size:14px"></i>
                            Đơn hàng gần đây
                        </h5>
                        <router-link to="/admin/orders" class="view-all-btn">
                            Xem tất cả <i class="bi bi-arrow-right"></i>
                        </router-link>
                    </div>

                    <div class="table-wrap">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>MÃ ĐH</th>
                                    <th>KHÁCH HÀNG</th>
                                    <th>NGÀY ĐẶT</th>
                                    <th>TỔNG TIỀN</th>
                                    <th>TRẠNG THÁI</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-if="recentOrders.length === 0">
                                    <td colspan="5" class="empty-row">
                                        <i class="bi bi-inbox" style="font-size:20px;color:#ccc"></i>
                                        <span>Chưa có đơn hàng nào.</span>
                                    </td>
                                </tr>
                                <tr v-else v-for="order in recentOrders" :key="order.id" class="table-row">
                                    <td><span class="order-id">#{{ order.id }}</span></td>
                                    <td>
                                        <div class="customer-cell">
                                            <div class="customer-avatar">{{ getCustomerInitial(order.customer_name) }}
                                            </div>
                                            <span>{{ order.customer_name || '—' }}</span>
                                        </div>
                                    </td>
                                    <td class="date-cell">{{ formatDate(order.created_at) }}</td>
                                    <td><span class="amount">{{ formatCurrency(order.total_price) }}</span></td>
                                    <td>
                                        <span class="status-badge" :class="getStatusClass(order.status)">
                                            {{ getStatusText(order.status) }}
                                        </span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Right Panel -->
                <div class="side-panel">
                    <!-- Reservations widget -->
                    <div class="widget-card">
                        <div class="widget-header">
                            <span class="widget-title">
                                <i class="bi bi-calendar-event" style="color:#e8892a"></i>
                                Đặt bàn chờ xử lý
                            </span>
                            <span class="widget-count" :class="{ 'has-items': stats.pendingReservations > 0 }">
                                {{ stats.pendingReservations }}
                            </span>
                        </div>
                        <div class="widget-body">
                            <p v-if="stats.pendingReservations === 0" class="widget-empty">
                                Không có yêu cầu nào đang chờ.
                            </p>
                            <router-link v-else to="/admin/reservations" class="widget-action-btn">
                                <i class="bi bi-arrow-right-circle"></i>
                                Xem {{ stats.pendingReservations }} yêu cầu đặt bàn
                            </router-link>
                        </div>
                    </div>

                    <!-- Quick stats -->
                    <div class="widget-card">
                        <div class="widget-header">
                            <span class="widget-title">
                                <i class="bi bi-activity" style="color:#7c6ee0"></i>
                                Tóm tắt nhanh
                            </span>
                        </div>
                        <div class="quick-grid">
                            <div class="quick-item">
                                <span class="quick-label">Hoàn thành</span>
                                <span class="quick-value quick-value--green">
                                    {{ ordersByStatus('completed') }}
                                </span>
                            </div>
                            <div class="quick-item">
                                <span class="quick-label">Đang giao</span>
                                <span class="quick-value quick-value--blue">
                                    {{ ordersByStatus('delivering') }}
                                </span>
                            </div>
                            <div class="quick-item">
                                <span class="quick-label">Chuẩn bị</span>
                                <span class="quick-value quick-value--amber">
                                    {{ ordersByStatus('processing') }}
                                </span>
                            </div>
                            <div class="quick-item">
                                <span class="quick-label">Đã hủy</span>
                                <span class="quick-value quick-value--red">
                                    {{ ordersByStatus('cancelled') }}
                                </span>
                            </div>
                        </div>
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
const allOrders = ref([]);

const stats = ref({
    revenue: 0,
    orders: 0,
    newUsers: 0,
    pendingReservations: 0,
});

const recentOrders = ref([]);

// Ngày hiển thị
const now = new Date();
const lastUpdated = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
const currentMonth = now.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });

const fetchDashboardData = async () => {
    isLoading.value = true;
    try {
        const [ordersRes, usersRes, reservationsRes] = await Promise.all([
            api.get('/admin/orders'),
            api.get('/admin/users'),
            api.get('/admin/reservations'),
        ]);

        const ordersData = ordersRes.data.success ? ordersRes.data.data : [];
        const usersData = usersRes.data.success ? usersRes.data.data : [];
        const reservationsData = reservationsRes.data.reservations || [];

        allOrders.value = ordersData;

        stats.value.revenue = ordersData
            .filter(o => o.payment_status === 'paid')
            .reduce((sum, o) => sum + Number(o.total_price), 0);

        stats.value.orders = ordersData.length;

        const cm = new Date().getMonth(), cy = new Date().getFullYear();
        stats.value.newUsers = usersData.filter(u => {
            const d = new Date(u.created_at);
            return d.getMonth() === cm && d.getFullYear() === cy;
        }).length;

        stats.value.pendingReservations = reservationsData.filter(r => r.status === 'pending').length;
        recentOrders.value = ordersData.slice(0, 5);

    } catch (e) {
        console.error('Lỗi khi tải Dashboard:', e);
    } finally {
        isLoading.value = false;
    }
};

// Thống kê đơn theo trạng thái (dùng cho quick stats)
const ordersByStatus = (status) => allOrders.value.filter(o => o.status === status).length;

// ---- Utilities ----
const formatCurrency = (v) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(v) || 0);

// Rút gọn số lớn: 6.251.200 → 6,25 tr
const formatCurrencyShort = (v) => {
    const n = Number(v) || 0;
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(2).replace('.', ',') + ' tr ₫';
    if (n >= 1_000) return (n / 1_000).toFixed(0) + ' nghìn ₫';
    return formatCurrency(n);
};

const formatDate = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    return dt.toLocaleDateString('vi-VN') + ' · ' +
        dt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

const getCustomerInitial = (name) => {
    if (!name) return '?';
    return name.trim().split(' ').pop()[0]?.toUpperCase() || '?';
};

const getStatusText = (s) => ({
    completed: 'Hoàn thành',
    pending: 'Chờ xác nhận',
    processing: 'Đang chuẩn bị',
    delivering: 'Đang giao hàng',
    cancelled: 'Đã hủy',
}[s] || 'Không rõ');

const getStatusClass = (s) => ({
    completed: 'badge--success',
    pending: 'badge--warning',
    processing: 'badge--info',
    delivering: 'badge--secondary',
    cancelled: 'badge--danger',
}[s] || 'badge--secondary');

onMounted(fetchDashboardData);
</script>

<style scoped>
/* ===== LAYOUT ===== */
.dashboard-wrap {
    max-width: 1200px;
}

/* ===== PAGE HEADER ===== */
.page-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-bottom: 20px;
}

.page-title {
    font-size: 1.3rem;
    font-weight: 600;
    color: #1a1a2e;
    margin: 0;
}

.page-sub {
    font-size: 12px;
    color: #999;
    margin: 3px 0 0;
}

.header-date {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: #fff;
    border: 0.5px solid #e5e7eb;
    border-radius: 8px;
    font-size: 12px;
    color: #666;
}

/* ===== LOADING ===== */
.loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 60px 0;
    gap: 12px;
    color: #aaa;
    font-size: 13px;
}

.loading-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #e5e7eb;
    border-top-color: #3b8dd4;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

/* ===== STAT CARDS ===== */
.stat-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
    margin-bottom: 18px;
}

.stat-card {
    background: #fff;
    border-radius: 12px;
    border: 0.5px solid #e5e7eb;
    padding: 16px;
    position: relative;
    overflow: hidden;
    text-decoration: none;
    color: inherit;
    display: block;
    transition: border-color 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
    border-color: #d0d5dd;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.stat-card--link {
    cursor: pointer;
}

.stat-accent {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    border-radius: 12px 12px 0 0;
}

.stat-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 12px;
}

.stat-icon-wrap {
    width: 36px;
    height: 36px;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
}

.stat-delta {
    font-size: 10.5px;
    font-weight: 500;
    padding: 3px 8px;
    border-radius: 5px;
}

.stat-delta--up {
    background: #eaf3de;
    color: #3b6d11;
}

.stat-delta--neutral {
    background: #f1f1f1;
    color: #777;
}

.stat-delta--warn {
    background: #fff3e0;
    color: #854f0b;
}

.stat-label {
    font-size: 11.5px;
    color: #999;
    margin: 0 0 4px;
    font-weight: 400;
}

.stat-value {
    font-size: 1.6rem;
    font-weight: 600;
    color: #1a1a2e;
    margin: 0 0 4px;
    line-height: 1.1;
}

.stat-detail {
    font-size: 11px;
    color: #bbb;
    margin: 0;
}

/* ===== CONTENT GRID ===== */
.content-grid {
    display: grid;
    grid-template-columns: 1fr 280px;
    gap: 14px;
    align-items: start;
}

/* ===== DATA CARD (TABLE) ===== */
.data-card {
    background: #fff;
    border: 0.5px solid #e5e7eb;
    border-radius: 12px;
    overflow: hidden;
}

.data-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px;
    border-bottom: 0.5px solid #f0f0f0;
}

.data-card-title {
    font-size: 13.5px;
    font-weight: 600;
    color: #1a1a2e;
    margin: 0;
    display: flex;
    align-items: center;
}

.view-all-btn {
    font-size: 12px;
    color: #3b8dd4;
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 5px 10px;
    border: 0.5px solid #d0e4f4;
    border-radius: 6px;
    transition: background 0.15s;
}

.view-all-btn:hover {
    background: #f0f7ff;
}

.table-wrap {
    overflow-x: auto;
}

.data-table {
    width: 100%;
    border-collapse: collapse;
}

.data-table thead th {
    padding: 9px 16px;
    font-size: 10.5px;
    font-weight: 600;
    color: #aaa;
    text-align: left;
    letter-spacing: 0.5px;
    background: #fafafa;
    border-bottom: 0.5px solid #f0f0f0;
}

.data-table tbody td {
    padding: 11px 16px;
    font-size: 13px;
    color: #333;
    border-bottom: 0.5px solid #f5f5f5;
    vertical-align: middle;
}

.data-table tbody tr:last-child td {
    border-bottom: none;
}

.table-row:hover td {
    background: #fafcff;
}

.order-id {
    font-weight: 600;
    color: #888;
    font-size: 12px;
}

.customer-cell {
    display: flex;
    align-items: center;
    gap: 8px;
}

.customer-avatar {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: #e6f1fb;
    color: #3b8dd4;
    font-size: 11px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.date-cell {
    font-size: 11.5px !important;
    color: #aaa !important;
}

.amount {
    font-weight: 600;
    color: #c04828;
    font-size: 12.5px;
}

.empty-row {
    text-align: center;
    padding: 40px !important;
    color: #bbb;
    font-size: 13px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
}

/* Status badges */
.status-badge {
    font-size: 11px;
    padding: 4px 9px;
    border-radius: 5px;
    font-weight: 500;
    display: inline-block;
}

.badge--success {
    background: #eaf3de;
    color: #3b6d11;
}

.badge--warning {
    background: #faeeda;
    color: #854f0b;
}

.badge--info {
    background: #e6f1fb;
    color: #185fa5;
}

.badge--secondary {
    background: #f1f1f1;
    color: #666;
}

.badge--danger {
    background: #fcebeb;
    color: #a32d2d;
}

/* ===== SIDE PANEL ===== */
.side-panel {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.widget-card {
    background: #fff;
    border: 0.5px solid #e5e7eb;
    border-radius: 12px;
    overflow: hidden;
}

.widget-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 13px 16px;
    border-bottom: 0.5px solid #f0f0f0;
}

.widget-title {
    font-size: 13px;
    font-weight: 600;
    color: #1a1a2e;
    display: flex;
    align-items: center;
    gap: 6px;
}

.widget-count {
    font-size: 12px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 10px;
    background: #f1f1f1;
    color: #999;
}

.widget-count.has-items {
    background: #fff3e0;
    color: #854f0b;
}

.widget-body {
    padding: 14px 16px;
}

.widget-empty {
    font-size: 12.5px;
    color: #bbb;
    text-align: center;
    margin: 0;
}

.widget-action-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 9px 12px;
    background: #fff8f3;
    border: 0.5px solid #fcd9bf;
    border-radius: 8px;
    color: #c45320;
    font-size: 12.5px;
    font-weight: 500;
    text-decoration: none;
    transition: background 0.15s;
}

.widget-action-btn:hover {
    background: #fff0e6;
}

/* Quick stats grid */
.quick-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1px;
    background: #f0f0f0;
}

.quick-item {
    background: #fff;
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.quick-label {
    font-size: 11px;
    color: #aaa;
}

.quick-value {
    font-size: 18px;
    font-weight: 600;
}

.quick-value--green {
    color: #3b6d11;
}

.quick-value--blue {
    color: #185fa5;
}

.quick-value--amber {
    color: #854f0b;
}

.quick-value--red {
    color: #a32d2d;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 1024px) {
    .stat-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .content-grid {
        grid-template-columns: 1fr;
    }

    .side-panel {
        display: grid;
        grid-template-columns: 1fr 1fr;
    }
}

@media (max-width: 600px) {
    .stat-grid {
        grid-template-columns: 1fr;
    }

    .side-panel {
        grid-template-columns: 1fr;
    }

    .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
    }
}
</style>