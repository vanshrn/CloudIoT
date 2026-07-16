/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@functions/(.*)$': '<rootDir>/src/functions/$1',
  },
  collectCoverageFrom: ['src/**/*.ts'],
};
