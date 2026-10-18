<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { authServices } from '@/services/authService'
import { AUTH_STATE_CHANGE_EVENT, isAuthenticated, setAuthenticated } from '@/composables/useAuth'

const isOpen = ref(false)
const isLoggingOut = ref(false)
const loggedIn = ref(false)
const userMenuRef = ref(null)

const syncAuthState = async () => {
    loggedIn.value = await isAuthenticated()
}

const handleDocumentClick = (event) => {
    if (!userMenuRef.value?.contains(event.target)) {
        isOpen.value = false
    }
}

const logout = async () => {
    if (!loggedIn.value || isLoggingOut.value) return

    isLoggingOut.value = true

    try {
        await authServices.logout()
        setAuthenticated(false)
        window.location.reload()
    } catch (error) {
        console.error('Failed to log out.', error)
    } finally {
        isLoggingOut.value = false
        isOpen.value = false
    }
}

onMounted(() => {
    void syncAuthState()
    document.addEventListener('click', handleDocumentClick)
    window.addEventListener('storage', syncAuthState)
    window.addEventListener(AUTH_STATE_CHANGE_EVENT, syncAuthState)
})

onBeforeUnmount(() => {
    document.removeEventListener('click', handleDocumentClick)
    window.removeEventListener('storage', syncAuthState)
    window.removeEventListener(AUTH_STATE_CHANGE_EVENT, syncAuthState)
})
</script>

<template>
    <div ref="userMenuRef" class="user-menu">
        <button
            class="navbar-icon-button"
            type="button"
            aria-label="會員選單"
            :aria-expanded="isOpen"
            aria-controls="user-menu-panel"
            @click="isOpen = !isOpen"
        >
            <font-awesome-icon icon="user" />
        </button>
        <div v-if="isOpen" id="user-menu-panel" class="user-menu__panel">
            <RouterLink
                v-if="!loggedIn"
                class="user-menu__link"
                :to="{ name: 'Login' }"
                @click="isOpen = false"
            >
                會員登入
            </RouterLink>
            <template v-else>
                <RouterLink
                    class="user-menu__link"
                    :to="{ name: 'OrderList' }"
                    @click="isOpen = false"
                >
                    歷史訂單
                </RouterLink>
                <button
                    class="user-menu__link user-menu__button"
                    type="button"
                    :disabled="isLoggingOut"
                    @click="logout"
                >
                    {{ isLoggingOut ? '處理中...' : '會員登出' }}
                </button>
            </template>
        </div>
    </div>
</template>

<style scoped>
.user-menu {
    position: relative;
}

.user-menu__panel {
    position: absolute;
    top: calc(100% + 0.5rem);
    right: 0;
    min-width: 7rem;
    padding: 0.5rem;
    border-radius: 0.5rem;
    background-color: #fff;
    box-shadow: 0 0.5rem 1.25rem rgba(0, 0, 0, 0.2);
    z-index: 1000;
}

.user-menu__link {
    display: block;
    width: 100%;
    padding: 0.25rem 0.5rem;
    color: #212529;
    text-decoration: none;
    text-align: left;
    white-space: nowrap;
}

.user-menu__button {
    border: 0;
    background: transparent;
}

.user-menu__link:hover,
.user-menu__button:hover {
    color: #0d6efd;
}
</style>
