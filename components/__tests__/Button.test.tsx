// __tests__/Button.test.tsx

import { render, fireEvent } from "@testing-library/react-native";
import React from "react";
import { Platform } from "react-native";

import Button from "../Button/Button";

// Mock useColorScheme for consistent testing
jest.mock("react-native/Libraries/Utilities/useColorScheme", () => ({
  __esModule: true,
  default: jest.fn(() => "light"),
}));

describe("Button Component", () => {
  describe("iOS Button", () => {
    it("renders correctly with primary variant", () => {
      Platform.OS = "ios"; // Set the platform to iOS

      const { toJSON, getByText } = render(
        <Button title="Primary Button" variant="primary" />
      );

      // Verify snapshot
      expect(toJSON()).toMatchSnapshot();

      // Check if the title is rendered
      expect(getByText("Primary Button")).toBeTruthy();
    });

    it("fires onPress event when clicked", () => {
      Platform.OS = "ios"; // Set the platform to iOS

      const onPressMock = jest.fn();
      const { getByText } = render(
        <Button
          title="Clickable Button"
          variant="primary"
          onPress={onPressMock}
        />
      );

      fireEvent.press(getByText("Clickable Button"));

      // Verify that the mock function is called
      expect(onPressMock).toHaveBeenCalled();
    });
  });

  describe("Default (Android) Button", () => {
    it("renders correctly with secondary-danger variant", () => {
      Platform.OS = "android"; // Set the platform to Android (or default)

      const { toJSON, getByText } = render(
        <Button title="Secondary Danger Button" variant="secondary-danger" />
      );

      // Verify snapshot
      expect(toJSON()).toMatchSnapshot();

      // Check if the title is rendered
      expect(getByText("Secondary Danger Button")).toBeTruthy();
    });

    it("renders correctly with picto", () => {
      Platform.OS = "android";

      const { toJSON, getByText } = render(
        <Button title="Button with Picto" variant="grey" picto="star" />
      );

      // Verify snapshot
      expect(toJSON()).toMatchSnapshot();

      // Check if the title is rendered
      expect(getByText("Button with Picto")).toBeTruthy();
    });
  });
});
