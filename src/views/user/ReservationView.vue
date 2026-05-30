<template>
    <DefaultLayout>
        <div class="reservation-page">
            <div class="reservation-container">

                <!-- MÀN HÌNH 1: Danh sách bàn -->
                <template v-if="screen === 'list'">
                    <h1 class="page-title">Danh sách bàn</h1>
                    <div v-if="loadingTables" class="loading">Đang tải danh sách bàn...</div>
                    <div v-else class="tables-grid">
                        <div v-for="table in tables" :key="table.id" class="table-card"
                            :class="{ unavailable: table.status === 'unavailable' }">
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
                            <button class="btn-book" :disabled="table.status === 'unavailable'"
                                @click="openBooking(table)">
                                {{ table.status === 'unavailable' ? 'Không khả dụng' : 'Đặt bàn này' }}
                            </button>
                        </div>
                    </div>
                </template>

                <!-- MÀN HÌNH 2: Form đặt bàn -->
                <template v-else-if="screen === 'form'">
                    <button class="btn-back" @click="backToList">← Quay lại danh sách</button>
                    <h1 class="page-title">Đặt Bàn {{ selectedTable?.name }}</h1>

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
                            <div class="form-row">

                                <!-- ── Ngày & Giờ ── -->
                                <div class="form-group">
                                    <label>Ngày & Giờ đặt bàn *</label>
                                    <div class="datetime-picker-row">

                                        <!-- Date -->
                                        <div class="picker-wrap">
                                            <svg class="picker-svg-icon" viewBox="0 0 24 24" fill="none"
                                                stroke="currentColor" stroke-width="1.8" stroke-linecap="round"
                                                stroke-linejoin="round">
                                                <rect x="3" y="4" width="18" height="18" rx="2" />
                                                <line x1="16" y1="2" x2="16" y2="6" />
                                                <line x1="8" y1="2" x2="8" y2="6" />
                                                <line x1="3" y1="10" x2="21" y2="10" />
                                            </svg>
                                            <input v-model="form.reserved_date" type="date" :min="minDate"
                                                class="picker-input"
                                                :class="{ error: errors.reserved_at || conflictMsg }"
                                                @change="syncDateTime" />
                                        </div>

                                        <!-- Time — clock picker trigger -->
                                        <div class="picker-wrap clock-trigger" @click="toggleClock"
                                            :class="{ error: errors.reserved_at || conflictMsg }">
                                            <svg class="picker-svg-icon" viewBox="0 0 24 24" fill="none"
                                                stroke="currentColor" stroke-width="1.8" stroke-linecap="round"
                                                stroke-linejoin="round">
                                                <circle cx="12" cy="12" r="9" />
                                                <polyline points="12 7 12 12 15.5 15.5" />
                                            </svg>
                                            <span class="clock-display" :class="{ placeholder: !form.reserved_time }">
                                                {{ form.reserved_time ? formatTime12(form.reserved_time) : 'Chọn giờ' }}
                                            </span>
                                        </div>
                                    </div>

                                    <!-- Clock Picker Panel -->
                                    <div v-if="showClock" class="clock-panel" ref="clockPanelRef">
                                        <div class="clock-mode-tabs">
                                            <button type="button" :class="{ active: clockMode === 'hour' }"
                                                @click="clockMode = 'hour'">Giờ</button>
                                            <button type="button" :class="{ active: clockMode === 'minute' }"
                                                @click="clockMode = 'minute'">Phút</button>
                                        </div>

                                        <div class="clock-time-display">
                                            <span :class="{ active: clockMode === 'hour' }" @click="clockMode = 'hour'">
                                                {{ String(clockHour).padStart(2, '0') }}
                                            </span>
                                            <span class="colon">:</span>
                                            <span :class="{ active: clockMode === 'minute' }"
                                                @click="clockMode = 'minute'">
                                                {{ String(clockMinute).padStart(2, '0') }}
                                            </span>
                                            <div class="ampm-group">
                                                <button type="button" :class="{ active: clockAmPm === 'SA' }"
                                                    @click="clockAmPm = 'SA'">SA</button>
                                                <button type="button" :class="{ active: clockAmPm === 'CH' }"
                                                    @click="clockAmPm = 'CH'">CH</button>
                                            </div>
                                        </div>

                                        <div class="clock-face" ref="clockFaceRef" @mousedown="startDrag"
                                            @mousemove="onDrag" @mouseup="endDrag" @touchstart.prevent="startDrag"
                                            @touchmove.prevent="onDrag" @touchend="endDrag">
                                            <canvas ref="clockCanvas" width="220" height="220"></canvas>
                                        </div>

                                        <button type="button" class="btn-confirm-time" @click="confirmTime">
                                            ✓ Xác nhận
                                        </button>
                                    </div>

                                    <span v-if="errors.reserved_at" class="field-error">{{ errors.reserved_at[0]
                                        }}</span>
                                    <span v-if="conflictMsg" class="field-error">{{ conflictMsg }}</span>
                                </div>

                                <!-- Số khách -->
                                <div class="form-group">
                                    <label>Số khách *</label>
                                    <input v-model.number="form.guests" type="number" min="1"
                                        :max="selectedTable?.capacity" placeholder="Nhập số khách"
                                        :class="{ error: errors.guests || guestError }" />
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
                                    <input :value="form.customer_phone" @input="handlePhoneInput" type="tel"
                                        placeholder="0901234567"
                                        :class="{ error: errors.customer_phone || phoneError }" />
                                    <span v-if="phoneError" class="field-error">{{ phoneError }}</span>
                                    <span v-else-if="errors.customer_phone" class="field-error">{{
                                        errors.customer_phone[0] }}</span>
                                </div>
                            </div>

                            <div class="form-group">
                                <label>Ghi chú</label>
                                <textarea v-model="form.note" rows="3"
                                    placeholder="Yêu cầu đặc biệt, dị ứng thức ăn, trang trí sinh nhật..."></textarea>
                            </div>

                            <button type="submit" class="btn-submit" :disabled="loading || isFormInvalid">
                                <span v-if="loading" class="spinner"></span>
                                {{ loading ? 'Đang xử lý...' : 'Gửi yêu cầu đặt bàn' }}
                            </button>
                        </form>
                    </div>
                </template>

                <!-- MÀN HÌNH 3: Đặt bàn thành công -->
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
import { ref, reactive, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import DefaultLayout from '../layouts/DefaultLayout.vue'
import api from '@/services/api'
import { useAuth } from '@/composables/useAuth'
import tableImg from '@/assets/img/table.jpg'

const { user } = useAuth()

// ─── Screen state ─────────────────────────────────────────────────────────────
const screen = ref('list')
const tables = ref([])
const selectedTable = ref(null)
const confirmedData = ref(null)

// ─── Loading / error ──────────────────────────────────────────────────────────
const loadingTables = ref(true)
const loading = ref(false)
const errorMsg = ref('')
const conflictMsg = ref('')
const errors = ref({})

// ─── Form ─────────────────────────────────────────────────────────────────────
const form = reactive({
    table_id: null,
    customer_name: user.value?.name || '',
    customer_phone: '',
    guests: 1,
    reserved_date: '',   // 'YYYY-MM-DD'
    reserved_time: '',   // 'HH:MM' (24h, dùng gửi API)
    reserved_at: '',   // ghép lại cho API
    note: '',
})

// ─── Clock picker state ───────────────────────────────────────────────────────
const showClock = ref(false)
const clockMode = ref('hour')   // 'hour' | 'minute'
const clockHour = ref(12)       // 1-12
const clockMinute = ref(0)        // 0-59
const clockAmPm = ref('SA')     // 'SA' | 'CH'
const clockCanvas = ref(null)
const clockPanelRef = ref(null)
let isDragging = false

// ─── Computed ─────────────────────────────────────────────────────────────────
const minDate = computed(() => new Date().toISOString().slice(0, 10))

const guestError = computed(() => {
    if (!form.guests || !selectedTable.value) return ''
    if (form.guests < 1) return 'Số khách tối thiểu là 1.'
    if (form.guests > selectedTable.value.capacity)
        return `Bàn này chỉ chứa tối đa ${selectedTable.value.capacity} khách.`
    return ''
})

const phoneError = computed(() => {
    if (!form.customer_phone) return ''
    const phoneRegex = /^(0[3|5|7|8|9])[0-9]{8}$/
    if (form.customer_phone.length < 10) return 'Số điện thoại phải có 10 chữ số.'
    if (!phoneRegex.test(form.customer_phone)) return 'Số điện thoại không đúng định dạng (VD: 0912...)'
    return ''
})

const isFormInvalid = computed(() =>
    !!conflictMsg.value || !!guestError.value || !!phoneError.value ||
    !form.customer_phone || !form.reserved_at
)

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(() => {
    loadTables()
    document.addEventListener('mousedown', handleOutsideClick)
})
onUnmounted(() => document.removeEventListener('mousedown', handleOutsideClick))

watch(clockMode, () => nextTick(drawClock))
watch([clockHour, clockMinute], () => nextTick(drawClock))

// ─── Table methods ────────────────────────────────────────────────────────────
async function loadTables() {
    loadingTables.value = true
    try {
        const { data } = await api.get('/tables')
        tables.value = data.tables
    } catch { /* xử lý lỗi nếu cần */ }
    finally { loadingTables.value = false }
}

function openBooking(table) {
    selectedTable.value = table
    Object.assign(form, {
        table_id: table.id,
        reserved_date: '', reserved_time: '', reserved_at: '',
        guests: 1,
        customer_name: user.value?.name || '',
        customer_phone: '', note: '',
    })
    clockHour.value = 12; clockMinute.value = 0; clockAmPm.value = 'SA'
    conflictMsg.value = ''; errorMsg.value = ''; errors.value = {}
    screen.value = 'form'
    window.scrollTo({ top: 0, behavior: 'smooth' })
}

function backToList() {
    screen.value = 'list'
    showClock.value = false
    loadTables()
    window.scrollTo({ top: 0, behavior: 'smooth' })
}

// ─── DateTime sync ────────────────────────────────────────────────────────────
function syncDateTime() {
    if (form.reserved_date && form.reserved_time) {
        form.reserved_at = `${form.reserved_date}T${form.reserved_time}`
        checkConflict()
    } else {
        form.reserved_at = ''
        conflictMsg.value = ''
    }
}

// ─── Clock picker ─────────────────────────────────────────────────────────────
function toggleClock() {
    showClock.value = !showClock.value
    if (showClock.value) {
        clockMode.value = 'hour'
        nextTick(drawClock)
    }
}

function handleOutsideClick(e) {
    if (!showClock.value) return
    if (clockPanelRef.value && !clockPanelRef.value.contains(e.target)) {
        const trigger = e.target.closest('.clock-trigger')
        if (!trigger) showClock.value = false
    }
}

function getEventPos(e) {
    const canvas = clockCanvas.value
    const rect = canvas.getBoundingClientRect()
    const scaleX = 220 / rect.width, scaleY = 220 / rect.height
    const src = e.touches ? e.touches[0] : e
    return { x: (src.clientX - rect.left) * scaleX, y: (src.clientY - rect.top) * scaleY }
}

function angleToValue(x, y) {
    const cx = 110, cy = 110
    let angle = Math.atan2(y - cy, x - cx) + Math.PI / 2
    if (angle < 0) angle += 2 * Math.PI
    if (clockMode.value === 'hour') {
        let h = Math.round(angle / (2 * Math.PI) * 12)
        return h === 0 ? 12 : h
    } else {
        let m = Math.round(angle / (2 * Math.PI) * 60)
        return m === 60 ? 0 : m
    }
}

function startDrag(e) {
    isDragging = true
    const { x, y } = getEventPos(e)
    const val = angleToValue(x, y)
    if (clockMode.value === 'hour') clockHour.value = val
    else clockMinute.value = val
}

function onDrag(e) {
    if (!isDragging) return
    const { x, y } = getEventPos(e)
    const val = angleToValue(x, y)
    if (clockMode.value === 'hour') clockHour.value = val
    else clockMinute.value = val
}

function endDrag() {
    if (!isDragging) return
    isDragging = false
    if (clockMode.value === 'hour') setTimeout(() => { clockMode.value = 'minute' }, 150)
}

function confirmTime() {
    let h = clockHour.value % 12
    if (clockAmPm.value === 'CH') h += 12
    form.reserved_time = `${String(h).padStart(2, '0')}:${String(clockMinute.value).padStart(2, '0')}`
    showClock.value = false
    syncDateTime()
}

function formatTime12(time24) {
    if (!time24) return ''
    const [h, m] = time24.split(':').map(Number)
    const ampm = h < 12 ? 'SA' : 'CH'
    const h12 = h % 12 || 12
    return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`
}

// ─── Draw analog clock ────────────────────────────────────────────────────────
function drawClock() {
    const canvas = clockCanvas.value
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const cx = 110, cy = 110, R = 100

    ctx.clearRect(0, 0, 220, 220)

    // Face
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI)
    ctx.fillStyle = '#f8f9fa'; ctx.fill()
    ctx.strokeStyle = '#e0e0e0'; ctx.lineWidth = 1; ctx.stroke()

    const sel = clockMode.value === 'hour' ? clockHour.value : clockMinute.value

    for (let i = 0; i < 12; i++) {
        const val = clockMode.value === 'hour' ? (i === 0 ? 12 : i) : i * 5
        const angle = (i / 12) * 2 * Math.PI - Math.PI / 2
        const nx = cx + (R - 22) * Math.cos(angle)
        const ny = cy + (R - 22) * Math.sin(angle)
        const isActive = val === sel

        if (isActive) {
            ctx.beginPath(); ctx.arc(nx, ny, 16, 0, 2 * Math.PI)
            ctx.fillStyle = '#f97316'; ctx.fill()
        }

        ctx.font = `${isActive ? 600 : 400} 13px sans-serif`
        ctx.fillStyle = isActive ? '#ffffff' : '#374151'
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(val, nx, ny)
    }

    // Hand
    const handVal = clockMode.value === 'hour' ? clockHour.value : clockMinute.value
    const handAngle = clockMode.value === 'hour'
        ? ((handVal % 12) / 12) * 2 * Math.PI - Math.PI / 2
        : (handVal / 60) * 2 * Math.PI - Math.PI / 2
    const selIdx = clockMode.value === 'hour' ? clockHour.value % 12 : clockMinute.value
    const tipAngle = clockMode.value === 'hour'
        ? (selIdx / 12) * 2 * Math.PI - Math.PI / 2
        : (selIdx / 60) * 2 * Math.PI - Math.PI / 2
    const tipX = cx + (R - 22) * Math.cos(tipAngle)
    const tipY = cy + (R - 22) * Math.sin(tipAngle)

    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(tipX, tipY)
    ctx.strokeStyle = '#f97316'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.stroke()

    ctx.beginPath(); ctx.arc(cx, cy, 4, 0, 2 * Math.PI)
    ctx.fillStyle = '#f97316'; ctx.fill()
}

// ─── Form methods ─────────────────────────────────────────────────────────────
function handlePhoneInput(e) {
    form.customer_phone = e.target.value.replace(/\D/g, '').slice(0, 10)
}

async function checkConflict() {
    conflictMsg.value = ''
    if (!form.reserved_at || !form.table_id) return
    try {
        const { data } = await api.get('/tables/check-availability', {
            params: { table_id: form.table_id, reserved_at: form.reserved_at }
        })
        if (data.available === false)
            conflictMsg.value = 'Bàn này đã có người đặt trong khoảng thời gian này. Vui lòng chọn giờ khác.'
    } catch (err) { console.error('Lỗi kiểm tra trùng lịch:', err) }
}

async function submitReservation() {
    loading.value = true; errorMsg.value = ''; errors.value = {}
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
    } finally { loading.value = false }
}

function formatDate(dt) {
    if (!dt) return ''
    return new Date(dt).toLocaleString('vi-VN', {
        weekday: 'short', year: 'numeric', month: '2-digit',
        day: '2-digit', hour: '2-digit', minute: '2-digit',
    })
}
</script>

<style scoped src="@/assets/reservation.css"></style>