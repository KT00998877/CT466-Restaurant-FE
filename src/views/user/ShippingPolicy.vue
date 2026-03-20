<template>
    <DefaultLayout>
    <div class="policy-container">
        <h1 class="page-title">Chính Sách Giao Hàng</h1>
        <div class="policy-content">
            <p>Để đảm bảo độ tươi ngon tuyệt đối cho các món Sushi, Sashimi và hương vị chuẩn cho các món lẩu, nướng Hàn
                Quốc, chúng tôi áp dụng chính sách giao hàng như sau:</p>

            <h3>1. Khu vực & Thời gian giao hàng</h3>
            <ul>
                <li><strong>Khu vực:</strong> Chúng tôi chỉ hỗ trợ giao hàng trong bán kính 10km từ nhà hàng để đảm bảo
                    chất lượng đồ tươi sống.</li>
                <li><strong>Thời gian:</strong> Từ 10:00 sáng đến 21:30 tối các ngày trong tuần. Thời gian chuẩn bị và
                    giao hàng dự kiến từ 30 - 45 phút.</li>
            </ul>

            <h3>2. Phí giao hàng</h3>
            <ul>
                <li>Miễn phí giao hàng cho các đơn từ 500.000 VNĐ (trong bán kính 5km).</li>
                <li>Đồng giá 25.000 VNĐ cho các đơn hàng dưới 500.000 VNĐ hoặc khoảng cách từ 5-10km.</li>
            </ul>

            <h3>3. Quy cách đóng gói</h3>
            <p>Các món đồ sống (Sashimi, Sushi) luôn được đóng gói kèm đá gel giữ lạnh. Đồ nóng (Canh kim chi, Kimbap
                chiên...) được đặt trong hộp giữ nhiệt chuyên dụng. Vui lòng sử dụng ngay khi nhận được món.</p>
        </div>
    </div>
    </DefaultLayout>
</template>

<script setup>
import DefaultLayout from '../layouts/DefaultLayout.vue';
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
}

.policy-content h3 {
    color: #333;
    margin-top: 25px;
    font-size: 1.2rem;
}

.policy-content p,
.policy-content li {
    line-height: 1.8;
    color: #555;
}
</style>