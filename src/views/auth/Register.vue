<template>
	<section class="register-view container py-5">
		<RegisterForm />
	</section>
</template>

<script setup>
import RegisterForm from '@/components/auth/RegisterForm.vue'
</script>

<style scoped>
.register-view {
	min-height: calc(100vh - 56px);
	display: flex;
	align-items: center;
	justify-content: center;
}
</style>
