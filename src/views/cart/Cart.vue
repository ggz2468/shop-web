<script setup>
import { onMounted, reactive, watch } from 'vue'
import { cartServices } from '@/services/cartService'
import { useCart } from '@/composables/useCart'
import { resolveApiErrorMessage } from '@/utils/apiError'
import CartItemProduct from '@/components/cart/CartItemProduct.vue'
import CenteredState from '@/components/layout/CenteredState.vue'

const { items, totalQuantity, loading, errorMessage, hasItems, loadCart } = useCart()
const pendingVariantIds = reactive(new Set())
// 各品項的輸入中數量，key 為 product_variant_id
const quantityInputs = reactive({})

watch(items, (cartItems) => {
    cartItems.forEach((item) => {
        quantityInputs[item.product_variant_id] = item.quantity
    })
})

const updateItemQuantity = async (productVariantId) => {
    const quantity = Number(quantityInputs[productVariantId])

    if (!Number.isInteger(quantity) || quantity < 1) {
        errorMessage.value = '數量必須為大於等於 1 的整數。'
        return
    }

    pendingVariantIds.add(productVariantId)
    errorMessage.value = ''

    try {
        await cartServices.updateItem(productVariantId, { quantity })
        await loadCart()
    } catch (error) {
        errorMessage.value = resolveApiErrorMessage(error, '更新購物車數量失敗，請稍後再試。') ?? ''
    } finally {
        pendingVariantIds.delete(productVariantId)
    }
}

const removeItem = async (productVariantId) => {
    pendingVariantIds.add(productVariantId)
    errorMessage.value = ''

    try {
        await cartServices.removeItem(productVariantId)
        await loadCart()
    } catch (error) {
        errorMessage.value = resolveApiErrorMessage(error, '刪除購物車品項失敗，請稍後再試。') ?? ''
    } finally {
        pendingVariantIds.delete(productVariantId)
    }
}

const clearCart = async () => {
    if (!window.confirm('確定要清空購物車嗎？')) {
        return
    }

    loading.value = true
    errorMessage.value = ''

    try {
        await cartServices.clearCart()
        await loadCart()
    } catch (error) {
        errorMessage.value = resolveApiErrorMessage(error, '清空購物車失敗，請稍後再試。') ?? ''
        loading.value = false
    }
}

onMounted(loadCart)
</script>

<template>
    <div class="container-fluid p-3">
        <div class="content-header">
            <h2 class="title">購物車</h2>
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
                message="快去選購喜歡的產品吧！"
                action-text="查看所有產品"
                :action-to="{ name: 'ProductList' }"
            />

            <template v-else>
                <div class="table-responsive">
                    <table class="table align-middle cart-table">
                        <thead>
                            <tr>
                                <th scope="col">產品</th>
                                <th scope="col">數量</th>
                                <th scope="col"></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="item in items" :key="item.product_variant_id">
                                <td>
                                    <CartItemProduct :name="item.product_name" :image-path="item.product_image_path" />
                                </td>
                                <td>
                                    <input
                                        v-model.number="quantityInputs[item.product_variant_id]"
                                        type="number"
                                        min="1"
                                        class="form-control cart-quantity-input"
                                        :disabled="pendingVariantIds.has(item.product_variant_id)"
                                    >
                                </td>
                                <td class="cart-actions">
                                    <button
                                        type="button"
                                        class="btn btn-primary btn-sm"
                                        :disabled="pendingVariantIds.has(item.product_variant_id)"
                                        @click="updateItemQuantity(item.product_variant_id)"
                                    >
                                        更新數量
                                    </button>
                                    <button
                                        type="button"
                                        class="btn btn-outline-danger btn-sm"
                                        :disabled="pendingVariantIds.has(item.product_variant_id)"
                                        @click="removeItem(item.product_variant_id)"
                                    >
                                        刪除
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="cart-summary">
                    <span class="cart-summary__total">購物車總數量：{{ totalQuantity }}</span>
                    <RouterLink class="btn btn-success btn-sm" :to="{ name: 'Checkout' }">
                        結帳
                    </RouterLink>
                    <button type="button" class="btn btn-outline-secondary btn-sm" @click="clearCart">
                        清空購物車
                    </button>
                </div>
            </template>
        </div>
    </div>
</template>

<style scoped>
.cart-table {
    max-width: 720px;
    margin: 0 auto;
}

.cart-quantity-input {
    width: 6rem;
}

.cart-actions {
    display: flex;
    gap: 0.5rem;
}

.cart-summary {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    margin-top: 1rem;
    flex-wrap: wrap;
}

.cart-summary__total {
    font-weight: 600;
}
</style>
