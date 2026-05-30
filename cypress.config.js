const { defineConfig } = require('cypress')

module.exports = defineConfig({
    e2e: {
        baseUrl: 'http://localhost:5173',
        specPattern: 'tests/e2e/**/*.cy.{js,ts}',
        supportFile: false,
    }
})
