// __tests__/Text.test.tsx
import React from "react";
import { Text } from "..";
import type { Text as RNText } from "react-native";
import { renderWithThemeProvider } from "@design-system/test-utils/renderWithThemeProvider";

describe("Text Component", () => {
  it("renders correctly with default props", () => {
    const { toJSON } = renderWithThemeProvider(<Text>Default Text</Text>);
    expect(toJSON()).toMatchSnapshot();
  });

  it("renders correctly with translation key", () => {
    const { toJSON } = renderWithThemeProvider(
      <Text tx="walletSelector.title" />
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it("applies weight and size styles", () => {
    const { toJSON } = renderWithThemeProvider(
      <Text weight="bold" size="lg">
        Styled Text
      </Text>
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it("applies color style", () => {
    const { toJSON } = renderWithThemeProvider(
      <Text color="primary">Colored Text</Text>
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it("forwards ref correctly", () => {
    const ref = React.createRef<RNText>();
    renderWithThemeProvider(<Text ref={ref}>Ref Text</Text>);
    expect(ref.current).not.toBeNull();
  });

  it("renders children correctly", () => {
    const { getByText } = renderWithThemeProvider(<Text>Child Text</Text>);
    expect(getByText("Child Text")).toBeTruthy();
  });
});
