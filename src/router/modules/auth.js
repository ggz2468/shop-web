export default [
    {
        path: '/auth/login',
        name: 'Login',
        meta: { title: `${import.meta.env.VITE_APP_TITLE} - 會員登入` },
        component: () => import('@/views/auth/Login.vue'),
    },
    {
        path: '/auth/register',
        name: 'Register',
        meta: { title: `${import.meta.env.VITE_APP_TITLE} - 會員註冊` },
        component: () => import('@/views/auth/Register.vue'),
    },
    {
        path: '/auth/password/forgot',
        name: 'ForgotPassword',
        meta: { title: `${import.meta.env.VITE_APP_TITLE} - 忘記密碼` },
        component: () => import('@/views/auth/ForgotPassword.vue'),
    },
    {
        path: '/auth/password/reset',
        name: 'ResetPassword',
        meta: { title: `${import.meta.env.VITE_APP_TITLE} - 重設密碼` },
        component: () => import('@/views/auth/ResetPassword.vue'),
    },
]
