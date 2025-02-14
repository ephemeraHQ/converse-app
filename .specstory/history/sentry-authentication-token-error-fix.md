## SpecStory

## Sentry Authentication Token Error Fix (1/28/2025, 3:28:33 PM)

_**User**_

i have this error...

SENTRY_ORG resolved to converse-app from expo config.
SENTRY_PROJECT resolved to converse-react-native from expo config.
SENTRY_URL resolved to https://sentry.io/ from expo config.
SENTRY_AUTH_TOKEN environment variable must be set.

---

_**Assistant**_

The error occurs because the Sentry source maps upload command requires a Sentry authentication token, which isn't currently configured in your GitHub Actions workflow. Let's add the necessary Sentry authentication token to the workflow.

Here's how to modify the workflow file:

```yaml:.github/workflows/deploy-preview.yml
// ... existing code ...
      - name: Setup EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Run EAS Update
        env:
          SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
        run: |
          eas update --auto --channel=preview --message "${{ needs.check-changes.outputs.commit_message }}" --non-interactive
          npx sentry-expo-upload-sourcemaps dist
// ... existing code ...
```

You'll need to:

1. Add your Sentry auth token to your GitHub repository secrets:
   - Go to your repository settings
   - Navigate to Secrets and Variables > Actions
   - Create a new secret named `SENTRY_AUTH_TOKEN`
   - Add your Sentry auth token value (you can find this in your Sentry account settings)

The change adds the `SENTRY_AUTH_TOKEN` environment variable to the step that runs the EAS update and Sentry source maps upload. This token will be used to authenticate with Sentry when uploading the source maps.

---



---

