<template>
    <DefaultLayout>
        <div class="orders-page">
            <h1 class="title">Lịch Sử Đơn Hàng</h1>

            <div v-if="isLoading" class="text-center mt-5 text-light">
                Đang tải dữ liệu...
            </div>

            <div v-else-if="orders.length === 0" class="empty-state">
                <p>Bạn chưa có đơn hàng nào.</p>
                <button class="btn-shopping" @click="router.push('/menu')">Đi đến Thực đơn</button>
            </div>

            <div v-else class="orders-list">
                <div v-for="order in orders" :key="order.id" class="order-card">
                    <div class="order-header">
                        <div class="order-info">
                            <h3>Đơn hàng #{{ order.id }}</h3>
                            <span class="order-date">{{ formatDate(order.created_at) }}</span>
                        </div>
                        <div class="order-status">
                            <span :class="['status-badge', order.status]">
                                {{ translateStatus(order.status) }}
                            </span>
                        </div>
                    </div>

                    <div class="order-body">
                        <table class="items-table">
                            <thead>
                                <tr>
                                    <th>Tên món</th>
                                    <th>Đơn giá</th>
                                    <th>SL</th>
                                    <th>Thành tiền</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="item in order.items" :key="item.id">
                                    <td class="item-name">{{ item.item_name }}</td>
                                    <td>{{ formatPrice(item.price) }}</td>
                                    <td>x{{ item.quantity }}</td>
                                    <td class="fw-bold">{{ formatPrice(item.subtotal) }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div class="order-footer">
                        <div class="customer-details">
                            <p><strong>Người nhận:</strong> {{ order.customer_name }} - {{ order.customer_phone }}</p>
                            <p><strong>Địa chỉ:</strong> {{ order.customer_address }}</p>
                            <p><strong>Thanh toán:</strong> {{ order.payment_method.toUpperCase() }}
                                (<span :class="order.payment_status === 'paid' ? 'text-success' : 'text-danger'">
                                    {{ order.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán' }}
                                </span>)
                            </p>
                        </div>
                        <div class="order-total">
                            <span>Tổng cộng:</span>
                            <span class="total-price">{{ formatPrice(order.total_price) }}</span>

                            <button
                                v-if="order.payment_method === 'vnpay' && order.payment_status !== 'paid' && order.status !== 'cancelled'"
                                class="btn-pay-now" @click="repayOrder(order)" :disabled="isProcessingPay">
                                {{ isProcessingPay ? 'Đang kết nối...' : 'Thanh toán ngay' }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </DefaultLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '../../services/api';
import DefaultLayout from '../layouts/DefaultLayout.vue';

const router = useRouter();
const orders = ref([]);
const isLoading = ref(true);
const isProcessingPay = ref(false);

const repayOrder = async (order) => {
    try {
        isProcessingPay.value = true;

        // Gọi API lấy link VNPAY cho đơn hàng cũ
        // Bạn cần đảm bảo Backend có route này (thường dùng chung logic với lúc checkout)
        const response = await api.post('/payment/vnpay', {
            order_id: order.id,
            amount: order.total_price
        });

        if (response.data.url) {
            window.location.href = response.data.url;
        } else {
            alert("Không thể tạo liên kết thanh toán. Vui lòng thử lại sau.");
        }
    } catch (error) {
        console.error("Lỗi thanh toán lại:", error);
        alert("Có lỗi xảy ra khi kết nối với VNPAY.");
    } finally {
        isProcessingPay.value = false;
    }
};

const fetchOrders = async () => {
    try {
        const response = await api.get('/orders');
        if (response.data.success) {
            orders.value = response.data.data;
        }
    } catch (error) {
        console.error("Lỗi khi tải đơn hàng:", error);
    } finally {
        isLoading.value = false;
    }
};

const formatPrice = (value) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
};

const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

// Hàm dịch trạng thái sang tiếng Việt
const translateStatus = (status) => {
    const statuses = {
        pending: 'Chờ xác nhận',
        processing: 'Đang chuẩn bị',
        delivering: 'Đang giao hàng',
        completed: 'Hoàn thành',
        cancelled: 'Đã huỷ'
    };
    return statuses[status] || status;
};

onMounted(() => {
    fetchOrders();
});
</script>

<style scoped>
.orders-page {
    padding: 60px 10%;
    background: #1a1a1a;
    min-height: 80vh;
    color: #333;
}

.title {
    text-align: center;
    color: white;
    margin-bottom: 40px;
}

.empty-state {
    text-align: center;
    background: white;
    padding: 50px;
    border-radius: 10px;
}

.btn-shopping {
    background: #e67e22;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
    cursor: pointer;
    margin-top: 15px;
}

.orders-list {
    display: flex;
    flex-direction: column;
    gap: 30px;
}

.order-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    overflow: hidden;
}

.order-header {
    background: #f8f9fa;
    padding: 15px 25px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #eee;
}

.order-info h3 {
    margin: 0 0 5px 0;
    color: #e67e22;
    font-size: 1.2rem;
}

.order-date {
    color: #777;
    font-size: 0.9rem;
}

.status-badge {
    padding: 6px 15px;
    border-radius: 20px;
    font-weight: bold;
    font-size: 0.9rem;
}

.status-badge.pending {
    background: #fff3cd;
    color: #856404;
}

.status-badge.processing {
    background: #cce5ff;
    color: #004085;
}

.status-badge.completed {
    background: #d4edda;
    color: #155724;
}

.status-badge.cancelled {
    background: #f8d7da;
    color: #721c24;
}


.status-badge.delivering {
    background: #e2e3e5;
    color: #383d41;
}

.order-body {
    padding: 20px 25px;
}

.items-table {
    width: 100%;
    border-collapse: collapse;
}

.items-table th {
    text-align: left;
    color: #888;
    border-bottom: 2px solid #eee;
    padding-bottom: 10px;
}

.items-table td {
    padding: 12px 0;
    border-bottom: 1px solid #f9f9f9;
}

.item-name {
    font-weight: 500;
}

.order-footer {
    background: #fafafa;
    padding: 20px 25px;
    display: flex;
    justify-content: space-between;
    border-top: 1px solid #eee;
}

.customer-details p {
    margin: 0 0 5px 0;
    font-size: 0.95rem;
}

.order-total {
    text-align: right;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.total-price {
    font-size: 1.5rem;
    font-weight: bold;
    color: #e74c3c;
}

@media (max-width: 768px) {
    .order-footer {
        flex-direction: column;
        gap: 15px;
    }

    .order-total {
        text-align: left;
        border-top: 1px dashed #ccc;
        padding-top: 15px;
    }
}

.btn-pay-now {
    margin-top: 10px;
    background: #27ae60;
    /* Màu xanh lá cây để kích thích thanh toán */
    color: white;
    border: none;
    padding: 8px 15px;
    border-radius: 6px;
    font-weight: bold;
    cursor: pointer;
    transition: 0.3s;
    font-size: 0.9rem;
    box-shadow: 0 4px 6px rgba(39, 174, 96, 0.2);
}

.btn-pay-now:hover:not(:disabled) {
    background: #219150;
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(39, 174, 96, 0.3);
}

.btn-pay-now:disabled {
    background: #95a5a6;
    cursor: not-allowed;
}

/* Đảm bảo căn chỉnh nút trong mobile */
@media (max-width: 768px) {
    .order-total .btn-pay-now {
        width: 100%;
        padding: 12px;
    }
}
</style>