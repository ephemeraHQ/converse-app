# Building the App - iOS

The following assumes you have followed the React Native environment setup guide in the [React Native Docs](https://reactnative.dev/docs/0.70/environment-setup?platform=ios)

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
The following assumes you have followed the React Native environment setup guide in the [React Native Docs](https://reactnative.dev/docs/0.70/environment-setup?platform=android)

### Install JS/React Native Dependencies

```
yarn
```

### Build the Android App

Open Android Studio
press the top right gradle icon to sync gradle
Click the play/build button to build and install the app

### Forward backend port

if running the backend locally on an Android Device

```
yarn android:reverse
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
