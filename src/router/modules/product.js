export default [
    {
        path: '/products',
        name: 'ProductList',
        meta: { title: `${import.meta.env.VITE_APP_TITLE} - 產品列表` },
        component: () => import('@/views/product/List.vue'),
    },
    {
        path: '/products/:id',
        name: 'ProductDetail',
        meta: { title: `${import.meta.env.VITE_APP_TITLE} - 產品詳情` },
        component: () => import('@/views/product/Detail.vue'),
    }
]
