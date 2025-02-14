## SpecStory

## Managing Git Changes During EAS Build (1/27/2025, 11:19:18 AM)

_**User**_

when we do "scripts/build/ios/preview.js" it'S only before eas build but when we're do with eas build and npx sentry-expo... we can clear those git changes to not push them. But the problem is we can't clear everything because we also have npm version before and we want to push that version change...

---

_**Assistant**_

I understand you want to keep the version bump changes but discard the changes made by the iOS preview script after the build is complete. Here's how we can modify the workflow to achieve this:

```yaml:.github/workflows/deploy-preview.yml
// ... existing code ...

      # Version increment and build for preview with native changes
      - name: Increment minor version and build
        if: steps.check-changes.outputs.has_native_changes == 'true'
        run: |
          git config --global user.email "github-actions[bot]@users.noreply.github.com"
          git config --global user.name "github-actions[bot]"
          # Store the current commit hash before version bump
          CURRENT_COMMIT=$(git rev-parse HEAD)
          npm version minor -m "chore: increment minor version [skip ci]"
          # Push version bump
          git push https://${{ secrets.PAT_GITHUB }}@github.com/${{ github.repository }}.git HEAD:main --follow-tags
          # Run preview script and build
          node scripts/build/ios/preview.js
          eas build --platform all --profile preview --non-interactive --auto-submit
          npx sentry-expo-upload-sourcemaps dist
          # Reset to the commit with version bump but without preview script changes
          git reset --hard HEAD~1
          git push --force https://${{ secrets.PAT_GITHUB }}@github.com/${{ github.repository }}.git HEAD:main

      # Add rollback step for build failures
// ... existing code ...
```

The key changes are:
1. We store the commit hash before the version bump
2. After all the build steps are complete, we use `git reset --hard HEAD~1` to go back to the version bump commit
3. Force push to remove the preview script changes while keeping the version bump

This way, the version bump remains in the repository history, but the temporary changes from the preview script are discarded after they're no longer needed.

---



---

