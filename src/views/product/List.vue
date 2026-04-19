<script setup>
import ProductListTemplate from '@/components/product/ProductListTemplate.vue'
</script>

<template>
    <ProductListTemplate api-url="/products?row_counts_per_page=15&page=1" />
</template>
