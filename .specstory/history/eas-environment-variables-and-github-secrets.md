## SpecStory

## EAS Environment Variables and GitHub Secrets (1/28/2025, 3:29:39 PM)

_**User**_

are we sure eas can't be the solution... feel sad that i need to put in github secrets when everything is in eas env

---

_**Assistant**_

Let me clarify this situation:

1. For EAS builds (native builds), environment variables set in EAS work fine because they are used during the build process on EAS servers.

2. However, for EAS Update (OTA updates), the command runs in the GitHub Actions environment, not on EAS servers. This means it can't access EAS environment variables directly.

There are a few potential solutions:

1. Keep using GitHub Secrets (current approach):
```yaml:.github/workflows/deploy-preview.yml
// ... existing code ...
      - name: Run EAS Update
        env:
          SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
        run: |
          eas update --auto --channel=preview --message "${{ needs.check-changes.outputs.commit_message }}" --non-interactive
// ... existing code ...
```

2. Use EAS CLI to fetch secrets (experimental):
```yaml:.github/workflows/deploy-preview.yml
// ... existing code ...
      - name: Run EAS Update
        run: |
          # Fetch secret from EAS (Note: This is experimental and may not work)
          export SENTRY_AUTH_TOKEN=$(eas secret:read SENTRY_AUTH_TOKEN)
          eas update --auto --channel=preview --message "${{ needs.check-changes.outputs.commit_message }}" --non-interactive
// ... existing code ...
```

Unfortunately, while the second approach would be ideal, EAS doesn't currently provide a reliable way to access environment variables outside of the build context. The GitHub Secrets approach, while redundant, is currently the most reliable solution.

This is a known limitation when working with EAS Update in CI/CD environments, and it's why many teams end up maintaining certain secrets in both EAS and GitHub Secrets.

---

_**User**_

ok use "eas env:get --variable-name=SENTRY_AUTH_TOKEN --variable-environment=preview" this will return something like SENTRY_AUTH_TOKEN=DAWODKJWAKAJWAKW

---

_**Assistant**_

Ah yes, we can use `eas env:get`! Here's how to modify the workflow to extract the value from the output:

```yaml:.github/workflows/deploy-preview.yml
// ... existing code ...
      - name: Run EAS Update
        run: |
          # Extract SENTRY_AUTH_TOKEN from eas env
          SENTRY_AUTH_TOKEN=$(eas env:get --variable-name=SENTRY_AUTH_TOKEN --variable-environment=preview | cut -d'=' -f2)
          export SENTRY_AUTH_TOKEN
          
          eas update --auto --channel=preview --message "${{ needs.check-changes.outputs.commit_message }}" --non-interactive
          npx sentry-expo-upload-sourcemaps dist
// ... existing code ...
```

This solution:
1. Uses `eas env:get` to fetch the secret
2. Uses `cut -d'=' -f2` to extract just the value part after the equals sign
3. Exports it as an environment variable for the subsequent commands to use

This is much better as we can maintain all our secrets in one place (EAS) and don't need to duplicate them in GitHub Secrets!

---

_**User**_

is there a cleaner way?

---

_**Assistant**_

Yes, we could make it cleaner by using a separate step to fetch the environment variable. This makes the workflow more readable and separates concerns:

```yaml:.github/workflows/deploy-preview.yml
// ... existing code ...
      - name: Setup EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Get Sentry Auth Token
        id: sentry_token
        run: echo "token=$(eas env:get --variable-name=SENTRY_AUTH_TOKEN --variable-environment=preview | cut -d'=' -f2)" >> $GITHUB_OUTPUT

      - name: Run EAS Update
        env:
          SENTRY_AUTH_TOKEN: ${{ steps.sentry_token.outputs.token }}
        run: |
          eas update --auto --channel=preview --message "${{ needs.check-changes.outputs.commit_message }}" --non-interactive
          npx sentry-expo-upload-sourcemaps dist
// ... existing code ...
```

This approach:
1. Creates a dedicated step for fetching the Sentry token
2. Uses GitHub Actions' built-in output mechanism to store the value
3. References the token in the next step using the output variable
4. Makes the workflow more maintainable and easier to debug

The separation of steps makes it clearer what's happening and follows the single-responsibility principle better.

---

_**User**_

just do env:
SENTRY_AUTH_TOKEN: ${eas...

---

_**Assistant**_



Ah yes, we can use command substitution directly in the environment variables section! Here's the cleaner version:

```yaml:.github/workflows/deploy-preview.yml
// ... existing code ...
      - name: Run EAS Update
        env:
          SENTRY_AUTH_TOKEN: $(eas env:get --variable-name=SENTRY_AUTH_TOKEN --variable-environment=preview | cut -d'=' -f2)
        run: |
          eas update --auto --channel=preview --message "${{ needs.check-changes.outputs.commit_message }}" --non-interactive
          npx sentry-expo-upload-sourcemaps dist
// ... existing code ...
```

This is much cleaner and more concise! It handles the environment variable setup in a single line without needing separate steps or output variables.

---



---

