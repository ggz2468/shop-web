import { ref } from 'vue'
import { orderServices } from '@/services/orderService'
import { resolveApiErrorMessage } from '@/utils/apiError'
import { findOptionLabelByValue, hasOrderDisplayOptions } from '@/utils/orderOptions'

export const useOrders = () => {
    const orders = ref([])
    const options = ref(null)
    const loading = ref(false)
    const errorMessage = ref('')
    const currentPage = ref(1)
    const totalItems = ref(0)
    const itemsPerPage = 10
    let requestedPage = 1

    const loadOrders = async (page = 1) => {
        if (loading.value) return

        requestedPage = page
        loading.value = true
        errorMessage.value = ''
        orders.value = []

        try {
            const [response, optionsResponse] = await Promise.all([
                orderServices.getOrders(page, itemsPerPage),
                options.value
                    ? Promise.resolve({ data: { data: options.value } })
                    : orderServices.getOrderOptions(),
            ])
            const result = response.data
            const dictionaries = optionsResponse.data?.data

            if (!Array.isArray(result?.data)
                || !Number.isInteger(result.meta?.current_page) || result.meta.current_page < 1
                || !Number.isInteger(result.meta?.total) || result.meta.total < 0
                || result.meta?.per_page !== itemsPerPage
                || !hasOrderDisplayOptions(dictionaries)) {
                throw new Error('Invalid order list or options response')
            }

            orders.value = result.data
            options.value = dictionaries
            currentPage.value = result.meta.current_page
            totalItems.value = result.meta.total
        } catch (error) {
            errorMessage.value = resolveApiErrorMessage(error, '取得訂單列表失敗，請稍後再試。')
                ?? '請先登入會員以查看訂單。'
        } finally {
            loading.value = false
        }
    }

    const retry = () => loadOrders(requestedPage)
    const optionLabel = (key, value) => findOptionLabelByValue(options.value?.[key], value)

    return { orders, loading, errorMessage, currentPage, totalItems, itemsPerPage, loadOrders, retry, optionLabel }
}
