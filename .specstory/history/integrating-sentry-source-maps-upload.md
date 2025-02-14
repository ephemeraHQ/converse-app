## SpecStory

## Integrating Sentry Source Maps Upload (1/24/2025, 10:20:16 AM)

_**User**_

make sure to call "npx sentry-expo-upload-sourcemaps dist" ffter eas build and eas update

---

_**Assistant**_

I'll help you add the Sentry source maps upload step after both the EAS build and EAS update steps. Here's how to modify the workflow:

```yaml:.github/workflows/deploy-prod.yml
// ... existing code ...

      # Build new app binary if versions don't match
      - name: Build for production
        if: steps.version-compare.outputs.versions_match == 'false'
        run: eas build --platform all --profile production --non-interactive

      # Upload source maps after build
      - name: Upload source maps after build
        if: steps.version-compare.outputs.versions_match == 'false'
        run: npx sentry-expo-upload-sourcemaps dist

      # Deploy OTA update if versions match
      - name: Run EAS Update
        if: steps.version-compare.outputs.versions_match == 'true'
        run: eas update --auto --profile production --message "${{ steps.commit_msg.outputs.message }}" --non-interactive

      # Upload source maps after update
      - name: Upload source maps after update
        if: steps.version-compare.outputs.versions_match == 'true'
        run: npx sentry-expo-upload-sourcemaps dist

// ... existing code ...
```

I've added two new steps to upload source maps to Sentry:
1. After the EAS build step, with the same condition
2. After the EAS update step, with the same condition

Each step runs `npx sentry-expo-upload-sourcemaps dist` to upload the source maps to Sentry, which will help with error tracking and debugging in production.

---



---

