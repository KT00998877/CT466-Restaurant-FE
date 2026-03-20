<script setup>
import { ref, reactive } from 'vue';
import axios from 'axios';
import DefaultLayout from '../layouts/DefaultLayout.vue';

const form = reactive({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
});

const errors = ref({});
const isSubmitting = ref(false);
const successMsg = ref('');
const errorMsg = ref('');

const submitForm = async () => {
    isSubmitting.value = true;
    errors.value = {};
    successMsg.value = '';
    errorMsg.value = '';

    try {
        const response = await axios.post('http://127.0.0.1:8000/api/contacts', form);
        if (response.data.success) {
            successMsg.value = response.data.message;
            // Reset form
            Object.keys(form).forEach(key => form[key] = '');
        }
    } catch (error) {
        if (error.response?.status === 422) {
            // Lỗi validation từ Laravel
            errors.value = error.response.data.errors;
        } else {
            errorMsg.value = 'Có lỗi xảy ra. Vui lòng thử lại sau.';
        }
    } finally {
        isSubmitting.value = false;
    }
};
</script>

<template>
    <DefaultLayout>
        <!-- Hero Banner -->
        <div class="contact-hero">
            <div class="hero-overlay">
                <h1>Liên Hệ Với Chúng Tôi</h1>
                <p>Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn</p>
            </div>
        </div>

        <!-- Main Content -->
        <div class="contact-page">
            <div class="contact-wrapper">

                <!-- Cột thông tin -->
                <div class="contact-info">
                    <h2>Thông Tin Liên Hệ</h2>
                    <p class="info-desc">
                        Hãy ghé thăm chúng tôi hoặc để lại tin nhắn. Đội ngũ sẽ phản hồi trong vòng 24 giờ.
                    </p>

                    <div class="info-item">
                        <div class="info-icon"></div>
                        <div>
                            <h4>Địa chỉ</h4>
                            <p>123 Đường Ẩm Thực, Quận 1, TP. Hồ Chí Minh</p>
                        </div>
                    </div>

                    <div class="info-item">
                        <div class="info-icon"></div>
                        <div>
                            <h4>Điện thoại</h4>
                            <p>(028) 1234 5678</p>
                        </div>
                    </div>

                    <div class="info-item">
                        <div class="info-icon"></div>
                        <div>
                            <h4>Email</h4>
                            <p>info@nhahang.com</p>
                        </div>
                    </div>

                    <div class="info-item">
                        <div class="info-icon"></div>
                        <div>
                            <h4>Giờ mở cửa</h4>
                            <p>Thứ 2 – Chủ nhật: 10:00 – 22:00</p>
                        </div>
                    </div>

                    <!-- Social Links -->
                    <div class="social-links">
                        <a href="#" class="social-btn">Facebook</a>
                        <a href="#" class="social-btn">Instagram</a>
                        <a href="#" class="social-btn">Zalo</a>
                    </div>
                </div>

                <!-- Cột form -->
                <div class="contact-form-wrapper">
                    <h2>Gửi Tin Nhắn</h2>

                    <!-- Thông báo thành công -->
                    <div v-if="successMsg" class="alert alert-success">
                         {{ successMsg }}
                    </div>

                    <!-- Thông báo lỗi chung -->
                    <div v-if="errorMsg" class="alert alert-error">
                         {{ errorMsg }}
                    </div>

                    <div class="contact-form">
                        <!-- Họ tên -->
                        <div class="form-group">
                            <label>Họ và tên <span class="required">*</span></label>
                            <input v-model="form.name" type="text" placeholder="Nguyễn Văn A"
                                :class="{ 'input-error': errors.name }" />
                            <span v-if="errors.name" class="error-msg">{{ errors.name[0] }}</span>
                        </div>

                        <!-- Email + Phone 2 cột -->
                        <div class="form-row">
                            <div class="form-group">
                                <label>Email <span class="required">*</span></label>
                                <input v-model="form.email" type="email" placeholder="example@email.com"
                                    :class="{ 'input-error': errors.email }" />
                                <span v-if="errors.email" class="error-msg">{{ errors.email[0] }}</span>
                            </div>
                            <div class="form-group">
                                <label>Số điện thoại</label>
                                <input v-model="form.phone" type="tel" placeholder="0912 345 678" />
                            </div>
                        </div>

                        <!-- Tiêu đề -->
                        <div class="form-group">
                            <label>Tiêu đề <span class="required">*</span></label>
                            <input v-model="form.subject" type="text" placeholder="Đặt bàn / Góp ý / Hợp tác..."
                                :class="{ 'input-error': errors.subject }" />
                            <span v-if="errors.subject" class="error-msg">{{ errors.subject[0] }}</span>
                        </div>

                        <!-- Nội dung -->
                        <div class="form-group">
                            <label>Nội dung <span class="required">*</span></label>
                            <textarea v-model="form.message" rows="5" placeholder="Nhập nội dung tin nhắn..."
                                :class="{ 'input-error': errors.message }"></textarea>
                            <span v-if="errors.message" class="error-msg">{{ errors.message[0] }}</span>
                        </div>

                        <!-- Submit -->
                        <button class="submit-btn" @click="submitForm" :disabled="isSubmitting">
                            <span v-if="isSubmitting"> Đang gửi...</span>
                            <span v-else>Gửi Tin Nhắn </span>
                        </button>
                    </div>
                </div>

            </div>

            <!-- Google Map -->
            <div class="map-section">
                <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.4241674197667!2d106.69800787503567!3d10.776488589382819!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f3a9d8d1bb3%3A0xd1f4b7f79e34b01e!2zQuG6v24gTmjDoCBSb25nIFNhaSBHw7Ju!5e0!3m2!1svi!2svn!4v1718000000000!5m2!1svi!2svn"
                    width="100%" height="400" style="border:0;" allowfullscreen="" loading="lazy">
                </iframe>
            </div>
        </div>
    </DefaultLayout>
</template>

<style scoped>
/* Hero */
.contact-hero {
    height: 40vh;
    background: linear-gradient(135deg, #1a1a1a 0%, #2c2c2c 100%);
    display: flex;
    align-items: center;
    justify-content: center;
}

.hero-overlay {
    text-align: center;
    color: white;
}

.hero-overlay h1 {
    font-size: 3rem;
    font-weight: bold;
    color: #e67e22;
    margin-bottom: 10px;
}

.hero-overlay p {
    font-size: 1.2rem;
    color: rgba(255, 255, 255, 0.8);
}

/* Page Layout */
.contact-page {
    background-color: #1a1a1a;
    padding: 60px 10%;
}

.contact-wrapper {
    display: flex;
    gap: 50px;
    margin-bottom: 60px;
}

@media (max-width: 768px) {
    .contact-wrapper {
        flex-direction: column;
    }
}

/* Info Column */
.contact-info {
    flex: 1;
    color: white;
}

.contact-info h2 {
    font-size: 1.8rem;
    color: #e67e22;
    margin-bottom: 15px;
}

.info-desc {
    color: rgba(255, 255, 255, 0.7);
    line-height: 1.6;
    margin-bottom: 30px;
}

.info-item {
    display: flex;
    gap: 15px;
    margin-bottom: 25px;
    align-items: flex-start;
}

.info-icon {
    font-size: 1.5rem;
    margin-top: 2px;
}

.info-item h4 {
    color: #d4a373;
    margin-bottom: 4px;
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.info-item p {
    color: rgba(255, 255, 255, 0.8);
    margin: 0;
}

.social-links {
    display: flex;
    gap: 10px;
    margin-top: 30px;
}

.social-btn {
    padding: 8px 18px;
    border: 1px solid #e67e22;
    color: #e67e22;
    border-radius: 20px;
    text-decoration: none;
    font-size: 0.85rem;
    transition: 0.3s;
}

.social-btn:hover {
    background: #e67e22;
    color: white;
}

/* Form Column */
.contact-form-wrapper {
    flex: 1.4;
    background: white;
    border-radius: 15px;
    padding: 40px;
}

.contact-form-wrapper h2 {
    font-size: 1.8rem;
    color: #2c3e50;
    margin-bottom: 25px;
}

/* Form Elements */
.form-group {
    margin-bottom: 20px;
    display: flex;
    flex-direction: column;
}

.form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
}

@media (max-width: 500px) {
    .form-row {
        grid-template-columns: 1fr;
    }
}

label {
    font-size: 0.9rem;
    font-weight: 600;
    color: #444;
    margin-bottom: 6px;
}

.required {
    color: #e74c3c;
}

input,
textarea {
    padding: 12px 15px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 0.95rem;
    transition: border-color 0.3s;
    outline: none;
    resize: vertical;
}

input:focus,
textarea:focus {
    border-color: #e67e22;
    box-shadow: 0 0 0 3px rgba(230, 126, 34, 0.1);
}

.input-error {
    border-color: #e74c3c !important;
}

.error-msg {
    color: #e74c3c;
    font-size: 0.8rem;
    margin-top: 4px;
}

/* Alert */
.alert {
    padding: 12px 16px;
    border-radius: 8px;
    margin-bottom: 20px;
    font-size: 0.95rem;
}

.alert-success {
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
}

.alert-error {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
}

/* Submit Button */
.submit-btn {
    width: 100%;
    padding: 14px;
    background: #e67e22;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: bold;
    cursor: pointer;
    transition: 0.3s;
    margin-top: 5px;
}

.submit-btn:hover:not(:disabled) {
    background: #d35400;
}

.submit-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

/* Map */
.map-section {
    border-radius: 15px;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
}
</style>