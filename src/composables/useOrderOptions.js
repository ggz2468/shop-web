import { computed, ref } from 'vue'
import { orderServices } from '@/services/orderService'
import { resolveApiErrorMessage } from '@/utils/apiError'
import {
    CONVENIENCE_STORE_SHIPPING_METHOD_CODE,
    HOME_DELIVERY_SHIPPING_METHOD_CODE,
    findOptionValueByCode,
    normalizeOrderOptions,
} from '@/utils/orderOptions'

export const useOrderOptions = ({ errorMessage } = {}) => {
    const paymentMethods = ref([])
    const shippingMethods = ref([])
    const storeTypes = ref([])
    const defaultPaymentMethod = ref(null)
    const defaultShippingMethod = ref(null)
    const loadingOrderOptions = ref(false)

    const convenienceStoreShippingMethod = computed(() => findOptionValueByCode(
        shippingMethods.value,
        CONVENIENCE_STORE_SHIPPING_METHOD_CODE,
    ))
    const homeDeliveryShippingMethod = computed(() => findOptionValueByCode(
        shippingMethods.value,
        HOME_DELIVERY_SHIPPING_METHOD_CODE,
    ))

    const hasOrderOptions = computed(() => (
        paymentMethods.value.length > 0
        && shippingMethods.value.length > 0
        && storeTypes.value.length > 0
    ))

    const applyOrderOptions = (data) => {
        const options = normalizeOrderOptions(data)

        paymentMethods.value = options.paymentMethods
        shippingMethods.value = options.shippingMethods
        storeTypes.value = options.storeTypes
        defaultPaymentMethod.value = options.defaults.payment_method ?? options.paymentMethods[0]?.value ?? null
        defaultShippingMethod.value = options.defaults.shipping_method ?? options.shippingMethods[0]?.value ?? null
    }

    const loadOrderOptions = async () => {
        loadingOrderOptions.value = true

        try {
            const response = await orderServices.getOrderOptions()
            applyOrderOptions(response.data?.data ?? {})
        } catch (error) {
            if (errorMessage) {
                errorMessage.value = resolveApiErrorMessage(error, '取得訂單選項失敗，請稍後再試。') ?? ''
            }
        } finally {
            loadingOrderOptions.value = false
        }
    }

    return {
        paymentMethods,
        shippingMethods,
        storeTypes,
        defaultPaymentMethod,
        defaultShippingMethod,
        convenienceStoreShippingMethod,
        homeDeliveryShippingMethod,
        hasOrderOptions,
        loadingOrderOptions,
        loadOrderOptions,
    }
}