<template>
    <DefaultLayout>
        <div class="container text-center mt-5">
            <div v-if="status === 'success'" class="alert alert-success">
                <h2> Thanh toán thành công!</h2>
                <p>Mã giao dịch: {{ transactionId }}</p>
                <router-link to="/orders" class="btn btn-primary">Xem đơn hàng</router-link>
            </div>

            <div v-else-if="status === 'loading'" class="text-light">
                <h2>Đang xác thực đơn hàng...</h2>
            </div>

            <div v-else class="alert alert-danger">
                <h2> Thanh toán thất bại</h2>
                <p>Đơn hàng chưa được thanh toán hoặc có lỗi xảy ra.</p>
                <router-link to="/cart" class="btn btn-warning">Quay lại giỏ hàng</router-link>
            </div>
        </div>
    </DefaultLayout>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import api from '../../services/api';
import DefaultLayout from '../layouts/DefaultLayout.vue';

const route = useRoute();
const status = ref('loading'); // Trạng thái mặc định
const transactionId = ref('');

onMounted(async () => {
    const params = route.query;
    transactionId.value = params.vnp_TransactionNo;

    if (params.vnp_ResponseCode === '00') {
        try {
            // Gọi API vnpay-return để Backend thực hiện UPDATE Database
            const res = await api.get('/payment/vnpay-return', { params });

            if (res.data.success) {
                status.value = 'success'; // UI sẽ hiện thông báo thành công
                localStorage.removeItem('cart'); // Dọn dẹp giỏ hàng
            } else {
                status.value = 'failed';
            }
        } catch (error) {
            console.error("Lỗi xác thực:", error);
            status.value = 'failed';
        }
    } else {
        status.value = 'failed';
    }
});
</script>