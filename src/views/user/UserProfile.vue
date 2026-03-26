<template>
    <DefaultLayout>
        <div class="profile-wrapper">
            <h2 class="page-title">Thông tin người dùng</h2>

            <div v-if="loading" class="loading">Đang tải thông tin...</div>

            <div v-else class="profile-card">
                <!-- Header Banner -->
                <div class="profile-banner">
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

                <!-- Alert -->
                <div v-if="message" :class="['alert', isError ? 'alert-danger' : 'alert-success']">
                    {{ message }}
                </div>

                <!-- Info Grid -->
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

                <!-- Avatar Upload Row -->
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

            <!-- Edit Modal -->
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

            <!-- Password Modal -->
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

const loading = ref(true);
const saving = ref(false);
const savingPassword = ref(false);
const uploadingAvatar = ref(false);
const message = ref('');
const isError = ref(false);
const showEditModal = ref(false);
const showPasswordModal = ref(false);

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

const memberTier = computed(() => {
    // Customize tier logic based on points
    if (form.points >= 1000) return 'Vàng';
    if (form.points >= 500) return 'Bạc';
    return 'Đồng';
});

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
});
</script>

<style scoped>
.profile-wrapper {
    max-width: 720px;
    margin: 30px auto;
    padding: 0 16px;
    font-family: 'Segoe UI', sans-serif;
}

.page-title {
    text-align: center;
    font-size: 1.4rem;
    font-weight: 700;
    margin-bottom: 20px;
    color: #1a1a2e;
}

.loading {
    text-align: center;
    padding: 40px;
    color: #666;
}

.profile-card {
    background: #fff;
    border: 1px solid #e0e0e0;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

/* --- Banner --- */
.profile-banner {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 24px 28px;
    background: linear-gradient(135deg, #6b3a2a 0%, #8b5a3a 40%, #c49a6c 80%, #d4b896 100%);
    position: relative;
}

.avatar-section {
    flex-shrink: 0;
}

.avatar-wrapper {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    border: 3px solid rgba(255, 255, 255, 0.5);
    cursor: pointer;
    position: relative;
    overflow: hidden;
    background: rgba(0, 0, 0, 0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: border-color 0.2s;
}

.avatar-wrapper:hover .avatar-overlay {
    opacity: 1;
}

.avatar-wrapper:hover {
    border-color: #fff;
}

.avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.avatar-placeholder {
    color: rgba(255, 255, 255, 0.7);
    width: 48px;
    height: 48px;
}

.avatar-placeholder svg {
    width: 48px;
    height: 48px;
}

.avatar-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s;
    color: #fff;
}

.banner-info {
    color: #fff;
}

.user-name {
    font-size: 1.3rem;
    font-weight: 700;
    margin-bottom: 6px;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.user-badge {
    margin-bottom: 4px;
}

.badge-tier {
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.5);
    border-radius: 20px;
    padding: 2px 12px;
    font-size: 0.78rem;
    font-weight: 600;
    backdrop-filter: blur(4px);
}

.user-points {
    font-size: 0.85rem;
    opacity: 0.85;
}

/* --- Alert --- */
.alert {
    margin: 12px 20px 0;
    padding: 10px 14px;
    border-radius: 6px;
    font-size: 0.88rem;
}

.alert-success {
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
}

.alert-danger {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
}

/* --- Info Grid (2 columns) --- */
.info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
    padding: 18px 28px;
    border-bottom: 1px solid #f0f0f0;
}

.info-item {
    padding: 10px 0;
    display: flex;
    gap: 6px;
    align-items: baseline;
    font-size: 0.92rem;
}

.info-item:nth-child(odd) {
    border-right: 1px solid #f0f0f0;
    padding-right: 24px;
}

.info-item:nth-child(even) {
    padding-left: 24px;
}

.info-label {
    font-weight: 600;
    color: #444;
    white-space: nowrap;
}

.info-value {
    color: #333;
}

.status-verified {
    color: #28a745;
    font-weight: 500;
}

/* --- Upload Row --- */
.upload-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 28px;
    gap: 12px;
    flex-wrap: wrap;
}

.upload-group {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}

.file-label {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 7px 12px;
    border: 1px solid #ccc;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.84rem;
    background: #f8f8f8;
    white-space: nowrap;
    transition: background 0.15s;
}

.file-label:hover {
    background: #eee;
}

.file-name {
    font-size: 0.82rem;
    color: #888;
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.btn-upload {
    padding: 7px 18px;
    background: linear-gradient(135deg, #a855f7, #7c3aed);
    color: #fff;
    border: none;
    border-radius: 20px;
    cursor: pointer;
    font-size: 0.84rem;
    font-weight: 600;
    transition: opacity 0.2s;
}

.btn-upload:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.action-buttons {
    display: flex;
    gap: 8px;
}

.btn-password {
    padding: 7px 18px;
    background: linear-gradient(135deg, #f5a623, #e8931a);
    color: #fff;
    border: none;
    border-radius: 20px;
    cursor: pointer;
    font-size: 0.84rem;
    font-weight: 600;
    transition: opacity 0.2s;
}

.btn-password:hover {
    opacity: 0.9;
}

.btn-edit {
    padding: 7px 18px;
    background: linear-gradient(135deg, #a855f7, #7c3aed);
    color: #fff;
    border: none;
    border-radius: 20px;
    cursor: pointer;
    font-size: 0.84rem;
    font-weight: 600;
    transition: opacity 0.2s;
}

.btn-edit:hover {
    opacity: 0.9;
}

/* --- Modals --- */
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999;
}

.modal-box {
    background: #fff;
    border-radius: 12px;
    padding: 28px;
    width: 100%;
    max-width: 420px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
}

.modal-title {
    font-size: 1.1rem;
    font-weight: 700;
    margin-bottom: 20px;
    color: #1a1a2e;
}

.form-group {
    margin-bottom: 14px;
}

.form-group label {
    display: block;
    margin-bottom: 5px;
    font-size: 0.88rem;
    font-weight: 600;
    color: #444;
}

.form-group input {
    width: 100%;
    padding: 9px 12px;
    border: 1px solid #ccc;
    border-radius: 6px;
    font-size: 0.9rem;
    box-sizing: border-box;
    transition: border-color 0.2s;
}

.form-group input:focus {
    outline: none;
    border-color: #a855f7;
}

.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 20px;
}

.btn-cancel {
    padding: 8px 20px;
    background: #f0f0f0;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.88rem;
    color: #555;
    transition: background 0.15s;
}

.btn-cancel:hover {
    background: #e0e0e0;
}

.btn-save {
    padding: 8px 20px;
    background: linear-gradient(135deg, #a855f7, #7c3aed);
    color: #fff;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.88rem;
    font-weight: 600;
    transition: opacity 0.2s;
}

.btn-save:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.btn-save:not(:disabled):hover {
    opacity: 0.9;
}

/* Responsive */
@media (max-width: 480px) {
    .info-grid {
        grid-template-columns: 1fr;
    }

    .info-item:nth-child(odd) {
        border-right: none;
        padding-right: 0;
    }

    .info-item:nth-child(even) {
        padding-left: 0;
    }

    .upload-row {
        flex-direction: column;
        align-items: flex-start;
    }
}
</style>