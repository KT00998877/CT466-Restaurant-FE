<template>
    <div class="order-container">
        <header class="order-header mb-3 d-flex align-items-center justify-content-between">
            <div class="d-flex align-items-center">
                <button class="btn btn-outline-secondary btn-sm me-3" @click="router.back()">
                    <i class="bi bi-arrow-left"></i> Quay lại
                </button>
                <h1 class="text-primary">{{ tableName }}</h1>
            </div>
            <span class="badge" :class="tableInfo?.status === 'available' ? 'bg-success' : 'bg-danger'">
                {{ tableInfo?.status === 'available' ? 'Bàn trống' : 'Đang phục vụ' }}
            </span>
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

                                <span class="badge" :class="getStatusClass(item.status)">
                                    {{ getStatusText(item.status) }}
                                </span>
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
                        <button class="btn btn-primary w-100 py-2 fw-bold" :disabled="cart.length === 0"
                            @click="sendOrderToKitchen">
                            <i class="bi bi-send-check me-2"></i> GỬI XUỐNG BẾP MÓN MỚI
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/services/api';

const route = useRoute();
const router = useRouter();
const orderedItems = ref([]);

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

// Lọc thực đơn theo danh mục (chú ý sửa thành category_id)
const filteredMenu = computed(() => {
    if (activeCategory.value === 'all') return menuItems.value;
    return menuItems.value.filter(item => item.category_id === activeCategory.value);
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
    return orderedItems.value.reduce((total, item) => total + parseFloat(item.subtotal), 0);
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
</style>