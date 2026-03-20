<template>
    <div class="layout">
        <nav class="navbar">
            <div class="logo">RESTAURANT</div>

            <div class="hamburger" @click="toggleMenu">
                ☰
            </div>

            <ul class="nav-links" :class="{ active: isMenuOpen }">
                <li><router-link to="/">Trang chủ</router-link></li>
                <li><router-link to="/about">Giới thiệu</router-link></li>

                <li class="dropdown">
                    <a href="#" class="dropbtn" @click="toggleDropdown">
                        Danh sách món
                        <span class="arrow" :class="{ rotate: isDropdownOpen }">▼</span>
                    </a>

                    <ul class="dropdown-content" :class="{ show: isDropdownOpen }">
                        <li v-for="item in menuItems" :key="item.id">
                            <router-link to="/menu" @click="closeAll">
                                {{ item.name }}
                            </router-link>
                        </li>
                    </ul>
                </li>

                <li><router-link to="/menu">Thực đơn</router-link></li>
                <li><router-link to="/reservation">Đặt bàn</router-link></li>
                <li><router-link to="/contact">Liên hệ</router-link></li>
            </ul>

            <div class="nav-actions d-flex align-items-center gap-4">

                <div class="cart-icon position-relative" style="cursor: pointer;" @click="router.push('/cart')">
                    <i class="bi bi-cart3 fs-3 text-dark"></i>
                    <span v-if="cartCount > 0"
                        class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                        {{ cartCount }}
                    </span>
                </div>

                <div class="user-dropdown position-relative">
                    <div class="user-icon" style="cursor: pointer;" @click="toggleUserDropdown">
                        <i class="bi bi-person-circle fs-3 text-dark"></i>
                    </div>

                    <ul class="user-dropdown-content" :class="{ show: isUserDropdownOpen }">
                        <template v-if="isLoggedIn">
                            <li class="user-name">Xin chào, {{ user?.name }}</li>
                            <li>
                                <router-link to="/orders" @click="isUserDropdownOpen = false">
                                    <i class="bi bi-receipt me-2"></i>Xem hoá đơn
                                </router-link>
                            </li>
                            <li>
                                <router-link to="/my-reservations" @click="isUserDropdownOpen = false">
                                    <i class="bi bi-person me-2"></i>Lịch sử đặt bàn
                                </router-link>
                            </li>
                            <li>
                                <a href="#" @click.prevent="handleLogout">
                                    <i class="bi bi-box-arrow-right me-2"></i>Đăng xuất
                                </a>
                            </li>
                        </template>

                        <template v-else>
                            <li>
                                <router-link to="/login" @click="isUserDropdownOpen = false">
                                    <i class="bi bi-box-arrow-in-right me-2"></i>Đăng nhập
                                </router-link>
                            </li>
                            <li>
                                <router-link to="/register" @click="isUserDropdownOpen = false">
                                    <i class="bi bi-person-plus me-2"></i>Đăng ký
                                </router-link>
                            </li>
                        </template>
                    </ul>
                </div>

            </div>
        </nav>

        <main class="content">
            <slot></slot>
        </main>

        <footer class="footer">
            <div class="footer-container">
                <div class="footer-col">
                    <h3 class="footer-title">VỀ RESTAURANT</h3>
                    <p class="footer-text">
                        Tự hào mang đến những trải nghiệm ẩm thực tinh túy từ các nguyên liệu tươi ngon nhất. Không gian
                        ấm cúng, phục vụ tận tâm.
                    </p>
                    <p class="footer-text"><b>Địa chỉ:</b> 123 Đường ABC, Quận 1, TP.HCM</p>
                </div>

                <div class="footer-col">
                    <h3 class="footer-title">CHÍNH SÁCH</h3>
                    <ul class="footer-links">
                        <li><router-link to="/privacy">Chính sách bảo mật</router-link></li>
                        <li><router-link to="/terms">Điều khoản dịch vụ</router-link></li>
                        <li><router-link to="/shipping">Chính sách giao hàng</router-link></li>
                        <li><router-link to="/refund">Quy định đổi trả</router-link></li>
                    </ul>
                </div>

                <div class="footer-col">
                    <h3 class="footer-title">THEO DÕI CHÚNG TÔI</h3>
                    <div class="social-links">
                        <a href="https://www.facebook.com" class="social-item">Facebook</a>
                        <a href="https://www.instagram.com" class="social-item">Instagram</a>
                        <a href="https://www.tiktok.com" class="social-item">TikTok</a>
                        <a href="https://www.youtube.com" class="social-item">Youtube</a>
                    </div>
                </div>

                <div class="footer-col">
                    <h3 class="footer-title">THANH TOÁN</h3>
                    <div class="payment-methods">
                        <span class="payment-icon">Visa</span>
                        <span class="payment-icon">Mastercard</span>
                        <span class="payment-icon">Momo</span>
                        <span class="payment-icon">ZaloPay</span>
                    </div>
                    <p class="footer-text" style="margin-top: 15px;">Hotline: 1900 1234</p>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2024 Restaurant. All Rights Reserved.</p>
            </div>
        </footer>

    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/composables/useAuth';
import axios from 'axios';
import { useCart } from '@/composables/useCart';

const router = useRouter();
const { isLoggedIn, user, logout } = useAuth();
const { cartCount, fetchCart } = useCart();

// Đưa các ref lên đầu
const menuItems = ref([]);
const isMenuOpen = ref(false);
const isDropdownOpen = ref(false);
const isUserDropdownOpen = ref(false); // Thêm state cho dropdown người dùng

const toggleMenu = () => {
    isMenuOpen.value = !isMenuOpen.value;
};

async function handleLogout() {
    isUserDropdownOpen.value = false; // Đóng menu sau khi click
    try {
        await logout();
    } finally {
        router.push('/login');
    }
}

const closeAll = () => {
    isMenuOpen.value = false;
    isDropdownOpen.value = false;
    isUserDropdownOpen.value = false;
};

const toggleDropdown = (event) => {
    event.preventDefault();
    isDropdownOpen.value = !isDropdownOpen.value;
    isUserDropdownOpen.value = false; // Mở cái này thì đóng cái kia
};

const toggleUserDropdown = (event) => {
    event.preventDefault();
    isUserDropdownOpen.value = !isUserDropdownOpen.value;
    isDropdownOpen.value = false; // Mở cái này thì đóng cái kia
};

// Đóng các dropdown khi click ra ngoài
const closeClickOutside = (e) => {
    if (!e.target.closest('.dropdown')) {
        isDropdownOpen.value = false;
    }
    if (!e.target.closest('.user-dropdown')) {
        isUserDropdownOpen.value = false;
    }
};

const fetchMenuItems = async () => {
    try {
        const response = await axios.get('http://127.0.0.1:8000/api/menu-items');

        // KIỂM TRA: Nếu API trả về cấu trúc mới (có success) thì lấy response.data.data
        if (response.data && response.data.success) {
            menuItems.value = response.data.data;
        }
        // Nếu API trả về mảng trực tiếp (trường hợp dùng lại API cũ)
        else {
            menuItems.value = response.data;
        }

    } catch (error) {
        console.error("Lỗi khi lấy thực đơn:", error);
    }
};

onMounted(() => {
    fetchCart();
    fetchMenuItems();
    window.addEventListener('click', closeClickOutside);
});

onUnmounted(() => {
    window.removeEventListener('click', closeClickOutside);
});
</script>

<style scoped>
/* ================= NAVBAR ================= */
.navbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 5%;
    background: white;
    border-bottom: 2px solid #e67e22;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    position: sticky;
    top: 0;
    z-index: 1000;
}

.logo {
    font-size: 1.6rem;
    font-weight: bold;
    color: #e67e22;
}

/* ================= MENU ================= */
.nav-links {
    display: flex;
    list-style: none;
    gap: 25px;
    margin: 0;
    padding: 0;
}

.nav-links a {
    text-decoration: none;
    color: #333;
    font-weight: 500;
    transition: 0.3s;
}

.nav-links a:hover {
    color: #e67e22;
}

/* ================= MENU DROPDOWN (CŨ) ================= */
.dropdown {
    position: relative;
}

.dropbtn {
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 5px;
}

.arrow {
    font-size: 0.7rem;
    transition: 0.3s;
}

.arrow.rotate {
    transform: rotate(180deg);
}

.dropdown-content {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    background: white;
    min-width: 250px;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    margin-top: 10px;
    padding: 10px 0;
    list-style: none;
    max-height: 400px;
    overflow-y: auto;
    z-index: 999;
}

.dropdown-content.show {
    display: block;
}

.dropdown-content li a {
    display: block;
    padding: 12px 20px;
    color: #444;
    border-bottom: 1px solid #f2f2f2;
    transition: 0.2s;
}

.dropdown-content li a:hover {
    background: #fff5eb;
    color: #e67e22;
    padding-left: 25px;
}

/* ================= USER DROPDOWN (MỚI) ================= */
.user-dropdown-content {
    display: none;
    position: absolute;
    top: 100%;
    right: 0;
    /* Căn phải để không bị tràn màn hình */
    background: white;
    min-width: 220px;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    margin-top: 15px;
    padding: 10px 0;
    list-style: none;
    z-index: 999;
}

.user-dropdown-content.show {
    display: block;
}

.user-dropdown-content .user-name {
    padding: 15px 20px;
    font-weight: bold;
    color: #e67e22;
    border-bottom: 1px solid #eee;
    margin-bottom: 5px;
    font-size: 1.05rem;
}

.user-dropdown-content li a {
    display: block;
    padding: 12px 20px;
    color: #444;
    text-decoration: none;
    transition: 0.2s;
}

.user-dropdown-content li a:hover {
    background: #fff5eb;
    color: #e67e22;
}

/* ================= NAV ACTIONS (CART + USER) ================= */
.nav-actions {
    display: flex;
    align-items: center;
}

.nav-actions .badge {
    font-size: 0.7rem;
    padding: 0.35em 0.6em;
}

/* ================= HAMBURGER ================= */
.hamburger {
    display: none;
    font-size: 26px;
    cursor: pointer;
}

/* ================= CONTENT & FOOTER ================= */
.content {
    padding: 20px;
}

.footer {
    background: rgba(0, 0, 0, 0.4);
    padding: 50px 5% 20px;
    margin-top: 40px;
}

.footer-container {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 30px;
    max-width: 1200px;
    margin: auto;
}

.footer-title {
    font-size: 1.1rem;
    font-weight: bold;
    color: #e67e22;
    margin-bottom: 15px;
}

.footer-text {
    font-size: 0.9rem;
    color: #f1ecec;
    line-height: 1.6;
}

.footer-links {
    list-style: none;
    padding: 0;
}

.footer-links li {
    margin-bottom: 10px;
}

.footer-links a {
    color: #f1ecec;
    text-decoration: none;
    font-size: 0.9rem;
}

.footer-links a:hover {
    color: #e67e22;
}

.social-links {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.social-item {
    text-decoration: none;
    color: #f1ecec;
}

.payment-methods {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}

.payment-icon {
    background: white;
    padding: 5px 10px;
    border-radius: 4px;
    font-size: 0.75rem;
    color: #333;
}

.footer-bottom {
    text-align: center;
    margin-top: 40px;
    border-top: 1px solid #eee;
    padding-top: 20px;
    font-size: 0.8rem;
    color: #f1ecec;
}

/* ================= RESPONSIVE ================= */
@media (max-width:1024px) {
    .nav-links {
        gap: 15px;
    }

    .footer-container {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width:768px) {
    .hamburger {
        display: block;
    }

    .nav-links {
        display: none;
        flex-direction: column;
        position: absolute;
        top: 100%;
        left: 0;
        width: 100%;
        background: white;
        padding: 20px;
        box-shadow: 0 5px 10px rgba(0, 0, 0, 0.1);
    }

    .nav-links.active {
        display: flex;
    }

    .nav-links li {
        padding: 10px 0;
    }

    .dropdown-content {
        position: relative;
        box-shadow: none;
        border: none;
    }
}

@media (max-width:480px) {
    .footer-container {
        grid-template-columns: 1fr;
    }
}
</style>