## SpecStory

## Integrating Slack Notifications for Build Updates (1/27/2025, 3:02:05 PM)

_**User**_

how can i send a slack message after the eas build or eas update giving info to my team about what happened

---

_**Assistant**_

I'll help you add Slack notifications to your workflow. We'll need to add a new step to both the `handle-build-results` and `ota-update` jobs to send Slack messages. First, you'll need to add a Slack webhook URL to your GitHub repository secrets.

Here are the changes needed:

```yaml:.github/workflows/deploy-preview.yml
// ... existing code ...

  handle-build-results:
    needs: [bump-version, ios-build, android-build]
    runs-on: ubuntu-latest
    if: always()

    steps:
      // ... existing code ...

      - name: Handle build results
        id: build_status
        run: |
          if [[ "${{ needs.ios-build.result }}" == "failure" && "${{ needs.android-build.result }}" == "failure" ]]; then
            echo "Both builds failed, but keeping version bump for production tracking"
            echo "Failed platforms: iOS and Android"
            echo "status=❌ Both native builds failed" >> $GITHUB_OUTPUT
          elif [[ "${{ needs.ios-build.result }}" == "failure" || "${{ needs.android-build.result }}" == "failure" ]]; then
            echo "One build failed but keeping version bump for production tracking"
            echo "Failed platform(s):"
            [[ "${{ needs.ios-build.result }}" == "failure" ]] && echo "- iOS"
            [[ "${{ needs.android-build.result }}" == "failure" ]] && echo "- Android"
            echo "status=⚠️ Some native builds failed" >> $GITHUB_OUTPUT
          else
            echo "All builds succeeded!"
            echo "status=✅ All native builds succeeded" >> $GITHUB_OUTPUT
          fi

      - name: Send Slack notification
        uses: slackapi/slack-github-action@v1.24.0
        with:
          payload: |
            {
              "text": "*Preview Deployment Update*\n${{ steps.build_status.outputs.status }}\nVersion: ${{ needs.bump-version.outputs.new_version }}\nTriggered by: ${{ github.actor }}"
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}

  ota-update:
    // ... existing code ...

      - name: Run EAS Update
        id: eas_update
        run: |
          eas update --auto --channel=preview --message "${{ needs.check-changes.outputs.commit_message }}" --non-interactive
          npx sentry-expo-upload-sourcemaps dist
          echo "status=✅ OTA update deployed successfully" >> $GITHUB_OUTPUT

      - name: Send Slack notification
        uses: slackapi/slack-github-action@v1.24.0
        if: always()
        with:
          payload: |
            {
              "text": "*Preview Deployment Update*\n${{ steps.eas_update.outputs.status || '❌ OTA update failed' }}\nCommit message: ${{ needs.check-changes.outputs.commit_message }}\nTriggered by: ${{ github.actor }}"
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

To make this work:

1. Add your Slack webhook URL to GitHub repository secrets:
   - Go to your repository settings
   - Navigate to Secrets and Variables > Actions
   - Create a new secret named `SLACK_WEBHOOK_URL`
   - Add your Slack webhook URL as the value

The changes will:
- Send a Slack message after native builds complete, indicating success or failure and the new version number
- Send a Slack message after OTA updates, including the commit message
- Include who triggered the workflow
- Use emojis to make the status more visible
- Handle both success and failure cases

The messages will look something like:
```
Preview Deployment Update
✅ All native builds succeeded
Version: 1.2.3
Triggered by: username
```
or
```
Preview Deployment Update
✅ OTA update deployed successfully
Commit message: feat: add new feature
Triggered by: username
```

---

_**User**_

is it possible with eas to cancel a build? Let's say I decide to cancel this workflow i would want to also cancel the current processsing eas build

---

_**Assistant**_

Yes, you can cancel an EAS build using the EAS CLI. Let's modify the workflow to handle cancellation properly. We'll need to add a cleanup job that runs when the workflow is cancelled.

```yaml:.github/workflows/deploy-preview.yml
// ... existing code ...

  ios-build:
    needs: [check-changes, bump-version]
    if: needs.check-changes.outputs.has_native_changes == 'true'
    runs-on: ubuntu-latest
    outputs:
      build_success: ${{ steps.build_status.outputs.success }}
      build_id: ${{ steps.build_status.outputs.build_id }}

    steps:
      // ... existing code ...

      - name: Build and submit to store
        id: build_status
        run: |
          BUILD_INFO=$(eas build --platform ios --profile preview --non-interactive --auto-submit --json)
          BUILD_ID=$(echo $BUILD_INFO | jq -r '.id')
          echo "build_id=$BUILD_ID" >> $GITHUB_OUTPUT
          echo "success=true" >> $GITHUB_OUTPUT

  android-build:
    needs: [check-changes, bump-version]
    if: needs.check-changes.outputs.has_native_changes == 'true'
    runs-on: ubuntu-latest
    outputs:
      build_success: ${{ steps.build_status.outputs.success }}
      build_id: ${{ steps.build_status.outputs.build_id }}

    steps:
      // ... existing code ...

      - name: Build and submit to store
        id: build_status
        run: |
          BUILD_INFO=$(eas build --platform android --profile preview --non-interactive --auto-submit --json)
          BUILD_ID=$(echo $BUILD_INFO | jq -r '.id')
          echo "build_id=$BUILD_ID" >> $GITHUB_OUTPUT
          echo "success=true" >> $GITHUB_OUTPUT

  cleanup-on-cancel:
    if: cancelled()
    needs: [ios-build, android-build]
    runs-on: ubuntu-latest
    steps:
      - name: Setup EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Cancel iOS build
        if: needs.ios-build.outputs.build_id != ''
        run: eas build:cancel --id ${{ needs.ios-build.outputs.build_id }}
        continue-on-error: true

      - name: Cancel Android build
        if: needs.android-build.outputs.build_id != ''
        run: eas build:cancel --id ${{ needs.android-build.outputs.build_id }}
        continue-on-error: true

      - name: Send Slack notification
        uses: slackapi/slack-github-action@v1.24.0
        if: always()
        with:
          payload: |
            {
              "text": "*Preview Deployment Update*\n❌ Workflow was cancelled\nTriggered by: ${{ github.actor }}"
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

The changes:
1. Added build ID outputs to both iOS and Android build jobs
2. Added a new `cleanup-on-cancel` job that runs when the workflow is cancelled
3. The cleanup job will:
   - Cancel any running EAS builds using their IDs
   - Send a Slack notification about the cancellation
4. Used `continue-on-error: true` for the cancel commands in case the builds already finished

Now when you cancel the GitHub workflow, it will also attempt to cancel any running EAS builds and notify the team via Slack.

Note: The EAS build cancellation might take a few moments to take effect, and some builds might not be cancellable if they're too far along in the process.

---



---

