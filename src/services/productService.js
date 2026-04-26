import http from '@/plugins/axios'

export const productServices = {
    getProducts: (params) => http.get('/products', { params: params }),
    getProductDetail: (id) => http.get(`/products/${id}`),
}
