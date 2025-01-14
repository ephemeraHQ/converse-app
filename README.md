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

Copy `.env` from the [converse-app-env](https://github.com/ephemeraHQ/converse-app-env) repository to the root of this repository.

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

Represents the current production code.

### Release branches

Each release branch is based off of `main` or the release branch before it. It is used to prepare and stabilize the code for a specific release version (e.g., `release/2.0.8`).

### Feature branches

Feature branches are longer-lived features or refactors expected to take additional time. They should be based off of the targeted feature release branch.

This structure allows code to flow **from `main` to release branches to feature branches**.

![Merge Diagram](docs/image.png)

### Branch rebasing

Assuming your branch is `feature/scw`, and your feature is targeted for release `2.1.0`, follow these steps to rebase:

1. Checkout the feature branch:

   ```bash
   git fetch origin
   git branch feature/scw -D
   git checkout feature/scw origin/feature/scw
   ```

2. Rebase onto the targeted release branch:

   ```bash
   git pull origin/release/2.1.0 --rebase
   git push origin feature/scw --force-with-lease
   ```

### Exceptions

There are certain times where this flow does not work as intended. For example:

- Build scripts: These may need to be run off of the default `main` branch instead of feature or release branches.
- README updates: These are not required to be on a branch and can be committed directly to `main`.
- Bug fixes that can be OTA updated: These can be committed directly to `main` to perform an OTA update.

## Troubleshoot

If you're having trouble with installation or the build process, try running `yarn clean` to remove the build directories and reinstall dependencies.
