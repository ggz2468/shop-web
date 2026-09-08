import http from '@/plugins/axios'

export const cartServices = {
    getCart: () => http.get('/cart'),
    addItem: (data) => http.post('/cart/items', data),
    updateItem: (productVariantId, data) => http.patch(`/cart/items/${productVariantId}`, data),
    removeItem: (productVariantId) => http.delete(`/cart/items/${productVariantId}`),
    clearCart: () => http.delete('/cart/items'),
}
