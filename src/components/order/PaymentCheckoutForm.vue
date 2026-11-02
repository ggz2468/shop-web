<script setup>
import { computed } from 'vue'

const props = defineProps({
    checkout: { type: Object, required: true },
})

const inputs = computed(() => Object.entries(props.checkout.request_payload))
</script>

<template>
    <form :action="checkout.checkout_payload.action" :method="checkout.checkout_payload.method">
        <input v-for="[name, value] in inputs" :key="name" type="hidden" :name="name" :value="value">
        <slot />
    </form>
</template>
