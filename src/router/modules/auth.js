export default [
    {
        path: '/login',
        name: 'Login',
        meta: { title: `${import.meta.env.VITE_APP_TITLE} - 會員登入` },
        component: () => import('@/views/auth/Login.vue'),
    },
    {
        path: '/register',
        name: 'Register',
        meta: { title: `${import.meta.env.VITE_APP_TITLE} - 會員註冊` },
        component: () => import('@/views/auth/Register.vue'),
    }
]
