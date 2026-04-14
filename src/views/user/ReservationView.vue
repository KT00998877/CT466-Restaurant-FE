<template>
    <DefaultLayout>
    <div class="reservation-page">
        <div class="reservation-container">

            <!-- ───────────────────────────────────────────────────── -->
            <!-- MÀN HÌNH 1: Danh sách bàn                            -->
            <!-- ───────────────────────────────────────────────────── -->
            <template v-if="screen === 'list'">
                <h1 class="page-title">Danh sách bàn </h1>

                <div v-if="loadingTables" class="loading">Đang tải danh sách bàn...</div>

                <div v-else class="tables-grid">
                    <div v-for="table in tables" :key="table.id" class="table-card"
                        :class="{ unavailable: table.status === 'unavailable' }">
                        <!-- Ảnh minh hoạ dùng chung -->
                        <div class="table-img-wrap">
                            <img :src="tableImg" :alt="'Bàn ' + table.name" class="table-img" />
                            <span class="table-badge" :class="table.status">
                                {{ table.status === 'unavailable' ? 'Không khả dụng' : 'Còn trống' }}
                            </span>
                        </div>

                        <div class="table-info">
                            <h3 class="table-name">Bàn {{ table.name }}</h3>
                            <p class="table-cap">👥 Sức chứa: <strong>{{ table.capacity }} khách</strong></p>
                        </div>

                        <button class="btn-book" :disabled="table.status === 'unavailable'" @click="openBooking(table)">
                            {{ table.status === 'unavailable' ? 'Không khả dụng' : 'Đặt bàn này' }}
                        </button>
                    </div>
                </div>
            </template>

            <!-- ───────────────────────────────────────────────────── -->
            <!-- MÀN HÌNH 2: Form đặt bàn                             -->
            <!-- ───────────────────────────────────────────────────── -->
            <template v-else-if="screen === 'form'">
                <button class="btn-back" @click="backToList">← Quay lại danh sách</button>

                <h1 class="page-title"> Đặt Bàn {{ selectedTable?.name }}</h1>

                <!-- Tóm tắt bàn đã chọn -->
                <div class="selected-summary">
                    <img :src="tableImg" :alt="'Bàn ' + selectedTable?.name" class="summary-img" />
                    <div>
                        <p class="summary-name">Bàn {{ selectedTable?.name }}</p>
                        <p class="summary-cap">👥 Sức chứa tối đa {{ selectedTable?.capacity }} khách</p>
                    </div>
                </div>

                <div class="form-card">
                    <div v-if="successMsg" class="alert alert-success">{{ successMsg }}</div>
                    <div v-if="errorMsg" class="alert alert-error">{{ errorMsg }}</div>

                    <form @submit.prevent="submitReservation">
                        <!-- Ngày giờ + số khách -->
                        <div class="form-row">
                            <div class="form-group">
                                <label>Ngày &amp; Giờ đặt bàn *</label>
                                <input v-model="form.reserved_at" type="datetime-local" :min="minDateTime"
                                    :class="{ error: errors.reserved_at || conflictMsg }" @change="checkConflict" />
                                <span v-if="errors.reserved_at" class="field-error">{{ errors.reserved_at[0] }}</span>
                                <span v-if="conflictMsg" class="field-error">{{ conflictMsg }}</span>
                            </div>

                            <div class="form-group">
                                <label>Số khách *</label>
                                <input v-model.number="form.guests" type="number" min="1" :max="selectedTable?.capacity"
                                    placeholder="Nhập số khách" :class="{ error: errors.guests || guestError }" />
                                <span v-if="errors.guests" class="field-error">{{ errors.guests[0] }}</span>
                                <span v-if="guestError" class="field-error">{{ guestError }}</span>
                            </div>
                        </div>

                        <!-- Thông tin khách -->
                        <div class="form-row">
                            <div class="form-group">
                                <label>Họ và tên *</label>
                                <input v-model="form.customer_name" type="text" placeholder="Nguyễn Văn A"
                                    :class="{ error: errors.customer_name }" />
                                <span v-if="errors.customer_name" class="field-error">{{ errors.customer_name[0]
                                    }}</span>
                            </div>
                            <div class="form-group">
                                <label>Số điện thoại *</label>
                                <input v-model="form.customer_phone" type="tel" placeholder="0901234567"
                                    :class="{ error: errors.customer_phone }" />
                                <span v-if="errors.customer_phone" class="field-error">{{ errors.customer_phone[0]
                                    }}</span>
                            </div>
                        </div>

                        <div class="form-group">
                            <label>Ghi chú</label>
                            <textarea v-model="form.note" rows="3"
                                placeholder="Yêu cầu đặc biệt, dị ứng thức ăn, trang trí sinh nhật..."></textarea>
                        </div>

                        <button type="submit" class="btn-submit" :disabled="loading || !!conflictMsg || !!guestError">
                            <span v-if="loading" class="spinner"></span>
                            {{ loading ? 'Đang xử lý...' : '✅ Gửi yêu cầu đặt bàn' }}
                        </button>
                    </form>
                </div>
            </template>

            <!-- ───────────────────────────────────────────────────── -->
            <!-- MÀN HÌNH 3: Đặt bàn thành công                       -->
            <!-- ───────────────────────────────────────────────────── -->
            <template v-else-if="screen === 'success'">
                <div class="success-screen">
                    <div class="success-icon"></div>
                    <h2>Đặt bàn thành công!</h2>
                    <p>Chúng tôi đã nhận yêu cầu và sẽ xác nhận sớm nhất.</p>

                    <div class="success-detail">
                        <p>🪑 Bàn: <strong>{{ confirmedData?.table?.name }}</strong></p>
                        <p>🕐 Thời gian: <strong>{{ formatDate(confirmedData?.reserved_at) }}</strong></p>
                        <p>👥 Số khách: <strong>{{ confirmedData?.guests }}</strong></p>
                        <p>📞 SĐT: <strong>{{ confirmedData?.customer_phone }}</strong></p>
                    </div>

                    <div class="success-actions">
                        <button class="btn-primary" @click="backToList">Đặt thêm bàn</button>
                        <router-link to="/my-reservations" class="btn-outline">Xem lịch sử đặt bàn</router-link>
                    </div>
                </div>
            </template>

        </div>
    </div>
    </DefaultLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import  DefaultLayout  from '../layouts/DefaultLayout.vue'
import api from '@/services/api'
import { useAuth } from '@/composables/useAuth'
import tableImg from '@/assets/img/table.jpg'
const { user } = useAuth()

// ─── State ───────────────────────────────────────────────
const screen = ref('list')   // 'list' | 'form' | 'success'
const tables = ref([])
const selectedTable = ref(null)
const confirmedData = ref(null)
const loadingTables = ref(true)
const loading = ref(false)
const errorMsg = ref('')
const conflictMsg = ref('')
const errors = ref({})

const form = reactive({
    table_id: null,
    customer_name: user.value?.name || '',
    customer_phone: '',
    guests: 1,
    reserved_at: '',
    note: '',
})

// ─── Computed ────────────────────────────────────────────
const minDateTime = computed(() => {
    const now = new Date()
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
    return now.toISOString().slice(0, 16)
})

const guestError = computed(() => {
    if (!form.guests || !selectedTable.value) return ''
    if (form.guests < 1) return 'Số khách tối thiểu là 1.'
    if (form.guests > selectedTable.value.capacity)
        return `Bàn này chỉ chứa tối đa ${selectedTable.value.capacity} khách.`
    return ''
})

// ─── Lifecycle ───────────────────────────────────────────
onMounted(loadTables)

// ─── Methods ─────────────────────────────────────────────
async function loadTables() {
    loadingTables.value = true
    try {
        const { data } = await api.get('/tables')
        tables.value = data.tables
    } catch {
        // lỗi load bàn
    } finally {
        loadingTables.value = false
    }
}

function openBooking(table) {
    selectedTable.value = table
    form.table_id = table.id
    form.reserved_at = ''
    form.guests = 1
    form.customer_name = user.value?.name || ''
    form.customer_phone = ''
    form.note = ''
    conflictMsg.value = ''
    errorMsg.value = ''
    errors.value = {}
    screen.value = 'form'
    window.scrollTo({ top: 0, behavior: 'smooth' })
}

function backToList() {
    screen.value = 'list'
    loadTables()
    window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function checkConflict() {
    conflictMsg.value = ''
    if (!form.reserved_at || !form.table_id) return

    try {
        // Chúng ta gửi table_id và thời gian dự kiến lên
        const { data } = await api.get('/tables/check-availability', {
            params: {
                table_id: form.table_id,
                reserved_at: form.reserved_at
            },
        })

        // Giả sử API trả về { available: false } nếu bị trùng trong khoảng 3 tiếng
        if (data.available === false) {
            conflictMsg.value = 'Bàn này đã có người đặt trong khoảng thời gian này . Vui lòng chọn giờ khác.'
        }
    } catch (error) {
        console.error("Lỗi kiểm tra trùng lịch:", error)
    }
}

async function submitReservation() {
    loading.value = true
    errorMsg.value = ''
    errors.value = {}

    try {
        const { data } = await api.post('/reservations', form)
        confirmedData.value = data.reservation
        screen.value = 'success'
        window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
        if (err.response?.status === 422) {
            errors.value = err.response.data.errors || {}
            errorMsg.value = err.response.data.message || ''
        } else if (err.response?.status === 401) {
            errorMsg.value = 'Vui lòng đăng nhập để đặt bàn.'
        } else {
            errorMsg.value = err.response?.data?.message || 'Đã xảy ra lỗi.'
        }
    } finally {
        loading.value = false
    }
}

function formatDate(dt) {
    if (!dt) return ''
    return new Date(dt).toLocaleString('vi-VN', {
        weekday: 'short', year: 'numeric', month: '2-digit',
        day: '2-digit', hour: '2-digit', minute: '2-digit',
    })
}
</script>

<style scoped>
.reservation-page {
    min-height: 100vh;
    background: #f7f8fc;
    padding: 2rem 1rem;
    font-family: 'Segoe UI', sans-serif;
}

.reservation-container {
    max-width: 960px;
    margin: 0 auto;
}

.page-title {
    font-size: 1.9rem;
    font-weight: 700;
    color: #1a202c;
    margin-bottom: 1.5rem;
}

/* ── Danh sách bàn ── */
.loading {
    text-align: center;
    color: #a0aec0;
    padding: 3rem;
    font-size: 1rem;
}

.tables-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 1.4rem;
}

.table-card {
    background: #fff;
    border-radius: 14px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, .07);
    overflow: hidden;
    transition: transform .2s, box-shadow .2s;
    display: flex;
    flex-direction: column;
}

.table-card:not(.unavailable):hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, .12);
}

.table-card.unavailable {
    opacity: .6;
}

.table-img-wrap {
    position: relative;
}

.table-img {
    width: 100%;
    height: 170px;
    object-fit: cover;
    display: block;
}

.table-badge {
    position: absolute;
    top: 10px;
    right: 10px;
    padding: .25rem .7rem;
    border-radius: 99px;
    font-size: .78rem;
    font-weight: 700;
}

.table-badge.available {
    background: #c6f6d5;
    color: #276749;
}

.table-badge.unavailable {
    background: #e2e8f0;
    color: #718096;
}

.table-info {
    padding: 1rem 1.1rem .6rem;
    flex: 1;
}

.table-name {
    font-size: 1.15rem;
    font-weight: 700;
    color: #2d3748;
    margin: 0 0 .3rem;
}

.table-cap {
    font-size: .9rem;
    color: #718096;
    margin: 0;
}

.btn-book {
    margin: .8rem 1.1rem 1.1rem;
    padding: .6rem 1rem;
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: .95rem;
    font-weight: 600;
    cursor: pointer;
    transition: opacity .2s;
}

.btn-book:hover:not(:disabled) {
    opacity: .88;
}

.btn-book:disabled {
    background: #e2e8f0;
    color: #a0aec0;
    cursor: not-allowed;
}

/* ── Form đặt bàn ── */
.btn-back {
    background: none;
    border: none;
    color: #667eea;
    font-size: .95rem;
    font-weight: 600;
    cursor: pointer;
    padding: 0;
    margin-bottom: 1rem;
    display: inline-flex;
    align-items: center;
    gap: .3rem;
}

.btn-back:hover {
    text-decoration: underline;
}

.selected-summary {
    display: flex;
    align-items: center;
    gap: 1.2rem;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, .06);
    padding: 1rem 1.4rem;
    margin-bottom: 1.4rem;
}

.summary-img {
    width: 90px;
    height: 65px;
    object-fit: cover;
    border-radius: 8px;
}

.summary-name {
    font-size: 1.1rem;
    font-weight: 700;
    color: #2d3748;
    margin: 0 0 .3rem;
}

.summary-cap {
    font-size: .88rem;
    color: #718096;
    margin: 0;
}

.form-card {
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, .07);
    padding: 1.8rem;
}

.form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
}

@media (max-width: 600px) {
    .form-row {
        grid-template-columns: 1fr;
    }
}

.form-group {
    margin-bottom: 1rem;
}

.form-group label {
    display: block;
    font-size: .88rem;
    font-weight: 600;
    color: #4a5568;
    margin-bottom: .35rem;
}

.form-group input,
.form-group textarea {
    width: 100%;
    padding: .65rem .9rem;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: .95rem;
    color: #2d3748;
    outline: none;
    transition: border-color .2s;
    box-sizing: border-box;
}

.form-group input:focus,
.form-group textarea:focus {
    border-color: #667eea;
}

.form-group input.error {
    border-color: #e53e3e;
}

.field-error {
    color: #e53e3e;
    font-size: .82rem;
    margin-top: .25rem;
    display: block;
}

.btn-submit {
    width: 100%;
    padding: .8rem;
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: .5rem;
    transition: opacity .2s;
    margin-top: .5rem;
}

.btn-submit:hover:not(:disabled) {
    opacity: .9;
}

.btn-submit:disabled {
    opacity: .55;
    cursor: not-allowed;
}

/* ── Thành công ── */
.success-screen {
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, .08);
    padding: 3rem 2rem;
    text-align: center;
    max-width: 480px;
    margin: 0 auto;
}

.success-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
}

.success-screen h2 {
    font-size: 1.7rem;
    font-weight: 700;
    color: #1a202c;
    margin-bottom: .5rem;
}

.success-screen p {
    color: #718096;
    margin-bottom: 1rem;
}

.success-detail {
    background: #f7fafc;
    border-radius: 10px;
    padding: 1rem 1.4rem;
    text-align: left;
    line-height: 2.2;
    font-size: .95rem;
    color: #4a5568;
    margin: 1.2rem 0;
}

.success-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
}

.btn-primary {
    padding: .65rem 1.4rem;
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: .95rem;
    font-weight: 600;
    cursor: pointer;
}

.btn-outline {
    padding: .65rem 1.4rem;
    border: 2px solid #667eea;
    color: #667eea;
    border-radius: 8px;
    font-size: .95rem;
    font-weight: 600;
    text-decoration: none;
    display: inline-block;
}

/* Misc */
.spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, .4);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin .6s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.alert {
    padding: .8rem 1rem;
    border-radius: 8px;
    font-size: .9rem;
    margin-bottom: 1rem;
}

.alert-error {
    background: #fff5f5;
    color: #c53030;
    border: 1px solid #fed7d7;
}

.alert-success {
    background: #f0fff4;
    color: #276749;
    border: 1px solid #9ae6b4;
}
</style>