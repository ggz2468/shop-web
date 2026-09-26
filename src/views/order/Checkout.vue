<script setup>
import { computed, onMounted, ref } from 'vue'
import { orderServices } from '@/services/orderService'
import { useCart } from '@/composables/useCart'
import { useCheckoutStoreSelection } from '@/composables/useCheckoutStoreSelection'
import { useOrderOptions } from '@/composables/useOrderOptions'
import { resolveApiErrorMessage } from '@/utils/apiError'
import { fetchPaymentCheckout } from '@/utils/paymentCheckout'
import CartItemProduct from '@/components/cart/CartItemProduct.vue'
import CenteredState from '@/components/layout/CenteredState.vue'

const { items, totalQuantity, loading, errorMessage, hasItems, loadCart } = useCart()
const paymentMethod = ref(null)
const shippingMethod = ref(null)
const recipientName = ref('')
const recipientPhone = ref('')
const recipientAddress = ref('')
const submitting = ref(false)
const order = ref(null)
const paymentCheckout = ref(null)
const paymentFormRef = ref(null)
// 同一次結帳沿用相同的冪等鍵，避免重試時建立重複訂單
let idempotencyKey = null

const {
    paymentMethods,
    shippingMethods,
    storeTypes,
    defaultPaymentMethod,
    defaultShippingMethod,
    convenienceStoreShippingMethod,
    homeDeliveryShippingMethod,
    hasOrderOptions,
    loadingOrderOptions,
    loadOrderOptions,
} = useOrderOptions({ errorMessage })

const loadingCheckout = computed(() => loading.value || loadingOrderOptions.value)
const isHomeDelivery = computed(() => (
    homeDeliveryShippingMethod.value !== null
    && shippingMethod.value === homeDeliveryShippingMethod.value
))
const hasRequiredRecipientFields = computed(() => Boolean(
    recipientName.value.trim()
    && recipientPhone.value.trim()
    && (!isHomeDelivery.value || recipientAddress.value.trim())
))

const {
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
    handleStoreTypeChange,
    getStorePayload,
    validateStoreSelection,
    loadStoreSelection,
    handleSelectStore,
} = useCheckoutStoreSelection({
    shippingMethod,
    convenienceStoreShippingMethod,
    submitting,
    paymentCheckout,
    errorMessage,
})

const paymentFormInputs = computed(() => Object.entries(paymentCheckout.value?.request_payload ?? {}))

const buildOrderPayload = () => ({
    payment_method: paymentMethod.value,
    shipping_method: shippingMethod.value,
    recipient_name: recipientName.value.trim(),
    recipient_phone: recipientPhone.value.trim(),
    ...(isHomeDelivery.value ? { recipient_address: recipientAddress.value.trim() } : {}),
    ...(isConvenienceStore.value ? getStorePayload() : {}),
})

const validateRecipientInformation = () => {
    if (!recipientName.value.trim() || !recipientPhone.value.trim()) {
        errorMessage.value = '請填寫收件人姓名與電話。'
        return false
    }

    if (isHomeDelivery.value && !recipientAddress.value.trim()) {
        errorMessage.value = '宅配到家需填寫收件地址。'
        return false
    }

    return true
}

const handleConfirmOrder = async () => {
    if (submitting.value || !hasItems.value || !hasOrderOptions.value) {
        return
    }

    if (!validateRecipientInformation()) {
        return
    }

    if (!validateStoreSelection()) {
        return
    }

    submitting.value = true
    errorMessage.value = ''
    idempotencyKey = idempotencyKey ?? crypto.randomUUID()

    try {
        const orderResponse = await orderServices.createOrder(buildOrderPayload(), idempotencyKey)
        order.value = orderResponse.data?.data ?? null

        if (!order.value?.id) {
            errorMessage.value = '訂單建立失敗，請稍後再試。'
            return
        }

        const checkout = await fetchPaymentCheckout(order.value.id)

        if (!checkout) {
            errorMessage.value = '付款資料尚未就緒，請稍後再試。'
            return
        }

        paymentCheckout.value = checkout
    } catch (error) {
        errorMessage.value = resolveApiErrorMessage(error, '結帳失敗，請稍後再試。') ?? ''
    } finally {
        submitting.value = false
    }
}

const submitPaymentForm = () => {
    paymentFormRef.value?.submit()
}

onMounted(async () => {
    await Promise.all([
        loadCart(),
        loadOrderOptions(),
    ])

    paymentMethod.value = defaultPaymentMethod.value
    shippingMethod.value = defaultShippingMethod.value
    await loadStoreSelection()
})
</script>

<template>
    <div class="container-fluid p-3">
        <div class="content-header">
            <h2 class="title">確認訂單</h2>
            <hr class="divider">
        </div>

        <div class="content-body">
            <div v-if="errorMessage" class="alert alert-danger" role="alert">
                {{ errorMessage }}
            </div>

            <div v-if="loadingCheckout" class="text-center py-5">載入中...</div>

            <CenteredState
                v-else-if="!hasItems"
                title="購物車是空的"
                message="請先將產品加入購物車後再進行結帳。"
                action-text="查看所有產品"
                :action-to="{ name: 'ProductList' }"
            />

            <template v-else>
                <div class="table-responsive">
                    <table class="table align-middle checkout-table">
                        <thead>
                            <tr>
                                <th scope="col">產品</th>
                                <th scope="col">數量</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="item in items" :key="item.product_variant_id">
                                <td>
                                    <CartItemProduct :name="item.product_name" :image-path="item.product_image_path" />
                                </td>
                                <td>{{ item.quantity }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="checkout-panel">
                    <span class="checkout-panel__total">訂單總數量：{{ totalQuantity }}</span>

                    <div class="checkout-panel__field">
                        <label for="checkout-payment-method" class="form-label">付款方式</label>
                        <select
                            id="checkout-payment-method"
                            v-model.number="paymentMethod"
                            class="form-select"
                            :disabled="submitting || paymentCheckout !== null || !hasOrderOptions"
                        >
                            <option v-for="method in paymentMethods" :key="method.value" :value="method.value">
                                {{ method.label }}
                            </option>
                        </select>
                    </div>

                    <div class="checkout-panel__field">
                        <label for="checkout-shipping-method" class="form-label">配送方式</label>
                        <select
                            id="checkout-shipping-method"
                            v-model.number="shippingMethod"
                            class="form-select"
                            :disabled="submitting || paymentCheckout !== null || !hasOrderOptions"
                            @change="!isConvenienceStore && resetStoreFields()"
                        >
                            <option v-for="method in shippingMethods" :key="method.value" :value="method.value">
                                {{ method.label }}
                            </option>
                        </select>
                    </div>

                    <div class="checkout-recipient-fields">
                        <div class="checkout-panel__field">
                            <label for="checkout-recipient-name" class="form-label">收件人姓名</label>
                            <input
                                id="checkout-recipient-name"
                                v-model.trim="recipientName"
                                type="text"
                                class="form-control"
                                maxlength="50"
                                required
                                :disabled="submitting || paymentCheckout !== null"
                            >
                        </div>

                        <div class="checkout-panel__field">
                            <label for="checkout-recipient-phone" class="form-label">收件人電話</label>
                            <input
                                id="checkout-recipient-phone"
                                v-model.trim="recipientPhone"
                                type="tel"
                                class="form-control"
                                maxlength="20"
                                required
                                :disabled="submitting || paymentCheckout !== null"
                            >
                        </div>

                        <div v-if="isHomeDelivery" class="checkout-panel__field checkout-panel__field--wide">
                            <label for="checkout-recipient-address" class="form-label">收件地址</label>
                            <input
                                id="checkout-recipient-address"
                                v-model.trim="recipientAddress"
                                type="text"
                                class="form-control"
                                maxlength="500"
                                required
                                :disabled="submitting || paymentCheckout !== null"
                            >
                        </div>
                    </div>

                    <div v-if="isConvenienceStore" class="checkout-store-fields">
                        <div class="checkout-panel__field">
                            <label for="checkout-store-type" class="form-label">超商類型</label>
                            <select
                                id="checkout-store-type"
                                v-model="storeType"
                                class="form-select"
                                :disabled="submitting || selectingStore || paymentCheckout !== null"
                                required
                                @change="handleStoreTypeChange"
                            >
                                <option value="" disabled>請選擇超商類型</option>
                                <option v-for="store in storeTypes" :key="store.value" :value="store.value">
                                    {{ store.label }}
                                </option>
                            </select>
                        </div>

                        <form
                            v-if="storeMapCheckout"
                            ref="storeMapFormRef"
                            :action="storeMapCheckout.checkout_payload.action"
                            :method="storeMapCheckout.checkout_payload.method"
                        >
                            <input
                                v-for="[name, value] in storeMapFormInputs"
                                :key="name"
                                type="hidden"
                                :name="name"
                                :value="value"
                            >
                        </form>

                        <button
                            type="button"
                            class="btn btn-outline-primary"
                            :disabled="!storeType || submitting || selectingStore || paymentCheckout !== null"
                            @click="handleSelectStore"
                        >
                            {{ selectingStore ? '開啟電子地圖中...' : '選擇超商門市' }}
                        </button>

                        <div v-if="loadingStoreSelection" class="text-secondary small">
                            取得超商門市資訊中...
                        </div>

                        <div v-else-if="hasSelectedStore" class="selected-store">
                            <div class="selected-store__title">已選擇門市</div>
                            <div>{{ storeName }}（{{ storeCode }}）</div>
                            <div>{{ storeAddress }}</div>
                        </div>

                        <div v-else-if="storeSelectionMessage" class="text-secondary small">
                            {{ storeSelectionMessage }}
                        </div>
                    </div>

                    <button
                        v-if="!paymentCheckout"
                        type="button"
                        class="btn btn-primary"
                        :disabled="submitting || !hasOrderOptions || !hasRequiredRecipientFields || (isConvenienceStore && !hasSelectedStore)"
                        @click="handleConfirmOrder"
                    >
                        {{ submitting ? '處理中...' : '確認結帳' }}
                    </button>

                    <template v-else>
                        <p class="checkout-panel__order">
                            訂單編號：{{ paymentCheckout.order_number }}<br>
                            應付金額：{{ paymentCheckout.currency }} {{ paymentCheckout.amount }}
                        </p>

                        <form
                            ref="paymentFormRef"
                            :action="paymentCheckout.checkout_payload.action"
                            :method="paymentCheckout.checkout_payload.method"
                        >
                            <input
                                v-for="[name, value] in paymentFormInputs"
                                :key="name"
                                type="hidden"
                                :name="name"
                                :value="value"
                            >
                        </form>

                        <button type="button" class="btn btn-success" @click="submitPaymentForm">
                            確認付款結帳
                        </button>
                    </template>
                </div>
            </template>
        </div>
    </div>
</template>

<style scoped>
.checkout-table {
    max-width: 720px;
    margin: 0 auto;
}

.checkout-panel {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    margin-top: 1rem;
}

.checkout-panel__total {
    font-weight: 600;
}

.checkout-panel__field {
    width: min(100%, 16rem);
}

.checkout-panel__field--wide {
    width: min(100%, 22rem);
}

.checkout-recipient-fields {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    width: min(100%, 22rem);
}

.checkout-store-fields {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    width: min(100%, 22rem);
}

.checkout-panel__order {
    margin: 0;
    text-align: center;
}

.selected-store {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d7e7dd;
    border-radius: 0.5rem;
    background: #f6fbf7;
    color: #1f3d2a;
    text-align: left;
}

.selected-store__title {
    margin-bottom: 0.25rem;
    font-weight: 600;
}
</style>
