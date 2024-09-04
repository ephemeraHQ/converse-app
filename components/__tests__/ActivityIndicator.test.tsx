import { render } from "@testing-library/react-native";
import React from "react";
import { Platform } from "react-native";

import ActivityIndicator from "../ActivityIndicator/ActivityIndicator"; // Import the default platform-specific component

// Snapshot test for the Android-specific ActivityIndicator component
describe("ActivityIndicator Component", () => {
  it("renders correctly on Android", () => {
    // Temporarily set the platform to Android
    Platform.OS = "android";

    const tree = render(<ActivityIndicator />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it("renders correctly on iOS/Default", () => {
    // Temporarily set the platform to iOS or default
    Platform.OS = "ios";

    const tree = render(<ActivityIndicator />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
