## SpecStory

## Script Explanations for package.json (1/14/2025, 11:39:33 AM)

_**User**_

can you give a small comment for each script about what it's doing

---

_**Assistant**_

I'll explain each script in the package.json:

```json:package.json
"scripts": {
  // Runs Android app in development mode
  "android": "EXPO_ENV=dev expo run:android",
  
  // Builds Android development APK locally
  "android:build:dev": "eas build -p android --profile development --local",
  
  // Sets up port forwarding for Android development
  "android:reverse": "adb reverse tcp:8081 tcp:8081 && adb reverse tcp:9875 tcp:9875",
  
  // Sends built APK to device/emulator
  "android:sendApk": "./scripts/android/sendApk.sh",
  
  // Runs custom build process
  "build": "node scripts/build/build.js",
  
  // Cleans React Native build artifacts
  "clean": "./scripts/reactNativeCleanBuild.sh",
  
  // Shows current git commit hash
  "commit": "git show --format=\"%h\" --no-patch",
  
  // Runs ESLint with warning limit
  "lint": "eslint --max-warnings 2500",
  
  // Runs ESLint showing only errors
  "lint:errors": "eslint --quiet",
  
  // Runs iOS app
  "ios": "expo run:ios",
  
  // Verifies iOS build dependencies
  "ios:checkBuildDeps": "./scripts/ios/checkBuildDeps.sh",
  
  // Runs iOS app in development mode
  "run:ios": "EXPO_ENV=dev expo run:ios",
  
  // Post-package-install tasks: applies patches, WASM setup, git hooks
  "postinstall": "patch-package && node scripts/wasm.js && husky install && cross-os postinstall",
  
  // Starts Expo development server
  "start": "EXPO_ENV=dev expo start --scheme converse-dev",
  
  // Starts Expo server in preview mode
  "start:preview": "EXPO_ENV=preview expo start",
  
  // Runs Jest tests excluding performance tests
  "test": "echo \"➜ Running tests...\" && jest --testPathIgnorePatterns='.*\\.perf-test\\.tsx$'",
  
  // Captures performance test baseline
  "test:perf:baseline": "echo \"➜ Running tests with performance...\" && echo \"➜ Capture baseline performance tests...\" && yarn reassure --baseline && echo \"➜ Running current performance tests...\"",
  
  // Runs performance tests against baseline
  "test:perf": "echo \"➜ Running tests with performance...\" && echo \"➜ Capturing performance tests...\" && yarn reassure && echo \"➜ Running current performance tests...\"",
  
  // Tests deep linking functionality
  "test-deep-linking": "node scripts/test-deep-linking.js",
  
  // Runs TypeScript type checking
  "typecheck": "echo \"➜ Typechecking project...\" && tsc --noEmit",
  
  // Runs custom update process
  "update": "node scripts/build/update.js"
}
```

---



---

