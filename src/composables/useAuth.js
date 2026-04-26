import http from '@/plugins/axios'
import { authServices } from '@/services/authService'

const AUTH_STORAGE_KEY = 'shop-web:is-authenticated'
const AUTH_STATE_CHANGE_EVENT = 'shop-web:auth-state-change'

export const isAuthenticated = async () => {
    try {
        await authServices.user()

        localStorage.setItem(AUTH_STORAGE_KEY, 'true')
        return true
    } catch (error) {
        localStorage.removeItem(AUTH_STORAGE_KEY)
        return false
    }
}

export const setAuthenticated = (value) => {
    if (value) {
        localStorage.setItem(AUTH_STORAGE_KEY, 'true')
        window.dispatchEvent(new CustomEvent(AUTH_STATE_CHANGE_EVENT))
        return
    }

    localStorage.removeItem(AUTH_STORAGE_KEY)
    window.dispatchEvent(new CustomEvent(AUTH_STATE_CHANGE_EVENT))
}

export { AUTH_STORAGE_KEY, AUTH_STATE_CHANGE_EVENT }
