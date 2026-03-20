<template>
    <DefaultLayout>
        <div class="introduction">
            <section class="intro-hero">
                <div class="hero-content">
                    <h1>Chào Mừng Đến Với Restaurant</h1>
                    <p class="subtitle">Trải nghiệm tinh hoa ẩm thực Nhật - Hàn trong lòng thành phố</p>
                    <button class="btn-primary" @click="gotoMenu">Bắt Đầu Đặt Món</button>
                </div>
            </section>

            <section class="about-us">
                <div class="container">
                    <h2>Về Chúng Tôi</h2>
                    <p class="about-text-main">
                        Chúng tôi là một nhà hàng uy tín với hơn 10 năm kinh nghiệm phục vụ khách hàng.
                        Cam kết cung cấp những món ăn ngon, tươi sạch và dịch vụ tận tâm.
                    </p>

                    <div class="food-articles-container">
                        <div v-for="(item, index) in featuredFoods" :key="index" class="food-article">
                            <div class="article-image">
                                <img :src="getBackendImageUrl(item.image)" :alt="item.title">
                            </div>

                            <div class="article-content">
                                <h3>{{ item.title }}</h3>
                                <p class="article-date">{{ item.date }}</p>
                                <p class="article-desc">{{ item.description }}</p>

                                <a href="#" class="read-more" @click.prevent="gotoMenu">Xem thêm &raquo;</a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section class="features">
                <div class="container">
                    <h2 class="section-title">Tại Sao Chọn Chúng Tôi?</h2>

                    <div class="feature-carousel-container">
                        <div v-for="(item, index) in featureSlides" :key="index" class="feature-slide"
                            v-show="currentIndex === index" :class="{ 'fade-in': currentIndex === index }">
                            <div class="feature-image">
                                <img :src="getImageUrl(item.image)" :alt="item.title">
                            </div>

                            <div class="feature-content">
                                <h3>{{ item.title }}</h3>
                                <p>{{ item.description }}</p>
                            </div>
                        </div>

                        <button class="nav-btn prev" @click="prevSlide">❮</button>
                        <button class="nav-btn next" @click="nextSlide">❯</button>

                        <div class="dots-container">
                            <span v-for="(item, index) in featureSlides" :key="index" class="dot"
                                :class="{ active: currentIndex === index }" @click="goToSlide(index)"></span>
                        </div>
                    </div>
                </div>
            </section>

            <section class="cta">
                <div class="container">
                    <h2>Sẵn Sàng Đặt Hàng?</h2>
                    <p>Khám phá menu đa dạng của chúng tôi ngay hôm nay</p>
                    <button class="btn-secondary" @click="gotoMenu">Xem Menu</button>
                </div>
            </section>
        </div>
    </DefaultLayout>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import DefaultLayout from "../layouts/DefaultLayout.vue";

const router = useRouter();

const gotoMenu = () => {
    router.push({ name: 'menu' });
};

// ==========================================
// 1. LOGIC CHO DANH SÁCH MÓN ĂN TRONG ABOUT US
// ==========================================
const featuredFoods = ref([]);

// Hàm lấy ảnh từ Backend (Laravel Storage)
const getBackendImageUrl = (path) => {
    if (!path) return '';
    return `http://127.0.0.1:8000/storage/${path}`;
};

// Call API lấy dữ liệu menu và gán mô tả tĩnh
const fetchFeaturedFoods = async () => {
    try {
        const response = await axios.get('http://127.0.0.1:8000/api/menu');
        if (response.data.success) {
            let allItems = [];
            response.data.data.forEach(cat => {
                allItems.push(...cat.menu_items);
            });

            // Lấy 4 món ăn đầu tiên (hoặc tùy ý) để hiển thị
            const selectedItems = allItems.slice(0, 4);

            // Mảng chứa các mô tả tĩnh được viết sẵn ở Frontend
            const staticDescriptions = [
                "Đậu nành Nhật luộc (Edamame) - Edamame món khai vị thanh đạm không thể thiếu trong ẩm thực Nhật Bản.Những hạt đậu nành non được luộc vừa chín tới, giữ nguyên màu xanh mướt bắt mắt cùng vị ngọt bùi tự nhiên.Chỉ cần một chút muối biển phủ nhẹ lên từng trái, món ăn đơn giản này lại chinh phục thực khách bởi sự thanh khiết và lành mạnh.Thích hợp nhâm nhi cùng bia lạnh hay trà nóng, edamame là lựa chọn hoàn hảo để bắt đầu một bữa ăn Nhật đúng điệu.",
                "Bánh xèo Nhật Bản (Okonomiyaki) Okonomiyaki – bánh xèo theo ý thích của người Nhật – là sự kết hợp hài hòa giữa bột mì, bắp cải, trứng cùng vô số nhân phong phú như tôm, mực, thịt ba chỉ.Mặt bánh được chiên vàng giòn, phủ lên lớp sốt Okonomi đậm đà, mayonnaise béo ngậy và rong biển xanh thơm mát.Trứng ốp lòng đặt trên đỉnh khiến món ăn thêm phần hấp dẫn.Mỗi miếng cắt ra là một trải nghiệm vị giác đa tầng, khó quên từ lần thưởng thức đầu tiên.",
                "Bạch tuộc nướng (Takoyaki) Takoyaki là linh hồn của ẩm thực đường phố Osaka, nay xuất hiện trên bàn ăn với trọn vẹn hương vị chính thống.Từng viên bột tròn căng mọng, bên trong ẩn chứa miếng bạch tuộc tươi mềm dai, được nướng chín vàng đều trên khuôn gang nóng.Lớp sốt takoyaki đậm vị, rắc bonito bào mỏng nhảy múa theo hơi nóng và mảnh rong biển xanh tạo nên bức tranh ẩm thực sống động.Ăn nóng để cảm nhận trọn vẹn cái giòn bên ngoài, mềm tan bên trong.",
                "Kim chi cải thảo Kim chi cải thảo – quốc hồn quốc túy của ẩm thực Hàn Quốc – được làm thủ công theo công thức truyền thống với cải thảo tươi, ớt đỏ, tỏi, gừng và mắm tép lên men tự nhiên.Qua thời gian ủ kỹ lưỡng, từng lớp lá cải thấm đẫm gia vị, đạt được vị cay nồng, chua thanh và mặn ngọt cân bằng tinh tế.Không chỉ là món ăn kèm không thể thiếu, kim chi còn giàu lợi khuẩn tốt cho tiêu hóa, là món ăn vừa ngon miệng vừa tốt cho sức khỏe."
            ];

            // Map dữ liệu: Tên/Ảnh (Động) + Mô tả/Ngày (Tĩnh)
            featuredFoods.value = selectedItems.map((item, index) => ({
                id: item.id,
                title: item.name,           // Từ Database
                image: item.img_url,        // Từ Database
                date: '25/06/2025',         // Tĩnh
                description: staticDescriptions[index] || staticDescriptions[0] // Tĩnh
            }));
        }
    } catch (error) {
        console.error("Lỗi fetch món ăn:", error);
    }
};

// ==========================================
// 2. LOGIC CHO CAROUSEL (TẠI SAO CHỌN CHÚNG TÔI)
// ==========================================
const currentIndex = ref(0);
let timer = null;

const featureSlides = ref([
    {
        title: 'KHÔNG GIAN NHÀ HÀNG',
        description: 'Đến với Restaurant, khách hàng sẽ được đắm chìm trong một không gian ẩm thực được thiết kế vô cùng sang trọng, ấm áp và tinh tế. Từng chi tiết trong nhà hàng đều được chăm chút tỉ mỉ, từ ánh sáng, bàn ghế, cách bài trí cho đến mùi hương dễ chịu, tạo nên bầu không khí thư giãn và gần gũi. Không gian rộng rãi, sạch sẽ và thoáng đãng giúp khách hàng cảm nhận được sự thoải mái như đang ở chính ngôi nhà của mình.',
        image: 'khong-gian.jpg'
    },
    {
        title: 'CHẤT LƯỢNG DỊCH VỤ',
        description: 'Không những có không gian ẩm thực sang trọng và tuyệt vời mà tại Restaurant, chúng tôi luôn tự hào về chất lượng dịch vụ hàng đầu cùng đội ngũ nhân viên được đào tạo vô cùng chuyên nghiệp, tận tâm và thân thiện. Đến với nhà hàng chúng tôi, khách hàng chỉ việc tận hưởng bữa ăn cùng gia đình và bạn bè. Việc còn lại đã có chúng tôi lo.',
        image: 'dich-vu.jpg'
    },
    {
        title: 'MÓN ĂN ĐẶC SẮC',
        description: 'Thực đơn tại Restaurant là sự giao thoa tinh tế giữa hai nền ẩm thực lớn: Nhật Bản và Hàn Quốc. Chúng tôi tự hào mang đến những trải nghiệm hương vị đa dạng, từ món Sashimi tổng hợp tươi rói, Mì Ramen Tonkotsu đậm đà, cho đến bát Cơm trộn thố đá nóng hổi. Mỗi món ăn đều được các đầu bếp tâm huyết chế biến, giữ trọn vẹn bản sắc văn hóa.',
        image: 'mon-an.jpg'
    },
    {
        title: 'NGUYÊN LIỆU TƯƠI SẠCH',
        description: 'Triết lý ẩm thực của chúng tôi bắt nguồn từ chữ "Tâm" và sự "Tươi". Tại Restaurant, nguồn nguyên liệu được tuyển chọn khắt khe mỗi ngày để đảm bảo chất lượng cao nhất. Toàn bộ hải sản dùng cho Sushi và Sashimi đều được nhập khẩu và kiểm định độ tươi sống tuyệt đối, đảm bảo sự an toàn và bổ dưỡng cho sức khỏe của mỗi khách hàng.',
        image: 'nguyen-lieu.jpg'
    }
]);

// Hàm lấy đường dẫn ảnh tĩnh từ thư mục assets (Dành cho Vite/Vue 3)
const getImageUrl = (filename) => {
    return new URL(`../../assets/img/${filename}`, import.meta.url).href;
};

const nextSlide = () => { currentIndex.value = (currentIndex.value + 1) % featureSlides.value.length; resetTimer(); };
const prevSlide = () => { currentIndex.value = (currentIndex.value - 1 + featureSlides.value.length) % featureSlides.value.length; resetTimer(); };
const goToSlide = (index) => { currentIndex.value = index; resetTimer(); };

const startTimer = () => { timer = setInterval(() => { currentIndex.value = (currentIndex.value + 1) % featureSlides.value.length; }, 5000); };
const resetTimer = () => { clearInterval(timer); startTimer(); };

onMounted(() => {
    fetchFeaturedFoods(); // Gọi API khi trang vừa load
    startTimer();
});

onUnmounted(() => {
    clearInterval(timer);
});
</script>

<style scoped>
/* Reset & Base */
.introduction {
    width: 100%;
    color: #333;
    line-height: 1.6;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

/* Hero Section */
.intro-hero {
    background-color: #1a1a1a;
    background-size: cover;
    background-position: center;
    color: white;
    padding: 120px 20px;
    text-align: center;
    min-height: 500px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.hero-content h1 {
    font-size: 3.5rem;
    margin-bottom: 20px;
    font-weight: 800;
    text-transform: uppercase;
}

.subtitle {
    font-size: 1.5rem;
    margin-bottom: 40px;
    font-style: italic;
}

/* About Us Section */
.about-us {
    padding: 80px 0;
    background-color: #ffffff;
    text-align: center;
}

.about-us h2 {
    font-size: 2.8rem;
    color: #2c3e50;
    margin-bottom: 30px;
    font-weight: 700;
    position: relative;
    display: inline-block;
}

.about-us h2::after {
    content: "";
    display: block;
    width: 60px;
    height: 4px;
    background: #e67e22;
    margin: 15px auto 0;
    border-radius: 2px;
}

.about-text-main {
    max-width: 800px;
    margin: 0 auto 50px;
    font-size: 1.15rem;
    color: #666;
    line-height: 1.8;
}

/* ==========================================
   CSS MỚI CHO BÀI VIẾT MÓN ĂN (MÔ PHỎNG ẢNH MẪU)
   ========================================== */
.food-articles-container {
    display: flex;
    flex-direction: column;
    gap: 40px;
    max-width: 900px;
    margin: 0 auto;
    text-align: left;
}

.food-article {
    display: flex;
    align-items: flex-start;
    gap: 30px;
    background: #fff;
    padding-bottom: 30px;
    border-bottom: 1px solid #eaeaea;
}

/* Ẩn viền bài cuối cùng */
.food-article:last-child {
    border-bottom: none;
    padding-bottom: 0;
}

.article-image {
    flex: 0 0 300px;
    /* Cố định chiều rộng ảnh */
    height: 200px;
    border-radius: 8px;
    overflow: hidden;
}

.article-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s;
}

.article-image:hover img {
    transform: scale(1.05);
    /* Hiệu ứng zoom nhẹ khi đưa chuột vào ảnh */
}

.article-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
}

.article-content h3 {
    font-size: 1.4rem;
    color: #000;
    margin-bottom: 10px;
    font-weight: 700;
}

.article-date {
    font-size: 0.9rem;
    color: #888;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 1px solid #f0f0f0;
    /* Kẻ vạch xám mỏng dưới ngày tháng */
}

.article-desc {
    color: #555;
    font-size: 1.05rem;
    line-height: 1.7;
    margin-bottom: 15px;
    text-align: justify;
}

.read-more {
    color: #e67e22;
    font-weight: bold;
    text-decoration: none;
    font-size: 1rem;
    display: inline-block;
}

.read-more:hover {
    color: #d35400;
    text-decoration: underline;
}

/* CTA Section */
.cta {
    background-color: #1a1a1a;
    padding: 80px 20px;
    text-align: center;
    color: white;
}

.btn-primary,
.btn-secondary {
    padding: 15px 40px;
    font-size: 1.1rem;
    border-radius: 50px;
    cursor: pointer;
    font-weight: bold;
    border: none;
    transition: 0.3s;
    background-color: #e67e22;
    color: white;
}

.btn-primary:hover,
.btn-secondary:hover {
    background-color: #d35400;
    transform: scale(1.05);
}

/* --- CSS CHO FEATURE CAROUSEL TĨNH --- */
.features {
    padding: 80px 20px;
    background-color: #1a1a1a;
}

.section-title {
    font-size: 2.5rem;
    text-align: center;
    margin-bottom: 60px;
    color: #ffffff;
    font-weight: 700;
    position: relative;
}

.section-title::after {
    content: "";
    display: block;
    width: 80px;
    height: 4px;
    background: #e67e22;
    margin: 15px auto;
}

.feature-carousel-container {
    position: relative;
    max-width: 1000px;
    margin: 0 auto;
    background: #ffffff;
    border-radius: 15px;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.feature-slide {
    display: flex;
    align-items: stretch;
    min-height: 400px;
}

.feature-image {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f5f5f5;
    overflow: hidden;
}

.feature-image img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    padding: 20px;
}

.feature-content {
    flex: 1;
    padding: 50px 40px;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.feature-content h3 {
    font-size: 1.8rem;
    margin-bottom: 20px;
    color: #e67e22;
    font-weight: 700;
    text-transform: uppercase;
}

.feature-content p {
    color: #555;
    font-size: 1.05rem;
    text-align: justify;
    line-height: 1.7;
}

.nav-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background-color: rgba(255, 255, 255, 0.9);
    color: #e67e22;
    border: none;
    width: 45px;
    height: 45px;
    cursor: pointer;
    font-size: 1.5rem;
    border-radius: 50%;
    transition: all 0.3s;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
}

.nav-btn:hover {
    background-color: #e67e22;
    color: white;
}

.prev {
    left: 15px;
}

.next {
    right: 15px;
}

.dots-container {
    position: absolute;
    bottom: 20px;
    width: 100%;
    display: flex;
    justify-content: center;
    gap: 8px;
    z-index: 10;
}

.dot {
    height: 12px;
    width: 12px;
    background-color: rgba(230, 126, 34, 0.3);
    border-radius: 50%;
    cursor: pointer;
    transition: 0.3s;
}

.dot.active {
    background-color: #e67e22;
    width: 30px;
    border-radius: 6px;
}

.fade-in {
    animation: fadeIn 0.8s ease-in-out forwards;
}

@keyframes fadeIn {
    from {
        opacity: 0.3;
        transform: translateY(15px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Responsive cho Điện Thoại & Tablet */
@media (max-width: 992px) {
    .hero-content h1 {
        font-size: 2.5rem;
    }
}

@media (max-width: 768px) {
    .about-us {
        padding: 60px 20px;
    }

    .about-us h2 {
        font-size: 2rem;
    }

    .about-text-main {
        font-size: 1rem;
    }

    .feature-slide {
        flex-direction: column;
    }

    .feature-image img {
        height: 250px;
    }

    .feature-content {
        padding: 30px 20px 60px;
    }

    .feature-content h3 {
        font-size: 1.5rem;
    }

    /* Gập dọc layout phần Món ăn trên mobile */
    .food-article {
        flex-direction: column;
        gap: 15px;
    }

    .article-image {
        flex: auto;
        width: 100%;
        height: 250px;
    }
}
</style>