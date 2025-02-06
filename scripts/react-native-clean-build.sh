#!/bin/bash

###############################################################
# Quickly cleans and rebuilds a React Native Expo project by moving
# build directories to Trash, reinstalling dependencies and running
# expo prebuild clean.
#
# Uses AppleScript for fast native Trash operations, similar
# to Cmd+Delete in Finder. This is much faster than rm -rf.
#
# Side Effects:
# - Moves node_modules to Trash
# - Runs yarn install
# - Runs expo prebuild clean for iOS and Android
# - Prints status messages to terminal
#
# Example:
#   In terminal from project root:
#   yarn clean
#   OR
#   ./scripts/react-native-clean-build.sh
#   
#   Output:
#   Moving node_modules to trash...
#   Running yarn install...
#   Running expo prebuild clean...
#   Clean and rebuild complete!
###############################################################

echo "Moving node_modules to trash..."
osascript -e "tell app \"Finder\" to delete POSIX file \"$PWD/node_modules\""

echo "Running yarn install..."
yarn install

echo "Running expo prebuild clean for iOS and Android..."
npx expo prebuild --clean

echo "Clean and rebuild complete!"