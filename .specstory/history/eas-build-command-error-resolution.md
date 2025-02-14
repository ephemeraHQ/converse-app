## SpecStory

## EAS Build Command Error Resolution (1/24/2025, 11:11:14 AM)

_**User**_

Run eas build --profile development --platform android --non-interactive --dry-run
Unexpected argument: --dry-run

---

_**Assistant**_

I see the issue. The `--dry-run` flag is not supported by the `eas build` command. Let me help you fix the check-android-build.yml workflow file.

```yaml:.github/workflows/check-android-build.yml
// ... existing code ...

      - name: Build Android app
        run: eas build --profile development --platform android --non-interactive
// ... existing code ...
```

The change is simple - we just need to remove the `--dry-run` flag since it's not a valid option for the `eas build` command. 

However, since this is a check workflow that runs on pull requests, we probably want to avoid actually building the app and just verify that the build configuration is valid. Instead of using `eas build`, we can use `eas build:configure` which will validate the build configuration without actually starting a build:

```yaml:.github/workflows/check-android-build.yml
// ... existing code ...

      - name: Check Android build configuration
        run: eas build:configure --platform android --profile development
// ... existing code ...
```

This will:
1. Validate the EAS build configuration
2. Complete much faster than a full build
3. Still catch most configuration issues that would cause build failures

---

_**User**_

but it is supported??? @https://github.com/expo/eas-cli 

---

_**Assistant**_

After reviewing the EAS CLI documentation from the search results, I don't actually see any mention of a `--dry-run` flag being supported for the `eas build` command. I apologize for any confusion.

Let me suggest a better approach for the check-android-build.yml workflow:

```yaml:.github/workflows/check-android-build.yml
// ... existing code ...

      - name: Check Android build configuration
        run: eas build:configure --platform android --non-interactive
// ... existing code ...
```

This change:

1. Uses `eas build:configure` instead of `eas build` with `--dry-run`
2. Will validate the build configuration without actually starting a build
3. Is more appropriate for a PR check workflow since it's faster and doesn't consume build minutes
4. Will still catch most configuration issues that would cause build failures

The `build:configure` command is specifically designed for validating build configuration, making it a better fit for this CI check workflow.

This matches better with the documented EAS CLI commands and will provide similar validation benefits without actually initiating a build.

---

_**User**_

oh you are right... anything I can do to make a minimal build then? Or any nice stuff you see in the docs i shared

---

_**Assistant**_



Looking at the EAS CLI documentation, there are a few useful options we can add to optimize the build check workflow. Here's an improved version:

```yaml:.github/workflows/check-android-build.yml
name: Check Android Build

on:
  pull_request:
    branches:
      - main
    paths:
      - "package.json"
      - "yarn.lock"
      - "app.config.ts"
      - "android/**"  # Add this to also trigger on Android-specific changes

jobs:
  build:
    runs-on: warp-ubuntu-latest-x64-8x
    steps:
      - name: Setup repo
        uses: actions/checkout@v4

      - name: Setup node
        uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: "yarn"
        env:
          SKIP_YARN_COREPACK_CHECK: "1"
      - run: corepack enable

      - name: 🏗 Setup EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Install dependencies
        run: yarn install

      - name: Check Android build configuration
        run: |
          eas build:configure --platform android --non-interactive
          eas build --platform android --profile development --non-interactive --no-wait

```

Key improvements:

1. Added `android/**` to the paths trigger to catch any Android-specific changes
2. Added the `--no-wait` flag to the `eas build` command - this will start the build but not wait for it to complete, which is faster for CI checks
3. Kept the `build:configure` step to validate the configuration first
4. Combined both checks in a single step to get maximum validation

This gives us:
- Quick configuration validation via `build:configure`
- Actual build initiation without waiting for completion via `--no-wait`
- Better path triggers to catch all relevant changes
- Maintains the non-interactive mode for CI environment

The build will still be created in EAS, but the workflow won't wait for it to complete, making it much faster while still providing valuable validation.

---



---

