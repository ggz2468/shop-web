import { createRouter, createWebHistory } from 'vue-router'
import productRoutes from './modules/product'

const routes = [
    {
        path: '/',
        name: 'Home',
        meta: { title: `${import.meta.env.VITE_APP_TITLE} - 首頁` },
        component: () => import('@/views/Home.vue'),
    },
    ...productRoutes
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

router.afterEach((to) => {
    document.title = to.meta.title || import.meta.env.VITE_APP_TITLE
})

export default router
