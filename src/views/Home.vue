<script setup>
import ProductListTemplate from '@/components/product/ProductListTemplate.vue'

const HOME_ITEMS_PER_PAGE = 10
const HOME_DISPLAY_ITEMS_PER_PAGE = 6
const apiUrl = '/products?row_counts_per_page=10&page=1'
</script>

<template>
    <ProductListTemplate
        :api-url="apiUrl"
        :items-per-page="HOME_DISPLAY_ITEMS_PER_PAGE"
        :request-items-per-page="HOME_ITEMS_PER_PAGE"
        :mobile-pages="1"
        :use-client-pagination="true"
        :max-display-items="10"
    />
</template>
