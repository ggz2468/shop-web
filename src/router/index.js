import { createRouter, createWebHistory } from 'vue-router'
import authRoutes from './modules/auth'
import cartRoutes from './modules/cart'
import orderRoutes from './modules/order'
import productRoutes from './modules/product'
import verificationRoutes from './modules/verification'

let previousRouteName = null
const PREVIOUS_PAGE_FALLBACK_ROUTE_NAMES = new Set([
    'Register',
    'ForgotPassword',
    'SendEmailVerificationLink',
    'Login'
])

export const redirectAfterLogin = () => {
    if (!previousRouteName || PREVIOUS_PAGE_FALLBACK_ROUTE_NAMES.has(previousRouteName)) {
        return router.push({ name: 'Home' })
    }

    if (window.history.length > 1) {
        router.back()
        return Promise.resolve()
    }

    return router.push({ name: 'Home' })
}

const routes = [
    {
        path: '/',
        name: 'Home',
        meta: { title: `${import.meta.env.VITE_APP_TITLE} - 首頁` },
        component: () => import('@/views/Home.vue'),
    },
    ...authRoutes,
    ...cartRoutes,
    ...orderRoutes,
    ...productRoutes,
    ...verificationRoutes,
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        meta: { title: `${import.meta.env.VITE_APP_TITLE} - 404 Not Found` },
        component: () => import('@/views/NotFound.vue'),
    }
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
