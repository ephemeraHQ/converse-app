## SpecStory

## GitHub Actions Workflow Syntax Review (1/29/2025, 12:37:05 PM)

_**User**_

make sure all the syntax is okay

---

_**Assistant**_

I'll review the GitHub Actions workflow syntax. The file looks mostly good, but there are a few minor improvements we can make for better reliability and clarity:

```yaml:.github/workflows/deploy-prod.yml
// ... existing code ...

      - name: Get Commit Messages
        id: commit_msg
        run: |
          # Get all commits that are in main but not in production
          COMMITS=$(git log origin/production..origin/main --pretty=format:"- %s")
          # Escape newlines and special characters for GitHub Actions
          COMMITS="${COMMITS//'%'/'%25'}"
          COMMITS="${COMMITS//$'\n'/'%0A'}"
          COMMITS="${COMMITS//$'\r'/'%0D'}"
          # Ensure COMMITS is not empty to prevent workflow errors
          if [ -z "$COMMITS" ]; then
            COMMITS="No new changes"
          fi
          echo "message=$COMMITS" >> $GITHUB_OUTPUT

// ... existing code ...

      - name: Handle deployment results
        run: |
          if [[ "${{ needs.check-deployment-type.outputs.versions_match }}" == "false" ]]; then
            if [[ "${{ needs.ios-build.result }}" == "failure" || "${{ needs.android-build.result }}" == "failure" ]]; then
              echo "Native build failed, rolling back..."
              git reset --hard "${{ needs.check-deployment-type.outputs.temp_merge_head }}"
              git push --force "https://${{ secrets.PAT_GITHUB }}@github.com/${{ github.repository }}.git" HEAD:production
              exit 1
            fi
          elif [[ "${{ needs.ota-update.result }}" == "failure" ]]; then
            echo "OTA update failed, rolling back..."
            git reset --hard "${{ needs.check-deployment-type.

---

_**User**_

i recieve this error "Invalid workflow file: .github/workflows/deploy-prod.yml#L173
You have an error in your yaml syntax on line 173"

---

_**Assistant**_

Ah, I see the issue. There's an indentation error in the "Upload source maps" step. Here's the fix:

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

The error was because the `run:` key was not properly indented. In YAML, indentation is significant, and all properties within a step should be aligned. I've fixed the indentation to match the rest of the workflow file.

---



---

