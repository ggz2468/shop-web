export default [
    {
        path: '/products',
        name: 'ProductList',
        meta: { title: `${import.meta.env.VITE_APP_TITLE} - 產品列表` },
        component: () => import('@/views/product/List.vue'),
    }
]
