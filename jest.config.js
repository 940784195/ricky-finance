module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/api/**/*.test.js'],
  collectCoverageFrom: ['server/**/*.js'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  maxWorkers: 1, // 串行运行，避免数据冲突
  testTimeout: 10000
};
