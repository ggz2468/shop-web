<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { productServices } from '@/services/productService'

const route = useRoute()
const product = ref({})

onMounted(async () => {
    const id = route.params.id
    const response = await productServices.getProductDetail(id)
    product.value = response.data.data
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
                <img class="card-img-top" :src="product.image_path" :alt="product.name">
                <div class="card-body">
                    <h4 class="card-title">{{ product.name }}</h4>
                    <p class="card-text">
                        <span class="d-block">{{ product.description }}</span>
                        {{ `特價 NT$ ${product.price} 元` }}
                    </p>
                    <button class="btn btn-primary">加入購物車</button>
                </div>
            </div>
        </div>
    </div>
</template>
