## SpecStory

## Improving GitHub Actions Workflow Cleanliness (1/19/2025, 7:50:02 PM)

_**User**_

can i make this cleaner?

---

_**Assistant**_

I'll help you clean up the GitHub Actions workflow file. Here's a cleaner version with better organization and some improvements:

```yaml:.github/workflows/build-or-update-prod.yml
name: Build or Update Production

on:
  push:
    branches: [main]

# Prevent version race conditions
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: false

permissions:
  contents: write

env:
  GIT_BOT_EMAIL: "github-actions[bot]@users.noreply.github.com"
  GIT_BOT_NAME: "github-actions[bot]"

jobs:
  check-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Validate EXPO_TOKEN exists
        run: |
          if [ -z "${{ secrets.EXPO_TOKEN }}" ]; then
            echo "Error: Missing EXPO_TOKEN secret. See: https://docs.expo.dev/eas-update/github-actions"
            exit 1
          fi

      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 2

      - name: Get commit message
        id: commit
        run: echo "message=$(git log -1 --pretty=%B)" >> $GITHUB_OUTPUT

      - name: Check for dependency or config changes
        id: changes
        run: |
          if git diff --name-only HEAD^ HEAD | grep -E "package.json|app.config.ts"; then
            echo "detected=true" >> $GITHUB_OUTPUT
          else
            echo "detected=false" >> $GITHUB_OUTPUT
          fi

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: "yarn"
        env:
          SKIP_YARN_COREPACK_CHECK: "1"

      - name: Enable Corepack
        run: corepack enable

      - name: Install dependencies
        run: yarn install

      - name: Setup EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      # Build flow - runs when dependencies or config change
      - name: Build for production
        if: steps.changes.outputs.detected == 'true'
        run: eas build --platform all --profile production --non-interactive

      - name: Update version numbers
        if: steps.changes.outputs.detected == 'true'
        run: |
          git config --global user.email "${{ env.GIT_BOT_EMAIL }}"
          git config --global user.name "${{ env.GIT_BOT_NAME }}"
          node scripts/build/increment-versions.js
          git add .
          git commit -m "chore: increment version numbers [skip ci]"
          git push https://${{ secrets.PAT_GITHUB }}@github.com/${{ github.repository }}.git HEAD:main

      # Update flow - runs when no dependency or config changes detected
      - name: Update production
        if: steps.changes.outputs.detected == 'false'
        run: eas update --auto --profile production --message "${{ steps.commit.outputs.message }}" --non-interactive
```

Key improvements made:

1. Added `env` block for git configuration values
2. Improved step names for clarity
3. Simplified output variable names
4. Better organization with comments to separate build and update flows
5. More consistent naming conventions
6. Fixed deprecated `set-output` command to use the newer `>>$GITHUB_OUTPUT` syntax
7. Improved error message formatting
8. Simplified branch specification in the trigger
9. Added comments to explain major sections

The functionality remains the same, but the workflow is now more maintainable and easier to read.

---



---

