import http from '@/plugins/axios'

export const authServices = {
    login: (data) => http.post('/login', data),
    logout: () => http.post('/logout', null),
    user: () => http.get('/user'),
}
