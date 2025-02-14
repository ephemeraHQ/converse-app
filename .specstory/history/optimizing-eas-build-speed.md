## SpecStory

## Optimizing EAS Build Speed (1/19/2025, 6:38:42 AM)

_**User**_

how can i make the eas build faster? MAybe using dry-run? check expo doc

---

_**Assistant**_

Based on the Expo documentation, we can optimize the EAS build process by using the `--local` flag to build locally instead of using EAS's cloud build service, and we can also use `--no-wait` if we just want to trigger the build without waiting for completion. For PR checks, we can also use `--dry-run` to verify the build configuration without actually building.

Here's how we can modify the workflow:

```yaml:.github/workflows/check-android-build.yml
// ... existing code ...
      - name: Build Android app
        run: eas build --profile development --platform android --non-interactive --dry-run
// ... existing code ...
```

A few notes about the options:
- `--dry-run`: This will validate the build configuration without actually performing the build, which is much faster and suitable for PR checks
- If you need an actual build, you could use:
  - `--local`: Builds locally instead of using EAS cloud build (faster but requires more setup)
  - `--no-wait`: Triggers the build but doesn't wait for completion (useful if you just want to verify build can start)

For PR checks, I recommend using `--dry-run` since it's the fastest option and will still catch most configuration issues. If you need actual builds, you might want to create a separate workflow for that purpose.

---



---

