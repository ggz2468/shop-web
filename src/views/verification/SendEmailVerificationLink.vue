<template>
	<section class="send-email-verification-page">
		<div class="send-email-verification-card">
			<h1 class="send-email-verification-title">補發電子郵件驗證信</h1>
			<p class="send-email-verification-description">請輸入註冊時使用的電子郵件，系統將寄送新的驗證連結。</p>

			<form class="send-email-verification-form" @submit.prevent="handleSubmit" novalidate>
				<div class="mb-3 form-field-row">
					<label for="verification-email" class="form-label form-field-label">電子郵件</label>
					<div class="form-field-control">
						<input
							id="verification-email"
							v-model.trim="email"
							type="email"
							name="email"
							class="form-control"
							:class="{ 'is-invalid': emailError }"
							placeholder="請輸入電子郵件"
							autocomplete="email"
						>
						<div v-if="emailError" class="invalid-feedback d-block">{{ emailError }}</div>
					</div>
				</div>

				<div v-if="submitError" class="alert alert-danger" role="alert">
					{{ submitError }}
				</div>

				<div v-if="submitSuccess" class="alert alert-success" role="status">
					{{ submitSuccess }}
				</div>

				<button type="submit" class="btn btn-primary" :disabled="isSubmitting">
					{{ isSubmitting ? '發送中...' : '發送驗證連結' }}
				</button>

				<div class="login-link-wrapper">
					<RouterLink :to="{ name: 'Login' }" class="login-link">會員登入</RouterLink>
				</div>
			</form>
		</div>
	</section>
</template>

<script setup>
import { ref } from 'vue'
import { verificationServices } from '@/services/verificationService'

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
		const { data } = await verificationServices.sendEmailVerificationLink({
			email: email.value
		})
		submitSuccess.value = data?.message || '驗證連結已送出，請前往信箱確認。'
	} catch (error) {
		submitError.value = error?.response?.data?.message || '發送失敗，請稍後再試。'
	} finally {
		isSubmitting.value = false
	}
}
</script>

<style scoped>
.send-email-verification-page {
	min-height: 70vh;
	display: grid;
	place-items: center;
	padding: 24px;
}

.send-email-verification-card {
	width: 100%;
	max-width: 560px;
	padding: 32px;
	border: 1px solid #e5e7eb;
	border-radius: 12px;
	background-color: #fff;
	box-shadow: 0 1rem 2.25rem rgba(15, 23, 42, 0.18);
}

.send-email-verification-title {
	margin: 0 0 12px;
	font-size: 28px;
	font-weight: 700;
	color: #111827;
	text-align: center;
}

.send-email-verification-description {
	margin: 0 0 20px;
	font-size: 15px;
	line-height: 1.6;
	color: #4b5563;
	text-align: center;
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

.btn-primary {
	width: 100%;
}

.login-link-wrapper {
	margin-top: 12px;
	text-align: center;
	font-size: 0.95rem;
}

.login-link {
	color: #0d6efd;
	font-weight: 500;
	text-decoration: none;
}

.login-link:hover {
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
