<template>
    <div class="toast-container position-fixed top-0 end-0 p-3" style="z-index: 1060;">
        <div class="custom-toast"
            :class="{ 'show': showToast, 'bg-success': toastType === 'success', 'bg-danger': toastType === 'error' }">
            <div class="d-flex align-items-center text-white p-3 rounded shadow-sm">
                <i class="bi fs-4 me-2"
                    :class="toastType === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'"></i>
                <span class="fw-medium">{{ toastMessage }}</span>
            </div>
        </div>
    </div>

    <div class="menu-management">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="h4 mb-0">Quản lý Thực đơn</h2>
            <button @click="openAddModal" class="btn btn-primary btn-sm">
                <i class="bi bi-plus-lg"></i> Thêm món mới
            </button>
        </div>

        <div class="card shadow-sm border-0">
            <div class="card-body p-0">
                <div class="table-responsive">
                    <table class="table table-hover align-middle mb-0">
                        <thead class="table-light">
                            <tr>
                                <th>ID</th>
                                <th>Tên món</th>
                                <th>Danh mục</th>
                                <th>Giá</th>
                                <th>Trạng thái</th>
                                <th class="text-end">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-if="isLoading">
                                <td colspan="6" class="text-center py-4">Đang tải dữ liệu...</td>
                            </tr>
                            <tr v-else v-for="item in menuItems" :key="item.id">
                                <td>#{{ item.id }}</td>
                                <td class="fw-bold">{{ item.name }}</td>
                                <td>{{ item.category?.name || 'Chưa có' }}</td>
                                <td>{{ formatPrice(item.price) }}</td>

                                <td style="width: 200px;">
                                    <select v-model="item.status" class="form-select form-select-sm"
                                        :class="getStatusClass(item.status)" @change="updateStatus(item)"
                                        :disabled="item.isUpdating">
                                        <option :value="1">Đang kinh doanh</option>
                                        <option :value="2">Tạm hết nguyên liệu</option>
                                        <option :value="0">Ngừng kinh doanh</option>
                                    </select>
                                </td>

                                <td class="text-end">
                                    <button @click="openEditModal(item)" class="btn btn-sm btn-outline-secondary me-2"
                                        title="Chỉnh sửa">
                                        <i class="bi bi-pencil"></i>
                                    </button>
                                    <button @click="deleteItem(item.id)" class="btn btn-sm btn-outline-danger"
                                        title="Xóa">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <div v-if="showModal" class="custom-modal-overlay" @click.self="closeModal">
            <div class="custom-modal">
                <div class="modal-header">
                    <h5 class="mb-0">{{ isEditMode ? 'Chỉnh sửa món ăn' : 'Thêm món mới' }}</h5>
                    <button class="btn-close" @click="closeModal"></button>
                </div>
                <div class="modal-body">
                    <form @submit.prevent="submitForm">
                        <div class="mb-3">
                            <label class="form-label">Tên món ăn <span class="text-danger">*</span></label>
                            <input type="text" class="form-control" v-model="formData.name" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Giá (VNĐ) <span class="text-danger">*</span></label>
                            <input type="number" class="form-control" v-model="formData.price" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Danh mục <span class="text-danger">*</span></label>
                            <select class="form-select" v-model="formData.category_id" required>
                                <option value="" disabled selected>-- Chọn danh mục --</option>
                                <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                                    {{ cat.name }}
                                </option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Mô tả</label>
                            <textarea class="form-control" v-model="formData.description" rows="3"></textarea>
                        </div>

                        <div class="mb-3" v-if="!isEditMode">
                            <label class="form-label">Hình ảnh</label>
                            <input type="file" class="form-control" @change="handleFileUpload" accept="image/*">
                        </div>

                        <div class="d-flex justify-content-end gap-2 mt-4">
                            <button type="button" class="btn btn-secondary" @click="closeModal">Hủy</button>
                            <button type="submit" class="btn btn-primary" :disabled="isSaving">
                                {{ isSaving ? 'Đang lưu...' : (isEditMode ? 'Lưu thay đổi' : 'Thêm mới') }}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '@/services/api';

const menuItems = ref([]);
const isLoading = ref(true);

// -- STATE CHO TOAST THÔNG BÁO --
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref('success'); // 'success' hoặc 'error'
let toastTimeout = null;

const triggerToast = (message, type = 'success') => {
    toastMessage.value = message;
    toastType.value = type;
    showToast.value = true;

    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        showToast.value = false;
    }, 3000);
};

// ==========================================
// STATE CHO MODAL (DÙNG CHUNG THÊM & SỬA)
// ==========================================
const showModal = ref(false); // Thay thế cho showEditModal cũ
const isEditMode = ref(false); // Cờ phân biệt: Sửa (true) hay Thêm mới (false)
const isSaving = ref(false);

const formData = ref({ // Thay thế cho editForm cũ
    id: null,
    name: '',
    price: 0,
    category_id: null,
    description: ''
});


const categories = ref([]); // Chứa danh sách danh mục

// Hàm lấy danh mục
const fetchCategories = async () => {
    try {
        // Tận dụng luôn API lấy danh mục ở trang người dùng bạn đã viết trước đó
        const response = await api.get('/menu');
        if (response.data.success) {
            categories.value = response.data.data;
        }
    } catch (error) {
        console.error('Lỗi khi tải danh mục:', error);
    }
};

onMounted(() => {
    fetchMenuItems();
    fetchCategories(); // Gọi thêm hàm này khi load trang
});

const selectedFile = ref(null); // Biến lưu trữ file ảnh upload

// Xử lý khi chọn file ảnh
const handleFileUpload = (event) => {
    selectedFile.value = event.target.files[0];
};

// ==========================================
// CÁC HÀM GỌI API & LOGIC
// ==========================================

// Lấy danh sách món ăn
const fetchMenuItems = async () => {
    isLoading.value = true;
    try {
        const response = await api.get('/admin/menu-items');
        if (response.data.success) {
            menuItems.value = response.data.data.map(item => ({
                ...item,
                isUpdating: false
            }));
        }
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu:', error);
    } finally {
        isLoading.value = false;
    }
};

// Đổi trạng thái trực tiếp
const updateStatus = async (item) => {
    item.isUpdating = true;
    try {
        const response = await api.patch(`/admin/menu-items/${item.id}/status`, {
            status: item.status
        });
        if (response.data.success) {
            triggerToast('Đã cập nhật trạng thái món ăn!', 'success');
        }
    } catch (error) {
        console.error('Lỗi khi cập nhật:', error);
        triggerToast(error.response?.data?.message || 'Có lỗi xảy ra khi kết nối đến server!', 'error');
        await fetchMenuItems();
    } finally {
        item.isUpdating = false;
    }
};

// Xóa món ăn
const deleteItem = async (id) => {
    if (!confirm('Bạn có chắc chắn muốn xóa món ăn này không? Hành động này không thể hoàn tác!')) return;
    try {
        const response = await api.delete(`/admin/menu-items/${id}`);
        if (response.data.success) {
            menuItems.value = menuItems.value.filter(item => item.id !== id);
            triggerToast('Đã xóa món ăn thành công!', 'success');
        }
    } catch (error) {
        console.error('Lỗi khi xóa:', error);
        triggerToast('Không thể xóa món ăn này!', 'error');
    }
};

// ==========================================
// LOGIC MODAL: MỞ, ĐÓNG VÀ SUBMIT
// ==========================================

// Mở Modal Thêm Mới
const openAddModal = () => {
    isEditMode.value = false;
    formData.value = { id: null, name: '', price: 0, category_id: null, description: '' };
    selectedFile.value = null;
    showModal.value = true;
};

// Mở Modal Chỉnh Sửa
const openEditModal = (item) => {
    isEditMode.value = true;
    formData.value = {
        id: item.id,
        name: item.name,
        price: item.price,
        category_id: item.category_id,
        description: item.description || ''
    };
    selectedFile.value = null; // Hiện tại chưa hỗ trợ sửa ảnh, nên reset file
    showModal.value = true;
};

// Đóng Modal
const closeModal = () => {
    showModal.value = false;
};

// Submit Form (Xử lý chung cho cả Thêm và Sửa)
const submitForm = async () => {
    isSaving.value = true;
    try {
        if (isEditMode.value) {
            // ---> LOGIC CHỈNH SỬA (Gửi JSON)
            const response = await api.put(`/admin/menu-items/${formData.value.id}`, formData.value);
            if (response.data.success) {
                closeModal();
                fetchMenuItems();
                triggerToast('Cập nhật thông tin thành công!', 'success');
            }
        } else {
            // ---> LOGIC THÊM MỚI (Gửi FormData để kèm ảnh)
            const dataToSubmit = new FormData();
            dataToSubmit.append('name', formData.value.name);
            dataToSubmit.append('price', formData.value.price);
            dataToSubmit.append('category_id', formData.value.category_id);

            if (formData.value.description) {
                dataToSubmit.append('description', formData.value.description);
            }
            if (selectedFile.value) {
                dataToSubmit.append('image', selectedFile.value);
            }

            const response = await api.post('/admin/menu-items', dataToSubmit, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            if (response.data.success) {
                closeModal();
                fetchMenuItems();
                triggerToast('Thêm món mới thành công!', 'success');
            }
        }
    } catch (error) {
        console.error('Lỗi lưu dữ liệu:', error);

        let errorMessage = 'Không thể lưu thông tin!';

        // NẾU LÀ LỖI 422 TỪ LARAVEL
        if (error.response?.status === 422) {
            const validationErrors = error.response.data.errors;
            console.log('Chi tiết lỗi Validation từ Laravel:', validationErrors);

            // Lấy dòng thông báo lỗi đầu tiên để hiện lên Toast
            // Ví dụ: "Trường giá tiền bắt buộc phải là số", "File ảnh quá lớn"...
            const firstErrorKey = Object.keys(validationErrors)[0];
            errorMessage = validationErrors[firstErrorKey][0];
        } else {
            errorMessage = error.response?.data?.message || errorMessage;
        }

        triggerToast('Lỗi: ' + errorMessage, 'error');
    } finally {
        isSaving.value = false;
    }
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================
const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const getStatusClass = (status) => {
    if (status === 1) return 'border-success text-success';
    if (status === 2) return 'border-warning text-warning';
    return 'border-danger text-danger';
};

onMounted(() => {
    fetchMenuItems();
});
</script>

<style scoped>
/* CSS ĐÃ CÓ */
.form-select.border-success:focus {
    box-shadow: 0 0 0 0.25rem rgba(25, 135, 84, 0.25);
}

.form-select.border-warning:focus {
    box-shadow: 0 0 0 0.25rem rgba(255, 193, 7, 0.25);
}

.form-select.border-danger:focus {
    box-shadow: 0 0 0 0.25rem rgba(220, 53, 69, 0.25);
}

/* --- CSS CHO MODAL CUSTOM --- */
.custom-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1050;
    /* Cao hơn navbar */
}

.custom-modal {
    background: white;
    width: 100%;
    max-width: 500px;
    border-radius: 8px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    animation: slideDown 0.3s ease-out;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    border-bottom: 1px solid #dee2e6;
}

.modal-body {
    padding: 20px;
}

@keyframes slideDown {
    from {
        transform: translateY(-30px);
        opacity: 0;
    }

    to {
        transform: translateY(0);
        opacity: 1;
    }
}

/* --- CSS CHO TOAST --- */
.custom-toast {
    transform: translateX(120%);
    /* Giấu ra ngoài màn hình bên phải */
    transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    min-width: 250px;
}

.custom-toast.show {
    transform: translateX(0);
    /* Trượt vào trong */
}

</style>