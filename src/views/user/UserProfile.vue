<template>
    <DefaultLayout>
        <div class="profile-wrapper">
            <h2 class="page-title">THÔNG TIN NGƯỜI DÙNG</h2>

            <div v-if="loading" class="loading">Đang tải thông tin...</div>

            <div v-else>
                <div class="profile-card">
                    <div class="profile-banner" :class="bannerClass">
                        <div class="avatar-section">
                            <div class="avatar-wrapper" @click="triggerAvatarUpload">
                                <img v-if="avatarPreview" :src="avatarPreview" class="avatar-img" alt="Avatar" />
                                <div v-else class="avatar-placeholder">
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path
                                            d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                                    </svg>
                                </div>
                                <div class="avatar-overlay">
                                    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                                        <path
                                            d="M12 15.2A3.2 3.2 0 1 1 15.2 12 3.2 3.2 0 0 1 12 15.2zm6.4-10.4h-1.76l-1.6-2.4H8.96l-1.6 2.4H5.6A2.4 2.4 0 0 0 3.2 7.2v9.6A2.4 2.4 0 0 0 5.6 19.2h12.8a2.4 2.4 0 0 0 2.4-2.4V7.2a2.4 2.4 0 0 0-2.4-2.4z" />
                                    </svg>
                                </div>
                            </div>
                            <input ref="avatarInput" type="file" accept="image/*" style="display:none"
                                @change="onAvatarChange" />
                        </div>
                        <div class="banner-info">
                            <div class="user-name">{{ form.name || 'Tên người dùng' }}</div>
                            <div class="user-badge">
                                <span class="badge-tier">{{ memberTier }}</span>
                            </div>
                            <div class="user-points">Điểm tích lũy: {{ form.points || 0 }}</div>
                        </div>
                    </div>

                    <div v-if="message" :class="['alert', isError ? 'alert-danger' : 'alert-success']">
                        {{ message }}
                    </div>

                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">Email:</span>
                            <span class="info-value">{{ form.email }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Vai trò:</span>
                            <span class="info-value">{{ form.role }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Trạng thái:</span>
                            <span class="info-value status-verified">{{ form.status || 'Đã xác nhận' }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Số điện thoại:</span>
                            <span class="info-value">{{ form.phone || 'Chưa có' }}</span>
                        </div>
                    </div>

                    <div class="upload-row">
                        <div class="upload-group">
                            <label class="file-label" @click="triggerAvatarUpload">
                                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                    <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z" />
                                </svg>
                                Chọn tập tin...
                            </label>
                            <span class="file-name">{{ avatarFileName || 'Chưa chọn tập tin.' }}</span>
                            <button type="button" class="btn-upload" @click="uploadAvatar"
                                :disabled="!avatarFile || uploadingAvatar">
                                {{ uploadingAvatar ? 'Đang tải...' : 'Tải ảnh lên' }}
                            </button>
                        </div>
                        <div class="action-buttons">
                            <button type="button" class="btn-password" @click="showPasswordModal = true">Đổi mật
                                khẩu</button>
                            <button type="button" class="btn-edit" @click="showEditModal = true">Chỉnh sửa thông
                                tin</button>
                        </div>
                    </div>
                </div>

                <div class="profile-card point-history-card" style="margin-top: 20px;">
                    <div class="history-header" @click="isHistoryExpanded = !isHistoryExpanded"
                        style="display: flex; justify-content: space-between; align-items: center; cursor: pointer;">
                        <h3 class="section-title" style="margin: 0;">Lịch sử tích điểm</h3>
                        <svg :style="{ transform: isHistoryExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }"
                            viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor"
                            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </div>

                    <div v-show="isHistoryExpanded" class="history-content"
                        style="margin-top: 15px; border-top: 1px solid #eee; padding-top: 15px;">
                        <div v-if="loadingHistory" class="loading">Đang tải dữ liệu...</div>

                        <div v-else-if="pointHistory.length === 0" class="empty-state text-center"
                            style="color: #888; padding: 20px 0;">
                            Bạn chưa có giao dịch tích điểm nào.
                        </div>

                        <ul v-else class="history-list" style="list-style: none; padding: 0; margin: 0;">
                            <li v-for="item in pointHistory" :key="item.id" class="history-item"
                                style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                                <div class="history-info">
                                    <div class="history-note" style="font-weight: 600;">{{ item.note }}</div>
                                    <div class="history-date" style="font-size: 0.85rem; color: #777;">{{
                                        formatDate(item.created_at) }}</div>
                                </div>
                                <div class="history-points" :class="getPointClass(item.type)"
                                    style="font-size: 1.2rem; font-weight: bold;">
                                    {{ item.type === 'earn' ? '+' : '-' }}{{ item.points }}
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
                <div class="modal-box">
                    <h3 class="modal-title">Chỉnh sửa thông tin</h3>
                    <form @submit.prevent="saveProfile">
                        <div class="form-group">
                            <label>Họ và tên</label>
                            <input type="text" v-model="form.name" required placeholder="Nhập họ và tên..." />
                        </div>
                        <div class="form-group">
                            <label>Số điện thoại</label>
                            <input type="text" v-model="form.phone" placeholder="Nhập số điện thoại..." />
                        </div>
                        <div class="modal-actions">
                            <button type="button" class="btn-cancel" @click="showEditModal = false">Hủy</button>
                            <button type="submit" class="btn-save" :disabled="saving">
                                {{ saving ? 'Đang lưu...' : 'Lưu thay đổi' }}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div v-if="showPasswordModal" class="modal-overlay" @click.self="showPasswordModal = false">
                <div class="modal-box">
                    <h3 class="modal-title">Đổi mật khẩu</h3>
                    <form @submit.prevent="changePassword">
                        <div class="form-group">
                            <label>Mật khẩu hiện tại</label>
                            <input type="password" v-model="passwordForm.current" required
                                placeholder="Nhập mật khẩu hiện tại..." />
                        </div>
                        <div class="form-group">
                            <label>Mật khẩu mới</label>
                            <input type="password" v-model="passwordForm.new" required
                                placeholder="Nhập mật khẩu mới..." />
                        </div>
                        <div class="form-group">
                            <label>Xác nhận mật khẩu mới</label>
                            <input type="password" v-model="passwordForm.confirm" required
                                placeholder="Nhập lại mật khẩu mới..." />
                        </div>
                        <div class="modal-actions">
                            <button type="button" class="btn-cancel" @click="showPasswordModal = false">Hủy</button>
                            <button type="submit" class="btn-save" :disabled="savingPassword">
                                {{ savingPassword ? 'Đang xử lý...' : 'Xác nhận' }}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </DefaultLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import api from '../../services/api';
import DefaultLayout from '../layouts/DefaultLayout.vue';

// --- CÁC STATE CŨ CỦA BẠN ---
const loading = ref(true);
const saving = ref(false);
const savingPassword = ref(false);
const uploadingAvatar = ref(false);
const message = ref('');
const isError = ref(false);
const showEditModal = ref(false);
const showPasswordModal = ref(false);
const isHistoryExpanded = ref(false);

const avatarInput = ref(null);
const avatarFile = ref(null);
const avatarFileName = ref('');
const avatarPreview = ref('');

const form = reactive({
    name: '',
    email: '',
    phone: '',
    role: '',
    status: '',
    points: 0,
    avatar: ''
});

const passwordForm = reactive({
    current: '',
    new: '',
    confirm: ''
});

// --- CÁC STATE MỚI CHO LỊCH SỬ ĐIỂM ---
const pointHistory = ref([]);
const loadingHistory = ref(true);

const memberTier = computed(() => {
    // 100000 = Kim Cương, 10000 = Vàng, 1000 = Bạc, 100 = Đồng
    if (form.points >= 100000) return 'Kim Cương';
    if (form.points >= 10000) return 'Vàng';
    if (form.points >= 1000) return 'Bạc';
    if (form.points >= 100) return 'Đồng';
    return 'Thành viên mới'; // Dưới 100 điểm
});

// Thêm một computed property để lấy class tương ứng cho background banner
const bannerClass = computed(() => {
    if (form.points >= 100000) return 'tier-diamond';
    if (form.points >= 10000) return 'tier-gold';
    if (form.points >= 1000) return 'tier-silver';
    if (form.points >= 100) return 'tier-bronze';
    return 'tier-newbie';
});

// --- HÀM TẢI THÔNG TIN PROFILE (CŨ) ---
const fetchProfile = async () => {
    try {
        const response = await api.get('/profile');
        if (response.data.success) {
            const userData = response.data.data;
            form.name = userData.name;
            form.email = userData.email;
            form.phone = userData.phone;
            form.role = userData.role;
            form.status = userData.status || 'Đã xác nhận';
            form.points = userData.points || 0;
            form.avatar = userData.avatar || '';
            if (userData.avatar) {
                avatarPreview.value = userData.avatar;
            }
        }
    } catch (error) {
        console.error('Lỗi khi tải profile:', error);
        showMessage('Không thể tải thông tin tài khoản.', true);
    } finally {
        loading.value = false;
    }
};

// --- HÀM TẢI LỊCH SỬ TÍCH ĐIỂM (MỚI) ---
const fetchPointHistory = async () => {
    loadingHistory.value = true;
    try {
        const response = await api.get('/profile/point-history');
        if (response.data.success) {
            pointHistory.value = response.data.data;
        }
    } catch (error) {
        console.error("Lỗi khi tải lịch sử điểm:", error);
    } finally {
        loadingHistory.value = false;
    }
};

// --- CÁC HÀM TIỆN ÍCH HIỂN THỊ (MỚI) ---
const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    }).format(date);
};

const getPointClass = (type) => {
    if (type === 'earn') return 'text-success';
    if (type === 'deduct' || type === 'redeem') return 'text-danger';
    return 'text-secondary';
};

// --- CÁC HÀM XỬ LÝ SỰ KIỆN CŨ CỦA BẠN ---
const triggerAvatarUpload = () => {
    avatarInput.value?.click();
};

const onAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    avatarFile.value = file;
    avatarFileName.value = file.name;
    const reader = new FileReader();
    reader.onload = (ev) => { avatarPreview.value = ev.target.result; };
    reader.readAsDataURL(file);
};

const uploadAvatar = async () => {
    if (!avatarFile.value) return;
    uploadingAvatar.value = true;
    try {
        const formData = new FormData();
        formData.append('avatar', avatarFile.value);
        const response = await api.post('/profile/avatar', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (response.data.success) {
            showMessage('Tải ảnh lên thành công!', false);
            avatarFile.value = null;
            avatarFileName.value = '';
        }
    } catch (error) {
        showMessage(error.response?.data?.message || 'Có lỗi xảy ra khi tải ảnh.', true);
    } finally {
        uploadingAvatar.value = false;
    }
};

const saveProfile = async () => {
    saving.value = true;
    message.value = '';
    try {
        const response = await api.put('/profile', {
            name: form.name,
            phone: form.phone
        });
        if (response.data.success) {
            showMessage('Cập nhật thông tin thành công!', false);
            showEditModal.value = false;
        }
    } catch (error) {
        showMessage(error.response?.data?.message || 'Có lỗi xảy ra khi lưu thông tin.', true);
    } finally {
        saving.value = false;
    }
};

const changePassword = async () => {
    if (passwordForm.new !== passwordForm.confirm) {
        showMessage('Mật khẩu xác nhận không khớp.', true);
        return;
    }
    savingPassword.value = true;
    try {
        const response = await api.put('/profile/password', {
            current_password: passwordForm.current,
            new_password: passwordForm.new,
            new_password_confirmation: passwordForm.confirm
        });
        if (response.data.success) {
            showMessage('Đổi mật khẩu thành công!', false);
            showPasswordModal.value = false;
            passwordForm.current = '';
            passwordForm.new = '';
            passwordForm.confirm = '';
        }
    } catch (error) {
        showMessage(error.response?.data?.message || 'Có lỗi xảy ra khi đổi mật khẩu.', true);
    } finally {
        savingPassword.value = false;
    }
};

const showMessage = (msg, error = false) => {
    message.value = msg;
    isError.value = error;
    setTimeout(() => { message.value = ''; }, 3000);
};

onMounted(() => {
    fetchProfile();
    fetchPointHistory(); // Gọi hàm tải lịch sử điểm khi component được mount
});
</script>

<style scoped src="../../assets/UserProfile.css"></style>