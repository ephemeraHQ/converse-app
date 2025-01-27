# Converse

## Requirements

- Node 20+
- Ruby 3.2.5+
- Xcode 15.2+
- Android Studio 2023.1.1+

#### Node

We recommend using a Node version manager such as [nvm](https://github.com/nvm-sh/nvm) or [nodenv](https://github.com/nodenv/nodenv).

#### Ruby

We recommend using a Ruby version manager such as [rbenv](https://github.com/rbenv/rbenv).

## Setup

### Environment

Run one of the following commands to set up your environment variables:

```sh
# For development environment
yarn env:pull:dev

# For preview environment
yarn env:pull:preview

# For production environment
yarn env:pull:prod
```

This will create the appropriate `.env.local` file with environment variables configured in expo.dev.

### Install JS/React Native dependencies

```sh
yarn
```

## Quick start

iOS:

```sh
yarn ios
```

Android:

```sh
yarn android
```

## Manual start

### Install iOS dependencies

```sh
npx pod-install
```

### Build the iOS app

- Open `ios/Converse.xcworkspace` in Xcode
- Select the `Converse` target
- Select target iOS device
- Click the play/build button to build and install the app

### Build the Android app

- Open Android Studio
- Press the top right gradle icon to sync gradle
- Click the play/build button to build and install the app

#### Forward backend port

If running the backend locally, run `yarn android:reverse`

### Running the app

Once the app builds it will open the Expo App and ask what server and port you are targetting. If none are found, you probably need to start the expo server.

### Start Expo server

```sh
yarn start
```

## Development

### Lint

```sh
yarn lint
```

### Test

Before running the tests make sure that you have a `.env` file setup with the variables variable set

```sh
yarn test
```

### Performance test

Capture baselines for performance tests.

```sh
yarn test:perf:baseline
```

Make changes to the code to see the performance impact. Run the performance tests again to see the changes.

```sh
yarn test:perf
```

## Release

### Main branch

Represents the current preview code.

### Production branch

Represents the current production code.

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

## Troubleshoot

If you're having trouble with installation or the build process, try running `yarn clean` to remove the build directories and reinstall dependencies.
