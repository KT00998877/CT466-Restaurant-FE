<template>
    <div class="auth-page">
        <div class="auth-card">
            <h1 class="auth-title">Tạo Tài Khoản</h1>

            <div v-if="errorMsg" class="alert alert-error">{{ errorMsg }}</div>
            <div v-if="successMsg" class="alert alert-success">{{ successMsg }}</div>

            <form @submit.prevent="handleRegister">
                <div class="form-group">
                    <label>Họ và tên</label>
                    <input v-model="form.name" type="text" placeholder="Nguyễn Văn A" :class="{ error: errors.name }" />
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
                    <input v-model="form.phone" type="tel" placeholder="0901234567" :class="{ error: errors.phone }" />
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

            <p class="auth-footer">
                Đã có tài khoản?
                <router-link to="/login">Đăng nhập</router-link>
            </p>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { register } = useAuth()

// THÊM 'phone' VÀO TRONG REACTIVE FORM
const form = reactive({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
})

const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')
const errors = ref({})

async function handleRegister() {
    loading.value = true
    errorMsg.value = ''
    successMsg.value = ''
    errors.value = {}

    try {
        await register(form)
        router.push('/')
    } catch (err) {
        if (err.response?.status === 422) {
            errors.value = err.response.data.errors || {}
        } else {
            errorMsg.value = err.response?.data?.message || 'Đã xảy ra lỗi, vui lòng thử lại.'
        }
    } finally {
        loading.value = false
    }
}
</script>

<style scoped src="@/assets/auth.css"></style>