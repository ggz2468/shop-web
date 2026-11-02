export default [
    {
        path: '/checkout',
        name: 'Checkout',
        meta: { title: `${import.meta.env.VITE_APP_TITLE} - 確認訂單` },
        component: () => import('@/views/order/Checkout.vue'),
    },
    {
        path: '/orders',
        name: 'OrderList',
        meta: { title: `${import.meta.env.VITE_APP_TITLE} - 訂單列表` },
        component: () => import('@/views/order/List.vue'),
    },
    {
        path: '/orders/:id(\\d+)',
        name: 'OrderDetail',
        meta: { title: `${import.meta.env.VITE_APP_TITLE} - 訂單詳情` },
        component: () => import('@/views/order/Detail.vue'),
    },
]
