## SpecStory

## Production Deployment Workflow Update (1/24/2025, 9:48:03 AM)

_**User**_

adjust, we need to merge main in production branch when we deploy prod

---

_**Assistant**_

I'll help modify the workflow to merge the main branch into production before deploying. Here's the updated workflow file:

```yaml:.github/workflows/deploy-prod.yml
name: Production Deployment

on:
  push:
    branches:
      - production

# Ensure only one workflow runs at a time
concurrency:
  group: "deployment"
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
          fetch-depth: 0  # Changed to fetch full history

      - name: Configure Git
        run: |
          git config --global user.email "github-actions[bot]@users.noreply.github.com"
          git config --global user.name "github-actions[bot]"

      - name: Merge main into production
        run: |
          git fetch origin main
          git merge origin/main --no-edit
          git push https://${{ secrets.PAT_GITHUB }}@github.com/${{ github.repository }}.git HEAD:production

      - name: Get Commit Message
        id: commit_msg
        run: echo "message=$(git log -1 --pretty=%B)" >> $GITHUB_OUTPUT

      # ... rest of existing code ...
```

Key changes made:
1. Changed `fetch-depth: 2` to `fetch-depth: 0` to fetch the full git history
2. Added a "Configure Git" step early in the workflow
3. Added a new "Merge main into production" step that:
   - Fetches the main branch
   - Merges main into production
   - Pushes the merged result back to production

The rest of the workflow remains unchanged. This ensures that the production branch is always up-to-date with main before deploying.

Note: Make sure the `PAT_GITHUB` secret has sufficient permissions to push to the repository.

---



---

