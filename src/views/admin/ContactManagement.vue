<template>
    <div class="contact-management p-4">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="fw-bold text-primary"><i class="bi bi-envelope-paper me-2"></i>Quản Lý Phản Hồi</h2>
            <button class="btn btn-outline-secondary" @click="fetchContacts">
                <i class="bi bi-arrow-clockwise me-1"></i> Làm mới
            </button>
        </div>

        <div class="card border-0 shadow-sm">
            <div class="card-body p-0">
                <div v-if="isLoading" class="text-center py-5">
                    <div class="spinner-border text-primary" role="status"></div>
                    <p class="mt-2 text-muted">Đang tải dữ liệu...</p>
                </div>

                <div v-else-if="contacts.length === 0" class="text-center py-5">
                    <i class="bi bi-inbox fs-1 text-muted d-block mb-3"></i>
                    <h5 class="text-muted">Chưa có phản hồi nào từ khách hàng.</h5>
                </div>

                <div v-else class="table-responsive">
                    <table class="table table-hover align-middle mb-0">
                        <thead class="bg-light">
                            <tr>
                                <th class="ps-4">Khách hàng</th>
                                <th>Liên hệ</th>
                                <th>Tiêu đề</th>
                                <th>Trạng thái</th>
                                <th>Ngày gửi</th>
                                <th class="text-end pe-4">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="contact in contacts" :key="contact.id"
                                :class="{ 'bg-light': contact.status === 'read' }">
                                <td class="ps-4 fw-bold text-dark">{{ contact.name }}</td>
                                <td>
                                    <div><i class="bi bi-envelope text-muted me-1"></i> {{ contact.email }}</div>
                                    <div v-if="contact.phone" class="small text-muted"><i
                                            class="bi bi-telephone me-1"></i> {{ contact.phone }}</div>
                                </td>
                                <td>
                                    <span class="text-truncate d-inline-block" style="max-width: 200px;">
                                        {{ contact.subject }}
                                    </span>
                                </td>
                                <td>
                                    <span class="badge rounded-pill" :class="getStatusClass(contact.status)">
                                        {{ getStatusText(contact.status) }}
                                    </span>
                                </td>
                                <td class="text-muted small">
                                    {{ formatDate(contact.created_at) }}
                                </td>
                                <td class="text-end pe-4">
                                    <button class="btn btn-sm btn-info text-white me-2" @click="viewContact(contact)"
                                        title="Xem chi tiết">
                                        <i class="bi bi-eye"></i>
                                    </button>
                                    <button class="btn btn-sm btn-danger" @click="deleteContact(contact)" title="Xóa">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '@/services/api';
import Swal from 'sweetalert2';

const contacts = ref([]);
const isLoading = ref(true);

// Lấy danh sách
const fetchContacts = async () => {
    isLoading.value = true;
    try {
        const res = await api.get('/admin/contacts');
        if (res.data.success) {
            // Nếu dùng paginate của Laravel, dữ liệu nằm trong res.data.data.data
            contacts.value = res.data.data.data || res.data.data;
        }
    } catch (error) {
        console.error("Lỗi lấy danh sách liên hệ:", error);
        Swal.fire({ icon: 'error', title: 'Lỗi', text: 'Không thể tải dữ liệu.' });
    } finally {
        isLoading.value = false;
    }
};

// Xem chi tiết & Đổi trạng thái
const viewContact = async (contact) => {
    // Nếu tin nhắn đang là 'new', khi mở lên xem tự động chuyển thành 'read'
    if (contact.status === 'new') {
        updateStatus(contact.id, 'read', false);
        contact.status = 'read'; // Cập nhật ngay trên UI
    }

    // Hiển thị nội dung chi tiết bằng SweetAlert2
    const result = await Swal.fire({
        title: contact.subject,
        html: `
            <div class="text-start">
                <p><strong>Người gửi:</strong> ${contact.name}</p>
                <p><strong>Email:</strong> ${contact.email}</p>
                <p><strong>SĐT:</strong> ${contact.phone || 'Không cung cấp'}</p>
                <hr>
                <p class="mb-1"><strong>Nội dung:</strong></p>
                <div class="p-3 bg-light rounded border" style="white-space: pre-wrap;">${contact.message}</div>
            </div>
        `,
        width: 600,
        showCancelButton: true,
        showDenyButton: contact.status !== 'replied',
        confirmButtonText: 'Đóng',
        denyButtonText: '<i class="bi bi-check2-circle"></i> Đánh dấu đã phản hồi',
        cancelButtonText: 'Xóa',
        confirmButtonColor: '#6c757d',
        denyButtonColor: '#198754',
        cancelButtonColor: '#dc3545',
    });

    if (result.isDenied) {
        // Nút "Đánh dấu đã phản hồi"
        updateStatus(contact.id, 'replied', true);
        contact.status = 'replied';
    } else if (result.dismiss === Swal.DismissReason.cancel) {
        // Nút "Xóa"
        deleteContact(contact);
    }
};

// Gọi API Cập nhật trạng thái
const updateStatus = async (id, status, showToast = true) => {
    try {
        await api.patch(`/admin/contacts/${id}/status`, { status });
        if (showToast) {
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Đã cập nhật trạng thái',
                showConfirmButton: false,
                timer: 2000
            });
        }
    } catch (error) {
        console.error("Lỗi cập nhật trạng thái", error);
    }
};

// Xóa liên hệ
const deleteContact = async (contact) => {
    const { isConfirmed } = await Swal.fire({
        title: 'Xóa liên hệ này?',
        text: `Bạn sẽ xóa vĩnh viễn tin nhắn từ ${contact.name}.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Xóa vĩnh viễn',
        cancelButtonText: 'Hủy'
    });

    if (!isConfirmed) return;

    try {
        const res = await api.delete(`/admin/contacts/${contact.id}`);
        if (res.data.success) {
            Swal.fire({ icon: 'success', title: 'Đã xóa', timer: 1500, showConfirmButton: false });
            contacts.value = contacts.value.filter(c => c.id !== contact.id);
        }
    } catch (error) {
        Swal.fire({ icon: 'error', title: 'Lỗi', text: 'Không thể xóa lúc này.' });
    }
};

// Helpers
const getStatusText = (status) => {
    const map = { 'new': 'Mới', 'read': 'Đã xem', 'replied': 'Đã phản hồi' };
    return map[status] || status;
};

const getStatusClass = (status) => {
    const map = { 'new': 'bg-danger', 'read': 'bg-secondary', 'replied': 'bg-success' };
    return map[status] || 'bg-secondary';
};

const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

onMounted(() => {
    fetchContacts();
});
</script>

<style scoped>
.table th {
    font-weight: 600;
    color: #495057;
    text-transform: uppercase;
    font-size: 0.85rem;
}
</style>