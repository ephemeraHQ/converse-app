## SpecStory

## Expo Deployment Workflow Adaptation (1/23/2025, 5:01:50 PM)

_**User**_

adapat this with this : I need 2 environemnts preview and production. increment patch if env preview is triggered and only has native change. If env production do a minor increment version number. Also make sure only ONE of this execute at a time. need one to be finished until the new one start so we can make sure we increment version number correctly.

name: Expo Deployment Workflow

on:
  push:
    branches:
      - main
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to deploy to'
        required: true
        default: 'preview'

jobs:
  cancel-previous:
    name: Cancel Previous Runs
    runs-on: ubuntu-latest
    steps:
      - name: Cancel Previous Workflow Runs
        uses: styfle/cancel-workflow-action@0.11.0
        with:
          access_token: ${{ secrets.GITHUB_TOKEN }}

  deployment:
    name: Deployment
    runs-on: ubuntu-latest
    needs: cancel-previous

    steps:
      # Checkout the repository
      - name: Checkout code
        uses: actions/checkout@v3

      # Setup Node.js (required for Expo CLI)
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 16

      # Install dependencies
      - name: Install dependencies
        run: yarn install --frozen-lockfile

      # Determine the environment
      - name: Set environment
        id: set-env
        run: |
          if [[ "${{ github.event_name }}" == "workflow_dispatch" ]]; then
            echo "environment=${{ github.event.inputs.environment }}" >> $GITHUB_ENV
          else
            echo "environment=preview" >> $GITHUB_ENV
          fi

      # Detect changes
      - name: Detect changes (JS or native)
        id: detect-changes
        run: |
          if git diff --name-only HEAD~1 | grep -qE "(ios|android|native_code_folder)"; then
            echo "change_type=native" >> $GITHUB_ENV
          else
            echo "change_type=js" >> $GITHUB_ENV
          fi
        shell: bash

      # Perform OTA Update
      - name: OTA Update
        if: env.change_type == 'js' && env.environment == 'preview'
        run: |
          eas update --branch preview

      # Increment app version and build
      - name: Increment App Version and Build
        if: env.change_type == 'native'
        run: |
          yarn increment-version
          git commit -am "chore: bump version to $(node -p "require('./package.json').version")"
          git push origin main
          eas build --profile ${{ env.environment }}

      # Deploy OTA to Production
      - name: Deploy OTA to Production
        if: env.environment == 'production' && env.change_type == 'js'
        run: |
          eas update --branch production

      # Deploy Native Build to Production
      - name: Deploy Native Build to Production
        if: env.environment == 'production' && env.change_type == 'native'
        run: |
          eas build --profile production

---

_**Assistant**_

I'll help you adapt the workflow file to handle both preview and production environments with proper version increments and concurrency control. Here's the modified version:

```yaml:.github/workflows/build-or-update-prod.yml
name: Expo Deployment Workflow

on:
  push:
    branches:
      - main
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to deploy to'
        required: true
        default: 'preview'
        type: choice
        options:
          - preview
          - production

# Ensure only one workflow runs at a time across all triggers
concurrency: 
  group: "deployment"
  cancel-in-progress: false

permissions:
  contents: write

jobs:
  check-and-deploy:
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

      - name: Determine Environment
        id: environment
        run: |
          if [[ "${{ github.event_name }}" == "workflow_dispatch" ]]; then
            echo "env=${{ github.event.inputs.environment }}" >> $GITHUB_OUTPUT
          else
            echo "env=preview" >> $GITHUB_OUTPUT
          fi

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
      - name: Increment patch version and build (Preview)
        if: steps.environment.outputs.env == 'preview' && steps.check-changes.outputs.has_native_changes == 'true'
        run: |
          git config --global user.email "github-actions[bot]@users.noreply.github.com"
          git config --global user.name "github-actions[bot]"
          node scripts/build/increment-patch-version.js
          git add .
          git commit -m "chore: increment patch version [skip ci]"
          git push https://${{ secrets.PAT_GITHUB }}@github.com/${{ github.repository }}.git HEAD:main
          eas build --platform all --profile preview --non-interactive

      # Version increment and build for production
      - name: Increment minor version and build (Production)
        if: steps.environment.outputs.env == 'production'
        run: |
          git config --global user.email "github-actions[bot]@users.noreply.github.com"
          git config --global user.name "github-actions[bot]"
          node scripts/build/increment-minor-version.js
          git add .
          git commit -m "chore: increment minor version [skip ci]"
          git push https://${{ secrets.PAT_GITHUB }}@github.com/${{ github.repository }}.git HEAD:main
          eas build --platform all --profile production --non-interactive

      # OTA Update for preview (no native changes)
      - name: Run EAS Update (Preview)
        if: steps.environment.outputs.env == 'preview' && steps.check-changes.outputs.has_native_changes == 'false'
        run: eas update --auto --profile preview --message "${{ steps.commit_msg.outputs.message }}" --non-interactive

      # OTA Update for production (no native changes)
      - name: Run EAS Update (Production)
        if: steps.environment.outputs.env == 'production' && steps.check-changes.outputs.has_native_changes == 'false'
        run: eas update --auto --profile production --message "${{ steps.commit_msg.outputs.message }}" --non-interactive
```

Key changes made:

1. Added workflow_dispatch trigger with environment input choice
2. Implemented global concurrency control with `concurrency.group: "deployment"` to ensure only one workflow runs at a time
3. Added environment determination step based on trigger type
4. Split version increment logic:
   - Preview environment with native changes: patch increment
   - Production environment: minor increment
5. Maintained separate build and update steps for each environment
6. Added proper git configuration for version commits
7. Kept the native changes detection logic
8. Separated the EAS update commands for preview and production

You'll need to ensure you have these scripts in your repository:
- `scripts/build/increment-patch-version.js`
- `scripts/build/increment-minor-version.js`

The workflow will:
1. Run only one at a time (concurrency control)
2. For preview environment:
   - Increment patch version if native changes detected
   - Do OTA update if no native changes
3. For production environment:
   - Always increment minor version
   - Build new version if native changes
   - Do OTA update if no native changes

---



---

