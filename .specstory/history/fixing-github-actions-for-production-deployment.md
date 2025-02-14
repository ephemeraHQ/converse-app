## SpecStory

## Fixing GitHub Actions for Production Deployment (2/4/2025, 10:48:47 AM)

_**User**_

i feel my git action isn't good... this triggers when something gets merged on "production" branch. And then we check the diff version between production and main. But the problem is to trigger this action i actually merge "main" to "production"... so ti will always have the same version lol

---

_**Assistant**_

Ah, I see the issue! You're right - by the time the workflow runs, the versions will always match because the merge has already happened. Let's modify the workflow to check the versions before the merge is completed. We can do this by changing the workflow trigger to run on pull requests targeting the production branch instead.

Here's how we can fix it:

```yaml:.github/workflows/production-deployment.yml
name: Production Deployment

on:
  pull_request:
    branches:
      - production
  push:
    branches:
      - production

# ... existing code ...

jobs:
  check-deployment-type:
    # Only run version check on pull requests
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    outputs:
      versions_match: ${{ steps.version-compare.outputs.versions_match }}
      commit_message: ${{ steps.commit_msg.outputs.message }}

    steps:
      # ... existing EXPO_TOKEN check ...

      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
          token: ${{ secrets.PAT_GITHUB }}

      - name: Compare versions with main
        id: version-compare
        run: |
          # Compare the version in the PR branch with main
          git fetch origin main
          MAIN_VERSION=$(git show origin/main:package.json | jq -r .version)
          PR_VERSION=$(git show HEAD:package.json | jq -r .version)
          if [ "$MAIN_VERSION" != "$PR_VERSION" ]; then
            echo "versions_match=false" >> $GITHUB_OUTPUT
          else
            echo "versions_match=true" >> $GITHUB_OUTPUT
          fi

  # Add a new deployment job that runs on push to production
  deploy:
    if: github.event_name == 'push' && github.ref == 'refs/heads/production'
    runs-on: ubuntu-latest
    needs: []  # No needs since this runs independently on push

    steps:
      # ... copy the build/update steps here ...
      # This will execute the actual deployment after the PR is merged

  # ... rest of the existing jobs should depend on check-deployment-type only for pull_request ...
  ios-build:
    needs: check-deployment-type
    if: github.event_name == 'pull_request' && needs.check-deployment-type.outputs.versions_match == 'false'
    # ... rest of job remains the same ...

  android-build:
    needs: check-deployment-type
    if: github.event_name == 'pull_request' && needs.check-deployment-type.outputs.versions_match == 'false'
    # ... rest of job remains the same ...

  ota-update:
    needs: check-deployment-type
    if: github.event_name == 'pull_request' && needs.check-deployment-type.outputs.versions_match == 'true'
    # ... rest of job remains the same ...
```

The key changes are:

1. Added `pull_request` trigger to run checks before the merge happens
2. Added conditions to differentiate between pull request and push events
3. Split the workflow into two parts:
   - Version checking and validation on pull requests
   - Actual deployment after the merge is completed

This way, when you create a PR from main to production:
1. The workflow will first run on the PR to check versions and validate the deployment type
2. After the PR is merged, the workflow will run again to perform the actual deployment

You'll need to set up branch protection rules on the production branch to:
1. Require the status checks to pass before merging
2. Prevent direct pushes to production (must go through PR)

This ensures the proper checks happen before the merge, and the deployment happens after the merge is completed.

---

_**User**_

no don't want pull request stuff. I will have a manual trigger for this git action 

---

_**Assistant**_

Ah, I understand! Let's modify the workflow to use a manual trigger (workflow_dispatch) instead. This way, you can manually trigger the deployment after ensuring everything is ready.

```yaml:.github/workflows/production-deployment.yml
name: Production Deployment

on:
  workflow_dispatch:
    inputs:
      deployment_type:
        description: 'Deployment type (build/update)'
        required: true
        type: choice
        options:
          - auto
          - build
          - update

# ... existing concurrency config ...

jobs:
  check-deployment-type:
    runs-on: ubuntu-latest
    outputs:
      versions_match: ${{ steps.version-compare.outputs.versions_match }}
      commit_message: ${{ steps.commit_msg.outputs.message }}
      deployment_type: ${{ steps.determine-deployment.outputs.type }}

    steps:
      # ... existing EXPO_TOKEN check ...

      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
          token: ${{ secrets.PAT_GITHUB }}

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

      - name: Determine deployment type
        id: determine-deployment
        run: |
          if [ "${{ inputs.deployment_type }}" = "auto" ]; then
            # Use version comparison to determine type
            if [ "${{ steps.version-compare.outputs.versions_match }}" = "true" ]; then
              echo "type=update" >> $GITHUB_OUTPUT
            else
              echo "type=build" >> $GITHUB_OUTPUT
            fi
          else
            # Use manually specified type
            echo "type=${{ inputs.deployment_type }}" >> $GITHUB_OUTPUT
          fi

      # ... existing commit message step ...

  ios-build:
    needs: check-deployment-type
    if: needs.check-deployment-type.outputs.deployment_type == 'build'
    # ... rest of job remains the same ...

  android-build:
    needs: check-deployment-type
    if: needs.check-deployment-type.outputs.deployment_type == 'build'
    # ... rest of job remains the same ...

  ota-update:
    needs: check-deployment-type
    if: needs.check-deployment-type.outputs.deployment_type == 'update'
    # ... rest of job remains the same ...
```

Key changes:
1. Replaced the `push` trigger with `workflow_dispatch`
2. Added an input parameter to manually specify the deployment type
3. Modified the job conditions to use the determined deployment type
4. Added logic to either auto-determine the deployment type based on versions or use the manually specified type

Now you can:
1. Manually trigger the workflow from the GitHub Actions UI
2. Choose between:
   - `auto`: Automatically determines whether to do a build or update based on version comparison
   - `build`: Forces a full build regardless of versions
   - `update`: Forces an OTA update regardless of versions
3. The workflow will execute the appropriate jobs based on your selection

This gives you more control over the deployment process while still maintaining the version checking logic if you choose to use it.

---

_**User**_

ok that's good but the only thing is once we checked with main to see the version difference, we need to actually merge the code to the production branch so that the eas build or eas update push the new code you know

---

_**Assistant**_

Ah yes, you're absolutely right! We need to merge the main branch into production before running the build/update so that we're deploying the latest code. Let's add a merge step right after the version check:

```yaml:.github/workflows/production-deployment.yml
jobs:
  check-deployment-type:
    runs-on: ubuntu-latest
    outputs:
      versions_match: ${{ steps.version-compare.outputs.versions_match }}
      commit_message: ${{ steps.commit_msg.outputs.message }}
      deployment_type: ${{ steps.determine-deployment.outputs.type }}

    steps:
      # ... existing steps ...

      - name: Merge main into production
        run: |
          git config --global user.email "github-actions[bot]@users.noreply.github.com"
          git config --global user.name "github-actions[bot]"
          git checkout production
          git pull origin production
          git merge origin/main -m "feat: Merge main into production for deployment"
          git push origin production

      # Move the commit message collection after the merge
      - name: Get Commit Messages
        id: commit_msg
        run: |
          COMMITS=$(git log origin/production..HEAD --pretty=format:"- %s")
          COMMITS="${COMMITS//'%'/'%25'}"
          COMMITS="${COMMITS//$'\n'/'%0A'}"
          COMMITS="${COMMITS//$'\r'/'%0D'}"
          echo "message=$COMMITS" >> $GITHUB_OUTPUT

# ... rest of the workflow remains the same ...
```

The key changes are:
1. Added a merge step that merges main into production before running any builds/updates
2. Moved the commit message collection after the merge to capture the new changes
3. Updated the git log command to compare between the old production and the new HEAD

Now the workflow will:
1. Check versions
2. Determine deployment type
3. Merge main into production
4. Run the appropriate build or update jobs with the latest code

This ensures we're always deploying the latest code from main to production.

---

_**User**_

remove all the stuff related to the commit message

---

_**Assistant**_



I'll remove all the commit message related steps and outputs. Here's the cleaned up version:

```yaml:.github/workflows/production-deployment.yml
jobs:
  check-deployment-type:
    runs-on: ubuntu-latest
    outputs:
      versions_match: ${{ steps.version-compare.outputs.versions_match }}
      deployment_type: ${{ steps.determine-deployment.outputs.type }}

    steps:
      # ... existing EXPO_TOKEN check and checkout steps ...

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
          git config --global user.email "github-actions[bot]@users.noreply.github.com"
          git config --global user.name "github-actions[bot]"
          git checkout production
          git pull origin production
          git merge origin/main -m "feat: Merge main into production for deployment"
          git push origin production

      - name: Determine deployment type
        id: determine-deployment
        run: |
          if [ "${{ inputs.deployment_type }}" = "auto" ]; then
            if [ "${{ steps.version-compare.outputs.versions_match }}" = "true" ]; then
              echo "type=update" >> $GITHUB_OUTPUT
            else
              echo "type=build" >> $GITHUB_OUTPUT
            fi
          else
            echo "type=${{ inputs.deployment_type }}" >> $GITHUB_OUTPUT
          fi

  # Update the ota-update job to remove commit message
  ota-update:
    needs: check-deployment-type
    if: needs.check-deployment-type.outputs.deployment_type == 'update'
    runs-on: ubuntu-latest

    steps:
      # ... existing setup steps ...

      - name: Run EAS Update
        run: |
          eas update --auto --channel=production --non-interactive

# ... rest of the workflow remains the same ...
```

Key changes:
1. Removed `commit_message` from the outputs
2. Removed the "Get Commit Messages" step
3. Simplified the EAS update command by removing the message parameter

The workflow will now be cleaner and more focused on just handling the deployment process.

---



---

