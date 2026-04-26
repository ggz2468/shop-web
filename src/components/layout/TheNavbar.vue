<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { authServices } from '@/services/authService'
import { AUTH_STATE_CHANGE_EVENT, isAuthenticated, setAuthenticated } from '@/composables/useAuth'

const isSearchOpen = ref(false)
const isUserMenuOpen = ref(false)
const isLoggingOut = ref(false)
const loggedIn = ref(false)
const userMenuRef = ref(null)
const searchMenuRef = ref(null)

const syncAuthState = async () => {
    loggedIn.value = await isAuthenticated()
}

const toggleSearch = () => {
	isSearchOpen.value = !isSearchOpen.value
}

const toggleUserMenu = () => {
	isUserMenuOpen.value = !isUserMenuOpen.value
}

const handleDocumentClick = (event) => {
    if (!searchMenuRef.value?.contains(event.target)) {
        isSearchOpen.value = false
    }

	if (!userMenuRef.value?.contains(event.target)) {
		isUserMenuOpen.value = false
	}
}

const handleAuthAction = async () => {
	if (!loggedIn.value || isLoggingOut.value) {
		return
	}

	isLoggingOut.value = true

	try {
		await authServices.logout()
		setAuthenticated(false)
		window.location.reload()
	} catch (error) {
		console.error('Failed to log out.', error)
	} finally {
		isLoggingOut.value = false
		isUserMenuOpen.value = false
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
    <nav class="navbar navbar-expand-sm navbar-dark bg-dark shop-navbar">
        <div class="container-fluid navbar-shell">
            <a class="navbar-brand" href="/">
                <font-awesome-icon icon="house" />
            </a>
            <div class="navbar-controls">
                <div class="navbar-actions d-flex align-items-center gap-2">
                    <div class="search-menu" ref="searchMenuRef">
                        <button
                            class="navbar-icon-button"
                            type="button"
                            aria-label="開啟搜尋"
                            @click="toggleSearch"
                        >
                            <font-awesome-icon icon="search" />
                        </button>
                        <div v-if="isSearchOpen" class="search-menu__panel">
                            <form class="navbar-search-form d-flex" @submit.prevent>
                                <input class="form-control me-2" type="text" placeholder="搜尋產品名稱">
                                <button class="btn btn-primary" type="button">
                                    搜尋
                                </button>
                            </form>
                        </div>
                    </div>
                    <div class="user-menu" ref="userMenuRef">
                        <button
                            class="navbar-icon-button"
                            type="button"
                            aria-label="會員選單"
                            @click="toggleUserMenu"
                        >
                            <font-awesome-icon icon="user" />
                        </button>
                        <div v-if="isUserMenuOpen" class="user-menu__panel">
                            <a
                                v-if="!loggedIn"
                                class="user-menu__link"
                                href="/login"
                                @click="isUserMenuOpen = false"
                            >
                                會員登入
                            </a>
                            <button
                                v-else
                                class="user-menu__link user-menu__button"
                                type="button"
                                :disabled="isLoggingOut"
                                @click="handleAuthAction"
                            >
                                {{ isLoggingOut ? '處理中...' : '會員登出' }}
                            </button>
                        </div>
                    </div>
                </div>
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mynavbar">
                    <span class="navbar-toggler-icon"></span>
                </button>
            </div>
            <div class="collapse navbar-collapse navbar-menu" id="mynavbar">
                <ul class="navbar-nav me-auto">
                    <li class="nav-item">
                        <a class="nav-link" href="/products">所有產品</a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>
</template>

<style scoped>
.shop-navbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1030;
}

.navbar-shell {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    row-gap: 0.75rem;
}

.navbar-controls {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-left: auto;
}

.navbar-menu {
    width: 100%;
}

.navbar-actions {
	position: relative;
    justify-content: flex-end;
}

.search-menu {
    position: relative;
}

.search-menu__panel {
    position: absolute;
    top: calc(100% + 0.5rem);
    right: 0;
    display: flex;
    justify-content: flex-end;
    padding: 0.75rem;
    border-radius: 0.5rem;
    background-color: #fff;
    box-shadow: 0 0.5rem 1.25rem rgba(0, 0, 0, 0.2);
    z-index: 1000;
}

.navbar-search-form {
    width: min(22rem, calc(100vw - 3rem));
}

.navbar-icon-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.25rem;
    border: 0;
    background: transparent;
    color: rgba(255, 255, 255, 0.85);
    font-size: 1.125rem;
    line-height: 1;
}

.navbar-icon-button:hover,
.navbar-icon-button:focus-visible {
    color: #fff;
    outline: 0;
}

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

@media (min-width: 576px) {
    .navbar-shell {
        flex-wrap: nowrap;
    }

    .navbar-menu {
        order: 2;
        width: auto;
        flex: 1 1 auto;
        margin-left: 1rem;
    }

    .navbar-controls {
        order: 3;
        flex-shrink: 0;
    }
}

@media (max-width: 575.98px) {
    .navbar-controls {
        position: relative;
    }

    .navbar-actions {
        position: static;
    }

    .search-menu {
        position: static;
    }

    .navbar-menu {
        order: 3;
        margin-top: 0.25rem;
    }

    .search-menu__panel {
        display: flex;
        justify-content: flex-end;
        right: -0.75rem;
        width: 100vw;
        box-sizing: border-box;
    }

    .navbar-search-form {
        width: 100%;
        margin-left: auto;
    }
}
</style>
