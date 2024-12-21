#!/bin/bash

###############################################################
# Quickly cleans and rebuilds a React Native project by moving
# build directories to Trash and reinstalling dependencies.
#
# Uses AppleScript for fast native Trash operations, similar
# to Cmd+Delete in Finder. This is much faster than rm -rf.
#
# Side Effects:
# - Moves node_modules, ios/build, ios/Pods to Trash
# - Runs yarn install
# - Runs pod install for iOS
# - Prints status messages to terminal
#
# Example:
#   In terminal from project root:
#   ./scripts/reactNativeCleanBuild.sh
#   
#   Output:
#   Moving node_modules to trash...
#   Moving ios/build to trash...
#   Moving ios/Pods to trash...
#   Running yarn install...
#   Running pod install...
#   Clean and rebuild complete!
###############################################################

echo "Moving node_modules to trash..."
osascript -e "tell app \"Finder\" to delete POSIX file \"$PWD/node_modules\""

echo "Moving ios/build to trash..."
osascript -e "tell app \"Finder\" to delete POSIX file \"$PWD/ios/build\""

echo "Moving ios/Pods to trash..."
osascript -e "tell app \"Finder\" to delete POSIX file \"$PWD/ios/Pods\""

echo "Running yarn install..."
yarn install

echo "Running pod install..."
cd ios && pod install && cd ..

echo "Clean and rebuild complete!" 