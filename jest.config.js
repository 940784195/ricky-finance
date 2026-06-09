module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/api/**/*.test.js'],
  collectCoverageFrom: ['backend/**/*.js'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  maxWorkers: 1,
  testTimeout: 60000,
  forceExit: true,
  detectOpenHandles: true
};
