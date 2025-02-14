## SpecStory

## Adding Android Build to GitHub Actions (1/31/2025, 8:51:23 AM)

_**User**_

ok add the android build too

---

_**Assistant**_

I'll help you uncomment and update the Android build section to match the iOS build pattern. Here's the change:

```yaml:.github/workflows/deploy-preview.yml
// ... existing code ...

  android-build:
    needs: [check-changes, bump-version]
    if: needs.check-changes.outputs.has_native_changes == 'true'
    runs-on: ubuntu-latest
    outputs:
      build_success: ${{ steps.build_status.outputs.success }}

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          token: ${{ secrets.PAT_GITHUB }}
          ref: main
          fetch-depth: 0

      # To get the incremented version number
      - name: Pull latest changes
        run: git pull origin main

      - name: Setup node
        uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: "yarn"
          cache-dependency-path: yarn.lock
        env:
          SKIP_YARN_COREPACK_CHECK: "1"
      - run: corepack enable

      - name: Install dependencies
        run: yarn install

      - name: Setup EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Build and submit to store
        id: build_status
        run: |
          eas build --platform android --profile preview --non-interactive --auto-submit
          echo "success=true" >> $GITHUB_OUTPUT

// ... existing code ...

  handle-build-results:
    needs: [bump-version, ios-build, android-build]
    runs-on: ubuntu-latest
    if: always()

// ... existing code ...
```

The main changes made:
1. Uncommented the android-build job
2. Added `ref: main` and `fetch-depth: 0` to the checkout step
3. Added the "Pull latest changes" step to match iOS build
4. Updated the `handle-build-results` job to include `android-build` in its needs array

These changes make the Android build process match the iOS build process and ensure it has access to the latest version number from the version bump step.

---



---

