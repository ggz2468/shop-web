import { describe, expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import AuthSuccessOverlay from '@/components/auth/AuthSuccessOverlay.vue'

describe('會員成功提示元件', () => {
    it.each(['登入成功!', '註冊成功!'])('呈現原有提示與無障礙屬性：%s', async (message) => {
        const app = createSSRApp({
            render: () => h(AuthSuccessOverlay, { message }),
        })
        const html = await renderToString(app)

        expect(html).toContain('class="auth-success-overlay"')
        expect(html).toContain('role="status"')
        expect(html).toContain('aria-live="polite"')
        expect(html).toContain(message)
    })

    it('將提示視為文字，不將輸入解析成 HTML', async () => {
        const app = createSSRApp({
            render: () => h(AuthSuccessOverlay, { message: '<b>成功</b>' }),
        })

        expect(await renderToString(app)).toContain('&lt;b&gt;成功&lt;/b&gt;')
    })
})
