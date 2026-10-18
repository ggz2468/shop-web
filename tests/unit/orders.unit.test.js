import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useOrders } from '@/composables/useOrders'
import { orderServices } from '@/services/orderService'

vi.mock('@/services/orderService', () => ({
    orderServices: { getOrders: vi.fn(), getOrderOptions: vi.fn() },
}))

const options = {
    order_statuses: [{ value: 3, code: 'STOCKING', label: '產品備貨中' }],
    payment_statuses: [{ value: 1, code: 'UNPAID', label: '未付款' }],
    payment_methods: [{ value: 1, code: 'CREDIT_CARD', label: '信用卡' }],
    shipping_methods: [{ value: 1, code: 'HOME_DELIVERY', label: '宅配' }],
}
const pageResponse = (page = 1, data = [{ id: 1 }], total = 11) => ({
    data: { data, meta: { current_page: page, total, per_page: 10 } },
})

describe('會員訂單列表', () => {
    beforeEach(() => {
        vi.resetAllMocks()
        orderServices.getOrderOptions.mockResolvedValue({ data: { data: options } })
        orderServices.getOrders.mockResolvedValue(pageResponse())
    })

    it('載入訂單與後端字典，採用每頁十筆與後端中文', async () => {
        const state = useOrders()
        const pending = state.loadOrders()
        expect(state.loading.value).toBe(true)
        await pending

        expect(orderServices.getOrders).toHaveBeenCalledWith(1, 10)
        expect(state.orders.value).toEqual([{ id: 1 }])
        expect(state.totalItems.value).toBe(11)
        expect(state.loading.value).toBe(false)
        expect(state.errorMessage.value).toBe('')
        expect(state.optionLabel('order_statuses', 3)).toBe('產品備貨中')
        expect(state.optionLabel('payment_statuses', 99)).toBe('未知（99）')
    })

    it('換頁時重新查詢，不共用訂單快取；同一頁面只載入一次字典', async () => {
        const state = useOrders()
        await state.loadOrders()
        orderServices.getOrders.mockResolvedValue(pageResponse(2, [{ id: 2 }]))
        await state.loadOrders(2)

        expect(state.currentPage.value).toBe(2)
        expect(state.orders.value).toEqual([{ id: 2 }])
        expect(orderServices.getOrders).toHaveBeenLastCalledWith(2, 10)
        expect(orderServices.getOrderOptions).toHaveBeenCalledTimes(1)

        const anotherMemberPage = useOrders()
        await anotherMemberPage.loadOrders()
        expect(orderServices.getOrders).toHaveBeenCalledTimes(3)
        expect(orderServices.getOrderOptions).toHaveBeenCalledTimes(2)
    })

    it('成功的空列表不顯示錯誤', async () => {
        orderServices.getOrders.mockResolvedValue(pageResponse(1, [], 0))
        const state = useOrders()
        await state.loadOrders()

        expect(state.orders.value).toEqual([])
        expect(state.totalItems.value).toBe(0)
        expect(state.errorMessage.value).toBe('')
    })

    it('失敗時清除舊列表並顯示錯誤，重試保留失敗頁碼', async () => {
        const state = useOrders()
        await state.loadOrders()
        orderServices.getOrders.mockRejectedValueOnce({ response: { status: 500 } })
        await state.loadOrders(2)

        expect(state.orders.value).toEqual([])
        expect(state.errorMessage.value).toBe('取得訂單列表失敗，請稍後再試。')
        expect(state.loading.value).toBe(false)

        orderServices.getOrders.mockResolvedValue(pageResponse(2, [{ id: 2 }]))
        await state.retry()
        expect(orderServices.getOrders).toHaveBeenLastCalledWith(2, 10)
        expect(state.currentPage.value).toBe(2)
        expect(state.errorMessage.value).toBe('')
    })

    it('字典失敗時不將結果當成正常列表，重試會重新取得字典', async () => {
        orderServices.getOrderOptions.mockRejectedValueOnce(new Error('network error'))
        const state = useOrders()
        await state.loadOrders()
        expect(state.errorMessage.value).not.toBe('')
        expect(state.orders.value).toEqual([])
        await state.retry()
        expect(orderServices.getOrderOptions).toHaveBeenCalledTimes(2)
        expect(state.errorMessage.value).toBe('')
    })

    it('未登入時不顯示成功的空列表提示', async () => {
        orderServices.getOrders.mockRejectedValue({ response: { status: 401 } })
        const state = useOrders()
        await state.loadOrders()
        expect(state.errorMessage.value).toBe('請先登入會員以查看訂單。')
    })

    it('限流時顯示 API 提供的錯誤訊息', async () => {
        orderServices.getOrders.mockRejectedValue({
            response: { status: 429, data: { message: '請稍後再試。' } },
        })
        const state = useOrders()
        await state.loadOrders()
        expect(state.errorMessage.value).toBe('請稍後再試。')
    })

    it.each([
        { data: { meta: { total: 0, current_page: 1, per_page: 10 } } },
        { data: { data: [], meta: { total: -1, current_page: 1, per_page: 10 } } },
        { data: { data: [], meta: { total: 0, current_page: 0, per_page: 10 } } },
        { data: { data: [], meta: { total: 0, current_page: 1, per_page: 6 } } },
    ])('拒絕不正確的列表回應格式 %#', async (response) => {
        orderServices.getOrders.mockResolvedValue(response)
        const state = useOrders()
        await state.loadOrders()
        expect(state.errorMessage.value).not.toBe('')
    })

    it('缺少狀態字典時顯示錯誤，避免靜默使用不完整的 options', async () => {
        orderServices.getOrderOptions.mockResolvedValue({
            data: { data: { ...options, payment_statuses: [] } },
        })
        const state = useOrders()
        await state.loadOrders()
        expect(state.errorMessage.value).not.toBe('')
    })

    it('載入期間不重複請求', async () => {
        const state = useOrders()
        const pending = state.loadOrders()
        await state.loadOrders(2)
        expect(orderServices.getOrders).toHaveBeenCalledTimes(1)
        await pending
        expect(state.currentPage.value).toBe(1)
    })
})
