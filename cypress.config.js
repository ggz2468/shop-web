const { defineConfig } = require('cypress')

module.exports = defineConfig({
    e2e: {
        baseUrl: 'https://chun-hung.idv.tw',
        specPattern: 'tests/e2e/**/*.cy.{js,ts}',
        supportFile: false,
    }
})
