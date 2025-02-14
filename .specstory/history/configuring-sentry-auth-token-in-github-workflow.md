## SpecStory

## Configuring SENTRY_AUTH_TOKEN in GitHub Workflow (1/27/2025, 3:14:11 PM)

_**User**_

where will it take SENTRY_AUTH_TOKEN?

---

_**Assistant**_

The workflow needs to have the `SENTRY_AUTH_TOKEN` environment variable defined to upload sourcemaps to Sentry. Here's how to add it:

```yaml:.github/workflows/deploy-preview.yml
// ... existing code ...
      - name: Run EAS Update
        env:
          SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
        run: |
          eas update --auto --channel=preview --message "${{ needs.check-changes.outputs.commit_message }}" --non-interactive
          npx sentry-expo-upload-sourcemaps dist
// ... existing code ...
```

You'll need to:
1. Add the `SENTRY_AUTH_TOKEN` to your GitHub repository secrets
2. Add the `env` section to the step as shown above to make the token available to the sentry-expo command

The same change should also be made to the `Upload sourcemaps to Sentry` step in the `android-build` job:

```yaml:.github/workflows/deploy-preview.yml
// ... existing code ...
      - name: Upload sourcemaps to Sentry
        if: steps.build_status.outputs.success == 'true'
        env:
          SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
        run: npx sentry-expo-upload-sourcemaps dist
// ... existing code ...
```

---

_**User**_

but i don't want to put in github secrets... i want to manage secrets in eas

---

_**Assistant**_

Ah, if you're using EAS Secrets, you don't need to add the `SENTRY_AUTH_TOKEN` to GitHub secrets. EAS will automatically inject the secrets during the build and update process if you've configured them using `eas secret:create`.

The current setup in your workflow file is correct as is, because EAS will automatically handle the injection of secrets that you've configured through `eas secret:create`.

To set up the Sentry token in EAS:

1. Use the EAS CLI to add the secret:
```bash
eas secret:create --name SENTRY_AUTH_TOKEN --value "your-sentry-auth-token" --scope project
```

Once you've done this, both `eas update` and `sentry-expo-upload-sourcemaps` commands will automatically have access to the `SENTRY_AUTH_TOKEN` environment variable, and you don't need to modify the workflow file.

This is a better approach because:
1. You manage all your secrets in one place (EAS)
2. The secrets are automatically available in both EAS builds and updates
3. It's more secure as the secrets are managed by EAS rather than being stored in GitHub

---

_**User**_

i have SENTRY_AUTH_TOKEN in eas env created but will it be taken into consideration when running "npx sentry-expo-upload-sourcemaps dist" at line 236?

---

_**Assistant**_



No, the `npx sentry-expo-upload-sourcemaps dist` command running directly in the GitHub Actions environment won't have access to EAS secrets. EAS secrets are only injected during EAS-managed processes (like `eas build` or `eas update`).

You have two options:

1. Move the sourcemaps upload into the `eas update` command using the `--sourcemap` flag:

```yaml:.github/workflows/deploy-preview.yml
// ... existing code ...
      - name: Run EAS Update
        run: |
          eas update --auto --channel=preview --message "${{ needs.check-changes.outputs.commit_message }}" --non-interactive --sourcemap
// ... existing code ...
```

2. Or if you need to keep using `sentry-expo-upload-sourcemaps` directly, you'll need to add the `SENTRY_AUTH_TOKEN` to GitHub secrets:

```yaml:.github/workflows/deploy-preview.yml
// ... existing code ...
      - name: Run EAS Update
        env:
          SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
        run: |
          eas update --auto --channel=preview --message "${{ needs.check-changes.outputs.commit_message }}" --non-interactive
          npx sentry-expo-upload-sourcemaps dist
// ... existing code ...
```

I recommend option 1 since it keeps all secret management within EAS and simplifies the workflow.

---

_**User**_

possible that I go get with eas secrets instead of putting in github secetst?

---

_**Assistant**_



Yes! You can use `eas secret:read` to get the secret value from EAS. Here's how to modify your workflow:

```yaml:.github/workflows/deploy-preview.yml
// ... existing code ...
      - name: Run EAS Update
        run: |
          export SENTRY_AUTH_TOKEN=$(eas secret:read --name SENTRY_AUTH_TOKEN --json | jq -r '.value')
          eas update --auto --channel=preview --message "${{ needs.check-changes.outputs.commit_message }}" --non-interactive
          npx sentry-expo-upload-sourcemaps dist
// ... existing code ...
```

This approach:
1. Uses `eas secret:read` to fetch the secret value
2. Uses `jq` to parse the JSON output and extract just the value
3. Sets it as an environment variable for the rest of the step

Note that this will work because you already have the EAS CLI set up and authenticated in the previous step with:
```yaml
      - name: Setup EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
```

This is a good middle ground that allows you to keep managing secrets in EAS while still being able to use them in direct CLI commands.

---



---

