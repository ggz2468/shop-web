const normalizeBaseUrl = (value) => {
	if (typeof value !== 'string') {
		return ''
	}

	const trimmedValue = value.trim()
	if (!trimmedValue || trimmedValue === 'undefined' || trimmedValue === 'null') {
		return ''
	}

	return trimmedValue.endsWith('/') ? trimmedValue.slice(0, -1) : trimmedValue
}

const baseUrl = normalizeBaseUrl(import.meta.env.VITE_BASE_URL)

const getImageUrl = (imagePath) => {
	if (!imagePath) {
		return ''
	}

	if (/^https?:\/\//.test(imagePath)) {
		return imagePath
	}

	const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`
	return `${baseUrl}${normalizedPath}`
}

const DESKTOP_ITEMS_PER_PAGE = 6
const MOBILE_BREAKPOINT = 576

const parsePositiveInt = (value) => {
	const parsed = Number.parseInt(value, 10)
	return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

const getQueryPage = (query) => {
	const rawPage = Array.isArray(query?.page) ? query.page[0] : query?.page
	const parsedPage = parsePositiveInt(rawPage)

	return parsedPage || 1
}

const buildProductsApiUrl = ({ query, itemsPerPage = DESKTOP_ITEMS_PER_PAGE }) => {
	const page = getQueryPage(query)
	return `/products?row_counts_per_page=${itemsPerPage}&page=${page}`
}

const getTotalPages = ({ isMobile, totalItems, itemsPerPage = DESKTOP_ITEMS_PER_PAGE }) => {
	if (isMobile || totalItems === 0) {
		return 1
	}

	return Math.ceil(totalItems / itemsPerPage)
}

const getPagedItems = ({ isMobile, items, currentPage, itemsPerPage = DESKTOP_ITEMS_PER_PAGE }) => {
	if (isMobile) {
		return items
	}

	const start = (currentPage - 1) * itemsPerPage
	return items.slice(start, start + itemsPerPage)
}

const buildApiUrlWithPage = ({ apiUrl, page }) => {
	if (typeof apiUrl !== 'string' || !apiUrl.trim()) {
		return ''
	}

	const [path, queryString = ''] = apiUrl.split('?')
	const params = new URLSearchParams(queryString)
	params.set('page', String(page))

	const serialized = params.toString()
	return serialized ? `${path}?${serialized}` : path
}

const buildApiUrlForViewport = ({ apiUrl, isMobile, itemsPerPage = DESKTOP_ITEMS_PER_PAGE, mobilePages = 3 }) => {
	if (typeof apiUrl !== 'string' || !apiUrl.trim()) {
		return ''
	}

	const [path, queryString = ''] = apiUrl.split('?')
	const params = new URLSearchParams(queryString)

	if (isMobile) {
		params.set('row_counts_per_page', String(itemsPerPage * mobilePages))
	} else {
		params.set('row_counts_per_page', String(itemsPerPage))
	}

	const serialized = params.toString()
	return serialized ? `${path}?${serialized}` : path
}

const resolveProductsData = (payload) => {
	if (Array.isArray(payload)) {
		return payload
	}

	if (Array.isArray(payload?.data)) {
		return payload.data
	}

	if (Array.isArray(payload?.items)) {
		return payload.items
	}

	if (Array.isArray(payload?.results)) {
		return payload.results
	}

	return []
}

const resolvePaginationMeta = ({ payload, headers, currentPage, itemsPerPage = DESKTOP_ITEMS_PER_PAGE, dataLength = 0 }) => {
	const resolvedCurrentPage = parsePositiveInt(
		payload?.current_page ??
		payload?.page ??
		payload?.pagination?.current_page ??
		payload?.meta?.current_page ??
		headers?.['x-current-page']
	) || currentPage || 1

	const totalItems = parsePositiveInt(
		payload?.total ??
		payload?.total_count ??
		payload?.count ??
		payload?.pagination?.total ??
		payload?.meta?.total ??
		headers?.['x-total-count']
	) || dataLength

	const bodyTotalPages = parsePositiveInt(
		payload?.total_pages ??
		payload?.page_count ??
		payload?.last_page ??
		payload?.pagination?.total_pages ??
		payload?.pagination?.last_page ??
		payload?.meta?.total_pages ??
		payload?.meta?.last_page
	)

	const headerTotalPages = parsePositiveInt(
		headers?.['x-total-pages'] ??
		headers?.['x-pagination-total-pages']
	)

	const totalPagesFromCount = Math.ceil(totalItems / itemsPerPage)
	const derivedTotalPages = bodyTotalPages || headerTotalPages || totalPagesFromCount
	const totalPages = Math.max(derivedTotalPages || 1, resolvedCurrentPage)

	return {
		totalItems,
		totalPages,
		currentPage: resolvedCurrentPage,
	}
}

const getPaginationItems = ({ currentPage, nextPagesWithData = 0 }) => {
	const items = []

	if (currentPage - 3 >= 1) {
		for (let page = currentPage - 3; page <= currentPage - 1; page += 1) {
			items.push({ type: 'page', value: page })
		}
	}

	items.push({ type: 'page', value: currentPage })

	for (let offset = 1; offset <= nextPagesWithData; offset += 1) {
		items.push({ type: 'page', value: currentPage + offset })
	}

	return items
}

const detectNextPagesWithData = async ({ requestGet, apiUrl, currentPage, maxNextPages = 3 }) => {
	if (typeof requestGet !== 'function' || !apiUrl) {
		return 0
	}

	let availableNextPages = 0

	for (let offset = 1; offset <= maxNextPages; offset += 1) {
		const targetPage = currentPage + offset
		const targetUrl = buildApiUrlWithPage({ apiUrl, page: targetPage })

		if (!targetUrl) {
			break
		}

		try {
			const response = await requestGet(targetUrl)
			const data = resolveProductsData(response?.data)

			if (!Array.isArray(data) || data.length === 0) {
				break
			}

			availableNextPages += 1
		} catch {
			break
		}
	}

	return availableNextPages
}

const getFirstPage = () => 1
const getPrevPage = (currentPage) => Math.max(1, currentPage - 1)
const getNextPage = ({ currentPage, totalPages }) => Math.min(totalPages, currentPage + 1)
const getLastPage = (totalPages) => totalPages
const normalizePage = ({ page, totalPages }) => Math.min(Math.max(1, page), totalPages)

const shouldShowDesktopPagination = ({ isMobile }) => {
	return !isMobile
}

const getPageLink = ({ path, query, page }) => {
	return {
		path,
		query: {
			...query,
			page: String(page),
		},
	}
}

export {
	getImageUrl,
	DESKTOP_ITEMS_PER_PAGE,
	MOBILE_BREAKPOINT,
	getQueryPage,
	buildProductsApiUrl,
	getTotalPages,
	getPagedItems,
	buildApiUrlWithPage,
	buildApiUrlForViewport,
	resolveProductsData,
	resolvePaginationMeta,
	getPaginationItems,
	detectNextPagesWithData,
	getFirstPage,
	getPrevPage,
	getNextPage,
	getLastPage,
	normalizePage,
	shouldShowDesktopPagination,
	getPageLink,
}

