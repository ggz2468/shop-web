import { describe, expect, it, vi } from 'vitest'
import { createSSRApp, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createMemoryHistory, createRouter } from 'vue-router'
import OrderList from '@/views/order/List.vue'
import orderRoutes from '@/router/modules/order'

vi.mock('@/composables/useOrders', () => ({
    useOrders: () => ({
        orders: ref([1, 2].map(id => ({
            id, number: `ORD${id}`, created_at: '2026-10-12T13:30:00Z',
            total_amount: 880, item_quantity: 2,
        }))),
        loading: ref(false), errorMessage: ref(''), currentPage: ref(1),
        totalItems: ref(2), itemsPerPage: 10,
        loadOrders: vi.fn(), retry: vi.fn(), optionLabel: () => '測試選項',
    }),
}))

describe('訂單列表詳情連結', () => {
    it('每張卡片均為包含正確 ID 與無障礙名稱的原生超連結', async () => {
        const router = createRouter({
            history: createMemoryHistory(),
            routes: [...orderRoutes, { path: '/:pathMatch(.*)*', name: 'NotFound', component: { template: '' } }],
        })
        await router.push('/orders')
        await router.isReady()
        const app = createSSRApp(OrderList)
        app.use(router)
        const html = await renderToString(app)

        for (const id of [1, 2]) {
            expect(html).toContain(`href="/orders/${id}"`)
            expect(html).toContain(`aria-label="查看訂單 ORD${id} 詳情"`)
        }
        expect(html.match(/class="order-summary /g)).toHaveLength(2)
        expect(router.resolve('/orders/2').name).toBe('OrderDetail')
        expect(router.resolve('/orders/not-an-order').name).toBe('NotFound')
    })
})
