<template>
    <div class="ingredient-manager">

        <!-- Metric Cards -->
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-icon"><i class="icon-box"></i></div>
                <div>
                    <div class="metric-label">Tổng nguyên liệu</div>
                    <div class="metric-value">{{ ingredients.length }}</div>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-icon"><i class="icon-grid"></i></div>
                <div>
                    <div class="metric-label">Nhóm thực phẩm</div>
                    <div class="metric-value">{{ foodCategories.length }}</div>
                </div>
            </div>
            <div class="metric-card warn">
                <div class="metric-icon warn"><i class="icon-alert"></i></div>
                <div>
                    <div class="metric-label">Sắp hết hàng</div>
                    <div class="metric-value warn">{{ lowStockIngredients.length }}</div>
                </div>
            </div>
            <div class="metric-card ok">
                <div class="metric-icon ok"><i class="icon-check"></i></div>
                <div>
                    <div class="metric-label">Tỉ lệ đủ hàng</div>
                    <div class="metric-value ok">{{ stockHealthPct }}%</div>
                </div>
            </div>
        </div>

        <!-- Low Stock Banner -->
        <div v-if="lowStockIngredients.length > 0" class="warn-banner">
            <span class="warn-banner-icon">⚠️</span>
            <div>
                <strong>Cảnh báo tồn kho thấp:</strong>
                <span v-for="(item, i) in lowStockIngredients" :key="'low-' + item.id">
                    {{ item.name }} <strong>({{ item.stock_quantity }} {{ item.unit }})</strong>{{ i <
                        lowStockIngredients.length - 1 ? ', ' : '' }} </span>
            </div>
        </div>

        <!-- Main Layout -->
        <div class="main-layout">

            <!-- Left: Table Area -->
            <div class="table-area">

                <!-- Filter Pills -->
                <div class="filter-pills">
                    <button class="pill" :class="{ active: selectedCategory === '' }" @click="selectedCategory = ''">
                        Tất cả ({{ ingredients.length }})
                    </button>
                    <button v-for="cat in foodCategories" :key="cat.id" class="pill"
                        :class="{ active: selectedCategory === cat.id }" @click="selectedCategory = cat.id">
                        {{ cat.name }} ({{ingredients.filter(i => i.category === cat.id).length}})
                    </button>
                </div>

                <!-- Search -->
                <div class="search-row">
                    <input v-model="searchQuery" type="text" class="search-input" placeholder="Tìm nguyên liệu..." />
                </div>

                <!-- Table -->
                <div class="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 40px">ID</th>
                                <th>Tên nguyên liệu</th>
                                <th>Nhóm</th>
                                <th style="width: 70px">Đơn vị</th>
                                <th style="width: 90px">Tồn kho</th>
                                <th style="width: 85px">Cảnh báo</th>
                                <th style="width: 90px">Trạng thái</th>
                                <th style="width: 80px"></th>
                            </tr>
                        </thead>
                        <tbody>
                            <template v-for="category in foodCategories" :key="category.id">
                                <tr v-if="getFilteredCategoryItems(category.id).length > 0" class="group-row">
                                    <td colspan="8">
                                        <span class="group-badge" :class="'group-' + category.id">
                                            {{ category.name }}
                                        </span>
                                    </td>
                                </tr>
                                <tr v-for="item in getFilteredCategoryItems(category.id)" :key="item.id"
                                    class="data-row" :class="{ 'editing-row': isEditing && form.id === item.id }">
                                    <td class="id-cell">{{ item.id }}</td>
                                    <td class="name-cell">{{ item.name }}</td>
                                    <td>
                                        <span class="cat-tag" :class="'cat-' + category.id">
                                            {{ category.name }}
                                        </span>
                                    </td>
                                    <td class="muted-cell">{{ item.unit }}</td>
                                    <td :class="{ 'low-stock-cell': item.stock_quantity <= item.reorder_level }">
                                        {{ item.stock_quantity }}
                                    </td>
                                    <td class="muted-cell">{{ item.reorder_level }}</td>
                                    <td>
                                        <span class="status-badge"
                                            :class="item.stock_quantity <= item.reorder_level ? 'status-low' : 'status-ok'">
                                            {{ item.stock_quantity <= item.reorder_level ? 'Thấp' : 'Đủ hàng' }} </span>
                                    </td>
                                    <td class="action-cell">
                                        <button class="action-btn edit-btn" @click="editItem(item)"
                                            title="Sửa">✏️</button>
                                        <button class="action-btn del-btn" @click="deleteItem(item.id)"
                                            title="Xóa">🗑</button>
                                    </td>
                                </tr>
                            </template>
                            <tr v-if="filteredIngredients.length === 0">
                                <td colspan="8" class="empty-state">Không tìm thấy nguyên liệu nào.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Right: Form Panel -->
            <div class="form-panel">
                <div class="form-panel-header">
                    <span class="form-panel-icon">📦</span>
                    <h3>{{ isEditing ? 'Cập nhật nguyên liệu' : 'Thêm nguyên liệu mới' }}</h3>
                </div>

                <form @submit.prevent="saveIngredient" class="ingredient-form">
                    <div class="field">
                        <label>Nhóm thực phẩm <span class="required">*</span></label>
                        <select v-model="form.category" required>
                            <option value="">-- Chọn nhóm --</option>
                            <option v-for="cat in foodCategories" :key="cat.id" :value="cat.id">
                                {{ cat.name }}
                            </option>
                        </select>
                    </div>

                    <div class="field">
                        <label>Tên nguyên liệu <span class="required">*</span></label>
                        <input v-model="form.name" type="text" required placeholder="VD: Cá hồi tươi" />
                    </div>

                    <div class="field">
                        <label>Đơn vị <span class="required">*</span></label>
                        <input v-model="form.unit" type="text" required placeholder="VD: kg, lít, gói" />
                    </div>

                    <div class="field-row">
                        <div class="field">
                            <label>Tồn kho hiện tại <span class="required">*</span></label>
                            <input v-model="form.stock_quantity" type="number" step="0.01" min="0" required />
                        </div>
                        <div class="field">
                            <label>Mức cảnh báo <span class="required">*</span></label>
                            <input v-model="form.reorder_level" type="number" step="0.01" min="0" required />
                        </div>
                    </div>

                    <div class="form-actions">
                        <button type="submit" class="btn-primary">
                            {{ isEditing ? '💾 Cập nhật' : '➕ Thêm mới' }}
                        </button>
                        <button v-if="isEditing" type="button" class="btn-cancel" @click="resetForm">
                            Hủy
                        </button>
                    </div>
                </form>
            </div>

        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '../../services/api';

// Danh sách nhóm thực phẩm
const foodCategories = ref([
    { id: 'meat_seafood', name: 'Thịt & Hải sản' },
    { id: 'carbs_dry', name: 'Tinh bột & Đồ khô' },
    { id: 'vegetables', name: 'Rau củ & Chế phẩm' },
    { id: 'condiments', name: 'Gia vị & Nước sốt' },
    { id: 'beverages', name: 'Đồ uống' },
    { id: 'dessert', name: 'Tráng miệng & Pha chế' }
]);

// State
const ingredients = ref([]);
const lowStockIngredients = ref([]);
const isEditing = ref(false);
const selectedCategory = ref('');
const searchQuery = ref('');
const form = ref({
    id: null,
    name: '',
    unit: '',
    stock_quantity: 0,
    reorder_level: 0,
    category: ''
});

// Computed
const stockHealthPct = computed(() => {
    if (!ingredients.value.length) return 100;
    const ok = ingredients.value.filter(i => i.stock_quantity > i.reorder_level).length;
    return Math.round((ok / ingredients.value.length) * 100);
});

const filteredIngredients = computed(() => {
    let list = ingredients.value;
    if (selectedCategory.value) list = list.filter(i => i.category === selectedCategory.value);
    if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase();
        list = list.filter(i => i.name.toLowerCase().includes(q));
    }
    return list;
});

const getFilteredCategoryItems = (categoryId) => {
    return filteredIngredients.value.filter(i => i.category === categoryId);
};

// API calls
const fetchIngredients = async () => {
    try {
        const response = await api.get('/admin/ingredients');
        if (response.data.success) {
            ingredients.value = response.data.data;
        }
    } catch (error) {
        console.error('Lỗi khi tải danh sách nguyên liệu:', error);
    }
};

const fetchLowStock = async () => {
    try {
        const response = await api.get('/admin/ingredients/low-stock');
        if (response.data.success) {
            lowStockIngredients.value = response.data.data;
        }
    } catch (error) {
        console.error('Lỗi khi tải cảnh báo kho:', error);
    }
};

onMounted(() => {
    fetchIngredients();
    fetchLowStock();
});

const saveIngredient = async () => {
    try {
        if (isEditing.value) {
            await api.put(`/admin/ingredients/${form.value.id}`, form.value);
            alert('Cập nhật thành công!');
        } else {
            await api.post('/admin/ingredients', form.value);
            alert('Thêm mới thành công!');
        }
        resetForm();
        fetchIngredients();
        fetchLowStock();
    } catch (error) {
        alert('Có lỗi xảy ra, vui lòng kiểm tra lại (có thể trùng tên nguyên liệu).');
        console.error(error);
    }
};

const editItem = (item) => {
    isEditing.value = true;
    form.value = { ...item };
};

const deleteItem = async (id) => {
    if (confirm('Bạn có chắc chắn muốn xóa nguyên liệu này? Các công thức món ăn liên quan cũng sẽ bị ảnh hưởng.')) {
        try {
            await api.delete(`/admin/ingredients/${id}`);
            alert('Xóa nguyên liệu thành công!');
            fetchIngredients();
            fetchLowStock();
        } catch (error) {
            alert('Lỗi khi xóa nguyên liệu!');
            console.error(error);
        }
    }
};

const resetForm = () => {
    isEditing.value = false;
    form.value = { id: null, name: '', unit: '', stock_quantity: 0, reorder_level: 0, category: '' };
};
</script>

<style scoped>
/* ─── Base ─────────────────────────────────────────── */
.ingredient-manager {
    padding: 1.5rem;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    color: #1a1a1a;
}

/* ─── Metric Cards ──────────────────────────────────── */
.metrics-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 16px;
}

.metric-card {
    background: #f5f5f4;
    border-radius: 10px;
    padding: 14px 16px;
    display: flex;
    align-items: center;
    gap: 14px;
}

.metric-label {
    font-size: 12px;
    color: #6b7280;
    margin-bottom: 2px;
}

.metric-value {
    font-size: 22px;
    font-weight: 600;
    color: #111;
}

.metric-value.warn {
    color: #b45309;
}

.metric-value.ok {
    color: #15803d;
}

.metric-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: #e5e7eb;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    flex-shrink: 0;
}

.metric-icon.warn {
    background: #fef3c7;
}

.metric-icon.ok {
    background: #dcfce7;
}

/* ─── Warn Banner ───────────────────────────────────── */
.warn-banner {
    background: #fffbeb;
    border: 1px solid #fcd34d;
    border-radius: 8px;
    padding: 10px 14px;
    margin-bottom: 16px;
    font-size: 13px;
    color: #92400e;
    display: flex;
    align-items: flex-start;
    gap: 10px;
}

.warn-banner-icon {
    flex-shrink: 0;
    margin-top: 1px;
}

/* ─── Main Layout ───────────────────────────────────── */
.main-layout {
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: 20px;
    align-items: start;
}

/* ─── Filter Pills ──────────────────────────────────── */
.filter-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 12px;
}

.pill {
    padding: 5px 12px;
    border-radius: 20px;
    font-size: 12px;
    cursor: pointer;
    border: 1px solid #e5e7eb;
    background: #f9fafb;
    color: #6b7280;
    transition: all 0.15s;
}

.pill:hover {
    background: #f3f4f6;
    color: #374151;
}

.pill.active {
    background: #1d4ed8;
    color: #fff;
    border-color: #1d4ed8;
}

/* ─── Search ────────────────────────────────────────── */
.search-row {
    margin-bottom: 12px;
}

.search-input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    font-size: 13px;
    outline: none;
    transition: border-color 0.15s;
}

.search-input:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, .1);
}

/* ─── Table ─────────────────────────────────────────── */
.table-wrapper {
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    overflow: hidden;
}

table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
}

thead {
    background: #f9fafb;
}

th {
    padding: 9px 12px;
    text-align: left;
    font-size: 11px;
    font-weight: 600;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    border-bottom: 1px solid #e5e7eb;
}

td {
    padding: 10px 12px;
    border-bottom: 1px solid #f3f4f6;
    vertical-align: middle;
}

.data-row:last-child td {
    border-bottom: none;
}

.data-row:hover td {
    background: #fafafa;
}

.editing-row td {
    background: #eff6ff !important;
}

/* ─── Group Row ─────────────────────────────────────── */
.group-row td {
    padding: 6px 12px;
    background: #f8fafc;
}

.group-badge {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 2px 8px;
    border-radius: 4px;
}

/* Group colors */
.group-meat_seafood {
    background: #fee2e2;
    color: #991b1b;
}

.group-carbs_dry {
    background: #fef9c3;
    color: #854d0e;
}

.group-vegetables {
    background: #dcfce7;
    color: #166534;
}

.group-condiments {
    background: #ede9fe;
    color: #4c1d95;
}

.group-beverages {
    background: #dbeafe;
    color: #1e40af;
}

.group-dessert {
    background: #fce7f3;
    color: #831843;
}

/* Category tags */
.cat-tag {
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 20px;
    white-space: nowrap;
}

.cat-meat_seafood {
    background: #fee2e2;
    color: #991b1b;
}

.cat-carbs_dry {
    background: #fef9c3;
    color: #854d0e;
}

.cat-vegetables {
    background: #dcfce7;
    color: #166534;
}

.cat-condiments {
    background: #ede9fe;
    color: #4c1d95;
}

.cat-beverages {
    background: #dbeafe;
    color: #1e40af;
}

.cat-dessert {
    background: #fce7f3;
    color: #831843;
}

/* ─── Table Cells ───────────────────────────────────── */
.id-cell {
    color: #9ca3af;
    font-size: 12px;
}

.name-cell {
    font-weight: 500;
}

.muted-cell {
    color: #6b7280;
}

.low-stock-cell {
    color: #b45309;
    font-weight: 600;
}

/* ─── Status Badge ──────────────────────────────────── */
.status-badge {
    display: inline-block;
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 20px;
    font-weight: 500;
}

.status-ok {
    background: #dcfce7;
    color: #166534;
}

.status-low {
    background: #fef9c3;
    color: #854d0e;
}

/* ─── Action Buttons ────────────────────────────────── */
.action-cell {
    white-space: nowrap;
}

.action-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 14px;
    padding: 4px 6px;
    border-radius: 6px;
    transition: background 0.15s;
}

.edit-btn:hover {
    background: #dbeafe;
}

.del-btn:hover {
    background: #fee2e2;
}

/* ─── Empty State ───────────────────────────────────── */
.empty-state {
    text-align: center;
    padding: 40px;
    color: #9ca3af;
    font-size: 13px;
}

/* ─── Form Panel ────────────────────────────────────── */
.form-panel {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 20px;
    position: sticky;
    top: 1rem;
}

.form-panel-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 18px;
}

.form-panel-icon {
    font-size: 20px;
}

.form-panel-header h3 {
    font-size: 15px;
    font-weight: 600;
    color: #111;
}

/* ─── Form Fields ───────────────────────────────────── */
.ingredient-form .field {
    margin-bottom: 14px;
}

.ingredient-form label {
    display: block;
    font-size: 12px;
    font-weight: 500;
    color: #374151;
    margin-bottom: 5px;
}

.required {
    color: #ef4444;
}

.ingredient-form input,
.ingredient-form select {
    width: 100%;
    padding: 8px 10px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    font-size: 13px;
    color: #111;
    outline: none;
    transition: border-color 0.15s;
    background: #fff;
}

.ingredient-form input:focus,
.ingredient-form select:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, .1);
}

.field-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
}

/* ─── Form Actions ──────────────────────────────────── */
.form-actions {
    display: flex;
    gap: 8px;
    margin-top: 6px;
}

.btn-primary {
    flex: 1;
    padding: 9px 16px;
    background: #1d4ed8;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s;
}

.btn-primary:hover {
    background: #1e40af;
}

.btn-cancel {
    padding: 9px 14px;
    background: #f3f4f6;
    color: #374151;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    font-size: 13px;
    cursor: pointer;
    transition: background 0.15s;
}

.btn-cancel:hover {
    background: #e5e7eb;
}

/* ─── Responsive ─────────────────────────────────────── */
@media (max-width: 1024px) {
    .main-layout {
        grid-template-columns: 1fr;
    }

    .form-panel {
        position: static;
    }
}

@media (max-width: 640px) {
    .metrics-grid {
        grid-template-columns: repeat(2, 1fr);
    }

    .ingredient-manager {
        padding: 1rem;
    }
}
</style>