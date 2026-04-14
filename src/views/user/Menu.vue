<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/services/api'; // Dùng instance api thay vì raw axios
import DefaultLayout from '../layouts/DefaultLayout.vue';
import '../../assets/menu.css';
const router = useRouter();

// --- STATE LỌC & DANH SÁCH ---
const categories = ref([]);
const selectedCategoryId = ref(0);
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

        // Dùng api instance bạn đã import sẵn ở trên
        await api.post('/cart', {
            menu_item_id: item.id,
            quantity: 1 // Thêm nhanh mặc định là 1
        }, {
            // Truyền header nếu instance api của bạn chưa tự động gắn token
            headers: { Authorization: `Bearer ${token}` }
        });

        // Tạm dùng alert để báo thành công, bạn có thể thay bằng thư viện Toast (như vue3-toastify)
        alert(`Đã thêm 1 "${item.name}" vào giỏ hàng!`);
    } catch (error) {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            router.push({ name: 'login' });
        } else {
            alert('Có lỗi xảy ra, vui lòng thử lại.');
        }
    } finally {
        addingItemId.value = null; // Reset trạng thái
    }
};

// --- API FETCH ---
const fetchMenuData = async () => {
    isLoading.value = true;
    try {
        
        const response = await api.get('/menu');
        
        if (response.data.success) {
            categories.value = response.data.data || [];
        }
    } catch (error) {
        console.error("Lỗi fetch menu:", error);
    } finally {
        isLoading.value = false;
    }
};

// --- LOGIC LỌC & TÌM KIẾM ---
const filteredItems = computed(() => {
    let items = [];

    // 1. Gộp dữ liệu theo danh mục an toàn (kiểm tra menu_items tồn tại)
    if (selectedCategoryId.value === 0) {
        categories.value.forEach(cat => {
            if (cat.menu_items) {
                items.push(...cat.menu_items);
            }
        });
    } else {
        const activeCategory = categories.value.find(cat => cat.id === selectedCategoryId.value);
        if (activeCategory && activeCategory.menu_items) {
            items = [...activeCategory.menu_items];
        }
    }

    // 2. LỌC TRẠNG THÁI: Chỉ lấy các món Đang bán (1) hoặc Tạm hết (2)
    items = items.filter(item => item.status !== 0);

    // 3. Tìm kiếm theo tên
    if (searchQuery.value.trim() !== '') {
        const query = searchQuery.value.toLowerCase();
        items = items.filter(item => item.name.toLowerCase().includes(query));
    }

    // 4. Sắp xếp
    if (sortBy.value === 'price-asc') {
        items.sort((a, b) => a.price - b.price);
    } else if (sortBy.value === 'price-desc') {
        items.sort((a, b) => b.price - a.price);
    }

    return items;
});

// --- HELPER ---
// Tự động lấy Base URL từ môi trường (hoặc local), bỏ đuôi /api đi để trỏ vào /storage
const storageBaseUrl = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api').replace('/api', '/storage/');
const getImageUrl = (path) => path ? `${storageBaseUrl}${path}` : '';

const formatPrice = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

// --- CHUYỂN HƯỚNG SANG TRANG CHI TIẾT ---
const goToDetail = (item) => {
    // Chặn click ngầm nếu món đó đang tạm hết hàng (đề phòng user dùng tab/enter)
    if (item.status === 2) return; 
    
    router.push({ name: 'menu-detail', params: { id: item.id } });
};

onMounted(() => {
    fetchMenuData();
});
</script>

<template>
    <DefaultLayout>
        <div class="menu-section">
            <div class="container">
                <div class="menu-header">
                    <h1 class="section-title">Khám Phá Thực Đơn</h1>
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

                <ul class="category-list">
                    <li :class="{ active: selectedCategoryId === 0 }" @click="selectedCategoryId = 0">Tất cả</li>
                    <li v-for="cat in categories" :key="cat.id" :class="{ active: selectedCategoryId === cat.id }"
                        @click="selectedCategoryId = cat.id">
                        {{ cat.name }}
                    </li>
                </ul>

                <div v-if="filteredItems.length > 0" class="menu-grid">
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

