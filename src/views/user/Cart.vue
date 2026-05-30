<script setup>
import { ref, computed, onMounted, reactive, nextTick } from "vue";
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
            checkoutForm.customer_name = response.data.data.name || '';
            checkoutForm.customer_phone = response.data.data.phone || '';
        }
    } catch (error) {
        console.error("Không thể lấy thông tin điểm:", error);
    }
};

/* =========================
   VALIDATE SĐT REAL-TIME
========================= */
const phoneError = ref('');
const phoneSuccess = ref(false);

const formatPhoneInput = (value) => {
    let digits = value.replace(/\D/g, '');
    if (digits.startsWith('84') && digits.length > 9) digits = '0' + digits.slice(2);
    if (digits.startsWith('+84')) digits = '0' + digits.slice(3);
    digits = digits.slice(0, 10);

    let formatted = digits;
    if (digits.length > 4 && digits.length <= 7) {
        formatted = digits.slice(0, 4) + ' ' + digits.slice(4);
    } else if (digits.length > 7) {
        formatted = digits.slice(0, 4) + ' ' + digits.slice(4, 7) + ' ' + digits.slice(7);
    }
    return formatted;
};

const validatePhone = (value) => {
    const digits = value.replace(/\D/g, '');
    phoneError.value = '';
    phoneSuccess.value = false;

    if (!digits) return;

    const validPrefixes = [
        '032', '033', '034', '035', '036', '037', '038', '039',
        '096', '097', '098', '086', '089', '088',
        '070', '079', '077', '076', '078', '090', '093',
        '056', '058', '092', '059', '099',
        '091', '094', '081', '082', '083', '084', '085',
    ];

    if (digits.length < 10) {
        phoneError.value = 'Số điện thoại không hợp lệ';
        return;
    }
    if (digits.length === 10 && !digits.startsWith('0')) {
        phoneError.value = 'Số điện thoại Việt Nam phải bắt đầu bằng 0';
        return;
    }
    const prefix = digits.slice(0, 3);
    if (digits.length === 10 && !validPrefixes.includes(prefix)) {
        phoneError.value = 'Đầu số không hợp lệ (VD: 03x, 07x, 08x, 09x)';
        return;
    }
    phoneSuccess.value = true;
};

const onPhoneInput = (e) => {
    const raw = e.target.value;
    const formatted = formatPhoneInput(raw);
    checkoutForm.customer_phone = formatted;
    validatePhone(formatted);
};

/* =========================
   OPENSTREETMAP & LEAFLET
========================= */
const mapLoaded = ref(false);
const showMapPicker = ref(false);
const mapRef = ref(null);
const isGettingLocation = ref(false);
const selectedAddressText = ref('');

const searchQuery = ref('');
const searchResults = ref([]);
let searchTimeout = null;

let mapInstance = null;
let markerInstance = null;

// Tải CSS & JS của Leaflet động qua CDN (Đợi cả 2 tải xong)
const loadLeaflet = () => {
    return new Promise((resolve, reject) => {
        if (window.L) {
            resolve();
            return;
        }

        let cssLoaded = false;
        let jsLoaded = false;

        const checkReady = () => {
            if (cssLoaded && jsLoaded) {
                // Sửa lỗi hiển thị icon mặc định của Leaflet khi dùng CDN
                delete L.Icon.Default.prototype._getIconUrl;
                L.Icon.Default.mergeOptions({
                    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                });
                resolve();
            }
        };

        // Load CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.onload = () => { cssLoaded = true; checkReady(); };
        document.head.appendChild(link);

        // Load JS
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.async = true;
        script.onload = () => { jsLoaded = true; checkReady(); };
        script.onerror = reject;
        document.head.appendChild(script);
    });
};

const openMapPicker = async () => {
    showMapPicker.value = true;
    await loadLeaflet();
    mapLoaded.value = true;

    // Đợi Vue render DOM xong xuôi mới gắn map
    await nextTick();
    initMap();
};

const initMap = () => {
    if (!mapRef.value) return;

    // Lấy toạ độ Cần Thơ làm mặc định (theo ảnh chụp của bạn)
    const defaultCenter = [10.0299, 105.7706];

    if (!mapInstance) {
        mapInstance = L.map(mapRef.value).setView(defaultCenter, 14);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(mapInstance);

        markerInstance = L.marker(defaultCenter, { draggable: true }).addTo(mapInstance);

        markerInstance.on('dragend', () => {
            const pos = markerInstance.getLatLng();
            reverseGeocode(pos.lat, pos.lng);
        });

        mapInstance.on('click', (e) => {
            markerInstance.setLatLng(e.latlng);
            reverseGeocode(e.latlng.lat, e.latlng.lng);
        });
    }

    // NẾU ĐÃ CÓ BẢN ĐỒ: Cập nhật lại view
    setTimeout(() => {
        // Cực kỳ quan trọng: Ép bản đồ tính toán lại kích thước sau khi modal đã chạy xong animation (khoảng 300ms)
        mapInstance.invalidateSize();
    }, 400);

    if (checkoutForm.customer_address) {
        selectedAddressText.value = checkoutForm.customer_address;
        searchQuery.value = checkoutForm.customer_address;
    }
};

// Chuyển Toạ độ -> Địa chỉ (Nominatim Reverse Geocoding)
const reverseGeocode = async (lat, lng) => {
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data && data.display_name) {
            selectedAddressText.value = data.display_name;
            searchQuery.value = data.display_name;
        }
    } catch (error) {
        console.error("Lỗi khi lấy địa chỉ:", error);
    }
};

// Tìm kiếm địa chỉ (Nominatim Forward Geocoding)
const onSearchInput = () => {
    clearTimeout(searchTimeout);
    if (!searchQuery.value.trim()) {
        searchResults.value = [];
        return;
    }

    // Debounce để tránh spam API của Nominatim (họ giới hạn 1 req/s)
    searchTimeout = setTimeout(async () => {
        try {
            const query = encodeURIComponent(searchQuery.value);
            const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${query}&countrycodes=vn&limit=5`;
            const response = await fetch(url);
            const data = await response.json();
            searchResults.value = data;
        } catch (error) {
            console.error("Lỗi tìm kiếm:", error);
        }
    }, 800);
};

// Chọn kết quả từ dropdown
const selectSearchResult = (place) => {
    const lat = parseFloat(place.lat);
    const lng = parseFloat(place.lon);

    mapInstance.setView([lat, lng], 17);
    markerInstance.setLatLng([lat, lng]);

    selectedAddressText.value = place.display_name;
    searchQuery.value = place.display_name;
    searchResults.value = []; // Ẩn dropdown
};

// Lấy vị trí GPS hiện tại
const getCurrentLocation = () => {
    if (!navigator.geolocation) {
        alert('Trình duyệt không hỗ trợ định vị GPS');
        return;
    }
    isGettingLocation.value = true;
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            if (mapInstance) {
                mapInstance.setView([lat, lng], 17);
                markerInstance.setLatLng([lat, lng]);
            }
            reverseGeocode(lat, lng);
            isGettingLocation.value = false;
        },
        (err) => {
            isGettingLocation.value = false;
            const msgs = {
                1: 'Bạn đã từ chối quyền truy cập vị trí.',
                2: 'Không thể xác định vị trí. Vui lòng thử lại.',
                3: 'Hết thời gian định vị. Vui lòng thử lại.',
            };
            alert(msgs[err.code] || 'Lỗi không xác định khi lấy vị trí.');
        },
        { timeout: 10000, maximumAge: 60000 }
    );
};

const closeMapPicker = () => {
    showMapPicker.value = false;

    // Dọn dẹp bản đồ khi đóng modal
    if (mapInstance) {
        mapInstance.remove(); // Phá hủy instance của Leaflet
        mapInstance = null;   // Reset lại biến để lần sau initMap tạo lại từ đầu
    }
};

const confirmAddress = () => {
    if (!selectedAddressText.value) {
        alert('Vui lòng chọn địa chỉ trên bản đồ!');
        return;
    }
    checkoutForm.customer_address = selectedAddressText.value;

    // Gọi hàm closeMapPicker để vừa đóng modal vừa dọn dẹp map
    closeMapPicker();
};
/* =========================
   STATE THANH TOÁN & GIỎ HÀNG
========================= */
const showCheckoutModal = ref(false);
const isSubmitting = ref(false);

const checkoutForm = reactive({
    customer_name: "",
    customer_phone: "",
    customer_address: "",
    notes: "",
    payment_method: "vnpay",
    points_used: 0
});

const discountAmount = computed(() => (checkoutForm.points_used || 0) * 100);

const finalAmount = computed(() => {
    const final = totalPrice.value - discountAmount.value;
    return final > 0 ? final : 0;
});

const validatePoints = () => {
    if (checkoutForm.points_used > userPoints.value) checkoutForm.points_used = userPoints.value;
    if (checkoutForm.points_used * 100 > totalPrice.value) checkoutForm.points_used = Math.ceil(totalPrice.value / 100);
    if (checkoutForm.points_used < 0) checkoutForm.points_used = 0;
};

const increaseQty = async (item) => {
    item.quantity++;
    item.subtotal = item.price * item.quantity;
    try {
        await api.patch(`/cart/${item.id}`, { quantity: item.quantity });
    } catch (error) {
        item.quantity--;
        item.subtotal = item.price * item.quantity;
        alert("Không thể cập nhật số lượng. Vui lòng thử lại!");
    }
};

const decreaseQty = async (item) => {
    if (item.quantity <= 1) return;
    item.quantity--;
    item.subtotal = item.price * item.quantity;
    try {
        await api.patch(`/cart/${item.id}`, { quantity: item.quantity });
    } catch (error) {
        item.quantity++;
        item.subtotal = item.price * item.quantity;
        alert("Không thể cập nhật số lượng. Vui lòng thử lại!");
    }
};

const removeItem = async (id) => {
    await api.delete(`/cart/${id}`);
    cartItems.value = cartItems.value.filter(i => i.id !== id);
};

const totalPrice = computed(() => cartItems.value.reduce((sum, item) => sum + item.subtotal, 0));

const formatPrice = (value) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);

const submitOrder = async () => {
    if (cartItems.value.length === 0) return;
    if (!phoneSuccess.value && checkoutForm.customer_phone) {
        alert('Vui lòng nhập số điện thoại hợp lệ!');
        return;
    }
    try {
        isSubmitting.value = true;
        const payload = { ...checkoutForm, amount: finalAmount.value };
        const response = await api.post('/checkout', payload);
        if (response.data.success) {
            if (checkoutForm.payment_method === 'vnpay') {
                if (response.data.vnpay_url) {
                    window.location.href = response.data.vnpay_url;
                } else {
                    const payRes = await api.post('/payment/vnpay', {
                        order_id: response.data.order_id,
                        amount: finalAmount.value
                    });
                    window.location.href = payRes.data.url;
                }
            } else {
                alert("🎉 Đặt hàng thành công! Cảm ơn bạn đã ủng hộ nhà hàng.");
                showCheckoutModal.value = false;
                cartItems.value = [];
                router.push({ name: 'orders' });
            }
        }
    } catch (error) {
        const errorMsg = error.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại sau.";
        alert("❌ Đặt hàng thất bại: " + errorMsg);
    } finally {
        isSubmitting.value = false;
    }
};

onMounted(() => {
    fetchCart();
    fetchUserProfile();
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

        <!-- ===== CHECKOUT MODAL ===== -->
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
                        <div class="phone-input-wrapper"
                            :class="{ 'has-error': phoneError, 'has-success': phoneSuccess }">
                            <span class="phone-prefix">🇻🇳 +84</span>
                            <input type="tel" :value="checkoutForm.customer_phone" @input="onPhoneInput" required
                                placeholder="0901 234 567" maxlength="12" autocomplete="tel">
                            <span class="phone-status">
                                <span v-if="phoneSuccess" class="icon-ok">✓</span>
                                <span v-else-if="phoneError" class="icon-err">✗</span>
                            </span>
                        </div>
                        <p v-if="phoneError" class="field-error">{{ phoneError }}</p>
                        <p v-if="phoneSuccess" class="field-success">Số điện thoại hợp lệ</p>
                    </div>

                    <div class="form-group">
                        <label>Địa chỉ nhận hàng (*)</label>
                        <div class="address-input-wrapper">
                            <textarea v-model="checkoutForm.customer_address" required rows="2"
                                placeholder="Nhập địa chỉ hoặc chọn trên bản đồ..."></textarea>
                            <div class="address-actions">
                                <button type="button" class="btn-map" @click="openMapPicker">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                        stroke-width="2">
                                        <path
                                            d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                                        <circle cx="12" cy="9" r="2.5" />
                                    </svg>
                                    Chọn trên bản đồ
                                </button>
                                <button type="button" class="btn-gps" @click="openMapPicker().then(getCurrentLocation)"
                                    :disabled="isGettingLocation">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                        stroke-width="2">
                                        <circle cx="12" cy="12" r="3" />
                                        <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                                    </svg>
                                    {{ isGettingLocation ? 'Đang định vị...' : 'Vị trí hiện tại' }}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="form-group points-section">
                        <label>Sử dụng điểm (Bạn có {{ userPoints }} điểm)</label>
                        <div class="points-input-group">
                            <input type="number" v-model.number="checkoutForm.points_used" @input="validatePoints"
                                min="0" :max="userPoints" placeholder="0">
                            <span class="discount-hint" v-if="discountAmount > 0">Giảm {{ formatPrice(discountAmount)
                            }}</span>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Phương thức thanh toán</label>
                        <select v-model="checkoutForm.payment_method">
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

        <!-- ===== MAP PICKER MODAL (LEAFLET) ===== -->
        <div v-if="showMapPicker" class="map-modal-overlay" @click.self="closeMapPicker">
            <div class="map-modal">
                <div class="map-modal-header">
                    <h3>📍 Chọn địa chỉ giao hàng</h3>
                    <button class="map-close-btn" @click="closeMapPicker">✕</button>
                </div>

                <!-- Thanh tìm kiếm Nominatim -->
                <div class="map-search-bar">
                    <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.35-4.35" />
                    </svg>

                    <input type="text" v-model="searchQuery" @input="onSearchInput" placeholder="Tìm kiếm địa chỉ..."
                        class="map-search-input">

                    <button type="button" class="btn-my-location" @click="getCurrentLocation"
                        :disabled="isGettingLocation" title="Lấy vị trí hiện tại">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2.5">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                        </svg>
                    </button>

                    <!-- Dropdown Kết Quả Tìm Kiếm -->
                    <ul v-if="searchResults.length > 0" class="map-search-dropdown">
                        <li v-for="res in searchResults" :key="res.place_id" @click="selectSearchResult(res)">
                            {{ res.display_name }}
                        </li>
                    </ul>
                </div>

                <!-- Container của Leaflet -->
                <div v-show="mapLoaded" ref="mapRef" class="map-container"></div>

                <div v-if="!mapLoaded" class="map-loading">
                    <div class="spinner"></div>
                    <p>Đang tải bản đồ...</p>
                </div>

                <div class="map-selected-address">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path
                            d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                    </svg>
                    <span>{{ selectedAddressText || 'Nhấn vào bản đồ hoặc kéo ghim để chọn địa chỉ' }}</span>
                </div>

                <div class="map-modal-footer">
                    <button type="button" class="btn-cancel" @click="closeMapPicker">Hủy</button>
                    <button type="button" class="btn-confirm-map" @click="confirmAddress"
                        :disabled="!selectedAddressText">
                        Xác nhận địa chỉ này
                    </button>
                </div>
            </div>
        </div>
    </DefaultLayout>
</template>

<style scoped src="@/assets/cart.css"></style>
