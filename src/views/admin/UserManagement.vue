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

    <div class="user-management">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="h4 mb-0">Quản lý Khách hàng & Phân quyền</h2>
            <div>
                <button class="btn btn-primary btn-sm me-2" @click="openAddModal">
                    <i class="bi bi-plus-circle"></i> Thêm người dùng
                </button>
                <button class="btn btn-outline-primary btn-sm" @click="fetchUsers">
                    <i class="bi bi-arrow-clockwise"></i> Làm mới
                </button>
            </div>
        </div>

        <div class="card shadow-sm border-0">
            <div class="card-body p-0">
                <div class="table-responsive">
                    <table class="table table-hover align-middle mb-0">
                        <thead class="table-light">
                            <tr>
                                <th>ID</th>
                                <th>Thông tin người dùng</th>
                                <th>Email</th>
                                <th>Số điện thoại</th>
                                <th>Vai trò</th>
                                <th>Ngày tham gia</th>
                                <th class="text-end">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-if="isLoading">
                                <td colspan="7" class="text-center py-4">Đang tải dữ liệu...</td>
                            </tr>
                            <tr v-else-if="users.length === 0">
                                <td colspan="7" class="text-center py-4">Chưa có dữ liệu.</td>
                            </tr>
                            <tr v-else v-for="user in users" :key="user.id">
                                <td class="fw-bold">#{{ user.id }}</td>
                                <td class="fw-bold">{{ user.name }}</td>
                                <td>{{ user.email }}</td>
                                <td>{{ user.phone || 'Chưa cập nhật' }}</td>

                                <td>
                                    <span class="badge" :class="getRoleClass(user.role)">
                                        {{ getRoleName(user.role) }}
                                    </span>
                                </td>

                                <td class="small text-muted">{{ formatDate(user.created_at) }}</td>

                                <td class="text-end">
                                    <button @click="openEditModal(user)" class="btn btn-sm btn-outline-secondary me-2"
                                        title="Chỉnh sửa">
                                        <i class="bi bi-pencil"></i>
                                    </button>
                                    <button @click="deleteUser(user.id)" class="btn btn-sm btn-outline-danger"
                                        title="Xóa tài khoản">
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
                    <h5 class="mb-0">{{ isEditMode ? 'Cập nhật thông tin' : 'Thêm người dùng mới' }}</h5>
                    <button class="btn-close" @click="closeModal"></button>
                </div>
                <div class="modal-body">
                    <form @submit.prevent="submitForm">
                        <div class="mb-3">
                            <label class="form-label">Họ và tên <span class="text-danger">*</span></label>
                            <input type="text" class="form-control" v-model="formData.name" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Email <span class="text-danger">*</span></label>
                            <input type="email" class="form-control" v-model="formData.email" required>
                        </div>

                        <div class="mb-3" v-if="!isEditMode">
                            <label class="form-label">Mật khẩu <span class="text-danger">*</span></label>
                            <input type="password" class="form-control" v-model="formData.password" required
                                placeholder="Nhập mật khẩu ít nhất 6 ký tự">
                        </div>

                        <div class="mb-3">
                            <label class="form-label">Số điện thoại</label>
                            <input type="text" class="form-control" v-model="formData.phone">
                        </div>
                        <div class="mb-4">
                            <label class="form-label">Vai trò (Phân quyền) <span class="text-danger">*</span></label>
                            <select class="form-select" v-model="formData.role" required>
                                <option value="customer">Khách hàng</option>
                                <option value="cashier">Thu ngân</option>
                                <option value="waiter">Phục vụ</option>
                                <option value="admin">Quản trị viên (Admin)</option>
                            </select>
                            <small class="text-muted d-block mt-1">Cẩn trọng khi cấp quyền Quản trị viên cho người
                                khác.</small>
                        </div>

                        <div class="d-flex justify-content-end gap-2">
                            <button type="button" class="btn btn-secondary" @click="closeModal">Hủy</button>
                            <button type="submit" class="btn btn-primary" :disabled="isSaving">
                                {{ isSaving ? 'Đang lưu...' : (isEditMode ? 'Lưu thay đổi' : 'Thêm người dùng') }}
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

const users = ref([]);
const isLoading = ref(true);

// -- STATE TOAST --
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref('success');
let toastTimeout = null;

const triggerToast = (message, type = 'success') => {
    toastMessage.value = message;
    toastType.value = type;
    showToast.value = true;
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => { showToast.value = false; }, 3000);
};

// -- STATE MODAL --
const showModal = ref(false);
const isSaving = ref(false);
const isEditMode = ref(false); // Biến để biết đang Thêm hay Sửa

const formData = ref({
    id: null,
    name: '',
    email: '',
    phone: '',
    role: 'customer',
    password: '' // Thêm trường mật khẩu
});

// ==========================================
// API LOGIC
// ==========================================

const fetchUsers = async () => {
    isLoading.value = true;
    try {
        const response = await api.get('/admin/users');
        if (response.data.success) {
            users.value = response.data.data;
        }
    } catch (error) {
        console.error('Lỗi lấy danh sách:', error);
        triggerToast('Không thể tải danh sách người dùng!', 'error');
    } finally {
        isLoading.value = false;
    }
};

const deleteUser = async (id) => {
    if (!confirm('Bạn có chắc chắn muốn xóa tài khoản này? Mọi dữ liệu liên quan sẽ bị mất!')) return;

    try {
        const response = await api.delete(`/admin/users/${id}`);
        if (response.data.success) {
            users.value = users.value.filter(u => u.id !== id);
            triggerToast(response.data.message, 'success');
        }
    } catch (error) {
        console.error('Lỗi xóa tài khoản:', error);
        triggerToast(error.response?.data?.message || 'Không thể xóa tài khoản này!', 'error');
    }
};

// ==========================================
// LOGIC MODAL
// ==========================================

// Hàm mở Modal Thêm Mới
const openAddModal = () => {
    isEditMode.value = false;
    formData.value = {
        id: null,
        name: '',
        email: '',
        phone: '',
        role: 'customer',
        password: ''
    };
    showModal.value = true;
};

// Hàm mở Modal Sửa
const openEditModal = (user) => {
    isEditMode.value = true;
    formData.value = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        password: '' // Xoá trắng password khi sửa
    };
    showModal.value = true;
};

const closeModal = () => {
    showModal.value = false;
};

const submitForm = async () => {
    isSaving.value = true;
    try {
        let response;

        // KIỂM TRA ĐỂ GỌI API THÊM HAY SỬA
        if (isEditMode.value) {
            // Logic Cập nhật (Sửa)
            response = await api.put(`/admin/users/${formData.value.id}`, formData.value);
            if (response.data.success) {
                triggerToast('Cập nhật thông tin thành công!', 'success');
            }
        } else {
            // Logic Thêm mới
            response = await api.post('/admin/users', formData.value);
            if (response.data.success) {
                triggerToast('Thêm người dùng thành công!', 'success');
            }
        }

        closeModal();
        fetchUsers(); // Refresh lại danh sách
    } catch (error) {
        console.error('Lỗi lưu thông tin:', error);
        let errorMsg = 'Không thể lưu thông tin!';
        if (error.response?.status === 422) {
            const validationErrors = error.response.data.errors;
            const firstErrorKey = Object.keys(validationErrors)[0];
            errorMsg = validationErrors[firstErrorKey][0];
        } else {
            errorMsg = error.response?.data?.message || errorMsg;
        }
        triggerToast('Lỗi: ' + errorMsg, 'error');
    } finally {
        isSaving.value = false;
    }
};

// ==========================================
// HELPERS
// ==========================================

const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    }).format(date);
};
const getRoleName = (role) => {
    switch (role) {
        case 'admin': return 'Quản trị viên';
        case 'cashier': return 'Thu ngân';
        case 'user': return 'Khách hàng';
        case 'waiter': return 'Phục vụ';
        case 'kitchen': return 'Bếp';
        default: return 'Không xác định';
    }
};

const getRoleClass = (role) => {
    switch (role) {
        case 'admin': return 'bg-danger';
        case 'cashier': return 'bg-success'; 
        case 'user': return 'bg-primary';
        case 'waiter': return 'bg-warning'; 
        case 'kitchen': return 'bg-info';
        default: return 'bg-secondary';
    }
};

onMounted(() => {
    fetchUsers();
});
</script>

<style scoped>
/* Toàn bộ CSS ở đây giữ nguyên không thay đổi */
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

.custom-toast {
    transform: translateX(120%);
    transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    min-width: 250px;
}

.custom-toast.show {
    transform: translateX(0);
}
</style>