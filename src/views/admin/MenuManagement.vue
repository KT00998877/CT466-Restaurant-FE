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
                                <th class="text-center">Đặc sắc</th>
                                <th class="text-center">Món ngon</th>
                                <th>Trạng thái</th>
                                <th class="text-end">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-if="isLoading">
                                <td colspan="8" class="text-center py-4">Đang tải dữ liệu...</td>
                            </tr>
                            <tr v-else v-for="item in menuItems" :key="item.id">
                                <td>#{{ item.id }}</td>
                                <td class="fw-bold">{{ item.name }}</td>
                                <td>{{ item.category?.name || 'Chưa có' }}</td>
                                <td>{{ formatPrice(item.price) }}</td>

                                
                                <td class="text-center">
                                    <div class="form-check form-switch d-flex justify-content-center">
                                        <input class="form-check-input" type="checkbox" role="switch"
                                            v-model="item.is_featured" :true-value="1" :false-value="0"
                                            @change="toggleHighlight(item, 'is_featured')"
                                            :disabled="item.isUpdatingHighlight">
                                    </div>
                                </td>

                               
                                <td class="text-center">
                                    <div class="form-check form-switch d-flex justify-content-center">
                                        <input class="form-check-input" type="checkbox" role="switch"
                                            v-model="item.is_daily_special" :true-value="1" :false-value="0"
                                            @change="toggleHighlight(item, 'is_daily_special')"
                                            :disabled="item.isUpdatingHighlight">
                                    </div>
                                </td>

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

                        
                        <div class="mb-3 d-flex gap-4">
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" id="modalFeatured"
                                    v-model="formData.is_featured" :true-value="1" :false-value="0">
                                <label class="form-check-label" for="modalFeatured">Là Món đặc sắc</label>
                            </div>
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" id="modalDaily"
                                    v-model="formData.is_daily_special" :true-value="1" :false-value="0">
                                <label class="form-check-label" for="modalDaily">Là Món ngon mỗi ngày</label>
                            </div>
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
const toastType = ref('success');
let toastTimeout = null;
// Hàm hiển thị toast với thông điệp và loại (success hoặc error)
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
// STATE CHO MODAL
// ==========================================
const showModal = ref(false);
const isEditMode = ref(false);
const isSaving = ref(false);

const formData = ref({
    id: null,
    name: '',
    price: 0,
    category_id: null,
    description: '',
    is_featured: 0,       // ---> THÊM MỚI
    is_daily_special: 0   // ---> THÊM MỚI
});

const categories = ref([]);

const fetchCategories = async () => {
    try {
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
    fetchCategories();
});

const selectedFile = ref(null);

const handleFileUpload = (event) => {
    selectedFile.value = event.target.files[0];
};

// ==========================================
// CÁC HÀM GỌI API & LOGIC
// ==========================================
// Hàm tải danh sách món ăn từ API
const fetchMenuItems = async () => {
    isLoading.value = true;
    try {
        const response = await api.get('/admin/menu-items');
        if (response.data.success) {
            menuItems.value = response.data.data.map(item => ({
                ...item,
                isUpdating: false,
                isUpdatingHighlight: false // ---> THÊM MỚI: Cờ loading riêng cho nút toggle nổi bật
            }));
        }
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu:', error);
    } finally {
        isLoading.value = false;
    }
};
// Hàm cập nhật trạng thái món ăn (Đang kinh doanh, Tạm hết nguyên liệu, Ngừng kinh doanh)
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

// Hàm xử lý toggle cập nhật nhãn nổi bật trực tiếp trên bảng
const toggleHighlight = async (item, field) => {
    item.isUpdatingHighlight = true;
    try {
        const payload = {};
        payload[field] = item[field]; // Sẽ gửi lên is_featured hoặc is_daily_special với giá trị 1 hoặc 0

        // Đảm bảo URL này khớp với route bạn đã định nghĩa trong Laravel (thêm /admin/ nếu cần)
        const response = await api.patch(`/admin/menu/${item.id}/highlights`, payload);

        if (response.data.success) {
            triggerToast('Cập nhật nhãn món ăn thành công!', 'success');
        }
    } catch (error) {
        console.error('Lỗi khi cập nhật nhãn:', error);
        triggerToast('Không thể cập nhật nhãn nổi bật!', 'error');

        // Khôi phục lại trạng thái cũ trên UI nếu API lỗi
        item[field] = item[field] === 1 ? 0 : 1;
    } finally {
        item.isUpdatingHighlight = false;
    }
};
// Hàm xóa món ăn
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
// LOGIC MODAL
// ==========================================

const openAddModal = () => {
    isEditMode.value = false;
    // ---> THÊM MỚI: Reset cả 2 nhãn về 0
    formData.value = { id: null, name: '', price: 0, category_id: null, description: '', is_featured: 0, is_daily_special: 0 };
    selectedFile.value = null;
    showModal.value = true;
};

const openEditModal = (item) => {
    isEditMode.value = true;
    // ---> THÊM MỚI: Gán dữ liệu nhãn từ item vào form
    formData.value = {
        id: item.id,
        name: item.name,
        price: item.price,
        category_id: item.category_id,
        description: item.description || '',
        is_featured: item.is_featured,
        is_daily_special: item.is_daily_special
    };
    selectedFile.value = null;
    showModal.value = true;
};

const closeModal = () => {
    showModal.value = false;
};

const submitForm = async () => {
    isSaving.value = true;
    try {
        if (isEditMode.value) {
            const response = await api.put(`/admin/menu-items/${formData.value.id}`, formData.value);
            if (response.data.success) {
                closeModal();
                fetchMenuItems();
                triggerToast('Cập nhật thông tin thành công!', 'success');
            }
        } else {
            const dataToSubmit = new FormData();
            dataToSubmit.append('name', formData.value.name);
            dataToSubmit.append('price', formData.value.price);
            dataToSubmit.append('category_id', formData.value.category_id);

            // ---> THÊM MỚI: Gửi kèm 2 nhãn khi tạo mới
            dataToSubmit.append('is_featured', formData.value.is_featured ? 1 : 0);
            dataToSubmit.append('is_daily_special', formData.value.is_daily_special ? 1 : 0);

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

        if (error.response?.status === 422) {
            const validationErrors = error.response.data.errors;
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