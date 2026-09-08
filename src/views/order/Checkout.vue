<script setup>
import { computed, onMounted, ref } from 'vue'
import { orderServices } from '@/services/orderService'
import { useCart } from '@/composables/useCart'
import { resolveApiErrorMessage } from '@/utils/apiError'
import { delay } from '@/utils/delay'
import { PAYMENT_METHODS, DEFAULT_PAYMENT_METHOD } from '@/utils/payment'
import CartItemProduct from '@/components/cart/CartItemProduct.vue'
import CenteredState from '@/components/layout/CenteredState.vue'

// 付款資料由背景任務產生，需輪詢等待其就緒
const PAYMENT_CHECKOUT_MAX_ATTEMPTS = 10
const PAYMENT_CHECKOUT_RETRY_INTERVAL = 1000

const { items, totalQuantity, loading, errorMessage, hasItems, loadCart } = useCart()
const paymentMethod = ref(DEFAULT_PAYMENT_METHOD)
const submitting = ref(false)
const order = ref(null)
const paymentCheckout = ref(null)
const paymentFormRef = ref(null)
// 同一次結帳沿用相同的冪等鍵，避免重試時建立重複訂單
let idempotencyKey = null

const paymentFormInputs = computed(() => Object.entries(paymentCheckout.value?.request_payload ?? {}))

const fetchPaymentCheckout = async (orderId) => {
    for (let attempt = 0; attempt < PAYMENT_CHECKOUT_MAX_ATTEMPTS; attempt += 1) {
        const response = await orderServices.getPaymentCheckout(orderId)

        if (response.status === 200) {
            return response.data?.data ?? null
        }

        await delay(PAYMENT_CHECKOUT_RETRY_INTERVAL)
    }

    return null
}

const handleConfirmOrder = async () => {
    if (submitting.value || !hasItems.value) {
        return
    }

    submitting.value = true
    errorMessage.value = ''
    idempotencyKey = idempotencyKey ?? crypto.randomUUID()

    try {
        const orderResponse = await orderServices.createOrder({ payment_method: paymentMethod.value }, idempotencyKey)
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

onMounted(loadCart)
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

            <div v-if="loading" class="text-center py-5">載入中...</div>

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
                            :disabled="submitting || paymentCheckout !== null"
                        >
                            <option v-for="method in PAYMENT_METHODS" :key="method.value" :value="method.value">
                                {{ method.label }}
                            </option>
                        </select>
                    </div>

                    <button
                        v-if="!paymentCheckout"
                        type="button"
                        class="btn btn-primary"
                        :disabled="submitting"
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

.checkout-panel__order {
    margin: 0;
    text-align: center;
}
</style>
