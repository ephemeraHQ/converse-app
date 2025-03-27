# Converse

## Setup

### Environment

First, create a `.env.local` file based on the provided `.env.example`:

```sh
cp .env.example .env.local
```

Then, run one of the following commands to set up your environment variables:

```sh
# For development environment
yarn env:pull:dev

# For preview environment
yarn env:pull:preview

# For production environment
yarn env:pull:prod
```

This will create the appropriate `.env.local` file with environment variables configured in expo.dev. Note that you'll need to have an Expo project set up since we use their EAS service to pull environment variables.

### Install JS/React Native dependencies

```sh
yarn
```

### Install Ruby dependencies

To ensure you're using the correct version of CocoaPods, install the Ruby dependencies:

```sh
gem install bundler
bundle install
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

After the initial build, you can simply use `yarn start` to launch the Expo server for subsequent runs.

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

Once the app builds it will open the Expo App and ask what server and port you are targeting. If none are found, you probably need to start the expo server.

### Start Expo server

```sh
yarn start
```

## Development

### Code Style and Best Practices

This project follows specific coding standards and best practices. Please refer to:

- `.cursorrules` - Defines our coding standards and patterns
- `eslint.config.mjs` - ESLint configuration
- `.prettierrc.cjs` - Prettier formatting rules

We use ESLint and Prettier to enforce code quality and consistency. Make sure to run linting before submitting PRs:

### Lint

```sh
yarn lint
```

### Typecheck

```sh
yarn typecheck
```

### Environments

The app supports three environments:

1. **Development** - For local development
2. **Preview** - For testing before production
3. **Production** - Live app environment

Each environment has its own configuration in `app.config.ts`.

### Rebuilding after Native Changes

If you add a new library with native dependencies or change configuration in `app.config.ts`, you'll need to rebuild:

```sh
# For iOS
yarn ios:clean

# For Android
yarn android:clean
```

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

For more details on the deployment process, see the GitHub Actions workflows in `.github/workflows/preview-deployment.yml` and `.github/workflows/production-deployment.yml`.

## Troubleshoot

If you're having trouble with installation or the build process, try running `yarn clean` to remove the build directories and reinstall dependencies.

## Contributing

See our [contribution guide](./CONTRIBUTING.md) to learn more about contributing to this project.