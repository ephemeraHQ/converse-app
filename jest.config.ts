import type { Config } from "jest";

/**
 * Jest configuration for Expo projects with environment
 * variable preservation.
 *
 * This config extends the default Expo preset and adds
 * a custom transformer to preserve environment variables
 * during testing.
 */
const config: Config = {
  // Extend the Expo preset
  preset: "jest-expo",

  // Specify the root directory
  rootDir: ".",

  // Specify test environment
  testEnvironment: "node",

  // Specify file extensions to be treated as test files
  testMatch: ["**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[jt]s?(x)"],

  // Transform files
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": [
      "babel-jest",
      {
        caller: { preserveEnvVars: true },
      },
    ],
  },

  // Module file extensions
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],

  // Setup files
  setupFiles: ["<rootDir>/jest.setup.ts"],

  // Ignore paths
  transformIgnorePatterns: [
    "node_modules/(?!(jest-)?react-native|@react-native|@react-native-community|expo(nent)?|@expo(nent)?/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|@sentry/.*)",
  ],

  // Verbose output
  verbose: true,
};

export default config;
