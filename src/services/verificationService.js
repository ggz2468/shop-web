import http from '@/plugins/axios'

export const verificationServices = {
    verifyEmail: (data) => http.post('/verifications/email/verify', data),
}
