<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import request from '@/utils/request'
import {
    getImageUrl,
    DESKTOP_ITEMS_PER_PAGE,
    MOBILE_BREAKPOINT,
    getTotalPages,
    getPagedItems,
    getPaginationItems,
    getFirstPage,
    getPrevPage,
    getNextPage,
    getLastPage,
    normalizePage,
} from '@/assets/js/common'

const props = defineProps({
    apiUrl: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        default: '熱門產品',
    },
})

const products = ref([])
const currentPage = ref(1)
const isMobile = ref(false)

const updateViewportState = () => {
    isMobile.value = window.innerWidth <= MOBILE_BREAKPOINT
}

const totalPages = computed(() => {
    return getTotalPages({
        isMobile: isMobile.value,
        totalItems: products.value.length,
        itemsPerPage: DESKTOP_ITEMS_PER_PAGE,
    })
})

const pagedProducts = computed(() => {
    return getPagedItems({
        isMobile: isMobile.value,
        items: products.value,
        currentPage: currentPage.value,
        itemsPerPage: DESKTOP_ITEMS_PER_PAGE,
    })
})

const productRows = computed(() => {
    const rowCount = Math.ceil(pagedProducts.value.length / 3)

    return Array.from({ length: rowCount }, (_, rowIndex) => {
        const start = rowIndex * 3
        return pagedProducts.value.slice(start, start + 3)
    })
})

const goFirstPage = () => {
    currentPage.value = getFirstPage()
}

const goPrevPage = () => {
    currentPage.value = getPrevPage(currentPage.value)
}

const goNextPage = () => {
    currentPage.value = getNextPage({
        currentPage: currentPage.value,
        totalPages: totalPages.value,
    })
}

const goLastPage = () => {
    currentPage.value = getLastPage(totalPages.value)
}

const goToPage = (page) => {
    currentPage.value = normalizePage({ page, totalPages: totalPages.value })
}

const paginationItems = computed(() => {
    return getPaginationItems({
        totalPages: totalPages.value,
        currentPage: currentPage.value,
    })
})

onMounted(async () => {
    updateViewportState()
    window.addEventListener('resize', updateViewportState)

    const response = await request.get(props.apiUrl)
    products.value = response.data
})

onUnmounted(() => {
    window.removeEventListener('resize', updateViewportState)
})
</script>

<template>
    <div class="container-fluid p-3">
        <div class="content-header">
            <h2 class="title">{{ title }}</h2>
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
</style>
