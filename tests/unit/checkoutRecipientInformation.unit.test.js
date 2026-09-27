import { computed, ref } from 'vue'
import { beforeEach, describe, expect, it } from 'vitest'
import { useCheckoutRecipientInformation } from '@/composables/useCheckoutRecipientInformation'

const createMemoryStorage = () => {
    const values = new Map()

    return {
        getItem: (key) => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, String(value)),
        removeItem: (key) => values.delete(key),
        clear: () => values.clear(),
    }
}

describe('useCheckoutRecipientInformation', () => {
    beforeEach(() => {
        globalThis.sessionStorage = createMemoryStorage()
    })

    it('暫存並還原 checkout 收件資訊', () => {
        const shippingMethod = ref('CVS')
        const errorMessage = ref('')
        const recipientInformation = useCheckoutRecipientInformation({
            isHomeDelivery: computed(() => shippingMethod.value === 'HOME'),
            errorMessage,
        })

        recipientInformation.recipientName.value = ' 王小明 '
        recipientInformation.recipientPhone.value = ' 0912345678 '

        const restoredRecipientInformation = useCheckoutRecipientInformation({
            isHomeDelivery: computed(() => shippingMethod.value === 'HOME'),
            errorMessage,
        })
        restoredRecipientInformation.restoreRecipientInformation()

        expect(restoredRecipientInformation.recipientName.value).toBe('王小明')
        expect(restoredRecipientInformation.recipientPhone.value).toBe('0912345678')
    })

    it('宅配 payload 包含收件郵遞區號與地址', () => {
        const errorMessage = ref('')
        const recipientInformation = useCheckoutRecipientInformation({
            isHomeDelivery: computed(() => true),
            errorMessage,
        })

        recipientInformation.recipientName.value = '王小明'
        recipientInformation.recipientPhone.value = '0912345678'
        recipientInformation.recipientZipCode.value = '100'
        recipientInformation.recipientAddress.value = '台北市信義區測試路 1 號'

        expect(recipientInformation.getRecipientPayload()).toEqual({
            recipient_name: '王小明',
            recipient_phone: '0912345678',
            recipient_zip_code: '100',
            recipient_address: '台北市信義區測試路 1 號',
        })
    })

    it('超商取貨 payload 不包含宅配地址欄位', () => {
        const errorMessage = ref('')
        const recipientInformation = useCheckoutRecipientInformation({
            isHomeDelivery: computed(() => false),
            errorMessage,
        })

        recipientInformation.recipientName.value = '王小明'
        recipientInformation.recipientPhone.value = '0912345678'
        recipientInformation.recipientZipCode.value = '100'
        recipientInformation.recipientAddress.value = '台北市信義區測試路 1 號'

        expect(recipientInformation.getRecipientPayload()).toEqual({
            recipient_name: '王小明',
            recipient_phone: '0912345678',
        })
    })

    it('宅配缺少郵遞區號或地址時驗證失敗', () => {
        const errorMessage = ref('')
        const recipientInformation = useCheckoutRecipientInformation({
            isHomeDelivery: computed(() => true),
            errorMessage,
        })

        recipientInformation.recipientName.value = '王小明'
        recipientInformation.recipientPhone.value = '0912345678'

        expect(recipientInformation.validateRecipientInformation()).toBe(false)
        expect(errorMessage.value).toBe('宅配到家需填寫收件郵遞區號與地址。')
    })
})
