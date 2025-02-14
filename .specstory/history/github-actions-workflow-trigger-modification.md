## SpecStory

## GitHub Actions Workflow Trigger Modification (2/4/2025, 9:04:48 AM)

_**User**_

I don't want to confirm, just a simple trigger without inputs

---

_**Assistant**_

I'll help you modify the workflow file to remove the confirmation input and make it a simple trigger. Here's the updated version:

```yaml:.github/workflows/deploy-production.yml
name: Deploy to Production

on:
  workflow_dispatch:

permissions:
  contents: write

jobs:
  merge-to-production:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
          token: ${{ secrets.PAT_GITHUB }}

      - name: Configure Git
        run: |
          git config --global user.email "github-actions[bot]@users.noreply.github.com"
          git config --global user.name "github-actions[bot]"

      - name: Merge main into production
        run: |
          git fetch origin main production
          git checkout production
          git merge origin/main -m "chore: Merge main into production"
          git push origin production
```

Key changes made:
1. Removed the `inputs` section from the `workflow_dispatch` trigger
2. Removed the `if` condition from the job since we no longer need to check for confirmation

Now the workflow can be triggered directly from the GitHub Actions UI without requiring any input confirmation.

---



---

