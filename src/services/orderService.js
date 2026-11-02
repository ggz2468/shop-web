import http from '@/plugins/axios'

export const orderServices = {
    getOrder: orderId => http.get(`/orders/${orderId}`),
    getOrders: (page = 1, rowCountsPerPage = 10) => http.get('/orders', {
        params: { page, row_counts_per_page: rowCountsPerPage },
    }),
    getOrderOptions: () => http.get('/orders/options'),
    createOrder: (data, idempotencyKey) => http.post('/orders', data, {
        headers: { 'Idempotency-Key': idempotencyKey },
    }),
    getPaymentCheckout: (orderId) => http.get(`/orders/${orderId}/payment-checkout`),
}
