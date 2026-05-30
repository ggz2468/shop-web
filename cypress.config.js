const { defineConfig } = require('cypress')

module.exports = defineConfig({
    e2e: {
        baseUrl: 'http://localhost',
        specPattern: 'tests/e2e/**/*.cy.{js,ts}',
        supportFile: false,
    }
})
