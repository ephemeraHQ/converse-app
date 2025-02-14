## SpecStory

## Setting SENTRY_AUTH_TOKEN for Sentry Upload (1/27/2025, 3:07:23 PM)

_**User**_

where should i set SENTRY_AUTH_TOKEN so that "npx sentry-expo-upload-sourcemaps dist" workjs? in @app.config.ts  in @eas.json ? in eas env variable? where?

---

_**Assistant**_

The `SENTRY_AUTH_TOKEN` should be set as an EAS secret environment variable. This is the most secure way to handle sensitive tokens, as it keeps them out of the codebase and configuration files.

You can set it using the EAS CLI with this command:

```bash
eas secret:create --name SENTRY_AUTH_TOKEN --value "your_sentry_auth_token"
```

Then, you need to make a small modification to the GitHub workflow file to pass this environment variable to the Sentry upload step:

```yaml:.github/workflows/deploy-preview.yml
// ... existing code ...
      - name: Upload sourcemaps to Sentry
        if: steps.build_status.outputs.success == 'true'
        run: npx sentry-expo-upload-sourcemaps dist
        env:
          SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
// ... existing code ...
```

You'll need to make this change in both the `ios-build` and `android-build` jobs where the Sentry sourcemap upload step exists.

Additionally, make sure to add the `SENTRY_AUTH_TOKEN` to your GitHub repository secrets (Settings > Secrets and variables > Actions > New repository secret).

This approach is preferred because:
1. It keeps sensitive tokens out of your codebase
2. The token is encrypted and securely stored
3. It's available during both builds and deployments
4. It follows security best practices for handling authentication tokens

---



---

