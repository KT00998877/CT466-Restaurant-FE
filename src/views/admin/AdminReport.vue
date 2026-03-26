<template>
    <div class="p-4">
        <h2 class="fw-bold mb-4"><i class="bi bi-bar-chart-fill me-2 text-primary"></i>Báo Cáo Doanh Thu</h2>

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
                            <div class="col-6">
                                <label class="fw-bold text-muted mb-2">Từ ngày:</label>
                                <input type="date" v-model="startDate" class="form-control" :max="endDate">
                            </div>
                            <div class="col-6">
                                <label class="fw-bold text-muted mb-2">Đến ngày:</label>
                                <input type="date" v-model="endDate" class="form-control" :min="startDate">
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

            <div class="row">
                <div class="col-12">
                    <div class="card border-0 shadow-sm">
                        <div class="card-header bg-white pt-3 pb-2 border-0">
                            <div class="card-header bg-white pt-3 pb-2 border-0">
                                <h5 class="fw-bold text-muted mb-0">
                                    <i class="bi bi-graph-up text-primary me-2"></i>
                                    {{ chartTitle }}
                                </h5>
                            </div>
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

    </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed } from 'vue';
import api from '@/services/api';
import Chart from 'chart.js/auto'; // Import thư viện vẽ biểu đồ

const startDate = ref('');
const endDate = ref('');
const isLoading = ref(false);
const reportData = ref(null);
let chartInstance = null; // Biến lưu trữ biểu đồ để xóa đi vẽ lại khi đổi ngày

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

// --- TỰ ĐỘNG ĐỔI TÊN BIỂU ĐỒ ---
const chartTitle = computed(() => {
    // Nếu chưa chọn ngày thì hiện mặc định
    if (!startDate.value || !endDate.value) {
        return 'Biểu đồ Doanh thu';
    }

    // Tính toán khoảng cách giữa 2 ngày đang chọn
    const start = new Date(startDate.value);
    const end = new Date(endDate.value);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Khớp với logic Backend: <= 31 ngày thì là "theo ngày", ngược lại là "theo tháng"
    if (diffDays <= 31) {
        return 'Biểu đồ Doanh thu theo ngày';
    } else {
        return 'Biểu đồ Doanh thu theo tháng';
    }
});

// --- HÀM VẼ BIỂU ĐỒ ---
const renderChart = (chartDataList) => {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;

    if (chartInstance) {
        chartInstance.destroy(); // Hủy hình cũ
    }

    // XỬ LÝ NHÃN (LABEL) THÔNG MINH
    const labels = chartDataList.map(item => {
        // Nếu chuỗi trả về chỉ có 7 ký tự (VD: "2026-03") -> Vẽ theo tháng
        if (item.date_label.length === 7) {
            const [year, month] = item.date_label.split('-');
            return `Tháng ${month}/${year}`;
        }
        // Nếu trả về đủ ngày (VD: "2026-03-24") -> Vẽ theo ngày
        else {
            const d = new Date(item.date_label);
            return `${d.getDate()}/${d.getMonth() + 1}`;
        }
    });

    // Lấy mảng doanh thu tương ứng
    const revenues = chartDataList.map(item => item.total_revenue);
    // Cấu hình vẽ Biểu đồ đường (Line Chart)
    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Doanh thu (VNĐ)',
                data: revenues,
                borderColor: '#198754', // Màu viền xanh lá
                backgroundColor: 'rgba(25, 135, 84, 0.1)', // Màu nền mờ
                borderWidth: 3,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#198754',
                pointBorderWidth: 2,
                pointRadius: 4,
                fill: true,
                tension: 0.3 // Làm cong nét vẽ cho mềm mại
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            return value.toLocaleString('vi-VN') + ' đ'; // Thêm chữ đ vào trục dọc
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return 'Doanh thu: ' + context.parsed.y.toLocaleString('vi-VN') + ' đ';
                        }
                    }
                }
            }
        }
    });
};

const fetchReport = async () => {
    if (!startDate.value || !endDate.value) {
        alert("Vui lòng chọn đầy đủ ngày bắt đầu và kết thúc!");
        return;
    }

    try {
        isLoading.value = true;
        const res = await api.get('/admin/reports/revenue', {
            params: {
                start_date: startDate.value,
                end_date: endDate.value
            }
        });

        if (res.data.success) {
            reportData.value = res.data.data;

            // Đợi Vue render xong HTML rồi mới tiến hành vẽ biểu đồ lên canvas
            nextTick(() => {
                if (reportData.value.chart_data && reportData.value.chart_data.length > 0) {
                    renderChart(reportData.value.chart_data);
                } else {
                    // Nếu ngày đó không có đơn hàng, xóa biểu đồ cũ đi
                    if (chartInstance) chartInstance.destroy();
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