<template>
	<section class="login-view container py-5">
		<LoginForm />
	</section>
</template>

<script setup>
import LoginForm from '@/components/auth/LoginForm.vue'
</script>

<style scoped>
.login-view {
	min-height: calc(100vh - 56px);
	display: flex;
	align-items: center;
	justify-content: center;
}
</style>
