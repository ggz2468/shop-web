import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useOrderDetail } from '@/composables/useOrderDetail'
import { orderServices } from '@/services/orderService'

vi.mock('@/services/orderService', () => ({
    orderServices: { getOrder: vi.fn(), getOrderOptions: vi.fn() },
}))

const dictionaries = {
    order_statuses: [{ value: 3, label: '產品備貨中' }],
    payment_statuses: [{ value: 1, label: '未付款' }],
    payment_methods: [{ value: 1, label: '信用卡' }],
    shipping_methods: [{ value: 1, label: '宅配' }],
}
const detail = id => ({ data: { data: { id, number: `ORD${id}`, items: [] } } })

describe('會員訂單詳情', () => {
    beforeEach(() => {
        vi.resetAllMocks()
        orderServices.getOrder.mockImplementation(id => Promise.resolve(detail(id)))
        orderServices.getOrderOptions.mockResolvedValue({ data: { data: dictionaries } })
    })

    it('載入指定訂單與後端字典，保留快照而不計算金額', async () => {
        const snapshot = { id: 1, items: [{ product_price: 300, quantity: 2, subtotal: 550 }], total_amount: 630 }
        orderServices.getOrder.mockResolvedValue({ data: { data: snapshot } })
        const state = useOrderDetail()
        const pending = state.loadOrder('1')
        expect(state.loading.value).toBe(true)
        await pending

        expect(orderServices.getOrder).toHaveBeenCalledWith('1')
        expect(state.order.value).toEqual(snapshot)
        expect(state.optionLabel('order_statuses', 3)).toBe('產品備貨中')
        expect(state.optionLabel('payment_statuses', 99)).toBe('未知（99）')
        expect(state.loading.value).toBe(false)
        expect(state.errorMessage.value).toBe('')
    })

    it('404 顯示無法查看提示，不殘留上一筆訂單', async () => {
        const state = useOrderDetail()
        await state.loadOrder('1')
        orderServices.getOrder.mockRejectedValue({ response: { status: 404 } })
        await state.loadOrder('2')

        expect(state.order.value).toBeNull()
        expect(state.notFound.value).toBe(true)
        expect(state.errorMessage.value).toBe('找不到此訂單，或您無權查看。')
    })

    it.each([
        [500, '取得訂單詳情失敗，請稍後再試。'],
        [401, '請先登入會員以查看訂單。'],
        [429, '取得訂單詳情失敗，請稍後再試。'],
    ])('處理 HTTP %s 失敗並可重試', async (status, message) => {
        orderServices.getOrder.mockRejectedValueOnce({ response: { status } })
        const state = useOrderDetail()
        await state.loadOrder('1')
        expect(state.errorMessage.value).toBe(message)
        expect(state.order.value).toBeNull()
        await state.loadOrder('1')
        expect(state.errorMessage.value).toBe('')
        expect(state.order.value.id).toBe('1')
    })

    it('字典失敗時顯示錯誤而非不完整的詳情', async () => {
        orderServices.getOrderOptions.mockRejectedValue(new Error('Network error'))
        const state = useOrderDetail()
        await state.loadOrder('1')
        expect(state.order.value).toBeNull()
        expect(state.errorMessage.value).not.toBe('')
    })

    it.each([
        { data: { data: null } },
        { data: { data: { id: 2, items: [] } } },
        { data: { data: { id: 1 } } },
    ])('拒絕不完整或錯誤訂單的回應 %#', async (response) => {
        orderServices.getOrder.mockResolvedValue(response)
        const state = useOrderDetail()
        await state.loadOrder('1')
        expect(state.order.value).toBeNull()
        expect(state.errorMessage.value).not.toBe('')
    })

    it('切換訂單時，較慢的舊回應不覆蓋目前訂單', async () => {
        let resolveFirst
        orderServices.getOrder.mockImplementationOnce(() => new Promise(resolve => { resolveFirst = resolve }))
        const state = useOrderDetail()
        const first = state.loadOrder('1')
        await state.loadOrder('2')
        resolveFirst(detail('1'))
        await first
        expect(state.order.value.id).toBe('2')
        expect(state.loading.value).toBe(false)
    })
})
