# Firebase Configuration

Firebase config files are copied into the filepath expected by Firebase libraries at build time via the `scripts/build/ios/[preview|prod].js` files.

Firebase looks for this file in

`ios/GoogleService-Info.plist`

In order to ease development, we keep the file corresponding to our debug environment in the root of the repo, in the location expected by Firebase initialization.

We keep the environment specific files tucked away in `ios/Google Services/` to avoid cluttering the top level of our folder.

- ios/Google Services/GoogleService-Info-preview.plist (preview)
- ios/Google Services/GoogleService-Info-prod.plist (prod)

## Supporting Documentation this is Safe, If Not Advised Always

https://stackoverflow.com/a/44937513/2441420

> While it's not the end of the world if you commit `GoogleService-Info.plist` (similarly, on Android, `google-services.json`), you're better off leaving it out for one big reason: **You're making it clear that others who build your code that they should be setting up their own Firebase project to host its configuration and data (because your project simply won't build with that file missing).** Furthermore, if your project has world-writable resources in it, you can expect that people who get a hold of your app and config so easily will inadvertently start writing data into it, which is probably not what you want.

> Open source projects that require a Firebase setup should ideally have it stated in the readme that anyone who wants to work with this app needs to go through the process of setting up Firebase.

> The data in these config files is not exactly private - they can be extracted fairly easily from an IPA or Android APK. It's just probably not in your best interest to share them as part of your app's code.

For simplicity, we're doing it this way for now. If any security issues arise, we can spend the time to set this up more privately for our build scripts.
