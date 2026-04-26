import { ref } from 'vue'
import http from '@/plugins/axios'
import { HOMEPAGE_MAX_ROW_COUNTS, DEFAULT_ROW_COUNTS_PER_PAGE } from '@/utils/pagination'

const cache = new Map()

export const usePagination = (apiUrlPath) => {
    const data = ref(null)
    const loading = ref(false)
    const error = ref(null)
    const totalItems = ref(0)

    // 定義取得分頁資料的函式
    const getPageData = async (page = 1, rowCountsPerPage = DEFAULT_ROW_COUNTS_PER_PAGE) => {
        const isHomePage = window.location.pathname === '/'
        const cacheKey = `${apiUrlPath}:${rowCountsPerPage}:${page}`

        // 檢查指定頁碼資料是否存在快取中
        if (cache.has(cacheKey)) {
            const cachedEntry = cache.get(cacheKey)
            data.value = cachedEntry.data
            totalItems.value = cachedEntry.totalItems
            return cachedEntry.data
        }

        loading.value = true
        error.value = null

        // 從 API 獲取資料
        try {
            const response = await http.get(apiUrlPath, {
                params: {
                    row_counts_per_page: rowCountsPerPage,
                    page: page,
                }
            })

            const result = response.data.data
            const resolvedTotalItems = isHomePage ? HOMEPAGE_MAX_ROW_COUNTS : (response.data?.meta?.total ?? result.length)
            data.value = result
            totalItems.value = resolvedTotalItems
            cache.set(cacheKey, {
                data: result,
                totalItems: resolvedTotalItems,
            })
            return result
        } catch (err) {
            error.value = err
            console.error('Error fetching paginated data:', err)
            return []
        } finally {
            loading.value = false
        }
    }

    return { data, loading, error, totalItems, getPageData }
}
