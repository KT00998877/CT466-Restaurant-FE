<template>
    <DefaultLayout>
    <div class="my-reservations-page">
        <div class="container">
            <h1 class="page-title"> Lịch sử đặt bàn</h1>

            <div v-if="loading" class="loading">Đang tải...</div>

            <div v-else-if="reservations.length === 0" class="empty">
                Bạn chưa có đặt bàn nào.
                <router-link to="/reservation">Đặt bàn ngay →</router-link>
            </div>

            <div v-else class="reservation-list">
                <div v-for="r in reservations" :key="r.id" class="reservation-card" :class="r.status">
                    <div class="card-header">
                        <span class="table-name">Bàn {{ r.table?.name }}</span>
                        <span class="badge" :class="r.status">{{ statusLabel(r.status) }}</span>
                    </div>
                    <div class="card-body">
                        <p>🕐 {{ formatDate(r.reserved_at) }}</p>
                        <p>👥 {{ r.guests }} khách</p>
                        <p>📞 {{ r.customer_phone }}</p>
                        <p v-if="r.note">📝 {{ r.note }}</p>
                    </div>
                    <div class="card-footer" v-if="canCancel(r)">
                        <button class="btn-cancel" @click="cancelReservation(r)" :disabled="cancelling === r.id">
                            {{ cancelling === r.id ? 'Đang hủy...' : '❌ Hủy đặt bàn' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    </DefaultLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import DefaultLayout from '../layouts/DefaultLayout.vue'
import api from '@/services/api'

const reservations = ref([])
const loading = ref(true)
const cancelling = ref(null)

onMounted(async () => {
    try {
        const { data } = await api.get('/reservations/my')
        reservations.value = data.reservations
    } finally {
        loading.value = false
    }
})

async function cancelReservation(r) {
    if (!confirm('Bạn chắc chắn muốn hủy đặt bàn này?')) return
    cancelling.value = r.id
    try {
        await api.patch(`/reservations/${r.id}/cancel`)
        r.status = 'cancelled'
    } catch (err) {
        alert(err.response?.data?.message || 'Không thể hủy.')
    } finally {
        cancelling.value = null
    }
}

function canCancel(r) {
    return ['pending', 'confirmed'].includes(r.status)
}

function statusLabel(status) {
    return { pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', cancelled: 'Đã hủy', completed: 'Hoàn thành' }[status] || status
}

function formatDate(dt) {
    return new Date(dt).toLocaleString('vi-VN', {
        weekday: 'short', year: 'numeric', month: '2-digit',
        day: '2-digit', hour: '2-digit', minute: '2-digit',
    })
}
</script>

<style scoped>
.my-reservations-page {
    min-height: 100vh;
    background: #f7f8fc;
    padding: 2rem 1rem;
    font-family: 'Segoe UI', sans-serif;
}

.container {
    max-width: 720px;
    margin: 0 auto;
}

.page-title {
    font-size: 2rem;
    font-weight: 700;
    color: #1a202c;
    margin-bottom: 1.5rem;
}

.loading {
    text-align: center;
    color: #718096;
    padding: 3rem;
}

.empty {
    text-align: center;
    color: #718096;
    padding: 3rem;
    font-size: 1.05rem;
}

.empty a {
    color: #667eea;
    font-weight: 600;
    margin-left: .4rem;
}

.reservation-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.reservation-card {
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, .06);
    overflow: hidden;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.2rem;
    border-bottom: 1px solid #edf2f7;
}

.table-name {
    font-size: 1.1rem;
    font-weight: 700;
    color: #2d3748;
}

.badge {
    padding: .25rem .75rem;
    border-radius: 99px;
    font-size: .8rem;
    font-weight: 600;
}

.badge.pending {
    background: #fffbeb;
    color: #b7791f;
}

.badge.confirmed {
    background: #f0fff4;
    color: #276749;
}

.badge.cancelled {
    background: #fff5f5;
    color: #c53030;
}

.badge.completed {
    background: #ebf8ff;
    color: #2b6cb0;
}

.card-body {
    padding: 1rem 1.2rem;
    line-height: 2;
    color: #4a5568;
    font-size: .93rem;
}

.card-footer {
    padding: .8rem 1.2rem;
    border-top: 1px solid #edf2f7;
}

.btn-cancel {
    background: #fff5f5;
    color: #c53030;
    border: 1px solid #fed7d7;
    padding: .45rem 1rem;
    border-radius: 8px;
    cursor: pointer;
    font-size: .9rem;
    transition: background .2s;
}

.btn-cancel:hover:not(:disabled) {
    background: #fed7d7;
}

.btn-cancel:disabled {
    opacity: .6;
    cursor: not-allowed;
}
</style>