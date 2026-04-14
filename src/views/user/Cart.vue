<script setup>
import { ref, computed, onMounted, reactive } from "vue";
import { useRouter } from "vue-router";
import DefaultLayout from "../layouts/DefaultLayout.vue";
import api from "../../services/api";
import { useCart } from "@/composables/useCart";

const router = useRouter();
const { cartItems, cartCount, loading, fetchCart } = useCart();

/* =========================
   STATE TÀI KHOẢN & ĐIỂM
========================= */
const userPoints = ref(0);
const fetchUserProfile = async () => {
    try {
        const response = await api.get('/profile');
        if (response.data.success) {
            userPoints.value = response.data.data.points || 0;
            // Tự động điền thông tin nếu có sẵn
            checkoutForm.customer_name = response.data.data.name || '';
            checkoutForm.customer_phone = response.data.data.phone || '';
        }
    } catch (error) {
        console.error("Không thể lấy thông tin điểm:", error);
    }
};

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
    payment_method: "cod",
    points_used: 0 // Thêm trường điểm muốn dùng
});

// Tính toán số tiền được giảm
const discountAmount = computed(() => {
    return (checkoutForm.points_used || 0) * 100;
});

// Tính tổng tiền cần thanh toán sau khi trừ điểm
const finalAmount = computed(() => {
    const final = totalPrice.value - discountAmount.value;
    return final > 0 ? final : 0; // Không cho phép âm tiền
});

// Xử lý khi user nhập quá số điểm đang có
const validatePoints = () => {
    if (checkoutForm.points_used > userPoints.value) {
        checkoutForm.points_used = userPoints.value;
    }
    // Tránh nhập số điểm tạo ra discount lớn hơn tổng bill
    if (checkoutForm.points_used * 100 > totalPrice.value) {
        checkoutForm.points_used = Math.ceil(totalPrice.value / 100);
    }
    // Không cho nhập số âm
    if (checkoutForm.points_used < 0) {
        checkoutForm.points_used = 0;
    }
};

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

        const payload = {
            ...checkoutForm,
            amount: finalAmount.value, // Gửi finalAmount thay vì totalPrice
        };

        const response = await api.post('/checkout', payload);

        if (response.data.success) {
            // TRƯỜNG HỢP 1: THANH TOÁN VNPAY
            if (checkoutForm.payment_method === 'vnpay') {
                if (response.data.vnpay_url) {
                    window.location.href = response.data.vnpay_url;
                } else {
                    const payRes = await api.post('/payment/vnpay', {
                        order_id: response.data.order_id,
                        amount: finalAmount.value // Sửa chỗ này thành finalAmount
                    });
                    window.location.href = payRes.data.url;
                }
            }
            // TRƯỜNG HỢP 2: THANH TOÁN COD
            else {
                alert("🎉 Đặt hàng thành công! Cảm ơn bạn đã ủng hộ nhà hàng.");
                showCheckoutModal.value = false;
                cartItems.value = [];
                router.push({ name: 'orders' });
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

onMounted(() => {
    fetchCart();
    fetchUserProfile(); // Gọi thêm API lấy điểm
});
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

                    <div class="form-group points-section">
                        <label>Sử dụng điểm (Bạn có {{ userPoints }} điểm)</label>
                        <div class="points-input-group">
                            <input type="number" v-model.number="checkoutForm.points_used" @input="validatePoints"
                                min="0" :max="userPoints" placeholder="0">
                            <span class="discount-hint" v-if="discountAmount > 0">
                                Giảm {{ formatPrice(discountAmount) }}
                            </span>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Phương thức thanh toán</label>
                        <select v-model="checkoutForm.payment_method">
                            <!-- <option value="cod">Thanh toán khi nhận hàng (COD)</option> -->
                            <option value="vnpay">Thanh toán VNPay</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Ghi chú thêm</label>
                        <textarea v-model="checkoutForm.notes" rows="2"
                            placeholder="Ví dụ: Không ăn cay, lấy thêm muỗng nĩa..."></textarea>
                    </div>

                    <div class="checkout-summary">
                        <div class="summary-line">
                            <span>Tạm tính:</span>
                            <span>{{ formatPrice(totalPrice) }}</span>
                        </div>
                        <div class="summary-line text-success" v-if="discountAmount > 0">
                            <span>Khuyến mãi (Dùng điểm):</span>
                            <span>-{{ formatPrice(discountAmount) }}</span>
                        </div>
                        <div class="summary-line total-line">
                            <span>Thành tiền:</span>
                            <span class="final-price">{{ formatPrice(finalAmount) }}</span>
                        </div>
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
.points-section {
    background: #f8f9fa;
    padding: 12px;
    border-radius: 6px;
    border: 1px dashed #ccc;
}

.points-input-group {
    display: flex;
    align-items: center;
    gap: 15px;
}

.points-input-group input {
    width: 100px;
    padding: 8px;
}

.discount-hint {
    color: #27ae60;
    font-weight: bold;
    font-size: 0.95rem;
}

.checkout-summary {
    margin-top: 20px;
    padding-top: 15px;
    border-top: 2px dashed #eee;
}

.summary-line {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 0.95rem;
}

.text-success {
    color: #27ae60;
}

.total-line {
    font-size: 1.2rem;
    font-weight: bold;
    margin-top: 10px;
    color: #d35400;
}

.final-price {
    font-size: 1.3rem;
} 

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
    max-height: 85vh;
    /* Giới hạn chiều cao tối đa bằng 85% chiều cao màn hình */
    overflow-y: auto;
    /* Tự động hiện thanh cuộn dọc khi nội dung vượt quá chiều cao */
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