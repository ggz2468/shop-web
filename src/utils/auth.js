const AUTH_STORAGE_KEY = 'shop-web:is-authenticated'
const AUTH_STATE_CHANGE_EVENT = 'shop-web:auth-state-change'

export const isAuthenticated = () => localStorage.getItem(AUTH_STORAGE_KEY) === 'true'

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