const options = {
    order_statuses: [{ value: 3, code: 'STOCKING', label: '產品備貨中' }],
    payment_statuses: [{ value: 1, code: 'UNPAID', label: '未付款' }],
    payment_methods: [{ value: 1, code: 'CREDIT_CARD', label: '信用卡' }],
    shipping_methods: [{ value: 1, code: 'HOME_DELIVERY', label: '宅配' }],
}

const order = {
    id: 1,
    number: 'ORD20261012AB12CD',
    created_at: '2026-10-12T13:30:00.000000Z',
    total_amount: 1280,
    status: 3,
    payment_status: 1,
    payment_method: 1,
    shipping_method: 1,
    item_quantity: 3,
}

const response = (data, total = data.length, page = 1) => ({
    data, meta: { total, per_page: 10, current_page: page },
})

describe('會員歷史訂單', () => {
    beforeEach(() => {
        cy.intercept('GET', '**/api/auth/user', { statusCode: 401 })
        cy.intercept('GET', '**/api/orders/options', { data: options })
    })

    it('登入會員可從會員選單進入歷史訂單，點擊連結後選單關閉', () => {
        cy.intercept('GET', '**/api/auth/user', { body: { id: 1 } }).as('member')
        cy.intercept('GET', '**/api/orders?*', response([order])).as('orders')
        cy.visit('/auth/login')
        cy.wait('@member')
        cy.get('.user-menu').find('button[aria-label="會員選單"]').click()
            .should('have.attr', 'aria-expanded', 'true')
        cy.get('.user-menu__panel').within(() => {
            cy.contains('button', '會員登出').should('be.visible')
            cy.contains('a', '歷史訂單').should('have.attr', 'href', '/orders').click()
        })
        cy.location('pathname').should('equal', '/orders')
        cy.wait('@orders')
        cy.get('.order-summary').should('have.length', 1)
        cy.get('.user-menu__panel').should('not.exist')
        cy.get('button[aria-label="會員選單"]').should('have.attr', 'aria-expanded', 'false')
    })

    it('訪客選單只提供登入入口，點擊選單外部會關閉', () => {
        cy.visit('/auth/login')
        cy.get('button[aria-label="會員選單"]').click()
        cy.get('.user-menu__panel').within(() => {
            cy.contains('a', '會員登入').should('be.visible')
            cy.contains('歷史訂單').should('not.exist')
            cy.contains('會員登出').should('not.exist')
        })
        cy.get('h1').click()
        cy.get('.user-menu__panel').should('not.exist')
    })

    it('呈現載入狀態、九個摘要欄位與後端中文，並可換頁', () => {
        cy.intercept('GET', '**/api/orders?*', (request) => {
            expect(request.query.row_counts_per_page).to.equal('10')
            const page = Number(request.query.page)
            request.reply({
                delay: 500,
                body: response(
                    page === 1 ? Array.from({ length: 10 }, (_, index) => ({ ...order, id: index + 1 }))
                        : [{ ...order, id: 11, number: 'ORD20261011SECOND' }],
                    11,
                    page,
                ),
            })
        }).as('orders')

        cy.visit('/orders')
        cy.contains('訂單載入中...').should('be.visible')
        cy.wait('@orders')
        cy.get('.order-summary').should('have.length', 10).first().within(() => {
            cy.contains(order.number)
            cy.contains('產品備貨中')
            cy.contains('未付款')
            cy.contains('信用卡')
            cy.contains('宅配')
            cy.contains('3 件')
            cy.contains('1,280')
            cy.get('time').should('contain', '21:30').and('contain', '台灣時間')
        })
        cy.get('nav[aria-label="訂單分頁"]').contains('button', '2').click()
        cy.wait('@orders')
        cy.get('.order-summary').should('have.length', 1).and('contain', 'ORD20261011SECOND')
        cy.contains('第 2 / 2 頁，每頁 10 筆')
    })

    it('單頁訂單顯示每頁筆數與總頁數，但不顯示頁碼按鈕', () => {
        cy.intercept('GET', '**/api/orders?*', response([order]))
        cy.visit('/orders')
        cy.get('nav[aria-label="訂單分頁"]').should('contain', '第 1 / 1 頁，每頁 10 筆')
            .find('button').should('not.exist')
    })

    it('整張訂單卡片連至詳情，呈現快照與保存的金額並可返回列表', () => {
        cy.intercept('GET', '**/api/orders?*', response([order]))
        cy.intercept('GET', '**/api/orders/1', { data: {
            ...order, items_subtotal: 1200, shipping_fee: 80, tax_amount: 58,
            recipient_name: '測試會員', recipient_phone: '0912345678',
            recipient_zip_code: '100', recipient_address: '測試路 1 號',
            items: [{
                product_variant_id: 1, product_name: '歷史商品', product_sku: null,
                product_color: '黑色', product_size: 3, product_price: 500, quantity: 3, subtotal: 1200,
            }],
        } }).as('detail')
        cy.visit('/orders')
        cy.get('a.order-summary').should('have.attr', 'href', '/orders/1').click()
        cy.wait('@detail')
        cy.location('pathname').should('equal', '/orders/1')
        cy.contains('歷史商品').should('be.visible')
        cy.contains('未提供').should('be.visible')
        cy.contains('內含稅額').should('be.visible')
        cy.contains('1,280').should('be.visible')
        cy.contains('a', '返回訂單列表').click()
        cy.location('pathname').should('equal', '/orders')
    })

    it('空列表顯示繼續選購入口，不顯示分頁', () => {
        cy.intercept('GET', '**/api/orders?*', response([]))
        cy.visit('/orders')
        cy.contains('目前沒有訂單').should('be.visible')
        cy.contains('a', '繼續選購').should('have.attr', 'href', '/products')
        cy.get('nav[aria-label="訂單分頁"]').should('not.exist')
    })

    it('錯誤不偽裝成空列表，可重新載入', () => {
        cy.intercept('GET', '**/api/orders?*', { statusCode: 500, body: {} }).as('failed')
        cy.visit('/orders')
        cy.wait('@failed')
        cy.get('[role="alert"]').should('contain', '取得訂單列表失敗')
        cy.contains('目前沒有訂單').should('not.exist')
        cy.intercept('GET', '**/api/orders?*', response([order])).as('retried')
        cy.contains('button', '重新載入').click()
        cy.wait('@retried')
        cy.get('.order-summary').should('have.length', 1)
        cy.get('[role="alert"]').should('not.exist')
    })

    it('未登入沿用攔截器導向登入頁', () => {
        cy.intercept('GET', '**/api/orders?*', { statusCode: 401 })
        cy.visit('/orders')
        cy.location('pathname').should('equal', '/auth/login')
    })
})
