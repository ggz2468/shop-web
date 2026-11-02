<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useOrderDetail } from '@/composables/useOrderDetail'
import { formatOrderMoney, formatOrderDate } from '@/utils/orderFormatting'
import { PRODUCT_SIZE_LABELS } from '@/utils/productVariant'
import { useOrderPayment } from '@/composables/useOrderPayment'
import PaymentCheckoutForm from '@/components/order/PaymentCheckoutForm.vue'

const route = useRoute()
const { order, loading, errorMessage, notFound, loadOrder, optionLabel } = useOrderDetail()
const {
    busy, creating, loadingCheckout, checkout, canCreate, canContinue,
    paymentError, paymentMessage, createTransaction, loadCheckout, refreshPaymentState,
} = useOrderPayment({ order, orderId: computed(() => route.params.id), refreshOrder: loadOrder })
const submittingPayment = ref(false)

const handlePageShow = (event) => {
    if (event.persisted) {
        submittingPayment.value = false
        refreshPaymentState()
    }
}
onMounted(() => window.addEventListener('pageshow', handlePageShow))
onUnmounted(() => window.removeEventListener('pageshow', handlePageShow))

watch(() => route.params.id, id => loadOrder(id), { immediate: true })
</script>

<template>
    <div class="container-fluid p-3">
        <div class="content-header">
            <h2 class="title">訂單詳情</h2>
            <hr class="divider">
        </div>
        <div class="order-detail" :aria-busy="loading">
            <RouterLink :to="{ name: 'OrderList' }" class="btn btn-outline-secondary mb-3">
                返回訂單列表
            </RouterLink>
            <div v-if="loading" class="text-center py-5" role="status">訂單載入中...</div>
            <div v-else-if="errorMessage" class="alert alert-danger" role="alert">
                <p class="mb-2">{{ errorMessage }}</p>
                <button v-if="!notFound" type="button" class="btn btn-outline-danger" @click="loadOrder(route.params.id)">
                    重新載入
                </button>
            </div>
            <template v-else-if="order">
                <section class="border rounded p-3 mb-3" aria-labelledby="order-summary-title">
                    <h3 id="order-summary-title" class="h5 text-break">訂單編號：{{ order.number }}</h3>
                    <p class="text-muted">
                        下單時間：<time :datetime="order.created_at">{{ formatOrderDate(order.created_at) }}</time>（台灣時間）
                    </p>
                    <dl class="row gy-2 mb-0">
                        <div class="col-6"><dt>訂單狀態</dt><dd>{{ optionLabel('order_statuses', order.status) }}</dd></div>
                        <div class="col-6"><dt>付款狀態</dt><dd>{{ optionLabel('payment_statuses', order.payment_status) }}</dd></div>
                        <div class="col-6"><dt>付款方式</dt><dd>{{ optionLabel('payment_methods', order.payment_method) }}</dd></div>
                        <div class="col-6"><dt>配送方式</dt><dd>{{ optionLabel('shipping_methods', order.shipping_method) }}</dd></div>
                    </dl>
                </section>

                <section class="border rounded p-3 mb-3" aria-labelledby="order-recipient-title">
                    <h3 id="order-recipient-title" class="h5">收件資訊</h3>
                    <dl class="mb-0 text-break">
                        <dt>收件人</dt><dd>{{ order.recipient_name }}</dd>
                        <dt>聯絡電話</dt><dd>{{ order.recipient_phone }}</dd>
                        <template v-if="order.shipping_method === 2">
                            <dt>取貨超商</dt><dd>{{ optionLabel('store_types', order.store_type) }}</dd>
                            <dt>門市</dt><dd>{{ order.store_name }}（{{ order.store_code }}）</dd>
                            <dt>門市地址</dt><dd>{{ order.store_address }}</dd>
                        </template>
                        <template v-else>
                            <dt>收件地址</dt><dd>{{ order.recipient_zip_code }} {{ order.recipient_address }}</dd>
                        </template>
                    </dl>
                </section>

                <section class="border rounded p-3 mb-3" aria-labelledby="order-items-title">
                    <h3 id="order-items-title" class="h5">商品明細（{{ order.item_quantity }} 件）</h3>
                    <p v-if="order.items.length === 0" class="text-muted mb-0">此訂單沒有商品明細。</p>
                    <ul v-else class="list-unstyled mb-0">
                        <li v-for="(item, index) in order.items" :key="index" class="order-item py-3 text-break">
                            <h4 class="h6">{{ item.product_name }}</h4>
                            <p class="text-muted mb-1">
                                SKU：{{ item.product_sku ?? '未提供' }} /
                                顏色：{{ item.product_color ?? '未提供' }} /
                                尺寸：{{ item.product_size == null ? '未提供' : PRODUCT_SIZE_LABELS[item.product_size] ?? `未知（${item.product_size}）` }}
                            </p>
                            <p class="mb-0">
                                單價 {{ formatOrderMoney(item.product_price) }} × {{ item.quantity }} 件
                                <span class="d-block d-sm-inline ms-sm-3 fw-bold">小計 {{ formatOrderMoney(item.subtotal) }}</span>
                            </p>
                        </li>
                    </ul>
                </section>

                <section class="border rounded p-3" aria-labelledby="order-amount-title">
                    <h3 id="order-amount-title" class="h5">訂單金額</h3>
                    <dl class="mb-0">
                        <div class="d-flex justify-content-between gap-2"><dt>商品小計</dt><dd>{{ formatOrderMoney(order.items_subtotal) }}</dd></div>
                        <div class="d-flex justify-content-between gap-2"><dt>運費</dt><dd>{{ formatOrderMoney(order.shipping_fee) }}</dd></div>
                        <div class="d-flex justify-content-between gap-2"><dt>內含稅額</dt><dd>{{ formatOrderMoney(order.tax_amount) }}</dd></div>
                        <div class="d-flex justify-content-between gap-2 border-top pt-2 fw-bold"><dt>訂單總額</dt><dd>{{ formatOrderMoney(order.total_amount) }}</dd></div>
                    </dl>
                </section>

                <section class="border rounded p-3 mt-3" aria-labelledby="order-payment-title" :aria-busy="busy">
                    <h3 id="order-payment-title" class="h5">付款操作</h3>
                    <p class="text-muted small">可否新增交易由後端判斷；前往金流頁不代表付款完成，返回後請重新確認訂單狀態。</p>
                    <p v-if="paymentError" class="alert alert-danger" role="alert">{{ paymentError }}</p>
                    <p v-if="paymentMessage" class="alert alert-info" role="status">{{ paymentMessage }}</p>
                    <p v-if="loadingCheckout" role="status">付款資料產生中，請稍候...</p>
                    <div class="d-flex flex-wrap gap-2">
                        <button v-if="canCreate && !checkout" type="button" class="btn btn-primary" :disabled="busy" @click="createTransaction">
                            新增付款交易
                        </button>
                        <button v-else-if="!checkout && canContinue" type="button" class="btn btn-primary" :disabled="busy" @click="loadCheckout">
                            {{ loadingCheckout ? '取得付款資料中...' : '取得付款資料／繼續付款' }}
                        </button>
                        <button type="button" class="btn btn-outline-secondary" :disabled="busy || submittingPayment" @click="refreshPaymentState">
                            重新整理訂單
                        </button>
                    </div>
                    <p v-if="creating" class="mt-2 mb-0" role="status">付款交易處理中，請勿重複送出...</p>
                    <p v-else-if="!canCreate && !canContinue && !checkout" class="text-muted mb-0 mt-2">此訂單目前無法新增付款交易或前往付款。</p>
                    <PaymentCheckoutForm
                        v-if="checkout"
                        class="mt-3"
                        :checkout="checkout"
                        @submit="submittingPayment = true"
                    >
                        <p>應付金額：{{ checkout.currency }} {{ formatOrderMoney(checkout.amount) }}</p>
                        <button type="submit" class="btn btn-success" :disabled="busy || submittingPayment">
                            {{ submittingPayment ? '前往金流頁中...' : '前往付款' }}
                        </button>
                    </PaymentCheckoutForm>
                </section>
            </template>
        </div>
    </div>
</template>

<style scoped>
.order-detail {
    max-width: 960px;
    margin: 0 auto;
}

.order-item + .order-item {
    border-top: 1px solid #dee2e6;
}

dt {
    color: #6c757d;
    font-weight: normal;
}
</style>
