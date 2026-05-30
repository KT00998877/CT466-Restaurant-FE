<template>
    <div class="warehouse-report">
        <!-- Tabs Navigation -->
        <div class="report-tabs mb-4">
            <div class="btn-group" role="group">
                <input type="radio" class="btn-check" name="report-tab" id="tab-create" value="create" v-model="activeTab">
                <label class="btn btn-outline-primary fw-bold" for="tab-create">
                    <i class="bi bi-plus-circle me-2"></i>Tạo Báo Cáo
                </label>

                <input type="radio" class="btn-check" name="report-tab" id="tab-history" value="history" v-model="activeTab">
                <label class="btn btn-outline-primary fw-bold" for="tab-history">
                    <i class="bi bi-clock-history me-2"></i>Báo Cáo Đã Lưu
                </label>
            </div>
        </div>

        <!-- TAB 1: Tạo báo cáo -->
        <div v-if="activeTab === 'create'">
            <div class="report-header mb-4">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <div>
                        <h2 class="fw-bold text-dark mb-1">
                            <i class="bi bi-file-earmark-text me-2"></i>Tạo Báo Cáo Mới
                        </h2>
                        <p class="text-muted small">Ghi nhập xuất kho hằng ngày và kiểm tra tồn kho tự động</p>
                    </div>
                    <button class="btn btn-primary fw-bold" @click="showNewReportModal = true" v-if="!currentReport">
                        <i class="bi bi-plus-circle me-2"></i>Tạo Báo Cáo Mới
                    </button>
                </div>

                <!-- Info báo cáo hiện tại -->
                <div v-if="currentReport" class="alert alert-info border-0">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <strong>Báo cáo ngày:</strong> {{ formatDate(currentReport.report_date) }}
                            <span class="badge ms-2" :class="currentReport.status === 'draft' ? 'bg-warning' : 'bg-success'">
                                {{ currentReport.status === 'draft' ? 'NHÁP' : 'ĐÃ LƯU' }}
                            </span>
                        </div>
                        <div v-if="currentReport.status === 'draft'" class="gap-2 d-flex">
                            <button class="btn btn-sm btn-success" @click="saveReport" :disabled="isSaving">
                                <i class="bi bi-check2-circle me-1"></i>{{ isSaving ? 'Đang lưu...' : 'Lưu Báo Cáo' }}
                            </button>
                            <button class="btn btn-sm btn-outline-danger" @click="deleteReport">
                                <i class="bi bi-trash me-1"></i>Xóa
                            </button>
                        </div>
                        <div v-else class="gap-2 d-flex">
                            <button class="btn btn-sm btn-outline-primary" @click="createNewReportClean">
                                <i class="bi bi-plus-circle me-1"></i>Báo Cáo Mới
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Bảng báo cáo -->
            <div class="card border-0 shadow-sm">
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-bordered mb-0 align-middle text-center">
                            <thead class="table-dark sticky-top">
                                <tr>
                                    <th class="text-start" style="min-width: 180px;">Nguyên Liệu</th>
                                    <th style="min-width: 80px;">Đơn Vị</th>
                                    <th style="min-width: 100px;">Tồn Đầu</th>
                                    <th style="min-width: 100px;" class="bg-success">Nhập</th>
                                    <th style="min-width: 100px;" class="bg-danger">Xuất</th>
                                    <th style="min-width: 100px;" class="bg-primary">Tồn Cuối</th>
                                    <th style="min-width: 120px;">Ghi Chú</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="item in reportItems" :key="item.ingredient_id">
                                    <td class="text-start fw-bold text-primary">{{ item.ingredient_name }}</td>
                                    <td class="text-muted small">{{ item.unit }}</td>
                                    <td class="bg-light fw-bold">{{ item.opening_stock }}</td>
                                    <td class="bg-light-success">
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            v-model.number="item.import_quantity"
                                            @input="calculateClosingStock(item)"
                                            class="form-control form-control-sm text-center"
                                            :disabled="!canEdit"
                                            placeholder="0">
                                    </td>
                                    <td class="bg-light-danger">
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            v-model.number="item.export_quantity"
                                            @input="calculateClosingStock(item)"
                                            class="form-control form-control-sm text-center"
                                            :disabled="!canEdit"
                                            placeholder="0">
                                    </td>
                                    <td class="bg-primary text-white fw-bold">
                                        {{ item.closing_stock }}
                                    </td>
                                    <td>
                                        <input
                                            type="text"
                                            v-model="item.note"
                                            class="form-control form-control-sm"
                                            :disabled="!canEdit"
                                            placeholder="Ghi chú...">
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div v-if="reportItems.length === 0" class="text-center text-muted p-5">
                        <p>Chọn ngày để tạo báo cáo</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- TAB 2: Xem báo cáo đã lưu -->
        <div v-if="activeTab === 'history'">
            <div class="report-header mb-4">
                <h2 class="fw-bold text-dark">
                    <i class="bi bi-archive me-2"></i>Báo Cáo Đã Lưu
                </h2>
                <p class="text-muted small">Danh sách tất cả báo cáo nhập/xuất kho</p>
            </div>

            <!-- Loading -->
            <div v-if="isLoadingReports" class="text-center py-5">
                <div class="spinner-border text-primary"></div>
            </div>

            <!-- Danh sách báo cáo -->
            <div v-else-if="savedReports.length > 0" class="row g-3">
                <div v-for="report in savedReports" :key="report.id" class="col-md-6 col-lg-4">
                    <div class="card border-0 shadow-sm h-100 report-card">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <div>
                                    <h6 class="fw-bold text-dark mb-1">
                                        {{ formatDate(report.report_date) }}
                                    </h6>
                                    <small class="text-muted">
                                        {{ formatTime(report.created_at) }}
                                    </small>
                                </div>
                                <span class="badge bg-success">ĐÃ LƯU</span>
                            </div>

                            <div class="small text-muted mb-3">
                                <div>Tạo bởi: {{ report.creator?.name || 'Admin' }}</div>
                            </div>

                            <button class="btn btn-sm btn-primary w-100" @click="viewReportDetail(report.id)">
                                <i class="bi bi-eye me-1"></i>Xem Chi Tiết
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Empty State -->
            <div v-else class="text-center py-5">
                <i class="bi bi-inbox" style="font-size: 3rem; opacity: 0.3;"></i>
                <p class="text-muted mt-3">Chưa có báo cáo nào được lưu</p>
            </div>

            <!-- Pagination -->
            <nav v-if="totalPages > 1" class="mt-4">
                <ul class="pagination justify-content-center">
                    <li class="page-item" :class="{ disabled: currentPage === 1 }">
                        <button class="page-link" @click="loadReports(currentPage - 1)">Previous</button>
                    </li>
                    <li v-for="page in totalPages" :key="page" class="page-item" :class="{ active: page === currentPage }">
                        <button class="page-link" @click="loadReports(page)">{{ page }}</button>
                    </li>
                    <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                        <button class="page-link" @click="loadReports(currentPage + 1)">Next</button>
                    </li>
                </ul>
            </nav>
        </div>

        <!-- Modal tạo báo cáo mới -->
        <div v-if="showNewReportModal" class="modal-overlay" @click.self="showNewReportModal = false">
            <div class="modal-content" style="max-width: 400px;">
                <div class="modal-header d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom">
                    <h5 class="mb-0 fw-bold">Tạo Báo Cáo Mới</h5>
                    <button class="btn-close" @click="showNewReportModal = false"></button>
                </div>

                <form @submit.prevent="createNewReport">
                    <div class="mb-3">
                        <label class="form-label fw-bold text-dark">Chọn Ngày Báo Cáo</label>
                        <input
                            type="date"
                            v-model="newReportDate"
                            class="form-control form-control-lg"
                            required>
                    </div>

                    <div class="d-flex gap-2 justify-content-end">
                        <button type="button" class="btn btn-light border fw-bold" @click="showNewReportModal = false">
                            Hủy
                        </button>
                        <button type="submit" class="btn btn-primary fw-bold">
                            <i class="bi bi-plus-circle me-1"></i>Tạo Báo Cáo
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Modal xem chi tiết báo cáo -->
        <div v-if="showDetailModal" class="modal-overlay" @click.self="showDetailModal = false">
            <div class="modal-content modal-lg">
                <div class="modal-header d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom">
                    <h5 class="mb-0 fw-bold">
                        <i class="bi bi-file-earmark-text me-2"></i>Báo Cáo Ngày {{ formatDate(selectedReportDetail?.report_date) }}
                    </h5>
                    <button class="btn-close" @click="showDetailModal = false"></button>
                </div>

                <div v-if="isLoadingDetail" class="text-center py-5">
                    <div class="spinner-border text-primary"></div>
                </div>

                <div v-else>
                    <div class="table-responsive mb-3">
                        <table class="table table-sm table-bordered align-middle text-center">
                            <thead class="table-light">
                                <tr>
                                    <th class="text-start">Nguyên Liệu</th>
                                    <th>Đơn Vị</th>
                                    <th class="bg-light">Tồn Đầu</th>
                                    <th class="bg-success">Nhập</th>
                                    <th class="bg-danger">Xuất</th>
                                    <th class="bg-primary">Tồn Cuối</th>
                                    <th>Ghi Chú</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="item in detailItems" :key="item.ingredient_id">
                                    <td class="text-start fw-bold text-primary">{{ item.ingredient_name }}</td>
                                    <td>{{ item.unit }}</td>
                                    <td class="bg-light">{{ item.opening_stock }}</td>
                                    <td class="bg-light-success">{{ item.import_quantity }}</td>
                                    <td class="bg-light-danger">{{ item.export_quantity }}</td>
                                    <td class="bg-primary text-white fw-bold">{{ item.closing_stock }}</td>
                                    <td class="small">{{ item.note || '-' }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div class="d-flex gap-2 justify-content-end">
                        <button class="btn btn-sm btn-outline-secondary" @click="printReport">
                            <i class="bi bi-printer me-1"></i>In
                        </button>
                        <button class="btn btn-sm btn-outline-info" @click="exportToExcel">
                            <i class="bi bi-download me-1"></i>Export Excel
                        </button>
                        <button class="btn btn-sm btn-light border" @click="showDetailModal = false">
                            Đóng
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import api from '@/services/api';

const activeTab = ref('create');
const currentReport = ref(null);
const reportItems = ref([]);
const showNewReportModal = ref(false);
const newReportDate = ref(new Date().toISOString().split('T')[0]);
const isSaving = ref(false);

// Tab history
const savedReports = ref([]);
const isLoadingReports = ref(false);
const currentPage = ref(1);
const totalPages = ref(1);

// Detail modal
const showDetailModal = ref(false);
const selectedReportDetail = ref(null);
const detailItems = ref([]);
const isLoadingDetail = ref(false);

const canEdit = computed(() => currentReport.value && currentReport.value.status === 'draft');

const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
};

const formatTime = (timeStr) => {
    return new Date(timeStr).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const fetchIngredients = async () => {
    try {
        const res = await api.get('/admin/ingredients');
        if (res.data.success) {
            return res.data.data;
        }
    } catch (error) {
        console.error("Lỗi tải nguyên liệu:", error);
        return [];
    }
};

const calculateClosingStock = (item) => {
    const opening = parseFloat(item.opening_stock) || 0;
    const imported = parseFloat(item.import_quantity) || 0;
    const exported = parseFloat(item.export_quantity) || 0;
    item.closing_stock = opening + imported - exported;
};

const createNewReport = async () => {
    try {
        const ingredients = await fetchIngredients();

        if (ingredients.length === 0) {
            alert('Không có nguyên liệu nào');
            return;
        }

        currentReport.value = {
            id: null,
            report_date: newReportDate.value,
            status: 'draft',
            created_at: new Date().toISOString()
        };

        reportItems.value = ingredients.map(ing => ({
            ingredient_id: ing.id,
            ingredient_name: ing.name,
            unit: ing.unit,
            opening_stock: ing.stock_quantity,
            import_quantity: 0,
            export_quantity: 0,
            closing_stock: ing.stock_quantity,
            note: ''
        }));

        showNewReportModal.value = false;
    } catch (error) {
        alert('Lỗi tạo báo cáo');
    }
};

const createNewReportClean = () => {
    currentReport.value = null;
    reportItems.value = [];
    newReportDate.value = new Date().toISOString().split('T')[0];
    showNewReportModal.value = true;
};

const saveReport = async () => {
    if (!currentReport.value) return;

    for (const item of reportItems.value) {
        if (item.closing_stock < 0) {
            alert(`${item.ingredient_name}: Tồn cuối không thể âm!`);
            return;
        }
    }

    try {
        isSaving.value = true;

        const payload = {
            report_date: currentReport.value.report_date,
            items: reportItems.value.map(item => ({
                ingredient_id: item.ingredient_id,
                opening_stock: parseFloat(item.opening_stock),
                import_quantity: parseFloat(item.import_quantity) || 0,
                export_quantity: parseFloat(item.export_quantity) || 0,
                closing_stock: parseFloat(item.closing_stock),
                note: item.note
            }))
        };

        const res = await api.post('/admin/warehouse-reports', payload);

        if (res.data.success) {
            alert('Lưu báo cáo thành công!');
            currentReport.value.status = 'saved';
            currentReport.value.id = res.data.data.id;
        }
    } catch (error) {
        alert(error.response?.data?.message || 'Lỗi lưu báo cáo');
    } finally {
        isSaving.value = false;
    }
};

const deleteReport = async () => {
    if (!confirm('Bạn chắc chắn muốn xóa báo cáo này?')) return;

    try {
        await api.delete(`/admin/warehouse-reports/${currentReport.value.id}`);
        alert('Xóa báo cáo thành công!');
        currentReport.value = null;
        reportItems.value = [];
    } catch (error) {
        alert('Lỗi xóa báo cáo');
    }
};

const loadReports = async (page = 1) => {
    isLoadingReports.value = true;
    try {
        const res = await api.get(`/admin/warehouse-reports?page=${page}`);
        if (res.data.success) {
            savedReports.value = res.data.data.data;
            currentPage.value = page;
            totalPages.value = res.data.data.last_page;
        }
    } catch (error) {
        console.error("Lỗi tải báo cáo:", error);
    } finally {
        isLoadingReports.value = false;
    }
};

const viewReportDetail = async (reportId) => {
    isLoadingDetail.value = true;
    try {
        const res = await api.get(`/admin/warehouse-reports/${reportId}`);
        if (res.data.success) {
            selectedReportDetail.value = res.data.data.report;
            detailItems.value = res.data.data.items;
            showDetailModal.value = true;
        }
    } catch (error) {
        alert('Lỗi tải chi tiết báo cáo');
    } finally {
        isLoadingDetail.value = false;
    }
};

const printReport = () => {
    window.print();
};

const exportToExcel = () => {
    const rows = [];
    const reportDate = formatDate(selectedReportDetail.value.report_date);

    rows.push(['Báo Cáo Nhập/Xuất Kho', reportDate]);
    rows.push([]);
    rows.push(['Nguyên Liệu', 'Đơn Vị', 'Tồn Đầu', 'Nhập', 'Xuất', 'Tồn Cuối', 'Ghi Chú']);

    detailItems.value.forEach(item => {
        rows.push([
            item.ingredient_name,
            item.unit,
            item.opening_stock,
            item.import_quantity,
            item.export_quantity,
            item.closing_stock,
            item.note || ''
        ]);
    });

    let csv = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `bao-cao-kho-${reportDate}.csv`;
    link.click();
};

const fetchLatestReport = async () => {
    try {
        const res = await api.get('/admin/warehouse-reports/latest');
        if (res.data.success && res.data.data) {
            currentReport.value = res.data.data.report;
            reportItems.value = res.data.data.items;
        }
    } catch (error) {
        // Silent - chưa có báo cáo
    }
};

onMounted(() => {
    fetchLatestReport();
    loadReports();
});
</script>

<style scoped>
.warehouse-report {
    padding: 0;
}

.report-tabs {
    display: flex;
    gap: 10px;
}

.report-header {
    border-bottom: 2px solid #f0f0f0;
    padding-bottom: 1rem;
}

.bg-light-success {
    background-color: rgba(25, 135, 84, 0.1);
}

.bg-light-danger {
    background-color: rgba(220, 53, 69, 0.1);
}

.report-card {
    transition: transform 0.2s, box-shadow 0.2s;
    cursor: pointer;
}

.report-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15) !important;
}

.table-responsive {
    max-height: calc(100vh - 400px);
    overflow-y: auto;
}

.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1050;
    backdrop-filter: blur(3px);
}

.modal-content {
    background: white;
    width: 90%;
    padding: 25px;
    border-radius: 12px;
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
    animation: slideIn 0.3s ease-out;
    max-height: 90vh;
    overflow-y: auto;
}

.modal-lg {
    max-width: 900px;
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(-50px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

input[type="number"]:disabled,
input[type="text"]:disabled {
    background-color: #e9ecef;
    cursor: not-allowed;
}

.modal-header {
    padding-bottom: 1rem;
}

.btn-close {
    padding: 0;
    opacity: 0.5;
    transition: opacity 0.2s;
}

.btn-close:hover {
    opacity: 1;
}

.page-link {
    cursor: pointer;
}

@media print {
    .modal-header,
    .d-flex.gap-2.justify-content-end,
    .btn-group,
    .report-header {
        display: none !important;
    }

    .table {
        font-size: 12px;
    }
}
</style>
