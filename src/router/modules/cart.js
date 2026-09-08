export default [
    {
        path: '/cart',
        name: 'Cart',
        meta: { title: `${import.meta.env.VITE_APP_TITLE} - 購物車` },
        component: () => import('@/views/cart/Cart.vue'),
    }
]
