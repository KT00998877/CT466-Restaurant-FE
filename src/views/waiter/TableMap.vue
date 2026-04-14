<template>
    <div class="table-map-container">
        <div class="zone-filters mb-4">
            <button v-for="zone in zones" :key="zone.id" class="btn rounded-pill px-4 me-2 mb-2"
                :class="currentZone === zone.id ? 'btn-primary shadow-sm' : 'btn-outline-secondary bg-white'"
                @click="currentZone = zone.id">
                {{ zone.name }}
            </button>
        </div>

        <div class="status-legend mb-4 d-flex flex-wrap gap-3">
            <div class="legend-item"><span class="status-dot available"></span> Trống</div>
            <div class="legend-item"><span class="status-dot occupied"></span> Đang phục vụ</div>
            <!-- <div class="legend-item"><span class="status-dot reserved"></span> Đã đặt trước</div>
            <div class="legend-item"><span class="status-dot cleaning"></span> Đang dọn</div> -->
        </div>

        <div class="tables-grid">
            <div v-for="table in filteredTables" :key="table.id" class="table-card" :class="table.status"
                @click="handleTableClick(table)">

                <div v-if="table.isRequestingCheckout" class="checkout-alert">
                    <i class="bi bi-bell-fill text-danger animate-ring"></i>
                </div>

                <div class="table-header">
                    <h5 class="table-name mb-0">{{ table.name }}</h5>
                    <i class="bi bi-people-fill text-muted ms-1"></i> <small>{{ table.capacity }}</small>
                </div>

                <div class="table-body mt-2">
                    <template v-if="table.status === 'occupied'">
                        <div class="fw-bold text-danger">{{ formatCurrency(table.currentTotal) }}</div>
                        <div class="time-elapsed text-muted"><i class="bi bi-clock"></i> {{ table.timeSeated }}</div>
                    </template>
                    <template v-else-if="table.status === 'reserved'">
                        <div class="text-warning fw-bold"><i class="bi bi-calendar-check"></i> {{ table.reservedTime }}
                        </div>
                        <div class="text-muted small">{{ table.reservedName }}</div>
                    </template>
                    <template v-else-if="table.status === 'available'">
                        <div class="text-success mt-2"><i class="bi bi-check-circle"></i> Sẵn sàng</div>
                    </template>
                    <template v-else-if="table.status === 'cleaning'">
                        <div class="text-secondary mt-2"><i class="bi bi-stars"></i> Chờ dọn</div>
                    </template>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '../../services/api';

const router = useRouter();

// Mặc định luôn có tùy chọn "Tất cả"
const zones = ref([
    { id: 'all', name: 'Tất cả' }
]);

const currentZone = ref('all');
const tables = ref([]);

const fetchTablesFromAPI = async () => {
    try {
        // Đổi đường dẫn thành /waiter/tables và dùng api.get
        const response = await api.get('/waiter/tables');

        // Trỏ chính xác vào key "tables"
        if (response.data && response.data.tables) {
            tables.value = response.data.tables;

            // ... (Phần logic tạo zones của bạn giữ nguyên) ...
            if (tables.value.length > 0) {
                const uniqueZoneCodes = [...new Set(tables.value.map(t => t.name.charAt(0)))];
                const newZones = [{ id: 'all', name: 'Tất cả' }];
                uniqueZoneCodes.forEach(code => {
                    newZones.push({ id: code, name: `Khu ${code}` });
                });
                zones.value = newZones;
            }
        }
    } catch (error) {
        console.error('Lỗi khi tải danh sách bàn từ API:', error);
    }
};
onMounted(() => {
    fetchTablesFromAPI();
});

// Lọc bàn thông minh: Lấy chữ cái đầu của `name` làm điều kiện lọc (nếu id zone là 'A', 'B', 'C')
const filteredTables = computed(() => {
    if (currentZone.value === 'all') return tables.value;
    return tables.value.filter(table => table.name.startsWith(currentZone.value));
});

// Hàm định dạng tiền tệ
const formatCurrency = (value) => {
    if (!value) return '0 đ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

// Xử lý khi Waiter bấm vào bàn
const handleTableClick = (table) => {
    if (table.status === 'cleaning') {
        alert('Bàn đang được dọn dẹp, vui lòng chờ!');
        return;
    }
    // Chuyển hướng sang trang Order kèm ID bàn
    router.push(`/waiter/order/${table.id}`);
};
</script>

<style scoped>
.table-map-container {
    max-width: 1200px;
    margin: 0 auto;
}

/* ================= ZONES ================= */
.zone-filters {
    display: flex;
    overflow-x: auto;
    white-space: nowrap;
    padding-bottom: 5px;
}

.zone-filters::-webkit-scrollbar {
    display: none;
}

/* ================= LEGEND ================= */
.legend-item {
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    color: #555;
}

.status-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    display: inline-block;
    margin-right: 6px;
}

/* ================= TABLE GRID ================= */
.tables-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 15px;
}

/* ================= TABLE CARD ================= */
.table-card {
    background: white;
    border-radius: 12px;
    padding: 15px;
    cursor: pointer;
    position: relative;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    border: 2px solid transparent;
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 110px;
}

.table-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.table-name {
    font-size: 1.1rem;
    font-weight: 700;
    color: #333;
}

/* ================= THIẾT KẾ TRẠNG THÁI ================= */
/* Đã sửa empty thành available */
.table-card.available {
    border-color: #2ecc71;
    background-color: #f0fdf4;
}

.status-dot.available {
    background-color: #2ecc71;
}

.table-card.occupied {
    border-color: #e74c3c;
    background-color: #fff5f5;
}

.status-dot.occupied {
    background-color: #e74c3c;
}

.table-card.reserved {
    border-color: #f1c40f;
    background-color: #fffbf0;
}

.status-dot.reserved {
    background-color: #f1c40f;
}

.table-card.cleaning {
    border-color: #95a5a6;
    background-color: #f8f9fa;
    opacity: 0.7;
}

.status-dot.cleaning {
    background-color: #95a5a6;
}

/* ================= HIỆU ỨNG GỌI THANH TOÁN ================= */
.checkout-alert {
    position: absolute;
    top: -8px;
    right: -8px;
    background: white;
    border-radius: 50%;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    z-index: 2;
}

.animate-ring {
    animation: ring 1.5s infinite;
}

@keyframes ring {
    0% {
        transform: rotate(0);
    }

    10% {
        transform: rotate(15deg);
    }

    20% {
        transform: rotate(-15deg);
    }

    30% {
        transform: rotate(15deg);
    }

    40% {
        transform: rotate(-15deg);
    }

    50% {
        transform: rotate(0);
    }

    100% {
        transform: rotate(0);
    }
}

/* Mobile Tweak */
@media (max-width: 576px) {
    .tables-grid {
        grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    }
}
</style>