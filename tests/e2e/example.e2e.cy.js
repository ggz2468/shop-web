describe('首頁 E2E 測試', () => {
  it('應顯示正確標題', () => {
    cy.visit('/')
    cy.title().should('include', Cypress.env('VITE_APP_TITLE'))
  })
})
