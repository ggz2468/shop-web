<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import request from '@/utils/request'
import {
    getImageUrl,
    DESKTOP_ITEMS_PER_PAGE,
    MOBILE_BREAKPOINT,
    getQueryPage,
    getPagedItems,
    resolveProductsData,
    resolvePaginationMeta,
    getPaginationItems,
    detectNextPagesWithData,
    buildApiUrlForViewport,
    buildApiUrlWithPage,
    getFirstPage,
    getPrevPage,
    getNextPage,
    getLastPage,
    normalizePage,
    shouldShowDesktopPagination,
    getPageLink,
} from '@/assets/js/common'

const props = defineProps({
    apiUrl: {
        type: String,
        required: true,
    },
    itemsPerPage: {
        type: Number,
        default: DESKTOP_ITEMS_PER_PAGE,
    },
    requestItemsPerPage: {
        type: Number,
        default: null,
    },
    mobilePages: {
        type: Number,
        default: 3,
    },
    useClientPagination: {
        type: Boolean,
        default: false,
    },
    cacheTtlMs: {
        type: Number,
        default: 60000,
    },
    cacheMaxEntries: {
        type: Number,
        default: 30,
    },
    maxDisplayItems: {
        type: Number,
        default: null,
    },
    title: {
        type: String,
        default: '熱門產品',
    },
})

const route = useRoute()
const products = ref([])
const isMobile = ref(false)
const totalItems = ref(0)
const totalPages = ref(1)
const nextPagesWithData = ref(0)
const fetchSequence = ref(0)
const pageCache = new Map()
const inFlightRequests = new Map()

const normalizedCacheTtlMs = computed(() => {
    return Number.isFinite(props.cacheTtlMs) && props.cacheTtlMs > 0
        ? props.cacheTtlMs
        : 60000
})

const normalizedCacheMaxEntries = computed(() => {
    return Number.isFinite(props.cacheMaxEntries) && props.cacheMaxEntries > 0
        ? props.cacheMaxEntries
        : 30
})

const isExpiredCacheEntry = (entry) => {
    if (!entry || !Number.isFinite(entry.cachedAt)) {
        return true
    }

    return Date.now() - entry.cachedAt > normalizedCacheTtlMs.value
}

const cacheResponse = (url, response) => {
    pageCache.set(url, {
        response,
        cachedAt: Date.now(),
    })

    // Keep cache bounded to avoid unbounded memory growth.
    if (pageCache.size > normalizedCacheMaxEntries.value) {
        const oldestKey = pageCache.keys().next().value
        pageCache.delete(oldestKey)
    }
}

const fetchWithCache = async (url) => {
    if (pageCache.has(url)) {
        const cachedEntry = pageCache.get(url)

        if (!isExpiredCacheEntry(cachedEntry)) {
            // Reinsert to refresh recency order (simple LRU behavior).
            pageCache.delete(url)
            pageCache.set(url, cachedEntry)
            return cachedEntry.response
        }

        pageCache.delete(url)
    }

    if (inFlightRequests.has(url)) {
        return inFlightRequests.get(url)
    }

    const requestPromise = request.get(url)
        .then((response) => {
            cacheResponse(url, response)
            return response
        })
        .finally(() => {
            inFlightRequests.delete(url)
        })

    inFlightRequests.set(url, requestPromise)
    return requestPromise
}

const prefetchNextPageInBackground = ({ apiUrl, currentPage, totalPages }) => {
    if (props.useClientPagination || isMobile.value) {
        return
    }

    if (currentPage >= totalPages) {
        return
    }

    const nextPageUrl = buildApiUrlWithPage({
        apiUrl,
        page: currentPage + 1,
    })

    if (!nextPageUrl) {
        return
    }

    fetchWithCache(nextPageUrl).catch(() => {
        // Ignore prefetch failures because user-facing fetch flow remains unchanged.
    })
}

const normalizedItemsPerPage = computed(() => {
    return Number.isFinite(props.itemsPerPage) && props.itemsPerPage > 0
        ? props.itemsPerPage
        : DESKTOP_ITEMS_PER_PAGE
})

const normalizedRequestItemsPerPage = computed(() => {
    return Number.isFinite(props.requestItemsPerPage) && props.requestItemsPerPage > 0
        ? props.requestItemsPerPage
        : normalizedItemsPerPage.value
})

const normalizedMobilePages = computed(() => {
    return Number.isFinite(props.mobilePages) && props.mobilePages > 0
        ? props.mobilePages
        : 1
})

const updateViewportState = () => {
    isMobile.value = window.innerWidth <= MOBILE_BREAKPOINT
}

const pagedProducts = computed(() => {
    if (!props.useClientPagination) {
        return products.value
    }

    return getPagedItems({
        isMobile: false,
        items: products.value,
        currentPage: currentPage.value,
        itemsPerPage: normalizedItemsPerPage.value,
    })
})

const currentPage = computed(() => {
    return normalizePage({ page: getQueryPage(route.query), totalPages: totalPages.value })
})

const productRows = computed(() => {
    const rowCount = Math.ceil(pagedProducts.value.length / 3)

    return Array.from({ length: rowCount }, (_, rowIndex) => {
        const start = rowIndex * 3
        return pagedProducts.value.slice(start, start + 3)
    })
})

const firstPage = computed(() => getFirstPage())

const prevPage = computed(() => {
    return getPrevPage(currentPage.value)
})

const nextPage = computed(() => {
    return getNextPage({
        currentPage: currentPage.value,
        totalPages: totalPages.value,
    })
})

const lastPage = computed(() => {
    return getLastPage(totalPages.value)
})

const buildPageLink = (page) => getPageLink({ path: route.path, query: route.query, page })

const paginationItems = computed(() => {
    return getPaginationItems({
        currentPage: currentPage.value,
        nextPagesWithData: nextPagesWithData.value,
    })
})

const fetchProducts = async () => {
    const currentFetchId = fetchSequence.value + 1
    fetchSequence.value = currentFetchId

    const effectiveApiUrl = buildApiUrlForViewport({
        apiUrl: props.apiUrl,
        isMobile: isMobile.value,
        itemsPerPage: normalizedRequestItemsPerPage.value,
        mobilePages: normalizedMobilePages.value,
    })

    const response = await fetchWithCache(effectiveApiUrl)
    if (currentFetchId !== fetchSequence.value) {
        return
    }

    const payload = response.data
    const queryPage = getQueryPage(route.query)

    const resolvedProducts = resolveProductsData(payload)
    products.value = Number.isFinite(props.maxDisplayItems) && props.maxDisplayItems > 0
        ? resolvedProducts.slice(0, props.maxDisplayItems)
        : resolvedProducts

    if (props.useClientPagination) {
        totalItems.value = products.value.length
        totalPages.value = Math.max(1, Math.ceil(totalItems.value / normalizedItemsPerPage.value))
        nextPagesWithData.value = 0
        return
    }

    const paginationMeta = resolvePaginationMeta({
        payload,
        headers: response.headers,
        currentPage: queryPage,
        itemsPerPage: normalizedRequestItemsPerPage.value,
        dataLength: products.value.length,
    })

    if (isMobile.value) {
        nextPagesWithData.value = 0
    } else {
        const detectedNextPages = await detectNextPagesWithData({
            requestGet: (url) => fetchWithCache(url),
            apiUrl: effectiveApiUrl,
            currentPage: queryPage,
            maxNextPages: 3,
        })

        if (currentFetchId !== fetchSequence.value) {
            return
        }

        nextPagesWithData.value = detectedNextPages
    }

    totalItems.value = paginationMeta.totalItems
    totalPages.value = Math.max(paginationMeta.totalPages, queryPage + nextPagesWithData.value)

    prefetchNextPageInBackground({
        apiUrl: effectiveApiUrl,
        currentPage: queryPage,
        totalPages: totalPages.value,
    })
}

onMounted(() => {
    updateViewportState()
    window.addEventListener('resize', updateViewportState)
})

watch(() => route.path, () => {
    pageCache.clear()
    inFlightRequests.clear()
})

watch([normalizedCacheTtlMs, normalizedCacheMaxEntries], () => {
    pageCache.clear()
    inFlightRequests.clear()
})

watch([
    () => props.apiUrl,
    () => (props.useClientPagination ? 0 : isMobile.value),
], fetchProducts, { immediate: true })

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

            <div v-if="shouldShowDesktopPagination({ isMobile, totalPages, currentPage })" class="pagination-wrapper">
                <RouterLink v-if="currentPage > 1" class="btn btn-outline-secondary" :to="buildPageLink(firstPage)">
                    最前頁
                </RouterLink>
                <span v-else class="btn btn-outline-secondary disabled" aria-disabled="true">
                    最前頁
                </span>
                <RouterLink v-if="currentPage > 1" class="btn btn-outline-secondary" :to="buildPageLink(prevPage)">
                    上一頁
                </RouterLink>
                <span v-else class="btn btn-outline-secondary disabled" aria-disabled="true">
                    上一頁
                </span>
                <template v-for="(item, index) in paginationItems" :key="`page-item-${index}-${item.type}-${item.value ?? 'ellipsis'}`">
                    <RouterLink
                        v-if="item.type === 'page'"
                        class="btn page-number-btn"
                        :class="item.value === currentPage ? 'btn-primary' : 'btn-outline-secondary'"
                        :to="buildPageLink(item.value)"
                    >
                        {{ item.value }}
                    </RouterLink>
                    <span v-else class="page-ellipsis">...</span>
                </template>
                <span class="page-status">第 {{ currentPage }} / {{ totalPages }} 頁</span>
                <RouterLink v-if="currentPage < totalPages" class="btn btn-outline-secondary" :to="buildPageLink(nextPage)">
                    下一頁
                </RouterLink>
                <span v-else class="btn btn-outline-secondary disabled" aria-disabled="true">
                    下一頁
                </span>
                <RouterLink v-if="currentPage < totalPages" class="btn btn-outline-secondary" :to="buildPageLink(lastPage)">
                    最末頁
                </RouterLink>
                <span v-else class="btn btn-outline-secondary disabled" aria-disabled="true">
                    最末頁
                </span>
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
