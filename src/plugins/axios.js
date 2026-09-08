import axios from 'axios'
import router from '@/router'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost/api'
const csrfCookieUrl = import.meta.env.VITE_SANCTUM_CSRF_COOKIE_URL || `${apiBaseUrl.replace(/\/api\/?$/, '')}/sanctum/csrf-cookie`
const LOGIN_REQUIRED_API_PATH_REGEX = /^\/?(cart|orders)(\/|$)/

const http = axios.create({
	baseURL: apiBaseUrl,
	withCredentials: true,
	withXSRFToken: true,
})

// 若伺服器回傳 419 (CSRF token 過期)，嘗試重新取得 CSRF token 並重試原請求
http.interceptors.response.use(
    response => response,
    async error => {
        if (error.response?.status === 419) {
            try {
                await http.get(csrfCookieUrl)
                return http.request(error.config)
            } catch (csrfError) {
                return Promise.reject(csrfError)
            }
        }

        // 未登入會員存取購物車、訂單 API 時，導向登入頁面
        if (error.response?.status === 401 && LOGIN_REQUIRED_API_PATH_REGEX.test(error.config?.url ?? '')) {
            if (router.currentRoute.value.name !== 'Login') {
                router.push({ name: 'Login' })
            }
        }

        return Promise.reject(error)
    }
)

export default http

