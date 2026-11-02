import { orderServices } from '@/services/orderService'
import { delay } from '@/utils/delay'

const PAYMENT_CHECKOUT_MAX_ATTEMPTS = 10
const PAYMENT_CHECKOUT_RETRY_INTERVAL = 1000

export const fetchPaymentCheckout = async (orderId, { signal } = {}) => {
    for (let attempt = 0; attempt < PAYMENT_CHECKOUT_MAX_ATTEMPTS; attempt += 1) {
        signal?.throwIfAborted()
        const response = await orderServices.getPaymentCheckout(orderId, signal ? { signal } : undefined)
        signal?.throwIfAborted()

        if (response.status === 200) {
            const checkout = response.data?.data
            const payload = checkout?.checkout_payload
            if (String(checkout?.order_id) !== String(orderId)
                || !payload || typeof payload.action !== 'string'
                || !/^https?:\/\//i.test(payload.action)
                || payload.method?.toUpperCase() !== 'POST'
                || !checkout.request_payload || typeof checkout.request_payload !== 'object'
                || Array.isArray(checkout.request_payload)
                || Object.keys(checkout.request_payload).length === 0
                || !Number.isInteger(checkout.amount) || checkout.amount < 0
                || typeof checkout.currency !== 'string' || checkout.currency.length === 0) {
                throw new Error('Invalid payment checkout response')
            }

            return checkout
        }

        if (response.status !== 202) {
            throw new Error('Unexpected payment checkout status')
        }

        if (attempt < PAYMENT_CHECKOUT_MAX_ATTEMPTS - 1) {
            await delay(PAYMENT_CHECKOUT_RETRY_INTERVAL)
        }
    }

    return null
}