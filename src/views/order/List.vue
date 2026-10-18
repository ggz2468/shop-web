<script setup>
import { computed, onMounted } from 'vue'
import CenteredState from '@/components/layout/CenteredState.vue'
import Pagination from '@/components/layout/Pagination.vue'
import { useOrders } from '@/composables/useOrders'

const {
    orders, loading, errorMessage, currentPage, totalItems, itemsPerPage,
    loadOrders, retry, optionLabel,
} = useOrders()
const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage))
const moneyFormatter = new Intl.NumberFormat('zh-TW', {
    style: 'currency', currency: 'TWD', maximumFractionDigits: 0,
})
const dateFormatter = new Intl.DateTimeFormat('zh-TW', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Taipei', hourCycle: 'h23',
})

onMounted(() => loadOrders())
</script>

<template>
    <div class="container-fluid p-3">
        <div class="content-header">
            <h2 class="title">訂單列表</h2>
            <hr class="divider">
        </div>

        <div class="content-body order-list" :aria-busy="loading">
            <div v-if="loading" class="text-center py-5" role="status">訂單載入中...</div>

            <div v-else-if="errorMessage" class="alert alert-danger" role="alert">
                <p>{{ errorMessage }}</p>
                <button type="button" class="btn btn-outline-danger" @click="retry">重新載入</button>
            </div>

            <CenteredState
                v-else-if="orders.length === 0"
                title="目前沒有訂單"
                message="尚無可顯示的訂單，歡迎選購喜歡的商品。"
                action-text="繼續選購"
                :action-to="{ name: 'ProductList' }"
            />

            <template v-else>
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <span>共 {{ totalItems }} 筆訂單</span>
                    <button type="button" class="btn btn-outline-secondary btn-sm" @click="loadOrders(currentPage)">
                        重新整理
                    </button>
                </div>

                <article v-for="order in orders" :key="order.id" class="order-summary border rounded p-3 mb-3">
                    <header class="d-flex flex-wrap justify-content-between gap-2 mb-3">
                        <h3 class="h6 mb-0 text-break">訂單編號：{{ order.number }}</h3>
                        <time :datetime="order.created_at" class="text-muted small">
                            {{ dateFormatter.format(new Date(order.created_at)) }}（台灣時間）
                        </time>
                    </header>
                    <dl class="row mb-0 gy-2">
                        <div class="col-6 col-md-4">
                            <dt>訂單狀態</dt>
                            <dd>{{ optionLabel('order_statuses', order.status) }}</dd>
                        </div>
                        <div class="col-6 col-md-4">
                            <dt>付款狀態</dt>
                            <dd>{{ optionLabel('payment_statuses', order.payment_status) }}</dd>
                        </div>
                        <div class="col-6 col-md-4">
                            <dt>訂單金額</dt>
                            <dd class="fw-bold">{{ moneyFormatter.format(order.total_amount) }}</dd>
                        </div>
                        <div class="col-6 col-md-4">
                            <dt>付款方式</dt>
                            <dd>{{ optionLabel('payment_methods', order.payment_method) }}</dd>
                        </div>
                        <div class="col-6 col-md-4">
                            <dt>配送方式</dt>
                            <dd>{{ optionLabel('shipping_methods', order.shipping_method) }}</dd>
                        </div>
                        <div class="col-6 col-md-4">
                            <dt>商品件數</dt>
                            <dd>{{ order.item_quantity }} 件</dd>
                        </div>
                    </dl>
                </article>

                <nav aria-label="訂單分頁" class="order-pagination">
                    <Pagination
                        v-if="totalPages > 1"
                        :model-value="currentPage"
                        :total-items="totalItems"
                        :items-per-page="itemsPerPage"
                        @update:model-value="loadOrders"
                    />
                    <p class="text-center text-muted small mt-2">
                        第 {{ currentPage }} / {{ totalPages }} 頁，每頁 {{ itemsPerPage }} 筆
                    </p>
                </nav>
            </template>
        </div>
    </div>
</template>

<style scoped>
.order-list {
    max-width: 960px;
    margin: 0 auto;
}

.order-summary dt {
    font-size: 0.875rem;
    color: #6c757d;
    font-weight: normal;
}

.order-summary dd {
    margin-bottom: 0;
}

.order-pagination {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.order-pagination :deep(.pagination-container) {
    position: static;
    transform: none;
    justify-content: center;
    flex-wrap: wrap;
    padding: 0;
    max-width: 100%;
}
</style>
