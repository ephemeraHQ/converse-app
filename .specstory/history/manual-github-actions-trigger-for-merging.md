## SpecStory

## Manual GitHub Actions Trigger for Merging (2/4/2025, 9:02:33 AM)

_**User**_

i want a manual trigger in git actions that when we do it , it merges "main" into "production". Shuold i have this ttrigger in this git action or create a new git action?

---

_**Assistant**_

It's better to create a new GitHub Actions workflow file for this manual trigger, as it has a different purpose than the production deployment workflow. Here's how you can create a new workflow file:

```yaml:/.github/workflows/merge-main-to-production.yml
name: Merge Main to Production

on:
  workflow_dispatch:
    inputs:
      confirm_merge:
        description: 'Type "YES" to confirm merging main into production'
        required: true
        type: string

permissions:
  contents: write

jobs:
  merge-to-production:
    runs-on: ubuntu-latest
    if: github.event.inputs.confirm_merge == 'YES'

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

This new workflow:
1. Can be triggered manually from GitHub UI using the "Actions" tab
2. Requires typing "YES" as confirmation before proceeding
3. Uses PAT_GITHUB token for authentication
4. Performs a clean merge from main to production branch

The reason to keep this separate from the production deployment workflow is:
1. Separation of concerns - merging is different from deployment
2. Cleaner workflow organization
3. Ability to merge without necessarily triggering a deployment
4. Easier to maintain and modify each workflow independently

The production deployment will still trigger automatically after this merge since it watches for pushes to the production branch.

---

_**User**_

should we call deploy prod instead or merge main to production?

---

_**Assistant**_

Yes, it would be better to call the production deployment workflow directly after merging, to ensure the deployment process starts immediately and to maintain better control over the workflow. Here's the updated version:

```yaml:.github/workflows/merge-main-to-production.yml
name: Merge Main to Production

on:
  workflow_dispatch:
    inputs:
      confirm_merge:
        description: 'Type "YES" to confirm merging main into production'
        required: true
        type: string

permissions:
  contents: write

jobs:
  merge-to-production:
    runs-on: ubuntu-latest
    if: github.event.inputs.confirm_merge == 'YES'

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

      - name: Trigger Production Deployment
        uses: actions/github-script@v7
        with:
          github-token: ${{ secrets.PAT_GITHUB }}
          script: |
            await github.rest.actions.createWorkflowDispatch({
              owner: context.repo.owner,
              repo: context.repo.repo,
              workflow_id: 'production-deployment.yml',
              ref: 'production'
            });
```

The changes:
1. Added a new step that explicitly triggers the production deployment workflow
2. Uses the GitHub API to trigger the workflow instead of relying on the push event
3. This ensures the deployment starts immediately after the merge
4. Provides better visibility of the process in the GitHub Actions UI

Note: Make sure your production-deployment.yml workflow also has a `workflow_dispatch` trigger if it doesn't already have one:

```yaml
on:
  push:
    branches:
      - production
  workflow_dispatch:  # Add this trigger
```

---



---

