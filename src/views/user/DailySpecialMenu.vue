<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/services/api';
import DefaultLayout from '../layouts/DefaultLayout.vue';
import '../../assets/menu.css';
const router = useRouter();

const items = ref([]);
const searchQuery = ref('');
const sortBy = ref('default');
const isLoading = ref(true);
const addingItemId = ref(null);

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

const fetchDailySpecials = async () => {
    isLoading.value = true;
    try {
        // GỌI ĐÚNG API LẤY MÓN NGON MỖI NGÀY
        const response = await api.get('/menu/daily-specials');

        if (response.data.success) {
            items.value = response.data.data || [];
        }
    } catch (error) {
        console.error("Lỗi fetch món ngon mỗi ngày:", error);
    } finally {
        isLoading.value = false;
    }
};

const filteredItems = computed(() => {
    let result = [...items.value];

    if (searchQuery.value.trim() !== '') {
        const query = searchQuery.value.toLowerCase();
        result = result.filter(item => item.name.toLowerCase().includes(query));
    }

    if (sortBy.value === 'price-asc') {
        result.sort((a, b) => a.price - b.price);
    } else if (sortBy.value === 'price-desc') {
        result.sort((a, b) => b.price - a.price);
    }

    return result;
});

const storageBaseUrl = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api').replace('/api', '/storage/');
const getImageUrl = (path) => path ? `${storageBaseUrl}${path}` : '';
const formatPrice = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

const goToDetail = (item) => {
    if (item.status === 2) return;
    router.push({ name: 'menu-detail', params: { id: item.id } });
};

onMounted(() => {
    fetchDailySpecials();
});
</script>

<template>
    <DefaultLayout>
        <div class="menu-section">
            <div class="container">
                <div class="menu-header">
                    <h1 class="section-title">🍲 Món Ngon Mỗi Ngày</h1>
                    <p class="text-center text-light mb-4">Gợi ý tuyệt vời cho bữa ăn hôm nay của bạn</p>
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
