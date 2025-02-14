## SpecStory

## Deployment Workflow and Merge Strategy Discussion (1/24/2025, 10:06:32 AM)

_**User**_

I feel this isn'T good? Like when it check for native changes, it will not have the code from main since we only merge it at the end no? Are we sure we are not supposed to merge into production first? But also I'm not sure because like i told you... if eas build or eas update fail, I'm then stuck with having merged the changes but didn'T deploy!! So maybe in that case we rollback?

---

_**Assistant**_

You raise a very good point! The current workflow has a few potential issues. Here's what we should change:

1. We should merge main into production first, but within a temporary merge commit that we can roll back if the deployment fails
2. Check for native changes using the diff between main and production branches, not just the last commit
3. Add error handling and rollback capability

Here's how we can modify the workflow:

```yaml:.github/workflows/deploy-prod.yml
// ... existing code ...

jobs:
  deploy-production:
    runs-on: ubuntu-latest

    steps:
      // ... existing initial steps until after Setup EAS ...

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

      - name: Check for native changes
        id: check-changes
        run: |
          # Check changes between production and main branches
          if git diff origin/production..origin/main --name-only | grep -E "package.json|app.config.ts|ios/|android/"; then
            echo "has_native_changes=true" >> $GITHUB_OUTPUT
          else
            echo "has_native_changes=false" >> $GITHUB_OUTPUT
          fi

      # Version increment and build for production with native changes
      - name: Build for production
        if: steps.check-changes.outputs.has_native_changes == 'true' || steps.version-compare.outputs.versions_match == 'false'
        run: eas build --platform all --profile production --non-interactive

      # OTA Update for production (no native changes)
      - name: Run EAS Update
        if: steps.check-changes.outputs.has_native_changes == 'false' && steps.version-compare.outputs.versions_match == 'true'
        run: eas update --auto --profile production --message "${{ steps.commit_msg.outputs.message }}" --non-interactive

      # Only create final merge if deployment was successful
      - name: Finalize merge
        if: success()
        run: |
          git fetch origin main
          git merge origin/main -m "feat: Production deployment%0A%0AChanges included:%0A${{ steps.commit_msg.outputs.message }}"
          git push https://${{ secrets.PAT_GITHUB }}@github.com/${{ github.repository }}.git HEAD:production

      # Rollback if deployment failed
      - name: Rollback on failure
        if: failure()
        run: |
          git reset --hard ${{ steps.temp_merge.outputs.old_head }}
          git push --force https://${{ secrets.PAT_GITHUB }}@github.com/${{ github.repository }}.git HEAD:production
```

Key changes made:
1. Added a temporary merge step that creates a merge commit we can roll back if needed
2. Modified the native changes check to look at differences between production and main branches
3. Added a rollback step that triggers on failure
4. Split the final merge into its own step that only runs on success

This way:
- We have the correct code state when checking for native changes
- If the build/update fails, we can safely roll back to the previous production state
- We only finalize the merge if everything succeeds
- We maintain a clean git history with proper merge commits

The workflow now follows a safer pattern:
1. Create temporary merge
2. Check changes and attempt deployment
3. If successful, create final merge commit
4. If failed, roll back to previous state

---



---

