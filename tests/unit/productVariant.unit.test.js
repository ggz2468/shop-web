import { describe, expect, it } from 'vitest'
import { PRODUCT_SIZE_LABELS, formatVariantName, getProductVariants } from '@/utils/productVariant'

describe('共用商品規格資料', () => {
    it.each([[1, 'XS'], [2, 'S'], [3, 'M'], [4, 'L'], [5, 'XL']])(
        '商品頁與訂單詳情共用尺寸 %s 對應的 %s',
        (size, label) => {
            expect(PRODUCT_SIZE_LABELS[size]).toBe(label)
            expect(formatVariantName({ spec: { color: '黑色', size } })).toBe(`黑色 / ${label}`)
        },
    )

    it('商品規格名稱保留缺值與未知尺寸的既有顯示方式', () => {
        expect(formatVariantName()).toBe('未標示顏色 / 未標示尺寸')
        expect(formatVariantName({ spec: { color: '白色', size: 99 } })).toBe('白色 / 99')
        expect(PRODUCT_SIZE_LABELS[99]).toBeUndefined()
    })

    it('只接受陣列形式的商品規格', () => {
        const variants = [{ id: 1 }]
        expect(getProductVariants({ variants })).toBe(variants)
        expect(getProductVariants()).toEqual([])
        expect(getProductVariants({ variants: null })).toEqual([])
    })
})
