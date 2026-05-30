<template>
    <div class="auth-page">
        <div class="d-flex flex-column align-items-center">
            <div class="text-center text-white mb-4">
                <h2 class="fw-bold display-6 mb-2">Khôi Phục Mật Khẩu</h2>
                <p class="fs-6 opacity-75">Đừng lo lắng, chúng tôi sẽ giúp bạn lấy lại quyền truy cập</p>
            </div>

            <div class="auth-card">
                <div v-if="errorMsg" class="custom-alert alert-danger">
                    <span>{{ errorMsg }}</span>
                </div>
                <div v-if="successMsg" class="custom-alert alert-success">
                    <span>{{ successMsg }}</span>
                </div>

                <!-- BƯỚC 1: NHẬP EMAIL -->
                <form v-if="step === 1" @submit.prevent="handleSendOtp">
                    <div class="form-group">
                        <label>Email đã đăng ký</label>
                        <input v-model="form.email" type="email" placeholder="Nhập email của bạn"
                            :class="{ error: errors.email }" />
                        <span v-if="errors.email" class="field-error">{{ errors.email[0] }}</span>
                    </div>

                    <button type="submit" class="btn-primary" :disabled="loading">
                        <span v-if="loading" class="spinner"></span>
                        {{ loading ? 'Đang gửi mã...' : 'Gửi mã OTP' }}
                    </button>
                </form>

                <!-- BƯỚC 2: NHẬP OTP -->
                <form v-if="step === 2" @submit.prevent="handleVerifyOtp">
                    <p class="text-center text-muted mb-3" style="font-size: 0.9rem;">
                        Mã OTP đã được gửi đến <strong>{{ form.email }}</strong>
                    </p>

                    <div class="form-group">
                        <label>Mã OTP</label>
                        <input v-model="form.otp" type="text" placeholder="Nhập mã 6 số" maxlength="6"
                            class="text-center fw-bold fs-4" style="letter-spacing: 5px;" />
                    </div>

                    <button type="submit" class="btn-primary" :disabled="loading">
                        <span v-if="loading" class="spinner"></span>
                        {{ loading ? 'Đang kiểm tra...' : 'Xác nhận OTP' }}
                    </button>

                    <div class="text-center mt-3">
                        <button type="button" @click="step = 1"
                            style="background:none; border:none; color:#0d6efd; text-decoration:underline;">
                            Quay lại nhập email khác
                        </button>
                    </div>
                </form>

                <!-- BƯỚC 3: NHẬP MẬT KHẨU MỚI -->
                <form v-if="step === 3" @submit.prevent="handleUpdatePassword">
                    <p class="text-center text-success fw-bold mb-3">Xác thực thành công!</p>

                    <div class="form-group">
                        <label>Mật khẩu mới</label>
                        <input v-model="form.password" type="password" placeholder="Tối thiểu 8 ký tự"
                            :class="{ error: errors.password }" />
                        <span v-if="errors.password" class="field-error">{{ errors.password[0] }}</span>
                    </div>

                    <div class="form-group">
                        <label>Xác nhận mật khẩu mới</label>
                        <input v-model="form.password_confirmation" type="password"
                            placeholder="Nhập lại mật khẩu mới" />
                    </div>

                    <button type="submit" class="btn-primary" :disabled="loading">
                        <span v-if="loading" class="spinner"></span>
                        {{ loading ? 'Đang xử lý...' : 'Lưu Mật Khẩu Mới' }}
                    </button>
                </form>

                <p class="auth-footer mt-4" v-if="step === 1">
                    Nhớ ra mật khẩu? <router-link to="/login">Đăng nhập ngay</router-link>
                </p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../services/api'

const router = useRouter()

const form = reactive({
    email: '',
    otp: '',
    token: '', // Thêm token để lưu giữ quyền đổi mật khẩu
    password: '',
    password_confirmation: ''
})

const step = ref(1)
const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')
const errors = ref({})
let alertTimeout = null

function showMessage(type, message) {
    if (alertTimeout) clearTimeout(alertTimeout)
    if (type === 'error') {
        errorMsg.value = message; successMsg.value = ''
    } else {
        successMsg.value = message; errorMsg.value = ''
    }
    alertTimeout = setTimeout(() => { errorMsg.value = ''; successMsg.value = '' }, 4000)
}

// BƯỚC 1: Gọi gửi Email
async function handleSendOtp() {
    loading.value = true
    errors.value = {}
    try {
        const response = await api.post('/forgot-password', { email: form.email })
        showMessage('success', response.data.message)
        step.value = 2 // Sang bước nhập OTP
    } catch (err) {
        if (err.response?.status === 422) {
            errors.value = err.response.data.errors || {}
        } else {
            showMessage('error', err.response?.data?.message || 'Có lỗi xảy ra.')
        }
    } finally {
        loading.value = false
    }
}

// BƯỚC 2: Gọi xác thực OTP
async function handleVerifyOtp() {
    if (!form.otp || form.otp.length !== 6) {
        showMessage('error', 'Vui lòng nhập đủ 6 số OTP.')
        return
    }
    loading.value = true
    errors.value = {}
    try {
        const response = await api.post('/forgot-password/verify-otp', {
            email: form.email,
            otp: form.otp
        })
        showMessage('success', response.data.message)
        form.token = response.data.reset_token // Lưu token để dùng cho bước sau
        step.value = 3 // Sang bước nhập mật khẩu mới
    } catch (err) {
        showMessage('error', err.response?.data?.message || 'Mã xác thực không hợp lệ.')
    } finally {
        loading.value = false
    }
}

// BƯỚC 3: Gọi lưu mật khẩu mới
async function handleUpdatePassword() {
    loading.value = true
    errors.value = {}
    try {
        const response = await api.post('/forgot-password/update', form)
        showMessage('success', response.data.message + ' .Vui lòng đăng nhập lại với mật khẩu mới.')
        setTimeout(() => router.push('/login'), 2000)
    } catch (err) {
        if (err.response?.status === 422) {
            errors.value = err.response.data.errors || {}
        } else {
            showMessage('error', err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.')
            // Nếu lỗi do phiên hết hạn (lỗi 403), đẩy về bước 1
            if (err.response?.status === 403) step.value = 1;
        }
    } finally {
        loading.value = false
    }
}
</script>

<style scoped src="@/assets/auth.css"></style>