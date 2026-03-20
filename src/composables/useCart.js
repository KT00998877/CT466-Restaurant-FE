import { ref, computed } from "vue"; // ✅ thêm computed
import api from "../services/api";

const cartItems = ref([]);
const loading = ref(false);

export function useCart() {
  const fetchCart = async () => {
    loading.value = true;
    try {
      const res = await api.get("/cart");
      if (res.data.success) {
        cartItems.value = res.data.data;
      }
    } catch (err) {
      console.error("Lỗi lấy giỏ hàng", err);
    } finally {
      loading.value = false;
    }
  };

  const cartCount = computed(() =>
    cartItems.value.reduce((sum, item) => sum + item.quantity, 0),
  );

  return { cartItems, cartCount, loading, fetchCart };
}
