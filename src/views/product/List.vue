<script setup>
import { ref, onMounted } from 'vue'
import request from '@/utils/request'

const products = ref([])

onMounted(async () => {
    const response = await request.get('/products')
    products.value = response.data
})
</script>

<template>
    <h1>產品列表</h1>
    <table>
        <thead>
            <tr>
                <th>名稱</th>
                <th>價格</th>
                <th>描述</th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="product in products" :key="product.id">
                <td>{{ product.name }}</td>
                <td>{{ product.price }}</td>
                <td>{{ product.description }}</td>
            </tr>
        </tbody>
    </table>
</template>
