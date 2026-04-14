<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import request from '@/utils/request'

const products = ref([])
const baseUrl = import.meta.env.VITE_BASE_URL || ''
const currentPage = ref(1)
const isMobile = ref(false)

const DESKTOP_ITEMS_PER_PAGE = 6
const MOBILE_BREAKPOINT = 576

const getImageUrl = (imagePath) => `${baseUrl}${imagePath}`

const updateViewportState = () => {
    isMobile.value = window.innerWidth <= MOBILE_BREAKPOINT
}

const totalPages = computed(() => {
    if (isMobile.value || products.value.length === 0) {
        return 1
    }

    return Math.ceil(products.value.length / DESKTOP_ITEMS_PER_PAGE)
})

const pagedProducts = computed(() => {
    if (isMobile.value) {
        return products.value
    }

    const start = (currentPage.value - 1) * DESKTOP_ITEMS_PER_PAGE
    return products.value.slice(start, start + DESKTOP_ITEMS_PER_PAGE)
})

const productRows = computed(() => {
    const rowCount = Math.ceil(pagedProducts.value.length / 3)

    return Array.from({ length: rowCount }, (_, rowIndex) => {
        const start = rowIndex * 3
        return pagedProducts.value.slice(start, start + 3)
    })
})

const goFirstPage = () => {
    currentPage.value = 1
}

const goPrevPage = () => {
    currentPage.value = Math.max(1, currentPage.value - 1)
}

const goNextPage = () => {
    currentPage.value = Math.min(totalPages.value, currentPage.value + 1)
}

const goLastPage = () => {
    currentPage.value = totalPages.value
}

const goToPage = (page) => {
    currentPage.value = page
}

const paginationItems = computed(() => {
    const total = totalPages.value
    const current = currentPage.value

    if (total <= 10) {
        return Array.from({ length: total }, (_, index) => ({
            type: 'page',
            value: index + 1,
        }))
    }

    if (current <= 6) {
        const startPages = Array.from({ length: 9 }, (_, index) => ({
            type: 'page',
            value: index + 1,
        }))

        return [...startPages, { type: 'ellipsis' }, { type: 'page', value: total }]
    }

    if (current >= total - 5) {
        const endPages = Array.from({ length: 9 }, (_, index) => ({
            type: 'page',
            value: total - 8 + index,
        }))

        return [{ type: 'page', value: 1 }, { type: 'ellipsis' }, ...endPages]
    }

    const middlePages = Array.from({ length: 7 }, (_, index) => ({
        type: 'page',
        value: current - 3 + index,
    }))

    return [
        { type: 'page', value: 1 },
        { type: 'ellipsis' },
        ...middlePages,
        { type: 'ellipsis' },
        { type: 'page', value: total },
    ]
})

onMounted(async () => {
    updateViewportState()
    window.addEventListener('resize', updateViewportState)

    const response = await request.get('/products')
    products.value = response.data
})

onUnmounted(() => {
    window.removeEventListener('resize', updateViewportState)
})
</script>

<template>
    <div class="container-fluid p-3">
        <div class="content-header">
            <h2 class="title">熱門產品</h2>
            <hr class="divider">
        </div>

        <div class="content-body">
            <div
                v-for="(row, rowIndex) in productRows"
                :key="`row-${rowIndex}`"
                class="row"
            >
                <div
                    v-for="product in row"
                    :key="product.id"
                    :class="`col-sm-${12 / row.length}`"
                >
                    <div class="card">
                        <img class="card-img-top" :src="getImageUrl(product.image_path)" :alt="product.name">
                        <div class="card-body">
                            <h4 class="card-title">{{ product.name }}</h4>
                            <p class="card-text">{{ `特價 NT$ ${product.price} 元` }}</p>
                            <a :href="`/products/${product.id}`" class="btn btn-primary">詳細資訊</a>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="!isMobile && totalPages > 1" class="pagination-wrapper">
                <button class="btn btn-outline-secondary" @click="goFirstPage" :disabled="currentPage === 1">
                    最前頁
                </button>
                <button class="btn btn-outline-secondary" @click="goPrevPage" :disabled="currentPage === 1">
                    上一頁
                </button>
                <template v-for="(item, index) in paginationItems" :key="`page-item-${index}-${item.type}-${item.value ?? 'ellipsis'}`">
                    <button
                        v-if="item.type === 'page'"
                        class="btn page-number-btn"
                        :class="item.value === currentPage ? 'btn-primary' : 'btn-outline-secondary'"
                        @click="goToPage(item.value)"
                    >
                        {{ item.value }}
                    </button>
                    <span v-else class="page-ellipsis">...</span>
                </template>
                <span class="page-status">第 {{ currentPage }} / {{ totalPages }} 頁</span>
                <button class="btn btn-outline-secondary" @click="goNextPage" :disabled="currentPage === totalPages">
                    下一頁
                </button>
                <button class="btn btn-outline-secondary" @click="goLastPage" :disabled="currentPage === totalPages">
                    最末頁
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.title {
    font-family: 新細明體, Ming-LiU, serif;
    font-size: 36px;
    font-weight: bold;
    margin: 1rem 0 0 0;
}

.divider {
    width: 100%;
    border: none;
    border-top: 2px solid #000;
    margin: 0.5rem 0 1rem 0;
}

.container > .row {
    width: 100%;
}

.card {
    width: min(100%, 400px);
    margin: 1rem auto;
    text-align: center;
}

.pagination-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.75rem;
    margin-top: 1.5rem;
    flex-wrap: wrap;
}

.page-status {
    font-size: 1rem;
    font-weight: 600;
}

.page-number-btn {
    min-width: 2.5rem;
}

.page-ellipsis {
    min-width: 2rem;
    text-align: center;
    font-weight: 600;
}

@media (max-width: 576px) {
    .content-header {
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .title {
        font-size: 24px;
    }
}
</style>
