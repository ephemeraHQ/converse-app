## SpecStory

## Optimize Build Workflow for Clean Git State (1/27/2025, 11:14:34 AM)

_**User**_

Maybe update iosFiles should go just before eas build? Otherwise it changes stuff in ios folder and then our npm version dones'T work because git isn't clean...

---

_**Assistant**_

Yes, that's a good catch! We should move the "Update iOS Files" step to just before the EAS build to maintain a clean git state during version increment. Here's how to modify the workflow:

```yaml:.github/workflows/deploy-preview.yml
// ... existing code ...

      - name: Setup EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      # Version increment and build for preview with native changes
      - name: Increment minor version and build
        if: steps.check-changes.outputs.has_native_changes == 'true'
        run: |
          git config --global user.email "github-actions[bot]@users.noreply.github.com"
          git config --global user.name "github-actions[bot]"
          npm version minor -m "chore: increment minor version [skip ci]"
          git push https://${{ secrets.PAT_GITHUB }}@github.com/${{ github.repository }}.git HEAD:main --follow-tags
          
          # Moved iOS Files update here, just before the build
          node scripts/build/ios/preview.js
          
          eas build --platform all --profile preview --non-interactive
          npx sentry-expo-upload-sourcemaps dist

// ... existing code ...
```

I've moved the "Update iOS Files" step inside the version increment and build step, placing it after the git operations but before the EAS build. This ensures that:
1. The version is incremented on a clean git state
2. iOS files are updated just before they're needed for the build
3. The build process has all the necessary updated files

The standalone "Update iOS Files" step can be removed since it's now integrated into the build step.

---



---

