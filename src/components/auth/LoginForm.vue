<template>
	<div class="card login-card border-0">
		<div class="card-body p-4 p-md-5">
			<form class="login-form" @submit.prevent="handleSubmit" novalidate>
				<h1 class="login-form__title">會員登入</h1>

				<div class="mb-3 form-field-row">
					<label for="login-email" class="form-label form-field-label">電子郵件</label>
					<div class="form-field-control">
						<input
							id="login-email"
							v-model.trim="form.email"
							type="email"
							name="email"
							class="form-control"
							:class="{ 'is-invalid': errors.email }"
							placeholder="請輸入電子郵件"
							autocomplete="email"
						>
						<div v-if="errors.email" class="invalid-feedback d-block">{{ errors.email }}</div>
					</div>
				</div>

				<div class="mb-3 form-field-row">
					<label for="login-password" class="form-label form-field-label">密碼</label>
					<div class="form-field-control">
						<input
							id="login-password"
							v-model="form.password"
							type="password"
							name="password"
							class="form-control"
							:class="{ 'is-invalid': errors.password }"
							placeholder="請輸入密碼"
							autocomplete="current-password"
						>
						<div v-if="errors.password" class="invalid-feedback d-block">{{ errors.password }}</div>
					</div>
				</div>

				<div v-if="submitError" class="alert alert-danger" role="alert">
					{{ submitError }}
				</div>

				<button type="submit" class="btn btn-primary" :disabled="isSubmitting">
					{{ isSubmitting ? '登入中...' : '登入' }}
				</button>

				<div class="login-form__links">
					<div class="login-form__links-row">
						<RouterLink :to="{ name: 'Register' }" class="login-form__link">會員註冊</RouterLink>
						<span class="login-form__separator" aria-hidden="true">|</span>
						<RouterLink :to="{ name: 'ForgotPassword' }" class="login-form__link">忘記密碼</RouterLink>
					</div>
					<RouterLink :to="{ name: 'SendEmailVerificationLink' }" class="login-form__link">補發電子郵件驗證信</RouterLink>
				</div>
			</form>
		</div>
	</div>

	<div v-if="showSuccessOverlay" class="auth-success-overlay" role="status" aria-live="polite">
		<p class="auth-success-overlay__message">登入成功!</p>
	</div>

</template>

<script setup>
import { reactive, ref } from 'vue'
import { authServices } from '@/services/authService'
import { setAuthenticated } from '@/composables/useAuth'
import { redirectAfterLogin } from '@/router'

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
const showSuccessOverlay = ref(false)

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

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
		await authServices.login({
			email: form.email,
			password: form.password
		})

		setAuthenticated(true)
		showSuccessOverlay.value = true
		await delay(3000)
		await redirectAfterLogin()
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
	box-shadow: 0 1rem 2.25rem rgba(15, 23, 42, 0.18);
}

.login-form {
	width: 100%;
}

.form-field-row {
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;
}

.form-field-label {
	width: 5.5rem;
	margin-top: 0.5rem;
	margin-bottom: 0;
	white-space: nowrap;
}

.form-field-control {
	flex: 1;
	min-width: 0;
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

.login-form__links {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.35rem;
	margin-top: 0.875rem;
	font-size: 0.95rem;
}

.login-form__links-row {
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 0.5rem;
}

.login-form__link {
	color: #0d6efd;
	text-decoration: none;
}

.login-form__link:hover {
	text-decoration: underline;
}

.login-form__separator {
	color: #6c757d;
}

.auth-success-overlay {
	position: fixed;
	inset: 0;
	background-color: rgba(0, 0, 0, 0.3);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 2000;
}

.auth-success-overlay__message {
	margin: 0;
	padding: 1rem 1.75rem;
	border-radius: 0.75rem;
	background-color: rgba(0, 0, 0, 0.3);
	font-size: 1.5rem;
	font-weight: 700;
	color: #fff;
}

@media (max-width: 576px) {
	.form-field-row {
		flex-direction: column;
		gap: 0.35rem;
	}

	.form-field-label {
		width: auto;
		margin-top: 0;
	}
}
</style>
