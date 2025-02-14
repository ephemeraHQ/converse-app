## SpecStory

## Understanding Embedded in Expo Updates (1/27/2025, 10:11:30 AM)

_**User**_

whatwhat does embededd means

---

_**Assistant**_

In the context of Expo Updates, "embedded" refers to the initial version of your app that was bundled and compiled directly into the app binary (the .apk for Android or .ipa for iOS) during the build process.

When you see `currentlyRunning.updateId || "embedded"`, it means:
- If there's an `updateId`, the app is running a version that was downloaded and installed after the initial app installation (an over-the-air update)
- If there's no `updateId` (it's null or undefined), then "embedded" is shown, indicating you're running the original version that came with the app installation

To break it down:
1. The "embedded" version is the default app version that users get when they first install your app from the App Store or Play Store
2. Any subsequent updates delivered through Expo's over-the-air update system will have a unique `updateId`

This information is particularly useful for debugging and verifying which version of your app is currently running - whether it's the original embedded version or an updated version delivered through Expo Updates.

---



---

