import { createRouter, createWebHistory } from 'vue-router'
import authRoutes from './modules/auth'
import productRoutes from './modules/product'
import verificationRoutes from './modules/verification'

const routes = [
    {
        path: '/',
        name: 'Home',
        meta: { title: `${import.meta.env.VITE_APP_TITLE} - 首頁` },
        component: () => import('@/views/Home.vue'),
    },
    ...authRoutes,
    ...productRoutes,
    ...verificationRoutes
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

router.afterEach((to) => {
    document.title = to.meta.title || import.meta.env.VITE_APP_TITLE
})

export default router
