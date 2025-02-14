## SpecStory

## Improving GitHub Actions Workflow Structure (1/27/2025, 11:21:07 AM)

_**User**_

do you think it's worth and doable here to clean up to have multiple jobs ? like one job to check if native changes or not and then we have a job that will increment minor version and build and otherwise the other job like "Run EAS update" will run

---

_**Assistant**_

Yes, splitting the workflow into multiple jobs would improve readability and maintainability. Here's how we could restructure the workflows:

```yaml:.github/workflows/deploy-preview.yml
name: Preview Deployment

on:
  workflow_dispatch:
    inputs:
      force_native_build:
        description: "Force native build"
        type: boolean
        default: true
        required: true
  push:
    branches:
      - main
    paths:
      - "**.ts"
      - "**.tsx"
      - "assets/**"
      - "package.json"
      - "app.config.ts"
      - "ios/**"

concurrency:
  group: "deployment"
  cancel-in-progress: false

permissions:
  contents: write
  id-token: write

jobs:
  check-changes:
    runs-on: ubuntu-latest
    outputs:
      has_native_changes: ${{ steps.check-changes.outputs.has_native_changes }}
      commit_message: ${{ steps.commit_msg.outputs.message }}
    
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 2

      - name: Get Commit Message
        id: commit_msg
        run: echo "message=$(git log -1 --pretty=%B)" >> $GITHUB_OUTPUT

      - name: Check for native changes
        id: check-changes
        run: |
          if [[ "${{ github.event_name }}" == "workflow_dispatch" && "${{ inputs.force_native_build }}" == "true" ]]; then
            echo "has_native_changes=true" >> $GITHUB_OUTPUT
          elif git diff --name-only HEAD^ HEAD | grep -E "package.json|app.config.ts|ios/|android/"; then
            echo "has_native_changes=true" >> $GITHUB_OUTPUT
          else
            echo "has_native_changes=false" >> $GITHUB_OUTPUT
          fi

  native-build:
    needs: check-changes
    if: needs.check-changes.outputs.has_native_changes == 'true'
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup node
        uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: "yarn"
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

      - name: Increment minor version and build
        run: |
          git config --global user.email "github-actions[bot]@users.noreply.github.com"
          git config --global user.name "github-actions[bot]"
          CURRENT_COMMIT=$(git rev-parse HEAD)
          npm version minor -m "chore: increment minor version [skip ci]"
          git push https://${{ secrets.PAT_GITHUB }}@github.com/${{ github.repository }}.git HEAD:main --follow-tags
          node scripts/build/ios/preview.js
          eas build --platform all --profile preview --non-interactive --auto-submit
          npx sentry-expo-upload-sourcemaps dist
          git reset --hard HEAD~1
          git push --force https://${{ secrets.PAT_GITHUB }}@github.com/${{ github.repository }}.git HEAD:main

      - name: Rollback on build failure
        if: failure()
        run: |
          git reset --hard HEAD~1
          git push --force-with-lease https://${{ secrets.GITHUB_TOKEN }}@github.com/${{ github.repository }}.git HEAD:main

  ota-update:
    needs: check-changes
    if: needs.check-changes.outputs.has_native_changes == 'false'
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup node
        uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: "yarn"
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

      - name: Run EAS Update
        run: |
          eas update --auto --channel=preview --message "${{ needs.check-changes.outputs.commit_message }}" --non-interactive
          npx sentry-expo-upload-sourcemaps dist
```

Benefits of this approach:

1. Better separation of concerns - each job has a specific responsibility
2. Clearer workflow visualization in GitHub Actions UI
3. Easier to maintain and debug as each job is independent
4. Reduced duplication of setup steps
5. Better error handling as jobs can fail independently
6. Clearer conditions for when each type of deployment should run

The workflow is split into three jobs:
1. `check-changes`: Determines if native changes are present
2. `native-build`: Handles version increment and native builds
3. `ota-update`: Handles OTA updates for non-native changes

We could apply a similar structure to the production deployment workflow if you'd like. Would you like me to show how that would look as well?

---



---

