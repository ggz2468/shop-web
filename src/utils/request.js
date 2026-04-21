import axios from 'axios'

axios.defaults.withCredentials = true
axios.defaults.withXSRFToken = true

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost/api'
const csrfCookieUrl = import.meta.env.VITE_SANCTUM_CSRF_COOKIE_URL || `${apiBaseUrl.replace(/\/api\/?$/, '')}/sanctum/csrf-cookie`

const service = axios.create({
    baseURL: apiBaseUrl,
})

export const fetchCsrfCookie = () => axios.get(csrfCookieUrl)

service.fetchCsrfCookie = fetchCsrfCookie

export default service
