<script setup>
defineProps({
    code: {
        type: String,
        default: '',
    },
    title: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    actionText: {
        type: String,
        default: '',
    },
    actionTo: {
        type: Object,
        default: null,
    },
    tone: {
        type: String,
        default: 'primary',
    },
})
</script>

<template>
    <div class="centered-state-page">
        <div :class="['centered-state-content', `centered-state-content-${tone}`]">
            <p v-if="code" :class="['centered-state-code', `centered-state-code-${tone}`]">{{ code }}</p>
            <h2 :class="['centered-state-title', `centered-state-title-${tone}`]">{{ title }}</h2>
            <p class="centered-state-message">{{ message }}</p>
            <RouterLink v-if="actionTo && actionText" :to="actionTo" class="btn btn-primary">
                {{ actionText }}
            </RouterLink>
        </div>
    </div>
</template>

<style scoped>
.centered-state-page {
    min-height: 70vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    text-align: center;
}

.centered-state-content {
    width: min(100%, 520px);
    padding: 3rem 2rem;
    border-radius: 0.75rem;
}

.centered-state-content-primary {
    border: 1px solid rgba(13, 110, 253, 0.18);
    background: linear-gradient(180deg, #ffffff 0%, #f4f8ff 100%);
    box-shadow: 0 1rem 2.5rem rgba(13, 110, 253, 0.12);
}

.centered-state-content-warning {
    border: 1px solid rgba(255, 193, 7, 0.32);
    background: linear-gradient(180deg, #ffffff 0%, #fff8e6 100%);
    box-shadow: 0 1rem 2.5rem rgba(255, 193, 7, 0.16);
}

.centered-state-code {
    margin-bottom: 0.5rem;
    font-size: clamp(4rem, 12vw, 7rem);
    font-weight: 700;
    line-height: 1;
}

.centered-state-code-primary {
    color: #0d6efd;
}

.centered-state-code-warning {
    color: #7a4f01;
}

.centered-state-title {
    margin-bottom: 1rem;
    font-size: 2rem;
    font-weight: 700;
}

.centered-state-title-primary {
    color: #1f2937;
}

.centered-state-title-warning {
    color: #7a4f01;
}

.centered-state-message {
    margin-bottom: 1.5rem;
    color: #6c757d;
    font-size: 1.125rem;
}
</style>