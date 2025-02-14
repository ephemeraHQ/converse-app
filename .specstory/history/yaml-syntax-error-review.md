## SpecStory

## YAML Syntax Error Review (2/4/2025, 8:52:30 AM)

_**User**_

any syntaax error here?

---

_**Assistant**_

Let me review the YAML file for any syntax errors. The file appears to be mostly correct, but there is one minor issue in the commit message formatting in the final step. Here's the fix:

```yaml:.github/workflows/deploy-prod.yml
// ... existing code ...
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
          git merge origin/main -m "feat: Production deployment

Changes included:
${{ needs.check-deployment-type.outputs.commit_message }}"
          git push https://${{ secrets.PAT_GITHUB }}@github.com/${{ github.repository }}.git HEAD:production
// ... existing code ...
```

The change is in the commit message formatting. The previous version used `%0A` for newlines, which is typically used in URL encoding. In a git commit message, you can use actual newlines. I've replaced the `%0A` with actual line breaks in the commit message.

The rest of the YAML file looks syntactically correct. All the job dependencies, conditions, and step sequences are properly defined.

---

_**User**_

the fix didnT work i think? anything other issues you see?

---

_**Assistant**_

Let me check the file again more carefully. I see the issue now - when using multiline strings in shell scripts within GitHub Actions, we need to handle them differently. Here's the corrected version:

```yaml:.github/workflows/deploy-prod.yml
// ... existing code ...
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
          git merge origin/main -m "feat: Production deployment

Changes included:
$(echo "${{ needs.check-deployment-type.outputs.commit_message }}" | sed 's/%0A/\n/g')"
          git push https://${{ secrets.PAT_GITHUB }}@github.com/${{ github.repository }}.git HEAD:production
// ... existing code ...
```

The changes:
1. Added proper string handling for the commit message using `$(echo ... | sed 's/%0A/\n/g')`
2. This will properly convert the URL-encoded newlines (%0A) back into actual newlines in the git commit message

The rest of the workflow file looks correct. This should properly handle the multiline commit message formatting now.

---

_**User**_

look at the code now... when I add what you suggest me it doens,t work

---

_**Assistant**_

I apologize for the confusion. Looking at the code again, I notice that the issue might be with the YAML syntax itself. Let me try a different approach:

```yaml:.github/workflows/deploy-prod.yml
// ... existing code ...
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
          COMMIT_MSG=$(echo "${{ needs.check-deployment-type.outputs.commit_message }}" | sed 's/%0A/\n/g')
          git merge origin/main -m "feat: Production deployment

Changes included:
${COMMIT_MSG}"
          git push https://${{ secrets.PAT_GITHUB }}@github.com/${{ github.repository }}.git HEAD:production
// ... existing code ...
```

Changes made:
1. Store the processed commit message in a variable first
2. Use the variable in the git merge command with proper shell variable expansion
3. Maintain the heredoc-style multiline string format in YAML

This should handle the multiline commit message properly while maintaining valid YAML syntax. Let me know if you still see any issues.

---

_**User**_

check @deploy-preview.yml  just want to make sure that the way we eas update or build is kind of the same expect that in here we should use production

---

_**Assistant**_

Looking at both files, I notice a few inconsistencies. Let me suggest updates to align the production deployment with the preview deployment patterns:

```yaml:.github/workflows/deploy-prod.yml
// ... existing code ...
      - name: Setup node
        uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: "yarn"
          cache-dependency-path: yarn.lock    # Add this line
        env:
          SKIP_YARN_COREPACK_CHECK: "1"
      - run: corepack enable

      - name: Install dependencies
        run: yarn install --immutable    # Add --immutable flag

      # ... in the ota-update job ...
      - name: Run EAS Update
        run: eas update --auto --channel=production --message "${{ needs.check-deployment-type.outputs.commit_message }}" --non-interactive

      - name: Upload source maps
        run: |
          # Get Sentry token same way as preview
          export SENTRY_AUTH_TOKEN=$(eas env:get --variable-name=SENTRY_AUTH_TOKEN --variable-environment=production | tr -d ' ' | cut -d'=' -f2)
          npx sentry-expo-upload-sourcemaps dist
// ... existing code ...
```

The main changes to align with preview deployment:
1. Added `cache-dependency-path: yarn.lock` to node setup
2. Added `--immutable` flag to yarn install
3. Updated the Sentry sourcemaps upload to use the same pattern as preview, getting the token from EAS

The EAS build and update commands are already correctly using the production channel/profile, which is the main difference we want to maintain between preview and production deployments.

---

_**User**_

can you remind me why are we reverting back if builds fail? Not usre Iwant this finally... 

---

_**Assistant**_

Looking at both files, the revert logic in the production deployment is a safety measure, but you raise a good point. Here's why we might want to reconsider it:

1. In the preview deployment (deploy-preview.yml), we don't have any revert logic - if a build fails, it simply fails and we can fix the issue and try again.

2. The revert logic in production (deploy-prod.yml) was likely added as an extra safety measure to ensure the production branch stays in a "clean" state, but it might be unnecessary because:
   - If builds fail, we'd want to know and fix the issue rather than automatically reverting
   - The temporary merge step adds complexity
   - GitHub already shows the failed status, which prevents merging if branch protection is enabled
   - We can always manually revert if absolutely necessary

Would you like me to provide an updated version of the production workflow without the revert logic, making it more similar to the preview workflow?

---

_**User**_

yes you can remove the revert and temporary branch etc

---

_**Assistant**_

I'll simplify the production workflow by removing the revert logic and temporary merge steps. Here's the updated version:

```yaml:.github/workflows/deploy-prod.yml
name: Production Deployment

on:
  push:
    branches:
      - production

# We need to ensure only one workflow runs at a time and wait for any in-progress workflows to complete.
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

    steps:
      # Verify that the required Expo token is available
      - name: Check for EXPO_TOKEN
        run: |
          if [ -z "${{ secrets.EXPO_TOKEN }}" ]; then
            echo "You must provide an EXPO_TOKEN secret"
            exit 1
          fi

      # Get the code from the repository
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
          token: ${{ secrets.PAT_GITHUB }}

      # Check if the versions in main and production branches match
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

      # Collect all commit messages between main and production for the update message
      - name: Get Commit Messages
        id: commit_msg
        run: |
          COMMITS=$(git log origin/production..origin/main --pretty=format:"- %s")
          COMMITS="${COMMITS//'%'/'%25'}"
          COMMITS="${COMMITS//$'\n'/'%0A'}"
          COMMITS="${COMMITS//$'\r'/'%0D'}"
          echo "message=$COMMITS" >> $GITHUB_OUTPUT

  ios-build:
    needs: check-deployment-type
    if: needs.check-deployment-type.outputs.versions_match == 'false'
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
          cache-dependency-path: yarn.lock
        env:
          SKIP_YARN_COREPACK_CHECK: "1"
      - run: corepack enable

      - name: Install dependencies
        run: yarn install --immutable

      - name: Setup EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Build iOS production
        run: |
          node scripts/build/ios/production.js
          eas build --platform ios --profile production --non-interactive --auto-submit

  android-build:
    needs: check-deployment-type
    if: needs.check-deployment-type.outputs.versions_match == 'false'
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
          cache-dependency-path: yarn.lock
        env:
          SKIP_YARN_COREPACK_CHECK: "1"
      - run: corepack enable

      - name: Install dependencies
        run: yarn install --immutable

      - name: Setup EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Build Android production
        run: |
          eas build --platform android --profile production --non-interactive --auto-submit

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
          cache-dependency-path: yarn.lock
        env:
          SKIP_YARN_COREPACK_CHECK: "1"
      - run: corepack enable

      - name: Install dependencies
        run: yarn install --immutable

      - name: Setup EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Run EAS Update
        run: |
          eas update --auto --channel=production --message "${{ needs.check-deployment-type.outputs.commit_message }}" --non-interactive

      - name: Upload source maps
        run: |
          export SENTRY_AUTH_TOKEN=$(eas env:get --variable-name=SENTRY_AUTH_TOKEN --variable-environment=production | tr -d ' ' | cut -d'=' -f2)
          npx sentry-expo-upload-sourcemaps dist

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

      - name: Finalize merge
        run: |
          echo "Deployment successful, finalizing merge..."
          git fetch origin main
          git merge origin/main -m "feat: Production deployment

Changes included:
${{ needs.check-deployment-type.outputs.commit_message }}"
          git push https://${{ secrets.PAT_GITHUB }}@github.com/${{ github.repository }}.git HEAD:production
```

Main changes:
1. Removed all revert logic and temporary merge steps
2. Simplified the finalize-deployment job to just merge main into production
3. Added `cache-dependency-path: yarn.lock` to all node setups
4. Added `--immutable` flag to all yarn installs
5. Kept the core functionality of checking versions and running either native builds or OTA updates

The workflow now more closely matches the preview workflow's simplicity while maintaining the production-specific configurations.

---



---

