## SpecStory

## Choosing EAS Profile for iOS Build (1/19/2025, 10:51:37 AM)

_**User**_

what ios eas profile should i use if i want to check if the build works?

---

_**Assistant**_

For checking if an iOS build works in a CI environment, the `ios-simulator` profile you're currently using is actually correct. However, if you want to be more thorough, you might want to use the `preview` profile instead, as it will build a proper IPA file that's closer to a production build.

Here's how I would modify the workflow:

```yaml:.github/workflows/check-ios-build.yml
// ... existing code ...
      - name: Build iOS app
        run: eas build --profile preview --platform ios --non-interactive --dry-run
// ... existing code ...
```

A few notes about the different profiles:
1. `ios-simulator`: Builds for iOS simulator, which is faster but less thorough
2. `preview`: Creates a proper IPA file with development configuration
3. `production`: Creates a release build (not recommended for PR checks as it's slower and unnecessary)

The `--dry-run` flag is good to keep as it will check if the build would work without actually uploading and building on EAS servers, which is perfect for PR checks.

---



---

