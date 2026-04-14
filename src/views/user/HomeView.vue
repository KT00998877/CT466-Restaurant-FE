<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router'; // 1. Import useRouter
import axios from 'axios';
import DefaultLayout from '../layouts/DefaultLayout.vue';

const router = useRouter(); // Khởi tạo router

// --- STATE ---
const categories = ref([]);           // Dữ liệu từ API
const selectedCategoryId = ref(null); // ID danh mục đang chọn
const isLoading = ref(true);          // Trạng thái load
const currentIndex = ref(0);          // Index cho Carousel
let timer = null;

// -- LOGIC scroll tự động --
const menuSectionRef = ref(null); // Tạo tham chiếu đến khu vực Menu

const scrollToMenu = () => {
    if (menuSectionRef.value) {
        menuSectionRef.value.scrollIntoView({ behavior: 'smooth' });
    }
};

// --- API FETCH ---
const fetchMenuData = async () => {
    try {
        isLoading.value = true;
        const response = await axios.get('http://127.0.0.1:8000/api/menu');
        if (response.data.success) {
            categories.value = response.data.data;
            // Mặc định chọn danh mục đầu tiên
            if (categories.value.length > 0) {
                selectedCategoryId.value = categories.value[0].id;
            }
        }
    } catch (error) {
        console.error("Lỗi fetch menu:", error);
    } finally {
        isLoading.value = false;
    }
};

// --- LOGIC CHUYỂN HƯỚNG CHI TIẾT ---
// 2. Thay thế openDetail bằng goToDetail
const goToDetail = (item) => {
    router.push({ name: 'menu-detail', params: { id: item.id } });
};

// Lấy danh sách món ăn cho Carousel (Lọc từ danh mục ID 5 - Combo)
const carouselItems = computed(() => {
    const comboCat = categories.value.find(cat => cat.id === 5);
    return comboCat ? comboCat.menu_items : [];
});

// Lấy danh sách món ăn cho Menu theo Category đang chọn
const filteredItems = computed(() => {
    const activeCategory = categories.value.find(cat => cat.id === selectedCategoryId.value);
    return activeCategory ? activeCategory.menu_items : [];
});

// --- HELPER FUNCTIONS ---
const getImageUrl = (path) => {
    if (!path) return '';
    const backendUrl = 'http://127.0.0.1:8000';
    return `${backendUrl}/storage/${path}`;
};

const formatPrice = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

// --- CAROUSEL LOGIC ---
const nextSlide = () => {
    if (carouselItems.value.length > 0) {
        currentIndex.value = (currentIndex.value + 1) % carouselItems.value.length;
    }
};

const prevSlide = () => {
    if (carouselItems.value.length > 0) {
        currentIndex.value = (currentIndex.value - 1 + carouselItems.value.length) % carouselItems.value.length;
    }
};

const startTimer = () => {
    stopTimer();
    timer = setInterval(nextSlide, 5000);
};

const stopTimer = () => { if (timer) clearInterval(timer); };

// --- LIFECYCLE ---
onMounted(() => {
    fetchMenuData();
    startTimer();
});
onUnmounted(() => stopTimer());
</script>

<template>
    <DefaultLayout>
        <div class="hero-banner">
            <div class="hero-content">
                <h1>Chào mừng đến với Nhà Hàng của chúng tôi</h1>
                <p>Trải nghiệm ẩm thực tinh tế và dịch vụ chuyên nghiệp.</p>
                <button class="btn-cta" @click="scrollToMenu">Khám phá thực đơn</button>
            </div>
        </div>

        <div class="menu-section" ref="menuSectionRef">
            <div class="container" v-if="!isLoading">
            </div>
        </div>

        <div class="carousel-section" v-if="carouselItems.length > 0">
            <h1 class="section-title">Combo Khuyến Mãi Hot</h1>
            <div class="carousel-container">
                <div v-for="(item, index) in carouselItems" :key="item.id" class="carousel-slide"
                    :class="{ 'fade': index === currentIndex }" v-show="index === currentIndex">

                    <img :src="getImageUrl(item.img_url)" :alt="item.name" class="carousel-img clickable-img"
                        @click="goToDetail(item)">

                    <div class="carousel-caption">
                        <h2>{{ item.name }}</h2>
                        <p class="carousel-desc">{{ item.description }}</p>
                        <div class="carousel-price">{{ formatPrice(item.price) }}</div>

                        <button class="carousel-btn" @click="goToDetail(item)">Xem chi tiết Combo</button>
                    </div>
                </div>

                <button class="nav-btn prev" @click="prevSlide(); startTimer()">❮</button>
                <button class="nav-btn next" @click="nextSlide(); startTimer()">❯</button>
            </div>
        </div>

        <div class="menu-section">
            <div class="container" v-if="!isLoading">
                <div class="menu-header">
                    <span class="decor-icon">🍴</span>
                    <h1 class="section-title">Thực đơn của chúng tôi</h1>
                    <span class="decor-icon">🍴</span>
                </div>

                <ul class="category-list">
                    <li v-for="cat in categories" :key="cat.id" :class="{ active: selectedCategoryId === cat.id }"
                        @click="selectedCategoryId = cat.id">
                        {{ cat.name }}
                    </li>
                </ul>

                <div class="menu-grid">
                    <div v-for="item in filteredItems" :key="item.id" class="menu-card fade-in">
                        <div class="menu-card-header">
                            <div class="sale-badge">- 10%</div>
                            <img :src="getImageUrl(item.img_url)" :alt="item.name" class="menu-item-img">
                            <div class="wishlist-icon">🤍</div>
                        </div>
                        <div class="menu-card-body">
                            <h3>{{ item.name }}</h3>
                            <div class="price-container">
                                <span class="current-price">{{ formatPrice(item.price) }}</span>
                                <span class="old-price">{{ formatPrice(item.price * 1.1) }}</span>
                            </div>
                            <button class="view-detail-btn" @click="goToDetail(item)">Xem chi tiết</button>
                        </div>
                    </div>
                </div>
            </div>
            <div v-else class="loading-state">
                <p>Đang tải thực đơn tinh tế...</p>
            </div>
        </div>

    </DefaultLayout>
</template>

<style scoped>

.hero-banner {
    height: 80vh;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: rgba(0, 0, 0, 0.4);
}

.hero-content {
    text-align: center;
    color: white;
    max-width: 800px;
}

.hero-content h1 {
    font-size: 3.5rem;
    font-weight: bold;
    margin-bottom: 20px;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7);
}

.hero-content p {
    font-size: 1.5rem;
    margin-bottom: 40px;
    text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.7);
}

.btn-cta {
    padding: 15px 30px;
    font-size: 1.2rem;
    font-weight: bold;
    background-color: #e67e22;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s ease;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
}

.btn-cta:hover {
    background-color: #d35400;
}

.about-section {
    padding: 80px 10%;
    background-color: rgba(0, 0, 0, 0.6);
    color: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 40px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.about-text {
    flex: 1;
}

.about-text h1 {
    font-size: 2.5rem;
    color: #e67e22;
    margin-bottom: 20px;
}

.about-text p {
    font-size: 1.2rem;
    line-height: 1.6;
}

.about-images {
    flex: 1;
    display: flex;
    gap: 20px;
}

.about-img {
    width: 250px;
    height: 350px;
    object-fit: cover;
    border-radius: 15px;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
    transition: transform 0.3s ease;
}

.about-img:hover {
    transform: scale(1.05);
}

.clickable-img {
    cursor: pointer;
    transition: transform 0.5s ease;
}

.carousel-slide:hover .clickable-img {
    transform: scale(1.02);
    
}

.carousel-section {
    padding: 60px 10%;
    background-color: #1a1a1a;
    text-align: center;
}

.section-title {
    font-size: 2.5rem;
    color: #e67e22;
    margin-bottom: 40px;
    font-weight: bold;
}

.carousel-container {
    position: relative;
    max-width: 1000px;
    margin: auto;
    overflow: hidden;
    border-radius: 20px;
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.5);
}

.carousel-slide {
    position: relative;
    height: 500px;
}

.carousel-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.carousel-caption {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.9));
    color: white;
    padding: 40px 20px;
    text-align: center;
    z-index: 5;
    pointer-events: none;
}

.carousel-caption h2 {
    font-size: 2rem;
    color: #e67e22;
    margin-bottom: 10px;
}

.carousel-desc {
    font-size: 1.1rem;
    max-width: 600px;
    margin: 0 auto 10px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    /* Giới hạn mô tả 2 dòng tránh làm caption quá cao */
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.carousel-price {
    font-size: 1.5rem;
    font-weight: bold;
    color: #fff;
    margin-bottom: 20px;
}

.carousel-caption p {
    font-size: 1.1rem;
    max-width: 600px;
    margin: 0 auto;
}


.carousel-btn {
    pointer-events: auto;
    /* QUAN TRỌNG: Cho phép click vào nút này dù caption là none */
    background-color: #e67e22;
    color: white;
    border: none;
    padding: 10px 25px;
    border-radius: 25px;
    font-size: 1.1rem;
    font-weight: bold;
    cursor: pointer;
    transition: background-color 0.3s, transform 0.2s;
    box-shadow: 0 4px 10px rgba(230, 126, 34, 0.4);
}

.carousel-btn:hover {
    background-color: #d35400;
    transform: translateY(-2px);
    /* Hiệu ứng nảy nhẹ khi hover */
}

.fade {
    animation: fadeEffect 0.8s ease-in-out;
    animation-fill-mode: forwards;
}

@keyframes fadeEffect {
    from {
        opacity: 0.4;
    }

    to {
        opacity: 1;
    }
}

.nav-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background-color: rgba(230, 126, 34, 0.8);
    color: white;
    border: none;
    padding: 15px 20px;
    cursor: pointer;
    font-size: 1.5rem;
    border-radius: 50%;
    transition: 0.3s;
    z-index: 99;
    pointer-events: auto;
}

.nav-btn:hover {
    background-color: #e67e22;
}

.prev {
    left: 20px;
}

.next {
    right: 20px;
}

.dots-container {
    position: absolute;
    bottom: 15px;
    width: 100%;
    display: flex;
    justify-content: center;
    gap: 10px;
}

.dot {
    height: 12px;
    width: 12px;
    background-color: rgba(255, 255, 255, 0.5);
    border-radius: 50%;
    cursor: pointer;
    transition: 0.3s;
}

.dot.active {
    background-color: #e67e22;
    width: 30px;
    border-radius: 10px;
}

.menu-section {
    padding: 60px 10%;
    background-color: #1a1a1a;
    text-align: center;
}

.menu-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 15px;
    margin-bottom: 40px;
}

.section-title {
    font-family: 'Dancing Script', cursive;
    font-size: 2.5rem;
    color: white;
    margin: 0;
}

.decor-icon {
    color: #d4a373;
    font-size: 1.5rem;
}

.category-list {
    display: flex;
    justify-content: center;
    list-style: none;
    padding: 0;
    margin-bottom: 40px;
    gap: 10px;
}

.category-list li {
    padding: 8px 20px;
    background-color: transparent;
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.8);
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: 0.3s;
}

.category-list li.active {
    background-color: #d4a373;
    color: white;
    border-color: #d4a373;
}

.menu-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 20px;
}

.menu-card {
    background-color: #f9f9f9;
    border-radius: 4px;
    overflow: hidden;
    position: relative;
    padding-bottom: 15px;
}

.menu-card-header {
    position: relative;
}

.menu-item-img {
    width: 100%;
    height: 180px;
    object-fit: cover;
}

.sale-badge {
    position: absolute;
    top: 10px;
    right: 10px;
    background-color: #e74c3c;
    color: white;
    padding: 2px 8px;
    font-size: 0.8rem;
    border-radius: 10px;
    z-index: 2;
}

.wishlist-icon {
    position: absolute;
    bottom: -15px;
    left: 50%;
    transform: translateX(-50%);
    background: #d4a373;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    border: 2px solid white;
}

.menu-card-body {
    padding: 25px 10px 10px;
    text-align: center;
}

.menu-card-body h3 {
    color: #333;
    font-size: 1rem;
    margin-bottom: 10px;
    font-weight: bold;
}

.price-container {
    margin-bottom: 15px;
}

.current-price {
    color: #e74c3c;
    font-weight: bold;
    font-size: 1.1rem;
    margin-right: 8px;
}

.old-price {
    color: #999;
    text-decoration: line-through;
    font-size: 0.85rem;
}

.view-detail-btn {
    background-color: #d4a373;
    color: white;
    border: none;
    padding: 8px 20px;
    border-radius: 5px;
    cursor: pointer;
    font-size: 0.9rem;
    width: 80%;
    transition: 0.3s;
}

.view-detail-btn:hover {
    background-color: #bc8f62;
}

.loading-state {
    color: white;
    font-size: 1.2rem;
    margin-top: 50px;
}

</style>