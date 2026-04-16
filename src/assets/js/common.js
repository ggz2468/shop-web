const baseUrl = import.meta.env.VITE_BASE_URL || ''
const getImageUrl = (imagePath) => `${baseUrl}${imagePath}`

const DESKTOP_ITEMS_PER_PAGE = 6
const MOBILE_BREAKPOINT = 576

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

const getPaginationItems = ({ totalPages, currentPage }) => {
	if (totalPages <= 10) {
		return Array.from({ length: totalPages }, (_, index) => ({
			type: 'page',
			value: index + 1,
		}))
	}

	if (currentPage <= 6) {
		const startPages = Array.from({ length: 9 }, (_, index) => ({
			type: 'page',
			value: index + 1,
		}))

		return [...startPages, { type: 'ellipsis' }, { type: 'page', value: totalPages }]
	}

	if (currentPage >= totalPages - 5) {
		const endPages = Array.from({ length: 9 }, (_, index) => ({
			type: 'page',
			value: totalPages - 8 + index,
		}))

		return [{ type: 'page', value: 1 }, { type: 'ellipsis' }, ...endPages]
	}

	const middlePages = Array.from({ length: 7 }, (_, index) => ({
		type: 'page',
		value: currentPage - 3 + index,
	}))

	return [
		{ type: 'page', value: 1 },
		{ type: 'ellipsis' },
		...middlePages,
		{ type: 'ellipsis' },
		{ type: 'page', value: totalPages },
	]
}

const getFirstPage = () => 1
const getPrevPage = (currentPage) => Math.max(1, currentPage - 1)
const getNextPage = ({ currentPage, totalPages }) => Math.min(totalPages, currentPage + 1)
const getLastPage = (totalPages) => totalPages
const normalizePage = ({ page, totalPages }) => Math.min(Math.max(1, page), totalPages)

export {
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
}

