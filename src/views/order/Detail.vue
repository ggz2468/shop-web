<script setup>
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import { useOrderDetail } from '@/composables/useOrderDetail'
import { formatOrderMoney, formatOrderDate } from '@/utils/orderFormatting'
import { PRODUCT_SIZE_LABELS } from '@/utils/productVariant'

const route = useRoute()
const { order, loading, errorMessage, notFound, loadOrder, optionLabel } = useOrderDetail()

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
