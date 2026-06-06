const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  expect: {
    timeout: 10000
  },
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    headless: true
  },
  webServer: {
    command: 'node server/index.js',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 10000
  }
});