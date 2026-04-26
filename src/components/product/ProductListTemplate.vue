<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { usePagination } from '@/composables/usePagination'
import { DEFAULT_ROW_COUNTS_PER_PAGE, HOMEPAGE_MAX_ROW_COUNTS } from '@/utils/pagination'
import Pagination from '@/components/layout/Pagination.vue'

let observer = null
const apiUrlPath = '/products'
const route = useRoute()
const isHomePage = window.location.pathname === '/'
const mobileMediaQuery = window.matchMedia('(max-width: 767.98px)')
const isMobile = ref(mobileMediaQuery.matches)
const initialPage = Number.parseInt(String(route.query.page ?? '1'), 10)
const resolvedInitialPage = Number.isFinite(initialPage) && initialPage > 0 ? initialPage : 1
const { data, loading, totalItems, getPageData } = usePagination(apiUrlPath)
const observerTarget = ref(null)
const mobileProducts = ref([])
const mobileReachedEnd = ref(false)
const params = reactive({
    row_counts_per_page: DEFAULT_ROW_COUNTS_PER_PAGE,
    page: isMobile.value ? 1 : resolvedInitialPage,
})
const reachedHomePageLimit = computed(() => isHomePage && mobileProducts.value.length >= HOMEPAGE_MAX_ROW_COUNTS)
const remainingDesktopHomePageSlots = computed(() => {
    if (!isHomePage || isMobile.value) {
        return null
    }

    return Math.max(HOMEPAGE_MAX_ROW_COUNTS - ((params.page - 1) * params.row_counts_per_page), 0)
})

const displayedProducts = computed(() => {
    if (isMobile.value) {
        return mobileProducts.value
    }

    if (!Array.isArray(data?.value)) {
        return []
    }

    if (!isHomePage) {
        return data.value
    }

    return data.value.slice(0, remainingDesktopHomePageSlots.value)
})

const productRows = computed(() => {
    if (!Array.isArray(displayedProducts.value)) {
        return []
    }

    const rows = []

    for (let index = 0; index < displayedProducts.value.length; index += 3) {
        rows.push(displayedProducts.value.slice(index, index + 3))
    }

    return rows
})

const observeSentinel = async () => {
    if (!observer) {
        return
    }

    observer.disconnect()

    if (isMobile.value && observerTarget.value && !mobileReachedEnd.value && !reachedHomePageLimit.value) {
        await nextTick()
        observer.observe(observerTarget.value)
    }
}

const loadProducts = async (page) => {
    const nextProducts = await getPageData(page, params.row_counts_per_page)

    if (!isMobile.value) {
        return
    }

    if (page === 1) {
        mobileProducts.value = nextProducts
    } else if (nextProducts.length > 0) {
        mobileProducts.value = [...mobileProducts.value, ...nextProducts]
    }

    if (isHomePage && mobileProducts.value.length > HOMEPAGE_MAX_ROW_COUNTS) {
        mobileProducts.value = mobileProducts.value.slice(0, HOMEPAGE_MAX_ROW_COUNTS)
    }

    if (nextProducts.length === 0 || reachedHomePageLimit.value) {
        mobileReachedEnd.value = true
    }
}

const handleDeviceChange = (event) => {
    isMobile.value = event.matches
}

watch(() => params.page, async (page) => {
    await loadProducts(page)
    await observeSentinel()
}, { immediate: true })

watch(isMobile, async (mobile, previousMobile) => {
    if (mobile === previousMobile) {
        return
    }

    mobileProducts.value = []
    mobileReachedEnd.value = false
    params.page = 1

    await observeSentinel()
})

watch(observerTarget, async () => {
    await observeSentinel()
})

watch(mobileReachedEnd, async () => {
    await observeSentinel()
})

onMounted(() => {
    observer = new IntersectionObserver(([entry]) => {
        if (!entry?.isIntersecting || !isMobile.value || loading.value || mobileReachedEnd.value || reachedHomePageLimit.value) {
            return
        }

        params.page += 1
    }, {
        rootMargin: '200px 0px',
    })

    mobileMediaQuery.addEventListener('change', handleDeviceChange)
    observeSentinel()
})

onBeforeUnmount(() => {
    observer?.disconnect()
    mobileMediaQuery.removeEventListener('change', handleDeviceChange)
})
</script>

<template>
    <div class="container-fluid p-3">
        <div class="content-header">
            <h2 class="title">產品列表</h2>
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
                        <img class="card-img-top" :src="product.image_path" :alt="product.name">
                        <div class="card-body">
                            <h4 class="card-title">{{ product.name }}</h4>
                            <p class="card-text">{{ `特價 NT$ ${product.price}  元` }}</p>
                            <a :href="`/products/${product.id}`" class="btn btn-primary">詳細資訊</a>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="isMobile && !mobileReachedEnd" ref="observerTarget" class="scroll-sentinel" />
        </div>

        <Pagination v-if="!isMobile" :total-items="totalItems" :items-per-page="params.row_counts_per_page" v-model="params.page" />
    </div>
</template>

<style scoped>
.scroll-sentinel {
    width: 100%;
    height: 1px;
}

.pagination-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.75rem;
    margin-top: 1.5rem;
    flex-wrap: wrap;
}
</style>
