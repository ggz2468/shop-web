import { describe, expect, it } from 'vitest'
import {
    CONVENIENCE_STORE_SHIPPING_METHOD_CODE,
    HOME_DELIVERY_SHIPPING_METHOD_CODE,
    findOptionValueByCode,
    findOptionLabelByValue,
    hasOrderDisplayOptions,
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
            { value: 1, code: HOME_DELIVERY_SHIPPING_METHOD_CODE },
            { value: 2, code: CONVENIENCE_STORE_SHIPPING_METHOD_CODE },
        ]

        expect(findOptionValueByCode(options, HOME_DELIVERY_SHIPPING_METHOD_CODE)).toBe(1)
        expect(findOptionValueByCode(options, CONVENIENCE_STORE_SHIPPING_METHOD_CODE)).toBe(2)
        expect(findOptionValueByCode(options, 'UNKNOWN')).toBeNull()
    })

    const displayOptions = {
        order_statuses: [{ value: 3, label: '產品備貨中' }],
        payment_statuses: [{ value: 1, label: '未付款' }],
        payment_methods: [{ value: 1, label: '信用卡' }],
        shipping_methods: [{ value: 1, label: '宅配' }],
    }

    it('列表與詳情所需字典完整時才接受，超商字典不是共通必填欄位', () => {
        expect(hasOrderDisplayOptions(displayOptions)).toBe(true)
        expect(hasOrderDisplayOptions()).toBe(false)
        expect(hasOrderDisplayOptions(null)).toBe(false)
    })

    it.each(Object.keys(displayOptions))('拒絕缺少、空白或非陣列的 %s 字典', (key) => {
        for (const invalid of [undefined, null, [], {}]) {
            expect(hasOrderDisplayOptions({ ...displayOptions, [key]: invalid })).toBe(false)
        }
    })

    it('依嚴格型別查找數字與字串選項，找不到時維持未知提示', () => {
        expect(findOptionLabelByValue(displayOptions.order_statuses, 3)).toBe('產品備貨中')
        expect(findOptionLabelByValue(displayOptions.order_statuses, '3')).toBe('未知（3）')
        expect(findOptionLabelByValue([{ value: 'FAMI', label: '全家' }], 'FAMI')).toBe('全家')
        expect(findOptionLabelByValue(displayOptions.order_statuses, 99)).toBe('未知（99）')
        expect(findOptionLabelByValue(undefined, 1)).toBe('未知（1）')
        expect(findOptionLabelByValue([], null)).toBe('未知（null）')
        expect(findOptionLabelByValue([{ value: 1 }], 1)).toBe('未知（1）')
    })
})