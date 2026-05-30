<template>
    <div class="p-4">
        <h2 class="fw-bold mb-4"><i class="bi bi-bar-chart-fill me-2 text-primary"></i>Báo Cáo & Thống Kê</h2>

        <!-- THỐNG KÊ NHANH (QUICK STATS) -->
        <div class="row g-3 mb-4" v-if="quickStats">
            <div class="col-md-3">
                <div class="card shadow-sm border-0 border-start border-5 border-primary h-100 py-2">
                    <div class="card-body">
                        <div class="text-xs fw-bold text-primary text-uppercase mb-1">Doanh thu hôm nay</div>
                        <div class="h4 mb-0 fw-bold text-gray-800">{{ formatCurrency(quickStats.revenue_today) }}</div>
                        <small :class="quickStats.revenue_growth_pct >= 0 ? 'text-success' : 'text-danger'">
                            <i :class="quickStats.revenue_growth_pct >= 0 ? 'bi bi-arrow-up' : 'bi bi-arrow-down'"></i>
                            {{ Math.abs(quickStats.revenue_growth_pct || 0) }}% so với hôm qua
                        </small>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card shadow-sm border-0 border-start border-5 border-success h-100 py-2">
                    <div class="card-body">
                        <div class="text-xs fw-bold text-success text-uppercase mb-1">Số đơn hôm nay</div>
                        <div class="h4 mb-0 fw-bold text-gray-800">{{ quickStats.orders_today }} đơn</div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card shadow-sm border-0 border-start border-5 border-info h-100 py-2">
                    <div class="card-body">
                        <div class="text-xs fw-bold text-info text-uppercase mb-1">Hôm qua</div>
                        <div class="h4 mb-0 fw-bold text-gray-800">{{ formatCurrency(quickStats.revenue_yesterday) }}
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card shadow-sm border-0 border-start border-5 border-warning h-100 py-2">
                    <div class="card-body">
                        <div class="text-xs fw-bold text-warning text-uppercase mb-1">Doanh thu tháng này</div>
                        <div class="h4 mb-0 fw-bold text-gray-800">{{ formatCurrency(quickStats.revenue_month) }}</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- BỘ LỌC TÌM KIẾM -->
        <div class="card shadow-sm border-0 mb-4">
            <div class="card-body">
                <div class="row align-items-end g-3">
                    <div class="col-12 col-xl-5">
                        <label class="fw-bold text-muted mb-2">Tùy chọn nhanh:</label>
                        <div class="d-flex flex-wrap gap-2">
                            <button class="btn btn-outline-primary" @click="setQuickDate(1)">1 Tháng</button>
                            <button class="btn btn-outline-primary" @click="setQuickDate(3)">3 Tháng</button>
                            <button class="btn btn-outline-primary" @click="setQuickDate(6)">6 Tháng</button>
                            <button class="btn btn-outline-primary" @click="setQuickDate(12)">1 Năm</button>
                        </div>
                    </div>

                    <div class="col-12 col-md-5 col-xl-5">
                        <div class="row g-2">
                            <div class="col-4">
                                <label class="fw-bold text-muted mb-2">Từ ngày:</label>
                                <input type="date" v-model="startDate" class="form-control" :max="endDate">
                            </div>
                            <div class="col-4">
                                <label class="fw-bold text-muted mb-2">Đến ngày:</label>
                                <input type="date" v-model="endDate" class="form-control" :min="startDate">
                            </div>
                            <div class="col-4">
                                <label class="fw-bold text-muted mb-2">Nhóm theo:</label>
                                <select v-model="groupBy" class="form-select">
                                    <option value="day">Ngày</option>
                                    <option value="week">Tuần</option>
                                    <option value="month">Tháng</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="col-12 col-md-2 col-xl-2">
                        <button class="btn btn-success w-100 fw-bold" @click="fetchReport" :disabled="isLoading">
                            <i class="bi bi-search me-1"></i> {{ isLoading ? 'Đang tải...' : 'Thống kê' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- DOANH THU THEO KỲ -->
        <div v-if="reportData">
            <div class="row g-3 mb-4">
                <div class="col-md-4">
                    <div class="card border-0 shadow-sm bg-success text-white h-100 py-2">
                        <div class="card-body">
                            <div class="text-xs fw-bold text-uppercase mb-1">Tổng Doanh Thu (Theo kỳ)</div>
                            <div class="h3 mb-0 fw-bold">{{ formatCurrency(reportData.total_revenue) }}</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card border-0 shadow-sm bg-info text-white h-100 py-2">
                        <div class="card-body">
                            <div class="text-xs fw-bold text-uppercase mb-1">Tổng Đơn Hàng (Đã hoàn thành)</div>
                            <div class="h3 mb-0 fw-bold">{{ reportData.total_orders }} Đơn</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card border-0 shadow-sm bg-warning text-dark h-100 py-2">
                        <div class="card-body">
                            <div class="text-xs fw-bold text-uppercase mb-1">Trung bình mỗi đơn</div>
                            <div class="h3 mb-0 fw-bold">{{ formatCurrency(reportData.avg_per_order) }}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row mb-4">
                <div class="col-12">
                    <div class="card border-0 shadow-sm">
                        <div class="card-header bg-white pt-3 pb-2 border-0">
                            <h5 class="fw-bold text-muted mb-0">
                                <i class="bi bi-graph-up text-primary me-2"></i>
                                {{ chartTitle }}
                            </h5>
                        </div>
                        <div class="card-body">
                            <div style="height: 350px;">
                                <canvas id="revenueChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- THỐNG KÊ KHO -->
        <div v-if="inventoryData" class="row mb-4">
            <div class="col-md-8">
                <div class="card border-0 shadow-sm h-100">
                    <div
                        class="card-header bg-white pt-3 pb-2 border-0 d-flex justify-content-between align-items-center">
                        <h5 class="fw-bold text-muted mb-0">
                            <i class="bi bi-box-seam text-warning me-2"></i> Biểu đồ Xuất / Nhập Kho (Top 10)
                        </h5>
                        <div class="text-end">
                            <span class="badge bg-primary me-2">Tổng nhập: {{ formatCurrency(inventoryData.total_import)
                                }}</span>
                            <span class="badge bg-danger">Tổng xuất: {{ formatCurrency(inventoryData.total_export)
                                }}</span>
                        </div>
                    </div>
                    <div class="card-body">
                        <div style="height: 350px;">
                            <canvas id="inventoryChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card border-0 shadow-sm h-100">
                    <div class="card-header bg-white pt-3 pb-2 border-0">
                        <h5 class="fw-bold text-danger mb-0">
                            <i class="bi bi-exclamation-triangle-fill me-2"></i> Cảnh báo sắp hết
                        </h5>
                    </div>
                    <div class="card-body overflow-auto" style="max-height: 350px;">
                        <ul class="list-group list-group-flush" v-if="inventoryData.low_stock.length > 0">
                            <li class="list-group-item d-flex justify-content-between align-items-center"
                                v-for="(item, idx) in inventoryData.low_stock" :key="idx">
                                <div>
                                    <h6 class="mb-0 fw-bold">{{ item.ten_nguyen_lieu }}</h6>
                                    <small class="text-muted">Đơn vị: {{ item.don_vi }}</small>
                                </div>
                                <span class="badge bg-danger rounded-pill">Tồn: {{ item.ton_kho }}</span>
                            </li>
                        </ul>
                        <div v-else class="text-center text-muted mt-5">
                            <i class="bi bi-check-circle fs-1 text-success"></i>
                            <p class="mt-2">Kho hàng đang đầy đủ</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- BIỂU ĐỒ ĐẶT BÀN & MÓN BÁN CHẠY -->
        <div class="row mt-4">
            <div class="col-md-6" v-if="reservationData">
                <div class="card border-0 shadow-sm h-100">
                    <div class="card-header bg-white border-0 pt-3">
                        <h5 class="fw-bold text-muted mb-0">
                            <i class="bi bi-calendar-check text-primary me-2"></i> Thống kê trạng thái đặt bàn
                        </h5>
                    </div>
                    <div class="card-body">
                        <div style="height: 280px;">
                            <canvas id="reservationChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-md-6" v-if="menuData">
                <div class="card border-0 shadow-sm h-100">
                    <div class="card-header bg-white border-0 pt-3">
                        <h5 class="fw-bold text-muted mb-0">
                            <i class="bi bi-fire text-danger me-2"></i> Top món bán chạy
                        </h5>
                    </div>
                    <div class="card-body">
                        <div style="height: 280px;">
                            <canvas id="menuChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed } from 'vue';
import api from '@/services/api';
import Chart from 'chart.js/auto';
import zoomPlugin from 'chartjs-plugin-zoom';

Chart.register(zoomPlugin);

const startDate = ref('');
const endDate = ref('');
const groupBy = ref('day');
const isLoading = ref(false);

const quickStats = ref(null);
const reportData = ref(null);
const inventoryData = ref(null);
const reservationData = ref(null);
const menuData = ref(null);

let chartInstance = null;
let inventoryChartInstance = null;
let reservationChartInstance = null;
let menuChartInstance = null;

const formatCurrency = (val) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val ?? 0);

// ── Quick date ──────────────────────────────────────────
const setQuickDate = (monthsAgo) => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - monthsAgo);
    endDate.value = end.toISOString().split('T')[0];
    startDate.value = start.toISOString().split('T')[0];
    fetchReport();
};

// ── Fetch Quick Stats (Dùng cho Widget trên cùng) ───────
const fetchQuickStats = async () => {
    try {
        const res = await api.get('/admin/reports/quick-stats');
        if (res.data.success) {
            quickStats.value = res.data.data;
        }
    } catch (error) {
        console.error('Lỗi tải Quick Stats:', error);
    }
};

onMounted(() => {
    fetchQuickStats();
    setQuickDate(1);
});

// ── Chart title ─────────────────────────────────────────
const chartTitle = computed(() => {
    if (!startDate.value || !endDate.value) return 'Biểu đồ Doanh thu';
    const diffDays = Math.ceil(
        Math.abs(new Date(endDate.value) - new Date(startDate.value))
        / (1000 * 60 * 60 * 24)
    );
    if (diffDays <= 31) return 'Biểu đồ Doanh thu theo Ngày';
    if (diffDays <= 180) return 'Biểu đồ Doanh thu theo Tuần';
    return 'Biểu đồ Doanh thu theo Tháng';
});

// ── Render: Doanh thu ───────────────────────────────────
const renderChart = (chartDataList) => {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;
    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartDataList.map(i => i.date_label),
            datasets: [{
                label: 'Doanh thu',
                data: chartDataList.map(i => i.total_revenue),
                borderColor: '#198754',
                backgroundColor: 'rgba(25, 135, 84, 0.1)',
                borderWidth: 3,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#198754',
                pointBorderWidth: 2,
                pointRadius: 3,
                pointHoverRadius: 6,
                fill: true,
                tension: 0.3,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: v => v.toLocaleString('vi-VN') + ' đ' }
                }
            },
            plugins: {
                zoom: {
                    pan: { enabled: true, mode: 'x' },
                    zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' }
                },
                tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    padding: 12,
                    callbacks: {
                        label: (ctx) =>
                            'Doanh thu: ' + ctx.parsed.y.toLocaleString('vi-VN') + ' đ',
                        afterLabel: (ctx) => {
                            const d = chartDataList[ctx.dataIndex];
                            const out = [];
                            if (d.total_orders) out.push('Số đơn: ' + d.total_orders);
                            if (d.total_revenue && d.total_orders) {
                                const avg = Math.round(d.total_revenue / d.total_orders);
                                out.push('TB/Đơn: ' + avg.toLocaleString('vi-VN') + ' đ');
                            }
                            if (ctx.dataIndex > 0) {
                                const prev = chartDataList[ctx.dataIndex - 1].total_revenue;
                                if (prev > 0) {
                                    const pct = ((d.total_revenue - prev) / prev) * 100;
                                    const sign = pct > 0 ? '▲ Tăng' : '▼ Giảm';
                                    out.push(`${sign}: ${Math.abs(pct).toFixed(1)}% so với kỳ trước`);
                                }
                            }
                            return out;
                        }
                    }
                }
            }
        }
    });
};

// ── Render: Kho ─────────────────────────────────────────
const renderInventoryChart = (labels, imports, exports) => {
    const ctx = document.getElementById('inventoryChart');
    if (!ctx) return;
    if (inventoryChartInstance) inventoryChartInstance.destroy();

    inventoryChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: 'Nhập kho',
                    data: imports,
                    backgroundColor: 'rgba(54, 162, 235, 0.8)',
                    borderRadius: 4,
                },
                {
                    label: 'Xuất kho',
                    data: exports,
                    backgroundColor: 'rgba(255, 99, 132, 0.8)',
                    borderRadius: 4,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: v => v.toLocaleString('vi-VN') + ' đ' }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (ctx) =>
                            ctx.dataset.label + ': ' + ctx.parsed.y.toLocaleString('vi-VN') + ' đ'
                    }
                }
            }
        }
    });
};

// ── Render: Đặt bàn ─────────────────────────────────────
const renderReservationChart = (data) => {
    const ctx = document.getElementById('reservationChart');
    if (!ctx || !data?.by_status?.length) return;
    if (reservationChartInstance) reservationChartInstance.destroy();

    const statusLabel = {
        pending: 'Chờ xác nhận',
        confirmed: 'Đã xác nhận',
        cancelled: 'Đã hủy',
        completed: 'Hoàn thành',
    };

    reservationChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            // SỬA Ở ĐÂY: Dùng s.trang_thai thay vì s.status
            labels: data.by_status.map(s => statusLabel[s.trang_thai] ?? s.trang_thai),
            datasets: [{
                // SỬA Ở ĐÂY: Dùng s.so_luot thay vì s.total
                data: data.by_status.map(s => s.so_luot),
                backgroundColor: ['#ffc107', '#0dcaf0', '#dc3545', '#198754'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right' },
                tooltip: {
                    callbacks: {
                        label: (ctx) => ` ${ctx.label}: ${ctx.parsed} lượt`
                    }
                }
            }
        }
    });
};

// ── Render: Món bán chạy ────────────────────────────────
const renderMenuChart = (items) => {
    const ctx = document.getElementById('menuChart');
    if (!ctx || !items?.length) return;
    if (menuChartInstance) menuChartInstance.destroy();

    menuChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            // Đã lấy đúng i.ten_mon
            labels: items.map(i => i.ten_mon),
            datasets: [{
                label: 'Số lượng bán',
                
                data: items.map(i => Number(i.tong_so_luong)),
                backgroundColor: 'rgba(253, 126, 20, 0.8)',
                borderRadius: 4,
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (ctx) => ` ${ctx.parsed.x} phần`
                    }
                }
            }
        }
    });
};

// ── Fetch báo cáo chi tiết ───────────────────────────────
const fetchReport = async () => {
    if (!startDate.value || !endDate.value) {
        alert('Vui lòng chọn đầy đủ ngày bắt đầu và kết thúc!');
        return;
    }

    try {
        isLoading.value = true;

        const params = {
            start_date: startDate.value,
            end_date: endDate.value,
            group_by: groupBy.value,
        };

        const [revenueRes, inventoryRes, reservationRes, menuRes] = await Promise.all([
            api.get('/admin/reports/revenue', { params }),
            api.get('/admin/reports/inventory', { params }),
            api.get('/admin/reports/reservation', { params }),
            api.get('/admin/reports/menu', { params }),
        ]);

        if (revenueRes.data.success) {
            reportData.value = revenueRes.data.data;
            nextTick(() => {
                if (reportData.value.chart_data?.length > 0)
                    renderChart(reportData.value.chart_data);
                else if (chartInstance) chartInstance.destroy();
            });
        }

        if (inventoryRes.data.success) {
            inventoryData.value = inventoryRes.data.data;
            nextTick(() => {
                const { labels, imports, exports } = inventoryData.value;
                if (labels?.length > 0)
                    renderInventoryChart(labels, imports, exports);
                else if (inventoryChartInstance) inventoryChartInstance.destroy();
            });
        }

        if (reservationRes.data.success) {
            reservationData.value = reservationRes.data.data;
            nextTick(() => renderReservationChart(reservationData.value));
        }

        if (menuRes.data.success) {
            menuData.value = menuRes.data.data;
            nextTick(() => renderMenuChart(menuData.value.top_items));
        }

    } catch (error) {
        console.error('Lỗi lấy báo cáo:', error.response?.data || error.message);
    } finally {
        isLoading.value = false;
    }
};
</script>