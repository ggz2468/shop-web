export default [
    {
        path: '/verifications/email/send',
        name: 'SendEmailVerificationLink',
        meta: { title: `${import.meta.env.VITE_APP_TITLE} - 補發電子郵件驗證連結信` },
        component: () => import('@/views/verification/SendEmailVerificationLink.vue'),
    },
    {
        path: '/verifications/email/verify',
        name: 'VerifyEmail',
        meta: { title: `${import.meta.env.VITE_APP_TITLE} - 驗證電子郵件` },
        component: () => import('@/views/verification/VerifyEmail.vue'),
    }
]
