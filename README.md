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


# Key Cases Needed for App Release

1. Old conversations are persisted
2. Can send a message without duplicates
3. Can create a group
