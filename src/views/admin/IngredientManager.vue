<template>
    <div class="ingredient-manager p-4">
        <h2 class="text-2xl font-bold mb-4">Quản lý Kho Nguyên Liệu</h2>

        <div v-if="lowStockIngredients.length > 0"
            class="alert alert-warning bg-yellow-100 p-4 rounded mb-6 border border-yellow-300">
            <h3 class="text-lg font-bold text-yellow-800">⚠️ Cảnh báo sắp hết nguyên liệu!</h3>
            <ul class="list-disc pl-5 mt-2 text-yellow-700">
                <li v-for="item in lowStockIngredients" :key="'low-' + item.id">
                    <strong>{{ item.name }}</strong> - Chỉ còn: {{ item.stock_quantity }} {{ item.unit }} (Mức cảnh báo:
                    {{ item.reorder_level }})
                </li>
            </ul>
        </div>

        <div class="form-card bg-white p-4 rounded shadow mb-6">
            <h3 class="font-bold mb-3">{{ isEditing ? 'Sửa nguyên liệu' : 'Thêm nguyên liệu mới' }}</h3>
            <form @submit.prevent="saveIngredient" class="flex gap-4 items-end">
                <div>
                    <label class="block text-sm">Tên nguyên liệu</label>
                    <input v-model="form.name" type="text" required class="border p-2 rounded w-full"
                        placeholder="VD: Cá hồi tươi">
                </div>
                <div>
                    <label class="block text-sm">Đơn vị</label>
                    <input v-model="form.unit" type="text" required class="border p-2 rounded w-full"
                        placeholder="VD: kg">
                </div>
                <div>
                    <label class="block text-sm">Tồn kho hiện tại</label>
                    <input v-model="form.stock_quantity" type="number" step="0.01" required
                        class="border p-2 rounded w-full">
                </div>
                <div>
                    <label class="block text-sm">Mức cảnh báo (Reorder Level)</label>
                    <input v-model="form.reorder_level" type="number" step="0.01" required
                        class="border p-2 rounded w-full">
                </div>
                <div class="flex gap-2">
                    <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded">
                        {{ isEditing ? 'Cập nhật' : 'Thêm mới' }}
                    </button>
                    <button v-if="isEditing" @click="resetForm" type="button"
                        class="bg-gray-400 text-white px-4 py-2 rounded">
                        Hủy
                    </button>
                </div>
            </form>
        </div>

        <div class="table-container bg-white rounded shadow overflow-hidden">
            <table class="w-full text-left border-collapse">
                <thead class="bg-gray-100">
                    <tr>
                        <th class="p-3 border-b">ID</th>
                        <th class="p-3 border-b">Tên nguyên liệu</th>
                        <th class="p-3 border-b">Đơn vị</th>
                        <th class="p-3 border-b">Tồn kho</th>
                        <th class="p-3 border-b">Mức cảnh báo</th>
                        <th class="p-3 border-b">Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="item in ingredients" :key="item.id" class="hover:bg-gray-50">
                        <td class="p-3 border-b">{{ item.id }}</td>
                        <td class="p-3 border-b font-medium">{{ item.name }}</td>
                        <td class="p-3 border-b">{{ item.unit }}</td>
                        <td class="p-3 border-b"
                            :class="{ 'text-red-600 font-bold': item.stock_quantity <= item.reorder_level }">
                            {{ item.stock_quantity }}
                        </td>
                        <td class="p-3 border-b">{{ item.reorder_level }}</td>
                        <td class="p-3 border-b">
                            <button @click="editItem(item)" class="text-blue-500 mr-3">Sửa</button>
                            <button @click="deleteItem(item.id)" class="text-red-500">Xóa</button>
                        </td>
                    </tr>
                    <tr v-if="ingredients.length === 0">
                        <td colspan="6" class="p-4 text-center text-gray-500">Chưa có nguyên liệu nào trong kho.</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../../services/api';

// State
const ingredients = ref([]);
const lowStockIngredients = ref([]);
const isEditing = ref(false);
const form = ref({
    id: null,
    name: '',
    unit: '',
    stock_quantity: 0,
    reorder_level: 0
});

// Lấy danh sách nguyên liệu
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

// Lấy danh sách cảnh báo sắp hết
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

// Khởi tạo dữ liệu
onMounted(() => {
    fetchIngredients();
    fetchLowStock();
});

// Lưu (Thêm mới hoặc Cập nhật)
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

// Chuẩn bị form để sửa
const editItem = (item) => {
    isEditing.value = true;
    form.value = { ...item }; // Copy dữ liệu vào form
};

// Xóa nguyên liệu
const deleteItem = async (id) => {
    if (confirm('Bạn có chắc chắn muốn xóa nguyên liệu này? Các công thức món ăn liên quan cũng sẽ bị ảnh hưởng.')) {
        try {
            await api.delete(`/admin/ingredients/${id}`);

            // Thêm thông báo thành công ở đây
            alert('Xóa nguyên liệu thành công!');

            // Cập nhật lại danh sách sau khi xóa
            fetchIngredients();
            fetchLowStock();
        } catch (error) {
            alert('Lỗi khi xóa nguyên liệu!');
            console.error(error);
        }
    }
};

// Reset form
const resetForm = () => {
    isEditing.value = false;
    form.value = { id: null, name: '', unit: '', stock_quantity: 0, reorder_level: 0 };
};
</script>