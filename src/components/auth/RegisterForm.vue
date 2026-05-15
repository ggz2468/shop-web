<template>
	<div class="card register-card border-0">
		<div class="card-body p-4 p-md-5">
			<form class="register-form" @submit.prevent="handleSubmit" novalidate>
				<h1 class="register-form__title">會員註冊</h1>

				<div class="mb-3 form-field-row">
					<label for="register-id-number" class="form-label form-field-label">身分證字號</label>
					<div class="form-field-control">
						<input
							id="register-id-number"
							v-model.trim="form.idNumber"
							type="text"
							name="idNumber"
							class="form-control"
							:class="{ 'is-invalid': errors.idNumber }"
							placeholder="請輸入身分證字號"
							autocomplete="off"
						>
						<div v-if="errors.idNumber" class="invalid-feedback d-block">{{ errors.idNumber }}</div>
					</div>
				</div>

				<div class="mb-3 form-field-row">
					<label for="register-email" class="form-label form-field-label">電子郵件</label>
					<div class="form-field-control">
						<input
							id="register-email"
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
					<label for="register-phone" class="form-label form-field-label">手機號碼</label>
					<div class="form-field-control">
						<input
							id="register-phone"
							v-model.trim="form.phone"
							type="tel"
							name="phone"
							class="form-control"
							:class="{ 'is-invalid': errors.phone }"
							placeholder="請輸入手機號碼"
							autocomplete="tel"
						>
						<div v-if="errors.phone" class="invalid-feedback d-block">{{ errors.phone }}</div>
					</div>
				</div>

				<div class="mb-3 form-field-row">
					<label for="register-password" class="form-label form-field-label">密碼</label>
					<div class="form-field-control">
						<input
							id="register-password"
							v-model="form.password"
							type="password"
							name="password"
							class="form-control"
							:class="{ 'is-invalid': errors.password }"
							placeholder="請輸入密碼"
							autocomplete="new-password"
						>
						<div v-if="errors.password" class="invalid-feedback d-block">{{ errors.password }}</div>
					</div>
				</div>

				<div v-if="submitError" class="alert alert-danger" role="alert">
					{{ submitError }}
				</div>

				<button type="submit" class="btn btn-primary" :disabled="isSubmitting">
					{{ isSubmitting ? '註冊中...' : '註冊' }}
				</button>

				<div class="register-form__links">
					<RouterLink :to="{ name: 'Login' }" class="register-form__link">會員登入</RouterLink>
				</div>
			</form>
		</div>
	</div>

	<div v-if="showSuccessOverlay" class="auth-success-overlay" role="status" aria-live="polite">
		<p class="auth-success-overlay__message">註冊成功!</p>
	</div>

</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { authServices } from '@/services/authService'

const router = useRouter()

const form = reactive({
	idNumber: '',
	email: '',
	phone: '',
	password: ''
})

const errors = reactive({
	idNumber: '',
	email: '',
	phone: '',
	password: ''
})

const isSubmitting = ref(false)
const submitError = ref('')
const showSuccessOverlay = ref(false)

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const validateForm = () => {
	errors.idNumber = ''
	errors.email = ''
	errors.phone = ''
	errors.password = ''

	let isValid = true

	if (!form.idNumber) {
		errors.idNumber = '請輸入身分證字號'
		isValid = false
	} else if (!/^[A-Za-z][12]\d{8}$/.test(form.idNumber)) {
		errors.idNumber = '身分證字號格式不正確'
		isValid = false
	}

	if (!form.email) {
		errors.email = '請輸入電子郵件'
		isValid = false
	} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
		errors.email = '電子郵件格式不正確'
		isValid = false
	}

	if (!form.phone) {
		errors.phone = '請輸入手機號碼'
		isValid = false
	} else if (!/^09\d{8}$/.test(form.phone)) {
		errors.phone = '手機號碼格式不正確'
		isValid = false
	}

	if (!form.password) {
		errors.password = '請輸入密碼'
		isValid = false
	} else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,255}$/.test(form.password)) {
		errors.password = '密碼需含大小寫英文字母與數字，長度 8 至 255 字元'
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
		await authServices.register({
			national_id_number: form.idNumber.toUpperCase(),
			email: form.email,
			phone: form.phone,
			password: form.password
		})

		showSuccessOverlay.value = true
		await delay(3000)
		router.push({ name: 'Login' })
	} catch (error) {
		submitError.value = error.response?.data?.message || '註冊失敗，請稍後再試。'
	} finally {
		isSubmitting.value = false
	}
}
</script>

<style scoped>
.register-card {
	width: min(100%, 480px);
	border-radius: 1rem;
	box-shadow: 0 1rem 2.25rem rgba(15, 23, 42, 0.18);
}

.register-form {
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

.register-form__title {
	margin-bottom: 1.5rem;
	text-align: center;
	font-family: 'PMingLiU', 'MingLiU', serif;
	font-size: 1.5rem;
	font-weight: 700;
}

.btn-primary {
	width: 100%;
}

.register-form__links {
	display: flex;
	justify-content: center;
	margin-top: 0.875rem;
	font-size: 0.95rem;
}

.register-form__link {
	color: #0d6efd;
	text-decoration: none;
}

.register-form__link:hover {
	text-decoration: underline;
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
