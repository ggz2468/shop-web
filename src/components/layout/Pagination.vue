<script setup>
import { computed } from 'vue'

const props = defineProps({
    modelValue: {
        type: Number,
        required: true,
    },
    totalItems: {
        type: Number,
        required: true,
    },
    itemsPerPage: {
        type: Number,
        default: 6,
    },
})

const emit = defineEmits([
    'update:modelValue',
])

const currentPage = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value),
})
</script>

<template>
    <vue-awesome-paginate
        v-model="currentPage"
        :total-items="totalItems"
        :items-per-page="itemsPerPage"
        paginate-buttons-class="btn"
        active-page-class="btn-active"
        back-button-class="back-btn"
        next-button-class="next-btn"
    />
</template>
