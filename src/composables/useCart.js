import { computed, ref } from 'vue'
import { cartServices } from '@/services/cartService'
import { resolveApiErrorMessage } from '@/utils/apiError'

export const useCart = () => {
    const items = ref([])
    const totalQuantity = ref(0)
    const loading = ref(true)
    const errorMessage = ref('')

    const hasItems = computed(() => items.value.length > 0)

    const loadCart = async () => {
        loading.value = true
        errorMessage.value = ''

        try {
            const response = await cartServices.getCart()
            items.value = response.data?.data?.items ?? []
            totalQuantity.value = response.data?.data?.total_quantity ?? 0
        } catch (error) {
            errorMessage.value = resolveApiErrorMessage(error, '購物車載入失敗，請稍後再試。') ?? ''
        } finally {
            loading.value = false
        }
    }

    return { items, totalQuantity, loading, errorMessage, hasItems, loadCart }
}
