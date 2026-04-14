<template>
    <div class="fixed bottom-5 right-5 z-50">
        <button v-if="!isOpen" @click="isOpen = true"
            class="bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700">
            💬 Tư vấn ngay
        </button>

       <div v-else class="bg-white w-[95vw] sm:w-[500px] md:w-[600px] rounded-lg shadow-2xl border border-gray-200 flex flex-col h-[80vh] max-h-[800px]">
            <div class="bg-blue-600 text-white p-3 rounded-t-lg flex justify-between items-center">
                <h3 class="font-bold">Trợ lý Nhà hàng</h3>
                <button @click="isOpen = false" class="text-white hover:text-gray-200 font-bold">✕</button>
            </div>

            <div class="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-3" ref="chatContainer">
                <div v-for="(msg, index) in messages" :key="index"
                    :class="msg.sender === 'user' ? 'self-end' : 'self-start'">

                    <div :class="msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-white border text-gray-800'"
                        class="p-2 rounded-lg max-w-[85%] shadow-sm text-sm whitespace-pre-line">
                        {{ msg.text }}
                    </div>

                    <div v-if="msg.cards" class="mt-2 flex flex-col gap-2 w-64">
                        <div v-for="item in msg.cards" :key="item.id"
                            class="bg-white border rounded p-2 text-xs shadow-sm flex items-center gap-2">
                           <img v-if="item.img_url" :src="`http://localhost:8000/storage/${item.img_url}`"
                                class="w-12 h-12 object-cover rounded" alt="">
                            <div>
                                <p class="font-bold">{{ item.name }}</p>
                                <p class="text-red-500 font-semibold">{{ formatPrice(item.price) }}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-if="isLoading" class="self-start bg-gray-200 text-gray-500 p-2 rounded-lg text-xs italic">
                    Trợ lý đang gõ...
                </div>
            </div>

            <div class="px-2 py-2 border-t flex gap-2 overflow-x-auto bg-white">
                <button @click="sendAction('menu', 'Xem Thực Đơn')"
                    class="whitespace-nowrap border border-blue-500 text-blue-600 text-xs px-3 py-1 rounded-full hover:bg-blue-50">🍱
                    Xem Thực Đơn</button>
                <button @click="sendAction('combo', 'Gợi ý Combo')"
                    class="whitespace-nowrap border border-blue-500 text-blue-600 text-xs px-3 py-1 rounded-full hover:bg-blue-50">🔥
                    Gợi ý Combo</button>
            </div>

            <form @submit.prevent="sendText" class="border-t p-2 flex gap-2 bg-white rounded-b-lg">
                <input v-model="userInput" type="text" placeholder="Bạn muốn ăn gì hôm nay?"
                    class="flex-1 border rounded px-2 py-1 text-sm outline-none focus:border-blue-500"
                    :disabled="isLoading">
                <button type="submit" class="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    :disabled="isLoading || !userInput.trim()">Gửi</button>
            </form>
        </div>
    </div>
</template>

<script setup>
import { ref, nextTick } from 'vue';
import axios from 'axios';

const isOpen = ref(false);
const isLoading = ref(false);
const userInput = ref('');
const chatContainer = ref(null);

// Mảng chứa lịch sử chat
const messages = ref([
    { sender: 'bot', text: 'Chào bạn! Mình là trợ lý của nhà hàng. Bạn có thể bấm các nút bên dưới để xem menu nhanh, hoặc gõ câu hỏi để mình tư vấn trực tiếp nhé!' }
]);

// Format tiền tệ
const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

// Cuộn xuống cuối cùng khi có tin nhắn mới
const scrollToBottom = async () => {
    await nextTick();
    if (chatContainer.value) {
        chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    }
};

// Hàm gửi khi khách BẤM NÚT (Cách 1)
const sendAction = async (actionCode, label) => {
    if (isLoading.value) return;

    // Thêm tin nhắn của user vào màn hình
    messages.value.push({ sender: 'user', text: label });
    scrollToBottom();

    await fetchReply('button', actionCode);
};

// Hàm gửi khi khách GÕ TEXT (Cách 2)
const sendText = async () => {
    if (!userInput.value.trim() || isLoading.value) return;

    const text = userInput.value;
    userInput.value = ''; // Xóa trắng ô input

    messages.value.push({ sender: 'user', text: text });
    scrollToBottom();

    await fetchReply('text', text);
};

// Hàm gọi API chung
const fetchReply = async (type, content) => {
    isLoading.value = true;
    scrollToBottom();

    try {
        // Đảm bảo đường dẫn này khớp với backend Laravel của bạn
        const response = await axios.post('http://localhost:8000/api/chatbot', {
            type: type,
            content: content
        });

        const data = response.data;

        if (data.reply_type === 'cards') {
            messages.value.push({ sender: 'bot', text: data.message, cards: data.data });
        } else {
            messages.value.push({ sender: 'bot', text: data.message });
        }
    } catch (error) {
        messages.value.push({ sender: 'bot', text: 'Xin lỗi, hệ thống đang bận. Bạn vui lòng thử lại sau nhé!' });
    } finally {
        isLoading.value = false;
        scrollToBottom();
    }
};
</script>