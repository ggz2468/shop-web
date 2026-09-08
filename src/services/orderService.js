import http from '@/plugins/axios'

export const orderServices = {
    createOrder: (data, idempotencyKey) => http.post('/orders', data, {
        headers: { 'Idempotency-Key': idempotencyKey },
    }),
    getPaymentCheckout: (orderId) => http.get(`/orders/${orderId}/payment-checkout`),
}
