#!/bin/bash

# Finds the newest APK in the project root and pushes it to 
# the connected Android device's Downloads folder.
# 
# This script handles cases where no APK exists and provides
# helpful error messages and next steps.
# 
# Side effects:
# - Pushes APK file to /storage/emulated/0/Download/
# - Outputs status messages to console
# 
# Example when APK exists:
# $ ./send-apk.sh
# Output: Successfully pushed newest APK to device
# 
# Example when no APK exists:
# $ ./send-apk.sh
# Output: No APK found. Please run yarn android:build:dev

# Get the project root directory
PROJECT_ROOT="$(pwd)"

# Find the newest build-*.apk file
NEWEST_APK=$(ls -t "$PROJECT_ROOT"/build-*.apk 2>/dev/null | head -n 1)

if [ -z "$NEWEST_APK" ]; then
  echo "❌ No APK found in project root."
  echo "👉 Please run 'yarn android:build:dev' first or move your built apk to the project root"
  exit 0
fi

# Check if device is connected
if ! adb devices | grep -q "device$"; then
  echo "❌ No Android device connected"
  echo "👉 Please connect a device and enable USB debugging"
  exit 0
fi

# Push the APK to device
if adb push "$NEWEST_APK" /storage/emulated/0/Download/; then
  echo "✅ Successfully pushed $(basename "$NEWEST_APK") to device"
  echo "📱 Check your device's Downloads folder to install"
else
  echo "❌ Failed to push APK to device"
  echo "👉 Please check your device connection and permissions"
  exit 1
fi 