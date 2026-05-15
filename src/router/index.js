import { createRouter, createWebHistory } from 'vue-router'
import authRoutes from './modules/auth'
import productRoutes from './modules/product'
import verificationRoutes from './modules/verification'

let previousRouteName = null

export const getPreviousRouteName = () => previousRouteName

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

router.afterEach((to, from) => {
    previousRouteName = typeof from.name === 'string' ? from.name : null
    document.title = to.meta.title || import.meta.env.VITE_APP_TITLE
})

export default router
