<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { verificationServices } from '@/services/verificationService'

const route = useRoute()
const router = useRouter()

const message = ref('電子郵件驗證中，請稍候...')
const isLoading = ref(true)
let redirectTimer = null

const startRedirectCountdown = () => {
	redirectTimer = setTimeout(() => {
		router.push('/')
	}, 10000)
}

const goHomeNow = () => {
	if (redirectTimer) {
		clearTimeout(redirectTimer)
	}
	router.push('/')
}

const verifyEmail = async () => {
	const queryToken = route.query.token
	const token = Array.isArray(queryToken) ? queryToken[0] : queryToken

	if (!token || typeof token !== 'string') {
		message.value = '驗證連結無效，10 秒後將自動返回首頁。'
		isLoading.value = false
		startRedirectCountdown()
		return
	}

	try {
		const { data } = await verificationServices.verifyEmail({ token })
		message.value = data?.message || '電子郵件驗證已完成，10 秒後將自動返回首頁。'
	} catch (error) {
		message.value = error?.response?.data?.message || '電子郵件驗證失敗，10 秒後將自動返回首頁。'
	} finally {
		isLoading.value = false
		startRedirectCountdown()
	}
}

onMounted(() => {
	verifyEmail()
})

onBeforeUnmount(() => {
	if (redirectTimer) {
		clearTimeout(redirectTimer)
	}
})
</script>

<template>
	<section class="email-verify-page">
		<div class="email-verify-card">
			<h1 class="email-verify-title">電子郵件驗證</h1>
			<p class="email-verify-message">{{ message }}</p>
			<p v-if="isLoading" class="email-verify-note">系統正在處理您的驗證資料...</p>
			<p v-else class="email-verify-note">系統將於 10 秒後自動跳轉至首頁。</p>
			<button type="button" class="email-verify-button" @click="goHomeNow">
				立即返回首頁
			</button>
		</div>
	</section>
</template>

<style scoped>
.email-verify-page {
	min-height: 70vh;
	display: grid;
	place-items: center;
	padding: 24px;
}

.email-verify-card {
	width: 100%;
	max-width: 560px;
	padding: 32px;
	border: 1px solid #e5e7eb;
	border-radius: 12px;
	background-color: #fff;
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
	text-align: center;
}

.email-verify-title {
	margin: 0 0 12px;
	font-size: 28px;
	font-weight: 700;
	color: #111827;
}

.email-verify-message {
	margin: 0 0 12px;
	font-size: 17px;
	color: #1f2937;
	line-height: 1.6;
}

.email-verify-note {
	margin: 0;
	font-size: 14px;
	color: #6b7280;
}

.email-verify-button {
	margin-top: 20px;
	border: 0;
	border-radius: 8px;
	padding: 10px 16px;
	background-color: #111827;
	color: #fff;
	font-size: 14px;
	font-weight: 600;
	cursor: pointer;
}

.email-verify-button:hover {
	background-color: #1f2937;
}
</style>
