import { computed, ref, watch } from 'vue'

const CHECKOUT_RECIPIENT_INFORMATION_STORAGE_KEY = 'checkout.recipientInformation'

export const useCheckoutRecipientInformation = ({ isHomeDelivery, errorMessage }) => {
    const recipientName = ref('')
    const recipientPhone = ref('')
    const recipientZipCode = ref('')
    const recipientAddress = ref('')

    const hasRequiredRecipientFields = computed(() => Boolean(
        recipientName.value.trim()
        && recipientPhone.value.trim()
        && (!isHomeDelivery.value || (recipientZipCode.value.trim() && recipientAddress.value.trim()))
    ))

    const clearRecipientInformation = () => {
        sessionStorage.removeItem(CHECKOUT_RECIPIENT_INFORMATION_STORAGE_KEY)
    }

    const restoreRecipientInformation = () => {
        const storedRecipientInformation = sessionStorage.getItem(CHECKOUT_RECIPIENT_INFORMATION_STORAGE_KEY)

        if (!storedRecipientInformation) {
            return
        }

        try {
            const recipientInformation = JSON.parse(storedRecipientInformation)

            recipientName.value = recipientInformation.name ?? ''
            recipientPhone.value = recipientInformation.phone ?? ''
            recipientZipCode.value = recipientInformation.zipCode ?? ''
            recipientAddress.value = recipientInformation.address ?? ''
        } catch {
            clearRecipientInformation()
        }
    }

    const persistRecipientInformation = () => {
        const recipientInformation = {
            name: recipientName.value.trim(),
            phone: recipientPhone.value.trim(),
            zipCode: recipientZipCode.value.trim(),
            address: recipientAddress.value.trim(),
        }

        if (
            !recipientInformation.name
            && !recipientInformation.phone
            && !recipientInformation.zipCode
            && !recipientInformation.address
        ) {
            clearRecipientInformation()
            return
        }

        sessionStorage.setItem(CHECKOUT_RECIPIENT_INFORMATION_STORAGE_KEY, JSON.stringify(recipientInformation))
    }

    const getRecipientPayload = () => ({
        recipient_name: recipientName.value.trim(),
        recipient_phone: recipientPhone.value.trim(),
        ...(isHomeDelivery.value ? {
            recipient_zip_code: recipientZipCode.value.trim(),
            recipient_address: recipientAddress.value.trim(),
        } : {}),
    })

    const validateRecipientInformation = () => {
        if (!recipientName.value.trim() || !recipientPhone.value.trim()) {
            errorMessage.value = '請填寫收件人姓名與電話。'
            return false
        }

        if (isHomeDelivery.value && (!recipientZipCode.value.trim() || !recipientAddress.value.trim())) {
            errorMessage.value = '宅配到家需填寫收件郵遞區號與地址。'
            return false
        }

        return true
    }

    watch([recipientName, recipientPhone, recipientZipCode, recipientAddress], persistRecipientInformation, { flush: 'sync' })

    return {
        recipientName,
        recipientPhone,
        recipientZipCode,
        recipientAddress,
        hasRequiredRecipientFields,
        clearRecipientInformation,
        restoreRecipientInformation,
        getRecipientPayload,
        validateRecipientInformation,
    }
}
