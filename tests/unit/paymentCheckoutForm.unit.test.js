import { describe, expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import PaymentCheckoutForm from '@/components/order/PaymentCheckoutForm.vue'

const checkout = {
    checkout_payload: { action: 'https://payment.example.test/checkout', method: 'POST' },
    request_payload: {
        MerchantTradeNo: 'PAY_TEST',
        TradeAmt: 880,
        CheckMacValue: 'SIGNED&VALUE',
    },
}

const renderForm = (props = {}, attrs = {}, slot = () => h('button', { type: 'submit' }, '前往付款')) => (
    renderToString(createSSRApp({
        render: () => h(PaymentCheckoutForm, { checkout, ...props, ...attrs }, { default: slot }),
    }))
)

describe('共用金流付款表單', () => {
    it('使用後端提供的網址、HTTP method 與完整簽署欄位，不混入其他交易資料', async () => {
        const html = await renderForm({ checkout: { ...checkout, order_id: 1, amount: 880 } })

        expect(html).toContain('action="https://payment.example.test/checkout"')
        expect(html).toContain('method="POST"')
        expect(html.match(/type="hidden"/g)).toHaveLength(3)
        expect(html).toContain('name="MerchantTradeNo" value="PAY_TEST"')
        expect(html).toContain('name="TradeAmt" value="880"')
        expect(html).toContain('name="CheckMacValue" value="SIGNED&amp;VALUE"')
        expect(html).not.toContain('name="order_id"')
        expect(html).not.toContain('name="amount"')
    })

    it('欄位內容安全編碼，不將簽署資料解析為 HTML', async () => {
        const html = await renderForm({
            checkout: { ...checkout, request_payload: { ItemName: '"><script>alert(1)</script>' } },
        })

        expect(html).toContain('value="&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;"')
        expect(html).not.toContain('<script>')
    })

    it('保留各頁的樣式、金額與原生送出按鈕', async () => {
        const html = await renderForm({}, { class: 'mt-3' }, () => [
            h('p', '應付金額：TWD $880'),
            h('button', { type: 'submit', class: 'btn btn-success', disabled: true }, '前往金流頁中...'),
        ])

        expect(html).toContain('class="mt-3"')
        expect(html).toContain('應付金額：TWD $880')
        expect(html).toContain('type="submit" class="btn btn-success" disabled')
        expect(html).toContain('前往金流頁中...')
    })

    it('不同交易使用各自的網址與欄位，不共用上一筆付款資料', async () => {
        const html = await renderForm({
            checkout: {
                checkout_payload: { action: 'https://another.example.test/pay', method: 'post' },
                request_payload: { MerchantTradeNo: 'PAY_NEXT' },
            },
        })

        expect(html).toContain('action="https://another.example.test/pay" method="post"')
        expect(html).toContain('name="MerchantTradeNo" value="PAY_NEXT"')
        expect(html).not.toContain('PAY_TEST')
        expect(html).not.toContain('CheckMacValue')
    })
})
