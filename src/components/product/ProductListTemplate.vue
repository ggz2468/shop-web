<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import request from '@/utils/request'
import {
    getImageUrl,
    DESKTOP_ITEMS_PER_PAGE,
    MOBILE_BREAKPOINT,
    resolveProductsData,
    resolvePaginationMeta,
    buildApiUrlForViewport,
    buildApiUrlWithPage,
    getFirstPage,
    getPrevPage,
    getNextPage,
    getLastPage,
    normalizePage,
    shouldShowDesktopPagination,
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

const products = ref([])
const isMobile = ref(false)
const totalItems = ref(0)
const totalPages = ref(1)
const fetchSequence = ref(0)
const activePage = ref(1)
const pageCache = new Map()
const pageDataCache = new Map()
const pageDataCacheVersion = ref(0)
const inFlightRequests = new Map()
const lastScrollY = ref(0)
const isLoadingMore = ref(false)

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

const getCachedPageData = (page) => {
    const cachedEntry = pageDataCache.get(page)
    if (!cachedEntry) {
        return null
    }

    if (isExpiredCacheEntry(cachedEntry)) {
        pageDataCache.delete(page)
        pageDataCacheVersion.value += 1
        return null
    }

    return cachedEntry.items
}

const setCachedPageData = (page, items) => {
    pageDataCache.set(page, {
        items,
        cachedAt: Date.now(),
    })

    if (pageDataCache.size > normalizedCacheMaxEntries.value * 3) {
        const oldestKey = pageDataCache.keys().next().value
        pageDataCache.delete(oldestKey)
    }

    pageDataCacheVersion.value += 1
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

const getHighestContiguousCachedPage = () => {
    if (props.useClientPagination) {
        return totalPages.value
    }

    let highestPage = 0

    for (let page = 1; page <= totalPages.value; page += 1) {
        if (!Array.isArray(getCachedPageData(page))) {
            break
        }

        highestPage = page
    }

    return highestPage
}

const pagedProducts = computed(() => {
    if (isMobile.value) {
        if (props.useClientPagination) {
            return products.value
        }

        pageDataCacheVersion.value
        const mobileItems = []
        const highestCachedPage = getHighestContiguousCachedPage()

        for (let page = 1; page <= highestCachedPage; page += 1) {
            const pageItems = getCachedPageData(page)
            if (!Array.isArray(pageItems) || pageItems.length === 0) {
                break
            }

            mobileItems.push(...pageItems)
        }

        return mobileItems
    }

    if (!props.useClientPagination) {
        pageDataCacheVersion.value
        return getCachedPageData(currentPage.value) || []
    }

    const firstIndex = (currentPage.value - 1) * normalizedItemsPerPage.value
    return products.value.slice(firstIndex, firstIndex + normalizedItemsPerPage.value)
})

const currentPage = computed(() => {
    return normalizePage({ page: activePage.value, totalPages: totalPages.value })
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

const hasCachedPage = (page) => {
    if (props.useClientPagination) {
        return page >= 1 && page <= totalPages.value
    }

    return Array.isArray(getCachedPageData(page))
}

const paginationItems = computed(() => {
    const items = []
    const page = currentPage.value

    for (let previousPage = page - 2; previousPage <= page - 1; previousPage += 1) {
        if (previousPage >= 1 && hasCachedPage(previousPage)) {
            items.push(previousPage)
        }
    }

    items.push(page)

    for (let nextPageIndex = page + 1; nextPageIndex <= page + 2; nextPageIndex += 1) {
        if (nextPageIndex <= totalPages.value && hasCachedPage(nextPageIndex)) {
            items.push(nextPageIndex)
        }
    }

    return items.slice(0, 5)
})

const changePage = (page) => {
    const next = normalizePage({ page, totalPages: totalPages.value })
    activePage.value = next
}

const loadMoreMobileProducts = async () => {
    if (!isMobile.value || props.useClientPagination || isLoadingMore.value) {
        return
    }

    const nextPageNumber = getHighestContiguousCachedPage() + 1
    if (nextPageNumber > totalPages.value) {
        return
    }

    isLoadingMore.value = true

    try {
        await fetchProducts(nextPageNumber)
    } finally {
        isLoadingMore.value = false
    }
}

const onWindowScroll = () => {
    const currentScrollY = window.scrollY
    const isScrollingDown = currentScrollY > lastScrollY.value
    lastScrollY.value = currentScrollY

    if (!isMobile.value || props.useClientPagination || !isScrollingDown) {
        return
    }

    const nearBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 80
    if (!nearBottom) {
        return
    }

    loadMoreMobileProducts()
}

const cacheBatchByPage = ({ startPage, batchItems }) => {
    const itemsPerPage = normalizedItemsPerPage.value
    const pagesPerBatch = Math.max(1, Math.floor(normalizedRequestItemsPerPage.value / itemsPerPage))

    for (let index = 0; index < pagesPerBatch; index += 1) {
        const page = startPage + index
        const start = index * itemsPerPage
        const pageItems = batchItems.slice(start, start + itemsPerPage)

        if (pageItems.length === 0) {
            break
        }

        setCachedPageData(page, pageItems)
    }
}

const fetchProducts = async (page = currentPage.value) => {
    const currentFetchId = fetchSequence.value + 1
    fetchSequence.value = currentFetchId

    const baseApiUrl = buildApiUrlForViewport({
        apiUrl: props.apiUrl,
        isMobile: isMobile.value,
        itemsPerPage: normalizedRequestItemsPerPage.value,
        mobilePages: normalizedMobilePages.value,
    })
    const queryPage = normalizePage({ page, totalPages: Number.MAX_SAFE_INTEGER })

    if (!props.useClientPagination) {
        const cachedCurrentPageItems = getCachedPageData(queryPage)
        if (cachedCurrentPageItems) {
            return
        }
    }

    const requestUrl = props.useClientPagination
        ? baseApiUrl
        : buildApiUrlWithPage({ apiUrl: baseApiUrl, page: queryPage })

    const response = await fetchWithCache(requestUrl)
    if (currentFetchId !== fetchSequence.value) {
        return
    }

    const payload = response.data

    const resolvedProducts = resolveProductsData(payload)
    const processedProducts = Number.isFinite(props.maxDisplayItems) && props.maxDisplayItems > 0
        ? resolvedProducts.slice(0, props.maxDisplayItems)
        : resolvedProducts

    if (props.useClientPagination) {
        products.value = processedProducts
        totalItems.value = products.value.length
        totalPages.value = Math.max(1, Math.ceil(totalItems.value / normalizedItemsPerPage.value))
        return
    }

    cacheBatchByPage({
        startPage: queryPage,
        batchItems: processedProducts,
    })

    const paginationMeta = resolvePaginationMeta({
        payload,
        headers: response.headers,
        currentPage: queryPage,
        itemsPerPage: normalizedItemsPerPage.value,
        dataLength: processedProducts.length,
    })

    const pagesFromBatch = Math.max(1, Math.ceil(processedProducts.length / normalizedItemsPerPage.value))
    const batchLastPage = queryPage + pagesFromBatch - 1

    totalItems.value = Math.max(totalItems.value, paginationMeta.totalItems)
    totalPages.value = Math.max(
        totalPages.value,
        paginationMeta.totalPages,
        batchLastPage,
        Math.ceil(totalItems.value / normalizedItemsPerPage.value),
    )
}

onMounted(() => {
    updateViewportState()
    lastScrollY.value = window.scrollY
    window.addEventListener('resize', updateViewportState)
    window.addEventListener('scroll', onWindowScroll, { passive: true })
})

watch([normalizedCacheTtlMs, normalizedCacheMaxEntries], () => {
    pageCache.clear()
    pageDataCache.clear()
    pageDataCacheVersion.value += 1
    inFlightRequests.clear()
    totalItems.value = 0
    totalPages.value = 1
    isLoadingMore.value = false
})

watch(isMobile, (mobile) => {
    lastScrollY.value = window.scrollY

    if (mobile) {
        activePage.value = 1
        if (!props.useClientPagination && !hasCachedPage(1)) {
            fetchProducts(1)
        }
        return
    }

    if (!props.useClientPagination && !hasCachedPage(activePage.value)) {
        fetchProducts(activePage.value)
    }
})

watch([
    () => props.apiUrl,
    normalizedItemsPerPage,
    normalizedRequestItemsPerPage,
    normalizedMobilePages,
    () => props.useClientPagination,
], () => {
    pageCache.clear()
    pageDataCache.clear()
    pageDataCacheVersion.value += 1
    inFlightRequests.clear()
    totalItems.value = 0
    totalPages.value = 1
    activePage.value = 1
    isLoadingMore.value = false
    fetchProducts(1)
}, { immediate: true })

watch(activePage, (page) => {
    if (props.useClientPagination) {
        return
    }

    if (hasCachedPage(page)) {
        return
    }

    fetchProducts(page)
})

onUnmounted(() => {
    window.removeEventListener('resize', updateViewportState)
    window.removeEventListener('scroll', onWindowScroll)
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
                <button v-if="currentPage > 1" type="button" class="btn btn-outline-secondary" @click="changePage(firstPage)">
                    最前頁
                </button>
                <span v-else class="btn btn-outline-secondary disabled" aria-disabled="true">
                    最前頁
                </span>
                <button v-if="currentPage > 1" type="button" class="btn btn-outline-secondary" @click="changePage(prevPage)">
                    上一頁
                </button>
                <span v-else class="btn btn-outline-secondary disabled" aria-disabled="true">
                    上一頁
                </span>
                <template v-for="pageNumber in paginationItems" :key="`page-item-${pageNumber}`">
                    <button
                        type="button"
                        class="btn page-number-btn"
                        :class="pageNumber === currentPage ? 'btn-primary' : 'btn-outline-secondary'"
                        @click="changePage(pageNumber)"
                    >
                        {{ pageNumber }}
                    </button>
                </template>
                <span class="page-status">第 {{ currentPage }} / {{ totalPages }} 頁</span>
                <button v-if="currentPage < totalPages" type="button" class="btn btn-outline-secondary" @click="changePage(nextPage)">
                    下一頁
                </button>
                <span v-else class="btn btn-outline-secondary disabled" aria-disabled="true">
                    下一頁
                </span>
                <button v-if="currentPage < totalPages" type="button" class="btn btn-outline-secondary" @click="changePage(lastPage)">
                    最末頁
                </button>
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
