module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  clearMocks: true,
  verbose: true,
  setupFiles: ['<rootDir>/__tests__/setupEnv.js'],
};
