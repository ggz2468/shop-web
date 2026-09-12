import { describe, expect, it } from 'vitest'
import {
    CONVENIENCE_STORE_SHIPPING_METHOD_CODE,
    findOptionValueByCode,
    normalizeOrderOptions,
} from '@/utils/orderOptions'

describe('orderOptions', () => {
    it('正規化訂單選項 API 回傳資料', () => {
        const data = {
            payment_methods: [{ value: 1, code: 'CREDIT_CARD', label: '信用卡' }],
            shipping_methods: [{ value: 2, code: CONVENIENCE_STORE_SHIPPING_METHOD_CODE, label: '超商取貨' }],
            store_types: [{ value: 'UNIMART', code: 'UNIMART', label: '7-ELEVEN' }],
            defaults: {
                payment_method: 1,
                shipping_method: 2,
            },
        }

        expect(normalizeOrderOptions(data)).toEqual({
            paymentMethods: data.payment_methods,
            shippingMethods: data.shipping_methods,
            storeTypes: data.store_types,
            defaults: data.defaults,
        })
    })

    it('API 回傳資料缺少陣列時提供空陣列', () => {
        expect(normalizeOrderOptions()).toEqual({
            paymentMethods: [],
            shippingMethods: [],
            storeTypes: [],
            defaults: {},
        })
    })

    it('依 code 取得選項 value', () => {
        const options = [
            { value: 1, code: 'HOME_DELIVERY' },
            { value: 2, code: CONVENIENCE_STORE_SHIPPING_METHOD_CODE },
        ]

        expect(findOptionValueByCode(options, CONVENIENCE_STORE_SHIPPING_METHOD_CODE)).toBe(2)
        expect(findOptionValueByCode(options, 'UNKNOWN')).toBeNull()
    })
})