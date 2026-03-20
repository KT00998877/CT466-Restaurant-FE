<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import DefaultLayout from '../layouts/DefaultLayout.vue';

const route = useRoute();
const router = useRouter();

// --- STATE ---
const selectedItem = ref(null);
const categoryName = ref('');
const quantity = ref(1);
const isLoading = ref(true);

// --- STATE GIỎ HÀNG ---
const isAddingToCart = ref(false);
const cartMessage = ref('');
const cartMessageType = ref('');

// --- HELPERS ---
const getAuthToken = () => localStorage.getItem('token');
const getImageUrl = (path) => path ? `http://127.0.0.1:8000/storage/${path}` : '';
const formatPrice = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

// --- LOGIC TĂNG/GIẢM SỐ LƯỢNG ---
const increaseQty = () => quantity.value++;
const decreaseQty = () => { if (quantity.value > 1) quantity.value--; };

// --- LẤY DỮ LIỆU MÓN ĂN TỪ ID ---
const fetchItemDetail = async () => {
    const itemId = route.params.id;
    try {
        isLoading.value = true;
        // Lý tưởng nhất là gọi API riêng: axios.get(`/api/menu/${itemId}`)
        // Ở đây tận dụng lại API cũ của bạn để quét tìm item
        const response = await axios.get('http://127.0.0.1:8000/api/menu');
        if (response.data.success) {
            const categories = response.data.data;
            let foundItem = null;
            let foundCatName = '';

            categories.forEach(cat => {
                const item = cat.menu_items.find(i => i.id == itemId);
                if (item) {
                    foundItem = item;
                    foundCatName = cat.name;
                }
            });

            if (foundItem) {
                selectedItem.value = foundItem;
                categoryName.value = foundCatName;
            } else {
                router.push({ name: 'menu' }); // Không tìm thấy thì back về menu
            }
        }
    } catch (error) {
        console.error("Lỗi fetch chi tiết món:", error);
    } finally {
        isLoading.value = false;
    }
};

// --- LOGIC THÊM VÀO GIỎ HÀNG ---
const addToCart = async () => {
    const token = getAuthToken();
    if (!token) {
        router.push({ name: 'login' });
        return;
    }

    try {
        isAddingToCart.value = true;
        cartMessage.value = '';

        await axios.post(
            'http://127.0.0.1:8000/api/cart',
            {
                menu_item_id: selectedItem.value.id,
                quantity: quantity.value,
            },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        cartMessage.value = `Đã thêm ${quantity.value} "${selectedItem.value.name}" vào giỏ hàng!`;
        cartMessageType.value = 'success';
        quantity.value = 1; // Reset lại số lượng

    } catch (error) {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            router.push({ name: 'login' });
        } else {
            cartMessage.value = 'Có lỗi xảy ra, vui lòng thử lại.';
            cartMessageType.value = 'error';
        }
    } finally {
        isAddingToCart.value = false;
    }
};

onMounted(() => {
    fetchItemDetail();
});
</script>

<template>
    <DefaultLayout>
        <div class="detail-section">
            <div class="container" v-if="!isLoading && selectedItem">
                <button class="back-btn" @click="router.push({ name: 'menu' })">
                    ← Quay lại Thực đơn
                </button>

                <div class="detail-card">
                    <div class="detail-image-side">
                        <img :src="getImageUrl(selectedItem.img_url)" :alt="selectedItem.name">
                    </div>

                    <div class="detail-info-side">
                        <div class="detail-header-info">
                            <span class="category-tag">{{ categoryName }}</span>
                            <h2>{{ selectedItem.name }}</h2>
                        </div>

                        <div class="detail-price">
                            <span class="price-now">{{ formatPrice(selectedItem.price) }}</span>
                        </div>

                        <div class="detail-divider"></div>

                        <div class="detail-description">
                            <h4>Mô tả món ăn:</h4>
                            <p>{{ selectedItem.description }}</p>
                        </div>

                        <div v-if="cartMessage" :class="['cart-message', cartMessageType]">
                            {{ cartMessage }}
                        </div>

                        <div class="detail-actions">
                            <div class="quantity-control">
                                <label>Số lượng:</label>
                                <div class="qty-input-group">
                                    <button class="qty-btn" @click="decreaseQty">−</button>
                                    <input type="number" v-model.number="quantity" min="1" readonly>
                                    <button class="qty-btn" @click="increaseQty">+</button>
                                </div>
                            </div>

                            <button class="add-cart-large" @click="addToCart" :disabled="isAddingToCart">
                                {{ isAddingToCart ? 'Đang thêm...' : 'Thêm vào giỏ hàng' }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div v-else-if="isLoading" class="loading">
                Đang tải dữ liệu món ăn...
            </div>
        </div>
    </DefaultLayout>
</template>

<style scoped>
.detail-section {
    padding: 60px 10%;
    background-color: #1a1a1a;
    min-height: 80vh;
}

.container {
    max-width: 1000px;
    margin: 0 auto;
}

.back-btn {
    background: transparent;
    color: #e67e22;
    border: none;
    font-size: 1.1rem;
    cursor: pointer;
    margin-bottom: 20px;
    padding: 0;
    transition: 0.2s;
}

.back-btn:hover {
    color: #d4a373;
    text-decoration: underline;
}

.loading {
    text-align: center;
    color: white;
    font-size: 1.5rem;
    margin-top: 50px;
}

.detail-card {
    background: white;
    border-radius: 20px;
    overflow: hidden;
    display: grid;
    grid-template-columns: 1fr 1fr;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

/* Khung chứa hình ảnh */
.detail-image-side {
    height: 100%;
    min-height: 500px;
    background: #f8f9fa;
    /* Đổi màu nền sáng một chút cho sang trọng */
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 30px;
    /* Thêm khoảng trống xung quanh để ảnh không bị sát viền */
}

/* Hình ảnh */
.detail-image-side img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    /* Mấu chốt: Giúp hiển thị trọn vẹn 100% bức ảnh không bị cắt */
    border-radius: 10px;
    /* Bo góc nhẹ cho ảnh (tùy chọn) */
}

.detail-info-side {
    padding: 50px;
    display: flex;
    flex-direction: column;
}

.category-tag {
    color: #e67e22;
    font-weight: bold;
    text-transform: uppercase;
    font-size: 0.9rem;
    letter-spacing: 1px;
}

.detail-header-info h2 {
    font-size: 2.2rem;
    margin: 10px 0;
    color: #333;
}

.price-now {
    font-size: 2.5rem;
    color: #e74c3c;
    font-weight: bold;
    margin: 20px 0;
    display: inline-block;
}

.detail-divider {
    height: 1px;
    background: #eee;
    margin: 25px 0;
}

.detail-description h4 {
    margin-bottom: 10px;
    color: #444;
}

.detail-description p {
    color: #666;
    line-height: 1.6;
}

.cart-message {
    padding: 15px;
    border-radius: 8px;
    font-size: 1rem;
    margin-top: 20px;
    font-weight: 500;
}

.cart-message.success {
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
}

.cart-message.error {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
}

.detail-actions {
    margin-top: auto;
    padding-top: 30px;
    display: flex;
    gap: 20px;
    align-items: center;
}

.quantity-control {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.quantity-control label {
    font-size: 0.9rem;
    color: #666;
    font-weight: bold;
}

.qty-input-group {
    display: flex;
    align-items: center;
    border: 1px solid #ddd;
    border-radius: 8px;
    overflow: hidden;
}

.qty-btn {
    background: #f5f5f5;
    border: none;
    padding: 12px 18px;
    font-size: 1.2rem;
    cursor: pointer;
    transition: background 0.2s;
}

.qty-btn:hover {
    background: #e0e0e0;
}

.qty-input-group input {
    width: 60px;
    text-align: center;
    border: none;
    border-left: 1px solid #ddd;
    border-right: 1px solid #ddd;
    padding: 12px 0;
    font-size: 1.1rem;
    font-weight: bold;
    -moz-appearance: textfield;
}

.qty-input-group input::-webkit-outer-spin-button,
.qty-input-group input::-webkit-inner-spin-button {
    -webkit-appearance: none;
}

.add-cart-large {
    flex: 1;
    background: #e67e22;
    color: white;
    border: none;
    padding: 18px;
    border-radius: 8px;
    font-size: 1.1rem;
    font-weight: bold;
    cursor: pointer;
    transition: background 0.2s;
}

.add-cart-large:hover:not(:disabled) {
    background: #cf6d17;
}

.add-cart-large:disabled {
    background: #ccc;
    cursor: not-allowed;
}

/* Responsive */
@media (max-width: 768px) {
    .detail-card {
        grid-template-columns: 1fr;
    }

    .detail-image-side {
        min-height: 300px;
        padding: 15px;

    }

    .detail-info-side {
        padding: 25px;
    }

    .detail-actions {
        flex-direction: column;
        align-items: stretch;
    }
}
</style>