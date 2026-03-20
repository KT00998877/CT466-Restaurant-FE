<script setup>
import { ref, computed, onMounted, reactive } from "vue";
import { useRouter } from "vue-router";
import DefaultLayout from "../layouts/DefaultLayout.vue";
import api from "../../services/api";
import { useCart } from "@/composables/useCart";

const router = useRouter();
const { cartItems, cartCount, loading, fetchCart } = useCart();

/* =========================
   STATE THANH TOÁN
========================= */
const showCheckoutModal = ref(false);
const isSubmitting = ref(false);

const checkoutForm = reactive({
    customer_name: "",
    customer_phone: "",
    customer_address: "",
    notes: "",
    payment_method: "cod"
});

/* =========================
   TĂNG SỐ LƯỢNG
========================= */
const increaseQty = async (item) => {
    item.quantity++;
    await api.put(`/cart/${item.id}`, { quantity: item.quantity });
};

/* =========================
   GIẢM SỐ LƯỢNG
========================= */
const decreaseQty = async (item) => {
    if (item.quantity <= 1) return;
    item.quantity--;
    await api.put(`/cart/${item.id}`, { quantity: item.quantity });
};

/* =========================
   XOÁ MÓN
========================= */
const removeItem = async (id) => {
    await api.delete(`/cart/${id}`);
    cartItems.value = cartItems.value.filter(i => i.id !== id);
};

/* =========================
   TỔNG TIỀN
========================= */
const totalPrice = computed(() => {
    return cartItems.value.reduce((sum, item) => sum + item.subtotal, 0);
});

/* =========================
   FORMAT TIỀN
========================= */
const formatPrice = (value) => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND"
    }).format(value);
};

/* =========================
   XỬ LÝ ĐẶT HÀNG (SUBMIT)
========================= */
const submitOrder = async () => {
    if (cartItems.value.length === 0) return;

    try {
        isSubmitting.value = true;

        // 1. Gửi thông tin đơn hàng lên Backend để lưu vào Database trước
        // Bạn nên truyền thêm totalPrice để Backend kiểm tra
        const payload = {
            ...checkoutForm,
            amount: totalPrice.value,
        };

        const response = await api.post('/checkout', payload);

        if (response.data.success) {
            // TRƯỜNG HỢP 1: THANH TOÁN VNPAY
            if (checkoutForm.payment_method === 'vnpay') {
                // Gọi tiếp API lấy link thanh toán từ Backend
                // Lưu ý: Backend cần trả về vnpay_url sau khi tạo đơn hàng thành công
                if (response.data.vnpay_url) {
                    window.location.href = response.data.vnpay_url;
                } else {
                    // Hoặc gọi một API riêng để lấy link nếu Backend không trả về chung
                    const payRes = await api.post('/payment/vnpay', {
                        order_id: response.data.order_id,
                        amount: totalPrice.value
                    });
                    window.location.href = payRes.data.url;
                }
            }
            // TRƯỜNG HỢP 2: THANH TOÁN COD
            else {
                alert("🎉 Đặt hàng thành công! Cảm ơn bạn đã ủng hộ nhà hàng.");
                showCheckoutModal.value = false;
                cartItems.value = [];
                router.push({ name: 'orders' }); // Chuyển đến trang lịch sử đơn hàng
            }
        }
    } catch (error) {
        console.error("Lỗi đặt hàng:", error);
        const errorMsg = error.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại sau.";
        alert("❌ Đặt hàng thất bại: " + errorMsg);
    } finally {
        isSubmitting.value = false;
    }
};


onMounted(fetchCart);
</script>

<template>
    <DefaultLayout>
        <div class="cart-page">
            <h1 class="title">Giỏ Hàng</h1>

            <div v-if="loading" class="empty">Đang tải giỏ hàng...</div>

            <div v-else-if="cartItems.length === 0" class="empty">
                <p>Giỏ hàng của bạn đang trống</p>
                <button class="back-menu-btn" @click="router.push({ name: 'menu' })">Đi đến Thực Đơn</button>
            </div>

            <div v-else>
                <table class="cart-table">
                    <thead>
                        <tr>
                            <th>Món ăn</th>
                            <th>Giá</th>
                            <th>Số lượng</th>
                            <th>Tổng</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in cartItems" :key="item.id">
                            <td class="item-info">
                                <img :src="'http://127.0.0.1:8000/storage/' + item.img_url">
                                <span>{{ item.name }}</span>
                            </td>
                            <td>{{ formatPrice(item.price) }}</td>
                            <td class="qty">
                                <div class="qty-wrapper">
                                    <button @click="decreaseQty(item)">-</button>
                                    <span>{{ item.quantity }}</span>
                                    <button @click="increaseQty(item)">+</button>
                                </div>
                            </td>
                            <td>{{ formatPrice(item.subtotal) }}</td>
                            <td>
                                <button class="remove" @click="removeItem(item.id)">Xoá</button>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <div class="cart-total">
                    <h2>Tổng tiền: {{ formatPrice(totalPrice) }}</h2>
                    <button class="checkout-btn" @click="showCheckoutModal = true">
                        Tiến hành Thanh toán
                    </button>
                </div>
            </div>
        </div>

        <div v-if="showCheckoutModal" class="modal-overlay" @click.self="showCheckoutModal = false">
            <div class="modal-content">
                <h2>Thông Tin Giao Hàng</h2>

                <form @submit.prevent="submitOrder">
                    <div class="form-group">
                        <label>Họ và Tên (*)</label>
                        <input type="text" v-model="checkoutForm.customer_name" required
                            placeholder="Nhập tên người nhận">
                    </div>

                    <div class="form-group">
                        <label>Số điện thoại (*)</label>
                        <input type="tel" v-model="checkoutForm.customer_phone" required
                            placeholder="Nhập số điện thoại">
                    </div>

                    <div class="form-group">
                        <label>Địa chỉ nhận hàng (*)</label>
                        <textarea v-model="checkoutForm.customer_address" required rows="2"
                            placeholder="Nhập địa chỉ chi tiết"></textarea>
                    </div>

                    <div class="form-group">
                        <label>Phương thức thanh toán</label>
                        <select v-model="checkoutForm.payment_method">
                            <option value="cod">Thanh toán khi nhận hàng (COD)</option>
                            <option value="vnpay">Thanh toán VNPay</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Ghi chú thêm</label>
                        <textarea v-model="checkoutForm.notes" rows="2"
                            placeholder="Ví dụ: Không ăn cay, lấy thêm muỗng nĩa..."></textarea>
                    </div>

                    <div class="modal-actions">
                        <button type="button" class="btn-cancel" @click="showCheckoutModal = false"
                            :disabled="isSubmitting">Hủy</button>
                        <button type="submit" class="btn-confirm" :disabled="isSubmitting">
                            {{ isSubmitting ? 'Đang xử lý...' : 'Xác nhận Đặt hàng' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </DefaultLayout>
</template>

<style scoped>
.cart-page {
    padding: 60px 10%;
    background: #1a1a1a;
    color: white;
    min-height: 80vh;
}

.title {
    text-align: center;
    margin-bottom: 40px;
}

.badge {
    background: #e74c3c;
    color: white;
    padding: 5px 10px;
    border-radius: 20px;
    font-size: 14px;
    margin-left: 10px;
}

.cart-table {
    width: 100%;
    border-collapse: collapse;
    background: white;
    color: black;
    border-radius: 8px;
    overflow: hidden;
}

.cart-table th,
.cart-table td {
    padding: 15px;
    text-align: center;
    border-bottom: 1px solid #ddd;
}

.item-info {
    display: flex;
    align-items: center;
    gap: 10px;
}

.item-info img {
    width: 60px;
    height: 60px;
    object-fit: cover;
    border-radius: 6px;
}

.qty {
    
    align-items: center;
    justify-content: center;
    gap: 10px;
}

.qty button {
    padding: 4px 10px;
    cursor: pointer;
}

.remove {
    background: #e74c3c;
    color: white;
    border: none;
    padding: 6px 10px;
    border-radius: 4px;
    cursor: pointer;
}

.cart-total {
    margin-top: 30px;
    text-align: right;
}

.checkout-btn {
    background: #e67e22;
    color: white;
    border: none;
    padding: 12px 30px;
    font-size: 16px;
    border-radius: 6px;
    cursor: pointer;
}

.empty {
    text-align: center;
    font-size: 18px;
}

.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-content {
    background: white;
    color: #333;
    width: 90%;
    max-width: 500px;
    padding: 30px;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    animation: slideDown 0.3s ease;
}

@keyframes slideDown {
    from {
        transform: translateY(-30px);
        opacity: 0;
    }

    to {
        transform: translateY(0);
        opacity: 1;
    }
}

.modal-content h2 {
    margin-top: 0;
    margin-bottom: 20px;
    color: #2c3e50;
    text-align: center;
    border-bottom: 2px solid #f0f0f0;
    padding-bottom: 10px;
}

.form-group {
    margin-bottom: 15px;
    display: flex;
    flex-direction: column;
    text-align: left;
}

.form-group label {
    font-size: 0.9rem;
    font-weight: bold;
    margin-bottom: 5px;
    color: #555;
}

.form-group input,
.form-group textarea,
.form-group select {
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 6px;
    font-size: 1rem;
    font-family: inherit;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
    border-color: #e67e22;
    outline: none;
}

.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 25px;
}

.btn-cancel {
    background: #f1f2f6;
    color: #333;
    border: none;
    padding: 10px 20px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: bold;
}

.btn-cancel:hover:not(:disabled) {
    background: #dfe4ea;
}

.btn-confirm {
    background: #e67e22;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: bold;
}

.btn-confirm:hover:not(:disabled) {
    background: #d35400;
}

.btn-confirm:disabled,
.btn-cancel:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

</style>