import axios from 'axios'

const service = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1/api',
    timeout: 5000
})

export default service
