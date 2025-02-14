## SpecStory

## EAS Build and Sentry Sourcemaps Query (1/27/2025, 3:09:31 PM)

_**User**_

is it true that i don't need npx sentry-expo-upload-sourcemaps dist when doing eas build??

@https://docs.expo.dev/guides/using-sentry/ 

---

_**Assistant**_

Based on the Sentry documentation, you are correct - when using EAS Build, you don't need to manually upload sourcemaps using `npx sentry-expo-upload-sourcemaps dist`. The sourcemaps are automatically uploaded as long as you have:

1. Set up the `SENTRY_AUTH_TOKEN` in your build environment
2. Properly configured Sentry in your app config

From the docs:
> Using the above instructions, no additional work is needed to integrate Sentry into your project when using EAS Build.

Therefore, I would suggest removing those steps from your workflow file. Here's the edit:

```yaml:.github/workflows/deploy-preview.yml
// ... existing code ...
      - name: Build and submit to store
        id: build_status
        run: |
          eas build --platform ios --profile preview --non-interactive --auto-submit
          echo "success=true" >> $GITHUB_OUTPUT

      # Remove this step as it's not needed with EAS Build
      # - name: Upload sourcemaps to Sentry
      #   if: steps.build_status.outputs.success == 'true'
      #   run: npx sentry-expo-upload-sourcemaps dist
// ... existing code ...
```

The manual sourcemap upload step is only needed when:
1. Using EAS Update (`eas update`)
2. Self-hosting your updates (using `npx expo export`)

Since your workflow is using EAS Build directly, the sourcemaps will be handled automatically by the build process.

---



---

