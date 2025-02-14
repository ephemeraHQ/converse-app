## SpecStory

## Deployment Process Overview for Preview and Production (1/27/2025, 11:43:46 AM)

_**User**_

add stuff here based on @deploy-preview.yml  and @deploy-prod.yml 

The TLDR is that when sometihng is merged to main, we'll check if it's TS change , if yes we'll do eas OTA update on preview, otherwise we will do a eas build on preview and increment the version minor.

Then when we trigger a production build, we will merge main to production branch and see if the version differs. if same version we just do OTA update with eas, otherwise we do eas build with production build

---

_**Assistant**_

I'll help you update the README.md to add clear documentation about the deployment process. Here's how we can add this information:

````markdown:README.md
// ... existing code ...

## Release Process

### Preview Deployments (Main Branch)

The main branch represents the current preview code. When code is merged to main:

1. For TypeScript-only changes:
   - An over-the-air (OTA) update is deployed via EAS Update
   - No version increment occurs

2. For native changes (iOS/Android/package.json):
   - A new native build is triggered via EAS Build
   - Minor version is automatically incremented
   - App is submitted to TestFlight and Play Store internal testing
   - Source maps are uploaded to Sentry

### Production Deployments (Production Branch)

The production branch represents the current production code. When main is merged to production:

1. If versions match between main and production:
   - An over-the-air (OTA) update is deployed via EAS Update
   - No version increment occurs

2. If versions differ:
   - A new native build is triggered via EAS Build
   - App is submitted to App Store and Play Store production
   - Source maps are uploaded to Sentry

Note: Production deployments are carefully managed to ensure version consistency. The system waits for any in-progress preview deployments to complete before proceeding with production deployment.

// ... existing code ...
````

This addition explains the deployment process for both preview and production environments, making it clear how version management and different types of updates (OTA vs native builds) are handled.

---



---

