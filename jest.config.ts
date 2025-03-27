import type { Config } from "jest"

/**
 * Jest configuration for Expo projects with environment
 * variable preservation and additional setup.
 *
 * This config extends the default Expo preset and adds
 * custom transformers and settings from package.json.
 */
const config: Config = {
  /**
   * Extends the Expo preset for Jest configuration.
   * This includes default settings for React Native and Expo projects.
   */
  preset: "jest-expo",

  /**
   * Specifies the root directory for Jest to use when running tests.
   * All paths in the config are relative to this directory.
   * Example: If rootDir is ".", tests in "./src/components" will be found.
   */
  rootDir: ".",

  /**
   * Specifies the test environment that will be used for testing.
   * 'node' environment simulates Node.js environment.
   */
  testEnvironment: "node",

  /**
   * Specifies glob patterns for locating test files.
   * @example
   * Matches:
   * - "__tests__/MyComponent.test.js"
   * - "src/utils/helper.spec.ts"
   * Does not match:
   * - "src/components/Button.js"
   * - "tests/setup.js"
   */
  testMatch: ["**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[jt]s?(x)"],

  /**
   * Specifies how files should be transformed before running tests.
   * Uses babel-jest for JS/TS files, preserving environment variables.
   */
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": [
      "babel-jest",
      /**
       * Preserves environment variables in the test environment.
       * This is required because without it, we could not access
       * the environment variables (for example, in utils/api.ts).
       *
       * Without this, environment variables accessed via normal syntax,
       * (for example, `process.env.EXPO_PUBLIC_CONVOS_API_URI`) would be
       * undefined in the test environment.
       *
       * @see https://github.com/expo/expo/issues/26513#issuecomment-1989035903
       */
      {
        caller: { preserveEnvVars: true },
      },
    ],
  },

  /**
   * Specifies file extensions Jest will look for when running tests.
   * @example
   * Will resolve: "MyComponent.tsx", "utils.js", "constants.json"
   * Won't resolve: "styles.css", "image.png"
   */
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],

  /**
   * Specifies setup files to run before each test.
   * These files can set up the testing environment.
   */
  setupFiles: ["<rootDir>/jest.setup.ts"],

  /**
   * Specifies patterns for modules that should not be transformed.
   * Typically used for node_modules, but allows exceptions for
   * specific packages.
   *
   * @example
   * Will transform: "@react-native-community/async-storage"
   * Won't transform: "lodash", "moment"
   */
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|rn-fetch-blob|@xmtp|uuid))",
  ],

  /**
   * Enables verbose output, providing detailed information about each test.
   */
  verbose: true,

  /**
   * Specifies setup files to run after the test environment is set up
   * but before tests are run.
   */
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
}

export default config
