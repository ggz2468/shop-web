import http from '@/plugins/axios'

export const authServices = {
    login: (data) => http.post('/auth/login', data),
    register: (data) => http.post('/auth/register', data),
    logout: () => http.post('/auth/logout', null),
    user: () => http.get('/auth/user'),
}
