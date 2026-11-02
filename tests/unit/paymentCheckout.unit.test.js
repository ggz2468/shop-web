import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchPaymentCheckout } from '@/utils/paymentCheckout'
import { orderServices } from '@/services/orderService'
import { delay } from '@/utils/delay'

vi.mock('@/services/orderService', () => ({ orderServices: { getPaymentCheckout: vi.fn() } }))
vi.mock('@/utils/delay', () => ({ delay: vi.fn() }))

const ready = {
    order_id: 1, amount: 880, currency: 'TWD',
    checkout_payload: { action: 'https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5', method: 'POST' },
    request_payload: { MerchantTradeNo: 'PAY_TEST' },
}

describe('共用付款資料輪詢', () => {
    beforeEach(() => {
        vi.resetAllMocks()
        delay.mockResolvedValue()
        orderServices.getPaymentCheckout.mockResolvedValue({ status: 200, data: { data: ready } })
    })

    it('202 後再取得 200 才回傳資料，沿用一秒輪詢間隔', async () => {
        orderServices.getPaymentCheckout.mockResolvedValueOnce({ status: 202 })
        expect(await fetchPaymentCheckout(1)).toEqual(ready)
        expect(orderServices.getPaymentCheckout).toHaveBeenCalledTimes(2)
        expect(delay).toHaveBeenCalledExactlyOnceWith(1000)
    })

    it('最多十次 GET，未就緒時回傳 null，不建立付款交易', async () => {
        orderServices.getPaymentCheckout.mockResolvedValue({ status: 202 })
        expect(await fetchPaymentCheckout(1)).toBeNull()
        expect(orderServices.getPaymentCheckout).toHaveBeenCalledTimes(10)
        expect(delay).toHaveBeenCalledTimes(9)
    })

    it.each([
        null,
        { ...ready, order_id: 2 },
        { ...ready, checkout_payload: null },
        { ...ready, checkout_payload: { action: 'javascript:alert(1)', method: 'POST' } },
        { ...ready, checkout_payload: { action: 'https://example.test', method: 'GET' } },
        { ...ready, request_payload: null },
        { ...ready, request_payload: {} },
        { ...ready, amount: '880' },
    ])('拒絕錯誤訂單或不完整付款資料 %#', async (result) => {
        orderServices.getPaymentCheckout.mockResolvedValue({ status: 200, data: { data: result } })
        await expect(fetchPaymentCheckout(1)).rejects.toThrow('Invalid payment checkout response')
    })

    it('非預期成功狀態或 HTTP 失敗均向外回報，不偽裝成尚未就緒', async () => {
        orderServices.getPaymentCheckout.mockResolvedValueOnce({ status: 204 })
        await expect(fetchPaymentCheckout(1)).rejects.toThrow('Unexpected payment checkout status')
        const failure = { response: { status: 409 } }
        orderServices.getPaymentCheckout.mockRejectedValueOnce(failure)
        await expect(fetchPaymentCheckout(1)).rejects.toBe(failure)
    })

    it('已取消的請求不再呼叫 API', async () => {
        const controller = new AbortController()
        controller.abort()
        await expect(fetchPaymentCheckout(1, { signal: controller.signal })).rejects.toThrow()
        expect(orderServices.getPaymentCheckout).not.toHaveBeenCalled()
    })

    it('等待期間取消後不再送出下一次請求', async () => {
        const controller = new AbortController()
        orderServices.getPaymentCheckout.mockResolvedValueOnce({ status: 202 })
        delay.mockImplementationOnce(async () => { controller.abort() })
        await expect(fetchPaymentCheckout(1, { signal: controller.signal })).rejects.toThrow()
        expect(orderServices.getPaymentCheckout).toHaveBeenCalledTimes(1)
    })
})
