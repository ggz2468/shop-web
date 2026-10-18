<script setup>
defineProps({
    message: {
        type: String,
        required: true,
    },
})
</script>

<template>
    <div class="auth-success-overlay" role="status" aria-live="polite">
        <p class="auth-success-overlay__message">{{ message }}</p>
    </div>
</template>

<style scoped>
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
</style>
