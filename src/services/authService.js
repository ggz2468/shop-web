import http from '@/plugins/axios'

export const authServices = {
    login: (data) => http.post('/auth/login', data),
    logout: () => http.post('/auth/logout', null),
    user: () => http.get('/auth/user'),
}
