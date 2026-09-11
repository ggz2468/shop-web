import { computed, nextTick, ref } from 'vue'
import { shipmentStoreMapRequestServices } from '@/services/shipmentStoreMapRequestService'
import { resolveApiErrorMessage } from '@/utils/apiError'
import { CONVENIENCE_STORE_SHIPPING_METHOD } from '@/utils/payment'

const STORE_MAP_SELECTION_TOKEN_STORAGE_KEY = 'checkout.storeMapSelectionToken'
const STORE_MAP_SHIPPING_METHOD_STORAGE_KEY = 'checkout.storeMapShippingMethod'
const STORE_MAP_STORE_TYPE_STORAGE_KEY = 'checkout.storeMapStoreType'

export const useCheckoutStoreSelection = ({ shippingMethod, submitting, paymentCheckout, errorMessage }) => {
    const storeType = ref('')
    const storeCode = ref('')
    const storeName = ref('')
    const storeAddress = ref('')
    const selectingStore = ref(false)
    const loadingStoreSelection = ref(false)
    const storeSelectionMessage = ref('')
    const storeMapCheckout = ref(null)
    const storeMapFormRef = ref(null)

    const storeMapFormInputs = computed(() => Object.entries(storeMapCheckout.value?.request_payload ?? {}))
    const isConvenienceStore = computed(() => shippingMethod.value === CONVENIENCE_STORE_SHIPPING_METHOD)
    const hasSelectedStore = computed(() => Boolean(storeCode.value.trim() && storeName.value.trim() && storeAddress.value.trim()))

    const clearSelectedStore = () => {
        storeCode.value = ''
        storeName.value = ''
        storeAddress.value = ''
        storeMapCheckout.value = null
        storeSelectionMessage.value = ''
        sessionStorage.removeItem(STORE_MAP_SELECTION_TOKEN_STORAGE_KEY)
        sessionStorage.removeItem(STORE_MAP_SHIPPING_METHOD_STORAGE_KEY)
        sessionStorage.removeItem(STORE_MAP_STORE_TYPE_STORAGE_KEY)
    }

    const resetStoreFields = () => {
        storeType.value = ''
        clearSelectedStore()
    }

    const resetSelectedStore = () => {
        clearSelectedStore()
    }

    const handleStoreTypeChange = () => {
        resetSelectedStore()
    }

    const getStorePayload = () => ({
        store_type: storeType.value,
        store_code: storeCode.value.trim(),
        store_name: storeName.value.trim(),
        store_address: storeAddress.value.trim(),
    })

    const validateStoreSelection = () => {
        if (!isConvenienceStore.value) {
            return true
        }

        if (!storeType.value || !hasSelectedStore.value) {
            errorMessage.value = '請先選擇超商門市。'
            return false
        }

        return true
    }

    const applyStoreSelection = (selectionResult) => {
        const storedShippingMethod = Number(sessionStorage.getItem(STORE_MAP_SHIPPING_METHOD_STORAGE_KEY))
        const storedStoreType = sessionStorage.getItem(STORE_MAP_STORE_TYPE_STORAGE_KEY)

        shippingMethod.value = storedShippingMethod || CONVENIENCE_STORE_SHIPPING_METHOD
        storeType.value = storedStoreType || selectionResult.store_type || storeType.value
        storeCode.value = selectionResult.store?.code ?? ''
        storeName.value = selectionResult.store?.name ?? ''
        storeAddress.value = selectionResult.store?.address ?? ''
        storeSelectionMessage.value = selectionResult.selected ? '已取得超商門市資訊。' : '尚未取得超商門市資訊，請完成門市選擇。'
    }

    const loadStoreSelection = async () => {
        const selectionToken = sessionStorage.getItem(STORE_MAP_SELECTION_TOKEN_STORAGE_KEY)

        if (!selectionToken) {
            return
        }

        loadingStoreSelection.value = true
        storeSelectionMessage.value = ''

        try {
            const response = await shipmentStoreMapRequestServices.getSelectionResult(selectionToken)
            applyStoreSelection(response.data?.data ?? {})
        } catch (error) {
            if (error.response?.status === 404 || error.response?.status === 410) {
                sessionStorage.removeItem(STORE_MAP_SELECTION_TOKEN_STORAGE_KEY)
                storeCode.value = ''
                storeName.value = ''
                storeAddress.value = ''
            }

            errorMessage.value = resolveApiErrorMessage(error, '取得超商門市資訊失敗，請重新選擇門市。') ?? ''
        } finally {
            loadingStoreSelection.value = false
        }
    }

    const handleSelectStore = async () => {
        if (selectingStore.value || submitting.value || paymentCheckout.value !== null) {
            return
        }

        if (!storeType.value) {
            errorMessage.value = '請先選擇超商類型。'
            return
        }

        selectingStore.value = true
        errorMessage.value = ''
        storeSelectionMessage.value = ''

        try {
            const response = await shipmentStoreMapRequestServices.create({ store_type: storeType.value })
            storeMapCheckout.value = response.data?.data ?? null

            if (!storeMapCheckout.value?.selection_token || !storeMapCheckout.value?.checkout_payload || !storeMapCheckout.value?.request_payload) {
                errorMessage.value = '電子地圖資料建立失敗，請稍後再試。'
                return
            }

            sessionStorage.setItem(STORE_MAP_SELECTION_TOKEN_STORAGE_KEY, storeMapCheckout.value.selection_token)
            sessionStorage.setItem(STORE_MAP_SHIPPING_METHOD_STORAGE_KEY, String(shippingMethod.value))
            sessionStorage.setItem(STORE_MAP_STORE_TYPE_STORAGE_KEY, storeType.value)
            await nextTick()
            storeMapFormRef.value?.submit()
        } catch (error) {
            errorMessage.value = resolveApiErrorMessage(error, '建立電子地圖選店請求失敗，請稍後再試。') ?? ''
        } finally {
            selectingStore.value = false
        }
    }

    return {
        storeType,
        storeCode,
        storeName,
        storeAddress,
        selectingStore,
        loadingStoreSelection,
        storeSelectionMessage,
        storeMapCheckout,
        storeMapFormRef,
        storeMapFormInputs,
        isConvenienceStore,
        hasSelectedStore,
        resetStoreFields,
        resetSelectedStore,
        handleStoreTypeChange,
        getStorePayload,
        validateStoreSelection,
        loadStoreSelection,
        handleSelectStore,
    }
}