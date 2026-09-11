import { orderServices } from '@/services/orderService'
import { delay } from '@/utils/delay'

const PAYMENT_CHECKOUT_MAX_ATTEMPTS = 10
const PAYMENT_CHECKOUT_RETRY_INTERVAL = 1000

export const fetchPaymentCheckout = async (orderId) => {
    for (let attempt = 0; attempt < PAYMENT_CHECKOUT_MAX_ATTEMPTS; attempt += 1) {
        const response = await orderServices.getPaymentCheckout(orderId)

        if (response.status === 200) {
            return response.data?.data ?? null
        }

        await delay(PAYMENT_CHECKOUT_RETRY_INTERVAL)
    }

    return null
}