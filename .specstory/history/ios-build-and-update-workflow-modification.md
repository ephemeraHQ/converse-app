## SpecStory

## iOS Build and Update Workflow Modification (1/27/2025, 1:19:31 PM)

_**User**_

only eas build and update for ios for now

---

_**Assistant**_

I'll help modify the workflow to only handle iOS builds and updates. Here are the necessary changes:

```yaml:.github/workflows/deploy-preview.yml
// ... existing code ...

  native-build:
    needs: check-changes
    if: needs.check-changes.outputs.has_native_changes == 'true'
    runs-on: ubuntu-latest

    steps:
      // ... existing code ...

      - name: Build iOS preview
        run: node scripts/build/ios/preview.js

      - name: Build and submit to stores
        run: eas build --platform ios --profile preview --non-interactive --auto-submit

      // ... existing code ...
```

The main changes are:
1. In the `native-build` job, changed `--platform all` to `--platform ios` in the EAS build command to only build for iOS.

The rest of the workflow can remain the same since the OTA updates will automatically apply to both platforms, and we don't need to modify that part. The platform-specific changes only affect the native build process.

---



---

