<template>
	<section class="reset-password-view container py-5">
		<div class="card reset-password-card">
			<div class="card-body p-4 p-md-5">
				<h1 class="h4 mb-3">重設密碼</h1>
				<p class="text-muted mb-4">請輸入電子郵件與新密碼以完成重設。</p>

				<form @submit.prevent="handleSubmit" novalidate>
					<div class="mb-3 form-field-row">
						<label for="email" class="form-label form-field-label">電子郵件</label>
						<div class="form-field-control">
							<input
								id="email"
								type="email"
								class="form-control"
								:class="{ 'is-invalid': fieldErrors.email }"
								placeholder="請輸入電子郵件"
								v-model.trim="form.email"
								autocomplete="email"
							/>
							<div v-if="fieldErrors.email" class="invalid-feedback d-block">
								{{ fieldErrors.email }}
							</div>
						</div>
					</div>

					<div class="mb-3 form-field-row">
						<label for="password" class="form-label form-field-label">密碼</label>
						<div class="form-field-control">
							<input
								id="password"
								type="password"
								class="form-control"
								:class="{ 'is-invalid': fieldErrors.password }"
								placeholder="請輸入新密碼"
								v-model="form.password"
								maxlength="255"
								autocomplete="new-password"
							/>
							<div v-if="fieldErrors.password" class="invalid-feedback d-block">
								{{ fieldErrors.password }}
							</div>
						</div>
					</div>

					<div class="mb-3 form-field-row">
						<label for="password_confirmation" class="form-label form-field-label">確認密碼</label>
						<div class="form-field-control">
							<input
								id="password_confirmation"
								type="password"
								class="form-control"
								:class="{ 'is-invalid': fieldErrors.password_confirmation }"
								placeholder="請再次輸入新密碼"
								v-model="form.password_confirmation"
								maxlength="255"
								autocomplete="new-password"
							/>
							<div v-if="fieldErrors.password_confirmation" class="invalid-feedback d-block">
								{{ fieldErrors.password_confirmation }}
							</div>
						</div>
					</div>

					<div v-if="submitError" class="alert alert-danger" role="alert">
						{{ submitError }}
					</div>

					<div v-if="submitSuccess" class="alert alert-success" role="status">
						{{ submitSuccess }}
					</div>

					<button type="submit" class="btn btn-primary w-100" :disabled="isSubmitting">
						{{ isSubmitting ? '送出中...' : '重設密碼' }}
					</button>
				</form>
			</div>
		</div>
	</section>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { authServices } from '@/services/authService'

const route = useRoute()
const LOGIN_ROUTE = '/auth/login'

const form = reactive({
	email: '',
	password: '',
	password_confirmation: '',
})

const fieldErrors = reactive({
	email: '',
	password: '',
	password_confirmation: '',
})

const isSubmitting = ref(false)
const submitError = ref('')
const submitSuccess = ref('')

const validateForm = () => {
	fieldErrors.email = ''
	fieldErrors.password = ''
	fieldErrors.password_confirmation = ''

	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
	const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/

	if (!form.email) {
		fieldErrors.email = '請輸入電子郵件'
	} else if (!emailRegex.test(form.email)) {
		fieldErrors.email = '電子郵件格式不正確'
	}

	if (!form.password) {
		fieldErrors.password = '請輸入新密碼'
	} else if (form.password.length > 255) {
		fieldErrors.password = '密碼長度不可超過 255 個字元'
	} else if (!passwordRegex.test(form.password)) {
		fieldErrors.password = '密碼至少 8 碼，且需包含一個大寫字母、一個小寫字母與一個數字'
	}

	if (!form.password_confirmation) {
		fieldErrors.password_confirmation = '請輸入確認密碼'
	} else if (form.password_confirmation !== form.password) {
		fieldErrors.password_confirmation = '確認密碼與密碼不一致'
	}

	return !fieldErrors.email && !fieldErrors.password && !fieldErrors.password_confirmation
}

const handleSubmit = async () => {
	submitError.value = ''
	submitSuccess.value = ''

	if (!validateForm()) {
		return
	}

	const data = {
		email: form.email,
		password: form.password,
		password_confirmation: form.password_confirmation,
		token: route.query.token || '',
	}

	isSubmitting.value = true

	try {
		const response = await authServices.resetPassword(data)
		submitSuccess.value = response?.data?.message || '密碼已重設成功。'
		window.location.href = LOGIN_ROUTE
	} catch (error) {
		submitError.value = error?.response?.data?.message || '重設密碼失敗，請稍後再試。'
	} finally {
		isSubmitting.value = false
	}
}
</script>

<style scoped>
.reset-password-view {
	min-height: calc(100vh - 56px);
	display: flex;
	align-items: center;
	justify-content: center;
}

.reset-password-card {
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
