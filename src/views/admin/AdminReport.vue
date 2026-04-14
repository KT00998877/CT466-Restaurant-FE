<template>
    <div class="p-4">
        <h2 class="fw-bold mb-4"><i class="bi bi-bar-chart-fill me-2 text-primary"></i>Báo Cáo & Thống Kê</h2>

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

        <div v-if="reportData">
            <div class="row g-3 mb-4">
                <div class="col-md-6">
                    <div class="card border-0 shadow-sm border-start border-5 border-success h-100 py-2">
                        <div class="card-body">
                            <div class="text-xs fw-bold text-success text-uppercase mb-1">Tổng Doanh Thu</div>
                            <div class="h3 mb-0 fw-bold text-gray-800">{{ formatCurrency(reportData.total_revenue) }}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card border-0 shadow-sm border-start border-5 border-info h-100 py-2">
                        <div class="card-body">
                            <div class="text-xs fw-bold text-info text-uppercase mb-1">Tổng Số Đơn Hàng (Đã hoàn thành)
                            </div>
                            <div class="h3 mb-0 fw-bold text-gray-800">{{ reportData.total_orders }} Đơn</div>
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

        <div v-if="inventoryData" class="row">
            <div class="col-12">
                <div class="card border-0 shadow-sm">
                    <div class="card-header bg-white pt-3 pb-2 border-0">
                        <h5 class="fw-bold text-muted mb-0">
                            <i class="bi bi-box-seam text-warning me-2"></i>
                            Biểu đồ Xuất / Nhập Kho
                        </h5>
                    </div>
                    <div class="card-body">
                        <div style="height: 350px;">
                            <canvas id="inventoryChart"></canvas>
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


// 2. Đăng ký plugin với Chart.js
Chart.register(zoomPlugin);

const startDate = ref('');
const endDate = ref('');
// 3. Thêm state lưu loại thống kê (Mặc định là 'day')
const groupBy = ref('day'); 
const isLoading = ref(false);

// State cho Doanh thu
const reportData = ref(null);
let chartInstance = null;

// State cho Kho (Thêm mới)
const inventoryData = ref(null);
let inventoryChartInstance = null;

const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

const setQuickDate = (monthsAgo) => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - monthsAgo);

    endDate.value = end.toISOString().split('T')[0];
    startDate.value = start.toISOString().split('T')[0];

    fetchReport();
};

onMounted(() => {
    setQuickDate(1);
});

// --- TIÊU ĐỀ BIỂU ĐỒ DOANH THU ---
const chartTitle = computed(() => {
    if (!startDate.value || !endDate.value) {
        return 'Biểu đồ Doanh thu';
    }
    const start = new Date(startDate.value);
    const end = new Date(endDate.value);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 31) {
        return 'Biểu đồ Doanh thu theo ngày';
    } else {
        return 'Biểu đồ Doanh thu theo tháng';
    }
});

// --- HÀM VẼ BIỂU ĐỒ DOANH THU ĐÃ CẢI TIẾN ---
const renderChart = (chartDataList) => {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;

    if (chartInstance) {
        chartInstance.destroy();
    }

    const labels = chartDataList.map(item => item.date_label);
    const revenues = chartDataList.map(item => item.total_revenue);

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Doanh thu',
                data: revenues,
                borderColor: '#198754',
                backgroundColor: 'rgba(25, 135, 84, 0.1)',
                borderWidth: 3,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#198754',
                pointBorderWidth: 2,
                pointRadius: 3,
                pointHoverRadius: 6, // To lên khi di chuột
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false, // Hiển thị tooltip ngay cả khi không trỏ chính xác vào điểm
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            return value.toLocaleString('vi-VN') + ' đ';
                        }
                    }
                }
            },
            plugins: {
                // --- CẤU HÌNH TÍNH NĂNG ZOOM & PAN ---
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'x', // Chỉ cho phép kéo qua lại theo trục ngang
                    },
                    zoom: {
                        wheel: { enabled: true }, // Lăn chuột để zoom
                        pinch: { enabled: true }, // Dùng 2 ngón tay trên mobile
                        mode: 'x', // Chỉ zoom trục ngang
                    }
                },
                // --- CẤU HÌNH TOOLTIP CHI TIẾT ---
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    callbacks: {
                        label: function (context) {
                            return 'Doanh thu: ' + context.parsed.y.toLocaleString('vi-VN') + ' đ';
                        },
                        // Thêm thông tin bổ trợ phía dưới doanh thu
                        afterLabel: function (context) {
                            const dataIndex = context.dataIndex;
                            const originalData = chartDataList[dataIndex]; // Lấy object dữ liệu gốc từ API
                            let details = [];

                            // Backend cần trả về các trường này trong chart_data
                            if (originalData.total_orders !== undefined) {
                                details.push('Số đơn hàng: ' + originalData.total_orders);
                            }

                            // Tính giá trị trung bình đơn nếu có số liệu
                            if (originalData.total_revenue && originalData.total_orders) {
                                const avg = Math.round(originalData.total_revenue / originalData.total_orders);
                                details.push('TB / Đơn: ' + avg.toLocaleString('vi-VN') + ' đ');
                            }

                            // Tính % tăng/giảm so với mốc trước đó (tính trực tiếp trên client)
                            if (dataIndex > 0) {
                                const prevRevenue = chartDataList[dataIndex - 1].total_revenue;
                                const currentRevenue = originalData.total_revenue;
                                if (prevRevenue > 0) {
                                    const percent = ((currentRevenue - prevRevenue) / prevRevenue) * 100;
                                    const sign = percent > 0 ? '▲ Tăng' : '▼ Giảm';
                                    details.push(`${sign}: ${Math.abs(percent).toFixed(1)}% so với kỳ trước`);
                                }
                            }

                            return details;
                        }
                    }
                }
            }
        }
    });
};

// --- HÀM VẼ BIỂU ĐỒ XUẤT NHẬP KHO (THÊM MỚI) ---
const renderInventoryChart = (labels, imports, exports) => {
    const ctx = document.getElementById('inventoryChart');
    if (!ctx) return;

    if (inventoryChartInstance) {
        inventoryChartInstance.destroy();
    }

    inventoryChartInstance = new Chart(ctx, {
        type: 'bar', // Dùng biểu đồ cột
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Nhập kho',
                    data: imports,
                    backgroundColor: 'rgba(54, 162, 235, 0.7)', // Màu xanh dương
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                    borderRadius: 4
                },
                {
                    label: 'Xuất kho',
                    data: exports,
                    backgroundColor: 'rgba(255, 99, 132, 0.7)', // Màu đỏ/hồng
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1,
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            // Cập nhật trục Y thêm chữ đ
                            return value.toLocaleString('vi-VN') + ' đ';
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            // Thay đổi chữ 'đơn vị' thành chữ 'đ'
                            return context.dataset.label + ': ' + context.parsed.y.toLocaleString('vi-VN') + ' đ';
                        }
                    }
                }
            }
        }
    });
};

// --- HÀM GỌI API CHUNG ---
const fetchReport = async () => {
    if (!startDate.value || !endDate.value) {
        alert("Vui lòng chọn đầy đủ ngày bắt đầu và kết thúc!");
        return;
    }

    try {
        isLoading.value = true;

        // Gọi API song song bằng Promise.all để tăng tốc độ tải
        const params = {
            start_date: startDate.value,
            end_date: endDate.value,
            group_by: groupBy.value // 'day', 'week', hoặc 'month'
        };

        const [revenueRes, inventoryRes] = await Promise.all([
            api.get('/admin/reports/revenue', { params }),
            api.get('/admin/reports/inventory', { params })
        ]);

        // 1. Xử lý dữ liệu Doanh thu
        if (revenueRes.data.success) {
            reportData.value = revenueRes.data.data;
            nextTick(() => {
                if (reportData.value.chart_data && reportData.value.chart_data.length > 0) {
                    renderChart(reportData.value.chart_data);
                } else {
                    if (chartInstance) chartInstance.destroy();
                }
            });
        }

        // 2. Xử lý dữ liệu Kho
        if (inventoryRes.data.success) {
            inventoryData.value = inventoryRes.data.data;
            nextTick(() => {
                const { labels, imports, exports } = inventoryData.value;
                if (labels && labels.length > 0) {
                    renderInventoryChart(labels, imports, exports);
                } else {
                    if (inventoryChartInstance) inventoryChartInstance.destroy();
                }
            });
        }

    } catch (error) {
        console.error("Lỗi lấy báo cáo:", error);
    } finally {
        isLoading.value = false;
    }
};
</script>