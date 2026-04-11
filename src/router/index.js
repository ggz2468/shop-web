import { createRouter, createWebHistory } from 'vue-router'
import productRoutes from './modules/product'

const routes = [
    {
        path: '/',
        name: 'Home',
        component: () => import('@/views/Home.vue'),
    },
    ...productRoutes
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

export default router
