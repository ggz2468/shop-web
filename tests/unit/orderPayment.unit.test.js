import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, ref } from 'vue'
import { useOrderPayment } from '@/composables/useOrderPayment'
import { orderServices } from '@/services/orderService'
import { fetchPaymentCheckout } from '@/utils/paymentCheckout'

vi.mock('@/services/orderService', () => ({
    orderServices: { createPaymentTransaction: vi.fn() },
}))
vi.mock('@/utils/paymentCheckout', () => ({ fetchPaymentCheckout: vi.fn() }))

const payableOrder = (allowed = true) => ({
    id: 1, status: 3, payment_status: 1, actions: { can_create_payment_transaction: allowed },
})
const checkout = { order_id: 1, payment_transaction_id: 10 }

describe('訂單詳情付款操作', () => {
    let scope
    let order
    let orderId
    let refreshOrder
    let state

    beforeEach(() => {
        vi.resetAllMocks()
        scope = effectScope()
        order = ref(payableOrder())
        orderId = ref('1')
        refreshOrder = vi.fn(async () => { order.value = payableOrder(false) })
        state = scope.run(() => useOrderPayment({ order, orderId, refreshOrder }))
        orderServices.createPaymentTransaction.mockResolvedValue({
            status: 201, data: { data: { order_id: 1, payment_transaction_id: 10 } },
        })
        fetchPaymentCheckout.mockResolvedValue(checkout)
    })

    afterEach(() => scope.stop())

    it('依後端 true 顯示資格，成功 POST 後更新訂單並取得既有交易付款資料', async () => {
        expect(state.canCreate.value).toBe(true)
        const pending = state.createTransaction()
        expect(state.busy.value).toBe(true)
        await pending

        expect(orderServices.createPaymentTransaction).toHaveBeenCalledExactlyOnceWith('1')
        expect(refreshOrder).toHaveBeenCalledWith('1')
        expect(fetchPaymentCheckout).toHaveBeenCalledWith('1', { signal: expect.any(AbortSignal) })
        expect(state.checkout.value).toEqual(checkout)
        expect(state.canCreate.value).toBe(false)
        expect(state.busy.value).toBe(false)
        expect(state.paymentError.value).toBe('')
    })

    it.each([false, undefined, 'true', 1])('非布林 true 資格 %s 不得發送 POST', async (value) => {
        order.value.actions.can_create_payment_transaction = value
        await state.createTransaction()
        expect(state.canCreate.value).toBe(false)
        expect(orderServices.createPaymentTransaction).not.toHaveBeenCalled()
    })

    it('連續點擊只發出一次 POST', async () => {
        let resolve
        orderServices.createPaymentTransaction.mockImplementationOnce(() => new Promise(done => { resolve = done }))
        const pending = state.createTransaction()
        await state.createTransaction()
        expect(orderServices.createPaymentTransaction).toHaveBeenCalledTimes(1)
        resolve({ status: 201, data: { data: { order_id: 1, payment_transaction_id: 10 } } })
        await pending
    })

    it('409 顯示後端衝突並刷新資格，不自動再新增交易', async () => {
        orderServices.createPaymentTransaction.mockRejectedValue({
            response: { status: 409, data: { message: '已有進行中的付款交易。' } },
        })
        await state.createTransaction()
        expect(state.paymentError.value).toBe('已有進行中的付款交易。')
        expect(refreshOrder).toHaveBeenCalledTimes(1)
        expect(fetchPaymentCheckout).not.toHaveBeenCalled()
        await state.createTransaction()
        expect(orderServices.createPaymentTransaction).toHaveBeenCalledTimes(1)
    })

    it.each([undefined, 500])('網路或伺服器錯誤 %s 保留結果不明狀態，明確刷新前不能再 POST', async (status) => {
        refreshOrder.mockImplementation(async () => { order.value = payableOrder(true) })
        orderServices.createPaymentTransaction.mockRejectedValueOnce(status ? { response: { status } } : new Error('timeout'))
        await state.createTransaction()
        expect(state.paymentError.value).toContain('結果尚未確認')
        await state.createTransaction()
        expect(orderServices.createPaymentTransaction).toHaveBeenCalledTimes(1)
        await state.refreshPaymentState()
        expect(state.canCreate.value).toBe(true)
        expect(state.paymentError.value).toBe('')
    })

    it.each([401, 404, 429])('處理 POST HTTP %s 並刷新狀態', async (status) => {
        orderServices.createPaymentTransaction.mockRejectedValue({ response: { status } })
        await state.createTransaction()
        expect(state.paymentError.value).not.toBe('')
        expect(refreshOrder).toHaveBeenCalledTimes(1)
        expect(state.busy.value).toBe(false)
    })

    it('不完整的 POST 成功回應仍視為結果不明，不重複建立或誤用付款資料', async () => {
        orderServices.createPaymentTransaction.mockResolvedValue({ status: 201, data: { data: { order_id: 2 } } })
        await state.createTransaction()
        expect(state.paymentError.value).toContain('結果尚未確認')
        expect(fetchPaymentCheckout).not.toHaveBeenCalled()
    })

    it('成功建立但付款資料尚未就緒時，重試只 GET 不再 POST', async () => {
        fetchPaymentCheckout.mockResolvedValueOnce(null)
        await state.createTransaction()
        expect(state.paymentError.value).toContain('仍在產生中')
        expect(state.checkout.value).toBeNull()
        await state.loadCheckout()
        expect(state.checkout.value).toEqual(checkout)
        expect(orderServices.createPaymentTransaction).toHaveBeenCalledTimes(1)
        expect(fetchPaymentCheckout).toHaveBeenCalledTimes(2)
    })

    it('取得既有交易付款資料不會新增交易', async () => {
        order.value = payableOrder(false)
        await state.loadCheckout()
        expect(fetchPaymentCheckout).toHaveBeenCalledTimes(1)
        expect(orderServices.createPaymentTransaction).not.toHaveBeenCalled()
    })

    it('取得付款資料失敗可再次取得，不會新增交易', async () => {
        fetchPaymentCheckout.mockRejectedValueOnce({ response: { status: 500 } })
        await state.loadCheckout()
        expect(state.paymentError.value).toContain('取得付款資料失敗')
        await state.loadCheckout()
        expect(state.checkout.value).toEqual(checkout)
        expect(orderServices.createPaymentTransaction).not.toHaveBeenCalled()
    })

    it('checkout 的 409 會重新取得訂單，隱藏已不能付款的入口', async () => {
        fetchPaymentCheckout.mockRejectedValueOnce({ response: { status: 409 } })
        refreshOrder.mockImplementation(async () => { order.value = { ...payableOrder(false), payment_status: 3 } })
        await state.loadCheckout()
        expect(refreshOrder).toHaveBeenCalledTimes(1)
        expect(state.canContinue.value).toBe(false)
        expect(state.checkout.value).toBeNull()
    })

    it.each([[1, 1], [3, 3], [3, 2], [3, 5]])('訂單狀態 %s、付款狀態 %s 不提供繼續付款', async (status, paymentStatus) => {
        order.value = { ...payableOrder(false), status, payment_status: paymentStatus }
        await state.loadCheckout()
        expect(state.canContinue.value).toBe(false)
        expect(fetchPaymentCheckout).not.toHaveBeenCalled()
    })

    it('POST 期間切換訂單，舊回應不更新新訂單或取得舊付款資料', async () => {
        let resolve
        orderServices.createPaymentTransaction.mockImplementationOnce(() => new Promise(done => { resolve = done }))
        const pending = state.createTransaction()
        orderId.value = '2'
        order.value = { ...payableOrder(), id: 2 }
        resolve({ status: 201, data: { data: { order_id: 1, payment_transaction_id: 10 } } })
        await pending
        expect(refreshOrder).not.toHaveBeenCalled()
        expect(fetchPaymentCheckout).not.toHaveBeenCalled()
        expect(state.paymentMessage.value).toBe('')
    })

    it('切換訂單或離開頁面時取消輪詢，忽略較慢的舊付款資料', async () => {
        let resolve
        fetchPaymentCheckout.mockImplementationOnce(() => new Promise(done => { resolve = done }))
        const pending = state.loadCheckout()
        const signal = fetchPaymentCheckout.mock.calls[0][1].signal
        orderId.value = '2'
        expect(signal.aborted).toBe(true)
        resolve(checkout)
        await pending
        expect(state.checkout.value).toBeNull()
        expect(state.busy.value).toBe(false)
        await state.loadCheckout()
        const nextSignal = fetchPaymentCheckout.mock.calls[1][1].signal
        scope.stop()
        expect(nextSignal.aborted).toBe(true)
    })
})
