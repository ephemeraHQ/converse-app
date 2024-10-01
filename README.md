# Building the App - iOS

### Install JS/React Native Dependencies

```
yarn
```

### Install iOS Dependencies

```
npx pod-install
```

### Build the iOS App

Open ios/Converse.xcworkspace in Xcode and Build

# Building the App - Android

### Install JS/React Native Dependencies

```
yarn
```

### Install submodules for Android patched fork

```
git submodule update
```

### Build the Android App

Open Android Studio
press the top right gradle icon to sync gradle
Click the play/build button to build and install the app

### Forward backend port

if running the backend locally

```
adb reverse tcp:9875 tcp:9875
```

# Building the App - Web

### Install JS/React Native Dependencies

```
yarn
```

### Building the Web App
```
yarn start
```

Once the expo server starts press W to launch the web app

### Please Note

Currently Groups and V3 Identity is not supported on Web at the SDK layer, but is actively being worked on by the team

Until then Converse web will only show 1 to 1 conversations and the majority of testing and development are native app focused.

Web support is an end goal and the team is happy to fix any issues that are reported

# Running the App

Once the app builds it will open the Expo App
this will ask what server port you are targetting, if none are found, you probably need to start the expo server

### Start Expo Server

```
yarn start
```

# Linting

```
yarn lint
```

# Testing

Before running the tests make sure that you have a `.env` file setup with the variables variable set

```sh
# In the `converse-backend` repo
yarn dev
# Back in this repo
yarn test
```

# Frames

Frames are expected to follow the Open Frames Standard https://github.com/open-frames/standard


