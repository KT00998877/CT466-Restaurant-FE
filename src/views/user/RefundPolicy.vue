<template>
    <DefaultLayout>
    <div class="policy-container">
        <h1 class="page-title">Quy Định Đổi Trả & Hoàn Tiền</h1>
        <div class="policy-content">
            <p>Nhà hàng luôn mong muốn mang đến những trải nghiệm ẩm thực hoàn hảo nhất. Nếu đơn hàng có sự cố, quý
                khách vui lòng tham khảo chính sách dưới đây:</p>

            <h3>1. Trường hợp áp dụng đổi trả</h3>
            <ul>
                <li>Món ăn bị giao sai so với đơn đặt hàng (Sai loại sushi, thiếu món nướng...).</li>
                <li>Món ăn có dấu hiệu hư hỏng, ôi thiu hoặc không đảm bảo vệ sinh an toàn thực phẩm.</li>
                <li>Đơn hàng bị đổ vỡ, biến dạng nghiêm trọng trong quá trình vận chuyển.</li>
            </ul>

            <h3>2. Thời gian tiếp nhận khiếu nại</h3>
            <p>Vì là thực phẩm chế biến sẵn, quý khách vui lòng kiểm tra ngay khi nhận hàng và phản hồi cho chúng tôi
                qua <b>Hotline: 1900 1234</b> trong vòng <strong>30 phút</strong> kể từ khi nhận được món. Sau thời gian
                này, chúng tôi xin phép từ chối giải quyết.</p>

            <h3>3. Chính sách hoàn tiền</h3>
            <p>Nếu lỗi thuộc về phía nhà hàng, chúng tôi sẽ:</p>
            <ul>
                <li>Đổi món mới ngay lập tức (Miễn phí hoàn toàn phí ship phát sinh).</li>
                <li>Hoặc hoàn tiền 100% giá trị món ăn bị lỗi vào tài khoản ngân hàng / ví điện tử của quý khách trong
                    vòng 24 giờ làm việc.</li>
            </ul>
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