## SpecStory

## Selective EAS Update Configuration (1/27/2025, 10:48:00 AM)

_**User**_

right now problem i have here is eas update will run if no changes in "package.json|app.config.ts|ios/|android/" but I also don't want to run when we only change like .github for example... I want to actaully run eas update only if we changed /assets or any .ts or .tsx files.

Maybe we should add checks for this git actons in "path"?

---

_**Assistant**_

I'll help modify the check-changes step to be more specific about when to run EAS updates. We'll check for relevant code changes in TypeScript files and assets while excluding changes that don't affect the app.

```yaml:.github/workflows/deploy-preview.yml
// ... existing code ...

      - name: Check for native changes
        id: check-changes
        run: |
          if git diff --name-only HEAD^ HEAD | grep -E "package.json|app.config.ts|ios/|android/"; then
            echo "has_native_changes=true" >> $GITHUB_OUTPUT
          else
            echo "has_native_changes=false" >> $GITHUB_OUTPUT
          fi
          # Check for relevant app changes (TypeScript files and assets)
          if git diff --name-only HEAD^ HEAD | grep -E "\.tsx?$|/assets/"; then
            echo "has_app_changes=true" >> $GITHUB_OUTPUT
          else
            echo "has_app_changes=false" >> $GITHUB_OUTPUT
          fi

// ... existing code ...

      # OTA Update for preview (no native changes but has app changes)
      - name: Run EAS Update
        if: steps.check-changes.outputs.has_native_changes == 'false' && steps.check-changes.outputs.has_app_changes == 'true'
        run: |
          eas update --auto --profile preview --message "${{ steps.commit_msg.outputs.message }}" --non-interactive
          npx sentry-expo-upload-sourcemaps dist

// ... existing code ...
```

The changes:
1. Added a new check in the `check-changes` step that looks for TypeScript files (`.ts` or `.tsx`) and changes in the assets directory
2. Modified the EAS Update step to only run when there are no native changes AND there are app changes
3. This means the workflow will now:
   - Run a full build if there are native changes
   - Run an OTA update if there are TypeScript/asset changes but no native changes
   - Skip both if only non-app files are changed (like .github, README, etc.)

---

_**User**_

instead  add "paths" to the git action

---

_**Assistant**_

Ah, I'll help you add path filters to the workflow trigger. This is a more efficient way to handle it since the workflow won't even start if the changed files don't match the paths we care about.

```yaml:.github/workflows/deploy-preview.yml
name: Preview Deployment

on:
  push:
    branches:
      - main
    paths:
      - '**.ts'
      - '**.tsx'
      - 'assets/**'
      - 'package.json'
      - 'app.config.ts'
      - 'ios/**'
      - 'android/**'

// ... existing code ...
```

This change:
1. Adds a `paths` filter to the workflow trigger
2. The workflow will now only run when changes are made to:
   - Any TypeScript files (`.ts` or `.tsx`)
   - Anything in the assets directory
   - package.json
   - app.config.ts
   - iOS or Android native files

This means the workflow won't run at all for changes to files like:
- .github/**
- README.md
- Other non-app related files

This is more efficient than the previous approach since it prevents the workflow from even starting when we don't need it.

---



---

