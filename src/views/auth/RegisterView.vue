<template>
    <div class="auth-page">
        <div class="d-flex flex-column align-items-center">
            <div class="text-center text-white mb-4">
                <h2 class="fw-bold display-6 mb-2">Chào mừng quý khách đến với</h2>
                <h3 class="fw-bold mb-3">Nhà Hàng của chúng tôi</h3>
                <p class="fs-6 opacity-75">Rất hân hạnh được phục vụ quý khách</p>
            </div>

            <div class="auth-card">
                <h1 class="auth-title">{{ step === 1 ? 'Tạo Tài Khoản' : 'Xác Thực Email' }}</h1>

                <!-- THÔNG BÁO LỖI -->
                <div v-if="errorMsg" class="custom-alert alert-danger">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor"
                        viewBox="0 0 16 16" class="alert-icon">
                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                        <path
                            d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z" />
                    </svg>
                    <span>{{ errorMsg }}</span>
                </div>

                <!-- THÔNG BÁO THÀNH CÔNG -->
                <div v-if="successMsg" class="custom-alert alert-success">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor"
                        viewBox="0 0 16 16" class="alert-icon">
                        <path
                            d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" />
                    </svg>
                    <span>{{ successMsg }}</span>
                </div>

                <!-- BƯỚC 1: FORM ĐĂNG KÝ -->
                <form v-if="step === 1" @submit.prevent="handleRegister">
                    <div class="form-group">
                        <label>Họ và tên</label>
                        <input v-model="form.name" type="text" placeholder="Nguyễn Văn A"
                            :class="{ error: errors.name }" />
                        <span v-if="errors.name" class="field-error">{{ errors.name[0] }}</span>
                    </div>

                  <div class="form-group">
                        <label>Email</label>
                        <input v-model="form.email" type="email" placeholder="you@example.com"
                            :class="{ error: errors.email }" />
                        <span v-if="errors.email" class="field-error">{{ errors.email[0] }}</span>
                    </div>

                   <div class="form-group">
                        <label>Số điện thoại</label>
                        <input v-model="form.phone" type="tel" placeholder="0901234567" maxlength="10"
                            @input="validatePhone" :class="{ error: errors.phone }" />
                        <span v-if="errors.phone" class="field-error">{{ errors.phone[0] }}</span>
                    </div>

                    <div class="form-group">
                        <label>Mật khẩu</label>
                        <input v-model="form.password" type="password" placeholder="Tối thiểu 8 ký tự"
                            :class="{ error: errors.password }" />
                        <span v-if="errors.password" class="field-error">{{ errors.password[0] }}</span>
                    </div>

                    <div class="form-group">
                        <label>Xác nhận mật khẩu</label>
                        <input v-model="form.password_confirmation" type="password" placeholder="Nhập lại mật khẩu" />
                    </div>

                    <button type="submit" class="btn-primary" :disabled="loading">
                        <span v-if="loading" class="spinner"></span>
                        {{ loading ? 'Đang xử lý...' : 'Đăng Ký' }}
                    </button>
                </form>

                <!-- BƯỚC 2: FORM NHẬP OTP -->
                <form v-if="step === 2" @submit.prevent="handleVerifyOtp">
                    <p class="text-center text-muted mb-4">Vui lòng nhập mã 6 số được gửi đến email <strong>{{
                        form.email }}</strong></p>

                    <div class="form-group">
                        <label>Mã xác thực (OTP)</label>
                        <input v-model="otpCode" type="text" placeholder="Nhập mã 6 số" maxlength="6"
                            class="text-center fw-bold fs-4" style="letter-spacing: 5px;" />
                    </div>

                    <button type="submit" class="btn-primary" :disabled="loading">
                        <span v-if="loading" class="spinner"></span>
                        {{ loading ? 'Đang kiểm tra...' : 'Xác nhận & Hoàn tất' }}
                    </button>

                    <div class="text-center mt-3">
                        <button type="button" class="btn-link" @click="step = 1"
                            style="background:none; border:none; color:#0d6efd; text-decoration:underline;">
                            Quay lại sửa email
                        </button>
                    </div>
                </form>

                <p class="auth-footer" v-if="step === 1">
                    Đã có tài khoản?
                    <router-link to="/login">Đăng nhập</router-link>
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
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
})

const step = ref(1) // Quản lý trạng thái màn hình: 1 = Form đăng ký, 2 = Nhập OTP
const otpCode = ref('')
const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')
const errors = ref({})

// Biến lưu trữ timeout để xóa thông báo
let alertTimeout = null

// Hàm hiển thị thông báo và tự động ẩn sau 4 giây
function showMessage(type, message) {
    if (alertTimeout) clearTimeout(alertTimeout)

    if (type === 'error') {
        errorMsg.value = message
        successMsg.value = ''
    } else {
        successMsg.value = message
        errorMsg.value = ''
    }

    alertTimeout = setTimeout(() => {
        errorMsg.value = ''
        successMsg.value = ''
    }, 4000)
}

// Ham validate theo so dien thoai
function validatePhone() {
    
    form.phone = form.phone.replace(/[^0-9]/g, '');

    
    if (!form.phone) {
        errors.value.phone = ['Vui lòng nhập số điện thoại.'];
    }
    // Nếu đã gõ ít nhất 2 số mà không bắt đầu bằng 03, 05, 07, 08, 09 (VD: gõ 00 như hình)
    else if (form.phone.length >= 2 && !/^(0[3|5|7|8|9])/.test(form.phone)) {
        errors.value.phone = ['Đầu số không hợp lệ (phải là 03, 05, 07, 08, 09).'];
    }
    // Nếu độ dài chưa đủ 10 số
    else if (form.phone.length > 0 && form.phone.length < 10) {
        errors.value.phone = ['Số điện thoại phải có đúng 10 chữ số.'];
    }
    // Nếu đúng hoàn toàn
    else {
        delete errors.value.phone; 
    }
}

// Hàm gọi lên API đăng ký (BƯỚC 1)
async function handleRegister() {
    loading.value = true
    errorMsg.value = ''
    successMsg.value = ''
    errors.value = {}

    // Gọi lại hàm validate để đề phòng người dùng bấm Submit luôn mà chưa chạm vào ô input
    validatePhone()

    // Nếu có bất kỳ lỗi nào ở SĐT thì dừng lại không gọi API
    if (errors.value.phone) {
        loading.value = false
        return
    }

    const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;

    if (!form.phone) {
        errors.value.phone = ['Vui lòng nhập số điện thoại.'];
        loading.value = false;
        return; // Dừng lại, không gọi API
    } else if (!phoneRegex.test(form.phone)) {
        errors.value.phone = ['Số điện thoại không đúng định dạng (VD: 0912345678).'];
        loading.value = false;
        return; // Dừng lại, không gọi API
    }
    // --- KẾT THÚC VALIDATE ---

    try {
        const response = await api.post('/register', form)
        successMsg.value = response.data.message
        step.value = 2 // Chuyển sang màn hình nhập OTP
    } catch (err) {
        if (err.response?.status === 422) {
            errors.value = err.response.data.errors || {}
        } else {
            // Dùng hàm showMessage bạn đã viết sẵn để hiển thị lỗi chung
            showMessage('error', err.response?.data?.message || 'Đã xảy ra lỗi, vui lòng thử lại.')
        }
    } finally {
        loading.value = false
    }
}

// Hàm gọi lên API xác thực OTP (BƯỚC 2)
async function handleVerifyOtp() {
    if (!otpCode.value || otpCode.value.length !== 6) {
        errorMsg.value = 'Vui lòng nhập đủ 6 số OTP.'
        return
    }

    loading.value = true
    errorMsg.value = ''
    successMsg.value = ''

    try {
        const response = await api.post('/register/verify-otp', {
            email: form.email,
            otp: otpCode.value
        })

        successMsg.value = 'Đăng ký thành công! Hãy đăng nhập để tiếp tục.'

        // (Tuỳ chọn) Lưu token vào localStorage ở đây nếu bạn muốn tự động đăng nhập luôn
        // localStorage.setItem('token', response.data.token)

        setTimeout(() => {
            router.push('/login') // Hoặc chuyển thẳng vào trang chủ router.push('/')
        }, 1500)

    } catch (err) {
        errorMsg.value = err.response?.data?.message || 'Mã xác thực không hợp lệ.'
    } finally {
        loading.value = false
    }
}
</script>

<style scoped src="@/assets/auth.css"></style>