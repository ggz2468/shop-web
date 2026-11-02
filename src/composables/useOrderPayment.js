import { computed, onScopeDispose, ref, watch } from 'vue'
import { orderServices } from '@/services/orderService'
import { resolveApiErrorMessage } from '@/utils/apiError'
import { fetchPaymentCheckout } from '@/utils/paymentCheckout'

export const useOrderPayment = ({ order, orderId, refreshOrder }) => {
    const creating = ref(false)
    const loadingCheckout = ref(false)
    const refreshing = ref(false)
    const checkout = ref(null)
    const paymentError = ref('')
    const paymentMessage = ref('')
    const creationBlocked = ref(false)
    let version = 0
    let checkoutController

    const busy = computed(() => creating.value || loadingCheckout.value || refreshing.value)
    const canCreate = computed(() => (
        order.value?.actions?.can_create_payment_transaction === true && !creationBlocked.value
    ))
    // 僅控制既有交易的付款入口，實際可否付款仍由 checkout API 判斷。
    const canContinue = computed(() => order.value?.status === 3 && order.value?.payment_status === 1)

    const reset = () => {
        version += 1
        checkoutController?.abort()
        creating.value = false
        loadingCheckout.value = false
        refreshing.value = false
        checkout.value = null
        paymentError.value = ''
        paymentMessage.value = ''
        creationBlocked.value = false
    }

    watch(orderId, reset, { flush: 'sync' })
    onScopeDispose(reset)

    const loadCheckout = async () => {
        if (busy.value || !canContinue.value) return

        const current = version
        const id = orderId.value
        checkoutController = new AbortController()
        loadingCheckout.value = true
        checkout.value = null
        paymentError.value = ''
        paymentMessage.value = ''

        try {
            const result = await fetchPaymentCheckout(id, { signal: checkoutController.signal })
            if (current !== version) return
            if (!result) {
                paymentError.value = '付款資料仍在產生中，請稍後重新取得。'
                return
            }
            checkout.value = result
            paymentMessage.value = '付款資料已就緒，請前往付款。'
        } catch (error) {
            if (current !== version) return
            paymentError.value = resolveApiErrorMessage(error, '取得付款資料失敗，請稍後重新取得。')
                ?? '請先登入會員以付款。'
            if ([404, 409].includes(error.response?.status)) {
                await refreshOrder(id)
            }
        } finally {
            if (current === version) loadingCheckout.value = false
        }
    }

    const createTransaction = async () => {
        if (busy.value || !canCreate.value) return

        const current = version
        const id = orderId.value
        let created = false
        creating.value = true
        creationBlocked.value = true
        checkout.value = null
        paymentError.value = ''
        paymentMessage.value = ''

        try {
            const response = await orderServices.createPaymentTransaction(id)
            if (current !== version) return
            if (response.status !== 201
                || String(response.data?.data?.order_id) !== String(id)
                || !Number.isInteger(response.data?.data?.payment_transaction_id)
                || response.data.data.payment_transaction_id < 1) {
                throw new Error('Invalid payment transaction response')
            }
            created = true
            paymentMessage.value = '付款交易已建立。'
        } catch (error) {
            if (current !== version) return
            paymentError.value = !error.response || error.response.status >= 500
                ? '付款交易建立結果尚未確認，請先重新整理訂單，勿重複新增交易。'
                : resolveApiErrorMessage(error, '新增付款交易失敗，請重新整理訂單後再試。')
                    ?? '請先登入會員以付款。'
        } finally {
            if (current === version) {
                await refreshOrder(id)
                if (current === version) creating.value = false
            }
        }

        if (current === version && created && canContinue.value) {
            await loadCheckout()
        }
    }

    const refreshPaymentState = async () => {
        if (busy.value) return
        const current = version
        refreshing.value = true
        checkout.value = null
        try {
            await refreshOrder(orderId.value)
            if (current === version && order.value) {
                creationBlocked.value = false
                paymentError.value = ''
                paymentMessage.value = ''
            }
        } finally {
            if (current === version) refreshing.value = false
        }
    }

    return {
        busy, creating, loadingCheckout, checkout, canCreate, canContinue,
        paymentError, paymentMessage, createTransaction, loadCheckout, refreshPaymentState,
    }
}
