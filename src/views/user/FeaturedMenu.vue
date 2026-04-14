<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/services/api';
import DefaultLayout from '../layouts/DefaultLayout.vue';

const router = useRouter();

// --- STATE DANH SÁCH ---
const items = ref([]); // Chứa danh sách món ăn trực tiếp
const searchQuery = ref('');
const sortBy = ref('default');
const isLoading = ref(true);

// --- STATE THÊM GIỎ HÀNG NHANH ---
const addingItemId = ref(null);

// --- LOGIC THÊM VÀO GIỎ HÀNG NHANH ---
const addToCart = async (item) => {
    const token = localStorage.getItem('token');
    if (!token) {
        router.push({ name: 'login' });
        return;
    }

    try {
        addingItemId.value = item.id;
        await api.post('/cart', {
            menu_item_id: item.id,
            quantity: 1
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        alert(`Đã thêm 1 "${item.name}" vào giỏ hàng!`);
    } catch (error) {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            router.push({ name: 'login' });
        } else {
            alert('Có lỗi xảy ra, vui lòng thử lại.');
        }
    } finally {
        addingItemId.value = null;
    }
};

// --- API FETCH ---
const fetchFeaturedData = async () => {
    isLoading.value = true;
    try {
        // GỌI ĐÚNG API LẤY MÓN ĐẶC SẮC
        const response = await api.get('/menu/featured');

        if (response.data.success) {
            items.value = response.data.data || [];
        }
    } catch (error) {
        console.error("Lỗi fetch món đặc sắc:", error);
    } finally {
        isLoading.value = false;
    }
};

// --- LOGIC LỌC & TÌM KIẾM ---
const filteredItems = computed(() => {
    let result = [...items.value];

    // 1. Tìm kiếm theo tên
    if (searchQuery.value.trim() !== '') {
        const query = searchQuery.value.toLowerCase();
        result = result.filter(item => item.name.toLowerCase().includes(query));
    }

    // 2. Sắp xếp
    if (sortBy.value === 'price-asc') {
        result.sort((a, b) => a.price - b.price);
    } else if (sortBy.value === 'price-desc') {
        result.sort((a, b) => b.price - a.price);
    }

    return result;
});

// --- HELPER ---
const storageBaseUrl = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api').replace('/api', '/storage/');
const getImageUrl = (path) => path ? `${storageBaseUrl}${path}` : '';
const formatPrice = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

// --- CHUYỂN HƯỚNG SANG TRANG CHI TIẾT ---
const goToDetail = (item) => {
    if (item.status === 2) return;
    router.push({ name: 'menu-detail', params: { id: item.id } });
};

onMounted(() => {
    fetchFeaturedData();
});
</script>

<template>
    <DefaultLayout>
        <div class="menu-section">
            <div class="container">
                <div class="menu-header">
                    <h1 class="section-title">⭐ Món Đặc Sắc</h1>
                    <p class="text-center text-light mb-4">Những món ăn làm nên thương hiệu của nhà hàng</p>
                </div>

                <div class="filter-controls">
                    <div class="search-box">
                        <input type="text" v-model="searchQuery" placeholder="Tìm kiếm món ăn..." />
                        <span class="search-icon">🔍</span>
                    </div>
                    <div class="sort-box">
                        <select v-model="sortBy">
                            <option value="default">Sắp xếp mặc định</option>
                            <option value="price-asc">Giá thấp đến cao</option>
                            <option value="price-desc">Giá cao đến thấp</option>
                        </select>
                    </div>
                </div>

                <div v-if="isLoading" class="text-center text-light py-5">
                    Đang tải dữ liệu...
                </div>

                <div v-else-if="filteredItems.length > 0" class="menu-grid">
                    <div v-for="item in filteredItems" :key="item.id" class="menu-card fade-in"
                        :class="{ 'out-of-stock': item.status === 2 }">
                        <div class="menu-card-header">
                            <div class="sale-badge" v-if="item.is_combo && item.status !== 2">Combo</div>
                            <div class="out-of-stock-badge" v-if="item.status === 2">Tạm hết hàng</div>
                            <img :src="getImageUrl(item.img_url)" :alt="item.name" class="menu-item-img">
                        </div>
                        <div class="menu-card-body">
                            <h3>{{ item.name }}</h3>
                            <p class="item-desc">{{ item.description }}</p>
                            <div class="price-container">
                                <span class="current-price">{{ formatPrice(item.price) }}</span>
                            </div>

                            <div class="card-actions">
                                <button v-if="item.status === 2" class="view-detail-btn disabled-btn" disabled>
                                    Hết hàng
                                </button>
                                <template v-else>
                                    <button class="view-detail-btn" @click="goToDetail(item)">
                                        Xem chi tiết
                                    </button>
                                    <button class="quick-add-cart-btn" @click.stop="addToCart(item)"
                                        :disabled="addingItemId === item.id" title="Thêm vào giỏ hàng">
                                        <span v-if="addingItemId === item.id">⌛</span>
                                        <span v-else>🛒</span>
                                    </button>
                                </template>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-else class="no-results">
                    <p>Không tìm thấy món ăn nào khớp với lựa chọn của bạn.</p>
                </div>
            </div>
        </div>
    </DefaultLayout>
</template>

<style scoped>
/* COPY LẠI TOÀN BỘ CSS TỪ TRANG MENU GỐC CỦA BẠN VÀO ĐÂY */
/* Bỏ phần CSS của .category-list đi vì trang này không dùng */
.menu-section {
    padding: 60px 10%;
    background-color: #1a1a1a;
    min-height: 80vh;
}

.section-title {
    font-size: 2.5rem;
    color: #e67e22;
    margin-bottom: 10px;
    font-weight: bold;
    text-align: center;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
}

.filter-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
    gap: 20px;
    flex-wrap: wrap;
    background: rgba(255, 255, 255, 0.05);
    padding: 20px;
    border-radius: 15px;
}

.search-box {
    position: relative;
    flex: 1;
    max-width: 400px;
}

.search-box input {
    width: 100%;
    padding: 12px 20px 12px 45px;
    border-radius: 30px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.1);
    color: white;
}

.search-icon {
    position: absolute;
    left: 18px;
    top: 50%;
    transform: translateY(-50%);
    color: #e67e22;
}

.sort-box select {
    padding: 12px 20px;
    border-radius: 10px;
    background: #2c2c2c;
    color: white;
}

.menu-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 25px;
}

.menu-card {
    background: #f9f9f9;
    border-radius: 12px;
    overflow: hidden;
    transition: transform 0.3s ease;
    display: flex;
    flex-direction: column;
}

.menu-card:hover {
    transform: translateY(-10px);
}

.menu-item-img {
    width: 100%;
    height: 200px;
    object-fit: cover;
}

.menu-card-body {
    padding: 20px;
    text-align: center;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
}

.item-desc {
    font-size: 0.85rem;
    color: #666;
    height: 40px;
    margin-bottom: 15px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.current-price {
    color: #e74c3c;
    font-weight: bold;
    font-size: 1.2rem;
}

.view-detail-btn {
    margin-top: 0;
    flex: 1;
    background: #d4a373;
    color: white;
    border: none;
    padding: 10px;
    cursor: pointer;
    transition: 0.3s;
    border-radius: 5px;
}

.fade-in {
    animation: fadeIn 0.5s ease forwards;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.no-results {
    color: white;
    text-align: center;
    font-size: 1.2rem;
    margin-top: 50px;
}

.out-of-stock {
    opacity: 0.7;
    filter: grayscale(40%);
    pointer-events: none;
}

.out-of-stock .out-of-stock-badge,
.out-of-stock .disabled-btn {
    pointer-events: auto;
    filter: none;
}

.menu-card-header {
    position: relative;
}

.out-of-stock-badge {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(220, 53, 69, 0.9);
    color: white;
    padding: 10px 20px;
    font-weight: bold;
    font-size: 1.1rem;
    border-radius: 5px;
    z-index: 10;
    text-transform: uppercase;
}

.disabled-btn {
    background: #95a5a6 !important;
    cursor: not-allowed;
}

.card-actions {
    margin-top: auto;
    display: flex;
    gap: 10px;
    align-items: center;
}

.quick-add-cart-btn {
    background: #d4a373;
    color: white;
    border: none;
    padding: 10px 15px;
    border-radius: 5px;
    font-size: 1.2rem;
    cursor: pointer;
    transition: background 0.3s;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
}

.quick-add-cart-btn:hover:not(:disabled) {
    background: #cf6d17;
}

.quick-add-cart-btn:disabled {
    background: #ccc;
    cursor: not-allowed;
    opacity: 0.7;
}

.text-light {
    color: #f8f9fa;
}
</style>