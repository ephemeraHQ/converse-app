## SpecStory

## Removing Build Result Outputs from Workflow (1/31/2025, 8:52:08 AM)

_**User**_

remove build result stuff

---

_**Assistant**_

I'll help you modify the workflow file to remove the build result outputs. Here's the simplified version highlighting the changes:

```yaml:.github/workflows/deploy-preview.yml
// ... existing code ...

  ios-build:
    needs: [check-changes, bump-version]
    if: needs.check-changes.outputs.has_native_changes == 'true'
    runs-on: ubuntu-latest
    # Removed outputs section

    steps:
      // ... existing code ...

      - name: Build and submit to store
        # Removed id: build_status
        run: |
          eas build --platform ios --profile preview --non-interactive --auto-submit
          # Removed echo line

  android-build:
    needs: [check-changes, bump-version]
    if: needs.check-changes.outputs.has_native_changes == 'true'
    runs-on: ubuntu-latest
    # Removed outputs section

    steps:
      // ... existing code ...

      - name: Build and submit to store
        # Removed id: build_status
        run: |
          eas build --platform android --profile preview --non-interactive --auto-submit
          # Removed echo line

// ... existing code ...
```

Changes made:
1. Removed the `outputs` section from both `ios-build` and `android-build` jobs
2. Removed the `id: build_status` from the build steps
3. Removed the `echo "success=true"` commands from the build steps

These changes remove the build result tracking that wasn't being used elsewhere in the workflow.

---



---

