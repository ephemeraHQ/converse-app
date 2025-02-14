## SpecStory

## Manual Deployment of Preview Build in GitHub Actions (1/27/2025, 11:01:23 AM)

_**User**_

ist here a way i can manually deploy a preview build that will do a eas build? Like if I want to do it in the git acions UI for example

---

_**Assistant**_

Yes! I can help you modify the workflow to allow manual triggering. We'll add the `workflow_dispatch` event to the workflow, which will allow you to trigger it manually from the GitHub Actions UI.

Here's how to modify the workflow:

```yaml:.github/workflows/deploy-preview.yml
name: Preview Deployment

on:
  workflow_dispatch:
    inputs:
      force_native_build:
        description: 'Force native build (EAS build)'
        type: boolean
        default: true
        required: true
  push:
    branches:
      - main
    paths:
      - "**.ts"
      - "**.tsx"
      - "assets/**"
      - "package.json"
      - "app.config.ts"
      - "ios/**"

// ... existing code ...

      - name: Check for native changes
        id: check-changes
        run: |
          if [[ "${{ github.event_name }}" == "workflow_dispatch" && "${{ inputs.force_native_build }}" == "true" ]]; then
            echo "has_native_changes=true" >> $GITHUB_OUTPUT
          elif git diff --name-only HEAD^ HEAD | grep -E "package.json|app.config.ts|ios/|android/"; then
            echo "has_native_changes=true" >> $GITHUB_OUTPUT
          else
            echo "has_native_changes=false" >> $GITHUB_OUTPUT
          fi

// ... existing code ...
```

This change does two things:

1. Adds a `workflow_dispatch` trigger that allows manual execution from the GitHub Actions UI
2. Modifies the "Check for native changes" step to respect the manual input parameter

Now you can:
1. Go to the "Actions" tab in your GitHub repository
2. Select "Preview Deployment" from the workflows list
3. Click "Run workflow"
4. Choose whether to force a native build or not using the checkbox
5. Click "Run workflow" to start the deployment

When triggered manually with `force_native_build` checked, it will always do an EAS build regardless of what files were changed.

---



---

