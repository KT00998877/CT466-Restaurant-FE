<template>
    <DefaultLayout>
    <div class="policy-container">
        <h1 class="page-title">Điều Khoản Dịch Vụ</h1>
        <div class="policy-content">
            <p>Khi sử dụng website và dịch vụ tại Restaurant, quý khách mặc nhiên đồng ý với các điều khoản dưới đây:
            </p>

            <h3>1. Quy định đặt bàn</h3>
            <p>Quý khách vui lòng đến đúng giờ đã đặt. Nếu trễ quá 15 phút mà không thông báo trước, nhà hàng có quyền
                hủy bàn của quý khách để nhường cho thực khách khác nhằm đảm bảo trải nghiệm chung.</p>

            <h3>2. Giá cả & Thanh toán</h3>
            <p>Giá các món ăn (Sushi, Sashimi, Thịt nướng BBQ...) hiển thị trên website chưa bao gồm 10% VAT và có thể
                thay đổi tùy theo thời giá của nguyên liệu hải sản nhập khẩu. Chúng tôi chấp nhận thanh toán qua Tiền
                mặt, Thẻ tín dụng, Momo, và ZaloPay.</p>

            <h3>3. Bản quyền website</h3>
            <p>Mọi hình ảnh món ăn, video và nội dung trên website đều thuộc bản quyền của nhà hàng. Cấm sao chép, sử
                dụng cho mục đích thương mại mà không có sự đồng ý bằng văn bản.</p>
        </div>
    </div>
    </DefaultLayout>
</template>

<script setup>
import DefaultLayout from '../layouts/DefaultLayout.vue';
</script>

<style scoped>
/* Bạn có thể copy CSS từ PrivacyPolicy.vue hoặc đưa CSS này ra một file CSS chung (vd: global.css) để tái sử dụng cho cả 4 trang */
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
}

.policy-content h3 {
    color: #333;
    margin-top: 25px;
    font-size: 1.2rem;
}

.policy-content p {
    line-height: 1.8;
    color: #555;
}
</style>