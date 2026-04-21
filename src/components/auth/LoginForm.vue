<template>
	<div class="card login-card shadow-sm border-0">
		<div class="card-body p-4 p-md-5">
			<form class="login-form" @submit.prevent="handleSubmit" novalidate>
				<h1 class="login-form__title">會員登入</h1>

				<div class="mb-3">
					<input
						v-model.trim="form.email"
						type="email"
						name="email"
						class="form-control"
						placeholder="請輸入電子郵件"
						autocomplete="email"
					>
					<div v-if="errors.email" class="text-danger mt-1">{{ errors.email }}</div>
				</div>

				<div class="mb-3">
					<input
						v-model="form.password"
						type="password"
						name="password"
						class="form-control"
						placeholder="請輸入密碼"
						autocomplete="current-password"
					>
					<div v-if="errors.password" class="text-danger mt-1">{{ errors.password }}</div>
				</div>

				<div v-if="submitError" class="alert alert-danger" role="alert">
					{{ submitError }}
				</div>

				<button type="submit" class="btn btn-primary" :disabled="isSubmitting">
					{{ isSubmitting ? '登入中...' : '登入' }}
				</button>
			</form>
		</div>
	</div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import request from '@/utils/request'
import { setAuthenticated } from '@/utils/auth'

const router = useRouter()

const form = reactive({
	email: '',
	password: ''
})

const errors = reactive({
	email: '',
	password: ''
})

const isSubmitting = ref(false)
const submitError = ref('')

const validateForm = () => {
	errors.email = ''
	errors.password = ''

	let isValid = true

	if (!form.email) {
		errors.email = '請輸入電子郵件'
		isValid = false
	} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
		errors.email = '電子郵件格式不正確'
		isValid = false
	}

	if (!form.password) {
		errors.password = '請輸入密碼'
		isValid = false
	}

	return isValid
}

const handleSubmit = async () => {
	submitError.value = ''

	if (!validateForm()) {
		return
	}

	isSubmitting.value = true

	try {
		await request.post('/login', {
			email: form.email,
			password: form.password
		})

		setAuthenticated(true)

		if (window.history.length > 1) {
			router.back()
			return
		}

		router.push({ name: 'Home' })
	} catch (error) {
		submitError.value = error.response?.data?.message || '登入失敗，請稍後再試。'
	} finally {
		isSubmitting.value = false
	}
}
</script>

<style scoped>
.login-card {
	width: min(100%, 420px);
	border-radius: 1rem;
}

.login-form {
	width: 100%;
}

.login-form__title {
	margin-bottom: 1.5rem;
	text-align: center;
	font-family: 'PMingLiU', 'MingLiU', serif;
	font-size: 1.5rem;
	font-weight: 700;
}

.btn-primary {
	width: 100%;
}
</style>
