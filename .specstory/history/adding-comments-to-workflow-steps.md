## SpecStory

## Adding Comments to Workflow Steps (1/24/2025, 10:11:42 AM)

_**User**_

put small comments above each steps to explain what it'S doing ina. simple way

---

_**Assistant**_

I'll help add simple explanatory comments above each step. Here's how to modify the file:

```yaml:.github/workflows/deploy-prod.yml
// ... existing code ...

jobs:
  deploy-production:
    runs-on: ubuntu-latest

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

      # Set up Git with bot credentials for commits
      - name: Configure Git
        run: |
          git config --global user.email "github-actions[bot]@users.noreply.github.com"
          git config --global user.name "github-actions[bot]"

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
          # Get all commits that are in main but not in production
          COMMITS=$(git log origin/production..origin/main --pretty=format:"- %s")
          # Escape newlines and special characters for GitHub Actions
          COMMITS="${COMMITS//'%'/'%25'}"
          COMMITS="${COMMITS//$'\n'/'%0A'}"
          COMMITS="${COMMITS//$'\r'/'%0D'}"
          echo "message=$COMMITS" >> $GITHUB_OUTPUT

      # Set up Expo Application Services (EAS) CLI
      - name: Setup EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      # Create a temporary merge of main into production for testing
      - name: Create temporary merge
        id: temp_merge
        run: |
          # Store the current production HEAD for potential rollback
          echo "old_head=$(git rev-parse HEAD)" >> $GITHUB_OUTPUT
          # Create temporary merge
          git fetch origin main
          git merge origin/main --no-commit --no-ff
          git config --global user.email "github-actions[bot]@users.noreply.github.com"
          git config --global user.name "github-actions[bot]"
          git commit -m "temp: Temporary merge for deployment verification"

      # Check if there are any changes to native code or configuration files
      - name: Check for native changes
        id: check-changes
        run: |
          # Check changes between production and main branches
          if git diff origin/production..origin/main --name-only | grep -E "package.json|app.config.ts|ios/|android/"; then
            echo "has_native_changes=true" >> $GITHUB_OUTPUT
          else
            echo "has_native_changes=false" >> $GITHUB_OUTPUT
          fi

      # Set up Node.js environment
      - name: Setup node
        uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: "yarn"
        env:
          SKIP_YARN_COREPACK_CHECK: "1"
      - run: corepack enable

      # Install project dependencies
      - name: Install dependencies
        run: yarn install

      # Build new app binary if there are native changes or version mismatch
      - name: Build for production
        if: steps.check-changes.outputs.has_native_changes == 'true' || steps.version-compare.outputs.versions_match == 'false'
        run: eas build --platform all --profile production --non-interactive

      # Deploy OTA update if there are only JS changes and versions match
      - name: Run EAS Update
        if: steps.check-changes.outputs.has_native_changes == 'false' && steps.version-compare.outputs.versions_match == 'true'
        run: eas update --auto --profile production --message "${{ steps.commit_msg.outputs.message }}" --non-interactive

      # If deployment succeeds, merge main into production permanently
      - name: Finalize merge
        if: success()
        run: |
          git fetch origin main
          git merge origin/main -m "feat: Production deployment%0A%0AChanges included:%0A${{ steps.commit_msg.outputs.message }}"
          git push https://${{ secrets.PAT_GITHUB }}@github.com/${{ github.repository }}.git HEAD:production

      # If deployment fails, revert production branch to previous state
      - name: Rollback on failure
        if: failure()
        run: |
          git reset --hard ${{ steps.temp_merge.outputs.old_head }}
          git push --force https://${{ secrets.PAT_GITHUB }}@github.com/${{ github.repository }}.git HEAD:production

// ... existing code ...
```

I've added simple, descriptive comments above each step to explain its purpose. The comments are concise and focus on what each step does in plain language, making it easier to understand the workflow's logic at a glance.

---



---

