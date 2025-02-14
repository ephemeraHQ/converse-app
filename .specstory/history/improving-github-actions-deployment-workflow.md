## SpecStory

## Improving GitHub Actions Deployment Workflow (1/27/2025, 3:10:18 PM)

_**User**_

Do something like @deploy-preview.yml  where we have many different jobs for each steps. like ios vs Android and Eas build vs eas update

---

_**Assistant**_

I'll help you restructure the `deploy-prod.yml` workflow to separate concerns into different jobs, similar to the preview deployment workflow. Here's how we can improve it:

```yaml:.github/workflows/deploy-prod.yml
name: Production Deployment

on:
  push:
    branches:
      - production

concurrency:
  group: "deployment"
  cancel-in-progress: false

permissions:
  contents: write
  id-token: write

jobs:
  check-deployment-type:
    runs-on: ubuntu-latest
    outputs:
      versions_match: ${{ steps.version-compare.outputs.versions_match }}
      commit_message: ${{ steps.commit_msg.outputs.message }}
      temp_merge_head: ${{ steps.temp_merge.outputs.old_head }}

    steps:
      - name: Check for EXPO_TOKEN
        run: |
          if [ -z "${{ secrets.EXPO_TOKEN }}" ]; then
            echo "You must provide an EXPO_TOKEN secret"
            exit 1
          fi

      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
          token: ${{ secrets.PAT_GITHUB }}

      - name: Configure Git
        run: |
          git config --global user.email "github-actions[bot]@users.noreply.github.com"
          git config --global user.name "github-actions[bot]"

      - name: Compare versions with main
        id: version-compare
        run: |
          git fetch origin main
          MAIN_VERSION=$(git show origin/main:package.json | jq -r .version)
          PROD_VERSION=$(jq -r .version package.json)
          if [ "$MAIN_VERSION" != "$PROD_VERSION" ]; then
            echo "versions_match=false" >> $GITHUB_OUTPUT
          else
            echo "versions_match=true" >> $GITHUB_OUTPUT
          fi

      - name: Get Commit Messages
        id: commit_msg
        run: |
          COMMITS=$(git log origin/production..origin/main --pretty=format:"- %s")
          COMMITS="${COMMITS//'%'/'%25'}"
          COMMITS="${COMMITS//$'\n'/'%0A'}"
          COMMITS="${COMMITS//$'\r'/'%0D'}"
          echo "message=$COMMITS" >> $GITHUB_OUTPUT

      - name: Create temporary merge
        id: temp_merge
        run: |
          echo "old_head=$(git rev-parse HEAD)" >> $GITHUB_OUTPUT
          git fetch origin main
          git merge origin/main --no-commit --no-ff
          git commit -m "temp: Temporary merge for deployment verification"

  ios-build:
    needs: check-deployment-type
    if: needs.check-deployment-type.outputs.versions_match == 'false'
    runs-on: ubuntu-latest
    outputs:
      build_success: ${{ steps.build_status.outputs.success }}

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          token: ${{ secrets.PAT_GITHUB }}

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

      - name: Build iOS production
        id: build_status
        run: |
          node scripts/build/ios/production.js
          eas build --platform ios --profile production --non-interactive --auto-submit
          echo "success=true" >> $GITHUB_OUTPUT

  android-build:
    needs: check-deployment-type
    if: needs.check-deployment-type.outputs.versions_match == 'false'
    runs-on: ubuntu-latest
    outputs:
      build_success: ${{ steps.build_status.outputs.success }}

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          token: ${{ secrets.PAT_GITHUB }}

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

      - name: Build Android production
        id: build_status
        run: |
          eas build --platform android --profile production --non-interactive --auto-submit
          echo "success=true" >> $GITHUB_OUTPUT

  ota-update:
    needs: check-deployment-type
    if: needs.check-deployment-type.outputs.versions_match == 'true'
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          token: ${{ secrets.PAT_GITHUB }}

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
        run: eas update --auto --channel=production --message "${{ needs.check-deployment-type.outputs.commit_message }}" --non-interactive

      - name: Upload source maps
        run: npx sentry-expo-upload-sourcemaps dist

  finalize-deployment:
    needs: [check-deployment-type, ios-build, android-build, ota-update]
    runs-on: ubuntu-latest
    if: always()

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          token: ${{ secrets.PAT_GITHUB }}

      - name: Configure Git
        run: |
          git config --global user.email "github-actions[bot]@users.noreply.github.com"
          git config --global user.name "github-actions[bot]"

      - name: Handle deployment results
        run: |
          if [[ "${{ needs.check-deployment-type.outputs.versions_match }}" == "false" ]]; then
            if [[ "${{ needs.ios-build.result }}" == "failure" || "${{ needs.android-build.result }}" == "failure" ]]; then
              echo "Native build failed, rolling back..."
              git reset --hard ${{ needs.check-deployment-type.outputs.temp_merge_head }}
              git push --force https://${{ secrets.PAT_GITHUB }}@github.com/${{ github.repository }}.git HEAD:production
              exit 1
            fi
          elif [[ "${{ needs.ota-update.result }}" == "failure" ]]; then
            echo "OTA update failed, rolling back..."
            git reset --hard ${{ needs.check-deployment-type.outputs.temp_merge_head }}
            git push --force https://${{ secrets.PAT_GITHUB }}@github.com/${{ github.repository }}.git HEAD:production
            exit 1
          fi

          echo "Deployment successful, finalizing merge..."
          git fetch origin main
          git merge origin/main -m "feat: Production deployment%0A%0AChanges included:%0A${{ needs.check-deployment-type.outputs.commit_message }}"
          git push https://${{ secrets.PAT_GITHUB }}@github.com/${{ github.repository }}.git HEAD:production
```

Key changes made:

1. Split the workflow into separate jobs:
   - `check-deployment-type`: Initial checks and setup
   - `ios-build`: Handles iOS native builds
   - `android-build`: Handles Android native builds
   - `ota-update`: Handles OTA updates
   - `finalize-deployment`: Handles deployment results and finalizes the merge

2. Added better job dependencies and conditions:
   - Native builds only run when versions don't match
   - OTA update only runs when versions match
   - Final job runs after all other jobs complete

3. Improved error handling:
   - Each build platform is handled separately
   - Rollback logic is centralized in the final job
   - Better status reporting for failed builds

4. Maintained all existing functionality while making the workflow more modular and easier to maintain.

This structure makes it easier to:
- Debug issues (each job has its own logs)
- Add new platforms or steps
- Handle failures more gracefully
- Maintain the code

---

_**User**_

just to be sure, when we will do ios build or android build or ota update, the code we will cehckout from production branch will have the merged "main" branch changes right?

---

_**Assistant**_

Yes, that's correct! The changes from the main branch will be available in all subsequent jobs because of the temporary merge we create in the `check-deployment-type` job.

Let's look at the key steps:

1. In `check-deployment-type` job, we create a temporary merge:
```yaml:.github/workflows/deploy-prod.yml
// ... existing code ...
      - name: Create temporary merge
        id: temp_merge
        run: |
          echo "old_head=$(git rev-parse HEAD)" >> $GITHUB_OUTPUT
          git fetch origin main
          git merge origin/main --no-commit --no-ff
          git commit -m "temp: Temporary merge for deployment verification"
// ... existing code ...
```

2. Then in subsequent jobs (ios-build, android-build, ota-update), when we do:
```yaml
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          token: ${{ secrets.PAT_GITHUB }}
```

This checkout will get the production branch WITH the temporary merge commit we created, so it includes all the changes from main.

This ensures that all build jobs are working with the exact same code that we intend to deploy to production. If any build fails, we can safely roll back to the original production state using the `temp_merge_head` we stored.

---

_**User**_

when it says "Ensure that SENTRY_AUTH_TOKEN is set in your build environment, and Sentry will automatically upload source maps for you. If you use environment variables rather than properties in your app config, ensure that those are set as well." what does it mean? where should i put the value of SENTRY_AUTH_TOKEN? @https://docs.expo.dev/guides/using-sentry/ 

---

_**Assistant**_

Based on the documentation, for EAS Build, you need to set the `SENTRY_AUTH_TOKEN` as a secret in your EAS project. Here's how:

1. You can set it using the EAS CLI:
```bash
eas secret:create --name SENTRY_AUTH_TOKEN --value "your-sentry-auth-token"
```

Or you can set it through the EAS website:
1. Go to your project on https://expo.dev
2. Navigate to Settings > Secrets
3. Add a new secret with:
   - Name: `SENTRY_AUTH_TOKEN`
   - Value: Your Sentry auth token

This secret will then be available as an environment variable during the build process, allowing Sentry to automatically upload source maps.

If you're using environment variables for other Sentry configuration (instead of putting them directly in app.config), you might also want to set:
- `SENTRY_ORG` - Your Sentry organization slug
- `SENTRY_PROJECT` - Your Sentry project name

The auth token is particularly sensitive and should never be committed to your repository, which is why it's recommended to set it as a secret in EAS Build.

[Source](https://docs.expo.dev/guides/using-sentry/#usage-with-eas-build)

---



---

