## SpecStory

## Fixing YAML Syntax Error in GitHub Actions (1/29/2025, 12:35:54 PM)

_**User**_

i got this in github actions:
Invalid workflow file: .github/workflows/deploy-prod.yml#L173
You have an error in your yaml syntax on line 173

---

_**Assistant**_

The error is due to incorrect indentation in the `Upload source maps` step. Let me fix that for you:

```yaml:.github/workflows/deploy-prod.yml
// ... existing code ...
      - name: Run EAS Update
        run: eas update --auto --channel=production --message "${{ needs.check-deployment-type.outputs.commit_message }}" --non-interactive

      - name: Upload source maps
        run: |
          # Seems to be the only way to get the token
          export SENTRY_AUTH_TOKEN=$(eas env:get --variable-name=SENTRY_AUTH_TOKEN --variable-environment=production | tr -d ' ' | cut -d'=' -f2)
          npx sentry-expo-upload-sourcemaps dist
// ... existing code ...
```

The issue was that the `run:` keyword was not properly indented. In YAML, indentation is significant and must be consistent. I fixed it by aligning the `run:` with the same indentation level as `name:`. The step should now work correctly.

---



---

