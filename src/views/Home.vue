<script setup>
import ProductListTemplate from '@/components/product/ProductListTemplate.vue'

const apiUrl = '/products?row_counts_per_page=10&page=1'
</script>

<template>
    <ProductListTemplate
        :api-url="apiUrl"
        :items-per-page="6"
        :request-items-per-page="10"
        :mobile-pages="1"
        :use-client-pagination="true"
        :max-display-items="10"
    />
</template>
