<template>
    <div class="order-container">
        <header class="order-header mb-3 d-flex align-items-center justify-content-between">
            <div class="d-flex align-items-center">
                <button class="btn btn-outline-secondary btn-sm me-3" @click="router.back()">
                    <i class="bi bi-arrow-left"></i> Quay lại
                </button>
                <h1 class="text-primary">{{ tableName }}</h1>
            </div>

            <div class="d-flex align-items-center gap-2">
                <button class="btn btn-sm btn-outline-info" @click="refreshData" :disabled="isRefreshing">
                    <i class="bi bi-arrow-clockwise" :class="{ 'spin-anim': isRefreshing }"></i> Làm mới
                </button>

                <button v-if="tableInfo?.status === 'occupied'" class="btn btn-sm btn-outline-danger"
                    @click="cancelTable">
                    <i class="bi bi-trash"></i> Hủy bàn
                </button>

                <span class="badge" :class="tableInfo?.status === 'available' ? 'bg-success' : 'bg-danger'">
                    {{ tableInfo?.status === 'available' ? 'Bàn trống' : 'Đang phục vụ' }}
                </span>
            </div>
        </header>

        <div v-if="tableInfo?.status === 'available'" class="text-center py-5 bg-white rounded-3 shadow-sm mt-3">
            <i class="bi bi-shop text-muted d-block mb-3" style="font-size: 4rem;"></i>
            <h3 class="fw-bold">Bàn này đang trống</h3>
            <p class="text-muted mb-4">Khách vừa vào ngồi? Hãy mở bàn để bắt đầu phục vụ và chọn món.</p>
            <button class="btn btn-primary btn-lg px-5 rounded-pill" @click="openTable">
                <i class="bi bi-unlock-fill me-2"></i> MỞ BÀN PHỤC VỤ
            </button>
        </div>

        <div v-else-if="tableInfo?.status === 'occupied'" class="row g-3">
            <div class="col-12 col-lg-8">
                <div class="categories-scroll mb-3">
                    <button v-for="cat in categories" :key="cat.id" class="btn rounded-pill px-4 me-2"
                        :class="activeCategory === cat.id ? 'btn-primary' : 'btn-white shadow-sm'"
                        @click="activeCategory = cat.id">
                        {{ cat.name }}
                    </button>
                </div>
                <div class="menu-grid">
                    <div v-for="item in filteredMenu" :key="item.id" class="menu-card" @click="addToCart(item)"
                        :class="{ 'opacity-50': item.status === 2 }">
                        <img v-if="item.img_url" :src="getImageUrl(item.img_url)" class="menu-img" :alt="item.name">
                        <div v-else class="menu-img-placeholder">
                            <i class="bi bi-image text-muted"></i>
                        </div>
                        <div class="menu-info position-relative">
                            <h6 class="menu-name text-truncate">{{ item.name }}</h6>
                            <div class="menu-price text-danger fw-bold">{{ formatCurrency(item.price) }}</div>
                            <span v-if="item.status === 2"
                                class="badge bg-danger position-absolute top-0 end-0 mt-2 me-2">Hết</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-12 col-lg-4">
                <div class="cart-card bg-white rounded-3 shadow-sm d-flex flex-column">
                    <div class="cart-header p-3 border-bottom bg-light rounded-top">
                        <h5 class="mb-0 fw-bold"><i class="bi bi-receipt"></i> Phiếu Order</h5>
                    </div>

                    <div class="cart-body p-3 flex-grow-1 overflow-auto" style="max-height: 60vh;">

                        <h6 v-if="cart.length > 0" class="text-primary fw-bold mb-2">Món mới (Chưa gửi)</h6>
                        <div v-for="(cartItem, index) in cart" :key="'new-' + index"
                            class="cart-item border-bottom pb-2 mb-2">
                            <div class="d-flex justify-content-between align-items-start mb-1">
                                <span class="fw-bold">{{ cartItem.name }}</span>
                                <span class="text-danger fw-bold">{{ formatCurrency(cartItem.price * cartItem.quantity)
                                }}</span>
                            </div>
                            <div class="d-flex justify-content-between align-items-center">
                                <input type="text" class="form-control form-control-sm w-50"
                                    placeholder="Ghi chú (vd: ít cay)..." v-model="cartItem.note">
                                <div class="quantity-control d-flex align-items-center">
                                    <button class="btn btn-sm btn-outline-secondary rounded-circle px-2"
                                        @click="decreaseQty(index)">-</button>
                                    <span class="mx-2 fw-bold">{{ cartItem.quantity }}</span>
                                    <button class="btn btn-sm btn-outline-primary rounded-circle px-2"
                                        @click="increaseQty(index)">+</button>
                                </div>
                            </div>
                        </div>

                        <h6 v-if="orderedItems.length > 0" class="text-secondary fw-bold mt-4 mb-2">Đã gọi (Theo dõi)
                        </h6>
                        <div v-for="(item, index) in orderedItems" :key="'ordered-' + index"
                            class="cart-item border-bottom pb-2 mb-2 bg-light p-2 rounded">
                            <div class="d-flex justify-content-between align-items-start mb-1">
                                <span><span class="fw-bold">{{ item.quantity }}x</span> {{ item.item_name }}</span>
                                <span class="text-muted">{{ formatCurrency(item.subtotal) }}</span>
                            </div>
                            <div class="d-flex justify-content-between align-items-center mt-2">
                                <small class="text-muted fst-italic">{{ item.note || 'Không ghi chú' }}</small>

                                <div class="d-flex align-items-center gap-2">
                                    <span class="badge" :class="getStatusClass(item.status)">
                                        {{ getStatusText(item.status) }}
                                    </span>

                                    <button v-if="item.status === 'ready'"
                                        class="btn btn-sm btn-success rounded-pill px-2 py-0"
                                        style="font-size: 0.75rem;" @click="markAsServed(item)">
                                        <i class="bi bi-check2-all"></i> Đã lên món
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div v-if="cart.length === 0 && orderedItems.length === 0" class="text-center text-muted my-5">
                            <i class="bi bi-cart-x fs-1"></i>
                            <p class="mt-2">Chưa có món nào được chọn</p>
                        </div>
                    </div>

                    <div class="cart-footer p-3 border-top bg-light rounded-bottom">
                        <div class="d-flex justify-content-between mb-3">
                            <span class="fs-5 fw-bold">Tổng tiền bàn:</span>
                            <span class="fs-5 fw-bold text-danger">{{ formatCurrency(grandTotal) }}</span>
                        </div>

                        <button class="btn btn-primary w-100 py-2 fw-bold mb-2" :disabled="cart.length === 0"
                            @click="sendOrderToKitchen">
                            <i class="bi bi-send-check me-2"></i> GỬI XUỐNG BẾP
                        </button>

                        <button class="btn btn-success w-100 py-2 fw-bold"
                            :disabled="orderedItems.length === 0 || cart.length > 0 || hasUnfinishedItems"
                            @click="showCheckoutModal = true">
                            <i class="bi bi-cash-coin me-2"></i> THANH TOÁN BÀN NÀY
                        </button>

                        <div class="text-center mt-2">
                            <small v-if="cart.length > 0" class="text-danger d-block" style="font-size: 0.8rem;">
                                * Vui lòng gửi món mới xuống bếp trước khi thanh toán.
                            </small>
                            <small v-else-if="hasUnfinishedItems" class="text-danger d-block fw-bold"
                                style="font-size: 0.85rem;">
                                * Không thể thanh toán! Vẫn còn món đang làm trong bếp.
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="showCheckoutModal" class="modal-overlay" @click.self="showCheckoutModal = false">
            <div class="modal-content" style="max-width: 500px;">
                <h2>Thanh Toán {{ tableName }}</h2>

                <form @submit.prevent="submitCheckout">
                    <div class="customer-section mb-3 p-3 bg-light border rounded">
                        <label class="fw-bold mb-2"><i class="bi bi-person-badge"></i> Khách hàng thành viên</label>
                        <div class="input-group mb-2">
                            <input type="text" v-model="customerPhone" class="form-control"
                                placeholder="Nhập số điện thoại..." @keyup.enter="searchCustomer"
                                @input="searchError = ''">
                            <button class="btn btn-outline-secondary bg-white" type="button" @click="searchCustomer"
                                :disabled="isSearchingCustomer">
                                <span v-if="isSearchingCustomer" class="spinner-border spinner-border-sm"></span>
                                <i v-else class="bi bi-search"></i> Tìm
                            </button>
                        </div>

                        <div v-if="searchError" class="text-danger small mb-2 ms-1">
                            <i class="bi bi-exclamation-circle"></i> {{ searchError }}
                        </div>

                        <div v-if="customerInfo" class="alert alert-info p-2 mb-0 mt-2">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <strong>{{ customerInfo.name }}</strong>
                                <span>Đang có: <strong class="text-primary">{{
                                    customerInfo.points }}</strong> điểm</span>
                            </div>

                            <div v-if="customerInfo.points > 0" class="form-check form-switch mb-2">
                                <input class="form-check-input" type="checkbox" v-model="usePoints"
                                    id="usePointsSwitch">
                                <label class="form-check-label" for="usePointsSwitch">Dùng điểm để giảm giá</label>
                            </div>

                            <div v-if="usePoints" class="input-group input-group-sm mb-2">
                                <span class="input-group-text">Dùng</span>
                                <input type="number" class="form-control" v-model="pointsToUse" @input="validatePoints"
                                    min="0">
                                <span class="input-group-text">điểm</span>
                            </div>

                            <div class="text-success small mt-1">
                                <i class="bi bi-plus-circle"></i> Sẽ tích thêm sau thanh
                                toán: <strong>+{{ pointsEarned }} điểm</strong>
                            </div>
                        </div>
                    </div>

                    <div class="mb-4 p-3 bg-white rounded border shadow-sm">
                        <div class="d-flex justify-content-between text-muted mb-2">
                            <span>Tổng tiền món:</span>
                            <span>{{ formatCurrency(totalOrderedPrice) }}</span>
                        </div>
                        <div v-if="discountAmount > 0"
                            class="d-flex justify-content-between text-success mb-2 border-bottom pb-2">
                            <span>Giảm giá (Từ {{ pointsToUse }} điểm):</span>
                            <span>- {{ formatCurrency(discountAmount) }}</span>
                        </div>
                        <div class="d-flex justify-content-between align-items-end mt-2">
                            <span class="fw-bold text-dark">KHÁCH CẦN TRẢ:</span>
                            <h3 class="text-danger fw-bold m-0">{{
                                formatCurrency(finalAmountToPay) }}</h3>
                        </div>
                    </div>

                    <div class="form-group mb-3">
                        <label class="mb-1 text-muted">Phương thức thanh toán</label>
                        <select v-model="checkoutForm.payment_method" class="form-select">
                            <option value="cash">Tiền mặt</option>
                            <option value="transfer">Chuyển khoản</option>
                            <option value="card">Quẹt thẻ (POS)</option>
                        </select>
                    </div>

                    <div class="form-group mb-3">
                        <textarea v-model="checkoutForm.note" rows="2" class="form-control"
                            placeholder="Ghi chú thu ngân (Tùy chọn)..."></textarea>
                    </div>

                    <div class="modal-actions mt-4 d-flex gap-2">
                        <button type="button" class="btn btn-light border flex-fill" @click="showCheckoutModal = false"
                            :disabled="isSubmitting">Hủy</button>
                        <button type="submit" class="btn btn-success flex-fill fw-bold" :disabled="isSubmitting">
                            {{ isSubmitting ? 'Đang xử lý...' : 'Xác nhận Thu tiền' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/services/api';

const route = useRoute();
const router = useRouter();
const orderedItems = ref([]);
const showCheckoutModal = ref(false);
const isSubmitting = ref(false);
const searchError = ref('');

const checkoutForm = reactive({
    payment_method: "cash",
    note: ""
});

// --- STATE LÀM MỚI ---
const isRefreshing = ref(false);

// --- HÀM LÀM MỚI DỮ LIỆU ---
const refreshData = async () => {
    if (isRefreshing.value) return; // Tránh click liên tục
    isRefreshing.value = true;

    try {
        const tableId = route.params.id;
        if (tableId) {
            // Tải lại thông tin bàn (và tự động tải lại các món đã gọi qua fetchActiveOrder)
            await fetchTableDetail(tableId);
        }
        // Tải lại thực đơn (phòng khi có món mới vừa cập nhật trạng thái hết hàng)
        await fetchMenuData();
    } catch (error) {
        console.error("Lỗi khi làm mới dữ liệu:", error);
    } finally {
        // Giữ hiệu ứng xoay tối thiểu 500ms để người dùng thấy có phản hồi mượt mà
        setTimeout(() => {
            isRefreshing.value = false;
        }, 500);
    }
};

// Thêm các biến quản lý khách hàng & điểm (đặt dưới isSubmitting)
const customerPhone = ref('');
const customerInfo = ref(null);
const isSearchingCustomer = ref(false);
const usePoints = ref(false);
const pointsToUse = ref(0);

// --- HÀM TÌM KHÁCH HÀNG ---
const searchCustomer = async () => {
    if (!customerPhone.value.trim()) {
        searchError.value = "Vui lòng nhập số điện thoại.";
        return;
    }

    isSearchingCustomer.value = true;
    searchError.value = ''; // Reset lỗi trước khi tìm mới

    try {
        const response = await api.get(`/waiter/customers/search`, { params: { phone: customerPhone.value } });

        if (response.data.success && response.data.customer) {
            customerInfo.value = response.data.customer;
            usePoints.value = false;
            pointsToUse.value = 0;
            searchError.value = ''; // Xóa lỗi nếu tìm thấy
        } else {
            // Thay thế alert bằng việc hiển thị text
            searchError.value = "Không tìm thấy khách hàng với SĐT này.";
            customerInfo.value = null;
        }
    } catch (error) {
        console.error("Lỗi tìm khách hàng:", error);
        // Thay thế alert bằng việc hiển thị text
        searchError.value = "Có lỗi xảy ra khi kết nối máy chủ.";
        customerInfo.value = null;
    } finally {
        isSearchingCustomer.value = false;
    }
};

// --- CÁC HÀM TÍNH TOÁN TIỀN & ĐIỂM ---

// Số tiền được giảm (1 điểm = 100đ)
const discountAmount = computed(() => {
    if (!usePoints.value || !customerInfo.value) return 0;
    return (pointsToUse.value || 0) * 100;
});

// Tiền khách thực tế phải trả
const finalAmountToPay = computed(() => {
    const final = totalOrderedPrice.value - discountAmount.value;
    return final > 0 ? final : 0;
});

// Số điểm tích lũy được sau khi thanh toán hóa đơn này (10,000đ = 1 điểm)
const pointsEarned = computed(() => {
    return Math.floor(finalAmountToPay.value / 10000);
});

// Giới hạn số điểm tối đa khách được nhập
const validatePoints = () => {
    if (!customerInfo.value) return;

    // Khách không thể dùng quá số điểm đang có
    const maxPointsByBalance = customerInfo.value.points;
    // Khách không thể dùng điểm giảm lố quá tổng tiền đơn hàng
    const maxPointsByTotal = Math.floor(totalOrderedPrice.value / 100);

    const maxAllowed = Math.min(maxPointsByBalance, maxPointsByTotal);

    if (pointsToUse.value > maxAllowed) {
        pointsToUse.value = maxAllowed;
    } else if (pointsToUse.value < 0) {
        pointsToUse.value = 0;
    }
};


// ─── ĐÁNH DẤU MÓN ĐÃ LÊN BÀN ──────────────────────────────────
const markAsServed = async (item) => {
    // Để an toàn, hỏi lại 1 câu phòng khi bấm nhầm
    if (!confirm(`Xác nhận đã mang món "${item.item_name}" lên bàn?`)) return;

    try {
        // Gọi API lên Laravel để cập nhật DB (Bạn cần tạo API này ở Bước 3)
        // Chú ý: Cần truyền id của chi tiết hóa đơn (item.id)
        const response = await api.put(`/waiter/order-items/${item.id}/serve`);

        if (response.data.success) {
            // Cập nhật thẳng trạng thái trên giao diện thành 'served' để khỏi phải load lại trang
            item.status = 'served';
        } else {
            alert(response.data.message || 'Lỗi: Không thể cập nhật trạng thái!');
        }
    } catch (error) {
        console.error("Lỗi khi xác nhận lên món:", error);
        alert("Có lỗi kết nối, không thể xác nhận lúc này!");
    }
};

// ─── XỬ LÝ THANH TOÁN BÀN ──────────────────────────────────
const submitCheckout = async () => {
    try {
        isSubmitting.value = true;

        const payload = {
            table_id: tableInfo.value.id,
            amount: finalAmountToPay.value, // Tiền thực tế phải thu
            original_amount: totalOrderedPrice.value, // Gửi thêm tổng tiền gốc để lưu hóa đơn
            payment_method: checkoutForm.payment_method,
            note: checkoutForm.note,
            // Thêm các trường dữ liệu điểm gửi lên Server
            customer_id: customerInfo.value?.id || null,
            points_used: usePoints.value ? pointsToUse.value : 0,
            discount_amount: discountAmount.value,
            points_earned: pointsEarned.value
        };

        const response = await api.post('/waiter/checkout', payload);

        if (response.data.success) {
            alert("🎉 Thanh toán thành công! Bàn đã được dọn trống.");

            showCheckoutModal.value = false;
            tableInfo.value.status = 'available';
            orderedItems.value = [];

            checkoutForm.payment_method = 'cash';
            checkoutForm.note = '';

            // Reset dữ liệu khách hàng
            customerPhone.value = '';
            customerInfo.value = null;
            usePoints.value = false;
            pointsToUse.value = 0;
        } else {
            alert("Lỗi: " + (response.data.message || "Không thể thanh toán"));
        }
    } catch (error) {
        console.error("Lỗi thanh toán:", error);
        alert("❌ Thanh toán thất bại. Vui lòng kiểm tra lại kết nối.");
    } finally {
        isSubmitting.value = false;
    }
};


// Thông tin bàn
const tableName = ref('Đang tải...');
const tableInfo = ref(null);

// Danh mục và Thực đơn
const categories = ref([{ id: 'all', name: 'Tất cả' }]);
const activeCategory = ref('all');
const menuItems = ref([]);

// Giỏ hàng
const cart = ref([]);

// ─── CẤU HÌNH ĐƯỜNG DẪN ẢNH ───────────────────────────────
// Chuyển URL từ /api sang /storage để lấy ảnh
const storageBaseUrl = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api').replace('/api', '/storage/');
const getImageUrl = (path) => path ? `${storageBaseUrl}${path}` : '';

// ─── GỌI API LẤY THỰC ĐƠN TỪ DATABASE ─────────────────────
const fetchMenuData = async () => {
    try {
        // Gọi đến API /menu (Public route trong api.php của bạn)
        const response = await api.get('/menu');

        if (response.data.success) {
            const fetchedCategories = response.data.data;

            // 1. Cập nhật danh sách Category (Giữ lại nút "Tất cả")
            const newCategories = fetchedCategories.map(cat => ({
                id: cat.id,
                name: cat.name
            }));
            categories.value = [{ id: 'all', name: 'Tất cả' }, ...newCategories];

            // 2. Gom tất cả món ăn từ các danh mục vào 1 mảng chung
            let allItems = [];
            fetchedCategories.forEach(cat => {
                // Laravel trả về 'menuItems' do bạn định nghĩa Category::with('menuItems')
                // Thêm cat.menu_items để phòng trường hợp backend serialize thành snake_case
                const items = cat.menuItems || cat.menu_items || [];

                items.forEach(item => {
                    // Bạn có thể thêm điều kiện: item.status !== 0 để ẩn món ngừng bán
                    if (item.status !== 0) {
                        allItems.push({
                            ...item,
                            category_id: cat.id // Lưu lại ID danh mục để lát dùng filter
                        });
                    }
                });
            });
            menuItems.value = allItems;
        }
    } catch (error) {
        console.error("Lỗi khi tải thực đơn:", error);
    }
};


const openTable = async () => {
    if (!tableInfo.value) return;

    try {
        const response = await api.post('/waiter/tables/open', {
            table_id: tableInfo.value.id
        });

        if (response.data.success) {
            // Đổi trạng thái bàn ngay trên giao diện Vue thành 'occupied'
            // Nhờ Reactivity của Vue, khung báo "Trống" sẽ tự biến mất và Menu sẽ tự hiện ra!
            tableInfo.value.status = 'occupied';
        } else {
            alert(response.data.message);
        }
    } catch (error) {
        console.error("Lỗi khi mở bàn:", error);
        alert("Có lỗi kết nối, không thể mở bàn lúc này!");
    }
};


// ─── GỌI API LẤY THÔNG TIN BÀN ─────────────────────────────
const fetchTableDetail = async (id) => {
    try {
        // API này của bạn hiện tại mới chỉ trả về thông tin Bàn.
        // Tạm thời mình cứ set tableInfo trước.
        const response = await api.get(`/waiter/tables/${id}`);
        if (response.data) {
            tableInfo.value = response.data;
            tableName.value = `Bàn ${tableInfo.value.name}`;

            // NẾU BÀN ĐANG PHỤC VỤ, ta phải gọi thêm API lấy cái Order đang chạy của bàn này
            if (tableInfo.value.status === 'occupied') {
                fetchActiveOrder(id);
            }
        }
    } catch (error) {
        console.error('Lỗi khi tải thông tin bàn:', error);
        tableName.value = 'Không tìm thấy bàn';
    }
};

// Hàm mới: Lấy chi tiết hóa đơn đang ăn của bàn
const fetchActiveOrder = async (tableId) => {
    try {
        // GỌI API: Bạn cần tạo API này ở backend (Mình sẽ hướng dẫn backend ở bước sau)
        const res = await api.get(`/waiter/orders/active/${tableId}`);
        if (res.data.success && res.data.order) {
            // Lưu mảng các món đã gọi
            orderedItems.value = res.data.order.items || [];
        }
    } catch (error) {
        console.error('Không tải được các món đã gọi:', error);
    }
};

onMounted(() => {
    const tableId = route.params.id;
    if (tableId) {
        fetchTableDetail(tableId);
    } else {
        tableName.value = "Chưa chọn bàn";
    }

    // Gọi hàm lấy thực đơn khi vừa vào trang
    fetchMenuData();
});

// ─── CÁC HÀM XỬ LÝ LOGIC (Giữ nguyên) ─────────────────────

// ─── XỬ LÝ HỦY BÀN ──────────────────────────────────────────
const cancelTable = async () => {
    // 1. Kiểm tra xem có món nào đang làm hoặc đã lên bàn không (tránh hủy nhầm khi khách đang ăn)
    const hasActiveItems = orderedItems.value.some(item =>
        ['pending', 'cooking', 'ready', 'served'].includes(item.status)
    );

    if (hasActiveItems) {
        alert("⚠️ Bàn này đã có món được gửi xuống bếp. Không thể hủy cả bàn, bạn chỉ có thể hủy từng món hoặc thanh toán!");
        return;
    }

    // 2. Hỏi xác nhận
    if (!confirm(`Bạn có chắc chắn muốn HỦY ${tableName.value} và trả về trạng thái trống không?`)) {
        return;
    }

    try {
        // 3. Gọi API hủy bàn
        const response = await api.post('/waiter/tables/cancel', {
            table_id: tableInfo.value.id
        });

        if (response.data.success) {
            alert("✅ Hủy bàn thành công!");
            // Trả giao diện về trạng thái ban đầu
            tableInfo.value.status = 'available';
            orderedItems.value = [];
            cart.value = [];
        } else {
            alert(response.data.message || "Lỗi không thể hủy bàn!");
        }
    } catch (error) {
        console.error("Lỗi khi hủy bàn:", error);
        alert("❌ Lỗi kết nối, không thể hủy bàn lúc này.");
    }
};

// Lọc thực đơn theo danh mục (chú ý sửa thành category_id)
const filteredMenu = computed(() => {
    if (activeCategory.value === 'all') return menuItems.value;
    return menuItems.value.filter(item => item.category_id === activeCategory.value);
});

// --- KIỂM TRA ĐIỀU KIỆN THANH TOÁN ---
// Trả về true nếu CÓ ÍT NHẤT 1 MÓN đang chờ làm (pending) hoặc đang nấu (cooking)
const hasUnfinishedItems = computed(() => {
    if (orderedItems.value.length === 0) return false;

    return orderedItems.value.some(item =>
        item.status === 'pending' || item.status === 'cooking'
    );
});

const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

const addToCart = (item) => {
    // Không cho chọn món đang tạm hết (status === 2)
    if (item.status === 2) {
        alert("Món này đang tạm hết hàng!");
        return;
    }

    const existingItem = cart.value.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.value.push({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: 1,
            note: ''
        });
    }
};

const increaseQty = (index) => cart.value[index].quantity++;
const decreaseQty = (index) => {
    if (cart.value[index].quantity > 1) {
        cart.value[index].quantity--;
    } else {
        cart.value.splice(index, 1);
    }
};

const sendOrderToKitchen = async () => {
    if (!tableInfo.value) {
        alert("Chưa lấy được thông tin bàn, vui lòng thử lại!");
        return;
    }

    if (cart.value.length === 0) {
        alert("Giỏ hàng đang trống, vui lòng chọn món!");
        return;
    }

    try {
        const payload = {
            table_id: tableInfo.value.id,
            items: cart.value.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                note: item.note || ''
            }))
        };

        const response = await api.post('/waiter/orders', payload);

        if (response.data.success) {
            alert('Đã gửi order thành công xuống bếp!');
            cart.value = []; // Xóa giỏ

            // QUAN TRỌNG: Gọi lại hàm lấy danh sách món để giao diện cập nhật ngay lập tức
            fetchActiveOrder(tableInfo.value.id);

        } else {
            alert(response.data.message || 'Có lỗi xảy ra khi gửi order!');
        }
    } catch (error) {
        console.error("Lỗi khi gửi order:", error);
    }
};

const totalCartPrice = computed(() => {
    return cart.value.reduce((total, item) => total + (item.price * item.quantity), 0);
});

// Tính tiền các món ĐÃ GỌI

const totalOrderedPrice = computed(() => {
    return orderedItems.value.reduce((total, item) => {
        // Nếu món bị hủy (cancelled) thì cộng 0 đồng, ngược lại thì cộng giá trị subtotal
        return item.status === 'cancelled' ? total : total + parseFloat(item.subtotal);
    }, 0);
});

// Tổng tiền cả bàn (Mới + Cũ)
const grandTotal = computed(() => {
    return totalCartPrice.value + totalOrderedPrice.value;
});

// --- HELPER TRẠNG THÁI BẾP ---
const getStatusClass = (status) => {
    switch (status) {
        case 'pending': return 'bg-warning text-dark';
        case 'cooking': return 'bg-primary';
        case 'ready': return 'bg-success';
        case 'served': return 'bg-secondary';
        case 'cancelled': return 'bg-danger';
        default: return 'bg-secondary';
    }
};

const getStatusText = (status) => {
    switch (status) {
        case 'pending': return 'Chờ làm';
        case 'cooking': return 'Đang nấu';
        case 'ready': return 'Đã xong';
        case 'served': return 'Đã lên món';
        case 'cancelled': return 'Đã hủy';
        default: return status;
    }
};
</script>

<style scoped>
.order-container {
    max-width: 1400px;
    margin: 0 auto;
}

/* Scroll ngang cho danh mục */
.categories-scroll {
    display: flex;
    overflow-x: auto;
    white-space: nowrap;
    padding-bottom: 5px;
}

.categories-scroll::-webkit-scrollbar {
    display: none;
}

.btn-white {
    background-color: white;
    color: #555;
    border: 1px solid #ddd;
}

/* Lưới món ăn */
.menu-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 15px;
}

.menu-card {
    background: white;
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
    border: 1px solid #eee;
}

.menu-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    border-color: #0d6efd;
}

.menu-img-placeholder {
    height: 100px;
    background-color: #f8f9fa;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
}

.menu-info {
    padding: 10px;
}

.menu-name {
    font-size: 0.95rem;
    margin-bottom: 5px;
}

/* Card Giỏ hàng (Sticky trên Desktop) */
.cart-card {
    height: calc(100vh - 120px);
    /* Kéo dài bằng màn hình */
    position: sticky;
    top: 20px;
}

.menu-img {
    width: 100%;
    height: 100px;
    object-fit: cover;
    /* Cắt cúp ảnh cho vừa khung mà không bị méo */
    border-bottom: 1px solid #eee;
}

.opacity-50 {
    opacity: 0.5;
    cursor: not-allowed !important;
}

/* Điều chỉnh trên Mobile */
@media (max-width: 991px) {
    .cart-card {
        position: fixed;
        bottom: 0;
        left: 0;
        width: 100%;
        height: auto;
        max-height: 60vh;
        z-index: 1000;
        border-radius: 20px 20px 0 0 !important;
        box-shadow: 0 -5px 20px rgba(0, 0, 0, 0.15) !important;
    }

    .order-container {
        padding-bottom: 60vh;
        /* Chừa chỗ cho cart nổi lên */
    }
}

/* --- MODAL STYLES --- */
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
    z-index: 1050;
}

.modal-content {
    background: white;
    color: #333;
    width: 90%;
    max-width: 450px;
    padding: 25px;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    animation: slideDown 0.3s ease;
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
    font-size: 1.5rem;
    color: #2c3e50;
    text-align: center;
    border-bottom: 2px solid #f0f0f0;
    padding-bottom: 15px;
}

.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
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

.btn-confirm {
    border: none;
    color: white;
    padding: 10px 20px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: bold;
}

.btn-cancel:disabled,
.btn-confirm:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}
/* --- HIỆU ỨNG XOAY CHO NÚT LÀM MỚI --- */
.spin-anim {
    display: inline-block;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}
</style>