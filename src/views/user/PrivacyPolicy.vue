<template>
    <DefaultLayout>
    <div class="policy-container">
        <h1 class="page-title">Chính Sách Bảo Mật</h1>
        <div class="policy-content" v-if="!isLoading">
            <p>Chào mừng quý khách đến với Restaurant. Việc bảo vệ thông tin cá nhân của quý khách là ưu tiên hàng đầu
                của chúng tôi.</p>

            <h3>1. Thu thập thông tin</h3>
            <p>Chúng tôi thu thập thông tin cá nhân (Tên, số điện thoại, email, địa chỉ) khi quý khách đặt bàn trực
                tuyến, đặt món giao tận nơi hoặc đăng ký thành viên.</p>

            <h3>2. Sử dụng thông tin</h3>
            <p>Thông tin của quý khách được sử dụng để:</p>
            <ul>
                <li>Xác nhận lịch đặt bàn và đơn hàng giao đi.</li>
                <li>Hỗ trợ khách hàng, giải quyết khiếu nại (nếu có).</li>
                <li>Gửi các chương trình khuyến mãi đặc biệt về các món Nhật - Hàn mới (nếu quý khách đăng ký nhận tin).
                </li>
            </ul>

            <h3>3. Bảo mật dữ liệu</h3>
            <p>Chúng tôi cam kết không bán, trao đổi hoặc chia sẻ thông tin cá nhân của quý khách cho bất kỳ bên thứ ba
                nào, ngoại trừ các đối tác vận chuyển (để giao đồ ăn) và đối tác thanh toán (để xử lý giao dịch).</p>
        </div>
        <div v-else class="loading">Đang tải dữ liệu...</div>
    </div>
    </DefaultLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import DefaultLayout from '../layouts/DefaultLayout.vue';

const isLoading = ref(false);
const policyData = ref('');

</script>

<style scoped>
.policy-container {
    max-width: 900px;
    margin: 40px auto;
    padding: 30px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.page-title {
    color: #e67e22;
    text-align: center;
    margin-bottom: 30px;
    font-size: 2rem;
    font-weight: bold;
}

.policy-content h3 {
    color: #333;
    margin-top: 25px;
    margin-bottom: 15px;
    font-size: 1.2rem;
}

.policy-content p,
.policy-content li {
    line-height: 1.8;
    color: #555;
}

.loading {
    text-align: center;
    color: #888;
}
</style>