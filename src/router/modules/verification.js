export default [
    {
        path: '/verifications/email/verify',
        name: 'EmailVerify',
        meta: { title: `${import.meta.env.VITE_APP_TITLE} - 電子郵件驗證` },
        component: () => import('@/views/verification/EmailVerify.vue'),
    }
]
