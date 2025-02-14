## SpecStory

## Production Deployment Workflow Adaptation (1/24/2025, 9:59:32 AM)

_**User**_

make sure to adapt to compare version with main  like we're doing here

name: Deploy to Production

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to deploy to'
        required: true
        default: 'production'

jobs:
  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 16

      - name: Install Dependencies
        run: yarn install

      - name: Compare Versions
        id: compare-versions
        run: node ./scripts/compare-versions.js

      - name: Merge Main to Production
        run: |
          git checkout production
          git merge main
          git push origin production

      - name: Deploy Production
        run: |
          if [[ "${{ steps.compare-versions.outputs.match }}" == "false" ]]; then
            eas build --profile production
          else
            eas update --profile production
          fi

      - name: Notify Slack
        uses: slackapi/slack-github-action@v1.23.0
        with:
          channel-id: YOUR_CHANNEL_ID
          text: "Production deployment complete. App version: $(cat versions.json | jq -r .version)"
          slack-token: ${{ secrets.SLACK_TOKEN }}

---

_**Assistant**_

I'll help adapt the workflow to include version comparison with main. Here are the necessary changes:

```yaml:.github/workflows/deploy-prod.yml
name: Production Deployment

on:
  push:
    branches:
      - production

# ... existing code ...

      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Configure Git
        run: |
          git config --global user.email "github-actions[bot]@users.noreply.github.com"
          git config --global user.name "github-actions[bot]"

      # Add version comparison step
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

      - name: Merge main into production
        run: |
          git fetch origin main
          git merge origin/main --no-edit
          git push https://${{ secrets.PAT_GITHUB }}@github.com/${{ github.repository }}.git HEAD:production

# ... existing code ...

      # Update version check logic
      - name: Increment minor version and build
        if: steps.check-changes.outputs.has_native_changes == 'true' || steps.version-compare.outputs.versions_match == 'false'
        run: |
          git config --global user.email "github-actions[bot]@users.noreply.github.com"
          git config --global user.name "github-actions[bot]"
          node scripts/build/increment-minor-version.js
          git add .
          git commit -m "chore: increment minor version [skip ci]"
          git push https://${{ secrets.PAT_GITHUB }}@github.com/${{ github.repository }}.git HEAD:production
          eas build --platform all --profile production --non-interactive

      # Update OTA condition
      - name: Run EAS Update
        if: steps.check-changes.outputs.has_native_changes == 'false' && steps.version-compare.outputs.versions_match == 'true'
        run: eas update --auto --profile production --message "${{ steps.commit_msg.outputs.message }}" --non-interactive

# ... existing code ...
```

The main changes include:

1. Added a new `Compare versions with main` step that:
   - Fetches the main branch
   - Compares versions between main and production branches
   - Sets an output variable `versions_match`

2. Updated the conditions for both the version increment and OTA update steps:
   - Version increment now runs if there are native changes OR if versions don't match
   - OTA update only runs if there are no native changes AND versions match

This ensures that we properly handle version differences between main and production branches, similar to the example workflow you provided.

---



---

