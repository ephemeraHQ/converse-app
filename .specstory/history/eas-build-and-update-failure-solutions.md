## SpecStory

## EAS Build and Update Failure Solutions (1/24/2025, 10:02:53 AM)

_**User**_

What if my eas build or eas update fail? Like then if i run the action again it will say that "production" has all the same code as "main" no? And so will not trigger anything... which is not what I want :( 

---

_**Assistant**_

Ah, good catch! You're right - if the build or update fails, the workflow has already merged main into production and potentially committed version changes, but didn't complete the deployment. This could cause issues on retry. Let's modify the workflow to be more resilient by moving the merge step after the successful build/update.

Here's how we can fix it:

```yaml:.github/workflows/deploy-prod.yml
// ... existing code ...

jobs:
  deploy-production:
    runs-on: ubuntu-latest

    steps:
      // ... existing checks and setup steps until after Setup EAS ...

      # Version increment and build for production with native changes
      - name: Increment minor version and build
        if: steps.check-changes.outputs.has_native_changes == 'true' || steps.version-compare.outputs.versions_match == 'false'
        run: |
          git config --global user.email "github-actions[bot]@users.noreply.github.com"
          git config --global user.name "github-actions[bot]"
          node scripts/build/increment-minor-version.js
          eas build --platform all --profile production --non-interactive

      # OTA Update for production (no native changes)
      - name: Run EAS Update
        if: steps.check-changes.outputs.has_native_changes == 'false' && steps.version-compare.outputs.versions_match == 'true'
        run: eas update --auto --profile production --message "${{ steps.commit_msg.outputs.message }}" --non-interactive

      # Only merge and push after successful build/update
      - name: Merge main into production and push changes
        run: |
          git fetch origin main
          git merge origin/main -m "feat: Production deployment%0A%0AChanges included:%0A${{ steps.commit_msg.outputs.message }}"
          # If we incremented the version, stage those changes
          git add .
          git commit -m "chore: increment minor version [skip ci]" || true
          git push https://${{ secrets.PAT_GITHUB }}@github.com/${{ github.repository }}.git HEAD:production
```

The key changes are:
1. Moved the merge and push steps to the end of the workflow
2. Combined the version increment commit with the merge push
3. Added `|| true` to the commit command in case there are no version changes to commit

This way, if the build or update fails, the production branch won't be updated, and you can safely retry the workflow. The changes will only be merged into production after a successful deployment.

---



---

