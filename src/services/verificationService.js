import http from '@/plugins/axios'

export const verificationServices = {
    sendEmailVerificationLink: (data) => http.post('/verifications/email/send', data),
    verifyEmail: (data) => http.post('/verifications/email/verify', data),
}
