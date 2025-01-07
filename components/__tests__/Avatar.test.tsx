// __tests__/Avatar.test.tsx

import { render } from "@testing-library/react-native";
import React from "react";

import Avatar from "../Avatar"; // Adjust the path as needed
import { renderWithThemeProvider } from "@/design-system/test-utils/renderWithThemeProvider";

// Mock the useColorScheme hook to always return 'light' for consistency in tests
jest.mock("react-native/Libraries/Utilities/useColorScheme", () => ({
  __esModule: true,
  default: jest.fn(() => "light"),
}));

describe("Avatar Component", () => {
  it("renders correctly with image URI", () => {
    const { getByTestId } = renderWithThemeProvider(
      <Avatar uri="http://placebacon.net/400/300" size={50} />
    );

    // Check if the ImageBackground is rendered with the correct URI
    const image = getByTestId("avatar-image");
    expect(image.props.source.uri).toBe("http://placebacon.net/400/300");
  });

  it("renders correctly with name and without image URI", () => {
    const { getByText } = renderWithThemeProvider(
      <Avatar name="John Doe" size={50} />
    );

    // Check if the first letter of the name is rendered
    const letter = getByText("J");
    expect(letter).toBeTruthy();
  });

  it("renders placeholder picto if no image URI or name is provided", () => {
    const { getByTestId } = renderWithThemeProvider(<Avatar size={50} />);

    // Check if the Picto component is rendered
    const picto = getByTestId("avatar-placeholder");
    expect(picto).toBeTruthy();
  });
});
