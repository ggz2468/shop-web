<template>
	<section class="forgot-password-view container py-5">
		<div class="card forgot-password-card">
			<div class="card-body p-4 p-md-5">
				<h1 class="h4 mb-3">忘記密碼</h1>
				<p class="text-muted mb-4">請輸入您的電子郵件，我們會寄送重設密碼連結給您。</p>

				<form @submit.prevent="handleSubmit" novalidate>
					<div class="mb-3 form-field-row">
						<label for="email" class="form-label form-field-label">電子郵件</label>
						<div class="form-field-control">
							<input
								id="email"
								type="email"
								class="form-control"
								:class="{ 'is-invalid': emailError }"
								placeholder="請輸入電子郵件"
								v-model.trim="email"
								autocomplete="email"
							/>
							<div v-if="emailError" class="invalid-feedback d-block">{{ emailError }}</div>
						</div>
					</div>

					<div v-if="submitError" class="alert alert-danger" role="alert">
						{{ submitError }}
					</div>

					<div v-if="submitSuccess" class="alert alert-success" role="status">
						{{ submitSuccess }}
					</div>

					<button type="submit" class="btn btn-primary w-100" :disabled="isSubmitting">
						{{ isSubmitting ? '發送中...' : '發送重設密碼連結' }}
					</button>

					<div class="forgot-password-login-link-wrapper">
						<RouterLink :to="{ name: 'Login' }" class="forgot-password-login-link">會員登入</RouterLink>
					</div>
				</form>
			</div>
		</div>
	</section>
</template>

<script setup>
import { ref } from 'vue'
import { authServices } from '@/services/authService'

const email = ref('')
const emailError = ref('')
const submitError = ref('')
const submitSuccess = ref('')
const isSubmitting = ref(false)

const validateEmail = () => {
	emailError.value = ''

	if (!email.value) {
		emailError.value = '請輸入電子郵件'
		return false
	}

	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
		emailError.value = '電子郵件格式不正確'
		return false
	}

	return true
}

const handleSubmit = async () => {
	submitError.value = ''
	submitSuccess.value = ''

	if (!validateEmail()) {
		return
	}

	isSubmitting.value = true

	try {
		const { data } = await authServices.sendResetLink({ email: email.value })
		submitSuccess.value = data?.message || '重設密碼連結已送出，請前往信箱確認。'
	} catch (error) {
		submitError.value = error?.response?.data?.message || '發送失敗，請稍後再試。'
	} finally {
		isSubmitting.value = false
	}
}
</script>

<style scoped>
.forgot-password-view {
	min-height: calc(100vh - 56px);
	display: flex;
	align-items: center;
	justify-content: center;
}

.forgot-password-card {
	width: 100%;
	max-width: 480px;
	box-shadow: 0 1rem 2.25rem rgba(15, 23, 42, 0.18);
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

.forgot-password-login-link-wrapper {
	margin-top: 12px;
	text-align: center;
	font-size: 0.95rem;
}

.forgot-password-login-link {
	color: #0d6efd;
	text-decoration: none;
}

.forgot-password-login-link:hover {
	text-decoration: underline;
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
