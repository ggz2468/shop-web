<script setup>
import { ref, onMounted } from 'vue'
import request from '@/utils/request'
import { useRoute } from 'vue-router'
import {
    getImageUrl
} from '@/assets/js/common'

const route = useRoute()
const product = ref({})

onMounted(async () => {
    const { id } = route.params
    const response = await request.get(`/products/${id}`)
    product.value = response.data
})
</script>

<template>
    <div class="container-fluid p-3">
        <div class="content-header">
            <h2 class="title">產品詳情</h2>
            <hr class="divider">
        </div>

        <div class="content-body">
            <div class="card">
                <img class="card-img-top" :src="getImageUrl(product.image_path)" :alt="product.name">
                <div class="card-body">
                    <h4 class="card-title">{{ product.name }}</h4>
                    <p class="card-text">
                        <p>{{ product.description }}</p>
                        {{ `特價 NT$ ${product.price} 元` }}
                    </p>
                    <button class="btn btn-primary">加入購物車</button>
                </div>
            </div>
        </div>
    </div>
</template>
