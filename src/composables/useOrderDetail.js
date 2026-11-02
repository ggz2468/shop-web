import { ref } from 'vue'
import { orderServices } from '@/services/orderService'
import { resolveApiErrorMessage } from '@/utils/apiError'
import { findOptionLabelByValue, hasOrderDisplayOptions } from '@/utils/orderOptions'

export const useOrderDetail = () => {
    const order = ref(null)
    const options = ref(null)
    const loading = ref(false)
    const errorMessage = ref('')
    const notFound = ref(false)
    let requestVersion = 0

    const loadOrder = async (id) => {
        const version = ++requestVersion
        order.value = null
        errorMessage.value = ''
        notFound.value = false
        loading.value = true

        try {
            const [response, optionsResponse] = await Promise.all([
                orderServices.getOrder(id),
                orderServices.getOrderOptions(),
            ])
            if (version !== requestVersion) return

            const result = response.data?.data
            const dictionaries = optionsResponse.data?.data
            if (!result || String(result.id) !== String(id)
                || !Array.isArray(result.items)
                || !hasOrderDisplayOptions(dictionaries)) {
                throw new Error('Invalid order detail or options response')
            }

            order.value = result
            options.value = dictionaries
        } catch (error) {
            if (version !== requestVersion) return
            notFound.value = error.response?.status === 404
            errorMessage.value = notFound.value
                ? '找不到此訂單，或您無權查看。'
                : resolveApiErrorMessage(error, '取得訂單詳情失敗，請稍後再試。')
                    ?? '請先登入會員以查看訂單。'
        } finally {
            if (version === requestVersion) loading.value = false
        }
    }

    const optionLabel = (key, value) => findOptionLabelByValue(options.value?.[key], value)

    return { order, loading, errorMessage, notFound, loadOrder, optionLabel }
}
