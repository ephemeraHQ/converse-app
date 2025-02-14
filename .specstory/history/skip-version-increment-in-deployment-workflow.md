## SpecStory

## Skip Version Increment in Deployment Workflow (1/24/2025, 10:05:36 AM)

_**User**_

I don't want to incremnt version here

---

_**Assistant**_

I'll help modify the workflow to skip version incrementing. Here's the relevant changes needed:

```yaml:.github/workflows/deploy-prod.yml
// ... existing code ...

      # Version increment and build for production with native changes
      - name: Build for production
        if: steps.check-changes.outputs.has_native_changes == 'true' || steps.version-compare.outputs.versions_match == 'false'
        run: |
          git config --global user.email "github-actions[bot]@users.noreply.github.com"
          git config --global user.name "github-actions[bot]"
          eas build --platform all --profile production --non-interactive

// ... existing code ...

      # Only merge and push after successful build/update
      - name: Merge main into production and push changes
        run: |
          git fetch origin main
          git merge origin/main -m "feat: Production deployment%0A%0AChanges included:%0A${{ steps.commit_msg.outputs.message }}"
          git push https://${{ secrets.PAT_GITHUB }}@github.com/${{ github.repository }}.git HEAD:production
```

The changes made:
1. Renamed the step from "Increment minor version and build" to just "Build for production"
2. Removed the `node scripts/build/increment-minor-version.js` command
3. In the final merge step, removed the version increment commit since we're no longer incrementing versions
4. Kept all the conditional logic and other functionality intact

This will now build the app without incrementing the version number while maintaining all other deployment functionality.

---



---

