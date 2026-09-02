/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "jsdom",
  testMatch: ["<rootDir>/src/**/__tests__/**/*.spec.ts?(x)"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          types: ["jest", "node"],
          noUnusedLocals: false,
          noUnusedParameters: false,
        },
      },
    ],
  },
};
