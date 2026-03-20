<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/services/api'; // Dùng instance api thay vì raw axios
import DefaultLayout from '../layouts/DefaultLayout.vue';

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
        // Dùng api.js tự động nối Base URL (http://127.0.0.1:8000/api)
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

<style scoped>
/* GIỮ LẠI TOÀN BỘ CSS PHẦN MENU (Xóa CSS Modal từ class .modal-overlay trở đi) */
.menu-section {
    padding: 60px 10%;
    background-color: #1a1a1a;
    min-height: 80vh;
}

.section-title {
    font-size: 2.5rem;
    color: #e67e22;
    margin-bottom: 40px;
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

.category-list {
    display: flex;
    justify-content: center;
    list-style: none;
    gap: 15px;
    margin-bottom: 40px;
    flex-wrap: wrap;
}

.category-list li {
    padding: 10px 25px;
    color: white;
    border: 1px solid #d4a373;
    border-radius: 30px;
    cursor: pointer;
    transition: 0.3s;
}

.category-list li.active,
.category-list li:hover {
    background: #d4a373;
    color: #1a1a1a;
    font-weight: bold;
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
    margin-top: auto;
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

/* --- TRẠNG THÁI TẠM HẾT HÀNG --- */
.out-of-stock {
    opacity: 0.7;
    /* Làm mờ toàn bộ thẻ card */
    filter: grayscale(40%);
    /* Chuyển nhẹ sang ảnh trắng đen */
    pointer-events: none;
    /* Không cho click vào bất cứ đâu trên thẻ (ngoại trừ nút disabled) */
}

/* Đảm bảo badge và nút bấm vẫn hiển thị rõ ràng */
.out-of-stock .out-of-stock-badge,
.out-of-stock .disabled-btn {
    pointer-events: auto;
    filter: none;
}

.menu-card-header {
    position: relative;
    /* Cần thiết để định vị badge */
}

.out-of-stock-badge {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(220, 53, 69, 0.9);
    /* Màu đỏ cảnh báo */
    color: white;
    padding: 10px 20px;
    font-weight: bold;
    font-size: 1.1rem;
    border-radius: 5px;
    z-index: 10;
    text-transform: uppercase;
    letter-spacing: 1px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
}

.disabled-btn {
    background: #95a5a6 !important;
    /* Màu xám */
    cursor: not-allowed;
}

/* --- CỤM NÚT ACTION (XEM CHI TIẾT & GIỎ HÀNG) --- */
.card-actions {
    margin-top: auto;
    display: flex;
    gap: 10px;
    align-items: center;
}

/* Ghi đè lại margin-top của nút xem chi tiết cũ để nhường cho .card-actions */
.view-detail-btn {
    margin-top: 0;
    flex: 1;
    /* Cho nút xem chi tiết chiếm hết phần rộng còn lại */
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
    /* Cân bằng chiều cao với nút xem chi tiết */
}

.quick-add-cart-btn:hover:not(:disabled) {
    background: #cf6d17;
}

.quick-add-cart-btn:disabled {
    background: #ccc;
    cursor: not-allowed;
    opacity: 0.7;
}
</style>