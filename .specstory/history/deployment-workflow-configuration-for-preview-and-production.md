## SpecStory

## Deployment Workflow Configuration for Preview and Production (1/23/2025, 5:06:01 PM)

_**User**_

ok it's not completey right.

I think i will need another action and another branch called production maybe...

Because I want that when we deploy on prod, it checks also if the new stuff merged is only JS vs Native to do OTA vs eas build you know.

Would have love to only have 1 branch but I don't think it will be possible?

---

_**Assistant**_

You're right - to properly handle both preview and production deployments with the OTA vs native build logic, it would be cleaner to have separate branches. Here's how we can modify the workflow to handle this:

```yaml:.github/workflows/build-or-update-prod.yml
name: Expo Deployment Workflow

on:
  # Trigger on pushes to preview branch
  push:
    branches:
      - preview
      - production
  # Keep manual trigger for flexibility
  workflow_dispatch:
    inputs:
      environment:
        description: "Environment to deploy to"
        required: true
        default: "preview"
        type: choice
        options:
          - preview
          - production

# ... existing concurrency and permissions config ...

jobs:
  check-and-deploy:
    runs-on: ubuntu-latest

    steps:
      # ... existing initial steps until environment determination ...

      - name: Determine Environment
        id: environment
        run: |
          if [[ "${{ github.event_name }}" == "workflow_dispatch" ]]; then
            echo "env=${{ github.event.inputs.environment }}" >> $GITHUB_OUTPUT
          elif [[ "${{ github.ref }}" == "refs/heads/production" ]]; then
            echo "env=production" >> $GITHUB_OUTPUT
          else
            echo "env=preview" >> $GITHUB_OUTPUT
          fi

      # ... existing setup steps ...

      # Version increment and build for preview with native changes
      - name: Increment patch version and build (Preview)
        if: steps.environment.outputs.env == 'preview' && steps.check-changes.outputs.has_native_changes == 'true'
        run: |
          git config --global user.email "github-actions[bot]@users.noreply.github.com"
          git config --global user.name "github-actions[bot]"
          node scripts/build/increment-patch-version.js
          git add .
          git commit -m "chore: increment patch version [skip ci]"
          git push https://${{ secrets.PAT_GITHUB }}@github.com/${{ github.repository }}.git HEAD:preview
          eas build --platform all --profile preview --non-interactive

      # Version increment and build for production with native changes
      - name: Increment minor version and build (Production)
        if: steps.environment.outputs.env == 'production' && steps.check-changes.outputs.has_native_changes == 'true'
        run: |
          git config --global user.email "github-actions[bot]@users.noreply.github.com"
          git config --global user.name "github-actions[bot]"
          node scripts/build/increment-minor-version.js
          git add .
          git commit -m "chore: increment minor version [skip ci]"
          git push https://${{ secrets.PAT_GITHUB }}@github.com/${{ github.repository }}.git HEAD:production
          eas build --platform all --profile production --non-interactive

      # ... existing OTA update steps remain the same ...
```

The main changes are:

1. Modified the trigger to watch both `preview` and `production` branches
2. Updated the environment determination to check which branch triggered the workflow
3. Updated the git push commands to push to the respective branches

The workflow now works like this:

- For preview deployments:
  - Push to `preview` branch or manual trigger with "preview"
  - Checks for native changes
  - If native changes: Increments patch version and does full build
  - If JS only: Does OTA update

- For production deployments:
  - Push to `production` branch or manual trigger with "production"
  - Checks for native changes
  - If native changes: Increments minor version and does full build
  - If JS only: Does OTA update

You would typically merge changes from `preview` to `production` when ready to deploy to production. This way, you maintain separate environments and can properly track versions for each.

---

_**User**_

I think I would want a github action for each enviornement and not have inputs on the github action and like it could be build-or-update-preview and build-or-update-prod

---

_**Assistant**_

Yes, that's a cleaner approach! Let's split it into two separate workflow files:

```yaml:.github/workflows/build-or-update-preview.yml
name: Preview Deployment

on:
  push:
    branches:
      - preview

# Ensure only one workflow runs at a time
concurrency:
  group: "preview-deployment"
  cancel-in-progress: false

permissions:
  contents: write

jobs:
  deploy-preview:
    runs-on: ubuntu-latest

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
          fetch-depth: 2

      - name: Get Commit Message
        id: commit_msg
        run: echo "message=$(git log -1 --pretty=%B)" >> $GITHUB_OUTPUT

      - name: Check for native changes
        id: check-changes
        run: |
          if git diff --name-only HEAD^ HEAD | grep -E "package.json|app.config.ts|ios/|android/"; then
            echo "has_native_changes=true" >> $GITHUB_OUTPUT
          else
            echo "has_native_changes=false" >> $GITHUB_OUTPUT
          fi

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

      # Version increment and build for preview with native changes
      - name: Increment patch version and build
        if: steps.check-changes.outputs.has_native_changes == 'true'
        run: |
          git config --global user.email "github-actions[bot]@users.noreply.github.com"
          git config --global user.name "github-actions[bot]"
          node scripts/build/increment-patch-version.js
          git add .
          git commit -m "chore: increment patch version [skip ci]"
          git push https://${{ secrets.PAT_GITHUB }}@github.com/${{ github.repository }}.git HEAD:preview
          eas build --platform all --profile preview --non-interactive

      # OTA Update for preview (no native changes)
      - name: Run EAS Update
        if: steps.check-changes.outputs.has_native_changes == 'false'
        run: eas update --auto --profile preview --message "${{ steps.commit_msg.outputs.message }}" --non-interactive
```

```yaml:.github/workflows/build-or-update-prod.yml
name: Production Deployment

on:
  push:
    branches:
      - production

# Ensure only one workflow runs at a time
concurrency:
  group: "production-deployment"
  cancel-in-progress: false

permissions:
  contents: write

jobs:
  deploy-production:
    runs-on: ubuntu-latest

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
          fetch-depth: 2

      - name: Get Commit Message
        id: commit_msg
        run: echo "message=$(git log -1 --pretty=%B)" >> $GITHUB_OUTPUT

      - name: Check for native changes
        id: check-changes
        run: |
          if git diff --name-only HEAD^ HEAD | grep -E "package.json|app.config.ts|ios/|android/"; then
            echo "has_native_changes=true" >> $GITHUB_OUTPUT
          else
            echo "has_native_changes=false" >> $GITHUB_OUTPUT
          fi

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

      # Version increment and build for production with native changes
      - name: Increment minor version and build
        if: steps.check-changes.outputs.has_native_changes == 'true'
        run: |
          git config --global user.email "github-actions[bot]@users.noreply.github.com"
          git config --global user.name "github-actions[bot]"
          node scripts/build/increment-minor-version.js
          git add .
          git commit -m "chore: increment minor version [skip ci]"
          git push https://${{ secrets.PAT_GITHUB }}@github.com/${{ github.repository }}.git HEAD:production
          eas build --platform all --profile production --non-interactive

      # OTA Update for production (no native changes)
      - name: Run EAS Update
        if: steps.check-changes.outputs.has_native_changes == 'false'
        run: eas update --auto --profile production --message "${{ steps.commit_msg.outputs.message }}" --non-interactive
```

Key changes made:
1. Split into two separate workflows, each triggered by its respective branch
2. Removed the workflow_dispatch and environment inputs
3. Simplified the job names and conditions
4. Each workflow has its own concurrency group
5. Removed environment determination steps since each workflow is environment-specific

The workflow now works like this:
- Changes pushed to `preview` branch trigger `build-or-update-preview.yml`
- Changes pushed to `production` branch trigger `build-or-update-prod.yml`
- Each workflow automatically determines if it needs a full build (native changes) or just an OTA update (JS-only changes)

This makes the deployment process clearer and more maintainable, with each environment having its dedicated workflow file.

---



---

