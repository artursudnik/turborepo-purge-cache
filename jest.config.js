/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  passWithNoTests: true,
  collectCoverageFrom: ['src/**/*.{ts,js}'],
  coverageDirectory: './coverage',
  coveragePathIgnorePatterns: ['index\\.ts'],
  coverageThreshold: {
    './src': {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
