<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import ProductListTemplate from '@/components/product/ProductListTemplate.vue'
import { buildProductsApiUrl } from '@/assets/js/common'

const route = useRoute()

const apiUrl = computed(() => buildProductsApiUrl({ query: route.query }))
</script>

<template>
    <ProductListTemplate :api-url="apiUrl" />
</template>
