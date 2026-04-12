<script setup>
import { ref, onMounted, computed } from 'vue'
import request from '@/utils/request'

const products = ref([])
const apiBaseUrl = import.meta.env.VITE_APP_API_URL || ''

const getImageUrl = (imagePath) => `${apiBaseUrl}${imagePath}`

const productRows = computed(() => {
    const rowCount = Math.ceil(products.value.length / 3)

    return Array.from({ length: rowCount }, (_, rowIndex) => {
        const start = rowIndex * 3
        return products.value.slice(start, start + 3)
    })
})

onMounted(async () => {
    const response = await request.get('/products')
    products.value = response.data
})
</script>

<template>
    <div class="container p-3 m-3 text-center">
        <div
            v-for="(row, rowIndex) in productRows"
            :key="`row-${rowIndex}`"
            class="row"
        >
            <div
                v-for="product in row"
                :key="product.id"
                :class="`col-${12 / row.length}`"
            >
                <div class="card" style="width:400px">
                    <img class="card-img-top" :src="getImageUrl(product.image_path)" :alt="product.description">
                    <div class="card-body">
                        <h4 class="card-title">{{ product.name }}</h4>
                        <p class="card-text">{{ product.description }}</p>
                        <a :href="`/products/${product.id}`" class="btn btn-primary">詳細資訊</a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.card {
    margin: 1rem auto;
}
</style>
