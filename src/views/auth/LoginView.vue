<template>
    <div class="auth-page">
        <div class="auth-card">
            <h1 class="auth-title">Đăng Nhập</h1>

            <div v-if="errorMsg" class="alert alert-error">{{ errorMsg }}</div>

            <form @submit.prevent="handleLogin">
                <div class="form-group">
                    <label>Email</label>
                    <input v-model="form.email" type="email" placeholder="you@example.com"
                        :class="{ error: errors.email }" autocomplete="email" />
                    <span v-if="errors.email" class="field-error">{{ errors.email[0] }}</span>
                </div>

                <div class="form-group">
                    <label>Mật khẩu</label>
                    <input v-model="form.password" type="password" placeholder="••••••••"
                        :class="{ error: errors.password }" autocomplete="current-password" />
                    <span v-if="errors.password" class="field-error">{{ errors.password[0] }}</span>
                </div>

                <button type="submit" class="btn-primary" :disabled="loading">
                    <span v-if="loading" class="spinner"></span>
                    {{ loading ? 'Đang xử lý...' : 'Đăng Nhập' }}
                </button>
            </form>

            <p class="auth-footer">
                Chưa có tài khoản?
                <router-link to="/register">Đăng ký ngay</router-link>
            </p>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { login } = useAuth()

const form = reactive({ email: '', password: '' })
const loading = ref(false)
const errorMsg = ref('')
const errors = ref({})

async function handleLogin() {
    loading.value = true
    errorMsg.value = ''
    errors.value = {}

    try {
        // Giả sử hàm login của bạn trả về data từ axios (response.data)
        const data = await login(form)

        // Lấy role từ thông tin user trả về
        const role = data.user?.role

        if (role === 'admin') {
            router.push('/admin')
        } else if (role === 'cashier') {
            router.push('/cashier')
        } else if (role === 'waiter') {
            router.push('/waiter')
        } else if (role === 'kitchen') {
            router.push('/kitchen')
        } else {
            router.push('/') 
        }

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