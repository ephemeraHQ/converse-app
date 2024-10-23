# Converse App Development Guide

## Environment Configuration

The app can run in three environments:

- Development (`dev`)
- Preview/Staging (`preview`)
- Production (`prod`)

The environment is determined automatically:

- `dev` environment when running in development mode (`__DEV__`)
- `preview` when `Constants.expoConfig?.extra?.ENV === "preview"`
- `prod` for all other cases

## Building the App

### Prerequisites

```bash
# Install dependencies
yarn
```

### iOS Build

```bash
# Install iOS dependencies
npx pod-install

# Open in Xcode and build
open ios/Converse.xcworkspace
```

### Android Build

```bash
# Install submodules
git submodule update

# Open in Android Studio
# Sync gradle and build

# Connect to local development server
yarn android:connect
```

### Web Build

```bash
# Start development server
yarn start
# Press 'w' to launch web version
```

## Environment-Specific Details

### Development Environment

- API: `http://localhost:9875` (web) or configured DEV_API_URI
- XMTP Environment: `dev` (configurable)
- Debug menu enabled
- Bundle ID: `com.converse.dev`
- Scheme: `converse-dev`
- Domain: `dev.converse.xyz`

### Preview Environment

- API: `https://backend-staging.converse.xyz`
- XMTP Environment: `dev`
- Debug menu enabled
- Bundle ID: `com.converse.preview`
- Scheme: `converse-preview`
- Domain: `preview.converse.xyz`

### Production Environment

- API: `https://backend-prod.converse.xyz`
- XMTP Environment: `production`
- Debug menu disabled
- Bundle ID: `com.converse.prod` (Android) or `com.converse.native` (iOS)
- Scheme: `converse`
- Domain: `converse.xyz`

## Additional Features

### Transaction Support

- Dev/Preview: Transaction frames enabled
- Production: Transaction frames disabled
- Uses Base Sepolia for dev/preview, Base Mainnet for production

### Testing

```bash
# Ensure .env is configured first
yarn test
```

### Linting

```bash
yarn lint
```

## Notes

- Web version has limited support for Groups and V3 Identity
- Frames follow the Open Frames Standard (https://github.com/open-frames/standard)
- Different environments use different USDC contract addresses and chains
- Universal links are configured differently for each environment
