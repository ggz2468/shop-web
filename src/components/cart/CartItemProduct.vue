<script setup>
defineProps({
    name: {
        type: String,
        default: '',
    },
    imagePath: {
        type: String,
        default: '',
    },
})
</script>

<template>
    <div class="cart-item-product">
        <img class="cart-item-product__image" :src="imagePath" :alt="name">
        <span class="cart-item-product__name">{{ name }}</span>
    </div>
</template>

<style scoped>
.cart-item-product {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    text-align: left;
}

.cart-item-product__image {
    width: 3.5rem;
    height: 3.5rem;
    object-fit: cover;
    border-radius: 0.375rem;
}

.cart-item-product__name {
    font-weight: 600;
}
</style>
