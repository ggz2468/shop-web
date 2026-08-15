<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { productServices } from '@/services/productService'
import NotFound from '@/views/NotFound.vue'
import CenteredState from '@/components/layout/CenteredState.vue'
import { getProductVariants, formatVariantName } from '@/utils/productVariant'

const route = useRoute()
const product = ref({})
const productLoaded = ref(false)
const productNotFound = ref(false)
const currencyFormatter = new Intl.NumberFormat('zh-TW')

const productVariants = computed(() => getProductVariants(product.value))
const showProductNotFound = () => {
    productNotFound.value = true
    document.title = `${import.meta.env.VITE_APP_TITLE} - 404 Not Found`
}

const requestedVariantId = computed(() => {
    const variantId = Number(route.query.variant_id)

    return Number.isFinite(variantId) && variantId > 0 ? variantId : null
})
const variantNotFound = computed(() => {
    if (!productLoaded.value || requestedVariantId.value === null) {
        return false
    }

    return !productVariants.value.some((variant) => variant.id === requestedVariantId.value)
})
const selectedVariant = computed(() => {
    if (variantNotFound.value) {
        return null
    }

    if (requestedVariantId.value === null) {
        return productVariants.value[0] ?? null
    }

    return productVariants.value.find((variant) => variant.id === requestedVariantId.value) ?? null
})

const selectedVariantSpec = computed(() => {
    if (!selectedVariant.value) {
        return '尚無規格'
    }

    return formatVariantName(selectedVariant.value)
})

const selectedVariantPrice = computed(() => {
    if (!selectedVariant.value) {
        return '價格未定'
    }

    return `NT$ ${currencyFormatter.format(Number(selectedVariant.value.price) || 0)}`
})

const selectedVariantStockQuantity = computed(() => {
    if (!selectedVariant.value) {
        return '暫無庫存'
    }

    const stockQuantity = Number(selectedVariant.value.stock_quantity) || 0

    return stockQuantity > 0 ? `庫存 ${stockQuantity} 件` : '暫無庫存'
})

onMounted(async () => {
    const id = route.params.id
    try {
        const response = await productServices.getProductDetail(id)

        if (!response.data?.data) {
            showProductNotFound()
            return
        }

        product.value = response.data.data
    } catch (error) {
        if (error.response?.status === 404) {
            showProductNotFound()
            return
        }

        throw error
    }

    productLoaded.value = true
})
</script>

<template>
    <NotFound v-if="productNotFound" />

    <CenteredState
        v-else-if="variantNotFound"
        title="找不到此規格"
        message="此產品規格不存在或已下架。"
        action-text="查看產品詳情"
        :action-to="{ name: 'ProductDetail', params: { id: route.params.id } }"
        tone="warning"
    />

    <div v-else class="container-fluid p-3">
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
                        <span class="d-block">{{ selectedVariantSpec }}</span>
                        <span class="d-block">{{ selectedVariantPrice }}</span>
                        <span class="d-block">{{ selectedVariantStockQuantity }}</span>
                    </p>
                    <button class="btn btn-primary">加入購物車</button>
                </div>
            </div>
        </div>
    </div>
</template>
