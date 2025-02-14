## SpecStory

## Ensure Sentry Source Maps Upload (1/24/2025, 10:19:49 AM)

_**User**_

make sure to call "npx sentry-expo-upload-sourcemaps dist" after we did eas update or eas build

---

_**Assistant**_

I'll help add the Sentry source maps upload step after both the EAS build and update steps. Here's the modified code:

```yaml:.github/workflows/deploy-preview.yml
// ... existing code ...

      # Version increment and build for preview with native changes
      - name: Increment minor version and build
        if: steps.check-changes.outputs.has_native_changes == 'true'
        run: |
          git config --global user.email "github-actions[bot]@users.noreply.github.com"
          git config --global user.name "github-actions[bot]"
          node scripts/build/increment-minor-version.js
          git add .
          git commit -m "chore: increment minor version [skip ci]"
          git push https://${{ secrets.PAT_GITHUB }}@github.com/${{ github.repository }}.git HEAD:main
          eas build --platform all --profile preview --non-interactive
          npx sentry-expo-upload-sourcemaps dist

      # Add rollback step for build failures
      - name: Rollback on build failure
        if: failure() && steps.check-changes.outputs.has_native_changes == 'true'
        run: |
          git reset --hard HEAD~1
          git push --force https://${{ secrets.PAT_GITHUB }}@github.com/${{ github.repository }}.git HEAD:main

      # OTA Update for preview (no native changes)
      - name: Run EAS Update
        if: steps.check-changes.outputs.has_native_changes == 'false'
        run: |
          eas update --auto --profile preview --message "${{ steps.commit_msg.outputs.message }}" --non-interactive
          npx sentry-expo-upload-sourcemaps dist

// ... existing code ...
```

I've added the `npx sentry-expo-upload-sourcemaps dist` command:
1. After the EAS build command in the "Increment minor version and build" step
2. After the EAS update command in the "Run EAS Update" step

This ensures that source maps are uploaded to Sentry regardless of whether we're doing a native build or an OTA update.

---



---

